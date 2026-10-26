import { GRID_SIZE, TILE_SIZE } from '../core/canvas.js';
import { T } from './tiles.js';

// Layout padrão: sala 30x30 com paredes, porta de saída embaixo,
// mesa + NPC no centro-alto.
export function createInterior(buildingId, gx, gy) {
  const map = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) row.push(T.FLOOR);
    map.push(row);
  }

  // Paredes (borda)
  for (let i = 0; i < GRID_SIZE; i++) {
    map[0][i] = T.WALL;
    map[GRID_SIZE - 1][i] = T.WALL;
    map[i][0] = T.WALL;
    map[i][GRID_SIZE - 1] = T.WALL;
  }

  // Porta de saída (embaixo, centro)
  const mid = Math.floor(GRID_SIZE / 2);
  for (let x = mid - 1; x <= mid + 1; x++) {
    map[GRID_SIZE - 1][x] = T.DOOR;
  }

  // Mesa (bloco 3x1 de HOUSE) + NPC atrás
  const tableY = 10;
  const tableX = mid - 1;
  for (let x = tableX; x < tableX + 3; x++) {
    map[tableY][x] = T.HOUSE; // reutiliza HOUSE como "obstáculo sólido"
  }

  // NPC posicionado atrás da mesa
  const npc = {
    id: buildingId,
    tx: mid,
    ty: tableY - 1,
  };

  return {
    gx, gy,
    map,
    doors: ['bottom'],
    biomeId: 'interior',
    name: 'Interior',
    nameCoords: `${gx}, ${gy}`,
    isInterior: true,
    buildingId,
    npc,
    reserved: new Set(),
    enemies: [],
    // Portal/mesa sinalizador
    tableTiles: [{ tx: tableX, ty: tableY, w: 3, h: 1 }],
  };
}