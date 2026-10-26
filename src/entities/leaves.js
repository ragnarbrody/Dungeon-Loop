import { GRID_SIZE, TILE_SIZE } from '../core/canvas.js';
import { T } from '../world/tiles.js';
import { currentRoom } from '../core/state.js';

const leafEmitters = new Map();
const activeLeaves = [];

function treeSeed(tx, ty) {
  let h = 2166136261 ^ tx;
  h = Math.imul(h, 16777619) ^ ty;
  return h >>> 0;
}

function getEmitter(tx, ty) {
  const key = `${tx},${ty}`;
  if (!leafEmitters.has(key)) {
    const s = treeSeed(tx, ty);
    const offset = (s % 3000) / 1000;
    const period = 2.5 + ((s >>> 8) % 2500) / 1000;
    leafEmitters.set(key, { timer: offset, period });
  }
  return leafEmitters.get(key);
}

function spawnLeaf(px, py) {
  activeLeaves.push({
    x: px + (Math.random() - 0.5) * 8,
    y: py + (Math.random() - 0.5) * 4,
    vx: (Math.random() - 0.5) * 0.25,
    vy: 0.2 + Math.random() * 0.35,
    age: 0,
    life: 2.2 + Math.random() * 1.5,
    swayPhase: Math.random() * Math.PI * 2,
  });
}

export function updateLeaves(dt) {
  if (!currentRoom) return;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (currentRoom.map[y][x] !== T.TREE) continue;

      const e = getEmitter(x, y);
      e.timer -= dt;
      if (e.timer <= 0) {
        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const cy = y * TILE_SIZE - 2;
        spawnLeaf(cx, cy);

        const factor = 0.6 + Math.random() * 0.8;
        e.timer = e.period * factor;
      }
    }
  }

  for (let i = activeLeaves.length - 1; i >= 0; i--) {
    const L = activeLeaves[i];
    L.age += dt;
    if (L.age >= L.life) {
      activeLeaves.splice(i, 1);
      continue;
    }
    L.swayPhase += dt * 3;
    L.x += L.vx + Math.sin(L.swayPhase) * 0.15;
    L.y += L.vy;
  }
}

export function clearLeaves() {
  activeLeaves.length = 0;
}

export function getActiveLeaves() {
  return activeLeaves;
}