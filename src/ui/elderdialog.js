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
import { addItemToInventory, removeItem  } from '../items.js';
import { greeting, vocative } from './classvocative.js';
import { addMarker, revealMarker } from '../world/knowledge.js';

// Texto de lore da introdução. A saudação inicial é dinâmica (via greeting()),
// então essa constante NÃO começa com "Bem-vindo" — ela é concatenada depois.
// contexto clica em "O que aconteceu com o mundo?".
const LORE_INTRO =
  'Você chegou numa hora estranha. Aethel costumava ser só mais uma cidade no caminho — mas agora é a última parada antes do fim.\n\n' +
  'Há algumas gerações, o mundo era inteiro. Um continente só, sem anéis. Então algo aconteceu — ninguém sabe o quê, nem por quê — e o mundo se partiu em círculos. Chamamos isso de Fratura.\n\n' +
  'Aethel sobreviveu porque estava no lugar certo. O Portal Antigo na praça é a única coisa que restou de antes — e a única porta pra fora dos anéis.\n\n' +
  'Você chegou a pé. Ninguém chega a pé. A Fratura desfaz quem tenta. Você não foi desfeito — então ou você é um Andarilho, ou é a Fratura disfarçada. E a Fratura não conversa.';

// Diálogo longo, opcional, atrás do botão "O que aconteceu com o mundo?".
// Não substitui o LORE_INTRO — complementa.
const LORE_DEEP =
  'Você não sabe o que é a Fratura, sabe? Não nasceu aqui, eu suponho.\n\n' +
  'A Fratura partiu o continente em anéis. Cada anel virou um lugar diferente — com clima, animais e regras próprias. Campos, Deserto, e mais além. Quanto mais perto do centro, mais instável. O espaço entre os anéis desfaz quem tenta atravessar a pé. Ninguém chega a Aethel a pé. Ninguém.\n\n' +
  'Cada anel tem um Guardião. Uma criatura (ou uma pessoa — não sei mais) que carrega um Núcleo. Enquanto o Guardião vive, o anel fica estável. Se ele morre, o anel racha um pouco mais. Por isso ninguém vai lá. Por isso ninguém volta.\n\n' +
  'O Portal Antigo era a base de uma torre. A Fratura rachou o continente, mas a base ficou. Oito encaixes. Oito Núcleos. Se os oito forem colocados, o caminho para o centro se abre. O que tem lá, eu não sei. Ninguém que foi voltou pra contar.\n\n' +
  'Você é um Andarilho. Um dos raros que a Fratura não consegue consumir. Só você pode atravessar os anéis e voltar. Eu já vi outros como você. Nenhum voltou.';

export function talkToElder() {
  // Primeira vez: diálogo curto, com botão opcional pra lore profunda
  if (!hasSeenElderIntro()) {
    openDialogue({
      title: 'Ancião de Aethel',
      text: `${greeting()}\n\n${LORE_INTRO}`,
      actions: [
        {
          label: 'O que aconteceu com o mundo?',
          action: () => {
            // Marca como visto (não importa qual botão o jogador escolheu)
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

// Diálogo de lore profunda, acessível pelo botão no primeiro contato.
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

// Mostra a tela de oferta de quests (ou entrega, se a ativa estiver pronta).
export function offerQuests() {
  const active = getActiveQuest();

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
            offerQuests(); // continua o fluxo normal
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

  // ---- Entrega da story_banner: final depende do flag violento ----
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
              // Recompensa "ruim": sobrescreve o que a quest daria
              const q = getActiveQuest();
              // aplica manualmente o gold e remove os itens bônus
              if (q) {
                // Marca como concluída SEM chamar completeActiveQuest
                // (que daria 100 + poções). Vamos simular a entrega.
                completeActiveQuest(playerStats, addItemToInventory);
                // Corrige o ouro: completeActiveQuest já somou 100.
                // Subtrai 70 e tira as poções.
                playerStats.gold -= 70;
                // Remove as poções bônus que completeActiveQuest adicionou
                removeItem(playerStats.inventory, 'potion_strong', 1);
                removeItem(playerStats.inventory, 'potion_mana_medium', 1);
                // Dá 30 de ouro (a diferença)
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

    // Final bom: deixa o fluxo padrão (mas com uma fala mais pessoal)
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

  // ---- Revelação especial: o Ancião encontra a mensagem atrás do pergaminho ----
  // Só dispara UMA vez, na primeira vez que a 5.1 está disponível.
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

  // Oferece a próxima (a primeira da lista, que respeita prereq)
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
          activateQuest(q.id); // A mágica acontece toda aqui agora
          saveGame();
          closeDialogue();
        },
      },
    ],
  });
}