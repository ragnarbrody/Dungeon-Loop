import { TILE_SIZE } from '../core/canvas.js';

export const T = {
  FLOOR: 0,
  WALL: 1,
  DOOR: 2,
  TREE: 3,
  PORTAL: 4,
  HOUSE: 5,
  CITY_FLOOR: 6,
  FOUNTAIN: 7,
  PLAZA: 8,       // chão de praça (pedra clara)
  STREET: 9,      // rua de terra batida
};

export const DIRS = {
  top:    { dx: 0,  dy: -1, opposite: 'bottom' },
  bottom: { dx: 0,  dy:  1, opposite: 'top'    },
  left:   { dx: -1, dy:  0, opposite: 'right'  },
  right:  { dx: 1,  dy:  0, opposite: 'left'   },
};

export function isSolid(t) {
  return t === T.WALL || t === T.TREE || t === T.HOUSE ||
         t === T.PORTAL || t === T.FOUNTAIN;
}

// tileAt precisa do mapa da sala atual. Recebe o mapa por parâmetro
// para evitar import circular com state.js.
export function tileAt(map, px, py) {
  const tx = Math.floor(px / TILE_SIZE);
  const ty = Math.floor(py / TILE_SIZE);
  const rows = map.length;
  const cols = map[0].length;
  if (ty < 0 || ty >= rows || tx < 0 || tx >= cols) return T.WALL;
  return map[ty][tx];
}