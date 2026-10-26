import { STATE, gameState, setGameState, setCurrentRoom, currentRoom,
         startGX, startGY, markRoomVisited, saveGame, clearSave, playerStats,
         visitedRooms, battle, player, setWorldSeed } from './state.js';
import { getRoom, clearRoomCache, getCitySpawn } from '../world/rooms.js';
import { updatePlayer } from '../entities/player.js';
import { updateLeaves } from '../entities/leaves.js';
import { updateBattle } from '../battle/battle.js';
import { render } from '../render/index.js';
import { updateHud } from '../ui/hud.js';
import { renderLevelUp } from '../ui/levelup.js';
import { showClassSelect } from '../ui/classselect.js';
import { CLASSES } from '../classes.js';
import { CANVAS_W, CANVAS_H, TILE_SIZE, GRID_SIZE } from './canvas.js';
import { isSolid } from '../world/tiles.js';

let lastTime = performance.now();

// --- Configuração do Menu HTML ---
const menuScreen = document.getElementById('menu-screen');
const btnContinue = document.getElementById('btn-continue');
const continueInfo = document.getElementById('continue-info');
const hud = document.getElementById('hud');
const btnInventory = document.getElementById('btn-inventory');

function setupMenu() {
  const raw = localStorage.getItem('dungeonLoop_save');
  const savedData = raw ? JSON.parse(raw) : null;

  // Se não há save, desabilita "Continuar"
  if (!savedData) {
    btnContinue.disabled = true;
    continueInfo.classList.add('hidden');
    return;
  }

  const cls = savedData.classId ? CLASSES[savedData.classId] : null;
  const className = cls ? cls.name : '';

  btnContinue.disabled = false;
  continueInfo.classList.remove('hidden');
  const savedRoom = getRoom(savedData.gx || 0, savedData.gy || 0);
  continueInfo.textContent = `${className} · Nv ${savedData.level || 1} - ${savedRoom.name}`;
}

setupMenu();

function goToMenu() {
  setGameState(STATE.MENU);

  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('levelup-screen').classList.add('hidden');
  document.getElementById('inventory-screen').classList.add('hidden');
  document.getElementById('class-screen').classList.add('hidden');
  hud.classList.add('hidden');
  btnInventory.classList.add('hidden');

  menuScreen.classList.remove('hidden');
  setupMenu();
  lastTime = performance.now();
}

function startGame(loadSave) {
  if (loadSave) {
    const savedData = JSON.parse(localStorage.getItem('dungeonLoop_save'));
    if (!savedData) return;

    // Restaura o worldSeed da save (para o mapa ser o mesmo)
    if (savedData.worldSeed !== undefined) {
      setWorldSeed(savedData.worldSeed);
      clearRoomCache();  // limpa o cache para regerar com o seed correto
    }

    const room = getRoom(savedData.gx || 0, savedData.gy || 0);
    setCurrentRoom(room);
    // Se o player salvo ficou preso em tile sólido, reposiciona
    const savedDataForCheck = JSON.parse(localStorage.getItem('dungeonLoop_save'));
    if (savedDataForCheck) {
      const px = player.x;
      const py = player.y;
      const tx = Math.floor(px / TILE_SIZE);
      const ty = Math.floor(py / TILE_SIZE);
      if (room.map[ty] && isSolid(room.map[ty][tx])) {
        // spawn perto da entrada esquerda
        player.x = 3 * TILE_SIZE + TILE_SIZE / 2;  // tx = 3
        player.y = Math.floor(GRID_SIZE / 2) * TILE_SIZE + TILE_SIZE / 2; // ty = 15
      }
    }
    markRoomVisited(room.gx, room.gy);
  } else {
    clearSave();
    clearRoomCache();
    visitedRooms.clear();
    visitedRooms.add('0,0');
    return;
  }

  finishStart();
}

function requestNewGame() {
  // 1) Guarda o save atual (se existir), pra poder restaurar se o jogador cancelar.
  const backupSave = localStorage.getItem('dungeonLoop_save');

  // Esconde a tela de game over ANTES de abrir a seleção de classe
  document.getElementById('gameover-screen').classList.add('hidden'); 

  // 2) Mostra a tela de seleção de classe SEM apagar nada ainda.
  showClassSelect(
    (classId) => {
      // ---- Aqui o jogador CONFIRMOU. Agora sim limpamos e criamos o novo jogo. ----
      clearSave();
      clearRoomCache();
      visitedRooms.clear();
      visitedRooms.add('0,0');

      // NOVO worldSeed para um mapa diferente
      setWorldSeed(Math.floor(Math.random() * 1e9));

      // Limpa estado residual
      playerStats.shadowActive = false;
      playerStats.buffs = {};
      playerStats._mpRegenAcc = 0;

      // reseta progressão
      playerStats.level = 1;
      playerStats.xp = 0;
      playerStats.xpToNextLevel = 50;
      playerStats.points = 0;

      const room = getRoom(0, 0);
      setCurrentRoom(room);
      markRoomVisited(room.gx, room.gy);
      const spawn = getCitySpawn();
      player.x = spawn.tx * TILE_SIZE + TILE_SIZE / 2;
      player.y = spawn.ty * TILE_SIZE + TILE_SIZE / 2;

      // Inventário inicial por classe
      const starterItems = {
        knightess: [
          { id: 'potion_weak', qty: 2 },
          { id: 'potion_str',  qty: 1 },
        ],
        mage: [
          { id: 'potion_weak', qty: 1 },
          { id: 'potion_mana', qty: 2 },
        ],
        thief: [
          { id: 'potion_weak', qty: 2 },
          { id: 'potion_agi',  qty: 1 },
        ],
        huntress: [
          { id: 'potion_weak', qty: 1 },
          { id: 'potion_mana', qty: 1 },
        ],
      };
      playerStats.inventory = starterItems[classId] || [];

      battle.active = false;
      battle.turn = 'player';
      battle.showItems = false;
      battle.floatingTexts = [];
      battle.anim = { shake: 0, flashPlayer: 0, flashEnemy: 0, lungePlayer: 0, lungeEnemy: 0 };
      battle.menuMode = 'main';
      battle.skillPage = 0;
      battle.showItems = false;

      finishStart();
    },
    () => {
      // ---- Cancelou: se havia save, restaura. ----
      if (backupSave !== null) {
        localStorage.setItem('dungeonLoop_save', backupSave);
      }
      // Se veio de GAME_OVER (sem save), volta pro menu.
      // Se estava no menu, fica no menu.
      if (gameState === STATE.GAME_OVER) {
        goToMenu();
      } else {
        // Caso o cancelar tenha sido a partir do próprio menu,
        // garante que ele está visível (ele nunca foi escondido, mas por segurança)
        menuScreen.classList.remove('hidden');
        setupMenu();
      }
    }
  );
}

function finishStart() {
  setGameState(STATE.EXPLORE);

  menuScreen.classList.add('hidden');
  document.getElementById('gameover-screen').classList.add('hidden');
  document.getElementById('levelup-screen').classList.add('hidden');
  document.getElementById('inventory-screen').classList.add('hidden');
  document.getElementById('class-screen').classList.add('hidden');

  hud.classList.remove('hidden');
  hud.style.display = '';
  btnInventory.classList.remove('hidden');
  btnInventory.style.display = '';

  updateHud();
  lastTime = performance.now();
}

document.getElementById('btn-continue').addEventListener('click', () => startGame(true));
document.getElementById('btn-new-game').addEventListener('click', requestNewGame);
document.getElementById('btn-gameover-new').addEventListener('click', requestNewGame);
document.getElementById('btn-gameover-menu').addEventListener('click', goToMenu);

// --- Loop Principal ---
export function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  if (gameState === STATE.BATTLE) {
    updateBattle(dt);

    if (playerStats.hp <= 0 && battle.turn === 'resolve-end' && battle.turnTimer <= 0) {
      setGameState(STATE.GAME_OVER);
      document.getElementById('hud').classList.add('hidden');
      document.getElementById('btn-inventory').classList.add('hidden');
      document.getElementById('gameover-screen').classList.remove('hidden');
      clearSave();
    }
  } else if (gameState === STATE.EXPLORE) {
    if (playerStats.points > 0) {
      setGameState(STATE.LEVEL_UP);
      renderLevelUp();
    } else {
      updatePlayer(dt);
      updateLeaves(dt);
    }
  }

  render(dt);

  if (gameState !== STATE.MENU && gameState !== STATE.GAME_OVER) {
    updateHud();
  }

  if (gameState === STATE.EXPLORE && (!window.lastSaveTime || now - window.lastSaveTime > 3000)) {
    saveGame();
    window.lastSaveTime = now;
  }

  requestAnimationFrame(loop);
}