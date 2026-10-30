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
//   do jogador ANTES das duas camadas acima. É a ferramenta para
//   minibosses e inimigos de biomas avançados não virarem "1 de
//   dano" quando o jogador tem armadura pesada.
//
//   Ex.: defPen = 0.4 → jogador com def 24 conta como def 14.4.
// ============================================================

const DEF_K   = 50;
const DEF_CAP = 0.75;

export function computeIncomingDamage(rawDmg, def) {
  const afterFlat = Math.max(1, rawDmg - def);
  const reduction = Math.min(DEF_CAP, def / (def + DEF_K));
  return Math.max(1, Math.round(afterFlat * (1 - reduction)));
}

// Ataque normal / carregado de um inimigo.
// `randFn` é injetável para testes; em produção usa rand(-1,1).
export function enemyAttackDamage(enemy, wasEnraged, def, randFn) {
  const baseAtk = enemy.atk + (enemy.atkMod || 0);
  const mul     = wasEnraged ? (enemy.chargeMul ?? 2.2) : 1.0;
  const raw     = Math.round(baseAtk * mul) + randFn(-1, 1);

  // Penetração: inimigos com defPen ignoram parte da def do jogador.
  // Sem defPen → effDef === def (comportamento idêntico ao anterior).
  const effDef = enemy.defPen ? def * (1 - enemy.defPen) : def;

  return computeIncomingDamage(raw, effDef);
}