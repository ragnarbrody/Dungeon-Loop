// Ícones desenhados em canvas 20x20 (pixel art), independentes de emoji.
const ICON_SIZE = 20;

function makeIcon(drawFn, size = ICON_SIZE) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawFn(g, size);
  return c;
}

const px = (g) => (x, y, w, h, color) => {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
};

export const ICONS = {
  // ---------- POÇÕES ----------
  potion_weak: makeIcon((g) => {
    const p = px(g);
    p(7, 2, 6, 2, '#8a6b5a'); p(6, 4, 8, 12, '#c8d8e8');
    p(7, 5, 6, 10, '#9b1c1c'); p(8, 6, 2, 2, '#ff6b6b'); p(6, 14, 8, 2, '#8a6b5a');
  }),
  potion_mana: makeIcon((g) => {
    const p = px(g);
    p(7, 2, 6, 2, '#8a6b5a'); p(6, 4, 8, 12, '#c8d8e8');
    p(7, 5, 6, 10, '#2a5fa0'); p(8, 6, 2, 2, '#8ad8ff'); p(6, 14, 8, 2, '#8a6b5a');
  }),
  potion_str: makeIcon((g) => {
    const p = px(g);
    p(7, 2, 6, 2, '#8a6b5a'); p(6, 4, 8, 12, '#c8d8e8');
    p(7, 5, 6, 10, '#9a3a1c'); p(8, 6, 2, 2, '#ffb703'); p(6, 14, 8, 2, '#8a6b5a');
  }),
  potion_agi: makeIcon((g) => {
    const p = px(g);
    p(7, 2, 6, 2, '#8a6b5a'); p(6, 4, 8, 12, '#c8d8e8');
    p(7, 5, 6, 10, '#2a7a3a'); p(8, 6, 2, 2, '#6fbd63'); p(6, 14, 8, 2, '#8a6b5a');
  }),

  // ---------- ARMAS / EQUIPAMENTO ----------
  axe: makeIcon((g) => {
    const p = px(g);
    p(9, 4, 2, 14, '#6b4a2b'); p(6, 3, 8, 6, '#bfc6cf');
    p(6, 8, 8, 1, '#7d8792'); p(5, 4, 1, 4, '#7d8792');
  }),
  sword: makeIcon((g) => {
    const p = px(g);
    p(9, 2, 2, 12, '#dfe6ee'); p(9, 2, 1, 12, '#ffffff');
    p(7, 14, 6, 1, '#c9a24d'); p(9, 15, 2, 3, '#5a3a1a'); p(9, 18, 2, 1, '#c9a24d');
  }),
  torch: makeIcon((g) => {
    const p = px(g);
    p(9, 9, 2, 9, '#5a3a1a'); p(7, 6, 6, 4, '#ffb703'); p(8, 4, 4, 3, '#fb8500');
  }),
  shield: makeIcon((g) => {
    const p = px(g);
    p(4, 4, 12, 10, '#c9a24d'); p(5, 5, 10, 8, '#9b1c1c');
    p(5, 5, 10, 1, '#6b1010'); p(9, 8, 2, 2, '#e0e0e0');
  }),
  staff: makeIcon((g) => {
    const p = px(g);
    p(9, 6, 2, 12, '#6b4a2b'); p(8, 3, 4, 4, '#8ad8ff'); p(9, 4, 2, 2, '#e8f6ff');
  }),
  dagger: makeIcon((g) => {
    const p = px(g);
    p(9, 4, 2, 8, '#dfe6ee'); p(10, 4, 1, 8, '#9aa6b2');
    p(7, 12, 6, 1, '#c9a24d'); p(9, 13, 2, 2, '#5a3a1a');
  }),

  // ---------- ÍCONES DE SKILL ----------
  quick: makeIcon((g) => {   // golpe rápido: espada com rastro
    const p = px(g);
    p(9, 3, 2, 11, '#dfe6ee'); p(9, 3, 1, 11, '#ffffff');
    p(5, 12, 4, 1, '#8ad8ff'); p(6, 14, 3, 1, '#8ad8ff'); // rastro azul
    p(7, 14, 6, 1, '#c9a24d'); p(9, 15, 2, 3, '#5a3a1a');
  }),
  heavy: makeIcon((g) => {   // impacto: estrela vermelha
    const p = px(g);
    p(9, 4, 2, 6, '#ff6b3b'); p(9, 12, 2, 4, '#ff6b3b');
    p(4, 9, 6, 2, '#ff6b3b'); p(10, 9, 6, 2, '#ff6b3b');
    p(8, 8, 4, 4, '#ffb703'); p(9, 9, 2, 2, '#ffffff');
  }),
  spin: makeIcon((g) => {    // golpe giratório: círculo com seta
    const p = px(g);
    p(8, 2, 4, 2, '#c9a24d'); p(14, 6, 2, 4, '#c9a24d');
    p(8, 16, 4, 2, '#c9a24d'); p(4, 10, 2, 4, '#c9a24d');
    p(6, 6, 2, 2, '#e8e8e8'); p(12, 6, 2, 2, '#e8e8e8');
    p(6, 12, 2, 2, '#e8e8e8'); p(12, 12, 2, 2, '#e8e8e8');
    p(9, 9, 2, 2, '#ffffff');
  }),
  bolt: makeIcon((g) => {    // raio azul
    const p = px(g);
    p(10, 2, 3, 4, '#ffe24a'); p(8, 6, 3, 4, '#ffe24a');
    p(7, 10, 4, 3, '#ffe24a'); p(5, 13, 3, 4, '#ffe24a');
    p(11, 4, 1, 2, '#ffffff'); p(9, 7, 1, 2, '#ffffff');
  }),
  fireball: makeIcon((g) => { // bola de fogo
    const p = px(g);
    p(7, 6, 6, 8, '#ff8a3b'); p(8, 4, 4, 3, '#ffb703');
    p(9, 9, 2, 4, '#ffe24a'); p(6, 8, 1, 4, '#c93030'); p(13, 8, 1, 4, '#c93030');
  }),
  arcane: makeIcon((g) => {  // impacto arcano: estrela roxa
    const p = px(g);
    p(9, 2, 2, 16, '#d78cff'); p(2, 9, 16, 2, '#d78cff');
    p(5, 5, 2, 2, '#e8c8ff'); p(13, 5, 2, 2, '#e8c8ff');
    p(5, 13, 2, 2, '#e8c8ff'); p(13, 13, 2, 2, '#e8c8ff');
    p(9, 9, 2, 2, '#ffffff');
  }),
  stab: makeIcon((g) => {    // adaga (skill)
    const p = px(g);
    p(9, 3, 2, 10, '#dfe6ee'); p(10, 3, 1, 10, '#9aa6b2');
    p(7, 13, 6, 1, '#c9a24d'); p(9, 14, 2, 3, '#5a3a1a');
  }),
  backstab: makeIcon((g) => { // adaga + estrela
    const p = px(g);
    p(8, 5, 2, 9, '#dfe6ee'); p(6, 14, 6, 1, '#c9a24d'); p(8, 15, 2, 2, '#5a3a1a');
    p(13, 3, 4, 4, '#ff7bd0'); p(14, 4, 2, 2, '#ffffff');
  }),
  shadow: makeIcon((g) => {  // círculo escuro com borda roxa
    const p = px(g);
    p(6, 6, 8, 8, '#1a1a2e'); p(7, 7, 6, 6, '#2a1a3e');
    p(8, 8, 2, 2, '#d78cff'); p(11, 11, 2, 2, '#d78cff');
  }),

  // ---------- ÍCONES DE STAT ----------
  str: makeIcon((g) => {   // espada pequena
    const p = px(g);
    p(9, 3, 2, 10, '#dfe6ee'); p(7, 13, 6, 1, '#c9a24d'); p(9, 14, 2, 3, '#5a3a1a');
  }),
  agi: makeIcon((g) => {   // folha/rastro verde
    const p = px(g);
    p(5, 12, 4, 4, '#4f9a4a'); p(9, 8, 4, 4, '#6fbd63');
    p(13, 4, 4, 4, '#8ad8ff'); p(11, 10, 2, 2, '#8ad8ff');
  }),
  int: makeIcon((g) => {   // cérebro/estrela roxa
    const p = px(g);
    p(6, 6, 8, 6, '#d78cff'); p(7, 7, 2, 2, '#e8c8ff');
    p(11, 9, 2, 2, '#e8c8ff'); p(9, 13, 2, 3, '#9a5fff');
  }),
  def: makeIcon((g) => {   // escudo pequeno
    const p = px(g);
    p(6, 4, 8, 10, '#c9a24d'); p(7, 5, 6, 8, '#9b1c1c');
    p(9, 7, 2, 2, '#e0e0e0');
  }),
  vit: makeIcon((g) => {   // coração vermelho
    const p = px(g);
    p(6, 6, 3, 3, '#ff3b3b'); p(11, 6, 3, 3, '#ff3b3b');
    p(6, 8, 8, 4, '#ff3b3b'); p(7, 12, 6, 2, '#ff3b3b');
    p(8, 14, 4, 2, '#ff3b3b'); p(9, 16, 2, 1, '#ff3b3b');
    p(7, 7, 1, 1, '#ff8a8a');
  }),
  magia: makeIcon((g) => { // estrela azul (mana)
    const p = px(g);
    p(9, 2, 2, 16, '#8ad8ff'); p(2, 9, 16, 2, '#8ad8ff');
    p(5, 5, 2, 2, '#e8f6ff'); p(13, 5, 2, 2, '#e8f6ff');
    p(5, 13, 2, 2, '#e8f6ff'); p(13, 13, 2, 2, '#e8f6ff');
    p(9, 9, 2, 2, '#ffffff');
  }),

  // ---------- CLASSES ----------
  knightess: makeIcon((g) => {   // capacete
    const p = px(g);
    p(5, 5, 10, 8, '#c0c8d0'); p(5, 5, 10, 1, '#e8eef4');
    p(5, 12, 10, 2, '#8892a0'); p(7, 8, 2, 3, '#1a1a2e'); p(11, 8, 2, 3, '#1a1a2e');
    p(9, 14, 2, 4, '#8892a0');
  }),
  mage: makeIcon((g) => {        // chapéu de mago
    const p = px(g);
    p(6, 12, 8, 4, '#4a2a8a'); p(9, 6, 2, 6, '#4a2a8a');
    p(8, 4, 4, 2, '#6a4aaa'); p(9, 2, 2, 2, '#8ad8ff');
    p(6, 16, 8, 1, '#2a1a5a');
  }),
  thief: makeIcon((g) => {       // capuz
    const p = px(g);
    p(4, 6, 12, 10, '#3a2a1e'); p(6, 8, 8, 6, '#5a3a2a');
    p(7, 10, 2, 2, '#f0e0a0'); p(11, 10, 2, 2, '#f0e0a0');
    p(4, 14, 12, 2, '#2a1a0e');
  }),
  huntress: makeIcon((g) => {   // capuz + flecha (ícone de caçadora)
    const p = px(g);
    // Capuz verde
    p(4, 6, 12, 10, '#2a4a2a');
    p(6, 8, 8, 6, '#3f6b3f');
    p(7, 10, 2, 2, '#e6e64a');
    p(11, 10, 2, 2, '#e6e64a');
    // Flecha atravessada (diagonal)
    p(15, 4, 1, 3, '#e8d890');
    p(14, 3, 1, 1, '#e8d890');
    p(16, 3, 1, 1, '#e8d890');
    p(15, 7, 1, 1, '#5a3a1a');
  }),

  bag: makeIcon((g) => {
    const p = px(g);
    // Cores base
    const leatherDark  = '#4a2a1a';
    const leatherMid   = '#7a4a20';
    const leatherLight = '#a67a4a';
    const strap        = '#5a3a1a';
    const gold         = '#c9a24d';

    // Alças laterais
    p(3, 8, 1, 8, strap);
    p(16, 8, 1, 8, strap);

    // Alça superior
    p(8, 2, 4, 1, strap);
    p(7, 3, 1, 3, strap);
    p(12, 3, 1, 3, strap);

    // Corpo principal
    p(4, 6, 12, 12, leatherMid);

    // Sombra e Brilho do corpo
    p(4, 6, 12, 1, leatherLight); // topo
    p(4, 17, 12, 1, leatherDark); // base
    p(4, 6, 1, 12, leatherDark);  // lateral esq
    p(15, 6, 1, 12, leatherDark); // lateral dir

    // Tampa superior
    p(5, 5, 10, 3, leatherDark);
    p(5, 5, 10, 1, '#3a1a0a');

    // Fecho central
    p(9, 9, 2, 4, gold);
    p(9, 9, 2, 1, '#f0d27a'); // brilho
    p(9, 12, 2, 1, '#8a6b2a'); // sombra

    // Bolso frontal
    p(6, 13, 8, 4, leatherDark);
    p(6, 13, 8, 1, leatherMid);
    p(6, 16, 8, 1, '#3a1a0a');

    // Costura no bolso
    p(8, 14, 4, 1, strap);
  }),

  flee: makeIcon((g) => {        // bandeira branca (rendição/fuga)
    const p = px(g);
    const pole     = '#6b4a2b';   // mastro (madeira)
    const poleSh   = '#4a3018';   // sombra do mastro
    const cloth    = '#e8e8e8';   // pano branco
    const clothSh  = '#b8b8b8';   // sombra do pano
    const clothHi  = '#ffffff';   // brilho do pano
    const rope     = '#c9a24d';   // cordinha no topo

    // Mastro (vertical, à esquerda)
    p(5, 3, 1, 15, pole);
    p(6, 3, 1, 15, poleSh);

    // Cordinha no topo do mastro
    p(5, 3, 2, 1, rope);

    // Pano branco (formato de bandeira, ondulando pra direita)
    // Linha de cima
    p(7, 4, 10, 1, clothHi);
    // Corpo principal
    p(7, 5, 11, 5, cloth);
    // Sombra de baixo (dá volume)
    p(7, 10, 11, 1, clothSh);
    // Pontinha ondulando no fim (desce 1px)
    p(16, 9, 2, 2, cloth);
    p(17, 10, 1, 1, clothSh);

    // Dobras do pano (sutil, com 1-2 pixels de sombra)
    p(10, 5, 1, 5, clothSh);      // dobra vertical 1
    p(13, 5, 1, 5, clothSh);      // dobra vertical 2

    // Brilho extra na parte de cima (dá a sensação de pano "levantado")
    p(8, 5, 2, 1, clothHi);
    p(11, 5, 2, 1, clothHi);
  }),

  rest: makeIcon((g) => {        // fogueira (acampamento/descanso)
    const p = px(g);
    const log      = '#5a3a1a';
    const logDark  = '#3f2814';
    const flameOut = '#fb8500';  // laranja externo
    const flameMid = '#ffb703';  // amarelo do meio
    const flameIn  = '#ffe24a';  // amarelo claro interno
    const ember    = '#c93030';  // brasa vermelha

    // Tora de baixo (horizontal, à esquerda)
    p(4, 15, 8, 2, log);
    p(4, 15, 8, 1, logDark);
    // Tora de baixo (horizontal, à direita)
    p(8, 16, 8, 2, log);
    p(8, 16, 8, 1, logDark);

    // Brasa (base)
    p(6, 14, 8, 2, ember);

    // Chama externa (laranja)
    p(7, 9, 6, 5, flameOut);
    p(8, 6, 4, 4, flameOut);
    p(9, 4, 2, 3, flameOut);

    // Chama do meio (amarelo)
    p(8, 10, 4, 4, flameMid);
    p(9, 7, 2, 4, flameMid);

    // Chama interna (amarelo claro)
    p(9, 10, 2, 3, flameIn);
    p(10, 8, 1, 2, flameIn);

    // Faíscas (2 pontinhos soltos)
    p(13, 5, 1, 1, '#ffe24a');
    p(5, 7, 1, 1, '#ffe24a');
  }),

};

const fallbackIcon = makeIcon((g) => px(g)(6, 6, 8, 8, '#666'));

/** Retorna uma CÓPIA do canvas (pra poder inserir várias vezes no DOM). */
export function getIcon(id) {
  const src = ICONS[id] || fallbackIcon;
  const copy = document.createElement('canvas');
  copy.width = src.width;
  copy.height = src.height;
  const g = copy.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(src, 0, 0);
  return copy;
}

/** Insere o ícone como <canvas> num elemento qualquer do DOM. */
export function appendIcon(parent, id, sizePx = 20) {
  const c = getIcon(id);
  c.style.width = sizePx + 'px';
  c.style.height = sizePx + 'px';
  c.style.imageRendering = 'pixelated';
  c.style.verticalAlign = 'middle';
  parent.appendChild(c);
  return c;
}

/** Desenha o ícone no canvas 2D na posição (dx, dy), escalado por `scale`. */
export function drawIconOnCanvas(ctx, id, dx, dy, scale = 1) {
  const src = ICONS[id] || fallbackIcon;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, dx, dy, src.width * scale, src.height * scale);
}