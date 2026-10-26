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
    // Por enquanto, só a primeira quest de história (sem pré-requisito)
    // Quando houver cadeia, checar `prereq` aqui.
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

// Finaliza a quest ativa (chamado quando o jogador entrega ao Ancião).
// Aplica recompensas e marca como concluída.
export function completeActiveQuest(playerStats, addItemToInventoryFn) {
  const q = getActiveQuest();
  if (!q) return null;
  if (!isQuestReadyToComplete(q.id)) return null;

  state.completed.add(q.id);
  state.active = null;
  state.tracked = null;

  // Recompensas
  const rewards = q.rewards || {};
  if (rewards.xp) playerStats.xp += rewards.xp;
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