import { playerStats, player, addGold } from '../core/state.js';
import { ITEMS_DB } from '../items.js';
import { TILE_SIZE } from '../core/canvas.js';
import { getActiveQuest } from '../quests.js';

// ============================================================
// INTERACTABLES
// Cada sala pode ter uma lista de interactables.
// Um interactable = { tx, ty, kind, ...dados }
// O jogador interage se estiver no MESMO tile ou adjacente (4 dirs).
// ============================================================

const NPC_LABEL = { herbalist: 'Herbalista', blacksmith: 'Ferreiro', quest_giver: 'Ancião' };

export function getInteractables(room) {
  if (!room) return [];

  const list = [];

  // ---- INTERIOR: só o NPC ----
  if (room.isInterior) {
    if (room.npc) {
      const npc = room.npc;
      // Herbalista: abre loja
      if (npc.buildingId === 'herbalist' || npc.buildingId === 'blacksmith') {
        list.push({
          tx: npc.tx, ty: npc.ty,
          kind: 'shop_keep',
          buildingId: npc.buildingId,
          title: NPC_LABEL[npc.buildingId] || 'Lojista',
          text: '...',
        });
        // herbalist_quest só pra herbalista
        if (npc.buildingId === 'herbalist') {
          const q = getActiveQuest();
          if (q && q.turnInNpc === 'herbalist') {
            list.push({ tx: npc.tx, ty: npc.ty, kind: 'herbalist_quest', title: 'Herbalista' });
          }
        }
      }
      // Ancião: abre diálogo de quests
      else if (npc.buildingId === 'quest_giver') {
        list.push({
          tx: npc.tx, ty: npc.ty,
          kind: 'elder',
          title: 'Ancião de Aethel',
        });
      }
    }
    return list;
  }

  // ---- Interactables especiais da sala (mochila, etc) ----
  if (room.interactables && room.interactables.length > 0) {
    for (const it of room.interactables) {
      // A mochila some se o jogador já tem o pergaminho
      if (it.kind === 'lost_backpack') {
        const hasLetter = playerStats.inventory.some(i => i.id === 'letter_to_elder');
        if (hasLetter) continue;
      }
      list.push({ ...it });
    }
  }

  // ---- Fora de cidade: nada ----
  if (!room.isCity) return list;

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
      'Armeiro. Compra e vende armaduras e escudos. Peças do mesmo conjunto dão bônus extras. [EM BREVE]',
    herbalist:
      'Herbalista. Vende poções e ervas medicinais. Dizem que ela também prepara remédios raros.',
    jeweler:
      'Joalheiro. Compra e vende anéis e amuletos. Joias boas mudam o destino de um aventureiro. [EM BREVE]',
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

  // Prioridade: menor número = mais prioritário
  const priority = {
    herbalist_quest:  -1,
    building_entrance: 0,
    shop_keep:         0,
    elder:             0,
    lost_backpack:     1,
    portal:            1,
    sign:              2,
  };

  let best = null;
  let bestPri = Infinity;
  let bestDist = Infinity;

  // NPCs atrás de balcão precisam de alcance 2 (o balcão ocupa 1 tile).
  const BEHIND_COUNTER = new Set(['shop_keep', 'elder', 'herbalist_quest']);

  for (const it of list) {
    const dx = Math.abs(it.tx - ptx);
    const dy = Math.abs(it.ty - pty);
    const maxDist = BEHIND_COUNTER.has(it.kind) ? 2 : 1;
    if (dx + dy > maxDist) continue;

    const pri = priority[it.kind] ?? 99;
    const dist = dx + dy;

    // Critério: prioridade primeiro, distância como desempate
    if (pri < bestPri || (pri === bestPri && dist < bestDist)) {
      best = it;
      bestPri = pri;
      bestDist = dist;
    }
  }
  return best;
}