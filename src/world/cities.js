// ============================================================
// CITIES — dados de cada cidade do mundo.
//
// Pra adicionar uma cidade nova: adicionar uma entrada aqui,
// garantir que ela está em CITY_COORDS (rooms.js) e que os
// buildingIds usados existem em shop.js/interiors.js.
// ============================================================

export const CITIES = {
  aethel: {
    id: 'aethel',
    name: 'Cidade de Aethel',
    gx: 0,
    gy: 0,
    biome: 'fields',

    // O "marco" central: 'portal' (Aethel) ou 'oasis' (Akmira)
    landmark: 'portal',
    landmarkLabel: 'Portal Antigo',

    // Multiplicador de preço em todas as lojas desta cidade
    priceMul: 1.0,

    // Prédios (mesma estrutura do cityObjects de rooms.js)
    // O campo `stock` é uma chave usada em shop.js pra pegar
    // o estoque certo (ver getShopInventory).
    buildings: [
      { id: 'blacksmith',  name: 'Ferreiro',    tx: 4,  ty: 5,  w: 5, h: 3, signTx: 4,  signTy: 8,  stock: 'aethel' },
      { id: 'herbalist',   name: 'Herbalista',  tx: 21, ty: 5,  w: 5, h: 3, signTx: 21, signTy: 8,  stock: 'aethel' },
      { id: 'armorer',     name: 'Armeiro',     tx: 4,  ty: 21, w: 5, h: 3, signTx: 4,  signTy: 24, stock: 'aethel' },
      { id: 'bank',        name: 'Banco de Aethel', tx: 21, ty: 21, w: 5, h: 3, signTx: 21, signTy: 24, stock: 'aethel' },
      { id: 'quest_giver', name: 'Ancião',      tx: 13, ty: 22, w: 5, h: 3, signTx: 13, signTy: 25, stock: 'aethel' },
    ],
  },

  akmira: {
    id: 'akmira',
    name: 'Cidade de Akmira',
    gx: -19,     // 8 salas a oeste da borda do deserto (-6)
    gy: -4,
    biome: 'desert',

    landmark: 'oasis',
    landmarkLabel: 'Oásis de Akmira',

    priceMul: 1.15,   // tudo mais caro

    buildings: [
      { id: 'blacksmith',  name: 'Ferreiro',    tx: 4,  ty: 5,  w: 5, h: 3, signTx: 4,  signTy: 8,  stock: 'akmira' },
      { id: 'herbalist',   name: 'Herbalista',  tx: 21, ty: 5,  w: 5, h: 3, signTx: 21, signTy: 8,  stock: 'akmira' },
      { id: 'armorer',     name: 'Armeiro',     tx: 4,  ty: 21, w: 5, h: 3, signTx: 4,  signTy: 24, stock: 'akmira' },
      { id: 'jeweler',     name: 'Joalheira',   tx: 13, ty: 5,  w: 5, h: 3, signTx: 13, signTy: 8,  stock: 'akmira' },
      { id: 'bank',        name: 'Banco de Akmira', tx: 21, ty: 21, w: 5, h: 3, signTx: 21, signTy: 24, stock: 'akmira' },
      { id: 'quest_giver', name: 'Ancião',      tx: 13, ty: 22, w: 5, h: 3, signTx: 13, signTy: 25, stock: 'akmira' },
    ],
  },
};

export const CITY_IDS = Object.keys(CITIES);

// "gx,gy" → cityId
const COORD_TO_ID = new Map();
for (const c of Object.values(CITIES)) {
  COORD_TO_ID.set(`${c.gx},${c.gy}`, c.id);
}

export function getCityId(gx, gy) {
  return COORD_TO_ID.get(`${gx},${gy}`) || null;
}

export function isCityCoords(gx, gy) {
  return COORD_TO_ID.has(`${gx},${gy}`);
}

export function getCityData(cityId) {
  return CITIES[cityId] || null;
}

export function getAllCityCoords() {
  return Array.from(COORD_TO_ID.keys()).map(s => {
    const [gx, gy] = s.split(',').map(Number);
    return { gx, gy };
  });
}

// Cidades que o jogador "conhece" (pra fast travel futuro).
// Akmira só entra depois da quest story_to_akmira (ver quests.js).
export function getKnownCityIds() {
  // Import tardio pra evitar ciclo (quests ↔ cities ↔ quests).
  // Como é só leitura, dá pra importar direto.
  return import('../quests.js').then(mod => {
    const out = ['aethel'];
    if (mod.isQuestCompleted('story_to_akmira')) out.push('akmira');
    return out;
  });
}

export function musicForCity(cityId) {
  const map = {
    aethel: 'aethel',
    akmira: 'akmira',
  };
  return map[cityId] || 'aethel';
}

// Stub pra fast travel. Só cidade → cidade.
export function canFastTravelFrom(gx, gy) {
  return isCityCoords(gx, gy);
}