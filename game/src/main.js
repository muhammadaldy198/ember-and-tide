// Ember & Tide — bootstrap, input wiring, screenshot states.
import { Game } from './game.js';
import { render } from './render.js';
import { applyShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '7', 10);

let game = null;

function showTable() {
  $('title-screen').classList.add('hidden');
  $('table').classList.remove('hidden');
}

function refresh() { render(game, playCardAt); }

function playCardAt(index) {
  if (!game || game.phase !== 'player') return;
  if (game.playCard(index, 'player')) refresh();
}

function endTurn() {
  if (!game || game.phase !== 'player') return;
  game.phase = 'ai';
  refresh();
  // A beat of suspense while the Sage "thinks".
  setTimeout(() => {
    game.aiTakeTurn();
    refresh();
  }, 900);
}

function startFresh() {
  game = new Game((Math.random() * 1e9) | 0);
  showTable();
  refresh();
}

$('play-btn').addEventListener('click', startFresh);
$('again-btn').addEventListener('click', startFresh);
$('end-turn').addEventListener('click', endTurn);

document.addEventListener('keydown', (e) => {
  if (shot) return; // screenshot states are static
  // A focused button already handles Space/Enter itself — don't double-fire.
  if ((e.key === ' ' || e.key === 'Enter') && e.target && e.target.tagName === 'BUTTON') return;
  if (e.key === 'Enter' && $('title-screen') && !$('title-screen').classList.contains('hidden')) {
    startFresh();
    return;
  }
  if (e.key === 'Enter' && !$('end-screen').classList.contains('hidden')) {
    startFresh();
    return;
  }
  if (!game) return;
  if (e.key >= '1' && e.key <= '9') playCardAt(parseInt(e.key, 10) - 1);
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endTurn(); }
});

// Screenshot mode: ?shot=title|table|victory|defeat&seed=N renders a fixed,
// deterministic state of the real game for the entry's screenshots.
if (shot && shot !== 'title') {
  game = new Game(seed);
  applyShot(game, shot);
  showTable();
  refresh();
}
