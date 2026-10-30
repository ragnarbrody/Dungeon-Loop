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
import { NPC_SPRITES } from '../sprites/npcs.js';
import { getTrackedQuest, getProgress, isQuestReadyToComplete,
         isQuestActive, isQuestCompleted } from '../quests.js';
import { playerEquip } from '../sprites/equipment.js';
import { getTimeState, getTimeOfDay } from '../core/timeofday.js';
import { applyLighting, applyDayNight, torchLight, nightFactor } from './lighting.js';

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

  // Hash determinístico 2D (embaralha bem, sem padrões diagonais).
  // Baseado em "integer hash" — rápido e estável por tile.
  function tileHash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

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
  } else if (biome.floorStyle === 'cave') {
    // --- Chão de Caverna ---
    // Base uniforme
    ctx.fillStyle = '#26262e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Paleta de tons de pedra (variação sutil, não "checker")
    const caveTones = ['#2a2a33', '#2d2d36', '#282830', '#2f2f38', '#25252d'];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        // Tom base do tile (ruído, sem direção preferida)
        const r1 = tileHash(x, y);
        ctx.fillStyle = caveTones[Math.floor(r1 * caveTones.length)];
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        // Grão fino: 3-4 pontinhos por tile, posição e tom determinísticos
        const r2 = tileHash(x + 91, y - 17);
        const r3 = tileHash(x - 33, y + 61);
        const r4 = tileHash(x + 7, y + 7);
        if (r2 < 0.55) {
          ctx.fillStyle = r2 < 0.25 ? '#1c1c22' : '#35353e';
          ctx.fillRect(px + Math.floor(r3 * 17) + 1, py + Math.floor(r4 * 17) + 1, 2, 1);
        }
        if (r3 < 0.4) {
          ctx.fillStyle = '#1e1e25';
          ctx.fillRect(px + Math.floor(r4 * 15) + 2, py + Math.floor(r2 * 15) + 2, 1, 2);
        }
      }
    }

    // Rachaduras: desenham em ~8% dos tiles, em direções variadas.
    // Desenhadas por cima pra parecer "pedra rachada".
    ctx.strokeStyle = '#181820';
    ctx.lineWidth = 1;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const r = tileHash(x + 300, y - 200);
        if (r > 0.92) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          // Rachadura em "V" ou "L", sempre dentro do tile
          const cx0 = px + 4 + Math.floor(tileHash(x + 1, y + 1) * 8);
          const cy0 = py + 4 + Math.floor(tileHash(x + 2, y + 2) * 8);
          ctx.beginPath();
          ctx.moveTo(cx0, cy0);
          ctx.lineTo(cx0 + (r > 0.96 ? 6 : -5), cy0 + 7);
          ctx.stroke();
        }
      }
    }

    // Manchas escuras grandes (poças de umidade/umidade) — 4% dos tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const r = tileHash(x - 500, y + 400);
        if (r > 0.96) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          ctx.fillStyle = 'rgba(20, 24, 28, 0.4)';
          ctx.beginPath();
          ctx.ellipse(
            px + TILE_SIZE / 2, py + TILE_SIZE / 2,
            TILE_SIZE * 0.55, TILE_SIZE * 0.4,
            0, 0, Math.PI * 2
          );
          ctx.fill();
        }
      }
    }

    // Pequenos musgos verdes (raros, pra dar cor) — 2% dos tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const r = tileHash(x + 800, y + 900);
        if (r > 0.98) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          ctx.fillStyle = 'rgba(40, 70, 45, 0.35)';
          ctx.fillRect(px + 5, py + 11, 4, 3);
          ctx.fillStyle = 'rgba(50, 85, 55, 0.25)';
          ctx.fillRect(px + 10, py + 6, 3, 2);
        }
      }
    }
  } else  {
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
        let wallColor, wallEdge;
        if (biomeId === 'desert')      { wallColor = '#a08050'; wallEdge = '#6b5030'; }
        else if (biomeId === 'cave')   { wallColor = '#3a3a44'; wallEdge = '#1e1e26'; }
        else                           { wallColor = '#5a4a3a'; wallEdge = '#3a2f24'; }

        ctx.fillStyle = wallColor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        // pedra rachada nas paredes da caverna (uma linha horizontal)
        if (biomeId === 'cave') {
          ctx.strokeStyle = '#25252d';
          ctx.beginPath();
          ctx.moveTo(px, py + TILE_SIZE * 0.5);
          ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE * 0.5);
          ctx.stroke();
        }
      } else if (t === T.DOOR) {
        ctx.fillStyle = '#c9a24d';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.fillStyle = '#a07e2f';
        ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      } else if (t === T.CAVE_ENTRANCE) {
        drawCaveEntrance(px, py);
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
  } else if (biomeId === 'cave') {
    // --- Pedras grandes (obstáculos) ---
    // Desenhadas em 2 tiles de altura, com forma irregular, sombra e highlight.
    // A colisão continua sendo 1x1 (o tile T.TREE), mas o visual "sobe"
    // pra cima do tile — igual às árvores. Assim o jogador vê claramente
    // no que está esbarrando.
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.TREE) continue;

        if (currentRoom.cage && x === currentRoom.cage.tx && y === currentRoom.cage.ty) continue;

        const cx = x * TILE_SIZE + TILE_SIZE / 2;
        const baseY = y * TILE_SIZE + TILE_SIZE;  // base do tile (chão)
        const topY  = baseY - 34;                 // sobe ~1.7 tiles
        const px = x * TILE_SIZE;

        // Sombra elíptica (base da pedra no chão)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 2, TILE_SIZE * 0.75, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo da pedra — forma "poligonal" com cantos suavizados
        // Base mais escura, topo mais claro (luz vinda de cima)
        const bodyGrad = ctx.createLinearGradient(0, topY, 0, baseY);
        bodyGrad.addColorStop(0, '#6e6e7a');
        bodyGrad.addColorStop(0.45, '#55555f');
        bodyGrad.addColorStop(1, '#3a3a44');

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        // Ponto a ponto: pedra irregular (pseudo-aleatória por tile)
        const seed = tileHash(x, y); // já existe no bloco do chão
        ctx.moveTo(px + 2,             baseY - 3);
        ctx.lineTo(px + 1,             baseY - 14);
        ctx.lineTo(px + 4,             topY + 8);
        ctx.lineTo(px + TILE_SIZE*0.35, topY + 2 + (seed * 3));
        ctx.lineTo(px + TILE_SIZE*0.65, topY + 1 + (seed * 4));
        ctx.lineTo(px + TILE_SIZE - 4, topY + 9);
        ctx.lineTo(px + TILE_SIZE - 1, baseY - 14);
        ctx.lineTo(px + TILE_SIZE - 2, baseY - 3);
        ctx.closePath();
        ctx.fill();

        // Borda escura (contorno da pedra) — dá definição
        ctx.strokeStyle = '#181820';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight (luz batendo no topo-esquerdo)
        ctx.fillStyle = 'rgba(200, 200, 220, 0.18)';
        ctx.beginPath();
        ctx.moveTo(px + 4,           topY + 8);
        ctx.lineTo(px + TILE_SIZE*0.35, topY + 2 + (seed * 3));
        ctx.lineTo(px + TILE_SIZE*0.5,  topY + 4);
        ctx.lineTo(px + TILE_SIZE*0.3,  topY + 11);
        ctx.closePath();
        ctx.fill();

        // Rachaduras na pedra (linhas escuras)
        ctx.strokeStyle = 'rgba(15, 15, 22, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE*0.4, topY + 12);
        ctx.lineTo(px + TILE_SIZE*0.5, baseY - 8);
        ctx.lineTo(px + TILE_SIZE*0.45, baseY - 4);
        ctx.stroke();

        // Musgo ou fungo no canto (detalhe sutil)
        if (seed > 0.7) {
          ctx.fillStyle = 'rgba(55, 85, 55, 0.6)';
          ctx.fillRect(px + TILE_SIZE - 6, baseY - 6, 3, 2);
        }
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

  drawCage(currentRoom);
  drawTreasureChest(currentRoom);
  drawMapEnemies(currentRoom);

  if (currentRoom.interactables) {
    for (const it of currentRoom.interactables) {
      if (it.kind === 'lost_backpack') {
        if (isQuestCompleted('story_lost_traveler')) continue;
        if (!isQuestActive('story_lost_traveler')) continue;
        const hasLetter = playerStats.inventory.some(i => i.id === 'letter_to_elder');
        if (hasLetter) continue;
        drawLostBackpack(it.tx * TILE_SIZE, it.ty * TILE_SIZE);
      }
    }
  }

  // ---------- PROMPT DE INTERAÇÃO ----------
  if (playerStats._nearInteractable) {
    const it = playerStats._nearInteractable;
    const cx = it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = it.ty * TILE_SIZE - 16;

    let text;
    if (it.kind === 'lost_backpack') {
      text = 'Abrir mochila [E]';
    } else if (it.kind === 'caged_villager') {
      text = 'Examinar jaula [E]';
    } else if (it.kind === 'cave_entrance') {
      text = it.procedural ? 'Entrar na caverna [E]' : 'Entrar na Caverna Sombria [E]';
    } else if (it.kind === 'treasure_chest') {
      text = 'Abrir baú [E]';
    } else {
      text = 'Aperte [E]';
    }

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

  // ---------- ILUMINAÇÃO ----------
  if (biomeId === 'cave') {
    const lights = [];
    if (playerEquip.leftHand === 'torch') {
      lights.push({ x: player.x, y: player.y, radius: 120, strength: 1, inner: 0.3,
                    color: [255, 200, 100], warm: 0.15, flicker: true });
    }
    if (currentRoom.floorTorch) {
      const ft = currentRoom.floorTorch;
      lights.push({ x: ft.tx * TILE_SIZE + TILE_SIZE / 2, y: ft.ty * TILE_SIZE + TILE_SIZE / 2,
                    radius: 80, strength: 0.75, color: [255, 170, 80], warm: 0.12, flicker: true });
    }
    applyLighting({ color: [0, 0, 0], alpha: 0.95, lights });
  } else {
    const torch = torchLight(player.x, player.y);
    applyDayNight(torch ? [torch] : [], player);
  }

  drawFloorTorch(currentRoom);
  // ---------- HUD DE QUEST (canto inferior esquerdo) ----------
  drawQuestTracker();
}

// ============================================================
// HUD DE QUEST — desenha a quest rastreada no canto inferior esquerdo.
// Chamado por renderExplore e renderCity.
// ============================================================
// ============================================================
// HUD DE QUEST — desenha a quest rastreada no canto inferior esquerdo.
// Quebra o texto em múltiplas linhas para não atravessar a tela.
// ============================================================
function drawQuestTracker() {
  const tracked = getTrackedQuest();
  if (!tracked) return;

  const MAX_W = CANVAS_W - 40;      // largura máxima da caixa (deixa margem)
  const LINE_H = 14;                // altura de cada linha de detalhe
  const PAD_X = 10;
  const PAD_Y = 8;
  const TITLE_H = 16;

  // Monta os pedaços de texto (título + cada objetivo)
  const title = `★ ${tracked.title}`;

  // ---- 1) Mede e quebra o título ----
  ctx.font = 'bold 11px "Courier New", monospace';
  const titleLines = wrapLines(title, MAX_W - PAD_X * 2);

  // ---- 2) Mede e quebra cada objetivo ----
  ctx.font = '10px "Courier New", monospace';
  const detailLines = [];
  for (const obj of tracked.objectives) {
    const cur = getProgress(tracked.id, obj.id);
    const line = `${obj.text}: ${cur}/${obj.target}`;
    const wrapped = wrapLines(line, MAX_W - PAD_X * 2);
    for (const w of wrapped) detailLines.push(w);
  }

  const ready = isQuestReadyToComplete(tracked.id);
  if (ready) {
    const wrapped = wrapLines('✔ Volte ao Ancião', MAX_W - PAD_X * 2);
    for (const w of wrapped) detailLines.push(w);
  }

  // ---- 3) Calcula altura total ----
  const totalLines = titleLines.length + detailLines.length;
  // altura: título (TITLE_H) + linhas de detalhe + padding
  const boxH = PAD_Y * 2 + TITLE_H + (detailLines.length * LINE_H);

  // ---- 4) Posiciona a caixa ----
  const bx = 10;
  const by = CANVAS_H - boxH - 10;

  // ---- 5) Desenha fundo ----
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(bx, by, MAX_W, boxH);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, MAX_W - 1, boxH - 1);

  // ---- 6) Desenha título (dourado) ----
  ctx.fillStyle = '#feca57';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let ty = by + PAD_Y + TITLE_H / 2;
  for (const line of titleLines) {
    ctx.fillText(line, bx + PAD_X, ty);
    ty += TITLE_H;
  }

  // ---- 7) Desenha detalhes (branco/cinza + verde se pronto) ----
  ctx.font = '10px "Courier New", monospace';
  ty = by + PAD_Y + TITLE_H + LINE_H / 2;
  for (let i = 0; i < detailLines.length; i++) {
    const isReadyLine = ready && i === detailLines.length - 1;
    ctx.fillStyle = isReadyLine ? '#6fbd63' : '#ddd';
    ctx.fillText(detailLines[i], bx + PAD_X, ty);
    ty += LINE_H;
  }
}

// Quebra um texto em linhas que caibam em maxW, respeitando palavras.
// Retorna array de strings (sempre >= 1 linha).
function wrapLines(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
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
  // ============================================================
  const grassRng = makeRng(seedFrom(room.gx * 3, room.gy * 11));

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = room.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (t === T.FLOOR || t === T.TREE) {
        const roll = grassRng();
        let gType = 0;
        if (roll < 0.02)      gType = 2;
        else if (roll < 0.04) gType = 3;
        else if (roll < 0.06) gType = 4;
        else if (roll < 0.25) gType = 1;
        ctx.drawImage(grassTiles[gType], px, py);
      } else if (t === T.STREET) {
        ctx.fillStyle = '#a8845a';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        if (((x * 7 + y * 13) % 5) === 0) {
          ctx.fillStyle = '#8a6a40';
          ctx.fillRect(px + 4, py + 6, 2, 2);
        }
        if (((x * 11 + y * 3) % 7) === 0) {
          ctx.fillStyle = '#c4a06a';
          ctx.fillRect(px + 12, py + 14, 2, 1);
        }
      } else if (t === T.PLAZA) {
        ctx.fillStyle = '#a8a8b8';
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = '#9090a0';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
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

  // Grade
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
    ctx.fillRect(sx + sw, sy - 4, 6, sh + 8);
    ctx.fillRect(sx + 4, sy - 4, sw, 4);
  }

  // ---------- CASAS ----------
  for (const obj of room.cityObjects) {
    drawBuilding(obj, room);
  }

  // ---------- PORTAL ----------
  drawPortalStatue(room.portal, mid);

  // ---------- ESTANDARTES ----------
  for (const obj of room.cityObjects) {
    drawBannerNextToDoor(obj);
  }

  // ---------- PLACAS ----------
  for (const obj of room.cityObjects) {
    const signX = obj.signTx * TILE_SIZE + TILE_SIZE / 2;
    const signY = obj.signTy * TILE_SIZE + TILE_SIZE / 2;

    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(signX - 1, signY + 4, 2, 6);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(signX - 14, signY - 4, 28, 10);
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 1;
    ctx.strokeRect(signX - 14 + 0.5, signY - 4 + 0.5, 27, 9);
    ctx.fillStyle = '#5a3a24';
    ctx.fillRect(signX - 10, signY - 1, 20, 1);
    ctx.fillRect(signX - 8, signY + 1, 16, 1);
    ctx.fillRect(signX - 6, signY + 3, 12, 1);
  }

  // Árvores
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (room.map[y][x] !== T.TREE) continue;
      const frame = treeFrames[Math.floor(performance.now() / 450 + (x + y)) % 2];
      const dx = x * TILE_SIZE + TILE_SIZE / 2 - treeFrames[0].width / 2;
      const dy = y * TILE_SIZE + TILE_SIZE - treeFrames[0].height;
      ctx.drawImage(frame, dx, dy);
    }
  }

  // Folhas
  for (const L of getActiveLeaves()) {
    const tt = L.age / L.life;
    let color;
    if (tt < 0.4)      color = '#6fbd63';
    else if (tt < 0.8) color = '#8a9a4a';
    else               color = '#c9b048';
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(L.x), Math.floor(L.y), 2, 2);
  }

  // ---------- ILUMINAÇÃO NOTURNA (agora ANTES do prompt) ----------
  if (getTimeState().darkness > 0.01) {
    const lit = nightFactor();
    const lights = [];

    const torch = torchLight(player.x, player.y);
    if (torch) lights.push(torch);

    if (lit > 0) {
      lights.push({
        x: room.portal.tx * TILE_SIZE + TILE_SIZE / 2,
        y: room.portal.ty * TILE_SIZE + TILE_SIZE / 2,
        radius: 110, strength: 0.8 * lit, inner: 0.1,
        color: [190, 120, 255], warm: 0.5 * lit, pulse: true,
      });
      for (const obj of room.cityObjects) {
        for (const r of windowRects(obj)) {
          lights.push({
            x: r.x + r.w / 2, y: r.y + r.h / 2,
            radius: 48, strength: 0.75 * lit,
            color: [255, 200, 110], warm: 0.35 * lit,
          });
        }
      }
    }

    applyDayNight(lights, player);

    // Janelas emissivas redesenhadas POR CIMA da escuridão
    if (lit > 0) {
      ctx.fillStyle = windowColor(lit);
      for (const obj of room.cityObjects) {
        for (const r of windowRects(obj)) ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }
    }
  }

  // ---------- PROMPT DE INTERAÇÃO (agora por cima de TUDO) ----------
  const it = playerStats._nearInteractable;
  if (it) {
    const cx = it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = it.ty * TILE_SIZE - 16;
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

  // ---------- HUD DE QUEST ----------
  drawQuestTracker();
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
  const lit = nightFactor();
  for (const r of windowRects(obj)) {
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = windowColor(lit);
    ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  }

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

function windowRects(obj) {
  const x = obj.tx * TILE_SIZE, y = obj.ty * TILE_SIZE, w = obj.w * TILE_SIZE;
  const winW = 10, winH = 8, winY = y + 30;
  // Só a janela esquerda: a direita é ocupada pelo estandarte da loja
  return [{ x: x + w * 0.25 - winW / 2, y: winY, w: winW, h: winH }];
}

// cinza-azulado de dia → dourado de noite
function windowColor(lit) {
  const a = [90, 106, 122], b = [254, 202, 87];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * lit)).join(',')})`;
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

  const doorCenterX = x + w / 2;
  const bannerX = doorCenterX + 22;
  const bannerY = y + h - 30;

  const t = performance.now() / 1000;

  // Mastro (fica parado — só o pano balança)
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(bannerX - 2, bannerY, 12, 2);
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bannerX + 10, bannerY - 1, 2, 4);

  // Dimensões do pano
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

  // ------------------------------------------------------------
  // Onda do pano:
  //   - amplitude cresce com a distância do topo (ponta balança mais)
  //   - phase global faz a onda "viajar" de cima pra baixo
  //   - usamos segments de 1px pra ter um resultado suave
  // ------------------------------------------------------------
  const amplitudeMax = 1.8;   // px (quanto a ponta se desloca)
  const waveSpeed = 1.8;      // velocidade da onda

  // Pré-calcula o deslocamento de cada linha (y local 0..bannerH)
  const offsets = [];
  for (let ly = 0; ly < bannerH; ly++) {
    // fator 0 no topo (preso ao mastro), 1 na base
    const factor = ly / (bannerH - 1);
    // onda viajando pra baixo + balanço lento
    const wave =
      Math.sin(t * waveSpeed - ly * 0.45) * amplitudeMax * factor +
      Math.sin(t * 1.1) * 0.4 * factor;
    offsets.push(wave);
  }

  // ------------------------------------------------------------
  // Desenha o pano como faixas horizontais de 1px, cada uma
  // deslocada horizontalmente pelo `offsets[ly]`.
  // ------------------------------------------------------------
  for (let ly = 0; ly < bannerH; ly++) {
    const ox = Math.round(offsets[ly]);
    ctx.fillStyle = bannerColor;
    ctx.fillRect(bx + ox, by + ly, bannerW, 1);

    // sombra/borda interna: escurece as laterais do pano
    // (só desenha nas 2 colunas mais externas, com alpha)
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(bx + ox, by + ly, 1, 1);
    ctx.fillRect(bx + ox + bannerW - 1, by + ly, 1, 1);

    // brilho central (dá volume)
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx + ox + 2, by + ly, bannerW - 4, 1);
  }

  // ------------------------------------------------------------
  // Borda dourada (também ondula, seguindo o mesmo offsets)
  // ------------------------------------------------------------
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // lado esquerdo de cima pra baixo
  ctx.moveTo(bx + Math.round(offsets[0]) + 0.5, by + 0.5);
  for (let ly = 1; ly < bannerH; ly++) {
    ctx.lineTo(bx + Math.round(offsets[ly]) + 0.5, by + ly + 0.5);
  }
  // base esquerda → base direita (a "boca" do V ainda vem depois)
  // lado direito de baixo pra cima
  for (let ly = bannerH - 1; ly >= 0; ly--) {
    ctx.lineTo(bx + Math.round(offsets[ly]) + bannerW - 0.5, by + ly + 0.5);
  }
  ctx.closePath();
  ctx.stroke();

  // ------------------------------------------------------------
  // Ponta inferior (V): o ponto central "cai" um pouco
  // e também ondula lateralmente junto com a última linha.
  // ------------------------------------------------------------
  const tipOffset = Math.round(offsets[bannerH - 1] + Math.sin(t * 2.2) * 0.8);
  const leftX  = bx + Math.round(offsets[bannerH - 1]);
  const rightX = leftX + bannerW;
  const centerX = leftX + bannerW / 2 + Math.sin(t * 2.2) * 0.5;

  ctx.fillStyle = bannerColor;
  ctx.beginPath();
  ctx.moveTo(leftX, by + bannerH);
  ctx.lineTo(centerX + tipOffset * 0.2, by + bannerH + 4);
  ctx.lineTo(rightX, by + bannerH);
  ctx.closePath();
  ctx.fill();

  // Borda dourada do V
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX + 0.5, by + bannerH + 0.5);
  ctx.lineTo(centerX + tipOffset * 0.2, by + bannerH + 4.5);
  ctx.lineTo(rightX - 0.5, by + bannerH + 0.5);
  ctx.stroke();

  // ------------------------------------------------------------
  // Ícone no centro — PARADO (não ondula, pra ficar legível).
  // Centralizado na posição média das linhas, pra não "descolar".
  // ------------------------------------------------------------
  let midSum = 0;
  for (let ly = 6; ly < 16; ly++) midSum += offsets[ly]; // faixa do meio
  const midOffset = midSum / 10;

  drawBannerIcon(
    obj.id,
    Math.floor(bx + bannerW / 2 + midOffset),
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
    const npcSprites = NPC_SPRITES[npc.id] || NPC_SPRITES.herbalist;
    const frame = npcSprites.idle[0];
    const nx = offX + npc.tx * TILE_SIZE + TILE_SIZE / 2 - 16;
    const ny = offY + npc.ty * TILE_SIZE + TILE_SIZE - 30;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(frame, nx, ny, 32, 32);
    ctx.globalAlpha = 1;
  }

  // Prompt de interação (tanto herbalista quanto ancião)
  const it = playerStats._nearInteractable;
  if (it && (it.kind === 'shop_keep' || it.kind === 'herbalist_quest' || it.kind === 'blacksmith_quest'  || it.kind === 'elder')) {
    const cx = offX + it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = offY + it.ty * TILE_SIZE - 16;

    let text;
    if (it.kind === 'elder') {
      text = 'Conversar: Ancião [E]';
    } else if (it.kind === 'herbalist_quest') {
      text = 'Conversar: Herbalista [E]';
    } else if (it.kind === 'blacksmith_quest') {
      text = 'Conversar: Ferreiro [E]';
    } else {
      text = 'Abrir loja [E]';
    }

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

  const time = getTimeState();
  if (time.darkness > 0.3) {
    // só uma penumbra MUITO leve — interiores têm velas/lampiões
    ctx.fillStyle = `rgba(20, 15, 30, ${0.18 * time.darkness})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawLostBackpack(px, py) {
  // Sombra no chão
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Corpo da mochila (couro)
  const bx = px + 4;
  const by = py + 6;
  const bw = TILE_SIZE - 8;
  const bh = TILE_SIZE - 8;

  // Corpo
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(bx, by, bw, bh);

  // Tampa
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(bx, by, bw, 4);

  // Fivela (dourado)
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bx + bw / 2 - 1, by + 4, 2, 3);

  // Alça
  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by - 1, 4, Math.PI, 0);
  ctx.stroke();

  // Um brilho sutil pra chamar atenção (pulsante)
  const t = performance.now() / 500;
  const pulse = 0.3 + Math.sin(t) * 0.15;
  ctx.fillStyle = `rgba(254, 202, 87, ${pulse})`;
  ctx.beginPath();
  ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 12, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
// ENTRADA DA CAVERNA
// Desenhada num tile de 20x20, mas com um "morcego" e um brilho
// pra chamar atenção. A entrada em si é um buraco escuro.
// ============================================================

function drawCaveEntrance(px, py) {
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  // 1. Salva o estado do contexto para não afetar os próximos tiles
  ctx.save();

  // 2. Desenha a grama de fundo neste tile específico para "limpar" o local
  // (Isso garante que não haja nada desenhado por baixo que possa ser misturado)
  const grassFrame = grassTiles[0]; // Usa a grama padrão
  if (grassFrame) {
    ctx.drawImage(grassFrame, px, py, TILE_SIZE, TILE_SIZE);
  }

  // 3. A partir daqui, desenhamos a caverna por cima
  // Base de pedra (pedras irregulares em volta da entrada)
  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pedras menores em volta (detalhe)
  ctx.fillStyle = '#5a5a62';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * 11;
    const ry = cy + 4 + Math.sin(angle) * 6;
    ctx.beginPath();
    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buraco escuro (a entrada em si)
  ctx.fillStyle = '#0a0a12';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Borda interna mais clara (profundidade)
  ctx.strokeStyle = '#2a2a32';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Brilho pulsante saindo do buraco (chama atenção)
  const t = performance.now() / 600;
  const pulse = 0.3 + Math.sin(t) * 0.15;
  
  // O SEGREDO: Em vez de um gradiente radial que vaza, usamos um gradiente
  // que é mascarado pela área do tile, ou simplesmente desenhamos o brilho
  // de forma mais controlada.
  const grd = ctx.createRadialGradient(cx, cy + 2, 2, cx, cy + 2, 12);
  grd.addColorStop(0, `rgba(120, 60, 160, ${pulse})`);
  grd.addColorStop(1, 'rgba(120, 60, 160, 0)');
  
  ctx.fillStyle = grd;
  ctx.beginPath();
  // Usamos um clip (recorte) para garantir que o brilho não saia do tile
  ctx.rect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.clip();
  
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
  ctx.fill();

  // "Morcegos" (dois pontinhos pretos voando em círculo)
  for (let i = 0; i < 2; i++) {
    const angle = t * 2 + i * Math.PI;
    const bx = cx + Math.cos(angle) * 10;
    const by = cy - 8 + Math.sin(angle * 2) * 4;
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(bx - 1, by, 2, 2);
  }

  // 4. Restaura o contexto
  ctx.restore();
}

function drawCage(room) {
  const c = room.cage;
  if (!c) return;
  const s = TILE_SIZE;
  const x = c.tx * s, y = c.ty * s;
  const freed = isQuestCompleted('story_cave');

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 1, y + s - 3, s - 2, 3);

  if (!freed) {                       // aldeão dentro
    ctx.fillStyle = '#c98b5a';
    ctx.beginPath(); ctx.arc(x + s / 2, y + s * 0.32, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4f8a';
    ctx.fillRect(x + s * 0.3, y + s * 0.48, s * 0.4, s * 0.38);
  }

  ctx.fillStyle = '#4a4a55';
  ctx.fillRect(x, y + s - 4, s, 4);
  ctx.fillRect(x, y, s, 3);

  ctx.fillStyle = '#8a8a99';
  for (const i of (freed ? [0, 4] : [0, 1, 2, 3, 4])) {   // aberta: só as barras das pontas
    ctx.fillRect(x + (i * (s - 2)) / 4, y + 3, 2, s - 7);
  }
}

function drawFloorTorch(room) {
  const t = room.floorTorch;
  if (!t) return;

  const px = t.tx * TILE_SIZE;
  const py = t.ty * TILE_SIZE;
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  const now = performance.now() / 1000;
  const flicker = 0.85 + Math.sin(now * 9) * 0.1 + Math.sin(now * 23) * 0.05;

  // 1) Glow quente MUITO sutil no chão (embaixo de tudo).
  //    Raio pequeno e alpha baixo — só dá "calor" pra área, sem apagar
  //    o cabo nem a jaula.
  const warmGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  warmGrd.addColorStop(0, 'rgba(255, 170, 80, 0.10)');
  warmGrd.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = warmGrd;
  ctx.fillRect(cx - 30, cy - 30, 60, 60);

  // 2) Sombra no chão
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3) Cabo (madeira) — desenhado DEPOIS do glow quente,
  //    pra ficar visível mesmo com a luz forte.
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - 1, cy - 6, 2, 12);
  // Brilho no cabo (dá leitura 3D)
  ctx.fillStyle = 'rgba(160, 120, 70, 0.5)';
  ctx.fillRect(cx - 1, cy - 6, 1, 12);

  // 4) Chama (3 camadas, com flicker)
  const flameH = 6 * flicker;
  ctx.fillStyle = 'rgba(255, 120, 30, 0.9)';
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 - flameH * 1.2, cx + 3, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 + 2, cx - 3, cy - 6);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 200, 60, 0.95)';
  ctx.beginPath();
  ctx.moveTo(cx - 2, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 - flameH * 0.9, cx + 2, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 + 1, cx - 2, cy - 6);
  ctx.fill();

  ctx.fillStyle = '#fff5c0';
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 - flameH * 0.6, cx + 1, cy - 6);
  ctx.quadraticCurveTo(cx, cy - 6 + 0.5, cx - 1, cy - 6);
  ctx.fill();
}

function drawTreasureChest(room) {
  const c = room.treasureChest;
  if (!c) return;
  const s = TILE_SIZE;
  const x = c.tx * s, y = c.ty * s;

  // Só desenha se ainda não foi aberto
  // (o estado "aberto" fica em currentRoom._chestOpened)
  if (room._chestOpened) {
    // baú aberto: tampa pra cima, interior escuro
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(x + 2, y + s - 12, s - 4, 10);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(x + 4, y + s - 10, s - 8, 6);
    ctx.fillStyle = '#c9a24d';
    ctx.fillRect(x + 2, y + s - 6, s - 4, 1);
    return;
  }

  // Baú fechado
  // Corpo (madeira)
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(x + 2, y + s - 12, s - 4, 10);
  // Tampa (madeira mais escura)
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(x + 2, y + s - 14, s - 4, 4);
  // Faixa dourada
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(x + 2, y + s - 9, s - 4, 1);
  // Fechadura
  ctx.fillStyle = '#f0d27a';
  ctx.fillRect(x + s / 2 - 1, y + s - 8, 2, 3);
  // Brilho sutil pulsante
  const t = performance.now() / 500;
  const pulse = 0.25 + Math.sin(t) * 0.1;
  ctx.fillStyle = `rgba(254, 202, 87, ${pulse})`;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s - 6, 10, 0, Math.PI * 2);
  ctx.fill();
}