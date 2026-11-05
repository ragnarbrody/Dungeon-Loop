import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { battle, playerStats } from '../core/state.js';
import { ENEMY_SPRITES } from '../sprites/enemies.js';
import { composeBattleFrame } from '../sprites/compose.js';
import { drawSpriteWithFlash } from '../sprites/flash.js';
import { CONSUMABLES } from '../items.js';
import { enemyScreenPos, effectiveSkillCost, estimateSkillDamage, getVisualTargetIndex } from './battle.js';
import { CLASSES } from '../classes.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import { drawIconOnCanvas } from '../sprites/icons.js';
import { NPC_SPRITES } from '../sprites/npcs.js';
import { drawCutscene } from './cutscene.js';

export function renderBattleInner() {
  const grd = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grd.addColorStop(0, '#1a2540');
  grd.addColorStop(1, '#0d1525');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#2a3a2a';
  ctx.fillRect(0, CANVAS_H * 0.55, CANVAS_W, CANVAS_H * 0.45);
  ctx.fillStyle = '#3a5a3a';
  ctx.fillRect(0, CANVAS_H * 0.55, CANVAS_W, 4);

  // Inimigos
  const enemies = battle.enemies;

  // Corpos caídos (fade + "deitados" por compressão vertical)
  for (const f of battle.fadingEnemies) {
    const e = f.ref;
    const alpha = Math.max(0, f.timer / f.total);
    const isBoss = e.isBoss === true;

    const idx = f.slotIndex;
    const n = f.slotCount;
    const spacing = n <= 1 ? 0 : Math.min(120, 400 / (n - 1));
    const startX = CANVAS_W * 0.72 - (n - 1) * spacing / 2;
    const px = startX + idx * spacing;
    const py = CANVAS_H * 0.30;

    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(px, py + 32, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const sprites = ENEMY_SPRITES[e.id] || ENEMY_SPRITES.slime;
    const frame = sprites.idle[0];

    ctx.globalAlpha = alpha;

    const dw = isBoss ? 96 : 64;
    const dh = isBoss ? 48 : 26;
    const dx = px - dw / 2;
    const dy = py + 32 - dh;
    ctx.drawImage(frame, dx, dy, dw, dh);

    ctx.globalAlpha = 1;
  }

  enemies.forEach((e, i) => {
    const pos = enemyScreenPos(e);
    const isDead = e.hp <= 0;
    const isBoss = e.isBoss === true;

    let lungeOffsetX = 0;
    if (battle.anim.lungeEnemy > 0 && i === battle.activeEnemyIndex) {
      lungeOffsetX = -(battle.anim.lungeEnemy / 0.2) * 30;
    }
    const drawX = pos.x + lungeOffsetX;

    const shadowW = isBoss ? 40 : 24;
    const shadowH = isBoss ? 9 : 6;
    const shadowY = isBoss ? 48 : 34;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y + shadowY, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    const sprites = ENEMY_SPRITES[e.id] || ENEMY_SPRITES.slime;
    const gFrame = (battle.turn === 'resolve' && i === battle.activeEnemyIndex)
      ? (e._phase2Active && sprites.attackPhase2 ? sprites.attackPhase2[0] : sprites.attack[0])
      : (e._phase2Active && sprites.phase2
          ? sprites.phase2[Math.floor(performance.now() / 500) % sprites.phase2.length]
          : sprites.idle[Math.floor(performance.now() / 500) % sprites.idle.length]);

    let enemyFlash = null;
    if (battle.anim.flashEnemy > 0 && i === battle.anim.flashEnemyIndex) {
      const blink = Math.floor(performance.now() / 60) % 2 === 0;
      if (blink) {
        enemyFlash = battle.anim.flashEnemyType === 'red' ? '#ff3b3b' : '#ffffff';
      }
    }

    const spriteScale = isBoss ? 3 : 2;
    const spritePx = 32 * spriteScale;

    ctx.globalAlpha = isDead ? 0.3 : (e.hiding > 0 ? 0.25 : 1);
    drawSpriteWithFlash(gFrame, drawX - spritePx / 2, pos.y - spritePx / 2, spriteScale, enemyFlash);
    ctx.globalAlpha = 1;

    const barW = isBoss ? 140 : 80;
    const barH = isBoss ? 8 : 6;
    const bx = pos.x - barW / 2;
    const by = pos.y - 60;
    ctx.fillStyle = '#000';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = isDead ? '#555' : '#c93030';
    ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(`${e.hp}/${e.maxHp}`, bx + barW + 5, by + barH / 2 + 1);
    ctx.fillStyle = isDead ? '#777' : '#eee';
    ctx.fillText(`${e.hp}/${e.maxHp}`, bx + barW + 4, by + barH / 2);
    ctx.textAlign = 'center';

    let statusText = '';
    let statusColor = '#fff';
    if (e.scarabBuff && e.scarabBuff.turns > 0) {
      statusText = `+${e.scarabBuff.def}DEF`;
      statusColor = '#c9a24d';
    } else if (e.huntersMark) {
      statusText = 'MARK';
      statusColor = '#c9a24d';
    } else if (e.hiding > 0) {
      statusText = e.id === 'vulture' ? 'VOANDO' : 'HIDE';
      statusColor = '#8ad8ff';
    } else if (e.enraged > 0 && e.chargeTurn === 0) {
      statusText = 'RAGE';
      statusColor = '#ff6b3b';
    } else if (e.chargeTurn > 0) {
      statusText = 'CHG';
      statusColor = '#ffb703';
    } else if (e.buffDef > 0) {
      statusText = `+${e.buffDef}DEF`;
      statusColor = '#6fbd63';
    } else if (e.buffAtk < 0) {
      statusText = `${e.buffAtk}ATK`;
      statusColor = '#ff6b6b';
    }
    if (statusText) {
      ctx.font = 'bold 9px "Courier New", monospace';
      ctx.fillStyle = statusColor;
      ctx.textAlign = 'center';
      ctx.fillText(statusText, pos.x, by - 6);
    }

    const visualTarget = getVisualTargetIndex();
    if (i === visualTarget && !isDead) {
      ctx.fillStyle = '#feca57';
      ctx.beginPath();
      ctx.moveTo(pos.x, by - 14);
      ctx.lineTo(pos.x - 8, by - 24);
      ctx.lineTo(pos.x + 8, by - 24);
      ctx.fill();
    }
  });

  // Companion (Herbalista)
  if (battle._escortActive) {
    const sprite = NPC_SPRITES.herbalist.idle[0];
    const cx = CANVAS_W * 0.18;
    const cy = CANVAS_H * 0.78;
    ctx.globalAlpha = 0.55;
    ctx.drawImage(sprite, cx - 32, cy - 32, 64, 64);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('...se escondeu atrás de você', cx, cy + 8);
  }

  // Jogador
  const basePx = CANVAS_W * 0.25;
  const py = CANVAS_H * 0.72;
  const playerLungeOffset = (battle.anim.lungePlayer / 0.35) * 50;
  const px = basePx + playerLungeOffset;

  const composed = composeBattleFrame();
  let playerFlash = null;
  if (battle.anim.flashPlayer > 0) {
    const blink = Math.floor(performance.now() / 60) % 2 === 0;
    if (blink) {
      playerFlash = battle.anim.flashPlayerType === 'red' ? '#ff3b3b' : '#ffffff';
    }
  }
  const shakePlayer = battle.anim.flashPlayer > 0 ? (Math.random() - 0.5) * 4 : 0;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(basePx, py + 24, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSpriteWithFlash(composed, px - 32 + shakePlayer, py - 40, 2, playerFlash);

  drawHpBar(30, 30, 'Você', playerStats.hp, playerStats.maxHp);
  drawMpBar(30, 50, playerStats.mp, playerStats.maxMp);

  if (playerStats.poisoned) {
    ctx.fillStyle = '#9b3fb5';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`PSN ${playerStats.poisoned.turns}t (-${playerStats.poisoned.dmg}/t)`, 30, 76);
  }

  if (playerStats.bleeding) {
    ctx.fillStyle = '#ff3b3b';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const yBleed = playerStats.poisoned ? 90 : 76;
    ctx.fillText(`SNG ${playerStats.bleeding.turns}t (-${playerStats.bleeding.dmg}/t)`, 30, yBleed);
  }

  if (playerStats.stunned > 0) {
    ctx.fillStyle = '#6fbd63';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const yStun = 76 + (playerStats.poisoned ? 14 : 0) + (playerStats.bleeding ? 14 : 0);
    ctx.fillText(`ENRAIZADO (${playerStats.stunned}t)`, 30, yStun);
  }

  if (battle.enemies.length > 1) {
    const vIdx = getVisualTargetIndex();
    const t = vIdx >= 0 ? battle.enemies[vIdx] : null;
    if (t && t.hp > 0) {
      ctx.fillStyle = '#feca57';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Alvo: ${t.name} (${t.hp}/${t.maxHp})`, CANVAS_W - 20, 24);

      ctx.font = '10px "Courier New", monospace';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Q/E para trocar de alvo', CANVAS_W - 20, 40);
      ctx.textAlign = 'left';
    }
  }

  // Números Flutuantes
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px "Courier New", monospace';
  for (const ft of battle.floatingTexts) {
    ctx.globalAlpha = 1 - (ft.age / 0.8);
    ctx.fillStyle = '#000';
    ctx.fillText(ft.value, ft.x + 2, ft.y + 2);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.value, ft.x, ft.y);
  }
  ctx.globalAlpha = 1.0;

  // Mensagem
  const menuOpen = battle.menuMode === 'skills' || battle.menuMode === 'items';
  const msgY = menuOpen ? 340 : CANVAS_H - 175;
  const msgH = 40;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(20, msgY, CANVAS_W - 40, msgH);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 1;
  ctx.strokeRect(20.5, msgY + 0.5, CANVAS_W - 40 - 1, msgH - 1);

  ctx.fillStyle = '#eee';
  ctx.font = '14px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(battle.message, 32, msgY + msgH / 2);

  // ---- Cutscene de entrada (boss) ----
  if (battle.cutscene) {
    drawCutscene(battle.cutscene);
    // Não desenha botões, menus nem a mensagem por baixo
    battle.buttons.length = 0;
    return;
  }

  ctx.globalAlpha = 1;

  // Botões
  battle.buttons.length = 0;

  // Durante a cutscene, não desenhamos botões e nem menus.
  if (battle.cutscene) return;

  const cls = CLASSES[playerStats.classId];
  const skills = cls ? cls.skills : [];
  const gap = 8;
  const margin = 20;

  // ============ SUBMENU DE ITENS ============
  if (battle.menuMode === 'items') {
    const PER_PAGE = 4;
    const bH = 50;
    const usableItems = playerStats.inventory.filter(i => i.qty > 0 && CONSUMABLES[i.id]);

    if (usableItems.length === 0) {
      const bY = CANVAS_H - 160;
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(20, bY, CANVAS_W - 40, 100);
      ctx.fillStyle = '#eee';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('Nenhum item utilizável!', CANVAS_W / 2, bY + 35);

      battle.buttons.push({ x: 20, y: bY + 60, w: CANVAS_W - 40, h: bH, action: 'menu_main' });
      drawButton(20, bY + 60, CANVAS_W - 40, bH, 'Voltar');
      return;
    }

    const totalPages = Math.max(1, Math.ceil(usableItems.length / PER_PAGE));
    const page = Math.min(battle.itemPage, totalPages - 1);
    const start = page * PER_PAGE;
    const pageItems = usableItems.slice(start, start + PER_PAGE);

    const bY = CANVAS_H - 170;
    const nOnPage = pageItems.length;
    const bW = (CANVAS_W - 40 - gap) / 2;
    const rows = Math.ceil(nOnPage / 2);

    pageItems.forEach((item, i) => {
      const info = CONSUMABLES[item.id];
      if (!info) return;

      const x = 20 + (i % 2) * (bW + gap);
      const y = bY + Math.floor(i / 2) * (bH + gap);

      battle.buttons.push({ x, y, w: bW, h: bH, action: `use_item_${item.id}` });

      ctx.fillStyle = '#2a2a3e';
      ctx.fillRect(x, y, bW, bH);
      ctx.strokeStyle = '#c9a24d';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, bW - 2, bH - 2);

      const iconScale = 1.6;
      const iconW = 20 * iconScale;
      const iconX = x + 12;
      const iconY = y + (bH - iconW) / 2;
      drawIconOnCanvas(ctx, item.id, iconX, iconY, iconScale);

      ctx.fillStyle = '#eee';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.name, iconX + iconW + 10, y + bH / 2 - 8);

      ctx.fillStyle = '#aaa';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(`x${item.qty}`, iconX + iconW + 10, y + bH / 2 + 10);
    });

    if (totalPages > 1) {
      const arrowW = 28;
      const arrowH = 60;
      const arrowY = bY + (rows * (bH + gap) - gap - arrowH) / 2;

      if (page > 0) {
        battle.buttons.push({ x: 2, y: arrowY, w: arrowW, h: arrowH, action: 'item_page_prev' });
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(2, arrowY, arrowW, arrowH);
        ctx.strokeStyle = '#c9a24d';
        ctx.lineWidth = 2;
        ctx.strokeRect(3, arrowY + 1, arrowW - 2, arrowH - 2);
        ctx.fillStyle = '#c9a24d';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◄', 2 + arrowW / 2, arrowY + arrowH / 2);
      }
      if (page < totalPages - 1) {
        battle.buttons.push({ x: CANVAS_W - arrowW - 2, y: arrowY, w: arrowW, h: arrowH, action: 'item_page_next' });
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(CANVAS_W - arrowW - 2, arrowY, arrowW, arrowH);
        ctx.strokeStyle = '#c9a24d';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W - arrowW - 1, arrowY + 1, arrowW - 2, arrowH - 2);
        ctx.fillStyle = '#c9a24d';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('►', CANVAS_W - arrowW / 2 - 2, arrowY + arrowH / 2);
      }

      ctx.fillStyle = '#aaa';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${page + 1} / ${totalPages}`, CANVAS_W / 2, bY - 8);
    }

    const backY = bY + rows * (bH + gap) + 4;
    battle.buttons.push({ x: 20, y: backY, w: CANVAS_W - 40, h: bH, action: 'menu_main' });
    drawButton(20, backY, CANVAS_W - 40, bH, 'Voltar');

    return;
  }

  // ============ SUBMENU DE SKILLS ============
  if (battle.menuMode === 'skills') {
    const PER_PAGE = 3;
    const totalPages = Math.max(1, Math.ceil(skills.length / PER_PAGE));
    const page = Math.min(battle.skillPage, totalPages - 1);
    const start = page * PER_PAGE;
    const pageSkills = skills.slice(start, start + PER_PAGE);

    const bY = CANVAS_H - 170;
    const bH = 90;
    const nOnPage = pageSkills.length;
    const bW = (CANVAS_W - margin * 2 - gap * (nOnPage - 1)) / Math.max(1, nOnPage);

    pageSkills.forEach((sk, i) => {
      const idx = start + i;
      const x = margin + i * (bW + gap);
      battle.buttons.push({ x, y: bY, w: bW, h: bH, action: sk.id });

      const cost = effectiveSkillCost(sk);
      const canUse = playerStats.mp >= cost;

      ctx.fillStyle = canUse ? '#2a2a3e' : '#1a1a24';
      ctx.fillRect(x, bY, bW, bH);
      ctx.strokeStyle = canUse ? '#c9a24d' : '#444';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, bY + 1, bW - 2, bH - 2);

      const nameLabel = `${idx + 1}. ${sk.name}`;
      const nameLines = drawSkillName(nameLabel, x + bW / 2, bY + 28, bW - 20, 15, canUse);

      ctx.fillStyle = canUse ? '#8ad8ff' : '#444';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${cost} MP`, x + bW / 2, bY + 28 + (nameLines - 1) * 17 + 16);

      const dmgEst = estimateSkillDamage(sk.id);
      if (dmgEst) {
        const dmgY = bY + 28 + (nameLines - 1) * 17 + 16 + 14;
        ctx.fillStyle = canUse ? '#ff9f43' : '#444';
        ctx.font = '11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const txt = dmgEst.min === dmgEst.max
          ? `${dmgEst.min} de dano`
          : `${dmgEst.min}-${dmgEst.max} de dano`;
        ctx.fillText(txt, x + bW / 2, dmgY);
      }

      drawInfoIcon(x + bW - 18, bY + 8, sk, canUse);
    });

    if (totalPages > 1) {
      const arrowW = 32;
      const arrowH = 60;
      const arrowY = bY + (bH - arrowH) / 2;

      if (page > 0) {
        battle.buttons.push({ x: 4, y: arrowY, w: arrowW, h: arrowH, action: 'skill_page_prev' });
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(4, arrowY, arrowW, arrowH);
        ctx.strokeStyle = '#c9a24d';
        ctx.lineWidth = 2;
        ctx.strokeRect(5, arrowY + 1, arrowW - 2, arrowH - 2);
        ctx.fillStyle = '#c9a24d';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◄', 4 + arrowW / 2, arrowY + arrowH / 2);
      }

      if (page < totalPages - 1) {
        battle.buttons.push({ x: CANVAS_W - arrowW - 4, y: arrowY, w: arrowW, h: arrowH, action: 'skill_page_next' });
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(CANVAS_W - arrowW - 4, arrowY, arrowW, arrowH);
        ctx.strokeStyle = '#c9a24d';
        ctx.lineWidth = 2;
        ctx.strokeRect(CANVAS_W - arrowW - 3, arrowY + 1, arrowW - 2, arrowH - 2);
        ctx.fillStyle = '#c9a24d';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('►', CANVAS_W - arrowW / 2 - 4, arrowY + arrowH / 2);
      }

      ctx.fillStyle = '#aaa';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${page + 1} / ${totalPages}`, CANVAS_W / 2, bY - 8);
    }

    const backY = bY + bH + 10;
    battle.buttons.push({ x: margin, y: backY, w: CANVAS_W - margin * 2, h: 44, action: 'menu_main' });
    drawButton(margin, backY, CANVAS_W - margin * 2, 44, 'Voltar');

    return;
  }

  // ============ MENU PRINCIPAL DE COMBATE ============
  if (battle.menuMode === 'main') {
    if (battle.turn !== 'player') {
      ctx.fillStyle = '#aaa';
      ctx.font = 'italic 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('...', CANVAS_W / 2, CANVAS_H - 80);
      return;
    }

    const bY = CANVAS_H - 130;
    const bH = 60;
    const n = 4;
    const bW = (CANVAS_W - margin * 2 - gap * (n - 1)) / n;
    const stunned = playerStats.stunned > 0;

    // Atacar
    battle.buttons.push({ x: margin, y: bY, w: bW, h: bH, action: 'menu_skills' });
    drawBigButton(margin, bY, bW, bH, 'sword', 'Atacar', stunned);

    // Item
    const itemX = margin + (bW + gap);
    battle.buttons.push({ x: itemX, y: bY, w: bW, h: bH, action: 'menu_items' });
    drawBigButton(itemX, bY, bW, bH, 'bag', 'Item', stunned);

    // Descansar (sempre habilitado, mesmo enraizado)
    const restX = margin + 2 * (bW + gap);
    battle.buttons.push({ x: restX, y: bY, w: bW, h: bH, action: 'rest' });
    drawBigButton(restX, bY, bW, bH, 'rest', 'Descansar', false);

    // Fugir
    const fleeX = margin + 3 * (bW + gap);
    battle.buttons.push({ x: fleeX, y: bY, w: bW, h: bH, action: 'flee' });
    drawBigButton(fleeX, bY, bW, bH, 'flee', 'Fugir', stunned);

    return;
  }

  // ============ LAYOUT ANTIGO (2 linhas, fallback) ============
  if (battle.turn === 'player') {
    const cls = CLASSES[playerStats.classId];
    const skills = cls ? cls.skills : [];

    const gap = 8;
    const margin = 20;
    const bH1 = 70;
    const bH2 = 46;
    const bY2 = CANVAS_H - bH2 - 10;
    const bY1 = bY2 - bH1 - gap;

    const nSkills = skills.length;
    const bW1 = (CANVAS_W - margin * 2 - gap * (nSkills - 1)) / nSkills;

    skills.forEach((sk, i) => {
      const x = margin + i * (bW1 + gap);
      battle.buttons.push({ x, y: bY1, w: bW1, h: bH1, action: sk.id });

      const cost = effectiveSkillCost(sk);
      const canUse = playerStats.mp >= cost;

      ctx.fillStyle = canUse ? '#2a2a3e' : '#1a1a24';
      ctx.fillRect(x, bY1, bW1, bH1);
      ctx.strokeStyle = canUse ? '#c9a24d' : '#444';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, bY1 + 1, bW1 - 2, bH1 - 2);

      const nameLabel = `${i + 1}. ${sk.name}`;
      const nameLines = drawSkillName(nameLabel, x + bW1 / 2, bY1 + 24, bW1 - 16, 13, canUse);

      ctx.fillStyle = canUse ? '#8ad8ff' : '#444';
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${cost} MP`, x + bW1 / 2, bY1 + 24 + (nameLines - 1) * 15 + 14);

      const dmgEst = estimateSkillDamage(sk.id);
      if (dmgEst) {
        const dmgY = bY1 + 24 + (nameLines - 1) * 15 + 14 + 12;
        ctx.fillStyle = canUse ? '#ff9f43' : '#444';
        ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const txt = dmgEst.min === dmgEst.max
          ? `${dmgEst.min} de dano`
          : `${dmgEst.min}-${dmgEst.max} de dano`;
        ctx.fillText(txt, x + bW1 / 2, dmgY);
      }

      drawInfoIcon(x + bW1 - 18, bY1 + 8, sk, canUse);
    });

    const nSecondary = 3;
    const bW2 = (CANVAS_W - margin * 2 - gap * (nSecondary - 1)) / nSecondary;

    const itemX = margin;
    battle.buttons.push({ x: itemX, y: bY2, w: bW2, h: bH2, action: 'open_items' });
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(itemX, bY2, bW2, bH2);
    ctx.strokeStyle = '#c9a24d';
    ctx.lineWidth = 2;
    ctx.strokeRect(itemX + 1, bY2 + 1, bW2 - 2, bH2 - 2);
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${nSkills + 1}. Item`, itemX + bW2 / 2, bY2 + 18);
    ctx.fillStyle = '#8ad8ff';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('(consome turno)', itemX + bW2 / 2, bY2 + 34);

    const restX = margin + (bW2 + gap);
    battle.buttons.push({ x: restX, y: bY2, w: bW2, h: bH2, action: 'rest' });
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(restX, bY2, bW2, bH2);
    ctx.strokeStyle = '#c9a24d';
    ctx.lineWidth = 2;
    ctx.strokeRect(restX + 1, bY2 + 1, bW2 - 2, bH2 - 2);
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${nSkills + 2}. Descansar`, restX + bW2 / 2, bY2 + 18);
    ctx.fillStyle = '#6fbd63';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('+HP/+MP', restX + bW2 / 2, bY2 + 34);

    const fleeX = margin + 2 * (bW2 + gap);
    battle.buttons.push({ x: fleeX, y: bY2, w: bW2, h: bH2, action: 'flee' });
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(fleeX, bY2, bW2, bH2);
    ctx.strokeStyle = '#c9a24d';
    ctx.lineWidth = 2;
    ctx.strokeRect(fleeX + 1, bY2 + 1, bW2 - 2, bH2 - 2);
    ctx.fillStyle = '#eee';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${nSkills + 3}. Fugir`, fleeX + bW2 / 2, bY2 + 18);
  } else {
    ctx.fillStyle = '#aaa';
    ctx.font = 'italic 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('...', CANVAS_W / 2, CANVAS_H - 80);
  }

  drawSkillTooltip();
}

export function renderBattle() {
  renderBattleInner();
  drawSkillTooltip();
}

// ============================================================
// Helpers
// ============================================================

function drawMpBar(x, y, mp, maxMp) {
  const w = 200, h = 8;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);
  const pct = Math.max(0, mp / maxMp);
  ctx.fillStyle = '#3aa0ff';
  ctx.fillRect(x, y, w * pct, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`MP ${mp}/${maxMp}`, x + w + 8, y + h - 1);
}

function drawButton(x, y, w, h, label, hint = '') {
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.fillStyle = '#eee';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + (hint ? 16 : 24));

  if (hint) {
    ctx.fillStyle = '#aaa';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText(hint, x + w / 2, y + 30);
  }
}

function drawBigButton(x, y, w, h, iconId, label, disabled = false) {
  ctx.fillStyle = disabled ? '#1a1a24' : '#2a2a3e';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = disabled ? '#444' : '#c9a24d';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const iconSize = 28;
  const scale = iconSize / 20;
  const iconX = x + w / 2 - iconSize / 2;
  const iconY = y + h * 0.28 - iconSize / 2;

  ctx.globalAlpha = disabled ? 0.35 : 1;
  drawIconOnCanvas(ctx, iconId, iconX, iconY, scale);
  ctx.globalAlpha = 1;

  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillStyle = disabled ? '#555' : '#eee';
  ctx.fillText(label, x + w / 2, y + h * 0.75);
}

function drawHpBar(x, y, label, hp, maxHp) {
  const w = 200, h = 14;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 4, y - 18, w + 8, h + 24);
  ctx.fillStyle = '#eee';
  ctx.font = '12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${label}: ${hp}/${maxHp}`, x, y - 4);

  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, w, h);

  const pct = Math.max(0, hp / maxHp);
  ctx.fillStyle = pct > 0.5 ? '#4caf50' : pct > 0.25 ? '#e6b800' : '#c93030';
  ctx.fillRect(x, y, w * pct, h);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function wrapText(text, cx, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let y = startY;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? line + ' ' + words[i] : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, cx, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, cx, y);
  return y + lineHeight;
}

function drawInfoIcon(x, y, skill, canUse) {
  const isActive = battle.tooltipSkill === skill;
  const size = 12;
  const hitSize = Math.min(22, size + 8);

  battle.buttons.push({
    x: x + size / 2 - hitSize / 2,
    y: y + size / 2 - hitSize / 2,
    w: hitSize,
    h: hitSize,
    action: '__toggle_tooltip__',
    _skill: skill,
    _isInfoIcon: true,
  });

  ctx.fillStyle = isActive ? '#c9a24d' : (canUse ? '#2a2a3e' : '#1a1a24');
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = isActive ? '#f0d27a' : (canUse ? '#8ad8ff' : '#444');
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = isActive ? '#1a1a2e' : (canUse ? '#8ad8ff' : '#444');
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('i', x + size / 2, y + size / 2 + 1);
}

function drawSkillTooltip() {
  if (!battle.tooltipSkill) return;

  const sk = battle.tooltipSkill;
  const cost = effectiveSkillCost(sk);

  const tooltipW = 280;
  const tooltipH = 90;

  let tx = battle.tooltipPos ? battle.tooltipPos.x : CANVAS_W / 2 - tooltipW / 2;
  let ty = battle.tooltipPos ? battle.tooltipPos.y : CANVAS_H / 2 - tooltipH / 2;

  tx = Math.max(10, Math.min(tx, CANVAS_W - tooltipW - 10));
  ty = Math.max(10, Math.min(ty, CANVAS_H - tooltipH - 10));

  ctx.fillStyle = 'rgba(15, 15, 26, 0.97)';
  ctx.fillRect(tx, ty, tooltipW, tooltipH);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeRect(tx, ty, tooltipW, tooltipH);
  ctx.strokeStyle = '#c9a24d';
  ctx.lineWidth = 2;
  ctx.strokeRect(tx + 1, ty + 1, tooltipW - 2, tooltipH - 2);

  ctx.fillStyle = '#feca57';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(sk.name, tx + 12, ty + 22);

  ctx.fillStyle = '#8ad8ff';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${cost} MP`, tx + tooltipW - 12, ty + 22);

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tx + 10, ty + 30);
  ctx.lineTo(tx + tooltipW - 10, ty + 30);
  ctx.stroke();

  ctx.fillStyle = '#ddd';
  ctx.font = '11px "Courier New", monospace';
  ctx.textAlign = 'left';
  wrapText(sk.desc, tx + 12, ty + 48, tooltipW - 24, 14);
}

function drawSkillName(label, cx, startY, maxWidth, fontSize, canUse) {
  ctx.fillStyle = canUse ? '#eee' : '#555';
  ctx.font = `bold ${fontSize}px "Courier New", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (ctx.measureText(label).width <= maxWidth) {
    ctx.fillText(label, cx, startY);
    return 1;
  }

  const words = label.split(' ');
  let line1 = '';
  let splitIdx = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line1 ? line1 + ' ' + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line1) {
      splitIdx = i;
      break;
    }
    line1 = test;
    splitIdx = i + 1;
  }
  const line2 = words.slice(splitIdx).join(' ');

  ctx.fillText(line1, cx, startY);

  if (line2) {
    let display2 = line2;
    if (ctx.measureText(display2).width > maxWidth) {
      while (display2.length > 0 && ctx.measureText(display2 + '…').width > maxWidth) {
        display2 = display2.slice(0, -1);
      }
      display2 = display2.trimEnd() + '…';
    }
    ctx.fillText(display2, cx, startY + fontSize + 2);
    return 2;
  }
  return 1;
}