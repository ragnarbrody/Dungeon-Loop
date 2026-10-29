import { playerStats, setGameState, STATE, saveGame } from '../core/state.js';
import { CLASSES } from '../classes.js';

const STAT_INFO = {
  str:   { label: 'Força',        hint: 'Dano corpo a corpo' },
  agi:   { label: 'Agilidade',    hint: 'Acerto / Fuga' },
  int:   { label: 'Inteligência', hint: 'Crítico / Regen MP' },
  def:   { label: 'Defesa',       hint: 'Redução de dano' },
  vit:   { label: 'Vitalidade',   hint: 'Vida máxima' },
  magia: { label: 'Magia',        hint: 'Mana máxima' },
};

export function renderLevelUp() {
  const screen = document.getElementById('levelup-screen');
  const pointsLabel = document.getElementById('levelup-points');
  const statsDiv = document.getElementById('levelup-stats');

  const cls = playerStats.classId ? CLASSES[playerStats.classId] : null;
  const mainStat = cls?.damageStat || 'str';
  const mainInfo = STAT_INFO[mainStat];

  screen.classList.remove('hidden');
  pointsLabel.textContent = `Pontos disponíveis: ${playerStats.points}`;

  // Linha de destaque no topo, explicando o stat principal da classe
  let hint = document.getElementById('levelup-hint');
  if (!hint) {
    hint = document.createElement('p');
    hint.id = 'levelup-hint';
    hint.style.cssText =
      'color: #feca57; font-size: 12px; text-align: center; ' +
      'margin: 0 0 12px 0; padding: 6px 10px; ' +
      'background: rgba(201,162,77,0.1); border: 1px solid #c9a24d; ' +
      'border-radius: 4px; line-height: 1.4;';
    pointsLabel.insertAdjacentElement('afterend', hint);
  }
  hint.innerHTML = cls
    ? `<strong>${cls.name}</strong> — ${mainInfo.label} aumenta seu dano.`
    : `Distribua os pontos como preferir.`;

  // Lista de stats — o principal é destacado
  const statsList = [
    { id: 'str',   ...STAT_INFO.str },
    { id: 'agi',   ...STAT_INFO.agi },
    { id: 'int',   ...STAT_INFO.int },
    { id: 'def',   ...STAT_INFO.def },
    { id: 'vit',   ...STAT_INFO.vit },
    { id: 'magia', ...STAT_INFO.magia },
  ];

  statsDiv.innerHTML = '';
  statsList.forEach(stat => {
    const row = document.createElement('div');
    row.className = 'levelup-row' + (stat.id === mainStat ? ' main-stat' : '');
    row.innerHTML = `
      <span>
        ${stat.label}
        <small style="color:#888">(${stat.hint})</small>
        ${stat.id === mainStat ? '<span style="color:#feca57;font-size:10px;">★ dano</span>' : ''}
        : <strong>${playerStats[stat.id]}</strong>
      </span>
      <button data-stat="${stat.id}" ${playerStats.points <= 0 ? 'disabled' : ''}>+</button>
    `;
    if (stat.id === mainStat) {
      const badge = document.createElement('span');
      badge.textContent = '★ dano';
      badge.style.cssText = 'color: #feca57; font-size: 10px; margin-left: 8px;';
    }
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