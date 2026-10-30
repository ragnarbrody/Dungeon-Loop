// ============================================================
// Helpers compartilhados: alvo, animação, texto flutuante.
// Nada de regra de jogo aqui — só utilidades de "apresentação"
// que várias partes da batalha usam.
// ============================================================
import { battle } from '../core/state.js';
import { CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { sfx } from '../audio/audio.js';

// ---- Alvos ----
export function hasVisibleTarget() {
  return battle.enemies.some(e => e.hp > 0 && e.hiding === 0);
}

export function target() {
  const alive = battle.enemies.filter(e => e.hp > 0 && e.hiding === 0);
  if (alive.length === 0) {
    const anyAlive = battle.enemies.filter(e => e.hp > 0);
    if (anyAlive.length === 0) return null;
    battle.targetIndex = battle.enemies.indexOf(anyAlive[0]);
    return anyAlive[0];
  }
  const cur = battle.enemies[battle.targetIndex];
  if (!cur || cur.hp <= 0 || cur.hiding > 0) {
    battle.targetIndex = battle.enemies.findIndex(e => e.hp > 0 && e.hiding === 0);
    if (battle.targetIndex < 0) battle.targetIndex = 0;
  }
  return battle.enemies[battle.targetIndex];
}

export function targetIgnoringHiding() {
  const cur = battle.enemies[battle.targetIndex];
  if (cur && cur.hp > 0) return cur;
  const anyAlive = battle.enemies.filter(e => e.hp > 0);
  if (anyAlive.length === 0) return null;
  battle.targetIndex = battle.enemies.indexOf(anyAlive[0]);
  return anyAlive[0];
}

export function livingEnemies() {
  return battle.enemies.filter(e => e.hp > 0);
}

export function isAnyAlive() {
  return battle.enemies.some(e => e.hp > 0);
}

export function getVisualTargetIndex() {
  const n = battle.enemies.length;
  if (n === 0) return -1;
  const cur = battle.enemies[battle.targetIndex];
  if (cur && cur.hp > 0 && cur.hiding === 0) return battle.targetIndex;
  for (let i = 0; i < n; i++) {
    if (battle.enemies[i].hp > 0 && battle.enemies[i].hiding === 0) return i;
  }
  return -1;
}

// ---- Marca ----
export function applyMarkBonus(enemy, dmg) {
  if (!enemy.huntersMark) return dmg;
  const bonus = enemy.huntersMark.damageBonus || 0;
  enemy.huntersMark = null;
  return Math.floor(dmg * (1 + bonus));
}

// ---- Esquiva ----
export function tryDodge(enemy) {
  if (!enemy.dodgeChance) return false;
  if (enemy.huntersMark && enemy.huntersMark.ignoreDodge) return false;
  if (Math.random() < enemy.dodgeChance) {
    flashEnemyAt(enemy, 'white');
    spawnFloatingText(enemy, 'ESQUIVA', '#8ad8ff');
    battle.message += ` ${enemy.name} esquivou!`;
    sfx('miss');
    return true;
  }
  return false;
}

// ---- Animação ----
export function flashEnemyAt(enemy, type = 'white') {
  const idx = battle.enemies.indexOf(enemy);
  battle.anim.flashEnemy = 0.3;
  battle.anim.flashEnemyIndex = idx;
  battle.anim.flashEnemyType = type;
}

export function flashPlayer(type = 'white', duration = 0.3) {
  battle.anim.flashPlayer = duration;
  battle.anim.flashPlayerType = type;
}

// ---- Texto flutuante ----
export function spawnFloatingText(enemy, value, color) {
  const pos = enemyScreenPos(enemy);
  spawnFloatingTextAt(pos.x, pos.y - 30, value, color);
}

export function spawnFloatingTextAt(x, y, value, color) {
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