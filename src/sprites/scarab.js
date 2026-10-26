// src/sprites/scarab.js
// Escaravelho 32x32, vista FRONTAL (3/4).
// 2 frames idle (pernas andando) + 1 attack (chifres pra frente).
// Inspirado no scarab do Barony: corpo arredondado, chifres frontais,
// pernas laterais grossas, marrom-escuro com detalhes dourados.
export function makeScarabFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  // Paleta
  const shell     = '#3a2418';   // marrom-escuro do casco
  const shellSh   = '#1f120a';   // sombra profunda
  const shellHi   = '#5a3a24';   // brilho do casco
  const shellMid  = '#4a2e1a';   // tom intermediário
  const gold      = '#c9a24d';   // detalhe dourado
  const goldHi    = '#f0d27a';   // brilho dourado
  const goldSh    = '#8a6b2a';   // sombra dourada
  const leg       = '#1a0f08';   // pernas (quase preto)
  const legHi     = '#3a2418';   // brilho das pernas
  const horn      = '#2a1a10';   // chifres (bem escuros)
  const hornHi    = '#4a2e1a';   // brilho dos chifres
  const eye       = '#ffd93b';   // olhos amarelos brilhantes
  const eyeDark   = '#7a5a10';   // contorno dos olhos

  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    const isAttack = kind === 'attack';
    const legSwap  = step === 1 ? 1 : 0;
    const headLift = isAttack ? -2 : 0;   // cabeça sobe (chifres pra frente)
    const bodyLean = isAttack ? -1 : 0;   // corpo "inclina" pra frente

    // Sombra no chão (oval achatada, embaixo do besouro)
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath();
    g.ellipse(16, 29, 12, 3, 0, 0, Math.PI * 2);
    g.fill();

    // ============================================================
    // PERNAS (6 pernas, 3 de cada lado, saindo do corpo pra fora e pra baixo)
    // ============================================================
    // Lado ESQUERDO (3 pernas)
    const leftLegs = [
      { x: 7,  y: 18, off: -legSwap },
      { x: 6,  y: 22, off:  legSwap },
      { x: 8,  y: 25, off: -legSwap },
    ];
    leftLegs.forEach((L) => {
      // Fêmur (do corpo pra fora)
      px(L.x + 2, L.y, 2, 1, leg);
      // Tíbia (desce)
      px(L.x, L.y + 1, 1, 2 + Math.max(0, L.off), leg);
      // Brilho
      px(L.x + 2, L.y, 1, 1, legHi);
    });

    // Lado DIREITO (3 pernas, espelhado)
    const rightLegs = [
      { x: 24, y: 18, off:  legSwap },
      { x: 25, y: 22, off: -legSwap },
      { x: 23, y: 25, off:  legSwap },
    ];
    rightLegs.forEach((L) => {
      px(L.x - 2, L.y, 2, 1, leg);
      px(L.x + 1, L.y + 1, 1, 2 + Math.max(0, -L.off), leg);
      px(L.x - 1, L.y, 1, 1, legHi);
    });

    // ============================================================
    // CORPO (oval, visto de frente ? mais largo que alto)
    // ============================================================
    const cx = 16;
    const cy = 19 + bodyLean;

    // Corpo principal (oval)
    // Desenha como retângulo arredondado "manual" em pixels
    // Topo (linha arredondada)
    px(cx - 5, cy - 5, 10, 1, shell);       // topo reto
    px(cx - 6, cy - 4, 1, 1, shell);        // canto sup esq
    px(cx + 5, cy - 4, 1, 1, shell);        // canto sup dir
    // Corpo (linhas centrais)
    px(cx - 7, cy - 3, 14, 8, shell);       // corpo principal
    // Base arredondada
    px(cx - 6, cy + 5, 12, 1, shell);
    px(cx - 5, cy + 6, 10, 1, shellSh);

    // Brilho (topo do corpo)
    px(cx - 5, cy - 5, 10, 1, shellHi);
    px(cx - 7, cy - 3, 14, 1, shellHi);
    // Sombra inferior
    px(cx - 7, cy + 4, 14, 1, shellSh);
    px(cx - 6, cy + 5, 12, 1, shellSh);

    // Volume central (brilho que dá "curvatura" ao casco)
    px(cx - 3, cy - 2, 6, 4, shellMid);
    px(cx - 2, cy - 1, 4, 2, shellHi);

    // ============================================================
    // DETALHE DOURADO ? linha vertical central + "asas" em V
    // ============================================================
    // Linha vertical central (do meio da cabeça até a base do corpo)
    px(cx, cy - 4, 1, 8, gold);
    // Pequenos detalhes laterais (marcas nas "élitros")
    px(cx - 4, cy - 1, 1, 2, gold);
    px(cx + 3, cy - 1, 1, 2, gold);
    // Brilho no centro
    px(cx, cy - 2, 1, 1, goldHi);
    px(cx, cy + 1, 1, 1, goldHi);
    // Base escura (sombra do detalhe dourado)
    px(cx, cy + 3, 1, 1, goldSh);

    // ============================================================
    // CABEÇA (no topo-central, vista de frente)
    // ============================================================
    const hx = cx - 3;
    const hy = cy - 9 + headLift;

    // Cabeça (retângulo arredondado)
    px(hx, hy, 6, 5, shell);
    px(hx, hy, 6, 1, shellHi);
    px(hx, hy + 4, 6, 1, shellSh);

    // ============================================================
    // CHIFRES (2 chifres apontando pra frente/cima, marca do scarab)
    // ============================================================
    // Chifre ESQUERDO (sobe e curva pra frente)
    px(hx - 1, hy - 1, 1, 2, horn);       // base
    px(hx - 2, hy - 2, 1, 1, horn);       // ponta esq
    px(hx - 1, hy - 2, 1, 1, hornHi);     // brilho

    // Chifre DIREITO (espelho)
    px(hx + 6, hy - 1, 1, 2, horn);
    px(hx + 7, hy - 2, 1, 1, horn);
    px(hx + 6, hy - 2, 1, 1, hornHi);

    // Chifre CENTRAL (menor, no meio, apontando pra cima)
    px(hx + 2, hy - 2, 2, 1, horn);
    px(hx + 2, hy - 3, 2, 1, hornHi);

    // ============================================================
    // OLHOS (brilhantes, entre os chifres)
    // ============================================================
    // Olho esquerdo
    px(hx + 1, hy + 1, 1, 2, eyeDark);
    px(hx + 1, hy + 1, 1, 1, eye);
    // Olho direito
    px(hx + 4, hy + 1, 1, 2, eyeDark);
    px(hx + 4, hy + 1, 1, 1, eye);

    // ============================================================
    // DETALHE FINAL ? pontos dourados nas "bochechas" da cabeça
    // ============================================================
    px(hx, hy + 3, 1, 1, goldHi);
    px(hx + 5, hy + 3, 1, 1, goldHi);

    return c;
  }

  frames.idle[0]   = drawFrame('idle', 0);
  frames.idle[1]   = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);

  return frames;
}