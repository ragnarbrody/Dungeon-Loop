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

const state = { milestones: {} };   // { fields: {level,str,...}, desert: {...} }

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

function snap(ps) {
  return { level: ps.level, str: ps.str, agi: ps.agi, int: ps.int, def: ps.def,
           vit: ps.vit, magia: ps.magia, _baseMp: ps._baseMp };
}

// Chamado todo frame em EXPLORE. Só captura com os pontos já gastos,
// então se a entrega da quest subir de nível, espera o jogador distribuir.
export function captureMilestoneIfNeeded(ps) {
  if (ps.points > 0) return;
  for (const id of getCompletedChapters()) {
    if (!state.milestones[id]) state.milestones[id] = snap(ps);
  }
}

// debug / saves antigos: força o snapshot do último capítulo completo
export function forceMilestone(ps) {
  const done = getCompletedChapters();
  if (done.length) state.milestones[done[done.length - 1]] = snap(ps);
}

function findRestoreMilestone(level) {
  for (let s = Math.floor(level / LEVEL_STEP) * LEVEL_STEP; s >= LEVEL_STEP; s -= LEVEL_STEP) {
    if (state.milestones[s]) return state.milestones[s];
  }
  return null;
}

// ---------- Plano de morte ----------
export function planDeath() {
  const chapters = getCompletedChapters();
  if (chapters.length === 0) return { type: 'reset', reason: 'chapter' };
  const snapshot = state.milestones[chapters[chapters.length - 1]];
  if (!snapshot) return { type: 'reset', reason: 'snapshot' };
  return { type: 'checkpoint', chapters, snapshot };
}

// ---------- Save ----------
export function serializeProgression() { return { milestones: JSON.parse(JSON.stringify(state.milestones)) }; }
export function loadProgression(d) {
  state.milestones = d && typeof d.milestones === 'object' && d.milestones ? { ...d.milestones } : {};
}
export function resetProgression() { state.milestones = {}; }