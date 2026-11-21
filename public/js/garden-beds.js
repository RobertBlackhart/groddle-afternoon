/**
 * G940 (report #469): the street garden beds and the scarecrow where players' 2012 full-street snaps
 * show them. Tiny Speck set every garden_new by hand, each with its own width, height and
 * garden_type (GSJS items/garden_new.js instanceProps 27-29), and the 2012 location files keep only
 * the label "Garden" (street-ecology.json counts.garden). tools/snap-placements/gardens.py measures
 * each bed on the snaps (garden-spots-data.js GARDEN_SPOTS); street-ecology.js gardenPlacementRequest
 * seats them as fixed points and garden.js streetGardenBeds lays them out, so game.js enterStreet,
 * the realtime builders and the level builder all put them in the same place.
 */
import { GARDEN_SPOTS } from './garden-spots-data.js?v=3c5d4164';
import { gardenLayout } from './garden-view.js?v=04fe8467';

/**
 * The streets whose 2012 gardens were all crop gardens: Zog's Glitchy Tools 2012 snapshot
 * (research/coverage/deep-dive-2026-10-27/zoggish-hub-objects-2012.tsv, register G350) lists "Crop
 * Garden plots" on these and "Herb Garden plots" only on the three Herb Gardens streets. A bed the
 * snaps do not show here (no snap of Kipacre Greens or Veldt Balm) is a crop bed too.
 */
export const CROP_GARDEN_STREETS_2012 = Object.freeze([
  'GCR101NQ4BU1SKS', // Community Gardens: 62 plots
  'GCR101UN0NJ1QPQ', // Middle Arbor: 63
  'GCR202JSVIN1STL', // Kipacre Greens: 49
  'GIFCNFNEJRG2ON4', // Mmumawwa Wala: 27
  'GIFGR46M8RE2RC7', // Veldt Balm: 48
]);

const body = (tsid) => String(tsid || '').slice(1);

function spotsRow(tsid) {
  if (!tsid) return null;
  const want = body(tsid);
  for (const key of Object.keys(GARDEN_SPOTS)) if (body(key) === want) return GARDEN_SPOTS[key];
  return null;
}

/** Whether a street's 2012 gardens were crop gardens (measured on its snaps, or Zog's list). */
export function isCropGardenStreet(tsid) {
  const want = body(tsid);
  return Boolean(want) && (Boolean(spotsRow(tsid)) || CROP_GARDEN_STREETS_2012.some((t) => body(t) === want));
}

/**
 * PURE: a street's measured beds, left to right as the snaps show them, or null:
 * [{ x, y, cols, rows, gardenType: 'default'|'herb', style }], x, y the bed's foot (spawnGarden's
 * origin: the bed box's centre and bottom, street px).
 */
export function measuredGardenBeds(tsid) {
  const row = spotsRow(tsid);
  if (!row?.beds?.length) return null;
  return row.beds
    .filter((b) => Number.isFinite(b?.[0]) && Number.isFinite(b?.[1]) && b[2] >= 1 && b[3] >= 1)
    .map(([x, y, cols, rows, kind, style]) => ({ x, y, cols, rows, gardenType: kind === 'herb' ? 'herb' : 'default', style: String(style || 'none') }));
}

/**
 * G1085 (#575): the two crop-garden streets no player's snap shows, read off Tiny Speck's own
 * whole-street pictures (research/wayback/raw/street-images/<region>/<L tsid>_main_<time>.jpg, 720 x 120
 * for the 6,000 x 1,000 street, so 1 px = 8.3 street px; reference only, never shipped), the pictures
 * tools/snap-placements/shrine-pictures.json seats shrines from. Both show the plots and the scarecrow.
 * The planner had put the beds anywhere, one inside Veldt Balm's animal pen. Each bed's foot is the
 * middle of its plots and the bottom of the front row (as GARDEN_SPOTS, checked against Middle Arbor's
 * picture and its measured beds), good to about 15 px.
 * - Veldt Balm (LIFGR46M8RE2RC7_main_1323829336, Dec 2011): six beds between the two garden signs,
 *   3 x 3, 3 x 2, 4 x 3, 3 x 3, 2 x 2 and 4 x 2 (plots counted at 16x zoom): 48 plots, Zog's 2012 count.
 * - Kipacre Greens (LCR202JSVIN1STL_main_1339298354, Jun 2012): seven beds, two by the first garden sign,
 *   two past the conifer, three by the second. Their plots cannot be counted at this size (most look
 *   2 x 2, which adds up to far less than Zog's 49), so they stay 4 x 2 as before (56 plots): `how` says so.
 * Both pictures show the Gardening Tools Vendor (the scarecrow) standing by the beds: `vendor` is its feet
 * (the foot of its pole), read the same way. Veldt Balm's stands among the flowers between the second and
 * third beds (picture px 282, 89), Kipacre Greens' just right of the big tree by the first garden sign,
 * left of the second bed (picture px 186, 105).
 * { [G tsid]: { source, beds: [[x, y, cols, rows, kind, style, how], ...], vendor: [x, y] } }, otherwise as GARDEN_SPOTS.
 */
export const PICTURE_GARDEN_SPOTS = Object.freeze({
  GIFGR46M8RE2RC7: Object.freeze({
    source: 'Tiny Speck street picture lida/LIFGR46M8RE2RC7_main_1323829336.jpg (G1085)',
    beds: Object.freeze([
      [1635, 727, 3, 3, 'crop', 'none', 'picture'],
      [2045, 745, 3, 2, 'crop', 'none', 'picture'],
      [2715, 730, 4, 3, 'crop', 'none', 'picture'],
      [3240, 735, 3, 3, 'crop', 'none', 'picture'],
      [3675, 798, 2, 2, 'crop', 'none', 'picture'],
      [4540, 842, 4, 2, 'crop', 'none', 'picture'],
    ]),
    vendor: Object.freeze([2351, 741]),
  }),
  GCR202JSVIN1STL: Object.freeze({
    source: 'Tiny Speck street picture groddle-meadow/LCR202JSVIN1STL_main_1339298354.jpg (G1085)',
    beds: Object.freeze([
      [905, 866, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [1813, 893, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [2128, 884, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [3080, 843, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [3449, 861, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [3867, 889, 4, 2, 'crop', 'none', 'picture spot, size kept'],
      [4265, 870, 4, 2, 'crop', 'none', 'picture spot, size kept'],
    ]),
    vendor: Object.freeze([1550, 877]),
  }),
});

function pictureRow(tsid) {
  const want = body(tsid);
  const key = want && Object.keys(PICTURE_GARDEN_SPOTS).find((k) => body(k) === want);
  return key ? PICTURE_GARDEN_SPOTS[key] : null;
}

/** PURE: a street's beds read off Tiny Speck's picture (PICTURE_GARDEN_SPOTS) as measuredGardenBeds gives them, with `how`, or null. */
export function pictureGardenBeds(tsid) {
  const row = pictureRow(tsid);
  if (!row) return null;
  return row.beds.map(([x, y, cols, rows, kind, style, how]) => ({ x, y, cols, rows, gardenType: kind === 'herb' ? 'herb' : 'default', style, how }));
}

/**
 * PURE: where the snaps show the street's Gardening Tools Vendor (the scarecrow's feet), else where
 * Tiny Speck's street picture shows it (PICTURE_GARDEN_SPOTS `vendor`, G1085), or null.
 */
export function measuredGardenVendor(tsid) {
  const v = spotsRow(tsid)?.vendor || pictureRow(tsid)?.vendor;
  return Array.isArray(v) && Number.isFinite(v[0]) && Number.isFinite(v[1]) ? { x: v[0], y: v[1] } : null;
}

/** A bed's drawn width (garden-view.js gardenLayout's box, plants left out): its planner footprint. */
export function gardenBedWidth({ cols = 4, rows = 2, style = 'none' } = {}) {
  return Math.ceil(gardenLayout({ cols, rows, style }).box.w);
}
