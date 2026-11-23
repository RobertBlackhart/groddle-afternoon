/**
 * Pot Luck Day (G982, Austin 2026-11-17), part A: the chicken costumes (pure rules; the world
 * side is js/features/pot-luck-feature.js, the season's window js/seasons.js pot_luck_day).
 *
 * All of it is ours: Glitch never ran a Thanksgiving event and never dressed an animal
 * (inventions register: designed-seasons, pot-luck-costumes, pot-luck-fancy-feather). It
 * follows Glitch's habits where it can: a costume goes on by dropping it on the Chicken, or by a
 * verb on the Chicken that takes one from the pack, as a Rook Balm or a Potion of Animal Youth does
 * (js/world-drop.js; npc_chicken.js verbs.apply_balm, potion_animal_youth.js); the Toy Vendor
 * stocks it for the season as it stocked Glitchmas Crackers (js/seasons.js SEASONAL_STOCK); a
 * season's leftovers rot when it ends, as carved pumpkins did after Zilloween
 * (seasons-feature rotPumpkins, items/pumpkin_carved_*.js).
 *
 * Rules (ours):
 *  - Only during Pot Luck Day, only a street Chicken. A dressed Chicken can be re-dressed in the
 *    other costume (G1181, Austin 2026-11-23), never in the one it wears. When the season ends
 *    every costume falls off, for everyone (the server holds each street Chicken's costume
 *    online, the save solo).
 *  - Dressing uses up the costume and counts `chicken_dressed:<costume>` (lane B's Plume Fluffer
 *    badges and Pot's Empty Table read it). Each player counts each Chicken once (G1181): a
 *    Chicken you dressed is yours for the season, so re-dressing cannot be farmed. The record is
 *    the player's own (the feature's save slice, `counted`), solo and online.
 *  - Squeezing a dressed Chicken, when the squeeze lands, drops a Fancy Feather one time in four,
 *    at most five a game day. Fancy Feathers rot into Lumps of Loam (Tiny Speck's loam) when the
 *    season ends.
 */

export const POT_LUCK_SEASON = 'pot_luck_day';
export const COSTUME_CLASSES = Object.freeze(['turkey_tailfan', 'rooster_plume']);
export const FANCY_FEATHER = 'fancy_feather';
/** What a Fancy Feather rots into when the season ends: Tiny Speck's Lump of Loam (items/loam.js). */
export const FEATHER_ROTS_TO = 'loam';
/** The badge counter a dressing counts (group:label; the label is the costume). */
export const DRESS_COUNTER = 'chicken_dressed';
/** Verb ids on a Chicken: `potluck:dress:<costume>`, and the plain row that only says why not. */
export const DRESS_VERB = 'potluck:dress';

/** Our items (no GSJS file): the two costumes the Toy Vendor sells and the feather. */
export const POT_LUCK_ITEMS = Object.freeze({
  turkey_tailfan: Object.freeze({
    label: 'Turkey Tailfan',
    namePlural: 'Turkey Tailfans',
    desc: 'A paper-plate tail fan with card feathers glued round it and a string to tie it on. Put it on a Chicken and, for one week a year, that Chicken is a turkey. Do not tell the Chicken.',
    baseCost: 150,
    stackMax: 11,
  }),
  rooster_plume: Object.freeze({
    label: 'Rooster Plume',
    namePlural: 'Rooster Plumes',
    desc: 'A tall red comb on elastic and a sweeping plume of sickle feathers. Any Chicken wearing it believes it is a rooster, and struts accordingly.',
    baseCost: 150,
    stackMax: 11,
  }),
  fancy_feather: Object.freeze({
    label: 'Fancy Feather',
    namePlural: 'Fancy Feathers',
    // G1152 (chat): players asked what the feathers are for. Nothing makes them into anything: say so.
    desc: 'A feather that floated off a Chicken in its Pot Luck Day finery. Terribly fancy, and just for show: keep it, or sell it to any vendor. When Pot Luck Day ends it turns into a Lump of Loam.',
    baseCost: 12,
    stackMax: 50,
  }),
});

/** The Toy Vendor's season stock (js/seasons.js SEASONAL_STOCK reads it): price in currants. */
export const POT_LUCK_STOCK = Object.freeze({
  toys: Object.freeze(COSTUME_CLASSES.map((classTsid) => Object.freeze({ classTsid, label: POT_LUCK_ITEMS[classTsid].label, cost: POT_LUCK_ITEMS[classTsid].baseCost }))),
});

export const FEATHER = Object.freeze({ chance: 0.25, dailyMax: 5 });

export const POT_LUCK_LINES = Object.freeze({
  dressed: Object.freeze({
    turkey_tailfan: 'You tie a Turkey Tailfan on the Chicken. It fluffs up and gobbles, badly.',
    rooster_plume: 'You fit the Chicken with a Rooster Plume. It struts like it owns the street.',
  }),
  dressedOther: 'Somebody dressed this Chicken for Pot Luck Day.',
  noSeason: 'Chickens only dress up for Pot Luck Day.',
  noItem: 'You need a Turkey Tailfan or a Rooster Plume. The Toy Vendor has them for Pot Luck Day.',
  /** G1181: re-dressing in the costume it already wears (the server says the same, objects_costumes.go). */
  same: (cls) => `This Chicken is already wearing a ${costumeLabel(cls)}.`,
  /** G1181: a dressed Chicken, and you carry only the costume it wears (or none). */
  wearing: (cls) => `This Chicken is wearing a ${costumeLabel(cls)}. A ${costumeLabel(otherCostume(cls))} would dress it again.`,
  /** G1181: you dressed this Chicken already this season; it counts once. */
  counted: 'You have dressed this Chicken already. Each Chicken counts once for Pot Luck Day.',
  notChicken: 'Only a Chicken will wear that.',
  /** Your own Chickens and a yard's stay home: only the street's dress up (ours, the feast is the remake's). */
  streetOnly: 'Only a Chicken out on the streets can dress up for Pot Luck Day.',
  notCostume: "That isn't something a Chicken can wear.",
  feather: 'A Fancy Feather floats down from the Chicken\'s costume. You catch it.',
  fellOff: 'Pot Luck Day is over. The Chickens shrug off their costumes.',
  rot: (n) => `Pot Luck Day is over, and your Fancy Feather${n === 1 ? ' has' : 's have'} gone the way of all fancy things. You are left with ${n === 1 ? 'a Lump' : `${n} Lumps`} of Loam.`,
  tip: 'Dress this Chicken up for Pot Luck Day',
});

export const isCostume = (cls) => COSTUME_CLASSES.includes(cls);
export const costumeLabel = (cls) => POT_LUCK_ITEMS[cls]?.label || '';
/** The costume a Chicken wearing `cls` could be re-dressed in (G1181). */
export const otherCostume = (cls) => COSTUME_CLASSES.find((c) => c !== cls) || '';

/**
 * Dress check, in this order. ctx: { season (Pot Luck Day on), classId (the target's), street
 * (a street Chicken, not one of your own animals), costume (what it wears now, or ''), cls (the
 * costume offered), have (how many of it the pack holds), counted (you dressed this Chicken
 * already this season) }. { ok } or { ok: false, code, msg }.
 */
export function dressCheck(ctx = {}) {
  if (ctx.classId !== 'npc_chicken') return { ok: false, code: 'not_chicken', msg: POT_LUCK_LINES.notChicken };
  if (ctx.street === false) return { ok: false, code: 'not_street', msg: POT_LUCK_LINES.streetOnly };
  if (!ctx.season) return { ok: false, code: 'no_season', msg: POT_LUCK_LINES.noSeason };
  if (!isCostume(ctx.cls)) return { ok: false, code: 'not_costume', msg: POT_LUCK_LINES.notCostume };
  if (ctx.counted) return { ok: false, code: 'counted', msg: POT_LUCK_LINES.counted };
  if (ctx.costume && ctx.costume === ctx.cls) return { ok: false, code: 'same', msg: POT_LUCK_LINES.same(ctx.cls) };
  if (!((Number(ctx.have) || 0) > 0)) return { ok: false, code: 'no_item', msg: POT_LUCK_LINES.noItem };
  return { ok: true };
}

/** Why a street Chicken's plain Dress up row is greyed (G1181): counted, wearing, or nothing to wear. */
export function dressWhy({ costume = '', counted = false } = {}) {
  if (counted) return POT_LUCK_LINES.counted;
  if (costume) return POT_LUCK_LINES.wearing(costume);
  return POT_LUCK_LINES.noItem;
}

/**
 * The dress rows a street Chicken's menu gets during the season: one per costume in the pack it
 * could wear (`potluck:dress:<costume>`), or one disabled row that says why not (none in the
 * pack). A dressed Chicken offers only the other costume, and only while you carry it and have
 * not dressed that Chicken yourself (`counted`, G1181); else the disabled row says why. Off season:
 * none. Your own or a yard's Chicken (`street` false) gets the rows greyed while you carry a
 * costume, saying only a street Chicken dresses up; none without one.
 */
export function dressVerbs({ season = false, costume = '', inv = {}, street = true, counted = false } = {}) {
  if (!season) return [];
  const owned = COSTUME_CLASSES.filter((cls) => (Number(inv?.[cls]) || 0) > 0);
  if (!street) return owned.map((cls) => ({ id: `${DRESS_VERB}:${cls}`, label: `Dress in ${costumeLabel(cls)}`, enabled: false, reason: POT_LUCK_LINES.streetOnly, tooltip: POT_LUCK_LINES.tip, durationMs: 0 }));
  const wearable = counted ? [] : owned.filter((cls) => cls !== costume);
  if (!wearable.length) return [{ id: DRESS_VERB, label: 'Dress up', enabled: false, reason: dressWhy({ costume, counted }), tooltip: POT_LUCK_LINES.tip, durationMs: 0 }];
  return wearable.map((cls) => ({ id: `${DRESS_VERB}:${cls}`, label: `Dress in ${costumeLabel(cls)}`, enabled: true, reason: '', tooltip: POT_LUCK_LINES.tip, durationMs: 0 }));
}

/** The costume a dress verb id names, or ''. */
export function dressVerbCostume(verbId) {
  const m = /^potluck:dress:([a-z_]+)$/.exec(String(verbId || ''));
  return m && isCostume(m[1]) ? m[1] : '';
}

/**
 * A squeeze that landed on a Chicken: does a Fancy Feather drop? Only from a dressed one, one in
 * four, five a game day. `row` is today's count ({ day, n }); it is counted when one drops.
 */
export function featherDrop(row, { dressed = false, dayKey = '', rng = Math.random } = {}) {
  if (!dressed) return false;
  if (row.day !== dayKey) {
    row.day = dayKey;
    row.n = 0;
  }
  if (row.n >= FEATHER.dailyMax) return false;
  if (!(rng() < FEATHER.chance)) return false;
  row.n += 1;
  return true;
}

/**
 * The chicken sheets a costume is drawn on (tools/pot-luck-art/build.mjs renders them): each
 * chicken sheet the game plays, its clip, and its layout (cells fw x fh in `cols` columns;
 * packed: its cell index is the packed cell's). A costume sheet keeps the same cells in the
 * same columns, each a full 148 x 110 OGA cell.
 */
export const CHICKEN_SHEETS = Object.freeze([
  ['walk', 'assets/sprites/npc_chicken__x1_walk_png_1354830385.webp', 148, 110, 6, 24],
  ['pecking_once', 'assets/sprites/npc_chicken__x1_pecking_once_png_1354830398.webp', 148, 110, 6, 32],
  ['sit', 'assets/sprites/animals/npc_chicken_sit.webp', 148, 110, 5, 20],
  ['stand', 'assets/sprites/animals/npc_chicken_stand.webp', 148, 110, 1, 1],
  ['flying', 'assets/sprites/animals/npc_chicken_flying.webp', 148, 110, 6, 42],
  ['flying_no_feathers', 'assets/sprites/animals/npc_chicken_flying_no_feathers.webp', 148, 110, 6, 42],
  ['land', 'assets/sprites/animals/npc_chicken_land.webp', 148, 110, 5, 25],
  ['idle1', 'assets/sprites/animals/npc_chicken_idle1.webp', 76, 67, 7, 49],
  ['idle2', 'assets/sprites/animals/npc_chicken_idle2.webp', 74, 88, 7, 45],
  ['idle3', 'assets/sprites/animals/npc_chicken_idle3.webp', 77, 74, 7, 56],
  ['pause', 'assets/sprites/animals/npc_chicken_pause.webp', 60, 71, 7, 42],
  ['pecking_twice', 'assets/sprites/animals/npc_chicken_pecking_twice.webp', 71, 68, 5, 29],
  ['verb', 'assets/sprites/animals/npc_chicken_verb.webp', 69, 74, 6, 30],
].map(([clip, path, fw, fh, cols, frames]) => Object.freeze({ clip, path, fw, fh, cols, frames })));

export const COSTUME_CELL = Object.freeze([148, 110]);

/** A costume's sheet for one chicken clip (public/ path). */
export const costumeSheetPath = (costume, clip) => `assets/sprites/seasons/pot-luck/chicken_${costume}_${clip}.webp`;

/** Every costume sheet as a plain sheet def ({ path, fw, fh, cols, frames }), by costume then clip. */
export const COSTUME_SHEETS = Object.freeze(Object.fromEntries(COSTUME_CLASSES.map((costume) => [costume, Object.freeze(Object.fromEntries(CHICKEN_SHEETS.map((s) => [s.clip, Object.freeze({ path: costumeSheetPath(costume, s.clip), fw: COSTUME_CELL[0], fh: COSTUME_CELL[1], cols: s.cols, frames: s.frames })])))])));

const BY_PATH = new Map(CHICKEN_SHEETS.map((s) => [s.path, s]));

/**
 * PURE: where a chicken frame's costume twin sits. `url` is the chicken sheet the frame was cut
 * from (the 1x name), `frame` its rectangle there ({ x, y } in 1x px). Returns { path, x, y, w, h }
 * (the costume sheet and its full cell) or null when the frame is not from a chicken sheet.
 */
export function costumeFrame(costume, url, frame) {
  const s = BY_PATH.get(String(url || '').replace(/^\.?\//, '').replace(/[?#].*$/, ''));
  if (!s || !isCostume(costume) || !frame) return null;
  const k = Math.round(Number(frame.y) / s.fh) * s.cols + Math.round(Number(frame.x) / s.fw);
  if (!(k >= 0 && k < s.frames)) return null;
  const [w, h] = COSTUME_CELL;
  return { path: costumeSheetPath(costume, s.clip), x: (k % s.cols) * w, y: Math.floor(k / s.cols) * h, w, h };
}
