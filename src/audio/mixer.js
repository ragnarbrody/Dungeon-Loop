// ============================================================
// MIXER — volumes, mute, persistência.
//
// Salva em localStorage['dungeonLoop_audio']:
//   { master, music, sfx, muted }
//
// Valores 0..1. `muted` sobrescreve master (vira 0).
// ============================================================

import { getMasterGain, getMusicBus, getSfxBus, onAudioReady } from './audiocontext.js';

const STORAGE_KEY = 'dungeonLoop_audio';

const DEFAULTS = {
  master: 0.8,
  music:  0.5,
  sfx:    0.7,
  muted:  false,
};

let state = { ...DEFAULTS };

// ---- Carrega do localStorage ----
try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    state.master = clamp01(saved.master ?? DEFAULTS.master);
    state.music  = clamp01(saved.music  ?? DEFAULTS.music);
    state.sfx    = clamp01(saved.sfx    ?? DEFAULTS.sfx);
    state.muted  = !!saved.muted;
  }
} catch (e) {
  console.warn('[audio] save corrompido, usando defaults.', e);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[audio] falha ao salvar volumes.', e);
  }
}

function applyToBuses() {
  const m = getMasterGain();
  const mu = getMusicBus();
  const s = getSfxBus();
  if (!m || !mu || !s) return;

  const master = state.muted ? 0 : state.master;
  m.gain.value = master;
  mu.gain.value = state.music;
  s.gain.value = state.sfx;
}

// Aplica assim que o ctx existir (e agora, se já existir).
onAudioReady(applyToBuses);

// ---- API ----
export function getAudioState() {
  return { ...state };
}

export function setMasterVolume(v) {
  state.master = clamp01(v);
  applyToBuses();
  persist();
}

export function setMusicVolume(v) {
  state.music = clamp01(v);
  applyToBuses();
  persist();
}

export function setSfxVolume(v) {
  state.sfx = clamp01(v);
  applyToBuses();
  persist();
}

export function setMuted(muted) {
  state.muted = !!muted;
  applyToBuses();
  persist();
}

export function toggleMuted() {
  setMuted(!state.muted);
  return state.muted;
}