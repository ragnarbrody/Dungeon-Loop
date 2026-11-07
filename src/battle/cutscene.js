// ============================================================
// CUTSCENE DE BOSS — slideshow com cenas desenhadas em canvas.
// Tudo determinístico. Cada cena dura 10s (sincroniza com
// a música 'cutscene': 72 BPM × 3 compassos).
// ============================================================

import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { setGameState, STATE } from '../core/state.js';

export const SCENE_DUR = 10;
const FADE = 0.8;
const TYPE_START = 1.0;
const TYPE_CPS = 30;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp01 = v => Math.max(0, Math.min(1, v));
export const ease = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
export const lerp = (a, b, k) => a + (b - a) * k;

export function vignette(strength = 0.7) {
  const vig = ctx.createRadialGradient(
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.3,
    CANVAS_W / 2, CANVAS_H / 2, CANVAS_H * 0.95
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

export function camera(zoom, ax, ay, shake = 0, t = 0) {
  ctx.translate(ax, ay);
  ctx.scale(zoom, zoom);
  ctx.translate(-ax, -ay);
  if (shake > 0) {
    ctx.translate(
      (Math.sin(t * 47) + Math.sin(t * 31 + 1)) * shake,
      (Math.sin(t * 53 + 2) + Math.sin(t * 29)) * shake
    );
  }
}

export function fog(t, y, h, rgb, alpha, speed = 10, n = 6) {
  const span = CANVAS_W + 300;
  for (let i = 0; i < n; i++) {
    const x = (((i * span / n + t * speed) % span) + span) % span - 150;
    const rx = 180 + (i % 3) * 50;
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 0.4 + i) * 6);
    ctx.scale(1, h / (2 * rx));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, `rgba(${rgb},${alpha})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function motes(t, count, rgb, o = {}) {
  const { seed = 1, size = 2, rise = -8, sway = 14, y0 = 0, y1 = CANVAS_H, alpha = 1 } = o;
  const r = rng(seed);
  const span = y1 - y0;
  for (let i = 0; i < count; i++) {
    const bx = r() * CANVAS_W;
    const by = y0 + r() * span;
    const ph = r() * 6.28;
    const sp = 0.4 + r() * 0.8;
    const x = bx + Math.sin(t * sp + ph) * sway;
    const y = y0 + ((((by - y0) + t * rise * (0.5 + sp * 0.5)) % span) + span) % span;
    const a = (0.3 + 0.7 * Math.abs(Math.sin(t * sp * 1.7 + ph))) * alpha;
    ctx.fillStyle = `rgba(${rgb},${a * 0.18})`;
    ctx.fillRect(x - size, y - size, size * 3, size * 3);
    ctx.fillStyle = `rgba(${rgb},${a})`;
    ctx.fillRect(x, y, size, size);
  }
}

// Galho recursivo
function branchStroke(r, x, y, ang, len, w, depth, t, onTip) {
  if (depth <= 0) { if (onTip) onTip(x, y); return; }
  const a = ang + Math.sin(t * 0.7 + depth * 1.3 + x * 0.013) * 0.035;
  const nx = x + Math.cos(a) * len;
  const ny = y + Math.sin(a) * len;
  ctx.lineWidth = Math.max(1, w);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  const spread = 0.38 + r() * 0.3;
  branchStroke(r, nx, ny, a - spread, len * 0.74, w * 0.66, depth - 1, t, onTip);
  branchStroke(r, nx, ny, a + spread * 0.9, len * 0.72, w * 0.66, depth - 1, t, onTip);
  if (depth > 3 && r() < 0.5) {
    branchStroke(r, nx, ny, a + (r() - 0.5) * 0.3, len * 0.6, w * 0.5, depth - 2, t, onTip);
  }
}

// Silhueta de floresta (sem buracos — copa em círculos sobrepostos)
function drawTreeSilhouette(x, baseY, scale, color, sway = 0, seed = 1) {
  const r = rng(seed * 9973);
  const cx = x + sway;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - 6 * scale, baseY);
  ctx.lineTo(cx - 3 * scale, baseY - 46 * scale);
  ctx.lineTo(cx + 3 * scale, baseY - 46 * scale);
  ctx.lineTo(cx + 6 * scale, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 7; i++) {
    const ox = (r() - 0.5) * 44 * scale;
    const oy = -44 * scale - r() * 34 * scale;
    const rad = (13 + r() * 12) * scale;
    ctx.moveTo(cx + ox + rad, baseY + oy);
    ctx.arc(cx + ox, baseY + oy, rad, 0, Math.PI * 2);
  }
  ctx.fill();
}

// ============================================================
// CARVALHO VELHO (Árvore Mãe)
// ============================================================
//
// Tronco retorcido com curvas bezier em vez de trapézio reto.
// Casca: 3 camadas (base, veios escuros, veios claros) + nós.
// Raízes: gavinhas entrelaçadas, não só linhas.
// Galhos: mais numerosos e retorcidos.
// Olhos: fendas de luz na casca, sem sobrancelha preta e sem
// pupila — apenas uma luz interna que atravessa a madeira.
//
function gnarledTree(cx, baseY, s, p, t, o = {}) {
  const r = rng(o.seed ?? 7);
  const sway = Math.sin(t * 0.5) * (o.sway ?? 3) * s;
  const topY = baseY - 210 * s;
  ctx.lineCap = 'round';

  // ---------- RAIZES ----------
  // Gavinhas grossas que se bifurcam, com formato de "dedo" retorcido.
  ctx.strokeStyle = p.root;
  const rootN = 9;
  for (let i = 0; i < rootN; i++) {
    const k = (i / (rootN - 1)) * 2 - 1;
    const baseW = (26 - Math.abs(k) * 14) * s;
    const rootX = cx + k * 18 * s;
    const rootY0 = baseY - 48 * s;
    // main root
    ctx.lineWidth = baseW;
    ctx.beginPath();
    ctx.moveTo(rootX, rootY0);
    ctx.bezierCurveTo(
      rootX + k * 30 * s, baseY - 10 * s,
      cx + k * (58 + r() * 30) * s, baseY + 2 * s,
      cx + k * (100 + r() * 60) * s, baseY + r() * 10 * s
    );
    ctx.stroke();
    // bifurcação (dedo menor)
    if (i % 2 === 0) {
      ctx.lineWidth = baseW * 0.55;
      ctx.beginPath();
      ctx.moveTo(rootX + k * 8 * s, baseY - 22 * s);
      ctx.quadraticCurveTo(
        rootX + k * 46 * s, baseY - 8 * s,
        rootX + k * (72 + r() * 20) * s, baseY + 6 * s
      );
      ctx.stroke();
    }
  }

  // ---------- TRONCO ----------
  // Retorcido: 3 curvas bezier (base larga, cintura, topo).
  ctx.fillStyle = p.trunk;
  ctx.beginPath();
  const baseL = cx - 46 * s;
  const baseR = cx + 46 * s;
  const waistL = cx - 30 * s + sway * 0.4;
  const waistR = cx + 30 * s + sway * 0.4;
  const topL = cx - 20 * s + sway * 0.3;
  const topR = cx + 20 * s + sway * 0.3;
  ctx.moveTo(baseL, baseY + 4 * s);
  ctx.bezierCurveTo(cx - 60 * s, baseY - 40 * s, waistL - 4 * s, baseY - 90 * s, topL, topY);
  ctx.lineTo(topR, topY);
  ctx.bezierCurveTo(waistR + 4 * s, baseY - 90 * s, cx + 60 * s, baseY - 40 * s, baseR, baseY + 4 * s);
  ctx.closePath();
  ctx.fill();

  // Camada 2 do tronco: sombra do lado direito (volume)
  ctx.fillStyle = p.trunkDark || p.bark;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(cx + 8 * s, baseY + 2 * s);
  ctx.bezierCurveTo(cx + 30 * s, baseY - 60 * s, cx + 22 * s, baseY - 120 * s, topR + 2 * s, topY);
  ctx.lineTo(topR, topY);
  ctx.lineTo(topL, topY);
  ctx.lineTo(topL, topY);
  ctx.lineTo(topL - 0.1, topY);
  ctx.bezierCurveTo(topL + 4 * s, baseY - 120 * s, cx + 14 * s, baseY - 60 * s, cx + 8 * s, baseY + 2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Veios da casca (3 espessuras + nós)
  ctx.strokeStyle = p.bark;
  for (let i = 0; i < 14; i++) {
    const k = (i / 13) * 2 - 1;
    const wobble = (r() - 0.5) * 6 * s;
    ctx.lineWidth = Math.max(1, 1.4 * s);
    ctx.globalAlpha = 0.35 + r() * 0.35;
    ctx.beginPath();
    ctx.moveTo(cx + k * 34 * s + wobble, baseY);
    ctx.bezierCurveTo(
      cx + k * 22 * s + wobble * 0.5, baseY - 70 * s,
      cx + k * 30 * s + (r() - 0.5) * 6 * s, baseY - 140 * s,
      cx + k * 12 * s + sway * 0.3, topY + 6 * s
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Nós de casca (olhos de madeira antiga)
  const knotCount = 3 + Math.floor(r() * 3);
  ctx.fillStyle = p.bark;
  for (let i = 0; i < knotCount; i++) {
    const kx = cx + (r() - 0.5) * 40 * s;
    const ky = baseY - 60 * s - r() * 90 * s;
    ctx.beginPath();
    ctx.ellipse(kx, ky, (2 + r() * 2) * s, (3 + r() * 3) * s, r() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    // anel claro em volta
    ctx.strokeStyle = p.trunkHi || p.trunk;
    ctx.lineWidth = Math.max(0.8, 1 * s);
    ctx.stroke();
  }

  // ---------- GALHOS ----------
  ctx.strokeStyle = p.branch;
  const tips = [];              // pontas COM folhas (galhos superiores)
  const bareTips = [];          // pontas SEM folhas (galhos inferiores)
  const onTip = (x, y) => tips.push([x, y]);
  const onBareTip = (x, y) => bareTips.push([x, y]);
  const tx = cx + sway * 0.3;
  const up = -Math.PI / 2;

  // Dois grupos de galhos:
  //   - superiores (com folhas): saem do topo, copa densa em cima
  //   - inferiores (sem folhas): saem da base/lateral baixa, "galhos mortos"
  const limbsUpper = [
    { dx: 0,   dy: 0,  ang: up,        len: 62, w: 20 },
    { dx: -6,  dy: 6,  ang: up - 0.85, len: 74, w: 19 },
    { dx: 6,   dy: 6,  ang: up + 0.85, len: 74, w: 19 },
    { dx: -18, dy: 44, ang: up - 1.35, len: 66, w: 15 },
    { dx: 18,  dy: 44, ang: up + 1.35, len: 66, w: 15 },
  ];
  const limbsBare = [
    { dx: -24, dy: 92,  ang: up - 1.75, len: 58, w: 11 },
    { dx: 24,  dy: 92,  ang: up + 1.75, len: 58, w: 11 },
    { dx: -32, dy: 130, ang: up - 2.05, len: 48, w: 8 },
    { dx: 32,  dy: 130, ang: up + 2.05, len: 48, w: 8 },
  ];
  const depth = o.depth ?? 5;

  // 1. Galhos inferiores (SEM folhas) — desenhados primeiro,
  //    atrás de tudo, pra parecer que estão atrás dos superiores.
  for (const L of limbsBare) {
    branchStroke(r, tx + L.dx * s, topY + L.dy * s, L.ang, L.len * s, L.w * s, depth - 1, t, onBareTip);
  }

  // 2. Galhos superiores (COM folhas) — desenhados por cima
  for (const L of limbsUpper) {
    branchStroke(r, tx + L.dx * s, topY + L.dy * s, L.ang, L.len * s, L.w * s, depth, t, onTip);
  }

  // ---------- FOLHAGEM ----------
  if ((o.leafAlpha ?? 1) > 0) {
    ctx.globalAlpha = o.leafAlpha ?? 1;

    // helper: desenha um "cluster" de folhas em 3 camadas concêntricas.
    // O `tint` extra dá variação de tom por cluster (efeito de luz solar).
    const cluster = (cx2, cy2, r2, dark, mid, hi, tint = null) => {
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = mid;
      ctx.beginPath();
      ctx.arc(cx2 - r2 * 0.15, cy2 - r2 * 0.2, r2 * 0.82, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.arc(cx2 - r2 * 0.3, cy2 - r2 * 0.35, r2 * 0.45, 0, Math.PI * 2);
      ctx.fill();
      if (tint) {
        ctx.globalAlpha = (o.leafAlpha ?? 1) * 0.25;
        ctx.fillStyle = tint;
        ctx.beginPath();
        ctx.arc(cx2 + r2 * 0.2, cy2 - r2 * 0.15, r2 * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = o.leafAlpha ?? 1;
      }
    };

    const leafMid = p.leafMid || p.leafLight;
    const leafHi  = p.leafHi  || p.leafLight;

    // -------- COPA: 3 ESTRATOS --------
    // Camada 1 (mais escura, mais larga): "manto" de fundo.
    // É o que cobre o miolo e dá silhueta de copa.
    const canopyCx = tx;
    const canopyCy = topY - 72 * s;
    ctx.fillStyle = p.leafDark;
    ctx.beginPath();
    ctx.ellipse(canopyCx, canopyCy, 132 * s, 100 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx - 78 * s, canopyCy + 22 * s, 74 * s, 58 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx + 78 * s, canopyCy + 22 * s, 74 * s, 58 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx - 60 * s, canopyCy - 52 * s, 64 * s, 50 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx + 60 * s, canopyCy - 52 * s, 64 * s, 50 * s, 0, 0, Math.PI * 2);
    // topo da copa (levemente pontudo, não uma bola)
    ctx.ellipse(canopyCx, canopyCy - 70 * s, 80 * s, 48 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // Camada 2: "miolo" médio. Dá volume e cobre a transição do manto
    // pro verde mais claro. É um manto menor, deslocado pra cima.
    ctx.fillStyle = leafMid;
    ctx.beginPath();
    ctx.ellipse(canopyCx, canopyCy - 18 * s, 100 * s, 70 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx - 55 * s, canopyCy - 8 * s, 52 * s, 40 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(canopyCx + 55 * s, canopyCy - 8 * s, 52 * s, 40 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    // -------- CLUSTERS NAS PONTAS DOS GALHOS (COM folhas) --------
    // Cada ponta ganha um cluster grande + opcionalmente 1 médio.
    // A posição "subiu" um pouco, pra parecer que a copa se estende
    // além das pontas.
    for (const [x, y] of tips) {
      const rad = (28 + r() * 18) * s;
      const dx = (r() - 0.5) * 8 * s;
      const dy = (r() - 0.5) * 6 * s;
      cluster(x + dx, y + dy, rad, p.leafDark, leafMid, leafHi);
      // 2º cluster menor, mais alto, dá "pico"
      if (r() < 0.65) {
        const rad2 = (12 + r() * 10) * s;
        cluster(x + (r() - 0.5) * 14 * s, y - rad * 0.45, rad2, p.leafDark, leafMid, leafHi);
      }
    }

    // -------- CLUSTERS INTERNOS (não só nas pontas) --------
    // Espalha clusters menores dentro do manto, pra quebrar a
    // monotonia e dar textura à copa.
    for (let i = 0; i < 22; i++) {
      const angle = r() * Math.PI * 2;
      const dist = 30 + r() * 95;
      const vx = canopyCx + Math.cos(angle) * dist * s;
      const vy = canopyCy + Math.sin(angle) * dist * 0.7 * s;
      // só desenha dentro do manto principal (evita flutuar)
      const dx = (vx - canopyCx) / (132 * s);
      const dy = (vy - canopyCy) / (100 * s);
      if (dx * dx + dy * dy > 1) continue;
      const rad = (6 + r() * 12) * s;
      cluster(vx, vy, rad, p.leafDark, leafMid, leafHi);
    }

    // -------- VÃOS DE LUZ (highlight final) --------
    // Pequenos brilhos no topo-esquerdo da copa, pra dar aquela
    // "luz do sol batendo".
    for (let i = 0; i < 18; i++) {
      const vx = canopyCx + (r() - 0.65) * 200 * s;
      const vy = canopyCy + (r() - 0.7) * 130 * s;
      const dx = (vx - canopyCx) / (132 * s);
      const dy = (vy - canopyCy) / (100 * s);
      if (dx * dx + dy * dy > 1) continue;
      const vr = (4 + r() * 8) * s;
      ctx.fillStyle = leafHi;
      ctx.beginPath();
      ctx.arc(vx, vy, vr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  return { topY, eyeY: baseY - 138 * s, chestY: baseY - 112 * s, tips, bareTips };
}

// ============================================================
// OLHOS — fendas de luz na casca (sem sobrancelha, sem pupila)
// ============================================================
//
// Em vez de "olho de desenho animado", desenhamos:
//   1. Um halo luminoso difuso (a luz que vaza pela madeira)
//   2. Uma fenda curva (arco) de luz quente, com o centro mais
//      brilhante e as pontas sumindo — como se a casca tivesse
//      rachado e a luz interna escapasse.
//   3. Um leve escurecimento em cima (pálpebra de casca), sem
//      desenhar uma "sobrancelha" preta.
//
function treeEyes(cx, ey, s, open, t, rgb) {
  if (open <= 0) return;
  const gap = 26 * s;
  const w = 16 * s;
  const h = 5 * s * open;

  // halo difuso (a luz atravessando a madeira)
  const halo = ctx.createRadialGradient(cx, ey, 2, cx, ey, 90 * s * open);
  halo.addColorStop(0, `rgba(${rgb},${0.35 * open})`);
  halo.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(cx - 100 * s, ey - 100 * s, 200 * s, 200 * s);

  for (const side of [-1, 1]) {
    const ex = cx + side * gap;

    // pálpebra de casca: sombra curva em cima (não é "sobrancelha")
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = Math.max(1.5, 2 * s);
    ctx.beginPath();
    ctx.moveTo(ex - side * w, ey - h * 1.4);
    ctx.quadraticCurveTo(ex, ey - h * 2.2, ex + side * w * 0.9, ey - h * 1.4);
    ctx.stroke();

    // fenda de luz (arco fino): base horizontal levemente curvada
    // desenhada com gradiente lateral pra dar profundidade
    const grad = ctx.createLinearGradient(ex - w, ey, ex + w, ey);
    grad.addColorStop(0, `rgba(${rgb},0)`);
    grad.addColorStop(0.3, `rgba(${rgb},${0.85 * open})`);
    grad.addColorStop(0.5, `rgba(255,245,200,${0.98 * open})`);
    grad.addColorStop(0.7, `rgba(${rgb},${0.85 * open})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = grad;

    // "amêndoa" assimétrica — a curva inferior é mais suave que
    // a superior, dando o aspecto de olho apertado / antigo
    ctx.beginPath();
    ctx.moveTo(ex - w, ey);
    ctx.quadraticCurveTo(ex, ey - h * 1.6, ex + w, ey);
    ctx.quadraticCurveTo(ex, ey + h * 1.0, ex - w, ey);
    ctx.fill();

    // núcleo mais brilhante (pupila = um ponto de luz, não um
    // disco escuro)
    ctx.fillStyle = `rgba(255,250,220,${open})`;
    ctx.beginPath();
    ctx.ellipse(ex + Math.sin(t * 0.8) * 0.8 * s, ey, 2.2 * s, h * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Raízes que sobem (crescem com `grow` 0..1)
function risingRoots(t, count, color, grow, thick = 7, lash = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = 20 + i * (CANVAS_W - 40) / Math.max(1, count - 1);
    const sway = Math.sin(t * 1.4 * lash + i * 0.9) * 14 * lash;
    const len = (50 + ((i * 37) % 70)) * grow + Math.sin(t * 0.9 + i * 1.3) * 10 * grow;
    ctx.lineWidth = thick * (0.6 + 0.4 * ((i * 53) % 10) / 10) * grow + 1;
    ctx.beginPath();
    ctx.moveTo(x, CANVAS_H + 14);
    ctx.bezierCurveTo(
      x + sway, CANVAS_H - len * 0.4,
      x - sway, CANVAS_H - len * 0.75,
      x + sway * 1.6, CANVAS_H - len
    );
    ctx.stroke();
  }
  ctx.restore();
}

export function drawWanderer(x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, y - 24 * s);
  ctx.lineTo(x + 5 * s, y - 24 * s);
  ctx.lineTo(x + 8 * s, y - 2 * s);
  ctx.lineTo(x - 8 * s, y - 2 * s);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 29 * s, 4.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 5 * s, y - 3 * s, 3.5 * s, 3 * s);
  ctx.fillRect(x + 1.5 * s, y - 3 * s, 3.5 * s, 3 * s);
}

function lerpColor(a, b, k) {
  return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
}

// ------------------------------------------------------------
// HELPERS DAS CENAS PÓS-BOSS (paisagem, luz, personagem)
// ------------------------------------------------------------
const LB_TOP = 52;   // altura do letterbox de cima (igual ao drawCutscene)
const LB_BOT = 96;   // altura do letterbox de baixo

function additive(fn) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  fn();
  ctx.restore();
}

function glow(x, y, r, rgb, a = 1) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function vGrad(y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  ctx.fillStyle = g;
  ctx.fillRect(-80, -80, CANVAS_W + 160, CANVAS_H + 160);
}

function starField(t, count, seed, yMax, alpha = 1) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const x = r() * CANVAS_W, y = r() * yMax;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.4 + r() * 1.2) + r() * 6.28));
    const big = r() < 0.12;
    ctx.fillStyle = `rgba(225,235,255,${tw * 0.85 * alpha})`;
    ctx.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
  }
}

// Linha de colinas suaves (soma de senos determinísticos)
function hills(baseY, amp, color, seed, drift = 0) {
  const r = rng(seed);
  const p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-10, CANVAS_H + 10);
  for (let x = -10; x <= CANVAS_W + 10; x += 12) {
    const xx = x + drift;
    const y = baseY - (Math.sin(xx * 0.006 + p1) * amp
      + Math.sin(xx * 0.014 + p2) * amp * 0.45
      + Math.sin(xx * 0.033 + p3) * amp * 0.15);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(CANVAS_W + 10, CANVAS_H + 10);
  ctx.closePath();
  ctx.fill();
}

// Fileira de árvores. bendFn(x) devolve deslocamento extra (vento/onda).
function forestRow(baseY, scale, color, seed, count, t, bendFn) {
  const W = CANVAS_W;
  for (let i = 0; i < count; i++) {
    const x = -30 + i * (W + 60) / Math.max(1, count - 1) + ((i * 37) % 11) - 5;
    const sc = scale * (0.85 + ((i * 53) % 10) / 25);
    const sway = Math.sin(t * 0.5 + i * 1.3) * 0.8 + (bendFn ? bendFn(x) : 0);
    drawTreeSilhouette(x, baseY + ((i * 17) % 7), sc, color, sway, seed + i);
  }
}

function grassBlades(t, y0, y1, count, seed, rgb, h = 14, wind = 1) {
  const r = rng(seed);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i++) {
    const x = r() * CANVAS_W;
    const k = r();
    const y = y0 + k * (y1 - y0);
    const hh = h * (0.5 + r() * 0.9) * (0.6 + 0.8 * k);
    const lean = Math.sin(t * 1.3 * wind + x * 0.02 + r() * 6.28) * 3 * (0.5 + k);
    ctx.strokeStyle = `rgba(${rgb},${0.35 + r() * 0.55})`;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + lean * 0.4, y - hh * 0.6, x + lean, y - hh);
    ctx.stroke();
  }
}

function bird(x, y, s, flap, color) {
  const w = 7 * s, h = Math.sin(flap) * 3.2 * s;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - w, y - h);
  ctx.quadraticCurveTo(x - w * 0.4, y - h * 0.2 - 2 * s, x, y);
  ctx.quadraticCurveTo(x + w * 0.4, y - h * 0.2 - 2 * s, x + w, y - h);
  ctx.stroke();
}

// Raios de luz (cunhas aditivas saindo de um ponto)
function godRays(t, sx, sy, rgb, n, alpha, spread = 1.1, len = 700, dir = Math.PI / 2) {
  additive(() => {
    for (let i = 0; i < n; i++) {
      const base = dir - spread / 2 + (i / (n - 1)) * spread;
      const a = base + Math.sin(t * 0.25 + i * 1.7) * 0.03;
      const wdt = 0.025 + (i % 3) * 0.012;
      const al = alpha * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 2.1));
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, len);
      g.addColorStop(0, `rgba(${rgb},${al})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(a - wdt) * len, sy + Math.sin(a - wdt) * len);
      ctx.lineTo(sx + Math.cos(a + wdt) * len, sy + Math.sin(a + wdt) * len);
      ctx.closePath();
      ctx.fill();
    }
  });
}

// Folha em formato de amêndoa
function leafShape(x, y, ang, len, w, color, vein = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -w, len, 0);
  ctx.quadraticCurveTo(len * 0.5, w * 0.9, 0, 0);
  ctx.fill();
  if (vein) {
    ctx.strokeStyle = 'rgba(235,255,200,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len * 0.85, 0);
    ctx.stroke();
  }
  ctx.restore();
}

// Toco da Árvore Mãe: raízes, casca, topo rachado com anéis de crescimento.
// Devolve { topY } (y do topo, pra encaixar a muda).
function stumpShape(cx, gY, s, t, o = {}) {
  const r = rng(o.seed ?? 5);
  const h = (o.h ?? 46) * s;
  const bw = 40 * s;
  const bark = o.bark ?? '#1a0f09';
  const lit = o.lit ?? 'rgba(220,170,100,0.35)';

  // raízes
  ctx.strokeStyle = o.root ?? '#0f0805';
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const k = (i / 7) * 2 - 1;
    ctx.lineWidth = Math.max(2, (11 - Math.abs(k) * 6) * s);
    ctx.beginPath();
    ctx.moveTo(cx + k * 26 * s, gY - h * 0.35);
    ctx.bezierCurveTo(cx + k * 46 * s, gY - 2 * s, cx + k * 72 * s, gY + 1 * s,
      cx + k * (96 + r() * 34) * s, gY + (4 + r() * 7) * s);
    ctx.stroke();
  }

  // corpo
  const g = ctx.createLinearGradient(cx - bw, 0, cx + bw, 0);
  g.addColorStop(0, '#0a0503');
  g.addColorStop(0.45, bark);
  g.addColorStop(1, '#0a0503');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - bw * 1.25, gY + 3 * s);
  ctx.bezierCurveTo(cx - bw * 0.95, gY - h * 0.4, cx - bw * 0.9, gY - h * 0.8, cx - bw * 0.82, gY - h);
  ctx.lineTo(cx + bw * 0.82, gY - h);
  ctx.bezierCurveTo(cx + bw * 0.9, gY - h * 0.8, cx + bw * 0.95, gY - h * 0.4, cx + bw * 1.25, gY + 3 * s);
  ctx.closePath();
  ctx.fill();

  // veios da casca
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = Math.max(1, 1.2 * s);
  for (let i = 0; i < 9; i++) {
    const k = (i / 8) * 2 - 1;
    ctx.beginPath();
    ctx.moveTo(cx + k * bw * 1.1, gY);
    ctx.quadraticCurveTo(cx + k * bw * 0.9 + (r() - 0.5) * 6 * s, gY - h * 0.5, cx + k * bw * 0.75, gY - h);
    ctx.stroke();
  }

  // lasca de luz na borda direita
  ctx.strokeStyle = lit;
  ctx.lineWidth = Math.max(1, 1.4 * s);
  ctx.beginPath();
  ctx.moveTo(cx + bw * 1.2, gY);
  ctx.bezierCurveTo(cx + bw * 0.95, gY - h * 0.4, cx + bw * 0.9, gY - h * 0.8, cx + bw * 0.82, gY - h);
  ctx.stroke();

  // lascas quebradas (fundo do topo)
  ctx.fillStyle = bark;
  for (let j = 0; j < 6; j++) {
    const x = cx - bw * 0.78 + j * (bw * 1.56 / 5);
    const hh = (5 + r() * 16) * s;
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, gY - h);
    ctx.lineTo(x + (r() - 0.5) * 5 * s, gY - h - hh);
    ctx.lineTo(x + 6 * s, gY - h);
    ctx.fill();
  }

  // topo cortado (madeira exposta) + anéis
  const ty = gY - h;
  const tg = ctx.createRadialGradient(cx, ty, 2, cx, ty, bw * 0.9);
  tg.addColorStop(0, o.core ?? '#4a3018');
  tg.addColorStop(1, o.edge ?? '#241409');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.ellipse(cx, ty, bw * 0.84, bw * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 5; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, ty, bw * 0.84 * (i / 5.6), bw * 0.22 * (i / 5.6), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  return { topY: ty, rx: bw * 0.84, ry: bw * 0.22 };
}

// Muda: caule curvo, folhas que desabrocham em pares, botão luminoso.
function saplingShape(x, y, grow, t, s = 1) {
  if (grow <= 0) return { tipX: x, tipY: y };
  const h = (8 + grow * 44) * s;
  const sw = Math.sin(t * 1.4) * 2 * s * grow;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#4f8f3c';
  ctx.lineWidth = 2.4 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sw * 0.2 - 3 * s, y - h * 0.5, x + sw, y - h);
  ctx.stroke();

  const pairs = [[0.35, 0.12, 9], [0.62, 0.32, 11], [0.86, 0.55, 9]];
  for (const [f, thr, len] of pairs) {
    const k = ease((grow - thr) / 0.3);
    if (k <= 0) continue;
    const px = x + sw * f * f - 3 * s * (1 - f), py = y - h * f;
    const flutter = Math.sin(t * 1.8 + f * 5) * 0.06;
    leafShape(px, py, -0.35 - 0.5 * (1 - k) + flutter, len * s * k, 4.2 * s * k, '#6fbd63');
    leafShape(px, py, Math.PI + 0.35 + 0.5 * (1 - k) - flutter, len * s * k, 4.2 * s * k, '#58a552');
  }
  const tx = x + sw, ty = y - h;
  additive(() => glow(tx, ty, 26 * s, '170,255,140', 0.5 * grow));
  ctx.fillStyle = '#c9f5a0';
  ctx.beginPath();
  ctx.arc(tx, ty, 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  return { tipX: tx, tipY: ty };
}

// O Andarilho de costas: capa com barra ondulada, capuz, mochila, brilho
// da Semente na mochila e do Núcleo na mão. `walk` (0..1) liga a passada.
function wandererBack(x, y, s, t, o = {}) {
  const {
    walk = 0, rim = '255,190,110', rimA = 0.5, seed = true, core = true,
    body = '#07040a', cloak2 = '#150c0e', glowK = 1,
  } = o;
  const ph = t * 4.4;
  const bob = Math.abs(Math.sin(ph)) * 1.8 * s * walk;
  const sway = Math.sin(ph) * 1.6 * s * walk;
  const top = y - 52 * s - bob;

  // sombra
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1 * s, 17 * s, 3.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // pernas (levantam alternadas)
  ctx.fillStyle = body;
  const liftL = Math.max(0, Math.sin(ph)) * 3.5 * s * walk;
  const liftR = Math.max(0, -Math.sin(ph)) * 3.5 * s * walk;
  ctx.fillRect(x - 6.5 * s, y - 16 * s, 4.5 * s, 16 * s - liftL);
  ctx.fillRect(x + 2 * s, y - 16 * s, 4.5 * s, 16 * s - liftR);

  // capa
  const cg = ctx.createLinearGradient(0, top, 0, y);
  cg.addColorStop(0, cloak2);
  cg.addColorStop(1, body);
  ctx.fillStyle = cg;
  const cloakPath = () => {
    ctx.beginPath();
    ctx.moveTo(x - 7 * s, top + 2 * s);
    ctx.bezierCurveTo(x - 13 * s, y - 34 * s, x - 18 * s - sway, y - 14 * s, x - 15 * s - sway, y - 4 * s);
    ctx.quadraticCurveTo(x - 8 * s - sway * 0.6, y + Math.sin(ph + 1) * 1.4 * s, x - sway * 0.3, y - 3 * s);
    ctx.quadraticCurveTo(x + 8 * s - sway * 0.6, y - 6 * s + Math.sin(ph + 2) * 1.4 * s, x + 15 * s - sway, y - 4 * s);
    ctx.bezierCurveTo(x + 18 * s - sway, y - 14 * s, x + 13 * s, y - 34 * s, x + 7 * s, top + 2 * s);
    ctx.closePath();
  };
  cloakPath();
  ctx.fill();

  // dobra central da capa
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.beginPath();
  ctx.moveTo(x, top + 12 * s);
  ctx.quadraticCurveTo(x - sway * 0.5, y - 20 * s, x - sway * 0.4, y - 4 * s);
  ctx.stroke();

  // mochila
  ctx.fillStyle = '#1a0f0a';
  ctx.beginPath();
  ctx.roundRect(x - 6.5 * s, top + 9 * s, 13 * s, 15 * s, 3 * s);
  ctx.fill();
  ctx.fillStyle = '#0d0705';
  ctx.fillRect(x - 6.5 * s, top + 15 * s, 13 * s, 1.4 * s);
  ctx.strokeStyle = `rgba(${rim},${rimA * 0.5})`;
  ctx.lineWidth = Math.max(1, s);
  ctx.beginPath();
  ctx.moveTo(x - 5 * s, top + 9 * s);
  ctx.lineTo(x + 5 * s, top + 9 * s);
  ctx.stroke();

  // capuz
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, top - 3 * s, 8.4 * s, 9.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7 * s, top - 6 * s);
  ctx.quadraticCurveTo(x - 6 * s, top + 6 * s, x - 9 * s, top + 8 * s);
  ctx.lineTo(x + 9 * s, top + 8 * s);
  ctx.quadraticCurveTo(x + 6 * s, top + 6 * s, x + 7 * s, top - 6 * s);
  ctx.fill();

  // luz de contorno (lado da fonte de luz = direita)
  ctx.strokeStyle = `rgba(${rim},${rimA})`;
  ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.beginPath();
  ctx.arc(x, top - 3 * s, 8.4 * s, -Math.PI * 0.62, Math.PI * 0.12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 7 * s, top + 2 * s);
  ctx.bezierCurveTo(x + 13 * s, y - 34 * s, x + 18 * s - sway, y - 14 * s, x + 15 * s - sway, y - 4 * s);
  ctx.stroke();

  // brilho da Semente (mochila) e do Núcleo (mão)
  additive(() => {
    if (seed) {
      const p = 0.65 + 0.35 * Math.sin(t * 2.4);
      glow(x, top + 14 * s, 22 * s * glowK, '254,210,110', 0.55 * p);
    }
    if (core) {
      const p = 0.7 + 0.3 * Math.sin(t * 3.0);
      glow(x + 15 * s - sway, y - 24 * s, 28 * s * glowK, '255,200,90', 0.7 * p);
    }
  });
  if (seed) {
    ctx.fillStyle = '#ffe9a6';
    ctx.beginPath();
    ctx.arc(x, top + 14 * s, 1.6 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  if (core) {
    ctx.fillStyle = '#fff1b8';
    ctx.beginPath();
    ctx.arc(x + 15 * s - sway, y - 24 * s, 2.4 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Octaedro dourado girando (o Núcleo): 8 faces sombreadas por ângulo de luz.
function coreGem(cx, cy, R, t, pulse = 1) {
  const rot = t * 0.9;
  const tilt = 0.28;               // inclinação em direção à câmera
  const top = { x: cx, y: cy - R * 1.2 };
  const bot = { x: cx, y: cy + R * 1.2 };
  const ring = [];
  for (let k = 0; k < 4; k++) {
    const a = rot + k * Math.PI / 2;
    ring.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * tilt, z: Math.sin(a), a });
  }
  const faces = [];
  for (let k = 0; k < 4; k++) {
    const p = ring[k], q = ring[(k + 1) % 4];
    const am = (p.a + q.a) / 2;
    const z = (p.z + q.z) / 2;
    const shade = 0.5 + 0.5 * Math.cos(am - 0.9);
    faces.push({ pts: [top, p, q], z: z + 0.3, shade: Math.min(1, shade + 0.25) });
    faces.push({ pts: [bot, p, q], z: z - 0.3, shade: Math.max(0, shade - 0.15) });
  }
  faces.sort((a, b) => a.z - b.z);
  for (const f of faces) {
    const k = f.shade;
    const r = Math.round(lerp(120, 255, k));
    const g = Math.round(lerp(62, 224, k));
    const b = Math.round(lerp(14, 130, k * k));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(f.pts[0].x, f.pts[0].y);
    ctx.lineTo(f.pts[1].x, f.pts[1].y);
    ctx.lineTo(f.pts[2].x, f.pts[2].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = `rgba(255,247,207,${0.25 + 0.3 * f.shade})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // brilho interno
  additive(() => glow(cx, cy, R * 1.1 * pulse, '255,230,150', 0.55));
}

// Mão aberta vinda de baixo-esquerda (cena da Semente). `k` = escala.
function reachingHand(hx, hy, t, warm, k = 2) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.scale(k, k);
  const bot = (CANVAS_H + 40 - hy) / k;
  // antebraço/manga (sobe quase na vertical, vindo de baixo)
  ctx.fillStyle = '#060302';
  ctx.beginPath();
  ctx.moveTo(-62, bot);
  ctx.lineTo(34, bot);
  ctx.bezierCurveTo(30, 70, 20, 34, 15, 12);
  ctx.lineTo(-17, 10);
  ctx.bezierCurveTo(-26, 34, -50, 70, -62, bot);
  ctx.fill();
  // punho da manga
  ctx.fillStyle = '#0c0705';
  ctx.beginPath();
  ctx.ellipse(-1, 14, 19, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // palma
  ctx.fillStyle = '#140b08';
  ctx.beginPath();
  ctx.ellipse(0, 4, 24, 11, -0.12, 0, Math.PI * 2);
  ctx.fill();
  // dedos levemente curvados
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#140b08';
  ctx.lineWidth = 5.2;
  for (let i = 0; i < 4; i++) {
    const fx = -8 + i * 9;
    const len = 18 - Math.abs(i - 1.5) * 2.5;
    ctx.beginPath();
    ctx.moveTo(fx, -2);
    ctx.quadraticCurveTo(fx + 4, -len * 0.6, fx + 2 + i, -len - 2);
    ctx.stroke();
  }
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-18, 3);
  ctx.quadraticCurveTo(-28, -4, -27, -12);
  ctx.stroke();
  // luz de contorno quente (cresce quando a Semente pousa)
  ctx.strokeStyle = `rgba(255,205,120,${0.18 + 0.55 * warm})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 4, 24, 11, -0.12, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.restore();
}

// Árvore morta: tronco retorcido + galhos nus (sem folhas), determinística.
function bareTree(cx, gY, s, t, o = {}) {
  const col = o.color ?? '#0d0806';
  const hgt = (o.h ?? 230) * s;
  const top = gY - hgt;
  ctx.fillStyle = col;
  ctx.strokeStyle = col;
  ctx.lineCap = 'round';
  // raízes
  for (let i = 0; i < 6; i++) {
    const k = (i / 5) * 2 - 1;
    ctx.lineWidth = Math.max(1.5, (12 - Math.abs(k) * 6) * s);
    ctx.beginPath();
    ctx.moveTo(cx + k * 22 * s, gY - 30 * s);
    ctx.bezierCurveTo(cx + k * 44 * s, gY - 2 * s, cx + k * 70 * s, gY + 1 * s, cx + k * (92 + (i % 3) * 14) * s, gY + 5 * s);
    ctx.stroke();
  }
  // tronco
  ctx.beginPath();
  ctx.moveTo(cx - 42 * s, gY + 4 * s);
  ctx.bezierCurveTo(cx - 50 * s, gY - hgt * 0.35, cx - 24 * s, gY - hgt * 0.7, cx - 12 * s, top);
  ctx.lineTo(cx + 12 * s, top);
  ctx.bezierCurveTo(cx + 26 * s, gY - hgt * 0.7, cx + 52 * s, gY - hgt * 0.35, cx + 42 * s, gY + 4 * s);
  ctx.closePath();
  ctx.fill();
  // galhos
  const r = rng(o.seed ?? 77);
  branchStroke(r, cx - 6 * s, top + 8 * s, -Math.PI / 2 - 0.45, 58 * s, 10 * s, 5, 0, null);
  branchStroke(r, cx + 6 * s, top + 8 * s, -Math.PI / 2 + 0.45, 56 * s, 9 * s, 5, 0, null);
  branchStroke(r, cx, top + 12 * s, -Math.PI / 2, 40 * s, 8 * s, 4, 0, null);
  branchStroke(r, cx - 24 * s, gY - hgt * 0.62, -Math.PI + 0.55, 50 * s, 8 * s, 4, 0, null);
  branchStroke(r, cx + 25 * s, gY - hgt * 0.56, -0.55, 50 * s, 8 * s, 4, 0, null);
}

// ------------------------------------------------------------
// CENAS
// ------------------------------------------------------------

const SCENES = {

  title: {
    duration: 2.5,
    auto: true,
    text: '',
    draw(t) {
      // fundo preto
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      // fade-in/out do título
      const a = Math.min(
        ease(t / 0.5),
        1 - ease((t - 2.0) / 0.5)
      );
      ctx.globalAlpha = clamp01(a);
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText('A ÁRVORE MÃE', CANVAS_W / 2 + 2, CANVAS_H / 2 + 2);
      ctx.fillStyle = '#feca57';
      ctx.fillText('A ÁRVORE MÃE', CANVAS_W / 2, CANVAS_H / 2);
      // subtítulo menor
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = '#c9a24d';
      ctx.fillText('— Guardiã dos Campos —', CANVAS_W / 2, CANVAS_H / 2 + 30);
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
    },
  },

  approach: {
    duration: SCENE_DUR,
    text: 'Os pássaros se calaram faz tempo. A trilha segue rumo ao Coração dos Campos — e a floresta já não parece disposta a deixar você voltar.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.5;
      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#0b171a');
      sky.addColorStop(0.7, '#1d3a33');
      sky.addColorStop(1, '#3b5a40');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, hz + 2);

      const glow = ctx.createRadialGradient(W / 2, hz, 0, W / 2, hz, 280);
      glow.addColorStop(0, 'rgba(200,235,170,0.55)');
      glow.addColorStop(1, 'rgba(120,180,110,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      const gnd = ctx.createLinearGradient(0, hz, 0, H);
      gnd.addColorStop(0, '#1d2e16');
      gnd.addColorStop(1, '#070d07');
      ctx.fillStyle = gnd;
      ctx.fillRect(0, hz, W, H - hz);

      const tg = ctx.createLinearGradient(0, hz, 0, H);
      tg.addColorStop(0, '#5a4c33');
      tg.addColorStop(1, '#1f1810');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 36, hz);
      ctx.lineTo(W / 2 + 36, hz);
      ctx.lineTo(W / 2 + W * 0.46, H);
      ctx.lineTo(W / 2 - W * 0.46, H);
      ctx.closePath();
      ctx.fill();

      const N = 8;
      const list = [];
      for (const side of [-1, 1]) {
        for (let i = 0; i < N; i++) {
          const z = ((i / N) + (side > 0 ? 0.5 / N : 0) + t * 0.05) % 1;
          list.push({ z, side, i });
        }
      }
      list.sort((a, b) => a.z - b.z);
      for (const L of list) {
        const z = L.z;
        const sc = (0.18 + 3.2 * Math.pow(z, 1.6)) * 1.4;
        const by = hz + (H * 1.08 - hz) * Math.pow(z, 1.3);
        const x = W / 2 + L.side * (46 + W * 0.62 * Math.pow(z, 1.2));
        ctx.globalAlpha = clamp01(z / 0.12);
        const col = lerpColor([26, 50, 36], [3, 6, 4], z);
        drawTreeSilhouette(x, by, sc, col, Math.sin(t * 0.8 + L.i) * 2 * sc, L.i + (L.side > 0 ? 40 : 0));
        ctx.globalAlpha = 1;
      }

      fog(t, hz + 6, 70, '150,190,150', 0.16, 7, 5);

      const close = ease(t / SCENE_DUR);
      const r = rng(21);
      ctx.strokeStyle = '#020402';
      ctx.lineCap = 'round';
      branchStroke(r, -20, H * 0.06, 0.12 + close * 0.1, lerp(70, 150, close), 16, 5, t);
      branchStroke(r, W + 20, H * 0.1, Math.PI - 0.12 - close * 0.1, lerp(70, 150, close), 16, 5, t);
      branchStroke(r, -20, H * 0.32, 0.05 + close * 0.08, lerp(40, 100, close), 12, 4, t);
      branchStroke(r, W + 20, H * 0.34, Math.PI - 0.05 - close * 0.08, lerp(40, 100, close), 12, 4, t);

      motes(t, 26, '190,230,120', { seed: 3, size: 2, rise: -4, sway: 18, y0: hz * 0.6, y1: H });

      const eyeA = ease((t - 6) / 1.2) * (1 - ease((t - 8.4) / 0.9));
      if (eyeA > 0) {
        const blink = (t % 3.1) < 0.12 ? 0 : 1;
        ctx.fillStyle = `rgba(255,150,40,${0.9 * eyeA * blink})`;
        ctx.fillRect(W * 0.58 - 9, hz - 22, 3, 3);
        ctx.fillRect(W * 0.58 + 6, hz - 22, 3, 3);
        ctx.fillStyle = `rgba(255,150,40,${0.15 * eyeA * blink})`;
        ctx.fillRect(W * 0.58 - 14, hz - 27, 28, 13);
      }

      vignette(0.85);
    },
  },

  // ==========================================================
  // CLEARING — corrigido: a árvore fica ancorada no chão
  // ==========================================================
  clearing: {
    duration: SCENE_DUR,
    text: 'Entre os troncos, uma clareira. Não há vento algum... e ainda assim cada folha se move, como se respirasse.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.58;
      const z = 1 + ease(t / SCENE_DUR) * 0.14;

      ctx.save();
      camera(z, W / 2, hz, 0, t);

      // Céu
      const sky = ctx.createLinearGradient(0, 0, 0, hz);
      sky.addColorStop(0, '#25362f');
      sky.addColorStop(0.6, '#6a7a48');
      sky.addColorStop(1, '#b9a85a');
      ctx.fillStyle = sky;
      ctx.fillRect(-60, -60, W + 120, hz + 62);

      // Chão (antes das árvores — assim elas ancoram)
      const gnd = ctx.createLinearGradient(0, hz, 0, H);
      gnd.addColorStop(0, '#34501e');
      gnd.addColorStop(1, '#0d1a0a');
      ctx.fillStyle = gnd;
      ctx.fillRect(-60, hz, W + 120, H - hz + 60);

      // Raios de luz
      ctx.save();
      for (let i = 0; i < 5; i++) {
        const x0 = W * (0.15 + i * 0.17) + Math.sin(t * 0.3 + i) * 12;
        const g = ctx.createLinearGradient(x0, 0, x0 + 90, hz);
        g.addColorStop(0, 'rgba(255,240,170,0.22)');
        g.addColorStop(1, 'rgba(255,240,170,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0 + 34, 0);
        ctx.lineTo(x0 + 150, hz);
        ctx.lineTo(x0 + 40, hz);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Respiração verde
      const breath = 0.5 + 0.5 * Math.sin(t * 1.1);
      const bg = ctx.createRadialGradient(W / 2, hz - 30, 10, W / 2, hz - 30, 240);
      bg.addColorStop(0, `rgba(190,240,160,${0.25 + breath * 0.3})`);
      bg.addColorStop(1, 'rgba(120,200,110,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ---- 1. Silhuetas escuras ao redor ----
      // PULA o índice 4 (o do meio), que ficaria exatamente atrás
      // da Árvore Mãe — a copa dela e a silhueta brigariam por
      // espaço visual.
      const TOTAL = 9;
      const MID = Math.floor(TOTAL / 2);
      for (let i = 0; i < TOTAL; i++) {
        if (i === MID) continue;
        const x = -30 + i * (W + 60) / (TOTAL - 1);
        const far = i % 2;
        drawTreeSilhouette(
          x, hz + 22 + far * 6, 1.6 - far * 0.3,
          far ? '#0b1a0c' : '#06100a',
          Math.sin(t * 0.7 + i) * 1.5, i + 100
        );
      }

      // ---- 2. Árvore Mãe (ancorada no chão) ----
      const mx = W / 2;
      const mb = hz + 4;
      gnarledTree(mx, mb, 0.5, {
        trunk: '#2a1a12', trunkDark: '#1a0f08', trunkHi: '#4a2a1a',
        bark: '#100804', branch: '#24160e', root: '#1d110b',
        leafDark: '#1b3a1b', leafMid: '#2a5a2a', leafLight: '#335a2a', leafHi: '#4a7a3a',
      }, t, { seed: 5, depth: 4, sway: 1 });

      // ---- 3. Arbustos e flores ESPALHADOS pela clareira ----
      // Antes ficavam só perto da base. Agora cobrem a faixa de chão
      // inteira (de baixo da árvore até o primeiro plano), com
      // densidade maior perto da base e menor nas bordas.
      const shrubRng = rng(1337);
      const shrubs = [];
      // Gera ~30 arbustos em toda a faixa do chão. Distribuição
      // enviesada pra perto da base (mais denso no centro), mas
      // com alguns "satélites" nas laterais.
      for (let i = 0; i < 30; i++) {
        // Quanto mais longe do centro, menos chance de cair ali
        const side = shrubRng() < 0.5 ? -1 : 1;
        const dist = 30 + Math.pow(shrubRng(), 1.6) * 200;
        const bx = mx + side * dist;
        // Y varia do "chão da árvore" (mb + 6) até o "chão do player"
        // (H - 20), pra dar profundidade.
        const by = mb + 6 + shrubRng() * (H - mb - 26);
        shrubs.push({ bx, by, i });
      }
      // Ordena por Y (mais distante primeiro, pra oclusão correta)
      shrubs.sort((a, b) => a.by - b.by);

      for (const { bx, by, i } of shrubs) {
        // Sombra do arbusto
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(bx, by + 4, 10 + shrubRng() * 8, 2 + shrubRng() * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo do arbusto (3 círculos, 2 tons — igual antes)
        const rad = 6 + shrubRng() * 8;
        ctx.fillStyle = '#1f3a1a';
        ctx.beginPath();
        ctx.arc(bx - rad * 0.6, by, rad * 0.8, 0, Math.PI * 2);
        ctx.arc(bx + rad * 0.6, by, rad * 0.8, 0, Math.PI * 2);
        ctx.arc(bx, by - rad * 0.5, rad, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = '#2f5a24';
        ctx.beginPath();
        ctx.arc(bx - rad * 0.35, by - rad * 0.55, rad * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Flores ocasionais
        if (shrubRng() < 0.5) {
          const flowerRng = rng(2000 + i);
          const petals = 4 + Math.floor(flowerRng() * 3);
          const flowerColor = flowerRng() < 0.5 ? '#e8c44a' : '#d88a5a';
          for (let p = 0; p < petals; p++) {
            const ang = (p / petals) * Math.PI * 2;
            const fx = bx + Math.cos(ang) * 3;
            const fy = by - rad * 0.5 + Math.sin(ang) * 3;
            ctx.fillStyle = flowerColor;
            ctx.fillRect(fx - 1, fy - 1, 2, 2);
          }
          ctx.fillStyle = '#fef0a0';
          ctx.fillRect(bx - 1, by - rad * 0.5 - 1, 2, 2);
        }
      }

      // ---- 4. "Saia" de grama em volta das raízes (fica POR BAIXO
      //         dos arbustos, no chão da árvore) ----
      ctx.fillStyle = '#1d3a1d';
      ctx.beginPath();
      ctx.ellipse(mx, mb + 4, 56, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Grama alta ESPALHADA pela clareira (não só na base).
      // Distribuição uniforme horizontal + variação de Y.
      ctx.strokeStyle = '#2a4a1a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const grassRng = rng(4242);
      for (let i = 0; i < 90; i++) {
        const gx = 20 + grassRng() * (W - 40);
        // Y: 60% perto da árvore (mb+6 .. mb+40), 40% mais
        // espalhado pelo resto da clareira.
        const nearTree = grassRng() < 0.6;
        const gy = nearTree
          ? mb + 6 + grassRng() * 34
          : mb + 40 + grassRng() * (H - mb - 50);
        const gh = 6 + grassRng() * 14;
        const sway = Math.sin(t * 1.5 + i * 0.7) * 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.quadraticCurveTo(
          gx + sway * 0.5, gy - gh * 0.6,
          gx + sway, gy - gh
        );
        ctx.stroke();
      }

      // ---- 5. Névoa suave (integra a árvore ao resto) ----
      fog(t, hz + 12, 40, '210,230,170', 0.12, 5, 4);

      // ---- 6. Capim em primeiro plano ----
      ctx.strokeStyle = '#08130a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const gr = rng(77);
      for (let i = 0; i < 46; i++) {
        const gx = gr() * W;
        const gh = 26 + gr() * 44;
        const sw = Math.sin(t * 1.2 + i * 0.7) * 6;
        ctx.beginPath();
        ctx.moveTo(gx, H + 6);
        ctx.quadraticCurveTo(gx + sw * 0.4, H - gh * 0.6, gx + sw, H - gh);
        ctx.stroke();
      }
      ctx.restore();

      motes(t, 30, '240,235,150', { seed: 9, size: 2, rise: -6, sway: 20, y0: 0, y1: H });
      vignette(0.6);
    },
  },

  mother_tree: {
    duration: SCENE_DUR,
    text: 'A Árvore Mãe. A Fratura a fez Guardiã dos Campos: ela segura o Núcleo, um pedaço da torre de antes do mundo se partir. Enquanto ela vive, a terra ao redor permanece de pé.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.86;
      const z = 1 + ease(t / SCENE_DUR) * 0.22;

      ctx.save();
      camera(z, W / 2, H * 0.5, 0, t);

      const sky = ctx.createLinearGradient(0, 0, 0, gY);
      sky.addColorStop(0, '#1b2a3a');
      sky.addColorStop(0.55, '#7a4a3a');
      sky.addColorStop(1, '#e0903c');
      ctx.fillStyle = sky;
      ctx.fillRect(-80, -80, W + 160, gY + 80);

      const sg = ctx.createRadialGradient(W / 2, H * 0.46, 10, W / 2, H * 0.46, 330);
      sg.addColorStop(0, 'rgba(255,225,160,0.95)');
      sg.addColorStop(0.35, 'rgba(255,160,70,0.45)');
      sg.addColorStop(1, 'rgba(200,90,30,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-80, -80, W + 160, H + 160);

      // Silhuetas de fundo (antes da árvore pra ela ancorar por cima)
      for (let i = 0; i < 10; i++) {
        drawTreeSilhouette(-20 + i * (W + 40) / 9, gY - 4, 1.5 + (i % 3) * 0.2, '#20180f', 0, i + 300);
      }

      const gnd = ctx.createLinearGradient(0, gY - 10, 0, H);
      gnd.addColorStop(0, '#2c2412');
      gnd.addColorStop(1, '#0a0804');
      ctx.fillStyle = gnd;
      ctx.fillRect(-80, gY - 8, W + 160, H - gY + 90);

      gnarledTree(W / 2, gY + 6, 1.05, {
        trunk: '#2a1a10', trunkDark: '#1a0f08', trunkHi: '#4a2a1a',
        bark: '#0c0603', branch: '#1e140c', root: '#1a0f0a',
        leafDark: '#142410', leafMid: '#22401c', leafLight: '#33501c', leafHi: '#4a6a24',
      }, t, { seed: 11, depth: 5, sway: 3 });

      drawWanderer(W * 0.2, gY + 22, 1.3, '#050302');

      fog(t, gY - 4, 46, '255,200,140', 0.2, 8, 6);
      ctx.restore();

      motes(t, 14, '255,190,90', { seed: 4, size: 3, rise: 18, sway: 24 });
      if (t > 3) motes(t, 8, '255,210,120', { seed: 12, size: 3, rise: -22, sway: 10, alpha: ease((t - 3) / 2) });

      vignette(0.65);
    },
  },

  awakening: {
    duration: SCENE_DUR,
    text: 'Ela não ataca primeiro. Mas a casca se abre, devagar, e dois olhos antigos se fixam em você — o Andarilho que a Fratura não consegue desfazer.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.86;
      // clamp01: o tremor sobe até 2.4 e PARA — antes crescia sem limite
      // quando o tempo passou a correr depois do `duration`.
      const shake = clamp01((t - 5.5) / 4.5) * 2.4;
      const z = 1 + ease(t / SCENE_DUR) * 0.16;

      ctx.save();
      camera(z, W / 2, H * 0.55, shake, t);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#05060d');
      sky.addColorStop(0.6, '#10131f');
      sky.addColorStop(1, '#1d1210');
      ctx.fillStyle = sky;
      ctx.fillRect(-80, -80, W + 160, H + 160);

      const mx = W * 0.82, my = H * 0.2;
      const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 100);
      mg.addColorStop(0, 'rgba(220,225,215,0.65)');
      mg.addColorStop(1, 'rgba(120,130,130,0)');
      ctx.fillStyle = mg;
      ctx.fillRect(mx - 120, my - 120, 240, 240);
      ctx.fillStyle = '#dfe3d3';
      ctx.beginPath();
      ctx.arc(mx, my, 24, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 10; i++) {
        drawTreeSilhouette(-20 + i * (W + 40) / 9, gY - 4, 1.5 + (i % 3) * 0.2, '#04060a', 0, i + 300);
      }
      ctx.fillStyle = '#0b0a08';
      ctx.fillRect(-80, gY - 8, W + 160, H - gY + 90);

      const info = gnarledTree(W / 2, gY + 6, 1.05, {
        trunk: '#1a0f0b', trunkDark: '#0c0603', trunkHi: '#2a1810',
        bark: '#050201', branch: '#120a08', root: '#0d0605',
        leafDark: '#080c08', leafMid: '#101a10', leafLight: '#101a10', leafHi: '#182818',
      }, t, { seed: 11, depth: 5, sway: 4 + Math.min(t, SCENE_DUR) * 0.4, leafAlpha: 1 - ease((t - 5) / 4) * 0.35 });

      // Rachaduras brilhantes no tronco
      const crack = ease((t - 4) / 3);
      if (crack > 0) {
        ctx.strokeStyle = `rgba(255,120,30,${0.8 * crack})`;
        ctx.lineWidth = 2;
        const cr = rng(31);
        for (let i = 0; i < 5; i++) {
          let x = W / 2 + (cr() - 0.5) * 36;
          let y = info.eyeY + 20 + cr() * 80;
          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let k = 0; k < 5; k++) {
            x += (cr() - 0.5) * 14;
            y += 8 + cr() * 12;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      const open = ease((t - 1.5) / 3.5);
      treeEyes(W / 2, info.eyeY, 1.05, open, t, '255,90,25');

      fog(t, gY - 2, 50, '120,130,150', 0.2, 6, 6);

      const rg = ease((t - 4.5) / 4.5);
      if (rg > 0) risingRoots(t, 9, '#050202', rg, 8, 0.8);
      ctx.restore();

      motes(t, 16, '170,40,25', { seed: 8, size: 2, rise: -10, sway: 12, alpha: ease((t - 3) / 2) });
      vignette(0.88);
    },
  },

  confrontation: {
    duration: SCENE_DUR,
    flash: true,
    text: 'O Núcleo pulsa como um coração, e os Campos inteiros pulsam junto. Se ela cair, a terra racha um pouco mais — mas o Portal precisa dele.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.9;
      const shake = 1.2 + ease(t / SCENE_DUR) * 3.4;
      const z = 1.12 + ease(t / SCENE_DUR) * 0.2;
      const beat = Math.pow(Math.max(0, Math.sin(t * 4.2)), 3);

      ctx.save();
      camera(z, W / 2, H * 0.55, shake, t);

      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#160404');
      sky.addColorStop(0.5, '#3c0a08');
      sky.addColorStop(1, '#6a1e0a');
      ctx.fillStyle = sky;
      ctx.fillRect(-80, -80, W + 160, H + 160);

      const cx = W / 2;
      const info0 = { chestY: gY - 118 * 1.35 };
      const pg = ctx.createRadialGradient(cx, info0.chestY, 10, cx, info0.chestY, 380);
      pg.addColorStop(0, `rgba(255,200,90,${0.25 + beat * 0.3})`);
      pg.addColorStop(1, 'rgba(255,90,20,0)');
      ctx.fillStyle = pg;
      ctx.fillRect(-80, -80, W + 160, H + 160);

      ctx.fillStyle = '#0a0302';
      ctx.fillRect(-80, gY - 6, W + 160, H - gY + 90);

      const info = gnarledTree(cx, gY + 6, 1.35, {
        trunk: '#2a0707', trunkDark: '#120303', trunkHi: '#5a0a0a',
        bark: '#080101', branch: '#1c0505', root: '#120303',
        leafDark: '#2a0606', leafMid: '#3a0a0a', leafLight: '#531010', leafHi: '#7a1e1e',
      }, t, { seed: 11, depth: 5, sway: 6, leafAlpha: 0.95 });

      const cy = info.chestY;
      const open = ease(t / 2.5);
      ctx.fillStyle = '#060101';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 46 * open);
      ctx.quadraticCurveTo(cx + 24, cy, cx, cy + 46 * open);
      ctx.quadraticCurveTo(cx - 24, cy, cx, cy - 46 * open);
      ctx.fill();

      const pulse = 0.8 + beat * 0.45;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80 * pulse);
      cg.addColorStop(0, `rgba(255,245,190,${0.95 * open})`);
      cg.addColorStop(0.3, `rgba(255,200,80,${0.75 * open})`);
      cg.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = cg;
      ctx.fillRect(cx - 90, cy - 90, 180, 180);
      ctx.fillStyle = '#feca57';
      ctx.beginPath();
      ctx.arc(cx, cy, 15 * pulse * open, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff7cf';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 6 * pulse * open, 0, Math.PI * 2);
      ctx.fill();

      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.9 + k / 3) % 1);
        ctx.strokeStyle = `rgba(255,190,90,${(1 - ph) * 0.35})`;
        ctx.lineWidth = 3 * (1 - ph) + 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 30 + ph * 260, 0, Math.PI * 2);
        ctx.stroke();
      }

      treeEyes(cx, info.eyeY, 1.35, 1, t, '255,90,25');

      risingRoots(t, 11, '#050101', 1.25, 10, 1.6);
      ctx.restore();

      motes(t, 34, '255,140,50', { seed: 15, size: 3, rise: -34, sway: 22 });
      motes(t, 18, '255,220,120', { seed: 16, size: 2, rise: -48, sway: 12 });

      ctx.fillStyle = `rgba(255,40,20,${beat * 0.12})`;
      ctx.fillRect(0, 0, W, H);

      const fl = ease((t - 8.6) / 0.5) * (1 - ease((t - 9.3) / 0.6));
      if (fl > 0) {
        ctx.fillStyle = `rgba(255,235,170,${fl * 0.75})`;
        ctx.fillRect(0, 0, W, H);
      }

      vignette(0.85);
    },
  },

  // ============================================================
  // PÓS-ÁRVORE MÃE — cutscene de encerramento do primeiro boss
  // ============================================================
  // Regras do motor (versão atual):
  //   - `t = cs.timer` NÃO tem teto. A cena continua viva
  //     indefinidamente enquanto o jogador lê / observa.
  //   - Animações de PROGRESSO usam ease()/clamp01() e param
  //     sozinhas em 1. Animações AMBIENTE (sin, módulo, motes,
  //     fog, pulsos) seguem em loop natural.
  //   - `duration` só serve pro `title` auto-avançar. Pra slides
  //     manuais, é referência narrativa.
  // ============================================================

  // ============================================================
  // 1. SILÊNCIO — os olhos da Árvore se apagam, cinzas caem.
  // ============================================================
  silence: {
    duration: 6,
    text: 'O Coração dos Campos fica em silêncio.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.77, cx = W / 2;
      const dim = 1 - ease(t / 2.4);                       // a luz se apaga

      ctx.save();
      camera(1 + ease(t / 10) * 0.05, cx, gY - 130, 0, t); // aproximação lenta

      vGrad(0, gY, [[0, '#05070b'], [0.5, '#0f171d'], [1, '#222d2a']]);
      starField(t, 80, 12, gY * 0.55, 0.7);

      // lua + nuvens finas
      const mx = W * 0.76, my = gY * 0.3;
      additive(() => glow(mx, my, 160, '150,175,205', 0.24));
      ctx.fillStyle = 'rgba(208,220,232,0.92)';
      ctx.beginPath(); ctx.arc(mx, my, 17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(120,140,160,0.35)';
      ctx.beginPath(); ctx.arc(mx - 5, my - 3, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + 6, my + 5, 3, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const x = ((i * 330 + t * 4) % (W + 400)) - 200;
        ctx.fillStyle = 'rgba(12,20,28,0.55)';
        ctx.beginPath();
        ctx.ellipse(x, my + (i - 1) * 24, 150, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      hills(gY - 44, 22, '#0b1213', 3, t * 1.5);
      hills(gY - 20, 16, '#080d0c', 8, -t * 2);
      forestRow(gY - 6, 1.15, '#070b09', 300, 11, t, null);
      ctx.fillStyle = '#0a0e0b';
      ctx.fillRect(-80, gY, W + 160, H - gY + 80);
      fog(t, gY - 6, 38, '110,125,120', 0.17, 4, 6);

      // brasa nas rachaduras do chão (esfria)
      if (dim > 0) {
        additive(() => {
          const cr = rng(99);
          ctx.lineWidth = 1.5;
          for (let i = 0; i < 7; i++) {
            const dir = i < 4 ? -1 : 1;
            let x = cx + dir * (30 + cr() * 20), y = gY + 6 + cr() * 6;
            ctx.strokeStyle = `rgba(255,110,40,${0.55 * dim})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            for (let k = 0; k < 4; k++) {
              x += dir * (14 + cr() * 22);
              y += 2 + cr() * 5;
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        });
      }

      // A Árvore morta (com luz de contorno da lua)
      bareTree(cx + 2.5, gY - 1.5, 0.8, t, { color: 'rgba(130,160,190,0.28)', seed: 77 });
      bareTree(cx, gY, 0.8, t, { color: '#0b0705', seed: 77 });

      // olhos apagando
      treeEyes(cx, gY - 120, 0.6, dim, t, '255,90,25');

      // brasas subindo da copa + cinzas caindo
      motes(t, 18, '255,140,50', {
        seed: 44, size: 2, rise: -20, sway: 8, y0: gY - 340, y1: gY - 60,
        alpha: 0.9 * clamp01(1 - (t - 2.5) / 3),
      });
      motes(t, 34, '150,150,145', { seed: 41, size: 1, rise: 9, sway: 10, alpha: 0.55 });

      grassBlades(t, gY + 6, H + 20, 100, 11, '16,26,19', 20, 0.6);
      ctx.restore();

      vignette(0.9);
    },
  },

  // ============================================================
  // 2. ONDA — a floresta inteira sente; pássaros fogem.
  // ============================================================
  recoil: {
    duration: 7,
    text: 'Toda a floresta sente. Um anel inteiro perdeu o peso que o segurava.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.76, cx = W / 2;
      const sx = cx, sy = gY - 6;

      vGrad(0, gY, [[0, '#2a2238'], [0.45, '#7a4a40'], [0.8, '#d89a58'], [1, '#f2c27a']]);
      additive(() => { glow(sx, sy, 400, '255,185,105', 0.55); glow(sx, sy, 110, '255,240,200', 0.75); });
      godRays(t, sx, sy, '255,215,150', 9, 0.09, 2.3, 620, -Math.PI / 2);

      // onda: viaja a partir do centro
      const front = ease(t / 5.5) * W * 0.62;
      const bend = (x) => {
        const d = Math.abs(x - cx), sgn = x < cx ? -1 : 1;
        const bump = Math.exp(-Math.pow((d - front) / 80, 2));
        const passed = ease((front - d) / 160);
        return sgn * (bump * 16 + passed * 4);
      };

      hills(gY - 52, 30, '#8a5a4a', 21, t * 0.8);
      forestRow(gY - 14, 0.9, '#4b2c2b', 400, 14, t, bend);
      fog(t, gY - 4, 46, '240,190,120', 0.22, 4, 6);

      const gnd = ctx.createLinearGradient(0, gY, 0, H);
      gnd.addColorStop(0, '#3d2817');
      gnd.addColorStop(1, '#110a06');
      ctx.fillStyle = gnd;
      ctx.fillRect(-80, gY, W + 160, H - gY + 80);

      // a Árvore morta, pequena, no centro
      bareTree(cx, gY + 4, 0.5, t, { color: '#150c08', seed: 77 });
      forestRow(gY + 6, 1.3, '#26150f', 500, 10, t, bend);

      // rachaduras douradas se espalhando pelo chão
      additive(() => {
        const cr = rng(31);
        const grow = ease((t - 0.3) / 3);
        const pulse = 0.55 + 0.25 * Math.sin(t * 1.6);
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 11; i++) {
          const dir = (i % 2 ? 1 : -1);
          const maxLen = (70 + cr() * W * 0.34) * grow;
          let x = cx, y = gY + 16, used = 0;
          ctx.strokeStyle = `rgba(255,205,120,${pulse * (1 - i * 0.04)})`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          while (used < maxLen) {
            const step = 12 + cr() * 18;
            x += dir * step;
            y += (cr() - 0.3) * 4 + 0.6;
            used += step;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        // anel de luz na frente da onda
        const al = (1 - front / (W * 0.62)) * 0.75;
        if (front > 4 && al > 0) {
          ctx.strokeStyle = `rgba(255,225,150,${al})`;
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(cx, gY + 16, front * 1.05, front * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = `rgba(255,190,100,${al * 0.5})`;
          ctx.lineWidth = 8;
          ctx.beginPath(); ctx.ellipse(cx, gY + 16, front * 0.96, front * 0.09, 0, 0, Math.PI * 2); ctx.stroke();
        }
        // pilar de luz no instante da queda
        const pil = 1 - ease(t / 1.3);
        if (pil > 0) {
          const g = ctx.createLinearGradient(0, 0, 0, gY);
          g.addColorStop(0, 'rgba(255,230,170,0)');
          g.addColorStop(1, `rgba(255,230,170,${0.6 * pil})`);
          ctx.fillStyle = g;
          ctx.fillRect(cx - 5 - pil * 14, 0, 10 + pil * 28, gY + 16);
        }
      });

      // pássaros fugindo
      const br = rng(17);
      for (let i = 0; i < 11; i++) {
        const x0 = cx + (br() - 0.5) * W * 0.55;
        const dx = (x0 < cx ? -1 : 1) * (0.5 + br() * 0.7);
        const p = Math.max(0, t - (0.5 + i * 0.1)) / 4.5;
        if (p <= 0) continue;
        const x = x0 + dx * p * 260;
        const y = gY - 28 - p * (150 + br() * 120) + Math.sin(p * 9 + i) * 6;
        bird(x, y, 0.8 + br() * 0.6, t * 13 + i * 2, 'rgba(24,12,10,0.85)');
      }

      // folhas sopradas pra longe do centro
      const fr = rng(55);
      for (let i = 0; i < 44; i++) {
        const bx = cx + (fr() - 0.5) * W * 0.9;
        const dir = bx < cx ? -1 : 1;
        const x = bx + dir * ease(t / 5) * (40 + fr() * 140) + Math.sin(t + i) * 4;
        const y = ((fr() * gY * 0.9 + t * (14 + fr() * 22)) % gY);
        ctx.fillStyle = `rgba(${150 + fr() * 70},${100 + fr() * 50},${50 + fr() * 30},${0.75 - (y / gY) * 0.4})`;
        ctx.fillRect(x, y, 2, 2 + fr() * 2);
      }
      motes(t, 30, '255,215,140', { seed: 61, size: 2, rise: -16, sway: 16, y0: gY - 260, y1: gY + 10, alpha: 0.8 });

      vignette(0.55);
    },
  },

  // ============================================================
  // 3. NÚCLEO — o cristal dourado nas mãos; 1 dos 8 acesos.
  // ============================================================
  nucleus: {
    duration: 6,
    text: 'O Núcleo pulsa. Ainda quente. É a primeira vez que você segura um pedaço do que o mundo era antes.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, vb = H - LB_BOT, cx = W / 2;
      const cy = (LB_TOP + vb) / 2 - 12;
      const beat = Math.pow(Math.max(0, Math.sin(t * 3.0)), 3);
      const fadeIn = ease(t / 1.6);

      // contraluz quente
      const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.72);
      bg.addColorStop(0, '#3a1e0a');
      bg.addColorStop(0.35, '#140b05');
      bg.addColorStop(1, '#030201');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      motes(t, 40, '255,200,110', { seed: 71, size: 2, rise: -10, sway: 22, alpha: 0.7 });

      // anel de 8 marcas = os 8 Núcleos (só o primeiro aceso)
      const RR = 126 + beat * 3;
      ctx.strokeStyle = 'rgba(255,200,120,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, RR, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4;
        const px = cx + Math.cos(a) * RR, py = cy + Math.sin(a) * RR;
        if (i === 0) {
          additive(() => glow(px, py, 26, '255,210,120', 0.8 * fadeIn));
          ctx.fillStyle = `rgba(255,236,170,${fadeIn})`;
          ctx.beginPath();
          ctx.moveTo(px, py - 6); ctx.lineTo(px + 5, py); ctx.lineTo(px, py + 6); ctx.lineTo(px - 5, py);
          ctx.closePath(); ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(255,200,120,0.28)';
          ctx.beginPath(); ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // vulto encapuzado olhando o Núcleo + ombros
      const shoulder = () => {
        ctx.beginPath();
        ctx.moveTo(cx - 250, vb + 30);
        ctx.bezierCurveTo(cx - 240, cy - 40, cx - 130, cy - 70, cx - 62, cy - 84);
        ctx.lineTo(cx + 62, cy - 84);
        ctx.bezierCurveTo(cx + 130, cy - 70, cx + 240, cy - 40, cx + 250, vb + 30);
        ctx.closePath();
      };
      ctx.fillStyle = '#0a0604';
      shoulder(); ctx.fill();
      // capuz
      ctx.fillStyle = '#0c0705';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 128, 74, 82, 0, 0, Math.PI * 2);
      ctx.fill();
      // rosto na sombra, iluminado por baixo
      const fg = ctx.createLinearGradient(0, cy - 150, 0, cy - 70);
      fg.addColorStop(0, '#050302');
      fg.addColorStop(1, '#4a2c18');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 112, 36, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      // olhos baixos (duas linhas de luz)
      additive(() => {
        ctx.strokeStyle = 'rgba(255,215,140,0.55)';
        ctx.lineWidth = 1.4;
        for (const sd of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(cx + sd * 8, cy - 112);
          ctx.quadraticCurveTo(cx + sd * 15, cy - 109, cx + sd * 22, cy - 112);
          ctx.stroke();
        }
      });
      // luz de baixo nos ombros e capuz
      ctx.save();
      shoulder(); ctx.clip();
      glow(cx, cy, 230, '255,170,80', 0.45 + beat * 0.15);
      ctx.restore();
      ctx.strokeStyle = `rgba(255,200,120,${0.25 + beat * 0.15})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - 128, 74, 82, 0, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();

      // mãos em concha
      const bowl = () => {
        ctx.beginPath();
        ctx.moveTo(cx - 112, cy + 44);
        ctx.bezierCurveTo(cx - 122, cy + 112, cx - 62, cy + 140, cx, cy + 140);
        ctx.bezierCurveTo(cx + 62, cy + 140, cx + 122, cy + 112, cx + 112, cy + 44);
        ctx.bezierCurveTo(cx + 70, cy + 86, cx - 70, cy + 86, cx - 112, cy + 44);
        ctx.closePath();
      };
      ctx.fillStyle = '#0e0806';
      bowl(); ctx.fill();
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const fx = cx + sd * (104 - i * 13), fy = cy + 50 - i * 5 + (i > 1 ? 4 : 0);
          ctx.fillStyle = '#0e0806';
          ctx.beginPath();
          ctx.ellipse(fx, fy, 7.5, 21 - i * 1.5, sd * (0.55 - i * 0.07), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = `rgba(255,205,130,${0.22 + beat * 0.15})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(fx, fy, 7.5, 21 - i * 1.5, sd * (0.55 - i * 0.07), Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
      }
      ctx.save();
      bowl(); ctx.clip();
      glow(cx, cy + 20, 190, '255,170,80', 0.55 + beat * 0.2);
      ctx.restore();

      // anéis orbitais + faíscas
      for (let i = 0; i < 2; i++) {
        const dir = i ? -1 : 1;
        const rot = i * 0.9 + t * 0.25 * dir;
        const rx = 64 + i * 16, ry = 18 + i * 7;
        ctx.strokeStyle = `rgba(255,220,140,${0.28 + 0.1 * i})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); ctx.stroke();
        const a = t * 1.3 * dir + i * 3;
        const ox = Math.cos(a) * rx, oy = Math.sin(a) * ry;
        const px = cx + ox * Math.cos(rot) - oy * Math.sin(rot);
        const py = cy + ox * Math.sin(rot) + oy * Math.cos(rot);
        additive(() => glow(px, py, 10, '255,235,170', 0.9));
      }

      // onda de batimento
      const ph = (t * 0.95) % 1;
      ctx.strokeStyle = `rgba(255,210,130,${(1 - ph) * 0.28})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 38 + ph * 190, 0, Math.PI * 2); ctx.stroke();

      // o Núcleo
      additive(() => glow(cx, cy, 110 + beat * 24, '255,200,100', 0.5 + beat * 0.2));
      coreGem(cx, cy, 30, t, 0.95 + beat * 0.25);
      additive(() => {
        ctx.strokeStyle = `rgba(255,240,190,${0.35 + beat * 0.3})`;
        ctx.lineWidth = 1.2;
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          ctx.beginPath();
          ctx.moveTo(cx - dx * (70 + beat * 18), cy - dy * (70 + beat * 18));
          ctx.lineTo(cx + dx * (70 + beat * 18), cy + dy * (70 + beat * 18));
          ctx.stroke();
        }
      });
      motes(t, 20, '255,225,150', { seed: 72, size: 2, rise: -32, sway: 10, y0: cy - 130, y1: cy + 60, alpha: 0.85 });

      vignette(0.78);
    },
  },

  // ============================================================
  // 4. MUDA — a Semente nasce do toco e voa até a mão.
  // ============================================================
  seed: {
    duration: 7,
    text: 'A Árvore caiu. Mas algo brota no lugar. E a Semente — pequena, quente — desliza pra sua mão. Você a leva com você.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, gY = H * 0.68, cx = W / 2, vb = H - LB_BOT;

      vGrad(0, H, [[0, '#0b1712'], [0.45, '#1c3425'], [0.75, '#34502e'], [1, '#10180d']]);
      godRays(t, cx + 40, -40, '190,240,150', 8, 0.13 * ease(t / 2.5), 0.9, 780);

      // troncos distantes
      for (let i = 0; i < 8; i++) {
        const x = 20 + i * (W - 40) / 7 + ((i * 29) % 17);
        const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
        g.addColorStop(0, 'rgba(5,10,7,0.2)');
        g.addColorStop(0.5, 'rgba(5,10,7,0.6)');
        g.addColorStop(1, 'rgba(5,10,7,0.2)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 14 - (i % 3) * 4, 0, 28 + (i % 3) * 8, gY + 10);
      }
      fog(t, gY - 6, 40, '150,210,140', 0.12, 3, 6);

      const gnd = ctx.createLinearGradient(0, gY, 0, H);
      gnd.addColorStop(0, '#2d3a1c');
      gnd.addColorStop(1, '#0c0f07');
      ctx.fillStyle = gnd;
      ctx.fillRect(0, gY, W, H - gY);
      grassBlades(t, gY + 2, gY + 50, 110, 21, '95,150,70', 12, 1);

      // toco + muda
      const st = stumpShape(cx, gY + 12, 1.6, t, { seed: 8 });
      const grow = ease((t - 0.4) / 3);
      additive(() => glow(cx, st.topY, 100 * grow, '150,255,130', 0.35 * grow));
      saplingShape(cx, st.topY - 1, grow, t, 1.25);

      // ----- a Semente -----
      const hx = W * 0.22, hy = vb - 62;
      const sx0 = cx + 30, sy0 = st.topY + 2;
      const ex = hx, ey = hy - 10;
      const mxp = (sx0 + ex) / 2, myp = Math.min(sy0, ey) - 120;
      const pos = (p) => ({
        x: (1 - p) * (1 - p) * sx0 + 2 * (1 - p) * p * mxp + p * p * ex,
        y: (1 - p) * (1 - p) * sy0 + 2 * (1 - p) * p * myp + p * p * ey,
      });
      const sp = ease((t - 2.6) / 2.6);
      const born = ease((t - 1.8) / 0.8);

      // mão (entra de baixo-esquerda)
      const hk = ease((t - 1.2) / 1.6);
      const warm = clamp01((t - 4.6) / 1.0);
      if (hk > 0) {
        ctx.save();
        ctx.globalAlpha = hk;
        ctx.translate(-(1 - hk) * 30, (1 - hk) * 30);
        reachingHand(hx, hy, t, warm);
        ctx.restore();
      }

      if (born > 0) {
        const bobY = sp <= 0 ? Math.sin(t * 3) * 2 - ease((t - 1.8) / 0.8) * 10 : 0;
        const trailA = sp < 1 ? 1 : clamp01(1 - (t - 5.2) / 0.6);
        if (sp > 0 && trailA > 0) {
          additive(() => {
            for (let k = 1; k <= 16; k++) {
              const pp = sp - k * 0.028;
              if (pp <= 0) continue;
              const q = pos(pp), f = 1 - k / 17;
              glow(q.x, q.y, 3 + 11 * f, '254,205,100', 0.5 * f * trailA);
            }
          });
        }
        const cur = sp > 0 ? pos(sp) : { x: sx0, y: sy0 };
        const sY = cur.y + bobY;
        const pulse = 0.8 + 0.2 * Math.sin(t * 4);
        additive(() => glow(cur.x, sY, 34 * pulse, '255,215,120', 0.9 * born));
        ctx.fillStyle = `rgba(254,202,87,${born})`;
        ctx.beginPath(); ctx.arc(cur.x, sY, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,247,207,${born})`;
        ctx.beginPath(); ctx.arc(cur.x - 1, sY - 1, 2, 0, Math.PI * 2); ctx.fill();

        // pulso quando pousa na palma
        if (t > 5.2) {
          const ph = ((t - 5.2) * 0.8) % 1;
          ctx.strokeStyle = `rgba(255,215,130,${(1 - ph) * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(ex, ey + 8, 10 + ph * 46, 4 + ph * 14, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }

      motes(t, 28, '190,255,150', { seed: 81, size: 2, rise: -6, sway: 22, y0: gY - 220, y1: gY + 40, alpha: 0.9 });
      motes(t, 30, '255,230,150', { seed: 82, size: 1, rise: -14, sway: 14, y0: gY - 260, y1: gY + 30, alpha: 0.7 });

      vignette(0.7);
    },
  },

  // ============================================================
  // 5. PARTIDA — o Andarilho segue pela trilha, rumo ao pôr do sol.
  // ============================================================
  walk: {
    duration: 8,
    text: 'Você leva o Núcleo. E a Semente vem com você. O mundo que você deixou aqui vai crescer — e uma parte dele vai junto.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.5, vb = H - LB_BOT;
      const sx = W * 0.66, sy = hz - 6;
      const vx = W * 0.62, vy = hz + 18, bx = W * 0.36;

      ctx.save();
      camera(1.05 - ease(t / 12) * 0.05, W / 2, hz, 0, t);

      vGrad(0, hz + 10, [[0, '#241635'], [0.35, '#7a3340'], [0.7, '#e08a4c'], [1, '#ffd08a']]);
      additive(() => { glow(sx, sy, 430, '255,170,90', 0.55); glow(sx, sy, 130, '255,230,170', 0.85); });
      ctx.fillStyle = '#fff2c9';
      ctx.beginPath(); ctx.arc(sx, sy, 32, 0, Math.PI * 2); ctx.fill();

      // nuvens (lado escuro embaixo, topo aceso pelo sol)
      for (let i = 0; i < 7; i++) {
        const x = ((i * 190 + t * 6) % (W + 320)) - 160;
        const y = hz * (0.22 + (i % 4) * 0.16);
        const w = 140 + (i % 3) * 50;
        ctx.fillStyle = 'rgba(80,35,60,0.5)';
        ctx.beginPath(); ctx.ellipse(x, y + 3, w, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,175,115,0.4)';
        ctx.beginPath(); ctx.ellipse(x + 6, y - 2, w * 0.85, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
      godRays(t, sx, sy, '255,200,130', 8, 0.1, 2.0, 650, -Math.PI / 2);

      hills(hz + 4, 26, '#7a3a3c', 31, t * 0.8);
      hills(hz + 14, 20, '#512a33', 32, 0);

      const gnd = ctx.createLinearGradient(0, vy, 0, H);
      gnd.addColorStop(0, '#4a3220');
      gnd.addColorStop(0.4, '#2a1c12');
      gnd.addColorStop(1, '#0e0a06');
      ctx.fillStyle = gnd;
      ctx.fillRect(-80, vy, W + 160, H - vy + 80);
      forestRow(hz + 24, 0.9, '#2a1621', 700, 16, t, null);
      fog(t, hz + 16, 36, '255,170,100', 0.18, 3, 7);

      // trilha em perspectiva
      const pg = ctx.createLinearGradient(0, vy, 0, H);
      pg.addColorStop(0, '#b98550');
      pg.addColorStop(1, '#5a4028');
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.moveTo(vx - 3, vy); ctx.lineTo(vx + 3, vy);
      ctx.lineTo(bx + 300, H + 20); ctx.lineTo(bx - 300, H + 20);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,190,120,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(vx + 3, vy); ctx.lineTo(bx + 300, H + 20); ctx.stroke();
      ctx.strokeStyle = 'rgba(30,16,8,0.4)';
      for (const off of [-0.3, 0.3]) {
        ctx.beginPath();
        ctx.moveTo(vx + off * 3, vy);
        ctx.lineTo(bx + off * 300, H + 20);
        ctx.stroke();
      }

      // toco + muda brilhando, ficando pra trás
      const stx = W * 0.19, sty = hz + 78;
      const st = stumpShape(stx, sty, 0.6, t, { seed: 8, h: 40 });
      additive(() => glow(stx, st.topY - 14, 80, '150,255,130', 0.3));
      saplingShape(stx, st.topY - 1, 1, t, 0.65);

      // o Andarilho andando pela trilha
      const u = ease(t / 13) * 0.62;
      const wy = lerp(vb - 16, hz + 70, u);
      const wx = vx + (bx - vx) * ((wy - vy) / (H - vy));
      wandererBack(wx, wy, lerp(1.9, 0.95, u), t, { walk: 1, rimA: 0.6 });

      // pássaros voltando ao céu
      for (let i = 0; i < 5; i++) {
        const x = ((W * 0.15 + i * 40 + t * 10) % (W + 100)) - 50;
        bird(x, hz * 0.48 + i * 9 + Math.sin(t * 0.8 + i) * 4, 0.8, t * 6 + i, 'rgba(40,18,28,0.8)');
      }

      grassBlades(t, hz + 70, vb + 10, 70, 41, '28,18,10', 20, 1);
      grassBlades(t, hz + 70, vb + 10, 50, 42, '190,120,70', 16, 1);
      motes(t, 22, '255,215,140', { seed: 91, size: 2, rise: -5, sway: 18, y0: hz, y1: vb, alpha: 0.8 });
      ctx.restore();

      ctx.fillStyle = 'rgba(255,140,60,0.06)';
      ctx.fillRect(0, 0, W, H);
      vignette(0.6);
    },
  },

  // ============================================================
  // BÔNUS (opcional) — o 1º dos 8 encaixes do Portal se acende.
  // não tô usando ainda essa cena
  // ============================================================
  portal_core: {
    duration: 7,
    text: 'Oito encaixes esperam no Portal Antigo. Um deles, agora, tem dono. Restam sete.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, vb = H - LB_BOT, cx = W / 2;
      const cy = (LB_TOP + vb) / 2 + 4;
      const R = Math.min(130, (vb - LB_TOP) * 0.34);
      const beat = Math.pow(Math.max(0, Math.sin(t * 2.4)), 3);
      const lit = ease((t - 1.0) / 1.6);

      const bg = ctx.createRadialGradient(cx, cy, 10, cx, cy, W * 0.7);
      bg.addColorStop(0, '#10141f');
      bg.addColorStop(1, '#020305');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      starField(t, 60, 5, H, 0.5);

      // feixe fraco subindo do centro (a torre que existiu)
      additive(() => {
        for (let i = 0; i < 6; i++) {
          const g = ctx.createLinearGradient(0, 0, 0, cy);
          g.addColorStop(0, 'rgba(255,210,130,0)');
          g.addColorStop(1, `rgba(255,210,130,${(0.02 + 0.03 * lit)})`);
          ctx.fillStyle = g;
          const w = 6 + i * 9;
          ctx.fillRect(cx - w, 0, w * 2, cy);
        }
      });

      // aros de pedra do Portal
      for (const [rr, a] of [[R + 34, 0.18], [R + 18, 0.3], [R * 0.45, 0.22]]) {
        ctx.strokeStyle = `rgba(190,165,110,${a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
      }
      // runas nos aros
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2 + t * 0.03;
        const r0 = R + 18, r1 = R + 18 + (i % 4 === 0 ? 9 : 4);
        ctx.strokeStyle = 'rgba(190,165,110,0.28)';
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }
      // linha de luz do encaixe aceso até o centro
      additive(() => {
        ctx.strokeStyle = `rgba(255,215,130,${0.55 * lit})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - R);
        ctx.lineTo(cx, cy - R + (R - R * 0.45) * lit);
        ctx.stroke();
      });

      // 8 encaixes
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4;
        const px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R;
        ctx.fillStyle = '#07090d';
        ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = i === 0 ? `rgba(255,215,130,${0.4 + 0.6 * lit})` : 'rgba(190,165,110,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 14, 0, Math.PI * 2); ctx.stroke();
        if (i === 0 && lit > 0) {
          additive(() => glow(px, py, 48 * (0.9 + beat * 0.2), '255,205,110', 0.85 * lit));
          ctx.save();
          ctx.globalAlpha = lit;
          coreGem(px, py, 9, t, 0.9 + beat * 0.2);
          ctx.restore();
        }
      }

      // contador
      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(254,202,87,${ease((t - 2.2) / 1.2)})`;
      ctx.fillText('1 / 8', cx, cy + 4);
      ctx.textAlign = 'left';

      motes(t, 24, '255,215,140', { seed: 66, size: 1, rise: -8, sway: 14, alpha: 0.6 });
      vignette(0.8);
    },
  },

  // ============================================================
  // DESERTO — CLIFFHANGER (pós-entrega da desert_moral)
  // ============================================================

    akmira_silence: {
    duration: 8,
    text: 'Akmira fica em silêncio. Não o silêncio do medo — o silêncio de quem ouve.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.54, vb = H - LB_BOT;
      const gold = ease((t - 4) / 3.5);

      vGrad(0, hz, [[0, '#04060e'], [0.55, '#0c1424'], [1, '#1c222c']]);
      starField(t, 90, 3, hz * 0.8, 0.85);

      const mx = W * 0.2, my = hz * 0.34;
      additive(() => glow(mx, my, 150, '190,210,255', 0.26));
      ctx.fillStyle = 'rgba(232,237,246,0.94)';
      ctx.beginPath(); ctx.arc(mx, my, 15, 0, Math.PI * 2); ctx.fill();

      // luz dourada nascendo a leste
      additive(() => glow(W * 1.02, hz - 4, 340, '255,190,90', 0.5 * gold));

      hills(hz + 2, 24, '#161c2a', 11, t * 0.5);
      hills(hz + 16, 18, '#0c1119', 12, t * 0.3);

      // casas: as janelas se apagam uma a uma
      const hr = rng(5);
      const baseY = hz + 52;
      for (let i = 0; i < 8; i++) {
        const x = 14 + i * (W - 28) / 8;
        const w = 40 + hr() * 26, h = 34 + hr() * 40;
        ctx.fillStyle = '#0a0d15';
        ctx.fillRect(x, baseY - h, w, h);
        if (i % 3 === 1) { ctx.beginPath(); ctx.arc(x + w / 2, baseY - h, w * 0.38, Math.PI, 0); ctx.fill(); }
        else ctx.fillRect(x - 2, baseY - h - 3, w + 4, 4);
        ctx.fillStyle = `rgba(255,200,120,${0.12 + 0.35 * gold})`;
        ctx.fillRect(x + w - 2, baseY - h, 2, h);   // luz de contorno (leste)

        const lit = 1 - ease((t - (0.8 + i * 0.55)) / 0.5);
        const wx = x + w * 0.3, wy = baseY - h * 0.6;
        ctx.fillStyle = '#05070b';
        ctx.fillRect(wx, wy, 8, 9);
        if (lit > 0.01) {
          additive(() => glow(wx + 4, wy + 4, 34, '255,185,95', 0.55 * lit));
          ctx.fillStyle = `rgba(255,196,110,${lit})`;
          ctx.fillRect(wx + 1, wy + 1, 6, 7);
        }
      }
      hills(hz + 48, 5, '#070a10', 13, 0);

      // oásis: as ondas morrem
      const ox = W / 2, oy = hz + 86;
      additive(() => glow(ox, oy, 150, '80,160,200', 0.3));
      ctx.fillStyle = '#0a1a24';
      ctx.beginPath(); ctx.ellipse(ox, oy, 76, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(70,140,180,0.85)';
      ctx.beginPath(); ctx.ellipse(ox, oy, 70, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(225,238,255,0.45)';
      ctx.beginPath(); ctx.ellipse(ox - (W / 2 - mx) * 0.18, oy - 1, 14, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      const amp = 1 - ease(t / 5);
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.5 + k / 3) % 1;
        ctx.strokeStyle = `rgba(200,230,255,${(1 - ph) * 0.35 * amp})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(ox, oy, 8 + ph * 60, 2 + ph * 14, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (const p of [[-96, 10, 40], [-64, 4, 32], [78, 6, 36], [108, 12, 42]]) {
        const px = ox + p[0], py = oy + p[1];
        ctx.strokeStyle = '#1a100a'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 4, py - p[2] * 0.6, px + 6, py - p[2]); ctx.stroke();
        ctx.strokeStyle = '#123420';
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.moveTo(px + 6, py - p[2]);
          ctx.quadraticCurveTo(px + 6 + i * 8, py - p[2] - 8 - Math.abs(i) * 2, px + 6 + i * 14, py - p[2] + 4);
          ctx.stroke();
        }
      }

      // o povo, imóvel, de frente pro horizonte
      const pr = rng(9);
      const crowd = [];
      for (let i = 0; i < 16; i++) {
        crowd.push({ x: 40 + i * (W - 80) / 15 + (pr() - 0.5) * 18, y: oy + 24 + ((i * 37) % 5) * 12 });
      }
      crowd.sort((a, b) => a.y - b.y);
      for (const c of crowd) {
        const s = 0.85 + (c.y - oy) / 90 * 0.4;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 10 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#05070b';
        ctx.beginPath();
        ctx.moveTo(c.x - 6 * s, c.y - 26 * s); ctx.lineTo(c.x + 6 * s, c.y - 26 * s);
        ctx.lineTo(c.x + 9 * s, c.y); ctx.lineTo(c.x - 9 * s, c.y);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(c.x, c.y - 31 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = `rgba(255,200,120,${0.6 * gold})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.x + 6 * s, c.y - 26 * s); ctx.lineTo(c.x + 9 * s, c.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(c.x, c.y - 31 * s, 5 * s, -1.2, 0.9); ctx.stroke();
      }

      // o Andarilho, também de costas
      wandererBack(W * 0.26, vb - 8, 1.45, t, { walk: 0, rim: '255,200,120', rimA: 0.15 + 0.4 * gold, seed: true, core: false });

      fog(t, hz + 56, 30, '120,140,180', 0.08, 3, 4);
      motes(t, 14, '255,220,140', { seed: 7, size: 1, rise: -4, sway: 10, alpha: 0.55 });
      vignette(0.82);
    },
  },

  elder_eyes: {
    duration: 7,
    text: 'O Ancião não olha pra você. Olha pra trás de você. E o que ele vê não é o deserto.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, cx = W / 2 - 20, cy = H * 0.6;
      const fadeIn = ease(t / 1.4);
      const gut = 1 - 0.55 * ease((t - 4.2) / 2.5);          // a vela falha
      const flick = (0.85 + Math.sin(t * 9) * 0.1 + Math.sin(t * 23) * 0.05) * gut;
      const vx = W * 0.86, vy = H * 0.7;

      ctx.fillStyle = '#030201';
      ctx.fillRect(0, 0, W, H);
      const wall = ctx.createRadialGradient(vx, vy, 10, vx, vy, W * 0.9);
      wall.addColorStop(0, `rgba(120,70,30,${0.55 * gut})`);
      wall.addColorStop(1, 'rgba(10,6,3,0)');
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, W, H);
      // rolos de pergaminho na parede
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `rgba(70,50,30,${0.35 * fadeIn})`;
        ctx.fillRect(28 + i * 22, H * 0.3 + (i % 2) * 8, 12, 56);
      }

      ctx.globalAlpha = fadeIn;
      const shoulders = () => {
        ctx.beginPath();
        ctx.moveTo(cx - 250, H);
        ctx.bezierCurveTo(cx - 230, cy + 20, cx - 90, cy - 10, cx - 46, cy - 36);
        ctx.lineTo(cx + 46, cy - 36);
        ctx.bezierCurveTo(cx + 90, cy - 10, cx + 230, cy + 20, cx + 250, H);
        ctx.closePath();
      };
      const head = () => { ctx.beginPath(); ctx.ellipse(cx, cy - 112, 54, 66, 0, 0, Math.PI * 2); };

      ctx.fillStyle = '#0d0907'; shoulders(); ctx.fill();
      ctx.fillStyle = '#050302';
      ctx.beginPath(); ctx.ellipse(cx, cy - 118, 72, 88, 0, 0, Math.PI * 2); ctx.fill();

      const fg = ctx.createLinearGradient(0, cy - 170, 0, cy - 50);
      fg.addColorStop(0, '#0a0604'); fg.addColorStop(0.6, '#2c1a0d'); fg.addColorStop(1, '#6a4526');
      ctx.fillStyle = fg; head(); ctx.fill();

      // luz da vela no lado direito do rosto e da capa
      ctx.save();
      head(); ctx.clip();
      additive(() => glow(vx - 60, vy - 90, 200, '255,170,80', 0.5 * flick));
      ctx.restore();
      ctx.save();
      shoulders(); ctx.clip();
      additive(() => glow(vx - 20, vy, 260, '255,150,70', 0.28 * flick));
      ctx.restore();

      // rugas
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy - 150 + i * 6);
        ctx.quadraticCurveTo(cx, cy - 156 + i * 6, cx + 30, cy - 150 + i * 6);
        ctx.stroke();
      }

      // barba
      const bg = ctx.createLinearGradient(cx - 40, 0, cx + 40, 0);
      bg.addColorStop(0, '#4a463e'); bg.addColorStop(1, '#b4ad9a');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.moveTo(cx - 40, cy - 96);
      ctx.quadraticCurveTo(cx - 46, cy - 30, cx, cy + 8);
      ctx.quadraticCurveTo(cx + 46, cy - 30, cx + 40, cy - 96);
      ctx.quadraticCurveTo(cx, cy - 72, cx - 40, cy - 96);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(cx + i * 9, cy - 84); ctx.quadraticCurveTo(cx + i * 10, cy - 40, cx + i * 4, cy); ctx.stroke();
      }

      // olhos: olham pra trás de você (pupila à direita), reflexo dourado cresce
      const open = ease((t - 0.8) / 1.6);
      const ref = ease((t - 2.5) / 3);
      const ey = cy - 118;
      for (const sd of [-1, 1]) {
        const ex = cx + sd * 22;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.ellipse(ex, ey, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d8c89a';
        ctx.beginPath(); ctx.ellipse(ex, ey, 8, Math.max(0.5, 4.2 * open), 0, 0, Math.PI * 2); ctx.fill();
        const px = ex + 3.5 + Math.sin(t * 0.6) * 0.6;
        ctx.fillStyle = '#1a0f08';
        ctx.beginPath(); ctx.arc(px, ey, Math.min(2.8, 4 * open), 0, Math.PI * 2); ctx.fill();
        additive(() => glow(px + 1, ey - 0.5, 8, '255,215,120', 0.9 * ref));
        ctx.fillStyle = `rgba(255,240,190,${ref})`;
        ctx.beginPath(); ctx.arc(px + 1, ey - 1, 1.1, 0, Math.PI * 2); ctx.fill();
        // sobrancelha grossa
        ctx.strokeStyle = '#8a8478';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(ex - 14, ey - 11 + sd * 1); ctx.lineTo(ex + 14, ey - 15 - sd * 1); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // a vela
      ctx.fillStyle = '#c9b48a';
      ctx.fillRect(vx - 5, vy + 2, 10, 38);
      additive(() => {
        glow(vx, vy - 6, 70 * flick, '255,180,90', 0.6);
        ctx.fillStyle = '#ffd27a';
        ctx.beginPath(); ctx.ellipse(vx + Math.sin(t * 3) * 0.8 * (1 - gut + 0.2), vy - 6, 3, 9 * flick, 0, 0, Math.PI * 2); ctx.fill();
      });

      motes(t, 14, '255,200,130', { seed: 22, size: 1, rise: -3, sway: 8, alpha: 0.5 });
      vignette(0.92);
    },
  },

  dunes_stir: {
    duration: 8,
    text: 'A areia corre contra o vento. Sob os seus pés, o deserto bate devagar — como um pulso que não é seu.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.46, cx = W / 2, vb = H - LB_BOT;
      const beat = Math.pow(Math.max(0, Math.sin(t * 2.2)), 3);
      const beam = ease((t - 4.5) / 3);

      vGrad(0, hz, [[0, '#150b12'], [0.5, '#4a2220'], [1, '#d08040']]);
      additive(() => glow(cx, hz, 320 + beat * 30, '255,175,90', 0.35 + beat * 0.15));
      hills(hz + 8, 10, '#7a4c2a', 61, t * 0.4);

      // anéis de pulso no chão (perspectiva)
      ctx.save();
      ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
      for (let k = 0; k < 5; k++) {
        const ph = (t * 0.35 + k / 5) % 1;
        const rx = 20 + ph * W * 0.95, ry = rx * 0.14;
        ctx.strokeStyle = `rgba(255,205,135,${(1 - ph) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, hz + 14, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = `rgba(40,20,8,${(1 - ph) * 0.35})`;
        ctx.beginPath(); ctx.ellipse(cx, hz + 17, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // areia correndo CONTRA o vento, rumo ao centro
      const sr = rng(13);
      ctx.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const a = 0.08 + sr() * (Math.PI - 0.16);
        const sx = cx + Math.cos(a) * W * 0.75, sy = hz + 14 + Math.sin(a) * W * 0.3;
        const p = (t * (0.18 + sr() * 0.12) + sr()) % 1;
        const x = lerp(sx, cx, p), y = lerp(sy, hz + 14, p);
        const dx = (cx - sx) * 0.03, dy = (hz + 14 - sy) * 0.03;
        ctx.strokeStyle = `rgba(255,215,160,${Math.sin(p * Math.PI) * 0.55})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dx, y + dy); ctx.stroke();
      }
      ctx.restore();

      hills(hz + 60, 14, '#4a2e1a', 62, -t * 0.6);

      // feixe dourado subindo do horizonte
      if (beam > 0) {
        additive(() => {
          const g = ctx.createLinearGradient(0, hz - 260 * beam, 0, hz);
          g.addColorStop(0, 'rgba(255,220,150,0)');
          g.addColorStop(1, `rgba(255,220,150,${0.8 * beam})`);
          ctx.fillStyle = g;
          ctx.fillRect(cx - 3 - beam * 4, hz - 260 * beam, 6 + beam * 8, 260 * beam);
        });
      }

      hills(hz + 132, 18, '#1c1109', 63, t * 0.3);
      grassBlades(t, hz + 150, vb + 10, 40, 64, '20,12,6', 12, 0.8);
      wandererBack(cx, vb - 10, 1.7, t, { walk: 0, rim: '255,190,110', rimA: 0.35 + beat * 0.25, seed: true, core: false });

      motes(t, 36, '230,170,100', { seed: 65, size: 1, rise: -3, sway: 40, alpha: 0.7 });
      vignette(0.7);
    },
  },

  awakening_desert: {
    duration: 9,
    text: 'No Coração das Dunas, alguma coisa acaba de abrir os olhos. E ela também sentiu você.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, hz = H * 0.6, cx = W / 2, ey = H * 0.34, vb = H - LB_BOT;
      const open = ease((t - 1.8) / 4.2);
      const look = ease((t - 6) / 2.5);

      ctx.save();
      camera(1 + ease(t / 10) * 0.08, cx, ey, 0.6 * open, t);

      vGrad(0, hz, [[0, '#1a0d0c'], [0.45, '#42201a'], [0.85, '#9a5a2e'], [1, '#d89850']]);
      // faixas de poeira da tempestade
      for (let i = 0; i < 8; i++) {
        const x = ((i * 160 + t * 30) % (W + 300)) - 150;
        ctx.fillStyle = 'rgba(90,50,35,0.22)';
        ctx.beginPath(); ctx.ellipse(x, hz * (0.18 + 0.1 * i), 150 + (i % 3) * 40, 12, 0, 0, Math.PI * 2); ctx.fill();
      }

      if (open > 0) {
        const R = 120, h = R * 0.62 * open;
        additive(() => glow(cx, ey, R * 2.6, '255,190,90', 0.35 * open));
        godRays(t, cx, ey, '255,210,130', 9, 0.1 * open, 2.4, 640, Math.PI / 2);

        const almond = () => {
          ctx.beginPath();
          ctx.moveTo(cx - R, ey);
          ctx.quadraticCurveTo(cx, ey - h * 2, cx + R, ey);
          ctx.quadraticCurveTo(cx, ey + h * 2, cx - R, ey);
          ctx.closePath();
        };
        ctx.save();
        almond(); ctx.clip();
        const ig = ctx.createRadialGradient(cx, ey, 4, cx, ey, R);
        ig.addColorStop(0, '#fff3c0'); ig.addColorStop(0.4, '#f2b84a');
        ig.addColorStop(0.8, '#b8641e'); ig.addColorStop(1, '#4a1c0c');
        ctx.fillStyle = ig;
        ctx.fillRect(cx - R, ey - R, R * 2, R * 2);
        // anéis rúnicos girando em sentidos opostos
        for (let ring = 0; ring < 3; ring++) {
          const rr = R * (0.34 + ring * 0.2), dir = ring % 2 ? -1 : 1;
          ctx.strokeStyle = 'rgba(80,30,10,0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(cx, ey, rr, 0, Math.PI * 2); ctx.stroke();
          const n = 18 + ring * 6;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2 + t * 0.25 * dir;
            const r1 = rr + (i % 3 === 0 ? 9 : 4);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * rr, ey + Math.sin(a) * rr);
            ctx.lineTo(cx + Math.cos(a) * r1, ey + Math.sin(a) * r1);
            ctx.stroke();
          }
        }
        // pupila em fenda; depois de 6s ela desce até o Andarilho
        const py = ey + look * h * 0.4;
        ctx.fillStyle = '#050101';
        ctx.beginPath(); ctx.ellipse(cx, py, 8 - look * 2, 46 * open, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        almond();
        ctx.strokeStyle = `rgba(255,220,150,${0.85 * open})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        almond();
        ctx.strokeStyle = `rgba(20,6,2,${0.6 * open})`;
        ctx.lineWidth = 7;
        ctx.globalCompositeOperation = 'destination-over';
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
      }

      hills(hz + 10, 30, '#5a3320', 71, t * 0.8);
      hills(hz + 40, 22, '#2e1a10', 72, 0);
      hills(hz + 84, 16, '#120a06', 73, -t);
      wandererBack(W * 0.3, vb - 10, 1.5, t, { walk: 0, rim: '255,210,130', rimA: 0.3 + 0.5 * open, seed: true, core: false });
      motes(t, 40, '230,170,100', { seed: 4, size: 1, rise: -3, sway: 40, alpha: 0.7 });
      ctx.restore();

      vignette(0.78);
      const fl = ease((t - 8) / 0.5) * (1 - ease((t - 9) / 0.6));
      if (fl > 0) {
        ctx.fillStyle = `rgba(255,235,170,${fl * 0.6})`;
        ctx.fillRect(0, 0, W, H);
      }
    },
  },

  demo_end: {
    duration: 7,
    text: 'Obrigado por jogar. A jornada continua em breve.',
    draw(t) {
      const W = CANVAS_W, H = CANVAS_H, cx = W / 2, cy = H * 0.47;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      additive(() => glow(cx, cy, 320, '200,120,40', 0.16 * ease(t / 3)));

      // anel rúnico girando, bem sutil
      ctx.strokeStyle = `rgba(190,150,90,${0.25 * ease(t / 2)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2 + t * 0.08;
        const r1 = 120 + (i % 4 === 0 ? 9 : 4);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }

      const a1 = ease((t - 0.8) / 1.2), a2 = ease((t - 2.4) / 1.2), a3 = ease((t - 4) / 1.2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 30px "Courier New", monospace';
      ctx.fillStyle = `rgba(0,0,0,${a1})`; ctx.fillText('FIM DA DEMO', cx + 2, cy - 18 + 2);
      ctx.fillStyle = `rgba(254,202,87,${a1})`; ctx.fillText('FIM DA DEMO', cx, cy - 18);
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = `rgba(201,162,77,${a2})`;
      ctx.fillText('— O Anel das Dunas desperta —', cx, cy + 16);
      ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillStyle = `rgba(244,224,180,${a3 * (0.7 + 0.3 * Math.sin(t * 2))})`;
      ctx.fillText('CONTINUA…', cx, cy + 56);
      ctx.textAlign = 'left';

      motes(t, 24, '255,200,120', { seed: 66, size: 1, rise: -8, sway: 14, alpha: 0.5 });
      vignette(0.8);
    },
  },
};

// ------------------------------------------------------------
// API pública
// ------------------------------------------------------------

export function buildCutscene(sceneKeys, onEnd) {
  const lines = sceneKeys.map((key) => {
    const scene = SCENES[key] || SCENES.approach;
    return {
      text: scene.text || '',
      scene: scene.draw,
      duration: scene.duration ?? SCENE_DUR,
      flash: !!scene.flash,
      auto: !!scene.auto || key === 'title',   // ← força title a auto
    };
  });
  return {
    lines,
    index: 0,
    timer: 0,              // "tempo decorrido" do slide; NÃO tem teto (ver drawCutscene)
    totalElapsed: 0,
    manual: true,
    _advanceRequested: false,
    _skipAll: false,       // ESC na cutscene pula tudo
    onEnd,
  };
}

// Avança o slide atual da cutscene.
// (Não pula a cutscene inteira — isso é papel de outro handler)
export function skipCutsceneScene(cs) {
  if (cs) cs._advanceRequested = true;
}

// Pula a cutscene inteira.
export function skipCutsceneAll(cs) {
  if (cs) cs._skipAll = true;
}

function wrapLines(text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export function drawCutscene(cs) {
  const line = cs.lines[cs.index];
  if (!line) return;

  // Tempo decorrido do slide. NÃO é mais clampado em `duration`: o tempo
  // continua correndo enquanto o jogador lê, então tudo que é "ambiente"
  // (pássaros, balanço, névoa, partículas, pulsos — qualquer coisa baseada
  // em sin(t) ou módulo) segue em loop naturalmente. As animações de
  // PROGRESSO (zoom, aparição, rachaduras...) usam ease()/clamp01(), que
  // já param sozinhas em 1 — então elas terminam e o resto continua vivo.
  const t = cs.timer;

  // Respiração de câmera: depois que a animação principal acaba, um zoom
  // MUITO leve vai e volta (0 → ~1.2% → 0), partindo de velocidade zero
  // pra não dar "tranco" na transição. Só em slides manuais.
  const idleT = Math.max(0, t - line.duration);
  const breathe = (!line.auto && idleT > 0)
    ? 1 + 0.006 * (1 - Math.cos(idleT * 0.45))
    : 1;

  ctx.save();
  if (breathe !== 1) {
    ctx.translate(CANVAS_W / 2, CANVAS_H / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-CANVAS_W / 2, -CANVAS_H / 2);
  }
  if (typeof line.scene === 'function') line.scene(t);
  else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // Fade de entrada do slide (primeiros 0.8s). NÃO faz fade de saída —
  // o slide só troca quando o jogador avança (ou quando `auto` zera
  // o timer). Sem fade de saída, a cena fica sempre visível até a troca.
  let fadeAlpha = 0;
  if (t < FADE) fadeAlpha = 1 - t / FADE;
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Flash inicial (slide `confrontation`)
  if (line.flash) {
    if (t < 0.2) {
      ctx.fillStyle = `rgba(255, 240, 200, ${(1 - t / 0.2) * 0.7})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  // Letterbox (topo e base)
  const topH = 52, botH = 96;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
  ctx.fillRect(0, 0, CANVAS_W, topH);
  ctx.fillRect(0, CANVAS_H - botH, CANVAS_W, botH);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, topH - 0.5);
  ctx.lineTo(CANVAS_W, topH - 0.5);
  ctx.moveTo(0, CANVAS_H - botH + 0.5);
  ctx.lineTo(CANVAS_W, CANVAS_H - botH + 0.5);
  ctx.stroke();

  // Texto (máquina de escrever)
  if (line.text) {
    ctx.font = '17px "Courier New", monospace';
    ctx.textBaseline = 'middle';
    const lines = wrapLines(line.text, CANVAS_W - 80);
    const lineH = 24;
    const shown = Math.max(0, Math.floor((t - TYPE_START) * TYPE_CPS));
    const blockH = lines.length * lineH;
    let y = CANVAS_H - botH + (botH - blockH) / 2 + lineH / 2;
    let remaining = shown;
    for (const l of lines) {
      const part = l.slice(0, Math.max(0, remaining));
      remaining -= l.length + 1;
      if (part) {
        const fullW = ctx.measureText(l).width;
        const x = (CANVAS_W - fullW) / 2;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#000';
        ctx.fillText(part, x + 1, y + 1);
        ctx.fillStyle = '#f4e0b4';
        ctx.fillText(part, x, y);
      }
      y += lineH;
    }
    ctx.textAlign = 'left';
  }

  // Pontinhos de progresso
  const total = cs.lines.length;
  for (let i = 0; i < total; i++) {
    const dotX = CANVAS_W / 2 - (total - 1) * 9 + i * 18;
    const dotY = topH / 2;
    ctx.fillStyle = i === cs.index ? '#feca57' : '#555';
    ctx.beginPath();
    ctx.arc(dotX, dotY, i === cs.index ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dica de controle no canto
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(220,200,140,0.65)';
  ctx.fillText('Espaço / clique para avançar', CANVAS_W - 16, 26);
}

// ============================================================
// OUTRO / CLIFFHANGER — cutscene que roda fora do estado BATTLE
// ============================================================
// Reusa o motor de `drawCutscene`, mas pausa o jogo e usa
// `STATE.INTRO` para renderizar. Um flag `_outroActive` é checado
// pelo `loop.js` pra pausar updatePlayer/updateHUD.
let _outro = null;   // { cs, onEnd }

// ============================================================
// Helpers: escondem/restauram o HUD (DOM) durante a cutscene.
// ============================================================
function _setHudVisible(visible) {
  const hud = document.getElementById('hud');
  if (hud) hud.style.display = visible ? '' : 'none';
  for (const id of ['btn-inventory', 'btn-map', 'btn-questlog', 'btn-audio']) {
    const btn = document.getElementById(id);
    if (btn) btn.style.display = visible ? '' : 'none';
  }
}

export function playOutroCutscene(sceneKeys, onEnd) {
  if (_outro) return;   // já tem uma rodando
  const cs = buildCutscene(sceneKeys, onEnd);
  _outro = { cs, onEnd };
  _setHudVisible(false);
  setGameState(STATE.INTRO);
  import('../audio/audio.js').then(m => m.setMusicMode('cutscene')).catch(() => {});
}

export function updateOutroCutscene(dt) {
  if (!_outro) return;
  const cs = _outro.cs;
  cs.totalElapsed += dt;

  // Pular tudo (ESC)
  if (cs._skipAll) {
    cs._skipAll = false;
    const cb = _outro.onEnd;
    _outro = null;
    _setHudVisible(true);
    setGameState(STATE.EXPLORE);
    if (typeof cb === 'function') cb();
    return;
  }

  // Timer = tempo decorrido
  cs.timer += dt;

  const line = cs.lines[cs.index];
  const dur = line?.duration ?? 2.0;
  const wantAdvance = cs._advanceRequested;
  const autoDone = line?.auto && cs.timer >= dur;

  if (wantAdvance || autoDone) {
    cs._advanceRequested = false;
    cs.index++;
    if (cs.index >= cs.lines.length) {
      const cb = _outro.onEnd;
      _outro = null;
      _setHudVisible(true);
      setGameState(STATE.EXPLORE);
      if (typeof cb === 'function') cb();
    } else {
      cs.timer = 0;
    }
  }
}

export function isOutroActive() { return _outro !== null; }

export function renderOutroCutscene() {
  if (_outro) drawCutscene(_outro.cs);
}

export function getOutroCs() {
  return _outro?.cs ?? null;
}

export function skipOutroScene() {
  if (_outro) _outro.cs._advanceRequested = true;
}

export const AFTER_GUARDIAN_FIELDS_SCENES = [
  'silence', 'recoil', 'nucleus', 'seed', 'walk',
];

// Cutscene de cliffhanger — roda no EXPLORE (via `playOutroCutscene`).
export const DESERT_CLIFFHANGER_SCENES = [
  'akmira_silence', 'elder_eyes', 'dunes_stir', 'awakening_desert', 'demo_end',
];