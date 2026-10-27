// src/ui/blacksmithdialog.js
// ============================================================
// Diálogo do Ferreiro.
//
// Fluxo:
//   1) Se a quest ativa é entregue a ele E está pronta → entrega.
//   2) Se a quest ativa é entregue a ele E NÃO está pronta → lembrete.
//   3) Caso contrário → não deveria chegar aqui (o input.js
//      decide abrir a loja nesse caso).
// ============================================================
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame, checkLevelUp } from '../core/state.js';
import {
  getActiveQuest, isQuestReadyToComplete, getTurnInNpc,
  completeActiveQuest, getProgress,
} from '../quests.js';
import { addItemToInventory } from '../items.js';
import { greeting, vocative } from './classvocative.js';

// Retorna true se o Ferreiro tem algo a dizer (quest ativa ligada a ele).
export function hasBlacksmithQuest() {
  const q = getActiveQuest();
  if (!q) return false;
  return getTurnInNpc(q) === 'blacksmith';
}

// Diálogo do Ferreiro quando há quest ativa.
export function talkToBlacksmith() {
  const q = getActiveQuest();
  if (!q || getTurnInNpc(q) !== 'blacksmith') return false;

  if (isQuestReadyToComplete(q.id)) {
    // ---- Entrega ----
    openDialogue({
      title: 'Ferreiro',
      text:
        `${greeting()} Tá tudo aqui. Dente, geleia, pinça, ovo... ` +
        `Não pergunte pra que serve, mas vai dar um caldeirão dos bons.\n\n` +
        `Aqui, o pagamento. E leva essas poções de brinde.`,
      actions: [
        {
          label: 'Receber recompensa',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
          },
        },
      ],
    });
    return true;
  }

  // ---- Lembrete ----
  const lines = q.objectives.map(obj => {
    const cur = getProgress(q.id, obj.id);
    return `• ${obj.text}: ${cur}/${obj.target}`;
  }).join('\n');

  openDialogue({
    title: 'Ferreiro',
    text:
      `${greeting()} Ainda falta material pra o caldeirão, ${vocative()}.\n\n` +
      `${lines}\n\n` +
      `O deserto é logo a oeste de Aethel. Cuidado com os escorpiões — e com os abutres, que não gostam de entregar os ovos.`,
  });
  return true;
}