// ============================================================
// MÚSICA PROCEDURAL — sem arquivos.
//
// Timbre: "corda pinçada" (plucked string). Cada nota é um
// oscilador triangle com envelope de attack rápido + decay
// exponencial — o "plim" de violão/harpa/cravo.
//
// Estrutura:
//   - Arpejo: uma nota a cada subdivisão (padrão colcheia,
//     battle usa semicolcheia).
//   - Acorde de base: a cada compasso (4 batidas), toca o acorde
//     inteiro e decai.
//   - Battle: tem tímpano grave no início de cada compasso,
//     arpejo duplicado uma oitava abaixo, riff de baixo,
//     melodia principal e padrão de tímpano (1 forte + 2 fracos).
// ============================================================

import { getCtx, getMusicBus, onAudioReady } from './audiocontext.js';

const MODES = {
  menu: {
    root: 220.00,
    scale: [0, 2, 4, 7, 9],
    bpm: 60,
    arpGain: 0.09,
    chordGain: 0.07,
    arpOct: 1,
    chordOct: 0,
  },
  aethel: {
    root: 220.00,
    scale: [0, 2, 4, 7, 9],
    bpm: 72,
    arpGain: 0.08,
    chordGain: 0.06,
    arpOct: 1,
    chordOct: 0,
  },
  fields: {
    root: 293.66,
    scale: [0, 2, 4, 7, 9],
    bpm: 84,
    arpGain: 0.075,
    chordGain: 0.055,
    arpOct: 1,
    chordOct: 0,
  },
  desert: {
    root: 329.63,
    scale: [0, 1, 4, 5, 7],
    bpm: 100,
    arpGain: 0.07,
    chordGain: 0.055,
    arpOct: 1,
    chordOct: 0,
  },
  battle: {
    root: 130.81,                     // Dó3
    scale: [0, 2, 3, 5, 7, 8, 11],    // menor harmônica
    bpm: 160,
    arpGain: 0.06,                    // baixou (o riff vai dominar)
    chordGain: 0.04,
    arpOct: 1,
    chordOct: -1,
    arpSubdiv: 4,
    kick: true,
    kickGain: 0.18,
    kickDur: 0.22,
    subOct: -1,
    // ---- novo: riff de baixo + melodia principal ----
    bassOct: -2,                      // baixo 2 oitavas abaixo
    bassGain: 0.10,
    melodyOct: 2,                     // melodia 2 oitavas acima
    melodyGain: 0.07,
    melodyPattern: [0, 2, 4, 2, 5, 4, 2, 0],   // padrão da melodia (índices da escala)
    // ---- tímpano com padrão (1 forte + 2 fracos) ----
    kickPattern: [
      { offset: 0, mult: 1.0 },
      { offset: 2, mult: 0.5 },
      { offset: 3, mult: 0.5 },
    ],
  },
};

const LOOKAHEAD_S = 0.30;
const SCHEDULE_MS  = 120;

let currentMode = null;
let currentChannel = null;

// ---- API ----
export function setMusicMode(modeName) {
  if (!MODES[modeName]) { console.warn('[music] modo desconhecido:', modeName); return; }

  const ctx = getCtx();
  if (!ctx) {
    // Ainda não destravou — registra o pedido e tenta de novo no unlock.
    // Importante: NÃO retornar cedo por currentMode === modeName aqui,
    // porque currentMode pode ter sido setado antes do ctx existir.
    onAudioReady(() => setMusicMode(modeName));
    currentMode = modeName;
    return;
  }

  // Agora sim: se já é o modo atual E já temos canal, não faz nada.
  if (modeName === currentMode && currentChannel) return;

  currentMode = modeName;

  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  if (currentChannel) {
    const old = currentChannel;
    currentChannel = null;
    const now = ctx.currentTime;
    try {
      old.gain.gain.cancelScheduledValues(now);
      old.gain.gain.setValueAtTime(old.gain.gain.value, now);
      old.gain.gain.linearRampToValueAtTime(0, now + 0.9);
    } catch (e) {}
    setTimeout(() => stopChannel(old), 1000);
  }

  currentChannel = createChannel(ctx, MODES[modeName]);
}

function createChannel(ctx, mode) {
  const bus = getMusicBus();
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(bus);

  const now = ctx.currentTime;
  // Fade-in curto: a música aparece quase imediatamente após o
  // primeiro clique, sem parecer que "demorou pra começar".
  gain.gain.linearRampToValueAtTime(1, now + 0.15);

  // Quantas "unidades" formam 1 compasso (4 batidas em 4/4).
  // Com subdivisão por colcheia (2 por batida), são 8 unidades.
  // Com semicolcheia (4 por batida), são 16.
  const subdiv = mode.arpSubdiv ?? 2;
  const unitsPerBeat = subdiv;
  const chordBeatEvery = unitsPerBeat * 4;  // 4 batidas por compasso

  const channel = {
    gain,
    mode,
    subdiv,
    chordBeatEvery,
    timerId: null,
    nextTime: now + 0.1,
    beatIndex: 0,
  };

  scheduleLoop(channel);
  channel.timerId = setInterval(() => scheduleLoop(channel), SCHEDULE_MS);

  return channel;
}

function stopChannel(channel) {
  if (!channel) return;
  if (channel.timerId) clearInterval(channel.timerId);
  try { channel.gain.disconnect(); } catch (e) {}
}

// ---- Agendador ----
function scheduleLoop(channel) {
  const ctx = getCtx();
  if (!ctx) return;
  const mode = channel.mode;
  const subdiv = channel.subdiv;
  const unitDur = 60 / mode.bpm / subdiv;   // duração de 1 subdivisão

  while (channel.nextTime < ctx.currentTime + LOOKAHEAD_S) {
    const isDownbeat = channel.beatIndex % channel.chordBeatEvery === 0;

    // ---- Arpejo principal ----
    const deg = mode.scale[channel.beatIndex % mode.scale.length];
    const oct = (channel.beatIndex % (subdiv * 2) === 0) ? 1 : 0;
    const semitones = deg + oct * 12 + (mode.arpOct - 1) * 12;
    const freq = mode.root * 2 ** (semitones / 12);

    playPluck(ctx, channel.gain, freq, {
      gain: mode.arpGain,
      dur: 60 / mode.bpm * 0.85,
      when: channel.nextTime,
    });

    // ---- Voz duplicada uma oitava abaixo (só battle) ----
    if (mode.subOct !== undefined) {
      const subFreq = freq * 2 ** ((mode.subOct) * 12 / 12);  // subOct em oitavas
      playPluck(ctx, channel.gain, subFreq, {
        gain: mode.arpGain * 0.55,
        dur: 60 / mode.bpm * 0.85,
        when: channel.nextTime,
      });
    }

    // ---- Riff de baixo (só battle) ----
    // Uma nota por batida, alternando tônica (0) e quinta (4)
    // pra dar movimento harmônico.
    if (mode.bassGain !== undefined) {
      const unitPerBeat = subdiv;   // 1 nota por batida
      if (channel.beatIndex % unitPerBeat === 0) {
        const beatPos = Math.floor(channel.beatIndex / unitPerBeat);  // 0..3
        const bassDeg = (beatPos % 2 === 0)
          ? mode.scale[0]
          : mode.scale[4];
        const bassSemi = bassDeg + (mode.bassOct * 12);
        const bassFreq = mode.root * 2 ** (bassSemi / 12);
        playPluck(ctx, channel.gain, bassFreq, {
          gain: mode.bassGain,
          dur: 60 / mode.bpm * 1.4,    // dura ~1.5 batidas
          when: channel.nextTime,
        });
      }
    }

    // ---- Melodia principal (só battle) ----
    // Uma nota longa a cada 2 batidas, seguindo o padrão da melodia.
    if (mode.melodyPattern) {
      const melodyEvery = subdiv * 2;   // a cada 2 batidas
      if (channel.beatIndex % melodyEvery === 0) {
        const melodyStep = Math.floor(channel.beatIndex / melodyEvery);
        const degIdx = mode.melodyPattern[melodyStep % mode.melodyPattern.length];
        const melodySemi = mode.scale[degIdx] + (mode.melodyOct * 12);
        const melodyFreq = mode.root * 2 ** (melodySemi / 12);
        playPluck(ctx, channel.gain, melodyFreq, {
          gain: mode.melodyGain,
          dur: 60 / mode.bpm * 2.5,    // nota longa, "canta"
          when: channel.nextTime,
        });
      }
    }

    // ---- Acorde no downbeat ----
    if (isDownbeat) {
      playChord(ctx, channel.gain, mode, channel.nextTime);
    }

    // ---- Tímpano (só battle) ----
    // Padrão: 1 forte no tempo 1, 2 fracos nos tempos 3 e 4.
    // (offset em subdivisões; multiplicador de gain)
    if (mode.kick && mode.kickPattern) {
      for (const k of mode.kickPattern) {
        if (channel.beatIndex % channel.chordBeatEvery === k.offset) {
          playKick(ctx, channel.gain, mode, channel.nextTime, k.mult);
          break;
        }
      }
    }

    channel.beatIndex = (channel.beatIndex + 1) % (mode.scale.length * subdiv * 2);
    channel.nextTime += unitDur;
  }
}

// ---- Acorde de base ----
function playChord(ctx, dest, mode, when) {
  const offsets = [
    mode.scale[0],
    mode.scale[2],
    mode.scale[4],
  ];
  for (let i = 0; i < offsets.length; i++) {
    const semitones = offsets[i] + (mode.chordOct * 12);
    const freq = mode.root * 2 ** (semitones / 12) / 2;
    playPluck(ctx, dest, freq, {
      gain: mode.chordGain,
      dur: 60 / mode.bpm * 2.2,
      when: when + i * 0.012,
    });
  }
}

// ---- Tímpano / bumbo (só battle) ----
// Um "golpe" grave e curto, tipo tambor de guerra.
// Usa sine (mais "oco" que triangle) com pitch descendo,
// que é o que dá o "bum" de tímpano.
// `mult` escala o volume (1 = forte, 0.5 = fraco).
function playKick(ctx, dest, mode, when, mult = 1) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = 'sine';
  // Pitch "cai" de 1.4x a 0.7x da frequência base no começo da nota,
  // que é o que dá o "bum" do tímpano.
  const startFreq = mode.root * 1.4;
  const endFreq = mode.root * 0.7;
  osc.frequency.setValueAtTime(startFreq, when);
  osc.frequency.exponentialRampToValueAtTime(endFreq, when + mode.kickDur * 0.6);

  const peak = mode.kickGain * mult;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when + mode.kickDur);

  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + mode.kickDur + 0.02);
}

// ---- Nota pinçada ----
function playPluck(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, when);

  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}