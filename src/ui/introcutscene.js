// ============================================================
// CUTSCENE INICIAL — só roda em "Novo Jogo" (menu).
//
// NÃO roda em:
//   - "Continuar" do menu (save existente)
//   - "Continuar" após game over (restartRunKeepingVault)
//   - checkpoint de morte
//
// Reaproveita o motor de slides da cutscene de boss
// (drawCutscene / skipCutsceneScene em battle/cutscene.js);
// só as CENAS e o controle de estado são próprios daqui.
//
// Regras de lore respeitadas (Resumo_Lore_Dungeon_loop.md):
//   - a Fratura NÃO tem causa explicada;
//   - o Andarilho não tem nome ("o Andarilho é você");
//   - o prólogo PROMETE o mundo, não resume ele;
//   - nada de "escolhido"/profecia.
// ============================================================

import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { STATE, setGameState } from '../core/state.js';
import { setMusicMode } from '../audio/audio.js';
import {
  drawCutscene, skipCutsceneScene,
  SCENE_DUR, rng, clamp01, ease, lerp,
  vignette, camera, fog, motes, drawWanderer,
} from '../battle/cutscene.js';
import { greeting, vocative, agree } from './classvocative.js';

// ------------------------------------------------------------
// Helpers locais
// ------------------------------------------------------------

// Faixa de colina/relevo (preenche até o fim da tela)
function ridge(baseY, amp, freq, phase, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-60, CANVAS_H + 60);
  for (let x = -60; x <= CANVAS_W + 60; x += 12) {
    const y = baseY
      + Math.sin(x * freq + phase) * amp
      + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CANVAS_W + 60, CANVAS_H + 60);
  ctx.closePath();
  ctx.fill();
}

// Rachadura de luz. `r` é um rng já semeado; os pontos são sempre
// todos sorteados (mesma ordem), então o desenho é estável frame a frame.
// `prog` (0..1) controla o quanto da rachadura já apareceu.
function crack(r, x0, y0, x1, y1, jit, prog, w) {
  const n = 10;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const mid = i > 0 && i < n;
    pts.push([
      lerp(x0, x1, k) + (mid ? (r() - 0.5) * jit * 2 : 0),
      lerp(y0, y1, Math.pow(k, 1.2)) + (mid ? (r() - 0.5) * jit : 0),
    ]);
  }
  if (prog <= 0) return;
  const shown = prog * n;
  const passes = [
    [w * 3.5, 'rgba(255,190,80,0.22)'],
    [w, 'rgba(255,246,210,0.95)'],
  ];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [lw, col] of passes) {
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= n; i++) {
      if (i <= shown) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      } else {
        const f = shown - (i - 1);
        if (f > 0) {
          ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
        }
        break;
      }
    }
    ctx.stroke();
  }
}

// Árvore pequena (dá escala à torre)
// `sway` (px): deslocamento lateral da copa — a base do tronco fica
// parada e o topo acompanha parte do movimento, como vento de verdade.
function smallTree(x, baseY, s, sway = 0) {
  const cx = x + sway;
  ctx.fillStyle = '#4a3320';
  ctx.beginPath();
  ctx.moveTo(x - 1.5 * s, baseY);
  ctx.lineTo(x + 1.5 * s, baseY);
  ctx.lineTo(x + 1.5 * s + sway * 0.6, baseY - 14 * s);
  ctx.lineTo(x - 1.5 * s + sway * 0.6, baseY - 14 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2f6b33';
  ctx.beginPath();
  ctx.arc(cx, baseY - 22 * s, 9 * s, 0, Math.PI * 2);
  ctx.arc(cx - 6 * s, baseY - 16 * s, 7 * s, 0, Math.PI * 2);
  ctx.arc(cx + 6 * s, baseY - 16 * s, 7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4a9a48';
  ctx.beginPath();
  ctx.arc(cx - 2 * s, baseY - 25 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

// Segmento do corpo da torre entre yLo (baixo) e yHi (alto).
// Largura vai de 18 (base) a 8 (topo) ao longo de 250px.
function towerSeg(tx, by, yLo, yHi) {
  const wAt = (y) => lerp(18, 8, (by - y) / 250);
  const wl = wAt(yLo), wh = wAt(yHi);
  ctx.fillStyle = '#ece5c9';
  ctx.beginPath();
  ctx.moveTo(tx - wl, yLo); ctx.lineTo(tx - wh, yHi);
  ctx.lineTo(tx + wh, yHi); ctx.lineTo(tx + wl, yLo);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(120,110,80,0.35)';
  ctx.beginPath();
  ctx.moveTo(tx + wl * 0.1, yLo); ctx.lineTo(tx + wh * 0.35, yHi);
  ctx.lineTo(tx + wh, yHi);       ctx.lineTo(tx + wl, yLo);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(150,140,100,0.5)';
  for (let k = 1; k <= 5; k++) {
    const y = by - k * 40;
    if (y < yLo - 2 && y > yHi) {
      const w = wAt(y);
      ctx.fillRect(tx - w - 1, y, 2 * w + 2, 3);
    }
  }
}

// Borda quebrada (dentes). dir = -1: dentes para cima; +1: para baixo.
function jagged(tx, y, w, dir) {
  ctx.fillStyle = '#ece5c9';
  ctx.beginPath();
  ctx.moveTo(tx - w, y);
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const x = lerp(tx - w, tx + w, i / n);
    ctx.lineTo(x, y + (i % 2 ? 0 : dir * 9) + (i % 3) * dir * 2);
  }
  ctx.lineTo(tx + w, y);
  ctx.closePath();
  ctx.fill();
}

// Ponta da torre: pináculo + cristal
function towerCap(tx, ty, pulse) {
  ctx.fillStyle = '#ece5c9';
  ctx.beginPath();
  ctx.moveTo(tx - 8, ty); ctx.lineTo(tx, ty - 26); ctx.lineTo(tx + 8, ty);
  ctx.closePath();
  ctx.fill();
  const cg = ctx.createRadialGradient(tx, ty - 30, 0, tx, ty - 30, 34);
  cg.addColorStop(0, `rgba(255,250,210,${0.95 * pulse})`);
  cg.addColorStop(1, 'rgba(255,240,170,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(tx - 40, ty - 70, 80, 80);
}

// Mundo da torre (usado pelas cenas `tower` e `fracture`).
//   zoom / shake : câmera
//   crackK  0..1 : rachaduras no chão
//   breakK  0..1 : topo da torre se partindo e caindo
//   birds        : pássaros ao fundo (cena calma)
function drawTowerWorld(t, o = {}) {
  const W = CANVAS_W, H = CANVAS_H, hz = H * 0.62;
  const { zoom = 1, shake = 0, crackK = 0, breakK = 0, birds = false } = o;

  ctx.save();
  camera(zoom, W / 2, hz - 80, shake, t);

  // céu
  const sky = ctx.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#6fa9c4');
  sky.addColorStop(0.7, '#d8e3a8');
  sky.addColorStop(1, '#f6e7a8');
  ctx.fillStyle = sky;
  ctx.fillRect(-80, -80, W + 160, hz + 82);

  const sg = ctx.createRadialGradient(W / 2, hz - 120, 10, W / 2, hz - 120, 260);
  sg.addColorStop(0, 'rgba(255,248,210,0.9)');
  sg.addColorStop(1, 'rgba(255,248,210,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(-80, -80, W + 160, H + 160);

  // nuvens
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 4; i++) {
    const x = (((i * 190 + t * 6) % (W + 300)) + (W + 300)) % (W + 300) - 150;
    ctx.beginPath();
    ctx.ellipse(x, 100 + i * 38, 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // pássaros
  if (birds) {
    ctx.strokeStyle = 'rgba(40,50,40,0.7)';
    ctx.lineWidth = 1.5;
    // 5 pássaros, cada um com velocidade/altura próprias, atravessando a
    // tela e reaparecendo do outro lado (módulo). Como `t` não é mais
    // travado, o bando continua passando enquanto o jogador lê.
    for (let i = 0; i < 5; i++) {
      const speed = 20 + i * 4;
      const bx = ((t * speed + i * 170) % (W + 120)) - 60;
      const by0 = 100 + (i % 3) * 24 + i * 6 + Math.sin(t * 1.3 + i) * 4;
      const wing = Math.sin(t * 9 + i * 2) * 4;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by0 + wing); ctx.lineTo(bx, by0); ctx.lineTo(bx + 6, by0 + wing);
      ctx.stroke();
    }
  }

  // colinas distantes
  ridge(hz - 2, 5, 0.017, 1, '#7fae6a');
  ridge(hz + 8, 6, 0.012, 3, '#5f9a4c');

  // ---- a torre ----
  const tx = W / 2, by = hz + 6, ty = hz - 250;
  const pulse = crackK > 0
    ? 0.55 + 0.45 * Math.abs(Math.sin(t * 17) * Math.sin(t * 5.3))   // cristal instável
    : 0.7 + 0.3 * Math.sin(t * 2);

  if (breakK <= 0) {
    towerSeg(tx, by, by, ty);
    towerCap(tx, ty, pulse);
  } else {
    const cut = ty + 90;                       // altura da quebra
    towerSeg(tx, by, by, cut);
    jagged(tx, cut, lerp(18, 8, (by - cut) / 250), -1);

    // brilho na ferida
    const wg = ctx.createRadialGradient(tx, cut, 0, tx, cut, 60);
    wg.addColorStop(0, `rgba(255,235,170,${0.55 * Math.min(1, breakK * 3)})`);
    wg.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(tx - 70, cut - 70, 140, 140);

    // o topo, caindo (acelera e gira)
    ctx.save();
    ctx.translate(tx + breakK * 46, cut + breakK * breakK * 420);
    ctx.rotate(breakK * 1.1);
    ctx.translate(-tx, -cut);
    towerSeg(tx, by, cut, ty);
    jagged(tx, cut, lerp(18, 8, (by - cut) / 250), 1);
    towerCap(tx, ty, pulse);
    ctx.restore();

    // poeira
    for (let i = 0; i < 7; i++) {
      const px = tx + (i - 3) * 12 * (0.5 + breakK);
      const py = cut - breakK * 40 * (0.6 + i * 0.1);
      ctx.fillStyle = `rgba(225,215,185,${0.35 * (1 - breakK * 0.6)})`;
      ctx.beginPath();
      ctx.arc(px, py, 8 + breakK * 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- árvores junto à base (escala) ----
  const TREES = [
    [-190, 20, 1.8], [-150, 14, 1.5], [-118, 10, 1.1], [-84, 8, 0.9], [-52, 6, 0.7],
    [56, 6, 0.7], [88, 9, 1.0], [122, 12, 1.3], [160, 16, 1.6], [196, 22, 1.8],
  ];
  TREES.forEach(([dx, dy, s], i) => {
    // balanço da copa: duas ondas somadas (lenta + rápida), fase por árvore
    const sway = (Math.sin(t * 1.1 + i * 0.9) * 1.8 + Math.sin(t * 2.3 + i * 1.7) * 0.5) * s;
    smallTree(tx + dx, hz + 10 + dy, s, sway);
  });

  // colinas próximas (ancoram torre e árvores)
  ridge(hz + 28, 8, 0.02, 1, '#4d8a3c');
  ridge(hz + 70, 14, 0.011, 2, '#3f7a34');
  ridge(hz + 140, 22, 0.008, 4, '#336a2c');

  // rachaduras no chão
  if (crackK > 0) {
    const r = rng(5);
    for (let i = 0; i < 7; i++) {
      const ang = lerp(-1, 1, i / 6);
      crack(r, W / 2, hz + 10, W / 2 + ang * W * 0.7, H + 20, 10, crackK, 3);
    }
    const gg = ctx.createRadialGradient(W / 2, hz + 10, 0, W / 2, hz + 10, 90 * crackK);
    gg.addColorStop(0, `rgba(255,240,190,${0.8 * crackK})`);
    gg.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = gg;
    ctx.fillRect(W / 2 - 100, hz - 80, 200, 180);
  }

  ctx.restore();
}

// ------------------------------------------------------------
// CENAS
// ------------------------------------------------------------
const SCENES = {

  // ---------- Título ----------
  title: {
    duration: 3.5,
    auto: true,
    text: '',
    draw(t) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const a = Math.min(ease(t / 0.8), 1 - ease((t - 2.7) / 0.7));
      ctx.globalAlpha = clamp01(a);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 30px "Courier New", monospace';
      ctx.fillStyle = '#000';
      ctx.fillText('DUNGEON LOOP', CANVAS_W / 2 + 2, CANVAS_H / 2 + 2);
      ctx.fillStyle = '#feca57';
      ctx.fillText('DUNGEON LOOP', CANVAS_W / 2, CANVAS_H / 2);
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#c9a24d';
      ctx.fillText('— O Anel —', CANVAS_W / 2, CANVAS_H / 2 + 32);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    },
  },

  // ---------- 1a. Antes: o continente e a torre (calma) ----------
  tower: {
    duration: SCENE_DUR,
    text: 'Antes, havia um só continente verde e uma torre no centro, ligando a base ao topo.',
    draw(t) {
      drawTowerWorld(t, {
        zoom: 1 + ease(t / SCENE_DUR) * 0.12,
        birds: true,
      });
      motes(t, 14, '255,250,200', { seed: 2, size: 2, rise: -6, sway: 14, y0: 80, y1: CANVAS_H * 0.62 });
      vignette(0.5);
    },
  },

  // ---------- 1b. A Fratura: tremor, rachaduras, topo da torre cai ----------
  fracture: {
    duration: SCENE_DUR,
    text: 'Então veio a Fratura. Ninguém sabe dizer por quê.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H;
      // continua o zoom em que a cena anterior terminou (1.12)
      const zoom = 1.12 + ease(t / SCENE_DUR) * 0.04;
      // tremor cresce, estoura na queda e acalma no fim
      const shake = ease(t / 3.5) * 3.4 * (1 - 0.5 * ease((t - 7.5) / 2));
      const crackK = ease((t - 1.2) / 3.2);
      const breakK = clamp01((t - 4) / 4);

      drawTowerWorld(t, { zoom, shake, crackK, breakK });

      // céu esquentando
      const tint = ease((t - 4) / 4) * 0.16;
      if (tint > 0) {
        ctx.fillStyle = `rgba(255,110,50,${tint})`;
        ctx.fillRect(0, 0, W, H);
      }

      motes(t, 22, '255,235,170', { seed: 3, size: 2, rise: -22, sway: 20, y0: 80, y1: H * 0.7, alpha: ease((t - 3) / 2) });

      // clarão curto no instante da quebra
      const f1 = ease((t - 3.9) / 0.15) * (1 - ease((t - 4.1) / 0.4));
      if (f1 > 0) {
        ctx.fillStyle = `rgba(255,245,210,${f1 * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
      // clarão final (passagem para a cena dos anéis)
      const fl = ease((t - 8.6) / 0.5) * (1 - ease((t - 9.3) / 0.6));
      if (fl > 0) {
        ctx.fillStyle = `rgba(255,240,190,${fl * 0.8})`;
        ctx.fillRect(0, 0, W, H);
      }
      vignette(0.55);
    },
  },

  // ---------- 2. Os anéis ----------
  rings: {
    duration: SCENE_DUR,
    text: 'A terra se partiu em anéis, cada um com clima e regras próprias. O espaço entre eles não obedece a ninguém — e atravessá-lo mata quem tenta.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H;
      const cx = W / 2, cy = (52 + (H - 96)) / 2;

      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, W, H);
      motes(t, 30, '120,130,170', { seed: 2, size: 1, rise: -2, sway: 4, alpha: 0.6 });

      // do mais externo (Campos) ao mais interno: mais instável / sombrio
      const PAL = ['#5c9a45', '#d2ae5a', '#7a8aa8', '#7d5fa0', '#a04a4a', '#6a2f55', '#3a2a4a', '#221838'];
      for (let i = 0; i < PAL.length; i++) {
        const R = 212 - i * 24;
        const a = ease((t - 0.6 - i * 0.5) / 0.9);
        if (a <= 0) continue;
        const amp = 1 + i * 0.7;
        const dx = Math.sin(t * 0.3 + i) * amp;
        const dy = Math.cos(t * 0.27 + i * 1.3) * amp;

        ctx.save();
        ctx.translate(cx + dx, cy + dy);
        ctx.globalAlpha = a;

        ctx.lineWidth = 18;
        ctx.strokeStyle = PAL[i];
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        // textura (traços girando em sentidos alternados)
        ctx.strokeStyle = 'rgba(0,0,0,0.22)';
        ctx.setLineDash([3 + i, 11]);
        ctx.lineDashOffset = -t * (8 + i * 3) * (i % 2 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        // borda clara
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.arc(0, 0, R - 8, 0, Math.PI * 2);
        ctx.stroke();

        // fresta instável entre este anel e o próximo
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(255,220,140,${0.25 + 0.15 * Math.sin(t * 2 + i)})`;
        ctx.setLineDash([6, 10]);
        ctx.lineDashOffset = t * 12;
        ctx.beginPath();
        ctx.arc(0, 0, R - 15, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);

      // centro pulsando (o que resta da torre)
      const beat = 0.8 + 0.2 * Math.sin(t * 2.4);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 46 * beat);
      cg.addColorStop(0, 'rgba(255,240,190,0.95)');
      cg.addColorStop(0.4, 'rgba(255,200,100,0.45)');
      cg.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(cx - 60, cy - 60, 120, 120);

      vignette(0.75);
    },
  },

  // ---------- 3. Aethel ----------
  aethel: {
    duration: SCENE_DUR,
    text: 'Só Aethel resistiu. A Fratura nunca a tocou: a muralha ainda brilha, e o Portal Antigo pulsa no centro, com oito encaixes vazios.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.64, cx = W / 2;
      const beat = 0.75 + 0.25 * Math.sin(t * 2.2);

      ctx.save();
      camera(1.02 + ease(t / SCENE_DUR) * 0.1, cx, hz - 60, 0, t);

      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#0c1028');
      sky.addColorStop(0.6, '#3b2c5c');
      sky.addColorStop(1, '#d08a52');
      ctx.fillStyle = sky;
      ctx.fillRect(-60, -60, W + 120, hz + 62);
      motes(t, 36, '255,240,200', { seed: 4, size: 1, rise: 0, sway: 0, y0: 40, y1: hz * 0.6, alpha: 0.7 });

      // feixe do Portal
      const bg = ctx.createLinearGradient(0, hz - 70, 0, -40);
      bg.addColorStop(0, `rgba(255,228,150,${0.75 * beat})`);
      bg.addColorStop(1, 'rgba(255,228,150,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(cx - 10, hz - 70); ctx.lineTo(cx + 10, hz - 70);
      ctx.lineTo(cx + 46, -40);     ctx.lineTo(cx - 46, -40);
      ctx.closePath();
      ctx.fill();

      ridge(hz - 4, 6, 0.015, 2, '#1d1628');

      // cidade
      ctx.fillStyle = '#17121f';
      ctx.fillRect(cx - 150, hz - 34, 300, 40);
      for (let x = cx - 150; x < cx + 150; x += 14) ctx.fillRect(x, hz - 40, 8, 6);
      const tower = (x, w, h) => {
        ctx.fillRect(x - w / 2, hz - h, w, h + 6);
        ctx.beginPath();
        ctx.moveTo(x - w / 2 - 3, hz - h);
        ctx.lineTo(x, hz - h - w * 0.9);
        ctx.lineTo(x + w / 2 + 3, hz - h);
        ctx.fill();
      };
      tower(cx - 150, 22, 66);
      tower(cx - 76, 20, 84);
      tower(cx + 76, 20, 84);
      tower(cx + 150, 22, 66);
      tower(cx, 40, 92);

      // janelas acesas (muralha + torre central)
      const wins = [];
      for (let x = cx - 140; x < cx + 140; x += 16) {
        wins.push([x, hz - 24], [x + 8, hz - 12]);
      }
      wins.push([cx - 6, hz - 70], [cx + 6, hz - 58], [cx - 76, hz - 60], [cx + 76, hz - 60]);
      wins.forEach(([wx, wy], i) => {
        const f = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
        ctx.fillStyle = `rgba(255,200,90,${0.15 * f})`;
        ctx.fillRect(wx - 3, wy - 3, 9, 10);
        ctx.fillStyle = `rgba(255,214,120,${0.9 * f})`;
        ctx.fillRect(wx, wy, 3, 4);
      });

      // anel do Portal: 8 encaixes vazios
      const py = hz - 150;
      ctx.strokeStyle = `rgba(255,225,150,${0.5 * beat})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, py, 56, 14, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + t * 0.1;
        const sx = cx + Math.cos(a) * 56;
        const sy = py + Math.sin(a) * 14;
        ctx.fillStyle = '#0a0810';
        ctx.beginPath(); ctx.arc(sx, sy, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(160,130,70,0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ridge(hz + 30, 10, 0.012, 5, '#0a0710');
      fog(t, hz + 6, 60, '255,170,100', 0.12, 6, 5);
      ctx.restore();

      motes(t, 14, '255,225,150', { seed: 6, size: 2, rise: -10, sway: 12, y0: hz * 0.4, y1: H });
      vignette(0.8);
    },
  },

  // ---------- 4. O Andarilho ----------
  wanderer: {
    duration: SCENE_DUR,
    text: 'O anel externo já começa a ceder. Mas existe alguém que a Fratura marca e não consegue desfazer: um Andarilho, que atravessa os anéis e volta.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.56;
      const wx = W * 0.36, wy = hz + 84;

      ctx.save();
      camera(1 + ease(t / SCENE_DUR) * 0.1, wx, hz + 40, 0, t);

      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#2a1d3a');
      sky.addColorStop(0.6, '#b4604a');
      sky.addColorStop(1, '#f0a860');
      ctx.fillStyle = sky;
      ctx.fillRect(-60, -60, W + 120, hz + 62);

      const sun = ctx.createRadialGradient(W * 0.8, hz - 10, 0, W * 0.8, hz - 10, 200);
      sun.addColorStop(0, 'rgba(255,230,170,0.85)');
      sun.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = sun;
      ctx.fillRect(-60, -60, W + 120, H + 120);

      ridge(hz - 6, 6, 0.014, 1, '#6a3a4a');

      // Aethel, ao longe
      const ax = W * 0.78;
      ctx.fillStyle = '#2a1a2c';
      ctx.fillRect(ax - 32, hz - 18, 64, 20);
      ctx.fillRect(ax - 34, hz - 30, 8, 14);
      ctx.fillRect(ax + 26, hz - 30, 8, 14);
      ctx.fillRect(ax - 8, hz - 40, 16, 24);
      const beat = 0.75 + 0.25 * Math.sin(t * 2.2);
      ctx.fillStyle = `rgba(255,228,150,${0.7 * beat})`;
      ctx.fillRect(ax - 1.5, hz - 150, 3, 112);

      ridge(hz + 30, 10, 0.011, 3, '#3a1f34');

      // beirada do chão (o anel externo ruindo)
      ctx.fillStyle = '#0f0a14';
      ctx.beginPath();
      ctx.moveTo(-60, H + 60);
      ctx.lineTo(-60, wy);
      ctx.lineTo(W * 0.5, wy);
      ctx.lineTo(W * 0.53, wy + 8);
      ctx.lineTo(W * 0.51, wy + 26);
      ctx.lineTo(W * 0.56, wy + 46);
      ctx.lineTo(W * 0.52, wy + 76);
      ctx.lineTo(W * 0.58, H + 60);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(240,170,110,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-60, wy);
      ctx.lineTo(W * 0.5, wy);
      ctx.stroke();

      // rachaduras na beirada
      const k = ease((t - 2.5) / 5);
      if (k > 0) {
        const r = rng(9);
        crack(r, W * 0.5, wy, W * 0.30, H + 20, 8, k, 2.5);
        crack(r, W * 0.46, wy + 4, W * 0.46, H + 20, 8, k * 0.9, 2);
        crack(r, W * 0.40, wy + 2, W * 0.12, H + 20, 8, k * 0.7, 2);
      }

      // pedaços de terra se soltando
      const rise = ease((t - 2) / 6);
      for (let i = 0; i < 7; i++) {
        const bx = W * 0.56 + i * 30;
        const by = wy + 30 + (i % 3) * 18;
        const y = by - rise * (22 + i * 9) - Math.sin(t * 0.8 + i) * 3;
        const s = 6 + (i % 3) * 4;
        ctx.fillStyle = '#1a1220';
        ctx.beginPath();
        ctx.moveTo(bx - s, y); ctx.lineTo(bx - s * 0.3, y - s);
        ctx.lineTo(bx + s, y - s * 0.4); ctx.lineTo(bx + s * 0.6, y + s * 0.7);
        ctx.closePath();
        ctx.fill();
      }

      // aura da marca
      const ag = ctx.createRadialGradient(wx, wy - 45, 0, wx, wy - 45, 80);
      const pa = 0.2 + 0.12 * Math.sin(t * 1.8);
      ag.addColorStop(0, `rgba(255,220,130,${pa})`);
      ag.addColorStop(1, 'rgba(255,200,100,0)');
      ctx.fillStyle = ag;
      ctx.fillRect(wx - 90, wy - 140, 180, 180);

      drawWanderer(wx, wy, 2.6, '#07050b');
      ctx.restore();

      motes(t, 18, '255,210,120', { seed: 12, size: 2, rise: -14, sway: 16, y0: hz * 0.5, y1: H });
      vignette(0.8);
    },
  },

  // ---------- 5. A promessa ----------
  portal: {
    duration: SCENE_DUR,
    text: 'Oito Núcleos, oito Guardiões. Reacenda o Portal antes que o anel externo desabe.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H;
      const cx = W / 2, cy = (52 + (H - 96)) / 2 - 10;

      ctx.fillStyle = '#04050a';
      ctx.fillRect(0, 0, W, H);

      const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 320);
      bgGlow.addColorStop(0, 'rgba(255,220,140,0.18)');
      bgGlow.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      camera(1 + ease(t / SCENE_DUR) * 0.12, cx, cy, 0, t);

      // anel do Portal
      const R = 120;
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#2e2a3a';
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(201,162,77,0.6)';
      ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, R - 10, 0, Math.PI * 2); ctx.stroke();

      // eixo de luz (o antigo elevador)
      const lb = ctx.createLinearGradient(0, cy - R + 14, 0, cy + R - 14);
      const la = 0.25 + 0.15 * Math.sin(t * 1.6);
      lb.addColorStop(0, 'rgba(255,235,170,0)');
      lb.addColorStop(0.5, `rgba(255,235,170,${la})`);
      lb.addColorStop(1, 'rgba(255,235,170,0)');
      ctx.fillStyle = lb;
      ctx.fillRect(cx - 2, cy - R + 14, 4, 2 * R - 28);

      // 8 encaixes vazios; uma onda fraca de luz percorre o anel
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4;
        const sx = cx + Math.cos(a) * R;
        const sy = cy + Math.sin(a) * R;
        const wave = Math.pow(Math.max(0, Math.sin(t * 1.6 - i * 0.8)), 6) * 0.8;
        if (wave > 0.02) {
          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30);
          g.addColorStop(0, `rgba(255,220,130,${wave})`);
          g.addColorStop(1, 'rgba(255,200,100,0)');
          ctx.fillStyle = g;
          ctx.fillRect(sx - 32, sy - 32, 64, 64);
        }
        ctx.fillStyle = '#0b0a10';
        ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(${107 + wave * 120},${90 + wave * 100},${52 + wave * 60},1)`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // o Andarilho, de costas, diante do Portal
      drawWanderer(cx, cy + R + 66, 1.7, '#000');
      ctx.restore();

      motes(t, 26, '255,220,130', { seed: 21, size: 2, rise: -16, sway: 14 });

      const fl = ease((t - 8.8) / 0.5) * (1 - ease((t - 9.4) / 0.5));
      if (fl > 0) {
        ctx.fillStyle = `rgba(255,235,170,${fl * 0.5})`;
        ctx.fillRect(0, 0, W, H);
      }
      vignette(0.8);
    },
  },
};

// Ordem de exibição
const INTRO_ORDER = ['title', 'tower', 'fracture', 'rings', 'aethel', 'wanderer', 'portal'];

// ------------------------------------------------------------
// Controle (mesmo formato de `cs` que o drawCutscene espera)
// ------------------------------------------------------------
let intro = null; // { cs, onEnd }

function buildIntro() {
  const lines = INTRO_ORDER.map((key) => {
    const s = SCENES[key];
    return {
      text: s.text || '',
      scene: s.draw,
      duration: s.duration ?? SCENE_DUR,
      flash: !!s.flash,
      auto: !!s.auto || key === 'title',       // ← força title a auto
    };
  });
  return {
    lines,
    index: 0,
    timer: 0,              // começa em 0 (tempo decorrido)
    totalElapsed: 0,
    manual: true,
    _advanceRequested: false,
    _skipAll: false,
    onEnd: null,
  };
}

function finishIntro() {
  const cb = intro?.onEnd;
  intro = null;
  if (cb) cb();
}

export function isIntroActive() { return intro !== null; }

/** Inicia a cutscene. `onEnd` é chamado ao terminar (ou ao pular tudo). */
export function startIntroCutscene(onEnd) {
  intro = { cs: buildIntro(), onEnd };
  setGameState(STATE.INTRO);
  setMusicMode('cutscene');
}

/** Chamar todo frame enquanto gameState === STATE.INTRO. */
export function updateIntroCutscene(dt) {
  if (!intro) return;
  const cs = intro.cs;
  cs.totalElapsed += dt;

  // ---- Pular tudo (ESC) ----
  if (cs._skipAll) {
    cs._skipAll = false;
    finishIntro();
    return;
  }

  // Tempo decorrido do slide atual. Sem teto: a cena continua "viva"
  // (ver drawCutscene). O `auto` do title continua usando timer >= dur.
  const line = cs.lines[cs.index];
  const dur = line?.duration ?? SCENE_DUR;
  cs.timer += dt;

  // Avanço manual OU automático (só `title`).
  const wantAdvance = cs._advanceRequested;
  const autoDone = line?.auto && cs.timer >= dur;

  if (wantAdvance || autoDone) {
    cs._advanceRequested = false;
    cs.index++;
    if (cs.index >= cs.lines.length) { finishIntro(); return; }
    cs.timer = 0;
  }
}

export function renderIntroCutscene() {
  if (intro) drawCutscene(intro.cs);
}

// Ignora input nos primeiros instantes (evita pular sem querer
// com um Enter/clique que veio da tela de classe).
const SKIP_GRACE = 0.4;

/** Espaço / Enter / clique: avança o slide atual. */
export function skipIntroScene() {
  if (!intro || intro.cs.totalElapsed < SKIP_GRACE) return;
  intro.cs._advanceRequested = true;
}

/** Esc: pula a cutscene inteira. */
export function skipIntroAll() {
  if (!intro || intro.cs.totalElapsed < SKIP_GRACE) return;
  intro.cs._skipAll = true;
}