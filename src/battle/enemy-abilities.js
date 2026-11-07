// ============================================================
// Habilidades especiais de inimigos.
// Cada função recebe (enemy, ctx) e retorna true se "agiu"
// (consumiu o turno). O ctx carrega o que muda entre chamadas
// (ex.: `battle`), o que mantém os testes possíveis.
//
// Para adicionar uma habilidade nova: crie uma função aqui e
// registre em ABILITIES pelo id do inimigo.
// ============================================================
import { battle, playerStats } from '../core/state.js';
import { flashEnemyAt, flashPlayer, spawnFloatingTextAt } from './battle-helpers.js';
import { sfx } from '../audio/audio.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';

// ---- Rato: entrar na toca ----
export function ratHide(enemy) {
  if (enemy.hiding > 0) return false;
  if (enemy.hideCooldown > 0) return false;
  if (Math.random() >= 0.25) return false;

  enemy.hiding = 1;
  enemy.hideCooldown = 3;
  battle.message = `${enemy.name} entrou na toca e se escondeu!`;
  return true;
}

// ---- Abutre: voar pra longe ----
export function vultureFly(enemy) {
  if (enemy.hiding > 0) return false;
  if (enemy.hideCooldown > 0) return false;
  if (Math.random() >= 0.35) return false;

  enemy.hiding = 1;
  enemy.flyingAway = true;
  enemy.hideCooldown = 3;
  battle.message = `${enemy.name} voou pra longe! (não pode ser atacado neste turno)`;
  return true;
}

// ---- Abutre: voltar ----
export function vultureReturn(enemy) {
  if (enemy.hiding === 0) return false;
  enemy.hiding = 0;
  enemy.flyingAway = false;
  battle.message = `${enemy.name} voltou voando!`;
  return true;
}

// ---- Goblin: enfurecer (solo) ou fortalecer aliado (multi) ----
export function goblinCharge(enemy) {
  if (enemy.enraged > 0 || enemy.chargeTurn > 0) return false;

  // Em grupo: 1x por batalha, chance de buffar aliado
  if (battle.enemies.length > 1 && !enemy.usedAllyBuff && Math.random() < 0.35) {
    const allies = battle.enemies.filter(a => a !== enemy && a.hp > 0);
    if (allies.length > 0) {
      const ally = allies[Math.floor(Math.random() * allies.length)];
      ally.buffDef = (ally.buffDef || 0) + 3;
      ally.defMod  = (ally.defMod  || 0) + 3;
      enemy.buffAtk = (enemy.buffAtk || 0) - 2;
      enemy.atkMod  = (enemy.atkMod  || 0) - 2;
      enemy.usedAllyBuff = true;
      battle.message = `${enemy.name} fortaleceu ${ally.name}! (+3 DEF nele, -2 ATK em si)`;
      flashEnemyAt(ally, 'white');
      return true;
    }
  }

  if (Math.random() < (enemy.chargeChance ?? 0.35)) {
    enemy.chargeTurn = 1;
    enemy.enraged    = 1;
    battle.message = `${enemy.name} está bufando e se preparando para um ataque forte!`;
    return true;
  }
  return false;
}

// ---- Múmia: carregar ataque forte ----
export function mummyCharge(enemy) {
  if (enemy.enraged > 0 || enemy.chargeTurn > 0) return false;
  if (Math.random() >= (enemy.chargeChance ?? 0.5)) return false;

  enemy.chargeTurn = 1;
  enemy.enraged    = 1;
  battle.message = `${enemy.name} ergue os braços e concentra energia! (prepare-se)`;
  return true;
}

// ---- Escaravelho: buffar aliado não-escaravelho ----
export function scarabBuff(enemy) {
  const validAllies = battle.enemies.filter(a =>
    a !== enemy && a.hp > 0 && a.id !== 'scarab'
  );
  if (validAllies.length === 0) return false;
  if (Math.random() >= (enemy.buffChance ?? 0.6)) return false;

  // Prioriza aliado com maior ATK
  let target = validAllies[0];
  for (const a of validAllies) if (a.atk > target.atk) target = a;

  // Remove buff anterior pra não stackar
  if (target.scarabBuff) {
    target.buffDef = Math.max(0, target.buffDef - target.scarabBuff.def);
    target.buffAtk = (target.buffAtk || 0) - target.scarabBuff.atk;
    target.atkMod  = (target.atkMod  || 0) - target.scarabBuff.atk;
    target.defMod  = (target.defMod  || 0) - target.scarabBuff.def;
  }

  const defBonus = enemy.buffDef ?? 2;
  const atkBonus = enemy.buffAtk ?? 1;
  target.buffDef = (target.buffDef || 0) + defBonus;
  target.buffAtk = (target.buffAtk || 0) + atkBonus;
  target.atkMod  = (target.atkMod  || 0) + atkBonus;
  target.defMod  = (target.defMod  || 0) + defBonus;
  target.scarabBuff = { def: defBonus, atk: atkBonus, turns: enemy.buffDuration ?? 3 };

  battle.message = `${enemy.name} fortaleceu ${target.name}! (+${defBonus} DEF, +${atkBonus} ATK)`;
  flashEnemyAt(target, 'white');
  return true;
}

// ---- Escorpião Gigante: ferrão duplo (combo com veneno) ----
// Se o jogador JÁ está envenenado, o gigante "aproveita" e enfia
// o ferrão de novo: dano extra + renova o veneno por mais 2 turnos.
// Só dispara a cada 3 turnos (cooldown interno).
export function scorpionGiantFerrão(enemy) {
  if (enemy.enraged > 0 || enemy.chargeTurn > 0) return false;
  enemy._ferrãoCd = (enemy._ferrãoCd || 0) + 1;
  if (enemy._ferrãoCd < 3) return false;
  // Só usa se o jogador está envenenado (senão, deixa a chance
  // pro escorpião comum, que aplica veneno no hit)
  if (!playerStats.poisoned) return false;
  enemy._ferrãoCd = 0;

  const dmg = Math.max(3, Math.floor(enemy.atk * 1.32));
  playerStats.hp = Math.max(0, playerStats.hp - dmg);
  // Renova o veneno
  playerStats.poisoned.turns = 2;
  playerStats.poisoned.dmg   = Math.max(playerStats.poisoned.dmg, Math.floor(enemy.atk * 0.4));

  battle.message = `${enemy.name} enfia o ferrão duas vezes! ${dmg} de dano e o veneno se renova.`;
  flashEnemyAt(enemy, 'white');
  battle.anim.lungeEnemy = 0.35;
  flashPlayer('red', 0.35);
  spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.72, dmg, '#9b3fb5');
  sfx('hurt');
  return true;
}

// ---- Escorpião Gigante: carga especial (mais forte que a da múmia) ----
// Usa o mesmo padrão de chargeTurn/enraged, mas com mensagem própria.
export function scorpionGiantCharge(enemy) {
  if (enemy.enraged > 0 || enemy.chargeTurn > 0) return false;
  if (Math.random() >= (enemy.chargeChance ?? 0.4)) return false;

  enemy.chargeTurn = 1;
  enemy.enraged    = 1;
  battle.message = `${enemy.name} ergue a cauda e range as pinças! (prepare-se)`;
  sfx('hurt');
  return true;
}

// ---- Registro: id → lista de habilidades (testadas em ordem) ----
// Retorna assim que uma habilidade "age".
export const ABILITIES = {
  rat:     [ratHide],
  vulture: [vultureFly, vultureReturn],
  goblin:  [goblinCharge],
  mummy:   [mummyCharge],
  scarab:  [scarabBuff],
  scorpion_giant: [scorpionGiantCharge, scorpionGiantFerrão],
  raider_leader: [goblinCharge],
};