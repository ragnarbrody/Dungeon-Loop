import { ENEMIES } from './enemies-data.js';

// ============================================================
// Escalonamento e geração de grupos.
// ============================================================

// ---- Balanceamento base ----
// scale 0.12: crescimento suave de ATK/HP em Campos.
// xp    0.8:  XP recompensa proporcionalmente mais.
const SCALE_PER_LEVEL = 0.12;
const XP_SCALE_MUL    = 0.8;

// ---- Bônus de escala por bioma ----
// O deserto é o segundo bioma e precisa de mais desafio
// (jogador chega nv 7-11 com kit completo). O bônus NÃO se
// aplica aos Campos, então o early game continua igual.
const BIOME_SCALE_BONUS = {
  fields: 0,
  desert: 0.18,
  cave:   0.05,
};

export function getScaledEnemy(template, playerLevel, biomeId = 'fields') {
  // Miniboss: NÃO aplica o bônus de bioma. O miniboss já tem
  // stats-base mais altos que o inimigo comum — o bônus empilhado
  // o tornava injusto (ex.: 306 HP e 40 ATK no nv 9 no deserto).
  const biomeBonus = template.isMiniboss ? 0 : (BIOME_SCALE_BONUS[biomeId] || 0);

  const scale = (playerLevel - 1) * (SCALE_PER_LEVEL + biomeBonus);
  const hpBonus  = Math.floor(template.hp  * scale);
  const atkBonus = Math.floor(template.atk * scale);

  return {
    ...template,
    hp:    template.hp  + hpBonus,
    maxHp: template.hp  + hpBonus,
    atk:   template.atk + atkBonus,
    def:   template.def + Math.floor(scale / 2),
    xp:    Math.floor(template.xp * (1 + scale * XP_SCALE_MUL)),

    frozen: 0,
    stunned: 0,
    poison: 0,

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

// ============================================================
// GRUPOS CURADOS DO DESERTO
//
// Hoje o buildEnemyGroup sorteia cada inimigo do pool. Isso já
// dá grupos MISTOS quando o pool tem >1 tipo. Mas alguns grupos
// são TATICAMENTE interessantes e merecem aparecer com chance
// fixa, pra dar identidade ao bioma:
//
//   - "patrulha": 1 múmia + 2 escaravelhos (buffer + tanque)
//   - "emboscada": 2 escorpiões + 1 abutre (veneno + esquiva)
//
// Só se aplica no deserto. Se o jogador estiver num grupo curado,
// os inimigos ainda são escalonados por nível.
// ============================================================
const DESERT_CURATED_GROUPS = [
  {
    id: 'patrol',
    chance: 0.30,
    ids: ['mummy', 'scarab', 'scarab'],
  },
  {
    id: 'ambush',
    chance: 0.20,
    ids: ['scorpion', 'scorpion', 'vulture'],
  },
];

export function buildEnemyGroup(chosenId, playerLevel, pool = null, biomeId = 'fields') {
  const template = ENEMIES[chosenId];
  const isMiniboss = template && template.isMiniboss;

  // Miniboss: sempre 1, sem grupo.
  if (isMiniboss) {
    const scaled = getScaledEnemy(template, playerLevel, biomeId);
    return [{ ...scaled, id: chosenId, name: template.name }];
  }

  // ---- Grupo curado (só no deserto, se não for boss) ----
  if (biomeId === 'vulcano') {
    const roll = Math.random();
    let acc = 0;
    for (const group of DESERT_CURATED_GROUPS) {
      acc += group.chance;
      if (roll < acc) {
        return group.ids.map(id => {
          const base = ENEMIES[id] || ENEMIES.slime;
          const safeId = ENEMIES[id] ? id : 'slime';
          const scaled = getScaledEnemy(base, playerLevel, biomeId);
          return { ...scaled, id: safeId, name: base.name };
        });
      }
    }
    // Se não caiu em nenhum grupo curado, cai no sorteio normal abaixo.
  }

  // ---- Sorteio normal (mantém o comportamento antigo) ----
  let count = 1;
  if (playerLevel >= 2) {
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
    const scaled = getScaledEnemy(base, playerLevel, biomeId);
    enemies.push({ ...scaled, id: safeId, name: base.name });
  }
  return enemies;
}

export function buildFixedGroup(ids, playerLevel, biomeId = 'fields') {
  return ids.map(id => {
    const base = ENEMIES[id] || ENEMIES.slime;
    const safeId = ENEMIES[id] ? id : 'slime';
    const scaled = getScaledEnemy(base, playerLevel, biomeId);
    return { ...scaled, id: safeId, name: base.name };
  });
}