// src/ui/herbalistdialog.js
// ============================================================
// Diálogo da Herbalista.
//
// Fluxo:
//   1) Se a quest ativa é entregue a ela E está pronta → entrega.
//   2) Se a quest ativa é entregue a ela E NÃO está pronta → lembrete.
//   3) Caso contrário → abre a loja.
//
// Quem decide se abre loja ou diálogo é o input.js (via kind do interactable).
// A herbalista usa `greeting()` pra se apresentar.
// ============================================================
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame } from '../core/state.js';
import {
  getActiveQuest, isQuestReadyToComplete, getTurnInNpc,
  completeActiveQuest, getProgress,
} from '../quests.js';
import { addItemToInventory } from '../items.js';
import { greeting, vocative, agree } from './classvocative.js';

// Retorna true se a herbalista tem algo a dizer (quest ativa ligada a ela).
export function hasHerbalistQuest() {
  const q = getActiveQuest();
  if (!q) return false;
  return getTurnInNpc(q) === 'herbalist';
}

// Diálogo da herbalista quando há quest ativa.
export function talkToHerbalist() {
  const q = getActiveQuest();
  if (!q || getTurnInNpc(q) !== 'herbalist') {
    // Fallback: não deveria chegar aqui, mas se chegar, não faz nada.
    // O input.js decide abrir a loja nesse caso.
    return false;
  }

  if (isQuestReadyToComplete(q.id)) {
    // ---- Entrega ----
    openDialogue({
      title: 'Herbalista',
      text:
        `${greeting()} Você conseguiu as caudas! Agora posso preparar o remédio.\n\n` +
        `Muito obrigada, ${vocative()}. Aethel inteira agradece. ` +
        `Aqui, aceite isto.`,
      actions: [
        {
          label: 'Receber recompensa',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
          },
        },
      ],
    });
    return true;
  }

  // ---- Lembrete ----
  const obj = q.objectives[0];
  const cur = getProgress(q.id, obj.id);
  openDialogue({
    title: 'Herbalista',
    text:
      `${greeting()} Ainda preciso das caudas, ${vocative()}.\n\n` +
      `Você tem ${cur} de ${obj.target}. ` +
      `Os ratos do campo andam pelos arredores de Aethel.`,
  });
  return true;
}