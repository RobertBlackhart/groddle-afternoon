/**
 * Symphonious Maximus, the hidden Uralia street behind Cebarkul's wooden
 * door, rebuilt (pure data and a builder: no Pixi, no DOM).
 *
 * What survives in source:
 * - GSJS inc_data_maps_prod.js 16034: hub 51 "Uralia" lists
 *   LUVR3SGQ6EF3400 "Symphonious Maximus" among its streets, but the Uralia
 *   map (maps_get_maps_51, 2135) never draws it: a hidden street. No location
 *   XML for it is in the public dump and nothing in GSJS names it again.
 * - Cebarkul's archived location (streets/mnt/stos/location_data/
 *   GIF12PMQ5121D68.xml) holds door_1354232290656 (added 2012-11-30, ten days
 *   before Glitch closed), a zutto_door_asset_wooden_door_lock in the rock
 *   spire, whose connect lands at -1925,-312 in Symphonious Maximus. The
 *   ladder up to it (ladder_1354231103669) and its ledge were placed the same
 *   day.
 * - The yellow stars: items/toy_star_1.js "Star-Jingler-mid" ("A star that
 *   plays a single note of mid tone for your ear pleasure. Try touching
 *   it!"; onPlayerCollision 26-28: announce_sound_to_all("BIG_STAR_3") and
 *   setAndBroadcastState('glow'); not_selectable) and items/toy_star_2.js
 *   "Star-Jingler-low" (BIG_STAR_1, no glow). Both were made on 2012-08-01
 *   and the public locations dump places neither anywhere, so this street
 *   is the only place they are seen. Their art is glitch-items
 *   misc/toy_star_1/toy_star_1.swf (CC0): state "1" a yellow star, state
 *   "glow" 29 frames at 24 fps through a colour matrix from near white back
 *   to yellow. Nothing resets the state, so a touched star keeps cycling
 *   its glow (the video's stars are the pale cycle, not the rest yellow).
 *
 * The layout is the stitched 2012 full-street template (below): the
 * street at 1:1, 4000 x 1500. An earlier pass built it from Lily
 * Linguistic's visit (video 7SzDOzodeDQ, t0012-t0175; reference only) at
 * ~2.36 world px per video px, which came out ~1.45 times too big; the
 * video still gives what the template cannot:
 * - walking into a crater throws the avatar high into the sky (t0038-t0046,
 *   t0094-t0098), so the craters are bounce pads (rebuilt as location event
 *   boxes, like the fungal wall shrooms).
 * - the ladder is climbed from the floor to the fourth island and the
 *   Cebarkul signpost stands on the last one (t0128-t0140).
 * Four player Snaps (G104: research/wayback/raw/snaps/symphonious_maximus/,
 * Dec 2012, reference only) show the big white glow orbs up close (a disc
 * in a thin dark gap and a pale ring; no CC0 art has them, so they are clean
 * vectors, drawn and slowly drifted by the feature as in the video), the
 * purple soil with its music-note burrow (zutto1.swf ground_large_2,
 * SOIL_NOTES) and striped caterpillar (ground_caterpillar), and the hooked
 * vines under the islands (liana_2); the template puts each where it is.
 * Not rebuilt: the music (none is listed for the street in
 * inc_data_sounds.js).
 *
 * Art: CC0 Uralia (zutto1.swf street bundle) decos already in assets/decos,
 * and the Star-Jingler frames rendered from toy_star_1.swf
 * (tools/symphonious-maximus-art.py). tools/build-symphonious-maximus.mjs
 * writes the street JSON, its index row and Cebarkul's door target;
 * features/symphonious-maximus-feature.js runs the stars.
 */

export const SYMPHONIOUS_TSID = 'GUVR3SGQ6EF3400';
export const SYMPHONIOUS_SOURCE_TSID = 'LUVR3SGQ6EF3400';
export const SYMPHONIOUS_LABEL = 'Symphonious Maximus';
export const SYMPHONIOUS_HUB = Object.freeze({ hubId: '51', hubName: 'Uralia' });
export const CEBARKUL_TSID = 'GIF12PMQ5121D68';
export const CEBARKUL_SOURCE_TSID = 'LIF12PMQ5121D68';
export const CEBARKUL_DOOR = 'door_1354232290656';
/** The door's connect x/y: world, in Symphonious Maximus. */
export const SYMPHONIOUS_ARRIVE = Object.freeze({ x: -1925, y: -312 });
export const SYMPHONIOUS_SOURCE =
  "reconstruction: Symphonious Maximus (LUVR3SGQ6EF3400, not in tinyspeck/glitch-locations); layout from the 2012 full-street template (FullStreetTemplates/Uralia), crater bounces from video 7SzDOzodeDQ, art CC0 zutto1.swf decos and glitch-items toy_star_1.swf";

/** True for the street under either TSID prefix (G as imported, L as GSJS names it). */
export const isSymphoniousTsid = (tsid) => String(tsid || '').slice(1) === SYMPHONIOUS_TSID.slice(1);

/**
 * The street is laid out from the stitched 2012 full-street template
 * (reference only, no pixels): research/goodnight-groddle-archive/glitch-art/
 * FullStreetTemplates/Uralia/Symphonious Maximus.png, 4000 x 1500, the
 * street's bounds at 1:1. Its floor stands where Cebarkul's door lands
 * (-1925, -312: template x 75, y 1188), so world x = template x - 2000 and
 * world y = template y - 1500. Every star, crater, island, tree, orb and
 * peak below is placed where the template shows it, at the size it shows.
 */
const TX = -2000;
const TY = -1500;
/** Template px to world. */
const tx = (x) => x + TX;
const ty = (y) => y + TY;

const L = -2000;
const R = 2000;
const T = -1500;
const B = 0;
export const SYMPHONIOUS_BOUNDS = Object.freeze({ l: L, r: R, t: T, b: B });
const W = R - L;
const H = B - T;
const screen = (x, y) => ({ x: Math.round(x - L), y: Math.round(y - T) });

/** The floor's walk line (the door's arrival y; template y 1188, where the ladder stands). */
export const GROUND_Y = -312;

/* ------------------------------------------------------------------ */
/* Stars (items/toy_star_1.js)                                          */
/* ------------------------------------------------------------------ */

export const STAR_JINGLER = Object.freeze({
  classTsid: 'toy_star_1',
  label: 'Star-Jingler-mid',
  sound: 'BIG_STAR_3',
  /** toy_star_1.swf stage at x1 (getAssetInfo position w/h 46x42). */
  w: 46,
  h: 42,
  /** The "glow" label: frames 2-30 at the SWF's 24 fps. */
  glowFrames: 29,
  glowMs: Math.round((29 / 24) * 1000),
  art: 'assets/sprites/symphonious/toy_star_1@3x.webp',
  glowArt: 'assets/sprites/symphonious/toy_star_1_glow@3x.webp',
});

/** The remake avatar's body box for a star touch (feet x, y; ~130 px tall). */
export const AVATAR_BODY = Object.freeze({ w: 56, h: 124 });

/** Template centres of a row of stars. */
const trow = (xs, y) => xs.map((x) => [tx(x), ty(y)]);
// The grid over the first crater: two outer columns of 3, three inner columns of 4, half a row apart.
const grid = [
  ...[109, 567].flatMap((x) => [481, 626, 776].map((y) => [tx(x), ty(y)])),
  ...[239, 354, 469].flatMap((x) => [546, 696, 846, 996].map((y) => [tx(x), ty(y)])),
];

/**
 * Star-Jinglers: world centre x, y, read off the template one by one. `where` names the cluster.
 */
export const STARS = Object.freeze([
  ...grid.map(([x, y]) => ({ x, y, where: 'grid' })),
  ...[[789, 995], [1007, 975], [1221, 993], [1435, 979], [1650, 991], [1858, 976], [2087, 989], [2281, 983]].map(([x, y]) => ({ x: tx(x), y: ty(y), where: 'mushroom trees' })),
  ...trow([1178, 1294, 1408, 1522], 208).map(([x, y]) => ({ x, y, where: 'teal island' })),
  ...trow([1906, 2020, 2134], 168).map(([x, y]) => ({ x, y, where: 'first yellow island, high' })),
  ...trow([1851, 1967, 2081, 2195], 276).map(([x, y]) => ({ x, y, where: 'first yellow island' })),
  ...trow([2510, 2626, 2740, 2854], 215).map(([x, y]) => ({ x, y, where: 'lilac island' })),
  ...trow([3172, 3286, 3400], 175).map(([x, y]) => ({ x, y, where: 'ladder island, high' })),
  ...trow([3113, 3229, 3343, 3457], 274).map(([x, y]) => ({ x, y, where: 'ladder island' })),
].map((s, i) => Object.freeze({ id: `star_${String(i + 1).padStart(2, '0')}`, ...s })));

/** The three big stars in the island gaps (template ~110 px across): decoration only (items had one size). */
export const BIG_STARS = Object.freeze([
  Object.freeze({ x: tx(1707), y: ty(472), scale: 2.4 }),
  Object.freeze({ x: tx(2330), y: ty(495), scale: 2.4 }),
  Object.freeze({ x: tx(3044), y: ty(493), scale: 2.4 }),
]);

/** Did an avatar with feet at (px, py) touch the star (both screen space)? */
export function touchesStar(star, px, py, body = AVATAR_BODY) {
  const sx0 = star.x - STAR_JINGLER.w / 2;
  const sx1 = star.x + STAR_JINGLER.w / 2;
  const sy0 = star.y - STAR_JINGLER.h / 2;
  const sy1 = star.y + STAR_JINGLER.h / 2;
  return px + body.w / 2 >= sx0 && px - body.w / 2 <= sx1 && py >= sy0 && py - body.h <= sy1;
}

/**
 * The glow cycle: the overlay (state "glow" frame 2, near white) fades to
 * nothing over the 29 frames, then the cycle starts again.
 * @returns {number} overlay alpha 0..1
 */
export function glowAlpha(sinceMs) {
  if (!(sinceMs >= 0)) return 0;
  return 1 - (sinceMs % STAR_JINGLER.glowMs) / STAR_JINGLER.glowMs;
}

/* ------------------------------------------------------------------ */
/* Floor and craters                                                   */
/* ------------------------------------------------------------------ */

export const CRATER_DEPTH = 56;
/** Bounce: the fungal shroom recipe (gravity x -7.5) held long enough to clear the star grid. */
export const CRATER_BOUNCE = Object.freeze({ param: 'gravity', value: -7.5, duration: 1400 });

/** The template's eight craters, each under a pale shaft of light: centre and width (template x in `why`). */
export const CRATERS = Object.freeze([
  { id: 'c1', x: tx(362), w: 395, why: 'under the star grid (template x 165-560): the first bounce lands in the grid' },
  { id: 'c2', x: tx(784), w: 232, why: 'right of the shelf tree, under the small teal island (template x 668-900)' },
  { id: 'c3', x: tx(1217), w: 225, why: 'in front of the green mushroom stumps, under the teal island (template x 1105-1330)' },
  { id: 'c4', x: tx(1652), w: 215, why: 'under the big star (template x 1545-1760)' },
  { id: 'c5', x: tx(2095), w: 220, why: 'under the first yellow island (template x 1985-2205)' },
  { id: 'c6', x: tx(2607), w: 385, why: 'under the lilac island (template x 2415-2800)' },
  { id: 'c7', x: tx(3185), w: 370, why: 'under the ladder island, by the arch (template x 3000-3370)' },
  { id: 'c8', x: tx(3826), w: 228, why: 'under the signpost island (template x 3712-3940)' },
].map((c) => Object.freeze(c)));

function groundPoints() {
  const pts = [[L, GROUND_Y]];
  for (const c of CRATERS) {
    const bottom = GROUND_Y + CRATER_DEPTH;
    pts.push([c.x - c.w / 2, GROUND_Y], [c.x - c.w / 4, bottom], [c.x + c.w / 4, bottom], [c.x + c.w / 2, GROUND_Y]);
  }
  pts.push([R, GROUND_Y]);
  return pts;
}

/* ------------------------------------------------------------------ */
/* Floating islands                                                    */
/* ------------------------------------------------------------------ */

/**
 * Top edge of each island deco (first opaque row per column, as a fraction
 * of the deco height) at x = 0.05 .. 0.95 of its width, measured from the
 * deco WebPs' alpha (tools/symphonious-maximus-art.py --profiles).
 */
export const ISLAND_PROFILES = Object.freeze({
  flying_platform_1: [0.13, 0.12, 0.11, 0.11, 0.07, 0.07, 0.07, 0.06, 0.07, 0.0, 0.01, 0.02, 0.03, 0.05, 0.06, 0.07, 0.12, 0.2, 0.22],
  flying_platform_2: [0.22, 0.19, 0.17, 0.08, 0.03, 0.04, 0.08, 0.11, 0.11, 0.03, 0.13, 0.09, 0.14, 0.14, 0.15, 0.16, 0.18, 0.18, 0.21],
  flying_platform_3: [0.14, 0.11, 0.1, 0.1, 0.06, 0.01, 0.0, 0.0, 0.01, 0.02, 0.02, 0.03, 0.02, 0.02, 0.04, 0.05, 0.07, 0.1, 0.17],
  flying_platform_4: [0.19, 0.13, 0.1, 0.07, 0.05, 0.04, 0.03, 0.02, 0.02, 0.02, 0.03, 0.03, 0.04, 0.06, 0.08, 0.09, 0.11, 0.14, 0.18],
  flying_platform_5: [0.27, 0.25, 0.23, 0.22, 0.14, 0.1, 0.15, 0.19, 0.17, 0.18, 0.19, 0.18, 0.16, 0.09, 0.22, 0.22, 0.22, 0.23, 0.26],
  flying_platform_6: [0.21, 0.13, 0.1, 0.1, 0.1, 0.11, 0.1, 0.08, 0.06, 0.04, 0.04, 0.03, 0.04, 0.11, 0.12, 0.14, 0.15, 0.17, 0.2],
});
/** Deco logical size (the WebP's pixel size). */
const DECO_SIZE = Object.freeze({
  flying_platform_1: [940, 552],
  flying_platform_2: [1036, 770],
  flying_platform_3: [692, 228],
  flying_platform_4: [396, 184],
  flying_platform_5: [334, 250],
  flying_platform_6: [890, 450],
});
/** Feet stand a little into the snow or grass. */
const SINK = 8;

/** The islands as the template draws them: centre x, deco top y and scale from each one's left and right ends (template x in `why`). */
export const ISLANDS = Object.freeze([
  { id: 'teal_small', sprite: 'flying_platform_4', x: tx(745), top: ty(545), s: 0.505, why: 'small teal island over the second crater (template x 645-845)' },
  { id: 'lilac_small', sprite: 'flying_platform_5', x: tx(941), top: ty(398), s: 0.68, why: 'small lilac island with a tuft, one step up (template x 828-1055)' },
  { id: 'teal', sprite: 'flying_platform_3', x: tx(1354), top: ty(318), s: 0.763, why: 'first of the top row: snowy mint (template x 1090-1618)' },
  { id: 'yellow_a', sprite: 'flying_platform_6', x: tx(2021), top: ty(292), s: 0.62, why: 'lit yellow top (template x 1745-2297)' },
  { id: 'lilac', sprite: 'flying_platform_2', x: tx(2691), top: ty(288), s: 0.562, why: 'the big lilac island with a smaller one under it (template x 2400-2982)' },
  { id: 'yellow_b', sprite: 'flying_platform_1', x: tx(3318), top: ty(302), s: 0.593, why: 'yellow island with the ladder at its right end (template x 3040-3597)' },
  { id: 'yellow_c', sprite: 'flying_platform_6', x: tx(3854), top: ty(327), s: 0.47, flip: true, why: 'the last island, with the Cebarkul signpost, running off the street\'s right end (template x 3645-4000)' },
].map((i) => Object.freeze(i)));

const median3 = (a, i) => {
  const v = [a[Math.max(0, i - 1)], a[i], a[Math.min(a.length - 1, i + 1)]].sort((p, q) => p - q);
  return v[1];
};

/** An island's walk line: world points left to right, clipped to the street. */
export function islandPoints(island) {
  const [lw, lh] = DECO_SIZE[island.sprite];
  const w = lw * island.s;
  const h = lh * island.s;
  const prof = ISLAND_PROFILES[island.sprite];
  const pts = [];
  for (let i = 0; i < prof.length; i += 1) {
    const f = 0.05 + i * 0.05;
    const src = island.flip ? prof.length - 1 - i : i;
    const y = island.top + median3(prof, src) * h + SINK;
    const x = Math.round(island.x - w / 2 + f * w);
    if (x <= R) pts.push([x, Math.round(y)]);
  }
  return pts;
}

/** Walk-line y at world x on an island (null off it). */
export function islandYAt(island, x) {
  const pts = islandPoints(island);
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x >= x1 && x <= x2) return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return null;
}

const islandById = (id) => ISLANDS.find((i) => i.id === id);

/* ------------------------------------------------------------------ */
/* Ladder and signpost                                                 */
/* ------------------------------------------------------------------ */

export const LADDER = Object.freeze({ id: 'ladder_sym_1', x: tx(3552), w: 70, island: 'yellow_b', why: 'teal ladder from the floor to the right end of the ladder island (template x 3520-3585, y 385-1190)' });
export const SIGNPOST = Object.freeze({ id: 'signpost_sym_1', x: tx(3835), island: 'yellow_c', why: '"Cebarkul" on a post on the last island (template x 3835)' });

export function ladderGeometry() {
  const top = Math.round(islandYAt(islandById(LADDER.island), LADDER.x) - 10);
  return { id: LADDER.id, x: LADDER.x, y: GROUND_Y, w: LADDER.w, h: GROUND_Y - top, top };
}

/* ------------------------------------------------------------------ */
/* Decos                                                               */
/* ------------------------------------------------------------------ */

const deco = (sprite, x, y, w, h, z, extra = {}) => ({ sprite, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), z, r: 0, ...extra });

/** Native size of each prop deco (its WebP). */
const PROP_SIZE = Object.freeze({
  zutto_platform_1: [486, 460], zutto_platform_2: [302, 212], zutto_platform_3: [280, 300],
  purple_mushroom_1: [90, 118], purple_mushroom_2: [42, 96], purple_mushroom_3: [168, 140],
  tree_4: [508, 236], tree_6: [368, 476], tree_7: [256, 418], tree_8: [512, 842], tree_10: [292, 364],
  tree_11: [332, 570], tree_12: [320, 362], tree_14: [460, 422], tree_15: [188, 228],
  zutto_plant_1: [82, 106], zutto_plant_2: [202, 186], zutto_plant_3: [118, 110], plant_giant_fern_1: [86, 188],
  plant_fern_1: [62, 142], plant_fern_2: [72, 144], plant_fern_4: [58, 154], mushroom_aqua_1: [80, 160],
  ground_guys: [190, 120], grass_stone_2: [188, 62], liana_2: [102, 316], platform_4: [180, 132],
  ground_5: [162, 250], ground_6: [214, 250], ground_7: [168, 188], ground_8: [208, 250], ground_9: [366, 254],
  ground_10: [366, 254], ground_11: [398, 252], ground_13: [200, 228], ground_14: [396, 240], ground_15: [102, 136],
  snow_plat_01a_al1: [728, 160], snow_plat_01b_al1: [694, 210],
});

/**
 * Middleground props off the template: [sprite, template centre x, template
 * bottom y, width on the template, z, flip, height (when it is not the art's
 * aspect)], left to right.
 */
const PROPS = [
  // Template x 0-1000: the snowy blue stumps, the red spotted mushroom, the shelf tree and red caps on the rock ledge, the purple tree.
  ['zutto_platform_1', 105, 1142, 222, 20],
  ['purple_mushroom_2', 148, 1130, 20, 41],
  ['tree_15', 318, 1128, 226, 30],
  ['tree_8', 552, 1052, 128, 26],
  ['tree_14', 664, 1032, 124, 32],
  ['zutto_plant_1', 28, 1162, 50, 44],
  ['zutto_plant_1', 628, 1132, 42, 44, true],
  ['zutto_plant_2', 697, 1142, 96, 45],
  ['zutto_plant_3', 772, 1128, 52, 45],
  ['tree_11', 882, 1142, 158, 28],
  ['purple_mushroom_1', 975, 1138, 52, 47],
  ['plant_fern_1', 860, 1142, 34, 48],
  ['grass_stone_2', 524, 1162, 72, 46],
  // Template x 1000-2000: the green mushroom stumps, the glassy blue mushroom, the big shelf tree with its doorway, blue trees.
  ['zutto_platform_3', 1243, 1112, 246, 24],
  ['zutto_platform_2', 1515, 1118, 202, 33],
  ['zutto_platform_3', 1388, 1170, 196, 36],
  ['mushroom_aqua_1', 1350, 1186, 62, 47],
  ['plant_fern_4', 1205, 1150, 34, 48],
  ['plant_fern_2', 1520, 1150, 36, 48],
  ['tree_7', 1758, 1034, 82, 18],
  ['tree_10', 1990, 1062, 160, 21],
  ['tree_8', 1855, 1142, 252, 22],
  ['zutto_plant_2', 1775, 1272, 110, 49],
  ['plant_fern_1', 1810, 1150, 34, 48],
  ['plant_fern_2', 1095, 1272, 34, 49],
  ['grass_stone_2', 1035, 1262, 72, 46],
  // Template x 2000-3000: the snowy stump, the green stump, the red caps on the rock ledge, the blue mushroom tree.
  ['zutto_platform_1', 2090, 1062, 190, 19],
  ['zutto_platform_3', 2192, 1162, 196, 34],
  ['zutto_plant_2', 2370, 1112, 100, 45],
  ['zutto_plant_1', 2515, 1122, 50, 44],
  ['zutto_plant_1', 2625, 1122, 50, 44, true],
  ['plant_giant_fern_1', 2548, 1118, 36, 45],
  ['tree_14', 2782, 1028, 116, 31],
  ['tree_12', 2895, 1102, 212, 29],
  ['purple_mushroom_3', 2830, 1138, 80, 47],
  ['purple_mushroom_3', 2850, 1252, 62, 49, true],
  ['zutto_plant_3', 2865, 1132, 50, 45],
  ['zutto_platform_2', 3022, 1152, 196, 33],
  ['plant_fern_4', 2950, 1262, 36, 49],
  // Template x 3000-4000: the snowy arch, the purple tree, snowy stumps behind the ladder, blue trees, the eyes, a red cap.
  ['tree_4', 3185, 1122, 166, 27, false, 104],
  ['tree_11', 3342, 1132, 158, 28],
  ['zutto_platform_1', 3492, 1088, 220, 19],
  ['mushroom_aqua_1', 3445, 1142, 62, 47],
  ['plant_giant_fern_1', 3502, 1092, 34, 45],
  ['tree_7', 3620, 1062, 156, 18],
  ['zutto_plant_2', 3690, 1128, 100, 45],
  ['zutto_plant_3', 3756, 1128, 40, 45],
  ['tree_6', 3825, 1042, 92, 25],
  ['ground_guys', 3830, 1106, 82, 46],
  ['tree_15', 3975, 1068, 120, 30],
  ['zutto_platform_2', 3643, 1268, 128, 50],
  ['purple_mushroom_3', 3720, 1366, 80, 49],
];

/** Vines hung under the islands, each ending in a hook (liana_2), as the template shows under the lilac and ladder islands. */
const VINES = [
  ['liana_2', 2695, 712, 50, 8],
  ['liana_2', 3278, 634, 46, 8, true],
];

/**
 * The eyes and spiral ferns on the lower tier's chunks: middleground decos
 * (Tiny Speck never put them on a background layer); they stand under the
 * floor's front edge, where nothing walks in front of them.
 */
const LOWER_FRONT = [
  ['ground_guys', 175, 1422, 72, 2], ['plant_giant_fern_1', 1610, 1402, 30, 2], ['ground_guys', 1730, 1446, 64, 2, true],
  ['plant_giant_fern_1', 2890, 1400, 34, 2],
];

/** A prop row to a deco (template to world; height from the art's aspect unless given). */
function propDeco([sprite, cx, bottom, w, z, flip, h]) {
  const [lw, lh] = PROP_SIZE[sprite];
  return deco(sprite, tx(cx), ty(bottom), w, h || (w * lh) / lw, z, flip ? { flip: true } : {});
}

function middlegroundDecos() {
  const out = [];
  for (const row of [...PROPS, ...VINES, ...LOWER_FRONT]) out.push(propDeco(row));
  for (const isl of ISLANDS) {
    const [lw, lh] = DECO_SIZE[isl.sprite];
    out.push(deco(isl.sprite, isl.x, isl.top + lh * isl.s, lw * isl.s, lh * isl.s, 60, { id: `island_${isl.id}`, ...(isl.flip ? { flip: true } : {}) }));
  }
  // Ladder art: zutto stone ladder tiles stacked from the floor to the island,
  // each shifted so its two rails line up (rail midpoint measured per tile),
  // sized to the template's 65 px wide ladder.
  const lad = ladderGeometry();
  const k = 0.47;
  const step = 100 * k;
  const TILES = {
    ladder_tile_cap_1_stone: [150, 100, 71],
    zutto_ladder_tile_center_01_stone: [140, 100, 71],
    zutto_ladder_tile_center_02_stone: [140, 100, 71],
    zutto_ladder_tile_center_03_stone: [142, 110, 71],
    ladder_tile_cap_0_stone: [140, 100, 60],
  };
  const n = Math.ceil(lad.h / step);
  for (let i = 0; i < n; i += 1) {
    const sprite = i === 0 ? 'ladder_tile_cap_1_stone' : i === n - 1 ? 'ladder_tile_cap_0_stone' : `zutto_ladder_tile_center_0${(i % 3) + 1}_stone`;
    const [lw, lh, mid] = TILES[sprite];
    out.push(deco(sprite, lad.x + (lw / 2 - mid) * k, lad.y - i * step + 6, lw * k, lh * k, 70 + i));
  }
  return out;
}

/**
 * The pale peaks behind the floor, where the template has them: [sprite,
 * template left x, right x, top y, flip]. They stand on the floor's back
 * edge (template y 1150, hidden behind it) and move with the street, so
 * their feet never show.
 */
const PEAKS = [
  ['bck_hill_2', -10, 560, 760],
  ['bck_hill_14', 380, 680, 880, true],
  ['bck_hill_14', 640, 1170, 722],
  ['bck_hill_2', 1320, 1960, 684],
  ['bck_hill_14', 2090, 2520, 778],
  ['bck_hill_14', 2480, 2770, 862, true],
  ['bck_hill_14', 2990, 3280, 828],
  ['bck_hill_16', 3200, 3470, 658],
  ['bck_hill_14', 3690, 4010, 812, true],
];
const PEAK_FOOT = 1150;
/** Hills at the template's floor line (screen space: the street's own height, so they keep their place). */
function peakDecos() {
  return PEAKS.map(([sprite, x0, x1, top, flip], i) => {
    const p = screen(tx((x0 + x1) / 2), ty(PEAK_FOOT));
    return deco(sprite, p.x, p.y, x1 - x0, PEAK_FOOT - top, i, flip ? { flip: true } : {});
  });
}
const SKY = [
  ['zutto_stars_1', 420, 345, 1226, 314], ['stars_2', 1170, 565, 948, 264], ['zutto_stars_1', 1790, 262, 1226, 314],
  ['stars_3', 2210, 483, 273, 179], ['stars_2', 2480, 207, 948, 264], ['stars_3', 620, 690, 273, 179],
  ['zutto_stars_1', 2345, 724, 1226, 314], ['stars_3', 1450, 793, 273, 179],
];

/** Floor layer: mint surface shapes, crater bowls, flower sprinkles (screen space). */
function floorDecos() {
  const out = [];
  const surfaces = ['ground_surface_1', 'grass_surface_5', 'ground_surface_2', 'grass_surface_4'];
  const sizes = { ground_surface_1: [1280, 204], grass_surface_5: [1430, 166], ground_surface_2: [1406, 184], grass_surface_4: [1184, 158] };
  let k = 0;
  for (let x = L - 200; x < R + 400; x += 900) {
    const sprite = surfaces[k % surfaces.length];
    const [lw] = sizes[sprite];
    // Bottom edge just over the soil band's frost fringe (G104); the top stays where it was.
    const p = screen(x, FLOOR_BOTTOM_Y);
    out.push(deco(sprite, p.x, p.y, lw * 1.15, FLOOR_BOTTOM_Y + 366, 1 + (k % 3), k % 2 ? { flip: true } : {}));
    k += 1;
  }
  // The bowls (template: ~0.16 of their width deep, bottoms ~52 px under the walk line).
  for (const c of CRATERS) {
    const p = screen(c.x, GROUND_Y + 52);
    out.push(deco('cave_gr_hole_1', p.x, p.y, c.w, Math.round(c.w * 0.17 + 8), 10, { id: `crater_${c.id}` }));
  }
  // Low mounds along the back edge, so the floor meets the peaks in a ragged line.
  const mounds = [['grass_hill', 786, 146, 0.6], ['hillock_1', 332, 134, 0.6], ['zutto_hill_3', 998, 250, 0.45], ['ground_hill_1', 318, 82, 0.8], ['grass_stone_2', 188, 62, 1.0]];
  k = 0;
  for (let x = L + 120; x < R; x += 270) {
    k += 1;
    if (CRATERS.some((c) => Math.abs(x - c.x) < c.w / 2 + 60)) continue;
    const [sprite, lw, lh, sc] = mounds[k % mounds.length];
    const p = screen(x, GROUND_Y + 12);
    out.push(deco(sprite, p.x, p.y, lw * sc, lh * sc, 5 + (k % 4), k % 2 ? { flip: true } : {}));
  }
  const sprinkles = ['grass_texture_1', 'grass_texture_2', 'grass_texture_3'];
  k = 0;
  for (let x = L + 300; x < R; x += 640) {
    const p = screen(x + ((k * 137) % 200), -230 - ((k * 53) % 60));
    out.push(deco(sprinkles[k % 3], p.x, p.y, 375, 55, 20));
    k += 1;
  }
  return out;
}

/**
 * Top of the purple soil band under the mint floor (G104), the floor's front
 * edge at template y 1293 and the soil down to the street's bottom. It is
 * its own layer between the floor base and the pale floor surfaces: the
 * surfaces end at FLOOR_BOTTOM_Y over its mint cap, so only the frost fringe
 * and the purple soil show under them.
 */
export const SOIL_TOP_Y = GROUND_Y + 55;
const SOIL_H = 262;
/** Bottom edge of the floor surfaces (world y), a little under a crater's bowl (GROUND_Y + 76). */
export const FLOOR_BOTTOM_Y = GROUND_Y + 105;

/** Music-note burrows: zutto1.swf ground_large_2's top (tools/symphonious-maximus-art.py --soil), world centre x (template notes at x 1310 and 3430). */
export const SOIL_NOTES = Object.freeze([
  Object.freeze({ x: tx(1310), why: 'a note in the soil under the green stumps (template x 1310)' }),
  Object.freeze({ x: tx(3430), why: 'a note in the soil under the purple tree (template x 3430)' }),
]);
export const SOIL_NOTE_ART = Object.freeze({ file: 'assets/sprites/symphonious/ground_large_2_top@2x.webp', w: 420, h: 128, dy: 12 });
/** Striped caterpillars in the soil (ground_caterpillar), world x: the template's one, and two more as in the Snaps. */
export const SOIL_CATERPILLARS = Object.freeze([tx(1442), tx(2620), tx(3560)]);

/**
 * The soil band with its frost fringe (layer T_sym_soil, screen space):
 * ground_2 end to end, every other one flipped, so each join meets its own
 * mirror image and shows no seam.
 */
function soilDecos() {
  const out = [];
  const SOIL_W = 984;
  let k = 0;
  // 6 px overlap so no hairline shows between neighbours (their end columns are half transparent).
  for (let x = L - SOIL_W / 2; x < R + SOIL_W; x += SOIL_W - 6) {
    const p = screen(x, SOIL_TOP_Y + SOIL_H);
    out.push(deco('ground_2', p.x, p.y, SOIL_W, SOIL_H, 1, { id: `sym_soil_${k + 1}`, ...(k % 2 ? { flip: true } : {}) }));
    k += 1;
  }
  SOIL_CATERPILLARS.forEach((x, i) => {
    const p = screen(x, SOIL_TOP_Y + 66 + 68);
    out.push(deco('ground_caterpillar', p.x, p.y, 62, 56, 4, i % 2 ? { flip: true } : {}));
  });
  return out;
}

/**
 * The lower tier under the floor's front edge: teal-capped ground chunks
 * and their plants, the eyes peeking out (template y 1300-1500), as
 * [sprite, template centre x, top y, width, flip]. The chunks run on down
 * past the street's bottom.
 */
const LOWER_CHUNKS = [
  ['ground_14', 155, 1408, 250], ['ground_13', 292, 1354, 154, true], ['ground_13', 812, 1430, 120], ['ground_9', 930, 1374, 140, true],
  ['ground_7', 1070, 1354, 140], ['ground_13', 1335, 1368, 120, true], ['ground_9', 1628, 1364, 145], ['ground_6', 1595, 1440, 130],
  ['ground_9', 1835, 1374, 130, true], ['ground_15', 1945, 1440, 110], ['ground_5', 2215, 1300, 150], ['ground_15', 2285, 1434, 110, true],
  ['ground_11', 2435, 1384, 250], ['ground_13', 2910, 1394, 140], ['ground_14', 3140, 1330, 280, true], ['ground_7', 3110, 1400, 100],
  ['ground_11', 3610, 1340, 380], ['ground_15', 3485, 1410, 110, true],
];
/** Pale pink snow mounds on the lower tier (their own tinted layer): [sprite, centre x, top y, width, height]. */
const LOWER_SNOW = [
  ['snow_plat_01a_al1', 92, 1262, 190, 80], ['snow_plat_01b_al1', 724, 1350, 270, 120], ['snow_plat_01a_al1', 2590, 1428, 180, 70],
  ['snow_plat_01a_al1', 2665, 1355, 140, 60], ['snow_plat_01b_al1', 3770, 1388, 230, 92], ['snow_plat_01b_al1', 3905, 1324, 200, 100],
];
/** Plants on the lower tier: [sprite, centre x, bottom y, width, flip] (the eyes and spiral ferns are LOWER_FRONT). */
const LOWER_PLANTS = [
  ['plant_fern_1', 48, 1402, 36], ['plant_fern_4', 300, 1372, 36], ['platform_4', 438, 1556, 210],
  ['plant_fern_2', 920, 1372, 40],
  ['plant_fern_1', 1860, 1382, 32], ['plant_fern_4', 2330, 1390, 36], ['purple_mushroom_3', 2445, 1392, 70],
  ['plant_fern_2', 3480, 1408, 36],
];

function lowerDecos() {
  const out = [];
  let z = 1;
  for (const [sprite, cx, top, w, flip] of LOWER_CHUNKS) {
    const [lw, lh] = PROP_SIZE[sprite];
    const h = (w * lh) / lw;
    const p = screen(tx(cx), ty(top) + h);
    out.push(deco(sprite, p.x, p.y, w, h, z++, flip ? { flip: true } : {}));
  }
  for (const [sprite, cx, bottom, w, flip] of LOWER_PLANTS) {
    const [lw, lh] = PROP_SIZE[sprite];
    const p = screen(tx(cx), ty(bottom));
    out.push(deco(sprite, p.x, p.y, w, (w * lh) / lw, z++, flip ? { flip: true } : {}));
  }
  return out;
}

function lowerSnowDecos() {
  return LOWER_SNOW.map(([sprite, cx, top, w, h], i) => {
    const p = screen(tx(cx), ty(top) + h);
    return deco(sprite, p.x, p.y, w, h, i, i % 2 ? { flip: true } : {});
  });
}

/** The rock ledges behind the floor that trees stand on (template: mint tops at y 1030-1040), as [sprite, centre x, top y, width]. */
const BACK_LEDGES = [['ground_9', 605, 1032, 292], ['ground_9', 1705, 1002, 196], ['ground_9', 2710, 1038, 220], ['ground_14', 3815, 1040, 180]];
function backLedgeDecos() {
  return BACK_LEDGES.map(([sprite, cx, top, w], i) => {
    const [lw, lh] = PROP_SIZE[sprite];
    const h = (w * lh) / lw;
    const p = screen(tx(cx), ty(top) + h);
    return deco(sprite, p.x, p.y, w, h, i);
  });
}

/* ------------------------------------------------------------------ */
/* Glow orbs (G104)                                                    */
/* ------------------------------------------------------------------ */

/**
 * The Snaps' orb, measured on the biggest (Snap 248953): a white disc of
 * 0.68 R, a dark navy gap to 0.81 R, then a pale ring to R (~40% white).
 */
export const ORB_SHAPE = Object.freeze({ disc: 0.68, gap: 0.81, ringAlpha: 0.4, gapColor: 0x0d2b4c, gapAlpha: 0.85 });
/** A slow drift (the video's orbs float; the Snaps freeze them): px and period. */
export const ORB_DRIFT = Object.freeze({ amp: 10, periodMs: 7000 });
/**
 * Orbs where the template has them: template centre x, y and the white
 * disc's diameter (the outer ring R is the disc / 1.36). Two over the left
 * end, the rest among the treetops and under the islands to the right.
 */
export const GLOW_ORBS = Object.freeze([
  [739, 381, 15], [939, 262, 21], [2436, 985, 32], [2513, 842, 15], [2599, 949, 38], [2687, 843, 21],
  [2968, 693, 32], [3038, 950, 15], [3121, 599, 21], [3128, 783, 26], [3234, 946, 38], [3279, 686, 26],
  [3685, 755, 38], [3726, 938, 32], [3810, 638, 21], [3816, 850, 43], [3921, 942, 26], [3946, 760, 15],
].map(([x, y, d]) => Object.freeze({ x: tx(x), y: ty(y), r: Math.round(d / (2 * ORB_SHAPE.disc)) })));

/** Floor base: one opaque white block tinted the video's floor mint, so no sky shows between the surface shapes. */
function floorBaseDecos() {
  const p = screen((L + R) / 2, 80);
  return [deco('mask_white', p.x, p.y, W + 200, 410, 0)];
}

/**
 * Light shafts over the craters: the cone turned over (rotated about its
 * top), so it fades out upward and its hard narrow end sits behind the floor.
 * Its own layer between the peaks and the floor (screen space). The
 * template's shafts are pale boxes about as wide as their crater, ~500 px tall.
 */
function shaftDecos() {
  return CRATERS.map((c) => {
    const top = screen(c.x, GROUND_Y - 520);
    const bottom = screen(c.x, GROUND_Y + 10);
    return deco('cave_shaft_light_1', top.x, top.y, Math.round(c.w * 1.5), bottom.y - top.y, 0, { r: 180 });
  });
}

/** Sky fade: object_floor_fade turned over (opaque at the top) and tinted violet. */
function skyFadeDecos() {
  return [deco('object_floor_fade', W / 2, 0, W + 400, 1000, 0, { r: 180 })];
}

function parallaxLayer(id, name, z, w, h, decos, filters = null) {
  return { id, name, z, w, h, decos, ...(filters ? { filters } : {}) };
}

function layers() {
  const skyW = Math.round(W * 0.8);
  return [
    parallaxLayer('T_sym_skyfade', 'sky fade', -9, W, H, skyFadeDecos(), { tintColor: 0x1b0d33, tintAmount: 100 }),
    parallaxLayer('sky', 'sky', -8, skyW, Math.round(H * 0.9), SKY.map(([s, x, y, w, h], i) => deco(s, x, y, w, h, i))),
    parallaxLayer('T_sym_peaks', 'peaks', -6, W, H, peakDecos(), { brightness: -8 }),
    parallaxLayer('T_sym_shafts', 'light shafts', -4, W, H, shaftDecos()),
    parallaxLayer('T_sym_ledges', 'rock ledges', -3.5, W, H, backLedgeDecos(), { brightness: 10, saturation: -20 }),
    parallaxLayer('T_sym_floorbase', 'floor base', -3, W, H, floorBaseDecos(), { tintColor: 0x8dc3cb, tintAmount: 100 }),
    parallaxLayer('T_sym_soil', 'soil', -2.5, W, H, soilDecos(), { brightness: 30, saturation: -15 }),
    parallaxLayer('T_sym_lower', 'lower tier', -2.3, W, H, lowerDecos(), { brightness: 10, saturation: -20 }),
    parallaxLayer('T_sym_lower_snow', 'lower tier snow', -2.2, W, H, lowerSnowDecos(), { tintColor: 0xeab4c6, tintAmount: 70 }),
    parallaxLayer('T_sym_floor', 'floor', -2, W, H, floorDecos(), { saturation: -40, brightness: 50 }),
    { id: 'middleground', name: 'middleground', z: 0, w: W, h: H, decos: middlegroundDecos() },
  ];
}

/* ------------------------------------------------------------------ */
/* Street                                                              */
/* ------------------------------------------------------------------ */

function polyline(prefix, pts) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i += 1) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x2 - x1 < 1) continue;
    out.push({ id: `${prefix}_${out.length + 1}`, x1, y1, x2, y2, pc_perm: -1 });
  }
  return out;
}

/** Crater bounce boxes (screen space, bottom-centre) and their events. */
export function craterEventBoxes() {
  return CRATERS.map((c) => {
    const p = screen(c.x, GROUND_Y + CRATER_DEPTH);
    return { id: `bounce_${c.id}`, x: p.x, y: p.y, w: Math.round(c.w / 2 - 20), h: 40, onEnter: ['crater_bounce'], onExit: [], source: 'crater (video 7SzDOzodeDQ)' };
  });
}

export function symphoniousEvents() {
  return {
    crater_bounce: [{ type: 'physics', param: CRATER_BOUNCE.param, value: CRATER_BOUNCE.value, duration: CRATER_BOUNCE.duration, all: false }],
  };
}

/**
 * The street JSON. `cebarkulArrive` is the signpost's landing in Cebarkul
 * (its screen space: in front of the wooden door), filled in by the builder.
 */
export function symphoniousStreet({ cebarkulArrive = null } = {}) {
  const platforms = [
    ...polyline('plat_sym_ground', groundPoints()),
    ...ISLANDS.flatMap((isl) => polyline(`plat_sym_${isl.id}`, islandPoints(isl))),
  ];
  const lad = ladderGeometry();
  const signIsland = islandById(SIGNPOST.island);
  const signY = Math.round(islandYAt(signIsland, SIGNPOST.x));
  const ls = layers();
  const decoCount = ls.reduce((n, l) => n + l.decos.length, 0);
  const stars = STARS.map((s) => ({ id: s.id, ...screen(s.x, s.y) }));
  const bigStars = BIG_STARS.map((s) => ({ ...screen(s.x, s.y), scale: s.scale }));
  return {
    source: SYMPHONIOUS_SOURCE,
    reconstructed: true,
    tsid: SYMPHONIOUS_TSID,
    label: SYMPHONIOUS_LABEL,
    hubId: SYMPHONIOUS_HUB.hubId,
    hubName: SYMPHONIOUS_HUB.hubName,
    swf_file: 'zutto1.swf',
    bounds: { ...SYMPHONIOUS_BOUNDS },
    platforms,
    layers: ls,
    signposts: [{
      id: SIGNPOST.id,
      x: SIGNPOST.x,
      y: signY,
      w: 150,
      h: 200,
      connects: [{ tsid: CEBARKUL_SOURCE_TSID, label: 'Cebarkul', hub_id: SYMPHONIOUS_HUB.hubId, ...(cebarkulArrive ? { arrive: { ...cebarkulArrive } } : {}) }],
    }],
    stats: {
      platformCount: platforms.length,
      layerCount: ls.length,
      decoCount,
      signpostCount: 1,
      doorCount: 0,
      ladderCount: 1,
      barrierCount: 0,
    },
    gradient: { top: '163460', bottom: '215A76' },
    ladders: [{ id: lad.id, x: lad.x, y: lad.y, w: lad.w, h: lad.h }],
    events: symphoniousEvents(),
    eventBoxes: craterEventBoxes(),
    starJinglers: { classTsid: STAR_JINGLER.classTsid, sound: STAR_JINGLER.sound, stars, bigStars },
    glowOrbs: { shape: { ...ORB_SHAPE }, drift: { ...ORB_DRIFT }, orbs: GLOW_ORBS.map((o, i) => ({ id: `orb_${i + 1}`, ...screen(o.x, o.y), r: o.r })) },
    soilArt: SOIL_NOTES.map((n) => ({ file: SOIL_NOTE_ART.file, ...screen(n.x, SOIL_TOP_Y + SOIL_NOTE_ART.dy), w: SOIL_NOTE_ART.w, h: SOIL_NOTE_ART.h })),
    why: {
      street: 'inc_data_maps_prod.js 16034 (hub 51); no location XML. Cebarkul door_1354232290656 (2012-11-30) arrives at -1925,-312.',
      layout: 'The stitched 2012 full-street template (FullStreetTemplates/Uralia/Symphonious Maximus.png, 4000 x 1500 at 1:1): every star, crater, island, tree, orb and peak, and the lower tier of ground chunks.',
      stars: 'items/toy_star_1.js Star-Jingler-mid: touch plays BIG_STAR_3 and sets state glow (the SWF\'s 29-frame cycle); the 48 placements off the template.',
      craters: 'Inferred from the video: walking into a crater throws the avatar into the sky. Rebuilt as event boxes with the fungal bounce recipe.',
      orbs: 'Snaps 248938/248947/248953 (Dec 2012): white discs with a pale ring halo; clean vectors (no CC0 art), drawn by the feature; the 18 placements off the template.',
      soil: 'Snap 248938: purple hexagon soil under the mint floor with a music-note burrow (zutto1 ground_large_2) and a striped caterpillar (ground_caterpillar).',
      ladder: LADDER.why,
      signpost: SIGNPOST.why,
    },
  };
}

/** The index.json row. */
export function symphoniousIndexEntry(street = symphoniousStreet()) {
  return {
    label: SYMPHONIOUS_LABEL,
    file: `assets/streets/${SYMPHONIOUS_TSID}.json`,
    hubId: SYMPHONIOUS_HUB.hubId,
    hubName: SYMPHONIOUS_HUB.hubName,
    platforms: street.platforms.length,
    decos: street.stats.decoCount,
    reconstructed: true,
  };
}
