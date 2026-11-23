// Ember & Tide — DOM rendering: hands, life bars, arena, log, end screen.
import { CARD_BY_ID, ELEMENTS } from './cards.js';
import { MAX_LIFE } from './game.js';

const $ = (id) => document.getElementById(id);

function powerLine(card) {
  if (card.kind === 'strike') return `⚔️ ${card.dmg} damage`;
  if (card.kind === 'heal') return `💚 +${card.heal} life`;
  if (card.kind === 'shield') return `🛡️ +${card.shield} shield`;
  return `🃏 Draw ${card.draw}`;
}

export function createCardEl(card, { disabled = false, onClick = null } = {}) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `card el-${card.el}`;
  el.disabled = disabled;
  el.setAttribute('aria-label', `${card.name}, cost ${card.cost}, ${card.text}`);
  el.innerHTML =
    `<span class="card-cost">${card.cost}</span>` +
    `<span class="card-name">${card.name}</span>` +
    `<span class="card-glyph">${ELEMENTS[card.el].glyph}</span>` +
    `<span class="card-power">${powerLine(card)}</span>` +
    `<span class="card-text">${card.text}</span>` +
    `<span class="card-flavor">“${card.flavor}”</span>`;
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

function renderFighter(prefix, life, shield, burn) {
  $(`${prefix}-life-fill`).style.width = `${(life / MAX_LIFE) * 100}%`;
  $(`${prefix}-life-text`).textContent = `${life} / ${MAX_LIFE}`;
  const shieldEl = $(`${prefix}-shield`);
  shieldEl.classList.toggle('hidden', shield <= 0);
  shieldEl.textContent = `🛡️ ${shield}`;
  const burnEl = $(`${prefix}-burn`);
  burnEl.classList.toggle('hidden', burn.turns <= 0);
  burnEl.textContent = `🔥 Burn ${burn.dmg} (${burn.turns}t)`;
}

export function render(game, onPlayCard) {
  renderFighter('player', game.pLife, game.pShield, game.pBurn);
  renderFighter('ai', game.aLife, game.aShield, game.aBurn);

  $('player-score').textContent = game.score;
  $('ai-score').textContent = game.aiScore;
  $('turn-text').textContent = game.turn;
  $('energy-text').textContent = `${game.energy} / ${game.maxEnergy}`;
  const pips = $('energy-pips');
  pips.innerHTML = '';
  for (let i = 0; i < game.maxEnergy; i++) {
    const pip = document.createElement('span');
    pip.className = 'pip' + (i < game.energy ? ' on' : '');
    pips.appendChild(pip);
  }

  const att = ELEMENTS[game.attune];
  $('attunement').textContent =
    `Attunement: ${att.glyph} ${att.name} — ${att.name} cards deal +2 damage this turn`;

  // Player hand (clickable cards).
  const handEl = $('player-hand');
  handEl.innerHTML = '';
  game.pHand.forEach((id, i) => {
    const card = CARD_BY_ID[id];
    handEl.appendChild(createCardEl(card, {
      disabled: game.phase !== 'player' || card.cost > game.energy,
      onClick: () => onPlayCard(i),
    }));
  });

  // Opponent hand (face-down backs — the count is the tell).
  const aiHandEl = $('ai-hand');
  aiHandEl.innerHTML = '';
  game.aHand.forEach(() => {
    const back = document.createElement('div');
    back.className = 'card-back';
    back.textContent = '🌊';
    aiHandEl.appendChild(back);
  });

  // Arena: the last played card, or a placeholder.
  const arena = $('arena-card');
  arena.innerHTML = '';
  if (game.lastPlayed) {
    arena.appendChild(createCardEl(game.lastPlayed.card, { disabled: true }));
  } else {
    const ph = document.createElement('span');
    ph.className = 'arena-placeholder';
    ph.textContent = 'The table awaits a card…';
    arena.appendChild(ph);
  }

  // Log: the last three entries, newest emphasized — the box fits three lines.
  const logEl = $('log');
  logEl.innerHTML = '';
  game.log.slice(-3).forEach((line) => {
    const div = document.createElement('div');
    div.textContent = line;
    logEl.appendChild(div);
  });

  $('end-turn').disabled = game.phase !== 'player';

  // End screen.
  const endScreen = $('end-screen');
  if (game.phase === 'over' && game.winner) {
    const victory = game.winner === 'player';
    $('end-glyph').textContent = victory ? '🏆' : '💀';
    $('end-title').textContent = victory ? 'VICTORY' : 'DEFEAT';
    document.querySelector('.end-inner').classList.toggle('defeat', !victory);
    $('end-line').textContent = victory
      ? 'The tides bow to you — the Sage of the Deep is beaten.'
      : 'The deep claims another duelist. The cards were not with you.';
    $('end-score').textContent = game.score;
    $('end-turns').textContent = game.turn;
    $('end-life').textContent = game.pLife;
    endScreen.classList.remove('hidden');
  } else {
    endScreen.classList.add('hidden');
  }
}
