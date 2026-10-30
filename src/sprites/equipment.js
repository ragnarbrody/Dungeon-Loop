import { ITEMS_DB, SET_BONUSES } from '../items.js';

export const VISIBLE_SLOTS = {
  down:  ['rightHand', 'leftHand'],
  up:    ['rightHand', 'leftHand'],
  right: ['rightHand'],   // ← corpo virado pra direita, arma à frente
  left:  ['leftHand'],    // ← corpo virado pra esquerda, escudo à frente
};

export const BEHIND_SLOTS = {
  left: ['rightHand'],
};

export function makePx(g, bob) {
  return (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y + bob, w, h);
  };
}


// ============================================================
// AJUDAS PARA ARMAS DE LADO (dir 'left' / 'right')
// Tudo é calculado a partir de UM eixo que passa pela mão, então
// lâmina, guarda e cabo ficam sempre alinhados (sem cabo invertido).
//   gx, gy = onde a mão segura | k = inclinação (px por linha)
//   Acima da mão o eixo vai pra FRENTE (x cresce); abaixo, volta.
// ============================================================
const SPRITE_W = 32;

// Espelha o desenho "virado pra direita" pra servir de "virado pra esquerda".
export function mirrorPx(px) {
  return (x, y, w, h, c) => px(SPRITE_W - x - w, y, w, h, c);
}

// Quantos pixels as armas de lado ficam mais perto do corpo.
// Aumente pra aproximar mais, diminua (ou 0) pra afastar.
const SIDE_OFFSET_X = -2;

// px já deslocado e, se for 'left', espelhado.
function sidePx(px, dir) {
  const shifted = (x, y, w, h, c) => px(x + SIDE_OFFSET_X, y, w, h, c);
  return dir === 'left' ? mirrorPx(shifted) : shifted;
}

const axisX = (gx, gy, k) => (y) => gx + Math.round((gy - y) * k);

// Espadas e adagas
function drawBladeSide(px, o) {
  const gx = o.gx ?? 24, gy = o.gy ?? 21;
  const X = axisX(gx, gy, o.k);
  // lâmina (da ponta até a guarda)
  for (let y = o.tipY; y < gy; y++) {
    const x = X(y);
    px(x,     y, 1, 1, o.hi || o.blade);
    px(x + 1, y, 1, 1, o.sh);
  }
  if (o.edge) px(X(o.tipY), o.tipY, 2, 1, o.edge);
  // guarda (perpendicular, centrada no eixo)
  px(X(gy) - Math.floor((o.guardW - 2) / 2), gy, o.guardW, 1, o.hilt);
  if (o.gem) px(X(gy), gy, 2, 1, o.gem);
  // cabo: continua o eixo PRA BAIXO (vai se afastando da ponta)
  for (let i = 1; i <= o.gripLen; i++) px(X(gy + i), gy + i, 2, 1, o.grip);
  px(X(gy + o.gripLen + 1), gy + o.gripLen + 1, 2, 1, o.hilt); // pomo
}

// Cajados: cabo na mão, topo (gema) inclinado PRA FRENTE, longe do corpo
function drawStaffSide(px, o) {
  const X = axisX(24, 22, o.k);
  for (let y = o.topY; y <= o.bottomY; y++) {
    const x = X(y);
    px(x,     y, 1, 1, o.wood);
    px(x + 1, y, 1, 1, o.woodSh);
  }
  o.gemFn(X(o.topY));
}

// Machados: cabo na mão e cabeça PRESA no topo do cabo
function drawAxeSide(px, o) {
  const X = axisX(o.gx, 22, o.k);
  for (let y = o.topY; y <= o.bottomY; y++) {
    const x = X(y);
    px(x,     y, 1, 1, o.handleHi || o.handle);
    px(x + 1, y, 1, 1, o.handle);
  }
  o.headFn(X(o.topY));
}

// ============================================================
// AJUDAS PARA ESCUDOS
// Cada silhueta é uma lista de linhas [xInicial, largura].
// Camadas: contorno (n=0), aro metálico (n=1), miolo (n=2).
// ============================================================
const SHIELD_SIL = {
  round:     [[2,4],[1,6],[0,8],[0,8],[0,8],[0,8],[0,8],[1,6],[2,4]],
  roundSide: [[1,4],[0,6],[0,6],[0,6],[0,6],[0,6],[0,6],[0,6],[1,4]],
  kite:      [[1,6],[0,8],[0,8],[0,8],[0,8],[0,8],[1,6],[1,6],[2,4],[3,2]],
  kiteSide:  [[1,4],[0,6],[0,6],[0,6],[0,6],[0,6],[1,4],[1,4],[2,2],[2,2]],
};

// Preenche a silhueta encolhida em n pixels (n=0 contorno, 1 aro, 2 miolo)
function fillSil(px, ox, oy, sil, n, color) {
  for (let r = n; r < sil.length - n; r++) {
    const [x0, w] = sil[r];
    const ww = w - 2 * n;
    if (ww > 0) px(ox + x0 + n, oy + r, ww, 1, color);
  }
}

function drawShieldBase(px, ox, oy, sil, c) {
  fillSil(px, ox, oy, sil, 0, c.outline);
  fillSil(px, ox, oy, sil, 1, c.rim);
  fillSil(px, ox, oy, sil, 2, c.face);

  // luz no aro e no miolo (parte de cima)
  const t = sil[1];
  px(ox + t[0] + 1, oy + 1, t[1] - 2, 1, c.rimHi);
  const f = sil[2];
  px(ox + f[0] + 2, oy + 2, f[1] - 4, 1, c.faceHi);

  // sombra no aro (lado direito)
  for (let r = 2; r < sil.length - 2; r++) {
    const [x0, w] = sil[r];
    px(ox + x0 + w - 2, oy + r, 1, 1, c.rimSh);
  }
}

// Escudo redondo: tábua central + umbo metálico
function woodDeco(px, ox, oy, wide, c) {
  if (wide) {
    px(ox + 4, oy + 2, 1, 5, c.faceSh);      // emenda das tábuas
    px(ox + 2, oy + 2, 1, 5, c.faceHi);      // brilho na tábua da esquerda
    px(ox + 3, oy + 3, 2, 2, c.boss);        // umbo
    px(ox + 3, oy + 3, 1, 1, c.bossHi);
    px(ox + 4, oy + 4, 1, 1, c.bossSh);
  } else {
    px(ox + 2, oy + 3, 2, 2, c.boss);
    px(ox + 2, oy + 3, 1, 1, c.bossHi);
    px(ox + 3, oy + 4, 1, 1, c.bossSh);
  }
}

// Escudo kite: emblema em cruz
function crossDeco(px, ox, oy, wide, c) {
  if (wide) {
    px(ox + 3, oy + 3, 2, 5, c.emblem);      // vertical
    px(ox + 2, oy + 4, 4, 1, c.emblem);      // travessa
    px(ox + 3, oy + 3, 2, 1, c.emblemHi);    // brilho no topo
  } else {
    px(ox + 2, oy + 3, 2, 3, c.emblem);
    px(ox + 2, oy + 3, 2, 1, c.emblemHi);
  }
}

function drawShieldDir(px, dir, sil, silSide, deco, c) {
  if (dir === 'down')       { drawShieldBase(px, 20, 13, sil, c);     deco(px, 20, 13, true,  c); }
  else if (dir === 'up')    { drawShieldBase(px, 4,  13, sil, c);     deco(px, 4,  13, true,  c); }
  else if (dir === 'right') { drawShieldBase(px, 22, 13, silSide, c); deco(px, 22, 13, false, c); }
  // 'left' é desenhado espelhando o 'right' (ver drawEquipment)
}

// ============================================================
// DRAWERS: apenas as funções de desenho no personagem.
// Os stats, nome, preço etc. vêm do ITEMS_DB (em ../items.js).
// ============================================================
const DRAWERS = {
  // ---------------- ESPADA (mão direita) ----------------
  sword: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const blade   = '#dfe6ee';
      const bladeHi = '#ffffff';
      const bladeSh = '#9aa6b2';
      const hilt    = '#c9a24d';
      const grip    = '#5a3a1a';

      if (dir === 'down') {
        px(8, 10, 2, 12, blade);
        px(8, 10, 1, 12, bladeHi);
        px(9, 10, 1, 12, bladeSh);
        px(7, 22, 4, 1, hilt);
        px(8, 23, 2, 3, grip);
        px(8, 26, 2, 1, hilt);
      } else if (dir === 'up') {
        px(22, 8, 2, 12, blade);
        px(22, 8, 1, 12, bladeHi);
        px(23, 8, 1, 12, bladeSh);
        px(21, 20, 4, 1, hilt);
        px(22, 21, 2, 3, grip);
        px(22, 24, 2, 1, hilt);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawBladeSide(p, { tipY: 9, k: 0.22, guardW: 6, gripLen: 3, blade, hi: bladeHi, sh: bladeSh, hilt, grip });
      }
    },
  },

  // ---------------- ESPADA DE AÇO (mão direita) ----------------
  steel_sword: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const blade   = '#c8d0d8';
      const bladeHi = '#e8f0f8';
      const bladeSh = '#7a8290';
      const hilt    = '#a87a3a';
      const grip    = '#4a2a1a';
      const gem     = '#c93030';

      if (dir === 'down') {
        px(8, 8, 2, 14, blade);
        px(8, 8, 1, 14, bladeHi);
        px(9, 8, 1, 14, bladeSh);
        px(6, 22, 6, 1, hilt);
        px(8, 23, 2, 3, grip);
        px(8, 26, 2, 1, hilt);
        px(8, 21, 2, 1, gem);
      } else if (dir === 'up') {
        px(22, 8, 2, 14, blade);
        px(22, 8, 1, 14, bladeHi);
        px(23, 8, 1, 14, bladeSh);
        px(20, 22, 6, 1, hilt);
        px(22, 23, 2, 3, grip);
        px(22, 26, 2, 1, hilt);
        px(22, 21, 2, 1, gem);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawBladeSide(p, { tipY: 7, k: 0.2, guardW: 7, gripLen: 3, blade, hi: bladeHi, sh: bladeSh, hilt, grip, gem });
      }
    },
  },

  // ---------------- MACHADO (mão direita) ----------------
  axe: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const handle = '#6b4a2b';
      const head   = '#bfc6cf';
      const headSh = '#7d8792';

      if (dir === 'down') {
        px(8, 10, 2, 14, handle);
        px(6, 10, 6, 4, head);
        px(6, 13, 6, 1, headSh);
      } else if (dir === 'up') {
        px(22, 8, 2, 14, handle);
        px(20, 8, 6, 4, head);
        px(20, 11, 6, 1, headSh);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        const headHi = '#dfe6ee';
        drawAxeSide(p, {
          gx: 24, k: 0.1, topY: 7, bottomY: 26, handle,
          headFn: (x) => {           // x = coluna do topo do cabo
            p(x + 1, 7,  4, 1, headHi);
            p(x - 1, 8,  6, 1, head);
            p(x - 1, 9,  7, 3, head);
            p(x + 5, 9,  1, 3, headHi);   // fio do machado
            p(x - 1, 12, 6, 1, headSh);
            p(x + 1, 13, 4, 1, headSh);
          },
        });
      }
    },
  },

  // ---------------- MACHADO DE GUERRA (mão direita) ----------------
  war_axe: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const handle = '#4a2a1a';
      const handleHi = '#6b4a2b';
      const head   = '#a8b0b8';
      const headHi = '#d8e0e8';
      const headSh = '#5a6268';
      const band   = '#c9a24d';

      if (dir === 'down') {
        px(9, 6, 2, 16, handle);
        px(9, 6, 1, 16, handleHi);
        px(5, 8, 10, 5, head);
        px(5, 8, 10, 1, headHi);
        px(5, 12, 10, 1, headSh);
        px(9, 13, 2, 1, band);
      } else if (dir === 'up') {
        px(19, 6, 2, 16, handle);
        px(19, 6, 1, 16, handleHi);
        px(15, 8, 10, 5, head);
        px(15, 8, 10, 1, headHi);
        px(15, 12, 10, 1, headSh);
        px(19, 13, 2, 1, band);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawAxeSide(p, {
          gx: 26, k: 0.07, topY: 7, bottomY: 26, handle, handleHi,
          headFn: (x) => {
            p(x - 1, 6,  5, 1, headHi);
            p(x - 3, 7,  8, 5, head);
            p(x - 3, 7,  8, 1, headHi);
            p(x + 4, 8,  1, 3, headHi);   // fio do machado
            p(x - 2, 12, 6, 1, headSh);
            p(x - 1, 13, 4, 1, headSh);
            p(x - 1, 15, 2, 1, band);     // faixa dourada no cabo
          },
        });
      }
    },
  },

  // ---------------- CAJADO (mão direita, mago) ----------------
  staff: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const wood  = '#6b4a2b';
      const woodSh = '#4a3018';
      const gem   = '#8ad8ff';
      const gemHi = '#e8f6ff';

      if (dir === 'down') {
        px(8, 8, 2, 18, wood);
        px(9, 8, 1, 18, woodSh);
        px(7, 5, 4, 4, gem);
        px(8, 6, 2, 2, gemHi);
      } else if (dir === 'up') {
        px(22, 8, 2, 18, wood);
        px(22, 8, 1, 18, woodSh);
        px(21, 5, 4, 4, gem);
        px(22, 6, 2, 2, gemHi);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawStaffSide(p, {
          k: 0.15, topY: 9, bottomY: 27, wood, woodSh,
          gemFn: (x) => {            // x = coluna do topo do cabo
            p(x - 1, 5, 4, 4, gem);
            p(x,     6, 2, 2, gemHi);
          },
        });
      }
    },
  },

  // ---------------- CAJADO ARCANO (mão direita) ----------------
  arcane_staff: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const wood   = '#3a2a5a';
      const woodHi = '#5a4a7a';
      const woodSh = '#1a0a3a';
      const gem    = '#a8e8ff';
      const gemHi  = '#e8f8ff';
      const gemGlow = 'rgba(168, 232, 255, 0.6)';

      if (dir === 'down') {
        px(8, 6, 2, 20, wood);
        px(9, 6, 1, 20, woodSh);
        px(8, 6, 1, 20, woodHi);
        // Glow suave ao redor da gema
        px(5, 2, 8, 1, gemGlow);
        px(4, 3, 10, 1, gemGlow);
        // Gema (maior que do staff comum)
        px(6, 3, 6, 5, gem);
        px(7, 4, 4, 3, gemHi);
        px(8, 5, 2, 2, '#ffffff');
      } else if (dir === 'up') {
        px(22, 6, 2, 20, wood);
        px(22, 6, 1, 20, woodSh);
        px(23, 6, 1, 20, woodHi);
        px(19, 2, 8, 1, gemGlow);
        px(18, 3, 10, 1, gemGlow);
        px(20, 3, 6, 5, gem);
        px(21, 4, 4, 3, gemHi);
        px(22, 5, 2, 2, '#ffffff');
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawStaffSide(p, {
          k: 0.15, topY: 8, bottomY: 27, wood: woodHi, woodSh: woodSh,
          gemFn: (x) => {
            p(x - 3, 2, 8, 1, gemGlow);
            p(x - 4, 3, 10, 1, gemGlow);
            p(x - 2, 3, 6, 5, gem);
            p(x - 1, 4, 4, 3, gemHi);
            p(x,     5, 2, 2, '#ffffff');
          },
        });
      }
    },
  },

  // ---------------- ADAGA (mão direita, ladrão) ----------------
  dagger: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const blade   = '#dfe6ee';
      const bladeSh = '#9aa6b2';
      const hilt    = '#c9a24d';
      const grip    = '#5a3a1a';

      if (dir === 'down') {
        px(8, 12, 2, 8, blade);
        px(9, 12, 1, 8, bladeSh);
        px(7, 20, 4, 1, hilt);
        px(8, 21, 2, 2, grip);
      } else if (dir === 'up') {
        px(22, 12, 2, 8, blade);
        px(22, 12, 1, 8, bladeSh);
        px(21, 20, 4, 1, hilt);
        px(22, 21, 2, 2, grip);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawBladeSide(p, { tipY: 13, k: 0.3, guardW: 5, gripLen: 2, blade, sh: bladeSh, hilt, grip });
      }
    },
  },

  // ---------------- ADAGA DAS SOMBRAS (mão direita) ----------------
  shadow_dagger: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const blade   = '#2a1a3e';
      const bladeHi = '#6a4a8a';
      const bladeSh = '#1a0a2a';
      const edge    = '#a87aff';   // fio da lâmina (magia)
      const hilt    = '#8a5a3a';
      const grip    = '#3a1a0a';
      const gem     = '#d78cff';

      if (dir === 'down') {
        px(8, 10, 2, 12, blade);
        px(8, 10, 1, 12, bladeHi);
        px(9, 10, 1, 12, bladeSh);
        px(8, 10, 2, 1, edge);          // fio mágico no topo
        px(7, 22, 4, 1, hilt);
        px(8, 23, 2, 3, grip);
        px(8, 21, 2, 1, gem);           // gema no pomo
      } else if (dir === 'up') {
        px(22, 10, 2, 12, blade);
        px(22, 10, 1, 12, bladeHi);
        px(23, 10, 1, 12, bladeSh);
        px(22, 10, 2, 1, edge);
        px(21, 22, 4, 1, hilt);
        px(22, 23, 2, 3, grip);
        px(22, 21, 2, 1, gem);
      } else if (dir === 'left' || dir === 'right') {
        const p = sidePx(px, dir);
        drawBladeSide(p, { tipY: 11, k: 0.3, guardW: 5, gripLen: 3, blade, hi: bladeHi, sh: bladeSh, edge, hilt, grip, gem });
      }
    },
  },

  // ---------------- ARCO (mão direita, caçadora) ----------------
  bow: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const wood   = '#6b4a2b';
      const woodHi = '#8a6a3a';
      const woodSh = '#3a2410';
      const string = '#e8e8e8';

      if (dir === 'down') {
        px(25, 7,  1, 2, wood);
        px(26, 8,  1, 2, wood);
        px(26, 10, 1, 12, wood);
        px(25, 22, 1, 2, wood);
        px(24, 24, 1, 2, wood);
        px(24, 10, 1, 12, woodHi);
        px(25, 8,  1, 1,  woodHi);
        px(25, 23, 1, 1,  woodHi);
        px(27, 12, 1, 8,  woodSh);
        px(26, 9,  1, 1,  woodSh);
        px(26, 22, 1, 1,  woodSh);
        px(24, 9,  1, 1,  string);
        px(23, 10, 1, 12, string);
        px(24, 22, 1, 1,  string);
      } else if (dir === 'up') {
        px(7, 7,  1, 2, wood);
        px(6, 8,  1, 2, wood);
        px(6, 10, 1, 12, wood);
        px(7, 22, 1, 2, wood);
        px(8, 24, 1, 2, wood);
        px(8, 10, 1, 12, woodHi);
        px(7, 8,  1, 1,  woodHi);
        px(7, 23, 1, 1,  woodHi);
        px(5, 12, 1, 8,  woodSh);
        px(6, 9,  1, 1,  woodSh);
        px(6, 22, 1, 1,  woodSh);
        px(8, 9,  1, 1,  string);
        px(9, 10, 1, 12, string);
        px(8, 22, 1, 1,  string);
      } else if (dir === 'left') {
        // Arco de perfil: corpo curvado pra frente (esquerda),
        // corda reta atrás. A curva "abre" pra esquerda.
        // Corpo superior (curva)
        px(6, 8, 1, 2, wood);
        px(5, 10, 1, 2, wood);
        px(4, 12, 1, 2, wood);
        px(4, 14, 1, 2, wood);          // parte mais "pra fora"
        px(4, 16, 1, 2, wood);
        px(5, 18, 1, 2, wood);
        px(6, 20, 1, 2, wood);
        // Brilho interno
        px(6, 9, 1, 1, woodHi);
        px(5, 11, 1, 1, woodHi);
        px(4, 13, 1, 1, woodHi);
        px(5, 19, 1, 1, woodHi);
        // Sombra
        px(5, 12, 1, 2, woodSh);
        px(5, 16, 1, 2, woodSh);
        // Corda (reta vertical, atrás do arco)
        px(8, 7, 1, 1, string);
        px(9, 8, 1, 14, string);
        px(8, 22, 1, 1, string);
      } else if (dir === 'right') {
        px(25, 8, 1, 2, wood);
        px(26, 10, 1, 2, wood);
        px(27, 12, 1, 2, wood);
        px(27, 14, 1, 2, wood);
        px(27, 16, 1, 2, wood);
        px(26, 18, 1, 2, wood);
        px(25, 20, 1, 2, wood);
        px(25, 9, 1, 1, woodHi);
        px(26, 11, 1, 1, woodHi);
        px(27, 13, 1, 1, woodHi);
        px(26, 19, 1, 1, woodHi);
        px(26, 12, 1, 2, woodSh);
        px(26, 16, 1, 2, woodSh);
        px(23, 7, 1, 1, string);
        px(22, 8, 1, 14, string);
        px(23, 22, 1, 1, string);
      }
    },
  },

  // ---------------- ARCO DO GUARDIÃO (mão direita) ----------------
  ranger_bow: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const wood   = '#4a2a1a';
      const woodHi = '#8a5a3a';
      const woodSh = '#2a1a0a';
      const string = '#e8e8d8';
      const gold   = '#c9a24d';

      if (dir === 'down') {
        px(26, 5, 1, 2, wood);
        px(27, 7, 1, 2, wood);
        px(27, 9, 1, 14, wood);
        px(26, 23, 1, 2, wood);
        px(25, 25, 1, 2, wood);
        px(26, 9, 1, 14, woodHi);
        px(27, 10, 1, 10, woodSh);
        // Corda
        px(25, 7, 1, 1, string);
        px(24, 8, 1, 14, string);
        px(25, 23, 1, 1, string);
        // Enfeite dourado (miçanga no meio)
        px(26, 15, 1, 1, gold);
      } else if (dir === 'up') {
        px(7, 5, 1, 2, wood);
        px(6, 7, 1, 2, wood);
        px(6, 9, 1, 14, wood);
        px(7, 23, 1, 2, wood);
        px(8, 25, 1, 2, wood);
        px(8, 9, 1, 14, woodHi);
        px(7, 10, 1, 10, woodSh);
        px(8, 7, 1, 1, string);
        px(9, 8, 1, 14, string);
        px(8, 23, 1, 1, string);
        px(7, 15, 1, 1, gold);
      } else if (dir === 'left') {
        // Arco do guardião: mais comprido e curvado
        px(7, 5, 1, 2, wood);
        px(6, 7, 1, 2, wood);
        px(4, 9, 1, 2, wood);
        px(3, 11, 1, 2, wood);
        px(3, 13, 1, 3, wood);          // parte mais "pra fora"
        px(4, 16, 1, 2, wood);
        px(5, 18, 1, 2, wood);
        px(6, 20, 1, 2, wood);
        px(7, 22, 1, 2, wood);
        // Brilho interno
        px(5, 10, 1, 1, woodHi);
        px(4, 12, 1, 1, woodHi);
        px(4, 14, 1, 1, woodHi);
        px(5, 19, 1, 1, woodHi);
        // Sombra
        px(5, 11, 1, 2, woodSh);
        px(5, 15, 1, 2, woodSh);
        // Corda
        px(9, 4, 1, 1, string);
        px(10, 5, 1, 18, string);
        px(9, 23, 1, 1, string);
        // Miçanga dourada
        px(4, 14, 1, 1, gold);
      } else if (dir === 'right') {
        px(24, 5, 1, 2, wood);
        px(25, 7, 1, 2, wood);
        px(27, 9, 1, 2, wood);
        px(28, 11, 1, 2, wood);
        px(28, 13, 1, 3, wood);
        px(27, 16, 1, 2, wood);
        px(26, 18, 1, 2, wood);
        px(25, 20, 1, 2, wood);
        px(24, 22, 1, 2, wood);
        px(26, 10, 1, 1, woodHi);
        px(27, 12, 1, 1, woodHi);
        px(27, 14, 1, 1, woodHi);
        px(26, 19, 1, 1, woodHi);
        px(26, 11, 1, 2, woodSh);
        px(26, 15, 1, 2, woodSh);
        px(22, 4, 1, 1, string);
        px(21, 5, 1, 18, string);
        px(22, 23, 1, 1, string);
        px(27, 14, 1, 1, gold);
      }
    },
  },

  // ---------------- TOCHA (mão esquerda) ----------------
  torch: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const wood  = '#5a3a1a';
      const fire  = '#ffb703';
      const fire2 = '#fb8500';

      if (dir === 'down') {
        px(23, 14, 2, 8, wood);
        px(22, 12, 4, 3, fire);
        px(23, 11, 2, 2, fire2);
      } else if (dir === 'up') {
        px(7, 14, 2, 8, wood);
        px(6, 12, 4, 3, fire);
        px(7, 11, 2, 2, fire2);
      } else if (dir === 'right') {
        px(23, 14, 2, 8, wood);
        px(22, 12, 4, 3, fire);
        px(23, 11, 2, 2, fire2);
      }
    },
  },

  // ---------------- ESCUDO (mão esquerda) ----------------
  // Escudo de madeira: redondo, com aro metálico e umbo central.
  // Pequeno (7x8) pra não cobrir o corpo. Fica na lateral do player,
  // acompanhando a direção (mesmo `ox`/`oy` que a tocha usa).
  // ---------------- ESCUDO DE MADEIRA (mão esquerda) ----------------
  shield: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const c = {
        outline: '#2a1a10',
        rim: '#a8b0b8', rimHi: '#d8e0e8', rimSh: '#6a7280',
        face: '#8a5a3a', faceHi: '#a87a5a', faceSh: '#5a3a24',
        boss: '#c8d0d8', bossHi: '#ffffff', bossSh: '#7a8290',
      };
      drawShieldDir(px, dir, SHIELD_SIL.round, SHIELD_SIL.roundSide, woodDeco, c);
    },
  },

  // ---------------- ESCUDO DE FERRO (mão esquerda) ----------------
  // Formato "kite" (gota invertida): topo largo, ponta embaixo.
  // Escuro, com emblema dourado em cruz.
  // ---------------- ESCUDO DE FERRO (mão esquerda) ----------------
  iron_shield: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const c = {
        outline: '#12121a',
        rim: '#7a8290', rimHi: '#b0b8c4', rimSh: '#4a5260',
        face: '#3a3a44', faceHi: '#5a5a68',
        emblem: '#c9a24d', emblemHi: '#f0d078',
      };
      drawShieldDir(px, dir, SHIELD_SIL.kite, SHIELD_SIL.kiteSide, crossDeco, c);
    },
  },

  // ---------------- ESCUDO RÚNICO (mão esquerda) ----------------
  // Mesmo formato kite do ferro, mas aço escuro com runa roxa brilhante.
  // ---------------- ESCUDO RÚNICO (mão esquerda) ----------------
  runic_shield: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const c = {
        outline: '#08080e',
        rim: '#4a4a58', rimHi: '#7a7a92', rimSh: '#2a2a36',
        face: '#25252e', faceHi: '#3a3a48',
        emblem: '#a87aff', emblemHi: '#e0c8ff',
      };
      drawShieldDir(px, dir, SHIELD_SIL.kite, SHIELD_SIL.kiteSide, crossDeco, c);
    },
  },
  
};

// ============================================================
// INJEÇÃO: liga cada função de desenho no ITEMS_DB.
// ============================================================
for (const id in DRAWERS) {
  if (ITEMS_DB[id]) {
    ITEMS_DB[id].draw = DRAWERS[id].draw;
  }
}

// Compatibilidade: alguns arquivos (ex.: compose.js) importam `ITEMS`
// daqui. Exporta um alias para o banco unificado, já com os draws ligados.
export const ITEMS = ITEMS_DB;

// ============================================================
// BÔNUS DE CONJUNTO
// Retorna { stat: amount } do conjunto ativo (ou {} se nenhum).
// ============================================================
export function getSetBonus(equip) {
  const active = {};
  const equippedIds = new Set();
  for (const slot of ['helmet', 'amulet', 'rightHand', 'armor', 'leftHand', 'ring1', 'boots', 'ring2']) {
    const id = equip[slot];
    if (id) equippedIds.add(id);
  }

  for (const setId in SET_BONUSES) {
    const set = SET_BONUSES[setId];
    const complete = set.pieces.every(id => equippedIds.has(id));
    if (!complete) continue;
    for (const stat in set.bonus) {
      active[stat] = (active[stat] || 0) + set.bonus[stat];
    }
  }
  return active;
}

// ============================================================
// BÔNUS DE ARMA (soma dos stats da arma direita + esquerda)
// ============================================================
export function weaponBonus(equip) {
  const bonus = { str: 0, agi: 0, int: 0, def: 0, vit: 0, magia: 0 };

  // Todos os slots de equipamento (menos "torch" e "shield" já são cobertos,
  // mas os slots "armor", "helmet", "boots", "amulet", "ring1", "ring2"
  // também precisam entrar)
  const slots = ['rightHand', 'leftHand', 'helmet', 'armor', 'boots', 'amulet', 'ring1', 'ring2'];

  for (const slot of slots) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (!item || !item.stats) continue;
    for (const k in item.stats) {
      if (bonus[k] !== undefined) bonus[k] += item.stats[k];
    }
  }

  // Bônus de conjunto
  const setBonus = getSetBonus(equip);
  for (const k in setBonus) {
    if (bonus[k] !== undefined) bonus[k] += setBonus[k];
  }

  return bonus;
}

// ============================================================
// ITEM_INFO (compatibilidade com o inventário)
// Deriva automaticamente do ITEMS_DB.
// ============================================================
export const ITEM_INFO = {};
for (const [id, it] of Object.entries(ITEMS_DB)) {
  ITEM_INFO[id] = { name: it.name, icon: it.icon };
}

// ============================================================
// EQUIPAMENTO DO JOGADOR
// ============================================================
export const playerEquip = {
  rightHand: 'sword',
  leftHand:  null,
};

// Desenha o item usando o desenho 'right', espelhado horizontalmente.
// Serve pra qualquer item que só tenha desenho 'right' (escudo, tocha...).
function drawMirrored(g, item, bob, shiftX = 0) {
  g.save();
  g.translate(shiftX, 0);
  g.translate(SPRITE_W, 0);
  g.scale(-1, 1);
  item.draw(g, 'right', bob);
  g.restore();
}

// Ajuste fino: positivo = empurra a arma pra DENTRO (pro lado do corpo),
// negativo = empurra pra fora.
const BEHIND_SHIFT_X = 0;

export function drawEquipmentBehind(g, dir, bob, equip) {
  const slots = BEHIND_SLOTS[dir] || [];
  for (const slot of slots) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (!item || typeof item.draw !== 'function') continue;
    drawMirrored(g, item, bob, BEHIND_SHIFT_X);
  }
}

export function drawEquipment(g, dir, bob, equip) {
  const slots = VISIBLE_SLOTS[dir] || [];
  for (const slot of slots) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (!item || typeof item.draw !== 'function') continue;

    // Mão esquerda virado pra esquerda: espelha o desenho 'right'
    if (dir === 'left' && slot === 'leftHand') {
      drawMirrored(g, item, bob);
    } else {
      item.draw(g, dir, bob);
    }
  }
}

// Retorna { stat: [{ itemId, amount, slot }] } — de onde vem cada bônus de
// equipamento. Usado pra tooltip do inventário ("+2 de Espada", etc).
// Versão estendida: inclui bônus de conjunto com `name` = nome do conjunto.
export function getEquipBonusSources(equip) {
  const out = {};
  const slots = ['helmet', 'amulet', 'rightHand', 'armor', 'leftHand', 'ring1', 'boots', 'ring2'];
  for (const slot of slots) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (!item || !item.stats) continue;
    for (const k in item.stats) {
      if (!out[k]) out[k] = [];
      out[k].push({ itemId, name: item.name, amount: item.stats[k], slot });
    }
  }

  // Bônus de conjunto (aparece como uma fonte extra)
  const setBonus = getSetBonus(equip);
  const equippedIds = new Set(slots.map(s => equip[s]).filter(Boolean));
  for (const setId in SET_BONUSES) {
    const set = SET_BONUSES[setId];
    const complete = set.pieces.every(id => equippedIds.has(id));
    if (!complete) continue;
    for (const k in set.bonus) {
      if (!out[k]) out[k] = [];
      out[k].push({
        itemId: `__set_${setId}`,
        name: `${set.name} (conjunto)`,
        amount: set.bonus[k],
        slot: 'set',
      });
    }
  }

  return out;
}

export function resetEquipment() {
  playerEquip.helmet = null;
  playerEquip.amulet = null;
  playerEquip.rightHand = null;
  playerEquip.leftHand = null;
  playerEquip.armor = null;
  playerEquip.ring1 = null;
  playerEquip.boots = null;
  playerEquip.ring2 = null;
}