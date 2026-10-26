// ============================================================
// KNOWLEDGE — o que o jogador "sabe" do mundo.
// Camada de dados pura. O mapa só lê daqui.
// ============================================================

const state = {
  // Set de "gx,gy" que o jogador já viu (fog-of-war)
  revealed: new Set(),
  // markers dinâmicos (cidade, boss, quest, poi...)
  markers: [],
};

// ---------- Fog of war ----------
export function isRevealed(gx, gy) {
  return state.revealed.has(`${gx},${gy}`);
}

// Revela UMA sala específica (a que o jogador acabou de visitar)
export function revealRoom(gx, gy) {
  state.revealed.add(`${gx},${gy}`);
}

// (Opcional, se quiser manter compat) — agora só revela a sala central
export function revealAround(gx, gy, _radius = 2) {
  revealRoom(gx, gy);
}

export function getRevealedSet() {
  return state.revealed;
}

// ---------- Markers ----------
export function addMarker(marker) {
  // marker: { id, type, gx, gy, revealed?, title?, data? }
  if (!marker || !marker.id) return;
  if (state.markers.some(m => m.id === marker.id)) return;
  state.markers.push({
    revealed: false,
    ...marker,
  });
}

export function removeMarker(id) {
  const i = state.markers.findIndex(m => m.id === id);
  if (i >= 0) state.markers.splice(i, 1);
}

export function revealMarker(id) {
  const m = state.markers.find(x => x.id === id);
  if (m) m.revealed = true;
}

export function getMarkers({ onlyRevealed = false } = {}) {
  return onlyRevealed
    ? state.markers.filter(m => m.revealed)
    : state.markers.slice();
}

export function getMarker(id) {
  return state.markers.find(m => m.id === id) || null;
}

export function resetKnowledge() {
  state.revealed.clear();
  state.markers.length = 0;
}

// ---------- Serialização (save/load) ----------
export function serializeKnowledge() {
  return {
    revealed: Array.from(state.revealed),
    markers: state.markers.map(m => ({ ...m })),
  };
}

export function loadKnowledge(data) {
  state.revealed = new Set(data?.revealed || []);
  state.markers = (data?.markers || []).map(m => ({ ...m }));
}

// ---------- Helpers de render ----------
const BIOME_COLORS = {
  fields: { visited: '#4f9a4a', fog: '#223322' },
  desert: { visited: '#d9b96b', fog: '#3a2f1e' },
};

export function getBiomeColor(gx, gy, pickBiomeFn) {
  const biomeId = pickBiomeFn(gx, gy);   // ← usa a função recebida
  const c = BIOME_COLORS[biomeId] || { visited: '#4f9a4a', fog: '#222' };
  return c;
}

export function getTileColor(gx, gy, isCurrent, isCityFn, pickBiomeFn) {
  if (isCurrent) return '#c9a24d';
  if (isCityFn(gx, gy)) return '#6a6a8a';
  if (!isRevealed(gx, gy)) return getBiomeColor(gx, gy, pickBiomeFn).fog;
  return getBiomeColor(gx, gy, pickBiomeFn).visited;
}