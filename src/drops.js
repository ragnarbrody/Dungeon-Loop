// src/drops.js
// ============================================================
// DROPS — tabela de drop por inimigo.
//
// Cada inimigo tem uma lista de "entradas de drop". Cada entrada:
//   { itemId, chance, qtyMin, qtyMax }
//
// - chance: 0..1 (probabilidade de dropar AQUELE item)
// - qtyMin/Max: quantidade sorteada se cair
//
// A tabela roda uma vez por inimigo morto. Cada entrada é rolada
// independentemente, então um inimigo pode dropar vários itens.
//
// O ouro NÃO está aqui — já é tratado em `battle.js` (goldMin/goldMax).
// ============================================================
import { ITEMS_DB } from './items.js';
import { addItemToInventory } from './items.js';

export const ENEMY_DROPS = {
  slime: [
    { itemId: 'slime_gel',   chance: 0.70, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_weak', chance: 0.15, qtyMin: 1, qtyMax: 1 },
  ],
  rat: [
    { itemId: 'rat_tail',    chance: 0.65, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_weak', chance: 0.10, qtyMin: 1, qtyMax: 1 },
  ],
  goblin: [
    { itemId: 'goblin_tooth',  chance: 0.65, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_weak', chance: 0.20, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_medium', chance: 0.05, qtyMin: 1, qtyMax: 1 },
    { itemId: 'potion_agi',    chance: 0.05, qtyMin: 1, qtyMax: 1 },
  ],
  scorpion: [
    { itemId: 'scorpion_pincer', chance: 0.65, qtyMin: 1, qtyMax: 1 },
    { itemId: 'potion_mana_medium', chance: 0.30, qtyMin: 1, qtyMax: 1 },  // 20% → 30%
  ],
  vulture: [
    { itemId: 'vulture_egg', chance: 0.40, qtyMin: 1, qtyMax: 1 },
    { itemId: 'potion_agi', chance: 0.15, qtyMin: 1, qtyMax: 1 },
    { itemId: 'potion_mana', chance: 0.15, qtyMin: 1, qtyMax: 1 },
  ],
  mummy: [
    { itemId: 'potion_medium', chance: 0.25, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_mana_medium', chance: 0.20, qtyMin: 1, qtyMax: 1 },
  ],
  scarab: [
    { itemId: 'potion_str', chance: 0.15, qtyMin: 1, qtyMax: 1 },
  ],
  bat: [
    { itemId: 'bat_wing', chance: 0.7, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_weak', chance: 0.1, qtyMin: 1, qtyMax: 1 },
  ],
  goblin_sergeant: [
    { itemId: 'nucleo_bruto', chance: 1.0, qtyMin: 1, qtyMax: 1 },
    { itemId: 'potion_medium', chance: 0.5, qtyMin: 1, qtyMax: 2 },
    { itemId: 'potion_mana_medium', chance: 0.25, qtyMin: 1, qtyMax: 1 },
  ],
  // ---- Miniboss do deserto ----
  scorpion_giant: [
    { itemId: 'scorpion_pincer', chance: 1.0, qtyMin: 2, qtyMax: 3 },
    { itemId: 'potion_strong', chance: 0.4, qtyMin: 1, qtyMax: 1 },
    { itemId: 'nucleo_bruto', chance: 0.6, qtyMin: 1, qtyMax: 1 },
  ],
};

/**
 * Sorteia os drops de um inimigo morto e adiciona ao inventário.
 * Retorna um array de { itemId, qty } com o que foi dropado (pra log/toast).
 */
export function rollDrops(enemyId, inventory) {
  const table = ENEMY_DROPS[enemyId];
  if (!table) return [];

  const dropped = [];
  for (const entry of table) {
    if (Math.random() >= entry.chance) continue;

    const qty = randInt(entry.qtyMin, entry.qtyMax);
    if (qty <= 0) continue;

    const added = addItemToInventory(inventory, entry.itemId, qty);
    if (added > 0) {
      dropped.push({ itemId: entry.itemId, qty: added });
    }
  }
  return dropped;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna o nome bonito de um drop pra log: "2× Cauda de Rato"
 */
export function formatDrop(drop) {
  const info = ITEMS_DB[drop.itemId];
  const name = info ? info.name : drop.itemId;
  return drop.qty > 1 ? `${drop.qty}× ${name}` : name;
}