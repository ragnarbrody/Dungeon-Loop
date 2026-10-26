// Cacto 24x32 no mesmo estilo das árvores (para o tile alinhar bonito).
// Dois frames para dar um "balanço" sutil no topo.
export function makeCactusFrames() {
  const W = 24, H = 32;
  const frames = [];

  function drawFrame(sway) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const bodyDark  = '#2f6b2f';
    const bodyMid   = '#3f8a3f';
    const bodyHi    = '#5aa85a';
    const spike     = '#2a4a2a';
    const flowerPink = '#ff7bd0';
    const flowerYellow = '#feca57';

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    // Sombra no chão (igual das árvores)
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath();
    g.ellipse(W / 2, H - 2, 8, 3, 0, 0, Math.PI * 2);
    g.fill();

    // Corpo principal (tronco vertical)
    // O sway desloca levemente o topo
    // Base x = 10..14 (5 px de largura)
    px(10, 12, 4, 18, bodyMid);
    px(10, 12, 1, 18, bodyDark);   // sombra lateral esq
    px(13, 12, 1, 18, bodyDark);   // sombra lateral dir
    px(11, 12, 2, 18, bodyHi);     // brilho central (faz parecer cilindro)
    // Base mais escura (dá peso)
    px(10, 28, 4, 2, bodyDark);

    // Braço esquerdo (mais baixo)
    // Sobe da lateral esq e dobra pra cima
    px(6, 16, 4, 8, bodyMid);       // parte horizontal do braço
    px(6, 16, 1, 8, bodyDark);
    px(6, 16, 4, 1, bodyDark);
    px(6 + sway * 0.3, 10, 4, 7, bodyMid); // parte vertical (sobe)
    px(6 + sway * 0.3, 10, 1, 7, bodyDark);

    // Braço direito (mais alto)
    px(14, 18, 4, 7, bodyMid);
    px(17, 18, 1, 7, bodyDark);
    px(14, 18, 4, 1, bodyDark);
    px(14 - sway * 0.3, 12, 4, 6, bodyMid);
    px(14 - sway * 0.3, 12, 1, 6, bodyDark);

    // Espinhos (pontinhos escuros no corpo)
    const spikes = [
      [9, 15], [14, 16], [9, 20], [14, 21], [9, 25], [14, 26],
      [5, 14], [5, 19], [18, 16], [18, 22],
    ];
    g.fillStyle = spike;
    spikes.forEach(([x, y]) => g.fillRect(x, y, 1, 1));

    // Flor no topo (vermelha ou amarela) - usa sway pra "balançar"
    const flowerColor = (W + sway) % 2 === 0 ? flowerPink : flowerYellow;
    px(10 + sway, 9, 4, 3, flowerColor);
    px(11 + sway, 8, 2, 1, flowerColor);

    return c;
  }

  frames[0] = drawFrame(0);
  frames[1] = drawFrame(1);

  return frames;
}

export const cactusFrames = makeCactusFrames();