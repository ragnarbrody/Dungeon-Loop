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
  morning: {
    label: 'Manhã',
    darkness: 0.0,
    overlay: [255, 240, 220],   // levemente amarelado
    warmth: 0.15,
  },
  afternoon: {
    label: 'Tarde',
    darkness: 0.0,
    overlay: [255, 255, 255],
    warmth: 0.0,
  },
  dusk: {
    label: 'Entardecer',
    darkness: 0.35,
    overlay: [255, 140, 80],    // laranja quente
    warmth: 0.35,
  },
  night: {
    label: 'Noite',
    darkness: 0.72,
    overlay: [30, 45, 90],      // azul profundo
    warmth: 0.0,
  },
};

// ---------- Curva de mistura entre fases ----------
// Recebe a hora (0..24) e devolve { darkness, overlay, warmth, label }.
// Faz blend suave entre 2 fases adjacentes com base na hora.
function samplePhases(hour) {
  // Converte hora pra "posição" no ciclo das 4 fases.
  // Posições: 6h=0 (manhã), 11h=1 (tarde), 16h=2 (entardecer), 19h=3 (noite), 6h=4 (manhã de novo)
  // Usamos a "chave" 0..4 pra saber entre qual par interpolar.
  const keys = [6, 11, 16, 19, 30]; // 30 = 6h do dia seguinte
  const labels = ['morning', 'afternoon', 'dusk', 'night', 'morning'];

  // Normaliza a hora pra estar em [6, 30)
  let h = hour;
  if (h < 6) h += 24;

  // Acha o segmento [keys[i], keys[i+1]) que contém h
  let i = 0;
  for (; i < keys.length - 1; i++) {
    if (h >= keys[i] && h < keys[i + 1]) break;
  }
  if (i >= keys.length - 1) i = keys.length - 2;

  const a = PHASES[labels[i]];
  const b = PHASES[labels[i + 1]];
  const t = (h - keys[i]) / (keys[i + 1] - keys[i]);

  // Interpolação suave (smoothstep) pra não ter "quina"
  const s = t * t * (3 - 2 * t);

  const mix = (A, B) => A + (B - A) * s;
  return {
    label: labels[i] === 'morning' && hour < 11 ? 'Manhã'
         : labels[i + 1] === 'afternoon' && hour < 16 ? 'Tarde'
         : labels[i] === 'dusk' && hour < 19 ? 'Entardecer'
         : 'Noite',
    darkness: mix(a.darkness, b.darkness),
    warmth:   mix(a.warmth,   b.warmth),
    overlay: [
      mix(a.overlay[0], b.overlay[0]) | 0,
      mix(a.overlay[1], b.overlay[1]) | 0,
      mix(a.overlay[2], b.overlay[2]) | 0,
    ],
  };
}

// ---------- API pública ----------

export function tickTime(dt) {
  // 1 hora de jogo = TIME_PER_HOUR segundos reais
  timeOfDay += dt / TIME_PER_HOUR;
  if (timeOfDay >= 24) timeOfDay -= 24;

  if (fadeTimer > 0) {
    fadeTimer -= dt;
    if (fadeTimer <= 0) transitionBoost = 1;
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
  fadeTimer = 1;
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