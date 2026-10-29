import { openDialogue } from './dialogue.js';
import { playerStats, saveGame, checkLevelUp } from '../core/state.js';
import { addItemToInventory } from '../items.js';
import { isQuestActive, getProgress, advanceObjective, completeActiveQuest } from '../quests.js';

const QUEST_ID = 'story_cave';

export function talkToCagedVillager() {
  if (!isQuestActive(QUEST_ID)) return;

  const captorDefeated = getProgress(QUEST_ID, 'clear_cave') >= 1;

  if (!captorDefeated) {
    openDialogue({
      title: 'Aldeão',
      text:
        'Dentro da jaula, um homem de roupas rasgadas ergue o rosto. Parece aliviado e apavorado ao mesmo tempo.\n\n' +
        '— Você é de Aethel? Então o Ancião não me esqueceu... Mas agora não, não posso sair com aquilo aqui. ' +
        'Enquanto ele estiver de pé, a chave fica presa ao cinto dele. Derrote-o primeiro, por favor.',
    });
    return;
  }

  openDialogue({
    title: 'Jaula',
    text:
      'Com o Sargento caído, o molho de chaves em seu cinto está ao alcance. Através das barras, o aldeão te olha sem ousar acreditar.',
    actions: [{ label: 'Abrir a jaula', action: freeVillager }],
  });
}

function freeVillager() {
  advanceObjective(QUEST_ID, 'free_villager', 1);
  const quest = completeActiveQuest(playerStats, addItemToInventory);
  if (!quest) { console.warn('[quest] story_cave não pôde ser concluída'); return; }

  checkLevelUp();
  saveGame();

  const r = quest.rewards || {};
  const parts = [];
  if (r.xp) parts.push(`+${r.xp} XP`);
  if (r.gold) parts.push(`+${r.gold} ouro`);

  openDialogue({
    title: 'Aldeão',
    text:
      'A fechadura cede. O aldeão sai devagar, esfregando os pulsos marcados pela corda, e olha o corpo do Sargento.\n\n' +
      '— Você limpou a caverna inteira? Aquele bruto me arrastou desde a estrada. Eu só queria entregar o pergaminho... ' +
      'Obrigado, Andarilho. De verdade.\n\n' +
      '— Como os inimigos foram todos derrotados, eu consigo voltar sozinho para Aethel, conheço o caminho. ' +
      'Vá na frente e avise o Ancião que eu estou vivo — ele precisa saber que você cumpriu a palavra dele. ' +
      'Eu chego logo atrás.\n\n' +
      `✔ Missão concluída: ${quest.title}` +
      (parts.length ? `\n${parts.join(' · ')}` : ''),
  });
}