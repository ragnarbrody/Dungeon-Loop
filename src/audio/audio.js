// ============================================================
// AUDIO — fachada. O resto do jogo só importa daqui.
// ============================================================
export { sfx } from './sfx.js';
export { setMusicMode } from './music.js';
export {
  getAudioState, setMasterVolume, setMusicVolume, setSfxVolume,
  setMuted, toggleMuted,
} from './mixer.js';
export { isInitialized, onAudioReady } from './audiocontext.js';