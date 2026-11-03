// src/sprites/tent.js
// Tenda do acampamento (2x2 tiles = 40x40 px).
// Uma tenda simples de lona, com "porta" escura e uma estaca.

const S = 40;

export const tentFrames = (() => {
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

  // Sombra no chão
  g.fillStyle = 'rgba(0,0,0,0.3)';
  g.beginPath();
  g.ellipse(S / 2, S - 3, S * 0.42, 4, 0, 0, Math.PI * 2);
  g.fill();

  // Base da tenda (fina, 6px)
  const baseY = S - 10;
  p(4, baseY, S - 8, 6, '#a8845a');
  p(4, baseY, S - 8, 1, '#c4a06a');       // brilho no topo da base
  p(4, baseY + 5, S - 8, 1, '#7a5a30');   // sombra na base

  // Pirâmide (começa ACIMA da base)
  // Lado esquerdo (mais claro, luz batendo)
  g.fillStyle = '#c4a06a';
  g.beginPath();
  g.moveTo(S / 2, 2);
  g.lineTo(4, baseY);
  g.lineTo(S / 2, baseY);
  g.closePath();
  g.fill();
  // Lado direito (mais escuro)
  g.fillStyle = '#8a6a40';
  g.beginPath();
  g.moveTo(S / 2, 2);
  g.lineTo(S - 4, baseY);
  g.lineTo(S / 2, baseY);
  g.closePath();
  g.fill();

  // "Porta" (abertura escura no centro, mais estreita)
  g.fillStyle = '#1a0f08';
  g.beginPath();
  g.moveTo(S / 2, 10);
  g.lineTo(S / 2 - 4, baseY);
  g.lineTo(S / 2 + 4, baseY);
  g.closePath();
  g.fill();

  // Estaca no topo
  p(S / 2 - 1, 0, 2, 4, '#5a3a1a');

  // Corda da estaca até o chão (2 linhas diagonais)
  g.strokeStyle = '#3a2410';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(S / 2, 4);
  g.lineTo(S / 2 - 8, baseY);
  g.stroke();

  return [c];
})();