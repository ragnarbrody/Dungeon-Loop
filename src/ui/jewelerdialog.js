import { openDialogue } from './dialogue.js';
import { openShop } from './shop.js';
import { playerStats } from '../core/state.js';
import { getQuestsByChapter, isQuestCompleted } from '../quests.js';

export function talkToJeweler() {
  // Joalheiro só existe em Akmira (por enquanto)
  openDialogue({
    title: 'Joalheiro',
    text:
      'Ah, um rosto novo. Não é todo dia que vejo Andarilhos por Akmira.\n\n' +
      'Joias? Tenho algumas. Anéis, amuletos... coisas que a areia não conseguiu apagar.\n\n' +
      'Se quer comprar, é ouro na mão. Se quer vender, eu olho o que tem.',
    actions: [
      {
        label: 'Ver mercadoria',
        action: () => {
          // Fecha o diálogo e abre a loja
          // (o closeDialogue já é chamado pelo botão)
          setTimeout(() => openShop('jeweler'), 100);
        },
      },
    ],
  });
}