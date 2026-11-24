/**
 * Happy New Ur's party pieces (register G1195; plan research/seasonal/new-year-plan.md steps 4 to 8,
 * Austin's picks 2026-11-23). Pure rules, no DOM and no imports, so js/seasons.js can read the stock;
 * js/features/new-ur-party-feature.js puts them in the world and the realtime server's new_ur.go
 * carries the online parts. The countdown and its six midnights are js/new-ur.js.
 *
 * Glitch had no New Year item, quest or badge (GSJS has none; plan section 1), so every piece here is
 * ours (inventions register new-ur-party). Each follows a Glitch habit where one fits:
 *  - Midnight Sparkly, the keepsake: anyone who sees one of the six midnights gets one a year, and the
 *    badge Rang In the New Ur. Glitch's own 2011 midnight gave nothing but sparkles, and players said
 *    so ("I stayed up 3 hours for SPARKLES"). Online the server's word that you were connected at the
 *    midnight grants it (new_ur.go "seen"), never the page's clock; solo the device clock, as the New
 *    Day screen.
 *  - Confetti Popper: the Glitchmas Cracker's habit (items/glitchmas_cracker.js): a seasonal toy the
 *    Toy Vendor stocks (catalog_stores.js toys; js/seasons.js SEASONAL_STOCK), single use, its bang the
 *    cracker's GLITCHMAS_CRACKER sound, the burst seen by everyone on the street as the cracker's
 *    pc_overlay was (location.apiSendAnnouncementX). Ours: the Toy Vendor's is mixed colours, and a
 *    Tinkertool makes one from Paper, a Sparkly and an Element, in that Element's colour (as the
 *    Sno Cones take their colour from an Element, catalog_recipes.js Blender rows). Everyone near the
 *    bang plays surprise once (the Sparkle Powder's reach, sparkle_powder.js, is the street).
 *  - Bubbly: a Cocktail Shaker drink from a Bunch of Grapes and a Tiny Bubble (both Tiny Speck items),
 *    drunk like any drink (include/drink.js drink_mood / drink_energy). Toast drinks it with the
 *    players near you: each of you gets mood and plays happy once.
 *  - Sparkly Batterflies: for the Groddle day the big midnight opens (js/new-ur.js firstUrDay) every
 *    Batterfly glints gold.
 *  - Party hats on street Chickens: December 31 and January 1 (js/new-ur.js hatsOn), Pot Luck Day's
 *    costume system again (js/pot-luck.js costumeFrame), Tiny Speck's party_hat drawn on the chicken
 *    rig (tools/pot-luck-art, party_hat).
 */

export const NEW_UR_PARTY_SEASON = 'new_ur';

/** The keepsake (one a year) and its badge. */
export const KEEPSAKE = 'midnight_sparkly';
export const BADGE = 'nu_rang_in_the_new_ur';
/** The badge counter a midnight seen counts (group:label). */
export const MIDNIGHT_COUNTER = 'new_ur:midnight';

export const POPPER = 'confetti_popper';
export const POPPER_COLOURS = Object.freeze(['red', 'green', 'blue', 'shiny']);
/** Classes: the Toy Vendor's mixed one, and the four made ones. */
export const POPPERS = Object.freeze([POPPER, ...POPPER_COLOURS.map((c) => `${POPPER}_${c}`)]);
export const BUBBLY = 'bubbly';

/** Each Element's confetti (the Element icons' own colours, and white paper; the mix all of them and party pink). */
export const CONFETTI = Object.freeze({
  red: Object.freeze([0xe2493b, 0xf27a5e, 0xb8281f, 0xffffff]),
  green: Object.freeze([0x52b043, 0x8fd16a, 0x2f7d2a, 0xffffff]),
  blue: Object.freeze([0x3f8fe0, 0x7cc0f5, 0x2160b0, 0xffffff]),
  // The Shiny Element's icon is a silver-white cube: silver confetti with a fleck of gold.
  shiny: Object.freeze([0xd9e3ee, 0xffffff, 0xaebdcf, 0xf5d84a]),
  mix: Object.freeze([0xe2493b, 0x52b043, 0x3f8fe0, 0xd9e3ee, 0xf5d84a, 0xff8ad8, 0xffffff]),
});

/** The colour a popper class bursts in ('mix' for the Toy Vendor's). */
export function popperColour(cls) {
  const m = /^confetti_popper_(red|green|blue|shiny)$/.exec(String(cls || ''));
  return m ? m[1] : (cls === POPPER ? 'mix' : '');
}
export const isPopper = (cls) => POPPERS.includes(cls);

const ELEMENT_LABEL = Object.freeze({ red: 'Red', green: 'Green', blue: 'Blue', shiny: 'Shiny' });

/** Our items (no GSJS file). Player words: plain, short, no em dashes. */
export const NEW_UR_ITEMS = Object.freeze({
  [KEEPSAKE]: Object.freeze({
    label: 'Midnight Sparkly',
    namePlural: 'Midnight Sparklies',
    desc: 'A Sparkly that caught the light of a Groddle midnight as the year turned, and kept it. Proof you were there when Ur rang in the New Ur.',
    baseCost: 0,
    stackMax: 11,
    tags: Object.freeze(['no_trade']),
    sellable: false,
    donatable: false,
  }),
  [POPPER]: Object.freeze({
    label: 'Confetti Popper',
    namePlural: 'Confetti Poppers',
    desc: 'A paper tube packed with every colour of confetti and one very loud bang. Pop it and everyone near you jumps. Happy New Ur!',
    baseCost: 20,
    stackMax: 20,
    tags: Object.freeze(['no_trade']),
  }),
  ...Object.fromEntries(POPPER_COLOURS.map((c) => [`${POPPER}_${c}`, Object.freeze({
    label: `${ELEMENT_LABEL[c]} Confetti Popper`,
    namePlural: `${ELEMENT_LABEL[c]} Confetti Poppers`,
    desc: `A Confetti Popper you rolled yourself, stuffed with ${ELEMENT_LABEL[c].toLowerCase()} confetti and a pinch of Sparkly for the bang. Pop it and everyone near you jumps.`,
    baseCost: 20,
    stackMax: 20,
    tags: Object.freeze(['no_trade']),
  })])),
  [BUBBLY]: Object.freeze({
    label: 'Bubbly',
    namePlural: 'Bubblies',
    desc: 'Grape juice shaken up with a Tiny Bubble until it fizzes. Drink it, or Toast with the players near you and everyone gets a lift. Happy New Ur!',
    baseCost: 18,
    stackMax: 20,
    tags: Object.freeze(['no_trade', 'drink']),
  }),
});

/** Bubbly drinks like Tiny Speck's drinks (include/drink.js drink_mood / drink_energy): ours, a Slow Gin Fizz's size halved. */
export const BUBBLY_DRINK = Object.freeze({ kind: 'drink', verb: 'Drink', mood: 10, energy: 5, message: 'You drank a Bubbly. Fizzy!' });

/** The Toy Vendor's stock for the season (js/seasons.js SEASONAL_STOCK.new_ur), price in currants. */
export const NEW_UR_STOCK = Object.freeze({
  toys: Object.freeze([Object.freeze({ classTsid: POPPER, label: NEW_UR_ITEMS[POPPER].label, cost: 25 })]),
});

/** Recipes the season adds (making.js recipe.season: made only Dec 26 to Jan 3). */
const recipe = (id, name, tool, skill, inputs, out) => Object.freeze({
  id,
  name,
  tool,
  energyCost: 4,
  xpReward: 4,
  waitMs: 2000,
  inputs: Object.freeze(inputs.map(([classTsid, qty]) => Object.freeze({ classTsid, qty }))),
  outputs: Object.freeze([Object.freeze({ classTsid: out, qty: 1 })]),
  skill,
  skills: Object.freeze([skill]),
  achievements: Object.freeze([]),
  toolWear: 1,
  taskLimit: 20,
  learnt: 1,
  season: NEW_UR_PARTY_SEASON,
  source: 'ours (G1195): Happy New Ur',
});

/** Paper, a Sparkly for the bang and 50 of an Element for the colour (the Sno Cones' habit). */
export const POPPER_ELEMENTS = 50;
export const NEW_UR_RECIPES = Object.freeze({
  ...Object.fromEntries(POPPER_COLOURS.map((c) => [`${POPPER}_${c}`, recipe(`nu_popper_${c}`, `${ELEMENT_LABEL[c]} Confetti Popper`, 'tinkertool', 'tinkering_1',
    [['paper', 1], ['sparkly', 1], [`element_${c}`, POPPER_ELEMENTS]], `${POPPER}_${c}`)])),
  [BUBBLY]: recipe('nu_bubbly', 'Bubbly', 'cocktail_shaker', 'cocktailcrafting_1', [['bunch_of_grapes', 1], ['tiny_bubble', 1]], BUBBLY),
});

export const NEW_UR_PARTY = Object.freeze({
  /** Players within this many px of a popper's bang play surprise (the cracker's helpRange is 260; a bang carries further). */
  popReach: 600,
  /** One pop a second, at most. */
  popEveryMs: 1000,
  /** Toast reaches the players within this many px (ours). */
  toastReach: 400,
  toastEveryMs: 3000,
  /** Each toaster's mood, on top of the drink's own. */
  toastMood: 10,
  /** The burst: bits, how long they fly. */
  burstBits: 90,
  burstMs: 2400,
});

export const NEW_UR_PARTY_TEXT = Object.freeze({
  keepsake: (year) => `You saw the year turn. A Midnight Sparkly for ${year} goes in your pack.`,
  popped: 'Bang! Confetti everywhere.',
  poppedBy: (name) => `${name} popped a Confetti Popper. Bang!`,
  pop: 'Pop',
  popTip: 'Pop it: a bang and a burst of confetti for everyone near you',
  toast: 'Toast',
  toastTip: 'Raise a glass with the players near you',
  toastAlone: 'Toast with someone near you. On your own, just Drink it.',
  toastSlow: 'Give your glass a moment.',
  toasted: (names) => `You raise a glass with ${listNames(names)}. Happy New Ur!`,
  toastedBy: (name) => `${name} raises a glass of Bubbly to you. Happy New Ur!`,
  seasonOnly: 'This is only made for Happy New Ur, December 26 to January 3.',
});

/** "Ada", "Ada and Bo", "Ada, Bo and 3 others". */
export function listNames(names = []) {
  const list = [].concat(names).filter(Boolean).map(String);
  if (!list.length) return 'the street';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  if (list.length === 3) return `${list[0]}, ${list[1]} and ${list[2]}`;
  return `${list[0]}, ${list[1]} and ${list.length - 2} others`;
}

/* ---------------------------------------------------------------- badge */

/** Rang In the New Ur (ours): achievements.json's shape, added by tools/achievement-overrides.mjs. */
export const NEW_UR_BADGES = Object.freeze({
  [BADGE]: Object.freeze({
    classTsid: BADGE,
    name: 'Rang In the New Ur',
    desc: 'Saw the year turn at a Groddle midnight on New Year’s Eve',
    statusText: 'Three, two, one, sparkles! You were there when the year turned in Ur. Happy New Ur!',
    category: 'seasonal',
    url: 'rang-in-the-new-ur',
    isSecret: false,
    conditions: Object.freeze([Object.freeze({ id: BADGE, type: 'counter', group: 'new_ur', name: 'midnight', num: 1, desc: 'midnight' })]),
    rewards: Object.freeze({ xp: 100, favor: Object.freeze({ giant: 'friendly', points: 15 }) }),
    icons: Object.freeze({}),
  }),
});

/* ----------------------------------------------------------------- save */

export function createPartyState(seed = {}) {
  const s = seed && typeof seed === 'object' ? seed : {};
  const keepsakes = [...new Set((Array.isArray(s.keepsakes) ? s.keepsakes : []).map(String).filter((y) => /^\d{4}$/.test(y)))].sort();
  return { keepsakes, popped: Math.max(0, Math.floor(Number(s.popped) || 0)), toasts: Math.max(0, Math.floor(Number(s.toasts) || 0)) };
}

/**
 * A midnight this player saw (the keepsake hook). online: only the server's word counts
 * (`server` true); solo the page's own. Returns { grant: the year's keepsake is due, badge: count it }.
 */
export function keepsakeDue(state, { year, online = false, server = false } = {}) {
  if (online && !server) return { grant: false, badge: false };
  const y = String(year);
  if (!/^\d{4}$/.test(y)) return { grant: false, badge: false };
  if (state.keepsakes.includes(y)) return { grant: false, badge: true };
  state.keepsakes.push(y);
  state.keepsakes.sort();
  return { grant: true, badge: true };
}

/* ---------------------------------------------------------------- burst */

/**
 * The confetti burst's bits (deterministic for a seed): each { dx, dy (launch px/s), spin, colour,
 * w, h }. Shot up and outwards in a cone, as a party popper's.
 */
export function burstBits(colour = 'mix', n = NEW_UR_PARTY.burstBits, rand = Math.random) {
  const colours = CONFETTI[colour] || CONFETTI.mix;
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const a = (-90 + (rand() - 0.5) * 110) * (Math.PI / 180);
    const v = 260 + rand() * 420;
    out.push({ dx: Math.cos(a) * v, dy: Math.sin(a) * v, spin: (rand() - 0.5) * 14, colour: colours[i % colours.length], w: 4 + rand() * 4, h: 2 + rand() * 2 });
  }
  return out;
}

/** Where a bit is `t` s after the bang (gravity 520 px/s², air drag): { x, y }. */
export function bitAt(bit, t) {
  const drag = Math.exp(-1.6 * t);
  const k = (1 - drag) / 1.6;
  return { x: bit.dx * k + Math.sin(t * 6 + bit.spin) * 6 * t, y: bit.dy * k + 260 * t * t };
}
