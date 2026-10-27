import { ITEMS_DB } from '../items.js';

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
// BÔNUS DE ARMA (soma dos stats da arma direita + esquerda)
// ============================================================
export function weaponBonus(equip) {
  const bonus = { str: 0, agi: 0, int: 0, def: 0, vit: 0 };

  for (const slot of ['rightHand', 'leftHand']) {
    const itemId = equip[slot];
    if (!itemId) continue;
    const item = ITEMS_DB[itemId];
    if (!item || !item.stats) continue;
    for (const k in item.stats) {
      if (bonus[k] !== undefined) bonus[k] += item.stats[k];
    }
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