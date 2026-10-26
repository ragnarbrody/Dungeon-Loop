import { CANVAS_W, CANVAS_H } from './canvas.js';
import { playerEquip } from '../sprites/equipment.js';

const savedData = JSON.parse(localStorage.getItem('dungeonLoop_save')) || {};

export const STATE = { MENU: 'menu', EXPLORE: 'explore', BATTLE: 'battle', INVENTORY: 'inventory', LEVEL_UP: 'level_up', GAME_OVER: 'game_over' };
export let gameState = STATE.MENU;
export function setGameState(s) { gameState = s; }

// Atributos base (Nível 1)
const baseStats = { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 };
// Se houver save, carrega os atributos salvos
const loadedStats = savedData.stats || baseStats;

export const playerStats = {
  level: savedData.level !== undefined ? savedData.level : 1,
  xp: savedData.xp !== undefined ? savedData.xp : 0,
  xpToNextLevel: savedData.xpToNextLevel !== undefined ? savedData.xpToNextLevel : 50,
  points: savedData.points !== undefined ? savedData.points : 0,

  classId: savedData.classId || null,

  str: loadedStats.str,
  agi: loadedStats.agi,
  int: loadedStats.int,
  def: loadedStats.def,
  vit: loadedStats.vit,
  magia: loadedStats.magia !== undefined ? loadedStats.magia : 0,

  get maxHp() { return 15 + (this.vit * 5); },
  hp: savedData.hp !== undefined ? savedData.hp : (15 + (loadedStats.vit * 5)),

  // Mana base por classe + bônus de magia (3 MP por ponto de magia)
  _baseMp: savedData._baseMp !== undefined ? savedData._baseMp : 5,
  get maxMp() { return this._baseMp + this.magia * 3; },
  mp: savedData.mp !== undefined ? savedData.mp : 5,

  // Acumulador de regeneração de MP (para não perder frações)
  _mpRegenAcc: 0,

  // Buffs temporários de combate: { str: {amount, rounds}, agi: {amount, rounds}, ... }
  buffs: {},

  inventory: savedData.inventory || [
    { id: 'potion_weak', qty: 2 },
  ],

  // efeitos em batalha
  shadowActive: false, // Ladrão: próximo ataque do inimigo erra
  
  // Status effects persistentes entre turnos (fora dos buffs)
  poisoned: null,  // { turns: number, dmg: number } | null

  // ---- Moedas ----
  gold: savedData.gold !== undefined ? savedData.gold : 0,

  // ---- Portal (núcleos coletados) ----
  // Set com os IDs dos biomas cujos bosses foram derrotados
  // (ex: 'fields', 'desert'). Cada núcleo = 1 boss morto.
  portalCores: new Set(savedData.portalCores || []),
};

// Garante que o HP/MP não passem do máximo
if (playerStats.hp > playerStats.maxHp) playerStats.hp = playerStats.maxHp;
if (playerStats.mp > playerStats.maxMp) playerStats.mp = playerStats.maxMp;

// Helper: lê o stat efetivo (base + buff de poção)
export function effStat(id) {
  const base = playerStats[id] || 0;
  const b = playerStats.buffs[id];
  return base + (b ? b.amount : 0);
}

export function saveGame() {
  const dataToSave = {
    ...playerStats,
    classId: playerStats.classId,
    gx: startGX,
    gy: startGY,
    px: player.x,
    py: player.y,
    visited: Array.from(visitedRooms),
    portalCores: Array.from(playerStats.portalCores),
    equip: {
      rightHand: playerEquip.rightHand,
      leftHand:  playerEquip.leftHand,
    },
    stats: {
      str: playerStats.str, agi: playerStats.agi,
      int: playerStats.int, def: playerStats.def, vit: playerStats.vit,
      magia: playerStats.magia,
    },
    baseMp: playerStats._baseMp,
    worldSeed: worldSeed,  // ← ADICIONAR
  };
  localStorage.setItem('dungeonLoop_save', JSON.stringify(dataToSave));
}

export const player = {
  x: savedData.px !== undefined ? savedData.px : CANVAS_W / 2,
  y: savedData.py !== undefined ? savedData.py : CANVAS_H / 2,
  size: 18,
  speed: 2.2,
  facing: 'down',
  step: 0,
  // cooldown de fuga por inimigo do mapa
  // Map<enemyRef, tempoRestanteEmSegundos>
  fleeImmune: new Map(),
};

export let currentRoom = null;
export let startGX = savedData.gx !== undefined ? savedData.gx : 0;
export let startGY = savedData.gy !== undefined ? savedData.gy : 0;

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
    shake: 0,
    flashPlayer: 0,
    flashPlayerType: 'white',
    flashEnemy: 0,
    flashEnemyIndex: -1,
    flashEnemyType: 'red',
    lungePlayer: 0,
    lungeEnemy: 0,
  },
  floatingTexts: [],
  buttons: [],
  showItems: false,
  menuMode: 'main',       // 'main' | 'skills' | 'items'
  skillPage: 0,           // página atual de skills (3 por página)
  xpEarned: 0,
  fadingEnemies: [],

  // NOVO: tooltip de skill
  tooltipSkill: null,     // objeto da skill sendo mostrada (ou null)
  tooltipPos: null,       // { x, y } da posição do ⓘ clicado
};

if (savedData.equip) {
  playerEquip.rightHand = savedData.equip.rightHand ?? playerEquip.rightHand;
  playerEquip.leftHand  = savedData.equip.leftHand  ?? playerEquip.leftHand;
}

export function addGold(amount) {
  playerStats.gold = Math.max(0, playerStats.gold + amount);
}

export let transitionCooldown = 0;
export function setTransitionCooldown(v) { transitionCooldown = v; }
export function decrementTransitionCooldown() { if (transitionCooldown > 0) transitionCooldown--; }
export function clearSave() { localStorage.removeItem('dungeonLoop_save'); }

export let worldSeed = savedData.worldSeed ?? Math.floor(Math.random() * 1e9);
export function setWorldSeed(s) { worldSeed = s; }