import { ctx, GRID_SIZE, TILE_SIZE, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { T } from '../world/tiles.js';
import { BIOMES } from '../world/biomes.js';
import { player, currentRoom, playerStats } from '../core/state.js';
import { treeFrames } from '../sprites/tree.js';
import { cactusFrames } from '../sprites/cactus.js';
import { grassTiles } from '../sprites/grass.js';
import { composeFrame } from '../sprites/compose.js';
import { getActiveLeaves } from '../entities/leaves.js';
import { makeRng, seedFrom } from '../core/rng.js';
import { drawMapEnemies } from '../entities/enemies.js';
import { herbalistFrames } from '../sprites/herbalist.js';

export function renderExplore() {
  if (!currentRoom) return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Se for cidade, renderiza diferente
  if (currentRoom.isCity) {
    renderCity(currentRoom);
    return;
  }

  if (currentRoom.isInterior) {
    renderInterior(currentRoom);
    return;
  }

  const biomeId = currentRoom.biomeId;
  const biome = BIOMES[biomeId];

  const roomRng = makeRng(seedFrom(currentRoom.gx, currentRoom.gy));

  // Layout da grama (usado só no campo)
  const grassLayout = [];
  if (biome.floorStyle === 'grass') {
    for (let y = 0; y < GRID_SIZE; y++) {
      const row = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        const roll = roomRng();
        if (roll < 0.02)      row.push(2);
        else if (roll < 0.04) row.push(3);
        else if (roll < 0.06) row.push(4);
        else if (roll < 0.25) row.push(1);
        else row.push(0);
      }
      grassLayout.push(row);
    }
  }

  // ---------- DESENHO DO CHÃO ----------
  // Campos: tiles de grama
  // Deserto: areia + dunas procedurais (seedado pela sala)
  if (biome.floorStyle === 'sand') {
    drawSandFloor(currentRoom, roomRng);
  } else {
    // Chão de grama padrão
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const t = currentRoom.map[y][x];
        if (t === T.FLOOR || t === T.TREE) {
          const gType = grassLayout[y][x];
          ctx.drawImage(grassTiles[gType], x * TILE_SIZE, y * TILE_SIZE);
        }
      }
    }
  }

  // ---------- PAREDES E PORTAS (iguais em todos os biomas) ----------
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = currentRoom.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (t === T.WALL) {
        // Se for deserto, parede de pedra clara; senão, marrom padrão
        const wallColor = biomeId === 'desert' ? '#a08050' : '#5a4a3a';
        const wallEdge  = biomeId === 'desert' ? '#6b5030' : '#3a2f24';
        ctx.fillStyle = wallColor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (t === T.DOOR) {
        ctx.fillStyle = '#c9a24d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#a07e2f';
        ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      }
    }
  }

  // ---------- OBSTÁCULOS (árvores ou cactos) ----------
  if (biomeId === 'desert') {
    // Cactos
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.TREE) continue;
        const frame = cactusFrames[Math.floor(performance.now() / 600 + (x + y)) % 2];
        const dx = x * TILE_SIZE + TILE_SIZE / 2 - cactusFrames[0].width / 2;
        const dy = y * TILE_SIZE + TILE_SIZE - cactusFrames[0].height;
        ctx.drawImage(frame, dx, dy);
      }
    }
  } else if (biome.trees) {
    // Árvores
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.TREE) continue;
        const frame = treeFrames[Math.floor(performance.now() / 450 + (x + y)) % 2];
        const dx = x * TILE_SIZE + TILE_SIZE / 2 - treeFrames[0].width / 2;
        const dy = y * TILE_SIZE + TILE_SIZE - treeFrames[0].height;
        ctx.drawImage(frame, dx, dy);
      }
    }
  }

  // ---------- FOLHAS CAINDO ----------
  if (currentRoom.hasTrees) {
    for (const L of getActiveLeaves()) {
      const t = L.age / L.life;
      let color;
      if (t < 0.4)      color = '#6fbd63';
      else if (t < 0.8) color = '#8a9a4a';
      else              color = '#c9b048';
      ctx.fillStyle = color;
      ctx.fillRect(Math.floor(L.x), Math.floor(L.y), 2, 2);
    }
  }

  drawMapEnemies(currentRoom);

  // ---------- JOGADOR ----------
  const composed = composeFrame(player.facing, player.step);
  const scale = (player.size + 4) / 32;
  ctx.drawImage(
    composed,
    player.x - (32 * scale) / 2,
    player.y - (32 * scale) / 2,
    32 * scale, 32 * scale
  );
}

// ---------- CHÃO DE AREIA PROCEDURAL ----------
// Desenha cada tile de areia com ruído + algumas "dunas" (linhas longas)
// O seed garante que a mesma sala sempre tem a mesma areia.
function drawSandFloor(room, rng) {
  // Paleta base
  const base      = '#c9a870';
  const baseDark  = '#b89660';
  const baseLight = '#d9bd88';
  const duneEdge  = '#a07f4f';
  const duneLight = '#e0c890';

  // 1. Pinta o fundo todo de areia base
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 2. Grão de areia (ruído fino)
  for (let y = 0; y < CANVAS_H; y += 2) {
    for (let x = 0; x < CANVAS_W; x += 2) {
      const r = rng();
      if (r < 0.08) {
        ctx.fillStyle = baseDark;
        ctx.fillRect(x, y, 1, 1);
      } else if (r < 0.14) {
        ctx.fillStyle = baseLight;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // 3. Dunas: desenha algumas "linhas" com curva leve, seedado pela sala.
  //    Espalhamos ~6 dunas por sala, com direções variadas.
  const numDunes = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < numDunes; i++) {
    const startX = rng() * CANVAS_W;
    const startY = rng() * CANVAS_H;
    const len    = 60 + rng() * 120;
    const angle  = (rng() - 0.5) * 0.8; // leve inclinação
    const curve  = (rng() - 0.5) * 20;

    // Borda da duna (sombra)
    ctx.strokeStyle = duneEdge;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      startX + Math.cos(angle) * len / 2 + curve,
      startY + Math.sin(angle) * len / 2 - curve,
      startX + Math.cos(angle) * len,
      startY + Math.sin(angle) * len
    );
    ctx.stroke();

    // Topo iluminado da duna (deslocado 1px pra cima)
    ctx.strokeStyle = duneLight;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(startX, startY - 1);
    ctx.quadraticCurveTo(
      startX + Math.cos(angle) * len / 2 + curve,
      startY + Math.sin(angle) * len / 2 - curve - 1,
      startX + Math.cos(angle) * len,
      startY + Math.sin(angle) * len - 1
    );
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  // 4. "Pedrinhas" espalhadas (detalhe de textura)
  const numRocks = 8 + Math.floor(rng() * 8);
  for (let i = 0; i < numRocks; i++) {
    const x = rng() * CANVAS_W;
    const y = rng() * CANVAS_H;
    ctx.fillStyle = '#8a6a40';
    ctx.fillRect(Math.floor(x), Math.floor(y), 2, 1);
    ctx.fillStyle = '#a8845a';
    ctx.fillRect(Math.floor(x), Math.floor(y) - 1, 1, 1);
  }
}

// ============================================================
// RENDERIZAÇÃO DA CIDADE
// ============================================================
function renderCity(room) {
  const mid = Math.floor(GRID_SIZE / 2);

  // ============================================================
  // CHÃO (grama, rua, praça)
  // Desenha TODOS os tiles de chão primeiro.
  // ============================================================
  const grassRng = makeRng(seedFrom(room.gx * 3, room.gy * 11));

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = room.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (t === T.FLOOR || t === T.TREE) {
        // Grama (determinística)
        const roll = grassRng();
        let gType = 0;
        if (roll < 0.02)      gType = 2;
        else if (roll < 0.04) gType = 3;
        else if (roll < 0.06) gType = 4;
        else if (roll < 0.25) gType = 1;
        ctx.drawImage(grassTiles[gType], px, py);
      } else if (t === T.STREET) {
        // Rua de terra batida
        ctx.fillStyle = '#a8845a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        // Ruído sutil (determinístico pelo x,y)
        if (((x * 7 + y * 13) % 5) === 0) {
          ctx.fillStyle = '#8a6a40';
          ctx.fillRect(px + 4, py + 6, 2, 2);
        }
        if (((x * 11 + y * 3) % 7) === 0) {
          ctx.fillStyle = '#c4a06a';
          ctx.fillRect(px + 12, py + 14, 2, 1);
        }
      } else if (t === T.PLAZA) {
        // Praça: pedra clara
        ctx.fillStyle = '#a8a8b8';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#9090a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        // Detalhe central
        ctx.fillStyle = '#9a9aaa';
        ctx.fillRect(px + TILE_SIZE / 2 - 1, py + TILE_SIZE / 2 - 1, 2, 2);
      } else if (t === T.WALL) {
        ctx.fillStyle = '#3a3a4a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#2a2a3a';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        ctx.strokeStyle = '#4a4a5a';
        ctx.beginPath();
        ctx.moveTo(px, py + TILE_SIZE / 2);
        ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE / 2);
        ctx.stroke();
      } else if (t === T.DOOR) {
        ctx.fillStyle = '#c9a24d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#a07e2f';
        ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      }
    }
  }

  // 3. Grade
  ctx.strokeStyle = '#5a5a6a';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * TILE_SIZE, 0);
    ctx.lineTo(i * TILE_SIZE, CANVAS_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * TILE_SIZE);
    ctx.lineTo(CANVAS_W, i * TILE_SIZE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sombras das casas
  for (const obj of room.cityObjects) {
    const sx = obj.tx * TILE_SIZE;
    const sy = obj.ty * TILE_SIZE;
    const sw = obj.w * TILE_SIZE;
    const sh = obj.h * TILE_SIZE;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    // Sombra à direita: começa mais alta (alinhada ao telhado) e cobre até a base
    ctx.fillRect(sx + sw, sy - 4, 6, sh + 8);
    // Sombra no topo (atrás do telhado)
    ctx.fillRect(sx + 4, sy - 4, sw, 4);
  }

  // ---------- CASAS (por cima dos tiles de HOUSE) ----------
  for (const obj of room.cityObjects) {
    drawBuilding(obj, room);
  }

  // ---------- PORTAL (estátua + portal) ----------
  drawPortalStatue(room.portal, mid);

  // ---------- ESTANDARTES (ao lado das portas) ----------
  for (const obj of room.cityObjects) {
    drawBannerNextToDoor(obj);
  }

  // ---------- PLACAS DE MADEIRA (interativas depois) ----------
  for (const obj of room.cityObjects) {
    const signX = obj.signTx * TILE_SIZE + TILE_SIZE / 2;
    const signY = obj.signTy * TILE_SIZE + TILE_SIZE / 2;

    // Poste
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(signX - 1, signY + 4, 2, 6);
    // Tábua
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(signX - 14, signY - 4, 28, 10);
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 1;
    ctx.strokeRect(signX - 14 + 0.5, signY - 4 + 0.5, 27, 9);
    // Linhas "texto"
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(signX - 10, signY - 1, 20, 1);
    ctx.fillRect(signX - 8, signY + 1, 16, 1);
    ctx.fillRect(signX - 6, signY + 3, 12, 1);
  }

  // Árvores (mesmo desenho do campo)
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (room.map[y][x] !== T.TREE) continue;
      const frame = treeFrames[Math.floor(performance.now() / 450 + (x + y)) % 2];
      const dx = x * TILE_SIZE + TILE_SIZE / 2 - treeFrames[0].width / 2;
      const dy = y * TILE_SIZE + TILE_SIZE - treeFrames[0].height;
      ctx.drawImage(frame, dx, dy);
    }
  }

  // ---------- FOLHAS CAINDO (por cima das árvores) ----------
  for (const L of getActiveLeaves()) {
    const tt = L.age / L.life;
    let color;
    if (tt < 0.4)      color = '#6fbd63';
    else if (tt < 0.8) color = '#8a9a4a';
    else               color = '#c9b048';
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(L.x), Math.floor(L.y), 2, 2);
  }

  // ---------- PROMPT DE INTERAÇÃO ----------
  const it = playerStats._nearInteractable;
  if (it) {
    const cx = it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = it.ty * TILE_SIZE - 16; // acima do objeto
    const text = it.kind === 'building_entrance'
    ? `Entrar: ${it.title} [E]`
    : it.kind === 'sign'
      ? `Ler: ${it.title} [E]`
      : `Aperte [E]`;
    ctx.font = 'bold 10px "Courier New", monospace';
    const w = ctx.measureText(text).width + 10;
    const h = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(cx - w / 2, cy - h, w, h);
    ctx.strokeStyle = '#c9a24d';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - w / 2 + 0.5, cy - h + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#feca57';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy - h / 2 + 1);
  }

  // ---------- JOGADOR ----------
  const composed = composeFrame(player.facing, player.step);
  const scale = (player.size + 4) / 32;
  ctx.drawImage(
    composed,
    player.x - (32 * scale) / 2,
    player.y - (32 * scale) / 2,
    32 * scale, 32 * scale
  );
}

// ============================================================
// CASA COMPLETA (telhado + parede + porta + chaminé)
// Desenhada por cima dos tiles de T.HOUSE.
// ============================================================
function drawBuilding(obj, room) {
  const x = obj.tx * TILE_SIZE;
  const y = obj.ty * TILE_SIZE;
  const w = obj.w * TILE_SIZE;
  const h = obj.h * TILE_SIZE;

  // ---- PAREDE (madeira clara com tábuas horizontais) ----
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(x, y + 4, w, h - 4);

  // Tábuas horizontais
  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 1;
  for (let ty = y + 4; ty < y + h; ty += 8) {
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + w, ty);
    ctx.stroke();
  }

  // Sombra interna (lado direito e inferior)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(x + w - 4, y + 4, 4, h - 4);
  ctx.fillRect(x, y + h - 4, w, 4);

  // ---- TELHADO (inclinado, estilo chalé) ----
  // Base do telhado (beiral)
  ctx.fillStyle = '#7a1a1a';
  ctx.fillRect(x - 4, y, w + 8, 14);
  // Brilho do beiral
  ctx.fillStyle = '#9a2a2a';
  ctx.fillRect(x - 4, y, w + 8, 2);
  // Sombra do beiral
  ctx.fillStyle = '#5a0a0a';
  ctx.fillRect(x - 4, y + 12, w + 8, 2);

  // Telhas (fileiras verticais alternadas)
  ctx.fillStyle = '#6a0a0a';
  for (let tx = x - 4; tx < x + w + 4; tx += 6) {
    ctx.fillRect(tx, y + 2, 1, 10);
  }

  // Crista do telhado (linha horizontal no topo)
  ctx.fillStyle = '#4a0a0a';
  ctx.fillRect(x - 4, y, w + 8, 2);

  // ---- CHAMINÉ ----
  // Posição: canto direito do telhado
  const chimX = x + w - 20;
  const chimY = y - 18;
  // Corpo da chaminé
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(chimX, chimY, 10, 22);
  // Brilho
  ctx.fillStyle = '#7a6a5a';
  ctx.fillRect(chimX, chimY, 2, 22);
  // Sombra
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(chimX + 8, chimY, 2, 22);
  // Topo da chaminé
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(chimX - 2, chimY - 3, 14, 4);
  // "Fumaça" (2-3 bolinhas semi-transparentes que sobem)
  const time = performance.now() / 1000;
  for (let i = 0; i < 3; i++) {
    const phase = (time + i * 0.6) % 2;
    const smokeY = chimY - 8 - phase * 16;
    const smokeX = chimX + 5 + Math.sin((time + i) * 3) * 3;
    const alpha = 0.35 * (1 - phase / 2);
    ctx.fillStyle = `rgba(180, 180, 180, ${alpha})`;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, 3 + phase * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- JANELAS (2 por casa, sem porta) ----
  const winY = y + 30;
  const winW = 10;
  const winH = 8;
  const winColor = '#2a2a3a';
  const winGlow  = '#feca57';

  // Janela esquerda
  ctx.fillStyle = winColor;
  ctx.fillRect(x + w * 0.25 - winW / 2, winY, winW, winH);
  ctx.fillStyle = winGlow;
  ctx.fillRect(x + w * 0.25 - winW / 2 + 1, winY + 1, winW - 2, winH - 2);

  // Janela direita
  ctx.fillStyle = winColor;
  ctx.fillRect(x + w * 0.75 - winW / 2, winY, winW, winH);
  ctx.fillStyle = winGlow;
  ctx.fillRect(x + w * 0.75 - winW / 2 + 1, winY + 1, winW - 2, winH - 2);

  // ---- PORTA (arco central, base) ----
  const doorW = 18;
  const doorH = 22;
  const doorX = x + w / 2 - doorW / 2;
  const doorY = y + h - doorH;
  // Moldura
  ctx.fillStyle = '#4a2a1a';
  ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
  // Porta de madeira
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  // Tábuas verticais
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(doorX + 5, doorY + 2, 1, doorH - 4);
  ctx.fillRect(doorX + 11, doorY + 2, 1, doorH - 4);
  // Batente (maçaneta dourada)
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(doorX + doorW - 5, doorY + doorH / 2, 2, 2);
  // Arco superior (semicírculo)
  ctx.fillStyle = '#4a2a1a';
  ctx.beginPath();
  ctx.arc(doorX + doorW / 2, doorY, doorW / 2 + 2, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#6b4a2b';
  ctx.beginPath();
  ctx.arc(doorX + doorW / 2, doorY, doorW / 2, Math.PI, 0);
  ctx.fill();
}

// Adicionar no final de explore.js (ou antes de drawBannerNextToDoor):
function drawBannerIcon(objId, cx, cy) {
  // Desenha em coordenadas absolutas, com "centro" em (cx, cy).
  // Usa fillRect com offset já arredondado pra garantir centro.
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx + x), Math.round(cy + y), w, h);
  };

  switch (objId) {
    case 'blacksmith': {
      // Martelo + bigorna (7x7, centro em 0,0)
      rect(-3, 3, 6, 1, '#1a1a1a');   // base da bigorna
      rect(-2, 1, 4, 2, '#555');      // corpo da bigorna
      rect(-1, -3, 1, 4, '#5a3a1a');  // cabo
      rect(-2, -4, 3, 2, '#c0c8d0');  // cabeça do martelo
      break;
    }
    case 'armorer': {
      // Escudo (6x7, centro em 0,0)
      rect(-3, -3, 6, 4, '#c9a24d');  // topo dourado
      rect(-3, 1,  6, 2, '#9b1c1c');  // corpo
      rect(-2, 3,  4, 1, '#9b1c1c');  // ponta inferior
      rect(-1, -2, 2, 1, '#e0e0e0');  // emblema centralizado
      break;
    }
    case 'herbalist': {
      // Frasco (5x6, centro em 0,0)
      rect(-2, -3, 4, 5, '#c8d8e8');  // vidro
      rect(-2, -3, 4, 1, '#8a6b5a');  // tampa
      rect(-1, -2, 2, 3, '#2a7a3a');  // líquido verde
      rect( 1,  1, 2, 2, '#4f9a4a');  // folha (canto inf dir, OK)
      break;
    }
    case 'jeweler': {
      // Gema losango (5x5, centro em 0,0)
      rect(-1, -3, 2, 1, '#e8f6ff');  // topo
      rect(-2, -2, 4, 1, '#8ad8ff');  // linha superior
      rect(-2, -1, 4, 3, '#8ad8ff');  // corpo
      rect(-1,  2, 2, 1, '#3aa0ff');  // linha inferior
      rect( 0,  3, 1, 1, '#2a5fa0');  // ponta
      break;
    }
    case 'quest_giver': {
      // Pergaminho (5x7, centro em 0,0)
      rect(-2, -3, 4, 7, '#f0e0c0');  // papel
      rect(-1, -2, 2, 1, '#5a3a24');  // linha "texto" 1
      rect(-1,  0, 2, 1, '#5a3a24');  // linha "texto" 2
      rect(-1,  2, 2, 1, '#5a3a24');  // linha "texto" 3
      break;
    }
    default: {
      rect(-1, -1, 2, 2, '#c9a24d');
    }
  }
}

// ============================================================
// ESTANDARTE AO LADO DA PORTA
// ============================================================
function drawBannerNextToDoor(obj) {
  const x = obj.tx * TILE_SIZE;
  const y = obj.ty * TILE_SIZE;
  const w = obj.w * TILE_SIZE;
  const h = obj.h * TILE_SIZE;

  // Posição: à direita da porta, na parede
  const doorCenterX = x + w / 2;
  const bannerX = doorCenterX + 22;
  const bannerY = y + h - 30;

  // Mastro horizontal (sai da parede)
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(bannerX - 2, bannerY, 12, 2);
  // Ponta do mastro
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bannerX + 10, bannerY - 1, 2, 4);

  // Pano do estandarte (pendurado)
  const bannerW = 14;
  const bannerH = 20;
  const bx = bannerX - 1;
  const by = bannerY + 2;

  const bannerColors = {
    blacksmith:  '#8a1a1a',
    armorer:     '#2a4a8a',
    herbalist:   '#2a6b2a',
    jeweler:     '#6a2a8a',
    quest_giver: '#c9a24d',
  };
  const bannerColor = bannerColors[obj.id] || '#8a1a1a';

  ctx.fillStyle = bannerColor;
  ctx.fillRect(bx, by, bannerW, bannerH);

  // Borda dourada
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bannerW - 1, bannerH - 1);

  // Ponta inferior (V)
  ctx.fillStyle = bannerColor;
  ctx.beginPath();
  ctx.moveTo(bx, by + bannerH);
  ctx.lineTo(bx + bannerW / 2, by + bannerH + 4);
  ctx.lineTo(bx + bannerW, by + bannerH);
  ctx.closePath();
  ctx.fill();

  // Ícone no centro
  drawBannerIcon(
    obj.id,
    Math.floor(bx + bannerW / 2),
    Math.floor(by + bannerH / 2)
  );
}

// ============================================================
// PORTAL ESTILIZADO (estátua + portal no centro)
// ============================================================
function drawPortalStatue(portal, mid) {
  const cx = portal.tx * TILE_SIZE + TILE_SIZE / 2;
  const cy = portal.ty * TILE_SIZE + TILE_SIZE / 2;

  // Base da estátua (pedra clara, circular)
  ctx.fillStyle = '#8a8a9a';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a5a6a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Degraus concêntricos
  ctx.fillStyle = '#9a9aaa';
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8a8b8';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Portal mágico (dentro da base) — brilho pulsante
  const t = performance.now() / 600;
  const pulse = 0.5 + Math.sin(t) * 0.25;

  const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12);
  grd.addColorStop(0, `rgba(255, 255, 255, ${pulse})`);
  grd.addColorStop(0.3, `rgba(200, 150, 255, ${pulse * 0.9})`);
  grd.addColorStop(1, 'rgba(120, 60, 180, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Anel mágico girando
  ctx.strokeStyle = `rgba(200, 150, 255, ${pulse})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 9, t * 2, t * 2 + Math.PI * 1.5);
  ctx.stroke();

  // Partículas pequenas ao redor
  for (let i = 0; i < 4; i++) {
    const angle = (t + i * Math.PI / 2) % (Math.PI * 2);
    const px = cx + Math.cos(angle) * 11;
    const py = cy + Math.sin(angle) * 11;
    ctx.fillStyle = `rgba(220, 180, 255, ${pulse})`;
    ctx.fillRect(px - 1, py - 1, 2, 2);
  }

  // Borda dourada da base
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.stroke();
}

// ============================================================
// FONTE (3x3)
// ============================================================
function drawFountain(tx, ty, tilesW = 3, tilesH = 3) {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tilesW * TILE_SIZE;
  const h = tilesH * TILE_SIZE;

  // Base circular (pedra)
  ctx.fillStyle = '#7a7a8a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Borda interna
  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Água
  const t = performance.now() / 400;
  ctx.fillStyle = `rgba(74, 144, 226, ${0.7 + Math.sin(t) * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 5, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jato central
  ctx.fillStyle = '#8ad8ff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Gotas
  for (let i = 0; i < 3; i++) {
    const phase = (t + i * 0.5) % 1;
    const dropY = y + h / 2 - 10 - Math.sin(phase * Math.PI) * 8;
    const dropX = x + w / 2 + (i - 1) * 4;
    ctx.fillStyle = `rgba(200, 230, 255, ${0.8 - phase * 0.4})`;
    ctx.fillRect(dropX, dropY, 2, 2);
  }
}

function renderInterior(room) {
  const cols = room.cols;
  const rows = room.rows;

  // Offset para centralizar a sala no canvas
  const roomW = cols * TILE_SIZE;
  const roomH = rows * TILE_SIZE;
  const offX = Math.floor((CANVAS_W - roomW) / 2);
  const offY = Math.floor((CANVAS_H - roomH) / 2);

  // Fundo do canvas inteiro (fica bonito se a sala for menor)
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ============================================================
  // CHÃO DE MADEIRA — tábuas horizontais contínuas
  // ============================================================
  const BOARD_H = TILE_SIZE; // altura de cada tábua (20px)
  const numBoards = Math.ceil(rows * TILE_SIZE / BOARD_H);

  // Paleta das tábuas (tons do assoalho)
  const BOARD_COLORS = [
    '#6b4a2b', // médio
    '#6e4c2c',
    '#65472a', // mais escuro
    '#714f2e', // mais claro
    '#6b4a2b',
    '#68472a',
  ];

  // Hash determinístico simples por índice de tábua
  function boardHash(i) {
    let h = 2166136261 ^ i;
    h = Math.imul(h, 16777619);
    return (h >>> 0) / 4294967296;
  }

  for (let b = 0; b < numBoards; b++) {
    const py = offY + b * BOARD_H;
    // Se a tábua passou do limite inferior da sala, apara
    const drawH = Math.min(BOARD_H, offY + rows * TILE_SIZE - py);
    if (drawH <= 0) break;

    const color = BOARD_COLORS[Math.floor(boardHash(b) * BOARD_COLORS.length)];

    // Corpo da tábua (faixa horizontal)
    ctx.fillStyle = color;
    ctx.fillRect(offX, py, roomW, drawH);

    // Linha de separação (junta) entre tábuas
    // Desenha só a linha de cima da tábua (a de baixo é da próxima)
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(offX, py, roomW, 1);

    // Brilho sutil na parte de cima da tábua (dá volume)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(offX, py + 1, roomW, 1);

    // Sombra sutil na parte de baixo
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(offX, py + drawH - 2, roomW, 2);

    // Opcional: "nó de madeira" ocasional em algumas tábuas
    const h = boardHash(b);
    if (h < 0.35) {
      const knots = 1 + Math.floor(h * 3); // 1 a 2 nós
      for (let k = 0; k < knots; k++) {
        const kx = offX + ((h * 977 + k * 331) % 1) * roomW;
        const ky = py + drawH * 0.5;
        // nó: 2 pixels mais escuros
        ctx.fillStyle = 'rgba(40, 20, 8, 0.45)';
        ctx.fillRect(Math.floor(kx), Math.floor(ky), 2, 1);
        ctx.fillStyle = 'rgba(40, 20, 8, 0.25)';
        ctx.fillRect(Math.floor(kx) - 1, Math.floor(ky) + 1, 3, 1);
      }
    }
  }

  // Paredes / porta / mesa
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const t = room.map[y][x];
      const px = offX + x * TILE_SIZE;
      const py = offY + y * TILE_SIZE;

      if (t === T.WALL) {
        ctx.fillStyle = '#3a2a1a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#1a0f08';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      } else if (t === T.DOOR) {
        ctx.fillStyle = '#c9a24d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#a07e2f';
        ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      } else if (t === T.HOUSE) {
        ctx.fillStyle = '#4a2a1a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#7a4a20';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.strokeStyle = '#3a1a08';
        ctx.strokeRect(px + 2.5, py + 2.5, TILE_SIZE - 5, TILE_SIZE - 5);
      }
    }
  }

  // NPC
  const npc = room.npc;
  if (npc) {
    const frame = herbalistFrames.idle[0];
    const nx = offX + npc.tx * TILE_SIZE + TILE_SIZE / 2 - 16;
    const ny = offY + npc.ty * TILE_SIZE + TILE_SIZE - 30;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(frame, nx, ny, 32, 32);
    ctx.globalAlpha = 1;
  }

  // Prompt de interação
  const it = playerStats._nearInteractable;
  if (it && it.kind === 'shop_keep') {
    const cx = offX + it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = offY + it.ty * TILE_SIZE - 16;
    const text = 'Aperte [E]';
    ctx.font = 'bold 10px "Courier New", monospace';
    const w = ctx.measureText(text).width + 10;
    const h = 16;
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(cx - w / 2, cy - h, w, h);
    ctx.strokeStyle = '#c9a24d';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - w / 2 + 0.5, cy - h + 0.5, w - 1, h - 1);
    ctx.fillStyle = '#feca57';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, cx, cy - h / 2 + 1);
  }

  // Jogador
  const composed = composeFrame(player.facing, player.step);
  const scale = (player.size + 4) / 32;
  ctx.drawImage(
    composed,
    offX + player.x - (32 * scale) / 2,
    offY + player.y - (32 * scale) / 2,
    32 * scale, 32 * scale
  );
}