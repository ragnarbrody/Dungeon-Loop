// ============================================================
// BANCO UNIFICADO DE ITENS
// - consumable: poções e buffs (usáveis fora de combate)
// - weapon: arma (rightHand)
// - shield: escudo (leftHand)
// - torch: tocha (leftHand)
// - accessory: anel/amuleto (futuro)
// - material: loot, ingrediente de craft (futuro)
// ============================================================

export const ITEMS_DB = {
  // ============================================================
  // CONSUMÍVEIS
  // ============================================================
  potion_weak: {
    id: 'potion_weak',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Cura Fraca',
    description: 'Cura de 5 a 10 de HP.',
    price: 10,
    sellPrice: 4,      // preço de venda
    rarity: 'common',
    stackable: true,
    stackCap: 10,
    combatOnly: false,
    icon: 'potion_weak',      // chave usada em drawIconOnCanvas / getIcon
    use: (player) => {
      const heal = Math.floor(Math.random() * 6) + 5;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      return {
        message: `Você bebeu uma Poção de Cura Fraca e recuperou ${heal} de HP!`,
        toast: {
          itemId: 'potion_weak',
          title: 'Poção de Cura Fraca',
          subtitle: `+${heal} HP`,
          color: '#6fbd63',
        },
      };
    },
  },

  potion_medium: {
    id: 'potion_medium',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Cura Média',
    description: 'Cura de 20 a 35 de HP.',
    price: 35,
    sellPrice: 15,      // preço de venda
    rarity: 'uncommon',
    stackable: true,
    stackCap: 5,
    combatOnly: false,
    icon: 'potion_medium',
    use: (player) => {
      const heal = Math.floor(Math.random() * 16) + 20;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      return {
        message: `Você bebeu uma Poção Média e recuperou ${heal} de HP!`,
        toast: {
          itemId: 'potion_medium',
          title: 'Poção de Cura Média',
          subtitle: `+${heal} HP`,
          color: '#6fbd63',
        },
      };
    },
  },

  potion_strong: {
    id: 'potion_strong',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Cura Forte',
    description: 'Cura de 50 a 70 de HP.',
    price: 80,
    sellPrice: 35,      // preço de venda
    rarity: 'rare',
    stackable: true,
    stackCap: 3,           // ← NOVO
    combatOnly: false,
    icon: 'potion_strong',
    use: (player) => {
      const heal = Math.floor(Math.random() * 21) + 50;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      return {
        message: `Você bebeu uma Poção Forte e recuperou ${heal} de HP!`,
        toast: {
          itemId: 'potion_strong',
          title: 'Poção de Cura Forte',
          subtitle: `+${heal} HP`,
          color: '#6fbd63',
        },
      };
    },
  },

  potion_mana: {
    id: 'potion_mana',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Mana Fraca',
    description: 'Recupera de 5 a 10 de MP.',
    price: 15,
    sellPrice: 6,      // preço de venda
    rarity: 'common',
    stackable: true,
    stackCap: 10,
    combatOnly: false,
    icon: 'potion_mana',
    use: (player) => {
      const heal = Math.floor(Math.random() * 6) + 5;
      const antes = player.mp;
      player.mp = Math.min(player.maxMp, player.mp + heal);
      const ganho = player.mp - antes;
      return {
        message: `Você bebeu uma Poção de Mana Fraca e recuperou ${ganho} de MP!`,
        toast: {
          itemId: 'potion_mana',
          title: 'Poção de Mana Fraca',
          subtitle: `+${ganho} MP`,
          color: '#8ad8ff',
        },
      };
    },
  },

  potion_mana_medium: {
    id: 'potion_mana_medium',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Mana Média',
    description: 'Recupera de 20 a 35 de MP.',
    price: 40,
    sellPrice: 18,      // preço de venda
    rarity: 'uncommon',
    stackable: true,
    stackCap: 5,
    combatOnly: false,
    icon: 'potion_mana_medium',
    use: (player) => {
      const heal = Math.floor(Math.random() * 16) + 20;
      const antes = player.mp;
      player.mp = Math.min(player.maxMp, player.mp + heal);
      const ganho = player.mp - antes;
      return {
        message: `Você bebeu uma Poção de Mana Média e recuperou ${ganho} de MP!`,
        toast: {
          itemId: 'potion_mana_medium',
          title: 'Poção de Mana Média',
          subtitle: `+${ganho} MP`,
          color: '#8ad8ff',
        },
      };
    },
  },

  potion_mana_strong: {
    id: 'potion_mana_strong',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Mana Forte',
    description: 'Recupera de 50 a 70 de MP.',
    price: 85,
    sellPrice: 38,      // preço de venda
    rarity: 'rare',
    stackable: true,
    stackCap: 3,
    combatOnly: false,
    icon: 'potion_mana_strong',
    use: (player) => {
      const heal = Math.floor(Math.random() * 21) + 50;
      const antes = player.mp;
      player.mp = Math.min(player.maxMp, player.mp + heal);
      const ganho = player.mp - antes;
      return {
        message: `Você bebeu uma Poção de Mana Forte e recuperou ${ganho} de MP!`,
        toast: {
          itemId: 'potion_mana_strong',
          title: 'Poção de Mana Forte',
          subtitle: `+${ganho} MP`,
          color: '#8ad8ff',
        },
      };
    },
  },

  potion_str: {
    id: 'potion_str',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Força',
    description: '+3 Força por 3 rounds de combate.',
    price: 25,
    sellPrice: 12,      // preço de venda
    rarity: 'uncommon',
    stackable: true,
    stackCap: 3,
    combatOnly: true,
    icon: 'potion_str',
    use: (player) => {
      player.buffs = player.buffs || {};
      player.buffs.str = { amount: 3, rounds: 3 };
      return {
        message: 'Você sente a força aumentar! +3 Força por 3 rounds.',
        toast: {
          itemId: 'potion_str',
          title: 'Poção de Força',
          subtitle: '+3 Força (3 turnos)',
          color: '#ffb703',
        },
      };
    },
  },

  potion_agi: {
    id: 'potion_agi',
    type: 'consumable',
    kind: 'consumable',
    name: 'Poção de Agilidade',
    description: '+3 Agilidade por 3 rounds de combate.',
    price: 25,
    sellPrice: 12,      // preço de venda
    rarity: 'uncommon',
    stackable: true,
    stackCap: 3,
    combatOnly: true,
    icon: 'potion_agi',
    use: (player) => {
      player.buffs = player.buffs || {};
      player.buffs.agi = { amount: 3, rounds: 3 };
      return {
        message: 'Você sente mais ágil! +3 Agilidade por 3 rounds.',
        toast: {
          itemId: 'potion_agi',
          title: 'Poção de Agilidade',
          subtitle: '+3 Agilidade (3 turnos)',
          color: '#6fbd63',
        },
      };
    },
  },

  // ============================================================
  // ARMAS (rightHand)
  // ============================================================
  sword: {
    id: 'sword',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Espada',
    description: 'Uma espada simples de aço.',
    price: 50,
    sellPrice: 20,      // preço de venda
    rarity: 'common',
    stackable: false,
    icon: 'sword',
    stats: { str: 2 },
    draw: null, // preenchido em equipment.js (import cycle)
  },

  axe: {
    id: 'axe',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Machado',
    description: 'Pesado, mas devastador.',
    price: 70,
    sellPrice: 18,      // preço de venda
    rarity: 'uncommon',
    stackable: false,
    icon: 'axe',
    stats: { str: 3 },
    draw: null,
  },

  dagger: {
    id: 'dagger',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Adaga',
    description: 'Rápida e precisa.',
    price: 45,
    sellPrice: 18,      // preço de venda
    rarity: 'common',
    stackable: false,
    icon: 'dagger',
    stats: { str: 1, agi: 2 },
    draw: null,
  },

  staff: {
    id: 'staff',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Cajado',
    description: 'Foco mágico para conjurar feitiços.',
    price: 60,
    sellPrice: 25,      // preço de venda
    rarity: 'uncommon',
    stackable: false,
    icon: 'staff',
    stats: { int: 2 },
    draw: null,
  },

  bow: {
    id: 'bow',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Arco',
    description: 'Arma de longo alcance da caçadora.',
    price: 55,
    sellPrice: 22,      // preço de venda
    rarity: 'uncommon',
    stackable: false,
    icon: 'bow',
    stats: { str: 1, agi: 2 },
    draw: null,
  },

  // ============================================================
  // ESCUDOS (leftHand)
  // ============================================================
  shield: {
    id: 'shield',
    type: 'shield',
    kind: 'shield',
    slot: 'leftHand',
    name: 'Escudo',
    description: 'Um escudo de madeira reforçado com metal.',
    price: 40,
    sellPrice: 16,      // preço de venda
    rarity: 'common',
    stackable: false,
    icon: 'shield',
    stats: { def: 2 },
    draw: null,
  },

  // ============================================================
  // TOCHAS (leftHand)
  // ============================================================
  torch: {
    id: 'torch',
    type: 'torch',
    kind: 'torch',
    slot: 'leftHand',
    name: 'Tocha',
    description: 'Ilumina a escuridão.',
    price: 5,
    sellPrice: 2,      // preço de venda
    rarity: 'common',
    stackable: false,
    icon: 'torch',
    stats: {}, // tocha não dá stats, é decorativa
    draw: null,
  },

  // ============================================================
  // LOOT / MATERIAIS
  // ============================================================
  rat_tail: {
    id: 'rat_tail',
    kind: 'loot',
    name: 'Cauda de Rato',
    description: 'Uma cauda fina e comprida. Herbalistas juram que tem propriedades medicinais.',
    price: 8,          // preço de compra (não usado ainda)
    sellPrice: 3,      // preço de venda
    rarity: 'common',
    stackable: true,
    stackCap: 20,
    icon: 'rat_tail',
  },

  letter_to_elder: {
    id: 'letter_to_elder',
    kind: 'quest',              // fica impossível de vender/usar
    name: 'Pergaminho Selado',
    description: 'Um pergaminho selado com o brasão de Aethel. O Ancião vai querer ver isso.',
    price: 0,
    sellPrice: 0,               // não vendável
    rarity: 'rare',             // destaca no inventário
    stackable: false,           // não empilha
    icon: 'letter_to_elder',
  },
};

// Compat: exporta o mesmo shape que os consumidores antigos esperam.
export const CONSUMABLES = {};
for (const [id, it] of Object.entries(ITEMS_DB)) {
  if (it.type === 'consumable') CONSUMABLES[id] = it;
}

// Helpers
export function getItem(id) {
  return ITEMS_DB[id] || null;
}

export function getItemsByType(type) {
  return Object.values(ITEMS_DB).filter(i => i.type === type);
}

/**
 * Adiciona `qty` unidades de `itemId` ao inventário respeitando o
 * `stackCap` do item. Retorna quantos foram efetivamente adicionados
 * (útil pra mostrar "inventário cheio" / "adicionou X de Y").
 *
 * O inventário é um array de { id, qty }. Se o item já existe, incrementa
 * até o cap; se não existe, cria um slot novo (se qty > 0).
 *
 * @param {Array<{id:string, qty:number}>} inventory
 * @param {string} itemId
 * @param {number} qty
 * @returns {number} quantidade adicionada de fato
 */
export function addItemToInventory(inventory, itemId, qty = 1) {
  const info = ITEMS_DB[itemId];
  if (!info) return 0;
  const cap = info.stackCap ?? Infinity;

  let added = 0;
  const existing = inventory.find(i => i.id === itemId);
  if (existing) {
    const space = cap - existing.qty;
    const toAdd = Math.min(space, qty);
    existing.qty += toAdd;
    added += toAdd;
    qty -= toAdd;
  }

  // Se ainda sobra e o cap permite um slot novo, cria.
  // (Neste jogo, 1 slot por tipo é o padrão; se quiser múltiplos slots
  // por tipo, remova o `qty -= toAdd` acima e permita push de outro slot.)
  if (qty > 0 && !existing && cap > 0) {
    const toAdd = Math.min(cap, qty);
    inventory.push({ id: itemId, qty: toAdd });
    added += toAdd;
  }

  return added;
}

/**
 * Retorna o quanto ainda cabe de um item no inventário.
 */
export function remainingSpace(inventory, itemId) {
  const info = ITEMS_DB[itemId];
  if (!info) return 0;
  const cap = info.stackCap ?? Infinity;
  const existing = inventory.find(i => i.id === itemId);
  const cur = existing ? existing.qty : 0;
  return Math.max(0, cap - cur);
}

// Cores por raridade (usadas no inventário e no toast de drop)
export const RARITY_COLORS = {
  common:    '#bbb',
  uncommon:  '#6fbd63',
  rare:      '#3aa0ff',
  epic:      '#d78cff',
  legendary: '#feca57',
};

// Ordem pra ordenar no inventário (menor = mais comum)
export const RARITY_ORDER = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
};