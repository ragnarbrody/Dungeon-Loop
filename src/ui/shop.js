// src/ui/shop.js
import { playerStats, saveGame, currentRoom } from '../core/state.js';
import { ITEMS_DB, addItemToInventory, remainingSpace, RARITY_COLORS, countItem, removeItem } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';
import { pickShopGreeting } from './shopgreetings.js';
import { attachTooltip, hideTooltip } from './tooltip.js';
import { getCityData } from '../world/cities.js';

// Labels de stats (mesma nomenclatura usada no inventory)
const STAT_LABELS = {
  str: 'Força',
  agi: 'Agilidade',
  int: 'Inteligência',
  def: 'Defesa',
  vit: 'Vitalidade',
  magia: 'Magia',
};

// ============================================================
// ESTOQUES POR LOJA × CIDADE
//
// Cada entrada: array de itemIds.
// Cidades novas: adicionar uma chave. Fallback = 'aethel'.
// ============================================================
const SHOP_INVENTORY = {
  blacksmith: {
    aethel: [
      'torch', 'sword', 'dagger', 'staff', 'bow', 'axe',
      'steel_sword', 'arcane_staff', 'ranger_bow', 'shadow_dagger',
    ],
    akmira: [
      'steel_sword', 'ranger_bow', 'arcane_staff', 'shadow_dagger', 'war_axe', 
      'akmira_sword', 'akmira_staff', 'akmira_dagger', 'akmira_bow',
    ],
  },
  armorer: {
    aethel: [
      'shield', 'iron_shield',
      'leather_helmet', 'leather_armor', 'leather_boots',
      'iron_helmet', 'iron_armor', 'iron_boots',
      'shadowstep_boots',
    ],
    akmira: [
      'iron_shield','runic_shield',
      'iron_helmet', 'iron_armor', 'iron_boots',
      'runic_helmet', 'runic_armor', 'runic_boots',
      'shadowstep_boots',
    ],
  },
  herbalist: {
    aethel: [
      'potion_weak', 'potion_medium',
      'potion_mana', 'potion_mana_medium',
      'potion_str', 'potion_agi',
    ],
    akmira: [
      'potion_medium', 'potion_strong',
      'potion_mana_medium', 'potion_mana_strong',
      'potion_str', 'potion_agi', 'potion_def',
      'antidote',
    ],
  },
  jeweler: {
    aethel: [],
    akmira: [
      'ring_power', 'ring_agility',
      'amulet_mana', 'ring_luck', 'amulet_guardian',
    ],
  },
};

const SELL_FILTER = {
  herbalist: ['material', 'consumable', 'loot'],
  blacksmith: ['material', 'weapon', 'loot', 'torch'],
  armorer: ['shield', 'material', 'armor', 'helmet', 'boots', 'loot'],
  jeweler: ['jewelry', 'material', 'loot'],
};

export function getShopInventory(buildingId, cityId) {
  const stock = SHOP_INVENTORY[buildingId];
  if (!stock) return [];
  return stock[cityId] || stock.aethel || [];
}

export function getShopName(buildingId) {
  const names = {
    herbalist: 'Herbalista',
    blacksmith: 'Ferreiro',
    armorer: 'Armeiro',
    jeweler: 'Joalheira',
  };
  return names[buildingId] || 'Lojista';
}

let container = null;
let currentTab = 'buy';   // 'buy' | 'sell'

// Estado da loja aberta (pra renderBody não depender de lookup por nome)
let openBuildingId = null;
let openCityId = 'aethel';
let openPriceMul = 1;

// ============================================================
// HELPERS DE TEXTO
// ============================================================
function getReqParts(item) {
  const parts = [];
  if (item.reqLevel && item.reqLevel > 1) {
    parts.push({
      label: 'Nível',
      value: item.reqLevel,
      ok: playerStats.level >= item.reqLevel,
    });
  }
  if (item.reqStats) {
    for (const stat in item.reqStats) {
      const need = item.reqStats[stat];
      const base = playerStats[stat] || 0;
      parts.push({
        label: STAT_LABELS[stat] || stat,
        value: need,
        ok: base >= need,
      });
    }
  }
  return parts;
}

export function getStatsBonusText(item) {
  if (!item.stats) return '';
  const parts = [];
  for (const stat in item.stats) {
    const v = item.stats[stat];
    if (v === 0) continue;
    const sign = v > 0 ? '+' : '';
    parts.push(`${sign}${v} ${STAT_LABELS[stat] || stat}`);
  }
  return parts.length > 0 ? parts.join(', ') : '';
}

// ============================================================
// CONTAINER
// ============================================================
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

// ============================================================
// ABRIR / FECHAR
// ============================================================
export function openShop(buildingId) {
  // Descobre a cidade atual (o jogador está na cidade quando interage)
  const cityId = currentRoom?.cityId || 'aethel';
  const cityData = getCityData(cityId);

  openBuildingId = buildingId;
  openCityId = cityId;
  openPriceMul = cityData?.priceMul ?? 1;
  hideTooltip();

  const c = ensureContainer();
  c.classList.remove('hidden');
  c.querySelector('.shop-title').textContent =
    `${getShopName(buildingId)} (${cityData?.name?.replace('Cidade de ', '') || cityId})`;

  const greetEl = c.querySelector('.shop-greeting');
  if (greetEl) greetEl.textContent = pickShopGreeting(buildingId);

  currentTab = 'buy';
  renderBody(c);
}

export function closeShop() {
  if (!container) return;
  hideTooltip();
  container.classList.add('hidden');
}

export function isShopOpen() {
  return container && !container.classList.contains('hidden');
}

// ============================================================
// RENDER GERAL
// ============================================================
function renderBody(c) {
  if (!openBuildingId) return;

  // Fecha o tooltip — os elementos que estavam com hover vão ser
  // removidos, e o mouseleave não dispara.
  hideTooltip();

  // Abas ativas
  c.querySelectorAll('.shop-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });

  // Ouro
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
    renderBuyTab(itemsEl);
  } else {
    renderSellTab(itemsEl);
  }
}

// ============================================================
// ABA COMPRAR
// ============================================================
function renderBuyTab(itemsEl) {
  const ids = getShopInventory(openBuildingId, openCityId);
  for (const itemId of ids) {
    const item = ITEMS_DB[itemId];
    if (!item) continue;
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

    const cur = countItem(playerStats.inventory, itemId);
    const reqParts = getReqParts(item);
    const finalPrice = Math.round(item.price * openPriceMul);

    const desc = document.createElement('div');
    desc.className = 'shop-desc';
    desc.textContent = `${item.description} Você tem ${cur}.`;
    info.appendChild(desc);

    row.appendChild(info);

    const space = remainingSpace(playerStats.inventory, itemId);

    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy';
    buyBtn.textContent = `${finalPrice} ouro`;
    buyBtn.disabled = playerStats.gold < finalPrice || space <= 0;
    buyBtn.onclick = () => {
      if (playerStats.gold < finalPrice) return;
      if (remainingSpace(playerStats.inventory, itemId) <= 0) return;

      const added = addItemToInventory(playerStats.inventory, itemId, 1);
      if (added === 0) return;

      playerStats.gold -= finalPrice;
      saveGame();
      renderBody(container);
      showToast({
        itemId,
        title: item.name,
        subtitle: `-${finalPrice} ouro`,
        color: '#f0c060',
      });
    };
    row.appendChild(buyBtn);

    // Tooltip
    const tooltipLines = [item.description || item.name];

    const statsText = getStatsBonusText(item);
    if (statsText) tooltipLines.push(`Bônus: ${statsText}`);

    if (openPriceMul !== 1) {
      tooltipLines.push({
        text: `Preço base ${item.price} × ${openPriceMul.toFixed(2)}`,
        color: '#aaa',
      });
    }

    if (reqParts.length > 0) {
      tooltipLines.push('Requer:');
      for (const p of reqParts) {
        tooltipLines.push({
          text: `${p.label} ${p.value}`,
          color: p.ok ? '#6fbd63' : '#ff6b6b',
        });
      }
    }

    attachTooltip(row, () => ({
      title: item.name,
      lines: tooltipLines,
    }));

    itemsEl.appendChild(row);
  }

  if (itemsEl.children.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nada à venda aqui.';
    p.style.cssText = 'color: #666; text-align: center; font-size: 12px; padding: 20px;';
    itemsEl.appendChild(p);
  }
}

// ============================================================
// ABA VENDER
// ============================================================
function renderSellTab(itemsEl) {
  const sellFilter = SELL_FILTER[openBuildingId] || [];

  const totals = new Map();
  for (const entry of playerStats.inventory) {
    if (!entry.qty || entry.qty <= 0) continue;
    const info = ITEMS_DB[entry.id];
    if (!info || info.kind === 'quest') continue;
    if (!sellFilter.includes(info.kind)) continue;
    if (!info.sellPrice || info.sellPrice <= 0) continue;
    totals.set(entry.id, (totals.get(entry.id) || 0) + entry.qty);
  }
  const sellable = [...totals].map(([id, qty]) => ({ id, qty, info: ITEMS_DB[id] }));

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

    const sellOne = document.createElement('button');
    sellOne.className = 'shop-sell';
    sellOne.textContent = `Vender 1 (${item.info.sellPrice})`;
    sellOne.onclick = () => {
      if (removeItem(playerStats.inventory, item.id, 1) < 1) return;
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

    if (item.qty > 1) {
      const sellAll = document.createElement('button');
      sellAll.className = 'shop-sell shop-sell-all';
      sellAll.textContent = `Vender tudo (${item.info.sellPrice * item.qty})`;
      sellAll.onclick = () => {
        const n = countItem(playerStats.inventory, item.id);
        if (n <= 0) return;

        removeItem(playerStats.inventory, item.id, n);
        playerStats.gold += item.info.sellPrice * n;

        saveGame();
        renderBody(container);
        showToast({
          itemId: item.id,
          title: `${item.info.name} (x${n})`,
          subtitle: `+${item.info.sellPrice * n} ouro`,
          color: '#f0c060',
        });
      };
      row.appendChild(sellAll);
    }

    const tooltipLines = [item.info.description || item.info.name];

    const statsText = getStatsBonusText(item.info);
    if (statsText) tooltipLines.push(`Bônus: ${statsText}`);

    attachTooltip(row, () => ({
      title: item.info.name,
      lines: tooltipLines,
    }));

    itemsEl.appendChild(row);
  }
}