// ============================================================
// Fachada do combate.
//
// Responsabilidade ÚNICA: `playerAction` (roteador de ações do
// jogador) + reexports dos módulos quebrados pra manter a API
// pública antiga intacta (input.js, ui, testes, etc continuam
// importando daqui).
//
// Regra de ouro: NADA de lógica de skill/turno/ciclo aqui.
// Se precisar de algo, importe do módulo correspondente.
// ============================================================
import { battle, playerStats, effStat } from '../core/state.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { CONSUMABLES } from '../items.js';
import { CLASSES } from '../classes.js';
import { sfx } from '../audio/audio.js';
import { showToast } from '../ui/toast.js';
import {
  hasVisibleTarget,
  flashPlayer,
  spawnFloatingTextAt,
} from './battle-helpers.js';
import {
  SKILL_IMPL,
  effectiveSkillCost,
} from './skills.js';
import { endPlayerTurn } from './turn.js';
import { clearDeadEnemies } from './battle-cycle.js';

// ---- Reexports (compatibilidade) ----
export {
  hasVisibleTarget,
  enemyScreenPos,
  getVisualTargetIndex,
} from './battle-helpers.js';
export {
  effectiveSkillCost,
  estimateSkillDamage,
  classAtk,
  dmgStat,
  classDamageStat,
} from './skills.js';
export {
  startBattle,
  endBattle,
  updateBattle,
  clearDeadEnemies,
  dropPortalCore,
} from './battle-cycle.js';
export { endPlayerTurn, enemyTurn } from './turn.js';

// ---- Sets de skills ----
// Skills que CAUSAM dano direto. Se não há alvo visível, bloqueia.
const SKILLS_THAT_DAMAGE = new Set([
  'quick', 'heavy', 'spin',           // Cavaleira
  'bolt', 'fireball', 'arcane',       // Mago
  'stab', 'backstab',                 // Ladrão
  'aimed_shot',                       // Caçadora (ignora hiding, mas ainda é dano)
  'piercing_arrow',
]);

// Skills que IGNORAM o estado `hiding` do inimigo (podem ser usadas mesmo
// se todos estão escondidos). Hoje só o Tiro Certeiro.
const SKILLS_THAT_IGNORE_HIDING = new Set(['aimed_shot']);

// ---- Roteador de ações do jogador ----
export function playerAction(action) {
  // Fecha tooltip em qualquer ação que não seja toggle/fechar
  if (action !== '__toggle_tooltip__' && action !== 'close_tooltip') {
    battle.tooltipSkill = null;
    battle.tooltipPos = null;
  }

  if (battle.turn !== 'player') return;

  // ---- Navegação de menus ----
  if (action === 'menu_main') {
    battle.menuMode = 'main';
    battle.showItems = false;
    return;
  }
  if (action === 'menu_skills') {
    battle.menuMode = 'skills';
    battle.skillPage = 0;
    battle.showItems = false;
    return;
  }
  if (action === 'menu_items') {
    battle.menuMode = 'items';
    battle.itemPage = 0;
    battle.showItems = true;
    return;
  }
  if (action === 'item_page_prev') {
    battle.itemPage = Math.max(0, battle.itemPage - 1);
    return;
  }
  if (action === 'item_page_next') {
    const usableCount = playerStats.inventory
      .filter(i => i.qty > 0 && CONSUMABLES[i.id])
      .length;
    const maxPage = Math.max(0, Math.ceil(usableCount / 4) - 1);
    battle.itemPage = Math.min(maxPage, battle.itemPage + 1);
    return;
  }
  if (action === 'skill_page_prev') {
    battle.skillPage = Math.max(0, battle.skillPage - 1);
    return;
  }
  if (action === 'skill_page_next') {
    const cls = CLASSES[playerStats.classId];
    if (!cls) return;
    const maxPage = Math.max(0, Math.ceil(cls.skills.length / 3) - 1);
    battle.skillPage = Math.min(maxPage, battle.skillPage + 1);
    return;
  }

  // ---- Uso de item ----
  if (action.startsWith('use_item_')) {
    const itemId = action.replace('use_item_', '');
    const item = playerStats.inventory.find(i => i.id === itemId);
    if (!item || item.qty <= 0) return;

    const info = CONSUMABLES[itemId];
    if (!info) return;

    const result = info.use(playerStats);
    item.qty--;
    if (item.qty <= 0) {
      playerStats.inventory = playerStats.inventory.filter(i => i.id !== itemId);
    }

    battle.message = result.message;
    if (result.toast) showToast(result.toast);

    battle.showItems = false;
    flashPlayer('white', 0.3);
    endPlayerTurn();
    return;
  }

  if (action === 'open_items') {
    battle.showItems = true;
    battle.menuMode = 'items';
    return;
  }
  if (action === 'close_items') {
    battle.showItems = false;
    battle.menuMode = 'main';
    return;
  }

  // ---- Fugir ----
  if (action === 'flee') {
    const fleeChance = Math.min(0.90, 0.40 + effStat('agi') * 0.03);
    if (Math.random() < fleeChance) {
      battle.message = 'Você fugiu do combate!';
      battle.turn = 'fled';
      battle.turnTimer = 0.9;
    } else {
      battle.message = 'Você tentou fugir, mas falhou!';
      endPlayerTurn();
    }
    return;
  }

  // ---- Descansar ----
  if (action === 'rest') {
    // MP: 1x a regen passiva
    const mpRegen = Math.floor(0.5 + playerStats.int * 0.15);
    const mpAntes = playerStats.mp;
    playerStats.mp = Math.min(playerStats.maxMp, playerStats.mp + mpRegen);
    const mpGanho = playerStats.mp - mpAntes;

    // HP: 1 + vit * 0.6, cap 15
    const hpRegen = Math.min(15, Math.floor(1 + playerStats.vit * 0.6));
    const hpAntes = playerStats.hp;
    playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + hpRegen);
    const hpGanho = playerStats.hp - hpAntes;

    let msg = 'Você descansa e recupera ';
    const partes = [];
    if (mpGanho > 0) partes.push(`${mpGanho} MP`);
    if (hpGanho > 0) partes.push(`${hpGanho} HP`);
    if (partes.length > 0) msg += partes.join(' e ') + '.';
    else msg = 'Você descansa, mas não recupera nada.';
    battle.message = msg;

    if (mpGanho > 0) spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.60, `+${mpGanho} MP`, '#8ad8ff');
    if (hpGanho > 0) spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.55, `+${hpGanho} HP`, '#6fbd63');

    flashPlayer('white', 0.2);
    endPlayerTurn();
    return;
  }

  // ---- Skill ----
  const cls = CLASSES[playerStats.classId];
  if (!cls) return;
  const skill = cls.skills.find(s => s.id === action);
  if (!skill) return;

  // Bloqueia skill de dano se não há alvo visível (exceto as que ignoram hiding)
  if (SKILLS_THAT_DAMAGE.has(skill.id) && !hasVisibleTarget()) {
    if (!SKILLS_THAT_IGNORE_HIDING.has(skill.id)) {
      battle.message = 'Não há alvo visível! (o inimigo está escondido)';
      sfx('miss');
      return;
    }
  }

  const cost = effectiveSkillCost(skill);
  if (playerStats.mp < cost) {
    battle.message = `Mana insuficiente! (precisa ${cost} MP)`;
    return;
  }

  clearDeadEnemies();
  if (battle.enemies.length === 0) return;
  if (!battle.enemies[battle.targetIndex]) battle.targetIndex = 0;

  flashPlayer('white');
  battle.anim.flashEnemyIndex = -1;
  battle.anim.lungePlayer = 0.35;

  playerStats.mp -= cost;

  const impl = SKILL_IMPL[skill.id];
  if (impl) impl();

  endPlayerTurn();
}