import { currentRoom, playerStats } from '../core/state.js';
import { CLASSES } from '../classes.js';
import { getIcon } from '../sprites/icons.js';
import { getTimeState } from '../core/timeofday.js';

export const roomLabel  = document.getElementById('room-name');
export const coordsLabel = document.getElementById('room-coords');
export const hud        = document.getElementById('hud');

const elTime = document.getElementById('hud-time');
const elTimeLabel = document.getElementById('hud-time-label');

const elHp    = document.getElementById('hud-hp');
const elMp    = document.getElementById('hud-mp');
const elXp    = document.getElementById('hud-xp');
const elLvl   = document.getElementById('hud-lvl');
const elClass = document.getElementById('hud-class');
const elGold = document.getElementById('hud-gold');

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
}