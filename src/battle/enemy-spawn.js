import { ENEMIES } from './enemies-data.js';

// ============================================================
// Escalonamento e geração de grupos.
// ============================================================

// ---- Balanceamento aplicado ----
// scale 0.12 (era 0.2): crescimento mais suave de ATK/HP.
// xp   0.8  (era 0.5): XP recompensa proporcionalmente mais
//                     para não virar grind quando o ATK cai.
const SCALE_PER_LEVEL = 0.12;
const XP_SCALE_MUL    = 0.8;

export function getScaledEnemy(template, playerLevel) {
  const scale = (playerLevel - 1) * SCALE_PER_LEVEL;
  const hpBonus  = Math.floor(template.hp  * scale);
  const atkBonus = Math.floor(template.atk * scale);

  return {
    ...template,
    hp:    template.hp  + hpBonus,
    maxHp: template.hp  + hpBonus,
    atk:   template.atk + atkBonus,
    def:   template.def + Math.floor(scale / 2),
    xp:    Math.floor(template.xp * (1 + scale * XP_SCALE_MUL)),

    // ---- Status ----
    frozen: 0,
    stunned: 0,
    poison: 0,

    // ---- Habilidades ----
    hiding: 0,
    hideCooldown: 0,
    enraged: 0,
    chargeTurn: 0,
    buffDef: 0,
    buffAtk: 0,
    usedAllyBuff: false,
    atkMod: 0,
    defMod: 0,
    flyingAway: false,
    isBuffer: template.isBuffer || false,
    scarabBuff: null,
  };
}

export function buildEnemyGroup(chosenId, playerLevel, pool = null) {
  const template = ENEMIES[chosenId];
  const isMiniboss = template && template.isMiniboss;

  // Quantidade: 1..3 baseado no nível (miniboss sempre 1)
  let count = 1;
  if (!isMiniboss && playerLevel >= 2) {
    const chance2 = Math.min(0.5, 0.15 + playerLevel * 0.03);
    const chance3 = playerLevel >= 5
      ? Math.min(0.3, (playerLevel - 4) * 0.03)
      : 0;
    if (Math.random() < chance3) count = 3;
    else if (Math.random() < chance2) count = 2;
  }

  const enemies = [];
  for (let i = 0; i < count; i++) {
    let enemyId = chosenId;
    if (pool && pool.length > 0) {
      enemyId = pool[Math.floor(Math.random() * pool.length)];
    }
    const base = ENEMIES[enemyId] || ENEMIES.slime;
    const safeId = ENEMIES[enemyId] ? enemyId : 'slime';
    const scaled = getScaledEnemy(base, playerLevel);
    enemies.push({ ...scaled, id: safeId, name: base.name });
  }
  return enemies;
}