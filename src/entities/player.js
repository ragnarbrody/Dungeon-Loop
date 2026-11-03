import { GRID_SIZE, TILE_SIZE, CANVAS_W, CANVAS_H, SPAWN_MARGIN } from '../core/canvas.js';
import { T, DIRS, isSolid, tileAt } from '../world/tiles.js';
import { player, encounter, currentRoom, transitionCooldown,
         decrementTransitionCooldown, setCurrentRoom, setTransitionCooldown,
         markRoomVisited, playerStats, setDungeonRoom, saveGame,
         startGX, startGY } from '../core/state.js';
import { getRoom, dungeonCache, getDungeon } from '../world/rooms.js';
import { updateHud } from '../ui/hud.js';
import { startBattle } from '../battle/battle.js';
import { keys } from '../ui/input.js';
import { clearLeaves } from './leaves.js';
import { findNearbyInteractable } from '../world/interactables.js';
import { revealRoom, removeMarker } from '../world/knowledge.js';
import { sfx, setMusicMode } from '../audio/audio.js';
import { showToast } from '../ui/toast.js';
import { consumeCaveCollapseNotice, isQuestActive, advanceObjective } from '../quests.js';
import { openDialogue } from '../ui/dialogue.js';
import { playerEquip } from '../sprites/equipment.js';
import { getTimeOfDay, getTimeState } from '../core/timeofday.js';
import { ITEMS_DB } from '../items.js';

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
  const rows = map.length;
  const cols = map[0].length;
  const key = (x, y) => `${x},${y}`;
  
  // Verifica se o tile está livre E não é reservado
  const isSafe = (x, y) => {
    if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
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

  // Interior: sair restaura sala externa
  if (currentRoom.isInterior) {
    const back = currentRoom._returnRoom;
    if (!back) return;
    const door = currentRoom._returnDoor;

    setCurrentRoom(back);
    clearLeaves();
    updateHud();
    revealRoom(back.gx, back.gy);

    // Restaura a música do bioma de fora
    setMusicMode(back.isCity ? 'aethel' : back.biomeId);

    if (door) {
      // Coloca o player em cima da porta (ou 1 tile abaixo, para não disparar
      // o DOOR transition logo em seguida — não há risco porque o mundo
      // externo não usa T.DOOR para casas, apenas nas bordas do mapa)
      player.x = door.tx * TILE_SIZE + TILE_SIZE / 2;
      player.y = door.ty * TILE_SIZE + TILE_SIZE / 2;
    } else {
      // fallback (não deveria acontecer)
      const mid = Math.floor(GRID_SIZE / 2);
      player.x = mid * TILE_SIZE + TILE_SIZE / 2;
      player.y = (GRID_SIZE - 3) * TILE_SIZE + TILE_SIZE / 2;
    }

    setTransitionCooldown(30);
    return;
  }

  // Determina o lado da porta PRIMEIRO
  let side = null;
  if (ty === 0)                side = 'top';
  else if (ty === GRID_SIZE-1) side = 'bottom';
  else if (tx === 0)           side = 'left';
  else if (tx === GRID_SIZE-1) side = 'right';
  if (!side || !currentRoom.doors.includes(side)) return;

  // --- Bloqueio de saída da dungeon ---
  // --- Dungeon: não usa gx/gy, tem lógica própria ---
  if (currentRoom.isDungeon) {
    handleDungeonDoor(side);
    return;
  }

  const d = DIRS[side];
  
  // Gera a nova sala
  const newRoom = getRoom(currentRoom.gx + d.dx, currentRoom.gy + d.dy);

  // Muda para a nova sala
  setCurrentRoom(newRoom);
  markRoomVisited(newRoom.gx, newRoom.gy);
  revealRoom(newRoom.gx, newRoom.gy);   // ← NOVO
  clearLeaves();
  updateHud();

  // Música do novo bioma (ou 'aethel' se for cidade)
  setMusicMode(newRoom.isCity ? 'aethel' : newRoom.biomeId);
    
  // Spawna o jogador passando o mapa da nova sala
  spawnAt(d.opposite, newRoom);
  // Depois de setCurrentRoom(newRoom) e spawnAt:
  if (playerStats._escortActive && playerStats._escortPos) {
    playerStats._escortPos = { x: player.x - 20, y: player.y };
  }
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

function handleDungeonDoor(side) {
  const mid = Math.floor(GRID_SIZE / 2);
  const dungeon = getDungeon(currentRoom.dungeonId);
  const depth = currentRoom.dungeonDepth;

  if (side === 'bottom') {
    if (currentRoom.enemies.some(e => !e.defeated)) {
      showToast({
        itemId: 'questlog',
        title: 'Saída bloqueada',
        subtitle: 'Derrote todos os inimigos antes de avançar.',
        color: '#ff6b6b',
      });
      // empurra 1 tile pra dentro + cooldown (senão o toast dispara todo frame)
      player.y -= TILE_SIZE;
      setTransitionCooldown(30);
      return;
    }
    const next = dungeon?.rooms.get(depth + 1);
    if (!next) return;
    setDungeonRoom(next);
    player.x = mid * TILE_SIZE + TILE_SIZE / 2;
    player.y = 3 * TILE_SIZE + TILE_SIZE / 2;
  } else if (side === 'top') {
    if (depth === 0) { leaveDungeon(); return; }
    const prev = dungeon?.rooms.get(depth - 1);
    if (!prev) return;
    setDungeonRoom(prev);
    player.x = mid * TILE_SIZE + TILE_SIZE / 2;
    player.y = (GRID_SIZE - 4) * TILE_SIZE + TILE_SIZE / 2;
  } else {
    return;
  }

  setMusicMode('cave');
  clearLeaves();
  updateHud();
  setTransitionCooldown(30);
  saveGame();
}

function leaveDungeon() {
  // startGX/startGY nunca são alterados por setDungeonRoom,
  // então sempre apontam para a sala do mundo de onde você entrou.
  const room = getRoom(startGX, startGY);
  setCurrentRoom(room);
  clearLeaves();
  updateHud();
  setMusicMode(room.biomeId);

  const ent = room.interactables?.find(i => i.kind === 'cave_entrance');
  const tx = ent ? ent.tx : Math.floor(GRID_SIZE / 2);
  const ty = ent ? ent.ty + 1 : Math.floor(GRID_SIZE / 2);
  const safe = findSafeSpawn(room.map, tx, ty, null);
  player.x = safe.tx * TILE_SIZE + TILE_SIZE / 2;
  player.y = safe.ty * TILE_SIZE + TILE_SIZE / 2;

  setTransitionCooldown(30);
  saveGame();

  // ---- Se a quest foi concluída, a caverna desabou ----
  if (consumeCaveCollapseNotice()) {
    sfx('collapse');
    // pequeno delay pra dar tempo do som "pegar" antes do texto
    setTimeout(() => {
      openDialogue({
        title: 'Desabamento',
        text:
          'Você sobe os últimos degraus e sente o chão tremer.\n\n' +
          'Atrás de você, a entrada da caverna desmorona — pedra, poeira e escuridão.\n\n' +
          'Não há mais como voltar lá para dentro.\n\n' +
          '\nVocê se pergunta se o aldeão conseguiu escapar...\n\n',
      });
    }, 400);
  }
}

export function updatePlayer(dt) {
  // Níveis baixos têm mais "paz" (menos encontros)
  const lvl = playerStats.level;
  const peace = lvl <= 2 ? 0.4 : lvl <= 4 ? 0.65 : lvl <= 6 ? 0.85 : 1.0;
  const effectiveChance = encounter.chancePerPixel * peace;

  // ---- Chegada em Aethel com a Herbalista (escolta) ----
  // Quando o jogador entra em (0,0) carregando a companion, o objetivo
  // `escort_home` avança sozinho. Ela some (porque a quest fica "pronta"),
  // e o jogador só precisa ir ao Ancião entregar.
  if (
    currentRoom &&
    currentRoom.isCity &&
    currentRoom.gx === 0 && currentRoom.gy === 0 &&
    playerStats._escortActive &&
    isQuestActive('story_herbalist_escort')
  ) {
    const arrived = playerStats._escortArrived;
    if (!arrived) {
      playerStats._escortArrived = true;
      advanceObjective('story_herbalist_escort', 'escort_home', 1);
      removeMarker('marker_herbalist_escort');
      saveGame();
      showToast({
        itemId: 'questlog',
        title: 'Escolta concluída',
        subtitle: 'A Herbalista voltou a Aethel. Fale com o Ancião.',
        color: '#6fbd63',
      });
      // Desativa a companion visualmente (ela "entra" na cidade)
      playerStats._escortActive = false;
      playerStats._escortPos = null;
    }
  }

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
  if (currentRoom && !currentRoom.isCity && !currentRoom.isInterior && !currentRoom.isDungeon) {
    const movedDist = Math.hypot(player.x - oldX, player.y - oldY);
    if (movedDist > 0.01) {
      if (encounter.cooldownPx > 0) {
        encounter.cooldownPx -= movedDist;
      } else {
        // ---- Fator "paz" por nível (problema 1) ----
        const lvl = playerStats.level;
        const levelPeace = lvl <= 2 ? 0.4 : lvl <= 4 ? 0.65 : lvl <= 6 ? 0.85 : 1.0;

        // ---- Fator "botas silenciosas" (problema 3) ----
        let bootsMultiplier = 1.0;
        const bootsItem = ITEMS_DB[playerEquip.boots];
        if (bootsItem?.antiEncounter) {
          const ae = bootsItem.antiEncounter;
          const time = getTimeState();
          if (time.label === 'Manhã' || time.label === 'Tarde') {
            bootsMultiplier = ae.dayMultiplier;      // 0
          } else if (time.label === 'Entardecer') {
            bootsMultiplier = ae.duskMultiplier;     // 0.35
          } else if (time.label === 'Noite') {
            bootsMultiplier = ae.nightMultiplier;    // 0.5
          }
        }

        const effectiveChance = encounter.chancePerPixel * levelPeace * bootsMultiplier;

        encounter.walkedSinceLast += movedDist;
        if (encounter.walkedSinceLast > 200) {
          if (bootsMultiplier === 0) {
            // Bota ativa de dia: nem rola o dado, mas reseta o contador
            encounter.walkedSinceLast = 0;
          } else if (Math.random() < effectiveChance * 200) {
            startBattle({ biomeGX: currentRoom.gx, biomeGY: currentRoom.gy });
            encounter.walkedSinceLast = 0;
          } else {
            encounter.walkedSinceLast = 0;
          }
        }
      }
    }
  }

  if (transitionCooldown > 0) decrementTransitionCooldown();
  else checkDoorTransition();

  if (currentRoom && !currentRoom.isCity && currentRoom.enemies) {
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

  // Companion (Herbalista) segue o jogador
  if (playerStats._escortActive && playerStats._escortPos) {
    const c = playerStats._escortPos;
    const dx = player.x - c.x;
    const dy = player.y - c.y;
    const dist = Math.hypot(dx, dy);

    // Anti-frustração: se ficar muito longe, teleporta pra trás do jogador
    if (dist > 200) {
      c.x = player.x - 20;
      c.y = player.y;
    } else if (dist > 18) {
      const speed = 2.0; // um pouco mais lento que o player
      c.x += (dx / dist) * speed;
      c.y += (dy / dist) * speed;
    }
  }

  // Não roda em combate (o loop nem chama updatePlayer em combate).
  playerStats._nearInteractable = findNearbyInteractable(currentRoom);
}