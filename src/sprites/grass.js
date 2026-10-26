export function makeGrassTiles() {
  const S = 20; // Tamanho do tile
  const tiles = [];

  function drawTile(type) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const base = '#3a5a3a';
    const dark = '#2f4a2f';
    const light = '#4a6b4a';

    g.fillStyle = base;
    g.fillRect(0, 0, S, S);

    // Ruído base
    const noise = [
      [2,3], [15,7], [8,12], [4,18], [17,17], [11,4], [7,8], [14,14]
    ];
    g.fillStyle = dark;
    noise.forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    
    g.fillStyle = light;
    noise.reverse().forEach(([x, y]) => g.fillRect(x + 1, y + 1, 1, 1));

    if (type === 'tuft') {
      // Pequenos tufos de capim
      const tufts = [ [4, 5], [14, 10], [8, 16] ];
      g.fillStyle = dark;
      tufts.forEach(([x, y]) => {
        g.fillRect(x, y, 1, 2);
        g.fillRect(x - 1, y - 1, 1, 2);
        g.fillRect(x + 1, y - 1, 1, 2);
      });
    } else if (type === 'flower_blue') {
      const flowers = [ [5, 6], [13, 12] ];
      flowers.forEach(([x, y]) => {
        g.fillStyle = dark;
        g.fillRect(x + 1, y + 2, 1, 2); // Caule
        g.fillStyle = '#70aaeb'; // Azul
        g.fillRect(x, y, 3, 3);
        g.fillStyle = '#dfe23c'; // Miolo amarelo
        g.fillRect(x + 1, y + 1, 1, 1);
      });
    } else if (type === 'flower_pink') {
      const flowers = [ [5, 6], [13, 12] ];
      flowers.forEach(([x, y]) => {
        g.fillStyle = dark;
        g.fillRect(x + 1, y + 2, 1, 2);
        g.fillStyle = '#eb70c9'; // Rosa
        g.fillRect(x, y, 3, 3);
        g.fillStyle = '#ffffff'; // Miolo branco
        g.fillRect(x + 1, y + 1, 1, 1);
      });
    } else if (type === 'flower_yellow') {
      const flowers = [ [5, 6], [13, 12] ];
      flowers.forEach(([x, y]) => {
        g.fillStyle = dark;
        g.fillRect(x + 1, y + 2, 1, 2);
        g.fillStyle = '#feca57'; // Amarelo
        g.fillRect(x, y, 3, 3);
        g.fillStyle = '#ff9f43'; // Miolo laranja
        g.fillRect(x + 1, y + 1, 1, 1);
      });
    }

    return c;
  }

  tiles[0] = drawTile('plain');
  tiles[1] = drawTile('tuft');
  tiles[2] = drawTile('flower_blue');
  tiles[3] = drawTile('flower_pink');
  tiles[4] = drawTile('flower_yellow');

  return tiles;
}

export const grassTiles = makeGrassTiles();