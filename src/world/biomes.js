export const BIOMES = {
  fields: {
    name: 'Campos',
    trees: true,
    // Chão: usa os `grassTiles` existentes (verde)
    floorStyle: 'grass',
    // Inimigos desse bioma (vazio = nenhum ainda)
    enemies: [],
  },
  desert: {
    name: 'Deserto',
    trees: false,
    // Chão: renderizado proceduralmente (areia + dunas)
    floorStyle: 'sand',
    enemies: ['scorpion', 'vulture', 'mummy', 'scarab'],
  },
};

// Distância a partir da qual cada bioma começa.
// O deserto fica no extremo oeste: gx <= -6
export const DESERT_GX_THRESHOLD = -6;

export function pickBiome(gx, gy) {
  if (gx <= DESERT_GX_THRESHOLD) return 'desert';
  return 'fields';
}

// Pool de inimigos de um bioma (com fallback pra campos)
const FALLBACK_FIELDS_ENEMIES = ['slime', 'rat', 'goblin'];

export function getBiomeEnemies(gx, gy) {
  const biomeId = pickBiome(gx, gy);
  const biome = BIOMES[biomeId];
  if (biome.enemies && biome.enemies.length > 0) return biome.enemies;
  if (biomeId === 'fields') return FALLBACK_FIELDS_ENEMIES;
  return []; // bioma sem inimigos definidos → não spawna nada
}

export function getBiomeById(biomeId) {
  return BIOMES[biomeId];
}