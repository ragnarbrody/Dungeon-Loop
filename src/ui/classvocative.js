// src/ui/classvocative.js
import { playerStats } from '../core/state.js';
import { CLASSES } from '../classes.js';

// Vocativo + gênero de cada classe.
// Usado pra concordar "bem-vindo/a" e pra o NPC chamar o jogador.
const VOCATIVE_BY_CLASS = {
  knightess: { vocative: 'Cavaleira', gender: 'f' },
  mage:      { vocative: 'Mago',      gender: 'm' },
  thief:     { vocative: 'Ladrão',    gender: 'm' },
  huntress:  { vocative: 'Caçadora',  gender: 'f' },
};

// Fallback: se a classe não estiver mapeada (ex: bug, save antigo sem classId),
// usa o nome da classe do CLASSES ou "Andarilho" como último recurso.
function getVocativeInfo() {
  const clsId = playerStats.classId;
  if (clsId && VOCATIVE_BY_CLASS[clsId]) {
    return VOCATIVE_BY_CLASS[clsId];
  }
  // Fallback 1: nome da classe (sem gênero definido) → assume masculino
  if (clsId && CLASSES[clsId]) {
    return { vocative: CLASSES[clsId].name, gender: 'm' };
  }
  // Fallback 2: lore
  return { vocative: 'Andarilho', gender: 'm' };
}

// "Bem-vindo, Mago." / "Bem-vinda, Caçadora."
export function greeting() {
  const { vocative, gender } = getVocativeInfo();
  const bem = gender === 'f' ? 'Bem-vinda' : 'Bem-vindo';
  return `${bem}, ${vocative}.`;
}

// Só o vocativo, se o NPC quiser chamar o jogador no meio da fala.
// Ex: "Você de novo, Caçadora?"
export function vocative() {
  return getVocativeInfo().vocative;
}

// Gênero ('m' | 'f'), caso o NPC precise concordar outra palavra.
export function gender() {
  return getVocativeInfo().gender;
}

// "o Mago" / "a Caçadora" — artigo definido + vocativo.
// Útil pra frases como "o Mago precisa descansar".
export function theVocative() {
  const { vocative, gender } = getVocativeInfo();
  const article = gender === 'f' ? 'a' : 'o';
  return `${article} ${vocative}`;
}

export function agree(masc, fem) {
  return getVocativeInfo().gender === 'f' ? fem : masc;
}