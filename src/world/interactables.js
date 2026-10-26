import { playerStats, player, addGold } from '../core/state.js';
import { ITEMS_DB } from '../items.js';
import { TILE_SIZE } from '../core/canvas.js';

// ============================================================
// INTERACTABLES
// Cada sala pode ter uma lista de interactables.
// Um interactable = { tx, ty, kind, ...dados }
// O jogador interage se estiver no MESMO tile ou adjacente (4 dirs).
// ============================================================

export function getInteractables(room) {
  if (!room) return [];

  const list = [];

  // ---- INTERIOR: só o NPC ----
  if (room.isInterior) {
    if (room.npc) {
      list.push({
        tx: room.npc.tx,
        ty: room.npc.ty,
        kind: 'shop_keep',
        buildingId: room.buildingId,
        title: 'Herbalista',
        text: 'Bem-vindo! Quer comprar alguma poção?',
      });
    }
    return list;
  }

  // ---- Fora de cidade: nada ----
  if (!room.isCity) return [];

  // ---- CIDADE: placas + portal + entradas ----
  for (const obj of room.cityObjects) {
    list.push({
      tx: obj.signTx,
      ty: obj.signTy,
      kind: 'sign',
      objId: obj.id,
      title: obj.name,
      text: signTextFor(obj.id),
    });
  }

  list.push({
    tx: room.portal.tx,
    ty: room.portal.ty,
    kind: 'portal',
    title: 'Portal Antigo',
  });

  for (const obj of room.cityObjects) {
    const doorTx = obj.tx + Math.floor(obj.w / 2);
    const doorTy = obj.ty + obj.h;
    list.push({
      tx: doorTx,
      ty: doorTy,
      kind: 'building_entrance',
      buildingId: obj.id,
      title: obj.name,
      text: `Entrar no ${obj.name}`,
    });
  }

  return list;
}

function signTextFor(id) {
  const texts = {
    blacksmith:
      'Ferreiro. Compra e vende armas. Também forja equipamentos especiais para quem trouxer os materiais certos.',
    armorer:
      'Armeiro. Compra e vende armaduras e escudos. Peças do mesmo conjunto dão bônus extras.',
    herbalist:
      'Herbalista. Vende poções e ervas medicinais. Dizem que ela também prepara remédios raros.',
    jeweler:
      'Joalheiro. Compra e vende anéis e amuletos. Joias boas mudam o destino de um aventureiro.',
    quest_giver:
      'Ancião da vila. Sabe de tudo o que acontece por aqui. Costuma dar missões a viajantes.',
  };
  return texts[id] || 'Uma placa desgastada. Não dá pra ler direito.';
}

// Texto dinâmico do portal (muda conforme núcleos coletados)
export function portalText() {
  const total = 8;
  const have = playerStats.portalCores.size;
  if (have === 0) {
    return `O portal está inerte. Há 8 encaixes ao redor, e nenhum deles tem um núcleo.\n\nOs núcleos são obtidos derrotando os guardiões dos biomas. Volte quando tiver pelo menos alguns.`;
  }
  if (have < total) {
    return `O portal pulsa fracamente. Você colocou ${have} de ${total} núcleos.\n\nAinda faltam ${total - have}.`;
  }
  return `O portal está completo! Os 8 núcleos brilham em uníssono.\n\nAo pisar no centro, você será levado ao confronto final. (em breve)`;
}

// Tenta interagir com o interagível mais próximo (mesma tile ou adjacente 4-dir).
// Retorna o interactable ou null.
export function findNearbyInteractable(room) {
  if (!room) return null;
  const list = getInteractables(room);
  if (list.length === 0) return null;

    const ptx = Math.floor(player.x / TILE_SIZE);
    const pty = Math.floor(player.y / TILE_SIZE);

  for (const it of list) {
    const dx = Math.abs(it.tx - ptx);
    const dy = Math.abs(it.ty - pty);
    // mesma tile OU adjacente (4 dirs)
    if (dx + dy <= 1) return it;
  }
  return null;
}