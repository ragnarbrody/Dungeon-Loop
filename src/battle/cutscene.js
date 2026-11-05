// ============================================================
// CUTSCENE DE BOSS — slideshow com cenas desenhadas em canvas.
// Tudo determinístico. Cada cena dura 10s (sincroniza com
// a música 'cutscene': 72 BPM × 3 compassos).
// ============================================================

import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';

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
// CENAS
// ------------------------------------------------------------

const SCENES = {

  title: {
    duration: 2.5,
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
      const shake = Math.max(0, (t - 5.5) / 4.5) * 2.4;
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
      }, t, { seed: 11, depth: 5, sway: 4 + t * 0.4, leafAlpha: 1 - ease((t - 5) / 4) * 0.35 });

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
    };
  });
  return {
    lines,
    index: 0,
    timer: lines[0]?.duration ?? SCENE_DUR,
    totalElapsed: 0,
    onEnd,
  };
}

export function skipCutsceneScene(cs) {
  if (cs) cs.timer = 0;
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
  const t = Math.max(0, line.duration - cs.timer);

  ctx.save();
  if (typeof line.scene === 'function') line.scene(t);
  else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H); }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  let fadeAlpha = 0;
  if (t < FADE) fadeAlpha = 1 - t / FADE;
  else if (cs.timer < FADE) fadeAlpha = 1 - cs.timer / FADE;
  if (fadeAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // No drawCutscene, ANTES de desenhar o letterbox:
  if (line.flash) {
    // Slide de confrontation: flash branco nos primeiros 0.2s
    if (t < 0.2) {
      ctx.fillStyle = `rgba(255, 240, 200, ${(1 - t / 0.2) * 0.7})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  }

  // Letterbox
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
    const textAlpha = cs.timer < FADE ? clamp01(cs.timer / FADE) : 1;
    const blockH = lines.length * lineH;
    let y = CANVAS_H - botH + (botH - blockH) / 2 + lineH / 2;
    let remaining = shown;
    ctx.globalAlpha = textAlpha;
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
    ctx.globalAlpha = 1;
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

  // Dica de "pular" no canto
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(220,200,140,0.65)';
  ctx.fillText('Espaço / clique para pular', CANVAS_W - 16, 26);
}