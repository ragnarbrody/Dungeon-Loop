import { makeGoblinFrames } from './goblin.js';
import { makeScorpionFrames } from './scorpion.js';
import { makeVultureFrames } from './vulture.js';
import { makeMummyFrames } from './mummy.js';
import { makeScarabFrames } from './scarab.js';

export function makeSlimeFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  const color = '#6fd16f';
  const colorDark = '#4fa34f';
  const eye = '#111';

  function drawFrame(squish) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');

    g.fillStyle = color;
    g.beginPath();
    g.ellipse(16, 26, 14 + squish * 2, 8 - squish * 2, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = colorDark;
    g.beginPath();
    g.ellipse(16, 28, 10 + squish * 2, 3, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = eye;
    g.fillRect(11, 20, 2, 3);
    g.fillRect(19, 20, 2, 3);
    g.fillStyle = '#fff';
    g.fillRect(11, 20, 1, 1);
    g.fillRect(19, 20, 1, 1);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(0.5);
  frames.attack[0] = drawFrame(-1);
  return frames;
}

export function makeRatFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  function drawFrame(kind) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const px = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };

    const color = '#8a6b5a';
    const dark = '#5c4538';
    const ear = '#d1a7a7';
    const tail = '#d1a7a7';

    const lean = kind === 'attack' ? -2 : 0;

    px(24, 22, 4, 2, tail);
    px(28, 20, 2, 4, tail);

    px(12 + lean, 20, 12, 8, color);
    px(12 + lean, 26, 12, 2, dark);

    px(20 + lean, 16, 8, 6, color);
    px(20 + lean, 12, 3, 4, color);
    px(21 + lean, 13, 1, 2, ear);

    px(25 + lean, 17, 1, 2, '#111');
    px(28 + lean, 19, 2, 1, dark);

    px(14 + lean, 28, 2, 2, dark);
    px(20 + lean, 28, 2, 2, dark);

    return c;
  }

  frames.idle[0] = drawFrame('idle');
  frames.idle[1] = drawFrame('idle');
  frames.attack[0] = drawFrame('attack');
  return frames;
}

export function makeBatFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  function drawFrame(wingUp) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    const body = '#2a1a3a';
    const bodyHi = '#4a3a5a';
    const wing = '#4a2a5a';
    const wingSh = '#2a1a3a';
    const eye = '#ff3b3b';

    // Corpo central
    p(14, 12, 4, 6, body);
    p(15, 13, 2, 4, bodyHi);
    // Orelhas
    p(13, 10, 1, 2, body);
    p(18, 10, 1, 2, body);
    // Olhos
    p(14, 14, 1, 1, eye);
    p(17, 14, 1, 1, eye);
    // Asas (animadas)
    const wingY = wingUp ? 6 : 10;
    // Asa esquerda
    p(8, wingY, 6, 8, wing);
    p(9, wingY + 1, 4, 6, wingSh);
    p(8, wingY + 8, 2, 2, wingSh);
    // Asa direita
    p(18, wingY, 6, 8, wing);
    p(19, wingY + 1, 4, 6, wingSh);
    p(22, wingY + 8, 2, 2, wingSh);

    return c;
  }
  frames.idle[0] = drawFrame(false);
  frames.idle[1] = drawFrame(true);
  frames.attack[0] = drawFrame(false);
  return frames;
}

export function makeGoblinSergeantFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };
  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    const skin = '#5a8a3a';
    const skinSh = '#3f6528';
    const skinHi = '#7aa85a';
    const cloth = '#6b4a2b';
    const clothSh = '#4a3018';
    const eye = '#e6e64a';
    const eyeDark = '#1a1a0e';
    const tusk = '#f0e8c8';
    const armor = '#8a8a9a'; // Armadura metálica
    const armorSh = '#5a5a6a';
    const armorHi = '#c0c8d0';

    const bob = (kind === 'idle' && step === 1) ? 1 : 0;
    const lean = kind === 'attack' ? 2 : 0;

    // Sombra
    p(8, 30, 16, 1, 'rgba(0,0,0,0.28)');

    // Pernas
    p(11 + lean, 26 + bob, 3, 4, skinSh);
    p(18 + lean, 26 + bob, 3, 4, skinSh);

    // Corpo (maior que o goblin normal)
    p(10 + lean, 18 + bob, 12, 9, cloth);
    p(10 + lean, 18 + bob, 12, 1, clothSh);
    // Armadura no corpo
    p(11 + lean, 19 + bob, 10, 6, armor);
    p(11 + lean, 19 + bob, 10, 1, armorHi);
    p(12 + lean, 21 + bob, 8, 1, armorSh);

    // Braços
    p(7 + lean, 19 + bob, 3, 6, skin);
    p(22 + lean, 19 + bob, 3, 6, skin);
    // Braço com machado
    p(23 + lean, 18 + bob, 2, 6, skinSh); // Braço direito
    p(24 + lean, 15 + bob, 2, 4, '#6b4a2b'); // Cabo do machado
    p(22 + lean, 13 + bob, 5, 3, '#8a8a9a'); // Lâmina
    p(23 + lean, 13 + bob, 3, 1, '#c0c8d0'); // Brilho da lâmina

    // Cabeça (maior)
    p(10 + lean, 8 + bob, 12, 10, skin);
    p(10 + lean, 17 + bob, 12, 1, skinSh);
    p(11 + lean, 9 + bob, 10, 1, skinHi);

    // Orelhas
    p(8 + lean, 9 + bob, 2, 3, skin);
    p(22 + lean, 9 + bob, 2, 3, skin);

    // Olhos
    p(13 + lean, 12 + bob, 2, 2, eye);
    p(18 + lean, 12 + bob, 2, 2, eye);
    p(13 + lean, 13 + bob, 1, 1, eyeDark);
    p(19 + lean, 13 + bob, 1, 1, eyeDark);

    // Nariz e presas
    p(15 + lean, 16 + bob, 2, 1, skinSh);
    p(14 + lean, 16 + bob, 1, 2, tusk);
    p(17 + lean, 16 + bob, 1, 2, tusk);

    // Capacete simples (só na versão 0)
    if (kind === 'idle') {
      p(11 + lean, 7 + bob, 10, 2, armorSh);
      p(12 + lean, 7 + bob, 8, 1, armorHi);
    }

    return c;
  }
  frames.idle[0] = drawFrame('idle', 0);
  frames.idle[1] = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);
  return frames;
}

export const ENEMY_SPRITES = {
  slime: makeSlimeFrames(),
  rat: makeRatFrames(),
  goblin: makeGoblinFrames(),
  scorpion: makeScorpionFrames(),
  vulture: makeVultureFrames(),
  mummy: makeMummyFrames(),
  scarab: makeScarabFrames(), 
  bat: makeBatFrames(),
  goblin_sergeant: makeGoblinSergeantFrames(),
};