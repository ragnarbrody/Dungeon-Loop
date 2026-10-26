// src/ui/questlog.js
import { setGameState, STATE } from '../core/state.js';
import {
  getActiveQuest, getProgress, getTrackedQuest,
  trackQuest, deactivateTracking, isQuestReadyToComplete,
  getCompletedQuests,
} from '../quests.js';

let container = null;
let currentTab = 'active'; // 'active' | 'completed'

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'questlog-screen';
  container.className = 'hidden';
  container.innerHTML = `
    <div class="questlog-box">
      <h2>Missões</h2>
      <div class="questlog-tabs">
        <button class="questlog-tab" data-tab="active">Ativa</button>
        <button class="questlog-tab" data-tab="completed">Concluídas</button>
      </div>
      <div class="questlog-body"></div>
      <div class="questlog-actions">
        <button class="questlog-close">Fechar (ESC)</button>
      </div>
    </div>
  `;
  document.getElementById('game-container').appendChild(container);

  // Fechar
  container.querySelector('.questlog-close').onclick = () => {
    closeQuestLog();
    setGameState(STATE.EXPLORE);
  };

  // Abas
  container.querySelectorAll('.questlog-tab').forEach(btn => {
    btn.onclick = () => {
      currentTab = btn.dataset.tab;
      renderBody(container);
    };
  });

  return container;
}

export function openQuestLog() {
  const c = ensureContainer();
  c.classList.remove('hidden');
  renderBody(c);
}

export function closeQuestLog() {
  if (!container) return;
  container.classList.add('hidden');
}

export function isQuestLogOpen() {
  return container && !container.classList.contains('hidden');
}

function renderBody(c) {
  // Atualiza estado visual das abas
  c.querySelectorAll('.questlog-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
  });

  const body = c.querySelector('.questlog-body');
  body.innerHTML = '';

  if (currentTab === 'completed') {
    renderCompleted(c, body);
  } else {
    renderActive(c, body);
  }
}

// ---------- ABA: ATIVA ----------
function renderActive(c, body) {
  const active = getActiveQuest();
  if (!active) {
    const p = document.createElement('p');
    p.textContent = 'Nenhuma missão ativa.';
    p.style.color = '#888';
    p.style.textAlign = 'center';
    p.style.margin = '20px 0';
    body.appendChild(p);
    return;
  }

  const card = document.createElement('div');
  card.className = 'questlog-card';

  const title = document.createElement('h3');
  title.textContent = active.title;
  card.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'questlog-desc';
  desc.textContent = active.description;
  card.appendChild(desc);

  const objList = document.createElement('ul');
  objList.className = 'questlog-objectives';
  for (const obj of active.objectives) {
    const cur = getProgress(active.id, obj.id);
    const done = cur >= obj.target;
    const li = document.createElement('li');
    li.textContent = `${done ? '✔' : '•'} ${obj.text} (${cur}/${obj.target})`;
    if (done) li.classList.add('done');
    objList.appendChild(li);
  }
  card.appendChild(objList);

  const tracked = getTrackedQuest();
  const trackBtn = document.createElement('button');
  trackBtn.className = 'questlog-track-btn';
  if (tracked && tracked.id === active.id) {
    trackBtn.textContent = 'Parar de rastrear';
    trackBtn.onclick = () => {
      deactivateTracking();
      renderBody(c);
    };
  } else {
    trackBtn.textContent = 'Rastrear';
    trackBtn.onclick = () => {
      trackQuest(active.id);
      renderBody(c);
    };
  }
  card.appendChild(trackBtn);

  if (isQuestReadyToComplete(active.id)) {
    const ready = document.createElement('p');
    ready.className = 'questlog-ready';
    ready.textContent = '✔ Pronta para entregar ao Ancião.';
    card.appendChild(ready);
  }

  body.appendChild(card);
}

// ---------- ABA: CONCLUÍDAS ----------
function renderCompleted(c, body) {
  const list = getCompletedQuests();
  if (list.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'Nenhuma missão concluída ainda.';
    p.style.color = '#888';
    p.style.textAlign = 'center';
    p.style.margin = '20px 0';
    body.appendChild(p);
    return;
  }

  for (const q of list) {
    const card = document.createElement('div');
    card.className = 'questlog-card questlog-card-done';

    const title = document.createElement('h3');
    title.textContent = `✔ ${q.title}`;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'questlog-desc';
    desc.textContent = q.description;
    card.appendChild(desc);

    // Objetivos (todos como cumpridos, com o target original)
    const objList = document.createElement('ul');
    objList.className = 'questlog-objectives';
    for (const obj of q.objectives) {
      const li = document.createElement('li');
      li.textContent = `✔ ${obj.text} (${obj.target}/${obj.target})`;
      li.classList.add('done');
      objList.appendChild(li);
    }
    card.appendChild(objList);

    // Recompensa (se houver)
    const r = q.rewards || {};
    const rewardParts = [];
    if (r.xp) rewardParts.push(`+${r.xp} XP`);
    if (r.gold) rewardParts.push(`+${r.gold} ouro`);
    if (r.items && r.items.length) {
      for (const it of r.items) {
        rewardParts.push(`+${it.qty}× ${it.id}`);
      }
    }
    if (rewardParts.length > 0) {
      const reward = document.createElement('p');
      reward.className = 'questlog-reward';
      reward.textContent = `Recompensa: ${rewardParts.join(', ')}`;
      card.appendChild(reward);
    }

    body.appendChild(card);
  }
}