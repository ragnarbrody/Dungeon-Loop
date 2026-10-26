export function makeMageFrames() {
  const S = 32;
  const frames = { down: [], up: [], left: [], right: [] };

  const pal = {
    skin: '#f2c9a0', skinSh: '#d9a878',
    hair: '#e8e8e8', hairSh: '#c0c0c0', // Cabelo/barba branca
    robe: '#4a2a8a', robeSh: '#2a1a5a', robeHi: '#6a4aaa',
    belt: '#c9a24d', boot: '#3a2b1e', eye: '#111',
  };

  function drawFrame(dir, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const bob = step === 1 ? -1 : 0;
    const legL = step === 1 ? -1 : 0;
    const legR = step === 1 ?  1 : 0;

    const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y + bob, w, h); };
    const pxGround = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    function bodyFront() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)'); // sombra
      // Manto (Robe) longo
      px(8, 14, 16, 16, pal.robe);
      px(8, 14, 16, 2, pal.robeHi); // brilho topo
      px(8, 28, 16, 2, pal.robeSh); // sombra base
      px(9, 22, 14, 2, pal.belt);   // cinto
      
      // Pernas (botas)
      pxGround(11, 26 + legL, 4, 4, pal.boot);
      pxGround(17, 26 + legR, 4, 4, pal.boot);

      // Braços (mangas)
      px(7, 15, 3, 10, pal.robeSh);
      px(22, 15, 3, 10, pal.robeSh);
      px(7, 24, 3, 2, pal.skinSh); // mãos
      px(22, 24, 3, 2, pal.skinSh);

      // Cabeça / Rosto
      px(12, 6, 8, 8, pal.skin);
      // Olhos
      px(13, 9, 1, 2, pal.eye);
      px(18, 9, 1, 2, pal.eye);
      // Barba
      px(12, 12, 8, 3, pal.hair);
      px(13, 11, 6, 1, pal.hairSh);
      
      // Chapéu Pontudo
      px(11, 4, 10, 2, pal.robe);       // aba
      px(13, 2, 6, 2, pal.robe);        // topo
      px(15, 0, 2, 2, pal.robeHi);      // ponta
      px(12, 4, 8, 1, pal.robeSh);      // sombra aba
    }

    function bodyBack() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');
      // Manto longo
      px(8, 14, 16, 16, pal.robe);
      px(8, 14, 16, 2, pal.robeHi);
      px(9, 22, 14, 2, pal.belt);
      // Braços
      px(7, 15, 3, 8, pal.robeSh);
      px(22, 15, 3, 8, pal.robeSh);
      // Cabeça (de costas com cabelo)
      px(12, 6, 8, 8, pal.skinSh);
      px(11, 8, 10, 6, pal.hair);
      // Chapéu
      px(11, 4, 10, 2, pal.robe);
      px(13, 2, 6, 2, pal.robe);
      px(15, 0, 2, 2, pal.robeHi);
    }

    function bodySide() {
      pxGround(11, 30, 10, 1, 'rgba(0,0,0,0.25)');
      // Manto
      px(11, 14, 10, 16, pal.robe);
      px(11, 14, 10, 2, pal.robeHi);
      px(12, 22, 8, 2, pal.belt);
      // Pernas
      pxGround(13, 26 + legL, 4, 4, pal.boot);
      pxGround(17, 26 + legR, 4, 4, pal.boot);
      // Braço
      px(19, 15, 3, 10, pal.robeSh);
      px(19, 24, 3, 2, pal.skinSh);
      // Cabeça de perfil
      px(14, 6, 8, 8, pal.skin);
      px(20, 9, 1, 2, pal.eye);
      // Barba
      px(18, 12, 4, 3, pal.hair);
      // Chapéu de perfil
      px(12, 4, 10, 2, pal.robe);
      px(16, 2, 6, 2, pal.robe);
      px(20, 0, 2, 2, pal.robeHi);
    }

    if (dir === 'down') bodyFront();
    if (dir === 'up') bodyBack();
    if (dir === 'right') bodySide();
    if (dir === 'left') {
      bodySide();
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

  for (const dir of ['down', 'up', 'left', 'right']) {
    frames[dir][0] = drawFrame(dir, 0);
    frames[dir][1] = drawFrame(dir, 1);
  }

  return frames;
}

export const mageFrames = makeMageFrames();