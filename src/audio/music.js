// ============================================================
// MÚSICA PROCEDURAL — sem arquivos.
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
    bpm: 74,
    arpGain: 0.075,
    chordGain: 0.06,
    arpOct: 1,
    chordOct: 0,
    barsPerPhase: 4,
    phases: [
      { bass: false, arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: false },
      { bass: false, arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: true },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: true },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 1, chord: true, bell: true },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 1, chord: true, bell: true, arpHarmonyGain: 0.03, arpHarmonySemitones: 12, flute: true, fluteGain: 0.025, flutePhraseIndex: 1 },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 2, chord: true, bell: true, arpHarmonyGain: 0.03, arpHarmonySemitones: 12, bellPattern: [0, null, null, null, 4, null, null, null, 2, null, null, null, 4, null, null, null], pad: true, padGain: 0.02, flute: true, fluteGain: 0.025, flutePhraseIndex: 2 },
    ],
  },

  fields: {
    root: 293.66,
    scale: [0, 2, 4, 7, 9],
    bpm: 86,
    arpGain: 0.07,
    chordGain: 0.055,
    arpOct: 1,
    chordOct: 0,
    barsPerPhase: 3,
    phases: [
      { bass: false, arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: false },
      { bass: false, arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: true, flute: true, fluteGain: 0.035 },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 0, chord: true, flute: true, fluteGain: 0.035 },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 1, chord: true, flute: true, fluteGain: 0.04 },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 1, chord: true, flute: true, fluteGain: 0.04, pad: true, padGain: 0.025 },
      { bass: true,  arp: true, kick: false, snare: false, hihat: false, backing: false, intensity: 2, chord: true, flute: true, fluteGain: 0.04, pad: true, padGain: 0.03, arpHarmonyGain: 0.025, arpHarmonySemitones: 7 },
    ],
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

  // ============================================================
  // MÚSICA DE BATALHA — "Cerco Sombrio"
  // ============================================================
  battle: {
    root: 130.81,
    scale: [0, 1, 3, 5, 7, 8, 10],
    bpm: 160,
    arpGain: 0.06,
    chordGain: 0.05,
    arpOct: 1,
    chordOct: -1,
    arpSubdiv: 3,
    kick: true,
    kickGain: 0.25,
    kickDur: 0.22,
    subOct: -1,
    bassOct: -2,
    bassGain: 0.12,
    hihat: true,
    hihatGain: 0.03,
    hihatDur: 0.03,
    backing: true,
    backingGain: 0.05,
    backingOct: 0,
    backingDur: 0.55,
    backingPatterns: [
      [0, null, 4, null, 3, null, 2, null, 0, null, 4, null, 3, null, 2, null],
      [0, 4, null, 4, 3, 4, 2, null, 0, 4, null, 4, 3, 4, 2, null],
      [0, 4, 3, 4, 2, 4, 3, 4, 0, 4, 3, 4, 2, 4, 3, 4],
    ],
    kickPatternsByIntensity: [
      [{ offset: 0, mult: 1.0 }, { offset: 3, mult: 0.8 }, { offset: 6, mult: 0.8 }, { offset: 9, mult: 0.8 }],
      [{ offset: 0, mult: 1.0 }, { offset: 2, mult: 0.6 }, { offset: 4, mult: 0.7 }, { offset: 6, mult: 0.8 }, { offset: 8, mult: 0.6 }, { offset: 10, mult: 0.7 }],
      [{ offset: 0, mult: 1.0 }, { offset: 1, mult: 0.5 }, { offset: 3, mult: 0.7 }, { offset: 4, mult: 0.6 }, { offset: 6, mult: 0.8 }, { offset: 7, mult: 0.5 }, { offset: 9, mult: 0.7 }, { offset: 10, mult: 0.6 }],
      [{ offset: 0, mult: 1.0 }, { offset: 1, mult: 0.5 }, { offset: 2, mult: 0.6 }, { offset: 3, mult: 0.7 }, { offset: 4, mult: 0.6 }, { offset: 5, mult: 0.5 }, { offset: 6, mult: 0.8 }, { offset: 7, mult: 0.5 }, { offset: 8, mult: 0.6 }, { offset: 9, mult: 0.7 }, { offset: 10, mult: 0.6 }, { offset: 11, mult: 0.5 }],
    ],
    snare: true,
    snareGain: 0.07,
    snareDur: 0.05,
    snarePatternsByIntensity: [
      [],
      [{ offset: 2, mult: 0.7 }, { offset: 8, mult: 0.7 }],
      [{ offset: 2, mult: 0.7 }, { offset: 5, mult: 0.5 }, { offset: 8, mult: 0.7 }, { offset: 11, mult: 0.5 }],
      [{ offset: 2, mult: 0.7 }, { offset: 3, mult: 0.5 }, { offset: 5, mult: 0.5 }, { offset: 8, mult: 0.7 }, { offset: 9, mult: 0.5 }, { offset: 11, mult: 0.5 }],
    ],
    arpSkipEvery: 3,
    arpAccentOffset: 1,
    breatheAtBars: [8, 16],
    breatheIntensityMin: 0,
    barsPerPhase: 4,
    phases: [
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: false, 
        backing: false, intensity: 0, chord: false, 
        lead: false, bell: false, pizzicato: false 
      },
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: true, 
        backing: true, intensity: 1, chord: false, 
        lead: false, bell: false, pizzicato: true 
      },
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: true, 
        backing: true, intensity: 2, chord: true, 
        lead: true, leadGain: 0.04, bell: true, pizzicato: true, 
        leadPattern: [0, null, 1, 3, null, 1, 0, null, 3, null, 1, 3, null, 1, 0, null],
        bellPattern: [0, null, null, null, 3, null, null, null, 1, null, null, null, 3, null, null, null] 
      },
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: true, 
        backing: true, intensity: 3, chord: true, 
        lead: true, leadGain: 0.045, bell: true, pizzicato: true, 
        leadPattern: [0, 1, 3, 5, null, 3, 1, null, 0, 1, 3, 5, 3, 1, 0, null],
        bellPattern: [0, null, null, null, 3, null, null, null, 1, null, null, null, 3, null, null, null]
      },
            // 4: A APOTEOSE FINAL (2 compassos, transição)
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: true, 
        backing: true, intensity: 4, chord: true, 
        lead: true, leadGain: 0.055, bell: true, pizzicato: true, 
        brass: true, brassGain: 0.045, choir: true, choirGain: 0.035,
        guitar: true, guitarGain: 0.06,
        deepDrum: true, deepDrumGain: 0.18,
        leadPattern: [0, 1, 3, 5, 7, 5, 3, 1, 0, 1, 3, 5, 7, 5, 3, 1],
        bellPattern: [0, null, 3, null, 1, null, 3, null, 5, null, 3, null, 1, null, 3, null],
        brassPattern: [0, null, 3, null, 5, null, 3, null, 0, null, 5, null, 3, null, 5, null],
        choirPattern: [0, null, 5, null, 3, null, 5, null, 0, null, 5, null, 3, null, 5, null],
        guitarPattern: [0, null, null, null, 5, null, null, null, 0, null, null, null, 5, null, null, null], // Só nos downbeats, power chord
        leadOct: 1,
        barsPerPhaseOverride: 2
      },
      // 5: APOTEOSE PLENA (loop infinito, BPM normal)
      { 
        bass: true, arp: true, kick: true, snare: true, hihat: true, 
        backing: true, intensity: 5, chord: true, 
        lead: true, leadGain: 0.06, bell: true, pizzicato: true, 
        brass: true, brassGain: 0.05, choir: true, choirGain: 0.04,
        guitar: true, guitarGain: 0.07,
        deepDrum: true, deepDrumGain: 0.22,
        leadPattern: [0, 1, 3, 5, 7, 8, 7, 5, 3, 1, 0, 1, 3, 5, 7, 8],
        bellPattern: [0, null, 3, null, 1, null, 3, null, 5, null, 3, null, 1, null, 3, null],
        brassPattern: [0, null, 3, null, 5, null, 3, null, 0, null, 5, null, 3, null, 5, null],
        choirPattern: [0, null, 5, null, 3, null, 5, null, 0, null, 5, null, 3, null, 5, null],
        guitarPattern: [0, null, null, null, 5, null, null, null, 0, null, null, null, 5, null, null, null],
        leadOct: 1,
        barsPerPhaseOverride: Infinity
      },
    ],
  },
};

const LOOKAHEAD_S = 0.20;
const SCHEDULE_MS  = 120;

// ---- Frases melódicas da flauta (Usadas em Aethel e Fields) ----
const FLUTE_PHRASES = [
  [0, null, 2, 4, null, 2, null, 4, 0, null, 2, 4, null, 2, null, null],
  [0, null, 2, null, 4, null, 2, null, 0, null, 4, null, 2, null, null, null],
  [0, 2, 4, null, 2, null, 0, null, 4, null, 2, 4, null, 2, null, null],
  [0, null, 4, null, 2, null, 4, null, 0, 2, null, 4, null, null, null, null],
];

let currentMode = null;
let currentChannel = null;

export function setMusicMode(modeName) {
  if (!MODES[modeName]) { console.warn('[music] modo desconhecido:', modeName); return; }
  const ctx = getCtx();
  if (!ctx) {
    onAudioReady(() => setMusicMode(modeName));
    currentMode = modeName;
    return;
  }
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
  gain.gain.linearRampToValueAtTime(1, now + 0.15);

  const subdiv = mode.arpSubdiv ?? 2;
  const unitsPerBeat = subdiv;
  const chordBeatEvery = unitsPerBeat * 4;
  const unitsPerBar = chordBeatEvery;
  const unitsPerPhase = unitsPerBar * (mode.barsPerPhase ?? Infinity);

  const channel = {
    gain, mode, subdiv, chordBeatEvery, unitsPerBar, unitsPerPhase,
    timerId: null, nextTime: now + 0.1, beatIndex: 0, barIndex: 0,
    flutePhraseIndex: mode.phases?.[0]?.flutePhraseIndex ?? 0,
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

function currentPhase(channel) {
  const mode = channel.mode;
  if (!mode.phases || !mode.barsPerPhase) {
    return {
      bass: true, arp: true, kick: !!mode.kick, snare: !!mode.snare,
      hihat: !!mode.hihat, backing: !!mode.backing, intensity: 2,
    };
  }
  const defaultBars = mode.barsPerPhase;
  let barAcc = 0;
  for (let i = 0; i < mode.phases.length; i++) {
    const phase = mode.phases[i];
    const isLast = i === mode.phases.length - 1;
    const len = phase.barsPerPhaseOverride ?? defaultBars;
    if (isLast) {
      if (channel.barIndex >= barAcc) return phase;
    } else if (channel.barIndex < barAcc + len) {
      return phase;
    }
    barAcc += len;
  }
  return mode.phases[mode.phases.length - 1];
}

function scheduleLoop(channel) {
  const ctx = getCtx();
  if (!ctx) return;
  const mode = channel.mode;
  const subdiv = channel.subdiv;

  while (channel.nextTime < ctx.currentTime + LOOKAHEAD_S) {
    const phase = currentPhase(channel);
    const intensity = phase.intensity ?? 2;

    // ---- LÓGICA DE "RESPIRO" (PAUSA) ----
    let breathing = false;
    if (mode.breatheAtBars && mode.breatheAtBars.length > 0) {
      if (mode.breatheAtBars.includes(channel.barIndex)) {
        breathing = true;
      }
    } else if (mode.breatheEveryBars && mode.breatheIntensityMin !== undefined && intensity >= mode.breatheIntensityMin) {
      breathing = channel.barIndex % mode.breatheEveryBars === 0;
    }

    // ---- BPM normal (sem dobra) ----
    const currentBpm = mode.bpm;

    const unitDur = 60 / currentBpm / subdiv;
    const beatIdxInBar = channel.beatIndex % channel.chordBeatEvery;
    const isDownbeat = beatIdxInBar === 0;

    if (breathing) {
      if (isDownbeat && phase.kick !== false && mode.kick) {
        playKick(ctx, channel.gain, mode, channel.nextTime, 1.0);
      }
      channel.beatIndex = (channel.beatIndex + 1) % channel.unitsPerBar;
      if (channel.beatIndex === 0) channel.barIndex++;
      channel.nextTime += unitDur;
      continue;
    }

    // ---- Arpejo principal ----
    if (phase.arp !== false) {
      const skipEvery = mode.arpSkipEvery ?? 0;
      const skipThis = skipEvery > 0 && (beatIdxInBar % skipEvery) === 0 && !isDownbeat;
      if (!skipThis) {
        const deg = mode.scale[channel.beatIndex % mode.scale.length];
        const oct = (channel.beatIndex % (subdiv * 2) === 0) ? 1 : 0;
        const semitones = deg + oct * 12 + (mode.arpOct - 1) * 12;
        const freq = mode.root * 2 ** (semitones / 12);

        const isAccent = mode.arpAccentOffset !== undefined && (beatIdxInBar % (skipEvery || 4)) === mode.arpAccentOffset;
        const arpGain = isAccent ? mode.arpGain * 1.4 : mode.arpGain;

        playPluck(ctx, channel.gain, freq, { gain: arpGain, dur: 60 / currentBpm * 0.85, when: channel.nextTime });

        if (mode.subOct !== undefined) {
          const subFreq = freq * 2 ** (mode.subOct);
          playPluck(ctx, channel.gain, subFreq, { gain: arpGain * 0.55, dur: 60 / currentBpm * 0.85, when: channel.nextTime });
        }

        const harmonyGain = phase.arpHarmonyGain ?? mode.arpHarmonyGain;
        if (harmonyGain !== undefined) {
          const harmonySemi = phase.arpHarmonySemitones ?? mode.arpHarmonySemitones ?? 7;
          const harmonyFreq = freq * 2 ** (harmonySemi / 12);
          playPluck(ctx, channel.gain, harmonyFreq, { gain: arpGain * harmonyGain, dur: 60 / currentBpm * 0.85, when: channel.nextTime });
        }
      }
    }

    // ---- HI-HAT ----
    if (phase.hihat !== false && mode.hihat) {
      const hihatMult = 0.7 + intensity * 0.1;
      playHihat(ctx, channel.gain, mode, channel.nextTime, hihatMult);
    }

    // ---- CORDAS DE FUNDO ----
    if (phase.backing !== false && mode.backing && mode.backingPatterns) {
      const patIdx = Math.min(mode.backingPatterns.length - 1, intensity);
      const pattern = mode.backingPatterns[patIdx];
      const deg = pattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const octBoost = Math.floor(channel.barIndex / 4) % 2 === 1 ? 12 : 0;
        const semi = mode.scale[deg % mode.scale.length] + (mode.backingOct * 12) + octBoost;
        const freq = mode.root * 2 ** (semi / 12);
        const isAccent = beatIdxInBar === 0;
        const gain = isAccent ? mode.backingGain * 1.3 : mode.backingGain;
        playBackingString(ctx, channel.gain, freq, { gain, dur: 60 / currentBpm * mode.backingDur, when: channel.nextTime });
      }
    }

    // ---- Riff de baixo ----
    if (phase.bass !== false && mode.bassGain !== undefined) {
      const unitPerBeat = subdiv;
      if (beatIdxInBar % unitPerBeat === 0) {
        const beatPos = Math.floor(beatIdxInBar / unitPerBeat);
        const bassDeg = (beatPos % 2 === 0) ? mode.scale[0] : mode.scale[4];
        const bassSemi = bassDeg + (mode.bassOct * 12);
        const bassFreq = mode.root * 2 ** (bassSemi / 12);
        playPluck(ctx, channel.gain, bassFreq, { gain: mode.bassGain, dur: 60 / currentBpm * 1.4, when: channel.nextTime });
      }
    }

    // ---- Acorde no downbeat ----
    const phaseWantsChord = phase.chord !== false;
    if (isDownbeat && phaseWantsChord) {
      playChord(ctx, channel.gain, mode, channel.nextTime);
    }

    // ---- SINO ----
    if (phase.bell) {
      const bellPattern = phase.bellPattern || [0, null, null, null, 4, null, null, null, null, null, 2, null, 4, null, null, null];
      const deg = bellPattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const semi = mode.scale[deg % mode.scale.length] + 12;
        const freq = mode.root * 2 ** (semi / 12);
        if (channel.barIndex % 2 === 0) {
          playBell(ctx, channel.gain, freq, { gain: 0.05, dur: 1.5, when: channel.nextTime });
        }
      }
    }

    // ---- FLAUTA ----
    if (phase.flute) {
      let pattern;
      if (phase.flutePattern) {
        pattern = phase.flutePattern;
      } else {
        if (phase.flutePhraseIndex !== undefined) {
          pattern = FLUTE_PHRASES[phase.flutePhraseIndex];
        } else {
          if (isDownbeat) {
            channel.flutePhraseIndex = (channel.flutePhraseIndex + 1) % FLUTE_PHRASES.length;
          }
          pattern = FLUTE_PHRASES[channel.flutePhraseIndex];
        }
      }

      const deg = pattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const semi = mode.scale[deg % mode.scale.length] + 0;
        const freq = mode.root * 2 ** (semi / 12);
        const fGain = phase.fluteGain ?? 0.04;
        const fDur = mode === MODES.aethel ? 1.2 : 0.65;
        playFlute(ctx, channel.gain, freq, { gain: fGain, dur: fDur, when: channel.nextTime });
      }
    }

    // ---- PAD ----
    if (phase.pad) {
      if (isDownbeat) {
        const semi = mode.scale[0];
        const freq = mode.root * 2 ** (semi / 12) / 2;
        const pGain = phase.padGain ?? 0.025;
        playPad(ctx, channel.gain, freq, { gain: pGain, dur: 60 / currentBpm * 4, when: channel.nextTime });
      }
    }

    // ---- LEAD ----
    if (phase.lead) {
      const leadPattern = phase.leadPattern || [0, null, 1, 3, null, 1, 0, null, 3, null, 1, 3, null, 1, 0, null];
      const deg = leadPattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const octOffset = phase.leadOct !== undefined ? phase.leadOct * 12 : 0;
        const semi = mode.scale[deg % mode.scale.length] + 12 + octOffset;
        const freq = mode.root * 2 ** (semi / 12);
        const lGain = phase.leadGain ?? 0.04;
        const lDur = 60 / currentBpm * 0.6;
        playLead(ctx, channel.gain, freq, { gain: lGain, dur: lDur, when: channel.nextTime });
      }
    }

    // ---- PIZZICATO ----
    if (phase.pizzicato) {
      if (beatIdxInBar % 2 === 1) {
        const idx = Math.floor(beatIdxInBar / 2) % mode.scale.length;
        const deg = mode.scale[idx];
        const semi = deg + (mode.chordOct * 12);
        const freq = mode.root * 2 ** (semi / 12);
        playPizzicato(ctx, channel.gain, freq, { gain: 0.035, dur: 60 / currentBpm * 0.3, when: channel.nextTime });
      }
    }

    // ---- BRASS ----
    if (phase.brass) {
      const brassPattern = phase.brassPattern || [0, null, null, null, 4, null, null, null, 2, null, null, null, 4, null, null, null];
      const deg = brassPattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const semi = mode.scale[deg % mode.scale.length] + 12;
        const freq = mode.root * 2 ** (semi / 12);
        const bGain = phase.brassGain ?? 0.04;
        playBrass(ctx, channel.gain, freq, { gain: bGain, dur: 60 / currentBpm * 0.7, when: channel.nextTime });
      }
    }

    // ---- CHOIR ----
    if (phase.choir) {
      const choirPattern = phase.choirPattern || [0, null, null, null, 4, null, null, null, 0, null, null, null, 4, null, null, null];
      const deg = choirPattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const semi = mode.scale[deg % mode.scale.length] - 12;
        const freq = mode.root * 2 ** (semi / 12);
        const cGain = phase.choirGain ?? 0.03;
        playChoir(ctx, channel.gain, freq, { gain: cGain, dur: 60 / currentBpm * 1.5, when: channel.nextTime });
      }
    }

    // ---- GUITARRA DISTORCIDA ----
    if (phase.guitar) {
      const guitarPattern = phase.guitarPattern || [0, 2, 4, 6, 4, 2, 0, null, 0, 2, 4, 6, 4, 2, 0, null];
      const deg = guitarPattern[beatIdxInBar];
      if (deg !== null && deg !== undefined) {
        const semi = mode.scale[deg % mode.scale.length] + 12;
        const freq = mode.root * 2 ** (semi / 12);
        const gGain = phase.guitarGain ?? 0.05;
        playDistortedGuitar(ctx, channel.gain, freq, { gain: gGain, dur: 60 / currentBpm * 0.5, when: channel.nextTime });
      }
    }

    // ---- TAMBOR GRAVE ----
    if (phase.deepDrum) {
      if (isDownbeat) {
        const dGain = phase.deepDrumGain ?? 0.15;
        playDeepDrum(ctx, channel.gain, mode, channel.nextTime, dGain);
      }
    }

    // ---- Tímpano ----
    if (phase.kick !== false && mode.kick && mode.kickPatternsByIntensity) {
      const patIdx = Math.min(mode.kickPatternsByIntensity.length - 1, intensity);
      const pattern = mode.kickPatternsByIntensity[patIdx];
      for (const k of pattern) {
        if (beatIdxInBar === k.offset) {
          playKick(ctx, channel.gain, mode, channel.nextTime, k.mult);
          break;
        }
      }
    }

    // ---- Snare ----
    if (phase.snare !== false && mode.snare && mode.snarePatternsByIntensity) {
      const patIdx = Math.min(mode.snarePatternsByIntensity.length - 1, intensity);
      const pattern = mode.snarePatternsByIntensity[patIdx];
      for (const s of pattern) {
        if (beatIdxInBar === s.offset) {
          playSnare(ctx, channel.gain, mode, channel.nextTime, s.mult);
          break;
        }
      }
    }

    channel.beatIndex = (channel.beatIndex + 1) % channel.unitsPerBar;
    if (channel.beatIndex === 0) channel.barIndex++;
    channel.nextTime += unitDur;
  }
}

// ============================================================
// FUNÇÕES DE INSTRUMENTOS
// ============================================================

// (As funções de instrumento são as mesmas de antes, com exceção de playBrass e playChoir que já existiam.
// Vou incluir todas aqui para o arquivo ficar completo.)
function playChord(ctx, dest, mode, when) {
  const offsets = [mode.scale[0], mode.scale[2], mode.scale[4]];
  for (let i = 0; i < offsets.length; i++) {
    const semitones = offsets[i] + (mode.chordOct * 12);
    const freq = mode.root * 2 ** (semitones / 12) / 2;
    playPluck(ctx, dest, freq, { gain: mode.chordGain, dur: 60 / mode.bpm * 2.2, when: when + i * 0.012 });
  }
}

function playKick(ctx, dest, mode, when, mult = 1) {
  {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, when);
    osc.frequency.exponentialRampToValueAtTime(200, when + 0.02);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.10 * mult, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
    osc.connect(g);
    g.connect(dest);
    osc.start(when);
    osc.stop(when + 0.04);
  }
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
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

function playSnare(ctx, dest, mode, when, mult = 1) {
  const len = Math.floor(ctx.sampleRate * mode.snareDur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filterBody = ctx.createBiquadFilter();
  filterBody.type = 'lowpass';
  filterBody.frequency.value = 800;
  const gBody = ctx.createGain();
  gBody.gain.setValueAtTime(mode.snareGain * 0.6 * mult, when);
  gBody.gain.exponentialRampToValueAtTime(0.0001, when + mode.snareDur);
  src.connect(filterBody);
  filterBody.connect(gBody);
  gBody.connect(dest);
  const filterCrack = ctx.createBiquadFilter();
  filterCrack.type = 'highpass';
  filterCrack.frequency.value = 3000;
  const gCrack = ctx.createGain();
  gCrack.gain.setValueAtTime(mode.snareGain * mult, when);
  gCrack.gain.exponentialRampToValueAtTime(0.0001, when + mode.snareDur * 0.6);
  src.connect(filterCrack);
  filterCrack.connect(gCrack);
  gCrack.connect(dest);
  src.start(when);
  src.stop(when + mode.snareDur + 0.02);
}

function playHihat(ctx, dest, mode, when, mult = 1) {
  const len = Math.floor(ctx.sampleRate * mode.hihatDur);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 7000;
  filter.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.setValueAtTime(mode.hihatGain * mult, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + mode.hihatDur);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(when);
  src.stop(when + mode.hihatDur + 0.02);
}

function playBackingString(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1100, when);
  filter.frequency.linearRampToValueAtTime(900, when + dur * 0.5);
  filter.frequency.exponentialRampToValueAtTime(500, when + dur);
  filter.Q.value = 1.2;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

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

function playBell(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, when);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2 ** (7/12), when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  osc2.connect(g);
  g.connect(dest);
  osc.start(when);
  osc2.start(when);
  osc.stop(when + dur + 0.02);
  osc2.stop(when + dur + 0.02);
}

function playFlute(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  const g = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, when);
  lfo.frequency.value = 5;
  lfoGain.gain.value = 3;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.04);
  g.gain.setValueAtTime(gain, when + dur * 0.4);
  g.gain.linearRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  lfo.start(when);
  osc.stop(when + dur + 0.02);
  lfo.stop(when + dur + 0.02);
}

function playPad(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, when);
  filter.frequency.linearRampToValueAtTime(400, when + dur * 0.5);
  filter.Q.value = 0.8;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + dur * 0.25);
  g.gain.setValueAtTime(gain, when + dur * 0.6);
  g.gain.linearRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playLead(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1800, when);
  filter.frequency.linearRampToValueAtTime(800, when + dur);
  filter.Q.value = 2.0;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playPizzicato(ctx, dest, freq, { gain, dur, when }) {
  if (!isFinite(freq) || !isFinite(dur) || !isFinite(when)) return;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, when);
  filter.Q.value = 1.5;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playBrass(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, when);
  filter.frequency.linearRampToValueAtTime(1500, when + dur * 0.7);
  filter.Q.value = 1.0;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

function playChoir(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(freq * 2 ** (0.1 / 12), when);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, when);
  filter.Q.value = 0.5;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.1);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc2.start(when);
  osc.stop(when + dur + 0.02);
  osc2.stop(when + dur + 0.02);
}

// ---- Guitarra Distorcida ----
function playDistortedGuitar(ctx, dest, freq, { gain, dur, when }) {
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const distortion = ctx.createWaveShaper();
  const g = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, when);

  const samples = 44100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * 3);
  }
  distortion.curve = curve;

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2500, when);
  filter.frequency.linearRampToValueAtTime(1200, when + dur * 0.8);
  filter.Q.value = 0.7;

  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  osc.connect(distortion);
  distortion.connect(filter);
  filter.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.02);
}

// ---- Tambor Grave ----
function playDeepDrum(ctx, dest, mode, when, gain) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(70, when);
  osc.frequency.exponentialRampToValueAtTime(35, when + 0.25);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.35);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + 0.4);
}