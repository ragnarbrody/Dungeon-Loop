export function makeGoblinFrames() {
  const S = 32;
  const frames = { idle: [], attack: [] };

  function drawFrame(kind, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    const skin    = '#5a8a3a';
    const skinSh  = '#3f6528';
    const skinHi  = '#7aa85a';
    const cloth   = '#6b4a2b';
    const clothSh = '#4a3018';
    const eye     = '#e6e64a';
    const eyeDark = '#1a1a0e';
    const tusk    = '#f0e8c8';

    const bob  = (kind === 'idle' && step === 1) ? 1 : 0;
    const lean = kind === 'attack' ? 2 : 0;

    px(9, 30, 14, 1, 'rgba(0,0,0,0.28)');

    px(11 + lean, 26 + bob, 3, 4, skinSh);
    px(18 + lean, 26 + bob, 3, 4, skinSh);

    px(11 + lean, 18 + bob, 10, 9, cloth);
    px(11 + lean, 18 + bob, 10, 1, clothSh);

    px(8  + lean, 19 + bob, 3, 6, skin);
    px(21 + lean, 19 + bob, 3, 6, skin);

    px(10 + lean, 8 + bob, 12, 10, skin);
    px(10 + lean, 17 + bob, 12, 1, skinSh);
    px(11 + lean, 9 + bob, 10, 1, skinHi);

    px(8  + lean, 9 + bob, 2, 3, skin);
    px(22 + lean, 9 + bob, 2, 3, skin);

    px(13 + lean, 12 + bob, 2, 2, eye);
    px(18 + lean, 12 + bob, 2, 2, eye);
    px(13 + lean, 13 + bob, 1, 1, eyeDark);
    px(19 + lean, 13 + bob, 1, 1, eyeDark);

    px(15 + lean, 16 + bob, 2, 1, skinSh);
    px(14 + lean, 16 + bob, 1, 2, tusk);
    px(17 + lean, 16 + bob, 1, 2, tusk);

    px(21 + lean, 20 + bob, 2, 6, clothSh);
    px(20 + lean, 18 + bob, 4, 3, clothSh);

    return c;
  }

  frames.idle[0]   = drawFrame('idle', 0);
  frames.idle[1]   = drawFrame('idle', 1);
  frames.attack[0] = drawFrame('attack', 0);

  // ---- Frame dormindo (deitado, de lado, com "Zzz" acima) ----
  frames.sleep = [];
  (function makeSleepFrame() {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const px = (x, y, w, h, color) => {
      g.fillStyle = color;
      g.fillRect(x, y, w, h);
    };

    const skin    = '#5a8a3a';
    const skinSh  = '#3f6528';
    const skinHi  = '#7aa85a';
    const cloth   = '#6b4a2b';
    const clothSh = '#4a3018';

    // Sombra no chão (elipse "deitada")
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.beginPath();
    g.ellipse(16, 26, 12, 3, 0, 0, Math.PI * 2);
    g.fill();

    // Corpo deitado (horizontal, na parte de baixo do tile)
    // Tronco
    px(8, 20, 14, 6, cloth);
    px(8, 25, 14, 1, clothSh);
    // Peito/costelas
    px(9, 21, 12, 1, clothSh);
    // Braço dobrado embaixo da cabeça
    px(7, 22, 4, 3, skin);

    // Cabeça (de lado, apoiada no braço)
    px(20, 18, 8, 7, skin);
    px(20, 24, 8, 1, skinSh);
    // Orelha
    px(27, 19, 2, 3, skin);
    // Olho fechado (linha horizontal)
    px(24, 21, 2, 1, '#1a1a0e');
    // Nariz
    px(26, 23, 1, 1, skinSh);

    // Pernas dobradas (uma em cima da outra, "encolhido")
    px(6, 23, 5, 3, cloth);
    px(6, 25, 5, 1, clothSh);

    // "Zzz" flutuando acima
    g.fillStyle = '#e8e8f0';
    g.font = 'bold 5px "Courier New", monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('z', 22, 12);
    g.font = 'bold 6px "Courier New", monospace';
    g.fillText('Z', 26, 8);
    g.font = 'bold 7px "Courier New", monospace';
    g.fillText('Z', 30, 4);

    frames.sleep.push(c);
  })();

  return frames;
}

export const goblinFrames = makeGoblinFrames();