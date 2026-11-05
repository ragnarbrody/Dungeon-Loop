import { playerStats, saveGame } from '../core/state.js';
import { ITEMS_DB } from '../items.js';
import { getIcon } from '../sprites/icons.js';
import { showToast } from './toast.js';
import { getVault, depositGold, withdrawGold, depositItem, withdrawItem,
         buyVaultSlot, nextSlotPrice, GOLD_DEPOSIT_FEE } from '../core/meta.js';
import { pickVaultGreeting } from './shopgreetings.js';
import { currentRoom } from '../core/state.js';
import { getCityData } from '../world/cities.js';

const CSS = `
#vault-screen{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72)}
#vault-screen.hidden{display:none}
.vault-box{width:min(520px,94%);max-height:92%;overflow:auto;background:#1a1a2e;border:2px solid #c9a24d;padding:14px 16px;color:#e8e0c8;font:13px 'Courier New',monospace}
.vault-box h2{margin:0 0 4px;color:#feca57;text-align:center;font-size:16px}
.vault-sub{text-align:center;color:#9a9ab0;margin-bottom:8px}
.vault-tabs{display:flex;gap:6px;justify-content:center;margin:8px 0}
.vault-tab,.vault-btn,.vault-close{background:#2a2a3e;color:#e8e0c8;border:1px solid #5a4a2a;padding:4px 10px;cursor:pointer;font:inherit}
.vault-tab.active{background:#4a3a1a;border-color:#c9a24d;color:#feca57}
.vault-btn:disabled{opacity:.4;cursor:default}
.vault-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-bottom:1px solid #2a2a3e}
.vault-info{flex:1;min-width:0}.vault-empty{color:#6a6a80}.vault-note{color:#9a9ab0;font-size:11px}
.vault-section{margin:10px 0 4px;color:#c9a24d}
.vault-gold-row{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
.vault-greeting{text-align:center;color:#c9a24d;font-style:italic;margin:0 0 6px;line-height:1.4}
.vault-close{display:block;margin:12px auto 0}`;

let c = null;
let tab = 'gold';

function ensure() {
  if (c) return c;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  c = document.createElement('div');
  c.id = 'vault-screen'; c.className = 'hidden';
  c.innerHTML = `<div class="vault-box">
    <h2>Banco de Aethel</h2>
    <div class="vault-greeting"></div>
    <div class="vault-sub"></div>
    <div class="vault-tabs">
      <button class="vault-tab" data-tab="gold">Ouro</button>
      <button class="vault-tab" data-tab="items">Itens</button>
    </div>
    <div class="vault-body"></div>
    <button class="vault-close">Fechar (ESC)</button></div>`;
  document.getElementById('game-container').appendChild(c);
  c.querySelector('.vault-close').onclick = closeVault;
  c.querySelectorAll('.vault-tab').forEach(b => b.onclick = () => { tab = b.dataset.tab; render(); });
  return c;
}

export function openVault() {
  const c = ensure();
  // Nome dinâmico
  const cityId = currentRoom?.cityId || 'aethel';
  const city = getCityData(cityId);
  const bankName = city
    ? `Banco de ${city.name.replace('Cidade de ', '')}`
    : 'Banco';
  c.querySelector('h2').textContent = bankName;

  c.classList.remove('hidden');
  tab = 'gold';
  c.querySelector('.vault-greeting').textContent = pickVaultGreeting();
  render();
}
export function closeVault() { c?.classList.add('hidden'); }
export function isVaultOpen() { return !!c && !c.classList.contains('hidden'); }

const btn = (label, fn, disabled = false) => {
  const b = document.createElement('button');
  b.className = 'vault-btn'; b.textContent = label; b.disabled = disabled; b.onclick = fn;
  return b;
};
const section = (t) => { const d = document.createElement('div'); d.className = 'vault-section'; d.textContent = t; return d; };
const changed = () => { saveGame(); render(); };   // salva a run junto, evita duplicar ouro/itens ao recarregar

function render() {
  const v = getVault();
  c.querySelector('.vault-sub').textContent = `Mochila: ${playerStats.gold} ouro · Cofre: ${v.gold} ouro`;
  c.querySelectorAll('.vault-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const body = c.querySelector('.vault-body');
  body.innerHTML = '';
  if (tab === 'gold') renderGold(body, v); else renderItems(body, v);
}

function goldRow(body, fn, max) {
  const row = document.createElement('div'); row.className = 'vault-gold-row';
  for (const n of [10, 100, 1000]) row.appendChild(btn(String(n), () => { if (fn(n) > 0) changed(); }, max < 1));
  row.appendChild(btn('Tudo', () => { if (fn(max) > 0) changed(); }, max < 1));
  body.appendChild(row);
}

function renderGold(body, v) {
  body.appendChild(section('Guardar ouro'));
  goldRow(body, (n) => depositGold(playerStats, n), playerStats.gold);
  body.appendChild(section('Retirar ouro'));
  goldRow(body, (n) => withdrawGold(playerStats, n), v.gold);
  if (GOLD_DEPOSIT_FEE > 0) {
    const n = document.createElement('div'); n.className = 'vault-note';
    n.textContent = `Taxa de depósito: ${Math.round(GOLD_DEPOSIT_FEE * 100)}%.`;
    body.appendChild(n);
  }
}

function row({ icon, text, empty, label, fn, disabled }) {
  const r = document.createElement('div'); r.className = 'vault-row';
  if (icon) { const i = getIcon(icon); i.style.cssText = 'width:26px;height:26px;image-rendering:pixelated'; r.appendChild(i); }
  const info = document.createElement('div'); info.className = 'vault-info' + (empty ? ' vault-empty' : '');
  info.textContent = text; r.appendChild(info);
  if (label) r.appendChild(btn(label, fn, disabled));
  return r;
}

function renderItems(body, v) {
  const used = v.items.filter(Boolean).length;
  body.appendChild(section(`No cofre (${used}/${v.slots} slots)`));
  v.items.forEach((slot, i) => {
    if (!slot) { body.appendChild(row({ text: `Slot ${i + 1} — vazio`, empty: true })); return; }
    const info = ITEMS_DB[slot.id];
    body.appendChild(row({
      icon: slot.id, text: `${info?.name ?? slot.id} x${slot.qty}`,
      label: 'Retirar', fn: () => { withdrawItem(playerStats, i); changed(); },
    }));
  });

  const price = nextSlotPrice();
  if (price != null) {
    const total = playerStats.gold + v.gold;
    body.appendChild(row({
      text: `Slot ${v.slots + 1} bloqueado`, empty: true,
      label: `Comprar (${price} ouro)`, disabled: total < price,
      fn: () => {
        const r = buyVaultSlot(playerStats);
        if (r.ok) { showToast({ itemId: 'gold', title: 'Novo slot no cofre', subtitle: `-${r.price} ouro`, color: '#f0c060' }); changed(); }
      },
    }));
  }

  body.appendChild(section('Na mochila'));
  if (playerStats.inventory.length === 0) body.appendChild(row({ text: 'Mochila vazia.', empty: true }));
  for (const entry of [...playerStats.inventory]) {
    const info = ITEMS_DB[entry.id];
    const isQuest = info?.kind === 'quest';
    body.appendChild(row({
      icon: entry.id, text: `${info?.name ?? entry.id} x${entry.qty}${isQuest ? ' (missão)' : ''}`,
      label: 'Guardar', disabled: isQuest,
      fn: () => {
        const r = depositItem(playerStats, entry);
        if (r.moved <= 0 && r.reason === 'full') {
          showToast({ itemId: entry.id, title: 'Cofre cheio', subtitle: 'Libere ou compre um slot.', color: '#ff6b6b' });
        }
        changed();
      },
    }));
  }
}