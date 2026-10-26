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
import { greeting, vocative } from './classvocative.js';

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
};

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