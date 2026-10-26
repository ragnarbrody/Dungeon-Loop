export function makeThiefFrames() {
  const S = 32;
  const frames = { down: [], up: [], left: [], right: [] };

  const pal = {
    skin: '#f2c9a0', skinSh: '#d9a878',
    hood: '#3a2a1e', hoodSh: '#2a1a0e',
    cloth: '#2a2a3e', clothSh: '#1a1a24',
    belt: '#c9a24d', eye: '#e6e64a', // Olhos meio brilhantes
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
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');
      
      // Capa / Roupas leves
      px(8, 14, 16, 10, pal.cloth);
      px(8, 14, 16, 1, '#3a3a50'); // brilho
      px(8, 22, 16, 2, pal.belt);  // cinto de couro

      // Pernas
      pxGround(11, 24 + legL, 4, 6, pal.clothSh);
      pxGround(17, 24 + legR, 4, 6, pal.clothSh);
      pxGround(11, 28 + legL, 4, 2, pal.hood); // botas
      pxGround(17, 28 + legR, 4, 2, pal.hood);

      // Braços
      px(7, 15, 3, 8, pal.cloth);
      px(22, 15, 3, 8, pal.cloth);
      px(7, 22, 3, 2, pal.skinSh); // mãos
      px(22, 22, 3, 2, pal.skinSh);

      // Cabeça (com capuz)
      px(11, 6, 10, 8, pal.skin); // Rosto
      px(10, 4, 12, 4, pal.hood); // Topo do capuz
      px(10, 8, 2, 6, pal.hood);  // Lado esq do capuz
      px(20, 8, 2, 6, pal.hood);  // Lado dir do capuz
      px(11, 12, 10, 2, pal.hoodSh); // Abaixo do queixo

      // Máscara (cobre a boca)
      px(12, 10, 8, 2, pal.clothSh);
      
      // Olhos
      px(13, 8, 2, 1, pal.eye);
      px(17, 8, 2, 1, pal.eye);
    }

    function bodyBack() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');
      // Costas (tudo capuz e capa)
      px(8, 14, 16, 12, pal.cloth);
      px(8, 14, 16, 1, '#3a3a50');
      px(9, 22, 14, 2, pal.belt);
      
      // Pernas
      pxGround(11, 26 + legL, 4, 4, pal.clothSh);
      pxGround(17, 26 + legR, 4, 4, pal.clothSh);
      pxGround(11, 28 + legL, 4, 2, pal.hood);
      pxGround(17, 28 + legR, 4, 2, pal.hood);

      // Cabeça (só capuz)
      px(10, 4, 12, 10, pal.hood);
      px(10, 12, 12, 2, pal.hoodSh);
    }

    function bodySide() {
      pxGround(11, 30, 10, 1, 'rgba(0,0,0,0.25)');
      // Roupas
      px(11, 14, 10, 10, pal.cloth);
      px(12, 22, 8, 2, pal.belt);
      // Pernas
      pxGround(13, 24 + legL, 4, 6, pal.clothSh);
      pxGround(17, 24 + legR, 4, 6, pal.clothSh);
      pxGround(13, 28 + legL, 4, 2, pal.hood);
      pxGround(17, 28 + legR, 4, 2, pal.hood);
      // Braço
      px(19, 15, 3, 8, pal.cloth);
      px(19, 22, 3, 2, pal.skinSh);
      // Cabeça
      px(14, 6, 8, 8, pal.skin);
      px(12, 4, 10, 6, pal.hood);
      px(12, 8, 2, 6, pal.hood); // capuz trás
      px(19, 8, 2, 1, pal.eye);
      // Máscara
      px(17, 10, 4, 2, pal.clothSh);
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

export const thiefFrames = makeThiefFrames();