// src/ui/inventory.js
import { playerEquip, ITEM_INFO, getEquipBonusSources } from '../sprites/equipment.js';
import { playerStats, saveGame } from '../core/state.js';
import {
  CONSUMABLES, ITEMS_DB, RARITY_COLORS, RARITY_ORDER, addItemToInventory, removeItem
} from '../items.js';
import { getIcon, appendIcon } from '../sprites/icons.js';
import { CLASSES } from '../classes.js';
import { composeFrame } from '../sprites/compose.js';
import { player } from '../core/state.js';
import { showToast } from './toast.js';
import { sfx } from '../audio/audio.js';
import { attachTooltip } from './tooltip.js';

let currentTab = 'inventory';
let inventoryPage = 0;

const ITEMS_PER_PAGE = 16;

const EQUIP_SLOTS = [
  { id: 'helmet',     label: 'Capacete',    icon: 'helmet' },
  { id: 'amulet',     label: 'Amuleto',     icon: 'amulet' },
  { id: 'rightHand',  label: 'Mão direita', icon: 'sword' },
  { id: 'armor',      label: 'Peitoral',    icon: 'armor' },
  { id: 'leftHand',   label: 'Mão esquerda',icon: 'shield' },
  { id: 'ring1',      label: 'Anel 1',      icon: 'ring' },
  { id: 'boots',      label: 'Botas',       icon: 'boots' },
  { id: 'ring2',      label: 'Anel 2',      icon: 'ring' },
];

const STAT_LABELS = {
  str: 'Força',
  agi: 'Agilidade',
  int: 'Inteligência',
  def: 'Defesa',
  vit: 'Vitalidade',
  magia: 'Magia',
};

// ============================================================
// EQUIPAR / DESEQUIPAR
// ============================================================
function equipItem(itemId) {
  const info = ITEMS_DB[itemId];
  if (!info || !info.slot) return;

  // ---- Requisitos ----
  const reqLevel = info.reqLevel ?? 1;
  if (playerStats.level < reqLevel) {
    showToast({
      itemId: info.id,
      title: 'Requisito não atendido',
      subtitle: `Precisa de nível ${reqLevel}.`,
      color: '#ff6b6b',
    });
    return;
  }

  const reqStats = info.reqStats || {};
  const missing = [];
  for (const stat in reqStats) {
    // IMPORTANTE: checar contra o stat BASE, não o effStat,
    // senão dá pra burlar com anel.
    const base = playerStats[stat] || 0;
    const need = reqStats[stat];
    if (base < need) {
      const label = STAT_LABELS[stat] || stat;
      missing.push(`${label} ${need}`);
    }
  }
  if (missing.length > 0) {
    showToast({
      itemId: info.id,
      title: 'Requisito não atendido',
      subtitle: `Precisa de ${missing.join(', ')}.`,
      color: '#ff6b6b',
    });
    return;
  }

  const slot = info.slot;
  const currentId = playerEquip[slot];
  if (currentId === itemId) return;

  if (removeItem(playerStats.inventory, itemId, 1) < 1) return;
  if (currentId) addItemToInventory(playerStats.inventory, currentId, 1);

  playerEquip[slot] = itemId;
  saveGame();
  sfx('equip');
  renderInventory();
}

function unequipSlot(slotId) {
  const currentId = playerEquip[slotId];
  if (!currentId) return;

  // Devolve o item pro inventário
  addItemToInventory(playerStats.inventory, currentId, 1);

  playerEquip[slotId] = null;
  saveGame();
  sfx('unequip');
  renderInventory();
}

// ============================================================
// RENDER
// ============================================================
export function renderInventory() {
  renderPreview();
  renderTitle();
  renderStatsHeader();

  const body = document.getElementById('inventory-body');
  if (!body) return;
  body.innerHTML = '';

  renderTabs(body);

  if (currentTab === 'inventory') {
    renderInventoryTab(body);
  } else if (currentTab === 'equipment') {
    renderEquipmentTab(body);
  } else if (currentTab === 'skills') {
    renderSkillsTab(body);
  }
}

function renderPreview() {
  const previewEl = document.getElementById('inventory-preview');
  if (!previewEl) return;
  previewEl.innerHTML = '';
  const spriteCanvas = composeFrame(player.facing || 'down', 0);
  const copy = document.createElement('canvas');
  copy.width = 32; copy.height = 32;
  const cg = copy.getContext('2d');
  cg.imageSmoothingEnabled = false;
  cg.drawImage(spriteCanvas, 0, 0);
  previewEl.appendChild(copy);
}

function renderTitle() {
  const title = document.querySelector('#inventory-screen h2');
  if (title && !title.dataset.iconInjected) {
    title.dataset.iconInjected = '1';
    const icon = getIcon('bag');
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.imageRendering = 'pixelated';
    title.insertBefore(icon, title.firstChild);
  }
}

function renderTabs(parent) {
  const tabs = document.createElement('div');
  tabs.className = 'inv-tabs';

  const tabsDef = [
    { id: 'inventory', label: 'Inventário' },
    { id: 'equipment', label: 'Equipamentos' },
    { id: 'skills',    label: 'Habilidades' },
  ];

  for (const t of tabsDef) {
    const btn = document.createElement('button');
    btn.className = 'inv-tab' + (currentTab === t.id ? ' active' : '');
    btn.textContent = t.label;
    btn.onclick = () => {
      currentTab = t.id;
      inventoryPage = 0;
      renderInventory();
    };
    tabs.appendChild(btn);
  }

  parent.appendChild(tabs);
}

function renderStatsHeader() {
  const statsHeader = document.getElementById('inventory-stats');
  if (!statsHeader) return;
  statsHeader.innerHTML = '';

  const cls = playerStats.classId ? CLASSES[playerStats.classId] : null;
  const className = cls ? cls.name : '—';

  const line1 = document.createElement('div');
  line1.style.cssText = 'margin-bottom: 10px; color: #c9a24d; font-size: 16px;';
  line1.innerHTML = `<strong>${className}</strong> · Nível ${playerStats.level} |
    HP: ${playerStats.hp}/${playerStats.maxHp} |
    MP: ${playerStats.mp}/${playerStats.maxMp}`;
  statsHeader.appendChild(line1);

  const goldLine = document.createElement('div');
  goldLine.style.cssText = 'margin-bottom: 8px; color: #f0c060; display: flex; align-items: center; justify-content: center; gap: 6px;';
  const goldIcon = getIcon('gold');
  goldIcon.style.width = '32px';
  goldIcon.style.height = '32px';
  goldIcon.style.imageRendering = 'pixelated';
  goldLine.appendChild(goldIcon);
  const goldTxt = document.createElement('span');
  goldTxt.textContent = `Ouro: ${playerStats.gold}`;
  goldLine.appendChild(goldTxt);
  statsHeader.appendChild(goldLine);

  const grid = document.createElement('div');
  grid.style.cssText = 'font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 5px;';

  // Fontes de bônus por stat (uma vez só, evita recalcular)
  const eqSources = getEquipBonusSources(playerEquip);

  const statRows = [
    { id: 'str',   label: 'Força' },
    { id: 'agi',   label: 'Agilidade' },
    { id: 'int',   label: 'Inteligência' },
    { id: 'def',   label: 'Defesa' },
    { id: 'vit',   label: 'Vitalidade' },
    { id: 'magia', label: 'Magia' },
  ];

  for (const row of statRows) {
    const base = playerStats[row.id] || 0;
    const sources = eqSources[row.id] || [];
    const bonus = sources.reduce((acc, s) => acc + s.amount, 0);
    const total = base + bonus;
    const modified = bonus !== 0;

    const line = document.createElement('span');
    line.style.cssText = 'display:flex; align-items:center; gap:4px;';

    // Ícone maior (18px em vez de 14)
    appendIcon(line, row.id, 18);

    // Texto com cor diferente se modificado
    const txt = document.createElement('span');
    txt.textContent = modified
      ? `${row.label}: ${total} `
      : `${row.label}: ${total}`;
    if (modified) {
      txt.style.color = '#8ad8ff';   // azul claro = buffado
      txt.style.fontWeight = 'bold';
    } else {
      txt.style.color = '#ddd';
    }

    // Parte do bônus, em outra cor, tipo "(+3)"
    if (modified) {
      const bonusSpan = document.createElement('span');
      const sign = bonus > 0 ? '+' : '';
      bonusSpan.textContent = `(${sign}${bonus})`;
      bonusSpan.style.color = bonus > 0 ? '#6fbd63' : '#ff6b6b';
      bonusSpan.style.fontSize = '11px';
      txt.appendChild(bonusSpan);
    }

    // Tooltip no hover (dentro do <span> wrapper, pra pegar a linha toda)
    if (modified) {
      const detail = sources
        .map(s => `${s.amount > 0 ? '+' : ''}${s.amount} ${s.name}`)
        .join('\n');
      attachTooltip(line, () => ({
        title: STAT_LABELS[row.id] || row.label,
        lines: [
          `Base: ${base}`,
          `Equipamento:`,
          detail,
          `Total: ${total}`,
        ],
      }));
    }

    line.appendChild(txt);
    grid.appendChild(line);
  }
  statsHeader.appendChild(grid);

  const hr = document.createElement('hr');
  hr.style.cssText = 'border-color: #444; margin: 10px 0;';
  statsHeader.appendChild(hr);
}

function renderInventoryTab(parent) {
  const allItems = [];
  for (const entry of playerStats.inventory) {
    if (!entry.qty || entry.qty <= 0) continue;   // ← NOVO: ignora qty 0
    const info = ITEMS_DB[entry.id];
    if (!info) continue;
    allItems.push({ id: entry.id, qty: entry.qty, info, entry });
  }

  const kindOrder = {
    weapon: 0, shield: 1, torch: 2, armor: 3, helmet: 4, boots: 5,
    ring: 6, amulet: 7, consumable: 8, material: 9, loot: 10, quest: 11,
  };
  allItems.sort((a, b) => {
    const ka = a.info.kind || a.info.type;
    const kb = b.info.kind || b.info.type;
    const ra = RARITY_ORDER[a.info.rarity] ?? 0;
    const rb = RARITY_ORDER[b.info.rarity] ?? 0;
    const qa = ka === 'quest' ? 0 : 1;
    const qb = kb === 'quest' ? 0 : 1;
    if (qa !== qb) return qa - qb;
    if (ra !== rb) return rb - ra;
    const oa = kindOrder[ka] ?? 99;
    const ob = kindOrder[kb] ?? 99;
    if (oa !== ob) return oa - ob;
    return a.info.name.localeCompare(b.info.name);
  });

  if (allItems.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Inventário vazio.';
    empty.style.cssText = 'color: #555; font-size: 12px; text-align: center; padding: 20px;';
    parent.appendChild(empty);
    return;
  }

  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  if (inventoryPage >= totalPages) inventoryPage = totalPages - 1;
  if (inventoryPage < 0) inventoryPage = 0;

  const start = inventoryPage * ITEMS_PER_PAGE;
  const pageItems = allItems.slice(start, start + ITEMS_PER_PAGE);

  if (totalPages > 1) {
    const pageInfo = document.createElement('div');
    pageInfo.style.cssText = 'width: 100%; text-align: center; font-size: 11px; color: #aaa; margin-bottom: 8px;';
    pageInfo.textContent = `Página ${inventoryPage + 1} / ${totalPages}`;
    parent.appendChild(pageInfo);
  }

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; align-items: stretch; gap: 6px; width: 100%;';

  if (totalPages > 1 && inventoryPage > 0) {
    const leftBtn = document.createElement('button');
    leftBtn.className = 'inv-page-arrow';
    leftBtn.textContent = '◄';
    leftBtn.onclick = () => { inventoryPage--; renderInventory(); };
    wrapper.appendChild(leftBtn);
  } else if (totalPages > 1) {
    const ph = document.createElement('div');
    ph.style.cssText = 'width: 24px; flex-shrink: 0;';
    wrapper.appendChild(ph);
  }

  const grid = document.createElement('div');
  grid.className = 'inv-grid';
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; flex: 1;';

  for (const item of pageItems) {
    grid.appendChild(createItemTile(item, item.qty));
  }
  wrapper.appendChild(grid);

  if (totalPages > 1 && inventoryPage < totalPages - 1) {
    const rightBtn = document.createElement('button');
    rightBtn.className = 'inv-page-arrow';
    rightBtn.textContent = '►';
    rightBtn.onclick = () => { inventoryPage++; renderInventory(); };
    wrapper.appendChild(rightBtn);
  } else if (totalPages > 1) {
    const ph = document.createElement('div');
    ph.style.cssText = 'width: 24px; flex-shrink: 0;';
    wrapper.appendChild(ph);
  }

  parent.appendChild(wrapper);
}

function createItemTile(item, qty) {
  const info = item.info;
  const kind = info.kind || info.type;
  const isQuest = kind === 'quest';
  const isConsumable = kind === 'consumable' && !info.combatOnly;
  const isCombatOnly = kind === 'consumable' && !!info.combatOnly;
  const isEquippable = !isQuest && !!info.slot && kind !== 'consumable';

  // <button> pra clicáveis (consumable ou equippable)
  const tile = document.createElement(
    (isConsumable || isEquippable) ? 'button' : 'div'
  );
  tile.className = 'inv-item-tile'
    + (isQuest ? ' quest-item' : '')
    + (isCombatOnly ? ' combat-only' : '');

  // ---- Tooltip estilizado ----
  const tooltipTitle = info.name;
  const tooltipLines = [info.description || info.name];
  if (isCombatOnly) tooltipLines.push('— utilizável apenas em combates.');

  // Requisitos: cada um com cor baseada em se o jogador cumpre
  const reqLines = [];
  if (info.reqLevel && info.reqLevel > 1) {
    const ok = playerStats.level >= info.reqLevel;
    reqLines.push({
      text: `Nível ${info.reqLevel}`,
      color: ok ? '#6fbd63' : '#ff6b6b',
    });
  }
  if (info.reqStats) {
    for (const stat in info.reqStats) {
      const need = info.reqStats[stat];
      const base = playerStats[stat] || 0;
      const ok = base >= need;
      reqLines.push({
        text: `${STAT_LABELS[stat] || stat} ${need}`,
        color: ok ? '#6fbd63' : '#ff6b6b',
      });
    }
  }
  if (reqLines.length > 0) {
    tooltipLines.push('Requer:');
    for (const r of reqLines) tooltipLines.push(r);
  }

  attachTooltip(tile, () => ({
    title: tooltipTitle,
    lines: tooltipLines,
  }));

  // ---- Comportamento ----
  if (isConsumable) {
    tile.style.cursor = 'pointer';
    tile.onclick = () => {
      const result = info.use(playerStats);
      item.entry.qty--;
      if (item.entry.qty <= 0) {
        const idx = playerStats.inventory.indexOf(item.entry);
        if (idx >= 0) playerStats.inventory.splice(idx, 1);
      }
      saveGame();
      renderInventory();
      if (result.toast) showToast(result.toast);
      sfx('consume');
    };
  } else if (isEquippable) {
    tile.style.cursor = 'pointer';
    tile.onclick = () => equipItem(info.id);
  }

  // ---- Estilo ----
  const color = RARITY_COLORS[info.rarity] || '#bbb';
  tile.style.cssText += `
    width: 100%;
    aspect-ratio: 1;
    background: #2a2a3e;
    border: 2px solid ${isQuest ? '#feca57' : color};
    border-radius: 4px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 4px; gap: 3px;
    position: relative;
    box-shadow: ${isQuest ? '0 0 6px rgba(254, 202, 87, 0.5)' : 'none'};
    font-family: inherit;
    color: inherit;
    overflow: hidden;
    ${isCombatOnly ? 'opacity: 0.75;' : ''}
  `;

  const kindLabels = {
    weapon: 'Arma', shield: 'Escudo', torch: 'Tocha',
    armor: 'Peitoral', helmet: 'Capacete', boots: 'Botas',
    ring: 'Anel', amulet: 'Amuleto',
    consumable: 'Consumível', loot: 'Material', quest: 'Missão', material: 'Material'
  };

  const kindLabel = kindLabels[kind];
  if (kindLabel) {
    const kindEl = document.createElement('span');
    kindEl.style.cssText = 'position: absolute; top: 3px; left: 5px; font-size: 8px; color: #777; text-transform: uppercase; letter-spacing: 0.5px;';
    kindEl.textContent = kindLabel;
    tile.appendChild(kindEl);
  }

  const iconSize = isCombatOnly ? '24px' : '28px';
  const icon = getIcon(info.icon || info.id);
  icon.style.width = iconSize;
  icon.style.height = iconSize;
  icon.style.imageRendering = 'pixelated';
  tile.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'inv-item-name';
  name.style.cssText = 'font-size: 11px; text-align: center; line-height: 1.15; overflow: hidden; max-height: 2.4em;';
  name.textContent = info.name;
  tile.appendChild(name);

  if (isCombatOnly) {
    const warn = document.createElement('span');
    warn.style.cssText = `
      font-size: 8px;
      color: #ffb703;
      text-align: center;
      line-height: 1.1;
      font-style: italic;
      letter-spacing: 0.2px;
    `;
    warn.textContent = 'só em combates';
    tile.appendChild(warn);
  }

  if (qty > 1) {
    const qtyEl = document.createElement('span');
    qtyEl.style.cssText = 'position: absolute; top: 3px; right: 5px; font-size: 11px; color: #eee; font-weight: bold; text-shadow: 1px 1px 0 #000;';
    qtyEl.textContent = `x${qty}`;
    tile.appendChild(qtyEl);
  }

  // ---- Selo de "equipável" (canto inferior direito) ----
  // Um mini-escudo desenhado com CSS puro (borda + triângulo), sem imagem.
  // Só aparece em itens que têm `slot` e não são consumíveis/quest.
  if (isEquippable) {
    const seal = document.createElement('div');
    seal.title = 'Equipável';
    seal.style.cssText = `
      position: absolute;
      bottom: 3px;
      right: 3px;
      width: 12px;
      height: 14px;
      background: linear-gradient(180deg, #c9a24d 0%, #8a6a2a 100%);
      border: 1px solid #f0d27a;
      border-radius: 0 0 50% 50% / 0 0 35% 35%;
      box-shadow: 0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
      pointer-events: none;
    `;
    // Pequena "cruz" no centro do escudo (dá leitura de "equipamento")
    const inner = document.createElement('div');
    inner.style.cssText = `
      position: absolute;
      top: 3px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 6px;
      background: #3a2a10;
    `;
    seal.appendChild(inner);
    const horizontal = document.createElement('div');
    horizontal.style.cssText = `
      position: absolute;
      top: 5px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 2px;
      background: #3a2a10;
    `;
    seal.appendChild(horizontal);
    tile.appendChild(seal);
  }

  return tile;
}

function renderEquipmentTab(parent) {
  const hint = document.createElement('p');
  hint.style.cssText = 'color: #666; font-size: 11px; margin: 0 0 12px 0; text-align: center;';
  hint.textContent = 'Clique num slot preenchido para desequipar.';
  parent.appendChild(hint);

  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;';

  for (const slot of EQUIP_SLOTS) {
    const itemId = playerEquip[slot.id];
    const item = itemId ? ITEMS_DB[itemId] : null;

    const slotEl = document.createElement(item ? 'button' : 'div');
    slotEl.className = 'inv-equip-slot' + (item ? ' filled' : ' empty');
    slotEl.style.cssText = `
      background: ${item ? '#3a2a1e' : '#1a1a24'};
      border: 2px solid ${item ? '#c9a24d' : '#333'};
      border-radius: 4px;
      padding: 8px;
      display: flex; align-items: center; gap: 8px;
      min-height: 50px;
      font-family: inherit;
      color: inherit;
      text-align: left;
      ${item ? 'cursor: pointer;' : ''}
    `;

    if (item) {
      slotEl.onclick = () => unequipSlot(slot.id);
    }

    if (item) {
      const icon = getIcon(item.icon || item.id);
      icon.style.width = '24px';
      icon.style.height = '24px';
      icon.style.imageRendering = 'pixelated';
      slotEl.appendChild(icon);
    } else {
      const ph = document.createElement('div');
      ph.style.cssText = 'width: 24px; height: 24px; border: 1px dashed #444; border-radius: 2px;';
      slotEl.appendChild(ph);
    }

    const text = document.createElement('div');
    text.style.cssText = 'display: flex; flex-direction: column; gap: 2px; flex: 1;';
    const slotName = document.createElement('span');
    slotName.style.cssText = 'font-size: 10px; color: #888;';
    slotName.textContent = slot.label;
    text.appendChild(slotName);
    const itemName = document.createElement('span');
    itemName.style.cssText = `font-size: 11px; color: ${item ? '#eee' : '#555'}; font-weight: bold;`;
    itemName.textContent = item ? item.name : 'Vazio';
    text.appendChild(itemName);
    slotEl.appendChild(text);

    grid.appendChild(slotEl);
  }

  parent.appendChild(grid);
}

function renderSkillsTab(parent) {
  // (idêntico ao seu)
  const cls = playerStats.classId ? CLASSES[playerStats.classId] : null;
  if (!cls) {
    const p = document.createElement('p');
    p.textContent = 'Nenhuma habilidade.';
    p.style.cssText = 'color: #555; font-size: 12px;';
    parent.appendChild(p);
    return;
  }

  const hint = document.createElement('p');
  hint.style.cssText = 'color: #666; font-size: 11px; margin: 0 0 12px 0; text-align: center;';
  hint.textContent = 'Habilidades são fixas por classe.';
  parent.appendChild(hint);

  const grid = document.createElement('div');
  grid.style.cssText = 'display: flex; flex-direction: column; gap: 8px; width: 100%;';

  for (const sk of cls.skills) {
    const row = document.createElement('div');
    row.style.cssText = `
      background: #2a2a3e;
      border: 1px solid #c9a24d;
      border-radius: 4px;
      padding: 10px 12px;
      display: flex; align-items: center; gap: 10px;
    `;

    const iconEl = document.createElement('div');
    iconEl.style.cssText = 'font-size: 20px; width: 28px; text-align: center;';
    iconEl.textContent = sk.icon || '✦';
    row.appendChild(iconEl);

    const info = document.createElement('div');
    info.style.cssText = 'display: flex; flex-direction: column; gap: 2px; flex: 1;';

    const name = document.createElement('div');
    name.style.cssText = 'font-size: 13px; font-weight: bold; color: #eee;';
    name.textContent = sk.name;
    info.appendChild(name);

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size: 11px; color: #aaa;';
    desc.textContent = sk.desc;
    info.appendChild(desc);

    const cost = document.createElement('div');
    cost.style.cssText = 'font-size: 10px; color: #8ad8ff;';
    cost.textContent = `Custo: ${sk.cost} MP`;
    info.appendChild(cost);

    row.appendChild(info);
    grid.appendChild(row);
  }

  parent.appendChild(grid);
}