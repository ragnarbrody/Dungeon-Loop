import { ITEMS_DB, SET_BONUSES } from '../items.js';

export const VISIBLE_SLOTS = {
  down:  ['rightHand', 'leftHand'],
  up:    ['rightHand', 'leftHand'],
  right: ['leftHand'],
  left:  ['rightHand'],
};

export function makePx(g, bob) {
  return (x, y, w, h, color) => {
    g.fillStyle = color;
    g.fillRect(x, y + bob, w, h);
  };
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
      } else if (dir === 'left') {
        px(5, 12, 2, 11, blade);
        px(5, 12, 1, 11, bladeHi);
        px(6, 12, 1, 11, bladeSh);
        px(4, 22, 4, 1, hilt);
        px(5, 23, 2, 3, grip);
        px(5, 26, 2, 1, hilt);
      } else if (dir === 'right') {
        px(25, 12, 2, 11, blade);
        px(26, 12, 1, 11, bladeHi);
        px(25, 12, 1, 11, bladeSh);
        px(24, 22, 4, 1, hilt);
        px(25, 23, 2, 3, grip);
        px(25, 26, 2, 1, hilt);
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
      } else if (dir === 'left') {
        px(5, 10, 2, 13, blade);
        px(5, 10, 1, 13, bladeHi);
        px(6, 10, 1, 13, bladeSh);
        px(3, 23, 6, 1, hilt);
        px(5, 24, 2, 3, grip);
        px(5, 27, 2, 1, hilt);
        px(4, 22, 1, 1, gem);
      } else if (dir === 'right') {
        px(25, 10, 2, 13, blade);
        px(26, 10, 1, 13, bladeHi);
        px(25, 10, 1, 13, bladeSh);
        px(23, 23, 6, 1, hilt);
        px(25, 24, 2, 3, grip);
        px(25, 27, 2, 1, hilt);
        px(27, 22, 1, 1, gem);
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
      } else if (dir === 'left') {
        px(6, 12, 2, 13, handle);
        px(4, 12, 6, 4, head);
        px(4, 15, 6, 1, headSh);
      } else if (dir === 'right') {
        px(24, 12, 2, 13, handle);
        px(22, 12, 6, 4, head);
        px(22, 15, 6, 1, headSh);
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
      } else if (dir === 'left') {
        px(6, 10, 2, 15, handle);
        px(6, 10, 1, 15, handleHi);
        px(2, 10, 10, 5, head);
        px(2, 10, 10, 1, headHi);
        px(2, 14, 10, 1, headSh);
        px(7, 15, 1, 2, band);
      } else if (dir === 'right') {
        px(22, 10, 2, 15, handle);
        px(23, 10, 1, 15, handleHi);
        px(18, 10, 10, 5, head);
        px(18, 10, 10, 1, headHi);
        px(18, 14, 10, 1, headSh);
        px(22, 15, 1, 2, band);
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
      } else if (dir === 'left') {
        px(5, 10, 2, 16, wood);
        px(5, 10, 1, 16, woodSh);
        px(4, 7, 4, 4, gem);
        px(5, 8, 2, 2, gemHi);
      } else if (dir === 'right') {
        px(25, 10, 2, 16, wood);
        px(26, 10, 1, 16, woodSh);
        px(24, 7, 4, 4, gem);
        px(25, 8, 2, 2, gemHi);
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
      } else if (dir === 'left') {
        px(5, 10, 2, 16, wood);
        px(5, 10, 1, 16, woodSh);
        px(6, 10, 1, 16, woodHi);
        px(2, 6, 1, 8, gemGlow);
        px(3, 5, 1, 10, gemGlow);
        px(3, 6, 6, 5, gem);
        px(4, 7, 4, 3, gemHi);
        px(5, 8, 2, 2, '#ffffff');
      } else if (dir === 'right') {
        px(25, 10, 2, 16, wood);
        px(26, 10, 1, 16, woodSh);
        px(25, 10, 1, 16, woodHi);
        px(29, 6, 1, 8, gemGlow);
        px(28, 5, 1, 10, gemGlow);
        px(23, 6, 6, 5, gem);
        px(24, 7, 4, 3, gemHi);
        px(25, 8, 2, 2, '#ffffff');
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
      } else if (dir === 'left') {
        px(5, 14, 2, 8, blade);
        px(5, 14, 1, 8, bladeSh);
        px(4, 22, 4, 1, hilt);
        px(5, 23, 2, 2, grip);
      } else if (dir === 'right') {
        px(25, 14, 2, 8, blade);
        px(26, 14, 1, 8, bladeSh);
        px(24, 22, 4, 1, hilt);
        px(25, 23, 2, 2, grip);
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
      } else if (dir === 'left') {
        px(5, 12, 2, 11, blade);
        px(5, 12, 1, 11, bladeHi);
        px(6, 12, 1, 11, bladeSh);
        px(5, 12, 1, 11, edge);
        px(3, 23, 4, 1, hilt);
        px(4, 24, 2, 3, grip);
        px(4, 22, 1, 1, gem);
      } else if (dir === 'right') {
        px(25, 12, 2, 11, blade);
        px(26, 12, 1, 11, bladeHi);
        px(25, 12, 1, 11, bladeSh);
        px(26, 12, 1, 11, edge);
        px(23, 23, 4, 1, hilt);
        px(24, 24, 2, 3, grip);
        px(25, 22, 1, 1, gem);
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
      } else if (dir === 'right') {
        px(22, 10, 2, 1, wood);
        px(24, 11, 2, 1, wood);
        px(26, 12, 1, 8, wood);
        px(24, 20, 2, 1, wood);
        px(22, 21, 2, 1, wood);
        px(23, 11, 1, 1, woodHi);
        px(25, 12, 1, 8, woodHi);
        px(23, 20, 1, 1, woodHi);
        px(26, 13, 1, 6, woodSh);
        px(21, 10, 1, 1, string);
        px(20, 11, 1, 10, string);
        px(21, 21, 1, 1, string);
      } else if (dir === 'left') {
        px(8, 10, 2, 1, wood);
        px(6, 11, 2, 1, wood);
        px(5, 12, 1, 8, wood);
        px(6, 20, 2, 1, wood);
        px(8, 21, 2, 1, wood);
        px(8, 11, 1, 1, woodHi);
        px(6, 12, 1, 8, woodHi);
        px(8, 20, 1, 1, woodHi);
        px(5, 13, 1, 6, woodSh);
        px(10, 10, 1, 1, string);
        px(11, 11, 1, 10, string);
        px(10, 21, 1, 1, string);
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
      } else if (dir === 'right') {
        px(24, 10, 2, 1, wood);
        px(26, 11, 2, 1, wood);
        px(28, 12, 1, 8, wood);
        px(26, 20, 2, 1, wood);
        px(24, 21, 2, 1, wood);
        px(26, 11, 1, 1, woodHi);
        px(27, 12, 1, 8, woodHi);
        px(26, 20, 1, 1, woodHi);
        px(28, 13, 1, 6, woodSh);
        px(23, 10, 1, 1, string);
        px(22, 11, 1, 10, string);
        px(23, 21, 1, 1, string);
        px(27, 15, 1, 1, gold);
      } else if (dir === 'left') {
        px(10, 10, 2, 1, wood);
        px(8, 11, 2, 1, wood);
        px(5, 12, 1, 8, wood);
        px(8, 20, 2, 1, wood);
        px(10, 21, 2, 1, wood);
        px(10, 11, 1, 1, woodHi);
        px(6, 12, 1, 8, woodHi);
        px(10, 20, 1, 1, woodHi);
        px(5, 13, 1, 6, woodSh);
        px(13, 10, 1, 1, string);
        px(14, 11, 1, 10, string);
        px(13, 21, 1, 1, string);
        px(6, 15, 1, 1, gold);
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
  shield: {
    draw(g, dir, bob) {
      const px = makePx(g, bob);
      const rim    = '#c9a24d';
      const face   = '#9b1c1c';
      const emblem = '#e0e0e0';
      const shade  = '#6b1010';

      if (dir === 'down') {
        px(21, 15, 6, 8, rim);
        px(22, 16, 4, 6, face);
        px(22, 16, 4, 1, shade);
        px(23, 18, 2, 2, emblem);
      } else if (dir === 'up') {
        px(5, 15, 6, 8, rim);
        px(6, 16, 4, 6, face);
        px(6, 16, 4, 1, shade);
        px(7, 18, 2, 2, emblem);
      } else if (dir === 'right') {
        px(22, 15, 5, 8, rim);
        px(23, 16, 3, 6, face);
        px(23, 16, 3, 1, shade);
        px(23, 18, 1, 2, emblem);
      }
      // dir === 'left': slot nem é chamado
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

export function drawEquipment(g, dir, bob, equip) {
  const slots = VISIBLE_SLOTS[dir] || [];
  for (const slot of slots) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (item && typeof item.draw === 'function') {
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