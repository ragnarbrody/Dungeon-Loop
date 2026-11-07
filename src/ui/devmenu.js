// src/ui/devmenu.js
// ============================================================
// MENU DE DESENVOLVEDOR
//
// Ativação:
//   - Digitar "dev" (sem clicar em nenhum input) em qualquer tela
//     de exploração.
//   - Ctrl+Shift+D em qualquer lugar (exceto combate).
//
// O painel permite:
//   - Ativar qualquer quest
//   - Concluir a quest ativa
//   - Pular direto pra quests específicas (caverna, escolta)
//   - Adicionar ouro, XP, HP, MP
//   - Adicionar itens (tocha, poções, ervas, materiais)
//   - Matar o personagem (testar game over)
//   - Toggle imortalidade
//   - Resetar o cofre (sem apagar o save)
//   - Resetar o save inteiro (perigoso!)
//   - Trocar de classe
//   - Forçar checkpoint do Deserto
// ============================================================

import { playerStats, saveGame, checkLevelUp, setPaused, metaState } from '../core/state.js';
import { QUEST_DB, activateQuest, completeActiveQuest,
         getActiveQuest, isQuestCompleted, isQuestActive,
         getProgress } from '../quests.js';
import { addItemToInventory, ITEMS_DB } from '../items.js';
import { showToast } from './toast.js';
import { sfx } from '../audio/audio.js';

let container = null;
let visible = false;
let keyBuffer = '';
const SECRET = 'dev';
const DEV_PASSWORD = 'batata2026**';

// Flag de "imortalidade" (só no dev menu — não persiste no save)
let godMode = false;

// ------------------------------------------------------------
// Container (criado uma vez)
// ------------------------------------------------------------
function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'devmenu-screen';
  container.style.cssText = `
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(10, 10, 20, 0.95);
    border: 4px solid #0f0f1a;
    border-radius: 8px;
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 100;
    font-family: 'Courier New', monospace;
    color: #eee;
    overflow-y: auto;
  `;

  container.innerHTML = `
    <div style="
      width: min(90%, 760px);
      max-height: 92%;
      background: #1a1a2e;
      border: 2px solid #c9a24d;
      border-radius: 6px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
    ">
      <h2 style="color:#c9a24d; margin:0; text-align:center; letter-spacing:1px;">
        🛠️ Menu do Desenvolvedor
      </h2>

      <!-- Status resumido -->
      <div id="dev-stats" style="
        background:#2a2a3e; border:1px solid #444; border-radius:4px;
        padding:10px 14px; font-size:12px; line-height:1.6;
      "></div>

      <!-- Quest -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#c9a24d; margin:0; font-size:14px;">📜 Missões</h3>
        <div id="dev-quest-list" style="
          display:flex; flex-wrap:wrap; gap:6px;
        "></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
          <button data-action="complete-quest" style="
            background:#4f9a4a; color:#fff; border:none; padding:8px 14px;
            border-radius:4px; cursor:pointer; font-family:inherit; font-weight:bold;
          ">Concluir quest ativa</button>
          <button data-action="jump-cave" style="
            background:#8a5a3a; color:#fff; border:none; padding:8px 14px;
            border-radius:4px; cursor:pointer; font-family:inherit; font-weight:bold;
          ">🕳️ Pular pra caverna (5.2)</button>
          <button data-action="jump-escort" style="
            background:#2a6b2a; color:#fff; border:none; padding:8px 14px;
            border-radius:4px; cursor:pointer; font-family:inherit; font-weight:bold;
          ">🌿 Pular pra escolta da Herbalista</button>
          <button data-action="jump-latest" style="
            background:#4a2a1e; color:#feca57; border:2px solid #feca57;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">⏭️ Avançar até a última missão</button>
          <button data-action="jump-boss-arena" style="
            background:#3a1a2e; color:#ff8ad8; border:2px solid #ff8ad8;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">⚔️ Pular pra arena do 1º boss (equipado)</button>
        </div>
      </div>

      <!-- Recursos -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#c9a24d; margin:0; font-size:14px;">💰 Recursos</h3>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button data-action="gold" style="
            background:#2a2a3e; color:#f0c060; border:2px solid #c9a24d;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">+10.000 ouro</button>
          <button data-action="xp" style="
            background:#2a2a3e; color:#feca57; border:2px solid #c9a24d;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">+500 XP</button>
          <button data-action="hp" style="
            background:#2a2a3e; color:#ff6b6b; border:2px solid #c9a24d;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">HP cheio</button>
          <button data-action="mp" style="
            background:#2a2a3e; color:#3aa0ff; border:2px solid #c9a24d;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">MP cheio</button>
        </div>
      </div>

      <!-- Itens -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#c9a24d; margin:0; font-size:14px;">🎒 Itens</h3>
        <div id="dev-item-list" style="
          display:flex; flex-wrap:wrap; gap:6px;
        "></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:6px;">
          <button data-action="add-herbs" style="
            background:#2a2a3e; color:#6fbd63; border:1px solid #6fbd63;
            padding:6px 12px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-size:11px; font-weight:bold;
          ">+3 Ervas da Herbalista</button>
        </div>
      </div>

      <!-- Testes -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#ffb703; margin:0; font-size:14px;">🧪 Testes</h3>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button data-action="kill-player" style="
            background:#5a1a1a; color:#fff; border:2px solid #ff6b6b;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">💀 Matar o personagem</button>
          <button data-action="toggle-god" id="dev-god-btn" style="
            background:#2a2a3e; color:#8ad8ff; border:2px solid #8ad8ff;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">🛡️ Imortalidade: OFF</button>
          <button data-action="force-checkpoint" style="
            background:#2a2a3e; color:#c9a24d; border:2px solid #c9a24d;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">📍 Forçar checkpoint do Deserto</button>
          <button data-action="log-state" style="
            background:#2a2a3e; color:#ddd; border:1px solid #666;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">📋 Logar estado no console</button>
        </div>
      </div>

      <!-- Classe -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#c9a24d; margin:0; font-size:14px;">⚔️ Classe</h3>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button data-action="class:knightess" style="
            background:#2a2a3e; color:#ddd; border:1px solid #c9a24d;
            padding:6px 12px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-size:11px;
          ">Cavaleira</button>
          <button data-action="class:mage" style="
            background:#2a2a3e; color:#ddd; border:1px solid #c9a24d;
            padding:6px 12px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-size:11px;
          ">Mago</button>
          <button data-action="class:thief" style="
            background:#2a2a3e; color:#ddd; border:1px solid #c9a24d;
            padding:6px 12px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-size:11px;
          ">Ladrão</button>
          <button data-action="class:huntress" style="
            background:#2a2a3e; color:#ddd; border:1px solid #c9a24d;
            padding:6px 12px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-size:11px;
          ">Caçadora</button>
        </div>
      </div>

      <!-- Perigoso -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#ff6b6b; margin:0; font-size:14px;">⚠️ Zona de Perigo</h3>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button data-action="reset-meta" style="
            background:#3a1a1a; color:#ffb703; border:2px solid #ffb703;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">Resetar cofre/meta (sem apagar save)</button>
          <button data-action="reset-save" style="
            background:#5a1a1a; color:#fff; border:2px solid #ff6b6b;
            padding:8px 14px; border-radius:4px; cursor:pointer;
            font-family:inherit; font-weight:bold;
          ">Apagar save e voltar ao menu</button>
        </div>
      </div>

      <!-- Fechar -->
      <div style="display:flex; justify-content:flex-end; padding-top:6px; border-top:1px solid #333;">
        <button data-action="close" style="
          background:transparent; color:#888; border:1px solid #555;
          padding:8px 16px; border-radius:4px; cursor:pointer;
          font-family:inherit; font-size:12px;
        ">Fechar (Ctrl+Shift+D)</button>
      </div>
    </div>
  `;

  document.getElementById('game-container').appendChild(container);

  // Delegação de clique pros botões (data-action)
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    if (!action) return;
    sfx('click');
    handleAction(action);
  });

  return container;
}

// ------------------------------------------------------------
// Refresh (desenha stats, quests, itens)
// ------------------------------------------------------------
function refresh() {
  if (!container) return;

  // Stats resumidos
  const statsEl = container.querySelector('#dev-stats');
  if (statsEl) {
    const cls = playerStats.classId || '—';
    const active = getActiveQuest();
    const checkpoint = playerStats.checkpoint
      ? `bioma "${playerStats.checkpoint.biomeId}" (Nv ${playerStats.checkpoint.level})`
      : '—';
    const companion = playerStats._escortActive ? 'ativa (Herbalista)' : 'inativa';
    statsEl.innerHTML = `
      <div>Classe: <b style="color:#c9a24d">${cls}</b> · Nv <b>${playerStats.level}</b> · XP ${playerStats.xp}/${playerStats.xpToNextLevel}</div>
      <div>HP: <span style="color:#ff6b6b">${playerStats.hp}/${playerStats.maxHp}</span> · MP: <span style="color:#3aa0ff">${playerStats.mp}/${playerStats.maxMp}</span> · Ouro: <span style="color:#f0c060">${playerStats.gold}</span></div>
      <div>Quest ativa: <b style="color:#feca57">${active ? active.title : '—'}</b></div>
      <div>Companion: <b style="color:#6fbd63">${companion}</b> · Checkpoint: <b style="color:#c9a24d">${checkpoint}</b></div>
      <div>Núcleos: <b style="color:#8ad8ff">${playerStats.portalCores.size}/8</b> · Cofre: <b style="color:#f0c060">${metaState.vault.gold} ouro</b>, ${metaState.vault.items.filter(Boolean).length}/${metaState.vault.slots} slots</div>
    `;
  }

  // Botão de imortalidade
  const godBtn = container.querySelector('#dev-god-btn');
  if (godBtn) {
    godBtn.textContent = godMode ? '🛡️ Imortalidade: ON' : '🛡️ Imortalidade: OFF';
    godBtn.style.color = godMode ? '#6fbd63' : '#8ad8ff';
    godBtn.style.borderColor = godMode ? '#6fbd63' : '#8ad8ff';
  }

  // Lista de quests
  const questList = container.querySelector('#dev-quest-list');
  if (questList) {
    questList.innerHTML = '';
    for (const q of Object.values(QUEST_DB)) {
      const done = isQuestCompleted(q.id);
      const active = isQuestActive(q.id);
      const btn = document.createElement('button');
      btn.dataset.action = `quest:${q.id}`;
      btn.textContent = (done ? '✔ ' : active ? '▶ ' : '') + q.title;
      btn.style.cssText = `
        background:${done ? '#222a24' : active ? '#3a2a1e' : '#2a2a3e'};
        color:${done ? '#6fbd63' : active ? '#c9a24d' : '#ddd'};
        border:2px solid ${done ? '#3a5a3a' : active ? '#c9a24d' : '#444'};
        padding:6px 10px; border-radius:4px; cursor:pointer;
        font-family:inherit; font-size:11px; font-weight:bold;
      `;
      btn.onclick = () => {
        sfx('click');
        if (done) {
          showToast({ itemId: 'bag', title: 'Quest já concluída', color: '#6fbd63' });
          return;
        }
        if (!active) {
          activateQuest(q.id);
          showToast({ itemId: 'questlog', title: 'Quest ativada', subtitle: q.title, color: '#feca57' });
        } else {
          showToast({ itemId: 'questlog', title: 'Quest já ativa', color: '#feca57' });
        }
        saveGame();
        refresh();
      };
      questList.appendChild(btn);
    }
  }

  // Lista de itens agrupada por categoria
  const itemList = container.querySelector('#dev-item-list');
  if (itemList) {
    itemList.innerHTML = '';

    // Agrupa ITEMS_DB por categoria
    const groups = {
      consumable: { label: '🧪 Consumíveis', items: [] },
      weapon:     { label: '⚔️ Armas',       items: [] },
      shield:     { label: '🛡️ Escudos',     items: [] },
      armor:      { label: '🥋 Armaduras',   items: [] },
      torch:      { label: '🔥 Tochas',      items: [] },
      loot:       { label: '💰 Loot',        items: [] },
      material:   { label: '🪨 Materiais',   items: [] },
      quest:      { label: '📜 Missão',      items: [] },
    };

    for (const [id, info] of Object.entries(ITEMS_DB)) {
      const kind = info.kind || info.type || 'material';
      const group = groups[kind];
      if (!group) {
        // fallback: joga em "outros"
        (groups.other ||= { label: '❓ Outros', items: [] }).items.push({ id, info });
        continue;
      }
      group.items.push({ id, info });
    }

    // Ordena cada grupo por nome
    for (const g of Object.values(groups)) {
      g.items.sort((a, b) => a.info.name.localeCompare(b.info.name));
    }

    // Renderiza grupos como seções colapsáveis (<details>)
    for (const [kind, group] of Object.entries(groups)) {
      if (group.items.length === 0) continue;

      const details = document.createElement('details');
      details.style.cssText = 'width:100%; margin-top:4px;';

      const summary = document.createElement('summary');
      summary.textContent = `${group.label} (${group.items.length})`;
      summary.style.cssText = `
        cursor:pointer; color:#c9a24d; font-weight:bold; padding:4px 6px;
        background:#1a1a2e; border:1px solid #444; border-radius:4px;
        user-select:none;
      `;
      details.appendChild(summary);

      const inner = document.createElement('div');
      inner.style.cssText = 'display:flex; flex-wrap:wrap; gap:6px; padding:6px 0;';

      for (const { id, info } of group.items) {
        const btn = document.createElement('button');
        btn.dataset.action = `item:${id}`;
        btn.textContent = `+1 ${info.name}`;
        btn.style.cssText = `
          background:#2a2a3e; color:#ddd; border:1px solid #c9a24d;
          padding:6px 10px; border-radius:4px; cursor:pointer;
          font-family:inherit; font-size:11px;
        `;
        btn.onclick = () => {
          sfx('click');
          const added = addItemToInventory(playerStats.inventory, id, 1);
          if (added > 0) {
            showToast({ itemId: id, title: info.name, subtitle: `+${added}`, color: '#6fbd63' });
            saveGame();
            refresh();
          } else {
            showToast({ itemId: id, title: info.name, subtitle: 'inventário cheio', color: '#ff6b6b' });
          }
        };
        inner.appendChild(btn);
      }

      details.appendChild(inner);
      itemList.appendChild(details);
    }
  }
}

// ------------------------------------------------------------
// Helpers de "pular pra quest"
// ------------------------------------------------------------

// Marca uma quest como concluída SEM aplicar recompensa (usado pra
// pular pré-requisitos). Não chama `completeActiveQuest` — só mexe
// no Set de completas. O `getAvailableQuests` já respeita isso.
function markQuestCompletedSilently(questId) {
  return import('../quests.js').then((mod) => {
    // Não temos API pública pra isso, então usamos o `completeActiveQuest`
    // só se a quest estiver ativa e pronta. Senão, "forçamos" pelo
    // internalState via `activateQuest` + `advanceObjective` + `complete`.
    if (mod.isQuestCompleted(questId)) return;
    mod.activateQuest(questId);
    const q = mod.getQuest(questId);
    if (!q) return;
    for (const obj of q.objectives) {
      const cur = mod.getProgress(questId, obj.id);
      if (cur < obj.target) {
        mod.advanceObjective(questId, obj.id, obj.target - cur);
      }
    }
    mod.completeActiveQuest(playerStats, addItemToInventory);
  });
}

// ------------------------------------------------------------
// Ações
// ------------------------------------------------------------
function handleAction(action) {
  if (action === 'close') {
    closeDevMenu();
    return;
  }

  if (action === 'gold') {
    playerStats.gold += 10000;
    saveGame();
    showToast({ itemId: 'gold', title: 'Ouro', subtitle: '+10.000', color: '#f0c060' });
    refresh();
    return;
  }

  if (action === 'xp') {
    playerStats.xp += 500;
    checkLevelUp();
    saveGame();
    showToast({ itemId: 'levelup', title: 'XP', subtitle: '+500', color: '#feca57' });
    refresh();
    return;
  }

  if (action === 'hp') {
    playerStats.hp = playerStats.maxHp;
    saveGame();
    showToast({ itemId: 'potion_strong', title: 'HP cheio', color: '#6fbd63' });
    refresh();
    return;
  }

  if (action === 'mp') {
    playerStats.mp = playerStats.maxMp;
    saveGame();
    showToast({ itemId: 'potion_mana_strong', title: 'MP cheio', color: '#8ad8ff' });
    refresh();
    return;
  }

  if (action === 'add-herbs') {
    const n = addItemToInventory(playerStats.inventory, 'herb_herbalist', 3);
    saveGame();
    showToast({ itemId: 'herb_herbalist', title: 'Ervas', subtitle: `+${n}`, color: '#6fbd63' });
    refresh();
    return;
  }

  if (action === 'complete-quest') {
    const q = getActiveQuest();
    if (!q) {
      showToast({ itemId: 'questlog', title: 'Nenhuma quest ativa', color: '#ff6b6b' });
      return;
    }

    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
    ]).then(([questsMod, stateMod]) => {
      // 1) Preenche os objetivos
      for (const obj of q.objectives) {
        if (obj.type === 'kill' || obj.type === 'dungeon_clear') {
          const cur = questsMod.getProgress(q.id, obj.id);
          if (cur < obj.target) {
            questsMod.advanceObjective(q.id, obj.id, obj.target - cur);
          }
        } else if (obj.type === 'collect') {
          const inv = playerStats.inventory;
          const existing = inv.find(i => i.id === obj.filter);
          const current = existing ? existing.qty : 0;
          const needed = Math.max(0, obj.target - current);
          if (needed > 0) addItemToInventory(inv, obj.filter, needed);
        } else if (obj.type === 'visit') {
          const targets = Array.isArray(obj.filter) ? obj.filter : [obj.filter];
          for (const t of targets) {
            if (t) stateMod.visitedRooms.add(`${t.gx},${t.gy}`);
          }
        } else if (obj.type === 'interact' || obj.type === 'escort_arrive') {
          // Avança direto (o input.js faria isso, mas o devmenu não passa por lá)
          const cur = questsMod.getProgress(q.id, obj.id);
          if (cur < obj.target) {
            questsMod.advanceObjective(q.id, obj.id, obj.target - cur);
          }
        }
      }

      // 2) Completa a quest
      const result = completeActiveQuest(playerStats, addItemToInventory);
      if (result) {
        saveGame();
        showToast({
          itemId: 'levelup',
          title: 'Quest concluída!',
          subtitle: result.title,
          color: '#6fbd63',
        });
        refresh();
      } else {
        showToast({
          itemId: 'questlog',
          title: 'Não foi possível completar',
          subtitle: 'Verifique os objetivos',
          color: '#ff6b6b',
        });
      }
    });
    return;
  }

  // ---- Pular pra caverna (5.2) ----
  if (action === 'jump-cave') {
    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
      import('../world/rooms.js'),
      import('../world/knowledge.js'),
    ]).then(([questsMod, stateMod, roomsMod, knowledgeMod]) => {
      // 1) Dá a tocha (o `story_torch` precisa dela)
      addItemToInventory(playerStats.inventory, 'torch', 1);

      // 2) Garante os prereqs (sem reward duplicado)
      const prereqs = ['story_slimes', 'story_rat_tails', 'story_lost_traveler',
                       'story_forge_materials', 'story_torch'];
      let chain = Promise.resolve();
      for (const id of prereqs) {
        chain = chain.then(() => markQuestCompletedSilently(id));
      }

      chain.then(() => {
        // 3) Ativa a story_cave
        if (!questsMod.isQuestCompleted('story_cave')) {
          questsMod.activateQuest('story_cave');
        }
        // 4) Teleporta pra sala -2, 8
        const room = roomsMod.getRoom(-2, 8);
        stateMod.setCurrentRoom(room);
        stateMod.markRoomVisited(-2, 8);
        knowledgeMod.revealRoom(-2, 8);
        stateMod.player.x = 15 * 20 + 10;
        stateMod.player.y = 15 * 20 + 10;
        stateMod.setTransitionCooldown(30);
        saveGame();
        showToast({ itemId: 'questlog', title: 'Teleportado', subtitle: 'Caverna (-2, 8)', color: '#c9a24d' });
        closeDevMenu();
      });
    });
    return;
  }

  // ---- Pular pra escolta da Herbalista ----
  if (action === 'jump-escort') {
    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
      import('../world/rooms.js'),
      import('../world/knowledge.js'),
    ]).then(([questsMod, stateMod, roomsMod, knowledgeMod]) => {
      // 1) Garante TODAS as quests dos Campos até a caverna
      const prereqs = ['story_slimes', 'story_rat_tails', 'story_lost_traveler',
                       'story_forge_materials', 'story_torch', 'story_cave'];
      let chain = Promise.resolve();
      for (const id of prereqs) {
        chain = chain.then(() => markQuestCompletedSilently(id));
      }

      chain.then(() => {
        // 2) Ativa a escolta
        if (!questsMod.isQuestCompleted('story_herbalist_escort')) {
          questsMod.activateQuest('story_herbalist_escort');
        }
        // 3) Teleporta pra sala -5, -2
        const room = roomsMod.getRoom(-5, -2);
        stateMod.setCurrentRoom(room);
        stateMod.markRoomVisited(-5, -2);
        knowledgeMod.revealRoom(-5, -2);
        stateMod.player.x = 15 * 20 + 10;
        stateMod.player.y = 15 * 20 + 10;
        stateMod.setTransitionCooldown(30);
        saveGame();
        showToast({ itemId: 'questlog', title: 'Teleportado', subtitle: 'Sala da Herbalista (-5, -2)', color: '#c9a24d' });
        closeDevMenu();
      });
    });
    return;
  }

  // ---- Pular direto pra última missão disponível ----
  if (action === 'jump-latest') {
    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
      import('../world/rooms.js'),
      import('../world/knowledge.js'),
    ]).then(([questsMod, stateMod, roomsMod, knowledgeMod]) => {
      // Lista encadeada (na ordem em que aparecem no QUEST_DB) e completa
      // todas MENOS a última disponível.
      const allIds = Object.keys(questsMod.QUEST_DB);
      const completed = new Set();
      let lastAvailable = null;

      for (const id of allIds) {
        const q = questsMod.QUEST_DB[id];
        if (!q) continue;
        const done = questsMod.isQuestCompleted(id);
        const active = questsMod.isQuestActive(id);
        if (done) { completed.add(id); continue; }
        if (active) { lastAvailable = id; break; }

        // Checa prereqs
        const missing = (q.prereq || []).some(p => !questsMod.isQuestCompleted(p));
        if (missing) continue;
        lastAvailable = id;
        break;
      }

      if (!lastAvailable) {
        showToast({ itemId: 'questlog', title: 'Todas as quests já estão concluídas ou ativas', color: '#ff6b6b' });
        return;
      }

      // Completa silenciosamente todas as anteriores
      const chain = [];
      for (const id of allIds) {
        if (id === lastAvailable) break;
        if (questsMod.isQuestCompleted(id)) continue;
        chain.push(id);
      }

      let p = Promise.resolve();
      for (const id of chain) {
        p = p.then(() => markQuestCompletedSilently(id));
      }

      p.then(() => {
        // Ativa a última
        if (!questsMod.isQuestCompleted(lastAvailable) && !questsMod.isQuestActive(lastAvailable)) {
          questsMod.activateQuest(lastAvailable);
        }
        const q = questsMod.QUEST_DB[lastAvailable];
        saveGame();
        showToast({
          itemId: 'questlog',
          title: 'Avançou até a última missão',
          subtitle: q.title,
          color: '#feca57',
        });
        refresh();
      }).catch(console.error);
    });
    return;
  }

  // ---- Matar o personagem ----
  if (action === 'kill-player') {
    Promise.all([
      import('../core/state.js'),
      import('../battle/battle.js'),
    ]).then(([stateMod, battleMod]) => {
      stateMod.playerStats.hp = 0;
      // Se não estiver em combate, força um game over "manual"
      if (stateMod.gameState === stateMod.STATE.BATTLE) {
        stateMod.battle.turn = 'resolve-end';
        stateMod.battle.turnTimer = 0;
        // O loop pega daqui e chama resolveDeath()
      } else {
        // Fora de combate: chama resolveDeath direto + vai pro game over
        import('../core/death.js').then((deathMod) => {
          stateMod.setGameState(stateMod.STATE.GAME_OVER);
          const r = deathMod.resolveDeath();
          deathMod.showDeathSummary(r);
          document.getElementById('gameover-screen').classList.remove('hidden');
          document.getElementById('hud').classList.add('hidden');
          closeDevMenu();
        });
      }
      saveGame();
      showToast({ itemId: 'potion_weak', title: 'Matando...', subtitle: 'HP = 0', color: '#ff6b6b' });
      refresh();
    });
    return;
  }

  // ---- Toggle imortalidade ----
  if (action === 'toggle-god') {
    godMode = !godMode;
    showToast({
      itemId: 'shield',
      title: godMode ? 'Imortalidade ativada' : 'Imortalidade desativada',
      color: godMode ? '#6fbd63' : '#8ad8ff',
    });
    refresh();
    return;
  }

  // ---- Pular pra arena do 1º boss, já equipado e com poções ----
  if (action === 'jump-boss-arena') {
    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
      import('../world/rooms.js'),
      import('../world/knowledge.js'),
      import('../sprites/equipment.js'),
      import('../core/canvas.js'),
    ]).then(([questsMod, stateMod, roomsMod, knowledgeMod, equipMod, canvasMod]) => {
      // 1) Conclui silenciosamente todas as quests anteriores à prep
      const prereqs = [
        'story_slimes',
        'story_rat_tails',
        'story_lost_traveler',
        'story_forge_materials',
        'story_torch',
        'story_cave',
        'story_herbalist_escort',
        'story_banner',
      ];

      // Equipa a armadura de ferro
      // (se os IDs não existirem no ITEMS_DB, o addItemToInventory
      //  simplesmente ignora — sem crashar)
      const ironSet = [
        'iron_helmet',
        'iron_armor',
        'iron_boots',
        'iron_ring1',   // se existirem
        'iron_ring2',
        'iron_amulet',
      ];
      for (const id of ironSet) {
        if (!addItemToInventory(playerStats.inventory, id, 1)) continue;
        // Equipa direto (assume slot = prefixo do id, sem o "iron_")
        const slot = id.replace(/^iron_/, '');
        // Mapeamento de slot pra o `playerEquip`:
        const slotMap = {
          helmet: 'helmet',
          armor:  'armor',
          boots:  'boots',
          amulet: 'amulet',
          ring1:  'ring1',
          ring2:  'ring2',
        };
        const targetSlot = slotMap[slot];
        if (targetSlot && equipMod.playerEquip[targetSlot] == null) {
          equipMod.playerEquip[targetSlot] = id;
        }
      }

      // Poções (20 + 20)
      addItemToInventory(playerStats.inventory, 'potion_medium', 20);
      addItemToInventory(playerStats.inventory, 'potion_mana_medium', 20);

      // 2) Conclui os prereqs (silenciosamente, sem recompensa)
      let chain = Promise.resolve();
      for (const id of prereqs) {
        chain = chain.then(() => markQuestCompletedSilently(id));
      }

      chain.then(() => {
        // 3) Ativa a story_guardian_prep (necessária pra arena existir)
        if (!questsMod.isQuestCompleted('story_guardian_prep') &&
            !questsMod.isQuestActive('story_guardian_prep')) {
          questsMod.activateQuest('story_guardian_prep');
        }

        // 4) Força o cache a regenerar a arena COM o boss
        roomsMod.roomCache.delete('6,8');

        // 5) Vai pra arena
        const room = roomsMod.getRoom(6, 8);
        stateMod.setCurrentRoom(room);
        stateMod.markRoomVisited(6, 8);
        knowledgeMod.revealRoom(6, 8);

        // Posiciona o player na porta de BAIXO da arena.
        // O boss fica em (mid, mid). O spawn da porta de baixo fica
        // em (mid, GRID_SIZE - 3). Assim o jogador vê o boss de longe.
        const GRID = canvasMod.GRID_SIZE;
        const TILE = canvasMod.TILE_SIZE;
        const mid = Math.floor(GRID / 2);
        stateMod.player.x = mid * TILE + TILE / 2;
        stateMod.player.y = (GRID - 3) * TILE + TILE / 2;

        stateMod.setTransitionCooldown(60);

        // 6) Salva com tudo pronto
        saveGame();
        showToast({
          itemId: 'sword',
          title: 'Arena do boss',
          subtitle: 'Armadura de ferro + 20 poções de cada',
          color: '#ff8ad8',
        });
        refresh();
        closeDevMenu();
      }).catch(err => {
        console.error('[devmenu] jump-boss-arena falhou:', err);
        showToast({
          itemId: 'questlog',
          title: 'Falha ao pular pra arena',
          subtitle: String(err?.message || err),
          color: '#ff6b6b',
        });
      });
    });
    return;
  }

  // ---- Forçar checkpoint do Deserto ----
  if (action === 'force-checkpoint') {
    import('../core/state.js').then((stateMod) => {
      // Marca o checkpoint manualmente (sem precisar ir em Akmira)
      stateMod.playerStats.checkpoint = {
        biomeId: 'desert',
        level: stateMod.playerStats.level,
        stats: {
          str: stateMod.playerStats.str,
          agi: stateMod.playerStats.agi,
          int: stateMod.playerStats.int,
          def: stateMod.playerStats.def,
          vit: stateMod.playerStats.vit,
          magia: stateMod.playerStats.magia,
        },
        equipped: {
          rightHand: stateMod.playerStats._equip?.rightHand ?? null,
          leftHand:  stateMod.playerStats._equip?.leftHand ?? null,
        },
        completedQuests: [], // preenchido abaixo
        portalCores: Array.from(stateMod.playerStats.portalCores),
        timeOfDay: 8,
        savedAt: Date.now(),
      };
      // Preenche as quests concluídas
      import('../quests.js').then((questsMod) => {
        stateMod.playerStats.checkpoint.completedQuests =
          [...questsMod.getCompletedQuests().map(q => q.id)];
        saveGame();
        showToast({
          itemId: 'questlog',
          title: 'Checkpoint do Deserto',
          subtitle: `Nv ${stateMod.playerStats.level}`,
          color: '#c9a24d',
        });
        refresh();
      });
    });
    return;
  }

  // ---- Logar estado no console ----
  if (action === 'log-state') {
    Promise.all([
      import('../core/state.js'),
      import('../quests.js'),
    ]).then(([stateMod, questsMod]) => {
      const active = questsMod.getActiveQuest();
      const progress = active ? active.objectives.map(o => ({
        id: o.id,
        cur: questsMod.getProgress(active.id, o.id),
        target: o.target,
      })) : null;
      console.log('%c[dev] Estado atual', 'color:#c9a24d;font-weight:bold', {
        level: stateMod.playerStats.level,
        xp: `${stateMod.playerStats.xp}/${stateMod.playerStats.xpToNextLevel}`,
        hp: `${stateMod.playerStats.hp}/${stateMod.playerStats.maxHp}`,
        mp: `${stateMod.playerStats.mp}/${stateMod.playerStats.maxMp}`,
        gold: stateMod.playerStats.gold,
        inventory: JSON.parse(JSON.stringify(stateMod.playerStats.inventory)),
        portalCores: [...stateMod.playerStats.portalCores],
        escortActive: stateMod.playerStats._escortActive,
        checkpoint: stateMod.playerStats.checkpoint,
        metaState: JSON.parse(JSON.stringify(stateMod.metaState)),
        activeQuest: active ? active.id : null,
        progress,
        completed: [...questsMod.getCompletedQuests().map(q => q.id)],
      });
      showToast({ itemId: 'questlog', title: 'Logado no console', color: '#ddd' });
    });
    return;
  }

  // ---- Trocar de classe ----
  if (action.startsWith('class:')) {
    const classId = action.replace('class:', '');
    import('./classselect.js').then((mod) => {
      mod.applyClass(classId);
      saveGame();
      showToast({ itemId: 'bag', title: 'Classe trocada', subtitle: classId, color: '#6fbd63' });
      refresh();
    });
    return;
  }

  // ---- Reset do cofre/meta (não apaga o save) ----
  if (action === 'reset-meta') {
    if (confirm('Resetar o cofre/meta (sem apagar o save)?')) {
      metaState.deaths = 0;
      metaState.vault.gold = 0;
      metaState.vault.slots = 4;
      metaState.vault.items = [null, null, null, null];
      saveGame();
      showToast({ itemId: 'bag', title: 'Cofre resetado', color: '#ffb703' });
      refresh();
    }
    return;
  }

  // ---- Reset total do save ----
  if (action === 'reset-save') {
    if (confirm('Tem certeza que quer APAGAR o save? Isso não pode ser desfeito.')) {
      import('../core/save.js').then((mod) => {
        mod.clearSave();
        location.reload();
      });
    }
    return;
  }
}

// ------------------------------------------------------------
// Imortalidade: hook simples. Sempre que HP for <= 0 e godMode
// estiver ligado, restaura pro max. Chamado pelo loop de combate
// se você quiser, mas é opcional — o dev menu já mostra o botão
// e o efeito é "instantâneo" no próximo frame.
// ------------------------------------------------------------
export function isGodMode() {
  return godMode;
}

// ------------------------------------------------------------
// Open / Close
// ------------------------------------------------------------
export function openDevMenu() {
  visible = true;
  setPaused(true);
  const c = ensureContainer();
  c.style.display = 'flex';
  refresh();
}

export function closeDevMenu() {
  visible = false;
  setPaused(false);
  if (container) container.style.display = 'none';

  // Resetar teclas pra o player não sair andando ao fechar
  import('./input.js').then(({ keys }) => {
    for (let k in keys) keys[k] = false;
  }).catch(() => {});
}

export function isDevMenuOpen() {
  return visible;
}

// ------------------------------------------------------------
// Ativação via teclado
// ------------------------------------------------------------
export function installDevShortcut() {
  let sessionUnlocked = false;
  function tryOpenWithPassword() {
    if (visible) return;

    if (sessionUnlocked) {
      openDevMenu();
      return;
    }

    const input = window.prompt('🔒 Senha do desenvolvedor:');
    if (input === null) return;

    if (input === DEV_PASSWORD) {
      sessionUnlocked = true;
      openDevMenu();
    } else {
      showToast({
        itemId: 'questlog',
        title: 'Acesso negado',
        subtitle: 'Senha incorreta',
        color: '#ff6b6b',
      });
    }
  }

  window.addEventListener('keydown', (e) => {
    // Ctrl+Shift+D (funciona em qualquer lugar, exceto combate)
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      e.preventDefault();
      if (visible) closeDevMenu();
      else tryOpenWithPassword();
      return;
    }

    // Buffer de teclas: se o jogador digitar "dev", pede a senha
    if (e.key.length === 1) {
      keyBuffer += e.key.toLowerCase();
      if (keyBuffer.length > SECRET.length) {
        keyBuffer = keyBuffer.slice(-SECRET.length);
      }
      if (keyBuffer === SECRET) {
        keyBuffer = '';
        tryOpenWithPassword();
      }
    } else if (e.key === 'Backspace') {
      keyBuffer = keyBuffer.slice(0, -1);
    } else if (e.key === 'Escape') {
      keyBuffer = '';
    }
  });
}