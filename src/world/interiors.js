import { TILE_SIZE } from '../core/canvas.js';
import { T } from './tiles.js';

const INTERIOR_COLS = 9;
const INTERIOR_ROWS = 9;

// Mapeamento buildingId -> id do NPC (para o sprite)
const NPC_FOR_BUILDING = {
  herbalist: 'herbalist',
  quest_giver: 'elder',
};

export function createInterior(buildingId, gx, gy) {
  const cols = INTERIOR_COLS;
  const rows = INTERIOR_ROWS;
  const map = [];
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) row.push(T.FLOOR);
    map.push(row);
  }

  // Paredes
  for (let i = 0; i < cols; i++) {
    map[0][i] = T.WALL;
    map[rows - 1][i] = T.WALL;
  }
  for (let i = 0; i < rows; i++) {
    map[i][0] = T.WALL;
    map[i][cols - 1] = T.WALL;
  }

  // Porta de saída (centro, embaixo)
  const mid = Math.floor(cols / 2);
  map[rows - 1][mid] = T.DOOR;

  // Mesa (3 tiles, uma linha) — centro
  const tableY = 3;
  for (let dx = -1; dx <= 1; dx++) {
    map[tableY][mid + dx] = T.HOUSE;
  }

  // NPC atrás da mesa
  const npc = {
    id: NPC_FOR_BUILDING[buildingId] || 'herbalist',
    buildingId,
    tx: mid,
    ty: tableY - 1,
  };

  return {
    gx, gy,
    cols, rows,
    map,
    doors: ['bottom'],
    biomeId: 'interior',
    name: buildingId === 'quest_giver' ? 'Salão do Ancião' : 'Interior',
    nameCoords: `${gx}, ${gy}`,
    isInterior: true,
    buildingId,
    npc,
    reserved: new Set(),
    enemies: [],
    hasTrees: false,
  };
}