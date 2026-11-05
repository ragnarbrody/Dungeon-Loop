// src/ui/toast.js
import { getIcon } from '../sprites/icons.js';

const DEFAULT_DURATION = 2200;

let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  // CSS embutido pra não depender de style.css
  container.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
    z-index: 1000;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * @param {object} opts
 * @param {string} opts.itemId      ? id do consumível (pra puxar o ícone)
 * @param {string} opts.title       ? nome do item (ex: 'Poção Fraca')
 * @param {string} [opts.subtitle]  ? ex: '+7 HP' / '+3 Força (3 turnos)'
 * @param {string} [opts.color]     ? cor do subtítulo
 * @param {number} [opts.duration]  ? tempo em ms (default: 2200)
 */
export function showToast({ itemId, title, subtitle, color = '#8ad8ff', duration = DEFAULT_DURATION }) {
  const root = ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(15, 15, 26, 0.95);
    border: 2px solid #c9a24d;
    border-radius: 8px;
    padding: 8px 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    font-family: 'Courier New', monospace;
    color: #eee;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;

  const icon = getIcon(itemId);
  icon.style.width = '28px';
  icon.style.height = '28px';
  icon.style.imageRendering = 'pixelated';
  toast.appendChild(icon);

  const text = document.createElement('div');
  text.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';

  const t = document.createElement('div');
  t.textContent = title;
  t.style.cssText = 'font-weight: bold; font-size: 13px; color: #c9a24d;';
  text.appendChild(t);

  if (subtitle) {
    const s = document.createElement('div');
    s.textContent = subtitle;
    s.style.cssText = `font-size: 12px; color: ${color};`;
    text.appendChild(s);
  }

  toast.appendChild(text);
  root.appendChild(toast);

  // fade in
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // fade out + remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/**
 * Toast especial para itens de fechamento de capítulo (núcleo, semente).
 * Fundo dourado/brilhoso, borda dupla, glow, duração maior (5s).
 * Não diz "capítulo concluído" — só destaca o item.
 */
export function showChapterItemToast({ itemId, title, subtitle = 'Item de capítulo' }) {
  const root = ensureContainer();

  const toast = document.createElement('div');
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 14px;
    background: linear-gradient(135deg, rgba(40, 30, 10, 0.98), rgba(20, 15, 5, 0.98));
    border: 2px solid #feca57;
    border-radius: 10px;
    padding: 12px 20px 12px 14px;
    box-shadow:
      0 0 0 1px #c9a24d inset,
      0 0 18px rgba(254, 202, 87, 0.55),
      0 6px 20px rgba(0, 0, 0, 0.6);
    font-family: 'Courier New', monospace;
    color: #eee;
    opacity: 0;
    transform: translateY(12px) scale(0.96);
    transition: opacity 0.35s ease, transform 0.35s ease;
    animation: chapterToastPulse 2s ease-in-out infinite;
  `;

  // Keyframes do glow (injetado uma vez)
  if (!document.getElementById('chapter-toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'chapter-toast-keyframes';
    style.textContent = `
      @keyframes chapterToastPulse {
        0%, 100% { box-shadow: 0 0 0 1px #c9a24d inset, 0 0 18px rgba(254,202,87,0.55), 0 6px 20px rgba(0,0,0,0.6); }
        50%      { box-shadow: 0 0 0 1px #c9a24d inset, 0 0 28px rgba(254,202,87,0.85), 0 6px 20px rgba(0,0,0,0.6); }
      }
    `;
    document.head.appendChild(style);
  }

  const icon = getIcon(itemId);
  icon.style.width = '36px';
  icon.style.height = '36px';
  icon.style.imageRendering = 'pixelated';
  icon.style.filter = 'drop-shadow(0 0 6px rgba(254, 202, 87, 0.8))';
  toast.appendChild(icon);

  const text = document.createElement('div');
  text.style.cssText = 'display: flex; flex-direction: column; gap: 3px;';

  const t = document.createElement('div');
  t.textContent = title;
  t.style.cssText = 'font-weight: bold; font-size: 15px; color: #feca57; letter-spacing: 0.5px;';
  text.appendChild(t);

  if (subtitle) {
    const s = document.createElement('div');
    s.textContent = subtitle;
    s.style.cssText = 'font-size: 11px; color: #d1b26a; text-transform: uppercase; letter-spacing: 1.5px;';
    text.appendChild(s);
  }

  toast.appendChild(text);
  root.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0) scale(1)';
  });

  // Duração maior: 5s (vs 2.2s padrão)
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px) scale(0.96)';
    setTimeout(() => toast.remove(), 350);
  }, 5000);
}