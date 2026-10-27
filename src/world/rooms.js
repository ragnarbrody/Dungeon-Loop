import { GRID_SIZE, SPAWN_MARGIN, TILE_SIZE } from '../core/canvas.js';
import { makeRng, seedFrom } from '../core/rng.js';
import { T, DIRS } from './tiles.js';
import { BIOMES, pickBiome } from './biomes.js';
import { worldSeed, setCurrentRoom, markRoomVisited, saveGame, currentRoom, player } from '../core/state.js';
import { createInterior } from './interiors.js';
import { setMusicMode } from '../audio/audio.js';

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

  // 2. NOVO: Reserva o centro exato (onde o jogador nasce no começo do jogo)
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

// Exporta o cache para poder ser limpo
export const roomCache = new Map();

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