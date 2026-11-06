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
    name: 'Escorpião',
    hp: 20, maxHp: 20, atk: 5, def: 0, xp: 22,
    goldMin: 10, goldMax: 25,
    poisonChance: 0.35,
    // ---- Calibragem do deserto ----
    defPen: 0.15,        // ferrão perfura parte da armadura
    magicResist: 0.10,   // exoesqueleto quitinoso
  },
  vulture: {
    name: 'Abutre',
    hp: 8, maxHp: 8, atk: 6, def: 0, xp: 25,
    goldMin: 7, goldMax: 15,
    dodgeChance: 0.35,
    // ---- Calibragem do deserto ----
    magicResist: 0.0,    // pena e osso, magia passa direto
  },
  mummy: {
    name: 'Múmia',
    hp: 28, maxHp: 28, atk: 9, def: 3, xp: 40,
    goldMin: 25, goldMax: 55,
    chargeChance: 0.5,
    chargeMul: 2.5,
    // ---- Calibragem do deserto ----
    defPen: 0.25,        // tecido antigo agarra e atravessa armadura
    magicResist: 0.25,   // resina e tecido absorvem magia
  },
  scarab: {
    name: 'Escaravelho',
    hp: 7, maxHp: 7, atk: 3, def: 0, xp: 15,
    goldMin: 5, goldMax: 10,
    isBuffer: true,
    buffChance: 0.6,
    buffDef: 2,
    buffAtk: 1,
    buffDuration: 3,
    // ---- Calibragem do deserto ----
    magicResist: 0.15,   // casco duro, mas pequeno
  },
  bat: {
    name: 'Morcego Sombrio',
    hp: 12, maxHp: 12, atk: 6, def: 1, xp: 20,
    goldMin: 6, goldMax: 12,
    dodgeChance: 0.25,
    bleedChance: 0.30,
  },
  goblin_sergeant: {
    name: 'Sargento Goblin',
    hp: 65, maxHp: 65, atk: 10, def: 4, xp: 100,
    goldMin: 20, goldMax: 40,
    chargeChance: 0.45,
    chargeMul: 2.2,
    defPen: 0.4,
    isMiniboss: true,
  },
  // ============================================================
  // MINIBOSS DO DESERTO — Escorpião Gigante
  // Só aparece como miniboss de dungeon do deserto (nunca no bioma
  // aberto). Reusa o sprite do escorpião com escala maior no mapa.
  // Equivalente ao goblin_sergeant das cavernas dos Campos.
  // ============================================================
  scorpion_giant: {
    name: 'Escorpião Gigante',
    hp: 75, maxHp: 75, atk: 11, def: 4, xp: 140,
    goldMin: 40, goldMax: 80,
    poisonChance: 0.5,
    poisonDmgMul: 0.30,
    defPen: 0.30,
    magicResist: 0.12,
    chargeChance: 0.4,
    chargeMul: 1.9,
    isMiniboss: true,
  },
  guardian_fields: {
    id: 'guardian_fields',
    name: 'Árvore Mãe',
    hp: 120,
    atk: 13,
    def: 2,
    xp: 200,
    goldMin: 50,
    goldMax: 80,
    isMiniboss: true,
    isBoss: true,
    introText: 'A Árvore Mãe abre os olhos. As raízes se erguem — ela não vai deixar você levar o Núcleo.',
    rootAbility: {
      chance: 0.30,
      minTurn: 2,
      message: (name) => `${name} lança Gravinas! Raízes prendem seus pés — você perde o próximo turno!`,
    },
    summons: {
      phase1: { id: 'slime',  qty: 2, everyTurns: 3 },
      phase2: { id: 'goblin', qty: 2, everyTurns: 3 },
      maxAlive: 2,
    },
    phase2: {
      hpThreshold: 0.5,
      def: 3,
      atk: 18,
      healPerTurn: 6,
    },
    loreDrop: 'seed_of_fields',
  },
};