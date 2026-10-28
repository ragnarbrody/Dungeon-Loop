// ============================================================
// SFX — efeitos sintetizados. Sem arquivos.
//
// Cada efeito usa 1-3 osciladores (ou ruído), com envelope
// attack/decay curto e filtro passa-baixa quando faz sentido.
//
// Pode receber opts = { pitch } pra variar a frequência
// (usado no som de passo, pra não ficar repetitivo).
// ============================================================

import { getCtx, getSfxBus } from './audiocontext.js';

const SFX = {
  click:   { freq: 880,  dur: 0.06, type: 'square',   gain: 0.10 },
  consume: { freq: 520,  dur: 0.20, type: 'triangle', gain: 0.15, slideTo: 780 },
  equip:   { freq: 660,  dur: 0.15, type: 'square',   gain: 0.12, slideTo: 990 },
  unequip: { freq: 660,  dur: 0.15, type: 'square',   gain: 0.12, slideTo: 440 },
  hit:     {
    freq: 320, dur: 0.06,
    type: 'square',
    gain: 0.45,
    noise: true,
    noiseFilter: 'highpass',
    noiseFreq: 1200,
    toneGain: 0.30,
    toneSlideTo: 1.6,      // sobe (multiplicador)
  },
  hurt:    {
    freq: 90, dur: 0.16,
    type: 'sine',
    gain: 0.55,
    noise: true,
    noiseFilter: 'lowpass',
    noiseFreq: 500,
    toneGain: 0.50,
    toneSlideTo: 0.5,      // cai (multiplicador)
  },
  levelup: { freq: 523,  dur: 0.12, type: 'triangle', gain: 0.18, arp: [523, 659, 784, 1047] },
  victory: { freq: 523,  dur: 0.12, type: 'square',   gain: 0.18, arp: [523, 659, 784] },
  defeat:  { freq: 392,  dur: 0.20, type: 'sine',     gain: 0.20, arp: [392, 330, 262] },
  step:    { freq: 120,  dur: 0.04, type: 'sine',     gain: 0.05 },
  talk:    { freq: 440,  dur: 0.03, type: 'triangle', gain: 0.08 },
};

// Buffer de ruído branco, gerado uma vez só.
let noiseBuffer = null;
function getNoiseBuffer(ctx) {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ctx.sampleRate * 0.5);
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}

/**
 * Toca um SFX pelo nome.
 * @param {string} name
 * @param {object} [opts]  { pitch: number } — multiplicador de frequência (default 1)
 */
export function sfx(name, opts = {}) {
  const ctx = getCtx();
  if (!ctx) return;             // autoplay bloqueado
  if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }

  const def = SFX[name];
  if (!def) { console.warn('[sfx] desconhecido:', name); return; }

  const bus = getSfxBus();
  const pitch = opts.pitch ?? 1;

  // ---- Arpejo (várias notas em sequência) ----
  if (def.arp) {
    def.arp.forEach((freq, i) => {
      playTone(ctx, bus, {
        freq: freq * pitch,
        dur: def.dur,
        type: def.type,
        gain: def.gain,
        when: ctx.currentTime + i * def.dur * 0.6,
      });
    });
    return;
  }

  // ---- Tom único (com slide opcional) ----
  if (def.noise) {
    playNoise(ctx, bus, {
      freq: def.freq * pitch,
      dur: def.dur,
      gain: def.gain,
      toneType: def.type,
      toneGain: def.toneGain ?? 0,
      toneSlideTo: def.toneSlideTo ?? null,
      noiseFilter: def.noiseFilter ?? 'lowpass',
      noiseFreq: (def.noiseFreq ?? def.freq) * pitch,
    });
  } else {
    playTone(ctx, bus, {
      freq: def.freq * pitch,
      dur: def.dur,
      type: def.type,
      gain: def.gain,
      slideTo: def.slideTo ? def.slideTo * pitch : null,
      when: ctx.currentTime,
    });
  }
}

function playTone(ctx, bus, { freq, dur, type, gain, slideTo, when }) {
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, when + dur);
  }

  // Envelope: attack rápido, decay até 0
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  osc.connect(g);
  g.connect(bus);

  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playNoise(ctx, bus, {
  freq, dur, gain,
  toneType = 'sawtooth', toneGain = 0, toneSlideTo = null,
  noiseFilter = 'lowpass', noiseFreq = freq,
}) {
  const t0 = ctx.currentTime;

  // ---- 1) Tom de "corpo" (dá pitch e peso ao hit) ----
  if (toneGain > 0) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = toneType;
    osc.frequency.setValueAtTime(freq, t0);
    if (toneSlideTo) {
      osc.frequency.exponentialRampToValueAtTime(freq * toneSlideTo, t0 + dur);
    }
    g.gain.setValueAtTime(toneGain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // ---- 2) Ruído filtrado (dá "estalo" do impacto) ----
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = noiseFilter;
  filter.frequency.value = noiseFreq;
  filter.Q.value = 0.7;

  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  src.connect(filter);
  filter.connect(g);
  g.connect(bus);

  src.start(t0);
  src.stop(t0 + dur + 0.02);
}