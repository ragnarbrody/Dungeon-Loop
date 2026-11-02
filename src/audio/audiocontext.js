// ============================================================
// AUDIO CONTEXT â singleton do AudioContext.
//
// Navegadores modernos BLOQUEIAM Ã¡udio atÃ© o primeiro gesto do
// usuÃ¡rio (click, keydown, touchstart). EntÃ£o:
//   - Criamos o AudioContext sÃ³ no primeiro gesto.
//   - AtÃ© lÃ¡, getCtx() retorna null e todo mundo (sfx, music)
//     faz no-op silencioso.
// ============================================================

let ctx = null;
let masterGain = null;
let musicBus = null;   // tudo de mÃºsica passa por aqui
let sfxBus = null;     // tudo de SFX passa por aqui
let initialized = false;
const listeners = [];

function createGraph() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(ctx.destination);

  musicBus = ctx.createGain();
  musicBus.gain.value = 0.5;
  musicBus.connect(masterGain);

  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(masterGain);
}

function unlock() {
  if (initialized) return;
  try {
    createGraph();
    initialized = true;

    // Alguns navegadores criam o contexto em estado "suspended" mesmo
    // apÃ³s um gesto. ForÃ§ar o resume aqui garante que o Ã¡udio toca
    // no PRIMEIRO clique, nÃ£o no segundo.
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    for (const fn of listeners) {
      try { fn(); } catch (e) { console.warn('[audio] listener error', e); }
    }
  } catch (e) {
    console.warn('[audio] AudioContext nÃ£o pÃ´de ser criado.', e);
  }
}

// Registra o unlock em todos os gestos comuns.
// { once: true } pra nÃ£o ficar escutando pra sempre â depois que
// desbloqueou, nÃ£o precisa mais.
if (typeof window !== 'undefined') {
  const opts = { once: true, passive: true };
  window.addEventListener('pointerdown', unlock, opts);
  window.addEventListener('keydown',     unlock, opts);
  window.addEventListener('touchstart',  unlock, opts);
}

export function getCtx()       { return ctx; }
export function getMasterGain(){ return masterGain; }
export function getMusicBus()  { return musicBus; }
export function getSfxBus()    { return sfxBus; }
export function isInitialized(){ return initialized; }

// Pra quem precisa reagir ao "Ã¡udio destravou".
// Se jÃ¡ destravou, chama na hora.
export function onAudioReady(fn) {
  if (initialized) { try { fn(); } catch (e) {} return () => {}; }
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}