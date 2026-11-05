import { canvas } from '../core/canvas.js';
import { STATE, gameState, battle, setGameState, playerStats, addGold, saveGame, currentRoom, startGX, startGY, player } from '../core/state.js';
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
import { isQuestActive, advanceObjective, getProgress } from '../quests.js';
import { playerEquip } from '../sprites/equipment.js';
import { showToast } from './toast.js';
import { talkToCagedVillager } from './villagerrescue.js';
import { addMarker, revealMarker, getMarker } from '../world/knowledge.js';
import { openVault, closeVault, isVaultOpen } from './vault.js';
import { skipCutsceneScene } from '../battle/cutscene.js';
import { skipIntroScene, skipIntroAll } from './introcutscene.js';

const CHEST_GOLD_MIN = 30;
const CHEST_GOLD_MAX = 70;

export const keys = {};

function toggleInventory() {
  const invScreen = document.getElementById('inventory-screen');
  if (gameState === STATE.EXPLORE) {
    setGameState(STATE.INVENTORY);
    renderInventory();
    invScreen.classList.remove('hidden');
  } else if (gameState === STATE.INVENTORY) {
    setGameState(STATE.EXPLORE);
    invScreen.classList.add('hidden');
    for (let k in keys) keys[k] = false;
  }
}

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
  // Ícones dos botões
  const btnInv = document.getElementById('btn-inventory');
  if (btnInv && !btnInv.dataset.iconInjected) {
    btnInv.dataset.iconInjected = '1';
    const icon = getIcon('bag');
    icon.style.width = '20px'; icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';
    btnInv.insertBefore(icon, btnInv.firstChild);
  }
  const btnMap = document.getElementById('btn-map');
  if (btnMap && !btnMap.dataset.iconInjected) {
    btnMap.dataset.iconInjected = '1';
    const icon = getIcon('map');
    icon.style.width = '20px'; icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';
    btnMap.insertBefore(icon, btnMap.firstChild);
  }
  const btnQuest = document.getElementById('btn-questlog');
  if (btnQuest && !btnQuest.dataset.iconInjected) {
    btnQuest.dataset.iconInjected = '1';
    const icon = getIcon('questlog');
    icon.style.width = '20px'; icon.style.height = '20px';
    icon.style.imageRendering = 'pixelated';
    btnQuest.insertBefore(icon, btnQuest.firstChild);
  }

  // World map drag/zoom
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

  // ============================================================
  // TECLADO
  // ============================================================
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();

    keys[k] = true;

    if (gameState === STATE.INTRO) {
      if (k === ' ' || k === 'enter' || k === 'spacebar') { e.preventDefault(); skipIntroScene(); }
      else if (k === 'escape') { e.preventDefault(); skipIntroAll(); }
      return;
    }

    // ---- Cutscene de boss: Espaço / Enter / Esc pulam o slide atual ----
    if (gameState === STATE.BATTLE && battle.cutscene) {
      if (k === ' ' || k === 'enter' || k === 'escape' || k === 'spacebar') {
        e.preventDefault();
        skipCutsceneScene(battle.cutscene);
      }
      return;
    }

    if (isShopOpen()) { if (k === 'escape') closeShop(); return; }
    if (isVaultOpen()) { if (k === 'escape') closeVault(); return; }

    if (gameState === STATE.QUEST_LOG) {
      if (k === 'escape' || k === 'q') {
        closeQuestLog(); setGameState(STATE.EXPLORE);
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }
    if (gameState === STATE.INVENTORY) {
      if (k === 'escape' || k === 'i') toggleInventory();
      return;
    }
    if (isDialogueOpen()) {
      if (k === 'escape') {
        closeDialogue();
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }
    if (k === 'escape' && gameState !== STATE.BATTLE
        && !isShopOpen() && !isDialogueOpen() && !isWorldMapOpen()
        && !isQuestLogOpen() && !isAudioMenuOpen() && !isVaultOpen()
        && gameState !== STATE.INVENTORY) {
      openAudioMenu();
      return;
    }
    if (isAudioMenuOpen()) {
      if (k === 'escape') closeAudioMenu();
      return;
    }

    // ---- Interagir (E) ----
    if (k === 'e' && gameState === STATE.EXPLORE) {
      const it = playerStats._nearInteractable;
      if (it) {
        if (it.kind === 'sign') {
          openDialogue({ title: it.title, text: it.text });
        } else if (it.kind === 'portal') {
          openDialogue({
            title: it.title,
            text: portalText(),
            actions: [{
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
            }],
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
        } else if (it.kind === 'banker') {
          openVault();
        } else if (it.kind === 'cave_entrance') {
          const hasTorchEquipped = playerEquip.leftHand === 'torch';
          if (it.procedural) {
            if (playerStats._escortActive) {
              openDialogue({
                title: 'Caverna',
                text: 'A Herbalista não pode entrar aí, é muito perigoso. Leve-a de volta a Aethel primeiro.',
              });
              return;
            } else if (!hasTorchEquipped) {
              showToast({
                itemId: 'torch',
                title: 'Tocha necessária',
                subtitle: 'Equipe uma tocha na mão esquerda para entrar.',
                color: '#ff6b6b',
              });
            } else {
              const dungeonId = `proc_cave_${currentRoom.gx}_${currentRoom.gy}`;
              enterDungeon(dungeonId, { procedural: true });
            }
            return;
          }
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
            openDialogue({ title: 'Mochila Abandonada', text: 'A mochila está vazia.' });
          }
        } else if (it.kind === 'caged_villager') {
          talkToCagedVillager();
          currentRoom._cageOpened = true;
          saveGame();
        } else if (it.kind === 'treasure_chest') {
          const minibossAlive = (currentRoom.enemies || []).some(
            e => !e.defeated && e.id === 'goblin_sergeant'
          );
          if (minibossAlive) {
            openDialogue({
              title: 'Baú trancado',
              text:
                'Você puxa a tampa, mas ela não cede. Há uma fechadura de ferro, ' +
                'e você não tem a chave.\n\n' +
                'O guardião da caverna ainda está vivo. A chave deve estar com ele.',
            });
            return;
          }
          const gold = CHEST_GOLD_MIN + Math.floor(Math.random() * (CHEST_GOLD_MAX - CHEST_GOLD_MIN + 1));
          playerStats.gold += gold;
          const potionRoll = Math.random();
          const potions = [];
          if (potionRoll < 0.5) potions.push({ id: 'potion_weak', qty: 1 + Math.floor(Math.random() * 2) });
          else if (potionRoll < 0.85) potions.push({ id: 'potion_medium', qty: 1 });
          else { potions.push({ id: 'potion_medium', qty: 1 }); potions.push({ id: 'potion_mana', qty: 1 }); }
          for (const p of potions) addItemToInventory(playerStats.inventory, p.id, p.qty);
          currentRoom._chestOpened = true;
          saveGame();
          sfx('chest');
          const markerId = `cave_done_${startGX}_${startGY}`;
          if (!getMarker(markerId)) {
            addMarker({ id: markerId, type: 'cave_done', gx: startGX, gy: startGY, title: 'Caverna concluída', revealed: true });
            revealMarker(markerId);
          }
          const dropStr = potions.map(p => `${p.qty}× ${p.id}`).join(', ');
          openDialogue({ title: 'Baú', text: `Você abre o baú.\n\nDentro, ${gold} de ouro e ${dropStr}.` });
        } else if (it.kind === 'banner') {
          const added = addItemToInventory(playerStats.inventory, 'banner_aethel', 1);
          if (added > 0) {
            currentRoom.interactables = currentRoom.interactables.filter(x => x.kind !== 'banner');
            saveGame(); sfx('chest');
            showToast({ itemId: 'banner_aethel', title: 'Estandarte de Aethel', subtitle: '+1', color: '#feca57' });
            openDialogue({
              title: 'Estandarte de Aethel',
              text:
                'Você pega o estandarte. O pano está sujo de fumaça e rasgado nas bordas, mas o brasão de Aethel ainda é visível.\n\n' +
                'Os goblins não parecem notar. (ou não se importam.)\n\n' +
                'Melhor voltar pro Ancião antes que algo mude.',
            });
          } else {
            showToast({ itemId: 'banner_aethel', title: 'Inventário cheio', subtitle: 'Libere espaço antes de pegar o estandarte.', color: '#ff6b6b' });
          }
        } else if (it.kind === 'herbalist_escort') {
          playerStats._escortActive = true;
          playerStats._escortPos = { x: player.x - 20, y: player.y };
          advanceObjective('story_herbalist_escort', 'talk_herbalist', 1);
          saveGame();
          openDialogue({
            title: 'Herbalista',
            text:
              'Ah, você veio! Que alívio.\n\n' +
              'Eu vim buscar ervas raras — elas só crescem aqui, e só nesta época. ' +
              'Mas o caminho de volta é perigoso demais para eu fazer sozinha.\n\n' +
              'Me ajude a colher as três que faltam. Elas estão espalhadas por aqui. ' +
              'Depois, podemos voltar à Aethel.',
          });
        } else if (it.kind === 'herb') {
          const herbId = it.id;
          if (playerStats._collectedHerbs) playerStats._collectedHerbs.add(herbId);
          currentRoom.interactables = currentRoom.interactables.filter(x => !(x.kind === 'herb' && x.id === herbId));
          const added = addItemToInventory(playerStats.inventory, 'herb_herbalist', 1);
          if (added > 0) {
            saveGame(); sfx('chest');
            showToast({
              itemId: 'herb_herbalist',
              title: 'Erva Rara',
              subtitle: `+1 (${getProgress('story_herbalist_escort', 'collect_herbs')}/3)`,
              color: '#6fbd63',
            });
          } else {
            showToast({
              itemId: 'herb_herbalist',
              title: 'Inventário cheio',
              subtitle: 'Você já tem ervas suficientes.',
              color: '#ff6b6b',
            });
          }
        }
        for (let kk in keys) keys[kk] = false;
      }
      return;
    }

    if (k === 'i' && gameState !== STATE.BATTLE) { toggleInventory(); return; }
    if (k === 'q' && gameState === STATE.EXPLORE) { toggleQuestLog(); return; }
    if (k === 'm' && (gameState === STATE.EXPLORE || gameState === STATE.WORLDMAP)) {
      if (gameState === STATE.EXPLORE) { openWorldMap(); setGameState(STATE.WORLDMAP); }
      else { closeWorldMap(); setGameState(STATE.EXPLORE); }
      return;
    }
    if (gameState === STATE.WORLDMAP) {
      if (k === 'escape') { closeWorldMap(); setGameState(STATE.EXPLORE); return; }
      if (k === 'c') { centerOnPlayer(); return; }
      return;
    }
    if (gameState === STATE.INVENTORY) return;

    keys[k] = true;

    // ---- Combate ----
    if (gameState === STATE.BATTLE && battle.turn === 'player') {
      if (playerStats.stunned > 0) {
        if (k === 'escape' && battle.tooltipSkill) {
          battle.tooltipSkill = null;
          battle.tooltipPos = null;
        }
        return;
      }
      if (battle.showItems) {
        if (k === 'escape') playerAction('close_items');
        return;
      }
      const living = battle.enemies.filter(e => e.hp > 0 && e.hiding === 0);
      if (living.length > 1) {
        if (k === 'arrowleft' || k === 'q') {
          const n = battle.enemies.length;
          for (let step = 1; step <= n; step++) {
            const idx = (battle.targetIndex - step + n) % n;
            if (battle.enemies[idx].hp > 0 && battle.enemies[idx].hiding === 0) {
              battle.targetIndex = idx; break;
            }
          }
          return;
        }
        if (k === 'arrowright' || k === 'e') {
          const n = battle.enemies.length;
          for (let step = 1; step <= n; step++) {
            const idx = (battle.targetIndex + step) % n;
            if (battle.enemies[idx].hp > 0 && battle.enemies[idx].hiding === 0) {
              battle.targetIndex = idx; break;
            }
          }
          return;
        }
      }
      const cls = CLASSES[playerStats.classId];
      if (!cls) return;
      if (k === 'escape') {
        if (battle.tooltipSkill) { battle.tooltipSkill = null; battle.tooltipPos = null; return; }
        if (battle.menuMode !== 'main') playerAction('menu_main');
        return;
      }
      if (battle.menuMode === 'main') {
        if (k === 'h' || k === '1') { playerAction('menu_skills'); return; }
        if (k === 'j' || k === '2') { playerAction('menu_items'); return; }
        if (k === 'k' || k === '3') { playerAction('rest'); return; }
        if (k === 'l' || k === '4') { playerAction('flee'); return; }
        return;
      }
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

  document.getElementById('btn-inventory').addEventListener('click', toggleInventory);
  document.getElementById('btn-map').addEventListener('click', () => {
    if (gameState === STATE.EXPLORE) { openWorldMap(); setGameState(STATE.WORLDMAP); }
    else if (gameState === STATE.WORLDMAP) { closeWorldMap(); setGameState(STATE.EXPLORE); }
  });
  document.getElementById('btn-questlog').addEventListener('click', () => {
    if (gameState === STATE.EXPLORE) { openQuestLog(); setGameState(STATE.QUEST_LOG); }
    else if (gameState === STATE.QUEST_LOG) { closeQuestLog(); setGameState(STATE.EXPLORE); }
  });
  document.getElementById('btn-audio').addEventListener('click', () => openAudioMenu());

  // Hover ⓘ
  canvas.addEventListener('mousemove', e => {
    if (gameState === STATE.INTRO) { canvas.style.cursor = 'pointer'; return; }
    if (gameState !== STATE.BATTLE) { if (canvas.style.cursor) canvas.style.cursor = ''; return; }
    if (battle.cutscene) { canvas.style.cursor = 'pointer'; return; }
    const { mx, my } = clientToCanvas(e);
    let overInfo = false;
    for (const b of battle.buttons) {
      if (b.action !== '__toggle_tooltip__') continue;
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { overInfo = true; break; }
    }
    canvas.style.cursor = overInfo ? 'pointer' : '';
  });

  // Clique em batalha
  canvas.addEventListener('click', e => {
    if (gameState === STATE.INTRO) { skipIntroScene(); return; }
    if (gameState !== STATE.BATTLE) return;

    // ---- Cutscene ativa: clique pula slide ----
    if (battle.cutscene) {
      skipCutsceneScene(battle.cutscene);
      return;
    }

    if (battle.turn !== 'player') return;

    const { mx, my } = clientToCanvas(e);
    if (mx < 0 || my < 0 || mx > canvas.width || my > canvas.height) return;

    for (let i = battle.buttons.length - 1; i >= 0; i--) {
      const b = battle.buttons[i];
      if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        if (playerStats.stunned > 0 && b.action !== 'rest') return;
        if (b.action === '__toggle_tooltip__') {
          if (battle.tooltipSkill === b._skill) { battle.tooltipSkill = null; battle.tooltipPos = null; }
          else { battle.tooltipSkill = b._skill; battle.tooltipPos = { x: b.x, y: b.y + b.h + 8 }; }
          return;
        }
        battle.tooltipSkill = null; battle.tooltipPos = null;
        playerAction(b.action);
        return;
      }
    }
    if (battle.tooltipSkill) { battle.tooltipSkill = null; battle.tooltipPos = null; }
  });

  import('./devmenu.js').then(mod => mod.installDevShortcut());

  // Clique geral em botões (som)
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('canvas')) return;
    const btn = t.closest('button');
    if (btn) {
      if (btn.disabled) return;
      sfx('click');
      return;
    }
    if (t.closest('.class-card')) { sfx('click'); return; }
  });
}