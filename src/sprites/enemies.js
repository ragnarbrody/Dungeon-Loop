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

export const ENEMY_SPRITES = {
  slime: makeSlimeFrames(),
  rat: makeRatFrames(),
  goblin: makeGoblinFrames(),
  scorpion: makeScorpionFrames(),
  vulture: makeVultureFrames(),
  mummy: makeMummyFrames(),
  scarab: makeScarabFrames(), 
};