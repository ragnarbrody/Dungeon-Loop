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
import { campfireFrames } from '../sprites/campfire.js';
import { tentFrames } from '../sprites/tent.js';

export function renderExplore() {
  if (!currentRoom) return;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

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

  // Dungeon do deserto: usa chão e paredes de caverna (pedra escura),
  // não areia clara. E os obstáculos são pilares, não cactos.
  const isDesertDungeon = currentRoom.isDungeon && currentRoom.dungeonTheme === 'desert';
  const floorStyle = isDesertDungeon ? 'cave' : biome.floorStyle;

  const roomRng = makeRng(seedFrom(currentRoom.gx, currentRoom.gy));

  function tileHash(x, y) {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  const grassLayout = [];
  if (floorStyle === 'grass') {
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
  if (floorStyle === 'sand') {
    drawSandFloor(currentRoom, roomRng);
  } else if (floorStyle === 'cave') {
    // --- Chão de Caverna ---
    ctx.fillStyle = '#26262e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const caveTones = ['#2a2a33', '#2d2d36', '#282830', '#2f2f38', '#25252d'];

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        const r1 = tileHash(x, y);
        ctx.fillStyle = caveTones[Math.floor(r1 * caveTones.length)];
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

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

    ctx.strokeStyle = '#181820';
    ctx.lineWidth = 1;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.CAVE_FLOOR) continue;
        const r = tileHash(x + 300, y - 200);
        if (r > 0.92) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          const cx0 = px + 4 + Math.floor(tileHash(x + 1, y + 1) * 8);
          const cy0 = py + 4 + Math.floor(tileHash(x + 2, y + 2) * 8);
          ctx.beginPath();
          ctx.moveTo(cx0, cy0);
          ctx.lineTo(cx0 + (r > 0.96 ? 6 : -5), cy0 + 7);
          ctx.stroke();
        }
      }
    }

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

  // ---------- PAREDES E PORTAS ----------
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = currentRoom.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (t === T.WALL) {
        let wallColor, wallEdge;
        if (biomeId === 'cave' || isDesertDungeon) { wallColor = '#3a3a44'; wallEdge = '#1e1e26'; }
        else if (biomeId === 'desert')             { wallColor = '#a08050'; wallEdge = '#6b5030'; }
        else                                       { wallColor = '#5a4a3a'; wallEdge = '#3a2f24'; }

        ctx.fillStyle = wallColor;
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = wallEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

        if (biomeId === 'cave' || isDesertDungeon) {
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
        drawCaveEntrance(px, py, currentRoom);
      }
    }
  }

  // ---------- OBSTÁCULOS (cactos / pedras de caverna / pilares) ----------
  if (biomeId === 'desert' && !isDesertDungeon) {
    // Cactos (apenas no mundo aberto do deserto)
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.TREE) continue;
        const frame = cactusFrames[Math.floor(performance.now() / 600 + (x + y)) % 2];
        const dx = x * TILE_SIZE + TILE_SIZE / 2 - cactusFrames[0].width / 2;
        const dy = y * TILE_SIZE + TILE_SIZE - cactusFrames[0].height;
        ctx.drawImage(frame, dx, dy);
      }
    }
  } else if (biomeId === 'cave' || isDesertDungeon) {
    // Dungeon do deserto: primeiro desenha os pilares (com as tochas),
    // depois as pedras. O `drawCaveRocks` pula os tiles de pilar.

    const pillarTiles = new Set(
      (currentRoom.pillars || []).map(p => `${p.tx},${p.ty}`)
    );

    if (isDesertDungeon) {
      for (const p of (currentRoom.pillars || [])) {
        drawPillar(p.tx * TILE_SIZE, p.ty * TILE_SIZE, p.hasTorch);
      }
    }

    drawCaveRocks(currentRoom, tileHash, pillarTiles);
  } else if (biome.trees) {
    // Árvores (pula tendas do acampamento)
    const tentTiles = new Set();
    if (currentRoom.tents) {
      for (const t of currentRoom.tents) {
        for (let ty2 = t.ty; ty2 < t.ty + t.h; ty2++) {
          for (let tx2 = t.tx; tx2 < t.tx + t.w; tx2++) {
            tentTiles.add(`${tx2},${ty2}`);
          }
        }
      }
    }

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (currentRoom.map[y][x] !== T.TREE) continue;
        if (tentTiles.has(`${x},${y}`)) continue;
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

  // ---- Acampamento dos goblins ----
  if (currentRoom.isFixed && currentRoom.tents) {
    for (const t of currentRoom.tents) {
      const tx = t.tx * TILE_SIZE;
      const ty = t.ty * TILE_SIZE;
      ctx.drawImage(tentFrames[0], tx, ty, TILE_SIZE * 2, TILE_SIZE * 2);
    }

    if (currentRoom.floorTorch) {
      drawCampfire(currentRoom.floorTorch);
    }

    if (currentRoom.bannerPos) {
      const hasBanner = (currentRoom.interactables || [])
        .some(it => it.kind === 'banner');
      if (hasBanner) {
        drawBannerInCamp(currentRoom.bannerPos);
      }
    }
  }

  drawCage(currentRoom);
  drawTreasureChest(currentRoom);
  drawGoblinCones(currentRoom);
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

  drawHerbalistEscort(currentRoom);
  drawHerbs(currentRoom);

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

  // Companion (Herbalista)
  if (playerStats._escortActive && playerStats._escortPos && isQuestActive('story_herbalist_escort')) {
    const c = playerStats._escortPos;
    const frame = NPC_SPRITES.herbalist.idle[0];
    const scale = (player.size + 4) / 32;
    const w = 32 * scale;
    const h = 32 * scale;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
      frame,
      c.x - w / 2, c.y - h / 2,
      w, h
    );
    ctx.globalAlpha = 1;
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
  if (biomeId === 'cave' || isDesertDungeon) {
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

    // ---- Tochas de parede dos pilares (dungeon do deserto) ----
    if (isDesertDungeon && currentRoom.pillars) {
      for (const p of currentRoom.pillars) {
        if (!p.hasTorch) continue;
        lights.push({
          x: p.tx * TILE_SIZE + TILE_SIZE / 2,
          y: p.ty * TILE_SIZE + TILE_SIZE / 2 - 26,
          radius: 140, strength: 0.85, inner: 0.25,
          color: [255, 170, 80], warm: 0.30, flicker: true,
        });
      }
    }

    // ---- Escuridão por tema ----
    // Caverna normal: breu quase total (preto puro).
    // Dungeon do deserto: penumbra quente (marrom-azulada), pra dar
    // pra enxergar o chão de pedra mesmo longe das tochas. As tochas
    // dos pilares continuam marcando os "pontos de luz" da sala.
    let darknessColor, darknessAlpha;
    if (isDesertDungeon) {
      // overlay marrom-azulado (R alto, G médio, B baixo-médio)
      darknessColor = [22, 16, 28];
      darknessAlpha = 0.74;
    } else {
      darknessColor = [0, 0, 0];
      darknessAlpha = 0.95;
    }

    applyLighting({ color: darknessColor, alpha: darknessAlpha, lights });
  } else {
    const lights = [];

    const torch = torchLight(player.x, player.y);
    if (torch) lights.push(torch);

    if (
      currentRoom.isFixed &&
      currentRoom.floorTorch &&
      getTimeState().darkness > 0.15
    ) {
      const ft = currentRoom.floorTorch;
      const cx = ft.tx * TILE_SIZE + TILE_SIZE;
      const cy = ft.ty * TILE_SIZE + TILE_SIZE;
      lights.push({
        x: cx, y: cy,
        radius: 140,
        strength: 0.95,
        inner: 0.15,
        color: [255, 170, 80],
        warm: 0.35,
        flicker: true,
      });
    }

    applyDayNight(lights, player);
  }

  drawFloorTorch(currentRoom);
  drawQuestTracker();
}

/* ------------------------------------------------------------------ */
/*  drawCaveRocks / drawPillar — extraídos/novos                       */
/* ------------------------------------------------------------------ */

// Extrai o bloco de "pedras grandes" da caverna em função própria.
// Pula os tiles que são pilares (eles são desenhados por drawPillar).
function drawCaveRocks(room, tileHash, skipSet) {
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (room.map[y][x] !== T.TREE) continue;
      if (skipSet && skipSet.has(`${x},${y}`)) continue;
      if (room.cage && x === room.cage.tx && y === room.cage.ty) continue;

      const cx = x * TILE_SIZE + TILE_SIZE / 2;
      const baseY = y * TILE_SIZE + TILE_SIZE;
      const topY  = baseY - 34;
      const px = x * TILE_SIZE;

      // Sombra elíptica
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 2, TILE_SIZE * 0.75, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Corpo da pedra
      const bodyGrad = ctx.createLinearGradient(0, topY, 0, baseY);
      bodyGrad.addColorStop(0, '#6e6e7a');
      bodyGrad.addColorStop(0.45, '#55555f');
      bodyGrad.addColorStop(1, '#3a3a44');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      const seed = tileHash(x, y);
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

      ctx.strokeStyle = '#181820';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(200, 200, 220, 0.18)';
      ctx.beginPath();
      ctx.moveTo(px + 4,           topY + 8);
      ctx.lineTo(px + TILE_SIZE*0.35, topY + 2 + (seed * 3));
      ctx.lineTo(px + TILE_SIZE*0.5,  topY + 4);
      ctx.lineTo(px + TILE_SIZE*0.3,  topY + 11);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(15, 15, 22, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE*0.4, topY + 12);
      ctx.lineTo(px + TILE_SIZE*0.5, baseY - 8);
      ctx.lineTo(px + TILE_SIZE*0.45, baseY - 4);
      ctx.stroke();

      if (seed > 0.7) {
        ctx.fillStyle = 'rgba(55, 85, 55, 0.6)';
        ctx.fillRect(px + TILE_SIZE - 6, baseY - 6, 3, 2);
      }
    }
  }
}

// ============================================================
// PILAR DE PEDRA (dungeon do deserto)
//
// - Colisão 1×1 no tile (p.ty), mas o sprite "sobe" ~2 tiles.
// - Tocha é de PAREDE (suporte de ferro pregado na lateral do pilar),
//   não de chão: a chama sai da lateral, na altura dos "olhos".
// - Fumaça/flicker levemente animados.
// ============================================================
function drawPillar(px, py, hasTorch) {
  const cx = px + TILE_SIZE / 2;
  const baseY = py + TILE_SIZE;       // base do tile (chão)
  const topY  = baseY - 40;           // pilar sobe ~2 tiles
  const W = TILE_SIZE;                // largura do pilar = 1 tile

  // -------- Sombra elíptica no chão --------
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 2, W * 0.72, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // -------- Base (bloco mais largo) --------
  ctx.fillStyle = '#4a4a55';
  ctx.fillRect(px + 1, baseY - 8, W - 2, 8);
  ctx.strokeStyle = '#1e1e26';
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 1.5, baseY - 7.5, W - 3, 7);
  // brilho superior da base
  ctx.fillStyle = 'rgba(180, 180, 200, 0.15)';
  ctx.fillRect(px + 2, baseY - 8, W - 4, 1);

  // -------- Fuste (coluna) --------
  const shaftX = px + 3;
  const shaftW = W - 6;
  const shaftTopY = topY + 8;
  const shaftBotY = baseY - 8;

  const shaftGrad = ctx.createLinearGradient(shaftX, 0, shaftX + shaftW, 0);
  shaftGrad.addColorStop(0,   '#3a3a44');
  shaftGrad.addColorStop(0.5, '#5a5a66');
  shaftGrad.addColorStop(1,   '#3a3a44');
  ctx.fillStyle = shaftGrad;
  ctx.fillRect(shaftX, shaftTopY, shaftW, shaftBotY - shaftTopY);

  // Linhas de "junta" horizontais
  ctx.strokeStyle = 'rgba(20, 20, 28, 0.65)';
  ctx.lineWidth = 1;
  for (let ly = shaftTopY + 6; ly < shaftBotY; ly += 8) {
    ctx.beginPath();
    ctx.moveTo(shaftX, ly + 0.5);
    ctx.lineTo(shaftX + shaftW, ly + 0.5);
    ctx.stroke();
  }

  // Rachaduras sutis
  ctx.strokeStyle = 'rgba(15, 15, 22, 0.7)';
  ctx.beginPath();
  ctx.moveTo(cx - 2, shaftTopY + 10);
  ctx.lineTo(cx - 1, shaftTopY + 16);
  ctx.lineTo(cx - 2, shaftBotY - 6);
  ctx.stroke();

  // -------- Capitel (topo, mais largo) --------
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(px + 1, topY + 2, W - 2, 7);
  ctx.strokeStyle = '#1e1e26';
  ctx.strokeRect(px + 1.5, topY + 2.5, W - 3, 6);
  // brilho do capitel
  ctx.fillStyle = 'rgba(200, 200, 220, 0.18)';
  ctx.fillRect(px + 2, topY + 2, W - 4, 1);

  // -------- Tocha de parede --------
  if (hasTorch) {
    const now = performance.now() / 1000;
    const flicker = 0.85 + Math.sin(now * 9) * 0.1 + Math.sin(now * 23) * 0.05;

    // Suporte de ferro: uma "braçadeira" horizontal saindo da lateral
    // esquerda do pilar, com um pequeno cesto na ponta.
    // (Fica na altura dos olhos — ~26px acima da base.)
    const bracketY = baseY - 26;
    const bracketLen = 7;

    // braçadeira presa na lateral esquerda
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(px - bracketLen, bracketY, bracketLen, 2);
    // "abraçadeira" vertical no pilar (fixação)
    ctx.fillRect(px + 1, bracketY - 2, 2, 6);
    // brilho sutil no ferro
    ctx.fillStyle = 'rgba(160, 120, 80, 0.4)';
    ctx.fillRect(px - bracketLen, bracketY, bracketLen, 1);

    // Cesto (pequeno cone invertido) na ponta do suporte
    const basketX = px - bracketLen;
    const basketY = bracketY + 2;
    ctx.fillStyle = '#2a1a10';
    ctx.beginPath();
    ctx.moveTo(basketX - 3, basketY);
    ctx.lineTo(basketX + 3, basketY);
    ctx.lineTo(basketX + 2, basketY + 4);
    ctx.lineTo(basketX - 2, basketY + 4);
    ctx.closePath();
    ctx.fill();

    // Chama saindo do cesto (3 camadas)
    const flameH = 7 * flicker;
    const fx = basketX;
    const fy = basketY - 1;

    // camada externa (laranja)
    ctx.fillStyle = 'rgba(255, 120, 30, 0.9)';
    ctx.beginPath();
    ctx.moveTo(fx - 3, fy);
    ctx.quadraticCurveTo(fx, fy - flameH * 1.3, fx + 3, fy);
    ctx.quadraticCurveTo(fx, fy + 2, fx - 3, fy);
    ctx.fill();

    // camada média (amarelo)
    ctx.fillStyle = 'rgba(255, 200, 60, 0.95)';
    ctx.beginPath();
    ctx.moveTo(fx - 2, fy);
    ctx.quadraticCurveTo(fx, fy - flameH * 0.95, fx + 2, fy);
    ctx.quadraticCurveTo(fx, fy + 1, fx - 2, fy);
    ctx.fill();

    // núcleo (branco-quente)
    ctx.fillStyle = '#fff5c0';
    ctx.beginPath();
    ctx.moveTo(fx - 1, fy);
    ctx.quadraticCurveTo(fx, fy - flameH * 0.6, fx + 1, fy);
    ctx.quadraticCurveTo(fx, fy + 0.5, fx - 1, fy);
    ctx.fill();

    // pequenas brasas/faíscas (opcional: 1–2 pontinhos)
    const spark = Math.sin(now * 13) > 0.6;
    if (spark) {
      ctx.fillStyle = 'rgba(255, 220, 120, 0.85)';
      ctx.fillRect(fx + 4 + Math.sin(now * 7) * 2, fy - 8 - (now * 20 % 6), 1, 1);
    }
  }
}

/* ------------------------------------------------------------------ */
/*  (resto do arquivo — inalterado)                                   */
/* ------------------------------------------------------------------ */

// ============================================================
// HUD DE QUEST
// ============================================================
function drawQuestTracker() {
  const tracked = getTrackedQuest();
  if (!tracked) return;

  const MAX_W = CANVAS_W - 40;
  const LINE_H = 14;
  const PAD_X = 10;
  const PAD_Y = 8;
  const TITLE_H = 16;

  const title = `★ ${tracked.title}`;

  ctx.font = 'bold 11px "Courier New", monospace';
  const titleLines = wrapLines(title, MAX_W - PAD_X * 2);

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

  const boxH = PAD_Y * 2 + TITLE_H + (detailLines.length * LINE_H);

  const bx = 10;
  const by = CANVAS_H - boxH - 10;

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(bx, by, MAX_W, boxH);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, MAX_W - 1, boxH - 1);

  ctx.fillStyle = '#feca57';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let ty = by + PAD_Y + TITLE_H / 2;
  for (const line of titleLines) {
    ctx.fillText(line, bx + PAD_X, ty);
    ty += TITLE_H;
  }

  ctx.font = '10px "Courier New", monospace';
  ty = by + PAD_Y + TITLE_H + LINE_H / 2;
  for (let i = 0; i < detailLines.length; i++) {
    const isReadyLine = ready && i === detailLines.length - 1;
    ctx.fillStyle = isReadyLine ? '#6fbd63' : '#ddd';
    ctx.fillText(detailLines[i], bx + PAD_X, ty);
    ty += LINE_H;
  }
}

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

function drawSandTile(room, x, y, px, py) {
  const base = '#c9a870';
  const dark = '#b89660';
  const light = '#d9bd88';

  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177 | 0;
  const r = ((h ^ (h >>> 16)) >>> 0) / 4294967296;

  ctx.fillStyle = base;
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  if (r < 0.10) {
    ctx.fillStyle = dark;
    ctx.fillRect(px + 4 + Math.floor((r * 97) % 12), py + 6, 1, 1);
  } else if (r > 0.90) {
    ctx.fillStyle = light;
    ctx.fillRect(px + 8 + Math.floor((r * 71) % 10), py + 11, 1, 1);
  }
}

function drawSandFloor(room, rng) {
  const base      = '#c9a870';
  const baseDark  = '#b89660';
  const baseLight = '#d9bd88';
  const duneEdge  = '#a07f4f';
  const duneLight = '#e0c890';

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

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

  const numDunes = 5 + Math.floor(rng() * 4);
  for (let i = 0; i < numDunes; i++) {
    const startX = rng() * CANVAS_W;
    const startY = rng() * CANVAS_H;
    const len    = 60 + rng() * 120;
    const angle  = (rng() - 0.5) * 0.8;
    const curve  = (rng() - 0.5) * 20;

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

function drawOasis(landmark) {
  const cx = landmark.tx * TILE_SIZE + TILE_SIZE / 2;
  const cy = landmark.ty * TILE_SIZE + TILE_SIZE / 2;
  const t = performance.now() / 1000;

  ctx.fillStyle = 'rgba(90, 70, 40, 0.7)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  const wave = Math.sin(t * 1.5) * 0.5;
  ctx.fillStyle = `rgba(74, 160, 180, ${0.85 + wave * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(200, 240, 255, ${0.35 + wave * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 2, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const palms = [
    { dx: -18, dy: -10, h: 26 },
    { dx:  16, dy: -12, h: 30 },
    { dx: -14, dy:  14, h: 22 },
    { dx:  18, dy:  12, h: 24 },
  ];
  for (const p of palms) {
    const px = cx + p.dx;
    const baseY = cy + p.dy;
    ctx.strokeStyle = '#6b4a2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, baseY);
    ctx.lineTo(px + 2, baseY - p.h);
    ctx.stroke();
    ctx.strokeStyle = '#3a7a3a';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(px + 2, baseY - p.h);
      ctx.quadraticCurveTo(
        px + 2 + i * 6,
        baseY - p.h - 6 - Math.abs(i) * 2,
        px + 2 + i * 10,
        baseY - p.h + 4
      );
      ctx.stroke();
    }
  }

  ctx.strokeStyle = 'rgba(201, 162, 77, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 22, 16, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function renderCity(room) {
  const mid = Math.floor(GRID_SIZE / 2);
  const PLAZA_RADIUS = 5;

  const grassRng = makeRng(seedFrom(room.gx * 3, room.gy * 11));

  if (room.biomeId === 'desert') {
    drawSandFloor(room, grassRng);
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const t = room.map[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      if (t === T.FLOOR || t === T.TREE) {
        if (room.biomeId === 'desert') {
          const dx = x - mid, dy = y - mid;
          const isPlazaInner = (dx*dx + dy*dy) <= (PLAZA_RADIUS - 1) * (PLAZA_RADIUS - 1);
          if (isPlazaInner) {
            const roll = grassRng();
            let gType = 0;
            if (roll < 0.02)      gType = 2;
            else if (roll < 0.04) gType = 3;
            else if (roll < 0.06) gType = 4;
            else if (roll < 0.25) gType = 1;
            ctx.drawImage(grassTiles[gType], px, py);
          }
        } else {
          const roll = grassRng();
          let gType = 0;
          if (roll < 0.02)      gType = 2;
          else if (roll < 0.04) gType = 3;
          else if (roll < 0.06) gType = 4;
          else if (roll < 0.25) gType = 1;
          ctx.drawImage(grassTiles[gType], px, py);
        }
      } else if (t === T.STREET) {
        if (room.biomeId === 'desert') {
          ctx.fillStyle = '#8a6a48';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          if (((x * 7 + y * 13) % 5) === 0) {
            ctx.fillStyle = '#6a4a30';
            ctx.fillRect(px + 4, py + 6, 2, 2);
          }
          if (((x * 11 + y * 3) % 7) === 0) {
            ctx.fillStyle = '#a07a50';
            ctx.fillRect(px + 12, py + 14, 2, 1);
          }
        } else {
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

  if (room.biomeId == 'vulcan') {
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
  }

  for (const obj of room.cityObjects) {
    const sx = obj.tx * TILE_SIZE;
    const sy = obj.ty * TILE_SIZE;
    const sw = obj.w * TILE_SIZE;
    const sh = obj.h * TILE_SIZE;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(sx + sw, sy - 4, 6, sh + 8);
    ctx.fillRect(sx + 4, sy - 4, sw, 4);
  }

  for (const obj of room.cityObjects) {
    drawBuilding(obj, room);
  }

  if (room.landmark?.kind === 'oasis' || room.portal?.kind === 'oasis') {
    drawOasis(room.landmark || room.portal);
  } else {
    drawPortalStatue(room.portal, mid);
  }

  for (const obj of room.cityObjects) {
    drawBannerNextToDoor(obj);
  }

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

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (room.map[y][x] !== T.TREE) continue;
      if (room.biomeId === 'desert') {
        const frame = cactusFrames[Math.floor(performance.now() / 600 + (x + y)) % 2];
        const dx = x * TILE_SIZE + TILE_SIZE / 2 - cactusFrames[0].width / 2;
        const dy = y * TILE_SIZE + TILE_SIZE - cactusFrames[0].height;
        ctx.drawImage(frame, dx, dy);
      } else {
        const frame = treeFrames[Math.floor(performance.now() / 450 + (x + y)) % 2];
        const dx = x * TILE_SIZE + TILE_SIZE / 2 - treeFrames[0].width / 2;
        const dy = y * TILE_SIZE + TILE_SIZE - treeFrames[0].height;
        ctx.drawImage(frame, dx, dy);
      }
    }
  }

  for (const L of getActiveLeaves()) {
    const tt = L.age / L.life;
    let color;
    if (tt < 0.4)      color = '#6fbd63';
    else if (tt < 0.8) color = '#8a9a4a';
    else               color = '#c9b048';
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(L.x), Math.floor(L.y), 2, 2);
  }

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

    if (lit > 0) {
      ctx.fillStyle = windowColor(lit);
      for (const obj of room.cityObjects) {
        for (const r of windowRects(obj)) ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }
    }
  }

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

  if (playerStats._escortActive && playerStats._escortPos && isQuestActive('story_herbalist_escort')) {
    const c = playerStats._escortPos;
    const frame = NPC_SPRITES.herbalist.idle[0];
    const scale = (player.size + 4) / 32;
    const w = 32 * scale;
    const h = 32 * scale;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(
      frame,
      c.x - w / 2, c.y - h / 2,
      w, h
    );
    ctx.globalAlpha = 1;
  }

  const composed = composeFrame(player.facing, player.step);
  const scale = (player.size + 4) / 32;
  ctx.drawImage(
    composed,
    player.x - (32 * scale) / 2,
    player.y - (32 * scale) / 2,
    32 * scale, 32 * scale
  );

  drawQuestTracker();
}

function drawBuilding(obj, room) {
  const x = obj.tx * TILE_SIZE;
  const y = obj.ty * TILE_SIZE;
  const w = obj.w * TILE_SIZE;
  const h = obj.h * TILE_SIZE;

  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(x, y + 4, w, h - 4);

  ctx.strokeStyle = '#5a3a24';
  ctx.lineWidth = 1;
  for (let ty = y + 4; ty < y + h; ty += 8) {
    ctx.beginPath();
    ctx.moveTo(x, ty);
    ctx.lineTo(x + w, ty);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fillRect(x + w - 4, y + 4, 4, h - 4);
  ctx.fillRect(x, y + h - 4, w, 4);

  ctx.fillStyle = '#7a1a1a';
  ctx.fillRect(x - 4, y, w + 8, 14);
  ctx.fillStyle = '#9a2a2a';
  ctx.fillRect(x - 4, y, w + 8, 2);
  ctx.fillStyle = '#5a0a0a';
  ctx.fillRect(x - 4, y + 12, w + 8, 2);

  ctx.fillStyle = '#6a0a0a';
  for (let tx = x - 4; tx < x + w + 4; tx += 6) {
    ctx.fillRect(tx, y + 2, 1, 10);
  }

  ctx.fillStyle = '#4a0a0a';
  ctx.fillRect(x - 4, y, w + 8, 2);

  const chimX = x + w - 20;
  const chimY = y - 18;
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(chimX, chimY, 10, 22);
  ctx.fillStyle = '#7a6a5a';
  ctx.fillRect(chimX, chimY, 2, 22);
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(chimX + 8, chimY, 2, 22);
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(chimX - 2, chimY - 3, 14, 4);
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

  const lit = nightFactor();
  for (const r of windowRects(obj)) {
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = windowColor(lit);
    ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
  }

  const doorW = 18;
  const doorH = 22;
  const doorX = x + w / 2 - doorW / 2;
  const doorY = y + h - doorH;
  ctx.fillStyle = '#4a2a1a';
  ctx.fillRect(doorX - 2, doorY - 2, doorW + 4, doorH + 2);
  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(doorX + 5, doorY + 2, 1, doorH - 4);
  ctx.fillRect(doorX + 11, doorY + 2, 1, doorH - 4);
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(doorX + doorW - 5, doorY + doorH / 2, 2, 2);
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
  return [{ x: x + w * 0.25 - winW / 2, y: winY, w: winW, h: winH }];
}

function windowColor(lit) {
  const a = [90, 106, 122], b = [254, 202, 87];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * lit)).join(',')})`;
}

function drawBannerIcon(objId, cx, cy) {
  const rect = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx + x), Math.round(cy + y), w, h);
  };

  switch (objId) {
    case 'blacksmith': {
      rect(-3, 3, 6, 1, '#1a1a1a');
      rect(-2, 1, 4, 2, '#555');
      rect(-1, -3, 1, 4, '#5a3a1a');
      rect(-2, -4, 3, 2, '#c0c8d0');
      break;
    }
    case 'armorer': {
      rect(-3, -3, 6, 4, '#c9a24d');
      rect(-3, 1,  6, 2, '#9b1c1c');
      rect(-2, 3,  4, 1, '#9b1c1c');
      rect(-1, -2, 2, 1, '#e0e0e0');
      break;
    }
    case 'herbalist': {
      rect(-2, -3, 4, 5, '#c8d8e8');
      rect(-2, -3, 4, 1, '#8a6b5a');
      rect(-1, -2, 2, 3, '#2a7a3a');
      rect( 1,  1, 2, 2, '#4f9a4a');
      break;
    }
    case 'jeweler': {
      rect(-1, -3, 2, 1, '#e8f6ff');
      rect(-2, -2, 4, 1, '#8ad8ff');
      rect(-2, -1, 4, 3, '#8ad8ff');
      rect(-1,  2, 2, 1, '#3aa0ff');
      rect( 0,  3, 1, 1, '#2a5fa0');
      break;
    }
    case 'quest_giver': {
      rect(-2, -3, 4, 7, '#f0e0c0');
      rect(-1, -2, 2, 1, '#5a3a24');
      rect(-1,  0, 2, 1, '#5a3a24');
      rect(-1,  2, 2, 1, '#5a3a24');
      break;
    }
    case 'bank': {
      rect(-2, -3, 4, 1, '#c9a24d');
      rect(-3, -2, 6, 4, '#feca57');
      rect(-2,  2, 4, 1, '#c9a24d');
      rect(-1, -1, 2, 2, '#c9a24d');
      break;
    }
    default: {
      rect(-1, -1, 2, 2, '#c9a24d');
    }
  }
}

function drawBannerNextToDoor(obj) {
  const x = obj.tx * TILE_SIZE;
  const y = obj.ty * TILE_SIZE;
  const w = obj.w * TILE_SIZE;
  const h = obj.h * TILE_SIZE;

  const doorCenterX = x + w / 2;
  const bannerX = doorCenterX + 22;
  const bannerY = y + h - 30;

  const t = performance.now() / 1000;

  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(bannerX - 2, bannerY, 12, 2);
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bannerX + 10, bannerY - 1, 2, 4);

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
    bank:        '#e8e0d0',
  };
  const bannerColor = bannerColors[obj.id] || '#8a1a1a';

  const amplitudeMax = 1.8;
  const waveSpeed = 1.8;

  const offsets = [];
  for (let ly = 0; ly < bannerH; ly++) {
    const factor = ly / (bannerH - 1);
    const wave =
      Math.sin(t * waveSpeed - ly * 0.45) * amplitudeMax * factor +
      Math.sin(t * 1.1) * 0.4 * factor;
    offsets.push(wave);
  }

  for (let ly = 0; ly < bannerH; ly++) {
    const ox = Math.round(offsets[ly]);
    ctx.fillStyle = bannerColor;
    ctx.fillRect(bx + ox, by + ly, bannerW, 1);

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(bx + ox, by + ly, 1, 1);
    ctx.fillRect(bx + ox + bannerW - 1, by + ly, 1, 1);

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(bx + ox + 2, by + ly, bannerW - 4, 1);
  }

  const borderColor = obj.id === 'bank' ? '#8a6a2a' : '#c9a24d';
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + Math.round(offsets[0]) + 0.5, by + 0.5);
  for (let ly = 1; ly < bannerH; ly++) {
    ctx.lineTo(bx + Math.round(offsets[ly]) + 0.5, by + ly + 0.5);
  }
  for (let ly = bannerH - 1; ly >= 0; ly--) {
    ctx.lineTo(bx + Math.round(offsets[ly]) + bannerW - 0.5, by + ly + 0.5);
  }
  ctx.closePath();
  ctx.stroke();

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

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftX + 0.5, by + bannerH + 0.5);
  ctx.lineTo(centerX + tipOffset * 0.2, by + bannerH + 4.5);
  ctx.lineTo(rightX - 0.5, by + bannerH + 0.5);
  ctx.stroke();

  let midSum = 0;
  for (let ly = 6; ly < 16; ly++) midSum += offsets[ly];
  const midOffset = midSum / 10;

  drawBannerIcon(
    obj.id,
    Math.floor(bx + bannerW / 2 + midOffset),
    Math.floor(by + bannerH / 2)
  );
}

function drawPortalStatue(portal, mid) {
  const cx = portal.tx * TILE_SIZE + TILE_SIZE / 2;
  const cy = portal.ty * TILE_SIZE + TILE_SIZE / 2;

  const inserted = playerStats.portalInserted.size;
  const intensity = inserted / 8;

  const t = performance.now() / 600;
  const pulse = 0.5 + Math.sin(t) * 0.25;

  ctx.fillStyle = '#8a8a9a';
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5a5a6a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#9a9aaa';
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a8a8b8';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  if (inserted > 0) {
    const haloRadius = 22 + intensity * 16 + Math.sin(t * 1.5) * 1.5;
    const haloGrd = ctx.createRadialGradient(cx, cy, 4, cx, cy, haloRadius);
    const r = Math.round(200 - intensity * 40);
    const g = Math.round(150 + intensity * 60);
    const b = Math.round(255);
    haloGrd.addColorStop(0,   `rgba(${r}, ${g}, ${b}, ${0.45 + intensity * 0.35})`);
    haloGrd.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.2})`);
    haloGrd.addColorStop(1,   `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = haloGrd;
    ctx.beginPath();
    ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  const coreGrd = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12);
  if (inserted === 0) {
    coreGrd.addColorStop(0, `rgba(180, 160, 220, ${pulse * 0.5})`);
    coreGrd.addColorStop(0.3, `rgba(140, 110, 200, ${pulse * 0.4})`);
    coreGrd.addColorStop(1, 'rgba(80, 50, 140, 0)');
  } else {
    coreGrd.addColorStop(0,   `rgba(255, 255, 255, ${0.65 + intensity * 0.35})`);
    coreGrd.addColorStop(0.3, `rgba(210, 170, 255, ${0.55 + intensity * 0.35})`);
    coreGrd.addColorStop(1,   'rgba(120, 60, 180, 0)');
  }
  ctx.fillStyle = coreGrd;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  if (inserted > 0) {
    ctx.strokeStyle = `rgba(220, 180, 255, ${0.5 + intensity * 0.4})`;
    ctx.lineWidth = 1.5 + intensity * 0.8;
    ctx.beginPath();
    ctx.arc(cx, cy, 9 + intensity * 1.5, t * 2, t * 2 + Math.PI * 1.5);
    ctx.stroke();
  }

  if (inserted > 0) {
    const orbitRadius = 11 + intensity * 4;
    const orbitSquash = 0.5;
    const orbitSpeed  = 1.2 + intensity * 0.9;
    const orbSize     = 1.5 + intensity * 0.8;

    for (let i = 0; i < inserted; i++) {
      const angle = t * orbitSpeed + (i / inserted) * Math.PI * 2;
      const ox = cx + Math.cos(angle) * orbitRadius;
      const oy = cy + Math.sin(angle) * orbitRadius * orbitSquash;

      const og = ctx.createRadialGradient(ox, oy, 0, ox, oy, 5);
      og.addColorStop(0, 'rgba(230, 240, 255, 1)');
      og.addColorStop(0.5, `rgba(180, 200, 255, ${0.7})`);
      og.addColorStop(1, 'rgba(140, 160, 255, 0)');
      ctx.fillStyle = og;
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eaf4ff';
      ctx.beginPath();
      ctx.arc(ox, oy, orbSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (inserted > 0) {
    for (let i = 0; i < 4; i++) {
      const angle = (t * 1.4 + i * Math.PI / 2) % (Math.PI * 2);
      const px = cx + Math.cos(angle) * (14 + intensity * 2);
      const py = cy + Math.sin(angle) * (14 + intensity * 2);
      ctx.fillStyle = `rgba(220, 190, 255, ${0.4 + intensity * 0.4})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  }

  const completed = inserted >= 8;
  ctx.strokeStyle = completed
    ? `rgba(254, 202, 87, ${0.9 + Math.sin(t * 3) * 0.1})`
    : '#c9a24d';
  ctx.lineWidth = completed ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.stroke();

  if (completed) {
    const extraGrd = ctx.createRadialGradient(cx, cy, 18, cx, cy, 30);
    extraGrd.addColorStop(0, 'rgba(254, 202, 87, 0.35)');
    extraGrd.addColorStop(1, 'rgba(254, 202, 87, 0)');
    ctx.fillStyle = extraGrd;
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFountain(tx, ty, tilesW = 3, tilesH = 3) {
  const x = tx * TILE_SIZE;
  const y = ty * TILE_SIZE;
  const w = tilesW * TILE_SIZE;
  const h = tilesH * TILE_SIZE;

  ctx.fillStyle = '#7a7a8a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6a6a7a';
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const t = performance.now() / 400;
  ctx.fillStyle = `rgba(74, 144, 226, ${0.7 + Math.sin(t) * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 5, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8ad8ff';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
  ctx.fill();

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

  const roomW = cols * TILE_SIZE;
  const roomH = rows * TILE_SIZE;
  const offX = Math.floor((CANVAS_W - roomW) / 2);
  const offY = Math.floor((CANVAS_H - roomH) / 2);

  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const BOARD_H = TILE_SIZE;
  const numBoards = Math.ceil(rows * TILE_SIZE / BOARD_H);

  const BOARD_COLORS = [
    '#6b4a2b', '#6e4c2c', '#65472a', '#714f2e', '#6b4a2b', '#68472a',
  ];

  function boardHash(i) {
    let h = 2166136261 ^ i;
    h = Math.imul(h, 16777619);
    return (h >>> 0) / 4294967296;
  }

  for (let b = 0; b < numBoards; b++) {
    const py = offY + b * BOARD_H;
    const drawH = Math.min(BOARD_H, offY + rows * TILE_SIZE - py);
    if (drawH <= 0) break;

    const color = BOARD_COLORS[Math.floor(boardHash(b) * BOARD_COLORS.length)];

    ctx.fillStyle = color;
    ctx.fillRect(offX, py, roomW, drawH);

    ctx.fillStyle = '#3a2410';
    ctx.fillRect(offX, py, roomW, 1);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fillRect(offX, py + 1, roomW, 1);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(offX, py + drawH - 2, roomW, 2);

    const h = boardHash(b);
    if (h < 0.35) {
      const knots = 1 + Math.floor(h * 3);
      for (let k = 0; k < knots; k++) {
        const kx = offX + ((h * 977 + k * 331) % 1) * roomW;
        const ky = py + drawH * 0.5;
        ctx.fillStyle = 'rgba(40, 20, 8, 0.45)';
        ctx.fillRect(Math.floor(kx), Math.floor(ky), 2, 1);
        ctx.fillStyle = 'rgba(40, 20, 8, 0.25)';
        ctx.fillRect(Math.floor(kx) - 1, Math.floor(ky) + 1, 3, 1);
      }
    }
  }

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

  const npc = room.npc;
  const herbalistIsOut =
    npc && npc.buildingId === 'herbalist' && isQuestActive('story_herbalist_escort');

  if (npc && !herbalistIsOut) {
    const npcSprites = NPC_SPRITES[npc.id] || NPC_SPRITES.herbalist;
    const frame = npcSprites.idle[0];
    const nx = offX + npc.tx * TILE_SIZE + TILE_SIZE / 2 - 16;
    const ny = offY + npc.ty * TILE_SIZE + TILE_SIZE - 30;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(frame, nx, ny, 32, 32);
    ctx.globalAlpha = 1;
  }

  const it = playerStats._nearInteractable;
  if (it && (it.kind === 'shop_keep' || it.kind === 'herbalist_quest' || it.kind === 'blacksmith_quest'  || it.kind === 'elder' || it.kind === 'banker')) {
    const cx = offX + it.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = offY + it.ty * TILE_SIZE - 16;

    let text;
    if (it.kind === 'elder') {
      text = 'Conversar: Ancião [E]';
    } else if (it.kind === 'herbalist_quest') {
      text = 'Conversar: Herbalista [E]';
    } else if (it.kind === 'blacksmith_quest') {
      text = 'Conversar: Ferreiro [E]';
    } else if (it.kind === 'banker') {
      text = 'Abrir Banco [E]';
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
    ctx.fillStyle = `rgba(20, 15, 30, ${0.18 * time.darkness})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawLostBackpack(px, py) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, 8, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const bx = px + 4;
  const by = py + 6;
  const bw = TILE_SIZE - 8;
  const bh = TILE_SIZE - 8;

  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(bx, by, bw, bh);

  ctx.fillStyle = '#4a3018';
  ctx.fillRect(bx, by, bw, 4);

  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bx + bw / 2 - 1, by + 4, 2, 3);

  ctx.strokeStyle = '#3a2410';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by - 1, 4, Math.PI, 0);
  ctx.stroke();

  const t = performance.now() / 500;
  const pulse = 0.3 + Math.sin(t) * 0.15;
  ctx.fillStyle = `rgba(254, 202, 87, ${pulse})`;
  ctx.beginPath();
  ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawHerbs(room) {
  if (!room || !room.interactables) return;
  if (!isQuestActive('story_herbalist_escort')) return;
  if (!playerStats._escortActive) return;

  const now = performance.now() / 500;
  const pulse = 0.4 + Math.sin(now) * 0.2;

  for (const it of room.interactables) {
    if (it.kind !== 'herb') continue;
    if (playerStats._collectedHerbs?.has(it.id)) continue;
    const px = it.tx * TILE_SIZE;
    const py = it.ty * TILE_SIZE;
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, py + TILE_SIZE - 3, 7, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    const grd = ctx.createRadialGradient(cx, cy, 1, cx, cy, 14);
    grd.addColorStop(0, `rgba(120, 220, 140, ${pulse * 0.5})`);
    grd.addColorStop(1, 'rgba(120, 220, 140, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(cx - 14, cy - 14, 28, 28);

    ctx.fillStyle = '#3a6b2a';
    ctx.fillRect(cx - 1, cy - 2, 2, 8);

    ctx.fillStyle = '#6fbd63';
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy + 1);
    ctx.lineTo(cx - 6, cy - 2);
    ctx.lineTo(cx - 1, cy + 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#8ad88a';
    ctx.beginPath();
    ctx.moveTo(cx + 1, cy);
    ctx.lineTo(cx + 6, cy - 3);
    ctx.lineTo(cx + 1, cy + 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#a8e8a8';
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy);
    ctx.lineTo(cx, cy - 8);
    ctx.lineTo(cx + 2, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.fillRect(cx - 1, cy - 7, 1, 2);
  }
}

function drawHerbalistEscort(room) {
  if (!room || !room.interactables) return;
  if (!isQuestActive('story_herbalist_escort')) return;
  if (playerStats._escortActive) return;

  const it = room.interactables.find(x => x.kind === 'herbalist_escort');
  if (!it) return;

  const px = it.tx * TILE_SIZE;
  const py = it.ty * TILE_SIZE;

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE - 2, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const sprites = NPC_SPRITES.herbalist;
  const frame = sprites.idle[0];
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    frame,
    px + TILE_SIZE / 2 - 16,
    py + TILE_SIZE - 30,
    32, 32
  );
  ctx.globalAlpha = 1;
}

function drawCaveEntrance(px, py, room) {
  const theme = room?.dungeonTheme
    || (room?.interactables?.find(it => it.kind === 'cave_entrance' && it.tx * TILE_SIZE === px)?.dungeonTheme)
    || 'cave';

  if (theme === 'desert') {
    drawDesertCaveEntrance(px, py);
  } else {
    drawRockyCaveEntrance(px, py);
  }
}

function drawRockyCaveEntrance(px, py) {
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  ctx.save();

  const grassFrame = grassTiles[0];
  if (grassFrame) {
    ctx.drawImage(grassFrame, px, py, TILE_SIZE, TILE_SIZE);
  }

  ctx.fillStyle = '#4a4a52';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a5a62';
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const rx = cx + Math.cos(angle) * 11;
    const ry = cy + 4 + Math.sin(angle) * 6;
    ctx.beginPath();
    ctx.arc(rx, ry, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#0a0a12';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#2a2a32';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 9, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  const t = performance.now() / 600;
  const pulse = 0.3 + Math.sin(t) * 0.15;

  const grd = ctx.createRadialGradient(cx, cy + 2, 2, cx, cy + 2, 12);
  grd.addColorStop(0, `rgba(120, 60, 160, ${pulse})`);
  grd.addColorStop(1, 'rgba(120, 60, 160, 0)');

  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.rect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.clip();

  ctx.beginPath();
  ctx.arc(cx, cy + 2, 12, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 2; i++) {
    const angle = t * 2 + i * Math.PI;
    const bx = cx + Math.cos(angle) * 10;
    const by = cy - 8 + Math.sin(angle * 2) * 4;
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(bx - 1, by, 2, 2);
  }

  ctx.restore();
}

function drawDesertCaveEntrance(px, py) {
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  ctx.save();

  ctx.fillStyle = '#c9a870';
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#a8854a';
  ctx.fillRect(px + 2, py + 3, 1, 1);
  ctx.fillRect(px + 14, py + 5, 1, 1);
  ctx.fillRect(px + 7, py + 15, 1, 1);

  ctx.fillStyle = '#6b4a2a';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 10, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a07a50';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 3, 8.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8a6a48';
  ctx.fillRect(cx - 6, cy + 1, 12, 1);
  ctx.fillStyle = '#5a4020';
  ctx.fillRect(cx - 6, cy + 2, 12, 1);

  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(cx - 4.5, cy + 3, 9, 1);
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(cx - 4.5, cy + 4, 9, 1);

  ctx.fillStyle = '#5a4020';
  ctx.fillRect(cx - 3, cy + 5, 6, 1);
  ctx.fillStyle = '#1a0e08';
  ctx.fillRect(cx - 3, cy + 6, 6, 1);

  ctx.fillStyle = '#0a0806';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 5, 4.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const t = performance.now() / 600;
  const pulse = 0.3 + Math.sin(t) * 0.15;
  const grd = ctx.createRadialGradient(cx, cy + 4, 1, cx, cy + 2, 9);
  grd.addColorStop(0, `rgba(254, 202, 87, ${pulse})`);
  grd.addColorStop(1, 'rgba(254, 202, 87, 0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.rect(px, py, TILE_SIZE, TILE_SIZE);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cx, cy + 2, 9, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.8 + i * 0.33) % 1;
    const angle = phase * Math.PI * 2 + i;
    const sx = cx + Math.cos(angle) * (2 + phase * 4);
    const sy = cy + 2 - phase * 8;
    const alpha = (1 - phase) * 0.7;
    ctx.fillStyle = `rgba(220, 190, 130, ${alpha})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  ctx.fillStyle = `rgba(254, 202, 87, ${0.4 + pulse * 0.3})`;
  ctx.fillRect(cx - 2, cy - 5, 1, 1);
  ctx.fillRect(cx - 1, cy - 6, 2, 1);
  ctx.fillRect(cx + 1, cy - 5, 1, 1);

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

  if (!freed) {
    ctx.fillStyle = '#c98b5a';
    ctx.beginPath(); ctx.arc(x + s / 2, y + s * 0.32, s * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b4f8a';
    ctx.fillRect(x + s * 0.3, y + s * 0.48, s * 0.4, s * 0.38);
  }

  ctx.fillStyle = '#4a4a55';
  ctx.fillRect(x, y + s - 4, s, 4);
  ctx.fillRect(x, y, s, 3);

  ctx.fillStyle = '#8a8a99';
  for (const i of (freed ? [0, 4] : [0, 1, 2, 3, 4])) {
    ctx.fillRect(x + (i * (s - 2)) / 4, y + 3, 2, s - 7);
  }
}

function drawFloorTorch(room) {
  const t = room.floorTorch;
  if (!t) return;
  if (room.isFixed) return;

  const px = t.tx * TILE_SIZE;
  const py = t.ty * TILE_SIZE;
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  const now = performance.now() / 1000;
  const flicker = 0.85 + Math.sin(now * 9) * 0.1 + Math.sin(now * 23) * 0.05;

  const warmGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30);
  warmGrd.addColorStop(0, 'rgba(255, 170, 80, 0.10)');
  warmGrd.addColorStop(1, 'rgba(255, 170, 80, 0)');
  ctx.fillStyle = warmGrd;
  ctx.fillRect(cx - 30, cy - 30, 60, 60);

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 7, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - 1, cy - 6, 2, 12);
  ctx.fillStyle = 'rgba(160, 120, 70, 0.5)';
  ctx.fillRect(cx - 1, cy - 6, 1, 12);

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

function drawCampfire(pos) {
  if (!pos) return;
  const px = pos.tx * TILE_SIZE;
  const py = pos.ty * TILE_SIZE;
  const isNight = getTimeState().darkness > 0.15;

  if (isNight) {
    const frame = campfireFrames.on[Math.floor(performance.now() / 300) % 2];
    ctx.drawImage(frame, px, py, TILE_SIZE * 2, TILE_SIZE * 2);
  } else {
    ctx.drawImage(campfireFrames.off[0], px, py, TILE_SIZE * 2, TILE_SIZE * 2);
  }
}

function drawBannerInCamp(pos) {
  if (!pos) return;
  const px = pos.tx * TILE_SIZE;
  const py = pos.ty * TILE_SIZE;
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;

  const t = performance.now() / 1000;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, py + TILE_SIZE - 2, 8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  const pulse = 0.4 + Math.sin(t * 1.5) * 0.2;
  const grd = ctx.createRadialGradient(cx, cy, 1, cx, cy, 16);
  grd.addColorStop(0, `rgba(254, 202, 87, ${pulse * 0.4})`);
  grd.addColorStop(1, 'rgba(254, 202, 87, 0)');
  ctx.fillStyle = grd;
  ctx.fillRect(cx - 16, cy - 16, 32, 32);

  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - 1, cy - 10, 2, 14);
  ctx.fillStyle = '#feca57';
  ctx.fillRect(cx - 1, cy - 11, 2, 1);

  const sway = Math.sin(t * 2) * 1;
  const bx = cx - 6 + sway;
  const by = cy - 8;
  ctx.fillStyle = '#9b1c1c';
  ctx.fillRect(bx, by, 8, 6);
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(bx, by, 8, 1);
  ctx.fillRect(bx, by + 5, 8, 1);
  ctx.fillStyle = '#feca57';
  ctx.fillRect(bx + 3, by + 2, 2, 2);
}

function drawTreasureChest(room) {
  const c = room.treasureChest;
  if (!c) return;
  const s = TILE_SIZE;
  const x = c.tx * s, y = c.ty * s;

  if (room._chestOpened) {
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(x + 2, y + s - 12, s - 4, 10);
    ctx.fillStyle = '#1a0f08';
    ctx.fillRect(x + 4, y + s - 10, s - 8, 6);
    ctx.fillStyle = '#c9a24d';
    ctx.fillRect(x + 2, y + s - 6, s - 4, 1);
    return;
  }

  ctx.fillStyle = '#6b4a2b';
  ctx.fillRect(x + 2, y + s - 12, s - 4, 10);
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(x + 2, y + s - 14, s - 4, 4);
  ctx.fillStyle = '#c9a24d';
  ctx.fillRect(x + 2, y + s - 9, s - 4, 1);
  ctx.fillStyle = '#f0d27a';
  ctx.fillRect(x + s / 2 - 1, y + s - 8, 2, 3);

  const t = performance.now() / 500;
  const pulse = 0.25 + Math.sin(t) * 0.1;
  ctx.fillStyle = `rgba(254, 202, 87, ${pulse})`;
  ctx.beginPath();
  ctx.arc(x + s / 2, y + s - 6, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoblinCones(room) {
  if (!room || !room.enemies) return;
  const time = getTimeState();
  if (time.label === 'Noite') return;

  for (const e of room.enemies) {
    if (e.defeated || e.asleep || !e.cone || !e.questGoblin) continue;

    const dirVec = {
      up:    { x: 0,  y: -1 },
      down:  { x: 0,  y: 1  },
      left:  { x: -1, y: 0  },
      right: { x: 1,  y: 0  },
    }[e.facing] || { x: 0, y: 1 };

    const cx = e.tx * TILE_SIZE + TILE_SIZE / 2;
    const cy = e.ty * TILE_SIZE + TILE_SIZE / 2;
    const rangePx = e.cone.range * TILE_SIZE;
    const halfAngle = (e.cone.angle / 2) * Math.PI / 180;

    const baseAngle = Math.atan2(dirVec.y, dirVec.x);

    const grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, rangePx);
    grd.addColorStop(0,   'rgba(255, 60, 60, 0.18)');
    grd.addColorStop(0.6, 'rgba(255, 60, 60, 0.08)');
    grd.addColorStop(1,   'rgba(255, 60, 60, 0)');
    ctx.fillStyle = grd;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, rangePx, baseAngle - halfAngle, baseAngle + halfAngle);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(baseAngle) * rangePx * 0.9,
      cy + Math.sin(baseAngle) * rangePx * 0.9
    );
    ctx.stroke();
  }
}