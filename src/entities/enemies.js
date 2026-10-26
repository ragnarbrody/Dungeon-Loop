// src/entities/enemies.js
import { ENEMY_SPRITES } from '../sprites/enemies.js';
import { ctx, TILE_SIZE } from '../core/canvas.js';

export function drawMapEnemies(room) {
  if (!room || !room.enemies) return;

  for (const e of room.enemies) {
    if (e.defeated) continue;

    const sprites = ENEMY_SPRITES[e.id];
    if (!sprites) continue;

    const frame = sprites.idle[
      Math.floor(performance.now() / 500) % sprites.idle.length
    ];

    const dx = e.tx * TILE_SIZE + TILE_SIZE / 2 - 16;
    const dy = e.ty * TILE_SIZE + TILE_SIZE - 30;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(dx + 16, dy + 30, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(frame, dx, dy, 32, 32);
  }
}