// src/entities/enemies.js
import { ENEMY_SPRITES } from '../sprites/enemies.js';
import { ctx, TILE_SIZE } from '../core/canvas.js';
import { player, currentRoom } from '../core/state.js';
import { playerEquip } from '../sprites/equipment.js';

// Quantos tiles de distância (em linha reta) o glow acende
const CAVE_GLOW_RANGE = 7;   // 7 tiles ≈ 140 px

export function drawMapEnemies(room) {
  if (!room || !room.enemies) return;

  // Só desenha o glow se estiver numa caverna E tiver tocha equipada
  // (sem tocha a tela fica preta mesmo — não faz sentido glow)
  const isCave = room.biomeId === 'cave';
  const hasTorch = playerEquip.leftHand === 'torch';
  const glowEnabled = isCave && hasTorch;

  // Se estiver na caverna sem tocha, nem desenha os inimigos
  // (a escuridão total já cobre, mas economiza processamento)
  if (isCave && !hasTorch) return;

  const now = performance.now();
  const pulse = 0.5 + Math.sin(now / 300) * 0.25;   // pulso suave

  for (const e of room.enemies) {
    if (e.defeated) continue;

    const sprites = ENEMY_SPRITES[e.id];
    if (!sprites) continue;

    const frame = sprites.idle[
      Math.floor(now / 500) % sprites.idle.length
    ];

    const dx = e.tx * TILE_SIZE + TILE_SIZE / 2 - 16;
    const dy = e.ty * TILE_SIZE + TILE_SIZE - 30;

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(dx + 16, dy + 30, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---------- GLOW (só na caverna, com tocha) ----------
    if (glowEnabled) {
      // Distância em pixels do centro do inimigo até o player
      const eCx = e.tx * TILE_SIZE + TILE_SIZE / 2;
      const eCy = e.ty * TILE_SIZE + TILE_SIZE / 2;
      const distPx = Math.hypot(player.x - eCx, player.y - eCy);
      const rangePx = CAVE_GLOW_RANGE * TILE_SIZE;

      if (distPx < rangePx) {
        // Intensidade cai com a distância (perto = mais forte)
        const falloff = 1 - (distPx / rangePx);
        const glowAlpha = (0.45 + pulse * 0.35) * falloff;

        // Glow por "sprite fantasma" colorido atrás do inimigo.
        // Truque barato: desenha o frame com filtro de cor via shadowBlur.
        ctx.save();

        // 1) Halo radial atrás do inimigo
        const grd = ctx.createRadialGradient(
          dx + 16, dy + 16, 2,
          dx + 16, dy + 16, 26
        );
        grd.addColorStop(0, `rgba(255, 80, 80, ${glowAlpha})`);
        grd.addColorStop(0.6, `rgba(255, 40, 40, ${glowAlpha * 0.4})`);
        grd.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(dx + 16, dy + 16, 26, 0, Math.PI * 2);
        ctx.fill();

        // 2) Outline brilhante do sprite (usando shadowBlur + tint)
        //    Desenhamos o sprite várias vezes com offset de 1px em 4 direções,
        //    com cor vermelha e blur — vira um "contorno" luminoso.
        ctx.globalAlpha = glowAlpha;
        ctx.shadowColor = '#ff3b3b';
        ctx.shadowBlur = 8;

        // Tinta o sprite de vermelho usando composite
        // (mais barato que filtro por pixel)
        const tintCanvas = document.createElement('canvas');
        tintCanvas.width = 32;
        tintCanvas.height = 32;
        const tctx = tintCanvas.getContext('2d');
        tctx.imageSmoothingEnabled = false;
        tctx.drawImage(frame, 0, 0, 32, 32);
        tctx.globalCompositeOperation = 'source-in';
        tctx.fillStyle = '#ff3b3b';
        tctx.fillRect(0, 0, 32, 32);

        // Desenha o tint 4 vezes deslocado (contorno) + o original
        const off = 1.5;
        ctx.drawImage(tintCanvas, dx - off, dy);
        ctx.drawImage(tintCanvas, dx + off, dy);
        ctx.drawImage(tintCanvas, dx, dy - off);
        ctx.drawImage(tintCanvas, dx, dy + off);

        // Restaura estado antes de desenhar o sprite real
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // Sprite real (por cima do glow)
    ctx.drawImage(frame, dx, dy, 32, 32);
  }
}