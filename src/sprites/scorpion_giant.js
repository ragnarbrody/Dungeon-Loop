// src/sprites/scorpion_giant.js
// Escorpião Gigante 48x48. Boss de dungeon do deserto.
// Reusa a lógica do scorpion comum, mas com carapaça mais escura,
// ferrão maior, olhos maiores e "coroa" de placas no dorso.
export function makeScorpionGiantFrames() {
  const S = 48;
  const frames = { idle: [], attack: [] };

  // Paleta (mais escura, mais "de boss")
  const shellDark  = '#1a0e06';
  const shell      = '#3a1f10';
  const shellMid   = '#5a3018';
  const shellHi    = '#7a4022';
  const shellEdge  = '#9a5a30';   // brilho do dorso
  const vein       = '#c93030';   // veios vermelhos (magia)
  const veinHi     = '#ff7a3b';
  const legDark    = '#100804';
  const leg        = '#28140a';
  const stingDark  = '#5a0808';
  const sting      = '#c93030';
  const stingHi    = '#ff8080';
  const eye        = '#ffe24a';
  const eyeGlow    = 'rgba(255, 220, 60, 0.5)';
  const plateEdge  = '#8a4a20';

  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    // Movimento
    const isAttack = kind === 'attack';
    const bodyLean = isAttack ? -3 : 0;
    const tailLift = isAttack ? 6 : (step === 1 ? 2 : 0);
    const legSwap  = step === 1 ? 1 : 0;

    // Sombra no chão
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(23, 44, 19, 4, 0, 0, Math.PI * 2);
    g.fill();

    // ============================================================
    // PATAS (8 patas maiores, mais grossas)
    // ============================================================
    // Lado de baixo
    const lowerLegs = [
      { x: 14, y: 36 },
      { x: 19, y: 38 },
      { x: 25, y: 38 },
      { x: 30, y: 36 },
    ];
    lowerLegs.forEach((L, i) => {
      const lx = L.x + bodyLean;
      const offset = (i % 2 === 0 ? legSwap : -legSwap);
      // coxa (2px de largura)
      px(lx, L.y, 2, 2 + offset, leg);
      px(lx, L.y, 2, 1, shellShade(leg));
      // tíbia (pro lado)
      px(lx - 1, L.y + 3 + offset, 2, 1, legDark);
      // pé (ponto)
      px(lx - 1, L.y + 4 + offset, 1, 1, legDark);
    });

    // Lado de cima
    const upperLegs = [
      { x: 14, y: 24 },
      { x: 19, y: 22 },
      { x: 25, y: 22 },
      { x: 30, y: 24 },
    ];
    upperLegs.forEach((L, i) => {
      const lx = L.x + bodyLean;
      const offset = (i % 2 === 0 ? -legSwap : legSwap);
      px(lx, L.y - 1 + offset, 2, 1, leg);
      px(lx, L.y - 2 + offset, 2, 1, legDark);
      px(lx + 1, L.y - 3 + offset, 1, 1, legDark);
    });

    // ============================================================
    // CORPO (2 segmentos)
    // ============================================================
    // Prossomo (frente)
    px(14 + bodyLean, 26, 8, 8, shell);
    px(14 + bodyLean, 26, 8, 1, shellHi);
    px(14 + bodyLean, 33, 8, 1, shellDark);
    // Brilho central
    px(15 + bodyLean, 28, 6, 3, shellMid);
    // Placa de "coroa" (boss indicator)
    px(16 + bodyLean, 27, 4, 2, plateEdge);
    px(17 + bodyLean, 27, 2, 1, shellHi);
    // Veios vermelhos (magia)
    px(15 + bodyLean, 30, 1, 1, vein);
    px(18 + bodyLean, 31, 1, 1, veinHi);
    px(19 + bodyLean, 29, 1, 1, vein);

    // Mesossomo (traseira)
    px(21 + bodyLean, 25, 9, 10, shell);
    px(21 + bodyLean, 25, 9, 1, shellHi);
    px(21 + bodyLean, 34, 9, 1, shellDark);
    // Divisão
    px(20 + bodyLean, 26, 1, 8, shellDark);
    // Brilho
    px(24 + bodyLean, 28, 4, 5, shellMid);
    // Veios
    px(23 + bodyLean, 30, 1, 2, vein);
    px(26 + bodyLean, 29, 1, 1, veinHi);
    px(27 + bodyLean, 32, 1, 1, vein);

    // ============================================================
    // CABEÇA (na frente, à esquerda)
    // ============================================================
    px(10 + bodyLean, 28, 4, 5, shellMid);
    px(10 + bodyLean, 28, 4, 1, shellHi);
    px(10 + bodyLean, 32, 4, 1, shellDark);

    // Olhos grandes com glow
    g.fillStyle = eyeGlow;
    g.beginPath();
    g.arc(9 + bodyLean, 29, 3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(9 + bodyLean, 32, 3, 0, Math.PI * 2);
    g.fill();
    px(9 + bodyLean, 28, 2, 2, eye);
    px(9 + bodyLean, 32, 2, 2, eye);
    // Brilho no olho
    px(9 + bodyLean, 28, 1, 1, '#ffffff');
    px(9 + bodyLean, 32, 1, 1, '#ffffff');

    // ============================================================
    // PINÇAS (maiores, com "dentes" na parte de dentro)
    // ============================================================
    // Pinça superior
    px(7 + bodyLean, 24, 3, 3, shell);
    px(7 + bodyLean, 24, 3, 1, shellHi);
    // "Mão"
    px(3 + bodyLean, 22, 5, 3, shell);
    px(3 + bodyLean, 22, 5, 1, shellHi);
    px(3 + bodyLean, 24, 5, 1, shellDark);
    // Dedos
    px(1 + bodyLean, 21, 2, 1, shell);
    px(1 + bodyLean, 25, 2, 1, shell);
    px(2 + bodyLean, 23, 1, 1, plateEdge);   // "dente"
    // Brilho na pinça
    px(4 + bodyLean, 23, 2, 1, shellEdge);

    // Pinça inferior
    px(7 + bodyLean, 31, 3, 3, shell);
    px(7 + bodyLean, 31, 3, 1, shellHi);
    // "Mão"
    px(3 + bodyLean, 33, 5, 3, shell);
    px(3 + bodyLean, 33, 5, 1, shellHi);
    px(3 + bodyLean, 35, 5, 1, shellDark);
    // Dedos
    px(1 + bodyLean, 32, 2, 1, shell);
    px(1 + bodyLean, 36, 2, 1, shell);
    px(2 + bodyLean, 34, 1, 1, plateEdge);
    // Brilho
    px(4 + bodyLean, 34, 2, 1, shellEdge);

    // ============================================================
    // CAUDA (mais grossa, com 4 segmentos + ferrão maior)
    // ============================================================
    // Segmento 1 (base)
    px(30 + bodyLean, 24 - tailLift, 5, 4, shell);
    px(30 + bodyLean, 24 - tailLift, 5, 1, shellHi);
    // Segmento 2
    px(33 + bodyLean, 19 - tailLift, 4, 4, shell);
    px(33 + bodyLean, 19 - tailLift, 4, 1, shellHi);
    // Segmento 3
    px(35 + bodyLean, 15 - tailLift, 4, 3, shellMid);
    px(35 + bodyLean, 15 - tailLift, 4, 1, shellHi);
    // Segmento 4 (fino)
    px(37 + bodyLean, 12 - tailLift, 3, 3, shellMid);

    // Bulbo do ferrão (maior)
    px(36 + bodyLean, 10 - tailLift, 5, 3, shellDark);
    px(37 + bodyLean, 10 - tailLift, 3, 1, plateEdge);

    // Veios vermelhos no bulbo
    px(37 + bodyLean, 11 - tailLift, 1, 1, vein);
    px(39 + bodyLean, 11 - tailLift, 1, 1, veinHi);

    // FERRÃO (grande, brilhante, apontando pra baixo-esquerda)
    px(35 + bodyLean, 8 - tailLift, 3, 3, sting);
    px(34 + bodyLean, 7 - tailLift, 2, 2, stingHi);
    px(33 + bodyLean, 6 - tailLift, 1, 2, stingDark);
    // Pontinha
    px(33 + bodyLean, 5 - tailLift, 1, 1, stingHi);
    // Brilho
    px(35 + bodyLean, 8 - tailLift, 1, 1, '#ffffff');

    // Detalhes: "pelos" e veios pelo dorso
    px(16 + bodyLean, 29, 1, 1, shellEdge);
    px(26 + bodyLean, 27, 1, 1, shellEdge);
    px(28 + bodyLean, 31, 1, 1, shellEdge);

    return c;
  }

  // Helper: tom ligeiramente mais claro (só pra dar volume nas pernas)
  function shellShade(c) {
    return c;   // simplificação — o original não tem shade, mantém
  }

  frames.idle[0]   = drawFrame('idle', 0);
  frames.idle[1]   = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);

  return frames;
}