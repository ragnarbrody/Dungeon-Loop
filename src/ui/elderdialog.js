// src/ui/elderdialog.js
import { openDialogue, closeDialogue } from './dialogue.js';
import { playerStats, saveGame, checkLevelUp } from '../core/state.js';
import {
  hasSeenElderIntro, markElderIntroSeen,
  getAvailableQuests, getActiveQuest, isQuestReadyToComplete,
  activateQuest, completeActiveQuest,
  getTurnInNpc, isQuestCompleted, isQuestActive, areProceduralCavesUnlocked, hasSeenCaveCollapseLore,
  markCaveCollapseLoreSeen, isBannerQuestViolent
} from '../quests.js';
import { addItemToInventory, removeItem } from '../items.js';
import { greeting, vocative } from './classvocative.js';
import { talkToAkmiraElder } from './akmira-elder.js';

const LORE_INTRO =
  'Você chegou numa hora estranha. Aethel é a última parada antes do fim — e o anel lá fora já começa a ceder.\n\n' +
  'Você chegou a pé. Ninguém chega a pé. A Fratura desfaz quem tenta. Você não foi desfeito — então ou você é um Andarilho, ou é a Fratura disfarçada. E a Fratura não conversa.';

const LORE_DEEP =
  'Cada anel tem um Guardião. Uma criatura — ou uma pessoa, não sei mais — que carrega um Núcleo, um pedaço da torre de antes. Enquanto o Guardião vive, o anel fica de pé. Se ele cai, o anel racha um pouco mais. Por isso ninguém vai atrás deles.\n\n' +
  'O Portal na praça é o que restou da base da torre. Oito encaixes, oito Núcleos. Se os oito forem colocados, o caminho para o centro se abre. O que há lá, eu não sei.\n\n' +
  'A Fratura marca você, mas não consegue consumir. Só um Andarilho atravessa os anéis e volta. Já vi outros como você partirem. Nenhum chegou a abrir o Portal.';

// ============================================================
// Helpers de estado narrativo
// ============================================================
function storyGuardianPrepCompletedButCoreNotInserted() {
  return isQuestCompleted('story_guardian_prep')
      && playerStats.portalInserted.size === 0;
}

function coreInsertedButNotYetSpoken() {
  return isQuestCompleted('story_guardian_prep')
      && playerStats.portalInserted.size >= 1
      && !playerStats._elderSawCoreInserted;
}

// Já recebeu a fala pós-núcleo e ainda não foi pra Akmira
function readyToOfferAkmira() {
  return isQuestCompleted('story_guardian_prep')
      && playerStats.portalInserted.size >= 1
      && playerStats._elderSawCoreInserted
      && !isQuestActive('story_to_akmira')
      && !isQuestCompleted('story_to_akmira');
}

export function talkToElder(cityId = 'aethel') {
  if (cityId === 'akmira') {
    talkToAkmiraElder();
    return;
  }

  if (!hasSeenElderIntro()) {
    openDialogue({
      title: 'Ancião de Aethel',
      text: `${greeting()}\n\n${LORE_INTRO}`,
      actions: [
        {
          label: 'O que aconteceu com o mundo?',
          action: () => {
            markElderIntroSeen();
            saveGame();
            closeDialogue();
            openLoreDeep();
          },
        },
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

function openLoreDeep() {
  openDialogue({
    title: 'A Fratura',
    text: LORE_DEEP,
    actions: [
      {
        label: 'Entendi. O que precisa?',
        action: () => {
          closeDialogue();
          offerQuests();
        },
      },
    ],
  });
}

export function offerQuests() {
  const active = getActiveQuest();

  // ============================================================
  // PÓS-BOSS: pede pra inserir o núcleo primeiro
  // ============================================================
  if (storyGuardianPrepCompletedButCoreNotInserted()) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Você voltou — e o Núcleo está com você.\n\n` +
        `Antes de conversarmos mais, ${vocative()}, coloque o Núcleo no Portal. ` +
        `Ele precisa voltar pro lugar de onde nunca deveria ter saído.\n\n` +
        `Depois volte aqui. Precisamos falar sobre o que vem a seguir.`,
    });
    return;
  }

  // ============================================================
  // PÓS-BOSS: núcleo inserido, primeira conversa (narrativa)
  // ============================================================
  if (coreInsertedButNotYetSpoken()) {
    playerStats._elderSawCoreInserted = true;
    saveGame();
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Sinto o anel. Sinto ele respirar de novo.\n\n` +
        `Os Campos... ainda estão instáveis, ${vocative()}. Sem a Árvore Mãe, ` +
        `o anel perdeu parte do que o mantinha de pé. Não vai cair hoje, nem amanhã. ` +
        `Mas com o tempo, vai.\n\n` +
        `Mas você trouxe a semente. Eu a senti quando você entrou em Aethel.\n\n` +
        `Talvez — só talvez — haja uma forma de plantá-la. De fazer o anel voltar ` +
        `a ter um Guardião. Não agora. Mas há esperança.\n\n` +
        `Descanse, ${vocative()}. Você fez o que precisava. O que vem a seguir, ` +
        `faremos juntos.`,
    });
    return;
  }

  // ============================================================
  // PÓS-BOSS: oferece a viagem pra Akmira
  // ============================================================
  if (readyToOfferAkmira()) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Antes de você partir, ${vocative()}, há algo que preciso te contar.\n\n` +
        `Aethel está segura. Pela primeira vez em muito tempo, o anel respira. ` +
        `Isso é obra sua — e não será esquecido.\n\n` +
        `Mas recebi uma mensagem. O Ancião de Akmira, no deserto, pediu ajuda. ` +
        `A cidade fica a oeste, além dos Campos, alguns dias de viagem a pé.\n\n` +
        `Eu não posso ir. Mas você... você pode. Se Akmira cair, o deserto inteiro cai junto.\n\n` +
        `Vá até lá. Fale com o Ancião de Akmira. E decida, mais uma vez, o que fazer.`,
      actions: [
        {
          label: 'Aceitar',
          action: () => {
            activateQuest('story_to_akmira');
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

  // ---- Lore pós-quest 5.2: cavernas procedurais liberadas ----
  if (areProceduralCavesUnlocked() && !hasSeenCaveCollapseLore()) {
    markCaveCollapseLoreSeen();
    saveGame();
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `Soube que conseguiu resgatar o Corin, ${vocative()}.\n\n` +
        `Ele conseguiu sair por uma passagem secreta na caverna — e me avisou dos seus feitos.\n\n` +
        `Mas há algo mais. Soube, através de outros viajantes, que cavernas começaram a aparecer por todo o anel externo. Fendas onde antes havia só campo.\n\n` +
        `A Fratura está se desestabilizando. Cada vez mais.\n\n` +
        `Tome cuidado em suas viagens. Se encontrar uma dessas cavernas, entre. Lá dentro, o que a Fratura esconde pode valer a pena.`,
      actions: [
        {
          label: 'Entendi.',
          action: () => {
            closeDialogue();
            offerQuests();
          },
        },
      ],
    });
    return;
  }

  // ---- Se a quest ativa NÃO é entregue ao Ancião, ele só orienta ----
  if (active && getTurnInNpc(active) !== 'elder') {
    const turnIn = getTurnInNpc(active);
    const npcName = turnIn === 'herbalist' ? 'Herbalista'
                  : turnIn === 'blacksmith' ? 'Ferreiro'
                  : turnIn;
    const npcLore = turnIn === 'herbalist'
      ? 'O remédio não pode esperar.'
      : turnIn === 'blacksmith'
        ? 'Ele está na forja, no canto da cidade. Vai precisar de cada material.'
        : 'Fale com ele.';

    if (isQuestReadyToComplete(active.id)) {
      openDialogue({
        title: 'Ancião de Aethel',
        text:
          `Você já tem o que ${npcName === 'Herbalista' ? 'a Herbalista' : 'o Ferreiro'} precisa, ${vocative()}.\n\n` +
          `Vá até ${npcName === 'Herbalista' ? 'ela' : 'ele'} para entregar. ${npcLore}`,
      });
    } else {
      openDialogue({
        title: 'Ancião de Aethel',
        text:
          `${npcName === 'Herbalista' ? 'A Herbalista' : 'O Ferreiro'} ainda precisa da sua ajuda, ${vocative()}.\n\n` +
          `${active.description}\n\n` +
          `Fale com ${npcName === 'Herbalista' ? 'ela' : 'ele'} quando tiver o que precisa.`,
      });
    }
    return;
  }

  // ---- Entrega especial: quest 5.1 (tocha) ----
  if (active && active.id === 'story_torch' && isQuestReadyToComplete(active.id)) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Vejo que conseguiu uma tocha.\n\n` +
        `A caverna fica ao sul de Aethel, ${vocative()}. Não é longe. ` +
        `Mas o que habita lá dentro já arrastou outros viajantes antes.\n\n` +
        `Na próxima vez que vier, te indicarei o caminho, ${vocative()}.`,
      actions: [
        {
          label: 'Continuar',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
            offerQuests();
          },
        },
      ],
    });
    return;
  }

  // ---- Entrega da story_banner ----
  if (
    active &&
    active.id === 'story_banner' &&
    isQuestReadyToComplete(active.id)
  ) {
    const violent = isBannerQuestViolent();

    if (violent) {
      openDialogue({
        title: 'Ancião de Aethel',
        text:
          `${greeting()}. O estandarte voltou!\n\n` +
          `Mas eu sinto o peso do que você fez, ${vocative()}.\n\n` +
          `Os aventureiros me avisaram que a região fica silenciosa depois ` +
          `das 20h. Os goblins descansam como qualquer criatura. Você ` +
          `escolheu ir de dia, escolheu enfrentá-los, e escolheu matá-los.\n\n` +
          `Eles não eram maus. Eram assustados. A Fratura os expulsou de ` +
          `algum canto, e eles se agarraram ao primeiro bolsão que acharam. ` +
          `O estandarte era a única coisa que parecia segura.\n\n` +
          `Você fez o que precisava. Mas eu esperava mais.`,
        actions: [
          {
            label: 'Receber recompensa',
            action: () => {
              const q = getActiveQuest();
              if (q) {
                completeActiveQuest(playerStats, addItemToInventory);
                playerStats.gold -= 70;
                removeItem(playerStats.inventory, 'potion_strong', 1);
                removeItem(playerStats.inventory, 'potion_mana_medium', 1);
                playerStats.gold += 30;
              }
              saveGame();
              closeDialogue();
              checkLevelUp();
              offerQuests();
            },
          },
        ],
      });
      return;
    }

    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()}. O estandarte voltou!\n\n` +
        `E voltou sem sangue derramado. Isso é mais raro do que parece, ${vocative()}.\n\n` +
        `Os aventureiros tinham razão, então. Depois das 20h, os goblins ` +
        `descansam como qualquer criatura. Você soube esperar.\n\n` +
        `Aethel respira um pouco melhor por isso.`,
      actions: [
        {
          label: 'Receber recompensa',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
            offerQuests();
          },
        },
      ],
    });
    return;
  }

  // ---- Entrega especial: story_guardian_prep ----
  if (
    active &&
    active.id === 'story_guardian_prep' &&
    isQuestReadyToComplete(active.id)
  ) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Você voltou. E o Núcleo está com você.\n\n` +
        `Eu sinto o peso dele daqui, ${vocative()}. O anel já está sentindo a falta dela. ` +
        `Os Campos vão ficar mais instáveis agora — não muito, mas o suficiente pra notar.\n\n` +
        `Você trouxe a semente também. Então ela não vai voltar. Mas... a semente pode ser plantada. ` +
        `Talvez, um dia, Aethel tenha uma Árvore Mãe de novo.\n\n` +
        `Coloque o Núcleo no Portal quando puder. E descanse. Você fez o que precisava.`,
      actions: [
        {
          label: 'Receber recompensa',
          action: () => {
            completeActiveQuest(playerStats, addItemToInventory);
            saveGame();
            closeDialogue();
            checkLevelUp();
            offerQuests();
          },
        },
      ],
    });
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
            checkLevelUp();
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

  // ---- Revelação especial: mensagem atrás do pergaminho ----
  if (
    available[0]?.id === 'story_torch' &&
    !isQuestActive('story_torch') &&
    !isQuestCompleted('story_torch')
  ) {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `Espere, ${vocative()}. Há algo atrás daquele pergaminho que me trouxe.\n\n` +
        `Uma mensagem, escrita às pressas com carvão. É a letra do Corin.\n\n` +
        `"Estou sendo arrastado para uma caverna ao sul. Não sei por quanto tempo ainda vou ter consciência. Se alguém achar isto — cuidado com o que vive lá embaixo."\n\n` +
        `Ele ainda pode estar vivo. Mas as cavernas ao sul são escuras como a própria Fratura. Você vai precisar de uma tocha para entrar.\n\n` +
        `O Ferreiro vende. Vá até ele, consiga uma tocha, e volte para que eu te indique o caminho.`,
      actions: [
        {
          label: 'Aceitar',
          action: () => {
            activateQuest('story_torch');
            saveGame();
            closeDialogue();
          },
        },
      ],
    });
    return;
  }

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

  // ---- Oferta especial: story_guardian_prep ----
  if (available[0]?.id === 'story_guardian_prep') {
    openDialogue({
      title: 'Ancião de Aethel',
      text:
        `${greeting()} Você trouxe o estandarte de volta. Mas a Fratura não para, ${vocative()}.\n\n` +
        `Eu tenho evitado falar disso, mas não dá mais pra adiar. Lá no Coração dos Campos, ` +
        `a sudeste, mora a Árvore Mãe. Ela é o Guardião do nosso anel — a coisa mais antiga que ` +
        `ainda respira por aqui. Enquanto ela vive, os Campos ficam estáveis.\n\n` +
        `O Núcleo que você precisa está com ela. Eu não vou mentir: não é uma luta justa. ` +
        `Ela não ataca primeiro. Só se defende. Mas o Núcleo é a única forma de reacender o Portal.\n\n` +
        `Vá até lá. E decida com cuidado o que você está disposto a fazer.`,
      actions: [
        {
          label: 'Aceitar',
          action: () => {
            activateQuest('story_guardian_prep');
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

  // Oferece a próxima
  const q = available[0];
  openDialogue({
    title: 'Ancião de Aethel',
    text:
      (q.warning ? `${q.warning}\n\n` : '') +
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