// src/ui/toast.js
import { getIcon } from '../sprites/icons.js';

const TOAST_MS = 2200;

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
 */
export function showToast({ itemId, title, subtitle, color = '#8ad8ff' }) {
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
  }, TOAST_MS);
}