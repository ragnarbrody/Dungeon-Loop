import { GRID_SIZE, SPAWN_MARGIN, TILE_SIZE } from '../core/canvas.js';
import { makeRng, seedFrom } from '../core/rng.js';
import { T, DIRS } from './tiles.js';
import { BIOMES, pickBiome } from './biomes.js';
import { worldSeed, setCurrentRoom, markRoomVisited, saveGame, currentRoom, player, setTransitionCooldown, setDungeonRoom } from '../core/state.js';
import { createInterior } from './interiors.js';
import { setMusicMode } from '../audio/audio.js';
import { isQuestActive, areProceduralCavesUnlocked } from '../quests.js';

// ============================================================
// REGRA DE PORTAS
//
// - Recíproca por construção: depende só da chave canônica da borda.
// - Determinística: hash puro, sem Math.random.
// - Anti-frustração: a cada 4 bordas na mesma linha, a posição
//   múltipla de 4 SEMPRE tem porta. Isso garante que nunca há
//   mais de 3 bordas seguidas sem porta em nenhuma direção.
//   (As outras 3 posições do bloco continuam com 70% de chance.)
// ============================================================

const FALLBACK_FIELDS_ENEMIES = ['slime', 'rat', 'goblin'];
const DOOR_BLOCK = 4;          // a cada 4 bordas, pelo menos 1 porta
const DOOR_RAW_CHANCE = 0.7;   // chance base (fora a forçada)
const CAVE_DEPTH = 3;

export const dungeonCache = new Map();
// Exporta o cache para poder ser limpo
export const roomCache = new Map();

// ---------- Lazy loading de dungeons ----------
// Os dados serializados do save ficam guardados aqui até a primeira
// vez que a dungeon for acessada. Isso evita reconstruir no import
// (ciclo de importação state <-> rooms) e deixa `createDungeonInstance`
// rodar só quando `worldSeed` já está disponível.
let _pendingDungeonsData = null;

export function setPendingDungeonsData(data) {
  _pendingDungeonsData = data || null;
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}


function hashRoom(gx, gy, salt = 0) {
  let h = 2166136261 ^ gx;
  h = Math.imul(h, 16777619) ^ gy;
  h = Math.imul(h, 16777619) ^ salt;
  return h >>> 0;
}

// Chave da "borda" entre (gx,gy) e (gx+dx, gy+dy): sempre a mesma pros dois lados
function edgeKey(gx, gy, side) {
  if (side === 'right')  return edgeKey(gx + 1, gy, 'left');
  if (side === 'bottom') return edgeKey(gx, gy + 1, 'top');
  if (side === 'left') return `V:${gx},${gy}`;
  if (side === 'top')  return `H:${gx},${gy}`;
  return `?:${gx},${gy}:${side}`;
}

// Decisão base (sem a regra de bloco)
function edgeHasDoorRaw(key) {
  return hashString(key) < DOOR_RAW_CHANCE;
}

// Decisão final (com a regra de bloco)
function edgeHasDoor(key) {
  // Parse da chave canônica
  const isV = key[0] === 'V';
  const [gxStr, gyStr] = key.slice(2).split(',');
  const gx = parseInt(gxStr, 10);
  const gy = parseInt(gyStr, 10);

  // Índice ao longo da linha (varia perpendicularmente à borda).
  // Para V (borda vertical), a linha é vertical: índice = gy.
  // Para H (borda horizontal), a linha é horizontal: índice = gx.
  const idx = isV ? gy : gx;

  // Posição 0 de cada bloco de 4 SEMPRE tem porta.
  // As outras posições usam o raw.
  const posInBlock = ((idx % DOOR_BLOCK) + DOOR_BLOCK) % DOOR_BLOCK;
  if (posInBlock === 0) return true;

  return edgeHasDoorRaw(key);
}

export function hasDoor(gx, gy, side) {
  if (isCity(gx, gy)) return true;

  const DIRS_LOCAL = {
    top:    { dx: 0,  dy: -1 },
    bottom: { dx: 0,  dy:  1 },
    left:   { dx: -1, dy:  0 },
    right:  { dx: 1,  dy:  0 },
  };
  const d = DIRS_LOCAL[side];
  if (!d) return false;
  if (isCity(gx + d.dx, gy + d.dy)) return true;

  return edgeHasDoor(edgeKey(gx, gy, side));
}

// Gera uma sala de dungeon procedural
function createDungeonRoom(instanceId, depth, seed, maxDepth, isProcedural) {
  const rng = makeRng(seed + depth);
  const mid = Math.floor(GRID_SIZE / 2);
  const map = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) row.push(T.CAVE_FLOOR);
    map.push(row);
  }

  // Bordas
  for (let i = 0; i < GRID_SIZE; i++) {
    map[0][i] = T.WALL;
    map[GRID_SIZE - 1][i] = T.WALL;
    map[i][0] = T.WALL;
    map[i][GRID_SIZE - 1] = T.WALL;
  }

  const isLastRoom = depth === maxDepth - 1;   // ← MOVIDO PRA CIMA

  // Porta de entrada (sempre no topo)
  map[0][mid] = T.DOOR;

  // Porta de saída (pra próxima sala), exceto na última
  // CORREÇÃO: usa isLastRoom (funciona pra procedural E quest)
  if (!isLastRoom) {
    map[GRID_SIZE - 1][mid] = T.DOOR;
  }

  // Inimigos comuns
  const enemies = [];
  if (!isLastRoom) {
    const enemyCount = 2 + Math.min(depth, 3);
    const enemyPool = ['bat', 'slime', 'goblin'];
    for (let i = 0; i < enemyCount; i++) {
      let tx, ty, attempts = 0;
      do {
        tx = 3 + Math.floor(rng() * (GRID_SIZE - 6));
        ty = 3 + Math.floor(rng() * (GRID_SIZE - 6));
        attempts++;
      } while (attempts < 50 && (map[ty][tx] !== T.CAVE_FLOOR || Math.hypot(tx - mid, ty - mid) < 4));
      if (attempts >= 50) continue;

      enemies.push({
        id: enemyPool[Math.floor(rng() * enemyPool.length)],
        tx, ty,
        defeated: false,
      });
    }
  }

  // ---- Última sala: miniboss + recompensa ----
  let cage = null;
  let floorTorch = null;
  let treasureChest = null;
  const roomInteractables = [];

  if (isLastRoom) {
    // Miniboss SEMPRE (quest e procedural) — só UMA vez
    enemies.push({
      id: 'goblin_sergeant',
      tx: mid,
      ty: 10,
      defeated: false,
    });

    if (isProcedural) {
      treasureChest = { tx: mid, ty: GRID_SIZE - 5 };
      map[treasureChest.ty][treasureChest.tx] = T.TREE;
      roomInteractables.push({
        tx: treasureChest.tx,
        ty: treasureChest.ty,
        kind: 'treasure_chest',
        title: 'Baú',
      });
      floorTorch = { tx: mid - 2, ty: GRID_SIZE - 5 };
    } else if (instanceId === 'cave_quest_5_2') {
      cage = { tx: mid, ty: GRID_SIZE - 5 };
      map[cage.ty][cage.tx] = T.TREE;
      roomInteractables.push({ tx: cage.tx, ty: cage.ty, kind: 'caged_villager', title: 'Jaula' });
      floorTorch = { tx: mid - 2, ty: GRID_SIZE - 5 };
    }
  }

  // Decoração (pedras)
  // IMPORTANTE: inclui baú e jaula no set de ocupados, senão uma pedra
  // pode nascer no mesmo tile e bloquear a interação.
  const occupied = new Set(enemies.map(e => `${e.tx},${e.ty}`));
  function reserveAround(t, r) {
    if (!t) return;
    occupied.add(`${t.tx},${t.ty}`);
    occupied.add(`${t.tx - 1},${t.ty}`);
    occupied.add(`${t.tx + 1},${t.ty}`);
    occupied.add(`${t.tx},${t.ty - 1}`);
    occupied.add(`${t.tx},${t.ty + 1}`);
  }
  reserveAround(treasureChest);
  reserveAround(cage);
  const numRocks = 5 + Math.floor(rng() * 5);
  for (let i = 0; i < numRocks; i++) {
    const tx = 2 + Math.floor(rng() * (GRID_SIZE - 4));
    const ty = 2 + Math.floor(rng() * (GRID_SIZE - 4));
    if (map[ty][tx] !== T.CAVE_FLOOR) continue;
    if (Math.hypot(tx - mid, ty - mid) <= 3) continue;
    if (occupied.has(`${tx},${ty}`)) continue;
    if (Math.abs(tx - mid) <= 1) continue;
    map[ty][tx] = T.TREE;
  }

  const depthLabel = depth + 1;
  const name = isProcedural
    ? `Caverna - Profundidade ${depthLabel}`
    : (instanceId === 'cave_quest_5_2'
        ? `Caverna Sombria - Profundidade ${depthLabel}`
        : `Caverna (${instanceId}) - Profundidade ${depthLabel}`);

  return {
    map,
    doors: ['top', ...(!isLastRoom ? ['bottom'] : [])],
    biomeId: 'cave',
    nameCoords: '',
    isDungeon: true,
    dungeonId: instanceId,
    dungeonDepth: depth,
    dungeonMaxDepth: maxDepth,
    name,
    enemies,
    hasTrees: false,
    reserved: new Set(),
    interactables: roomInteractables,
    cage,
    treasureChest,
    floorTorch,
  };
}

export function enterDungeon(instanceId, opts = {}) {
  _hydrateDungeonIfNeeded(instanceId);   // ← NOVO
  let dungeon = dungeonCache.get(instanceId);
  if (!dungeon) {
    const seed = seedFrom(instanceId.length, instanceId.charCodeAt(0) + worldSeed);
    dungeon = createDungeonInstance(instanceId, seed, opts);
  }

  if (!dungeon || !dungeon.rooms || !dungeon.rooms.get(0)) {
    console.error('Falha ao criar dungeon:', instanceId);
    return;
  }

  const entryRoom = dungeon.rooms.get(0);
  
  // Usa setDungeonRoom para não mexer em startGX/startGY
  setDungeonRoom(entryRoom);

  // troca pra música de caverna já na entrada
  setMusicMode('cave');

  const mid = Math.floor(GRID_SIZE / 2);
  player.x = mid * TILE_SIZE + TILE_SIZE / 2;
  player.y = 3 * TILE_SIZE + TILE_SIZE / 2

  setTransitionCooldown(30);
  saveGame();
}

// ============================================================
// CIDADES — salas fixas, sem inimigos, com layout memorável
// ============================================================

// Lista de cidades conhecidas (facilita o minimapa)
export const CITY_COORDS = new Set(['0,0']);

export function isCity(gx, gy) {
  return CITY_COORDS.has(`${gx},${gy}`);
}

function createCity(gx, gy) {
  const map = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) row.push(T.FLOOR);
    map.push(row);
  }

  // Bordas (muro)
  for (let i = 0; i < GRID_SIZE; i++) {
    map[0][i] = T.WALL;
    map[GRID_SIZE - 1][i] = T.WALL;
    map[i][0] = T.WALL;
    map[i][GRID_SIZE - 1] = T.WALL;
  }

  // 4 portas (nas 4 direções, sempre abertas)
  const mid = Math.floor(GRID_SIZE / 2);
  const doors = ['top', 'bottom', 'left', 'right'];
  for (let x = mid - 1; x <= mid + 1; x++) {
    map[0][x] = T.DOOR;
    map[GRID_SIZE - 1][x] = T.DOOR;
  }
  for (let y = mid - 1; y <= mid + 1; y++) {
    map[y][0] = T.DOOR;
    map[y][GRID_SIZE - 1] = T.DOOR;
  }

  // ---- Declara AQUI as constantes compartilhadas ----
  const mid2 = Math.floor(GRID_SIZE / 2);
  const STREET_HALF_HEIGHT = 1;

  // ============================================================
  // PRÉDIOS (5 prédios: ferreiro, herbalista, armeiro, joalheiro, quest giver)
  // Cada prédio é um retângulo 3x2 de T.HOUSE (bloqueia passagem)
  // ============================================================
  const cityObjects = [
    // Placa à ESQUERDA da porta, 1 tile abaixo da casa
    { id: 'blacksmith',  name: 'Ferreiro',    tx: 4,  ty: 5,  w: 5, h: 3, signTx: 4,  signTy: 8  }, // porta em tx:6
    { id: 'herbalist',   name: 'Herbalista',  tx: 21, ty: 5,  w: 5, h: 3, signTx: 21, signTy: 8  }, // porta em tx:23
    { id: 'armorer',     name: 'Armeiro',     tx: 4,  ty: 21, w: 5, h: 3, signTx: 4,  signTy: 24 }, // porta em tx:6
    { id: 'jeweler',     name: 'Joalheiro',   tx: 21, ty: 21, w: 5, h: 3, signTx: 21, signTy: 24 }, // porta em tx:23
    { id: 'quest_giver', name: 'Ancião',      tx: 13, ty: 22, w: 5, h: 3, signTx: 13, signTy: 25 }, // porta em tx:15
  ];

  for (const obj of cityObjects) {
    for (let y = obj.ty; y < obj.ty + obj.h; y++) {
      for (let x = obj.tx; x < obj.tx + obj.w; x++) {
        if (y >= 0 && y < GRID_SIZE && x >= 0 && x < GRID_SIZE) {
          map[y][x] = T.HOUSE;
        }
      }
    }
  }

  // ============================================================
  // CAMINHOS até as portas das casas
  // 1 tile de largura, alinhado com a porta visual (centro da casa).
  // Casas ACIMA da rua: caminho desce da base até a rua.
  // Casas ABAIXO da rua: caminho sobe do topo da casa até a rua.
  // ============================================================
  for (const obj of cityObjects) {
    // Centro da porta (em coords de tile)
    const doorTx = obj.tx + Math.floor((obj.w - 1) / 2);

    // Topo e base da casa (em tiles)
    const houseTopTy = obj.ty;
    const houseBotTy = obj.ty + obj.h;

    const streetTop = mid2 - STREET_HALF_HEIGHT;
    const streetBot = mid2 + STREET_HALF_HEIGHT;

    if (houseBotTy <= streetTop) {
      // Casa está ACIMA da rua: desce da base da casa até a rua
      for (let y = houseBotTy; y < streetTop; y++) {
        if (map[y][doorTx] === T.FLOOR || map[y][doorTx] === T.CITY_FLOOR) {
          map[y][doorTx] = T.STREET;
        }
      }
    } else if (houseTopTy > streetBot) {
      // Casa está ABAIXO da rua: sobe do topo da casa até a rua
      for (let y = streetBot + 1; y < houseTopTy; y++) {
        if (map[y][doorTx] === T.FLOOR || map[y][doorTx] === T.CITY_FLOOR) {
          map[y][doorTx] = T.STREET;
        }
      }
    }
  }

  // ============================================================
  // RUAS PRINCIPAIS
  // Calculadas primeiro, pra depois a praça sobrescrever.
  // ============================================================
  const streetTop = mid2 - STREET_HALF_HEIGHT;
  const streetBot = mid2 + STREET_HALF_HEIGHT;

  // Pinta a rua de T.STREET em todo o chão livre (T.FLOOR)
  for (let dy = -STREET_HALF_HEIGHT; dy <= STREET_HALF_HEIGHT; dy++) {
    const y = mid2 + dy;
    if (y < 0 || y >= GRID_SIZE) continue;
    
    for (let x = 1; x < GRID_SIZE - 1; x++) {
      if (map[y][x] === T.FLOOR) {
        map[y][x] = T.STREET;
      }
    }
  }

  // ============================================================
  // PRAÇA + PORTAL
  // A praça sobrescreve a rua, criando o visual de "rua -> praça -> rua".
  // ============================================================
  const plazaRadius = 5;
  const innerPlazaRadius = 2;

  for (let y = mid2 - plazaRadius; y <= mid2 + plazaRadius; y++) {
    for (let x = mid2 - plazaRadius; x <= mid2 + plazaRadius; x++) {
      if (y < 0 || y >= GRID_SIZE || x < 0 || x >= GRID_SIZE) continue;

      const dx = x - mid2;
      const dy = y - mid2;
      const distSq = dx * dx + dy * dy;

      // Se está dentro do raio da praça, a praça manda.
      if (distSq <= innerPlazaRadius * innerPlazaRadius) {
        map[y][x] = T.PLAZA;
      } else if (distSq <= plazaRadius * plazaRadius) {
        const outerRingInner = (plazaRadius - 1) * (plazaRadius - 1);
        if (distSq >= outerRingInner) {
          map[y][x] = T.PLAZA;  // anel externo
        } else {
          map[y][x] = T.FLOOR;  // miolo (grama)
        }
      }
    }
  }

  // Portal (1x1) no centro exato (sobrescreve praça/rua)
  const portal = { tx: mid2, ty: mid2, w: 1, h: 1 };
  map[portal.ty][portal.tx] = T.PORTAL;

  // ============================================================
  // ÁRVORES decorativas espalhadas (fora da praça e das ruas)
  // ============================================================
  const treeRng = makeRng(seedFrom(gx + 1337, gy + 7331));
  const numCityTrees = 14 + Math.floor(treeRng() * 8); // 14 a 21
  let cityTreesPlaced = 0, cityTreesAttempts = 0;

  while (cityTreesPlaced < numCityTrees && cityTreesAttempts < 400) {
    cityTreesAttempts++;
    const tx = 2 + Math.floor(treeRng() * (GRID_SIZE - 4));
    const ty = 2 + Math.floor(treeRng() * (GRID_SIZE - 4));

    if (map[ty][tx] !== T.FLOOR) continue;
    // Não plantar em cima da rua
    if (ty >= mid2 - 2 && ty <= mid2 + 2) continue; // rua + folga
    // Não plantar na praça
    const dx = tx - mid2, dy = ty - mid2;
    if (dx * dx + dy * dy <= (plazaRadius + 1) * (plazaRadius + 1)) continue;
    // Não plantar colado em casas (pra não cobrir as portas)
    let nearHouse = false;
    for (const obj of cityObjects) {
      if (tx >= obj.tx - 1 && tx <= obj.tx + obj.w &&
          ty >= obj.ty - 1 && ty <= obj.ty + obj.h + 1) {
        nearHouse = true;
        break;
      }
    }
    if (nearHouse) continue;
    // Não plantar em cima dos spawn (reserved não foi feito ainda; usa raio)
    if (Math.hypot(tx - 3, ty - mid2) < 3) continue;

    map[ty][tx] = T.TREE;
    cityTreesPlaced++;
  }

  const reserved = new Set();
  // reserva área de spawn (entrada esquerda)
  for (let dx = -1; dx <= 3; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      reserved.add(`${3 + dx},${mid + dy}`);
    }
  }
  // reserva também o centro (por segurança)
  for (let y = mid - 2; y <= mid + 2; y++) {
    for (let x = mid - 2; x <= mid + 2; x++) {
      reserved.add(`${x},${y}`);
    }
  }

  return {
    gx, gy,
    map,
    doors,
    biomeId: 'fields', // usado só pra paleta das paredes; cidade tem paleta própria
    name: 'Cidade de Aethel',
    nameCoords: `${gx}, ${gy}`,
    isCity: true,
    cityObjects,
    portal,
    reserved,
    enemies: [], // cidade NUNCA tem inimigos
    hasTrees: true,
  };
}

export function createRoom(gx, gy) {

  // Cidade? Retorna sala fixa.
  if (isCity(gx, gy)) {
    return createCity(gx, gy);
  }
  const rng = makeRng(seedFrom(gx + worldSeed, gy));
  const map = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) row.push(T.FLOOR);
    map.push(row);
  }

  // Bordas
  for (let i = 0; i < GRID_SIZE; i++) {
    map[0][i] = T.WALL;
    map[GRID_SIZE - 1][i] = T.WALL;
    map[i][0] = T.WALL;
    map[i][GRID_SIZE - 1] = T.WALL;
  }

  // Portas
  const allSides = ['top', 'bottom', 'left', 'right'];
  const doors = allSides.filter(side => hasDoor(gx, gy, side));

  // Garantia: pelo menos uma porta (senão a sala é inacessível)
  if (doors.length === 0) {
    // força "left" (sempre tem vizinha a oeste) — ou sorteia 1
    doors.push('left');
  }

  const mid = Math.floor(GRID_SIZE / 2);
  const carve = (side) => {
    if (side === 'top')    for (let x = mid - 1; x <= mid + 1; x++) map[0][x] = T.DOOR;
    if (side === 'bottom') for (let x = mid - 1; x <= mid + 1; x++) map[GRID_SIZE - 1][x] = T.DOOR;
    if (side === 'left')   for (let y = mid - 1; y <= mid + 1; y++) map[y][0] = T.DOOR;
    if (side === 'right')  for (let y = mid - 1; y <= mid + 1; y++) map[y][GRID_SIZE - 1] = T.DOOR;
  };
  doors.forEach(carve);

  // Reserva a área central de spawn (onde o jogador pode nascer ao entrar por portas)
  const reserved = new Set();
  const key = (x, y) => `${x},${y}`;

  // 1. Reserva das portas (como já estava)
  for (const s of doors) {
    const sidesToReserve = [s, DIRS[s].opposite];
    for (const sd of sidesToReserve) {
      for (let m = 1; m <= SPAWN_MARGIN + 1; m++) {
        if (sd === 'top' || sd === 'bottom') {
          const yy = (sd === 'top') ? m : GRID_SIZE - 1 - m;
          for (let x = mid - 2; x <= mid + 2; x++) reserved.add(key(x, yy));
        } else {
          const xx = (sd === 'left') ? m : GRID_SIZE - 1 - m;
          for (let y = mid - 2; y <= mid + 2; y++) reserved.add(key(xx, y));
        }
      }
    }
  }

  // 2. Reserva o centro exato (onde o jogador nasce no começo do jogo)
  // Um quadrado de 5x5 no centro
  for (let y = mid - 2; y <= mid + 2; y++) {
    for (let x = mid - 2; x <= mid + 2; x++) {
      reserved.add(key(x, y));
    }
  }

  // 3. Coloca "obstáculos" conforme o bioma
  //    - fields: árvores (T.TREE)
  //    - desert: cactos (também T.TREE — colidem e ocupam o tile; só o sprite muda)
  const placedTrees = [];
  const biomeId = pickBiome(gx, gy);
  const biome = BIOMES[biomeId];
  const hasTrees = biomeId === 'fields';

  if (biome.trees || biomeId === 'desert') {
    // Desert usa cactos, então também spawna "obstáculos", mas com outra densidade.
    const numTrees = biomeId === 'desert'
      ? 4 + Math.floor(rng() * 6)      // deserto: 4 a 9 cactos
      : 8 + Math.floor(rng() * 12);    // campo: 8 a 19 árvores

    const centerX = mid, centerY = mid;
    let placed = 0, attempts = 0;
    while (placed < numTrees && attempts < 300) {
      attempts++;
      const x = 2 + Math.floor(rng() * (GRID_SIZE - 4));
      const y = 2 + Math.floor(rng() * (GRID_SIZE - 4));

      const dist = Math.hypot(x - centerX, y - centerY);
      if (dist < 5) continue;

      let nearDoor = false;
      if (doors.includes('top')    && y <= 3 && Math.abs(x - mid) <= 3) nearDoor = true;
      if (doors.includes('bottom') && y >= GRID_SIZE - 4 && Math.abs(x - mid) <= 3) nearDoor = true;
      if (doors.includes('left')   && x <= 3 && Math.abs(y - mid) <= 3) nearDoor = true;
      if (doors.includes('right')  && x >= GRID_SIZE - 4 && Math.abs(y - mid) <= 3) nearDoor = true;
      if (nearDoor) continue;

      let tooClose = false;
      for (const t of placedTrees) {
        if (Math.hypot(x - t.x, y - t.y) < 2.5) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      if (map[y][x] === T.FLOOR && !reserved.has(key(x, y))) {
        map[y][x] = T.TREE; // reaproveita o tipo "obstáculo"
        placedTrees.push({ x, y });
        placed++;
      }
    }
  }

  const roomEnemies = [];
  const enemiesPool = (biome.enemies && biome.enemies.length > 0)
    ? biome.enemies
    : (biomeId === 'fields' ? FALLBACK_FIELDS_ENEMIES : []);
  // Se o bioma não tem inimigos definidos, ele fica vazio (ex: deserto por enquanto)

  const numMapEnemies = enemiesPool.length > 0
    ? 1 + Math.floor(rng() * 3)
    : 0;

  for (let i = 0; i < numMapEnemies; i++) {
    let tx, ty, attempts = 0;
    while (attempts < 40) {
      attempts++;
      tx = 3 + Math.floor(rng() * (GRID_SIZE - 6));
      ty = 3 + Math.floor(rng() * (GRID_SIZE - 6));
      if (map[ty][tx] !== T.FLOOR) continue;
      if (reserved.has(`${tx},${ty}`)) continue;
      if (Math.hypot(tx - mid, ty - mid) < 4) continue; // não muito perto do spawn
      const tooClose = roomEnemies.some(e => Math.hypot(e.tx - tx, e.ty - ty) < 3);
      if (tooClose) continue;
      break;
    }
    if (attempts >= 40) continue;
    roomEnemies.push({
      id: enemiesPool[Math.floor(rng() * enemiesPool.length)],
      tx, ty,
      defeated: false,
    });
  }

  // ---- Sala especial: mochila do aldeão perdido ----
  // (só existe em gx=-2, gy=-4)
  let interactables = [];
  if (gx === -2 && gy === -4) {
    // Coloca a mochila em um tile fixo perto do centro, sem colidir com árvores.
    const mid = Math.floor(GRID_SIZE / 2);
    let packTx = mid;
    let packTy = mid;
    if (map[packTy]?.[packTx] === T.TREE) {
      const candidates = [
        [mid + 1, mid], [mid - 1, mid], [mid, mid + 1], [mid, mid - 1],
      ];
      for (const [cx, cy] of candidates) {
        if (map[cy]?.[cx] === T.FLOOR) { packTx = cx; packTy = cy; break; }
      }
    }
    reserved.add(`${packTx},${packTy}`);

    interactables.push({
      tx: packTx, ty: packTy,
      kind: 'lost_backpack',
      title: 'Mochila Abandonada',
    });
  }

  // ---- Sala especial: entrada da caverna (quest 5.2) ----
  // Só existe se a quest 'story_cave' estiver ativa no momento da geração.
  // Quando a quest for concluída, a caverna "desaparece" (o tile e o
  // interactable são removidos da sala em memória — ver clearCave).
  if (gx === -2 && gy === 8 && isQuestActive('story_cave')) {
    const mid = Math.floor(GRID_SIZE / 2);
    let caveTx = mid, caveTy = mid;
    
    // Verifica se o centro está livre (usando a convenção correta map[Y][X])
    if (map[caveTy]?.[caveTx] !== T.FLOOR) {
      const candidates = [
        [mid+1, mid], [mid-1, mid], [mid, mid+1], [mid, mid-1],
        [mid+2, mid], [mid-2, mid], [mid, mid+2], [mid, mid-2],
      ];
      for (const [cx, cy] of candidates) {
        if (map[cy]?.[cx] === T.FLOOR) { caveTx = cx; caveTy = cy; break; }
      }
    }
    
    // CORREÇÃO: O mapa é acessado por map[Y][X], então deve ser caveTy primeiro!
    map[caveTy][caveTx] = T.CAVE_ENTRANCE; 
    reserved.add(`${caveTx},${caveTy}`);

    // Garante que a entrada seja acessível: limpa os tiles vizinhos
    // (se forem árvores) para o jogador poder chegar perto.
    const neighbors = [
      [caveTx-1, caveTy], [caveTx+1, caveTy],
      [caveTx, caveTy-1], [caveTx, caveTy+1],
    ];
    for (const [nx, ny] of neighbors) {
      if (map[ny]?.[nx] === T.TREE) map[ny][nx] = T.FLOOR;
    }

    interactables.push({
      tx: caveTx, ty: caveTy,
      kind: 'cave_entrance',
      title: 'Caverna Sombria',
      text: 'Uma fenda escura na rocha. Um vento frio sai de dentro.',
    });
  }

  // ---- Caverna procedural (pós-quest 5.2) ----
  // Aparece em ~8% das salas do anel externo (Campos), longe de Aethel.
  // NÃO aparece na sala da caverna da quest (-2,8), nem perto da cidade.
  if (
    areProceduralCavesUnlocked() &&
    biomeId === 'fields' &&
    !(gx === -2 && gy === 8) &&           // não colide com a caverna da quest
    Math.hypot(gx, gy) > 2 &&             // longe de Aethel
    !interactables.some(it => it.kind === 'cave_entrance')
  ) {
    const caveRoll = rng();               // usa o RNG seedado da sala (determinístico)
    if (caveRoll < 0.20) {
      // Acha um tile FLOOR livre, longe do centro e das portas
      const mid = Math.floor(GRID_SIZE / 2);
      let caveTx = -1, caveTy = -1;
      for (let attempt = 0; attempt < 40; attempt++) {
        const tx = 3 + Math.floor(rng() * (GRID_SIZE - 6));
        const ty = 3 + Math.floor(rng() * (GRID_SIZE - 6));
        if (map[ty][tx] !== T.FLOOR) continue;
        if (reserved.has(`${tx},${ty}`)) continue;
        if (Math.hypot(tx - mid, ty - mid) < 4) continue;
        caveTx = tx; caveTy = ty;
        break;
      }
      if (caveTx >= 0) {
        map[caveTy][caveTx] = T.CAVE_ENTRANCE;
        reserved.add(`${caveTx},${caveTy}`);
        // limpa vizinhos se forem árvores
        for (const [nx, ny] of [[caveTx-1,caveTy],[caveTx+1,caveTy],[caveTx,caveTy-1],[caveTx,caveTy+1]]) {
          if (map[ny]?.[nx] === T.TREE) map[ny][nx] = T.FLOOR;
        }
        interactables.push({
          tx: caveTx, ty: caveTy,
          kind: 'cave_entrance',
          title: 'Caverna',
          text: 'Uma fenda escura na terra. O ar sai frio de dentro.',
          // marca como procedural pra lógica de entrada saber
          procedural: true,
        });
      }
    }
  }

  return {
    gx, gy, map, doors, biomeId,
    name: biome.name,
    nameCoords: `${gx}, ${gy}`,
    reserved,
    enemies: roomEnemies,
    hasTrees,
    interactables,
  };
}

// Exporta a função de limpar o cache
export function clearRoomCache() {
  roomCache.clear();
}

export function getRoom(gx, gy) {
  const key = `${gx},${gy}`;
  if (!roomCache.has(key)) {
    roomCache.set(key, createRoom(gx, gy));
  }
  return roomCache.get(key);
}

export function getCitySpawn() {
  const mid = Math.floor(GRID_SIZE / 2);
  return { tx: 3, ty: mid };  // logo à direita da porta esquerda
}

// Chave: `${gx},${gy},${buildingId}`
export const interiorCache = new Map();
export function getInterior(gx, gy, buildingId) {
  const key = `${gx},${gy},${buildingId}`;
  if (!interiorCache.has(key)) {
    interiorCache.set(key, createInterior(buildingId, gx, gy));
  }
  return interiorCache.get(key);
}

export function enterBuilding(buildingId) {
  if (!currentRoom) return;
  if (currentRoom.isDungeon || currentRoom.isInterior) return;

  const gx = currentRoom.gx, gy = currentRoom.gy;

  // Acha o cityObject para saber a tile da porta (mesma usada em getInteractables)
  const obj = currentRoom.cityObjects?.find(o => o.id === buildingId);
  const doorTx = obj ? obj.tx + Math.floor(obj.w / 2) : Math.floor(GRID_SIZE / 2);
  const doorTy = obj ? obj.ty + obj.h : Math.floor(GRID_SIZE / 2);

  const interior = getInterior(gx, gy, buildingId);
  interior._returnRoom = currentRoom;
  interior._returnGx = gx;
  interior._returnGy = gy;
  interior._returnDoor = { tx: doorTx, ty: doorTy };  // ← NOVO

  setCurrentRoom(interior);
  setMusicMode('aethel');  // interior de Aethel — mesma trilha calma

  // Spawn perto da porta inferior do interior
  const mid = Math.floor(interior.cols / 2);
  player.x = mid * TILE_SIZE + TILE_SIZE / 2;
  player.y = (interior.rows - 2) * TILE_SIZE + TILE_SIZE / 2;
  saveGame();
}

// ============================================================
// Remove a caverna da sala (se ela estiver no cache).
// Chamado quando a quest 'story_cave' é concluída, pra que a
// entrada desapareça do mapa. Se o jogador voltar à sala, ela
// é regenerada sem a caverna.
// ============================================================
export function clearCave() {
  const key = '-2,8';
  const room = roomCache.get(key);
  if (!room) return;

  // Remove o tile CAVE_ENTRANCE do mapa (volta a ser FLOOR)
  for (let y = 0; y < room.map.length; y++) {
    for (let x = 0; x < room.map[y].length; x++) {
      if (room.map[y][x] === T.CAVE_ENTRANCE) {
        room.map[y][x] = T.FLOOR;
      }
    }
  }

  // Remove o interactable
  if (room.interactables) {
    room.interactables = room.interactables.filter(it => it.kind !== 'cave_entrance');
  }
}

// Gera uma dungeon procedural e a armazena no cache.
// Retorna a sala de entrada da dungeon.
export function createDungeonInstance(instanceId, seed, opts = {}) {
  const isProcedural = opts.procedural === true;
  const depth = isProcedural ? 4 + (seed % 2) : 3;  // 4 ou 5 salas
  const dungeon = {
    id: instanceId,
    seed,
    rooms: new Map(),
    depth,
    procedural: isProcedural,
  };

  for (let d = 0; d < depth; d++) {
    const room = createDungeonRoom(instanceId, d, seed, depth, isProcedural);
    dungeon.rooms.set(d, room);
  }

  dungeonCache.set(instanceId, dungeon);
  return dungeon;
}

// ============================================================
// SERIALIZAÇÃO DAS DUNGEONS
// Só o que precisa persistir entre sessões:
//   - quais inimigos já foram derrotados (por tx,ty)
//   - se o baú já foi aberto
//   - se a jaula já foi aberta
// (O mapa em si é regenerado igual, porque o seed é determinístico.)
// ============================================================
export function serializeDungeons() {
  const out = {};
  for (const [id, dungeon] of dungeonCache) {
    const rooms = [];
    for (const [depth, room] of dungeon.rooms) {
      rooms.push({
        depth,
        defeatedEnemies: (room.enemies || [])
          .filter(e => e.defeated)
          .map(e => `${e.tx},${e.ty}`),
        chestOpened: room._chestOpened === true,
        cageOpened: room._cageOpened === true,
      });
    }
    out[id] = {
      id: dungeon.id,
      seed: dungeon.seed,
      depth: dungeon.depth,
      procedural: dungeon.procedural === true,
      rooms,
    };
  }
  return out;
}

export function loadDungeons(data) {
  // Mantido pra compat, mas agora só delega pro lazy.
  setPendingDungeonsData(data);
}

// Reconstrói uma dungeon a partir dos dados pendentes, se ainda não
// está no cache.
function _hydrateDungeonIfNeeded(id) {
  if (dungeonCache.has(id)) return;
  if (!_pendingDungeonsData) return;
  const d = _pendingDungeonsData[id];
  if (!d || !Array.isArray(d.rooms)) return;

  // Reconstrói com o MESMO seed
  const dungeon = createDungeonInstance(d.id, d.seed, {
    procedural: d.procedural === true,
  });

  // Aplica estado persistido
  for (const r of d.rooms) {
    const room = dungeon.rooms.get(r.depth);
    if (!room) continue;

    const defeatedSet = new Set(r.defeatedEnemies || []);
    for (const e of room.enemies || []) {
      if (defeatedSet.has(`${e.tx},${e.ty}`)) e.defeated = true;
    }
    if (r.chestOpened) room._chestOpened = true;
    if (r.cageOpened)  room._cageOpened = true;
  }

  // Remove dos pendentes (já está no cache)
  delete _pendingDungeonsData[id];
}

// Substitui o uso direto de `dungeonCache.get(id)` no `enterDungeon`
// e no `player.js` (via um getter).
export function getDungeon(id) {
  _hydrateDungeonIfNeeded(id);
  return dungeonCache.get(id);
}