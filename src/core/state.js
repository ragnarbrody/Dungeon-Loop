import { CANVAS_W, CANVAS_H } from './canvas.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import {
  loadSave, writeSave, clearSave as clearSaveFs, getDefaultSave,
  SAVE_VERSION,
} from './save.js';
import { loadKnowledge, serializeKnowledge, revealRoom, addMarker, revealMarker, removeMarker } from '../world/knowledge.js';
import {
  serializeQuests, loadQuests, setInventoryGetter, setVisitedRoomsGetter,
  setKnowledgeFunctions, setDungeonCacheGetter, setCurrentRoomGetter,
  setRevealRoomFn, setForcePathFn, 
} from '../quests.js';
import { setMusicMode, sfx } from '../audio/audio.js';
import { serializeDungeons, loadDungeons, dungeonCache, setPendingDungeonsData } from '../world/rooms.js';
import { normalizeInventory } from '../items.js';
import { loadTime, serializeTime } from './timeofday.js';
import {
  serializeProgression, loadProgression,
  setCurrentRoomGetter as setProgressionRoomGetter,
} from './progression.js';

// ---------- Carrega o save ----------
const savedData = loadSave() || getDefaultSave();

// NÃO reconstrói dungeons no import. Guarda os dados serializados
// e deixa o `rooms.js` reconstruir sob demanda (lazy).
// Isso evita ciclo de importação state <-> rooms.
if (savedData.dungeons) {
  setPendingDungeonsData(savedData.dungeons);
}

// Aplica knowledge (o `loadKnowledge` já lida com array vazio)
if (savedData.knowledge) {
  loadKnowledge(savedData.knowledge);
}

if (savedData.quests) {
  loadQuests(savedData.quests);
}

loadProgression(savedData.progression);

// Aplica o horário do save (se houver)
if (savedData.timeOfDay !== undefined) {
  loadTime({ timeOfDay: savedData.timeOfDay });
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
  INTRO: 'intro',
};

export let gameState = STATE.MENU;
export function setGameState(s) { gameState = s; }

// ---------- Pausa ----------
export let paused = false;
export function setPaused(v) { paused = v; }

// ---------- PlayerStats ----------
const loadedStats = savedData.stats || { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 };

// ---------- Meta (cofre, mortes) ----------
const _defaultMeta = getDefaultSave().meta;
const _savedMeta = savedData.meta && typeof savedData.meta === 'object'
  ? savedData.meta
  : _defaultMeta;

export const metaState = {
  deaths: Math.max(0, Math.floor(Number(_savedMeta.deaths) || 0)),
  vault: (() => {
    const v = _savedMeta.vault || {};
    const slots = Math.min(8, Math.max(3, Math.floor(Number(v.slots) || 3)));
    const items = Array.from({ length: slots }, (_, i) => {
      const it = v.items?.[i];
      return it && typeof it.id === 'string' && it.qty > 0
        ? { id: it.id, qty: Math.floor(it.qty) }
        : null;
    });
    return {
      gold: Math.max(0, Math.floor(Number(v.gold) || 0)),
      slots,
      items,
    };
  })(),
};

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
  stunned: 0,
  gold: savedData.gold ?? 0,
  _escortActive: false,
  _escortPos: null,
  _collectedHerbs: new Set(savedData._collectedHerbs ?? []),
  portalCores: new Set(savedData.portalCores ?? []),
  portalInserted: new Set(savedData.portalInserted ?? []),
  guardianFieldsDefeated: !!savedData.guardianFieldsDefeated,
  fastTravelUnlocked: !!savedData.fastTravelUnlocked,
  _knownCities: new Set(savedData._knownCities ?? ['aethel']),
};

normalizeInventory(playerStats.inventory);
if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp;
if (playerStats.mp > playerStats.maxMp) playerStats.mp = playerStats.maxMp;

// Helper: lê o stat efetivo (base + buff de poção)
export function effStat(id) {
  const base = playerStats[id] || 0;
  const b = playerStats.buffs[id];
  const eq = weaponBonus(playerEquip)[id] || 0;
  return base + (b ? b.amount : 0) + eq;
}

// ---------- Save ----------
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
      rightHand: playerEquip.rightHand ?? null,
      leftHand:  playerEquip.leftHand  ?? null,
      helmet:    playerEquip.helmet    ?? null,
      armor:     playerEquip.armor     ?? null,
      boots:     playerEquip.boots     ?? null,
      amulet:    playerEquip.amulet    ?? null,
      ring1:     playerEquip.ring1     ?? null,
      ring2:     playerEquip.ring2     ?? null,
    },

    // mundo
    gx: startGX,
    gy: startGY,
    px: player.x,
    py: player.y,
    visited: Array.from(visitedRooms),
    worldSeed: worldSeed,

    // flags de mundo
    guardianFieldsDefeated: !!playerStats.guardianFieldsDefeated,

    // escolta (companion)
    _escortActive: playerStats._escortActive || false,
    _collectedHerbs: Array.from(playerStats._collectedHerbs),

    // knowledge
    knowledge: serializeKnowledge(),

    // portal
    portalCores: Array.from(playerStats.portalCores),
    portalInserted: Array.from(playerStats.portalInserted),

    fastTravelUnlocked: !!playerStats.fastTravelUnlocked,
    _knownCities: Array.from(playerStats._knownCities),

    meta: metaState,

    // Missões
    quests: serializeQuests(),

    progression: serializeProgression(),

    // dungeons
    dungeons: serializeDungeons(),

    // Horário do dia (persistente)
    ...serializeTime(),
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

export const encounter = {
  chancePerPixel: 0.0007,
  cooldownPx: 600,
  walkedSinceLast: 0,
  // Fator de "paz" pra níveis baixos: 1.0 = normal, 0.5 = metade
  levelPeaceFactor: 1.0,
};

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
  noFlee: false,
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
  cutscene: null,   // { lines: [...], index, timer, perLine, onEnd }
  dropEarned: [],
  fadingEnemies: [],
  tooltipSkill: null,
  tooltipPos: null,
  _escortActive: false,
  _biomeId: 'fields',
};

// equipamento é null — se o save diz "sem bota", tem que ficar sem bota.
if (savedData.equip) {
  const slots = ['rightHand', 'leftHand', 'helmet', 'armor', 'boots', 'amulet', 'ring1', 'ring2'];
  for (const s of slots) {
    playerEquip[s] = savedData.equip[s] ?? null;
  }
}
export function addGold(amount) {
  playerStats.gold = Math.max(0, playerStats.gold + amount);
}

if (savedData.quests) {
  loadQuests(savedData.quests);
}

// Só restaura a companion se a quest de escolta ainda estiver ativa.
// (Se o jogador salvou no meio da escolta, ela volta. Se a quest já
//  foi concluída ou nunca foi ativada, não restaura nada.)
if (savedData._escortActive && isQuestActive('story_herbalist_escort')) {
  playerStats._escortActive = true;
  playerStats._escortPos = { x: player.x - 20, y: player.y };
} else {
  playerStats._escortActive = false;
  playerStats._escortPos = null;
}

// Registra os getters pro quests.js (evita import cycle)
setInventoryGetter(() => playerStats.inventory);
setVisitedRoomsGetter(() => visitedRooms);
setKnowledgeFunctions(removeMarker, addMarker, revealMarker);
setDungeonCacheGetter(() => dungeonCache);
setCurrentRoomGetter(() => currentRoom);
setRevealRoomFn(revealRoom);
setProgressionRoomGetter(() => currentRoom);

setForcePathFn((tx, ty, fx, fy) => {
  // import dinâmico pra evitar ciclo
  import('../world/rooms.js').then(mod => mod.forcePathTo(tx, ty, fx, fy));
});

// Reaplica os "ajustes de sala" que dependem do estado das quests.
// Roda UMA vez no boot, depois do save ser carregado — assim
// `forcedDoors` é populado mesmo sem reload da página (ex.: F5
// num save em que a desert_moral está ativa).
import('../world/rooms.js').then(mod => {
  if (mod.reapplyQuestRoomFixes) mod.reapplyQuestRoomFixes();
}).catch(console.error);

// Revela a sala inicial
revealRoom(startGX, startGY);

export function setDungeonRoom(room) {
  currentRoom = room;
  // Não altera startGX/startGY (que são para o mundo aberto)
}

// Verifica se o jogador subiu de nível. Retorna true se subiu.
export function checkLevelUp() {
  if (playerStats.xp < playerStats.xpToNextLevel) return false;

  while (playerStats.xp >= playerStats.xpToNextLevel) {
    playerStats.xp -= playerStats.xpToNextLevel;
    playerStats.level++;
    playerStats.points += 3;
    playerStats.hp = playerStats.maxHp;
    playerStats.xpToNextLevel = Math.floor(playerStats.xpToNextLevel * 1.5);
  }
  return true;
}

export let transitionCooldown = 0;
export function setTransitionCooldown(v) { transitionCooldown = v; }
export function decrementTransitionCooldown() { if (transitionCooldown > 0) transitionCooldown--; }

export let worldSeed = savedData.worldSeed ?? Math.floor(Math.random() * 1e9);
export function setWorldSeed(s) { worldSeed = s; }