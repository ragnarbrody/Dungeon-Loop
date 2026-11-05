// src/ui/fasttravel.js
import { currentRoom, player, playerStats, setCurrentRoom, markRoomVisited, saveGame,
         setTransitionCooldown } from '../core/state.js';
import { getRoom, getCitySpawn } from '../world/rooms.js';
import { revealRoom } from '../world/knowledge.js';
import { setMusicMode, sfx } from '../audio/audio.js';
import { showToast } from './toast.js';
import { clearLeaves } from '../entities/leaves.js';
import { closeDialogue } from './dialogue.js';
import { updateHud } from './hud.js';
import { getCityData, musicForCity } from '../world/cities.js';

// Retorna true se o jogador PODE usar fast travel agora:
//  - fastTravelUnlocked = true (desbloqueado pela quest)
//  - está numa cidade
export function canUseFastTravel() {
  if (!playerStats.fastTravelUnlocked) return false;
  if (!currentRoom) return false;
  if (!currentRoom.isCity) return false;
  if (currentRoom.isDungeon || currentRoom.isInterior) return false;
  return true;
}

// Lista de cidades conhecidas (excluindo a atual)
export function getFastTravelDestinations() {
  if (!canUseFastTravel()) return [];
  const currentCityId = currentRoom.cityId || 'aethel';
  const known = playerStats._knownCities || new Set(['aethel']);
  const result = [];
  for (const cityId of known) {
    if (cityId === currentCityId) continue;
    const city = getCityData(cityId);
    if (!city) continue;
    result.push({ cityId, city });
  }
  return result;
}

// Executa a viagem. Retorna true se moveu.
export function fastTravelTo(cityId) {
  if (!canUseFastTravel()) return false;
  const city = getCityData(cityId);
  if (!city) return false;
  if (cityId === currentRoom.cityId) return false;

  const known = playerStats._knownCities || new Set(['aethel']);
  if (!known.has(cityId)) return false;

  // Se houver diálogo/loja aberto, fecha
  closeDialogue();

  // Salva posição atual não — vamos pra nova cidade
  const room = getRoom(city.gx, city.gy);
  setCurrentRoom(room);
  markRoomVisited(city.gx, city.gy);
  revealRoom(city.gx, city.gy);
  clearLeaves();

  // Posiciona o jogador no spawn da cidade
  const sp = getCitySpawn();
  player.x = sp.tx * 20 + 10;  // TILE_SIZE/2 = 10
  player.y = sp.ty * 20 + 10;
  player.facing = 'down';
  player.step = 0;

  // Evita trigger imediato de porta
  setTransitionCooldown(30);

  // Música da cidade de destino
  setMusicMode(musicForCity(cityId));

  saveGame();
  updateHud();
  sfx('teleport');
  showToast({
    itemId: 'map',
    title: 'Viagem rápida',
    subtitle: `Você chegou em ${city.name.replace('Cidade de ', '')}.`,
    color: '#8ad8ff',
    duration: 3500,
  });
  return true;
}