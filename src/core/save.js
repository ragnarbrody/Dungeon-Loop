// ============================================================
// SAVE â camada Ãºnica de persistÃªncia.
//
// Responsabilidades:
//   - Ler o localStorage e devolver um objeto SEGURO (jÃ¡ migrado
//     e validado), ou null se nÃ£o houver save.
//   - Escrever o estado atual no localStorage.
//   - Migrar saves antigos pra versÃ£o atual.
//   - Resetar pro "estado inicial" (usado por Novo Jogo).
//
// Regras:
//   - NUNCA ler localStorage fora daqui (exceto debug).
//   - Toda migraÃ§Ã£o Ã© pura: recebe `data`, devolve `data` novo.
//   - Se o save corromper, Ã© melhor "voltar pro menu" do que
//     crashar o jogo.
// ============================================================

const SAVE_KEY = 'dungeonLoop_save';

// Sempre que adicionar uma migraÃ§Ã£o, sobe esse nÃºmero e adiciona
// uma entrada em MIGRATIONS.
export const SAVE_VERSION = 10;

// ---------- Helpers de validaÃ§Ã£o ----------
function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function asNumber(v, fallback) {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function asString(v, fallback) {
  return typeof v === 'string' ? v : fallback;
}
function asArray(v) {
  return Array.isArray(v) ? v : [];
}
function asBool(v, fallback = false) {
  return typeof v === 'boolean' ? v : fallback;
}

// ---------- MigraÃ§Ãµes ----------
// Cada migraÃ§Ã£o recebe o `data` na versÃ£o `from` e devolve o `data`
// na versÃ£o `from + 1`. O pipeline roda em ordem, sempre subindo.
//
// Regra de ouro: migraÃ§Ã£o NUNCA apaga dado do jogador. SÃ³ adiciona
// campos com defaults seguros.
const MIGRATIONS = {
  // v1 -> v2
  // O "v1" original nÃ£o tinha `version`, `knowledge`, `portalCores`
  // como Set serializado, `itemPage`, `stackCap`-aware inventory, etc.
  // Esta migraÃ§Ã£o normaliza tudo pro formato que `state.js` espera.
  1: (data) => {
    // knowledge: default vazio (o `state.js` revela a sala inicial depois)
    if (!isObject(data.knowledge)) {
      data.knowledge = { revealed: [], markers: [] };
    } else {
      if (!Array.isArray(data.knowledge.revealed)) data.knowledge.revealed = [];
      if (!Array.isArray(data.knowledge.markers))  data.knowledge.markers  = [];
    }

    // portalCores: sempre array
    if (!Array.isArray(data.portalCores)) data.portalCores = [];

    // inventory: cada item precisa ter id + qty numÃ©rica
    if (!Array.isArray(data.inventory)) {
      data.inventory = [{ id: 'potion_weak', qty: 2 }];
    } else {
      data.inventory = data.inventory
        .filter(it => isObject(it) && typeof it.id === 'string')
        .map(it => ({ id: it.id, qty: Math.max(1, Math.floor(asNumber(it.qty, 1))) }));
    }

    // campos de combate (novos desde v1)
    if (typeof data.itemPage !== 'number') data.itemPage = 0;

    // stats: sempre objeto com defaults
    if (!isObject(data.stats)) {
      data.stats = { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 };
    } else {
      const s = data.stats;
      data.stats = {
        str:   asNumber(s.str,   1),
        agi:   asNumber(s.agi,   1),
        int:   asNumber(s.int,   1),
        def:   asNumber(s.def,   1),
        vit:   asNumber(s.vit,   1),
        magia: asNumber(s.magia, 0),
      };
    }

    // equip: sempre objeto
    if (!isObject(data.equip)) data.equip = { rightHand: 'sword', leftHand: null };

    // baseMp: se veio como `baseMp` (nome antigo) migra pra `_baseMp`
    if (data._baseMp === undefined) {
      data._baseMp = asNumber(data.baseMp, 5);
    }

    // worldSeed
    if (typeof data.worldSeed !== 'number') {
      data.worldSeed = Math.floor(Math.random() * 1e9);
    }

    // visited: sempre array
    if (!Array.isArray(data.visited)) data.visited = ['0,0'];

    // defaults numÃ©ricos que podem faltar
    data.level          = Math.max(1, Math.floor(asNumber(data.level, 1)));
    data.xp             = Math.max(0, asNumber(data.xp, 0));
    data.xpToNextLevel  = Math.max(1, Math.floor(asNumber(data.xpToNextLevel, 50)));
    data.points         = Math.max(0, Math.floor(asNumber(data.points, 0)));
    data.gold           = Math.max(0, Math.floor(asNumber(data.gold, 0)));
    data.hp             = Math.max(1, Math.floor(asNumber(data.hp, 20)));
    data.mp             = Math.max(0, Math.floor(asNumber(data.mp, 5)));

    return data;
  },

  // O "v2" nÃ£o tinha `quests`. Adiciona o shape default.
  2: (data) => {
    if (!isObject(data.quests)) {
      data.quests = {
        active: null,
        progress: {},
        completed: [],
        tracked: null,
        elderIntroSeen: false,
      };
    } else {
      // Normaliza cada campo (defensivo)
      if (!Array.isArray(data.quests.completed)) data.quests.completed = [];
      if (!isObject(data.quests.progress))      data.quests.progress = {};
      if (typeof data.quests.active !== 'string') data.quests.active = null;
      if (typeof data.quests.tracked !== 'string') data.quests.tracked = null;
      data.quests.elderIntroSeen = asBool(data.quests.elderIntroSeen, false);
    }
    return data;
  },

  // v3 -> v4: adiciona `timeOfDay` (hora do jogo 0..24)
  3: (data) => {
    if (typeof data.timeOfDay !== 'number' || !Number.isFinite(data.timeOfDay)) {
      data.timeOfDay = 8; // comeÃ§a de manhÃ£
    }
    // Normaliza pro range [0, 24)
    data.timeOfDay = ((data.timeOfDay % 24) + 24) % 24;
    return data;
  },
  // v4 -> v5: adiciona `dungeons` (estado persistente das cavernas)
  // e `openedChests` (Set serializado de baÃºs abertos).
  4: (data) => {
    if (!isObject(data.dungeons)) data.dungeons = {};
    if (!Array.isArray(data.openedChests)) data.openedChests = [];
    return data;
  },
  // v5 -> v6: marcos de nível (checkpoint de morte)
  5: (data) => {
    const prog = isObject(data.progression) ? data.progression : {};
    if (!isObject(prog.milestones)) prog.milestones = {};
    const step = Math.floor(asNumber(data.level, 1) / 5) * 5;
    // save antigo: marco aproximado com os stats atuais (só p/ não perder o checkpoint)
    if (step >= 5 && isObject(data.stats) && !prog.milestones[step]) {
      prog.milestones[step] = { level: step, ...data.stats, _baseMp: asNumber(data._baseMp, 5) };
    }
    data.progression = prog;
    return data;
  },
  // v6 -> v7: `meta` (cofre, mortes) sai do localStorage separado
  // e vira parte do save. Migração one-shot: se o save atual não tem
  // `meta` mas existe `dungeonLoop_meta` no localStorage, copia e apaga.
  6: (data) => {
    if (!isObject(data.meta)) {
      let migrated = null;
      try {
        const raw = localStorage.getItem('dungeonLoop_meta');
        if (raw) {
          const m = JSON.parse(raw);
          if (isObject(m) && isObject(m.vault)) migrated = m;
        }
      } catch (_) { /* ignora */ }

      if (migrated) {
        const v = migrated.vault;
        const slots = Math.min(8, Math.max(4, Math.floor(Number(v.slots) || 4)));
        const items = Array.from({ length: slots }, (_, i) => {
          const it = v.items?.[i];
          return it && typeof it.id === 'string' && it.qty > 0
            ? { id: it.id, qty: Math.floor(it.qty) }
            : null;
        });
        data.meta = {
          deaths: Math.max(0, Math.floor(Number(migrated.deaths) || 0)),
          vault: {
            gold: Math.max(0, Math.floor(Number(v.gold) || 0)),
            slots,
            items,
          },
        };
        try { localStorage.removeItem('dungeonLoop_meta'); } catch (_) {}
      } else {
        data.meta = { deaths: 0, vault: { gold: 0, slots: 4, items: [null, null, null, null] } };
      }
    }
    return data;
  },
  // v7 -> v8: equip agora salva TODOS os slots (antes só as mãos).
  7: (data) => {
    if (!isObject(data.equip)) {
      data.equip = {
        rightHand: 'sword', leftHand: null,
        helmet: null, armor: null, boots: null,
        amulet: null, ring1: null, ring2: null,
      };
    } else {
      data.equip = {
        rightHand: data.equip.rightHand ?? null,
        leftHand:  data.equip.leftHand  ?? null,
        helmet:    data.equip.helmet    ?? null,
        armor:     data.equip.armor     ?? null,
        boots:     data.equip.boots     ?? null,
        amulet:    data.equip.amulet    ?? null,
        ring1:     data.equip.ring1     ?? null,
        ring2:     data.equip.ring2     ?? null,
      };
    }
    return data;
  },
  8: (data) => {
    if (!Array.isArray(data.portalInserted)) data.portalInserted = [];
    return data;
  },
  9: (data) => {
    if (typeof data.fastTravelUnlocked !== 'boolean') data.fastTravelUnlocked = false;
    if (!Array.isArray(data._knownCities)) data._knownCities = ['aethel'];
    return data;
  },
};

// ---------- Defaults ----------
export function getDefaultSave() {
  return {
    version: SAVE_VERSION,
    // progressÃ£o
    level: 1,
    xp: 0,
    xpToNextLevel: 50,
    points: 0,
    gold: 0,
    hp: 20,
    mp: 5,
    // classe e stats
    classId: null,
    stats: { str: 1, agi: 1, int: 1, def: 1, vit: 1, magia: 0 },
    _baseMp: 5,
    // inventÃ¡rio e equipamento
    inventory: [],
    equip: { rightHand: 'sword', leftHand: null },
    // mundo
    gx: 0,
    gy: 0,
    px: null,
    py: null,
    timeOfDay: 8,
    visited: ['0,0'],
    worldSeed: Math.floor(Math.random() * 1e9),
    // knowledge
    knowledge: { revealed: [], markers: [] },
    // portal
    portalCores: [],
    portalInserted: [],
    dungeons: {},
    openedChests: [],
    
    // flags de mundo
    guardianFieldsDefeated: false,
    fastTravelUnlocked: false,
    _knownCities: ['aethel'],
    meta: {
      deaths: 0,
      vault: { gold: 0, slots: 3, items: [null, null, null, null] },
    },
    quests: {
        active: null,
        progress: {},
        completed: [],
        tracked: null,
        elderIntroSeen: false,
    },
  };
}

// ---------- MigraÃ§Ã£o ----------
function applyMigrations(data) {
  let v = asNumber(data.version, 1);

  // Enquanto houver migraÃ§Ã£o pra prÃ³xima versÃ£o, aplica.
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) {
      // Sem caminho de migraÃ§Ã£o â nÃ£o dÃ¡ pra garantir consistÃªncia.
      // Melhor "perder" o save do que corromper. Mas como sÃ³ temos
      // a v1âv2, isso nÃ£o acontece.
      console.warn(`[save] sem migraÃ§Ã£o de v${v} pra v${v + 1}.`);
      break;
    }
    data = m(data) || data;
    v++;
    data.version = v;
  }

  // Garante que o `version` do final estÃ¡ certo
  data.version = SAVE_VERSION;
  return data;
}

// ---------- API pÃºblica ----------
/**
 * LÃª o save. Retorna `null` se nÃ£o houver, se estiver corrompido,
 * ou se o JSON.parse falhar. NUNCA lanÃ§a.
 *
 * O objeto retornado jÃ¡ estÃ¡ migrado e validado.
 */
export function loadSave() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    console.warn('[save] localStorage indisponÃ­vel.', e);
    return null;
  }
  if (!raw) return null;

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.warn('[save] save corrompido, ignorando.', e);
    return null;
  }

  if (!isObject(data)) {
    console.warn('[save] save nÃ£o Ã© um objeto, ignorando.');
    return null;
  }

  // Se nÃ£o tinha version, Ã© o "v1 original"
  if (data.version === undefined) {
    data.version = 1;
  }

  // Default defensivo pra saves antigos
  if (typeof data.guardianFieldsDefeated !== 'boolean') {
    data.guardianFieldsDefeated = false;
  }

  return applyMigrations(data);
}

/**
 * Escreve o estado atual no localStorage. Retorna `true` se deu certo.
 * NUNCA lanÃ§a.
 */
export function writeSave(data) {
  if (!isObject(data)) {
    console.warn('[save] tentativa de salvar objeto invÃ¡lido.');
    return false;
  }
  try {
    // Marca sempre a versÃ£o atual
    data.version = SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.warn('[save] falha ao salvar.', e);
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('[save] falha ao limpar.', e);
  }
}

/**
 * Ãtil pra debug no console:
 *   __saveInfo()
 * devolve { version, classId, level, gx, gy }.
 */
export function getSaveInfo() {
  const data = loadSave();
  if (!data) return null;
  return {
    version: data.version,
    classId: data.classId,
    level: data.level,
    gx: data.gx,
    gy: data.gy,
  };
}

// ExpÃµe no console pra debug rÃ¡pido
if (typeof window !== 'undefined') {
  window.__saveInfo = getSaveInfo;
  window.__clearSave = clearSave;
}