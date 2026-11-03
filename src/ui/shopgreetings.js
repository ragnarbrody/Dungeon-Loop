// src/ui/shopgreetings.js
// ============================================================
// POOL DE SAUDAÇÕES DAS LOJAS
//
// Cada loja tem um array de funções que retornam string.
// Funções (em vez de strings) permitem usar greeting()/vocative()
// dinamicamente — a saudação reflete a classe atual do jogador.
//
// Pra adicionar uma loja nova, basta adicionar uma entrada aqui
// com o mesmo buildingId do SHOPS em shop.js.
// ============================================================
import { greeting, vocative, agree } from './classvocative.js';

export const SHOP_GREETINGS = {
  herbalist: [
    // ---- Cuidado / saúde ----
    () => `${greeting()} Precisa de algo?`,
    () => `${greeting()} As poções estão frescas hoje.`,
    () => `${greeting()} Não saia sem uma poção de cura, ${vocative()}.`,
    () => `${greeting()} Bebe com moderação, ouviu? Poção não é água.`,

    // ---- Aviso sobre o mundo lá fora ----
    () => `${greeting()} Cuidado lá fora, ouviu? As criaturas andam agitadas.`,
    () => `${greeting()} A Fratura anda estranha. Até as ervas sentem.`,
    () => `${greeting()} Tenho o que você precisa pra sobreviver aos anéis.`,
    () => `${greeting()} Se voltar ${agree('ferido', 'ferida')}, me procura antes de qualquer coisa.`,

    // ---- Reconhecimento do Andarilho ----
    () => `${greeting()} Voltou ${agree('inteiro', 'inteira')}, ${vocative()}? Bom sinal.`,
    () => `${greeting()} Não é todo dia que vejo ${agree('um', 'uma')} ${agree('Andarilho', 'Andarilhas')} por aqui.`,
    () => `${greeting()} Você atravessou os anéis de novo? Tem coragem, ${vocative()}.`,
    () => `${greeting()} Os outros viajantes não voltam. Você voltou.`,

    // ---- Loja / mercadoria ----
    () => `${greeting()} Colhi essas ervas hoje cedo. Tá tudo fresco.`,
    () => `${greeting()} Se precisar de algo mais forte, é só pedir.`,
    () => `${greeting()} O ouro é seu, as poções são minhas. Vamos negociar?`,
  ],
  blacksmith: [
    // ---- Trabalho / ofício ----
    () => `${greeting()} Procurando algo afiado?`,
    () => `${greeting()} O aço tá bom hoje. Aproveita.`,
    () => `${greeting()} Se cortar o dedo, não é culpa minha.`,
    () => `${greeting()} Fogo, martelo e paciência. É tudo que preciso.`,

    // ---- Aviso / mundo lá fora ----
    () => `${greeting()} Vai pra alguma caverna? Você vai precisar de luz. Tenho tochas.`,
    () => `${greeting()} A Fratura torceu o metal todo. Difícil achar uma lâmina que não rache.`,
    () => `${greeting()} Cuidado com o que brilha demais por aí. Nem tudo que reluz é ouro.`,
    () => `${greeting()} Se voltar com a armadura amassada, eu conserto. Se voltar sem ela, aí é com você.`,

    // ---- Reconhecimento do Andarilho ----
    () => `${greeting()} Voltou vivo? Bom. Tô cobrando por conserto, não por ressurreição.`,
    () => `${greeting()} Não é todo dia que vejo ${agree('um', 'uma')} ${agree('Andarilho', 'Andarilhas')}. E olha que eu fico aqui o dia todo.`,
    () => `${greeting()} Você atravessou os anéis e ainda tem os dois braços? Sorte.`,
    () => `${greeting()} Os outros viajantes viram sucata. Você ainda tá de pé.`,

    // ---- Loja / mercadoria ----
    () => `${greeting()} Vende o que não usa? Tô comprando.`,
    () => `${greeting()} Ouro na mão, aço na outra. É assim que funciona.`,
    () => `${greeting()} Se não for pra comprar nem vender, fecha a porta. Tô trabalhando.`,
  ],
  armorer: [
    // ---- Cauteloso / inspeção ----
    () => `${greeting()} Deixa eu ver o que você tem antes de falar de preço.`,
    () => `${greeting()} Sem pressa. Mostre a peça, eu avalio.`,
    () => `${greeting()} Escudo amassado, não vale o que você acha que vale. Mas eu compro.`,
    () => `${greeting()} Se for pra trocar, quero ver o estado. Não compro gato por lebre.`,
    () => `${greeting()} Já vi aventureiro vender "armadura" que era lata. Você parece mais honesto.`,

    // ---- Aviso sobre o mundo / sobre a Fratura ----
    () => `${greeting()} A Fratura torce o metal. Escudo bom hoje é escudo raro.`,
    () => `${greeting()} Cuidado com o que compra por aí. Peça sem marca de forja racha no primeiro golpe.`,
    () => `${greeting()} Se for pra caverna, leve capacete. Pedra cai do teto e não avisa.`,
    () => `${greeting()} Eu não vendo promessa, vendo peça. Se quebrar, foi mal uso.`,

    // ---- Reconhecimento do Andarilho ----
    () => `${greeting()} Você de novo. Já voltou inteiro das suas andanças. Bom sinal.`,
    () => `${greeting()} Não é todo dia que vejo ${agree('um', 'uma')} ${agree('Andarilho', 'Andarilhas')}. E olha que eu inspeciono tudo que passa por aqui.`,
    () => `${greeting()} A maioria dos viajantes volta com a armadura em frangalhos. A sua tá inteira. Interessante.`,
    () => `${greeting()} Quer vender ou comprar? Porque olhar eu já olhei.`,

    // ---- Loja / mercadoria ----
    () => `${greeting()} Escudo bom, preço justo. Escudo ruim, preço de sucata. Qual você quer?`,
    () => `${greeting()} Vende o que não usa. Eu avalio e te faço uma oferta honesta.`,
    () => `${greeting()} Se não for pra negociar, fecha a porta devagar. Tô no meio de uma inspeção.`,
  ],
};

// ============================================================
// SAUDAÇÕES DO BANQUEIRO (Cofre de Aethel)
// ============================================================
// Personalidade: formal, cauteloso, um pouco solene. Fala do
// Cofre como "memória" e do Andarilho como alguém que "escolhe
// o que lembrar". Não usa gíria. Trata o ouro com respeito.
export const VAULT_GREETINGS = [
  // ---- Abertura / transação ----
  () => `${greeting()} O Cofre está aberto. O que deseja guardar?`,
  () => `${greeting()} Ouro ou item? O Cofre aceita os dois.`,
  () => `${greeting()} Poucos voltam pra guardar. Menos ainda voltam pra retirar.`,
  () => `${greeting()} O que você deixa aqui, a Fratura não leva.`,
  () => `${greeting()} Diga o que quer guardar. Eu registro.`,

  // ---- Sobre a natureza do Cofre (lore) ----
  () => `${greeting()} Este cofre é mais antigo que Aethel. A Fratura não o toca.`,
  () => `${greeting()} O que está aqui dentro é memória. A Fratura respeita memória.`,
  () => `${greeting()} O Cofre não guarda tudo. Só o que você escolhe lembrar.`,
  () => `${greeting()} Cada Slot é uma decisão. Escolha com cuidado.`,

  // ---- Reconhecimento do Andarilho ----
  () => `${greeting()} Voltou ${agree('inteiro', 'inteira')}. O Cofre agradece.`,
  () => `${greeting()} Não é todo dia que vejo ${agree('um', 'uma')} ${agree('Andarilho', 'Andarilhas')} por aqui.`,
  () => `${greeting()} Os outros viajantes não voltam. Você volta. O Cofre nota.`,
  () => `${greeting()} O Cofre lembra de você. Eu também.`,

  // ---- Aviso / cautela ----
  () => `${greeting()} Guarde o que não pode perder. O resto, a Fratura apaga.`,
  () => `${greeting()} Se for pra um bioma novo, pense no que leva. O Cofre fica.`,
  () => `${greeting()} Slot novo custa ouro. Ouro some. Slot fica.`,
  () => `${greeting()} Não guarde o que precisa usar agora. Guarde o que não pode perder.`,
];

// Guarda o índice da última fala sorteada do banqueiro.
let lastVaultGreeting = -1;

export function pickVaultGreeting() {
  const pool = VAULT_GREETINGS;
  if (pool.length === 0) return `${greeting()} Em que posso ajudar?`;
  if (pool.length === 1) return pool[0]();

  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === lastVaultGreeting);

  lastVaultGreeting = idx;
  return pool[idx]();
}

export function resetVaultGreetingCache() {
  lastVaultGreeting = -1;
}

// Fallback se a loja não tiver pool definido.
const FALLBACK = [() => `${greeting()} Em que posso ajudar?`];

// Guarda o índice da última fala sorteada por loja, pra não repetir.
const lastIndexByShop = {};

/**
 * Sorteia uma saudação pra loja.
 * Evita repetir a mesma fala duas vezes seguidas (quando há mais de 1).
 *
 * @param {string} buildingId - id da loja (ex: 'herbalist')
 * @returns {string} texto da saudação
 */
export function pickShopGreeting(buildingId) {
  const pool = SHOP_GREETINGS[buildingId] || FALLBACK;
  if (pool.length === 0) return FALLBACK[0]();

  if (pool.length === 1) return pool[0]();

  // Sorteia evitando o índice anterior
  const last = lastIndexByShop[buildingId];
  let idx;
  do {
    idx = Math.floor(Math.random() * pool.length);
  } while (idx === last);

  lastIndexByShop[buildingId] = idx;
  return pool[idx]();
}

/**
 * Reset do cache de "última fala" (útil em Novo Jogo, se quiser garantir
 * que a primeira abertura sempre possa cair em qualquer fala).
 * Não é obrigatório chamar, mas fica aqui pra completude.
 */
export function resetShopGreetings() {
  for (const k in lastIndexByShop) delete lastIndexByShop[k];
}