// src/sprites/compose.js
import { knightessFrames } from './knightess.js';
import { mageFrames } from './mage.js';
import { thiefFrames } from './thief.js';
import { ITEMS, playerEquip, drawEquipment } from './equipment.js';
import { playerStats } from '../core/state.js';
import { huntressFrames } from './huntress.js';

const FRAMES_BY_CLASS = {
  knightess: knightessFrames,
  mage: mageFrames,
  thief: thiefFrames,
  huntress: huntressFrames,
};

function getActiveFrames() {
  return FRAMES_BY_CLASS[playerStats.classId] || knightessFrames;
}

const equipCanvas = document.createElement('canvas');
equipCanvas.width = 32;
equipCanvas.height = 32;
const equipCtx = equipCanvas.getContext('2d');
equipCtx.imageSmoothingEnabled = false;

export function composeFrame(dir, step) {
  const frames = getActiveFrames();
  
  equipCtx.clearRect(0, 0, 32, 32);
  equipCtx.drawImage(frames[dir][step], 0, 0);

  const bob = step === 1 ? -1 : 0;
  drawEquipment(equipCtx, dir, bob, playerEquip);

  return equipCanvas;
}

export function composeBattleFrame() {
  const frames = getActiveFrames();
  
  equipCtx.clearRect(0, 0, 32, 32);
  equipCtx.drawImage(frames['right'][0], 0, 0);

  const itemId = playerEquip.rightHand;
  const item = itemId ? ITEMS[itemId] : null;
  if (item) item.draw(equipCtx, 'right', 0);

  return equipCanvas;
}