import { GRID_SIZE, TILE_SIZE, CANVAS_W, CANVAS_H, SPAWN_MARGIN } from '../core/canvas.js';
import { T, DIRS, isSolid, tileAt } from '../world/tiles.js';
import { player, encounter, currentRoom, transitionCooldown,
         decrementTransitionCooldown, setCurrentRoom, setTransitionCooldown, markRoomVisited } from '../core/state.js';
import { getRoom } from '../world/rooms.js';
import { updateHud } from '../ui/hud.js';
import { startBattle } from '../battle/battle.js';
import { keys } from '../ui/input.js';
import { clearLeaves } from './leaves.js';

let walkTimer = 0;
const WALK_FRAME_MS = 0.14;
const FRAME_DOWN = 2;

// Verifica se o tile está livre (sem paredes ou árvores)
function isWalkableTile(map, tx, ty) {
  if (ty < 0 || ty >= GRID_SIZE || tx < 0 || tx >= GRID_SIZE) return false;
  return !isSolid(map[ty][tx]);
}

// Busca o tile livre mais próximo (espiral)
function findSafeSpawn(map, tx, ty, reserved) {
  const key = (x, y) => `${x},${y}`;
  
  // Verifica se o tile está livre E não é reservado
  const isSafe = (x, y) => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    if (reserved && reserved.has(key(x, y))) return false;
    return !isSolid(map[y][x]);
  };

  if (isSafe(tx, ty)) return { tx, ty };
  
  for (let r = 1; r <= 10; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (isSafe(tx + dx, ty + dy)) return { tx: tx + dx, ty: ty + dy };
      }
    }
  }
  return { tx, ty };
}

function spawnAt(side, room) {
  const mid = Math.floor(GRID_SIZE / 2);
  let tx = mid, ty = mid;
  const inside = SPAWN_MARGIN + 1;
  switch (side) {
    case 'left':   tx = inside;                 ty = mid; break;
    case 'right':  tx = GRID_SIZE - 1 - inside; ty = mid; break;
    case 'top':    tx = mid;                    ty = inside; break;
    case 'bottom': tx = mid;                    ty = GRID_SIZE - 1 - inside; break;
  }
  
  // Usa o mapa da sala e a lista de reservados para achar o spawn seguro
  const safe = findSafeSpawn(room.map, tx, ty, room.reserved);
  player.x = safe.tx * TILE_SIZE + TILE_SIZE / 2;
  player.y = safe.ty * TILE_SIZE + TILE_SIZE / 2;
}

function checkDoorTransition() {
  const tx = Math.floor(player.x / TILE_SIZE);
  const ty = Math.floor(player.y / TILE_SIZE);
  if (currentRoom.map[ty]?.[tx] !== T.DOOR) return;

  let side = null;
  if (ty === 0)                side = 'top';
  else if (ty === GRID_SIZE-1) side = 'bottom';
  else if (tx === 0)           side = 'left';
  else if (tx === GRID_SIZE-1) side = 'right';
  if (!side || !currentRoom.doors.includes(side)) return;

  const d = DIRS[side];
  
  // Gera a nova sala
  const newRoom = getRoom(currentRoom.gx + d.dx, currentRoom.gy + d.dy);
  
  // Muda para a nova sala
  setCurrentRoom(newRoom);
  markRoomVisited(newRoom.gx, newRoom.gy);
  clearLeaves();
  updateHud();
  
  // Spawna o jogador passando o mapa da nova sala
  spawnAt(d.opposite, newRoom);
  setTransitionCooldown(30);
}

function collidesWithSolid(x, y, w, h) {
  const pts = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h],
    [x + w/2, y], [x + w/2, y + h],
    [x, y + h/2], [x + w, y + h/2],
  ];
  for (const [px, py] of pts) {
    if (isSolid(tileAt(currentRoom.map, px, py))) return true;
  }
  return false;
}

export function updatePlayer(dt) {
  // decai a imunidade de fuga
  for (const [enemy, _] of player.fleeImmune) {
  const ptx = Math.floor(player.x / TILE_SIZE);
  const pty = Math.floor(player.y / TILE_SIZE);
  if (enemy.tx !== ptx || enemy.ty !== pty) {
    player.fleeImmune.delete(enemy);
  }
}

  let dx = 0, dy = 0;
  if (keys['arrowleft']  || keys['a']) dx -= 1;
  if (keys['arrowright'] || keys['d']) dx += 1;
  if (keys['arrowup']    || keys['w']) dy -= 1;
  if (keys['arrowdown']  || keys['s']) dy += 1;

  if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }

  if (dx < 0) player.facing = 'left';
  else if (dx > 0) player.facing = 'right';
  else if (dy < 0) player.facing = 'up';
  else if (dy > 0) player.facing = 'down';

  const half = player.size / 2;
  const oldX = player.x, oldY = player.y;
  const newX = player.x + dx * player.speed;
  const newY = player.y + dy * player.speed;

  const moving = (dx !== 0 || dy !== 0);
  if (moving) {
    walkTimer += dt;
    if (walkTimer >= WALK_FRAME_MS) {
      walkTimer = 0;
      player.step = (player.step + 1) % FRAME_DOWN;
    }
  } else {
    walkTimer = 0;
    player.step = 0;
  }

  if (!collidesWithSolid(newX - half, player.y - half, player.size, player.size)) {
    player.x = newX;
  }
  if (!collidesWithSolid(player.x - half, newY - half, player.size, player.size)) {
    player.y = newY;
  }

  // ---- encontro aleatório ----
  // (não roda na cidade)
  if (currentRoom && !currentRoom.isCity) {
    const movedDist = Math.hypot(player.x - oldX, player.y - oldY);
    if (movedDist > 0.01) {
      if (encounter.cooldownPx > 0) {
        encounter.cooldownPx -= movedDist;
      } else {
        encounter.walkedSinceLast += movedDist;
        if (encounter.walkedSinceLast > 200) {
          if (Math.random() < encounter.chancePerPixel * 200) {
            startBattle({ biomeGX: currentRoom.gx, biomeGY: currentRoom.gy });
          }
          encounter.walkedSinceLast = 0;
        }
      }
    }
  }
  const movedDist = Math.hypot(player.x - oldX, player.y - oldY);
  if (movedDist > 0.01) {
    if (encounter.cooldownPx > 0) {
      encounter.cooldownPx -= movedDist;
    } else {
      encounter.walkedSinceLast += movedDist;
      if (encounter.walkedSinceLast > 200) {
        if (Math.random() < encounter.chancePerPixel * 200) {
          // Passa a sala atual para o startBattle respeitar o bioma
          startBattle({ biomeGX: currentRoom.gx, biomeGY: currentRoom.gy });
        }
        encounter.walkedSinceLast = 0;
      }
    }
  }

  if (transitionCooldown > 0) decrementTransitionCooldown();
  else checkDoorTransition();

  // no final de updatePlayer:
  if (!currentRoom.isCity && currentRoom.enemies) {
    const ptx = Math.floor(player.x / TILE_SIZE);
    const pty = Math.floor(player.y / TILE_SIZE);
    for (const e of currentRoom.enemies) {
      if (e.defeated) continue;
      // Pula inimigos que o jogador acabou de fugir
      if (player.fleeImmune.has(e)) continue;
      if (e.tx === ptx && e.ty === pty) {
        startBattle({ enemyId: e.id, mapEnemy: e });
        break;
      }
    }
  }
}