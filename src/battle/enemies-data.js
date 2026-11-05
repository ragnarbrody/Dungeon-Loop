// ============================================================
// Dados-base dos inimigos. Puro "data" â sem lÃ³gica.
// Para adicionar um inimigo novo, basta adicionar uma entrada
// aqui. As habilidades especiais sÃ£o tratadas em
// `enemy-abilities.js` (mais abaixo).
//
// Campos opcionais por inimigo:
//   chargeChance / chargeMul  â ataque carregado
//   poisonChance              â aplica veneno ao acertar
//   bleedChance               â aplica sangramento ao acertar
//   dodgeChance               â chance de esquivar
//   defPen                    â ignora X% da def do jogador (0..1)
//   isMiniboss                â nÃ£o gera grupo, sempre 1
//   isBuffer                  â buffa aliados (escaravelho)
//   buffChance/buffDef/buffAtk/buffDuration
// ============================================================

export const ENEMIES = {
  slime: {
    name: 'Slime',
    hp: 8, maxHp: 8, atk: 4, def: 0, xp: 5,
    goldMin: 0, goldMax: 3,
  },
  rat: {
    name: 'Rato do Campo',
    hp: 12, maxHp: 12, atk: 5, def: 1, xp: 12,
    goldMin: 1, goldMax: 5,
  },
  goblin: {
    name: 'Goblin',
    hp: 18, maxHp: 18, atk: 8, def: 2, xp: 30,
    goldMin: 3, goldMax: 10,
    chargeChance: 0.35,
    chargeMul: 2.0,
  },
  scorpion: {
    name: 'EscorpiÃ£o',
    hp: 20, maxHp: 20, atk: 5, def: 0, xp: 22,
    goldMin: 2, goldMax: 8,
    poisonChance: 0.35,
  },
  vulture: {
    name: 'Abutre',
    hp: 8, maxHp: 8, atk: 6, def: 0, xp: 25,
    goldMin: 2, goldMax: 9,
    dodgeChance: 0.35,
  },
  mummy: {
    name: 'MÃºmia',
    hp: 28, maxHp: 28, atk: 9, def: 3, xp: 40,
    goldMin: 6, goldMax: 20,
    chargeChance: 0.5,
    chargeMul: 2.5,
  },
  scarab: {
    name: 'Escaravelho',
    hp: 7, maxHp: 7, atk: 3, def: 0, xp: 15,
    goldMin: 1, goldMax: 4,
    isBuffer: true,
    buffChance: 0.6,
    buffDef: 2,
    buffAtk: 1,
    buffDuration: 3,
  },
  bat: {
    name: 'Morcego Sombrio',
    hp: 12, maxHp: 12, atk: 6, def: 1, xp: 20,
    goldMin: 2, goldMax: 7,
    dodgeChance: 0.25,
    bleedChance: 0.30,
  },
  goblin_sergeant: {
    name: 'Sargento Goblin',
    hp: 75, maxHp: 75, atk: 12, def: 4, xp: 100,
    goldMin: 20, goldMax: 40,
    chargeChance: 0.45,
    chargeMul: 2.2,
    defPen: 0.4,          // ignora 40% da def do jogador
    isMiniboss: true,
  },
  guardian_fields: {
    id: 'guardian_fields',
    name: 'Árvore Mãe',
    hp: 120,
    atk: 13,              // ← era 10 (mais dano)
    def: 2,
    xp: 200,
    goldMin: 50,
    goldMax: 80,
    isMiniboss: true,
    isBoss: true,
    introText: 'A Árvore Mãe abre os olhos. As raízes se erguem — ela não vai deixar você levar o Núcleo.',

    // ---- Poder de stun: "Gravinas" ----
    // Chance por turno de enraizar o jogador (stun 1 turno).
    // Só dispara a partir do 2º turno do boss (dá tempo do jogador entender o padrão).
    rootAbility: {
      chance: 0.30,        // 30% por turno
      minTurn: 2,          // só a partir do 2º turno do boss
      message: (name) => `${name} lança Gravinas! Raízes prendem seus pés — você perde o próximo turno!`,
    },

    // ---- Invocação ----
    // Regra:
    //   - máximo de 2 aliados VIVOS (contando os invocados, não o boss)
    //   - se 2 vivos: não invoca
    //   - se 1 vivo: invoca +1
    //   - se 0 vivos: invoca 2
    //   - fase 1: invoca 'slime' (qtd configurável)
    //   - fase 2: invoca 'goblin' (qtd configurável)
    summons: {
      phase1: { id: 'slime',  qty: 2, everyTurns: 3 },
      phase2: { id: 'goblin', qty: 2, everyTurns: 3 },
      maxAlive: 2,
    },
    phase2: {
      hpThreshold: 0.5,
      def: 3,
      atk: 18,             // ← era 14 (fase 2 mais perigosa)
      healPerTurn: 6,
    },
    loreDrop: 'seed_of_fields',
  },
};