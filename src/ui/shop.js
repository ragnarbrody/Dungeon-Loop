// src/ui/shop.js
import { playerStats, saveGame } from '../core/state.js';
import { ITEMS_DB, addItemToInventory, remainingSpace, RARITY_COLORS, countItem, removeItem } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';
import { pickShopGreeting } from './shopgreetings.js';
import { attachTooltip } from './tooltip.js';

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
// ESTOQUE
// ============================================================
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
    items: [
      // Tocha (essencial pra caverna)
      'torch',
      // Armas básicas
      'sword', 'dagger', 'staff', 'bow', 'axe',
      // Armas avançadas
      'steel_sword', 'war_axe', 'arcane_staff', 'ranger_bow', 'shadow_dagger',
    ],
    sellFilter: ['material', 'weapon', 'loot', 'torch'],
  },
  armorer: {
    name: 'Armeiro',
    items: [
      // Escudos
      'shield', 'iron_shield', 'runic_shield',
      // Conjunto de couro
      'leather_helmet', 'leather_armor', 'leather_boots',
      // Conjunto rúnico
      'runic_helmet', 'runic_armor', 'runic_boots',
    ],
    sellFilter: ['shield', 'material', 'armor', 'helmet', 'boots'],
  },
};

let container = null;
let currentTab = 'buy';   // 'buy' | 'sell'

// ============================================================
// HELPERS DE TEXTO
// ============================================================

// Monta a lista de requisitos como [{ label, value, ok }]
// `ok` = true se o jogador cumpre aquele requisito.
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

// Monta a lista de bônus de stats como string " +N Força, +N Agilidade"
// (só pro tooltip)
function getStatsBonusText(item) {
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

// ============================================================
// RENDER GERAL
// ============================================================
function renderBody(c) {
  const shop = SHOPS[Object.keys(SHOPS).find(k => SHOPS[k].name === c.querySelector('.shop-title').textContent)];
  // (fallback seguro se a busca por nome falhar)
  if (!shop) return;

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
    renderBuyTab(itemsEl, shop);
  } else {
    renderSellTab(itemsEl, shop);
  }
}

// ============================================================
// ABA COMPRAR
// ============================================================
function renderBuyTab(itemsEl, shop) {
  for (const itemId of shop.items) {
    const item = ITEMS_DB[itemId];
    if (!item) continue;
    if (item.kind === 'quest') continue;   // defesa: nunca listar quest

    const row = document.createElement('div');
    row.className = 'shop-row';

    const icon = getIcon(itemId);
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.imageRendering = 'pixelated';
    row.appendChild(icon);

    // --- Info (nome + descrição + requisitos inline) ---
    const info = document.createElement('div');
    info.className = 'shop-info';

    const name = document.createElement('div');
    name.className = 'shop-name';
    name.textContent = item.name;
    info.appendChild(name);

    const cur = countItem(playerStats.inventory, itemId);
    const reqParts = getReqParts(item);

    const desc = document.createElement('div');
    desc.className = 'shop-desc';
    desc.textContent = `${item.description} Você tem ${cur}.`;
    info.appendChild(desc);

    row.appendChild(info);

    // --- Botão de compra ---
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
      showToast({
        itemId,
        title: item.name,
        subtitle: `-${item.price} ouro`,
        color: '#f0c060',
      });
    };
    row.appendChild(buyBtn);

    // --- Tooltip estilizado ---
    const tooltipLines = [item.description || item.name];

    const statsText = getStatsBonusText(item);
    if (statsText) tooltipLines.push(`Bônus: ${statsText}`);

    if (reqParts.length > 0) {
      tooltipLines.push('Requer:');
      for (const p of reqParts) {
        // p = { label, value, ok }
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
}

// ============================================================
// ABA VENDER
// ============================================================
function renderSellTab(itemsEl, shop) {
  const sellFilter = shop.sellFilter || [];

  // Itens vendáveis: estão no inventário, batem com o filtro, e NÃO são quest.
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

    // --- Info ---
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

    // --- Botão 1: Vender 1 ---
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

    // --- Botão 2: Vender tudo (se qty > 1) ---
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

    // --- Tooltip estilizado ---
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