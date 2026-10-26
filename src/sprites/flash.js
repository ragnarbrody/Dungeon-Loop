import { ctx } from '../core/canvas.js';

const tintCanvas = document.createElement('canvas');
tintCanvas.width  = 64;
tintCanvas.height = 64;
const tintCtx = tintCanvas.getContext('2d');
tintCtx.imageSmoothingEnabled = false;

// `source` é o canvas 32x32. `scale` é o multiplicador (2 = sprite 64x64 na tela).
// `flashColor` = null | '#ffffff' | '#ff3b3b'. Se o sprite for maior que 32,
// aumente tintCanvas na inicialização.
export function drawSpriteWithFlash(source, dx, dy, scale, flashColor) {
  if (!flashColor) {
    ctx.drawImage(source, dx, dy, 32 * scale, 32 * scale);
    return;
  }

  tintCtx.clearRect(0, 0, tintCanvas.width, tintCanvas.height);
  tintCtx.drawImage(source, 0, 0, 32 * scale, 32 * scale);

  tintCtx.globalCompositeOperation = 'source-atop';
  tintCtx.fillStyle = flashColor;
  tintCtx.fillRect(0, 0, tintCanvas.width, tintCanvas.height);
  tintCtx.globalCompositeOperation = 'source-over';

  ctx.drawImage(tintCanvas, dx, dy);
}