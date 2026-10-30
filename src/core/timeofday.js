// src/core/timeofday.js
// ============================================================
// DIA/NOITE — estado de tempo do jogo, puramente visual.
//
// Cada "hora" do jogo = TIME_PER_HOUR segundos reais.
// O ciclo completo dura 24 * TIME_PER_HOUR segundos.
//
// Fases (em horas):
//   06h–11h  → manhã
//   11h–16h  → tarde
//   16h–19h  → entardecer
//   19h–06h  → noite
//
// A "fase" é apenas um rótulo. O render usa `darkness` (0..1),
// `warmth` (0..1) e as cores via interpolação suave — então não
// há "pulo" entre fases.
// ============================================================

// Quanto tempo real (em segundos) dura 1 hora do jogo.
// 24 * 45s = 18 min por dia completo.
export const TIME_PER_HOUR = 45;

let timeOfDay = 8;          // horas (começa às 8h da manhã)
let transitionBoost = 1;    // multiplicador temporário (fade-in ao carregar)
let fadeTimer = 0;

// ---------- Paletas por fase ----------
// Cada paleta define a cor do "overlay" (multiplicado por darkness)
// e o "tint" quente/frio aplicado por cima.
const PHASES = {
  morning:   { darkness: 0.0,  overlay: [255, 240, 220], warmth: 0.15 },
  afternoon: { darkness: 0.0,  overlay: [255, 255, 255], warmth: 0.0 },
  dusk:      { darkness: 0.35, overlay: [255, 140, 80],  warmth: 0.35 },
  night:     { darkness: 0.72, overlay: [30, 45, 90],    warmth: 0.0 },
};

// hora → aparência. Entre dois keyframes interpola com smoothstep.
const KEYFRAMES = [
  { h: 0,  ...PHASES.night },
  { h: 5,  ...PHASES.night },                                              // madrugada
  { h: 6,  darkness: 0.30, overlay: [255, 170, 110], warmth: 0.30 },       // amanhecer
  { h: 7,  ...PHASES.morning },
  { h: 16, ...PHASES.afternoon },                                          // dia claro até as 16h
  { h: 18, ...PHASES.dusk },
  { h: 20, ...PHASES.night },
  { h: 24, ...PHASES.night },
];

function labelFor(h) {
  if (h >= 5  && h < 11) return 'Manhã';
  if (h >= 11 && h < 17) return 'Tarde';
  if (h >= 17 && h < 20) return 'Entardecer';
  return 'Noite';
}

// ---------- Curva de mistura entre fases ----------
// Recebe a hora (0..24) e devolve { darkness, overlay, warmth, label }.
// Faz blend suave entre 2 fases adjacentes com base na hora.
function samplePhases(hour) {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYFRAMES.length - 2 && h >= KEYFRAMES[i + 1].h) i++;
  const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
  const t = (h - a.h) / (b.h - a.h);
  const s = t * t * (3 - 2 * t);
  const mix = (A, B) => A + (B - A) * s;
  return {
    label: labelFor(h),
    darkness: mix(a.darkness, b.darkness),
    warmth:   mix(a.warmth, b.warmth),
    overlay: [0, 1, 2].map(k => mix(a.overlay[k], b.overlay[k]) | 0),
  };
}

// ---------- API pública ----------

export function tickTime(dt) {
  // 1 hora de jogo = TIME_PER_HOUR segundos reais
  timeOfDay += dt / TIME_PER_HOUR;
  if (timeOfDay >= 24) timeOfDay -= 24;

  if (fadeTimer > 0) {
    fadeTimer = Math.max(0, fadeTimer - dt);
    transitionBoost = 1 - fadeTimer / 1.5;
  }
}

export function getTimeOfDay() {
  return timeOfDay;
}

export function getTimeState() {
  const sampled = samplePhases(timeOfDay);
  // Aplica o boost de fade-in (primeiros segundos após carregar)
  const darkness = sampled.darkness * transitionBoost;
  return {
    hour: timeOfDay,
    label: sampled.label,
    darkness,
    warmth: sampled.warmth,
    overlay: sampled.overlay,
    isNight: sampled.darkness > 0.45,
    // usado pelo HUD
    formatted: formatHour(timeOfDay),
  };
}

export function setTimeOfDay(h) {
  timeOfDay = ((h % 24) + 24) % 24;
}

export function startDayCycle(resetToMorning = true) {
  transitionBoost = 0;
  fadeTimer = 1.5;
  if (resetToMorning) timeOfDay = 8;
}

export function isNightTime() {
  return samplePhases(timeOfDay).darkness > 0.45;
}

// ---------- Helpers ----------
function formatHour(h) {
  const hh = Math.floor(h);
  const mm = Math.floor((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Serialização pro save (opcional — se quiser persistir o horário)
export function serializeTime() {
  return { timeOfDay };
}
export function loadTime(data) {
  if (data && typeof data.timeOfDay === 'number') {
    timeOfDay = data.timeOfDay;
  }
}

// ---------- Debug no console ----------
if (typeof window !== 'undefined') {
  window.__time = {
    set: (h) => setTimeOfDay(h),
    get: () => getTimeState(),
    // atalhos pra testar rápido as fases
    manha:      () => setTimeOfDay(8),
    tarde:      () => setTimeOfDay(14),
    entardecer: () => setTimeOfDay(17),
    noite:      () => setTimeOfDay(22),
  };
}