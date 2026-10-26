// src/sprites/vulture.js
// Abutre 32x32, 2 frames idle (asa pra cima / asa pra baixo) + 1 attack (bicada).
// Corpo marrom-escuro, cabeça vermelha, asas abertas.
export function makeVultureFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  // Paleta
  const feather   = '#3a2418';   // marrom-escuro do corpo
  const featherHi = '#5a3a24';   // brilho das penas
  const featherSh = '#1f120a';   // sombra
  const skin      = '#c93030';   // cabeça vermelha (carniça)
  const skinHi    = '#ff6b6b';   // brilho da cabeça
  const skinSh    = '#7a1010';   // sombra da cabeça
  const beak      = '#e8d890';   // bico amarelado
  const beakSh    = '#a89040';
  const eye       = '#feca57';

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
    // - idle 0: asa "no meio" (parada)
    // - idle 1: asa pra baixo (batendo)
    // - attack: corpo inclinado pra frente, cabeça esticada (bicada)
    const isAttack = kind === 'attack';
    const wingDown  = step === 1 && !isAttack;   // asa pra baixo no segundo frame
    const lean      = isAttack ? 2 : 0;          // corpo avança
    const headLean  = isAttack ? 3 : 0;          // cabeça estica
    const headDown  = isAttack ? 1 : 0;          // cabeça baixa (bicada)

    // Sombra no chão (fica mais larga quando a asa tá pra cima ? pássaro pousado)
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    const shadowW = isAttack ? 15 : 13;
    g.ellipse(16 + lean, 29, shadowW, 3, 0, 0, Math.PI * 2);
    g.fill();

    // ============================================================
    // PATAS (2 patinhas amareladas, curtas)
    // ============================================================
    px(13 + lean, 25, 1, 3, beakSh);      // perna esquerda
    px(18 + lean, 25, 1, 3, beakSh);      // perna direita
    px(12 + lean, 28, 3, 1, beakSh);      // pé esq
    px(17 + lean, 28, 3, 1, beakSh);      // pé dir

    // ============================================================
    // CORPO (centro, mais pesado)
    // ============================================================
    px(11 + lean, 16, 10, 9, feather);          // corpo principal
    px(11 + lean, 16, 10, 1, featherHi);        // brilho topo
    px(11 + lean, 24, 10, 1, featherSh);        // sombra base
    px(13 + lean, 18, 6, 5, featherHi);         // peito (mais claro)

    // ============================================================
    // ASAS (dependem do frame)
    // ============================================================
    if (isAttack) {
      // Attack: asas abertas "pra trás" (como se estivesse atacando)
      // Asa esquerda (atrás do corpo)
      px(4 + lean, 14, 6, 8, featherSh);
      px(4 + lean, 14, 6, 1, feather);
      px(3 + lean, 15, 1, 5, featherSh);
      // Asa direita (atrás do corpo)
      px(22 + lean, 14, 6, 8, featherSh);
      px(22 + lean, 14, 6, 1, feather);
      px(28 + lean, 15, 1, 5, featherSh);
    } else if (wingDown) {
      // Asa pra BAIXO: penas penduradas dos lados
      // Asa esquerda
      px(6 + lean, 17, 5, 6, feather);
      px(6 + lean, 17, 5, 1, featherHi);
      px(5 + lean, 20, 1, 3, featherSh);
      // Asa direita
      px(21 + lean, 17, 5, 6, feather);
      px(21 + lean, 17, 5, 1, featherHi);
      px(26 + lean, 20, 1, 3, featherSh);
    } else {
      // Asa pra CIMA: penas um pouco mais altas, "dobradas"
      // Asa esquerda
      px(6 + lean, 13, 5, 6, feather);
      px(6 + lean, 13, 5, 1, featherHi);
      px(5 + lean, 14, 1, 4, featherSh);
      // Asa direita
      px(21 + lean, 13, 5, 6, feather);
      px(21 + lean, 13, 5, 1, featherHi);
      px(26 + lean, 14, 1, 4, featherSh);
    }

    // Detalhe: "penas" soltas na ponta das asas
    if (!isAttack) {
      const tipY = wingDown ? 22 : 18;
      px(7 + lean, tipY, 1, 1, featherSh);
      px(9 + lean, tipY + 1, 1, 1, featherSh);
      px(22 + lean, tipY, 1, 1, featherSh);
      px(24 + lean, tipY + 1, 1, 1, featherSh);
    }

    // ============================================================
    // CABEÇA (vermelha, pescoço curto, bico amarelado)
    // ============================================================
    const hx = 13 + lean + headLean;
    const hy = 10 + headDown;

    // Pescoço (sai do corpo pra frente)
    px(hx - 1, hy + 5, 3, 2, featherSh);

    // Cabeça vermelha (mais à frente e pra cima)
    px(hx, hy, 5, 5, skin);
    px(hx, hy, 5, 1, skinHi);         // brilho superior
    px(hx, hy + 4, 5, 1, skinSh);     // sombra inferior
    px(hx + 1, hy + 1, 3, 1, skinHi); // brilho extra

    // Olho
    px(hx + 1, hy + 2, 1, 1, eye);

    // Bico (2 pixels, amarelado, apontando pra esquerda)
    px(hx - 2, hy + 2, 2, 1, beak);
    px(hx - 3, hy + 2, 1, 1, beakSh);   // ponta
    px(hx - 2, hy + 3, 1, 1, beakSh);   // parte de baixo do bico

    // Detalhe: "careca" (abutres têm cabeça sem pena) ? pequeno brilho
    px(hx + 2, hy + 1, 2, 1, skinHi);

    return c;
  }

  frames.idle[0]   = drawFrame('idle', 0);   // asa em cima
  frames.idle[1]   = drawFrame('idle', 1);   // asa em baixo
  frames.attack[0] = drawFrame('attack', 0);

  return frames;
}