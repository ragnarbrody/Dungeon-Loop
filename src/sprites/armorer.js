// src/sprites/armorer.js
// Armeiro: figura cautelosa, óculos de proteção na testa,
// avental de tecido claro (não couro), segurando um escudo pequeno.
// Diferente do ferreiro (que é bruto e martela), o armeiro
// inspeciona antes de comprar — daí os óculos e o escudo na mão.
export function makeArmorerFrames() {
  const S = 32;
  const frames = { idle: [] };

  const pal = {
    skin:     '#e0b08a', skinSh: '#c08060',
    hair:     '#5a4a3a', hairHi: '#7a6a5a', hairSh: '#3a2a1a',
    // Avental de tecido claro (bege esverdeado), contrasta com o couro do ferreiro
    apron:    '#b8a878', apronSh: '#8a7a50', apronHi: '#d8c898',
    tunic:    '#4a5a6a', tunicSh: '#3a4a5a',   // túnica azul-acinzentada
    belt:     '#2a1a10', buckle:  '#c9a24d',
    boot:     '#3a2b1e',
    // Óculos de proteção (na testa): lentes claras, aro metálico
    gogglesLens: '#a8d8e8', gogglesFrame: '#3a3a42', gogglesShine: '#ffffff',
    // Escudo pequeno que ele segura
    shieldRim:  '#c9a24d', shieldFace: '#2a4a8a', shieldShade: '#1a3a6a',
    shieldEmblem: '#e0e0e0',
    // Lápis/giz de marcar peça (detalhe: ele inspeciona)
    marker: '#f0e0a0', markerSh: '#c8b880',
    eye:      '#2a1a10',
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

    // Pernas (botas)
    pxGround(11, 24, 4, 6, pal.tunicSh);
    pxGround(17, 24, 4, 6, pal.tunicSh);
    pxGround(11, 28, 4, 2, pal.boot);
    pxGround(17, 28, 4, 2, pal.boot);

    // Túnica (azul-acinzentada)
    px(9, 14, 14, 10, pal.tunic);
    px(9, 14, 14, 1, '#6a7a8a');   // brilho topo
    px(9, 22, 14, 1, pal.tunicSh); // sombra base

    // Avental de tecido (mais claro, retangular, sem bolso — ele é metódico)
    px(11, 15, 10, 10, pal.apron);
    px(11, 15, 10, 1, pal.apronHi);
    px(11, 24, 10, 1, pal.apronSh);
    // Cordinha do avental no pescoço (sutil)
    px(14, 13, 4, 1, pal.apronSh);

    // Braços
    px(6, 15, 4, 8, pal.skin);
    px(22, 15, 4, 8, pal.skin);
    px(6, 15, 4, 3, pal.tunicSh);
    px(22, 15, 4, 3, pal.tunicSh);
    px(6, 22, 4, 2, pal.skinSh);
    px(22, 22, 4, 2, pal.skinSh);

    // Cinto com fivela
    px(9, 23, 14, 1, pal.belt);
    px(15, 23, 2, 1, pal.buckle);

    // Pescoço
    px(14, 12, 4, 2, pal.skinSh);

    // Cabeça
    px(12, 5, 8, 8, pal.skin);
    px(12, 12, 8, 1, pal.skinSh);

    // Cabelo curto (marrom-escuro), penteado pra trás
    px(11, 3, 10, 3, pal.hair);
    px(11, 4, 10, 1, pal.hairHi);
    px(10, 6, 2, 2, pal.hair);
    px(20, 6, 2, 2, pal.hair);

    // Óculos de proteção na TESTA (não nos olhos — ele usa pra inspecionar,
    // não pra lutar). Aro escuro, lente azulada.
    // Aro dos óculos
    px(11, 4, 10, 1, pal.gogglesFrame);      // barra superior
    px(11, 4, 1, 3, pal.gogglesFrame);        // lateral esq
    px(20, 4, 1, 3, pal.gogglesFrame);        // lateral dir
    px(12, 6, 3, 1, pal.gogglesFrame);        // base da lente esq
    px(17, 6, 3, 1, pal.gogglesFrame);        // base da lente dir
    px(15, 5, 2, 1, pal.gogglesFrame);        // ponte entre lentes
    // Lentes
    px(12, 5, 3, 1, pal.gogglesLens);
    px(17, 5, 3, 1, pal.gogglesLens);
    // Brilho nas lentes
    px(13, 5, 1, 1, pal.gogglesShine);
    px(18, 5, 1, 1, pal.gogglesShine);

    // Olhos (sérios, avaliando)
    px(14, 8, 1, 1, pal.eye);
    px(18, 8, 1, 1, pal.eye);

    // Sobrancelhas (levemente erguidas — expressão de quem avalia)
    px(13, 7, 2, 1, pal.hairSh);
    px(18, 7, 2, 1, pal.hairSh);

    // Barba curta (mais aparada que a do ferreiro)
    px(13, 10, 6, 2, pal.hair);
    px(13, 12, 6, 1, pal.hairSh);

    // Escudo pequeno na mão esquerda (ele segura como quem inspeciona)
    // Aro dourado, face azul, emblema claro
    px(1, 17, 5, 6, pal.shieldRim);       // aro
    px(2, 18, 3, 4, pal.shieldFace);      // face
    px(2, 18, 3, 1, pal.shieldShade);     // topo escuro
    px(3, 19, 1, 2, pal.shieldEmblem);    // emblema

    // Lápis de marcar peça (na mão direita, atrás do corpo — quase escondido)
    px(25, 22, 1, 4, pal.marker);
    px(25, 22, 1, 1, pal.markerSh);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);

  return frames;
}

export const armorerFrames = makeArmorerFrames();