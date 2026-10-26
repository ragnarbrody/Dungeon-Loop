import { playerEquip, ITEM_INFO } from '../sprites/equipment.js';
import { playerStats, saveGame } from '../core/state.js';
import { CONSUMABLES } from '../items.js';
import { getIcon, appendIcon } from '../sprites/icons.js';
import { CLASSES } from '../classes.js';
import { composeFrame } from '../sprites/compose.js';
import { player } from '../core/state.js'
import { showToast } from './toast.js';
import { ITEMS_DB } from '../items.js';

export function renderInventory() {
  const previewEl = document.getElementById('inventory-preview');
  if (previewEl) {
    previewEl.innerHTML = '';
    // Usa a direção atual do player e frame idle (step 0)
    const spriteCanvas = composeFrame(player.facing || 'down', 0);
    
    // composeFrame retorna um canvas compartilhado; precisamos copiar
    const copy = document.createElement('canvas');
    copy.width = 32;
    copy.height = 32;
    const cg = copy.getContext('2d');
    cg.imageSmoothingEnabled = false;
    cg.drawImage(spriteCanvas, 0, 0);
    
    previewEl.appendChild(copy);
  }

  const title = document.querySelector('#inventory-screen h2');
  if (title && !title.dataset.iconInjected) {
    title.dataset.iconInjected = '1';
    const icon = getIcon('bag');
    icon.style.width = '28px';
    icon.style.height = '28px';
    icon.style.imageRendering = 'pixelated';
    title.insertBefore(icon, title.firstChild);
  }

  const slotsContainer = document.getElementById('inventory-slots');
  if (!slotsContainer) return;

  // ---------- HEADER COM MINI-ÍCONES ----------
  const statsHeader = document.getElementById('inventory-stats');
  if (statsHeader) {
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
    goldIcon.style.width = '16px';
    goldIcon.style.height = '16px';
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

  slotsContainer.innerHTML = '';

  const rightItem = playerEquip.rightHand;
  const leftItem  = playerEquip.leftHand;

  // Cria um slot com canvas (não innerHTML) para injetar o ícone
  function createSlotEl(itemId, isEquipped) {
    const div = document.createElement('div');
    div.className = 'inv-slot' + (isEquipped ? ' equipped' : '') + (itemId ? '' : ' empty');

    if (!itemId) return div;

    const info = ITEM_INFO[itemId] || { name: itemId };
    const icon = getIcon(itemId);
    icon.style.width = '24px';
    icon.style.height = '24px';
    icon.style.imageRendering = 'pixelated';
    div.appendChild(icon);

    const name = document.createElement('span');
    name.className = 'inv-item-name';
    name.textContent = `${info.name} ${isEquipped ? '(Equipado)' : ''}`;
    div.appendChild(name);

    return div;
  }

  slotsContainer.appendChild(createSlotEl(rightItem, true));
  slotsContainer.appendChild(createSlotEl(leftItem, true));
  slotsContainer.appendChild(createSlotEl(null, false));
  slotsContainer.appendChild(createSlotEl(null, false));

  const consContainer = document.getElementById('inventory-consumables');
  if (consContainer) {
    consContainer.innerHTML = '';

    const visible = playerStats.inventory.filter(item => {
      const info = ITEMS_DB[item.id];
      if (!info || info.type !== 'consumable') return false;
      if (info.combatOnly) return false;
      return item.qty > 0;
    });

    if (visible.length === 0) {
      consContainer.innerHTML = '<span style="font-size: 12px; color: #555;">Nenhum item utilizável.</span>';
    } else {
      visible.forEach((item) => {
        const info = CONSUMABLES[item.id];

        const btn = document.createElement('button');
        btn.className = 'inv-slot';
        btn.style.cssText = 'width: 90px; height: 75px; cursor: pointer; flex-direction: column; padding: 4px; justify-content: center; gap: 2px;';

        const icon = getIcon(item.id);
        icon.style.width = '28px';
        icon.style.height = '28px';
        icon.style.imageRendering = 'pixelated';
        btn.appendChild(icon);

        const name = document.createElement('span');
        name.className = 'inv-item-name';
        name.style.fontSize = '11px';
        name.textContent = info.name;
        btn.appendChild(name);

        const qty = document.createElement('span');
        qty.style.cssText = 'font-size: 10px; color: #888;';
        qty.textContent = `x${item.qty}`;
        btn.appendChild(qty);

        btn.onclick = () => {
          const result = info.use(playerStats);
          item.qty--;
          if (item.qty <= 0) {
            playerStats.inventory = playerStats.inventory.filter(i => i.id !== item.id);
          }
          saveGame();
          renderInventory();

          // Toast em vez de alert
          if (result.toast) showToast(result.toast);
        };

        consContainer.appendChild(btn);
      });
    }
  }
}