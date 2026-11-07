// Líder dos saqueadores — mulher de ombros largos, pele rachada de sol,
// roupas gastas do deserto. Estática (não precisa de frames de ataque).
export function makeWellLeaderFrames() {
  const S = 32;
  const frames = { idle: [] };

  function drawFrame(step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

    const skin    = '#8a5a3a';   // pele queimada de sol
    const skinSh  = '#5a3a22';
    const skinHi  = '#a87a52';
    const cloth   = '#6a4a2a';   // túnica de tecido gasto
    const clothSh = '#4a3018';
    const sash    = '#8a2a2a';   // faixa vermelha na cintura
    const scarf   = '#7a3a2a';   // lenço no pescoço
    const hair    = '#2a1a12';
    const eye     = '#e8d890';

    const bob = step === 1 ? 1 : 0;
    const lean = 0;

    // sombra
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath(); g.ellipse(16, 29, 11, 2.5, 0, 0, Math.PI * 2); g.fill();

    // pernas (calça escura, botas de couro)
    p(12 + lean, 24 + bob, 3, 5, clothSh);
    p(18 + lean, 24 + bob, 3, 5, clothSh);
    p(11 + lean, 28 + bob, 4, 2, '#3a2418');
    p(17 + lean, 28 + bob, 4, 2, '#3a2418');

    // túnica comprida (até os joelhos)
    p(10 + lean, 14 + bob, 12, 12, cloth);
    p(10 + lean, 14 + bob, 12, 1, skinHi);   // topo iluminado
    p(10 + lean, 25 + bob, 12, 1, clothSh);  // barra escura

    // faixa na cintura (vermelha, marcante)
    p(10 + lean, 22 + bob, 12, 2, sash);
    p(10 + lean, 22 + bob, 12, 1, '#a83a3a');

    // braços cruzados (pose de líder, resistente)
    p(8 + lean, 16 + bob, 3, 8, skin);
    p(21 + lean, 16 + bob, 3, 8, skin);
    p(11 + lean, 20 + bob, 10, 2, skin);     // braço cruzado na frente
    p(11 + lean, 20 + bob, 10, 1, skinHi);

    // lenço no pescoço (detalhe)
    p(13 + lean, 13 + bob, 6, 2, scarf);

    // cabeça
    p(11 + lean, 6 + bob, 10, 8, skin);
    p(11 + lean, 6 + bob, 10, 1, skinHi);
    p(11 + lean, 13 + bob, 10, 1, skinSh);

    // cabelo (curto, escuro, puxado pra trás)
    p(10 + lean, 5 + bob, 12, 3, hair);
    p(10 + lean, 8 + bob, 1, 3, hair);
    p(21 + lean, 8 + bob, 1, 3, hair);

    // olhos (firmes, olhando pra frente)
    p(13 + lean, 9 + bob, 2, 1, eye);
    p(17 + lean, 9 + bob, 2, 1, eye);
    p(13 + lean, 9 + bob, 1, 1, '#1a1a0e');
    p(18 + lean, 9 + bob, 1, 1, '#1a1a0e');

    // cicatriz no rosto (detalhe de "quem viveu")
    p(20 + lean, 10 + bob, 1, 2, skinSh);

    // nariz
    p(15 + lean, 11 + bob, 2, 1, skinSh);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);
  return frames;
}
// Seguidor do bando — silhueta mais simples, mesma paleta.
export function makeWellFollowerFrames() {
  const S = 32;
  const frames = { idle: [] };

  function drawFrame(step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

    const skin    = '#7a5030';
    const skinSh  = '#4a3018';
    const cloth   = '#5a3a20';
    const clothSh = '#3a2410';
    const scarf   = '#6a2a1a';
    const eye     = '#d8c880';

    const bob = step === 1 ? 1 : 0;

    // sombra
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath(); g.ellipse(16, 29, 9, 2, 0, 0, Math.PI * 2); g.fill();

    // pernas
    p(13, 24 + bob, 2, 5, clothSh);
    p(17, 24 + bob, 2, 5, clothSh);
    p(12, 28 + bob, 3, 2, '#2a1810');
    p(17, 28 + bob, 3, 2, '#2a1810');

    // túnica
    p(11, 15 + bob, 10, 11, cloth);
    p(11, 15 + bob, 10, 1, skinSh);

    // braços caídos
    p(9, 16 + bob, 2, 7, skin);
    p(21, 16 + bob, 2, 7, skin);

    // lenço
    p(13, 14 + bob, 6, 1, scarf);

    // cabeça
    p(12, 7 + bob, 8, 8, skin);
    p(12, 7 + bob, 8, 1, skinSh);

    // cabelo
    p(11, 6 + bob, 10, 2, '#1a0f08');

    // olhos
    p(14, 10 + bob, 1, 1, eye);
    p(17, 10 + bob, 1, 1, eye);

    return c;
  }

  frames.idle[0] = drawFrame(0);
  frames.idle[1] = drawFrame(1);
  return frames;
}

export const wellFollowerFrames = makeWellFollowerFrames();

export const wellLeaderFrames = makeWellLeaderFrames();