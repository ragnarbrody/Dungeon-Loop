// ============================================================
// Cálculo de dano — fonte única de verdade.
//
// Duas camadas de defesa:
//   1) Redução PLANA: cada ponto de def = -1 de dano (mínimo 1).
//   2) Redução PERCENTUAL: def/(def + DEF_K), cap em DEF_CAP.
//
// DEF_K = 50  → em def=50, reduz 50%. Ponto de equilíbrio.
// DEF_CAP = 0.75 → nunca reduz mais de 75%.
//
// Penetração de defesa (`defPen`):
//   Inimigos com `defPen` no template ignoram essa fração da def
//   do jogador ANTES das duas camadas acima.
//
// Resistência mágica (`magicResist`):
//   Inimigos com `magicResist` no template reduzem dano mágico em
//   X% ANTES das duas camadas acima. Só usado por skills mágicas
//   (bolt, fireball, arcane). O restante do dano ignora.
// ============================================================

const DEF_K   = 50;
const DEF_CAP = 0.75;

export function computeIncomingDamage(rawDmg, def) {
  const afterFlat = Math.max(1, rawDmg - def);
  const reduction = Math.min(DEF_CAP, def / (def + DEF_K));
  return Math.max(1, Math.round(afterFlat * (1 - reduction)));
}

// Dano mágico: aplica magicResist antes das camadas de defesa.
// Se o inimigo não tem `magicResist`, comporta-se igual a
// `computeIncomingDamage` (retrocompatível).
export function computeIncomingMagicDamage(rawDmg, def, magicResist = 0) {
  const resist = Math.max(0, Math.min(0.9, magicResist)); // cap 90%
  const afterResist = Math.max(1, rawDmg * (1 - resist));
  return computeIncomingDamage(afterResist, def);
}

// Ataque normal / carregado de um inimigo.
// `randFn` é injetável para testes; em produção usa rand(-1,1).
export function enemyAttackDamage(enemy, wasEnraged, def, randFn) {
  const baseAtk = enemy.atk + (enemy.atkMod || 0);
  const mul     = wasEnraged ? (enemy.chargeMul ?? 2.2) : 1.0;
  const raw     = Math.round(baseAtk * mul) + randFn(-1, 1);

  // Penetração: inimigos com defPen ignoram parte da def do jogador.
  const effDef = enemy.defPen ? def * (1 - enemy.defPen) : def;

  return computeIncomingDamage(raw, effDef);
}