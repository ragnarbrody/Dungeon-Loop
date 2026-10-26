import { currentRoom, playerStats } from '../core/state.js';
import { CLASSES } from '../classes.js';

export const roomLabel  = document.getElementById('room-name');
export const coordsLabel = document.getElementById('room-coords');
export const hud        = document.getElementById('hud');

const elHp    = document.getElementById('hud-hp');
const elMp    = document.getElementById('hud-mp');
const elXp    = document.getElementById('hud-xp');
const elLvl   = document.getElementById('hud-lvl');
const elClass = document.getElementById('hud-class');

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
  if (elLvl) elLvl.textContent = playerStats.level;
}