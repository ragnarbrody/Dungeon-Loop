import { canvas } from '../core/canvas.js';
import { STATE, gameState, battle, setGameState, playerStats } from '../core/state.js';
import { playerAction } from '../battle/battle.js';
import { renderInventory } from './inventory.js';
import { CLASSES } from '../classes.js';
import { getIcon } from '../sprites/icons.js';
import { CONSUMABLES } from '../items.js';

export const keys = {};

// Função para abrir/fechar inventário
function toggleInventory() {
  const invScreen = document.getElementById('inventory-screen');
  
  if (gameState === STATE.EXPLORE) {
    setGameState(STATE.INVENTORY);
    renderInventory();
    invScreen.classList.remove('hidden');
  } else if (gameState === STATE.INVENTORY) {
    setGameState(STATE.EXPLORE);
    invScreen.classList.add('hidden');
    // Reseta as teclas para o player não sair andando sozinho ao fechar
    for (let k in keys) keys[k] = false; 
  }
}

export function installInput() {
  // ---- Ícone da mochila no botão ----
  const btnInv = document.getElementById('btn-inventory');
  if (btnInv && !btnInv.dataset.iconInjected) {
    btnInv.dataset.iconInjected = '1';

    const icon = getIcon('bag');
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';

    // Coloca o ícone antes do texto "Mochila (I)"
    btnInv.insertBefore(icon, btnInv.firstChild);
  }

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    
    if (k === 'i' && gameState !== STATE.BATTLE) {
      toggleInventory();
      return;
    }

    if (gameState === STATE.INVENTORY) return; // Pausa as outras teclas

    keys[k] = true;

    // Combate
    if (gameState === STATE.BATTLE && battle.turn === 'player') {
      if (battle.showItems) {
        // No submenu de itens: Esc volta
        if (k === 'escape') playerAction('close_items');
        return;
      }

      // Navegação de alvo
      const living = battle.enemies.filter(e => e.hp > 0 && e.hiding === 0);
      if (living.length > 1) {
        if (k === 'arrowleft' || k === 'q') {
          const n = battle.enemies.length;
          for (let step = 1; step <= n; step++) {
            const idx = (battle.targetIndex - step + n) % n;
            if (battle.enemies[idx].hp > 0 && battle.enemies[idx].hiding === 0) {
              battle.targetIndex = idx;
              break;
            }
          }
          return;
        }
        if (k === 'arrowright' || k === 'e') {
          const n = battle.enemies.length;
          for (let step = 1; step <= n; step++) {
            const idx = (battle.targetIndex + step) % n;
            if (battle.enemies[idx].hp > 0 && battle.enemies[idx].hiding === 0) {
              battle.targetIndex = idx;
              break;
            }
          }
          return;
        }
      }

      const cls = CLASSES[playerStats.classId];
      if (!cls) return;

      // ESC: volta pro menu principal (se estiver em submenu)
      if (k === 'escape') {
        if (battle.tooltipSkill) {
          battle.tooltipSkill = null;
          battle.tooltipPos = null;
          return;
        }
        if (battle.menuMode !== 'main') playerAction('menu_main');
        return;
      }

      // Atalhos do menu principal
      if (battle.menuMode === 'main') {
        if (k === 'a' || k === '1') { playerAction('menu_skills'); return; }
        if (k === 'i' || k === '2') { playerAction('menu_items'); return; }
        if (k === 'r' || k === '3') { playerAction('rest'); return; }
        if (k === 'f' || k === '4') { playerAction('flee'); return; }
        return;
      }

      // Submenu de skills: Q/E para paginar, 1-3 para usar
      if (battle.menuMode === 'skills') {
        if (k === 'q') { playerAction('skill_page_prev'); return; }
        if (k === 'e') { playerAction('skill_page_next'); return; }

        const PER_PAGE = 3;
        const page = battle.skillPage;
        const idx = parseInt(k) - 1;
        if (idx >= 0 && idx < PER_PAGE) {
          const globalIdx = page * PER_PAGE + idx;
          if (globalIdx >= 0 && globalIdx < cls.skills.length) {
            playerAction(cls.skills[globalIdx].id);
          }
        }
        return;
      }

      // Submenu de itens: 1-9 seleciona
      if (battle.menuMode === 'items') {
        const usableItems = playerStats.inventory.filter(i => i.qty > 0 && CONSUMABLES[i.id]);
        const idx = parseInt(k) - 1;
        if (idx >= 0 && idx < usableItems.length) {
          playerAction(`use_item_${usableItems[idx].id}`);
        }
        return;
      }
    }
  });

  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  // Clique no botão da mochila
  document.getElementById('btn-inventory').addEventListener('click', toggleInventory);

  // Clique nos botões de combate
  canvas.addEventListener('click', e => {
    if (gameState !== STATE.BATTLE) return;
    if (battle.turn !== 'player') return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Procura um botão clicado (ordem inversa: o ⓘ é registrado DEPOIS dos
    // botões da skill, então ele fica "por cima" na checagem)
    for (let i = battle.buttons.length - 1; i >= 0; i--) {
      const b = battle.buttons[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        if (b.action === '__toggle_tooltip__') {
          // Toggle do tooltip
          if (battle.tooltipSkill === b._skill) {
            battle.tooltipSkill = null;
            battle.tooltipPos = null;
          } else {
            battle.tooltipSkill = b._skill;
            battle.tooltipPos = { x: b.x, y: b.y + b.h + 8 };
          }
          return;
        }
        // Fecha o tooltip se estava aberto e clicou num botão normal
        battle.tooltipSkill = null;
        battle.tooltipPos = null;

        playerAction(b.action);
        return;
      }
    }

    // Clique fora de qualquer botão: fecha o tooltip
    if (battle.tooltipSkill) {
      battle.tooltipSkill = null;
      battle.tooltipPos = null;
    }
  });
}