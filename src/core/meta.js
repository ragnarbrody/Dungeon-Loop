// ============================================================
// META — cofre (itens + ouro + slots) e contagem de mortes.
//
// Agora vive DENTRO do save (`state.js` → `metaState`), não mais
// em localStorage separado. Isso garante:
//   - "Continuar" (mesmo após morte) mantém o cofre.
//   - "Novo Jogo" (menu) zera o cofre.
//   - "Continuar do zero" (game over sem checkpoint) mantém o
//     cofre (o resolveDeath preserva metaState ao limpar o save).
//
// API pública é a mesma de antes (getVault, depositGold, ...),
// então o vault.js e o death.js não precisam mudar.
// ============================================================
import { ITEMS_DB, addItemToInventory } from '../items.js';
import { metaState, saveGame } from './state.js';

export const VAULT_BASE_SLOTS = 4;
export const VAULT_MAX_SLOTS = 8;
export const VAULT_SLOT_PRICES = [500, 500, 500, 500];
export const GOLD_DEPOSIT_FEE = 0;

export const getVault = () => metaState.vault;

// Não há mais "saveMeta" separado — qualquer mudança no cofre
// precisa persistir no save inteiro (senão o jogador pode
// duplicar ouro/itens ao recarregar a página).
function persist() { saveGame(); }

export function registerDeath() {
  metaState.deaths++;
  persist();
}

// ---------- Ouro ----------
export function depositGold(ps, amount) {
  const n = Math.min(Math.floor(amount), ps.gold);
  if (!(n > 0)) return 0;
  ps.gold -= n;
  metaState.vault.gold += n - Math.floor(n * GOLD_DEPOSIT_FEE);
  persist();
  return n;
}
export function withdrawGold(ps, amount) {
  const n = Math.min(Math.floor(amount), metaState.vault.gold);
  if (!(n > 0)) return 0;
  metaState.vault.gold -= n;
  ps.gold += n;
  persist();
  return n;
}

// ---------- Slots ----------
export function nextSlotPrice() {
  return VAULT_SLOT_PRICES[metaState.vault.slots - VAULT_BASE_SLOTS] ?? null;
}
export function buyVaultSlot(ps) {
  const price = nextSlotPrice();
  if (price == null) return { ok: false, reason: 'max' };
  if (ps.gold + metaState.vault.gold < price) return { ok: false, reason: 'gold' };
  const fromBag = Math.min(ps.gold, price);
  ps.gold -= fromBag;
  metaState.vault.gold -= price - fromBag;
  metaState.vault.slots++;
  metaState.vault.items.push(null);
  persist();
  return { ok: true, price };
}

// ---------- Itens ----------
export function depositItem(ps, entry) {
  const info = ITEMS_DB[entry.id];
  if (!info) return { moved: 0, reason: 'unknown' };
  if (info.kind === 'quest') return { moved: 0, reason: 'quest' };

  const cap = info.stackable === false ? 1 : (info.stackCap ?? Infinity);
  const items = metaState.vault.items;
  let left = entry.qty;

  for (const slot of items) {
    if (left <= 0) break;
    if (!slot || slot.id !== entry.id) continue;
    const take = Math.min(cap - slot.qty, left);
    if (take <= 0) continue;
    slot.qty += take; left -= take;
  }
  for (let i = 0; i < items.length && left > 0; i++) {
    if (items[i]) continue;
    const take = Math.min(cap, left);
    items[i] = { id: entry.id, qty: take };
    left -= take;
  }

  const moved = entry.qty - left;
  if (moved <= 0) return { moved: 0, reason: 'full' };
  entry.qty = left;
  if (entry.qty <= 0) {
    const idx = ps.inventory.indexOf(entry);
    if (idx >= 0) ps.inventory.splice(idx, 1);
  }
  persist();
  return { moved };
}

export function withdrawItem(ps, index) {
  const slot = metaState.vault.items[index];
  if (!slot) return 0;
  const n = addItemToInventory(ps.inventory, slot.id, slot.qty);
  metaState.vault.items[index] = null;
  persist();
  return n;
}