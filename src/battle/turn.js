// ============================================================
// Turno: processamento do turno dos inimigos, status, buffs.
// ============================================================
import { battle, playerStats, saveGame } from '../core/state.js';
import { rand } from '../core/rng.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { sfx } from '../audio/audio.js';
import { enemyAttackDamage } from './damage.js';
import { ABILITIES } from './enemy-abilities.js';
import {
  flashPlayer, spawnFloatingTextAt, isAnyAlive,
} from './battle-helpers.js';
import { classAtk } from './skills.js';

// ---- Regen de MP ----
function tickMpRegen() {
  const regen = 0.5 + playerStats.int * 0.15;
  playerStats._mpRegenAcc = (playerStats._mpRegenAcc || 0) + regen;
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

// ---- Status effects no jogador ----
function tickStatusEffects() {
  const partes = [];

  if (playerStats.poisoned && playerStats.poisoned.turns > 0) {
    playerStats.hp = Math.max(0, playerStats.hp - playerStats.poisoned.dmg);
    spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.64, `-${playerStats.poisoned.dmg}`, '#9b3fb5');
    partes.push(`veneno (-${playerStats.poisoned.dmg} HP)`);
    playerStats.poisoned.turns--;
    if (playerStats.poisoned.turns <= 0) {
      playerStats.poisoned = null;
      partes.push('o veneno passou');
    }
  }

  if (playerStats.bleeding && playerStats.bleeding.turns > 0) {
    playerStats.hp = Math.max(0, playerStats.hp - playerStats.bleeding.dmg);
    spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.68, `-${playerStats.bleeding.dmg}`, '#ff3b3b');
    partes.push(`sangramento (-${playerStats.bleeding.dmg} HP)`);
    playerStats.bleeding.turns--;
    if (playerStats.bleeding.turns <= 0) {
      playerStats.bleeding = null;
      partes.push('o sangramento parou');
    }
  }

  if (partes.length > 0) {
    battle.message = `Você sofre ${partes.join(' e ')}.`;
    saveGame();
  }
}

function tickBuffs() {
  for (const k in playerStats.buffs) {
    const b = playerStats.buffs[k];
    b.rounds--;
    if (b.rounds <= 0) delete playerStats.buffs[k];
  }
}

// ---- Fim do turno do jogador ----
export function endPlayerTurn() {
  tickMpRegen();
  tickStatusEffects();
  battle.turn = 'resolve';
  battle.turnTimer = 0.9;
  battle.enemyTurnIndex = 0;
  battle.activeEnemyIndex = -1;
  battle.menuMode = 'main';
  battle.skillPage = 0;
  battle.itemPage = 0;
}

// ---- Decrementa buff do escaravelho no início do turno do inimigo ----
function tickScarabBuff(e) {
  if (!e.scarabBuff) return;
  e.scarabBuff.turns--;
  if (e.scarabBuff.turns <= 0) {
    e.buffDef = Math.max(0, e.buffDef - e.scarabBuff.def);
    e.buffAtk = (e.buffAtk || 0) - e.scarabBuff.atk;
    e.atkMod  = (e.atkMod  || 0) - e.scarabBuff.atk;
    e.defMod  = (e.defMod  || 0) - e.scarabBuff.def;
    e.scarabBuff = null;
  }
}

// ---- Turno de um inimigo ----
export function enemyTurn() {
  while (
    battle.enemyTurnIndex < battle.enemies.length &&
    battle.enemies[battle.enemyTurnIndex].hp <= 0
  ) {
    battle.enemyTurnIndex++;
  }

  if (battle.enemyTurnIndex >= battle.enemies.length) {
    battle.enemyTurnIndex = 0;
    battle.activeEnemyIndex = -1;
    battle.turn = 'player';
    tickBuffs();
    battle.player.atk = classAtk();
    if (battle.targetIndex >= battle.enemies.length) battle.targetIndex = 0;

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

  if (e.hideCooldown > 0) e.hideCooldown--;
  tickScarabBuff(e);

  // ---- 1) Habilidades especiais (via registro) ----
  let acted = false;
  const abilities = ABILITIES[e.id] || [];
  for (const ability of abilities) {
    if (ability(e, { battle })) { acted = true; break; }
  }

  // ---- 2) Status effects que travam o turno ----
  if (!acted && e.hiding > 0) {
    // Rato/abutre: sair da toca
    e.hiding = 0;
    if (e.flyingAway) {
      e.flyingAway = false;
      battle.message = `${e.name} voltou voando!`;
    } else {
      battle.message = `${e.name} saiu da toca!`;
    }
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

  // ---- 3) Ataque normal / enfurecido ----
  if (!acted) {
    const wasEnraged = e.enraged > 0;

    if (Math.random() < 0.8) {
      const def = battle.player.def;
      const finalDmg = enemyAttackDamage(e, wasEnraged, def, rand);

      playerStats.hp = Math.max(0, playerStats.hp - finalDmg);
      sfx('hurt');

      // Veneno
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
      // Sangramento
      if (e.bleedChance && Math.random() < e.bleedChance) {
        const novo = { turns: 3, dmg: Math.max(1, Math.floor(e.atk * 0.2)) };
        if (playerStats.bleeding) {
          playerStats.bleeding.turns = Math.max(playerStats.bleeding.turns, novo.turns);
          playerStats.bleeding.dmg   = Math.max(playerStats.bleeding.dmg, novo.dmg);
        } else {
          playerStats.bleeding = novo;
        }
        battle.message += ' Você está sangrando!';
      }

      battle.message = wasEnraged
        ? `${e.name} desferiu um ataque ENFURECIDO! ${finalDmg} de dano!`
        : `${e.name} atacou! ${finalDmg} de dano.`;

      battle.anim.lungeEnemy = 0.2;
      flashPlayer('red', 0.35);
      spawnFloatingTextAt(CANVAS_W * 0.25, CANVAS_H * 0.72, finalDmg, wasEnraged ? '#ffa500' : '#ff3b3b');

      const hudHp = document.getElementById('hud-hp');
      if (hudHp) hudHp.textContent = `${playerStats.hp}/${playerStats.maxHp}`;
    } else {
      battle.message = `${e.name} errou o ataque!`;
      sfx('miss');
      battle.anim.lungeEnemy = 0;
    }

    if (wasEnraged) {
      e.enraged = 0;
      e.chargeTurn = 0;
    }
  }

  battle.enemyTurnIndex++;
  battle.turnTimer = battle.enemyTurnIndex < battle.enemies.length ? 0.6 : 0.4;
}