// src/sprites/huntress.js
// Caçadora: capuz verde-escuro pontudo, cabelo loiro saindo por baixo,
// manto curto, botas de couro, aljava nas costas.
export function makeHuntressFrames() {
  const S = 32;
  const frames = { down: [], up: [], left: [], right: [] };

  const pal = {
    skin:    '#f2c9a0', skinSh:  '#d9a878',
    hair:    '#e8c860', hairHi:  '#f5dd88', hairSh: '#b89840',   // ? cabelo loiro
    hood:    '#2a4a2a', hoodSh:  '#1a2f1a', hoodHi: '#3f6b3f',
    cloak:   '#3a2a1e', cloakSh: '#2a1a0e',
    tunic:   '#4a6b3a', tunicSh: '#354d2a', tunicHi: '#6b8a4a',
    belt:    '#c9a24d',
    boot:    '#3a2b1e', bootSh:  '#2a1a0e',
    eye:     '#e6e64a',
    quiver:  '#5a3a1a', quiverSh: '#3a1a0a',
    arrow:   '#e8d890', feather:  '#c93030',
  };

  function drawFrame(dir, step) {
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;

    const bob  = step === 1 ? -1 : 0;
    const legL = step === 1 ? -1 : 0;
    const legR = step === 1 ?  1 : 0;

    const px = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y + bob, w, h); };
    const pxGround = (x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x, y, w, h); };

    // ============================================================
    // FRONTAL
    // ============================================================
    function bodyFront() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');   // sombra

      // Manto curto (capa de caçadora) nas costas/ombros
      px(8, 14, 16, 4, pal.cloak);
      px(8, 14, 16, 1, pal.cloakSh);
      px(8, 17, 16, 1, pal.cloakSh);

      // Túnica (corpo)
      px(9, 18, 14, 6, pal.tunic);
      px(9, 18, 14, 1, pal.tunicHi);
      px(9, 23, 14, 1, pal.tunicSh);

      // Cinto
      px(9, 22, 14, 1, pal.belt);

      // Pernas (calça + bota)
      pxGround(11, 24 + legL, 4, 4, pal.cloakSh);
      pxGround(17, 24 + legR, 4, 4, pal.cloakSh);
      pxGround(11, 28 + legL, 4, 2, pal.boot);
      pxGround(17, 28 + legR, 4, 2, pal.boot);

      // Braços
      px(7, 18, 2, 6, pal.tunicSh);
      px(23, 18, 2, 6, pal.tunicSh);
      px(7, 24, 2, 1, pal.skinSh);
      px(23, 24, 2, 1, pal.skinSh);

      // ---- CABELO LOIRO (saindo por baixo do capuz, nas laterais) ----
      // Mechas laterais caindo até a altura do ombro
      px(10, 10, 2, 4, pal.hair);
      px(20, 10, 2, 4, pal.hair);
      px(10, 13, 2, 1, pal.hairSh);       // sombra na ponta esq
      px(20, 13, 2, 1, pal.hairSh);       // sombra na ponta dir
      // Brilho nas mechas
      px(10, 10, 1, 2, pal.hairHi);
      px(21, 10, 1, 2, pal.hairHi);

      // Cabeça (rosto, agora 8x6 ? menos "testudo")
      px(12, 8, 8, 6, pal.skin);
      px(12, 13, 8, 1, pal.skinSh);       // sombra do queixo

      // ---- CAPUZ (2 camadas de ponta, mais baixo e proporcional) ----
      // Ponta do capuz (topo mais alto, puxado pra trás)
      px(13, 2, 6, 1, pal.hoodHi);        // pontinha superior
      px(12, 3, 8, 1, pal.hood);          // topo
      // Corpo do capuz cobrindo a testa (2px)
      px(11, 4, 10, 2, pal.hood);
      px(11, 4, 10, 1, pal.hoodSh);       // sombra no vinco
      // Aba do capuz caindo atrás (esq e dir) ? mais curta
      px(11, 6, 1, 3, pal.hood);          // aba esquerda
      px(20, 6, 1, 3, pal.hood);          // aba direita
      px(11, 8, 1, 1, pal.hoodSh);        // sombra da ponta esq
      px(20, 8, 1, 1, pal.hoodSh);        // sombra da ponta dir
      // "Bico" do capuz (ponta que pende sobre a testa)
      px(14, 5, 4, 1, pal.hoodSh);
      // Testa visível (rosto exposto entre o capuz e os olhos)
      px(13, 6, 6, 1, pal.skin);

      // Olhos (mais próximos, combinando com rosto menor)
      px(14, 9, 1, 1, pal.eye);
      px(17, 9, 1, 1, pal.eye);

      // Marcas de guerra (2 linhas nas bochechas)
      px(13, 11, 1, 1, pal.hoodSh);
      px(18, 11, 1, 1, pal.hoodSh);

      // Aljava aparecendo atrás do ombro direito (2 flechas)
      px(22, 15, 2, 1, pal.quiver);
      px(23, 14, 1, 1, pal.quiverSh);
      px(22, 13, 1, 1, pal.arrow);
      px(22, 12, 1, 1, pal.feather);
      px(24, 13, 1, 1, pal.arrow);
      px(24, 12, 1, 1, pal.feather);
    }

    // ============================================================
    // COSTAS
    // ============================================================
    function bodyBack() {
      pxGround(10, 30, 12, 1, 'rgba(0,0,0,0.25)');

      // Manto cobre quase tudo (caçadora de costas = capa + capuz)
      px(8, 14, 16, 4, pal.cloak);
      px(8, 14, 16, 1, pal.cloakSh);

      // Túnica
      px(9, 18, 14, 6, pal.tunic);
      px(9, 18, 14, 1, pal.tunicHi);
      px(9, 22, 14, 1, pal.belt);

      // Pernas
      pxGround(11, 26 + legL, 4, 4, pal.cloakSh);
      pxGround(17, 26 + legR, 4, 4, pal.cloakSh);
      pxGround(11, 28 + legL, 4, 2, pal.boot);
      pxGround(17, 28 + legR, 4, 2, pal.boot);

      // ============================================================
      // ALJAVA (protagonista nas costas)
      // ============================================================
      px(19, 12, 3, 10, pal.quiver);
      px(19, 12, 1, 10, pal.quiverSh);     // sombra lateral esq
      px(21, 12, 1, 10, pal.quiverSh);     // sombra lateral dir
      // Tampa/boca da aljava
      px(19, 11, 3, 1, pal.quiverSh);
      // Flechas saindo pra cima (3 flechas)
      px(19, 9, 1, 2, pal.arrow);
      px(19, 8, 1, 1, pal.feather);
      px(21, 9, 1, 2, pal.arrow);
      px(21, 8, 1, 1, pal.feather);
      px(20, 8, 1, 3, pal.arrow);
      px(20, 7, 1, 1, pal.feather);

      // ---- CABELO LOIRO (saindo por baixo do capuz, atrás) ----
      // Mechas visíveis na nuca, mais compridas
      px(11, 11, 10, 2, pal.hair);
      px(11, 12, 10, 1, pal.hairSh);      // sombra da base
      px(11, 11, 2, 1, pal.hairHi);       // brilho esq
      px(19, 11, 2, 1, pal.hairHi);       // brilho dir

      // ---- CAPUZ DE COSTAS (pontudo, cobre tudo, com vinco no meio) ----
      px(10, 3, 12, 8, pal.hood);         // corpo do capuz
      px(10, 3, 12, 1, pal.hoodSh);       // sombra no topo
      px(11, 2, 10, 1, pal.hoodHi);       // ponta do capuz
      px(12, 1, 8, 1, pal.hoodHi);        // pontinha superior
      px(10, 10, 12, 1, pal.hoodSh);      // base do capuz (sombra)
      // Vinco do capuz (dá a impressão de tecido)
      px(15, 3, 1, 7, pal.hoodSh);
    }

    // ============================================================
    // PERFIL (virado pra DIREITA ? será espelhado pra esquerda)
    // ============================================================
    function bodySide() {
      pxGround(11, 30, 10, 1, 'rgba(0,0,0,0.25)');

      // Manto curto
      px(10, 14, 12, 4, pal.cloak);
      px(10, 14, 12, 1, pal.cloakSh);

      // Túnica
      px(11, 18, 10, 6, pal.tunic);
      px(11, 18, 10, 1, pal.tunicHi);
      px(12, 22, 8, 1, pal.belt);

      // Pernas
      pxGround(13, 24 + legL, 4, 4, pal.cloakSh);
      pxGround(17, 24 + legR, 4, 4, pal.cloakSh);
      pxGround(13, 28 + legL, 4, 2, pal.boot);
      pxGround(17, 28 + legR, 4, 2, pal.boot);

      // Braço
      px(19, 18, 2, 6, pal.tunicSh);
      px(19, 24, 2, 1, pal.skinSh);

      // ---- CABELO LOIRO (caindo atrás da cabeça, visível no perfil) ----
      px(13, 9, 2, 5, pal.hair);          // mecha atrás
      px(13, 13, 2, 1, pal.hairSh);       // sombra na ponta
      px(13, 9, 1, 3, pal.hairHi);        // brilho

      // Cabeça de perfil (rosto pra direita) ? 6px de largura, mais enxuto
      px(15, 8, 6, 6, pal.skin);
      px(15, 13, 6, 1, pal.skinSh);       // sombra do queixo

      // ---- CAPUZ DE PERFIL (topo pontudo puxado pra trás, bico na frente) ----
      // Ponta do capuz (puxada pra trás ? fica à esquerda no perfil)
      px(12, 1, 7, 1, pal.hoodHi);
      px(12, 2, 10, 1, pal.hoodHi);
      px(12, 3, 11, 2, pal.hood);          // topo reto
      // Testa coberta (só 1 linha)
      px(12, 5, 11, 1, pal.hood);
      // Nuca grossa atrás (parte de trás do capuz, mais larga)
      px(12, 6, 3, 4, pal.hood);
      px(12, 9, 3, 1, pal.hoodSh);         // sombra da nuca
      // "Bico" do capuz na frente (ponta que pende sobre a testa)
      px(22, 5, 2, 1, pal.hoodSh);
      px(23, 4, 1, 1, pal.hoodSh);
      // Testa visível (rosto exposto)
      px(16, 6, 6, 1, pal.skin);

      // Olho
      px(19, 9, 1, 1, pal.eye);

      // Marca de guerra
      px(20, 11, 1, 1, pal.hoodSh);

      // Aljava aparecendo atrás (1 flecha visível no perfil)
      px(14, 12, 2, 1, pal.quiver);
      px(13, 11, 1, 1, pal.arrow);
      px(13, 10, 1, 1, pal.feather);
    }

    if (dir === 'down')  bodyFront();
    if (dir === 'up')    bodyBack();
    if (dir === 'right') bodySide();
    if (dir === 'left') {
      bodySide();
      const flipped = document.createElement('canvas');
      flipped.width = S; flipped.height = S;
      const fg = flipped.getContext('2d');
      fg.imageSmoothingEnabled = false;
      fg.translate(S, 0); fg.scale(-1, 1);
      fg.drawImage(c, 0, 0);
      return flipped;
    }

    return c;
  }

  for (const dir of ['down', 'up', 'left', 'right']) {
    frames[dir][0] = drawFrame(dir, 0);
    frames[dir][1] = drawFrame(dir, 1);
  }

  return frames;
}

export const huntressFrames = makeHuntressFrames();