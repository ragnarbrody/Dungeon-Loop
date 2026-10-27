// src/sprites/blacksmith.js
// Ferreiro: homem forte, barba ruiva, avental de couro, martelo apoiado.
// 2 frames idle. Vista frontal (ele fica parado atrás de uma bigorna).
export function makeBlacksmithFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:    '#e0b08a', skinSh: '#c08060',
    hair:    '#a04020', hairHi: '#c96030', hairSh: '#702810',
    apron:   '#5a3a24', apronSh: '#3a2418', apronHi: '#7a5a3a',
    tunic:   '#6b4a3a', tunicSh: '#4a3020',
    belt:    '#2a1a10', buckle:  '#c9a24d',
    boot:    '#3a2b1e',
    hammer:  '#5a4a3a', hammerHead: '#8892a0', hammerHeadHi: '#c0c8d0',
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

    // Pernas (botas curtas)
    pxGround(11, 24, 4, 6, pal.tunicSh);
    pxGround(17, 24, 4, 6, pal.tunicSh);
    pxGround(11, 28, 4, 2, pal.boot);
    pxGround(17, 28, 4, 2, pal.boot);

    // Túnica
    px(9, 14, 14, 10, pal.tunic);
    px(9, 14, 14, 1, '#8a6a5a');
    px(9, 22, 14, 1, pal.tunicSh);

    // Avental de couro (na frente, mais escuro que a herbalista)
    px(11, 15, 10, 10, pal.apron);
    px(11, 15, 10, 1, pal.apronHi);
    px(11, 24, 10, 1, pal.apronSh);
    // Bolso do avental (detalhe de ferreiro)
    px(13, 19, 6, 3, pal.apronSh);
    px(13, 19, 6, 1, pal.apronHi);

    // Braços (mais grossos, à mostra)
    px(6, 15, 4, 8, pal.skin);       // braço esquerdo (pele)
    px(22, 15, 4, 8, pal.skin);      // braço direito
    px(6, 15, 4, 3, pal.tunicSh);    // manga curta esq
    px(22, 15, 4, 3, pal.tunicSh);   // manga curta dir
    px(6, 22, 4, 2, pal.skinSh);     // mão esq
    px(22, 22, 4, 2, pal.skinSh);    // mão dir

    // Cinto com fivela dourada
    px(9, 23, 14, 1, pal.belt);
    px(15, 23, 2, 1, pal.buckle);

    // Pescoço
    px(14, 12, 4, 2, pal.skinSh);

    // Cabeça / rosto
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo ruivo curto (topo)
    px(11, 3, 10, 3, pal.hair);
    px(11, 4, 10, 1, pal.hairHi);
    px(10, 6, 2, 3, pal.hair);
    px(20, 6, 2, 3, pal.hair);

    // Barba ruiva cheia (cobre o queixo e desce até o peito)
    px(12, 10, 8, 4, pal.hair);
    px(13, 14, 6, 2, pal.hair);
    px(13, 16, 6, 1, pal.hairSh);
    px(13, 10, 6, 1, pal.hairHi);

    // Olhos (pequenos, sérios)
    px(14, 8, 1, 1, pal.eye);
    px(18, 8, 1, 1, pal.eye);

    // Sobrancelhas ruivas (dão expressão determinada)
    px(13, 7, 2, 1, pal.hairSh);
    px(18, 7, 2, 1, pal.hairSh);

    // Martelo apoiado no ombro direito (detalhe do ofício)
    // Cabo na vertical, cabeça no topo
    px(24, 10, 2, 10, pal.hammer);
    px(25, 10, 1, 10, pal.apronSh);
    // Cabeça do martelo (horizontal)
    px(22, 8, 6, 3, pal.hammerHead);
    px(22, 8, 6, 1, pal.hammerHeadHi);
    px(22, 10, 6, 1, pal.apronSh);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const blacksmithFrames = makeBlacksmithFrames();