import { currentRoom, playerStats } from '../core/state.js';
import { CLASSES } from '../classes.js';
import { getIcon } from '../sprites/icons.js';
import { getTimeState } from '../core/timeofday.js';
import { playerEquip } from '../sprites/equipment.js';
import { showToast } from './toast.js';

export const roomLabel  = document.getElementById('room-name');
export const coordsLabel = document.getElementById('room-coords');
export const hud        = document.getElementById('hud');

const elTime = document.getElementById('hud-time');
const elTimeLabel = document.getElementById('hud-time-label');
const elTimeIcon = document.getElementById('hud-time-icon');

const elHp    = document.getElementById('hud-hp');
const elMp    = document.getElementById('hud-mp');
const elXp    = document.getElementById('hud-xp');
const elLvl   = document.getElementById('hud-lvl');
const elClass = document.getElementById('hud-class');
const elGold  = document.getElementById('hud-gold');

const elGoldIcon = document.getElementById('hud-gold-icon');
if (elGoldIcon && !elGoldIcon.dataset.iconInjected) {
  elGoldIcon.dataset.iconInjected = '1';
  const icon = getIcon('gold');
  icon.style.width = '20px';
  icon.style.height = '20px';
  icon.style.imageRendering = 'pixelated';
  icon.style.verticalAlign = 'middle';
  elGoldIcon.appendChild(icon);
}

// Agora SÓ texto — sem ícone de bota.
const elStealth      = document.getElementById('hud-stealth');
const elStealthLabel  = document.getElementById('hud-stealth-label');
const elStealthDetail = document.getElementById('hud-stealth-detail');

// ---- Estado da bota silenciosa ----
// 'off' | 'day' | 'dusk' | 'night'
let lastBootsMode = null;

function getBootsMode() {
  if (playerEquip.boots !== 'shadowstep_boots') return 'off';
  const time = getTimeState();
  if (time.label === 'Manhã' || time.label === 'Tarde') return 'day';
  if (time.label === 'Entardecer') return 'dusk';
  if (time.label === 'Noite') return 'night';
  return 'off';
}

function updateStealthIndicator() {
  if (!elStealth) return;

  const mode = getBootsMode();

  // ---- Toasts nas transições ----
  // Os textos batem EXATAMENTE com os multiplicadores do items.js:
  //   day = 0 (suspenso), dusk = 0.5 (50%), night = 0.35 (35%)
  if (mode !== lastBootsMode && mode !== 'off') {
    if (lastBootsMode === 'day' && mode === 'dusk') {
      showToast({
        itemId: 'shadowstep_boots',
        title: 'Botas Silenciosas',
        subtitle: 'Entardecer: encontros reduzidos em 50%.',
        color: '#ffb070',
      });
    } else if (lastBootsMode === 'day' && mode === 'night') {
      showToast({
        itemId: 'shadowstep_boots',
        title: 'Botas Silenciosas',
        subtitle: 'Noite: encontros reduzidos em 65%.',
        color: '#8a9aff',
      });
    } else if (lastBootsMode === 'dusk' && mode === 'night') {
      showToast({
        itemId: 'shadowstep_boots',
        title: 'Botas Silenciosas',
        subtitle: 'Noite: encontros reduzidos em 65%.',
        color: '#8a9aff',
      });
    } else if (lastBootsMode === 'night' && mode === 'dusk') {
      showToast({
        itemId: 'shadowstep_boots',
        title: 'Botas Silenciosas',
        subtitle: 'Entardecer: encontros reduzidos em 50%.',
        color: '#ffb070',
      });
    } else if ((lastBootsMode === 'dusk' || lastBootsMode === 'night') && mode === 'day') {
      showToast({
        itemId: 'shadowstep_boots',
        title: 'Botas Silenciosas',
        subtitle: 'Amanheceu: encontros suspensos.',
        color: '#f5d98a',
      });
    }
  }
  lastBootsMode = mode;

  // ---- Visual do indicador ----
  if (mode === 'off') {
    elStealth.classList.add('hidden');
    return;
  }

  elStealth.classList.remove('hidden');

  if (mode === 'day') {
    elStealth.style.color = '#6fbd63';
    elStealthLabel.textContent = 'Encontros suspensos';
    elStealthDetail.textContent = '';
  } else if (mode === 'dusk') {
    elStealth.style.color = '#ffb070';
    elStealthLabel.textContent = 'Encontros reduzidos';
    elStealthDetail.textContent = '(35% de chance)';
  } else if (mode === 'night') {
    elStealth.style.color = '#8a9aff';
    elStealthLabel.textContent = 'Encontros reduzidos';
    elStealthDetail.textContent = '(50% de chance)';
  }
}

export function updateHud() {
  if (currentRoom) {
    roomLabel.textContent  = currentRoom.name;
    coordsLabel.textContent = `(${currentRoom.nameCoords})`;
  }

  if (elClass) {
    const cls = playerStats.classId ? CLASSES[playerStats.classId] : null;
    elClass.textContent = cls ? cls.name : '—';
  }

  if (elHp) elHp.textContent = `${playerStats.hp}/${playerStats.maxHp}`;
  if (elMp) elMp.textContent = `${playerStats.mp}/${playerStats.maxMp}`;
  if (elXp) elXp.textContent = `${playerStats.xp}/${playerStats.xpToNextLevel}`;
  if (elGold) elGold.textContent = playerStats.gold;
  if (elLvl) elLvl.textContent = playerStats.level;

  const time = getTimeState();
  if (elTime) elTime.textContent = time.formatted;
  if (elTimeLabel) {
    elTimeLabel.textContent = time.label;
    elTimeLabel.style.color =
      time.label === 'Noite' ? '#8a9aff' :
      time.label === 'Entardecer' ? '#ffb070' :
      time.label === 'Manhã' ? '#f5d98a' : '#aaa';
  }
  if (elTimeIcon) {
    if (time.darkness > 0.45) {
      elTimeIcon.textContent = '🌙';
    } else if (time.darkness > 0.15) {
      elTimeIcon.textContent = '🌇';
    } else {
      elTimeIcon.textContent = '☀️';
    }
    elTimeIcon.style.filter = time.darkness > 0.45
      ? 'drop-shadow(0 0 3px #8a9aff)'
      : 'drop-shadow(0 0 3px #f5d98a)';
  }

  updateStealthIndicator();
}