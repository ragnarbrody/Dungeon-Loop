// src/ui/tooltip.js
// ============================================================
// TOOLTIP ESTILIZADO — caixinha fixa, estilo do jogo, que segue o mouse.
//
// Uso:
//   attachTooltip(elemento, () => 'texto\ncom quebras');
//   ou
//   attachTooltip(elemento, () => ({ title, lines: [...] }));
//
// O getter é chamado no hover (permite conteúdo dinâmico).
// ============================================================

let container = null;
let currentTarget = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'game-tooltip';
  container.style.cssText = `
    position: fixed;
    z-index: 2000;
    pointer-events: none;
    background: rgba(15, 15, 26, 0.97);
    border: 2px solid #c9a24d;
    border-radius: 6px;
    padding: 8px 12px;
    color: #eee;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    max-width: 280px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65);
    opacity: 0;
    transition: opacity 0.12s ease;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  document.body.appendChild(container);
  return container;
}

function positionTooltip(e) {
  if (!container) return;
  const pad = 14;
  const rect = container.getBoundingClientRect();
  let x = e.clientX + pad;
  let y = e.clientY + pad;

  // Se passa da borda direita, joga pra esquerda
  if (x + rect.width > window.innerWidth - 8) {
    x = e.clientX - rect.width - pad;
  }
  // Se passa da borda de baixo, sobe
  if (y + rect.height > window.innerHeight - 8) {
    y = e.clientY - rect.height - pad;
  }
  // Garante que não saia pela esquerda/topo
  if (x < 4) x = 4;
  if (y < 4) y = 4;

  container.style.left = x + 'px';
  container.style.top  = y + 'px';
}

function renderContent(content) {
  if (!container) return;

  let title = null;
  let bodyLines = [];   // array de { text, color? }

  if (typeof content === 'string') {
    bodyLines = [{ text: content }];
  } else if (content && typeof content === 'object') {
    title = content.title || null;
    if (Array.isArray(content.lines)) {
      for (const line of content.lines) {
        if (typeof line === 'string') {
          bodyLines.push({ text: line });
        } else if (line && typeof line === 'object') {
          bodyLines.push({
            text: line.text ?? '',
            color: line.color ?? null,
          });
        }
      }
    } else if (typeof content.text === 'string') {
      bodyLines = [{ text: content.text }];
    }
  }

  container.innerHTML = '';

  if (title) {
    const t = document.createElement('div');
    t.textContent = title;
    t.style.cssText = 'color: #feca57; font-weight: bold; font-size: 13px; margin-bottom: 4px;';
    container.appendChild(t);
  }

  if (bodyLines.length > 0) {
    const b = document.createElement('div');
    b.style.cssText = 'color: #ddd;';

    for (const line of bodyLines) {
      const div = document.createElement('div');
      div.textContent = line.text;
      if (line.color) div.style.color = line.color;
      b.appendChild(div);
    }

    container.appendChild(b);
  }
}

function onMouseMove(e) {
  positionTooltip(e);
}

function onMouseLeave() {
  hideTooltip();
}

export function attachTooltip(el, getContent) {
  if (!el) return;

  const enter = (e) => {
    currentTarget = el;
    const content = typeof getContent === 'function' ? getContent() : getContent;
    if (!content) return;
    ensureContainer();
    renderContent(content);
    positionTooltip(e);
    container.style.opacity = '1';

    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);
  };

  const leave = () => {
    if (currentTarget !== el) return;
    hideTooltip();
  };

  el.addEventListener('mouseenter', enter);
  el.addEventListener('mouseleave', leave);
}

export function hideTooltip() {
  if (!container) return;
  container.style.opacity = '0';
  window.removeEventListener('mousemove', onMouseMove);
  currentTarget = null;
}