// src/sprites/scorpion.js
// Escorpião 32x32, 3 frames (idle 0, idle 1, attack).
// Layout: corpo horizontal centro-baixo, pinças à ESQUERDA (frente),
// cauda subindo à DIREITA (atrás), 8 patas laterais.
export function makeScorpionFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  // Paleta
  const shellDark  = '#2a1a10';
  const shell      = '#4a2e1a';   // tom geral do exoesqueleto
  const shellMid   = '#6b4428';   // brilho do dorso
  const shellHi    = '#8a5a35';   // luz superior
  const legDark    = '#1f120a';
  const leg         = '#3a2418';
  const stingDark  = '#7a1010';
  const sting      = '#c93030';
  const stingHi    = '#ff8080';
  const eye        = '#ffd93b';

  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    // Movimento:
    // - idle: cauda balança 1px, patas alternam 1px
    // - attack: cauda erguida, corpo "investindo" 2px pra esquerda
    const isAttack = kind === 'attack';
    const bodyLean = isAttack ? -2 : 0;         // corpo avança
    const tailLift = isAttack ? 4 : (step === 1 ? 1 : 0);
    const legSwap  = step === 1 ? 1 : 0;

    // Sombra no chão
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(15, 29, 13, 3, 0, 0, Math.PI * 2);
    g.fill();

    // ============================================================
    // PATAS (8 patas, saindo dos lados do corpo)
    // 4 de cada lado, cada uma com 2 segmentos (joelho + pé)
    // ============================================================
    // Lado de baixo (visão top-down: patas "inferiores")
    const lowerLegs = [
      { x: 10, y: 24 },
      { x: 13, y: 25 },
      { x: 17, y: 25 },
      { x: 20, y: 24 },
    ];
    lowerLegs.forEach((L, i) => {
      const lx = L.x + bodyLean;
      const offset = (i % 2 === 0 ? legSwap : -legSwap);
      // coxa (sobe)
      px(lx, L.y, 1, 2 + offset, leg);
      // tíbia (desce pro lado)
      px(lx - 1, L.y + 3 + offset, 1, 1, legDark);
    });

    // Lado de cima (patas "superiores")
    const upperLegs = [
      { x: 10, y: 17 },
      { x: 13, y: 16 },
      { x: 17, y: 16 },
      { x: 20, y: 17 },
    ];
    upperLegs.forEach((L, i) => {
      const lx = L.x + bodyLean;
      const offset = (i % 2 === 0 ? -legSwap : legSwap);
      px(lx, L.y - 1 + offset, 1, 1, leg);       // fêmur
      px(lx, L.y - 2 + offset, 1, 1, legDark);   // tarso
    });

    // ============================================================
    // CORPO (centro)
    // ============================================================
    // Dorso segmentado (2 segmentos: prossomo + mesossomo)
    // Prossomo (parte da frente, mais à esquerda)
    px(10 + bodyLean, 19, 5, 5, shell);
    px(10 + bodyLean, 19, 5, 1, shellHi);     // brilho superior
    px(10 + bodyLean, 23, 5, 1, shellDark);   // sombra inferior
    // Divisão entre segmentos
    px(14 + bodyLean, 19, 1, 5, shellDark);
    // Mesossomo (traseira, mais à direita)
    px(15 + bodyLean, 18, 6, 7, shell);
    px(15 + bodyLean, 18, 6, 1, shellHi);
    px(15 + bodyLean, 24, 6, 1, shellDark);
    // Brilho central (dá volume)
    px(17 + bodyLean, 20, 2, 3, shellMid);

    // ============================================================
    // CABEÇA (prossomo dianteiro, à esquerda do corpo)
    // ============================================================
    px(8 + bodyLean, 20, 2, 3, shellMid);
    px(8 + bodyLean, 20, 2, 1, shellHi);

    // Olhos (2 pontinhos amarelos na frente da cabeça)
    px(7 + bodyLean, 20, 1, 1, eye);
    px(7 + bodyLean, 22, 1, 1, eye);

    // ============================================================
    // PINÇAS (pedipalpos) ? bem separadas na frente, à esquerda
    // Formato: braço curto + "mão" com 2 dedos ABERTOS
    // ============================================================
    // Pinça SUPERIOR (mais alta)
    // Braço
    px(6 + bodyLean, 18, 2, 2, shell);
    px(6 + bodyLean, 18, 2, 1, shellHi);
    // "Mão" (2 dedos)
    px(4 + bodyLean, 16, 3, 2, shell);       // parte larga
    px(4 + bodyLean, 16, 3, 1, shellHi);
    px(3 + bodyLean, 15, 1, 1, shell);       // dedo superior
    px(3 + bodyLean, 18, 1, 1, shell);       // dedo inferior

    // Pinça INFERIOR (mais baixa)
    px(6 + bodyLean, 22, 2, 2, shell);
    px(6 + bodyLean, 22, 2, 1, shellHi);
    px(4 + bodyLean, 23, 3, 2, shell);
    px(4 + bodyLean, 23, 3, 1, shellHi);
    px(3 + bodyLean, 22, 1, 1, shell);
    px(3 + bodyLean, 25, 1, 1, shell);

    // ============================================================
    // CAUDA (metassomo) ? à DIREITA do corpo, subindo em arco
    // 3 segmentos, terminando no ferrão
    // ============================================================
    // Segmento 1 (base, mais largo, sobe do mesossomo)
    px(20 + bodyLean, 17 - tailLift, 3, 3, shell);
    px(20 + bodyLean, 17 - tailLift, 3, 1, shellHi);
    // Segmento 2 (meio)
    px(22 + bodyLean, 14 - tailLift - 1, 3, 3, shell);
    px(22 + bodyLean, 14 - tailLift - 1, 3, 1, shellHi);
    // Segmento 3 (ponta, mais fino, dobra pra baixo-esquerda)
    px(24 + bodyLean, 12 - tailLift - 1, 2, 2, shellMid);

    // Bulbo do ferrão (base arredondada)
    px(24 + bodyLean, 11 - tailLift - 1, 3, 2, shellDark);

    // FERRÃO (vermelho, apontando pra baixo-esquerda, na direção do player)
    px(23 + bodyLean, 10 - tailLift - 1, 2, 2, sting);
    px(22 + bodyLean, 9 - tailLift - 1, 1, 1, stingHi);   // pontinha brilhante
    px(24 + bodyLean, 9 - tailLift - 1, 1, 1, stingDark); // base do ferrão

    // Detalhe: pequenos "pelos" no dorso
    px(11 + bodyLean, 20, 1, 1, shellHi);
    px(18 + bodyLean, 21, 1, 1, shellHi);

    return c;
  }

  frames.idle[0]   = drawFrame('idle', 0);
  frames.idle[1]   = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);

  return frames;
}