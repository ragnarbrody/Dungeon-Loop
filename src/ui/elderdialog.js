// src/ui/elderdialog.js
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame } from '../core/state.js';
import {
  hasSeenElderIntro, markElderIntroSeen,
  getAvailableQuests, getActiveQuest, isQuestReadyToComplete,
  activateQuest, completeActiveQuest,
  getTurnInNpc,
} from '../quests.js';
import { addItemToInventory } from '../items.js';
import { greeting, vocative } from './classvocative.js';

// Texto de lore da introdução. A saudação inicial é dinâmica (via greeting()),
// então essa constante NÃO começa com "Bem-vindo" — ela é concatenada depois.
const LORE_INTRO =
  'Há muito tempo, o mundo era inteiro. Havia um continente verde, e no centro dele, uma torre que ligava a base ao topo.\n\n' +
  'Então veio a Fratura. Ninguém sabe por quê. Ela partiu o continente em anéis, isolou os pedaços, e moldou os seres vivos de cada um.\n\n' +
  'Aethel é o último lugar que a Fratura não tocou. É por isso que ainda estamos aqui.\n\n' +
  'Você é um Andarilho — um dos raros que a Fratura não consegue consumir. Só você pode atravessar os anéis e voltar.\n\n' +
  'O Portal Antigo no centro da praça é o que resta da torre. Ele precisa de 8 Núcleos para abrir o caminho de volta ao centro do mundo.\n\n' +
  'Mas antes de pensar no Portal, há problemas mais próximos. Os arredores de Aethel estão infestados de criaturas. Se você me ajudar, eu te ajudo a entender o caminho.';

export function talkToElder() {
  // Primeira vez: diálogo de lore, depois oferece quests
  if (!hasSeenElderIntro()) {
    openDialogue({
      title: 'Ancião de Aethel',
      // Saudação dinâmica no topo + lore
      text: `${greeting()}\n\n${LORE_INTRO}`,
      actions: [
        {
          label: 'Entendi. O que precisa?',
          action: () => {
            markElderIntroSeen();
            saveGame();
            closeDialogue();
            offerQuests();
          },
        },
      ],
    });
    return;
  }

  offerQuests();
}

// Mostra a tela de oferta de quests (ou entrega, se a ativa estiver pronta).
export function offerQuests() {
  const active = getActiveQuest();

  // ---- Se a quest ativa NÃO é entregue ao Ancião, ele só orienta ----
  if (active && getTurnInNpc(active) !== 'elder') {
    if (isQuestReadyToComplete(active.id)) {
      openDialogue({
        title: 'Ancião de Aethel',
        text:
          `Você já tem o que a Herbalista precisa, ${vocative()}.\n\n` +
          `Vá até ela para entregar. O remédio não pode esperar.`,
      });
    } else {
      openDialogue({
        title: 'Ancião de Aethel',
        text:
          `A Herbalista ainda precisa da sua ajuda, ${vocative()}.\n\n` +
          `${active.description}\n\n` +
          `Fale com ela quando tiver os itens.`,
      });
    }
    return;
  }

  // ---- Se tem quest ativa e pronta pra entregar AO ANCIÃO: entrega ----
  if (active && isQuestReadyToComplete(active.id)) {
    const q = active;
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `Você cumpriu o que pedi, ${vocative()}. "${q.title}" está concluída.\n\n` +
        `Aceite isto como agradecimento.`,
      actions: [
        {
          label: 'Receber recompensa',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            offerQuests();
          },
        },
      ],
    });
    return;
  }

  // ---- Lembrete de quest ativa (não pronta) ----
  if (active) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `Você ainda está em "${active.title}", ${vocative()}.\n\n` +
        `${active.description}`,
    });
    return;
  }

  // ---- Sem quest ativa: oferece as disponíveis ----
  const available = getAvailableQuests();
  if (available.length === 0) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()}\n\n` +
        `Por ora, não tenho mais nada para pedir, ${vocative()}. ` +
        `Volte quando o Portal estiver mais perto.`,
    });
    return;
  }

  // Oferece a próxima (a primeira da lista, que respeita prereq)
  const q = available[0];
  openDialogue({
    title: 'Ancião de Aethel',
    text:
      `${q.description}\n\n` +
      `Aceita a tarefa, ${vocative()}?`,
    actions: [
      {
        label: 'Aceitar',
        action: () => {
          activateQuest(q.id);
          saveGame();
          closeDialogue();
        },
      },
    ],
  });
}