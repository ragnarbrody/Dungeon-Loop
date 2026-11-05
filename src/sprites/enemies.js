import { makeGoblinFrames } from './goblin.js';
import { makeScorpionFrames } from './scorpion.js';
import { makeVultureFrames } from './vulture.js';
import { makeMummyFrames } from './mummy.js';
import { makeScarabFrames } from './scarab.js';

export function makeSlimeFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  const color = '#6fd16f';
  const colorDark = '#4fa34f';
  const eye = '#111';

  function drawFrame(squish) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');

    g.fillStyle = color;
    g.beginPath();
    g.ellipse(16, 26, 14 + squish * 2, 8 - squish * 2, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = colorDark;
    g.beginPath();
    g.ellipse(16, 28, 10 + squish * 2, 3, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = eye;
    g.fillRect(11, 20, 2, 3);
    g.fillRect(19, 20, 2, 3);
    g.fillStyle = '#fff';
    g.fillRect(11, 20, 1, 1);
    g.fillRect(19, 20, 1, 1);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(0.5);
  frames.attack[0] = drawFrame(-1);
  return frames;
}

export function makeRatFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  function drawFrame(kind) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

    const color = '#8a6b5a';
    const dark = '#5c4538';
    const ear = '#d1a7a7';
    const tail = '#d1a7a7';

    const lean = kind === 'attack' ? -2 : 0;

    px(24, 22, 4, 2, tail);
    px(28, 20, 2, 4, tail);

    px(12 + lean, 20, 12, 8, color);
    px(12 + lean, 26, 12, 2, dark);

    px(20 + lean, 16, 8, 6, color);
    px(20 + lean, 12, 3, 4, color);
    px(21 + lean, 13, 1, 2, ear);

    px(25 + lean, 17, 1, 2, '#111');
    px(28 + lean, 19, 2, 1, dark);

    px(14 + lean, 28, 2, 2, dark);
    px(20 + lean, 28, 2, 2, dark);

    return c;
  }

  frames.idle[0] = drawFrame('idle');
  frames.idle[1] = drawFrame('idle');
  frames.attack[0] = drawFrame('attack');
  return frames;
}

export function makeBatFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  function drawFrame(wingUp) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    const body = '#2a1a3a';
    const bodyHi = '#4a3a5a';
    const wing = '#4a2a5a';
    const wingSh = '#2a1a3a';
    const eye = '#ff3b3b';

    // Corpo central
    p(14, 12, 4, 6, body);
    p(15, 13, 2, 4, bodyHi);
    // Orelhas
    p(13, 10, 1, 2, body);
    p(18, 10, 1, 2, body);
    // Olhos
    p(14, 14, 1, 1, eye);
    p(17, 14, 1, 1, eye);
    // Asas (animadas)
    const wingY = wingUp ? 6 : 10;
    // Asa esquerda
    p(8, wingY, 6, 8, wing);
    p(9, wingY + 1, 4, 6, wingSh);
    p(8, wingY + 8, 2, 2, wingSh);
    // Asa direita
    p(18, wingY, 6, 8, wing);
    p(19, wingY + 1, 4, 6, wingSh);
    p(22, wingY + 8, 2, 2, wingSh);

    return c;
  }
  frames.idle[0] = drawFrame(false);
  frames.idle[1] = drawFrame(true);
  frames.attack[0] = drawFrame(false);
  return frames;
}

export function makeGoblinSergeantFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    const skin = '#5a8a3a';
    const skinSh = '#3f6528';
    const skinHi = '#7aa85a';
    const cloth = '#6b4a2b';
    const clothSh = '#4a3018';
    const eye = '#e6e64a';
    const eyeDark = '#1a1a0e';
    const tusk = '#f0e8c8';
    const armor = '#8a8a9a'; // Armadura metálica
    const armorSh = '#5a5a6a';
    const armorHi = '#c0c8d0';

    const bob = (kind === 'idle' && step === 1) ? 1 : 0;
    const lean = kind === 'attack' ? 2 : 0;

    // Sombra
    p(8, 30, 16, 1, 'rgba(0,0,0,0.28)');

    // Pernas
    p(11 + lean, 26 + bob, 3, 4, skinSh);
    p(18 + lean, 26 + bob, 3, 4, skinSh);

    // Corpo (maior que o goblin normal)
    p(10 + lean, 18 + bob, 12, 9, cloth);
    p(10 + lean, 18 + bob, 12, 1, clothSh);
    // Armadura no corpo
    p(11 + lean, 19 + bob, 10, 6, armor);
    p(11 + lean, 19 + bob, 10, 1, armorHi);
    p(12 + lean, 21 + bob, 8, 1, armorSh);

    // Braços
    p(7 + lean, 19 + bob, 3, 6, skin);
    p(22 + lean, 19 + bob, 3, 6, skin);
    // Braço com machado
    p(23 + lean, 18 + bob, 2, 6, skinSh); // Braço direito
    p(24 + lean, 15 + bob, 2, 4, '#6b4a2b'); // Cabo do machado
    p(22 + lean, 13 + bob, 5, 3, '#8a8a9a'); // Lâmina
    p(23 + lean, 13 + bob, 3, 1, '#c0c8d0'); // Brilho da lâmina

    // Cabeça (maior)
    p(10 + lean, 8 + bob, 12, 10, skin);
    p(10 + lean, 17 + bob, 12, 1, skinSh);
    p(11 + lean, 9 + bob, 10, 1, skinHi);

    // Orelhas
    p(8 + lean, 9 + bob, 2, 3, skin);
    p(22 + lean, 9 + bob, 2, 3, skin);

    // Olhos
    p(13 + lean, 12 + bob, 2, 2, eye);
    p(18 + lean, 12 + bob, 2, 2, eye);
    p(13 + lean, 13 + bob, 1, 1, eyeDark);
    p(19 + lean, 13 + bob, 1, 1, eyeDark);

    // Nariz e presas
    p(15 + lean, 16 + bob, 2, 1, skinSh);
    p(14 + lean, 16 + bob, 1, 2, tusk);
    p(17 + lean, 16 + bob, 1, 2, tusk);

    // Capacete simples (só na versão 0)
    if (kind === 'idle') {
      p(11 + lean, 7 + bob, 10, 2, armorSh);
      p(12 + lean, 7 + bob, 8, 1, armorHi);
    }

    return c;
  }
  frames.idle[0] = drawFrame('idle', 0);
  frames.idle[1] = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);
  return frames;
}

export function makeTreeMotherFrames() {
  const S = 48;
  const frames = { idle: [], attack: [], phase2: [], attackPhase2: [] };

  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // kind: 'idle' | 'attack'   phase2: bool   step: 0|1 (quadro de animação)
  function drawFrame(kind, phase2, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const atk = kind === 'attack';
    const r = rng(phase2 ? 7777 : 1234);   // mesma semente em todos os quadros = silhueta estável

    // ---- helpers (tudo em pixels inteiros, igual aos outros sprites) ----
    const px = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(Math.round(x), Math.round(y), w, h);
    };
    const dot = (x, y, col) => px(x, y, 1, 1, col);
    const disc = (cx, cy, rad, col) => {
      g.fillStyle = col;
      for (let y = -rad; y <= rad; y++) {
        const hw = Math.round(Math.sqrt(Math.max(0, rad * rad + 0.5 - y * y)));
        g.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
      }
    };
    const line = (x0, y0, x1, y1, w, col) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2 || 1;
      g.fillStyle = col;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        const ww = typeof w === 'function' ? w(k) : w;
        g.fillRect(Math.round(x0 + (x1 - x0) * k - ww / 2), Math.round(y0 + (y1 - y0) * k - ww / 2), ww, ww);
      }
    };
    const curve = (x0, y0, cx, cy, x1, y1, w, col) => {
      const n = 28;
      g.fillStyle = col;
      for (let i = 0; i <= n; i++) {
        const k = i / n, m = 1 - k;
        const x = m * m * x0 + 2 * m * k * cx + k * k * x1;
        const y = m * m * y0 + 2 * m * k * cy + k * k * y1;
        const ww = typeof w === 'function' ? w(k) : w;
        g.fillRect(Math.round(x - ww / 2), Math.round(y - ww / 2), ww, ww);
      }
    };

    // ---- Paleta (fase 1 = carvalho antigo musgoso; fase 2 = corrompida) ----
    const P = phase2 ? {
      trunk: '#5a2a1c', trunkHi: '#83402a', trunkSh: '#2c130e', bark: '#180a08',
      root: '#46201a', rootHi: '#74382a',
      branch: '#341612', branchHi: '#62301f',
      leafDark: '#6a1c18', leafMid: '#9a2e26', leafHi: '#cc4e36', leafEdge: '#ff9a62',
      moss: '#8a3a22', mossHi: '#bc6a32', vine: '#6a2418',
      eye: '255,80,32', eyeCore: '#ffe0b0', rune: '#ff8a3a', runeDim: '#a8441e',
    } : {
      trunk: '#6b4428', trunkHi: '#8f5e36', trunkSh: '#3a2416', bark: '#24160c',
      root: '#54351f', rootHi: '#80532f',
      branch: '#4a2f1b', branchHi: '#74492a',
      leafDark: '#1f4a24', leafMid: '#2f6b33', leafHi: '#4f9a4a', leafEdge: '#86c872',
      moss: '#2f6b33', mossHi: '#4f9a4a', vine: '#1f4a24',
      eye: '255,190,70', eyeCore: '#fff2c0', rune: '#f0c050', runeDim: '#a8842c',
    };

    // balanço leve nos quadros de idle; no ataque, copa "cai" 1px
    const sway = step === 1 ? 1 : 0;
    const dropY = atk ? 1 : 0;

    // ===== SOMBRA NO CHÃO =====
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.ellipse(24, 46, 22, 2, 0, 0, Math.PI * 2); g.fill();

    // ===== RAÍZES TRASEIRAS (largas, em contraforte, atrás do tronco) =====
    const rootSet = [
      // [x0, y0, cx, cy, x1, y1, largura-base]
      [14, 36, 8, 42, 2, 45, 6], [34, 36, 40, 42, 46, 45, 6],
      [16, 40, 11, 38, 5, 40, 4], [32, 40, 37, 38, 43, 40, 4],
    ];
    for (const [x0, y0, cx, cy, x1, y1, w] of rootSet) {
      curve(x0, y0, cx, cy, x1, y1, (k) => Math.max(2, Math.round(w * (1 - k * 0.65))), P.root);
    }

    // ===== TRONCO =====
    // Meia-largura por linha: afunila na "cintura" (rosto) e abre forte na base.
    const hwAt = (y) => {
      if (y < 17) return 6 + (y - 12) * 0.6;                       // pescoço, junção com galhos
      if (y < 36) return 9 + Math.sin((y - 17) / 19 * Math.PI) * 1.6; // corpo com leve barriga
      return 9 + (y - 36) * 0.62 + Math.pow(y - 36, 2) * 0.03;     // abre rápido na base
    };
    const cxAt = (y) => 24 + Math.round(Math.sin(y * 0.19 + 0.8) * 1.3);
    const top = 12, bot = 45;
    for (let y = top; y <= bot; y++) {
      const hw = Math.round(hwAt(y));
      const cx = cxAt(y);
      const L = cx - hw, R = cx + hw;
      px(L, y, R - L + 1, 1, P.trunk);
      // luz vem da esquerda: faixa clara à esquerda, sombra à direita
      px(L + 1, y, Math.max(2, Math.round(hw * 0.55)), 1, P.trunkHi);
      px(cx + Math.round(hw * 0.25), y, R - (cx + Math.round(hw * 0.25)) + 1, 1, P.trunk);
      px(cx + Math.round(hw * 0.55), y, R - (cx + Math.round(hw * 0.55)) + 1, 1, P.trunkSh);
      dot(L, y, P.trunkSh);                          // contorno
      dot(R, y, P.bark);
      // veios de casca em espiral (diagonais que "torcem" o tronco)
      for (let x = L + 1; x < R; x++) {
        const t = (x + Math.floor(y * 0.5)) % 5;
        if (t === 0 && r() < 0.5) dot(x, y, P.bark);
        else if (t === 2 && r() < 0.35) dot(x, y, P.trunkHi);
      }
    }
    // ===== ROSTO =====
    // sobrancelhas de casca (sombra pesada, ar de "bravo")
    line(15, 24, 22, 27, 2, P.bark);
    line(33, 24, 26, 27, 2, P.bark);
    // nariz/fenda central
    px(24, 27, 1, 6, P.bark);
    px(23, 31, 1, 3, P.trunkSh);
    px(25, 31, 1, 3, P.trunkSh);

    // olhos: fendas inclinadas (mais altas por fora, descem pro centro)
    const eyeA = phase2 ? 1 : (atk ? 1 : 0.9);
    const drawEye = (side) => {
      const ex = 24 + side * 5;     // centro do olho
      const ey = 28;
      // halo difuso
      const gr = g.createRadialGradient(ex, ey, 0, ex, ey, 7);
      gr.addColorStop(0, `rgba(${P.eye},${0.30 * eyeA})`);
      gr.addColorStop(1, `rgba(${P.eye},0)`);
      g.fillStyle = gr;
      g.fillRect(ex - 7, ey - 7, 14, 14);
      // fenda: 5 colunas, inclinação por coluna
      for (let i = -3; i <= 3; i++) {
        const x = ex + i * side;                  // i>0 => rumo ao centro
        const yy = ey + Math.round(i * 0.45);
        const thin = Math.abs(i) === 3;
        px(x, thin ? yy : yy - 1, 1, thin ? 1 : 2, `rgba(${P.eye},${eyeA})`);
        if (Math.abs(i) <= 1) dot(x, yy, P.eyeCore);
      }
      if (atk || phase2) px(ex + side * 3, ey + 2, 1, 1, `rgba(${P.eye},0.9)`);
    };
    drawEye(-1); drawEye(1);

    // runa dourada na testa (losango + traço vertical, como na imagem)
    const runeA = phase2 ? 1 : (step === 1 ? 0.7 : 1);
    g.globalAlpha = runeA;
    dot(24, 14, P.runeDim); dot(24, 15, P.runeDim);
    dot(24, 16, P.rune);
    dot(23, 17, P.rune); dot(25, 17, P.rune);
    dot(24, 18, P.eyeCore);
    dot(23, 19, P.rune); dot(25, 19, P.rune);
    dot(24, 20, P.rune);
    dot(24, 21, P.runeDim); dot(24, 22, P.runeDim); dot(24, 23, P.runeDim);
    g.globalAlpha = 1;

    // oco escuro no peito (lar do Núcleo)
    g.fillStyle = P.bark;
    g.beginPath();
    g.moveTo(24, 33);
    g.quadraticCurveTo(28, 37, 26, 42);
    g.lineTo(22, 42);
    g.quadraticCurveTo(20, 37, 24, 33);
    g.fill();

    // ===== NÓS E MUSGO NO TRONCO =====
    const knots = [[17, 36], [31, 22], [30, 37]];
    for (const [kx, ky] of knots) {
      px(kx, ky, 2, 3, P.bark);
      dot(kx - 1, ky, P.trunkHi);
    }
    // placas de musgo (trepadeira diagonal no ombro esquerdo e base direita)
    const mossPatch = (x, y, w) => {
      px(x, y, w, 1, P.moss);
      px(x + 1, y - 1, Math.max(1, w - 2), 1, P.mossHi);
      dot(x + 1, y + 1, P.moss);
    };
    mossPatch(14, 31, 4); mossPatch(33, 40, 4); mossPatch(19, 41, 3); mossPatch(29, 18, 3);

    // ===== RAÍZES DA FRENTE (arcos grossos) =====
    const front = [
      [17, 41, 9, 40, 2, 46, 7], [31, 41, 39, 40, 46, 46, 7],
      [20, 44, 15, 43, 10, 46, 4], [28, 44, 33, 43, 38, 46, 4],
    ];
    for (const [x0, y0, cx, cy, x1, y1, w] of front) {
      curve(x0, y0, cx, cy, x1, y1, (k) => Math.max(2, Math.round(w * (1 - k * 0.55))), P.root);
      curve(x0, y0 - 1, cx, cy - 1, x1, y1 - 1, 1, P.rootHi);
    }
    // musgo em cima das raízes
    mossPatch(8, 43, 4); mossPatch(35, 43, 4); mossPatch(14, 43, 2);

    // raízes erguidas no ataque
    if (atk) {
      curve(6, 46, 1, 38, 6, 28, 3, P.root);
      curve(5, 46, 0, 38, 5, 28, 1, P.rootHi);
      px(4, 26, 2, 3, P.root); px(7, 26, 2, 3, P.root);
      curve(42, 46, 47, 38, 42, 28, 3, P.root);
      curve(43, 46, 48, 38, 43, 28, 1, P.rootHi);
      px(40, 26, 2, 3, P.root); px(43, 26, 2, 3, P.root);
    }

    // ===== GALHOS =====
    const dy = dropY;
    const limb = (pts, wFn) => {
      // pts: [x0,y0,cx,cy,x1,y1]
      curve(pts[0], pts[1], pts[2], pts[3] + dy, pts[4], pts[5] + dy, wFn, P.branch);
      curve(pts[0], pts[1] - 1, pts[2], pts[3] + dy - 1, pts[4], pts[5] + dy - 1, 1, P.branchHi);
    };
    const thick = (w0) => (k) => Math.max(1, Math.round(w0 * (1 - k * 0.75)));
    // braços superiores
    limb([18, 17, 12, 14, 3, 10], thick(4));      // esquerdo alto
    limb([30, 17, 36, 14, 45, 10], thick(4));     // direito alto
    limb([21, 14, 18, 8, 15, 3], thick(3));       // esq. subindo
    limb([27, 14, 30, 8, 33, 3], thick(3));       // dir. subindo
    limb([24, 13, 24, 8, 24, 2], thick(3));       // centro
    // braços horizontais pesados (como na imagem)
    limb([16, 21, 9, 20, 1, 22], thick(3));
    limb([32, 21, 39, 20, 47, 22], thick(3));
    // ramificações finas
    limb([8, 13, 5, 9, 4, 5], thick(2));
    limb([40, 13, 43, 9, 44, 5], thick(2));

    // ===== COPA EM TUFOS (quebrada, com vãos de luz) =====
    const clump = (cx, cy, rad) => {
      cy += dy;
      if (phase2) {
        // folhagem rala/esfarrapada: pontos soltos em vez de uma bola cheia
        for (let yy = -rad; yy <= rad; yy++) for (let xx = -rad; xx <= rad; xx++) {
          if (xx * xx + yy * yy > rad * rad + 1) continue;
          if (((xx + yy) & 1) && r() < 0.55) continue;
          dot(cx + xx, cy + yy, r() < 0.3 ? P.leafMid : P.leafDark);
        }
        for (let i = 0; i < rad; i++) dot(cx - 2 + Math.round(r() * 3), cy - 2 + Math.round(r() * 2), r() < 0.5 ? P.leafHi : P.leafEdge);
        return;
      }
      disc(cx, cy, rad, P.leafDark);
      disc(cx - 1, cy - 1, Math.max(1, rad - 1), P.leafMid);
      if (rad >= 3) disc(cx - 2, cy - 2, Math.max(1, rad - 3), P.leafHi);
      // borda irregular
      for (let i = 0; i < rad * 2; i++) {
        const a = r() * Math.PI * 2;
        const ex = Math.round(cx + Math.cos(a) * (rad + 1));
        const ey = Math.round(cy + Math.sin(a) * (rad + 0.5));
        dot(ex, ey, a > Math.PI ? P.leafEdge : P.leafDark);
      }
      // pontinhos de luz
      dot(cx - 2, cy - 2, P.leafEdge);
      if (rad >= 4) dot(cx + 1, cy - 3, P.leafEdge);
    };
    // fase 2: copa rala (menos tufos, galhos aparecem)
    const clumps = phase2 ? [
      [25, 4, 4], [9, 8, 4], [40, 8, 4], [15, 2, 3], [3, 14, 3], [45, 13, 3], [34, 3, 3],
    ] : [
      [25, 4, 5], [15, 2, 3], [34, 3, 3], [8, 8, 5], [40, 7, 5],
      [3, 14, 3], [45, 13, 3], [19, 9, 2], [30, 9, 2],
      [5, 22, 2], [43, 22, 2],
    ];
    for (const [cx, cy, rad] of clumps) clump(cx + (cy < 7 ? sway * 0 : 0), cy, rad);

    // ===== CIPÓS / MUSGO PENDENTE =====
    const vines = [
      [8, 13, 5], [11, 11, 4], [4, 15, 6], [2, 23, 5], [8, 21, 4],
      [40, 13, 5], [37, 11, 4], [44, 15, 6], [46, 23, 5], [40, 21, 4],
    ];
    for (const [vx, vy, len] of vines) {
      const l = phase2 ? Math.max(2, len - 2) : len;
      for (let i = 0; i < l; i++) {
        const off = (i > l * 0.5 ? sway : 0);
        dot(vx + off, vy + dy + i, i % 3 === 2 ? P.moss : P.vine);
      }
      dot(vx + (sway), vy + dy + l, P.mossHi);
    }

    // ===== RACHADURAS BRILHANTES (fase 2) =====
    if (phase2) {
      const cr = rng(31);
      g.fillStyle = 'rgba(255,120,40,0.9)';
      for (let i = 0; i < 4; i++) {
        let x = 24 + Math.round((cr() - 0.5) * 22);
        let y = 31 + Math.round(cr() * 6);
        for (let k = 0; k < 5; k++) {
          dot(x, y, '#ff7a28');
          x += Math.round((cr() - 0.5) * 3);
          y += 1;
        }
      }
    }

    // ===== NÚCLEO (fase 2 pulsando; fase 1 só uma brasa) =====
    if (phase2) {
      const pulse = step === 1 ? 1.15 : 0.9;
      const cy = 38;
      const gr = g.createRadialGradient(24, cy, 0, 24, cy, 8 * pulse);
      gr.addColorStop(0, 'rgba(255,245,190,0.95)');
      gr.addColorStop(0.4, 'rgba(255,200,80,0.75)');
      gr.addColorStop(1, 'rgba(255,100,20,0)');
      g.fillStyle = gr;
      g.fillRect(14, cy - 9, 20, 18);
      px(23, cy - 1, 3, 3, '#feca57');
      dot(23, cy - 1, '#fff5c0');
    } else {
      dot(24, 39, P.runeDim);
      if (step === 0) dot(24, 38, P.rune);
    }

    return c;
  }

  frames.idle[0]      = drawFrame('idle', false, 0);
  frames.idle[1]      = drawFrame('idle', false, 1);
  frames.attack[0]    = drawFrame('attack', false, 0);
  frames.phase2[0]    = drawFrame('idle', true, 0);
  frames.phase2[1]    = drawFrame('idle', true, 1);
  frames.attackPhase2 = [drawFrame('attack', true, 0)];

  return frames;
}

export const ENEMY_SPRITES = {
  slime: makeSlimeFrames(),
  rat: makeRatFrames(),
  goblin: makeGoblinFrames(),
  scorpion: makeScorpionFrames(),
  vulture: makeVultureFrames(),
  mummy: makeMummyFrames(),
  scarab: makeScarabFrames(), 
  bat: makeBatFrames(),
  goblin_sergeant: makeGoblinSergeantFrames(),
  guardian_fields: makeTreeMotherFrames(),
};