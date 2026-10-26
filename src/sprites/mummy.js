// src/sprites/mummy.js
// Múmia 32x32, 2 frames idle (leve sway) + 1 attack (braços pra frente).
// Humanoide envolto em bandagens, olhos brilhantes.
export function makeMummyFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  // Paleta ? bandagens em tons de bege/amarelo envelhecido
  const wrap     = '#c8b896';   // bandagem base
  const wrapSh   = '#9a8a6a';   // bandagem sombra
  const wrapHi   = '#e0d4b0';   // bandagem brilho
  const wrapOld  = '#7a6a4a';   // bandagem "velha" (manchas)
  const eye      = '#e8b830';   // olhos brilhantes (fogo)
  const eyeHi    = '#fff0a0';   // brilho dos olhos
  const skinDark = '#6a5a40';   // "pele" entre as bandagens (podre)

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
    const sway    = step === 1 && !isAttack ? 1 : 0;
    const armOut  = isAttack ? 3 : 0;
    const headLean = isAttack ? 1 : 0;

    // Sombra no chão
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.beginPath();
    g.ellipse(16, 30, 11, 3, 0, 0, Math.PI * 2);
    g.fill();

    // ============================================================
    // PERNAS (envoltas em bandagem, esfarrapadas)
    // ============================================================
    px(11 + sway, 24, 4, 5, wrap);
    px(17 + sway, 24, 4, 5, wrap);
    px(11 + sway, 24, 4, 1, wrapHi);
    px(17 + sway, 24, 4, 1, wrapHi);
    // Tiras soltas embaixo (a múmia "arrasta")
    px(11 + sway, 29, 4, 1, wrapSh);
    px(17 + sway, 29, 4, 1, wrapSh);
    px(10 + sway, 29, 1, 1, wrapOld);
    px(21 + sway, 29, 1, 1, wrapOld);

    // ============================================================
    // CORPO (torso envolto, com tiras "desfiadas")
    // ============================================================
    px(9 + sway, 14, 14, 10, wrap);
    px(9 + sway, 14, 14, 1, wrapHi);
    px(9 + sway, 23, 14, 1, wrapSh);
    // Tiras horizontais (dar impressão de bandagem enrolada)
    px(9 + sway, 16, 14, 1, wrapSh);
    px(9 + sway, 19, 14, 1, wrapSh);
    px(9 + sway, 22, 14, 1, wrapSh);
    // Manchas de "podridão"
    px(12 + sway, 15, 2, 1, wrapOld);
    px(18 + sway, 18, 1, 2, wrapOld);
    px(14 + sway, 21, 1, 1, wrapOld);

    // ============================================================
    // BRAÇOS (na frente no attack, do lado no idle)
    // ============================================================
    if (isAttack) {
      // Braços esticados pra frente (zumbi/múmia)
      px(6 + sway, 15, 3, 6, wrap);
      px(23 + sway, 15, 3, 6, wrap);
      px(6 + sway, 15, 3, 1, wrapHi);
      px(23 + sway, 15, 3, 1, wrapHi);
      // "Mãos" esfarrapadas (descem um pouco)
      px(5 + sway, 21, 4, 2, wrapSh);
      px(24 + sway, 21, 3, 2, wrapSh);
      // Tiras soltas
      px(4 + sway, 23, 2, 1, wrapOld);
      px(26 + sway, 23, 2, 1, wrapOld);
    } else {
      // Braços caídos ao lado
      px(6 + sway, 15, 3, 9, wrap);
      px(23 + sway, 15, 3, 9, wrap);
      px(6 + sway, 15, 3, 1, wrapHi);
      px(23 + sway, 15, 3, 1, wrapHi);
      // Tira solta na altura do pulso
      px(6 + sway, 22, 3, 1, wrapSh);
      px(23 + sway, 22, 3, 1, wrapSh);
    }

    // ============================================================
    // CABEÇA (envolta em bandagem, olhos brilhantes)
    // ============================================================
    const hx = 11 + sway + headLean;
    // Cabeça base
    px(hx, 6, 10, 8, wrap);
    px(hx, 6, 10, 1, wrapHi);
    px(hx, 13, 10, 1, wrapSh);
    // Tiras na cabeça
    px(hx, 8, 10, 1, wrapSh);
    px(hx, 11, 10, 1, wrapSh);
    // Manchas
    px(hx + 2, 9, 1, 1, wrapOld);
    px(hx + 7, 12, 1, 1, wrapOld);
    // "Rosto" entre as bandagens (faixa escura)
    px(hx + 1, 9, 8, 2, skinDark);
    // Olhos brilhantes
    px(hx + 2, 9, 1, 2, eye);
    px(hx + 6, 9, 1, 2, eye);
    px(hx + 2, 9, 1, 1, eyeHi);
    px(hx + 6, 9, 1, 1, eyeHi);

    return c;
  }

  frames.idle[0]   = drawFrame('idle', 0);
  frames.idle[1]   = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);

  return frames;
}