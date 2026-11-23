// Ember & Tide — deterministic states for the entry's screenshots.
// Each shot is the real game with a fixed setup: same code, same renderer,
// no special-casing in the art — the screenshots are honest renders.
import { CARD_BY_ID, ELEMENTS } from './cards.js';

function tableSetup(game) {
  game.pLife = 24; game.aLife = 19;
  game.pShield = 4; game.aShield = 0;
  game.pBurn = { turns: 0, dmg: 0 };
  game.aBurn = { turns: 1, dmg: 2 };
  game.turn = 4;
  game.maxEnergy = 6; game.energy = 5;
  game.attune = 'ember';
  game.phase = 'player';
  game.pHand = ['inferno-wave', 'glacial-spike', 'deep-current', 'granite-wall', 'gemhoard'];
  game.aHand = ['tidal-crash', 'aurora-veil', 'boulder-fist', 'maelstrom', 'quake-slam'];
  game.score = 31; game.aiScore = 18;
  game.lastPlayed = { card: CARD_BY_ID['inferno-wave'], by: 'player' };
  game.log = [
    'The Sage plays ❄️ Aurora Veil. +6 shield.',
    'You play 🔥 Inferno Wave. ✨ Attunement: +2 damage!',
    '🔥 The Sage is burning (2/turn, 2 turns).',
  ];
}

export function applyShot(game, shot) {
  if (shot === 'table') {
    tableSetup(game);
    return;
  }
  if (shot === 'victory') {
    tableSetup(game);
    game.aLife = 0;
    game.pLife = 17;
    game.turn = 7;
    game.score = 47;
    game.winner = 'player';
    game.phase = 'over';
    game.log.push('You play 🪨 Quake Slam. 9 damage — the Sage falls!');
    return;
  }
  if (shot === 'defeat') {
    tableSetup(game);
    game.pLife = 0;
    game.aLife = 12;
    game.turn = 8;
    game.score = 29;
    game.aiScore = 34;
    game.winner = 'ai';
    game.phase = 'over';
    game.lastPlayed = { card: CARD_BY_ID['maelstrom'], by: 'ai' };
    game.log.push('The Sage plays 💧 Maelstrom. 7 damage — you fall.');
    return;
  }
  // Unknown shot name: leave the fresh game as it is.
  void ELEMENTS;
}
