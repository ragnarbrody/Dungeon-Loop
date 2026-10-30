// ============================================================
// WORLD MAP — tela cheia, pan/zoom/fog, markers.
// Estado em module scope. Abre/fecha via input.js.
// ============================================================
import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { currentRoom, player } from '../core/state.js';
import { isCity } from '../world/rooms.js';
import {
  isRevealed, getMarkers, getTileColor,
} from '../world/knowledge.js';
import { pickBiome } from '../world/biomes.js';

const MIN_ZOOM = 8;    // px por tile
const MAX_ZOOM = 40;
const DEFAULT_ZOOM = 18;

const cam = {
  // centro da câmera em coords de tile (pode ser fracionário)
  cx: 0,
  cy: 0,
  zoom: DEFAULT_ZOOM,
  // offset de "arrasto" em andamento
  drag: null,
};

let open = false;

export function isWorldMapOpen() { return open; }

const hudEl = document.getElementById('hud');

export function openWorldMap() {
  open = true;
  if (hudEl) hudEl.style.display = 'none';
  // Centraliza no jogador
  if (currentRoom) {
    cam.cx = currentRoom.gx + 0.5;
    cam.cy = currentRoom.gy + 0.5;
  }
  cam.zoom = DEFAULT_ZOOM;
}

export function closeWorldMap() {
  open = false;
  cam.drag = null;
  if (hudEl) hudEl.style.display = '';
}

// ---------- Conversões screen <-> tile ----------
function screenToTile(mx, my) {
  return {
    tx: (mx - CANVAS_W / 2) / cam.zoom + cam.cx,
    ty: (my - CANVAS_H / 2) / cam.zoom + cam.cy,
  };
}
function tileToScreen(tx, ty) {
  return {
    x: (tx - cam.cx) * cam.zoom + CANVAS_W / 2,
    y: (ty - cam.cy) * cam.zoom + CANVAS_H / 2,
  };
}

// ---------- Input handlers (chamados pelo input.js) ----------
export function handleMapClick(mx, my, e) {
  // arrastar (mesmo botão) — o input.js já segura o estado
  cam.drag = { startX: mx, startY: my, startCx: cam.cx, startCy: cam.cy };
}

export function handleMapMove(mx, my) {
  if (!cam.drag) return;
  const dxTiles = (mx - cam.drag.startX) / cam.zoom;
  const dyTiles = (my - cam.drag.startY) / cam.zoom;
  cam.cx = cam.drag.startCx - dxTiles;
  cam.cy = cam.drag.startCy - dyTiles;
}

export function handleMapRelease() {
  cam.drag = null;
}

export function handleMapWheel(deltaY) {
  const factor = deltaY > 0 ? 0.85 : 1.18;
  cam.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.zoom * factor));
}

export function centerOnPlayer() {
  if (currentRoom) {
    cam.cx = currentRoom.gx + 0.5;
    cam.cy = currentRoom.gy + 0.5;
  }
}

// ---------- Render ----------
export function renderWorldMap() {
  // Fundo escuro
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Quantas tiles cabem na tela
  const tilesX = Math.ceil(CANVAS_W / cam.zoom) + 2;
  const tilesY = Math.ceil(CANVAS_H / cam.zoom) + 2;
  const startTx = Math.floor(cam.cx - tilesX / 2);
  const startTy = Math.floor(cam.cy - tilesY / 2);

  // 1) Tiles (chão + fog)
  for (let iy = 0; iy < tilesY; iy++) {
    for (let ix = 0; ix < tilesX; ix++) {
      const gx = startTx + ix;
      const gy = startTy + iy;
      const { x, y } = tileToScreen(gx, gy);

      // "fora do mundo" — nada a desenhar
      // (não tem limite fixo; o mundo é infinito, mas só mostramos se revelado)
      const revealed = isRevealed(gx, gy);
      const isCurrent = currentRoom && gx === currentRoom.gx && gy === currentRoom.gy;

      // Chão: cor do bioma se revelado, senão "fog" (escuro)
      ctx.fillStyle = getTileColor(gx, gy, isCurrent, isCity, pickBiome);
      ctx.fillRect(
        Math.floor(x), Math.floor(y),
        Math.ceil(cam.zoom) + 1, Math.ceil(cam.zoom) + 1
      );

      // Grid sutil (só em tiles revelados, pra dar noção de escala)
      if (revealed && cam.zoom >= 14) {
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          Math.floor(x) + 0.5, Math.floor(y) + 0.5,
          Math.ceil(cam.zoom), Math.ceil(cam.zoom)
        );
      }

      // Cidades (ícone de casinha) — desenhadas por cima
      if (revealed && isCity(gx, gy) && cam.zoom >= 10) {
        drawHouseIcon(x + cam.zoom / 2, y + cam.zoom / 2, cam.zoom * 0.7);
      }

      // Marcador de "jogador atual"
      if (isCurrent) {
        drawPlayerMarker(x + cam.zoom / 2, y + cam.zoom / 2, cam.zoom);
      }
    }
  }
  
  // ---- Nomes das cidades (por cima dos tiles) ----
  // Feito FORA do loop dos tiles, senão o próximo tile verde cobre o texto.
  if (cam.zoom >= 18) {
    for (let iy = 0; iy < tilesY; iy++) {
      for (let ix = 0; ix < tilesX; ix++) {
        const gx = startTx + ix;
        const gy = startTy + iy;
        if (!isRevealed(gx, gy)) continue;
        if (!isCity(gx, gy)) continue;
        const { x, y } = tileToScreen(gx, gy);
        drawCityLabel(x + cam.zoom / 2, y + cam.zoom / 2, cam.zoom);
      }
    }
  }

  // 2) Markers (boss, quest, poi) — só os revelados
  const markers = getMarkers({ onlyRevealed: true });
  for (const m of markers) {
    if (m.type === 'city') continue; // cidade já é desenhada como tile
    const { x, y } = tileToScreen(m.gx + 0.5, m.gy + 0.5);
    drawMarker(m, x, y, cam.zoom);
  }

  // 3) Legenda + dica de controles
  drawHUD();

  // 4) Fog nas bordas da tela (vinheta) pra dar "sensação de mapa"
  const grad = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.3,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.75
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

// ---------- Desenhos auxiliares ----------
function drawHouseIcon(cx, cy, size) {
  const s = size;
  const x = cx - s / 2;
  const y = cy - s / 2;
  ctx.fillStyle = '#f0d27a';
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y);
  ctx.lineTo(x + s, y + s * 0.5);
  ctx.lineTo(x, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a6b2a';
  ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.5);
}

function drawPlayerMarker(cx, cy, size) {
  // Círculo dourado pulsante
  const t = performance.now() / 400;
  const pulse = 0.6 + Math.sin(t) * 0.2;
  ctx.fillStyle = `rgba(201, 162, 77, ${pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff5c0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.45, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMarker(m, x, y, zoom) {
  const size = Math.max(10, zoom * 0.8);

  // Fundo do pino
  let color = '#c9a24d';
  let label = '';
  if (m.type === 'boss')   { color = '#c93030'; label = '☠'; }
  if (m.type === 'quest')  { color = '#eaecea'; label = '★'; }
  if (m.type === 'poi')    { color = '#8ad8ff'; label = '?'; }
  if (m.type === 'cave_done') { color = '#ffb703'; label = '✓'; }

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.arc(x, y, size * 0.65, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (label && zoom >= 14) {
    ctx.fillStyle = '#1a1a2e';
    ctx.font = `bold ${Math.round(size * 0.65)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 1);
  }

  // Nome (só com zoom alto)
  if (m.title && zoom >= 22) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.font = 'bold 11px "Courier New", monospace';
    const w = ctx.measureText(m.title).width + 10;
    ctx.fillRect(x - w / 2, y + size * 0.55, w, 16);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - w / 2 + 0.5, y + size * 0.55 + 0.5, w - 1, 15);
    ctx.fillStyle = '#eee';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(m.title, x, y + size * 0.55 + 8);
  }
}

function drawHUD() {
  // Título (canto superior esquerdo)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(10, 10, 280, 32);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(10.5, 10.5, 279, 31);
  ctx.fillStyle = '#feca57';
  ctx.font = 'bold 16px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Mapa-Múndi', 20, 26);

  // Coordenadas do centro da câmera (canto superior direito)
  ctx.fillStyle = '#aaa';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(
    `centro: (${cam.cx.toFixed(1)}, ${cam.cy.toFixed(1)}) | zoom: ${cam.zoom.toFixed(0)}`,
    CANVAS_W - 20, 26
  );

  // Legenda (agora no canto superior esquerdo, logo abaixo do título)
  const legend = [
    { color: '#C9A24D', label: 'Você' },
    { color: '#6A6A8A', label: 'Cidade' },
    { color: '#4F9A4A', label: 'Campos' },
    { color: '#d9b96b', label: 'Deserto' },
    { color: '#c93030', label: 'Boss' },
    { color: '#eaecea', label: 'Quest' },
    { color: '#ffb703', label: 'Caverna concluída' },
  ];
  const legendX = 10;
  const legendY = 50;
  const legendW = 180;
  const legendH = legend.length * 18 + 10;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(legendX, legendY, legendW, legendH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(legendX + 0.5, legendY + 0.5, legendW - 1, legendH - 1);

  for (let i = 0; i < legend.length; i++) {
    const ly = legendY + 14 + i * 18;
    ctx.fillStyle = legend[i].color;
    ctx.fillRect(legendX + 10, ly - 5, 10, 10);
    ctx.fillStyle = '#ddd';
    ctx.font = '11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(legend[i].label, legendX + 28, ly);
  }

  // Dica de controles (embaixo, à esquerda)
  const hint = 'Arraste: mover  |  Scroll: zoom  |  C: Centralizar  |  M/ESC: fechar';
  ctx.font = '11px "Courier New", monospace';
  const hintW = ctx.measureText(hint).width + 20;   // padding lateral
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(10, CANVAS_H - 40, hintW, 28);
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(hint, 20, CANVAS_H - 26);
}

// Desenha o nome da cidade abaixo da casinha.
// Só aparece com zoom alto (chamado com cam.zoom >= 18).
function drawCityLabel(cx, cy, zoom) {
  const name = 'Aethel'; // no futuro: derivar de getCityName(gx, gy)
  const fontSize = Math.max(10, Math.round(zoom * 0.55));

  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  const padX = 6;
  const padY = 3;
  const textW = ctx.measureText(name).width;
  const boxW = textW + padX * 2;
  const boxH = fontSize + padY * 2;
  const boxX = cx - boxW / 2;
  const boxY = cy + zoom * 0.5;   // logo abaixo da casinha

  // Fundo (preto semi-transparente)
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Borda dourada (mesmo estilo do HUD)
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // Texto
  ctx.fillStyle = '#feca57';
  ctx.fillText(name, cx, boxY + padY);
}

export function resetCamera() {
  cam.drag = null;
  cam.zoom = DEFAULT_ZOOM;
  if (currentRoom) {
    cam.cx = currentRoom.gx + 0.5;
    cam.cy = currentRoom.gy + 0.5;
  }
}