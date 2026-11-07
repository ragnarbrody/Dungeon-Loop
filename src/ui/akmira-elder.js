// src/ui/akmira-elder.js
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame, checkLevelUp } from '../core/state.js';
import {
  getActiveQuest, isQuestReadyToComplete, isQuestActive, isQuestCompleted,
  completeActiveQuest, activateQuest, getAvailableQuests, advanceObjective,
  isWellQuestViolent, isWellQuestPeaceful
} from '../quests.js';
import { addItemToInventory } from '../items.js';
import { greeting, vocative, agree } from './classvocative.js';
import { showToast } from './toast.js';

export function talkToAkmiraElder() {
  // ============================================================
  // 1) Quest de chegada (story_to_akmira) — ativa
  // ============================================================
  if (isQuestActive('story_to_akmira')) {
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
  // 2) ENTREGA da desert_moral (prioridade sobre "Akmira em paz")
  // ============================================================
  if (
    isQuestActive('desert_moral') &&
    isQuestReadyToComplete('desert_moral')
  ) {
    const violent = isWellQuestViolent();
    const peaceful = isWellQuestPeaceful();

    // Ajusta a recompensa antes de completar (a quest base é xp:180, gold:140)
    const extra = violent ? 180 : peaceful ? 70 : 0;

    openDialogue({
      title: 'Ancião de Akmira',
      text: violent
        ? `${greeting()}\n\n` +
          `Eu sinto o peso do que você fez. A água é de Akmira, sim. ` +
          `Mas o preço foi sangue. E sangue não lava fácil.\n\n` +
          `Aceite isto. Não como recompensa — como lembrete de que, ` +
          `no deserto, toda escolha tem um custo.`
        : `${greeting()}\n\n` +
          `Você falou com eles. Não sei o que disse, nem o que ofereceu. ` +
          `Mas Akmira tem o poço de volta — e ninguém morreu por isso.\n\n` +
          `Isso é mais raro do que você imagina. Aceite isto.`,
      actions: [
        {
          label: 'Receber',
          action: () => {
            if (extra) {
              const q = getActiveQuest();
              if (q) q.rewards.gold = (q.rewards.gold || 0) + extra;
            }
            const q = completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
            if (q) {
              // Dispara a cutscene de cliffhanger (fim da demo)
              import('../battle/cutscene.js').then(mod => {
                mod.playOutroCutscene(
                  mod.DESERT_CLIFFHANGER_SCENES,
                  () => { saveGame(); }
                );
              }).catch(console.error);
            }
          },
        },
      ],
    });
    return;
  }

  // ============================================================
  // 3) desert_moral ATIVA mas AINDA NÃO pronta — lembrete
  // ============================================================
  if (isQuestActive('desert_moral')) {
    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()}\n\n` +
        `O poço ainda está nas mãos deles. Vá até lá — a oeste, no meio ` +
        `das dunas. O mapa (M) mostra o caminho.\n\n` +
        `Decida o que for preciso. Eu confio no seu julgamento.`,
    });
    return;
  }

  // ============================================================
  // 4) OFERTA da desert_moral (chegou aqui = não está ativa, não foi feita)
  //    Requer story_to_akmira concluída.
  // ============================================================
  if (
    isQuestCompleted('story_to_akmira') &&
    !isQuestCompleted('desert_moral') &&
    !isQuestActive('desert_moral')
  ) {
    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()}\n\n` +
        `Há um poço no meio das dunas, a oeste. Akmira depende dele. ` +
        `Mas um grupo de saqueadores se instalou lá — refugiados de outro anel, ` +
        `segundo eles. Podem estar mentindo. Podem estar dizendo a verdade.\n\n` +
        `Eu não vou mandar ninguém daqui pra resolver à força. Não é o nosso jeito. ` +
        `Mas você... você é um Andarilho. A Fratura te marcou, mas não te consumiu. ` +
        `Você pode ir até lá. Pode falar com eles. Ou pode fazer o que achar necessário.\n\n` +
        `Vá. E decida. Eu confio no seu julgamento — seja ele qual for.`,
      actions: [
        {
          label: 'Aceitar',
          action: () => {
            activateQuest('desert_moral');
            saveGame();
            closeDialogue();
          },
        },
        {
          label: 'Agora não',
          action: () => closeDialogue(),
        },
      ],
    });
    return;
  }

  // ============================================================
  // 5) desert_moral CONCLUÍDA — fim da demo (Akmira em paz)
  // ============================================================
  if (isQuestCompleted('desert_moral')) {
    openDialogue({
      title: 'Ancião de Akmira',
      text:
        `${greeting()}\n\n` +
        `Akmira ainda está de pé. O oásis segura o deserto — por enquanto.\n\n` +
        `O que você fez pelo poço vai ecoar por muito tempo. Quando o Conselho ` +
        `do Deserto se reunir, eu te chamarei. Até lá, as lojas estão abertas. ` +
        `A Joalheira chegou há pouco; talvez tenha algo que te interesse.`,
    });
    return;
  }

  // ============================================================
  // 6) Fallback — quest ativa genérica (outras quests)
  // ============================================================
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

  // ============================================================
  // 7) Sem quest, sem nada — Akmira em paz
  // ============================================================
  openDialogue({
    title: 'Ancião de Akmira',
    text:
      `${greeting()}\n\n` +
      `Akmira ainda está de pé. O oásis segura o deserto — por enquanto.\n\n` +
      `Se veio de Aethel, diga ao Ancião de lá que Akmira agradece. ` +
      `Se veio por conta própria... ${agree('bem-vindo', 'bem-vinda')}. As lojas estão abertas.`,
  });
}