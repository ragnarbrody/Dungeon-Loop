export function makeTreeFrames() {
  const W = 24, H = 32;
  const frames = [];

  function drawFrame(sway) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const trunk = '#5a3a1e';
    const trunkSh = '#3f2814';
    const leafDark = '#1f4a24';
    const leafMid  = '#2f6b33';
    const leafHi   = '#4f9a4a';
    const leafTop  = '#6fbd63';

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath();
    g.ellipse(W / 2, H - 2, 8, 3, 0, 0, Math.PI * 2);
    g.fill();

    px(10, 20, 4, 10, trunk);
    px(10, 20, 1, 10, trunkSh);

    g.fillStyle = leafDark;
    g.beginPath();
    g.ellipse(W/2 + sway,     20, 11, 6, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = leafMid;
    g.beginPath();
    g.ellipse(W/2 - 1 + sway, 16, 10, 6, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = leafHi;
    g.beginPath();
    g.ellipse(W/2 + 1 + sway, 11, 7, 5, 0, 0, Math.PI * 2);
    g.fill();

    g.fillStyle = leafTop;
    g.beginPath();
    g.ellipse(W/2 + 2 + sway, 8, 3, 2, 0, 0, Math.PI * 2);
    g.fill();

    px(6 + sway, 16, 1, 1, leafDark);
    px(15 + sway, 14, 1, 1, leafDark);
    px(10 + sway, 20, 1, 1, leafDark);
    px(13 + sway, 9, 1, 1, leafMid);

    return c;
  }

  frames[0] = drawFrame(0);
  frames[1] = drawFrame(1);

  return frames;
}

export const treeFrames = makeTreeFrames();