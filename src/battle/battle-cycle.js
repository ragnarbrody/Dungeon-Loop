// ============================================================
// Ciclo de batalha: início, fim, update por frame, limpeza de
// mortos e drops especiais (núcleo do portal).
//
// Este módulo é o "orquestrador" — não contém regra de skill nem
// de turno. Essas ficam em skills.js / turn.js / enemy-abilities.js.
// ============================================================
import {
  battle, playerStats, setGameState, STATE, saveGame,
  player, currentRoom, checkLevelUp,
} from '../core/state.js';
import { rand } from '../core/rng.js';
import { hud, updateHud } from '../ui/hud.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import { getBiomeEnemies } from '../world/biomes.js';
import { notifyEnemyKilled, notifyDungeonEnemyKilled } from '../quests.js';
import { rollDrops, formatDrop } from '../drops.js';
import { sfx, setMusicMode } from '../audio/audio.js';
import { buildEnemyGroup } from './enemy-spawn.js';
import { isAnyAlive } from './battle-helpers.js';
import { enemyTurn } from './turn.js';
import { classAtk } from './skills.js';

const FADE_DURATION = 1.8;

// ---- Início de batalha ----
export function startBattle(opts = {}) {
  // Cidade é safezone — nunca entra em combate
  if (currentRoom && currentRoom.isCity) return;

  const { enemyId, mapEnemy, biomeGX, biomeGY } = opts;

  setGameState(STATE.BATTLE);
  battle.active = true;
  battle.turn = 'player';
  battle.turnTimer = 0;
  battle.anim = {
    shake: 0, flashPlayer: 0, flashEnemy: 0,
    lungePlayer: 0, lungeEnemy: 0,
    flashPlayerType: 'white', flashEnemyIndex: -1, flashEnemyType: 'red',
  };
  battle.floatingTexts = [];
  battle.mapEnemy = mapEnemy || null;
  battle.targetIndex = 0;
  battle.enemyTurnIndex = 0;
  battle.activeEnemyIndex = -1;
  battle.xpEarned = 0;
  battle.fadingEnemies = [];
  battle.menuMode = 'main';
  battle.skillPage = 0;
  battle.itemPage = 0;
  battle.tooltipSkill = null;
  battle.tooltipPos = null;
  battle.goldEarned = 0;
  battle.dropEarned = [];
  battle._shadowDodged = 0;

  playerStats.buffs = {};
  playerStats._mpRegenAcc = 0;
  playerStats.poisoned = null;
  playerStats.bleeding = null;

  let chosenId;
  let pool = null;

  if (enemyId) {
    // Batalha fixa do mapa — grupo homogêneo
    chosenId = enemyId;
  } else {
    // Batalha aleatória — passa o pool pro buildEnemyGroup sortear MISTO
    pool = (biomeGX !== undefined && biomeGY !== undefined)
      ? getBiomeEnemies(biomeGX, biomeGY)
      : ['slime', 'rat', 'goblin'];

    if (pool.length === 0) return;
    chosenId = pool[Math.floor(Math.random() * pool.length)];
  }

  battle.enemies = buildEnemyGroup(chosenId, playerStats.level, enemyId ? null : pool);

  // Recalcula o ATK da classe com o equipamento atual
  battle.player.atk = classAtk();
  battle.player.def = playerStats.def + (weaponBonus(playerEquip).def || 0);

  battle.message = battle.enemies.length === 1
    ? `Um ${battle.enemies[0].name} selvagem apareceu!`
    : `${battle.enemies.length} ${battle.enemies[0].name}s selvagens apareceram!`;
  if (typeof encounter !== 'undefined' && encounter) encounter.walkedSinceLast = 0;
  hud.style.display = 'none';
  setMusicMode('battle');
}

// ---- Fim de batalha (vitória, fuga ou derrota) ----
export function endBattle(escaped) {
  // Se fugiu de um inimigo do mapa, marca o tile como "imune" até sair
  if (escaped && battle.mapEnemy) {
    player.fleeImmune.set(battle.mapEnemy, Infinity);
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
  battle.itemPage = 0;
  battle.tooltipSkill = null;
  battle.tooltipPos = null;
  battle.goldEarned = 0;
  battle.dropEarned = [];
  battle._shadowDodged = 0;

  if (typeof encounter !== 'undefined' && encounter) {
    encounter.cooldownPx = escaped ? 600 : 800;
    encounter.walkedSinceLast = 0;
  }
  hud.style.display = '';
  playerStats.buffs = {};
  playerStats._mpRegenAcc = 0;
  playerStats.poisoned = null;
  playerStats.bleeding = null;
  saveGame();
  updateHud();

  // Volta pra música do bioma (ou Aethel, se for cidade)
  if (currentRoom) {
    if (currentRoom.isDungeon) {
      setMusicMode('cave');
    } else {
      setMusicMode(currentRoom.isCity ? 'aethel' : currentRoom.biomeId);
    }
  }
}

// ---- Limpeza de inimigos mortos (chamado a cada frame e antes de skill) ----
export function clearDeadEnemies() {
  const before = battle.enemies.length;
  const currentTarget = battle.enemies[battle.targetIndex];

  const survivors = [];
  for (const e of battle.enemies) {
    if (e.hp > 0) {
      survivors.push(e);
      continue;
    }
    // Recompensas
    battle.xpEarned += e.xp;
    if (e.goldMin !== undefined) {
      const gold = rand(e.goldMin, e.goldMax);
      if (gold > 0) battle.goldEarned = (battle.goldEarned || 0) + gold;
    }
    const drops = rollDrops(e.id, playerStats.inventory);
    if (drops.length > 0) {
      battle.dropEarned = battle.dropEarned || [];
      for (const d of drops) battle.dropEarned.push(d);
    }
    notifyEnemyKilled(e.id);
    if (currentRoom?.isDungeon) {
      notifyDungeonEnemyKilled(currentRoom.dungeonId, e.id);
    }
    battle.fadingEnemies.push({
      ref: e,
      timer: FADE_DURATION,
      total: FADE_DURATION,
      slotIndex: battle.enemies.indexOf(e),
      slotCount: battle.enemies.length,
    });
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

// ---- Update por frame ----
export function updateBattle(dt) {
  // Timers de animação
  battle.anim.shake       = Math.max(0, battle.anim.shake       - dt);
  battle.anim.flashPlayer = Math.max(0, battle.anim.flashPlayer - dt);
  battle.anim.flashEnemy  = Math.max(0, battle.anim.flashEnemy  - dt);
  battle.anim.lungePlayer = Math.max(0, battle.anim.lungePlayer - dt);
  battle.anim.lungeEnemy  = Math.max(0, battle.anim.lungeEnemy  - dt);

  // Fade dos corpos
  for (let i = battle.fadingEnemies.length - 1; i >= 0; i--) {
    const f = battle.fadingEnemies[i];
    f.timer -= dt;
    if (f.timer <= 0) battle.fadingEnemies.splice(i, 1);
  }

  // Floating texts
  for (let i = battle.floatingTexts.length - 1; i >= 0; i--) {
    const ft = battle.floatingTexts[i];
    ft.y -= 30 * dt;
    ft.age += dt;
    if (ft.age > 0.8) battle.floatingTexts.splice(i, 1);
  }

  // Fuga em andamento
  if (battle.turn === 'fled') {
    battle.turnTimer -= dt;
    if (battle.turnTimer <= 0) endBattle(true);
    return;
  }

  clearDeadEnemies();

  // Vitória
  if (!isAnyAlive()) {
    if (battle.turn !== 'resolve-end') {
      battle.turn = 'resolve-end';
      battle.turnTimer = 1.0;
      sfx('victory');

      const totalXp = battle.xpEarned;
      playerStats.xp += totalXp;
      checkLevelUp();

      if (battle.goldEarned) {
        playerStats.gold += battle.goldEarned;
        battle.message = `Você venceu! +${battle.goldEarned} de ouro.`;
      } else {
        battle.message = 'Você venceu!';
      }

      if (battle.dropEarned && battle.dropEarned.length > 0) {
        const dropStr = battle.dropEarned.map(formatDrop).join(', ');
        battle.message += ` Dropou: ${dropStr}.`;
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
      sfx('defeat');
    }
    battle.turnTimer -= dt;
    return;
  }

  // Turno dos inimigos: processa um por vez, com timer entre cada
  if (battle.turn === 'resolve') {
    battle.turnTimer -= dt;
    if (battle.turnTimer <= 0) enemyTurn();
  }
}

// ---- Drop especial: núcleo do portal (chamado ao matar um boss) ----
export function dropPortalCore(biomeId) {
  if (!playerStats.portalCores.has(biomeId)) {
    playerStats.portalCores.add(biomeId);
    battle.message += ` Você obteve o Núcleo do Portal (${biomeId})! (${playerStats.portalCores.size}/8)`;
    saveGame();
  }
}