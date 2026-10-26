import { playerStats } from '../core/state.js';

let container = null;
let onClose = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'dialogue-screen';
  container.className = 'hidden';
  container.innerHTML = `
    <div class="dialogue-box">
      <h2 class="dialogue-title"></h2>
      <div class="dialogue-body"></div>
      <div class="dialogue-actions"></div>
    </div>
  `;
  document.getElementById('game-container').appendChild(container);
  return container;
}

/**
 * Abre o painel de diálogo.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.text  (pode ter \n)
 * @param {Array<{label, action, disabled}>} [opts.actions]
 * @param {Function} [opts.onClose]  chamado quando fechar (ESC ou ação)
 */
export function openDialogue({ title, text, actions = [], onClose: closeCb = null }) {
  const c = ensureContainer();
  c.querySelector('.dialogue-title').textContent = title;

  const body = c.querySelector('.dialogue-body');
  body.innerHTML = '';
  for (const para of String(text).split('\n')) {
    const p = document.createElement('p');
    p.textContent = para;
    body.appendChild(p);
  }

  const actionsEl = c.querySelector('.dialogue-actions');
  actionsEl.innerHTML = '';

  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.label;
    if (a.disabled) b.disabled = true;
    b.onclick = () => {
      a.action();
    };
    actionsEl.appendChild(b);
  }

  // Botão "Fechar" sempre presente
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fechar (ESC)';
  closeBtn.onclick = () => closeDialogue();
  actionsEl.appendChild(closeBtn);

  onClose = closeCb || null;
  c.classList.remove('hidden');
}

export function closeDialogue() {
  if (!container) return;
  container.classList.add('hidden');
  if (onClose) {
    const cb = onClose;
    onClose = null;
    cb();
  }
}

export function isDialogueOpen() {
  return container && !container.classList.contains('hidden');
}