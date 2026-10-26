import { ctx, CANVAS_W, CANVAS_H } from '../core/canvas.js';
import { STATE, gameState, setCurrentRoom, startGX, startGY, markRoomVisited } from '../core/state.js';
import { getRoom } from '../world/rooms.js';
import { renderBattle } from '../battle/render.js';
import { renderExplore } from './explore.js';
import { renderMinimap } from './minimap.js';
import { renderMenu } from './menu.js';

export function render(dt) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  
  if (gameState === STATE.MENU) {
    renderMenu(dt || 0.016);
  } else if (gameState === STATE.BATTLE) {
    renderBattle();
  } else {
    renderExplore(); 
    if (gameState === STATE.EXPLORE) {
      renderMinimap(); 
    }
  }
}