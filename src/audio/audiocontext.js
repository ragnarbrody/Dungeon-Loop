// ============================================================
// AUDIO CONTEXT — singleton do AudioContext.
//
// Navegadores modernos BLOQUEIAM áudio até o primeiro gesto do
// usuário (click, keydown, touchstart). Então:
//   - Criamos o AudioContext só no primeiro gesto.
//   - Até lá, getCtx() retorna null e todo mundo (sfx, music)
//     faz no-op silencioso.
// ============================================================

let ctx = null;
let masterGain = null;
let musicBus = null;   // tudo de música passa por aqui
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
    // Avisa os interessados (mixer, music) que o ctx existe agora
    for (const fn of listeners) {
      try { fn(); } catch (e) { console.warn('[audio] listener error', e); }
    }
  } catch (e) {
    console.warn('[audio] AudioContext não pôde ser criado.', e);
  }
}

// Registra o unlock em todos os gestos comuns.
// { once: true } pra não ficar escutando pra sempre — depois que
// desbloqueou, não precisa mais.
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

// Pra quem precisa reagir ao "áudio destravou".
// Se já destravou, chama na hora.
export function onAudioReady(fn) {
  if (initialized) { try { fn(); } catch (e) {} return () => {}; }
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}