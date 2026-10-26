// src/sprites/elder.js
// Ancião: idoso de cabelo/barba brancos, túnica longa bege, cajado.
// 2 frames idle. Vista frontal (ele fica parado atrás de uma mesa).
export function makeElderFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:    '#e8c8a8', skinSh: '#c9a888',
    hair:    '#f0f0e8', hairHi: '#ffffff', hairSh: '#c8c8c0',
    robe:    '#6a5a3a', robeSh: '#4a3f28', robeHi: '#8a7a4a',
    trim:    '#c9a24d',
    staff:   '#5a3a1a', staffSh: '#3a2410',
    gem:     '#8ad8ff', gemHi: '#e8f6ff',
    eye:     '#2a1a10',
  };

  function drawFrame(step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const bob = step === 1 ? -1 : 0;
    const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y + bob, w, h); };
    const pxGround = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    // Sombra
    pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');

    // Cajado (à esquerda, na mão)
    px(5, 6, 2, 24, pal.staff);
    px(6, 6, 1, 24, pal.staffSh);
    px(4, 3, 4, 4, pal.gem);
    px(5, 4, 2, 2, pal.gemHi);

    // Túnica longa (cobre pernas)
    px(9, 14, 14, 16, pal.robe);
    px(9, 14, 14, 1, pal.robeHi);
    px(9, 28, 14, 2, pal.robeSh);
    // Faixa/trim dourado
    px(9, 22, 14, 1, pal.trim);
    // Braço direito (segurando o cajado)
    px(6, 15, 4, 9, pal.robeSh);
    px(6, 22, 4, 2, pal.skinSh);
    // Braço esquerdo (caído)
    px(21, 15, 3, 8, pal.robeSh);
    px(21, 22, 3, 2, pal.skinSh);

    // Pescoço
    px(14, 12, 4, 2, pal.skinSh);

    // Cabeça / rosto
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo branco (topo e laterais)
    px(11, 2, 10, 4, pal.hair);
    px(11, 3, 10, 1, pal.hairHi);
    px(10, 6, 2, 5, pal.hair);
    px(20, 6, 2, 5, pal.hair);
    px(10, 9, 2, 2, pal.hairSh);

    // Barba longa (cobre o queixo e desce)
    px(12, 11, 8, 3, pal.hair);
    px(12, 14, 8, 3, pal.hair);
    px(13, 17, 6, 1, pal.hairSh);
    px(14, 12, 4, 1, pal.hairHi);

    // Olhos (pequenos, sábios)
    px(14, 8, 1, 1, pal.eye);
    px(18, 8, 1, 1, pal.eye);

    // Sobrancelhas brancas (dão expressão de velho)
    px(13, 7, 2, 1, pal.hair);
    px(18, 7, 2, 1, pal.hair);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const elderFrames = makeElderFrames();