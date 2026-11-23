// Ember & Tide — the card library. 16 original cards across four elements.
// Every card: id, name, element, energy cost, kind, numbers, rules text, flavor.

export const ELEMENTS = {
  ember: { name: 'Ember', glyph: '🔥', color: '#ea580c' },
  frost: { name: 'Frost', glyph: '❄️', color: '#0284c7' },
  tide: { name: 'Tide', glyph: '💧', color: '#2563eb' },
  stone: { name: 'Stone', glyph: '🪨', color: '#a16207' },
};

// The attunement cycles each turn: cards of the attuned element deal +2 damage.
export const ATTUNEMENT_CYCLE = ['ember', 'frost', 'tide', 'stone'];

// kind: strike (damage) | heal (restore life) | shield (gain block) | draw (draw cards)
// Side effects ride on any card: burn (damage over time on the enemy),
// draw (extra cards), heal, shield.
export const CARD_DEFS = [
  { id: 'cinder-slash', name: 'Cinder Slash', el: 'ember', cost: 1, kind: 'strike', dmg: 4, burn: 1,
    text: 'Deal 4 damage. Burn 1.', flavor: 'First spark, last warning.' },
  { id: 'inferno-wave', name: 'Inferno Wave', el: 'ember', cost: 3, kind: 'strike', dmg: 8, burn: 2,
    text: 'Deal 8 damage. Burn 2.', flavor: 'The sky itself catches fire.' },
  { id: 'flamebrand', name: 'Flamebrand', el: 'ember', cost: 2, kind: 'strike', dmg: 6,
    text: 'Deal 6 damage.', flavor: "Forged in a dragon's yawn." },
  { id: 'phoenix-feather', name: 'Phoenix Feather', el: 'ember', cost: 2, kind: 'heal', heal: 6,
    text: 'Restore 6 life.', flavor: "It burns so you don't have to." },
  { id: 'ice-shard', name: 'Ice Shard', el: 'frost', cost: 1, kind: 'strike', dmg: 3, draw: 1,
    text: 'Deal 3 damage. Draw 1 card.', flavor: 'Small. Sharp. Everywhere.' },
  { id: 'glacial-spike', name: 'Glacial Spike', el: 'frost', cost: 2, kind: 'strike', dmg: 5, shield: 3,
    text: 'Deal 5 damage. Gain 3 shield.', flavor: "Winter keeps its receipts." },
  { id: 'winters-grasp', name: "Winter's Grasp", el: 'frost', cost: 2, kind: 'strike', dmg: 6, draw: 1,
    text: 'Deal 6 damage. Draw 1 card.', flavor: 'Cold hands, colder heart.' },
  { id: 'aurora-veil', name: 'Aurora Veil', el: 'frost', cost: 1, kind: 'shield', shield: 6,
    text: 'Gain 6 shield.', flavor: 'Light, woven into armor.' },
  { id: 'tidal-crash', name: 'Tidal Crash', el: 'tide', cost: 2, kind: 'strike', dmg: 6,
    text: 'Deal 6 damage.', flavor: 'The ocean does not negotiate.' },
  { id: 'deep-current', name: 'Deep Current', el: 'tide', cost: 1, kind: 'strike', dmg: 3, heal: 3,
    text: 'Deal 3 damage. Restore 3 life.', flavor: 'What pulls you under, lifts you up.' },
  { id: 'maelstrom', name: 'Maelstrom', el: 'tide', cost: 3, kind: 'strike', dmg: 7, draw: 1,
    text: 'Deal 7 damage. Draw 1 card.', flavor: 'Swim against it. I dare you.' },
  { id: 'stillwater', name: 'Stillwater', el: 'tide', cost: 2, kind: 'heal', heal: 8,
    text: 'Restore 8 life.', flavor: 'Calm is also a weapon.' },
  { id: 'boulder-fist', name: 'Boulder Fist', el: 'stone', cost: 1, kind: 'strike', dmg: 4,
    text: 'Deal 4 damage.', flavor: 'Diplomacy, but heavier.' },
  { id: 'granite-wall', name: 'Granite Wall', el: 'stone', cost: 2, kind: 'shield', shield: 9,
    text: 'Gain 9 shield.', flavor: 'It has never once blinked.' },
  { id: 'quake-slam', name: 'Quake Slam', el: 'stone', cost: 3, kind: 'strike', dmg: 8,
    text: 'Deal 8 damage.', flavor: 'The mountain disagrees.' },
  { id: 'gemhoard', name: 'Gemhoard', el: 'stone', cost: 1, kind: 'draw', draw: 2,
    text: 'Draw 2 cards.', flavor: 'Rich in rocks, rich in options.' },
];

export const CARD_BY_ID = Object.fromEntries(CARD_DEFS.map((c) => [c.id, c]));

// A 24-card deck: one of each unique card, plus a second copy of the
// eight cheapest workhorses so the early game always has plays.
const EXTRA_COPIES = [
  'cinder-slash', 'ice-shard', 'aurora-veil', 'deep-current',
  'boulder-fist', 'gemhoard', 'flamebrand', 'tidal-crash',
];

export function buildDeck() {
  const deck = CARD_DEFS.map((c) => c.id);
  for (const id of EXTRA_COPIES) deck.push(id);
  return deck;
}

// Deterministic shuffle (mulberry32) so screenshot states are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(deck, rand) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
