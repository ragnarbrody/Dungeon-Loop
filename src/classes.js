export const CLASSES = {
  knightess: {
    id: 'knightess',
    name: 'Cavaleira',
    description: 'Tanque. Força aumenta o dano, alta vida e defesa.',
    stats: { str: 2, agi: 1, int: 1, def: 1, vit: 2, magia: 1 },
    equip: { rightHand: 'sword', leftHand: 'shield' },
    baseMp: 4,
    skills: [
      { id: 'quick', name: 'Rápido',          icon: '⚔️', cost: 0, desc: 'Ataque rápido com a espada.' },
      { id: 'heavy', name: 'Forte',           icon: '💥', cost: 1, desc: 'Ataque forte, mais dano, mais chance de errar.' },
      { id: 'spin',  name: 'Golpe Giratório', icon: '🌀', cost: 3, desc: 'Ataque em área. Dano em todos os inimigos.' },
    ],
    damageStat: 'str',
  },
  mage: {
    id: 'mage',
    name: 'Mago',
    description: 'Dano mágico por Inteligência. Ignora defesa, pouca vida.',
    stats: { str: 1, agi: 2, int: 3, def: 1, vit: 1, magia: 3 },
    equip: { rightHand: 'staff', leftHand: null },
    baseMp: 10,
    skills: [
      { id: 'bolt',     name: 'Force Bolt',     icon: '✨', cost: 1, desc: 'Projétil mágico básico.' },
      { id: 'fireball', name: 'Bola de Fogo',   icon: '🔥', cost: 3, desc: 'Dano mágico que ignora a defesa do inimigo.' },
      { id: 'arcane',   name: 'Impacto Arcano', icon: '💫', cost: 6, desc: 'Dano mágico médio em TODOS os inimigos (ignora defesa).' },
    ],
    damageStat: 'int',
  },
  thief: {
    id: 'thief',
    name: 'Ladrão',
    description: 'Rápido e preciso. Agilidade aumenta o dano e a esquiva.',
    stats: { str: 1, agi: 3, int: 2, def: 1, vit: 1, magia: 1 },
    equip: { rightHand: 'dagger', leftHand: null },
    baseMp: 6,
    skills: [
      { id: 'stab',     name: 'Estocada',      icon: '🗡️', cost: 0, desc: 'Ataque rápido, sempre acerta.' },
      { id: 'backstab', name: 'Ataque Furtivo', icon: '🥷', cost: 2, desc: 'Ataque com dano extra.' },
      { id: 'shadow',   name: 'Sombra',        icon: '🌑', cost: 3, desc: 'Fica nas sombras: o inimigo erra o próximo ataque.' },
    ],
    damageStat: 'agi',
  },
  huntress: {
    id: 'huntress',
    name: 'Caçadora',
    description: 'Precisão à distância. Agilidade aumenta o dano e acertos.',
    stats: { str: 1, agi: 3, int: 1, def: 1, vit: 1, magia: 2 },
    //         ^str baixa (não é corpo a corpo)   ^agi alta (acerta)     ^vit/def baixas (frágil)
    equip: { rightHand: 'bow', leftHand: null },
    baseMp: 6,
    skills: [
      { id: 'aimed_shot',     name: 'Tiro Certeiro',    icon: '🎯', cost: 0, desc: 'Acerta qualquer inimigo, mesmo escondido ou voando.' },
      { id: 'piercing_arrow', name: 'Flecha Perfurante', icon: '🏹', cost: 2, desc: 'Atravessa todos. Dano decrescente, perfura defesa.' },
      { id: 'hunters_mark',   name: 'Marca do Caçador',  icon: '🩸', cost: 1, desc: 'Marca o alvo: próximo ataque não pode ser esquivado (+50% dano).' },
    ],
    damageStat: 'agi',
  },
};