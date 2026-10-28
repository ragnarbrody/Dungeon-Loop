import { canvas } from '../core/canvas.js';
import { STATE, gameState, battle, setGameState, playerStats, addGold, saveGame } from '../core/state.js';
import { playerAction } from '../battle/battle.js';
import { renderInventory } from './inventory.js';
import { CLASSES } from '../classes.js';
import { getIcon } from '../sprites/icons.js';
import { CONSUMABLES, addItemToInventory } from '../items.js';
import { openDialogue, closeDialogue, isDialogueOpen } from './dialogue.js';
import { portalText } from '../world/interactables.js';
import { enterBuilding, enterDungeon } from '../world/rooms.js';
import { openShop, closeShop, isShopOpen } from './shop.js';
import { openQuestLog, closeQuestLog, isQuestLogOpen } from './questlog.js';
import { talkToElder } from './elderdialog.js';
import {
  openWorldMap, closeWorldMap, isWorldMapOpen,
  handleMapClick, handleMapMove, handleMapRelease, handleMapWheel,
  centerOnPlayer,
} from './worldmap.js';
import { talkToHerbalist } from './herbalistdialog.js';
import { talkToBlacksmith } from './blacksmithdialog.js';
import { sfx } from '../audio/audio.js';
import { openAudioMenu, closeAudioMenu, isAudioMenuOpen } from './audiomenu.js';
import { isQuestActive } from '../quests.js';
import { playerEquip } from '../sprites/equipment.js';
import { showToast } from './toast.js';

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

// Função para abrir/fechar o quest log
function toggleQuestLog() {
  if (gameState === STATE.EXPLORE) {
    openQuestLog();
    setGameState(STATE.QUEST_LOG);
  } else if (gameState === STATE.QUEST_LOG) {
    closeQuestLog();
    setGameState(STATE.EXPLORE);
    for (let k in keys) keys[k] = false;
  }
}

// ============================================================
// Converte coordenadas do mouse (CSS) para coordenadas do canvas,
// descontando borda/padding corretamente.
//
// O canvas tem `border: 4px solid #0f0f1a` no CSS. `getBoundingClientRect()`
// retorna a caixa COM a borda, mas a área de desenho do canvas é SÓ o
// conteúdo. Sem descontar a borda, o clique fica deslocado em ~4px CSS
// (que viram vários pixels no espaço do canvas após o scale), e em telas
// pequenas isso é o suficiente para errar o ⓘ (que tem só 12px de diâmetro).
// ============================================================
function clientToCanvas(e) {
  const rect = canvas.getBoundingClientRect();
  const style = getComputedStyle(canvas);
  const borderL = parseFloat(style.borderLeftWidth)   || 0;
  const borderT = parseFloat(style.borderTopWidth)    || 0;
  const borderR = parseFloat(style.borderRightWidth)  || 0;
  const borderB = parseFloat(style.borderBottomWidth) || 0;

  const cssW = Math.max(1, rect.width  - borderL - borderR);
  const cssH = Math.max(1, rect.height - borderT - borderB);

  const mx = (e.clientX - rect.left - borderL) * (canvas.width  / cssW);
  const my = (e.clientY - rect.top  - borderT) * (canvas.height / cssH);
  return { mx, my };
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

  const btnMap = document.getElementById('btn-map');
  if (btnMap && !btnMap.dataset.iconInjected) {
    btnMap.dataset.iconInjected = '1';

    const icon = getIcon('map');
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';

    btnMap.insertBefore(icon, btnMap.firstChild);
  }

  const btnQuest = document.getElementById('btn-questlog');
  if (btnQuest && !btnQuest.dataset.iconInjected) {
    btnQuest.dataset.iconInjected = '1';

    const icon = getIcon('questlog');
    icon.style.width = '20px';
    icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';

    btnQuest.insertBefore(icon, btnQuest.firstChild);
  }

  // ---------- World Map: drag & zoom ----------
  canvas.addEventListener('mousedown', (e) => {
    if (gameState !== STATE.WORLDMAP) return;
    const { mx, my } = clientToCanvas(e);
    handleMapClick(mx, my, e);
  });

  window.addEventListener('mousemove', (e) => {
    if (gameState !== STATE.WORLDMAP) return;
    const { mx, my } = clientToCanvas(e);
    handleMapMove(mx, my);
  });

  window.addEventListener('mouseup', () => {
    if (gameState !== STATE.WORLDMAP) return;
    handleMapRelease();
  });

  canvas.addEventListener('wheel', (e) => {
    if (gameState !== STATE.WORLDMAP) return;
    e.preventDefault();
    handleMapWheel(e.deltaY);
  }, { passive: false });

  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();

    // ---- Loja aberta: só ESC fecha ----
    if (isShopOpen()) {
      if (k === 'escape') closeShop();
      return;
    }

    // ---- Quest log aberto: só ESC/Q fecha ----
    if (gameState === STATE.QUEST_LOG) {
      if (k === 'escape' || k === 'q') {
        closeQuestLog();
        setGameState(STATE.EXPLORE);
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }

    // ---- Diálogo aberto: só ESC fecha ----
    if (isDialogueOpen()) {
      if (k === 'escape') {
        closeDialogue();
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }

    // ---- Painel de áudio: ESC abre/fecha (fora de combate e de loja) ----
    if (k === 'escape' && gameState !== STATE.BATTLE
        && !isShopOpen() && !isDialogueOpen() && !isWorldMapOpen()
        && !isQuestLogOpen() && !isAudioMenuOpen()
        && gameState !== STATE.INVENTORY) {
      openAudioMenu();
      return;
    }
    if (isAudioMenuOpen()) {
      if (k === 'escape') closeAudioMenu();
      return;
    }
    // ---- Interagir (E) no mapa ----
    if (k === 'e' && gameState === STATE.EXPLORE) {
      const it = playerStats._nearInteractable;
      if (it) {
        if (it.kind === 'sign') {
          openDialogue({ title: it.title, text: it.text });
        } else if (it.kind === 'portal') {
          openDialogue({
            title: it.title,
            text: portalText(),
            actions: [
              {
                label: `Colocar núcleos (${playerStats.portalCores.size}/8)`,
                disabled: playerStats.portalCores.size === 0,
                action: () => {
                  openDialogue({
                    title: 'Núcleos',
                    text:
                      playerStats.portalCores.size === 0
                        ? 'Você não tem nenhum núcleo ainda.'
                        : `Você tem ${playerStats.portalCores.size} núcleo(s). O portal precisa dos 8 para abrir. (combate final em breve)`,
                  });
                },
              },
            ],
          });
        } else if (it.kind === 'building_entrance') {
          enterBuilding(it.buildingId);
        } else if (it.kind === 'elder') {
          talkToElder();
        } else if (it.kind === 'herbalist_quest') {
          talkToHerbalist();
        } else if (it.kind === 'blacksmith_quest') {
          talkToBlacksmith();
        } else if (it.kind === 'shop_keep') {
          openShop(it.buildingId);
        } else if (it.kind === 'cave_entrance') {
          // Precisa da tocha EQUIPADA (não só no inventário)
          const hasTorchEquipped = playerEquip.leftHand === 'torch';
          if (!isQuestActive('story_cave')) {
            openDialogue({
              title: it.title,
              text: 'A caverna está escura demais. Você precisa de uma fonte de luz.',
            });
          } else if (!hasTorchEquipped) {
            showToast({
              itemId: 'torch',
              title: 'Tocha necessária',
              subtitle: 'Equipe uma tocha na mão esquerda para entrar.',
              color: '#ff6b6b',
            });
          } else {
            enterDungeon('cave_quest_5_2');
          }
        } else if (it.kind === 'lost_backpack') {
          const result = addItemToInventory(playerStats.inventory, 'letter_to_elder', 1);
          if (result > 0) {
            saveGame();
            openDialogue({
              title: 'Mochila Abandonada',
              text:
                'Não há sinal do aldeão. Apenas uma mochila rasgada, como se algo tivesse arrastado o dono.\n\n' +
                'Dentro dela, um pergaminho selado com o brasão de Aethel. Parece importante. O Ancião vai querer ver isso.',
            });
          } else {
            openDialogue({
              title: 'Mochila Abandonada',
              text: 'A mochila está vazia.',
            });
          }
        }
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }

    if (k === 'i' && gameState !== STATE.BATTLE) {
      toggleInventory();
      return;
    }

    // ---- Quest log: Q abre/fecha (só em explore) ----
    if (k === 'q' && gameState === STATE.EXPLORE) {
      toggleQuestLog();
      return;
    }

    // ---- World map: M abre/fecha ----
    if (k === 'm' && (gameState === STATE.EXPLORE || gameState === STATE.WORLDMAP)) {
      if (gameState === STATE.EXPLORE) {
        openWorldMap();
        setGameState(STATE.WORLDMAP);
      } else {
        closeWorldMap();
        setGameState(STATE.EXPLORE);
      }
      return;
    }

    if (gameState === STATE.WORLDMAP) {
      if (k === 'escape') {
        closeWorldMap();
        setGameState(STATE.EXPLORE);
        return;
      }
      if (k === 'c') { centerOnPlayer(); return; }
      return; // bloqueia outras teclas
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
        if (k === 'h' || k === '1') { playerAction('menu_skills'); return; }
        if (k === 'j' || k === '2') { playerAction('menu_items'); return; }
        if (k === 'k' || k === '3') { playerAction('rest'); return; }
        if (k === 'l' || k === '4') { playerAction('flee'); return; }
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
        if (k === 'q') { playerAction('item_page_prev'); return; }
        if (k === 'e') { playerAction('item_page_next'); return; }

        const PER_PAGE = 4;
        const page = battle.itemPage;
        const usableItems = playerStats.inventory.filter(i => i.qty > 0 && CONSUMABLES[i.id]);
        const pageItems = usableItems.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
        const idx = parseInt(k) - 1;
        if (idx >= 0 && idx < pageItems.length) {
          playerAction(`use_item_${pageItems[idx].id}`);
        }
        return;
      }
    }
  });

  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  // Clique no botão da mochila
  document.getElementById('btn-inventory').addEventListener('click', toggleInventory);

  // Clique no botão do mapa
  document.getElementById('btn-map').addEventListener('click', () => {
    if (gameState === STATE.EXPLORE) {
      openWorldMap();
      setGameState(STATE.WORLDMAP);
    } else if (gameState === STATE.WORLDMAP) {
      closeWorldMap();
      setGameState(STATE.EXPLORE);
    }
  });

  // Clique no botão de missões
  document.getElementById('btn-questlog').addEventListener('click', () => {
    if (gameState === STATE.EXPLORE) {
      openQuestLog();
      setGameState(STATE.QUEST_LOG);
    } else if (gameState === STATE.QUEST_LOG) {
      closeQuestLog();
      setGameState(STATE.EXPLORE);
    }
  });

  // Clique no botão de áudio
  document.getElementById('btn-audio').addEventListener('click', () => {
    openAudioMenu();
  });

  // ---------- Hover: cursor `pointer` sobre o ⓘ ----------
  // Só cosmético, mas ajuda o jogador a perceber que o ⓘ é clicável.
  // Roda em BATTLE e checa se o mouse está sobre uma hitbox de ⓘ.
  canvas.addEventListener('mousemove', e => {
    if (gameState !== STATE.BATTLE) {
      if (canvas.style.cursor) canvas.style.cursor = '';
      return;
    }
    const { mx, my } = clientToCanvas(e);
    let overInfo = false;
    for (const b of battle.buttons) {
      if (b.action !== '__toggle_tooltip__') continue;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        overInfo = true;
        break;
      }
    }
    canvas.style.cursor = overInfo ? 'pointer' : '';
  });

  // Clique nos botões de combate
  canvas.addEventListener('click', e => {
    if (gameState !== STATE.BATTLE) return;
    if (battle.turn !== 'player') return;

    const { mx, my } = clientToCanvas(e);

    // Ignora cliques fora da área útil (defensivo: bordas/padding geram
    // coordenadas negativas ou > canvas.width/height)
    if (mx < 0 || my < 0 || mx > canvas.width || my > canvas.height) return;

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

  // ---- Atalho do menu de desenvolvedor ----
  import('./devmenu.js').then(mod => {
    mod.installDevShortcut();
  });

  // ---- Som de clique em TODOS os botões ----
  // Delegação no document: qualquer clique que tenha um <button> (ou um
  // .class-card, que age como botão) no caminho sobe um `sfx('click')`.
  // Funciona pra botões que já existem e pros que são criados depois
  // (inventário, quest log, loja, diálogo, etc.).
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;

    // Ignora cliques dentro do canvas (já são tratados à parte,
    // e alguns deles têm som próprio, tipo o ⓘ do combate).
    if (t.closest('canvas')) return;

    // É um botão de verdade?
    const btn = t.closest('button');
    if (btn) {
      // Se o botão está desabilitado, não toca.
      if (btn.disabled) return;
      // Se o botão já tem um som próprio (ex.: o de áudio), ainda
      // tocamos o click — é barato e mantém consistência.
      sfx('click');
      return;
    }

    // Card de classe (div clicável que age como botão)
    if (t.closest('.class-card')) {
      sfx('click');
      return;
    }
  });
}