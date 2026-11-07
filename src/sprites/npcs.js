// src/sprites/npcs.js
import { herbalistFrames } from './herbalist.js';
import { elderFrames } from './elder.js';
import { blacksmithFrames } from './blacksmith.js';
import { armorerFrames } from './armorer.js';  
import { bankerFrames } from './banker.js';
import { jewelerFrames } from './jeweler.js';
import { wellLeaderFrames, wellFollowerFrames } from './well_leader.js';

export const NPC_SPRITES = {
  herbalist: herbalistFrames,
  quest_giver: elderFrames,
  elder: elderFrames,
  blacksmith: blacksmithFrames,
  armorer: armorerFrames, 
  banker: bankerFrames,
  jeweler: jewelerFrames,
  well_leader: wellLeaderFrames,
  well_follower: wellFollowerFrames,
};