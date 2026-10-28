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
//   - Adicionar ouro, XP, HP, MP
//   - Adicionar itens (tocha, poções, materiais)
//   - Pular direto para a quest 5.2 (caverna)
//   - Resetar o save (perigoso!)
// ============================================================

import { playerStats, saveGame, checkLevelUp, setPaused } from '../core/state.js';
import { QUEST_DB, activateQuest, completeActiveQuest,
         getActiveQuest, isQuestCompleted, isQuestActive } from '../quests.js';
import { addItemToInventory, ITEMS_DB } from '../items.js';
import { showToast } from './toast.js';
import { sfx } from '../audio/audio.js';

let container = null;
let visible = false;
let keyBuffer = '';
const SECRET = 'dev';
const DEV_PASSWORD = 'batata2026**';

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
      width: min(90%, 720px);
      max-height: 90%;
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
          ">🕳️ Pular para a caverna (5.2)</button>
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
      </div>

      <!-- Perigoso -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <h3 style="color:#ff6b6b; margin:0; font-size:14px;">⚠️ Zona de Perigo</h3>
        <button data-action="reset-save" style="
          background:#5a1a1a; color:#fff; border:2px solid #ff6b6b;
          padding:8px 14px; border-radius:4px; cursor:pointer;
          font-family:inherit; font-weight:bold; align-self:flex-start;
        ">Apagar save e voltar ao menu</button>
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
    statsEl.innerHTML = `
      <div>Classe: <b style="color:#c9a24d">${cls}</b> · Nv <b>${playerStats.level}</b> · XP ${playerStats.xp}/${playerStats.xpToNextLevel}</div>
      <div>HP: <span style="color:#ff6b6b">${playerStats.hp}/${playerStats.maxHp}</span> · MP: <span style="color:#3aa0ff">${playerStats.mp}/${playerStats.maxMp}</span> · Ouro: <span style="color:#f0c060">${playerStats.gold}</span></div>
      <div>Quest ativa: <b style="color:#feca57">${active ? active.title : '—'}</b></div>
    `;
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
        // Ativa a quest (se não estiver ativa já)
        if (!active) {
          // Marca pré-requisitos como concluídos se necessário
          if (q.prereq) {
            for (const pre of q.prereq) {
              // Aqui forçamos a marcação manual (não há API pública pra isso,
              // então usamos o método: completar a quest via completeActiveQuest
              // não funciona porque ela não está ativa. Vamos só ignorar o prereq
              // e ativar mesmo assim. O `getAvailableQuests` não é usado aqui.
            }
          }
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

  // Lista de itens (todos que dão pra adicionar)
  const itemList = container.querySelector('#dev-item-list');
  if (itemList) {
    itemList.innerHTML = '';
    // Lista de itens interessantes (não tudo, pra não poluir)
    const interestingIds = [
      'torch', 'potion_weak', 'potion_medium', 'potion_strong',
      'potion_mana', 'potion_mana_medium', 'potion_mana_strong',
      'rat_tail', 'goblin_tooth', 'slime_gel', 'scorpion_pincer',
      'vulture_egg', 'letter_to_elder',
    ];
    for (const id of interestingIds) {
      const info = ITEMS_DB[id];
      if (!info) continue;
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
      itemList.appendChild(btn);
    }
  }
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

    if (action === 'complete-quest') {
    const q = getActiveQuest();
    if (!q) {
      showToast({ itemId: 'questlog', title: 'Nenhuma quest ativa', color: '#ff6b6b' });
      return;
    }

    // Importação dinâmica pra evitar ciclo de imports
    Promise.all([
      import('../quests.js'),
      import('../core/state.js'),
    ]).then(([questsMod, stateMod]) => {
      // 1) Preenche os objetivos
      for (const obj of q.objectives) {
        if (obj.type === 'kill') {
          // Avança o progresso até o target
          const cur = questsMod.getProgress(q.id, obj.id);
          if (cur < obj.target) {
            questsMod.advanceObjective(q.id, obj.id, obj.target - cur);
          }
        } else if (obj.type === 'collect') {
          // Dá os itens que faltam
          const inv = playerStats.inventory;
          const existing = inv.find(i => i.id === obj.filter);
          const current = existing ? existing.qty : 0;
          const needed = Math.max(0, obj.target - current);
          if (needed > 0) {
            addItemToInventory(inv, obj.filter, needed);
          }
        } else if (obj.type === 'visit') {
          // Marca as salas alvo como visitadas
          const targets = Array.isArray(obj.filter) ? obj.filter : [obj.filter];
          for (const t of targets) {
            if (t) stateMod.visitedRooms.add(`${t.gx},${t.gy}`);
          }
        }
      }

      // 2) Pequeno delay pra garantir que o `getProgress` reflita
      setTimeout(() => {
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
      }, 100);
    });
    return;
  }

  if (action === 'jump-cave') {
    // 1) Marca story_torch como concluída (se ainda não estiver)
    // 2) Ativa story_cave
    // 3) Dá uma tocha
    // 4) Teleporta o jogador para a sala (-2, 8)
    import('../quests.js').then((mod) => {
      // Dá a tocha
      addItemToInventory(playerStats.inventory, 'torch', 1);

      // Se story_torch não está concluída, completa ela (sem reward duplicado)
      if (!mod.isQuestCompleted('story_torch')) {
        // Precisa que a story_torch esteja ativa e pronta
        // Vamos forçar: ativar e completar direto
        mod.activateQuest('story_torch');
        // Hack: dar o item necessário já foi feito (tocha)
        // Avançar objetivos
        if (mod.advanceObjective) {
          mod.advanceObjective('story_torch', 'collect_torch', 1);
        }
        // Tentar completar
        mod.completeActiveQuest(playerStats, addItemToInventory);
      }

      // Ativa story_cave
      if (!mod.isQuestCompleted('story_cave')) {
        mod.activateQuest('story_cave');
      }

      // Teleporta
      import('../core/state.js').then((st) => {
        import('../world/rooms.js').then((rooms) => {
          const room = rooms.getRoom(-2, 8);
          st.setCurrentRoom(room);
          st.markRoomVisited(-2, 8);
          import('../world/knowledge.js').then((k) => {
            k.revealRoom(-2, 8);
          });
          // Spawn no centro
          st.player.x = 15 * 20 + 10;
          st.player.y = 15 * 20 + 10;
          st.setTransitionCooldown(30);
          saveGame();
          showToast({ itemId: 'questlog', title: 'Teleportado', subtitle: 'Caverna (-2, 8)', color: '#c9a24d' });
          closeDevMenu();
        });
      });
    });
    return;
  }

  if (action === 'reset-save') {
    if (confirm('Tem certeza que quer APAGAR o save? Isso não pode ser desfeito.')) {
      import('../core/save.js').then((mod) => {
        mod.clearSave();
        location.reload();
      });
    }
    return;
  }

  // Ações com prefixo "quest:" ou "item:" já foram tratadas nos próprios botões.
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
  // Flag de sessão: depois de autenticar uma vez, os próximos atalhos
  // não pedem senha de novo (só resetam ao recarregar a página).
  let sessionUnlocked = false;
  function tryOpenWithPassword() {
    if (visible) return;

    // Já autenticou nessa sessão? Abre direto.
    if (sessionUnlocked) {
      openDevMenu();
      return;
    }

    const input = window.prompt('🔒 Senha do desenvolvedor:');
    if (input === null) return;

    if (input === DEV_PASSWORD) {
      sessionUnlocked = true;  // ← NOVO: marca a sessão
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
      if (visible) {
        closeDevMenu();
      } else {
        tryOpenWithPassword();
      }
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