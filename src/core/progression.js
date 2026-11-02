import { getQuestsByChapter, isQuestCompleted } from '../quests.js';

export const LEVEL_STEP = 5;
export const CHAPTER_ORDER = ['fields', 'desert'];       // acrescente os outros 6 biomas na ordem do mundo
export const CHAPTER_NAMES = { fields: 'os Campos', desert: 'o Deserto' };

export const STARTER_ITEMS = {
  knightess: [{ id: 'potion_weak', qty: 2 }, { id: 'potion_str', qty: 1 }],
  mage:      [{ id: 'potion_weak', qty: 1 }, { id: 'potion_mana', qty: 2 }],
  thief:     [{ id: 'potion_weak', qty: 2 }, { id: 'potion_agi', qty: 1 }],
  huntress:  [{ id: 'potion_weak', qty: 1 }, { id: 'potion_mana', qty: 1 }],
};

const state = { milestones: {} };   // { 5: {level,str,...}, 10: {...} }

// ---------- Capítulos ----------
export function isChapterComplete(id) {
  const req = getQuestsByChapter(id).filter(q => !q.optional);
  return req.length > 0 && req.every(q => isQuestCompleted(q.id));
}
export function getCompletedChapters() {
  const done = [];
  for (const id of CHAPTER_ORDER) {
    if (!isChapterComplete(id)) break;     // capítulo N exige o N-1
    done.push(id);
  }
  return done;
}

// ---------- Marcos de nível ----------
export function xpToNextFor(level) {       // mesma curva do checkLevelUp
  let x = 50;
  for (let i = 1; i < level; i++) x = Math.floor(x * 1.5);
  return x;
}

function snap(ps, level) {
  return { level, str: ps.str, agi: ps.agi, int: ps.int, def: ps.def,
           vit: ps.vit, magia: ps.magia, _baseMp: ps._baseMp };
}

// Chamado todo frame em EXPLORE (sai cedo). Só captura com os pontos já gastos.
export function captureMilestoneIfNeeded(ps) {
  const L = ps.level;
  if (ps.points > 0 || L < LEVEL_STEP || L % LEVEL_STEP !== 0) return;
  if (state.milestones[L]) return;
  state.milestones[L] = snap(ps, L);
}
export function forceMilestone(ps) {      // debug / saves antigos
  const L = Math.floor(ps.level / LEVEL_STEP) * LEVEL_STEP;
  if (L >= LEVEL_STEP) state.milestones[L] = snap(ps, L);
}

function findRestoreMilestone(level) {
  for (let s = Math.floor(level / LEVEL_STEP) * LEVEL_STEP; s >= LEVEL_STEP; s -= LEVEL_STEP) {
    if (state.milestones[s]) return state.milestones[s];
  }
  return null;
}

// ---------- Plano de morte ----------
export function planDeath(level) {
  const chapters = getCompletedChapters();
  if (chapters.length === 0) return { type: 'reset', reason: 'chapter' };
  const snapshot = findRestoreMilestone(level);
  if (!snapshot) return { type: 'reset', reason: 'level' };   // chegou "cedo demais"
  return { type: 'checkpoint', chapters, snapshot };
}

// ---------- Save ----------
export function serializeProgression() { return { milestones: JSON.parse(JSON.stringify(state.milestones)) }; }
export function loadProgression(d) {
  state.milestones = d && typeof d.milestones === 'object' && d.milestones ? { ...d.milestones } : {};
}
export function resetProgression() { state.milestones = {}; }