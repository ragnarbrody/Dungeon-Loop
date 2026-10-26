import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { grassTiles } from '../sprites/grass.js';

let menuTime = 0;
const clouds = [
  { x: 100, y: 80, speed: 15, scale: 1 },
  { x: 350, y: 120, speed: 10, scale: 1.5 },
  { x: 500, y: 60, speed: 20, scale: 0.8 }
];
const birds = [
  { x: 0, y: 150, speed: 30, phase: 0 },
  { x: 50, y: 170, speed: 25, phase: 1.5 }
];

const trees = [
  { x: 120, y: 0.7, scale: 0.7 },
  { x: 500, y: 0.75, scale: 0.9 },
  { x: 60,  y: 0.85, scale: 1.3 },
  { x: 560, y: 0.9, scale: 1.6 },
  { x: 220, y: 0.95, scale: 2.0 }
];

// Função para calcular a posição central do rio em uma dada porcentagem Y (0 a 1)
function getRiverPos(t, groundY) {
  // Simula a curva bezier usando interpolação senoidal para simplificar
  const startX = CANVAS_W * 0.45;
  const endX = -50;
  // A curva vai para a direita e depois volta para a esquerda
  const curve = Math.sin(t * Math.PI) * 150; // Fator de curva
  
  const x = startX + (endX - startX) * t + curve * (1 - t);
  const y = groundY + (CANVAS_H - groundY + 50) * t;
  return { x, y };
}

function drawMountains(groundY) {
  ctx.fillStyle = '#5c6b7c'; 
  ctx.beginPath();
  ctx.moveTo(-150, groundY);
  ctx.lineTo(150, groundY - 240);
  ctx.lineTo(450, groundY);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(150, groundY - 240);
  ctx.lineTo(110, groundY - 180);
  ctx.lineTo(130, groundY - 185);
  ctx.lineTo(150, groundY - 170);
  ctx.lineTo(170, groundY - 185);
  ctx.lineTo(190, groundY - 180);
  ctx.fill();

  ctx.fillStyle = '#758598';
  ctx.beginPath();
  ctx.moveTo(250, groundY);
  ctx.lineTo(500, groundY - 180);
  ctx.lineTo(750, groundY);
  ctx.fill();

  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(500, groundY - 180);
  ctx.lineTo(470, groundY - 140);
  ctx.lineTo(490, groundY - 145);
  ctx.lineTo(500, groundY - 130);
  ctx.lineTo(515, groundY - 145);
  ctx.lineTo(530, groundY - 140);
  ctx.fill();
}

// --- Rio Animado com Riscos Espalhados ---
function drawRiver(groundY) {
  ctx.save();
  
  const startX = CANVAS_W * 0.45;
  
  // Pontos de controle da primeira curva
  const cp1x = CANVAS_W * 0.55, cp1y = groundY + 80;
  const cp2x = CANVAS_W * 0.70, cp2y = groundY + 80;
  const midX = CANVAS_W * 0.65, midY = groundY + 160;
  
  // Pontos de controle da segunda curva (para baixo)
  const cp3x = CANVAS_W * 0.60, cp3y = groundY + 240;
  const cp4x = CANVAS_W * 0.30, cp4y = groundY + 200;
  
  // Ponto final (mais abaixo e à esquerda)
  const endX = -50, endY = CANVAS_H + 50;

  // 1. Borda de terra (Fundo)
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
  ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, endX, endY);
  ctx.stroke();

  // 2. Água do rio
  ctx.strokeStyle = '#4a90e2';
  ctx.lineWidth = 35;
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
  ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, endX, endY);
  ctx.stroke();

  // 3. Correnteza Animada (Linhas afastando-se na base)
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.setLineDash([10, 30]); // Tamanho do risco e espaço
  
  // --- Linha 1: Esquerda ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineDashOffset = -menuTime * 30; 
  ctx.beginPath();
  // No topo, fica 8px para a esquerda. Na base, 20px para a esquerda.
  ctx.moveTo(startX - 8, groundY);
  ctx.bezierCurveTo(
    cp1x - 12, cp1y, 
    cp2x - 15, cp2y, 
    midX - 15, midY
  );
  ctx.bezierCurveTo(
    cp3x - 18, cp3y, 
    cp4x - 20, cp4y, 
    endX - 20, endY
  );
  ctx.stroke();

  // --- Linha 2: Centro ---
  ctx.lineDashOffset = -menuTime * 50;
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, midX, midY);
  ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, endX, endY);
  ctx.stroke();

  // --- Linha 3: Direita ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; 
  ctx.lineDashOffset = -menuTime * 40;
  ctx.beginPath();
  // No topo, 8px para a direita. Na base, 25px para a direita.
  ctx.moveTo(startX + 8, groundY);
  ctx.bezierCurveTo(
    cp1x + 12, cp1y, 
    cp2x + 15, cp2y, 
    midX + 15, midY
  );
  ctx.bezierCurveTo(
    cp3x + 20, cp3y, 
    cp4x + 25, cp4y, 
    endX + 25, endY
  );
  ctx.stroke();

  ctx.restore();
}

function drawTree(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3f2814';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, 0);
  ctx.lineTo(8, -60);
  ctx.lineTo(-8, -60);
  ctx.fill();

  ctx.fillStyle = '#2a1a0d';
  ctx.fillRect(-5, -40, 2, 20);
  ctx.fillRect(2, -50, 2, 30);
  ctx.fillRect(-8, -20, 2, 15);

  ctx.fillStyle = '#3f2814';
  ctx.beginPath(); ctx.moveTo(-8, -40); ctx.lineTo(-25, -55); ctx.lineTo(-20, -58); ctx.lineTo(-5, -45); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, -50); ctx.lineTo(25, -65); ctx.lineTo(20, -68); ctx.lineTo(5, -55); ctx.fill();

  ctx.fillStyle = '#1f4a24';
  ctx.beginPath(); ctx.arc(0, -70, 40, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#2f6b33';
  const midSpots = [
    { x: -15, y: -80, r: 25 }, { x: 20, y: -75, r: 28 },
    { x: 0, y: -95, r: 30 }, { x: -25, y: -65, r: 20 }, { x: 25, y: -60, r: 20 }
  ];
  midSpots.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });

  ctx.fillStyle = '#4f9a4a';
  const hiSpots = [
    { x: -10, y: -90, r: 12 }, { x: 15, y: -85, r: 15 },
    { x: 0, y: -105, r: 10 }, { x: -20, y: -75, r: 8 }
  ];
  hiSpots.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });

  ctx.restore();
}

function drawCastle(centerX, baseY) {
  ctx.fillStyle = '#1b1b24'; 

  ctx.fillRect(centerX - 25, baseY - 60, 50, 60);
  ctx.beginPath();
  ctx.moveTo(centerX - 30, baseY - 60); ctx.lineTo(centerX, baseY - 95); ctx.lineTo(centerX + 30, baseY - 60);
  ctx.fill();

  ctx.fillRect(centerX - 50, baseY - 45, 25, 45);
  ctx.beginPath();
  ctx.moveTo(centerX - 55, baseY - 45); ctx.lineTo(centerX - 37.5, baseY - 70); ctx.lineTo(centerX - 20, baseY - 45);
  ctx.fill();

  ctx.fillRect(centerX + 25, baseY - 45, 25, 45);
  ctx.beginPath();
  ctx.moveTo(centerX + 20, baseY - 45); ctx.lineTo(centerX + 37.5, baseY - 70); ctx.lineTo(centerX + 55, baseY - 45);
  ctx.fill();

  ctx.fillRect(centerX - 50, baseY - 30, 100, 30);

  ctx.fillStyle = '#0f0f1a';
  ctx.beginPath();
  ctx.arc(centerX, baseY - 10, 10, Math.PI, 0);
  ctx.rect(centerX - 10, baseY - 10, 20, 10);
  ctx.fill();

  ctx.fillStyle = '#feca57';
  ctx.fillRect(centerX - 5, baseY - 50, 3, 5); 
  ctx.fillRect(centerX + 2, baseY - 50, 3, 5);
  ctx.fillRect(centerX - 42, baseY - 35, 3, 4); 
  ctx.fillRect(centerX + 35, baseY - 35, 3, 4); 
}

export function renderMenu(dt) {
  menuTime += dt;

  const groundY = CANVAS_H * 0.6;
  const sunX = CANVAS_W - 100;
  const sunY = 100;

  // 1. Céu
  const skyGrd = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGrd.addColorStop(0, '#4a90e2');
  skyGrd.addColorStop(1, '#f5a623');
  ctx.fillStyle = skyGrd;
  ctx.fillRect(0, 0, CANVAS_W, groundY);

  // 2. Sol
  ctx.fillStyle = '#fff5d1';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
  ctx.fill();

  // 3. Montanhas
  drawMountains(groundY);

  // 4. Nuvens e Pássaros
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  clouds.forEach(c => {
    c.x -= c.speed * dt;
    if (c.x < -100 * c.scale) c.x = CANVAS_W + 100;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 20 * c.scale, 0, Math.PI * 2);
    ctx.arc(c.x + 25 * c.scale, c.y - 10 * c.scale, 25 * c.scale, 0, Math.PI * 2);
    ctx.arc(c.x + 50 * c.scale, c.y, 20 * c.scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  birds.forEach(b => {
    b.x += b.speed * dt;
    b.phase += dt * 10;
    if (b.x > CANVAS_W + 50) b.x = -50;
    const wingY = Math.sin(b.phase) * 5;
    ctx.beginPath();
    ctx.moveTo(b.x - 10, b.y + wingY); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 10, b.y + wingY);
    ctx.stroke();
  });

  // 5. Castelo
  drawCastle(CANVAS_W * 0.75, groundY);

  // 6. Chão de Grama
  const rows = 12; 
  const rowHeight = (CANVAS_H - groundY) / rows;
  for (let r = 0; r < rows; r++) {
    const y = groundY + r * rowHeight;
    const scale = 0.5 + (r / rows) * 3;
    const tileW = 20 * scale;
    const cols = Math.ceil(CANVAS_W / tileW) + 2;
    const seed = (r * 123456) % 1000; 

    for (let c = 0; c < cols; c++) {
      const x = c * tileW - tileW; 
      
      let type = 0;
      const pseudoRandom = (seed + c * 37) % 100;
      if (pseudoRandom < 5) type = 2;
      else if (pseudoRandom < 10) type = 3;
      else if (pseudoRandom < 15) type = 4;
      else if (pseudoRandom < 40) type = 1;

      ctx.drawImage(grassTiles[type], x, y, tileW + 2, rowHeight + 2);
    }
  }

  // 7. ÁRVORES ATRÁS DO RIO
  const backgroundTrees = trees.filter(t => t.y <= 0.9).sort((a, b) => a.y - b.y);
  backgroundTrees.forEach(t => {
    const pixelY = groundY + (CANVAS_H - groundY) * (t.y - 0.6) / 0.4;
    drawTree(t.x, pixelY, t.scale);
  });

  // 8. Rio Animado
  drawRiver(groundY);

  // 9. ÁRVORES NA FRENTE DO RIO
  const foregroundTrees = trees.filter(t => t.y > 0.9).sort((a, b) => a.y - b.y);
  foregroundTrees.forEach(t => {
    const pixelY = groundY + (CANVAS_H - groundY) * (t.y - 0.6) / 0.4;
    drawTree(t.x, pixelY, t.scale);
  });

  // 10. LUZ GLOBAL
  const lightGrd = ctx.createRadialGradient(sunX, sunY, 50, sunX, sunY, CANVAS_W * 1.2);
  lightGrd.addColorStop(0, 'rgba(255, 200, 100, 0.4)');
  lightGrd.addColorStop(0.5, 'rgba(255, 160, 50, 0.1)');
  lightGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
  
  ctx.fillStyle = lightGrd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}