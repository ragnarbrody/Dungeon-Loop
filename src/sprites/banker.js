// src/sprites/banker.js
// Banqueiro: homem magro, cabelo grisalho, colete escuro,
// óculos pequenos, segurando uma chave dourada.
// 2 frames idle. Vista frontal (fica atrás do balcão).
export function makeBankerFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:    '#d8b898', skinSh: '#b89878',
    hair:    '#8a8a90', hairHi: '#b8b8c0', hairSh: '#5a5a60',
    shirt:   '#e8e0d0', shirtSh: '#c8c0b0',
    vest:    '#2a2a3a', vestSh: '#1a1a2a', vestHi: '#4a4a5a',
    tie:     '#8a1a1a', tieHi: '#b82a2a',
    belt:    '#1a1a10', buckle: '#c9a24d',
    pants:   '#3a3a44', pantsSh: '#2a2a34',
    boot:    '#1a1a20',
    key:     '#c9a24d', keyHi: '#f0d078',
    eye:     '#1a1a10',
    lens:    '#e8f6ff',
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

    // Pernas / calça
    pxGround(11, 24, 4, 6, pal.pants);
    pxGround(17, 24, 4, 6, pal.pants);
    pxGround(11, 24, 4, 1, pal.pantsSh);
    pxGround(17, 24, 4, 1, pal.pantsSh);
    pxGround(11, 28, 4, 2, pal.boot);
    pxGround(17, 28, 4, 2, pal.boot);

    // Camisa (clara, quase branca)
    px(9, 14, 14, 10, pal.shirt);
    px(9, 14, 14, 1, '#f0e8d8');
    px(9, 22, 14, 1, pal.shirtSh);

    // Colete escuro (por cima da camisa, deixando o centro de fora)
    px(9, 14, 4, 10, pal.vest);      // lado esquerdo
    px(19, 14, 4, 10, pal.vest);     // lado direito
    px(9, 14, 4, 1, pal.vestHi);
    px(19, 14, 4, 1, pal.vestHi);
    px(9, 22, 4, 1, pal.vestSh);
    px(19, 22, 4, 1, pal.vestSh);

    // Gravata vermelha (no centro, sobre a camisa)
    px(15, 14, 2, 4, pal.tie);
    px(15, 14, 2, 1, pal.tieHi);

    // Braços (camisa, mãos de pele)
    px(6, 15, 4, 8, pal.shirt);
    px(22, 15, 4, 8, pal.shirt);
    px(6, 15, 4, 1, '#f0e8d8');
    px(22, 15, 4, 1, '#f0e8d8');
    px(6, 22, 4, 2, pal.skin);
    px(22, 22, 4, 2, pal.skin);
    px(6, 23, 4, 1, pal.skinSh);
    px(22, 23, 4, 1, pal.skinSh);

    // Cinto com fivela dourada
    px(9, 23, 14, 1, pal.belt);
    px(15, 23, 2, 1, pal.buckle);

    // Pescoço
    px(14, 12, 4, 2, pal.skinSh);

    // Cabeça / rosto
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo grisalho curto (topo + laterais)
    px(11, 3, 10, 3, pal.hair);
    px(11, 4, 10, 1, pal.hairHi);
    px(10, 6, 2, 3, pal.hair);
    px(20, 6, 2, 3, pal.hair);
    px(10, 8, 2, 1, pal.hairSh);
    px(20, 8, 2, 1, pal.hairSh);

    // Óculos pequenos (2 lentes com aro)
    px(13, 7, 3, 2, pal.eye);       // aro esquerdo
    px(16, 7, 3, 2, pal.eye);       // aro direito
    px(14, 8, 1, 1, pal.lens);      // lente esq
    px(17, 8, 1, 1, pal.lens);      // lente dir
    px(15, 8, 1, 1, pal.hairSh);    // ponte

    // Sobrancelhas grisalhas (dão expressão séria)
    px(13, 6, 2, 1, pal.hairSh);
    px(18, 6, 2, 1, pal.hairSh);

    // Chave dourada na mão direita (detalhe do ofício)
    px(23, 22, 1, 4, pal.key);      // haste
    px(22, 22, 1, 1, pal.keyHi);    // dente esquerdo
    px(23, 26, 2, 1, pal.keyHi);    // dente inferior
    px(24, 22, 1, 1, pal.key);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const bankerFrames = makeBankerFrames();