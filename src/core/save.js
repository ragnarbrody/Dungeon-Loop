// ============================================================
// SAVE — camada única de persistência.
//
// Responsabilidades:
//   - Ler o localStorage e devolver um objeto SEGURO (já migrado
//     e validado), ou null se não houver save.
//   - Escrever o estado atual no localStorage.
//   - Migrar saves antigos pra versão atual.
//   - Resetar pro "estado inicial" (usado por Novo Jogo).
//
// Regras:
//   - NUNCA ler localStorage fora daqui (exceto debug).
//   - Toda migração é pura: recebe `data`, devolve `data` novo.
//   - Se o save corromper, é melhor "voltar pro menu" do que
//     crashar o jogo.
// ============================================================

const SAVE_KEY = 'dungeonLoop_save';

// Sempre que adicionar uma migração, sobe esse número e adiciona
// uma entrada em MIGRATIONS.
export const SAVE_VERSION = 3;

// ---------- Helpers de validação ----------
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

// ---------- Migrações ----------
// Cada migração recebe o `data` na versão `from` e devolve o `data`
// na versão `from + 1`. O pipeline roda em ordem, sempre subindo.
//
// Regra de ouro: migração NUNCA apaga dado do jogador. Só adiciona
// campos com defaults seguros.
const MIGRATIONS = {
  // v1 -> v2
  // O "v1" original não tinha `version`, `knowledge`, `portalCores`
  // como Set serializado, `itemPage`, `stackCap`-aware inventory, etc.
  // Esta migração normaliza tudo pro formato que `state.js` espera.
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

    // inventory: cada item precisa ter id + qty numérica
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
    if (!isObject(data.equip)) data.equip = { rightHand: 'sword', leftHand: 'torch' };

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

    // defaults numéricos que podem faltar
    data.level          = Math.max(1, Math.floor(asNumber(data.level, 1)));
    data.xp             = Math.max(0, asNumber(data.xp, 0));
    data.xpToNextLevel  = Math.max(1, Math.floor(asNumber(data.xpToNextLevel, 50)));
    data.points         = Math.max(0, Math.floor(asNumber(data.points, 0)));
    data.gold           = Math.max(0, Math.floor(asNumber(data.gold, 0)));
    data.hp             = Math.max(1, Math.floor(asNumber(data.hp, 20)));
    data.mp             = Math.max(0, Math.floor(asNumber(data.mp, 5)));

    return data;
  },

  // O "v2" não tinha `quests`. Adiciona o shape default.
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
};

// ---------- Defaults ----------
export function getDefaultSave() {
  return {
    version: SAVE_VERSION,
    // progressão
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
    // inventário e equipamento
    inventory: [],
    equip: { rightHand: 'sword', leftHand: 'torch' },
    // mundo
    gx: 0,
    gy: 0,
    px: null,
    py: null,
    visited: ['0,0'],
    worldSeed: Math.floor(Math.random() * 1e9),
    // knowledge
    knowledge: { revealed: [], markers: [] },
    // portal
    portalCores: [],

    quests: {
        active: null,
        progress: {},
        completed: [],
        tracked: null,
        elderIntroSeen: false,
    },
  };
}

// ---------- Migração ----------
function applyMigrations(data) {
  let v = asNumber(data.version, 1);

  // Enquanto houver migração pra próxima versão, aplica.
  while (v < SAVE_VERSION) {
    const m = MIGRATIONS[v];
    if (!m) {
      // Sem caminho de migração — não dá pra garantir consistência.
      // Melhor "perder" o save do que corromper. Mas como só temos
      // a v1→v2, isso não acontece.
      console.warn(`[save] sem migração de v${v} pra v${v + 1}.`);
      break;
    }
    data = m(data) || data;
    v++;
    data.version = v;
  }

  // Garante que o `version` do final está certo
  data.version = SAVE_VERSION;
  return data;
}

// ---------- API pública ----------
/**
 * Lê o save. Retorna `null` se não houver, se estiver corrompido,
 * ou se o JSON.parse falhar. NUNCA lança.
 *
 * O objeto retornado já está migrado e validado.
 */
export function loadSave() {
  let raw;
  try {
    raw = localStorage.getItem(SAVE_KEY);
  } catch (e) {
    console.warn('[save] localStorage indisponível.', e);
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
    console.warn('[save] save não é um objeto, ignorando.');
    return null;
  }

  // Se não tinha version, é o "v1 original"
  if (data.version === undefined) {
    data.version = 1;
  }

  return applyMigrations(data);
}

/**
 * Escreve o estado atual no localStorage. Retorna `true` se deu certo.
 * NUNCA lança.
 */
export function writeSave(data) {
  if (!isObject(data)) {
    console.warn('[save] tentativa de salvar objeto inválido.');
    return false;
  }
  try {
    // Marca sempre a versão atual
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
 * Útil pra debug no console:
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

// Expõe no console pra debug rápido
if (typeof window !== 'undefined') {
  window.__saveInfo = getSaveInfo;
  window.__clearSave = clearSave;
}