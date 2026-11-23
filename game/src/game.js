// Ember & Tide — game rules: turns, energy, attunement, resonance, burn, AI.
import { CARD_BY_ID, buildDeck, shuffle, mulberry32, ATTUNEMENT_CYCLE, ELEMENTS } from './cards.js';

export const MAX_LIFE = 30;
export const HAND_LIMIT = 8;
const OPENING_HAND = 5;
const DRAW_PER_TURN = 2;

export class Game {
  constructor(seed) {
    this.rand = mulberry32(seed ?? ((Math.random() * 1e9) | 0));
    this.reset();
  }

  reset() {
    this.pLife = MAX_LIFE; this.aLife = MAX_LIFE;
    this.pShield = 0; this.aShield = 0;
    this.pBurn = { turns: 0, dmg: 0 }; this.aBurn = { turns: 0, dmg: 0 };
    this.turn = 1; this.maxEnergy = 3; this.energy = 3;
    this.phase = 'player'; // 'player' | 'ai' | 'over'
    this.pDeck = shuffle(buildDeck(), this.rand);
    this.aDeck = shuffle(buildDeck(), this.rand);
    this.pHand = []; this.aHand = [];
    this.pDiscard = []; this.aDiscard = [];
    this.log = [];
    this.attune = ATTUNEMENT_CYCLE[0];
    this.pPlayedEls = []; this.aPlayedEls = []; // elements played this turn, per side (for Resonance)
    this.lastPlayed = null; // { card, by }
    this.score = 0; this.aiScore = 0; // damage dealt to life
    this.winner = null;
    this.drawCards('player', OPENING_HAND);
    this.drawCards('ai', OPENING_HAND);
    this.say(`Turn 1 — Attunement: ${ELEMENTS[this.attune].glyph} ${ELEMENTS[this.attune].name}. Your move.`);
  }

  say(msg) { this.log.push(msg); if (this.log.length > 40) this.log.shift(); }

  drawCards(side, n) {
    const hand = side === 'player' ? this.pHand : this.aHand;
    let deck = side === 'player' ? this.pDeck : this.aDeck;
    const discard = side === 'player' ? this.pDiscard : this.aDiscard;
    for (let i = 0; i < n; i++) {
      if (deck.length === 0) {
        if (discard.length === 0) return;
        deck = shuffle(discard.splice(0), this.rand);
        if (side === 'player') this.pDeck = deck; else this.aDeck = deck;
        this.say(`${side === 'player' ? 'Your' : "The Sage's"} discard pile is shuffled back into the deck.`);
      }
      if (hand.length >= HAND_LIMIT) { this.say('Hand is full — a drawn card is lost.'); deck.shift(); continue; }
      hand.push(deck.shift());
    }
  }

  // Damage goes through shield first, then life. Returns life damage dealt.
  dealDamage(target, raw, sourceName) {
    if (raw <= 0) return 0;
    let left = raw;
    if (target === 'ai' && this.aShield > 0) {
      const blocked = Math.min(this.aShield, left);
      this.aShield -= blocked; left -= blocked;
      if (blocked > 0) this.say(`🛡️ The Sage's shield blocks ${blocked}.`);
    }
    if (target === 'player' && this.pShield > 0) {
      const blocked = Math.min(this.pShield, left);
      this.pShield -= blocked; left -= blocked;
      if (blocked > 0) this.say(`🛡️ Your shield blocks ${blocked}.`);
    }
    if (left > 0) {
      if (target === 'ai') { this.aLife = Math.max(0, this.aLife - left); this.score += left; }
      else { this.pLife = Math.max(0, this.pLife - left); this.aiScore += left; }
    }
    this.checkEnd();
    return left;
  }

  // Burn ticks at the start of the afflicted side's turn, ignoring shield.
  burnTick(side) {
    const burn = side === 'player' ? this.pBurn : this.aBurn;
    if (burn.turns <= 0) return;
    burn.turns -= 1;
    if (side === 'player') this.pLife = Math.max(0, this.pLife - burn.dmg);
    else { this.aLife = Math.max(0, this.aLife - burn.dmg); this.score += burn.dmg; }
    this.say(`🔥 Burn scorches ${side === 'player' ? 'you' : 'the Sage'} for ${burn.dmg}.`);
    this.checkEnd();
  }

  checkEnd() {
    if (this.winner) return;
    if (this.aLife <= 0) { this.winner = 'player'; this.phase = 'over'; }
    else if (this.pLife <= 0) { this.winner = 'ai'; this.phase = 'over'; }
  }

  canPlay(side, index) {
    if (this.phase !== (side === 'player' ? 'player' : 'ai')) return false;
    const hand = side === 'player' ? this.pHand : this.aHand;
    const card = CARD_BY_ID[hand[index]];
    return card && card.cost <= (side === 'player' ? this.energy : this.aiEnergy);
  }

  playCard(index, side = 'player') {
    const hand = side === 'player' ? this.pHand : this.aHand;
    const id = hand[index];
    if (!id) return false;
    const card = CARD_BY_ID[id];
    const energy = side === 'player' ? this.energy : this.aiEnergy;
    if (card.cost > energy) return false;
    if (side === 'player') this.energy -= card.cost; else this.aiEnergy -= card.cost;
    hand.splice(index, 1);
    (side === 'player' ? this.pDiscard : this.aDiscard).push(id);
    this.lastPlayed = { card, by: side };
    const who = side === 'player' ? 'You play' : 'The Sage plays';
    this.say(`${who} ${ELEMENTS[card.el].glyph} ${card.name}.`);

    // Resonance: a second card of the same element by the same side this
    // turn deals +3 damage. (Tracked per side — your Ember streak is not
    // the Sage's.)
    const played = side === 'player' ? this.pPlayedEls : this.aPlayedEls;
    const resonance = played.includes(card.el);
    if (!resonance) played.push(card.el);

    const foe = side === 'player' ? 'ai' : 'player';
    if (card.kind === 'strike') {
      let dmg = card.dmg;
      if (card.el === this.attune) { dmg += 2; this.say(`✨ Attunement: +2 damage for ${ELEMENTS[card.el].name}!`); }
      if (resonance) { dmg += 3; this.say('💥 Resonance! A second ' + ELEMENTS[card.el].name + ' card: +3 damage!'); }
      this.dealDamage(foe, dmg, card.name);
      if (card.burn) {
        const b = foe === 'player' ? this.pBurn : this.aBurn;
        b.turns = 2; b.dmg = card.burn;
        this.say(`🔥 ${foe === 'player' ? 'You are' : 'The Sage is'} burning (${card.burn}/turn, 2 turns).`);
      }
    }
    if (card.heal) {
      if (side === 'player') this.pLife = Math.min(MAX_LIFE, this.pLife + card.heal);
      else this.aLife = Math.min(MAX_LIFE, this.aLife + card.heal);
      this.say(`💚 ${side === 'player' ? 'You restore' : 'The Sage restores'} ${card.heal} life.`);
    }
    if (card.shield) {
      if (side === 'player') this.pShield += card.shield; else this.aShield += card.shield;
      this.say(`🛡️ ${side === 'player' ? 'You gain' : 'The Sage gains'} ${card.shield} shield.`);
    }
    if (card.draw) this.drawCards(side, card.draw);
    this.checkEnd();
    return true;
  }

  // The Sage plays greedily: lethal damage first, then heals when hurt,
  // shields when exposed, draws when it has spare energy.
  aiTakeTurn() {
    this.phase = 'ai';
    // The Sage goes second, so its opening turn runs on one less energy —
    // otherwise its first strike can take a third of your life.
    this.aiEnergy = this.turn === 1 ? Math.max(1, this.maxEnergy - 1) : this.maxEnergy;
    // Like the player, the Sage draws 2 at the start of each turn after its
    // first — otherwise it runs out of cards and the duel ends by turn 4.
    if (this.turn > 1) this.drawCards('ai', DRAW_PER_TURN);
    this.burnTick('ai');
    if (this.phase === 'over') return;
    this.say("The Sage's turn…");
    for (;;) {
      let best = -1; let bestScore = 0;
      this.aHand.forEach((id, i) => {
        const c = CARD_BY_ID[id];
        if (c.cost > this.aiEnergy) return;
        let s = 0;
        if (c.kind === 'strike') {
          s = c.dmg + (c.el === this.attune ? 2 : 0) + (c.burn || 0) * 2 + (c.draw || 0) * 2;
          if (this.pLife - Math.max(0, s - this.pShield) <= 0) s += 100; // lethal
        } else if (c.kind === 'heal') {
          s = this.aLife <= 12 ? c.heal * 1.2 : this.aLife <= 24 ? c.heal * 0.4 : 0;
        } else if (c.kind === 'shield') {
          s = this.aShield < 4 ? c.shield * 0.8 : 1;
        } else if (c.kind === 'draw') {
          s = 2.5;
        }
        if (s > bestScore) { bestScore = s; best = i; }
      });
      if (best < 0) break;
      this.playCard(best, 'ai');
      if (this.phase === 'over') return;
    }
    this.say('The Sage ends its turn.');
    this.startPlayerTurn();
  }

  startPlayerTurn() {
    if (this.phase === 'over') return;
    this.turn += 1;
    this.maxEnergy = Math.min(3 + (this.turn - 1), 10);
    this.energy = this.maxEnergy;
    this.attune = ATTUNEMENT_CYCLE[(this.turn - 1) % ATTUNEMENT_CYCLE.length];
    this.pPlayedEls = []; this.aPlayedEls = [];
    this.phase = 'player';
    this.burnTick('player');
    if (this.phase === 'over') return;
    this.drawCards('player', DRAW_PER_TURN);
    this.say(`Turn ${this.turn} — Attunement: ${ELEMENTS[this.attune].glyph} ${ELEMENTS[this.attune].name}. Your move.`);
  }
}
