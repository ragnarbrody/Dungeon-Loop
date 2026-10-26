import { playerStats, saveGame } from '../core/state.js';
import { ITEMS_DB } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';

// Estoque por loja
export const SHOPS = {
  herbalist: {
    name: 'Herbalista',
    items: ['potion_weak', 'potion_mana', 'potion_medium'],
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
  gIcon.style.width = '16px';
  gIcon.style.height = '16px';
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
    desc.className = 'shop-desc';
    desc.textContent = item.description || '';
    info.appendChild(desc);
    row.appendChild(info);

    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy';
    buyBtn.textContent = `${item.price} ouro`;
    buyBtn.disabled = playerStats.gold < item.price;
    buyBtn.onclick = () => {
      if (playerStats.gold < item.price) return;
      playerStats.gold -= item.price;

      // Adiciona ao inventário (stack)
      const existing = playerStats.inventory.find(i => i.id === itemId);
      if (existing) existing.qty++;
      else playerStats.inventory.push({ id: itemId, qty: 1 });

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