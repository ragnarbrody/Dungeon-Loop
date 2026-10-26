import { playerStats, setGameState, STATE, saveGame } from '../core/state.js';

export function renderLevelUp() {
  const screen = document.getElementById('levelup-screen');
  const pointsLabel = document.getElementById('levelup-points');
  const statsDiv = document.getElementById('levelup-stats');

  screen.classList.remove('hidden');
  pointsLabel.textContent = `Pontos disponíveis: ${playerStats.points}`;

  const statsList = [
    { id: 'str',   name: 'Força (Dano)' },
    { id: 'agi',   name: 'Agilidade (Acerto/Fuga)' },
    { id: 'int',   name: 'Inteligência (Crítico/Regen MP)' },
    { id: 'def',   name: 'Defesa (Redução de Dano)' },
    { id: 'vit',   name: 'Vitalidade (Vida Máxima)' },
    { id: 'magia', name: 'Magia (Mana Máxima)' },
  ];

  statsDiv.innerHTML = '';
  statsList.forEach(stat => {
    const row = document.createElement('div');
    row.className = 'levelup-row';
    row.innerHTML = `
      <span>${stat.name}: <strong>${playerStats[stat.id]}</strong></span>
      <button data-stat="${stat.id}" ${playerStats.points <= 0 ? 'disabled' : ''}>+</button>
    `;
    statsDiv.appendChild(row);
  });

  document.querySelectorAll('.levelup-row button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const statId = e.target.getAttribute('data-stat');
      if (playerStats.points > 0) {
        playerStats[statId]++;
        playerStats.points--;
        if (statId === 'vit')   playerStats.hp += 5;
        if (statId === 'magia') playerStats.mp = Math.min(playerStats.maxMp, playerStats.mp + 3);
        saveGame();
        renderLevelUp();
      }
    });
  });

  document.getElementById('btn-confirm-levelup').onclick = () => {
    if (playerStats.points > 0) {
      alert("Você ainda tem pontos para distribuir!");
      return;
    }
    screen.classList.add('hidden');
    setGameState(STATE.EXPLORE);
  };
}