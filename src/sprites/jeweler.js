// src/sprites/jeweler.js
// Joalheiro: mulher idosa, cabelo preso, vestido roxo com detalhes dourados,
// segurando uma lupa. Vista frontal (fica atrás do balcão).
export function makeJewelerFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:    '#e8c8a8', skinSh: '#c8a888',
    hair:    '#a8a8b0', hairHi: '#d0d0d8', hairSh: '#787880',
    dress:   '#5a2a7a', dressSh: '#3a1a5a', dressHi: '#7a4a9a',
    gold:    '#c9a24d', goldHi: '#f0d078',
    gem:     '#3aa0ff', gemHi: '#8ad8ff',
    eye:     '#1a1a10',
    lens:    '#e8f6ff', lensFrame: '#c9a24d',
  };

  function drawFrame(step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const bob = step === 1 ? -1 : 0;
    const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y + bob, w, h); };
    const pxG = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    // Sombra
    pxG(10, 30, 12, 1, 'rgba(0,0,0,0.25)');

    // Vestido (corpo)
    px(9, 14, 14, 12, pal.dress);
    px(9, 14, 14, 1, pal.dressHi);
    px(9, 25, 14, 1, pal.dressSh);
    // Detalhe dourado no centro
    px(15, 15, 2, 8, pal.gold);
    px(15, 15, 2, 1, pal.goldHi);
    // Gema no peito
    px(15, 17, 2, 2, pal.gem);
    px(15, 17, 1, 1, pal.gemHi);

    // Braços (manga do vestido)
    px(6, 15, 4, 7, pal.dress);
    px(22, 15, 4, 7, pal.dress);
    px(6, 15, 4, 1, pal.dressHi);
    px(22, 15, 4, 1, pal.dressHi);
    // Mãos
    px(6, 22, 4, 2, pal.skin);
    px(22, 22, 4, 2, pal.skin);

    // Cabeça
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo preso (coque)
    px(11, 3, 10, 4, pal.hair);
    px(11, 3, 10, 1, pal.hairHi);
    px(10, 6, 2, 3, pal.hair);
    px(20, 6, 2, 3, pal.hair);
    // Coque atrás
    px(9, 4, 2, 3, pal.hairSh);
    px(9, 4, 1, 1, pal.hair);

    // Olhos
    px(13, 8, 1, 2, pal.eye);
    px(18, 8, 1, 2, pal.eye);

    // Lupa na mão direita
    px(23, 19, 1, 1, pal.lensFrame);
    px(22, 20, 3, 1, pal.lensFrame);
    px(22, 21, 3, 1, pal.lens);
    px(23, 22, 1, 1, pal.lensFrame);
    px(24, 23, 1, 2, pal.lensFrame);   // cabo

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const jewelerFrames = makeJewelerFrames();