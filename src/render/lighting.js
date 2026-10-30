import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { getTimeState } from '../core/timeofday.js';
import { playerEquip } from '../sprites/equipment.js';

const layer = document.createElement('canvas');
layer.width = CANVAS_W;
layer.height = CANVAS_H;
const lctx = layer.getContext('2d');

export const NIGHT_ALPHA = 0.65;   // opacidade do overlay = darkness * isso (aumente p/ noite mais escura)

const clamp01 = (v) => Math.max(0, Math.min(1, v));

// 0 de dia → 1 em plena noite. Usado por janelas e portal.
export function nightFactor() {
  return clamp01((getTimeState().darkness - 0.12) / 0.45);
}

// Luz da tocha equipada (null de dia ou sem tocha)
export function torchLight(x, y) {
  if (playerEquip.leftHand !== 'torch') return null;
  const strength = clamp01(getTimeState().darkness * 1.6);
  if (strength < 0.05) return null;
  return { x, y, radius: 130, strength, inner: 0.25,
           color: [255, 180, 90], warm: 0.28, flicker: true };
}

function radiusOf(l, now) {
  if (!l.flicker) return l.radius;
  return l.radius * (1 + Math.sin(now / 110) * 0.025 + Math.sin(now / 37) * 0.015);
}
function strengthOf(l, now) {
  const s = l.strength ?? 1;
  return l.pulse ? s * (0.85 + Math.sin(now / 500) * 0.15) : s;
}

/**
 * Escurece a cena e "acende" as luzes.
 * lights: [{ x, y, radius, strength=1, inner=0, color?, warm?, flicker?, pulse? }]
 *   strength/inner → quanto da escuridão a luz remove (1 = tudo)
 *   color/warm     → brilho colorido aditivo por cima
 */
export function applyLighting({ color, alpha, lights = [], vignette = null }) {
  const now = performance.now();

  // 1) camada de escuridão (offscreen)
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  lctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
  lctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  if (vignette) {
    const g = lctx.createRadialGradient(vignette.x, vignette.y, vignette.radius * 0.35,
                                        vignette.x, vignette.y, vignette.radius);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${vignette.alpha})`);
    lctx.fillStyle = g;
    lctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // 2) fura a camada (só ela, não o mundo)
  lctx.globalCompositeOperation = 'destination-out';
  for (const l of lights) {
    const r = radiusOf(l, now);
    const s = clamp01(strengthOf(l, now));
    const g = lctx.createRadialGradient(l.x, l.y, r * (l.inner ?? 0), l.x, l.y, r);
    g.addColorStop(0, `rgba(0,0,0,${s})`);
    g.addColorStop(0.5, `rgba(0,0,0,${s * 0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    lctx.fillStyle = g;
    lctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  }
  lctx.globalCompositeOperation = 'source-over';

  // 3) aplica sobre a cena
  ctx.drawImage(layer, 0, 0);

  // 4) brilho colorido aditivo
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (!l.color || !l.warm) continue;
    const r = radiusOf(l, now) * 0.8;
    const a = l.warm * clamp01(strengthOf(l, now));
    const [R, G, B] = l.color;
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    g.addColorStop(0, `rgba(${R},${G},${B},${a})`);
    g.addColorStop(1, `rgba(${R},${G},${B},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// Atalho: escuridão do ciclo dia/noite
export function applyDayNight(lights = [], focus = null) {
  const t = getTimeState();
  if (t.darkness <= 0.01) return;
  applyLighting({
    color: t.overlay,
    alpha: t.darkness * NIGHT_ALPHA,
    lights,
    vignette: focus && t.darkness > 0.2
      ? { x: focus.x, y: focus.y, radius: 260, alpha: 0.45 * t.darkness }
      : null,
  });
}