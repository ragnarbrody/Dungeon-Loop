// src/ui/akmira-elder.js
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame, checkLevelUp } from '../core/state.js';
import {
  getActiveQuest, isQuestReadyToComplete, isQuestActive, isQuestCompleted,
  completeActiveQuest, activateQuest, getAvailableQuests, advanceObjective,
} from '../quests.js';
import { addItemToInventory } from '../items.js';
import { greeting, vocative, agree } from './classvocative.js';
import { showToast } from './toast.js';

export function talkToAkmiraElder() {
  // ============================================================
  // Quest de chegada (story_to_akmira) — ativa
  // ============================================================
  if (isQuestActive('story_to_akmira')) {
    // Avança o objetivo "talk_akmira_elder" (síncrono — o `getProgress`
    // do tipo 'interact' lê de state.progress, então essa chamada basta
    // pra `isQuestReadyToComplete` virar true no mesmo frame).
    advanceObjective('story_to_akmira', 'talk_akmira_elder', 1);

    if (isQuestReadyToComplete('story_to_akmira')) {
      openDialogue({
        title: 'Ancião de Akmira',
        text:
          `${greeting()} Então Aethel enviou alguém.\n\n` +
          `Ouvi falar de você — ${agree('do', 'da')} ${agree('Andarilho', 'Andarilha')} que trouxe a Árvore Mãe de volta. ` +
          `Ou, ao menos, o Núcleo dela. Isso já é mais do que qualquer um fez em anos.\n\n` +
          `Akmira tem problemas próprios. O oásis está secando. E o deserto... ` +
          `o deserto está acordando. Mas isso é conversa pra amanhã.\n\n` +
          `Descanse. Quando estiver ${agree('pronto', 'pronta')}, fale comigo de novo.`,
        actions: [{
          label: 'Receber recompensa',
          action: () => {
            const q = completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
            if (q) {
              showToast({
                itemId: 'map',
                title: 'Fast Travel desbloqueado',
                subtitle: 'Você agora pode viajar entre cidades pelo mapa (M).',
                color: '#8ad8ff',
                duration: 5000,
              });
            }
          },
        }],
      });
      return;
    }

    // Objetivo "reach_akmira" já foi concluído (o jogador chegou),
    // mas o "talk" acabou de ser avançado agora. Cai aqui só se o
    // jogador falou antes de chegar em Akmira (não deveria acontecer),
    // ou se o `advanceObjective` já tinha sido feito antes.
    // Em qualquer caso, mostra o "boa chegada" e sai.
    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()} Você chegou.\n\n` +
        `Sente-se. Akmira não é Aethel, mas ainda temos água e sombra. ` +
        `Descanse um pouco — o deserto cansa.`,
    });
    return;
  }

  // ============================================================
  // Quest de chegada já concluída (pós-entrega) — Akmira em paz
  // ============================================================
  if (isQuestCompleted('story_to_akmira')) {
    const active = getActiveQuest();
    if (active) {
      // Se o jogador aceitou alguma quest daqui (futuro), lembra ele
      openDialogue({
        title: 'Ancião de Akmira',
        text:
          `${greeting()} Você ainda está em "${active.title}".\n\n` +
          `${active.description}`,
      });
      return;
    }

    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()}\n\n` +
        `Akmira ainda está de pé. O oásis segura o deserto — por enquanto.\n\n` +
        `Quando o Conselho do Deserto se reunir, eu te chamarei. Até lá, ` +
        `as lojas estão abertas. A Joalheira chegou há pouco; talvez tenha ` +
        `algo que te interesse.`,
    });
    return;
  }

  // ============================================================
  // Jogador chegou em Akmira SEM ter a quest ativa (explorou por conta)
  // ============================================================
  // (não deveria acontecer na run normal, mas se acontecer, não
  //  oferecemos a quest daqui — ela é dada pelo Ancião de Aethel)
  const active = getActiveQuest();
  if (active) {
    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()} Você ainda está em "${active.title}".\n\n` +
        `${active.description}`,
    });
    return;
  }

  openDialogue({
    title: 'Ancião de Akmira',
    text:
      `${greeting()}\n\n` +
      `Akmira ainda está de pé. O oásis segura o deserto — por enquanto.\n\n` +
      `Se veio de Aethel, diga ao Ancião de lá que Akmira agradece. ` +
      `Se veio por conta própria... ${agree('bem-vindo', 'bem-vinda')}. As lojas estão abertas.`,
  });
}