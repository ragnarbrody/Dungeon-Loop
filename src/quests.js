// ============================================================
// QUESTS — missões de história (story) e secundárias (side).
// Uma ativa por vez (só story por enquanto).
//
// Estado:
//   - active: id da quest ativa (ou null)
//   - progress: { [questId]: { [objectiveId]: número } }
//   - completed: Set de quests concluídas
//   - tracked: id da quest sendo rastreada no HUD (ou null)
//
// Fluxo:
//   - elderIntroSeen: já viu o diálogo de lore do Ancião?
//   - available: quests que o Ancião já pode oferecer
// ============================================================

// ---------- Definição das quests ----------
// Cada quest tem:
//   id, type ('story'|'side'), title, giver, description
//   objectives: [{ id, text, target, type, filter? }]
//   rewards: { xp, gold, items? }
//   next: id da próxima quest (ou null)
//
// type de objetivo:
//   - 'kill': conta mortes de inimigos; filter = id do inimigo (ou null = qualquer)
//   - 'collect': conta itens no inventário; filter = id do item
//   - 'visit': conta salas visitadas; filter = { gx, gy } (opcional)

import { removeMarker } from '../src/world/knowledge.js';
import { checkLevelUp } from './core/state.js';

let _getInventory = () => [];
let _visitedRooms = () => new Set();
export function setInventoryGetter(fn) { _getInventory = fn; }
export function setVisitedRoomsGetter(fn) { _visitedRooms = fn; }

export const QUEST_DB = {
  story_slimes: {
    id: 'story_slimes',
    type: 'story',
    title: 'Limpeza nos Arredores',
    giver: 'elder',
    description:
      'Alguns slimes têm aparecido nos arredores de Aethel, assustando os viajantes que chegam. Peço que você se livre deles.',
    objectives: [
      {
        id: 'kill_slimes',
        text: 'Derrote slimes nos arredores',
        target: 3,
        type: 'kill',
        filter: 'slime',
      },
    ],
    rewards: { xp: 30, gold: 20 },
    next: null, // por enquanto, não tem próxima
  },
  story_rat_tails: {
    id: 'story_rat_tails',
    type: 'story',
    title: 'Caudas para a Herbalista',
    giver: 'elder',            // quem OFERECE é o Ancião
    turnInNpc: 'herbalist',    // mas quem RECEBE é a herbalista
    prereq: ['story_slimes'],  // precisa ter concluído a dos slimes
    description:
      'Uma doença está se espalhando por Aethel. A Herbalista precisa de 3 caudas de rato do campo para preparar o remédio. Peço que a ajude.',
    objectives: [
      {
        id: 'collect_rat_tails',
        text: 'Colete caudas de rato',
        target: 3,
        type: 'collect',
        filter: 'rat_tail',
      },
    ],
    rewards: { xp: 40, gold: 30, items: [{ id: 'potion_medium', qty: 1 }] },
    next: null,
  },
  story_lost_traveler: {
    id: 'story_lost_traveler',
    type: 'story',
    title: 'O Pergaminho Perdido',
    giver: 'elder',
    prereq: ['story_slimes'],       // paralela com rat_tails
    description:
      'Um aldeão saiu de Aethel para buscar um pergaminho importante em outra cidade, mas não voltou. Você pode ir até o último local onde ele foi visto e descubrir o que aconteceu? Vou marcar a localização no seu mapa',
    objectives: [
      {
        id: 'visit_last_seen',
        text: 'O último local onde o aldeão foi visto está marcado no seu mapa (M). Vá até lá',
        target: 1,
        type: 'visit',
        filter: { gx: -2, gy: -4 },
      },
      {
        id: 'collect_letter',
        text: 'Encontre o pergaminho',
        target: 1,
        type: 'collect',
        filter: 'letter_to_elder',
      },
    ],
    rewards: { xp: 50, gold: 25, items: [{ id: 'potion_mana', qty: 2 }] },
    next: null,
  },
  story_forge_materials: {
    id: 'story_forge_materials',
    type: 'story',
    title: 'Materiais para o Caldeirão',
    giver: 'elder',              // o Ancião OFERECE
    turnInNpc: 'blacksmith',     // o FERREIRO recebe
    prereq: ['story_lost_traveler'],
    warning:
      'O Deserto fica a oeste de Aethel. É mais perigoso que os Campos. ' +
      'Leve poções e não subestime os escorpiões.',
    description:
      'O Ferreiro precisa de materiais pra forjar um caldeirão especial pra Herbalista. Alguns só existem no Deserto. Vá até lá, colete o que ele pediu e leve de volta pra ele.',
    objectives: [
      {
        id: 'collect_goblin_tooth',
        text: 'Dente de Goblin',
        target: 1,
        type: 'collect',
        filter: 'goblin_tooth',
      },
      {
        id: 'collect_slime_gel',
        text: 'Geleia de Slime',
        target: 3,
        type: 'collect',
        filter: 'slime_gel',
      },
      {
        id: 'collect_scorpion_pincer',
        text: 'Pinça de Escorpião',
        target: 2,
        type: 'collect',
        filter: 'scorpion_pincer',
      },
      {
        id: 'collect_vulture_egg',
        text: 'Ovo de Abutre',
        target: 1,
        type: 'collect',
        filter: 'vulture_egg',
      },
    ],
    rewards: { xp: 80, gold: 60, items: [{ id: 'potion_medium', qty: 2 }] },
    next: null,
  },

};

// ---------- Estado ----------
const state = {
  active: null,            // id da quest ativa
  progress: {},            // { [questId]: { [objId]: progresso } }
  completed: new Set(),    // ids concluídos
  tracked: null,           // id da quest sendo rastreada no HUD
  elderIntroSeen: false,   // já viu o diálogo de lore?
};

// ---------- API ----------
export function getQuest(id) {
  return QUEST_DB[id] || null;
}

export function getActiveQuest() {
  return state.active ? QUEST_DB[state.active] : null;
}

export function isQuestCompleted(id) {
  return state.completed.has(id);
}

export function isQuestActive(id) {
  return state.active === id;
}

export function hasSeenElderIntro() {
  return state.elderIntroSeen;
}

export function markElderIntroSeen() {
  state.elderIntroSeen = true;
}

// Quests que o Ancião pode oferecer agora.
// Regra: a primeira quest de história disponível.
export function getAvailableQuests() {
  const list = [];
  for (const q of Object.values(QUEST_DB)) {
    if (state.completed.has(q.id)) continue;
    if (state.active === q.id) continue;

    // Checa pré-requisitos (se houver)
    if (q.prereq && q.prereq.length > 0) {
      const missing = q.prereq.some(id => !state.completed.has(id));
      if (missing) continue;
    }

    list.push(q);
  }
  return list;
}

// Ativa uma quest (substitui a ativa, se houver).
export function activateQuest(id) {
  const q = QUEST_DB[id];
  if (!q) return false;
  if (state.completed.has(id)) return false;

  state.active = id;
  if (!state.progress[id]) {
    state.progress[id] = {};
    for (const obj of q.objectives) state.progress[id][obj.id] = 0;
  }
  state.tracked = id; // ativa o tracking por padrão
  return true;
}

export function deactivateTracking() {
  state.tracked = null;
}

export function trackQuest(id) {
  if (state.active !== id) return false;
  state.tracked = id;
  return true;
}

export function getTrackedQuest() {
  return state.tracked ? QUEST_DB[state.tracked] : null;
}

export function getProgress(questId, objId) {
  const q = QUEST_DB[questId];
  if (!q) return 0;
  const obj = q.objectives.find(o => o.id === objId);
  if (!obj) return state.progress[questId]?.[objId] ?? 0;

  // 'collect': progresso é o que o jogador TEM no inventário
  if (obj.type === 'collect') {
    const inv = _getInventory();
    const item = inv.find(i => i.id === obj.filter);
    return Math.min(obj.target, item ? item.qty : 0);
  }

  // 'visit': checa se o jogador já visitou a(s) sala(s) alvo
  if (obj.type === 'visit') {
    // filter pode ser { gx, gy } ou um array de { gx, gy }
    const targets = Array.isArray(obj.filter) ? obj.filter : [obj.filter];
    const visited = _visitedRooms();  // ← chama a função pra obter o Set
    let hits = 0;
    for (const t of targets) {
      if (!t) continue;
      if (visited.has(`${t.gx},${t.gy}`)) hits++;
    }
    return Math.min(obj.target, hits);
  }

  // outros tipos: progresso salvo em state.progress
  return state.progress[questId]?.[objId] ?? 0;
}

// Retorna true se a quest atingiu todos os objetivos.
export function isQuestReadyToComplete(questId) {
  const q = QUEST_DB[questId];
  if (!q) return false;
  for (const obj of q.objectives) {
    if (getProgress(questId, obj.id) < obj.target) return false;
  }
  return true;
}

// Avança um objetivo. Retorna true se a quest ficou pronta pra entregar.
// Chamado pelo combate (kill), inventário (collect), etc.
export function advanceObjective(questId, objId, amount = 1) {
  const q = QUEST_DB[questId];
  if (!q) return false;
  if (state.active !== questId) return false;

  const obj = q.objectives.find(o => o.id === objId);
  if (!obj) return false;

  const cur = getProgress(questId, objId);
  if (cur >= obj.target) return false; // já completo

  state.progress[questId][objId] = Math.min(obj.target, cur + amount);
  return isQuestReadyToComplete(questId);
}

// Chamado pelo combate quando um inimigo morre.
// Percorre os objetivos ativos do tipo 'kill' e avança se o filtro bater.
export function notifyEnemyKilled(enemyId) {
  if (!state.active) return;
  const q = QUEST_DB[state.active];
  if (!q) return;

  for (const obj of q.objectives) {
    if (obj.type !== 'kill') continue;
    if (obj.filter && obj.filter !== enemyId) continue;
    advanceObjective(q.id, obj.id, 1);
  }
}

// Chamado pelo player.js quando o jogador entra numa sala.
// Não precisa fazer nada ativo — o getProgress do 'visit' já lê direto
// do Set de visitedRooms. Mas deixamos a função aqui pra futuros tipos
// (ex.: 'visit' com efeito imediato, contador, etc.).
export function notifyRoomVisited(gx, gy) {
  // No-op por enquanto. O getProgress resolve.
}

// Finaliza a quest ativa (chamado quando o jogador entrega ao Ancião).
// Aplica recompensas e marca como concluída.
//
// IMPORTANTE: para objetivos do tipo 'collect', consome do inventário
// os itens entregues (obj.filter, na quantidade obj.target) ANTES de
// aplicar as recompensas. Isso evita que o jogador fique com os itens
// "fantasmas" depois de entregar a quest.
export function completeActiveQuest(playerStats, addItemToInventoryFn) {
  const q = getActiveQuest();
  if (!q) return null;
  if (!isQuestReadyToComplete(q.id)) return null;

  // ---- 1) Consome os itens de coleta ----
  for (const obj of q.objectives) {
    if (obj.type !== 'collect') continue;
    if (!obj.filter) continue;

    let toRemove = obj.target;
    const inv = playerStats.inventory;
    for (let i = inv.length - 1; i >= 0 && toRemove > 0; i--) {
      if (inv[i].id !== obj.filter) continue;
      const take = Math.min(inv[i].qty, toRemove);
      inv[i].qty -= take;
      toRemove -= take;
      if (inv[i].qty <= 0) inv.splice(i, 1);
    }
  }

  // ---- 2) Remove markers específicos de quest ----
  // (Fora do loop: roda UMA vez, não por objetivo.)
  if (q.id === 'story_lost_traveler') {
    removeMarker('marker_lost_traveler');
  }

  // ---- 3) Marca como concluída ----
  state.completed.add(q.id);
  state.active = null;
  state.tracked = null;

  // ---- 4) Aplica recompensas ----
  const rewards = q.rewards || {};
  if (rewards.xp) {
    playerStats.xp += rewards.xp;
    }
  if (rewards.gold) playerStats.gold += rewards.gold;
  if (rewards.items && addItemToInventoryFn) {
    for (const it of rewards.items) {
      addItemToInventoryFn(playerStats.inventory, it.id, it.qty);
    }
  }

  return q;
}

// ---------- Serialização ----------
export function serializeQuests() {
  return {
    active: state.active,
    progress: JSON.parse(JSON.stringify(state.progress)),
    completed: Array.from(state.completed),
    tracked: state.tracked,
    elderIntroSeen: state.elderIntroSeen,
  };
}

export function loadQuests(data) {
  if (!data) return;
  state.active = data.active ?? null;
  state.progress = data.progress ?? {};
  state.completed = new Set(data.completed ?? []);
  state.tracked = data.tracked ?? null;
  state.elderIntroSeen = !!data.elderIntroSeen;
}

export function resetQuests() {
  state.active = null;
  state.progress = {};
  state.completed.clear();
  state.tracked = null;
  state.elderIntroSeen = false;
}

// Retorna a lista (ordenada por id) de quests concluídas com dados completos.
export function getCompletedQuests() {
  return Array.from(state.completed)
    .map(id => QUEST_DB[id])
    .filter(Boolean);
}

// NPC que OFERECE a quest (para o menu do Ancião)
export function getQuestGiver(q) {
  return q ? (q.giver || 'elder') : null;
}

// NPC que RECEBE a entrega (para o menu da Herbalista)
// Fallback: se não tiver turnInNpc, é o próprio giver.
export function getTurnInNpc(q) {
  if (!q) return null;
  return q.turnInNpc || q.giver || 'elder';
}