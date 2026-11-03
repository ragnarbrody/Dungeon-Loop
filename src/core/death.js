import { playerStats, player, battle, encounter, visitedRooms, setCurrentRoom,
         markRoomVisited, saveGame, clearSave, metaState, buildSaveData } from './state.js';
import { getRoom, getCitySpawn, dungeonCache, clearRoomCache, setPendingDungeonsData } from '../world/rooms.js';
import { resetKnowledge, revealRoom, getRevealedSet, getMarkers, removeMarker } from '../world/knowledge.js';
import { pickBiome } from '../world/biomes.js';
import { pruneQuestsToChapters, debugCompleteChapter } from '../quests.js';
import { planDeath, STARTER_ITEMS, CHAPTER_NAMES, xpToNextFor, getCompletedChapters,
         serializeProgression, forceMilestone, resetProgression } from './progression.js';
import { registerDeath, getVault } from './meta.js';
import { addItemToInventory } from '../items.js';
import { playerEquip, resetEquipment } from '../sprites/equipment.js';
import { CLASSES } from '../classes.js';
import { TILE_SIZE } from './canvas.js';
import { writeSave } from './save.js';

export function resolveDeath() {
  const levelBefore = playerStats.level;
  const lost = {
    gold: playerStats.gold,
    items: playerStats.inventory.reduce((n, i) => n + i.qty, 0),
  };
  const plan = planDeath();
  registerDeath();

  // ---- perdas comuns: ouro, mochila, equipamento, efeitos, companion ----
  playerStats.gold = 0;
  playerStats.inventory.length = 0;
  playerStats.buffs = {};
  playerStats.poisoned = null;
  playerStats.bleeding = null;
  playerStats.shadowActive = false;
  playerStats._mpRegenAcc = 0;
  playerStats._escortActive = false;
  playerStats._escortPos = null;
  resetEquipment();

  // ---- sem checkpoint: a run acaba (cofre e núcleos ficam) ----
  if (plan.type === 'reset') {
    // O cofre sobrevive ao "Continuar do zero": snapshot do metaState
    // antes de limpar o save, e reescreve com o meta intacto.
    clearSave();

    resetKnowledge();
    dungeonCache.clear();
    setPendingDungeonsData(null);
    clearRoomCache();
    resetProgression();

    // Zera o resto do playerStats pra o buildSaveData não vazar
    // dados da run antiga pro próximo save.
    Object.assign(playerStats, {
      level: 1, xp: 0, xpToNextLevel: 50, points: 0,
      gold: 0, hp: 20, mp: 5,
      str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0, _baseMp: 5,
      classId: null,
    });
    playerStats.inventory.length = 0;
    playerStats.portalCores = new Set();

    // Limpa o estado do mundo em memória
    visitedRooms.clear();
    visitedRooms.add('0,0');

    // Escreve o save de novo, agora só com metaState + defaults.
    const ok = writeSave(buildSaveData());
    if (!ok) {
      console.warn('[death] writeSave falhou; gravando save mínimo com metaState.');
      try {
        localStorage.setItem('dungeonLoop_save', JSON.stringify({
          version: 7,
          level: 1, xp: 0, xpToNextLevel: 50, points: 0,
          gold: 0, hp: 20, mp: 5, classId: null,
          stats: { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 },
          _baseMp: 5,
          inventory: [], equip: { rightHand: 'sword', leftHand: null },
          gx: 0, gy: 0, px: null, py: null, timeOfDay: 8,
          visited: ['0,0'], worldSeed: Math.floor(Math.random() * 1e9),
          knowledge: { revealed: [], markers: [] },
          portalCores: [], dungeons: {}, openedChests: [],
          meta: metaState,
          quests: { active: null, progress: {}, completed: [], tracked: null, elderIntroSeen: false },
          progression: { milestones: {} },
        }));
      } catch (e) {
        console.error('[death] falha no fallback de save.', e);
      }
    }

    return { type: 'reset', reason: plan.reason, lost, levelBefore, levelAfter: 1 };
  }

  // ---- checkpoint ----
  const s = plan.snapshot;
  Object.assign(playerStats, {
    level: s.level, xp: 0, xpToNextLevel: xpToNextFor(s.level), points: 0,
    str: s.str, agi: s.agi, int: s.int, def: s.def, vit: s.vit, magia: s.magia, _baseMp: s._baseMp,
  });
  playerStats.hp = playerStats.maxHp;
  playerStats.mp = playerStats.maxMp;

  const cls = CLASSES[playerStats.classId];
  if (cls?.equip) {
    playerEquip.rightHand = cls.equip.rightHand ?? null;
    playerEquip.leftHand  = cls.equip.leftHand ?? null;
  }
  for (const it of (STARTER_ITEMS[playerStats.classId] || [])) {
    addItemToInventory(playerStats.inventory, it.id, it.qty);
  }

  // quests e mapa: só o que é de capítulo concluído
  pruneQuestsToChapters(plan.chapters);
  const done = new Set(plan.chapters);
  const keepCell = (key) => { const [gx, gy] = key.split(',').map(Number); return done.has(pickBiome(gx, gy)); };
  for (const k of [...visitedRooms]) if (!keepCell(k)) visitedRooms.delete(k);
  const revealed = getRevealedSet();
  for (const k of [...revealed]) if (!keepCell(k)) revealed.delete(k);
  for (const m of getMarkers()) {
    if (m.type === 'quest' || (m.type !== 'city' && m.gx != null && !keepCell(`${m.gx},${m.gy}`))) {
      removeMarker(m.id);
    }
  }
  clearRoomCache();   // inimigos reaparecem

  // volta pra cidade
  const room = getRoom(0, 0);
  setCurrentRoom(room);
  markRoomVisited(0, 0);
  revealRoom(0, 0);
  const sp = getCitySpawn();
  player.x = sp.tx * TILE_SIZE + TILE_SIZE / 2;
  player.y = sp.ty * TILE_SIZE + TILE_SIZE / 2;

  battle.active = false; battle.turn = 'player'; battle.showItems = false;
  battle.menuMode = 'main'; battle.mapEnemy = null; battle.floatingTexts = [];
  battle._escortActive = false;
  encounter.walkedSinceLast = 0; encounter.cooldownPx = 400;

  saveGame();
  return { type: 'checkpoint', lost, levelBefore, levelAfter: s.level, chapters: plan.chapters };
}

// ---------- Tela de game over ----------
export function showDeathSummary(r) {
  const screen = document.getElementById('gameover-screen');
  if (!screen) return;
  let box = document.getElementById('gameover-summary');
  if (!box) {
    box = document.createElement('div');
    box.id = 'gameover-summary';
    box.style.cssText = 'margin:12px auto;max-width:380px;font-size:13px;line-height:1.7;color:#d8d0b8;text-align:center;';
    const btn = document.getElementById('btn-gameover-new');
    (btn?.parentNode ?? screen).insertBefore(box, btn ?? null);
  }
  const v = getVault();
  const used = v.items.filter(Boolean).length;
  const lines = [`Você perdeu ${r.lost.gold} ouro e ${r.lost.items} item(ns) da mochila.`];
  if (r.type === 'checkpoint') {
    lines.push(`Nível ${r.levelBefore} → ${r.levelAfter}.`);
    lines.push(`Seu progresso em ${r.chapters.map(c => CHAPTER_NAMES[c] || c).join(' e ')} foi mantido.`);
  } else {
    lines.push('A jornada recomeça dos Campos.');
    lines.push('O que estava no cofre continua lá.');
  }
  lines.push(`A salvo no cofre: ${v.gold} ouro e ${used} slot(s) de itens.`);
  box.innerHTML = lines.map(l => `<div>${l}</div>`).join('');

  const newBtn = document.getElementById('btn-gameover-new');
  if (newBtn) newBtn.textContent = 'Continuar';
}

// ---------- Debug ----------
if (typeof window !== 'undefined') {
  window.__progress = {
    chapters: () => getCompletedChapters(),
    milestones: () => serializeProgression().milestones,
    completeChapter: (id = 'fields') => debugCompleteChapter(id),
    snapshotNow: () => forceMilestone(playerStats),
  };
}