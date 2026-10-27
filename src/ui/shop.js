// src/ui/shop.js
import { playerStats, saveGame } from '../core/state.js';
import { ITEMS_DB, addItemToInventory, remainingSpace, RARITY_COLORS } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';
import { pickShopGreeting } from './shopgreetings.js';

// Estoque + filtros por loja.
// buyFilter: tipos que a loja VENDE (só informativo).
// sellFilter: tipos que a loja ACEITA do jogador.
export const SHOPS = {
  herbalist: {
    name: 'Herbalista',
    items: [
      'potion_weak', 'potion_medium', 'potion_strong',
      'potion_mana', 'potion_mana_medium', 'potion_mana_strong',
      'potion_str', 'potion_agi',
    ],
    sellFilter: ['material', 'consumable', 'loot'],
  },
  blacksmith: {
    name: 'Ferreiro',
    items: ['torch'],
    sellFilter: ['material', 'weapon', 'loot', 'torch'],
  },
};

let container = null;
let currentTab = 'buy';   // 'buy' | 'sell'

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'shop-screen';
  container.className = 'hidden';
  container.innerHTML = `
    <div class="shop-box">
      <h2 class="shop-title"></h2>
      <p class="shop-greeting"></p>
      <div class="shop-tabs">
        <button class="shop-tab" data-tab="buy">Comprar</button>
        <button class="shop-tab" data-tab="sell">Vender</button>
      </div>
      <div class="shop-gold"></div>
      <div class="shop-items"></div>
      <button class="shop-close">Fechar (ESC)</button>
    </div>
  `;
  document.getElementById('game-container').appendChild(container);

  container.querySelector('.shop-close').onclick = closeShop;

  container.querySelectorAll('.shop-tab').forEach(btn => {
    btn.onclick = () => {
      currentTab = btn.dataset.tab;
      renderBody(container);
    };
  });

  return container;
}

export function openShop(buildingId) {
  const shop = SHOPS[buildingId];
  if (!shop) return;

  const c = ensureContainer();
  c.classList.remove('hidden');
  c.querySelector('.shop-title').textContent = shop.name;

  const greetEl = c.querySelector('.shop-greeting');
  if (greetEl) greetEl.textContent = pickShopGreeting(buildingId);

  currentTab = 'buy';
  renderBody(c);
}

export function closeShop() {
  if (!container) return;
  container.classList.add('hidden');
}

export function isShopOpen() {
  return container && !container.classList.contains('hidden');
}

// ---------- Render geral ----------
function renderBody(c) {
  const shop = SHOPS[Object.keys(SHOPS).find(k => SHOPS[k].name === c.querySelector('.shop-title').textContent)];
  // (fallback seguro se a busca por nome falhar)
  if (!shop) return;

  // Atualiza abas ativas
  c.querySelectorAll('.shop-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });

  // Gold
  const goldEl = c.querySelector('.shop-gold');
  goldEl.innerHTML = '';
  goldEl.style.cssText = 'display:flex;align-items:center;gap:6px;color:#f0c060;margin-bottom:10px;justify-content:center;';
  const gIcon = getIcon('gold');
  gIcon.style.width = '32px';
  gIcon.style.height = '32px';
  gIcon.style.imageRendering = 'pixelated';
  goldEl.appendChild(gIcon);
  const gTxt = document.createElement('span');
  gTxt.textContent = `Ouro: ${playerStats.gold}`;
  goldEl.appendChild(gTxt);

  const itemsEl = c.querySelector('.shop-items');
  itemsEl.innerHTML = '';

  if (currentTab === 'buy') {
    renderBuyTab(itemsEl, shop);
  } else {
    renderSellTab(itemsEl, shop);
  }
}

// ---------- Aba Comprar ----------
function renderBuyTab(itemsEl, shop) {
  for (const itemId of shop.items) {
    const item = ITEMS_DB[itemId];
    if (!item) continue;
    // Defensivo: nunca listar quest
    if (item.kind === 'quest') continue;

    const row = document.createElement('div');
    row.className = 'shop-row';

    const icon = getIcon(itemId);
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.imageRendering = 'pixelated';
    row.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'shop-info';
    const name = document.createElement('div');
    name.className = 'shop-name';
    name.textContent = item.name;
    info.appendChild(name);
    const desc = document.createElement('div');
    const cap = item.stackCap ?? '∞';
    const cur = playerStats.inventory.find(i => i.id === itemId)?.qty || 0;
    desc.className = 'shop-desc';
    desc.textContent = `${item.description} (${cur}/${cap})`;
    info.appendChild(desc);
    row.appendChild(info);

    const space = remainingSpace(playerStats.inventory, itemId);

    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy';
    buyBtn.textContent = `${item.price} ouro`;
    buyBtn.disabled = playerStats.gold < item.price || space <= 0;
    buyBtn.onclick = () => {
      if (playerStats.gold < item.price) return;
      if (remainingSpace(playerStats.inventory, itemId) <= 0) return;

      const added = addItemToInventory(playerStats.inventory, itemId, 1);
      if (added === 0) return;

      playerStats.gold -= item.price;
      saveGame();
      renderBody(container);
      showToast({ itemId, title: item.name, subtitle: `-${item.price} ouro`, color: '#f0c060' });
    };
    row.appendChild(buyBtn);

    itemsEl.appendChild(row);
  }
}

// ---------- Aba Vender ----------
function renderSellTab(itemsEl, shop) {
  const sellFilter = shop.sellFilter || [];

  // Itens vendáveis: estão no inventário, batem com o filtro, e NÃO são quest.
  const sellable = [];
  for (const entry of playerStats.inventory) {
    if (!entry.qty || entry.qty <= 0) continue;
    const info = ITEMS_DB[entry.id];
    if (!info) continue;
    if (info.kind === 'quest') continue;           // ← bloqueio duro
    if (!sellFilter.includes(info.kind)) continue;
    if (!info.sellPrice || info.sellPrice <= 0) continue;
    sellable.push({ id: entry.id, qty: entry.qty, info });
  }

  if (sellable.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nada para vender.';
    p.style.cssText = 'color: #666; text-align: center; font-size: 12px; padding: 20px;';
    itemsEl.appendChild(p);
    return;
  }

  for (const item of sellable) {
    const row = document.createElement('div');
    row.className = 'shop-row';

    const icon = getIcon(item.id);
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.imageRendering = 'pixelated';
    row.appendChild(icon);

    const info = document.createElement('div');
    info.className = 'shop-info';
    const name = document.createElement('div');
    name.className = 'shop-name';
    name.textContent = `${item.info.name} (x${item.qty})`;
    info.appendChild(name);
    const desc = document.createElement('div');
    desc.className = 'shop-desc';
    desc.textContent = `Vende por ${item.info.sellPrice} ouro cada.`;
    info.appendChild(desc);
    row.appendChild(info);

    // Botão 1: Vender 1
    const sellOne = document.createElement('button');
    sellOne.className = 'shop-sell';
    sellOne.textContent = `Vender 1 (${item.info.sellPrice})`;
    sellOne.onclick = () => {
      const original = playerStats.inventory.find(i => i.id === item.id);
      if (!original || original.qty <= 0) return;
      original.qty--;
      if (original.qty <= 0) {
        playerStats.inventory = playerStats.inventory.filter(i => i.id !== item.id);
      }
      playerStats.gold += item.info.sellPrice;
      saveGame();
      renderBody(container);
      showToast({
        itemId: item.id,
        title: item.info.name,
        subtitle: `+${item.info.sellPrice} ouro`,
        color: '#f0c060',
      });
    };
    row.appendChild(sellOne);

    // Botão 2: Vender tudo (só se qty > 1)
    if (item.qty > 1) {
      const sellAll = document.createElement('button');
      sellAll.className = 'shop-sell shop-sell-all';
      sellAll.textContent = `Vender tudo (${item.info.sellPrice * item.qty})`;
      sellAll.onclick = () => {
        const original = playerStats.inventory.find(i => i.id === item.id);
        if (!original) return;
        const total = item.info.sellPrice * original.qty;
        playerStats.inventory = playerStats.inventory.filter(i => i.id !== item.id);
        playerStats.gold += total;
        saveGame();
        renderBody(container);
        showToast({
          itemId: item.id,
          title: `${item.info.name} (x${item.qty})`,
          subtitle: `+${total} ouro`,
          color: '#f0c060',
        });
      };
      row.appendChild(sellAll);
    }

    itemsEl.appendChild(row);
  }
}