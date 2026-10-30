// ============================================================
// Skills do jogador: implementações, custo e estimativa de dano.
// Fórmulas preservadas do battle.js original.
// ============================================================
import { playerStats, effStat, battle } from '../core/state.js';
import { rand } from '../core/rng.js';
import { playerEquip, weaponBonus } from '../sprites/equipment.js';
import { CLASSES } from '../classes.js';
import { sfx } from '../audio/audio.js';
import {
  target, targetIgnoringHiding, livingEnemies, tryDodge,
  flashEnemyAt, flashPlayer, spawnFloatingText, applyMarkBonus,
  hasVisibleTarget,
} from './battle-helpers.js';

// ---- Stats base do jogador ----
export function classDamageStat() {
  const cls = CLASSES[playerStats.classId];
  return cls?.damageStat || 'str';
}

export function classAtk() {
  const stat = classDamageStat();
  const eq = weaponBonus(playerEquip)[stat] || 0;
  return 2 + (effStat(stat) + eq) * 2;
}

export function dmgStat() {
  const stat = classDamageStat();
  const eq = weaponBonus(playerEquip)[stat] || 0;
  return effStat(stat) + eq;
}

export function effectiveSkillCost(skill) {
  const base = skill.cost;
  const extra = Math.floor(playerStats.magia * 0.6);
  return base + extra;
}

// ---- Implementações ----
export const SKILL_IMPL = {
  // ---- CAVALEIRA (str) ----
  quick: () => {
    const t = target(); if (!t) return;
    const hitChance = Math.min(0.95, 0.70 + effStat('agi') * 0.02);
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque rápido errou!'; sfx('miss'); return;
    }
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const dmg = Math.max(1, classAtk() - t.def + rand(-1, 1));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = isCrit ? Math.floor(dmg * 1.5) : dmg;
    t.hp = Math.max(0, t.hp - finalDmg);
    sfx('hit');
    battle.message = `Você atacou rápido! ${finalDmg} de dano em ${t.name}. ${isCrit ? '(CRÍTICO!)' : ''}`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.2;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#ff3b3b');
  },
  heavy: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const hitChance = Math.min(0.95, 0.70 + effStat('agi') * 0.02) - 0.15;
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque forte errou!'; sfx('miss'); return;
    }
    const base = Math.round(classAtk() * 1.8);
    const dmg = Math.max(1, base - t.def + rand(-1, 2));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = isCrit ? Math.floor(dmg * 1.5) : dmg;
    t.hp = Math.max(0, t.hp - finalDmg);
    sfx('hit');
    battle.message = `Você atacou forte! ${finalDmg} de dano em ${t.name}. ${isCrit ? '(CRÍTICO!)' : ''}`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.35;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#ff3b3b');
  },
  spin: () => {
    const living = livingEnemies().filter(e => e.hiding === 0);
    if (living.length === 0) {
      battle.message = 'Golpe Giratório não acertou ninguém!'; sfx('miss'); return;
    }
    let total = 0, hits = 0;
    for (const e of living) {
      if (tryDodge(e)) continue;
      const dmg = Math.max(1, Math.round(classAtk() * 1.3) - e.def);
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg; hits++;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#feca57');
    }
    if (hits === 0) { battle.message = 'Golpe Giratório não acertou ninguém!'; sfx('miss'); return; }
    sfx('hit');
    battle.message = hits === 1
      ? `Golpe Giratório! ${total} de dano em ${living[0].name}.`
      : `Golpe Giratório! ${total} de dano em ${hits} inimigos.`;
    battle.anim.flashEnemy = 0.3;
    battle.anim.shake = 0.3;
  },

  // ---- MAGO (int) — ignora defesa ----
  bolt: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const dmg = Math.max(1, 3 + dmgStat() * 2 + rand(-1, 1));
    t.hp = Math.max(0, t.hp - dmg);
    sfx('hit');
    battle.message = `Force Bolt! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.1;
    spawnFloatingText(t, dmg, '#8ad8ff');
  },
  fireball: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const dmg = Math.max(1, 5 + dmgStat() * 2 + rand(-1, 2));
    t.hp = Math.max(0, t.hp - dmg);
    sfx('hit');
    battle.message = `Bola de Fogo! ${dmg} de dano em ${t.name} (ignora defesa).`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.25;
    spawnFloatingText(t, dmg, '#ff8a3b');
  },
  arcane: () => {
    const living = livingEnemies().filter(e => e.hiding === 0);
    if (living.length === 0) return;
    const baseDmg = 5 + dmgStat() * 2;
    let total = 0, hits = 0;
    for (const e of living) {
      if (tryDodge(e)) continue;
      const dmg = Math.max(1, baseDmg + rand(-2, 2));
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg; hits++;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#d78cff');
    }
    if (hits === 0) { battle.message = 'Impacto Arcano não acertou ninguém!'; sfx('miss'); return; }
    sfx('hit');
    battle.message = hits === 1
      ? `Impacto Arcano! ${total} de dano em ${living[0].name}.`
      : `Impacto Arcano atinge ${hits} inimigos! ${total} de dano total.`;
    battle.anim.shake = 0.5;
    battle.anim.flashEnemy = 0.4;
  },

  // ---- LADRÃO (agi) ----
  stab: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const dmg = Math.max(1, 1 + dmgStat() * 1.5 + rand(-1, 1));
    t.hp = Math.max(0, t.hp - dmg);
    sfx('hit');
    battle.message = `Estocada certeira! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.12;
    spawnFloatingText(t, dmg, '#ff3b3b');
  },
  backstab: () => {
    const t = target(); if (!t) return;
    if (tryDodge(t)) { battle.anim.shake = 0.1; return; }
    const hitChance = Math.min(0.95, 0.75 + effStat('agi') * 0.02);
    if (Math.random() >= hitChance) {
      battle.message = 'Seu ataque furtivo errou!'; sfx('miss'); return;
    }
    const base = Math.round((1 + dmgStat() * 1.5) * 1.6);
    const dmg = Math.max(1, base + rand(-1, 2));
    t.hp = Math.max(0, t.hp - dmg);
    sfx('hit');
    battle.message = `Ataque furtivo! ${dmg} de dano em ${t.name}.`;
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.3;
    spawnFloatingText(t, dmg, '#ff7bd0');
  },
  shadow: () => {
    playerStats.shadowActive = true;
    battle.message = 'Você some nas sombras. O próximo ataque inimigo vai errar.';
    flashPlayer('white');
  },

  // ---- CAÇADORA (agi) ----
  aimed_shot: () => {
    const t = targetIgnoringHiding(); if (!t) return;
    const base = 1 + dmgStat() * 1.8;
    const dmg = Math.max(1, Math.round(base - t.def * 0.5 + rand(-1, 1)));
    const isCrit = Math.random() < Math.min(0.35, 0.02 + effStat('int') * 0.01);
    const finalDmg = applyMarkBonus(t, isCrit ? Math.floor(dmg * 1.5) : dmg);

    if (t.hiding > 0) {
      t.hiding = 0; t.flyingAway = false;
      battle.message = `Tiro Certeiro acerta ${t.name} em pleno voo! `;
    } else {
      battle.message = `Tiro Certeiro em ${t.name}! `;
    }
    battle.message += `${finalDmg} de dano. ${isCrit ? '(CRÍTICO!)' : ''}`;

    t.hp = Math.max(0, t.hp - finalDmg);
    sfx('hit');
    flashEnemyAt(t, 'white');
    battle.anim.shake = 0.15;
    spawnFloatingText(t, finalDmg, isCrit ? '#feca57' : '#e8d890');
  },

  piercing_arrow: () => {
    const living = livingEnemies().filter(e => e.hiding === 0);
    if (living.length === 0) {
      battle.message = 'Flecha Perfurante não acertou ninguém!'; sfx('miss'); return;
    }
    const multipliers = [1.0, 0.6, 0.4, 0.3];
    const baseDmg = 1 + dmgStat() * 1.6;
    let total = 0, hits = 0;
    living.forEach((e, i) => {
      if (tryDodge(e)) return;
      const mul = multipliers[i] ?? 0.3;
      const dmg = Math.max(1, Math.round(baseDmg * mul - e.def * 0.5) + rand(-1, 1));
      e.hp = Math.max(0, e.hp - dmg);
      total += dmg; hits++;
      flashEnemyAt(e, 'white');
      spawnFloatingText(e, dmg, '#8a9a4a');
    });
    if (hits > 0) sfx('hit');
    if (hits === 0) {
      battle.message = 'Flecha Perfurante não acertou ninguém!'; sfx('miss');
    } else {
      battle.message = `Flecha Perfurante! ${total} de dano em ${hits} inimigo(s).`;
    }
    battle.anim.shake = 0.35;
    battle.anim.flashEnemy = 0.3;
  },

  hunters_mark: () => {
    const t = target(); if (!t) return;
    t.huntersMark = { damageBonus: 0.5, ignoreDodge: true };
    battle.message = `${t.name} foi marcado! O próximo ataque contra ele não pode ser esquivado e dá +50% de dano.`;
    flashEnemyAt(t, 'white');
    spawnFloatingText(t, 'MARCA', '#c9a24d');
  },
};

// ---- Estimativa de dano (UI) ----
export function estimateSkillDamage(skillId) {
  const stat = classDamageStat();
  const atk = 2 + (effStat(stat) + (weaponBonus(playerEquip)[stat] || 0)) * 2;
  const ds  = effStat(stat) + (weaponBonus(playerEquip)[stat] || 0);

  switch (skillId) {
    case 'quick': {
      const base = atk;
      return { min: Math.max(1, base - 1), max: Math.floor((base + 1) * 1.5) };
    }
    case 'heavy': {
      const base = Math.round(atk * 1.8);
      return { min: Math.max(1, base - 1), max: Math.floor((base + 2) * 1.5) };
    }
    case 'spin': {
      const base = Math.round(atk * 1.3);
      return { min: Math.max(1, base), max: base };
    }
    case 'bolt': {
      const base = 3 + ds * 2;
      return { min: Math.max(1, base - 1), max: base + 1 };
    }
    case 'fireball': {
      const base = 5 + ds * 2;
      return { min: Math.max(1, base - 1), max: base + 2 };
    }
    case 'arcane': {
      const base = 5 + ds * 2;
      return { min: Math.max(1, base - 2), max: base + 2 };
    }
    case 'stab': {
      const base = 1 + ds * 1.5;
      return { min: Math.max(1, base - 1), max: base + 1 };
    }
    case 'backstab': {
      const base = Math.round((1 + ds * 1.5) * 1.6);
      return { min: Math.max(1, base - 1), max: base + 2 };
    }
    case 'aimed_shot': {
      const base = 1 + ds * 1.8;
      return { min: Math.max(1, Math.round(base - 1)), max: Math.floor(Math.round(base + 1) * 1.5) };
    }
    case 'piercing_arrow': {
      const base = 1 + ds * 1.6;
      return { min: Math.max(1, Math.round(base) - 1), max: Math.round(base) + 1 };
    }
    default:
      return null;
  }
}