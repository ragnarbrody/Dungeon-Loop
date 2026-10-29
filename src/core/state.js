import { CANVAS_W, CANVAS_H } from './canvas.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import {
  loadSave, writeSave, clearSave as clearSaveFs, getDefaultSave,
  SAVE_VERSION,
} from './save.js';
import { loadKnowledge, serializeKnowledge, revealRoom, addMarker, revealMarker, removeMarker } from '../world/knowledge.js';
import { serializeQuests, loadQuests, setInventoryGetter, setVisitedRoomsGetter, setKnowledgeFunctions, setDungeonCacheGetter, setCurrentRoomGetter  } from '../quests.js';
import { setMusicMode, sfx } from '../audio/audio.js';
import { dungeonCache } from '../world/rooms.js';
import { normalizeInventory } from '../items.js';

// ---------- Carrega o save ----------
const savedData = loadSave() || getDefaultSave();

// Aplica knowledge (o `loadKnowledge` já lida com array vazio)
if (savedData.knowledge) {
  loadKnowledge(savedData.knowledge);
}

//
if (savedData.quests) {
  loadQuests(savedData.quests);
}

// ---------- Estados ----------
export const STATE = {
  MENU: 'menu',
  EXPLORE: 'explore',
  BATTLE: 'battle',
  INVENTORY: 'inventory',
  LEVEL_UP: 'level_up',
  GAME_OVER: 'game_over',
  WORLDMAP: 'worldmap',
  QUEST_LOG: 'quest_log',
};

export let gameState = STATE.MENU;
export function setGameState(s) { gameState = s; }

// ---------- Pausa ----------
// Usado pelo menu de dev (e futuramente por outros menus que precisem
// congelar o mundo). Quando `true`, o loop principal NÃO atualiza o
// player, os inimigos, a batalha, etc. O render continua, mas tudo
// fica parado.
export let paused = false;
export function setPaused(v) { paused = v; }

// ---------- PlayerStats ----------
const loadedStats = savedData.stats || { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 };

export const playerStats = {
  level: savedData.level ?? 1,
  xp: savedData.xp ?? 0,
  xpToNextLevel: savedData.xpToNextLevel ?? 50,
  points: savedData.points ?? 0,

  classId: savedData.classId ?? null,

  str: loadedStats.str,
  agi: loadedStats.agi,
  int: loadedStats.int,
  def: loadedStats.def,
  vit: loadedStats.vit,
  magia: loadedStats.magia ?? 0,

  get maxHp() { return 15 + (this.vit * 5); },
  hp: savedData.hp ?? (15 + (loadedStats.vit * 5)),

  _baseMp: savedData._baseMp ?? 5,
  get maxMp() { return this._baseMp + this.magia * 3; },
  mp: savedData.mp ?? 5,

  _mpRegenAcc: 0,
  buffs: {},
  inventory: savedData.inventory ?? [],
  shadowActive: false,
  poisoned: null,
  bleeding: null,
  gold: savedData.gold ?? 0,
  portalCores: new Set(savedData.portalCores ?? []),
};

normalizeInventory(playerStats.inventory);
// Garante que o HP/MP não passem do máximo
if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp;
if (playerStats.mp > playerStats.maxMp) playerStats.mp = playerStats.maxMp;

// Helper: lê o stat efetivo (base + buff de poção)
export function effStat(id) {
  const base = playerStats[id] || 0;
  const b = playerStats.buffs[id];
  // Bônus de equipamento (rightHand + leftHand)
  const eq = weaponBonus(playerEquip)[id] || 0;
  return base + (b ? b.amount : 0) + eq;
}

// ---------- Save (única função de escrita) ----------
// Centraliza "o que é serializável" do state.
// Se você adicionar um campo em `playerStats` que precisa
// persistir entre sessões, ele DEVE entrar aqui. Se você adicionar
// um campo que NÃO precisa persistir (ex.: `_nearInteractable`), ele
// deve ficar FORA do playerStats (ou ser limpo ao recarregar).
export function buildSaveData() {

  return {
    version: SAVE_VERSION,

    // progressão
    level: playerStats.level,
    xp: playerStats.xp,
    xpToNextLevel: playerStats.xpToNextLevel,
    points: playerStats.points,
    gold: playerStats.gold,
    hp: playerStats.hp,
    mp: playerStats.mp,

    // classe / stats
    classId: playerStats.classId,
    stats: {
      str: playerStats.str, agi: playerStats.agi,
      int: playerStats.int, def: playerStats.def,
      vit: playerStats.vit, magia: playerStats.magia,
    },
    _baseMp: playerStats._baseMp,

    // inventário / equipamento
    inventory: playerStats.inventory,
    equip: {
      rightHand: playerEquip.rightHand,
      leftHand:  playerEquip.leftHand,
    },

    // mundo
    gx: startGX,
    gy: startGY,
    px: player.x,
    py: player.y,
    visited: Array.from(visitedRooms),
    worldSeed: worldSeed,

    // knowledge
    knowledge: serializeKnowledge(),

    // portal
    portalCores: Array.from(playerStats.portalCores),

    // Missões
    quests: serializeQuests(),
  };
}

export function saveGame() {
  writeSave(buildSaveData());
}

export function clearSave() {
  clearSaveFs();
}

// ---------- Player físico ----------
export const player = {
  x: savedData.px ?? CANVAS_W / 2,
  y: savedData.py ?? CANVAS_H / 2,
  size: 18,
  speed: 2.2,
  facing: 'down',
  step: 0,
  fleeImmune: new Map(),
};

export let currentRoom = null;
export let startGX = savedData.gx ?? 0;
export let startGY = savedData.gy ?? 0;

export function setCurrentRoom(r) {
  currentRoom = r;
  startGX = r.gx;
  startGY = r.gy;
}

export const visitedRooms = new Set(savedData.visited || ['0,0']);
export function markRoomVisited(gx, gy) { visitedRooms.add(`${gx},${gy}`); }

export const encounter = { chancePerPixel: 0.0007, cooldownPx: 400, walkedSinceLast: 0 };

export const battle = {
  active: false,
  turn: 'player',
  message: '',
  turnTimer: 0,
  player: { atk: 0, def: 0 },
  enemies: [],
  targetIndex: 0,
  enemyTurnIndex: 0,
  activeEnemyIndex: -1,
  mapEnemy: null,
  log: [],
  anim: {
    shake: 0, flashPlayer: 0, flashPlayerType: 'white',
    flashEnemy: 0, flashEnemyIndex: -1, flashEnemyType: 'red',
    lungePlayer: 0, lungeEnemy: 0,
  },
  floatingTexts: [],
  buttons: [],
  showItems: false,
  menuMode: 'main',
  skillPage: 0,
  itemPage: 0,
  xpEarned: 0,
  goldEarned: 0,
  dropEarned: [],
  fadingEnemies: [],
  tooltipSkill: null,
  tooltipPos: null,
};

if (savedData.equip) {
  playerEquip.rightHand = savedData.equip.rightHand ?? playerEquip.rightHand;
  playerEquip.leftHand  = savedData.equip.leftHand  ?? playerEquip.leftHand;
}

export function addGold(amount) {
  playerStats.gold = Math.max(0, playerStats.gold + amount);
}

if (savedData.quests) {
  loadQuests(savedData.quests);
}

// Registra os getters pro quests.js (evita import cycle)
setInventoryGetter(() => playerStats.inventory);
setVisitedRoomsGetter(() => visitedRooms);
setKnowledgeFunctions(removeMarker, addMarker, revealMarker);
setDungeonCacheGetter(() => dungeonCache);
setCurrentRoomGetter(() => currentRoom);

// Revela a sala inicial
revealRoom(startGX, startGY);

export function setDungeonRoom(room) {
  currentRoom = room;
  // Não altera startGX/startGY (que são para o mundo aberto)
}

// Verifica se o jogador subiu de nível. Retorna true se subiu.
// Pode chamar quantas vezes quiser — se não passou do limite, retorna false.
export function checkLevelUp() {
  if (playerStats.xp < playerStats.xpToNextLevel) return false;

  // Sobe de nível (pode ser mais de um de uma vez, se o XP for enorme)
  while (playerStats.xp >= playerStats.xpToNextLevel) {
    playerStats.xp -= playerStats.xpToNextLevel;
    playerStats.level++;
    playerStats.points += 3;
    playerStats.hp = playerStats.maxHp;
    playerStats.xpToNextLevel = Math.floor(playerStats.xpToNextLevel * 1.5);
  }
  return true;
  sfx('levelup');
}

export let transitionCooldown = 0;
export function setTransitionCooldown(v) { transitionCooldown = v; }
export function decrementTransitionCooldown() { if (transitionCooldown > 0) transitionCooldown--; }

export let worldSeed = savedData.worldSeed ?? Math.floor(Math.random() * 1e9);
export function setWorldSeed(s) { worldSeed = s; }