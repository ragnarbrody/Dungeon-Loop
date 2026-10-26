// ---------- Sprite da cavaleira ----------
// Cria 4 frames 32x32 desenhando em canvas offscreen.
export function makeKnightessFrames() {
  const S = 32;
  const frames = { down: [], up: [], left: [], right: [] };

  // paleta (fora da função de frame, pra não repetir)
  const pal = {
    skin: '#f2c9a0', skinSh: '#d9a878',
    hair: '#b33a3a', hairSh: '#8c2b2b',
    armor: '#c0c8d0', armorSh: '#8892a0', armorHi: '#e8eef4',
    cape: '#2f6db5', capeSh: '#1f4f8a',
    boots: '#3a2b1e', eyeDark: '#222',
  };

  function drawFrame(dir, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    // "bob" = 1px pra cima no passo; pernas alternam
    const bob = step === 1 ? -1 : 0;
    // perna esquerda/direita avançam alternadamente no frame de passo
    const legL = step === 1 ? -1 : 0;
    const legR = step === 1 ?  1 : 0;

    function px(x, y, w, h, color) {
      g.fillStyle = color;
      g.fillRect(x, y + bob, w, h);
    }
    // versão sem bob (para pernas e sombra, que ficam "no chão")
    function pxGround(x, y, w, h, color) {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    }

    // ---- corpo frontal ----
    function bodyFront() {
      // sombra no chão
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');

      // capa
      px(7, 14, 18, 12, pal.cape);
      px(7, 14, 18, 2, pal.capeSh);

      // pernas (com offset por passo)
      pxGround(11, 24 + legL, 4, 6, pal.armorSh);
      pxGround(17, 24 + legR, 4, 6, pal.armorSh);
      pxGround(11, 28 + legL, 4, 2, pal.boots);
      pxGround(17, 28 + legR, 4, 2, pal.boots);

      // torso
      px(10, 14, 12, 10, pal.armor);
      px(10, 14, 12, 1, pal.armorHi);
      px(10, 22, 12, 2, pal.armorSh);
      px(10, 21, 12, 1, '#6b4a2b');

      // braços
      px(8, 15, 3, 8, pal.armorSh);
      px(21, 15, 3, 8, pal.armorSh);
      px(8, 22, 3, 2, pal.skinSh);
      px(21, 22, 3, 2, pal.skinSh);

      // pescoço
      px(14, 12, 4, 2, pal.skinSh);

      // cabeça
      px(11, 5, 10, 8, pal.skin);
      px(10, 3, 12, 4, pal.hair);
      px(10, 7, 2, 4, pal.hair);
      px(20, 7, 2, 4, pal.hair);
      px(10, 5, 12, 1, pal.hairSh);

      px(13, 9, 1, 2, pal.eyeDark);
      px(18, 9, 1, 2, pal.eyeDark);
      px(15, 12, 2, 1, pal.skinSh);
    }

    // ---- corpo de costas ----
    function bodyBack() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');

      px(7, 12, 18, 16, pal.cape);
      px(7, 12, 18, 2, pal.capeSh);
      px(7, 26, 18, 2, pal.capeSh);

      px(8, 14, 3, 4, pal.armorSh);
      px(21, 14, 3, 4, pal.armorSh);

      pxGround(11, 26 + legL, 4, 4, pal.armorSh);
      pxGround(17, 26 + legR, 4, 4, pal.armorSh);
      pxGround(11, 28 + legL, 4, 2, pal.boots);
      pxGround(17, 28 + legR, 4, 2, pal.boots);

      px(11, 5, 10, 8, pal.skinSh);
      px(10, 3, 12, 10, pal.hair);
      px(10, 10, 12, 2, pal.hairSh);
    }

    // ---- corpo de perfil (virado para DIREITA) ----
    function bodySide() {
      pxGround(11, 30, 10, 1, 'rgba(0,0,0,0.25)');

      px(10, 14, 10, 12, pal.cape);
      px(10, 14, 10, 2, pal.capeSh);

      pxGround(13, 24 + legL, 4, 6, pal.armorSh);
      pxGround(17, 24 + legR, 4, 6, pal.armorSh);
      pxGround(13, 28 + legL, 4, 2, pal.boots);
      pxGround(17, 28 + legR, 4, 2, pal.boots);

      px(12, 14, 10, 10, pal.armor);
      px(12, 14, 10, 1, pal.armorHi);
      px(12, 22, 10, 2, pal.armorSh);

      px(19, 15, 3, 8, pal.armorSh);
      px(19, 22, 3, 2, pal.skinSh);

      px(17, 12, 3, 2, pal.skinSh);

      px(14, 5, 8, 8, pal.skin);
      px(12, 3, 10, 4, pal.hair);
      px(12, 7, 2, 5, pal.hair);
      px(21, 6, 2, 6, pal.hair);
      px(12, 5, 12, 1, pal.hairSh);
      px(19, 9, 1, 2, pal.eyeDark);
      px(20, 12, 1, 1, pal.skinSh);
    }

    if (dir === 'down')  bodyFront();
    if (dir === 'up')    bodyBack();
    if (dir === 'right') bodySide();
    if (dir === 'left') {
      bodySide();
      // flip horizontal
      const flipped = document.createElement('canvas');
      flipped.width = S; flipped.height = S;
      const fg = flipped.getContext('2d');
      fg.imageSmoothingEnabled = false;
      fg.translate(S, 0); fg.scale(-1, 1);
      fg.drawImage(c, 0, 0);
      return flipped;
    }

    return c;
  }

  // gera 2 frames por direção
  for (const dir of ['down', 'up', 'left', 'right']) {
    frames[dir][0] = drawFrame(dir, 0); // idle
    frames[dir][1] = drawFrame(dir, 1); // passo
  }

  return frames;
}

export const knightessFrames = makeKnightessFrames();