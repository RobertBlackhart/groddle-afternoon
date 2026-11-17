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

/** PURE: where the snaps show the street's Gardening Tools Vendor (the scarecrow's feet), or null. */
export function measuredGardenVendor(tsid) {
  const v = spotsRow(tsid)?.vendor;
  return Array.isArray(v) && Number.isFinite(v[0]) && Number.isFinite(v[1]) ? { x: v[0], y: v[1] } : null;
}

/** A bed's drawn width (garden-view.js gardenLayout's box, plants left out): its planner footprint. */
export function gardenBedWidth({ cols = 4, rows = 2, style = 'none' } = {}) {
  return Math.ceil(gardenLayout({ cols, rows, style }).box.w);
}
