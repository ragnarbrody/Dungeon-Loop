// src/sprites/campfire.js
// Fogueira do acampamento (quest story_banner).
// O sprite ocupa 2×2 tiles (40×40 px). Desenhado a partir do canto
// superior-esquerdo do tile do `floorTorch`.
//
// Tem 2 frames: apagada (cinzas) e acesa (chama viva, 2 fases de flicker).

const S = 40;

function drawRocks(p) {
  // Pedras em círculo (base) — 8 pedras em volta
  const rocks = [
    [4, 26], [12, 30], [24, 31], [32, 26],   // frente
    [6, 16], [30, 16],                       // trás
    [14, 12], [22, 12],                       // topo
  ];
  for (const [x, y] of rocks) {
    p(x, y, 6, 4, '#4a4a52');       // corpo
    p(x, y, 4, 2, '#6a6a72');       // brilho
    p(x + 1, y + 3, 4, 1, '#2a2a32'); // sombra
  }
}

function makeApagada() {
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  drawRocks(p);

  // Troncos cruzados (queimados, escuros)
  p(10, 22, 20, 3, '#2a1a10');
  p(18, 16, 3, 10, '#2a1a10');
  p(14, 18, 10, 3, '#3a2a1a');
  p(10, 25, 20, 1, '#1a0a05');

  // Cinzas (pontinhos cinza-claro)
  p(15, 23, 2, 1, '#6a6a72');
  p(20, 22, 1, 1, '#5a5a62');
  p(23, 23, 2, 1, '#7a7a82');
  p(17, 24, 1, 1, '#4a4a52');

  return c;
}

function makeAcesa(phase) {
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  drawRocks(p);

  // Troncos cruzados (mesmos, com brasa vermelha)
  p(10, 22, 20, 3, '#2a1a10');
  p(18, 16, 3, 10, '#2a1a10');
  p(14, 18, 10, 3, '#3a2a1a');
  // Brasas
  p(11, 23, 2, 1, '#c93010');
  p(16, 22, 1, 1, '#ff5a1a');
  p(24, 23, 2, 1, '#c93010');

  // Chama — mais alta e "viva"
  const h = phase === 0 ? 16 : 13;
  const cx = 20;   // centro X
  const baseY = 22;

  // Chama externa (laranja escuro)
  p(cx - 7, baseY - h + 4, 14, h - 4, '#ff7a1a');
  p(cx - 5, baseY - h + 1, 10, h - 1, '#ff7a1a');
  // Chama média (laranja claro)
  p(cx - 5, baseY - h + 4, 10, h - 4, '#ffa030');
  p(cx - 3, baseY - h + 2, 6, h - 2, '#ffa030');
  // Chama interna (amarelo)
  p(cx - 4, baseY - h + 5, 8, h - 5, '#ffc030');
  p(cx - 2, baseY - h + 3, 4, h - 3, '#ffc030');
  // Núcleo branco (pequeno)
  p(cx - 2, baseY - h + 7, 4, h - 7, '#fff5c0');
  p(cx - 1, baseY - h + 8, 2, h - 8, '#ffffff');

  // Faíscas subindo
  p(cx - 9, baseY - h - 2, 1, 1, '#ffc030');
  p(cx + 7, baseY - h - 3, 1, 1, '#ff7a1a');
  p(cx - 4, baseY - h - 5, 1, 1, '#fff5c0');
  p(cx + 3, baseY - h - 6, 1, 1, '#ffc030');

  return c;
}

export const campfireFrames = {
  off: [makeApagada()],
  on:  [makeAcesa(0), makeAcesa(1)],
};