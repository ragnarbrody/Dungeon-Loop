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
    const wood    = '#8a5a3a';
    const woodHi  = '#a87a5a';
    const woodSh  = '#5a3a24';
    const rim     = '#a8b0b8';
    const rimSh   = '#6a7280';
    const boss    = '#c8d0d8';
    const bossSh  = '#7a8290';

    // Aro externo (círculo "quadrado" 14x14)
    p(3, 3, 14, 1, rim);
    p(3, 16, 14, 1, rim);
    p(3, 3, 1, 14, rim);
    p(16, 3, 1, 14, rim);
    // Sombra interna do aro (canto inf dir)
    p(3, 16, 1, 1, rimSh);
    p(16, 3, 1, 1, rimSh);

    // Corpo de madeira
    p(4, 4, 12, 12, wood);
    // Tábuas verticais
    p(7, 4, 1, 12, woodSh);
    p(12, 4, 1, 12, woodSh);
    // Brilho no topo (dá volume)
    p(4, 4, 12, 1, woodHi);

    // Umbo central (cúpula metálica)
    p(8, 8, 4, 4, boss);
    p(8, 8, 4, 1, '#e0e8f0');
    p(8, 8, 1, 4, bossSh);
    p(11, 8, 1, 4, bossSh);
    p(8, 11, 4, 1, bossSh);
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

  gold: makeIcon((g) => {
    const p = px(g);
    // Canvas 28x28 — moeda ocupa quase tudo
    const cx = 14, cy = 14, r = 11;

    // Borda externa (círculo escuro)
    g.fillStyle = '#8a6b2a';
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();

    // Corpo dourado (círculo interno)
    g.fillStyle = '#f0d27a';
    g.beginPath();
    g.arc(cx, cy, r - 2, 0, Math.PI * 2);
    g.fill();

    // Brilho
    g.fillStyle = '#fff5c0';
    g.beginPath();
    g.arc(cx - 3, cy - 3, 3, 0, Math.PI * 2);
    g.fill();

    // Sombra inferior direita
    g.fillStyle = '#a88a3a';
    g.beginPath();
    g.arc(cx + 4, cy + 4, 2, 0, Math.PI * 2);
    g.fill();
  }, 28),

  potion_medium: makeIcon((g) => {
    const p = px(g);
    p(7, 2, 6, 2, '#8a6b5a'); p(6, 4, 8, 12, '#c8d8e8');
    p(7, 5, 6, 10, '#5a9b1c'); p(8, 6, 2, 2, '#8fdb4a'); p(6, 14, 8, 2, '#8a6b5a');
    // detalhe extra (uma estrelinha) pra diferenciar da fraca
    p(9, 10, 2, 1, '#ffffff'); p(10, 9, 1, 1, '#ffffff');
  }),

  bow: makeIcon((g) => {
    const p = px(g);
    const wood   = '#6b4a2b';
    const woodHi = '#8a6a3a';
    const woodSh = '#3a2410';
    const string = '#e8e8e8';
    // Arco vertical (curva) + corda
    p(10, 2, 1, 2, wood);      // topo
    p(11, 4, 1, 2, wood);
    p(12, 6, 1, 8, wood);      // corpo
    p(11, 14, 1, 2, wood);
    p(10, 16, 1, 2, wood);     // base
    p(9, 3, 1, 1, woodHi);
    p(11, 5, 1, 1, woodHi);
    p(12, 7, 1, 6, woodHi);
    p(11, 15, 1, 1, woodHi);
    p(13, 6, 1, 8, woodSh);    // sombra lateral
    p(9, 2, 1, 1, string);     // corda (topo)
    p(8, 4, 1, 12, string);    // corda (reta)
    p(9, 16, 1, 1, string);    // corda (base)
  }),

  steel_sword: makeIcon((g) => {
    const p = px(g);
    // Lâmina mais larga e clara (aço polido)
    p(8, 2, 4, 12, '#c8d0d8');
    p(8, 2, 4, 1, '#e8f0f8');       // brilho topo
    p(8, 2, 1, 12, '#e8f0f8');      // fio esquerdo
    p(11, 2, 1, 12, '#7a8290');     // sombra direita
    // Guarda dourada (maior)
    p(6, 14, 8, 2, '#a87a3a');
    p(6, 14, 8, 1, '#d8a860');
    // Cabo escuro
    p(9, 16, 2, 3, '#4a2a1a');
    p(9, 19, 2, 1, '#a87a3a');
    // Gema vermelha no centro da guarda
    p(9, 14, 2, 2, '#c93030');
    p(9, 14, 1, 1, '#ff8a8a');
  }),

  war_axe: makeIcon((g) => {
    const p = px(g);
    // Cabo de madeira escura
    p(9, 4, 2, 14, '#4a2a1a');
    p(9, 4, 1, 14, '#6b4a2b');
    // Cabeça dupla (dois lados simétricos) — machado de guerra
    p(4, 4, 5, 8, '#a8b0b8');
    p(11, 4, 5, 8, '#a8b0b8');
    p(4, 4, 5, 1, '#d8e0e8');
    p(11, 4, 5, 1, '#d8e0e8');
    p(4, 11, 5, 1, '#5a6268');
    p(11, 11, 5, 1, '#5a6268');
    // Fio das lâminas (linhas escuras)
    p(4, 7, 5, 1, '#5a6268');
    p(11, 7, 5, 1, '#5a6268');
    // Faixa dourada no cabo
    p(9, 12, 2, 1, '#c9a24d');
    // Ponta do cabo (pedra)
    p(9, 17, 2, 1, '#8a7a5a');
  }),

  arcane_staff: makeIcon((g) => {
    const p = px(g);
    // Cabo de madeira roxa
    p(9, 6, 2, 12, '#3a2a5a');
    p(9, 6, 1, 12, '#5a4a7a');
    p(10, 6, 1, 12, '#1a0a3a');
    // Gema grande no topo
    p(7, 2, 6, 5, '#a8e8ff');
    p(8, 3, 4, 3, '#e8f8ff');
    p(9, 4, 2, 1, '#ffffff');
    // Aro dourado ao redor da gema
    p(6, 2, 1, 5, '#c9a24d');
    p(13, 2, 1, 5, '#c9a24d');
    p(7, 1, 6, 1, '#c9a24d');
    p(7, 7, 6, 1, '#c9a24d');
    // Brilho mágico
    p(10, 5, 1, 1, '#ffffff');
  }),

  ranger_bow: makeIcon((g) => {
    const p = px(g);
    // Arco maior, curvado, madeira escura
    p(11, 1, 1, 2, '#4a2a1a');
    p(12, 3, 1, 2, '#4a2a1a');
    p(13, 5, 1, 10, '#4a2a1a');
    p(12, 15, 1, 2, '#4a2a1a');
    p(11, 17, 1, 2, '#4a2a1a');
    // Detalhes de madeira clara (brilho no lado de dentro)
    p(12, 5, 1, 10, '#8a5a3a');
    p(11, 3, 1, 1, '#8a5a3a');
    p(13, 14, 1, 1, '#8a5a3a');
    // Sombra
    p(14, 5, 1, 10, '#2a1a0a');
    // Corda
    p(10, 2, 1, 1, '#e8e8d8');
    p(9, 3, 1, 14, '#e8e8d8');
    p(10, 17, 1, 1, '#e8e8d8');
    // Enfeite dourado
    p(13, 10, 1, 1, '#c9a24d');
    p(12, 10, 1, 1, '#c9a24d');
  }),

  shadow_dagger: makeIcon((g) => {
    const p = px(g);
    // Lâmina escura (quase preta)
    p(9, 2, 2, 9, '#2a1a3e');
    p(9, 2, 1, 9, '#6a4a8a');       // brilho esquerdo
    p(10, 2, 1, 9, '#1a0a2a');      // sombra direita
    // Fio mágico (linha roxa no topo)
    p(8, 2, 4, 1, '#a87aff');
    p(8, 2, 4, 1, '#a87aff');
    // Guarda curta
    p(7, 11, 6, 1, '#8a5a3a');
    // Cabo escuro
    p(9, 12, 2, 3, '#3a1a0a');
    // Gema no pomo (roxa brilhante)
    p(9, 15, 2, 2, '#d78cff');
    p(9, 15, 1, 1, '#ffffff');
    // Detalhe extra: pontinha afiada no topo
    p(10, 1, 1, 1, '#a87aff');
  }),

  map: makeIcon((g) => {
    const p = px(g);
    // Pergaminho enrolado
    const paper     = '#e8d8b0';
    const paperDark = '#b8a074';
    const paperHi   = '#f5ebd0';
    const rope      = '#8a5a3a';
    const ropeHi    = '#a86b4a';
    const ink       = '#5a3a24';

    // Corpo do mapa (pergaminho)
    p(3, 4, 14, 12, paperDark);
    p(4, 4, 12, 12, paper);
    // Bordas onduladas (dão "pergaminho")
    p(4, 4, 12, 1, paperHi);
    p(4, 15, 12, 1, paperDark);
    p(3, 4, 1, 12, paperDark);
    p(16, 4, 1, 12, paperDark);

    // "Linhas" de caminho no mapa (um X / estradas)
    p(6, 7, 2, 1, ink);      // trilha oeste
    p(8, 8, 1, 1, ink);
    p(9, 9, 1, 1, ink);
    p(10, 10, 1, 1, ink);
    p(11, 11, 3, 1, ink);    // trilha leste
    p(6, 12, 1, 1, ink);     // acampamento
    p(13, 7, 1, 1, ink);     // cidade (ponto)

    // Um "X" marcando o tesouro/objetivo
    p(11, 7, 1, 1, '#c93030');
    p(13, 9, 1, 1, '#c93030');

    // "Cordão" embaixo (amarra o pergaminho)
    p(5, 16, 10, 1, rope);
    p(5, 17, 10, 1, ropeHi);
    p(4, 16, 1, 2, rope);
    p(15, 16, 1, 2, rope);
  }),

  potion_strong: makeIcon((g) => {
    const p = px(g);
    // Frasco maior, líquido vermelho-vivo com brilho mais intenso
    const glass     = '#c8d8e8';
    const glassSh   = '#8aa0b8';
    const cork      = '#8a6b5a';
    const corkSh    = '#5a4030';
    const liquid    = '#c93030';   // vermelho vivo (mais "forte" que a fraca)
    const liquidHi  = '#ff6b6b';   // brilho
    const liquidSh  = '#7a1010';   // sombra
    const star      = '#fff5c0';   // estrelinha (diferencia da média)

    // Corpo do frasco (mais largo)
    p(5, 4, 10, 12, glass);
    // Sombra lateral direita
    p(14, 4, 1, 12, glassSh);
    // Líquido (enche quase tudo)
    p(6, 5, 8, 10, liquid);
    p(6, 5, 8, 1, liquidHi);
    p(6, 13, 8, 2, liquidSh);
    // Brilho interno (bolha/reflexo)
    p(7, 6, 2, 2, liquidHi);

    // Gargalo
    p(8, 2, 4, 2, glass);
    p(9, 2, 2, 2, glassSh);
    // Rolha
    p(8, 1, 4, 2, cork);
    p(8, 1, 4, 1, corkSh);

    // Base do frasco (mais escura)
    p(5, 14, 10, 2, glassSh);
    p(5, 14, 10, 1, '#a8b8c8');

    // Estrelinha dourada (marca de "poção forte")
    p(10, 8, 1, 3, star);
    p(9, 9, 3, 1, star);
    p(10, 9, 1, 1, '#ffffff');
  }),

  potion_mana_medium: makeIcon((g) => {
    const p = px(g);
    const glass   = '#c8d8e8';
    const glassSh = '#8aa0b8';
    const cork    = '#8a6b5a';
    const liquid  = '#2a5fa0';
    const liquidHi = '#8ad8ff';
    const star    = '#ffffff';

    // Corpo do frasco
    p(6, 4, 8, 12, glass);
    p(14, 4, 1, 12, glassSh);
    // Líquido (azul médio)
    p(7, 5, 6, 10, liquid);
    p(7, 5, 6, 1, liquidHi);
    // Brilho interno
    p(8, 6, 2, 2, liquidHi);

    // Gargalo + rolha
    p(8, 2, 4, 2, glass);
    p(9, 2, 2, 2, glassSh);
    p(8, 1, 4, 2, cork);
    p(8, 1, 4, 1, '#5a4030');

    // Base
    p(6, 14, 8, 2, glassSh);

    // Estrelinha (marca de "média")
    p(10, 10, 2, 1, star);
    p(10, 9, 1, 1, star);
  }),

  potion_mana_strong: makeIcon((g) => {
    const p = px(g);
    const glass    = '#c8d8e8';
    const glassSh  = '#8aa0b8';
    const cork     = '#8a6b5a';
    const corkSh   = '#5a4030';
    const liquid   = '#2a5fa0';
    const liquidHi = '#8ad8ff';
    const liquidSh = '#1a3f70';
    const star     = '#e8f6ff';

    // Corpo do frasco (mais largo que os outros)
    p(5, 4, 10, 12, glass);
    p(14, 4, 1, 12, glassSh);
    // Líquido (enche quase tudo)
    p(6, 5, 8, 10, liquid);
    p(6, 5, 8, 1, liquidHi);
    p(6, 13, 8, 2, liquidSh);
    // Brilho interno (bolha/reflexo maior)
    p(7, 6, 2, 2, liquidHi);

    // Gargalo + rolha
    p(8, 2, 4, 2, glass);
    p(9, 2, 2, 2, glassSh);
    p(8, 1, 4, 2, cork);
    p(8, 1, 4, 1, corkSh);

    // Base
    p(5, 14, 10, 2, glassSh);
    p(5, 14, 10, 1, '#a8b8c8');

    // Estrela grande (marca de "forte")
    p(10, 7, 1, 5, star);
    p(8, 9, 5, 1, star);
    p(9, 8, 3, 3, star);
    p(10, 9, 1, 1, '#ffffff');
  }),

  questlog: makeIcon((g) => {
    const p = px(g);
    // Pergaminho
    const paper     = '#e8d8b0';
    const paperDark = '#b8a074';
    const paperHi   = '#f5ebd0';
    const ink       = '#5a3a24';
    const gold      = '#feca57';
    const goldSh    = '#c9a24d';

    // Corpo do pergaminho (levemente enrolado nas pontas)
    p(4, 3, 12, 14, paperDark);   // sombra/borda
    p(5, 4, 10, 12, paper);       // papel
    p(5, 4, 10, 1, paperHi);      // brilho topo
    // Enrolado no topo (barra horizontal)
    p(3, 2, 14, 2, paperDark);
    p(4, 2, 12, 1, paperHi);
    // Enrolado na base
    p(3, 16, 14, 2, paperDark);
    p(4, 16, 12, 1, paperHi);

    // Linhas de "texto" (fracas, pro fundo não competir com o "!")
    p(7, 7, 6, 1, ink);
    p(7, 9, 4, 1, ink);

    // Exclamação dourada (símbolo de quest)
    p(10, 6, 2, 5, gold);         // haste
    p(10, 12, 2, 2, gold);        // ponto
    p(10, 6, 1, 5, goldSh);       // sombra lateral esq da haste
    p(10, 12, 1, 2, goldSh);      // sombra lateral esq do ponto
    p(11, 6, 1, 5, '#fff5c0');    // brilho lateral dir da haste
  }),

  rat_tail: makeIcon((g) => {
    const p = px(g);
    // Paleta
    const skin     = '#b89a8a';   // tom rosado-acinzentado do rato
    const skinHi   = '#d8c0b0';   // brilho
    const skinSh   = '#8a6a5a';   // sombra
    const skinDark = '#5a3f32';   // contorno/raiz
    const ringHi   = '#e8d0c0';   // "anéis" claros

    // Cauda em curva de S, saindo do canto inferior direito (raiz)
    // e terminando no canto superior esquerdo (ponta). É a "cauda de rato"
    // clássica: fina, comprida, com anéis.

    // Raiz (parte grossa, embaixo à direita)
    p(15, 15, 3, 3, skinDark);
    p(16, 15, 2, 2, skinSh);

    // Segmento 1 (sobe e curva pra esquerda)
    p(13, 13, 3, 3, skin);
    p(13, 13, 3, 1, skinHi);
    p(13, 15, 3, 1, skinSh);

    // Segmento 2 (meio, cruza)
    p(10, 11, 4, 3, skin);
    p(10, 11, 4, 1, skinHi);
    p(10, 13, 4, 1, skinSh);

    // Segmento 3 (sobe mais)
    p(8, 8, 3, 3, skin);
    p(8, 8, 3, 1, skinHi);
    p(8, 10, 3, 1, skinSh);

    // Segmento 4 (curva pro topo)
    p(6, 5, 3, 3, skin);
    p(6, 5, 3, 1, skinHi);

    // Ponta (bem fina, aponta pra cima-esquerda)
    p(5, 3, 2, 2, skin);
    p(5, 3, 1, 1, skinHi);
    p(4, 2, 1, 1, skinSh);

    // Anéis (detalhe sutil, um pixel claro em cada segmento)
    p(11, 12, 1, 1, ringHi);
    p(9, 9,  1, 1, ringHi);
    p(7, 6,  1, 1, ringHi);

    // Sombra na base (dá peso à raiz)
    p(15, 17, 3, 1, skinDark);
  }),

  goblin_tooth: makeIcon((g) => {
    const p = px(g);
    // Dente afiado, amarelado, com raiz
    const base   = '#e8e0c0';
    const baseHi = '#f5f0d8';
    const baseSh = '#b8a878';
    const root   = '#8a7a5a';
    const rootSh = '#5a4a30';

    // Coroa (parte de cima, arredondada)
    p(7, 3, 6, 6, base);
    p(7, 3, 6, 1, baseHi);
    p(7, 8, 6, 1, baseSh);
    // Pontinha
    p(8, 2, 4, 1, baseHi);
    p(9, 1, 2, 1, '#ffffff');

    // Raiz (parte de baixo, pontuda dupla)
    p(7, 9, 2, 5, root);
    p(11, 9, 2, 5, root);
    p(7, 9, 2, 1, rootSh);
    p(11, 9, 2, 1, rootSh);
    p(7, 13, 2, 1, rootSh);
    p(11, 13, 2, 1, rootSh);
    // Canais da raiz (escuros)
    p(8, 10, 1, 3, rootSh);
    p(12, 10, 1, 3, rootSh);

    // Brilho lateral (dá volume)
    p(7, 4, 1, 5, baseHi);
    p(12, 4, 1, 5, baseSh);
  }),

  slime_gel: makeIcon((g) => {
    const p = px(g);
    // Gosma verde, brilhante, com bolhas
    const gel    = '#6fd16f';
    const gelHi  = '#a8e8a8';
    const gelSh  = '#4fa34f';
    const gelDk  = '#2f7a2f';

    // Corpo (oval/achatado)
    p(3, 8, 14, 8, gel);
    p(4, 7, 12, 1, gelHi);
    p(3, 15, 14, 1, gelSh);
    // Topo mais claro
    p(6, 6, 8, 1, gelHi);
    p(8, 5, 4, 1, '#c8f8c8');

    // Sombra inferior direita
    p(12, 14, 5, 1, gelDk);
    p(15, 12, 2, 2, gelDk);

    // Bolhas (pequenas, brilhantes)
    p(6, 9, 2, 2, gelHi);
    p(12, 10, 2, 2, gelHi);
    p(9, 12, 1, 1, '#e8ffe8');
    p(14, 8, 1, 1, '#e8ffe8');

    // Reflexo (linha diagonal)
    p(5, 7, 1, 1, '#ffffff');
    p(7, 8, 1, 1, '#d8f8d8');
  }),

  scorpion_pincer: makeIcon((g) => {
    const p = px(g);
    // Pinça de escorpião (vista lateral): 2 dedos curvos + base
    const shell  = '#8a4a20';
    const shellHi = '#b86a30';
    const shellSh = '#5a2a10';
    const shellDk = '#3a1808';
    const tip    = '#c93030';

    // Base da pinça (parte grossa, esquerda)
    p(3, 9, 5, 5, shell);
    p(3, 9, 5, 1, shellHi);
    p(3, 13, 5, 1, shellSh);

    // Dedo superior (curva pra cima e pra direita)
    p(7, 8, 3, 2, shell);
    p(9, 6, 3, 2, shell);
    p(11, 5, 3, 2, shell);
    p(13, 5, 2, 1, tip);
    p(7, 8, 3, 1, shellHi);
    p(9, 6, 3, 1, shellHi);
    p(11, 5, 3, 1, shellHi);

    // Dedo inferior (curva pra baixo e pra direita)
    p(7, 13, 3, 2, shell);
    p(9, 14, 3, 2, shell);
    p(11, 14, 3, 2, shell);
    p(13, 15, 2, 1, tip);
    p(7, 14, 3, 1, shellSh);
    p(9, 15, 3, 1, shellSh);

    // Junta central (onde os dedos se encontram)
    p(5, 10, 4, 4, shellSh);
    p(5, 10, 4, 1, shell);
    p(5, 13, 4, 1, shellDk);
    p(6, 11, 2, 2, shellHi);

    // Textura (pontinhos escuros)
    p(4, 11, 1, 1, shellDk);
    p(12, 7, 1, 1, shellDk);
    p(12, 13, 1, 1, shellDk);
  }),

  vulture_egg: makeIcon((g) => {
    const p = px(g);
    // Ovo manchado, bege com manchas marrons
    const shell   = '#e8dcc0';
    const shellHi = '#f5eed8';
    const shellSh = '#b8a880';
    const shellDk = '#8a7a5a';
    const spot    = '#8a5a3a';
    const spotSh  = '#5a3a20';

    // Corpo (oval vertical)
    p(6, 4, 8, 13, shell);
    p(7, 3, 6, 1, shellHi);
    p(6, 4, 8, 1, shellHi);
    p(6, 16, 8, 1, shellSh);
    p(6, 4, 1, 13, shellHi);
    p(13, 4, 1, 13, shellSh);

    // Manchas (espalhadas, irregulares)
    p(8, 6, 2, 2, spot);
    p(11, 8, 1, 1, spot);
    p(9, 10, 1, 2, spot);
    p(12, 12, 2, 1, spot);
    p(7, 13, 1, 1, spot);
    p(10, 14, 1, 1, spot);
    p(11, 15, 1, 1, spot);

    // Sombra das manchas (profundidade)
    p(8, 7, 2, 1, spotSh);
    p(9, 11, 1, 1, spotSh);
    p(12, 13, 2, 1, spotSh);

    // Brilho no topo
    p(8, 4, 2, 1, '#ffffff');
    p(7, 5, 1, 1, '#ffffff');

    // Base do ovo (leve sombra)
    p(7, 17, 6, 1, shellDk);
  }),

  bat_wing: makeIcon((g) => {
    const p = px(g);
    const membrane = '#4a3a5a';
    const membraneSh = '#2a1a3a';
    const bone = '#8a7a9a';
    // Asa (membrana)
    p(5, 6, 3, 2, membrane);
    p(4, 8, 5, 2, membrane);
    p(6, 10, 4, 2, membrane);
    p(8, 12, 3, 2, membrane);
    p(10, 14, 2, 1, membrane);
    // Ossos
    p(5, 7, 1, 1, bone);
    p(7, 9, 1, 1, bone);
    p(9, 11, 1, 1, bone);
    p(11, 13, 1, 1, bone);
    // Sombra
    p(6, 7, 1, 1, membraneSh);
    p(8, 9, 1, 1, membraneSh);
    p(10, 11, 1, 1, membraneSh);
  }),

  nucleo_bruto: makeIcon((g) => {
    const p = px(g);
    const crystal = '#8ad8ff';
    const crystalHi = '#e8f6ff';
    const crystalSh = '#3a80a0';
    const rock = '#4a4a52';
    // Cristal central
    p(8, 4, 4, 8, crystal);
    p(9, 3, 2, 2, crystalHi);
    p(9, 5, 1, 3, crystalHi);
    p(10, 10, 1, 2, crystalSh);
    // Base rochosa
    p(6, 12, 8, 4, rock);
    p(7, 13, 6, 2, '#5a5a62');
    p(8, 14, 4, 1, '#3a3a42');
    // Brilho ao redor (pulsante)
    p(7, 6, 1, 1, 'rgba(138, 216, 255, 0.5)');
    p(12, 8, 1, 1, 'rgba(138, 216, 255, 0.5)');
  }),

  iron_shield: makeIcon((g) => {
    const p = px(g);
    // Escudo de ferro: mais escuro, bordas metálicas
    const rim    = '#7a8290';
    const rimHi  = '#a8b0b8';
    const face   = '#3a3a44';
    const faceHi = '#4a4a55';
    const shade  = '#1e1e26';
    const emblem = '#c9a24d';

    // Corpo principal
    p(4, 3, 12, 12, rim);
    p(5, 4, 10, 10, face);
    // Brilho no topo
    p(5, 4, 10, 1, faceHi);
    p(4, 3, 12, 1, rimHi);
    // Sombra embaixo
    p(4, 14, 12, 1, shade);
    p(5, 13, 10, 1, shade);
    // Borda metálica lateral
    p(4, 4, 1, 10, rimHi);
    p(15, 4, 1, 10, shade);
    // Emblema central
    p(9, 8, 2, 1, emblem);
    p(9, 8, 1, 4, emblem);
  }),

  runic_shield: makeIcon((g) => {
    const p = px(g);
    // Escudo rúnico: aço escuro com runas roxas
    const rim    = '#4a4a55';
    const rimHi  = '#6a6a78';
    const face   = '#25252e';
    const rune   = '#a87aff';
    const runeHi = '#e0c8ff';
    const shade  = '#0f0f18';

    // Corpo
    p(3, 3, 14, 13, rim);
    p(4, 4, 12, 11, face);
    p(4, 4, 12, 1, rimHi);
    p(3, 15, 14, 1, shade);
    p(3, 3, 14, 1, rimHi);
    // Runas
    p(8, 5, 1, 6, rune);           // vertical
    p(9, 5, 1, 1, rune);           // ramo
    p(9, 7, 2, 1, rune);           // ramo
    p(9, 9, 1, 1, rune);           // ramo
    p(11, 6, 1, 4, rune);          // runa lateral
    p(12, 6, 1, 1, runeHi);        // brilho
    // Base
    p(4, 13, 12, 1, '#1a1a22');
  }),

  // ============================================================
  // CONJUNTO DE COURO
  // ============================================================
  leather_helmet: makeIcon((g) => {
    const p = px(g);
    const leather = '#8a5a3a';
    const leatherHi = '#a87a5a';
    const leatherSh = '#5a3a24';
    const stud    = '#c9a24d';

    // Corpo do capacete (meia-lua)
    p(5, 5, 10, 8, leather);
    p(5, 5, 10, 1, leatherHi);
    p(5, 12, 10, 1, leatherSh);
    // Tira de couro na parte de baixo
    p(4, 12, 12, 2, leatherSh);
    p(4, 13, 12, 1, '#3a2410');
    // Rebites laterais
    p(6, 9, 1, 1, stud);
    p(13, 9, 1, 1, stud);
  }),

  leather_armor: makeIcon((g) => {
    const p = px(g);
    const leather = '#8a5a3a';
    const leatherHi = '#a87a5a';
    const leatherSh = '#5a3a24';
    const strap  = '#3a2410';

    // Corpo (peitoral)
    p(6, 4, 8, 12, leather);
    p(6, 4, 8, 1, leatherHi);
    p(6, 15, 8, 1, leatherSh);
    // Alças nos ombros
    p(4, 4, 2, 6, leatherSh);
    p(14, 4, 2, 6, leatherSh);
    // Cinto
    p(5, 12, 10, 1, strap);
    p(9, 12, 2, 1, '#c9a24d');   // fivela
  }),

  leather_boots: makeIcon((g) => {
    const p = px(g);
    const leather = '#8a5a3a';
    const leatherHi = '#a87a5a';
    const leatherSh = '#5a3a24';
    const sole  = '#3a2410';

    // Par de botas (uma de frente)
    // Bota esquerda
    p(4, 6, 4, 8, leather);
    p(4, 6, 4, 1, leatherHi);
    p(4, 13, 4, 2, sole);
    p(4, 14, 6, 1, sole);         // bico
    // Bota direita
    p(11, 6, 4, 8, leather);
    p(11, 6, 4, 1, leatherHi);
    p(10, 13, 4, 2, sole);
    p(10, 14, 6, 1, sole);
  }),

  // ============================================================
  // CONJUNTO DE FERRO
  // ============================================================
  iron_helmet: makeIcon((g) => {
    const p = px(g);
    const iron    = '#6a6a72';
    const ironHi  = '#8a8a94';
    const ironSh  = '#3a3a42';
    const stud    = '#c9a24d';

    // Corpo (meia-lua mais fechada que o couro)
    p(4, 4, 12, 10, iron);
    p(4, 4, 12, 1, ironHi);
    p(4, 13, 12, 1, ironSh);
    // Viseira horizontal (fenda)
    p(5, 8, 10, 2, ironSh);
    p(5, 8, 10, 1, '#2a2a32');
    // Rebites laterais
    p(5, 6, 1, 1, stud);
    p(14, 6, 1, 1, stud);
    p(5, 11, 1, 1, stud);
    p(14, 11, 1, 1, stud);
    // Faixa central (reforço)
    p(9, 4, 2, 2, ironHi);
  }),

  iron_armor: makeIcon((g) => {
    const p = px(g);
    const iron    = '#6a6a72';
    const ironHi  = '#8a8a94';
    const ironSh  = '#3a3a42';
    const strap   = '#3a2410';
    const rivet   = '#c9a24d';

    // Corpo (peitoral)
    p(5, 4, 10, 12, iron);
    p(5, 4, 10, 1, ironHi);
    p(5, 15, 10, 1, ironSh);
    // Ombros
    p(3, 4, 2, 5, ironSh);
    p(15, 4, 2, 5, ironSh);
    // Faixa central (linha de rebites)
    p(9, 6, 2, 8, ironSh);
    for (let y = 6; y <= 13; y += 2) p(9, y, 2, 1, rivet);
    // Cinto
    p(5, 12, 10, 1, strap);
    p(9, 12, 2, 1, rivet);
  }),

  iron_boots: makeIcon((g) => {
    const p = px(g);
    const iron    = '#6a6a72';
    const ironHi  = '#8a8a94';
    const ironSh  = '#3a3a42';
    const sole    = '#2a2a32';

    // Greva esquerda
    p(4, 4, 5, 10, iron);
    p(4, 4, 5, 1, ironHi);
    p(4, 13, 5, 2, ironSh);
    p(4, 14, 7, 1, sole);
    p(6, 6, 1, 4, ironSh);   // detalhe vertical
    // Greva direita
    p(11, 4, 5, 10, iron);
    p(11, 4, 5, 1, ironHi);
    p(11, 13, 5, 2, ironSh);
    p(10, 14, 7, 1, sole);
    p(13, 6, 1, 4, ironSh);
  }),

  // ============================================================
  // CONJUNTO RÚNICO (aço + runas roxas)
  // ============================================================
  runic_helmet: makeIcon((g) => {
    const p = px(g);
    const steel    = '#3a3a44';
    const steelHi  = '#5a5a68';
    const steelSh  = '#1e1e26';
    const rune     = '#a87aff';
    const runeHi   = '#e0c8ff';

    // Corpo
    p(4, 4, 12, 10, steel);
    p(4, 4, 12, 1, steelHi);
    p(4, 13, 12, 1, steelSh);
    // Viseira
    p(5, 8, 10, 3, steelSh);
    p(5, 8, 10, 1, '#2a2a34');
    // Runa na testa
    p(9, 5, 2, 1, rune);
    p(9, 6, 1, 2, rune);
    p(11, 6, 1, 1, rune);
    p(10, 6, 1, 1, runeHi);
    // Rebites
    p(5, 12, 1, 1, steelHi);
    p(14, 12, 1, 1, steelHi);
  }),

  runic_armor: makeIcon((g) => {
    const p = px(g);
    const steel    = '#3a3a44';
    const steelHi  = '#5a5a68';
    const steelSh  = '#1e1e26';
    const rune     = '#a87aff';
    const runeHi   = '#e0c8ff';

    // Corpo
    p(5, 4, 10, 12, steel);
    p(5, 4, 10, 1, steelHi);
    p(5, 15, 10, 1, steelSh);
    // Ombros
    p(3, 4, 2, 5, steelSh);
    p(15, 4, 2, 5, steelSh);
    // Runa central (vertical)
    p(9, 6, 1, 6, rune);
    p(10, 6, 1, 1, runeHi);
    p(9, 9, 2, 1, rune);
    p(9, 11, 2, 1, rune);
    // Cinto
    p(5, 13, 10, 1, '#2a2a34');
    p(9, 13, 2, 1, rune);
  }),

  runic_boots: makeIcon((g) => {
    const p = px(g);
    const steel    = '#3a3a44';
    const steelHi  = '#5a5a68';
    const steelSh  = '#1e1e26';
    const rune     = '#a87aff';

    // Greva esquerda
    p(4, 4, 5, 10, steel);
    p(4, 4, 5, 1, steelHi);
    p(4, 13, 5, 2, steelSh);
    p(4, 14, 7, 1, steelSh);
    p(6, 6, 1, 4, rune);
    // Greva direita
    p(11, 4, 5, 10, steel);
    p(11, 4, 5, 1, steelHi);
    p(11, 13, 5, 2, steelSh);
    p(10, 14, 7, 1, steelSh);
    p(13, 6, 1, 4, rune);
  }),

  // ----- ITENS DE MISSÕES ------
  letter_to_elder: makeIcon((g) => {
    const p = px(g);
    // Pergaminho enrolado, com selo dourado
    const paper     = '#e8d8b0';
    const paperDark = '#b8a074';
    const paperHi   = '#f5ebd0';
    const ink       = '#5a3a24';
    const seal      = '#9b1c1c';   // cera vermelha
    const sealHi    = '#c93030';
    const sealSh    = '#6b1010';
    const gold      = '#c9a24d';

    // Corpo do pergaminho
    p(4, 3, 12, 14, paperDark);     // borda
    p(5, 4, 10, 12, paper);         // papel
    p(5, 4, 10, 1, paperHi);        // brilho topo
    p(5, 15, 10, 1, paperDark);     // sombra base

    // Enrolado no topo (barra horizontal)
    p(3, 2, 14, 2, paperDark);
    p(4, 2, 12, 1, paperHi);
    // Enrolado na base
    p(3, 16, 14, 2, paperDark);
    p(4, 16, 12, 1, paperHi);

    // Linhas de "texto"
    p(7, 7, 6, 1, ink);
    p(7, 9, 4, 1, ink);
    p(7, 11, 5, 1, ink);

    // Selo de cera (círculo vermelho no centro-baixo)
    p(9, 11, 3, 3, sealSh);         // sombra
    p(9, 11, 3, 2, seal);           // corpo
    p(9, 10, 3, 1, sealHi);         // brilho
    // "Fita" dourada saindo do selo
    p(8, 13, 1, 2, gold);
    p(12, 13, 1, 2, gold);
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