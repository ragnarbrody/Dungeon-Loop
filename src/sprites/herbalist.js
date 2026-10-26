// src/sprites/herbalist.js
// NPC simples 32x32: capuz verde, avental, cabelo ruivo, 2 frames idle.
export function makeHerbalistFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:    '#f2c9a0', skinSh: '#d9a878',
    hair:    '#a04020', hairHi: '#c96030', hairSh: '#702810',
    hood:    '#2a5a2a', hoodSh: '#1a3f1a', hoodHi: '#4a8a4a',
    apron:   '#e8e0c8', apronSh: '#b8b098',
    tunic:   '#4a6b3a', tunicSh: '#354d2a',
    boot:    '#3a2b1e',
    eye:     '#3a2410',
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

    // Pernas + botas
    pxGround(11, 24, 4, 6, pal.tunicSh);
    pxGround(17, 24, 4, 6, pal.tunicSh);
    pxGround(11, 28, 4, 2, pal.boot);
    pxGround(17, 28, 4, 2, pal.boot);

    // Túnica
    px(9, 14, 14, 10, pal.tunic);
    px(9, 14, 14, 1, '#5a7b4a');
    px(9, 22, 14, 1, pal.tunicSh);

    // Avental (na frente)
    px(11, 15, 10, 9, pal.apron);
    px(11, 15, 10, 1, '#f0e8d0');
    px(11, 23, 10, 1, pal.apronSh);

    // Braços
    px(7, 15, 3, 8, pal.tunicSh);
    px(22, 15, 3, 8, pal.tunicSh);
    px(7, 22, 3, 2, pal.skinSh);
    px(22, 22, 3, 2, pal.skinSh);

    // Pescoço
    px(14, 12, 4, 2, pal.skinSh);

    // Rosto
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo (mechas laterais saindo do capuz)
    px(10, 9, 2, 4, pal.hair);
    px(20, 9, 2, 4, pal.hair);
    px(10, 9, 1, 2, pal.hairHi);
    px(21, 9, 1, 2, pal.hairHi);
    px(10, 13, 2, 1, pal.hairSh);
    px(20, 13, 2, 1, pal.hairSh);

    // Capuz
    px(13, 1, 6, 1, pal.hoodHi);
    px(12, 2, 8, 1, pal.hood);
    px(11, 3, 10, 2, pal.hood);
    px(11, 3, 10, 1, pal.hoodSh);
    px(11, 5, 1, 4, pal.hood);
    px(20, 5, 1, 4, pal.hood);
    // Aba sobre a testa
    px(13, 4, 6, 1, pal.hoodSh);
    // Testa exposta
    px(13, 5, 6, 1, pal.skin);

    // Olhos
    px(14, 8, 1, 1, pal.eye);
    px(17, 8, 1, 1, pal.eye);

    // Sorriso pequeno
    px(15, 10, 2, 1, pal.skinSh);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const herbalistFrames = makeHerbalistFrames();