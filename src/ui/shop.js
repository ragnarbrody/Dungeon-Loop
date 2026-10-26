import { playerStats, saveGame } from '../core/state.js';
import { ITEMS_DB, addItemToInventory, remainingSpace } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';

// Estoque por loja
export const SHOPS = {
  herbalist: {
    name: 'Herbalista',
    items: [
      'potion_weak',
      'potion_medium',
      'potion_strong',
      'potion_mana',
      'potion_mana_medium',
      'potion_mana_strong',
      'potion_str',
      'potion_agi',
    ],
  },
};

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'shop-screen';
  container.className = 'hidden';
  container.innerHTML = `
    <div class="shop-box">
      <h2 class="shop-title"></h2>
      <div class="shop-gold"></div>
      <div class="shop-items"></div>
      <button class="shop-close">Fechar (ESC)</button>
    </div>
  `;
  document.getElementById('game-container').appendChild(container);
  container.querySelector('.shop-close').onclick = closeShop;
  return container;
}

export function openShop(buildingId) {
  const shop = SHOPS[buildingId];
  if (!shop) return;

  const c = ensureContainer();
  c.classList.remove('hidden');
  c.querySelector('.shop-title').textContent = shop.name;

  renderShopBody(c, shop);
}

function renderShopBody(c, shop) {
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

  for (const itemId of shop.items) {
    const item = ITEMS_DB[itemId];
    if (!item) continue;

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
    const cap = item.stackCap;
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

      // Usa o helper para adicionar respeitando o cap
      const added = addItemToInventory(playerStats.inventory, itemId, 1);
      if (added === 0) return;

      playerStats.gold -= item.price;
      saveGame();
      renderShopBody(c, shop);
      showToast({
        itemId,
        title: item.name,
        subtitle: `-${item.price} ouro`,
        color: '#f0c060',
      });
    };
    row.appendChild(buyBtn);

    itemsEl.appendChild(row);
  }
}

export function closeShop() {
  if (!container) return;
  container.classList.add('hidden');
}

export function isShopOpen() {
  return container && !container.classList.contains('hidden');
}