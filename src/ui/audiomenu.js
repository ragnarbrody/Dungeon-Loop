// ============================================================
// AUDIO MENU — painel de configurações de áudio.
//
// Abre com ESC (fora do combate) ou por um botão no menu principal.
// Tem 3 sliders (Master / Música / SFX), botão de mute, botão de
// testar som, e botão de fechar.
// ============================================================

import { sfx, getAudioState, setMasterVolume, setMusicVolume,
         setSfxVolume, setMuted } from '../audio/audio.js';

let container = null;
let onChange = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.id = 'audiomenu-screen';
  container.className = 'hidden';
  container.innerHTML = `
    <div class="audiomenu-box">
      <h2>Áudio</h2>
      <div class="audiomenu-row">
        <label>Master</label>
        <input type="range" min="0" max="100" step="1" data-k="master">
        <span class="audiomenu-val" data-v="master">80%</span>
      </div>
      <div class="audiomenu-row">
        <label>Música</label>
        <input type="range" min="0" max="100" step="1" data-k="music">
        <span class="audiomenu-val" data-v="music">50%</span>
      </div>
      <div class="audiomenu-row">
        <label>Efeitos</label>
        <input type="range" min="0" max="100" step="1" data-k="sfx">
        <span class="audiomenu-val" data-v="sfx">70%</span>
      </div>
      <div class="audiomenu-row audiomenu-mute-row">
        <label>
          <input type="checkbox" data-k="muted"> Silenciar tudo
        </label>
      </div>
      <div class="audiomenu-actions">
        <button class="audiomenu-test">Testar som</button>
        <button class="audiomenu-close">Fechar (ESC)</button>
      </div>
    </div>
  `;
  document.getElementById('game-container').appendChild(container);

  // Sliders
  container.querySelectorAll('input[type="range"]').forEach(inp => {
    inp.addEventListener('input', () => {
      const k = inp.dataset.k;
      const v = Number(inp.value) / 100;
      if (k === 'master') setMasterVolume(v);
      if (k === 'music')  setMusicVolume(v);
      if (k === 'sfx')    setSfxVolume(v);
      updateLabels();
    });
  });

  // Mute
  container.querySelector('input[data-k="muted"]').addEventListener('change', e => {
    setMuted(e.target.checked);
    updateLabels();
  });

  // Testar som
  container.querySelector('.audiomenu-test').addEventListener('click', () => {
    sfx('click');
    sfx('levelup');
  });

  // Fechar
  container.querySelector('.audiomenu-close').addEventListener('click', closeAudioMenu);

  return container;
}

function updateLabels() {
  if (!container) return;
  const s = getAudioState();
  const set = (k, v) => {
    const el = container.querySelector(`[data-v="${k}"]`);
    if (el) el.textContent = `${Math.round(v * 100)}%`;
    const inp = container.querySelector(`input[data-k="${k}"]`);
    if (inp && Number(inp.value) !== Math.round(v * 100)) {
      inp.value = Math.round(v * 100);
    }
  };
  set('master', s.master);
  set('music',  s.music);
  set('sfx',    s.sfx);
  const mute = container.querySelector('input[data-k="muted"]');
  if (mute) mute.checked = !!s.muted;
}

export function openAudioMenu(closeCb = null) {
  onChange = closeCb;
  const c = ensureContainer();
  updateLabels();
  c.classList.remove('hidden');
}

export function closeAudioMenu() {
  if (!container) return;
  container.classList.add('hidden');
  if (onChange) { const cb = onChange; onChange = null; cb(); }
}

export function isAudioMenuOpen() {
  return container && !container.classList.contains('hidden');
}