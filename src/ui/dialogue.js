import { playerStats } from '../core/state.js';
import { sfx } from '../audio/audio.js';

let container = null;
let onClose = null;

// ---- Estado do typewriter ----
const TW = {
  typing: false,
  paragraphs: [],      // [{ el, fullText, shown }]
  timer: null,
  charsPerSecond: 55,  // velocidade (ajuste a gosto)
  listeners: [],
};

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

// ============================================================
// TYPEWRITER
// ============================================================

function stopTyping() {
  if (TW.timer) {
    clearInterval(TW.timer);
    TW.timer = null;
  }
  TW.typing = false;
}

// Cria (ou atualiza) o rodapé com o aviso de "Espaço" e a setinha ▼.
// É adicionado DENTRO da .dialogue-body, no finalzinho.
function updateFooter(typingNow) {
  if (!container) return;
  const body = container.querySelector('.dialogue-body');
  if (!body) return;

  let footer = body.querySelector('.dialogue-footer');
  
  // Se está digitando e não existe, cria
  if (typingNow && !footer) {
    footer = document.createElement('div');
    footer.className = 'dialogue-footer';
    footer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      pointer-events: none; /* não atrapalha clique no texto */
    `;
    
    // Texto "Aperte espaço"
    const hintText = document.createElement('span');
    hintText.className = 'dialogue-skip-hint';
    hintText.textContent = 'Aperte espaço para pular';
    hintText.style.cssText = `
      font-size: 10px;
      color: #666;
      font-style: italic;
      transition: opacity 0.3s;
    `;
    footer.appendChild(hintText);

    // Setinha ▼
    const arrow = document.createElement('span');
    arrow.className = 'dialogue-next-hint';
    arrow.textContent = '▼';
    arrow.style.cssText = `
      color: #c9a24d;
      font-size: 12px;
      animation: twBlink 1s ease-in-out infinite;
      margin-bottom: 2px;
    `;
    footer.appendChild(arrow);

    body.appendChild(footer);
  }

  // Se não está mais digitando, some com a dica mas deixa a setinha piscando
  if (!typingNow && footer) {
    const hintText = footer.querySelector('.dialogue-skip-hint');
    if (hintText) hintText.remove();

    // Se o texto for muito curto a setinha já está lá, senão cria
    if (!footer.querySelector('.dialogue-next-hint')) {
      const arrow = document.createElement('span');
      arrow.className = 'dialogue-next-hint';
      arrow.textContent = '▼';
      arrow.style.cssText = `
        color: #c9a24d;
        font-size: 12px;
        animation: twBlink 1s ease-in-out infinite;
        margin-bottom: 2px;
      `;
      footer.appendChild(arrow);
    }
  }
}

function finishTyping() {
  if (!TW.typing) return;
  stopTyping();
  for (const p of TW.paragraphs) {
    p.shown = p.fullText.length;
    p.el.textContent = p.fullText;
  }
  updateActionButtonsEnabled(true);
  updateFooter(false); // Texto completo: tira o "aperte espaço", deixa o ▼
}

function startTyping() {
  stopTyping();
  TW.typing = true;
  updateActionButtonsEnabled(false);

  const intervalMs = 1000 / TW.charsPerSecond;
  let idx = 0;            // qual parágrafo estamos digitando
  let charCount = 0;      // quantos chars do parágrafo atual

  // Inicializa todos vazios
  for (const p of TW.paragraphs) {
    p.shown = 0;
    p.el.textContent = '';
  }

  // Cria o rodapé assim que começa a digitar
  updateFooter(true);

  // Se não há parágrafos, nada a digitar
  if (TW.paragraphs.length === 0) {
    TW.typing = false;
    updateActionButtonsEnabled(true);
    updateFooter(false);
    return;
  }

  TW.timer = setInterval(() => {
    const p = TW.paragraphs[idx];
    if (!p) {
      stopTyping();
      updateActionButtonsEnabled(true);
      updateFooter(false);
      return;
    }

    if (charCount < p.fullText.length) {
      charCount++;
      p.shown = charCount;
      p.el.textContent = p.fullText.slice(0, charCount);

      // ---- Som de fala a cada 2 caracteres ----
      // (se for um espaço, não toca, pra dar uma respirada)
      const char = p.fullText[charCount - 1];
      if (charCount % 2 === 0 && char !== ' ') {
        // Varia o pitch levemente pra não soar robótico (tipo 0.95 a 1.05)
        const pitchVariation = 0.95 + Math.random() * 0.1;
        sfx('talk', { pitch: pitchVariation });
      }
    } else {
      // Terminou este parágrafo → vai pro próximo
      idx++;
      charCount = 0;
      if (idx >= TW.paragraphs.length) {
        stopTyping();
        updateActionButtonsEnabled(true);
        updateFooter(false);
      }
    }
  }, intervalMs);
}

// ============================================================
// BOTÕES
// ============================================================

function updateActionButtonsEnabled(enabled) {
  if (!container) return;
  const btns = container.querySelectorAll('.dialogue-actions button');
  btns.forEach(b => {
    if (b.dataset.isClose === '1') return;
    b.disabled = !enabled;
  });
}

// ============================================================
// API PÚBLICA
// ============================================================

export function openDialogue({ title, text, actions = [], onClose: closeCb = null }) {
  stopTyping();
  removeListeners();

  const c = ensureContainer();
  c.querySelector('.dialogue-title').textContent = title;

  // ---- Monta os parágrafos e guarda referência ----
  TW.paragraphs = [];
  const body = c.querySelector('.dialogue-body');
  body.innerHTML = '';
  for (const para of String(text).split('\n')) {
    const p = document.createElement('p');
    p.textContent = '';
    body.appendChild(p);
    TW.paragraphs.push({ el: p, fullText: para, shown: 0 });
  }

  // ---- Botões ----
  const actionsEl = c.querySelector('.dialogue-actions');
  actionsEl.innerHTML = '';

  for (const a of actions) {
    const b = document.createElement('button');
    b.textContent = a.label;
    if (a.disabled) b.disabled = true;
    b.onclick = () => { a.action(); };
    actionsEl.appendChild(b);
  }

  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Fechar (ESC)';
  closeBtn.dataset.isClose = '1';
  closeBtn.onclick = () => closeDialogue();
  actionsEl.appendChild(closeBtn);

  onClose = closeCb || null;

  attachSkipListeners();

  c.classList.remove('hidden');
  requestAnimationFrame(() => startTyping());
}

export function closeDialogue() {
  if (!container) return;
  if (TW.typing) {
    finishTyping();
    return; 
  }
  stopTyping();
  removeListeners();
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

// ============================================================
// LISTENERS DE SKIP
// ============================================================

function onKeyDownSkip(e) {
  if (!isDialogueOpen()) return;
  if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (TW.typing) {
      finishTyping();
    }
  }
}

function onBodyClickSkip(e) {
  if (!isDialogueOpen()) return;
  if (e.target.closest('button')) return;
  if (TW.typing) {
    finishTyping();
  }
}

function attachSkipListeners() {
  window.addEventListener('keydown', onKeyDownSkip, true); 
  const body = container.querySelector('.dialogue-body');
  if (body) body.addEventListener('click', onBodyClickSkip);
  TW.listeners = [
    { target: window, type: 'keydown', fn: onKeyDownSkip, opts: true },
    { target: body,   type: 'click',   fn: onBodyClickSkip },
  ];
}

function removeListeners() {
  for (const l of TW.listeners) {
    if (!l.target) continue;
    try {
      l.target.removeEventListener(l.type, l.fn, l.opts);
    } catch (_) { /* ignora */ }
  }
  TW.listeners = [];
}