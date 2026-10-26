import { CLASSES } from '../classes.js';
import { playerStats, saveGame } from '../core/state.js';
import { playerEquip } from '../sprites/equipment.js';
import { appendIcon } from '../sprites/icons.js';

export function showClassSelect(onPick, onCancel) {
  const screen = document.getElementById('class-screen');
  const cards  = document.getElementById('class-cards');
  const cancel = document.getElementById('btn-cancel-class');

  cards.innerHTML = '';
  Object.values(CLASSES).forEach(cls => {
    const card = document.createElement('div');
    card.className = 'class-card';

    // cabeçalho com ícone da classe maior
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px;';
    appendIcon(header, cls.id, 36); // Aumentado de 28 para 32
    const h3 = document.createElement('h3');
    h3.textContent = cls.name;
    h3.style.margin = '0';
    header.appendChild(h3);
    card.appendChild(header);

    const desc = document.createElement('p');
    desc.textContent = cls.description;
    card.appendChild(desc);

    // stats com mini-ícones
    const stats = document.createElement('div');
    stats.className = 'stats';

    const statRows = [
      { id: 'str',   label: 'Força',        val: cls.stats.str },
      { id: 'agi',   label: 'Agilidade',    val: cls.stats.agi },
      { id: 'int',   label: 'Inteligência', val: cls.stats.int },
      { id: 'def',   label: 'Defesa',       val: cls.stats.def },
      { id: 'vit',   label: 'Vitalidade',   val: cls.stats.vit },
      { id: 'magia', label: 'Magia',        val: cls.stats.magia ?? 0 },
    ];

    for (const row of statRows) {
      const line = document.createElement('span');
      line.style.cssText = 'display:flex; align-items:center; gap:6px; margin-bottom: 2px;';
      appendIcon(line, row.id, 18); // Aumentado de 14 para 18
      const txt = document.createElement('span');
      txt.textContent = `${row.label}: ${row.val}`;
      line.appendChild(txt);
      stats.appendChild(line);
    }

    card.appendChild(stats);

    card.onclick = () => {
      applyClass(cls.id);
      screen.classList.add('hidden');
      onPick(cls.id);
    };
    cards.appendChild(card);
  });

  cancel.onclick = () => {
    screen.classList.add('hidden');
    if (onCancel) onCancel();
  };

  screen.classList.remove('hidden');
}

export function applyClass(classId) {
  const cls = CLASSES[classId];
  if (!cls) return;

  playerStats.classId = cls.id;
  playerStats.str = cls.stats.str;
  playerStats.agi = cls.stats.agi;
  playerStats.int = cls.stats.int;
  playerStats.def = cls.stats.def;
  playerStats.vit = cls.stats.vit;
  playerStats.magia = cls.stats.magia ?? 0;

  playerStats._baseMp = cls.baseMp;
  playerStats._mpRegenAcc = 0;
  playerStats.buffs = {};
  playerStats.mp = playerStats.maxMp;

  playerStats.hp = playerStats.maxHp;

  playerEquip.rightHand = cls.equip.rightHand;
  playerEquip.leftHand  = cls.equip.leftHand;

  saveGame();
}