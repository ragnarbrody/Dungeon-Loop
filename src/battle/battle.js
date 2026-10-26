import { battle, encounter, setGameState, STATE, playerStats, saveGame, effStat, player, currentRoom } from '../core/state.js';
import { rand } from '../core/rng.js';
import { hud } from '../ui/hud.js';
import { updateHud } from '../ui/hud.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { CONSUMABLES } from '../items.js';
import { CLASSES } from '../classes.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import { showToast } from '../ui/toast.js';
import { getBiomeEnemies } from '../world/biomes.js';

const ENEMIES = {
  slime: {
    name: 'Slime',
    hp: 8, maxHp: 8, atk: 4, def: 0, xp: 5,
    // Slime é o mais básico: só ataca, sem skill
  },
  rat: {
    name: 'Rato do Campo',
    hp: 12, maxHp: 12, atk: 5, def: 1, xp: 12,
    //  Habilidade especial: entrar na toca
    // - A cada N turnos, esconde (não atacável)
    // - Próximo turno, sai e ataca normalmente
    // Implementado via onEnemyTurn, sem precisar de "cast"
  },
  goblin: {
    name: 'Goblin',
    hp: 18, maxHp: 18, atk: 8, def: 2, xp: 30,
    // Habilidades: Enfurecer (solo) / Fortalecer Aliado (multi)
    // Ver enemyTurn() abaixo
  },
  scorpion: {
    name: 'Escorpião',
    hp: 20, maxHp: 20, atk: 5, def: 0, xp: 22,
    // Veneno: chance de aplicar "envenenado por 2 turnos" ao acertar.
    // Dano 1-2 por turno. Aplicado via enemyTurn() abaixo.
    poisonChance: 0.35,
  },
  vulture: {
    name: 'Abutre',
    hp: 8, maxHp: 8, atk: 6, def: 0, xp: 25,
    // Alta esquiva: 35% de chance do ataque do jogador errar.
    dodgeChance: 0.35,
    // Voar pra longe: 1x a cada N turnos, fica "escondido" por 1 turno.
    // Usa o campo hiding (mesmo do rato).
  },
  mummy: {
    name: 'Múmia',
    hp: 28, maxHp: 28, atk: 9, def: 3, xp: 40,
    // Dano bruto: carrega um ataque forte a cada N turnos.
    // Chance de começar a carregar por turno (quando não está carregando).
    chargeChance: 0.5,
    // Multiplicador do ataque carregado (2.5x do ATK base).
    chargeMul: 2.5,
  },

  scarab: {
    name: 'Escaravelho',
    hp: 7, maxHp: 7, atk: 3, def: 0, xp: 15,
    // Suporte: buffa aliados NÃO-escaravelhos (nem a si mesmo).
    // Não stacka — se o aliado já tem buff do escaravelho, renova.
    isBuffer: true,
    buffChance: 0.6,    // chance de buffar por turno (se tiver aliado válido)
    buffDef: 2,         // +DEF por buff
    buffAtk: 1,         // +ATK por buff
    buffDuration: 3,    // duração do buff em turnos
  },
};

export function effectiveSkillCost(skill) {
  const base = skill.cost;
  const extra = Math.floor(playerStats.magia * 0.6);
  return base + extra;
}

const FADE_DURATION = 1.8;

function getScaledEnemy(template, playerLevel) {
  const scale = (playerLevel - 1) * 0.2;
  const hpBonus = Math.floor(template.hp * scale);
  const atkBonus = Math.floor(template.atk * scale);
  return {
    ...template,
    hp: template.hp + hpBonus,
    maxHp: template.hp + hpBonus,
    atk: template.atk + atkBonus,
    def: template.def + Math.floor(scale / 2),
    xp: Math.floor(template.xp * (1 + scale * 0.5)),

    // Status effects por inimigo (base para congelar/atordoar/etc)
    frozen: 0,
    stunned: 0,
    poison: 0,

    // NOVOS campos:
    hiding: 0,          // Rato: turnos escondidos (0 = visível)
    hideCooldown: 0,    // Rato: turnos até poder esconder de novo
    enraged: 0,         // Goblin: turnos restantes do buff "enfurecido"
    chargeTurn: 0,      // Goblin: turnos restantes carregando o ataque forte
    buffDef: 0,         // Buff de DEF recebido de aliado (+N)
    buffAtk: 0,         // Buff de ATK (negativo se enfraquecido)
    usedAllyBuff: false,// Goblin: já usou "Fortalecer Aliado" nessa batalha?
    atkMod: 0,          // Modificador de ATK aplicado por buffs externos
    defMod: 0,          // Modificador de DEF aplicado por buffs externos
    flyingAway: false,
    // já vem do template, mas é para garantir que existe
    isBuffer: template.isBuffer || false,
    // Controle do buff do escaravelho (1 stack por aliado)
    scarabBuff: null,   // { def: number, atk: number, turns: number } | null
  };
}

// Constrói o grupo de inimigos (1 a 3 do mesmo tipo, escalonado por nível)
function buildEnemyGroup(chosenId, playerLevel, pool = null) {
  // Decide a quantidade (1 a 3) baseado no nível do jogador
  let count = 1;
  if (playerLevel >= 2) {
    const chance2 = Math.min(0.5, 0.15 + playerLevel * 0.03);
    const chance3 = playerLevel >= 5 ? Math.min(0.3, (playerLevel - 4) * 0.03) : 0;
    if (Math.random() < chance3) count = 3;
    else if (Math.random() < chance2) count = 2;
  }

  // NOVO: se tem pool, gera grupo MISTO
  // Se não tem pool (enemyId fixo do mapa), repete o mesmo
  const enemies = [];
  for (let i = 0; i < count; i++) {
    let enemyId;
    if (pool && pool.length > 0) {
      enemyId = pool[Math.floor(Math.random() * pool.length)];
    } else {
      enemyId = chosenId;
    }
    const base = ENEMIES[enemyId];
    if (!base) {
      // Fallback defensivo
      enemyId = 'slime';
    }
    const scaled = getScaledEnemy(ENEMIES[enemyId], playerLevel);
    enemies.push({ ...scaled, id: enemyId, name: ENEMIES[enemyId].name });
  }
  return enemies;
}

// Retorna true se há pelo menos um inimigo vivo E visível (não escondido)
export function hasVisibleTarget() {
  return battle.enemies.some(e => e.hp > 0 && e.hiding === 0);
}

// Helpers de alvo/estado
function target() {
  const alive = battle.enemies.filter(e => e.hp > 0 && e.hiding === 0);
  if (alive.length === 0) {
    // Se TODOS estão escondidos, pega o primeiro vivo (fallback)
    const anyAlive = battle.enemies.filter(e => e.hp > 0);
    if (anyAlive.length === 0) return null;
    battle.targetIndex = battle.enemies.indexOf(anyAlive[0]);
    return anyAlive[0];
  }
  if (!battle.enemies[battle.targetIndex] ||
      battle.enemies[battle.targetIndex].hp <= 0 ||
      battle.enemies[battle.targetIndex].hiding > 0) {
    battle.targetIndex = battle.enemies.findIndex(e => e.hp > 0 && e.hiding === 0);
    if (battle.targetIndex < 0) battle.targetIndex = 0;
  }
  return battle.enemies[battle.targetIndex];
}

// Retorna o alvo "cegamente" (ignora hiding). Usado pelo Tiro Certeiro.
function targetIgnoringHiding() {
  // Se o alvo atual ainda está vivo, usa ele (mesmo que hiding)
  const cur = battle.enemies[battle.targetIndex];
  if (cur && cur.hp > 0) return cur;
  // Senão, pega o primeiro vivo
  const anyAlive = battle.enemies.filter(e => e.hp > 0);
  if (anyAlive.length === 0) return null;
  battle.targetIndex = battle.enemies.indexOf(anyAlive[0]);
  return anyAlive[0];
}

// Helper: aplica o bônus de marca se existir, e a consome.
function applyMarkBonus(e, dmg) {
  if (!e.huntersMark) return dmg;
  const bonus = e.huntersMark.damageBonus || 0;
  e.huntersMark = null;   // consome
  return Math.floor(dmg * (1 + bonus));
}

function livingEnemies() {
  return battle.enemies.filter(e => e.hp > 0);
}

function isAnyAlive() {
  return battle.enemies.some(e => e.hp > 0);
}

// Verifica se o inimigo esquivou. Se sim, mostra o feedback e retorna true.
function tryDodge(e) {
  if (!e.dodgeChance) return false;
  // Se está marcado, não pode esquivar (e o bônus de dano é aplicado na hora do hit)
  if (e.huntersMark && e.huntersMark.ignoreDodge) return false;
  if (Math.random() < e.dodgeChance) {
    flashEnemyAt(e, 'white');
    spawnFloatingText(e, 'ESQUIVA', '#8ad8ff');
    battle.message += ` ${e.name} esquivou!`;
    return true;
  }
  return false;
}

// Marca um inimigo específico pra piscar
function flashEnemyAt(enemy, type = 'white') {
  const idx = battle.enemies.indexOf(enemy);
  battle.anim.flashEnemy = 0.3;
  battle.anim.flashEnemyIndex = idx;
  battle.anim.flashEnemyType = type;
}

// Marca o player pra piscar
function flashPlayer(type = 'white', duration = 0.3) {
  battle.anim.flashPlayer = duration;
  battle.anim.flashPlayerType = type;
}

function clearDeadEnemies() {
  const before = battle.enemies.length;
  const currentTarget = battle.enemies[battle.targetIndex];

  const survivors = [];
  for (const e of battle.enemies) {
    if (e.hp > 0) {
      survivors.push(e);
    } else {
      battle.xpEarned += e.xp;
      battle.fadingEnemies.push({
        ref: e,
        timer: FADE_DURATION,
        total: FADE_DURATION,
        slotIndex: battle.enemies.indexOf(e),
        slotCount: battle.enemies.length,
      });
    }
  }

  battle.enemies = survivors;

  if (battle.enemies.length === 0) {
    battle.targetIndex = 0;
    return before !== 0;
  }
  if (currentTarget && currentTarget.hp > 0) {
    battle.targetIndex = battle.enemies.indexOf(currentTarget);
  } else {
    battle.targetIndex = 0;
  }
  if (battle.enemies.length === 1) battle.targetIndex = 0;

  return before !== battle.enemies.length;
}

export function startBattle(opts = {}) {
  // Cidade é safezone — nunca entra em combate
  if (currentRoom && currentRoom.isCity) return;
  
  const { enemyId, mapEnemy, biomeGX, biomeGY } = opts;
  const wb = weaponBonus(playerEquip);

  setGameState(STATE.BATTLE);
  battle.active = true;
  battle.turn = 'player';
  battle.turnTimer = 0;
  battle.anim = { shake: 0, flashPlayer: 0, flashEnemy: 0, lungePlayer: 0, lungeEnemy: 0 };
  battle.floatingTexts = [];
  battle.mapEnemy = mapEnemy || null;
  battle.targetIndex = 0;
  battle.enemyTurnIndex = 0;
  battle.xpEarned = 0;
  battle.fadingEnemies = [];
  battle.menuMode = 'main';
  battle.skillPage = 0;
  battle.tooltipSkill = null;
  battle.tooltipPos = null;

  playerStats.buffs = {};
  playerStats._mpRegenAcc = 0;
  playerStats.poisoned = null;

  let chosenId;
  let pool = null;

  if (enemyId) {
    // Batalha fixa do mapa
    chosenId = enemyId;
  } else {
    // Batalha aleatória — passa o pool pra sortear MISTO
    pool = (biomeGX !== undefined && biomeGY !== undefined)
      ? getBiomeEnemies(biomeGX, biomeGY)
      : ['slime', 'rat', 'goblin'];

    if (pool.length === 0) return;
    chosenId = pool[Math.floor(Math.random() * pool.length)];
  }

  battle.enemies = buildEnemyGroup(chosenId, playerStats.level, pool);

  battle.player.atk = 2 + (effStat('str') + wb.str) * 2;
  battle.player.def = playerStats.def;

  battle.message = battle.enemies.length === 1
    ? `Um ${battle.enemies[0].name} selvagem apareceu!`
    : `${battle.enemies.length} ${battle.enemies[0].name}s selvagens apareceram!`;
  encounter.walkedSinceLast = 0;
  hud.style.display = 'none';
}

export function endBattle(escaped) {
  // pra o jogador conseguir sair do tile sem disparar batalha de novo.
  if (escaped && battle.mapEnemy) {
    player.fleeImmune.set(battle.mapEnemy, Infinity); // até sair do tile
  }
  if (!escaped && battle.mapEnemy) {
    battle.mapEnemy.defeated = true;
  }
  battle.mapEnemy = null;
  setGameState(STATE.EXPLORE);
  battle.active = false;
  battle.enemies = [];
  battle.targetIndex = 0;
  battle.enemyTurnIndex = 0;
  battle.activeEnemyIndex = -1;
  battle.anim = {
    shake: 0,
    flashPlayer: 0, flashPlayerType: 'white',
    flashEnemy: 0, flashEnemyIndex: -1, flashEnemyType: 'red',
    lungePlayer: 0, lungeEnemy: 0,
  };
  battle.xpEarned = 0;
  battle.fadingEnemies = [];
  battle.menuMode = 'main';
  battle.skillPage = 0;
  battle.tooltipSkill = null;
  battle.tooltipPos = null;
  encounter.cooldownPx = escaped ? 600 : 800;
  encounter.walkedSinceLast = 0;
  hud.style.display = '';
  playerStats.buffs = {};
  playerStats._mpRegenAcc = 0;
  playerStats.poisoned = null;
  saveGame();
  updateHud();
}

// ==== SKILLS ====
const SKILL_IMPL = {
  // ---- CAVALEIRA ----
  quick: () => {
    const t = target();
    if (!t) return;
    const hitChance = Math.min(0.95, 0.70 + effStat('agi') * 0.02);
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque rápido errou!';
      return;
    }
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const dmg = Math.max(1, battle.player.atk - t.def + rand(-1, 1));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = isCrit ? Math.floor(dmg * 1.5) : dmg;
    t.hp = Math.max(0, t.hp - finalDmg);
    battle.message = `Você atacou rápido! ${finalDmg} de dano em ${t.name}. ${isCrit ? '(CRÍTICO!)' : ''}`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.2;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#ff3b3b');
  },
  heavy: () => {
    const t = target();
    if (!t) return;
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const hitChance = Math.min(0.95, 0.70 + effStat('agi') * 0.02) - 0.15;
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque forte errou!';
      return;
    }
    const base = Math.round(battle.player.atk * 1.8);
    const dmg = Math.max(1, base - t.def + rand(-1, 2));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = isCrit ? Math.floor(dmg * 1.5) : dmg;
    t.hp = Math.max(0, t.hp - finalDmg);
    battle.message = `Você atacou forte! ${finalDmg} de dano em ${t.name}. ${isCrit ? '(CRÍTICO!)' : ''}`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.35;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#ff3b3b');
  },
  spin: () => {
    let total = 0;
    let dodged = 0;
    for (const e of livingEnemies()) {
      if (tryDodge(e)) { dodged++; continue; }   // ← NOVO
      const dmg = Math.max(1, Math.round(battle.player.atk * 1.3) - e.def);
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#feca57');
    }
    battle.message = `Golpe Giratório! ${total} de dano em todos os inimigos.`;
    battle.anim.flashEnemy = 0.3;
    battle.anim.shake = 0.3;
  },

  // ---- MAGO ----
  bolt: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const dmg = Math.max(1, 3 + effStat('int') * 2 + rand(-1, 1));
    t.hp = Math.max(0, t.hp - dmg);
    battle.message = `Force Bolt! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.1;
    spawnFloatingText(t, dmg, '#8ad8ff');
  },
  fireball: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const dmg = Math.max(1, 5 + effStat('int') * 2 + rand(-1, 2));
    t.hp = Math.max(0, t.hp - dmg);
    battle.message = `Bola de Fogo! ${dmg} de dano em ${t.name} (ignora defesa).`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.25;
    spawnFloatingText(t, dmg, '#ff8a3b');
  },
  arcane: () => {
    // Dano em área: atinge todos os inimigos vivos com dano médio.
    // Escala com INT mas com multiplicador menor que antes (era 3x, agora 2x).
    // Bônus de +5 fixo pra manter relevante em níveis baixos.
    const living = livingEnemies();
    if (living.length === 0) return;

    const baseDmg = 5 + effStat('int') * 2;
    let total = 0;
    let hits = 0;
    //
    for (const e of living) {
      if (tryDodge(e)) continue;                // ← NOVO
      const dmg = Math.max(1, baseDmg + rand(-2, 2));
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg;
      hits++;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#d78cff');
    }

    battle.message = hits === 1
      ? `Impacto Arcano! ${total} de dano em ${living[0].name}.`
      : `Impacto Arcano atinge ${hits} inimigos! ${total} de dano total.`;

    battle.anim.shake = 0.5;
    battle.anim.flashEnemy = 0.4;
  },

  // ---- LADRÃO ----
  stab: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const dmg = Math.max(1, 2 + effStat('str') * 2 + rand(-1, 1));
    t.hp = Math.max(0, t.hp - dmg);
    battle.message = `Estocada certeira! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.12;
    spawnFloatingText(t, dmg, '#ff3b3b');
  },
  backstab: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) {
      battle.anim.shake = 0.1;
      return;
    }
    const hitChance = Math.min(0.95, 0.75 + effStat('agi') * 0.02);
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque furtivo errou!';
      return;
    }
    const dmg = Math.max(1, Math.round((2 + effStat('str') * 2) * 1.6) + rand(-1, 2));
    t.hp = Math.max(0, t.hp - dmg);
    battle.message = `Ataque furtivo! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.3;
    spawnFloatingText(t, dmg, '#ff7bd0');
  },
  shadow: () => {
    playerStats.shadowActive = true;
    battle.message = 'Você some nas sombras. O próximo ataque inimigo vai errar.';
    flashPlayer('white');
  },

  // ---- Caçadora ----
  aimed_shot: () => {
    const t = targetIgnoringHiding();
    if (!t) return;

    // Tiro Certeiro NÃO usa target() (que filtra hiding) e NÃO rola tryDodge.
    // Isso é o diferencial da Caçadora: ela acerta o que ninguém acerta.
    const base = battle.player.atk + effStat('agi') * 1.5;
    const dmg = Math.max(1, Math.round(base - t.def * 0.5 + rand(-1, 1)));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = applyMarkBonus(t, isCrit ? Math.floor(dmg * 1.5) : dmg);

    // Se o abutre estava voando, ele "cai" — volta pro chão ao ser acertado
    if (t.hiding > 0) {
      t.hiding = 0;
      t.flyingAway = false;
      battle.message = `Tiro Certeiro acerta ${t.name} em pleno voo! `;
    } else {
      battle.message = `Tiro Certeiro em ${t.name}! `;
    }
    battle.message += `${finalDmg} de dano. ${isCrit ? '(CRÍTICO!)' : ''}`;

    t.hp = Math.max(0, t.hp - finalDmg);
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.15;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#e8d890');
  },

  piercing_arrow: () => {
    const living = livingEnemies();
    if (living.length === 0) return;

    // Dano decrescente por "posição": 100%, 60%, 40%, 30%...
    const multipliers = [1.0, 0.6, 0.4, 0.3];
    const baseDmg = battle.player.atk + effStat('agi');
    let total = 0;
    let hits = 0;

    living.forEach((e, i) => {
      if (tryDodge(e)) return;   // abutre ainda pode esquivar (não é Tiro Certeiro)
      const mul = multipliers[i] ?? 0.3;
      // Ignora 50% da defesa (perfurante)
      const dmg = Math.max(1, Math.round(baseDmg * mul - e.def * 0.5) + rand(-1, 1));
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg;
      hits++;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#8a9a4a');
    });

    battle.message = hits === 0
      ? 'Flecha Perfurante não acertou ninguém!'
      : `Flecha Perfurante! ${total} de dano em ${hits} inimigo(s).`;
    battle.anim.shake = 0.35;
    battle.anim.flashEnemy = 0.3;
  },

  hunters_mark: () => {
    const t = target();
    if (!t) return;

    // Aplica a marca: próximo ataque contra esse alvo não pode ser esquivado
    // e dá +50% de dano.
    t.huntersMark = { damageBonus: 0.5, ignoreDodge: true };

    battle.message = `${t.name} foi marcado! O próximo ataque contra ele não pode ser esquivado e dá +50% de dano.`;
    flashEnemyAt(t, 'white');
    spawnFloatingText(t, 'MARCA', '#c9a24d');
  },
};

export function playerAction(action) {
  // Skills que NÃO são bloqueadas por "sem alvo visível" (elas ignoram hiding)
  const SKILLS_THAT_IGNORE_HIDING = new Set(['aimed_shot']);

  // ---- Fechar tooltip (clique fora) ----
  // Fecha tooltip em qualquer ação que não seja o toggle
  if (action !== '__toggle_tooltip__' && action !== 'close_tooltip') {
    battle.tooltipSkill = null;
    battle.tooltipPos = null;
  }

  if (battle.turn !== 'player') return;
  // ---- Navegação de menus ----
  if (action === 'menu_main') {
    battle.tooltipSkill = null;  // fecha tooltip ao voltar pro menu
    battle.tooltipPos = null;
    battle.menuMode = 'main';
    battle.showItems = false;
    return;
  }
  if (action === 'menu_skills') {
    battle.tooltipSkill = null;
    battle.tooltipPos = null;
    battle.menuMode = 'skills';
    battle.skillPage = 0;
    battle.showItems = false;
    return;
  }
  if (action === 'menu_items') {
    battle.menuMode = 'items';
    battle.showItems = true;
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

  if (action.startsWith('use_item_')) {
    const itemId = action.replace('use_item_', '');
    const item = playerStats.inventory.find(i => i.id === itemId);
    if (item && item.qty > 0) {
      const info = CONSUMABLES[itemId];
      if (info) {
        const result = info.use(playerStats);
        item.qty--;
        if (item.qty <= 0) playerStats.inventory = playerStats.inventory.filter(i => i.id !== itemId);

        // Mensagem no log de combate
        battle.message = result.message;

        // Toast visual (além da mensagem)
        if (result.toast) showToast(result.toast);

        battle.showItems = false;
        flashPlayer('white', 0.3);
        endPlayerTurn();
      }
    }
    return;
  }

  if (action === 'open_items') { battle.showItems = true; battle.menuMode = 'items'; return; }
  if (action === 'close_items') { battle.showItems = false; battle.menuMode = 'main'; return; }

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

  // DESCANSO: passa o turno, regenera MP (3x a regen passiva) e um pouco de HP
  if (action === 'rest') {
    // MP: 1x a regen passiva, arredondado
    const mpRegen = Math.floor((0.5 + playerStats.int * 0.15));
    const mpAntes = playerStats.mp;
    playerStats.mp = Math.min(playerStats.maxMp, playerStats.mp + mpRegen);
    const mpGanho = playerStats.mp - mpAntes;

    // HP: 1 + vit * 0.6, cap 10
    const hpRegen = Math.min(15, Math.floor(1 + playerStats.vit * 0.6));
    const hpAntes = playerStats.hp;
    playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + hpRegen);
    const hpGanho = playerStats.hp - hpAntes;

    // Mensagem
    let msg = 'Você descansa e recupera ';
    const partes = [];
    if (mpGanho > 0) partes.push(`${mpGanho} MP`);
    if (hpGanho > 0) partes.push(`${hpGanho} HP`);
    if (partes.length > 0) {
      msg += partes.join(' e ') + '.';
    } else {
      msg = 'Você descansa, mas não recupera nada.';
    }
    battle.message = msg;

    // Floating texts
    if (mpGanho > 0) {
      spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.60, `+${mpGanho} MP`, '#8ad8ff');
    }
    if (hpGanho > 0) {
      spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.55, `+${hpGanho} HP`, '#6fbd63');
    }

    flashPlayer('white', 0.2);
    endPlayerTurn();
    return;
  }

  const cls = CLASSES[playerStats.classId];
  if (!cls) return;
  const skill = cls.skills.find(s => s.id === action);
  if (!skill) return;

  // bloqueia skills de DANO quando não há alvo visível ----
  const SKILLS_THAT_DAMAGE = new Set([
    'quick', 'heavy', 'spin',           // Cavaleira
    'bolt', 'fireball', 'arcane',       // Mago
    'stab', 'backstab',                 // Ladrão
  ]);
  if (SKILLS_THAT_DAMAGE.has(skill.id) && !hasVisibleTarget()) {
    // Se a skill ignora hiding, deixa passar
    if (!SKILLS_THAT_IGNORE_HIDING.has(skill.id)) {
      battle.message = 'Não há alvo visível! (o inimigo está escondido)';
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

  // LUNGE DO PLAYER: seta a animação de deslocamento ao atacar
  battle.anim.lungePlayer = 0.35;

  playerStats.mp -= cost;
  const impl = SKILL_IMPL[skill.id];
  if (impl) impl();
  endPlayerTurn();
}

function tickPoison() {
  if (!playerStats.poisoned) return;
  const p = playerStats.poisoned;
  playerStats.hp = Math.max(0, playerStats.hp - p.dmg);
  spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.68, `-${p.dmg}`, '#9b3fb5');
  // mensagem discreta, o jogador já vê o número flutuante
  battle.message += ` Veneno causa ${p.dmg} de dano.`;
  p.turns--;
  if (p.turns <= 0) {
    playerStats.poisoned = null;
    battle.message += ' O veneno passou.';
  }
  saveGame();
}

export function endPlayerTurn() {
  tickMpRegen();
  tickPoison();
  battle.turn = 'resolve';
  battle.turnTimer = 0.9;
  battle.enemyTurnIndex = 0;
  battle.activeEnemyIndex = -1;
  battle.menuMode = 'main';
  battle.skillPage = 0;
}

function tickMpRegen() {
  const regen = 0.5 + playerStats.int * 0.15;
  playerStats._mpRegenAcc += regen;
  const ganho = Math.floor(playerStats._mpRegenAcc);
  if (ganho > 0) {
    playerStats._mpRegenAcc -= ganho;
    const antes = playerStats.mp;
    playerStats.mp = Math.min(playerStats.maxMp, playerStats.mp + ganho);
    const real = playerStats.mp - antes;
    if (real > 0) {
      spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.60, `+${real} MP`, '#8ad8ff');
    }
  }
}

function tickBuffs() {
  for (const k in playerStats.buffs) {
    const b = playerStats.buffs[k];
    b.rounds--;
    if (b.rounds <= 0) delete playerStats.buffs[k];
  }
}

export function updateBattle(dt) {
  battle.anim.shake       = Math.max(0, battle.anim.shake       - dt);
  battle.anim.flashPlayer = Math.max(0, battle.anim.flashPlayer - dt);
  battle.anim.flashEnemy  = Math.max(0, battle.anim.flashEnemy  - dt);
  battle.anim.lungePlayer = Math.max(0, battle.anim.lungePlayer - dt);
  battle.anim.lungeEnemy  = Math.max(0, battle.anim.lungeEnemy  - dt);

  for (let i = battle.fadingEnemies.length - 1; i >= 0; i--) {
    const f = battle.fadingEnemies[i];
    f.timer -= dt;
    if (f.timer <= 0) battle.fadingEnemies.splice(i, 1);
  }

  for (let i = battle.floatingTexts.length - 1; i >= 0; i--) {
    const ft = battle.floatingTexts[i];
    ft.y -= 30 * dt;
    ft.age += dt;
    if (ft.age > 0.8) battle.floatingTexts.splice(i, 1);
  }

  if (battle.turn === 'fled') {
    battle.turnTimer -= dt;
    if (battle.turnTimer <= 0) endBattle(true);
    return;
  }

  clearDeadEnemies();

  // Vitória
  if (!isAnyAlive()) {
    battle.message = 'Você venceu!';
    if (battle.turn !== 'resolve-end') {
      battle.turn = 'resolve-end';
      battle.turnTimer = 1.0;

      const totalXp = battle.xpEarned;
      playerStats.xp += totalXp;
      if (playerStats.xp >= playerStats.xpToNextLevel) {
        playerStats.xp -= playerStats.xpToNextLevel;
        playerStats.level++;
        playerStats.points += 3;
        playerStats.hp = playerStats.maxHp;
        playerStats.xpToNextLevel = Math.floor(playerStats.xpToNextLevel * 1.5);
      }
      saveGame();
    }
    battle.turnTimer -= dt;
    if (battle.turnTimer <= 0) endBattle(false);
    return;
  }

  // Derrota
  if (playerStats.hp <= 0) {
    battle.message = 'Você foi derrotado...';
    if (battle.turn !== 'resolve-end') {
      battle.turn = 'resolve-end';
      battle.turnTimer = 1.2;
    }
    battle.turnTimer -= dt;
    return;
  }

  // ✅ Turno dos inimigos: processa um por vez, com timer entre cada
  if (battle.turn === 'resolve') {
    battle.turnTimer -= dt;
    if (battle.turnTimer <= 0) enemyTurn();
  }
}

/**
 * Processa o turno de UM inimigo por vez.
 * Ao terminar todos, volta o turno pro jogador.
 */
export function enemyTurn() {
  // Pula inimigos mortos
  while (
    battle.enemyTurnIndex < battle.enemies.length &&
    battle.enemies[battle.enemyTurnIndex].hp <= 0
  ) {
    battle.enemyTurnIndex++;
  }

  // Todos já agiram? Volta pro jogador
  if (battle.enemyTurnIndex >= battle.enemies.length) {
    battle.enemyTurnIndex = 0;
    battle.activeEnemyIndex = -1;
    battle.turn = 'player';
    tickBuffs();
    battle.player.atk = 2 + (effStat('str') + weaponBonus(playerEquip).str) * 2;
    if (battle.targetIndex >= battle.enemies.length) battle.targetIndex = 0;

    // Sombra cobre o turno inteiro dos inimigos. Agora que todos agiram, limpa.
    if (playerStats.shadowActive) {
      const dodged = battle._shadowDodged || 0;
      if (dodged > 0) {
        battle.message = dodged === 1
          ? 'Você esquivou do ataque usando as sombras!'
          : `Você esquivou de ${dodged} ataques usando as sombras!`;
      }
      playerStats.shadowActive = false;
      battle._shadowDodged = 0;
    }
    return;
  }

  const e = battle.enemies[battle.enemyTurnIndex];
  battle.activeEnemyIndex = battle.enemyTurnIndex;

  // Decrementa o cooldown de esconder (rato) e o "enraged" (goblin)
  if (e.hideCooldown > 0) e.hideCooldown--;

  // decrementa o buff do escaravelho (se houver)
  if (e.scarabBuff) {
    e.scarabBuff.turns--;
    if (e.scarabBuff.turns <= 0) {
      // Remove o buff
      e.buffDef = Math.max(0, e.buffDef - e.scarabBuff.def);
      e.buffAtk = (e.buffAtk || 0) - e.scarabBuff.atk;
      e.atkMod = (e.atkMod || 0) - e.scarabBuff.atk;
      e.defMod = (e.defMod || 0) - e.scarabBuff.def;
      e.scarabBuff = null;
    }
  }

  let acted = false;

  // ============================================================
  // 1) RATO: ENTRAR NA TOCA
  // Se não está escondido, e o cooldown zerou, e a chance rolou,
  // esconde (futuro: não pode ser alvo até o próximo turno dele).
  // ============================================================
  if (e.id === 'rat' && e.hiding === 0 && e.hideCooldown === 0 && Math.random() < 0.25) {
    e.hiding = 1;           // fica escondido neste turno
    e.hideCooldown = 3;     // 3 turnos até poder esconder de novo
    battle.message = `${e.name} entrou na toca e se escondeu!`;
    // Não ataca neste turno
    acted = true;
  }

  // ============================================================
  // 1.5) ABUTRE: VOAR PRA LONGE
  // A cada N turnos, fica inalcançável por 1 turno.
  // Usa `hiding` (mesmo campo do rato) pra ser consistente com
  // o sistema de alvo. `flyingAway` distingue do rato pra
  // sabermos que é o abutre voltando.
  // ============================================================
  else if (e.id === 'vulture' && e.hiding === 0 && e.hideCooldown === 0 && Math.random() < 0.35) {
    e.hiding = 1;
    e.flyingAway = true;
    e.hideCooldown = 3;
    battle.message = `${e.name} voou pra longe! (não pode ser atacado neste turno)`;
    acted = true;
  }
  // ============================================================
  // 2) GOBLIN: ENFURECER (solo) / FORTALECER ALIADO (multi)
  // Só se ainda não estiver enfurecido/carregando.
  // ============================================================
  else if (e.id === 'goblin' && e.enraged === 0 && e.chargeTurn === 0) {
    // Em combate múltiplo: chance de fortalecer aliado (1x por batalha)
    if (battle.enemies.length > 1 && !e.usedAllyBuff && Math.random() < 0.35) {
      // Escolhe um aliado vivo (não ele mesmo)
      const allies = battle.enemies.filter(a => a !== e && a.hp > 0);
      if (allies.length > 0) {
        const ally = allies[Math.floor(Math.random() * allies.length)];
        ally.buffDef = (ally.buffDef || 0) + 3;
        ally.defMod = (ally.defMod || 0) + 3;
        e.buffAtk = (e.buffAtk || 0) - 2;   // fica mais fraco
        e.atkMod = (e.atkMod || 0) - 2;
        e.usedAllyBuff = true;
        battle.message = `${e.name} fortaleceu ${ally.name}! (+3 DEF nele, -2 ATK em si)`;
        // Flash visual: inimigo "verde" piscando no aliado
        const allyIdx = battle.enemies.indexOf(ally);
        battle.anim.flashEnemy = 0.5;
        battle.anim.flashEnemyIndex = allyIdx;
        battle.anim.flashEnemyType = 'white';
        acted = true;
      }
    }

    // Se não usou buff de aliado: começa a "enfurecer"
    if (!acted) {
      e.chargeTurn = 1;      // turno de preparação
      e.enraged = 1;         // no próximo turno, ataca forte
      battle.message = `${e.name} está bufando e se preparando para um ataque forte!`;
      acted = true;
    }
  }

  // ============================================================
  // 2.2) MÚMIA: CARREGAR ATAQUE FORTE
  // Similar ao goblin, mas mais lenta e com dano maior no golpe carregado.
  // ============================================================
  else if (e.id === 'mummy' && e.enraged === 0 && e.chargeTurn === 0) {
    if (Math.random() < (e.chargeChance ?? 0.5)) {
      e.chargeTurn = 1;
      e.enraged = 1;
      battle.message = `${e.name} ergue os braços e concentra energia! (prepare-se)`;
      acted = true;
    }
  }

  // ============================================================
  // 2.5) ESCARAVELHO: BUFFAR ALIADO (não-escaravelho)
  // Só buffa aliados que NÃO sejam escaravelhos (nem a si mesmo).
  // Se todos os outros aliados são escaravelhos, ele ataca normal.
  // ============================================================
  else if (e.id === 'scarab') {
    // Lista de aliados válidos (vivos, não-escaravelhos, não ele)
    const validAllies = battle.enemies.filter(a =>
      a !== e && a.hp > 0 && a.id !== 'scarab'
    );

    if (validAllies.length > 0 && Math.random() < (e.buffChance ?? 0.6)) {
      // Escolhe o aliado com MAIOR ATK (prioriza o "dano bruto" do grupo)
      let target = validAllies[0];
      for (const a of validAllies) {
        if (a.atk > target.atk) target = a;
      }

      // Aplica/renova o buff (não stacka — substitui)
      // Remove o buff anterior do aliado (se houver) para não acumular
      if (target.scarabBuff) {
        target.buffDef = Math.max(0, target.buffDef - target.scarabBuff.def);
        target.buffAtk = (target.buffAtk || 0) - target.scarabBuff.atk;
        target.atkMod = (target.atkMod || 0) - target.scarabBuff.atk;
        target.defMod = (target.defMod || 0) - target.scarabBuff.def;
      }
      // Aplica o novo buff
      const defBonus = e.buffDef ?? 2;
      const atkBonus = e.buffAtk ?? 1;
      target.buffDef = (target.buffDef || 0) + defBonus;
      target.buffAtk = (target.buffAtk || 0) + atkBonus;
      target.atkMod = (target.atkMod || 0) + atkBonus;
      target.defMod = (target.defMod || 0) + defBonus;
      target.scarabBuff = { def: defBonus, atk: atkBonus, turns: e.buffDuration ?? 3 };

      battle.message = `${e.name} fortaleceu ${target.name}! (+${defBonus} DEF, +${atkBonus} ATK)`;
      // Flash visual no aliado
      const allyIdx = battle.enemies.indexOf(target);
      battle.anim.flashEnemy = 0.5;
      battle.anim.flashEnemyIndex = allyIdx;
      battle.anim.flashEnemyType = 'white';
      acted = true;
    }
  }

  // ============================================================
  // 1.6) ABUTRE: VOLTAR (saiu do "hiding", pode ser alvo de novo)
  // ============================================================
  if (!acted && e.id === 'vulture' && e.hiding > 0) {
    e.hiding = 0;
    e.flyingAway = false;
    battle.message = `${e.name} voltou voando!`;
    // Nesse turno ele só volta (não ataca), pra dar 1 turno de "abertura" pro player
    acted = true;
  }

  // ============================================================
  // 3) STATUS EFFECTS (congelado, atordoado, escondido)
  // ============================================================
  if (!acted && e.hiding > 0) {
    e.hiding = 0;             // sai da toca (próximo turno ataca)
    battle.message = `${e.name} saiu da toca!`;
    acted = true;
  }
  if (!acted && e.frozen > 0) {
    e.frozen--;
    battle.message = `${e.name} está congelado e não consegue atacar!`;
    acted = true;
  }
  if (!acted && e.stunned > 0) {
    e.stunned--;
    battle.message = `${e.name} está atordoado e perde o turno!`;
    acted = true;
  }
  if (!acted && playerStats.shadowActive) {
    battle._shadowDodged = (battle._shadowDodged || 0) + 1;
    acted = true;
  }

  // ============================================================
  // 4) ATAQUE NORMAL (ou enfurecido, se o goblin estiver carregando)
  // ============================================================
  if (!acted) {
    // Goblin com rage ativa: ataca enfurecido e limpa o estado
    const wasEnraged = e.enraged > 0;

    if (Math.random() < 0.8) {
      const baseAtk = e.atk + (e.atkMod || 0);
      // Multiplicador: Múmia usa chargeMul (2.5), outros usam 2.2
      const atkMul = wasEnraged ? (e.chargeMul ?? 2.2) : 1.0;
      const dmg = Math.max(1, Math.round(baseAtk * atkMul) - battle.player.def * 0.5 + rand(-1, 1));
      const finalDmg = Math.floor(dmg);
      playerStats.hp = Math.max(0, playerStats.hp - finalDmg);
      // Se o inimigo tem veneno (escorpião) e acertou, chance de envenenar
      if (e.poisonChance && Math.random() < e.poisonChance) {
        const novo = { turns: 2, dmg: Math.max(1, Math.floor(e.atk * 0.3)) };
        if (playerStats.poisoned) {
          playerStats.poisoned.turns = Math.max(playerStats.poisoned.turns, novo.turns);
          playerStats.poisoned.dmg   = Math.max(playerStats.poisoned.dmg, novo.dmg);
        } else {
          playerStats.poisoned = novo;
        }
        battle.message += ' Você foi envenenado!';
      }
      battle.message = wasEnraged
        ? `${e.name} desferiu um ataque ENFURECIDO! ${finalDmg} de dano!`
        : `${e.name} atacou! ${finalDmg} de dano.`;
      battle.anim.lungeEnemy = 0.2;
      flashPlayer('red', 0.35);
      spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.72, finalDmg, wasEnraged ? '#ffa500' : '#ff3b3b');
      document.getElementById('hud-hp').textContent =
        `${playerStats.hp}/${playerStats.maxHp}`;
    } else {
      battle.message = `${e.name} errou o ataque!`;
      battle.anim.lungeEnemy = 0;
    }

    // Depois de atacar enfurecido, limpa a rage
    if (wasEnraged) {
      e.enraged = 0;
      e.chargeTurn = 0;
    }
  }

  battle.enemyTurnIndex++;

  if (battle.enemyTurnIndex < battle.enemies.length) {
    battle.turnTimer = 0.6;
  } else {
    battle.turnTimer = 0.4;
  }
}

function spawnFloatingText(enemy, value, color) {
  const pos = enemyScreenPos(enemy);
  spawnFloatingTextAt(pos.x, pos.y - 30, value, color);
}

function spawnFloatingTextAt(x, y, value, color) {
  battle.floatingTexts.push({
    x: x + (Math.random() - 0.5) * 20,
    y: y - 40,
    value, color, age: 0,
  });
}

export function enemyScreenPos(enemy) {
  const idx = battle.enemies.indexOf(enemy);
  const n = battle.enemies.length;
  const spacing = n <= 1 ? 0 : Math.min(120, 400 / (n - 1));
  const startX = CANVAS_W * 0.72 - (n - 1) * spacing / 2;
  return {
    x: startX + idx * spacing,
    y: CANVAS_H * 0.30,
  };
}