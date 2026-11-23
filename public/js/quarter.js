/**
 * The Quarter: a shared street of player house lots (register G1186, Austin 2026-11-23: option A
 * of research/coverage/neighbourhoods-2026-11-23.md). Pure rules and the street builder (no Pixi,
 * no DOM); tools/build-rebuilt-rooms.mjs writes the street JSON and the QUARTER signpost on the
 * parent street, features/quarter-feature.js draws the lots, and the claims are the site's
 * (groddle-afternoon-site src/Quarter.php) and the realtime server's (quarter.go).
 *
 * What survives of Glitch's quarters (GameServerJS, CC0):
 * - groups/quarter.js: a quarter is a grid of block streets off one parent street. A block is
 *   named "<Name> Quarter, <x><y>00 block" (generate_label 444-460) and its houses
 *   "<x><y>## <Name> Quarter" (generate_pol_label 462-476), ## the lot's number on the template.
 * - locations/quarter.js create_pols_from_markers 91: each lot_marker on the block's template
 *   becomes a numbered house; its signposts all lead back to the quarter's exit
 *   (get_exit_position 63-84).
 * - The parent street's QUARTER signpost: glitch-client SignpostView.as render 211-238 (the
 *   signpost_quarter_arm board, 85 tall and at least 150 wide, with the quarter's name and the
 *   signpost_quarter_grid on it), QuarterInfo.as (style, label, rows, cols).
 * - locations/inc_pols.js pols_canBuy 15-63 (one house per player: has_other) and
 *   players/inc_houses.js houses_familiar_no_owner 318-361 (the familiar's "This location is for
 *   sale!" at a house with no owner).
 * - The lot numbers: a block of ten numbered x5 (Koita Clutter Quarter, 3300 block, houses 3305
 *   to 3395: reference video zOpNCk8f-fs).
 *
 * What does not survive: every live quarter street (they were made at run time and deleted in
 * 2012) and 54 of the 55 templates. So the block is laid on Whipping Cross Crossing
 * (GLI11TJJ7871GF3, hub 28 Old Groddle Forest), one of the twelve archived meadow lot streets
 * (tinyspeck/glitch-locations, CC0): its sky, hills, trees and flat ground as they are, its ten
 * meadow house decos as the ten lots' For Sale houses, in its own order. The lots are spaced
 * wider (565 px) because a player's house (G796, js/home-house.js) is up to 562 px wide.
 *
 * The remake's own (inventions: shared-quarter-lots):
 * - Marylpole Mount Quarter, 1100 block: Marylpole Mount (Groddle Meadow) had a quarter (a
 *   player's snap of its 3400 block), so the remake's quarter hangs off the same street; the
 *   block is the grid's first, (1,1).
 * - A lot shows the house its owner chose for their home street (G796) and leads there through
 *   the visit (G328): no second house, no interior. Claiming is free (G208 dropped papers and
 *   currants for the free home street), one lot per player, and giving one up puts it back on
 *   sale (Glitch sold it back at 80%, pols_sellHouse 126).
 * - Solo: your own lot and the For Sale houses, no made-up neighbours.
 */

/** The block street (a remake tsid: no quarter street survives). */
export const QUARTER_TSID = 'GQRMM1100BLOCK1';
/** The parent street: Marylpole Mount, Groddle Meadow. */
export const QUARTER_PARENT_TSID = 'GLI32HBOUTD1GQV';
/** The archived lot street the block is laid on (CC0 geometry and decos). */
export const QUARTER_TEMPLATE_TSID = 'GLI11TJJ7871GF3';

/** groups/quarter.js init: the quarter's name, style and grid. */
export const QUARTER = Object.freeze({
  name: 'Marylpole Mount Quarter',
  style: 'normal',
  cols: 1,
  rows: 1,
  block: Object.freeze({ x: 1, y: 1 }),
});

/** The template's lot numbers (##): ten, x5 as on Koita Clutter Quarter's 3300 block. */
export const QUARTER_LOT_NUMBERS = Object.freeze([5, 15, 25, 35, 45, 55, 65, 75, 85, 95]);

/** The block's ground (Whipping Cross Crossing's one platform, y -84). */
export const QUARTER_GROUND_Y = -84;
/**
 * The first lot's foot and the step between lots: a house reaches at most 282 px either side of
 * its foot (the Shipwreck, home-house.js houseLot), so two never touch whichever way they face.
 */
export const QUARTER_LOT_X0 = -2400;
export const QUARTER_LOT_STEP = 565;
/** The block's signpost back to Marylpole Mount (its left end, as the template's signpost_2). */
export const QUARTER_SIGN_X = -2750;
/** Marylpole Mount's QUARTER signpost: on its flat left end, clear of signpost_2 at -2865. */
export const QUARTER_PARENT_SIGN_X = -2300;
export const QUARTER_PARENT_SIGN_ID = 'signpost_quarter';
export const QUARTER_BLOCK_SIGN_ID = 'signpost_quarter_exit';

/**
 * Glitch's words, and the remake's where Glitch had none.
 */
export const QUARTER_TEXT = Object.freeze({
  forSale: 'This location is for sale!', // inc_houses.js:336
  // inc_houses.js:344, "sell" and "buy" as "give up" and "claim": a lot is free here.
  hasOther: "This location is for sale. You already own a location, which you'll need to give up before you can claim a new one.",
  noHome: 'You need a home street first.', // ours (groddle-afternoon-site Neighbours TEXT_NO_HOME)
  newxp: "You can't do that until you finish the tutorial.", // inc_houses.js admin_houses_visit 'newxp_us'
  taken: 'Someone else has just claimed that lot.', // ours
  none: "You don't have a lot in the Quarter.", // ours
  off: 'The Quarter can not be reached right now.', // ours
  busy: 'Wait a moment, the Quarter is still answering.', // ours
  claimed: (label) => `${label} is yours! Its front leads to your home street.`, // ours
  released: (label) => `You gave up ${label}. It is for sale again.`, // ours
  owned: (name) => `Owned by ${name}`, // doors.js doorTooltip: "Owned by <owner_label>"
  claimVerb: 'Claim this lot', // ours (Glitch: "Purchase location for N currants")
  claimTip: 'This location is for sale! It is free, one lot per player.', // ours
  giveUpVerb: 'Give up this lot', // ours
  homeVerb: 'Go to your home street', // ours
});

const pad2 = (n) => String(Math.max(0, Math.floor(Number(n) || 0))).padStart(2, '0');

/** generate_label: "<Name> Quarter, <x><y>00 block". */
export function blockLabel(name = QUARTER.name, x = QUARTER.block.x, y = QUARTER.block.y) {
  return `${name}, ${x}${y}00 block`;
}

/** generate_pol_floor + the template number: the number on the door (1105). */
export function lotNumber(num, x = QUARTER.block.x, y = QUARTER.block.y) {
  return Number(`${x}${y}${pad2(num)}`);
}

/** generate_pol_label with ## filled: "1105 Marylpole Mount Quarter". */
export function lotLabel(lot, name = QUARTER.name) {
  return `${lot} ${name}`;
}

/** The block's lot numbers on its doors: 1105 .. 1195. */
export const QUARTER_LOTS = Object.freeze(QUARTER_LOT_NUMBERS.map((n) => lotNumber(n)));

/** A lot number this block has. */
export function isQuarterLot(lot, lots = QUARTER_LOTS) {
  return Number.isInteger(lot) && lots.includes(lot);
}

/** True for the block under either tsid prefix. */
export function isQuarterTsid(tsid) {
  const s = String(tsid || '');
  return s.length > 1 && s.slice(1) === QUARTER_TSID.slice(1);
}

/**
 * The lots as the site or server lists them ({ lot, owner: { id, name } | null, house, style }),
 * as a Map lot -> { owner, house, style } of the claimed ones on this block. Rows for lots the
 * block does not have, or with no owner, are dropped.
 */
export function normalizeLots(rows, lots = QUARTER_LOTS) {
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const lot = Number(row?.lot);
    const id = Number(row?.owner?.id);
    if (!isQuarterLot(lot, lots) || !Number.isInteger(id) || id <= 0 || out.has(lot)) continue;
    const name = typeof row.owner.name === 'string' && row.owner.name ? row.owner.name.slice(0, 32) : 'Someone';
    const house = row.house && typeof row.house === 'object' && typeof row.house.chassis === 'string' ? row.house : null;
    const style = typeof row.style === 'string' ? row.style : 'meadow';
    out.set(lot, { owner: { id, name }, house, style });
  }
  return out;
}

/** The lot `me` holds, or 0. */
export function lotOf(lots, me) {
  for (const [lot, row] of lots || []) if (row?.owner?.id === me) return lot;
  return 0;
}

/** Owners per lot, for telling whether two tables differ ("1105:7,1115:9"). */
export function lotsKey(lots) {
  return [...(lots || new Map())].sort((a, b) => a[0] - b[0]).map(([lot, r]) => `${lot}:${r.owner.id}`).join(',');
}

/**
 * pols_canBuy for a lot here (the site and the server check the same): null when `me` may claim
 * it, else why: 'lot' (no such lot), 'taken' (owned, inc_pols.js 24-29), 'have' (has_other, 31-36),
 * 'no_home' (the front leads to a home street: none yet), 'newxp' (still in the tutorial).
 */
export function judgeClaim({ lots, me, lot, hasHome = true, tutorial = false, all = QUARTER_LOTS } = {}) {
  if (!isQuarterLot(lot, all)) return 'lot';
  const held = lots?.get?.(lot);
  if (held && held.owner?.id !== me) return 'taken';
  if (held) return null; // already yours: asking again answers the same
  if (lotOf(lots, me)) return 'have';
  if (tutorial) return 'newxp';
  if (!hasHome) return 'no_home';
  return null;
}

/** The words for a refusal. */
export function refusalText(why) {
  return {
    taken: QUARTER_TEXT.taken,
    have: QUARTER_TEXT.hasOther,
    no_home: QUARTER_TEXT.noHome,
    newxp: QUARTER_TEXT.newxp,
    none: QUARTER_TEXT.none,
    busy: QUARTER_TEXT.busy,
  }[why] || QUARTER_TEXT.off;
}

/** The solo slice: the lot you hold (0: none). */
export function normalizeQuarterSlice(slice) {
  const lot = Number(slice?.lot);
  return { lot: isQuarterLot(lot) ? lot : 0 };
}

/* ------------------------------------------------------------------ */
/* The street                                                          */
/* ------------------------------------------------------------------ */

const clone = (v) => JSON.parse(JSON.stringify(v));

/** The ten lots: number, foot and the template's meadow house deco (its For Sale art), in order. */
export function quarterLots(template) {
  const doors = [...(template.doors || [])].sort((a, b) => a.x - b.x);
  if (doors.length !== QUARTER_LOTS.length) throw new Error(`${template.label} has ${doors.length} house lots, not ${QUARTER_LOTS.length}`);
  return QUARTER_LOTS.map((lot, i) => ({
    lot,
    x: QUARTER_LOT_X0 + i * QUARTER_LOT_STEP,
    y: QUARTER_GROUND_Y,
    sprite: doors[i].sprite,
    w: doors[i].w,
    h: doors[i].h,
  }));
}

/** QuarterInfo as the parent's signpost carries it (style, label, cols, rows). */
export function quarterInfo() {
  return { style: QUARTER.style, label: QUARTER.name, cols: QUARTER.cols, rows: QUARTER.rows };
}

/**
 * The block street: Whipping Cross Crossing's layers and ground, no doors (the lots are
 * features/quarter-feature.js's), one signpost back to Marylpole Mount.
 * @param {object} template the GLI11TJJ7871GF3 street JSON
 * @param {{ parentArrive: { x: number, y: number } }} at where the way out lands (Marylpole Mount's screen space)
 */
export function quarterStreet(template, { parentArrive }) {
  const layers = clone(template.layers);
  const platforms = clone(template.platforms);
  const lots = quarterLots(template);
  const label = blockLabel();
  return {
    source: `reconstruction: ${label} (not in tinyspeck/glitch-locations: quarters were made at run time); Whipping Cross Crossing's geometry and decos (GLI11TJJ7871GF3, tinyspeck/glitch-locations locations-xml.zip, CC0) with its ten meadow house decos as the lots`,
    reconstructed: true,
    tsid: QUARTER_TSID,
    label,
    hubId: '58',
    hubName: 'Groddle Meadow',
    swf_file: template.swf_file,
    bounds: { ...template.bounds },
    gradient: { ...template.gradient },
    platforms,
    layers,
    signposts: [{
      id: QUARTER_BLOCK_SIGN_ID,
      x: QUARTER_SIGN_X,
      y: QUARTER_GROUND_Y,
      w: 150,
      h: 200,
      connects: [{ tsid: `L${QUARTER_PARENT_TSID.slice(1)}`, label: 'Marylpole Mount', hub_id: '58', arrive: { ...parentArrive } }],
    }],
    quarter: { ...quarterInfo(), block: { ...QUARTER.block }, parent: QUARTER_PARENT_TSID, lots },
    stats: {
      platformCount: platforms.length,
      layerCount: layers.length,
      decoCount: layers.reduce((n, l) => n + (l.decos?.length || 0), 0),
      signpostCount: 1,
      doorCount: 0,
      ladderCount: 0,
      barrierCount: 0,
    },
    why: {
      street: 'groups/quarter.js and locations/quarter.js: quarter blocks were cloned from templates at run time; none was archived, and 54 of the 55 templates are lost.',
      geometry: "Whipping Cross Crossing (hub 28), an archived meadow street of ten numbered house lots: its sky, hills, trees and flat ground as they are.",
      lots: 'Its ten meadow house decos, in order, as the For Sale houses; spaced 565 px apart for the players\' houses (G796). Numbers x5 as on Koita Clutter Quarter, 3300 block (video zOpNCk8f-fs).',
      name: "generate_label: '<Name> Quarter, <x><y>00 block'. Marylpole Mount had a quarter (a player's snap of its 3400 block); this is the grid's first block.",
      wayOut: 'get_exit_position: every signpost on a block leads to the quarter exit, here Marylpole Mount beside its QUARTER signpost.',
    },
  };
}

/** The parent's QUARTER signpost: one connect, the block (LocationSelectorDialog lists the blocks). */
export function quarterSignpost({ y, arrive }) {
  return {
    id: QUARTER_PARENT_SIGN_ID,
    x: QUARTER_PARENT_SIGN_X,
    y,
    w: 150,
    h: 200,
    quarter: quarterInfo(),
    connects: [{ tsid: `L${QUARTER_TSID.slice(1)}`, label: blockLabel(), hub_id: '58', arrive: { ...arrive } }],
  };
}

export const quarterIndexEntry = (street) => ({
  label: street.label,
  file: `assets/streets/${street.tsid}.json`,
  hubId: street.hubId,
  hubName: street.hubName,
  platforms: street.platforms.length,
  decos: street.stats.decoCount,
  reconstructed: true,
});
