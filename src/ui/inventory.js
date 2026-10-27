// src/ui/inventory.js
import { playerEquip, ITEM_INFO } from '../sprites/equipment.js';
import { playerStats, saveGame } from '../core/state.js';
import {
  CONSUMABLES, ITEMS_DB, RARITY_COLORS, RARITY_ORDER,
} from '../items.js';
import { getIcon, appendIcon } from '../sprites/icons.js';
import { CLASSES } from '../classes.js';
import { composeFrame } from '../sprites/compose.js';
import { player } from '../core/state.js';
import { showToast } from './toast.js';

let currentTab = 'inventory'; // 'inventory' | 'equipment' | 'skills'
let inventoryPage = 0;        // página atual da aba Inventário

const ITEMS_PER_PAGE = 16;    // 4x4

// Slots de equipamento (ordem visual)
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

// ---------- HEADER (preview + título) ----------
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

// ---------- ABAS ----------
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
      inventoryPage = 0;   // reseta página ao trocar de aba
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

  const statRows = [
    { id: 'str',   label: 'Força',        val: playerStats.str },
    { id: 'agi',   label: 'Agilidade',    val: playerStats.agi },
    { id: 'int',   label: 'Inteligência', val: playerStats.int },
    { id: 'def',   label: 'Defesa',       val: playerStats.def },
    { id: 'vit',   label: 'Vitalidade',   val: playerStats.vit },
    { id: 'magia', label: 'Magia',        val: playerStats.magia },
  ];

  for (const row of statRows) {
    const line = document.createElement('span');
    line.style.cssText = 'display:flex; align-items:center; gap:4px;';
    appendIcon(line, row.id, 14);
    const txt = document.createElement('span');
    txt.textContent = `${row.label}: ${row.val}`;
    line.appendChild(txt);
    grid.appendChild(line);
  }
  statsHeader.appendChild(grid);

  const hr = document.createElement('hr');
  hr.style.cssText = 'border-color: #444; margin: 10px 0;';
  statsHeader.appendChild(hr);
}

// ---------- ABA: INVENTÁRIO (grade paginada 4x4) ----------
function renderInventoryTab(parent) {
  // Junta TODOS os itens do inventário numa lista única
  const allItems = [];
  for (const entry of playerStats.inventory) {
    const info = ITEMS_DB[entry.id];
    if (!info) continue;
    allItems.push({ id: entry.id, qty: entry.qty, info });
  }

  // Ordena: raridade (decrescente) → tipo (loot/quest por último? não — deixa natural) → nome
  const kindOrder = {
    weapon: 0, shield: 1, torch: 2, armor: 3, helmet: 4, boots: 5,
    ring: 6, amulet: 7, consumable: 8, loot: 9, quest: 10,
  };
  allItems.sort((a, b) => {
    const ka = a.info.kind || a.info.type;
    const kb = b.info.kind || b.info.type;
    const ra = RARITY_ORDER[a.info.rarity] ?? 0;
    const rb = RARITY_ORDER[b.info.rarity] ?? 0;
    // Itens de quest primeiro (destaque), depois raridade, depois tipo, depois nome
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

  // Paginação
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  if (inventoryPage >= totalPages) inventoryPage = totalPages - 1;
  if (inventoryPage < 0) inventoryPage = 0;

  const start = inventoryPage * ITEMS_PER_PAGE;
  const pageItems = allItems.slice(start, start + ITEMS_PER_PAGE);

  // Indicador de página (só se tem mais de 1)
  if (totalPages > 1) {
    const pageInfo = document.createElement('div');
    pageInfo.style.cssText = 'width: 100%; text-align: center; font-size: 11px; color: #aaa; margin-bottom: 8px;';
    pageInfo.textContent = `Página ${inventoryPage + 1} / ${totalPages}`;
    parent.appendChild(pageInfo);
  }

  // Wrapper com setas laterais
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; align-items: stretch; gap: 6px; width: 100%;';

  // Seta esquerda
  if (totalPages > 1 && inventoryPage > 0) {
    const leftBtn = document.createElement('button');
    leftBtn.className = 'inv-page-arrow';
    leftBtn.textContent = '◄';
    leftBtn.onclick = () => {
      inventoryPage--;
      renderInventory();
    };
    wrapper.appendChild(leftBtn);
  } else if (totalPages > 1) {
    // placeholder pra manter o grid alinhado
    const ph = document.createElement('div');
    ph.style.cssText = 'width: 24px; flex-shrink: 0;';
    wrapper.appendChild(ph);
  }

  // Grade 4x4
  const grid = document.createElement('div');
  grid.className = 'inv-grid';
  grid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; flex: 1;';

  for (const item of pageItems) {
    grid.appendChild(createItemTile(item, item.qty));
  }
  wrapper.appendChild(grid);

  // Seta direita
  if (totalPages > 1 && inventoryPage < totalPages - 1) {
    const rightBtn = document.createElement('button');
    rightBtn.className = 'inv-page-arrow';
    rightBtn.textContent = '►';
    rightBtn.onclick = () => {
      inventoryPage++;
      renderInventory();
    };
    wrapper.appendChild(rightBtn);
  } else if (totalPages > 1) {
    const ph = document.createElement('div');
    ph.style.cssText = 'width: 24px; flex-shrink: 0;';
    wrapper.appendChild(ph);
  }

  parent.appendChild(wrapper);
}

// Cria uma "tile" de item. Consumíveis são clicáveis; itens de quest têm destaque.
function createItemTile(item, qty) {
  const info = item.info;
  const kind = info.kind || info.type;
  const isQuest = kind === 'quest';
  const isConsumable = kind === 'consumable' && !info.combatOnly;
  const isEquippable = !isQuest && info.slot && kind !== 'consumable';

  if (isEquippable) {
    tile.style.cursor = 'pointer';
    tile.onclick = () => equipItem(info.id);
  }

  const tile = document.createElement(isConsumable ? 'button' : 'div');
  tile.className = 'inv-item-tile' + (isQuest ? ' quest-item' : '');
  tile.title = info.description || info.name;

  if (isConsumable) {
    tile.style.cursor = 'pointer';
    tile.onclick = () => {
      const result = info.use(playerStats);

      // Decrementa no array ORIGINAL (não na cópia passada pro tile)
      const original = playerStats.inventory.find(i => i.id === info.id);
      if (original) {
        original.qty--;
        if (original.qty <= 0) {
          playerStats.inventory = playerStats.inventory.filter(i => i.id !== info.id);
        }
      }

      saveGame();
      renderInventory();
      if (result.toast) showToast(result.toast);
    };
  }

  const color = RARITY_COLORS[info.rarity] || '#bbb';
  tile.style.cssText += `
    width: 100%;
    aspect-ratio: 1;
    background: #2a2a3e;
    border: 2px solid ${isQuest ? '#feca57' : color};
    border-radius: 4px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 4px; gap: 2px;
    position: relative;
    box-shadow: ${isQuest ? '0 0 6px rgba(254, 202, 87, 0.5)' : 'none'};
    font-family: inherit;
    color: inherit;
  `;

  // Cabeçalho de categoria (sutil, no topo do tile)
  const kindLabels = {
    weapon: 'Arma', shield: 'Escudo', torch: 'Tocha',
    armor: 'Peitoral', helmet: 'Capacete', boots: 'Botas',
    ring: 'Anel', amulet: 'Amuleto',
    consumable: 'Consumível', loot: 'Material', quest: 'Missão',
  };
  const kindLabel = kindLabels[kind];
  if (kindLabel) {
    const kindEl = document.createElement('span');
    kindEl.style.cssText = 'position: absolute; top: 2px; left: 4px; font-size: 7px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;';
    kindEl.textContent = kindLabel;
    tile.appendChild(kindEl);
  }

  const icon = getIcon(info.icon || info.id);
  icon.style.width = '28px';
  icon.style.height = '28px';
  icon.style.imageRendering = 'pixelated';
  tile.appendChild(icon);

  const name = document.createElement('span');
  name.className = 'inv-item-name';
  name.style.cssText = 'font-size: 9px; text-align: center; line-height: 1.1; overflow: hidden;';
  name.textContent = info.name;
  tile.appendChild(name);

  if (qty > 1) {
    const qtyEl = document.createElement('span');
    qtyEl.style.cssText = 'position: absolute; top: 2px; right: 4px; font-size: 10px; color: #eee; font-weight: bold; text-shadow: 1px 1px 0 #000;';
    qtyEl.textContent = `x${qty}`;
    tile.appendChild(qtyEl);
  }

  return tile;
}

// ---------- ABA: EQUIPAMENTOS (só os slots) ----------
function renderEquipmentTab(parent) {
  const hint = document.createElement('p');
  hint.style.cssText = 'color: #666; font-size: 11px; margin: 0 0 12px 0; text-align: center;';
  hint.textContent = 'Slots de capacete, peitoral, botas, anéis e amuletos em breve.';
  parent.appendChild(hint);

  const grid = document.createElement('div');
  grid.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%;';

  for (const slot of EQUIP_SLOTS) {
    const itemId = playerEquip[slot.id];
    const item = itemId ? ITEMS_DB[itemId] : null;

    const slotEl = document.createElement('div');
    slotEl.className = 'inv-equip-slot' + (item ? ' filled' : ' empty');
    slotEl.style.cssText = `
      background: ${item ? '#3a2a1e' : '#1a1a24'};
      border: 2px solid ${item ? '#c9a24d' : '#333'};
      border-radius: 4px;
      padding: 8px;
      display: flex; align-items: center; gap: 8px;
      min-height: 50px;
    `;

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

// ---------- ABA: HABILIDADES (só as skills) ----------
function renderSkillsTab(parent) {
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

function equipItem(itemId) {
  const info = ITEMS_DB[itemId];
  if (!info || !info.slot) return;

  const { playerEquip } = mod;
  const slot = info.slot;
  const currentId = playerEquip[slot];

  // Remove 1 unidade do item clicado do inventário
  const invItem = playerStats.inventory.find(i => i.id === itemId);
  if (!invItem || invItem.qty <= 0) return;
  invItem.qty--;
  if (invItem.qty <= 0) {
    playerStats.inventory = playerStats.inventory.filter(i => i.id !== itemId);
  }

  // Se havia algo equipado, devolve pro inventário
  if (currentId) {
    addItemToInventory(playerStats.inventory, currentId, 1);
  }

  playerEquip[slot] = itemId;
  saveGame();
}