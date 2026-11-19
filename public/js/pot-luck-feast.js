/**
 * Pot Luck Day (G982, Austin 2026-11-17), part B: the Harvest Table, the quest Pot's Empty Table,
 * Harvest Stuffing and Pot's Cornucopia (pure rules; the world side is
 * js/features/pot-luck-feast-feature.js, the season's window js/seasons.js pot_luck_day, the
 * chicken costumes lane A's js/pot-luck.js).
 *
 * All of it is ours: Glitch never ran a Thanksgiving event (inventions register: pot-luck-table,
 * pot-luck-quest, pot-luck-stuffing, pot-luck-cornucopia, pot-luck-badges). It leans on Glitch's
 * habits where it can:
 *  - The table stands by the Groddle Forest Junction signpost because players there used to bring
 *    crops on Croppaday, a day Glitch's calendar named and never ran (research/audits-2026-11-17/
 *    seasons/seasons-audit.md). It is Tiny Speck's own rustic table deco, deco_table_wooden_ghtest,
 *    three times, end to end, so it reads as one long feast table.
 *  - A dish goes on by dropping it on the table or by the table's verb, which asks which dish, as a
 *    Still on the ground asks what to distill (still.js verbs.distill, a target-item picker).
 *  - The first offering of a game day pays a little mood and favor with Pot, as a shrine donation
 *    pays favor (capped at the emblem target, stats_add_favor_points), once a game day as the Jack-O-
 *    Lanterns treat once a game day (seasons.js pumpkinTreat).
 *  - The quest is offered by the Magic Rock, as Glitch's one seasonal quest (A Holiday Thing,
 *    glitchmas2010) was, and its keepsake waits with the furniture like a trophy (home-trophies.js).
 *  - When the season ends the table is packed away, as Zilloween's carved pumpkins rotted
 *    (seasons-feature rotPumpkins): its offerings go with it.
 */

export const FEAST_SEASON = 'pot_luck_day';
/** Groddle Forest Junction (assets/streets/GLI3272LOTD1B1F.json). */
export const TABLE_STREET = 'GLI3272LOTD1B1F';
export const TABLE_CLASS = 'pot_luck_harvest_table';
export const TABLE_DECO = 'deco_table_wooden_ghtest';
/**
 * Where the table stands: its middle, 280 px right of the street's hub signpost (signpost_2 at
 * x -291: Hechey Track, Pasha's Place, Northwest Passage, Burnabee). Three tables of the deco's drawn
 * size (186 x 71, rebuilt-rooms.js Gwendolyn's table) end to end: the deco's top is 143 of its 186
 * (its legs splay past it) and its ends are rounded, so they overlap by 66 and the three tops run on as
 * one long board (two held ten dishes only by overlapping them: 2026-11-18, Austin "maybe a bigger table").
 */
export const TABLE_AT = Object.freeze({ x: -11, y: -122, piece: Object.freeze({ w: 186, h: 71 }), overlap: 66, pieces: 3, top: 143 });

/** A dish icon's box on the table (its icon scaled to fit). */
export const DISH_BOX = 34;

/** The five harvest dishes the quest asks for, all existing recipes (recipes.json). */
export const HARVEST_DISHES = Object.freeze(['pumpkin_pie', 'hot_potatoes', 'wavy_gravy', 'corny_fritter', 'potcorn']);

/** The tools that cook (catalog_recipes.js): a dish is a food some recipe of one of these makes. */
export const COOKING_TOOLS = Object.freeze(['frying_pan', 'knife_and_board', 'awesome_pot', 'saucepan', 'mike_tyson_grill', 'famous_pugilist_grill', 'blender', 'cocktail_shaker']);

export const TABLE_RULES = Object.freeze({
  /** Dishes drawn on the table, newest first (left to right): one row, none over another. */
  shown: 12,
  /** Offerings the table remembers to draw (the count goes on past it). */
  keep: 40,
  /** The count on the table's card reads "999+" past this. */
  countCap: 999,
  /** The day's first offering: mood, and favor with Pot (both ours). */
  mood: 10,
  favor: 10,
  giant: 'pot',
});

export const STUFFING = 'harvest_stuffing';
export const KEEPSAKE = 'pots_cornucopia';

/**
 * Harvest Stuffing: an Awesome Pot dish of existing ingredients (ours). Its numbers sit beside
 * Hot Potatoes (8 energy, 19 iMG, 66 base cost) and Potcorn (11, 20, 136), Master Chef I's other
 * Awesome Pot dishes: ingredients worth 47 (a Bun 9 x2, Mushrooms 3 x3, Onions 4 x2, Saffron 12)
 * make a dish worth 72, food at energy_factor 1 (include/food.js), as the others are.
 */
export const STUFFING_ITEM = Object.freeze({
  label: 'Harvest Stuffing',
  namePlural: 'Harvest Stuffings',
  desc: 'Toasted bun, mushrooms and onion, baked golden with a pinch of saffron in a dish meant for sharing. Pot insists there is always room for stuffing. Pot is usually right.',
  baseCost: 72,
  stackMax: 20,
  tags: Object.freeze(['newfood', 'food', 'foodbonus']),
});

export const STUFFING_RECIPE = Object.freeze({
  id: 'pld_harvest_stuffing',
  name: 'Harvest Stuffing',
  tool: 'awesome_pot',
  energyCost: 9,
  xpReward: 18,
  waitMs: 2000,
  inputs: Object.freeze([
    Object.freeze({ classTsid: 'bun', qty: 2 }),
    Object.freeze({ classTsid: 'mushroom', qty: 3 }),
    Object.freeze({ classTsid: 'onion', qty: 2 }),
    Object.freeze({ classTsid: 'saffron', qty: 1 }),
  ]),
  outputs: Object.freeze([Object.freeze({ classTsid: STUFFING, qty: 1 })]),
  skill: 'masterchef_1',
  skills: Object.freeze(['masterchef_1']),
  achievements: Object.freeze([]),
  toolWear: 1,
  taskLimit: 40,
  learnt: 1,
  /** Cooks only during Pot Luck Day (making.js canCraft reads recipe.season, as Pi on Pi Day). */
  season: FEAST_SEASON,
  source: 'ours (G982): Pot Luck Day',
});

/** Pot's Cornucopia: the quest's keepsake, a trophy for the house (js/home-trophies.js). */
export const KEEPSAKE_ITEM = Object.freeze({
  label: 'Pot’s Cornucopia',
  namePlural: 'Pot’s Cornucopias',
  desc: 'A horn of plenty Pot filled for you after the Pot Luck Day feast, spilling with every crop imaginable. It never empties and it never spoils. Display it from the Furniture tab when you Decorate your house.',
});

/** The badge the quest gives, and the keepsake it carries (home-trophies.js BY_BADGE). */
export const FEAST_BADGE = 'pld_feast_bringer';
/** Badge counters (achievements.json): the quest, and each offering laid. */
export const QUEST_COUNTER = 'pld_quest:pots_empty_table';
export const LAID_COUNTER = 'harvest_table:laid';

export const TABLE_LINES = Object.freeze({
  title: 'Harvest Table',
  subtitle: (n) => (n ? `${countText(n)} laid for Pot Luck Day` : 'Bare, for now'),
  verb: 'Lay a dish',
  verbTip: 'Lay a dish or a crop on the table for everyone',
  look: 'Look',
  lookTip: 'See everything on the table',
  listTitle: 'On the Harvest Table',
  listBy: (name, mine) => (mine ? 'laid by you' : `laid by ${name || 'someone'}`),
  listMore: (n) => `and ${n} more laid earlier`,
  pickTitle: 'Lay what?',
  noSeason: 'The Harvest Table is packed away until Pot Luck Day.',
  notDish: 'Only a dish or a crop belongs on the Harvest Table.',
  none: 'You have nothing to lay on the table: bring a dish you cooked or a crop you grew.',
  noItem: (label) => `You have no ${label}.`,
  laid: (label) => `You lay ${label} on the Harvest Table.`,
  laidOther: (who, label) => `${who} lays ${label} on the Harvest Table.`,
  first: 'Pot is pleased: your first offering of the day.',
  already: 'Pot thanks you. Your first offering of the day was already counted.',
  packed: 'Pot Luck Day is over. The Harvest Table has been cleared and packed away until next year.',
  slow: 'Slow down a little.',
  offline: 'The Harvest Table can’t be reached just now. Try again in a moment.',
  look0: 'A long table by the signpost, set for Pot Luck Day. Nobody has laid anything on it yet.',
});

const countText = (n) => {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  return `${v > TABLE_RULES.countCap ? `${TABLE_RULES.countCap}+` : v} ${v === 1 ? 'dish' : 'dishes'}`;
};

/** The table card's count, capped ("999+"). */
export function tableCountLabel(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  return v > TABLE_RULES.countCap ? `${TABLE_RULES.countCap}+` : String(v);
}

/**
 * What a class is on the table: 'dish' (a food a cooking recipe makes), 'crop' or null. A crop is
 * what Glitch called one (items/<crop>.js is_crop = 1, parent crop_base, produced_by_class a
 * seed_*: what a garden seed grows), from cropClasses(SEED_CATALOG), not the item's tags: Pumpkin
 * (pumpkin.js 18, 24, 407) and the seven herbs carry no 'crop' tag. dishes: a Set of the classes a
 * cooking tool makes; crops: a Set of crop classes.
 */
export function layableKind(cls, crops = null, dishes = null) {
  const c = String(cls || '');
  if (!c) return null;
  if (c === STUFFING || HARVEST_DISHES.includes(c) || dishes?.has?.(c)) return 'dish';
  if (crops?.has?.(c)) return 'crop';
  return null;
}

/** The classes a garden seed grows (js/garden.js SEED_CATALOG: { seed: { cropId } }). */
export function cropClasses(seeds = {}) {
  return new Set(Object.values(seeds || {}).map((s) => s?.cropId).filter(Boolean));
}

/** The classes a cooking tool makes, from a recipe catalog ({ key: { tool, outputs } }). */
export function dishClasses(recipes = {}) {
  const out = new Set([STUFFING, ...HARVEST_DISHES]);
  for (const r of Object.values(recipes || {})) {
    if (!r || !COOKING_TOOLS.includes(r.tool)) continue;
    for (const o of r.outputs || []) if (o?.classTsid) out.add(o.classTsid);
  }
  return out;
}

/**
 * Whether a lay may go ahead, in this order: the season, a dish or crop, one in the pack.
 * ctx: { season, kind, have, label }.
 */
export function layCheck(ctx = {}) {
  if (!ctx.season) return { ok: false, code: 'no_season', msg: TABLE_LINES.noSeason };
  if (!ctx.kind) return { ok: false, code: 'not_dish', msg: TABLE_LINES.notDish };
  if (!(Number(ctx.have) > 0)) return { ok: false, code: 'no_item', msg: TABLE_LINES.noItem(ctx.label || 'such thing') };
  return { ok: true };
}

/* ------------------------------------------------------------ table state */

/**
 * The table: { key, rows: [{ c, by, name }], total, counts: { <class>: <lays> }, daily: { <player>: <day> } }.
 * `key` is the season's year (seasons.js seasonYearKey): a table from another year is packed away.
 * `counts` is every lay of the season by class (Thanksgiving Day's feast draws from it, G1009; the
 * server's harvest_table.go keeps the same); a save from before it counts its kept rows.
 */
export function createTableState(seed = {}, key = '') {
  const s = seed && typeof seed === 'object' ? seed : {};
  const rows = Array.isArray(s.rows) ? s.rows.filter((r) => r && typeof r.c === 'string' && r.c).map((r) => ({ c: r.c, by: Number(r.by) || 0, name: typeof r.name === 'string' ? r.name.slice(0, 40) : '' })) : [];
  const daily = s.daily && typeof s.daily === 'object' && !Array.isArray(s.daily) ? { ...s.daily } : {};
  const counts = {};
  if (s.counts && typeof s.counts === 'object' && !Array.isArray(s.counts)) {
    for (const [c, n] of Object.entries(s.counts)) if (c && Math.floor(Number(n)) > 0) counts[c] = Math.floor(Number(n));
  } else {
    for (const r of rows.slice(-TABLE_RULES.keep)) counts[r.c] = (counts[r.c] || 0) + 1;
  }
  const t = { key: typeof s.key === 'string' ? s.key : key, rows: rows.slice(-TABLE_RULES.keep), total: Math.max(rows.length, Math.floor(Number(s.total) || 0)), counts, daily };
  if (key && t.key !== key) return packAway(t, key);
  return t;
}

/** Clear the table (the season ended, or a new year's began): returns the same object, emptied. */
export function packAway(table, key = '') {
  table.key = key;
  table.rows = [];
  table.total = 0;
  table.counts = {};
  table.daily = {};
  return table;
}

/**
 * One offering laid: the row goes on the table and the player's daily marker is set. Returns
 * { row, total, first } where `first` is the player's first offering of game day `day`.
 */
export function layOffering(table, { c, by = 0, name = '', who = 'me', day = '' } = {}) {
  const row = { c: String(c), by: Number(by) || 0, name: String(name || '').slice(0, 40) };
  table.rows.push(row);
  if (table.rows.length > TABLE_RULES.keep) table.rows.splice(0, table.rows.length - TABLE_RULES.keep);
  table.total += 1;
  table.counts ||= {};
  table.counts[row.c] = (table.counts[row.c] || 0) + 1;
  const first = table.daily[who] !== day;
  table.daily[who] = day;
  return { row, total: table.total, first };
}

/**
 * Where each drawn dish stands on the table top, relative to the table's foot middle: one row of
 * fixed slots from the left end of the long board to the right, the newest at the left, so a lay
 * moves the others one slot along and nothing stands on another.
 */
export function dishSpots(n = TABLE_RULES.shown, at = TABLE_AT) {
  const step = at.piece.w - at.overlap;
  const reach = ((at.pieces - 1) * step) / 2 + at.top / 2 - DISH_BOX / 2 - 2;
  const slot = (2 * reach) / Math.max(1, TABLE_RULES.shown - 1);
  const out = [];
  for (let i = 0; i < Math.min(n, TABLE_RULES.shown); i += 1) out.push({ x: Math.round(-reach + i * slot), y: -at.piece.h + 14 });
  return out;
}

/**
 * The table's whole list (its Look, 2026-11-18: what the table cannot draw goes in a list): every
 * offering it keeps, newest first, and how many older ones were laid but are no longer kept.
 */
export function tableList(table) {
  const rows = [...(table?.rows || [])].reverse();
  return { rows, older: Math.max(0, (Math.floor(Number(table?.total)) || 0) - rows.length) };
}

/** The dishes drawn on the table, newest first. */
export function shownRows(table, n = TABLE_RULES.shown) {
  return (table?.rows || []).slice(-n).reverse();
}

/* ------------------------------------------------------------ the quest */

export const QUEST_ID = 'pots_empty_table';
export const DISHES_NEEDED = 3;

/**
 * Pot's Empty Table (ours, in Glitch's voice). Step 1 is the Magic Rock's offer; then three steps
 * the log counts.
 */
export const QUEST = Object.freeze({
  id: QUEST_ID,
  title: 'Pot’s Empty Table',
  kicker: 'Magic Rock',
  offer: Object.freeze([
    Object.freeze({ text: 'Psst. Pot sent word. Pot wants a feast! A big one, with everyone bringing something, at the long table by the signpost in Groddle Forest Junction.', response: 'A feast?' }),
    Object.freeze({ text: 'A feast needs a cook, and Pot thinks that cook is you. Cook three harvest dishes: Pumpkin Pie, Hot Potatoes, Wavy Gravy, Corny Fritter or Potcorn, any three you like. Dress a Chicken up for the occasion. Then lay your dishes on the Harvest Table.', response: 'Pot can count on me' }),
  ]),
  steps: Object.freeze([
    Object.freeze({ id: 'dishes', desc: 'Cook harvest dishes (Pumpkin Pie, Hot Potatoes, Wavy Gravy, Corny Fritter or Potcorn)', num: DISHES_NEEDED }),
    Object.freeze({ id: 'dressed', desc: 'Dress a Chicken for the feast', num: 1 }),
    Object.freeze({ id: 'laid', desc: 'Lay harvest dishes on the Harvest Table in Groddle Forest Junction', num: DISHES_NEEDED }),
  ]),
  completion: 'Now THAT is a table! Pot has not looked this happy since gravy was first poured. Pot sends you this, a horn of plenty to keep at home, so your house never forgets the feast.',
  rewards: Object.freeze({ favor: Object.freeze({ giant: 'pot', points: 25 }), xp: 50 }),
  accepted: 'Pot’s Empty Table: cook three harvest dishes, dress a Chicken, and lay your dishes on the Harvest Table in Groddle Forest Junction.',
  stepDone: Object.freeze({
    dishes: 'Three harvest dishes ready for Pot’s table.',
    dressed: 'One Chicken, dressed for dinner.',
    laid: 'Your dishes are on the Harvest Table.',
  }),
});

/** The player's run of the quest this season: { key, status: '' | 'offered' | 'active' | 'done', dishes, dressed, laid }. */
export function createQuestState(seed = {}, key = '') {
  const s = seed && typeof seed === 'object' ? seed : {};
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const q = {
    key: typeof s.key === 'string' ? s.key : key,
    status: ['offered', 'active', 'done'].includes(s.status) ? s.status : '',
    dishes: n(s.dishes, DISHES_NEEDED),
    dressed: n(s.dressed, 1),
    laid: n(s.laid, DISHES_NEEDED),
  };
  // A quest from an earlier year starts over; a finished one stays finished (the badge is kept).
  if (key && q.key !== key && q.status !== 'done') return { key, status: '', dishes: 0, dressed: 0, laid: 0 };
  return q;
}

/** The log's rows: [{ id, desc, current, num }]. */
export function questRows(q) {
  return QUEST.steps.map((s) => ({ id: s.id, desc: s.desc, current: Math.min(s.num, Number(q?.[s.id]) || 0), num: s.num }));
}

/**
 * The quest for a pin (game.js renderPinnedQuests, the Quests card's head): its title and steps
 * while it runs this season, else null, so a pin of it goes once it is done or the season ends.
 */
export function questPinInfo(q, seasonOn) {
  if (!seasonOn || q?.status !== 'active') return null;
  return { title: QUEST.title, requirements: questRows(q) };
}

export const questComplete = (q) => QUEST.steps.every((s) => (Number(q?.[s.id]) || 0) >= s.num);

/**
 * A game event while the quest runs: `making_recipe:<dish>` (a harvest dish made),
 * `chicken_dressed:<costume>` (lane A's counter) or the table's own laid event
 * ({ laid: cls }). Returns { step, done } where step names a step just finished, and done the quest
 * now complete (its turn-in is the caller's).
 */
export function questEvent(q, event, detail = {}) {
  if (!q || q.status !== 'active') return { step: null, done: false };
  const e = String(event || '');
  let step = null;
  const bump = (id, num) => {
    if (q[id] >= num) return;
    q[id] += 1;
    if (q[id] >= num) step = id;
  };
  const made = e.match(/^making_recipe:(.+)$/)?.[1];
  if (made && HARVEST_DISHES.includes(made)) bump('dishes', DISHES_NEEDED);
  else if (/^chicken_dressed(?::|$)/.test(e)) bump('dressed', 1);
  else if (e === 'harvest_table:laid' && HARVEST_DISHES.includes(String(detail?.cls || ''))) bump('laid', DISHES_NEEDED);
  return { step, done: questComplete(q) };
}

/**
 * The season's five badges (ours, Austin 2026-11-17; art approved the same day, the lineup in
 * research/art-briefs/pot-luck-badges-2026-11-17/lineup-1x.png). achievements.json's shape;
 * tools/achievement-overrides.mjs adds them to the catalog, so a content rebuild keeps them.
 * Rewards sit beside Zilloween's Tricksy-Treater ladder (100 iMG and 15 favor for its first rung).
 */
const badge = (classTsid, name, desc, statusText, cond, rewards) => Object.freeze({
  classTsid,
  name,
  desc,
  statusText,
  category: 'seasonal',
  url: classTsid.replace(/^pld_/, '').replace(/_/g, '-'),
  isSecret: false,
  conditions: Object.freeze([Object.freeze({ id: classTsid, ...cond, desc: cond.name })]),
  rewards: Object.freeze({ xp: rewards[0], favor: Object.freeze({ giant: 'pot', points: rewards[1] }) }),
  icons: Object.freeze({}),
});

const dressed = (n) => Object.freeze({ type: 'group_sum', group: 'chicken_dressed', name: 'chicken_dressed', num: n });

export const FEAST_BADGES = Object.freeze({
  pld_feast_bringer: badge('pld_feast_bringer', 'Feast Bringer', 'Set Pot’s Empty Table for the Pot Luck Day feast',
    'Three dishes cooked, one Chicken dressed and a table laid. Pot, Giant of plenty, is very nearly full. Very nearly.',
    { type: 'counter', group: 'pld_quest', name: 'pots_empty_table', num: 1 }, [100, 15]),
  pld_plume_fluffer_1: badge('pld_plume_fluffer_1', 'Plume Fluffer I', 'Dressed 5 Chickens up for Pot Luck Day',
    'Five Chickens, fluffed, plumed and feeling fabulous. They will never admit it, but they love it.',
    dressed(5), [50, 5]),
  pld_plume_fluffer_2: badge('pld_plume_fluffer_2', 'Plume Fluffer II', 'Dressed 23 Chickens up for Pot Luck Day',
    'Twenty-three Chickens in their festive finest. Somewhere a Rooster Plume shortage is being reported.',
    dressed(23), [100, 10]),
  pld_plume_fluffer_3: badge('pld_plume_fluffer_3', 'Plume Fluffer III', 'Dressed 61 Chickens up for Pot Luck Day',
    'Sixty-one Chickens dressed for dinner. The Chickens have formed a fan club. You are its only topic.',
    dressed(61), [200, 20]),
  pld_good_neighbor: badge('pld_good_neighbor', 'Good Neighbor', 'Laid 11 dishes or crops on the Harvest Table',
    'Eleven offerings on the Harvest Table, all of them yours. The whole street ate well, and the whole street knows who to thank.',
    { type: 'counter', group: 'harvest_table', name: 'laid', num: 11 }, [100, 15]),
});

/** Item paths for the supply reports (js/seasons.js seasonalSources' shape). */
export function feastSources() {
  return [
    [KEEPSAKE, 'season:pot_luck_quest'],
  ];
}
