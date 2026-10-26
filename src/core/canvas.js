export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d');

export const GRID_SIZE = 30;
export const TILE_SIZE = 20;
export const CANVAS_W = GRID_SIZE * TILE_SIZE;
export const CANVAS_H = GRID_SIZE * TILE_SIZE;

export const SPAWN_MARGIN = 3;