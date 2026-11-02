// ============================================================
// CÃ¡lculo de dano â fonte Ãºnica de verdade.
//
// Duas camadas de defesa:
//   1) ReduÃ§Ã£o PLANA: cada ponto de def = -1 de dano (mÃ­nimo 1).
//   2) ReduÃ§Ã£o PERCENTUAL: def/(def + DEF_K), cap em DEF_CAP.
//
// DEF_K = 50  â em def=50, reduz 50%. Ponto de equilÃ­brio.
// DEF_CAP = 0.75 â nunca reduz mais de 75%.
//
// PenetraÃ§Ã£o de defesa (`defPen`):
//   Inimigos com `defPen` no template ignoram essa fraÃ§Ã£o da def
//   do jogador ANTES das duas camadas acima. Ã a ferramenta para
//   minibosses e inimigos de biomas avanÃ§ados nÃ£o virarem "1 de
//   dano" quando o jogador tem armadura pesada.
//
//   Ex.: defPen = 0.4 â jogador com def 24 conta como def 14.4.
// ============================================================

const DEF_K   = 50;
const DEF_CAP = 0.75;

export function computeIncomingDamage(rawDmg, def) {
  const afterFlat = Math.max(1, rawDmg - def);
  const reduction = Math.min(DEF_CAP, def / (def + DEF_K));
  return Math.max(1, Math.round(afterFlat * (1 - reduction)));
}

// Ataque normal / carregado de um inimigo.
// `randFn` Ã© injetÃ¡vel para testes; em produÃ§Ã£o usa rand(-1,1).
export function enemyAttackDamage(enemy, wasEnraged, def, randFn) {
  const baseAtk = enemy.atk + (enemy.atkMod || 0);
  const mul     = wasEnraged ? (enemy.chargeMul ?? 2.2) : 1.0;
  const raw     = Math.round(baseAtk * mul) + randFn(-1, 1);

  // PenetraÃ§Ã£o: inimigos com defPen ignoram parte da def do jogador.
  // Sem defPen â effDef === def (comportamento idÃªntico ao anterior).
  const effDef = enemy.defPen ? def * (1 - enemy.defPen) : def;

  return computeIncomingDamage(raw, effDef);
}