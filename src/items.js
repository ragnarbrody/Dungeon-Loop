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
    description: 'Uma espada simples de ferro. Leve e confiável.',
    price: 50,
    sellPrice: 20,
    rarity: 'common',
    stackable: false,
    icon: 'sword',
    stats: { str: 1 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
  },

  steel_sword: {
    id: 'steel_sword',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Espada de Aço',
    description: 'Lâmina reforçada, forjada pra durar. Pesada, mas corta fundo.',
    price: 180,
    sellPrice: 70,
    rarity: 'uncommon',
    stackable: false,
    icon: 'steel_sword',
    stats: { str: 4 },
    reqLevel: 4,
    reqStats: { str: 4 },
    draw: null,
  },

  axe: {
    id: 'axe',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Machado',
    description: 'Pesado, mas devastador. Feito pra quebrar coisas.',
    price: 90,
    sellPrice: 35,
    rarity: 'uncommon',
    stackable: false,
    icon: 'axe',
    stats: { str: 3 },
    reqLevel: 3,
    reqStats: { str: 3 },
    draw: null,
  },

  war_axe: {
    id: 'war_axe',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Machado de Guerra',
    description: 'Um machado gigante. Exige corpo pra levantar, e mais ainda pra baixar.',
    price: 320,
    sellPrice: 130,
    rarity: 'rare',
    stackable: false,
    icon: 'war_axe',
    stats: { str: 6, vit: 1 },
    reqLevel: 6,
    reqStats: { str: 6, vit: 2 },
    draw: null,
  },

  dagger: {
    id: 'dagger',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Adaga',
    description: 'Rápida e precisa. A arma preferida de quem não gosta de barulho.',
    price: 45,
    sellPrice: 18,
    rarity: 'common',
    stackable: false,
    icon: 'dagger',
    stats: { str: 1, agi: 1 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
  },

  shadow_dagger: {
    id: 'shadow_dagger',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Adaga das Sombras',
    description: 'A lâmina parece absorver a luz. Quem empunha não costuma ser visto.',
    price: 240,
    sellPrice: 95,
    rarity: 'rare',
    stackable: false,
    icon: 'shadow_dagger',
    stats: { str: 2, agi: 5 },
    reqLevel: 5,
    reqStats: { agi: 6, str: 2 },
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
    sellPrice: 25,
    rarity: 'uncommon',
    stackable: false,
    icon: 'staff',
    stats: { int: 2 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
  },

  arcane_staff: {
    id: 'arcane_staff',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Cajado Arcano',
    description: 'A gema no topo pulsa com energia antiga. Só responde a quem já entende de magia.',
    price: 280,
    sellPrice: 110,
    rarity: 'rare',
    stackable: false,
    icon: 'arcane_staff',
    stats: { int: 4, magia: 2 },
    reqLevel: 5,
    reqStats: { int: 5, magia: 3 },
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
    sellPrice: 22,
    rarity: 'uncommon',
    stackable: false,
    icon: 'bow',
    stats: { str: 1, agi: 1 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
  },

  ranger_bow: {
    id: 'ranger_bow',
    type: 'weapon',
    kind: 'weapon',
    slot: 'rightHand',
    name: 'Arco do Guardião',
    description: 'Arco de teixo trabalhado por gerações. Só quem tem olho e braço firme consegue puxar.',
    price: 260,
    sellPrice: 100,
    rarity: 'rare',
    stackable: false,
    icon: 'ranger_bow',
    stats: { str: 1, agi: 4 },
    reqLevel: 5,
    reqStats: { agi: 6 },
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
    stats: { def: 1 },
    draw: null,
  },

  // ============================================================
  // ESCUDOS — mais escudos
  // ============================================================
  iron_shield: {
    id: 'iron_shield',
    type: 'shield',
    kind: 'shield',
    slot: 'leftHand',
    name: 'Escudo de Ferro',
    description: 'Chapa de ferro reforçada nas bordas. Pesado, mas firme.',
    price: 120,
    sellPrice: 48,
    rarity: 'uncommon',
    stackable: false,
    icon: 'iron_shield',
    stats: { def: 4 },
    reqLevel: 3,
    reqStats: { def: 2 },
    draw: null,
    set: 'iron',
  },

  runic_shield: {
    id: 'runic_shield',
    type: 'shield',
    kind: 'shield',
    slot: 'leftHand',
    name: 'Escudo Rúnico',
    description: 'Aço escurecido com runas gravadas. A luz desliza pelas marcas como se fossem vivas.',
    price: 340,
    sellPrice: 140,
    rarity: 'rare',
    stackable: false,
    icon: 'runic_shield',
    stats: { def: 7 },
    reqLevel: 6,
    reqStats: { def: 5, vit: 2 },
    draw: null,
    set: 'runic',
  },

  // ============================================================
  // CONJUNTO DE COURO (iniciante)
  // ============================================================
  leather_helmet: {
    id: 'leather_helmet',
    type: 'armor',
    kind: 'helmet',
    slot: 'helmet',
    name: 'Capacete de Couro',
    description: 'Proteção leve pra cabeça. Melhor que nada.',
    price: 45,
    sellPrice: 18,
    rarity: 'common',
    stackable: false,
    icon: 'leather_helmet',
    stats: { def: 1 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
    set: 'leather',
  },

  leather_armor: {
    id: 'leather_armor',
    type: 'armor',
    kind: 'armor',
    slot: 'armor',
    name: 'Peitoral de Couro',
    description: 'Couro curtido, reforçado no peito. Leve o bastante pra não travar os movimentos.',
    price: 80,
    sellPrice: 32,
    rarity: 'common',
    stackable: false,
    icon: 'leather_armor',
    stats: { def: 2 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
    set: 'leather',
  },

  leather_boots: {
    id: 'leather_boots',
    type: 'armor',
    kind: 'boots',
    slot: 'boots',
    name: 'Botas de Couro',
    description: 'Botas firmes. Boa pra andar longe sem tropeçar.',
    price: 45,
    sellPrice: 18,
    rarity: 'common',
    stackable: false,
    icon: 'leather_boots',
    stats: { def: 1, agi: 1 },
    reqLevel: 1,
    reqStats: {},
    draw: null,
    set: 'leather',
  },

  // ============================================================
  // CONJUNTO DE FERRO (intermediário — entre couro e rúnico)
  // ============================================================
  iron_helmet: {
    id: 'iron_helmet',
    type: 'armor',
    kind: 'helmet',
    slot: 'helmet',
    name: 'Elmo de Ferro',
    description: 'Elmo de ferro batido, com rebites nas laterais. Pesado, mas protege bem.',
    price: 140,
    sellPrice: 56,
    rarity: 'uncommon',
    stackable: false,
    icon: 'iron_helmet',
    stats: { def: 2 },
    reqLevel: 3,
    reqStats: { def: 2 },
    draw: null,
    set: 'iron',
  },

  iron_armor: {
    id: 'iron_armor',
    type: 'armor',
    kind: 'armor',
    slot: 'armor',
    name: 'Peitoral de Ferro',
    description: 'Chapa de ferro sobre couro grosso. Não é confortável, mas aguenta o tranco.',
    price: 260,
    sellPrice: 104,
    rarity: 'uncommon',
    stackable: false,
    icon: 'iron_armor',
    stats: { def: 4 },
    reqLevel: 4,
    reqStats: { def: 3, vit: 1 },
    draw: null,
    set: 'iron',
  },

  iron_boots: {
    id: 'iron_boots',
    type: 'armor',
    kind: 'boots',
    slot: 'boots',
    name: 'Grevas de Ferro',
    description: 'Grevas de ferro com cano alto. O chão range, mas você não escorrega.',
    price: 140,
    sellPrice: 56,
    rarity: 'uncommon',
    stackable: false,
    icon: 'iron_boots',
    stats: { def: 2 },
    reqLevel: 3,
    reqStats: { def: 2 },
    draw: null,
    set: 'iron',
  },

  // ============================================================
  // CONJUNTO RÚNICO (intermediário — aço com runas)
  // ============================================================
  runic_helmet: {
    id: 'runic_helmet',
    type: 'armor',
    kind: 'helmet',
    slot: 'helmet',
    name: 'Elmo Rúnico',
    description: 'Elmo de aço escuro com runas gravadas na testa. Sussurra baixinho quando o perigo chega.',
    price: 180,
    sellPrice: 72,
    rarity: 'uncommon',
    stackable: false,
    icon: 'runic_helmet',
    stats: { def: 3, magia: 1 },
    reqLevel: 4,
    reqStats: { def: 3 },
    draw: null,
    set: 'runic',
  },

  runic_armor: {
    id: 'runic_armor',
    type: 'armor',
    kind: 'armor',
    slot: 'armor',
    name: 'Peitoral Rúnico',
    description: 'Aço que parece ter memória. As runas no peito ficam mais nítidas perto de magia.',
    price: 320,
    sellPrice: 128,
    rarity: 'rare',
    stackable: false,
    icon: 'runic_armor',
    stats: { def: 6, magia: 2 },
    reqLevel: 5,
    reqStats: { def: 5, magia: 2 },
    draw: null,
    set: 'runic',
  },

  runic_boots: {
    id: 'runic_boots',
    type: 'armor',
    kind: 'boots',
    slot: 'boots',
    name: 'Grevas Rúnicas',
    description: 'Grevas de aço com runas nos tornozelos. O chão range embaixo, mas você não escorrega.',
    price: 180,
    sellPrice: 72,
    rarity: 'uncommon',
    stackable: false,
    icon: 'runic_boots',
    stats: { def: 3, vit: 1 },
    reqLevel: 4,
    reqStats: { def: 3 },
    draw: null,
    set: 'runic',
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
    maxOwned: 1,
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
    price: 8,          // preço de compra 
    sellPrice: 3,      // preço de venda
    rarity: 'common',
    stackable: true,
    stackCap: 20,
    icon: 'rat_tail',
  },

  goblin_tooth: {
    id: 'goblin_tooth',
    kind: 'material',
    name: 'Dente de Goblin',
    description: 'Um dente afiado e amarelado. Serve pra alguma coisa — só o Ferreiro sabe o quê.',
    price: 12,
    sellPrice: 5,
    rarity: 'common',
    stackable: true,
    stackCap: 20,
    icon: 'goblin_tooth',
  },

  slime_gel: {
    id: 'slime_gel',
    kind: 'material',
    name: 'Geleia de Slime',
    description: 'Uma gosma verde que gruda nos dedos. Nojenta, mas útil.',
    price: 4,
    sellPrice: 1,
    rarity: 'common',
    stackable: true,
    stackCap: 20,
    icon: 'slime_gel',
  },

  scorpion_pincer: {
    id: 'scorpion_pincer',
    kind: 'material',
    name: 'Pinça de Escorpião',
    description: 'Uma pinça dura e pontuda. Dizem que esquenta bem no fogo.',
    price: 15,
    sellPrice: 6,
    rarity: 'common',
    stackable: true,
    stackCap: 20,
    icon: 'scorpion_pincer',
  },

  vulture_egg: {
    id: 'vulture_egg',
    kind: 'material',
    name: 'Ovo de Abutre',
    description: 'Um ovo manchado, maior que a mão. incomum de achar — os abutres defendem bem o ninho.',
    price: 25,
    sellPrice: 9,
    rarity: 'uncommon',
    stackable: true,
    stackCap: 10,
    icon: 'vulture_egg',
  },

  bat_wing: {
    id: 'bat_wing',
    kind: 'material',
    name: 'Asa de Morcego',
    description: 'Uma asa membranosa e escura. Pode ser útil para poções.',
    price: 10, sellPrice: 4,
    rarity: 'common', stackable: true, stackCap: 20,
    icon: 'bat_wing',
  },
  
  nucleo_bruto: {
    id: 'nucleo_bruto',
    kind: 'material',
    name: 'Núcleo Bruto',
    description: 'Um núcleo de energia pulsante. Muito valioso para artesãos.',
    price: 100, sellPrice: 50,
    rarity: 'rare', stackable: false,
    icon: 'nucleo_bruto',
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
  if (!info || qty <= 0) return 0;

  const cap = info.stackable === false ? 1 : (info.stackCap ?? Infinity);
  let remaining = qty;

  // 1) completa os slots existentes (todos, não só o primeiro)
  for (const slot of inventory) {
    if (remaining <= 0) break;
    if (slot.id !== itemId) continue;
    const space = cap - slot.qty;
    if (space <= 0) continue;
    const take = Math.min(space, remaining);
    slot.qty += take;
    remaining -= take;
  }

  // 2) o que sobrou vira slots novos, em blocos de `cap`
  while (remaining > 0) {
    const take = Math.min(cap, remaining);
    inventory.push({ id: itemId, qty: take });
    remaining -= take;
  }
  return qty;
}

export function countItem(inventory, itemId) {
  let n = 0;
  for (const s of inventory) if (s.id === itemId) n += s.qty;
  return n;
}

// Remove `qty` unidades, esvaziando primeiro os slots do fim (os parciais).
// Retorna quantas foram removidas de fato.
export function removeItem(inventory, itemId, qty = 1) {
  let left = qty;
  for (let i = inventory.length - 1; i >= 0 && left > 0; i--) {
    const s = inventory[i];
    if (s.id !== itemId) continue;
    const take = Math.min(s.qty, left);
    s.qty -= take;
    left -= take;
    if (s.qty <= 0) inventory.splice(i, 1);
  }
  return qty - left;
}

// Não há limite de slots, então só `maxOwned` (opcional) limita a compra.
export function remainingSpace(inventory, itemId) {
  const info = ITEMS_DB[itemId];
  if (!info) return 0;
  // Itens não empilháveis: só 1 por vez no inventário
  if (info.stackable === false) {
    return countItem(inventory, itemId) > 0 ? 0 : 1;
  }
  if (info.maxOwned != null) {
    return Math.max(0, info.maxOwned - countItem(inventory, itemId));
  }
  return Infinity;
}

// Conserta saves que já ficaram com slots fragmentados (10, 1, 1, 1...)
export function normalizeInventory(inventory) {
  const totals = new Map();
  for (const s of inventory) {
    if (!s || !(s.qty > 0)) continue;
    totals.set(s.id, (totals.get(s.id) || 0) + s.qty);
  }
  const rebuilt = [];
  for (const [id, qty] of totals) {
    if (!ITEMS_DB[id]) rebuilt.push({ id, qty });   // desconhecido: não apaga
    else addItemToInventory(rebuilt, id, qty);
  }
  inventory.length = 0;
  inventory.push(...rebuilt);
  return inventory;
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

// ============================================================
// BÔNUS DE CONJUNTO
// ============================================================
// Cada conjunto define o que ganha quando TODAS as peças com `set === id`
// estão equipadas (em qualquer slot; o `weaponBonus`/`getSetBonus` conta).
export const SET_BONUSES = {
  leather: {
    id: 'leather',
    name: 'Conjunto de Couro',
    // Peças que o conjunto exige pra ativar (todas precisam estar equipadas)
    pieces: ['leather_helmet', 'leather_armor', 'leather_boots'],
    // Bônus somado quando o conjunto está completo
    bonus: { def: 1 },
    // Texto curto pro tooltip
    desc: '+1 Defesa',
  },
  runic: {
    id: 'runic',
    name: 'Conjunto Rúnico',
    pieces: ['runic_helmet', 'runic_armor', 'runic_boots', 'runic_shield'],
    bonus: { def: 1, magia: 2 },
    desc: '+1 Defesa, +2 Magia',
  },
   iron: {
    id: 'iron',
    name: 'Conjunto de Ferro',
    pieces: ['iron_helmet', 'iron_armor', 'iron_boots', 'iron_shield'],
    bonus: { def: 2 },
    desc: '+2 Defesa',
  },
};