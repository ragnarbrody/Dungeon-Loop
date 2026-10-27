import { ctx, CANVAS_W } from '../core/canvas.js';
import { currentRoom, visitedRooms } from '../core/state.js';
import { pickBiome } from '../world/biomes.js';
import { isCity } from '../world/rooms.js';
import { getMarkers } from '../world/knowledge.js';

const BIOME_MINIMAP_COLORS = {
  fields: { visited: '#4f9a4a', unvisited: '#2a3a2a' },
  desert: { visited: '#d9b96b', unvisited: '#5a4a2a' },
};

// Cidade: cinza-azulado escuro (não descoberta) e claro (descoberta)
const CITY_COLORS = {
  unvisited: '#2a3a4a',
  visited:   '#4a6a8a',
  current:   '#f0d27a',
};

const DEFAULT_COLORS = { visited: '#4f9a4a', unvisited: '#2a2a3e' };

// Cores dos markers (mesma paleta do mapa-múndi)
const MARKER_COLORS = {
  boss:  '#c93030',
  quest: '#4f9a4a',
  poi:   '#8ad8ff',
};

function drawHouseIcon(cx, cy, size, color) {
  const s = size * 0.65;
  const x = cx - s / 2;
  const y = cy - s / 2;
  ctx.fillStyle = color;
  // Telhado (triângulo)
  ctx.beginPath();
  ctx.moveTo(x + s / 2, y);
  ctx.lineTo(x + s, y + s * 0.5);
  ctx.lineTo(x, y + s * 0.5);
  ctx.closePath();
  ctx.fill();
  // Corpo (retângulo)
  ctx.fillRect(x + s * 0.15, y + s * 0.5, s * 0.7, s * 0.5);
  // Porta (buraco)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(x + s * 0.4, y + s * 0.65, s * 0.2, s * 0.35);
}

export function renderMinimap() {
  if (!currentRoom) return;

  const tileSize = 8;
  const gap = 1;
  const width = 5;
  const height = 5;

  const startX = CANVAS_W - (width * (tileSize + gap)) - 10;
  const startY = 10;

  // Fundo do minimapa
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(startX - 5, startY - 5, width * (tileSize + gap) + 10, height * (tileSize + gap) + 10);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX - 5, startY - 5, width * (tileSize + gap) + 10, height * (tileSize + gap) + 10);

  // Pré-computa os markers revelados, pra desenhar por cima dos tiles
  const markers = getMarkers({ onlyRevealed: true });
  // Filtra os que NÃO são cidade (a cidade já tem o ícone de casa)
  const markerByTile = new Map();
  for (const m of markers) {
    if (m.type === 'city') continue;
    markerByTile.set(`${m.gx},${m.gy}`, m);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offsetX = x - Math.floor(width / 2);
      const offsetY = y - Math.floor(height / 2);
      const gx = currentRoom.gx + offsetX;
      const gy = currentRoom.gy + offsetY;

      const isCurrent = (offsetX === 0 && offsetY === 0);
      const isVisited = visitedRooms.has(`${gx},${gy}`);
      const isCityCell = isCity(gx, gy);

      const px = startX + x * (tileSize + gap);
      const py = startY + y * (tileSize + gap);

      if (isCityCell) {
        if (isCurrent) {
          ctx.fillStyle = CITY_COLORS.current;
          ctx.fillRect(px, py, tileSize, tileSize);
          drawHouseIcon(px + tileSize / 2, py + tileSize / 2, tileSize, '#1a1a2e');
        } else if (isVisited) {
          ctx.fillStyle = CITY_COLORS.visited;
          ctx.fillRect(px, py, tileSize, tileSize);
          drawHouseIcon(px + tileSize / 2, py + tileSize / 2, tileSize, '#1a1a2e');
        } else {
          ctx.fillStyle = CITY_COLORS.unvisited;
          ctx.fillRect(px, py, tileSize, tileSize);
          // Sem ícone enquanto não visitada
        }
        continue;
      }

      // Biomas normais
      const biomeId = pickBiome(gx, gy);
      const colors = BIOME_MINIMAP_COLORS[biomeId] || DEFAULT_COLORS;

      if (isCurrent) {
        ctx.fillStyle = '#c9a24d';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else if (isVisited) {
        ctx.fillStyle = colors.visited;
        ctx.fillRect(px, py, tileSize, tileSize);
      } else {
        ctx.fillStyle = colors.unvisited;
        ctx.fillRect(px, py, tileSize, tileSize);
      }

      // ---- Marker (quest, boss, poi) por cima ----
      const mk = markerByTile.get(`${gx},${gy}`);
      if (mk) {
        drawMinimapMarker(px + tileSize / 2, py + tileSize / 2, tileSize, mk.type);
      }
    }
  }
}

/**
 * Desenha um marker pequeno no minimapa.
 * Círculo colorido com uma borda escura, sem label (é pequeno demais).
 */
function drawMinimapMarker(cx, cy, tileSize, type) {
  const color = MARKER_COLORS[type] || '#c9a24d';
  const r = tileSize * 0.35;

  // Sombra/borda
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Corpo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Contorno claro pra destacar em qualquer fundo
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
}