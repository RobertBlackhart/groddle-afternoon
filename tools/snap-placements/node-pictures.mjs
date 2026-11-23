/**
 * Peat Bogs, Dirt Piles and trants where a street's 2011-2012 whole-street pictures show them, on
 * streets no player's full-street snap covers (lane nodek, #633 G1182). Glitch set all three by hand
 * (peat_1.js, dirt_pile.js, trant_*.js obey_physics false) and the 2012 location files only count
 * them, so without a spot the planner (street-ecology.js planStreetPlacements) chose a floor of its
 * own: Bonelington Hole's Dirt Pile at the far west end, where the street's pictures show it in the
 * cave beside the two Egg Plants, and Luiro Run's and Naatamo Way's fourth Peat Bog nowhere at all
 * (PLANNED_NODE_CAPS seats at most 3 planned bogs), though both pictures show four.
 *
 * Evidence and method: node-pictures.json (hand-kept: each street's pictures and the spots read off
 * them by matching our own CC0 art, as tools/snap-placements/nodes.py does on snaps). This tool checks
 * each street (its file names at least that many of the class, and no snap already measures it),
 * seats a Peat Bog or Dirt Pile that hangs more than SEAT_HANG px over its floor onto it (nodes.py's
 * rule, #303: the frame cell's bottom centre on the line; trees stay as read, their trunk's foot
 * stands a little over the line as on the snaps) and writes public/js/node-picture-spots-data.js,
 * which street-ecology.js MEASURED_NODE_SPOTS (peat_1, dirt_pile) and measuredTreeSpots read after
 * the snaps' own spots (node-spots-data.js).
 *
 *   node tools/snap-placements/node-pictures.mjs          write
 *   node tools/snap-placements/node-pictures.mjs --check  exit 1 if stale or a street fails a check
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PEAT_SPOTS, TREE_SPOTS } from '../../public/js/node-spots-data.js?v=97d4281c';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const check = process.argv.includes('--check');

/** nodes.py SEAT_HANG / SEAT_SINK: more than this over the floor beneath is hanging; a line this far over still counts as beneath. */
export const SEAT_HANG = 25;
export const SEAT_SINK = 15;
/** Each class's export, its snap spots (a street the snaps measure is left to them) and its cell widths by variant. */
const CLASSES = Object.freeze({
  peat_1: { export: 'PEAT_PICTURE_SPOTS', snaps: PEAT_SPOTS, cells: { 1: 211, 2: 166, 3: 178 }, seat: true },
  dirt_pile: { export: 'DIRT_PILE_PICTURE_SPOTS', snaps: {}, cells: { 1: 195, 2: 195 }, seat: true },
  trees: { export: 'TREE_PICTURE_SPOTS', snaps: TREE_SPOTS, cells: {}, seat: false },
});
const TREE_CLASSES = ['trant_fruit', 'trant_egg', 'trant_bean', 'trant_bubble', 'trant_spice', 'trant_gas'];

/** PURE: a street's standable lines in street px (nodes.py street_floors: pc_perm 1 and 0 are not floors). */
export function streetFloors(street) {
  const { l, t } = street.bounds;
  return (street.platforms || []).filter((p) => p.pc_perm !== 0 && p.pc_perm !== 1).map((p) => {
    const a = [p.x1 - l, p.y1 - t];
    const b = [p.x2 - l, p.y2 - t];
    return { id: p.id, a: a[0] <= b[0] ? a : b, b: a[0] <= b[0] ? b : a };
  });
}

/** PURE: nodes.py floor_under: the nearest line at x not more than SEAT_SINK over y, { y, id }, or null. */
export function floorUnder(floors, x, y) {
  let best = null;
  for (const { id, a, b } of floors) {
    if (x < a[0] || x > b[0]) continue;
    const ly = b[0] - a[0] < 1e-6 ? Math.min(a[1], b[1]) : a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]);
    if (ly >= y - SEAT_SINK && (!best || ly < best.y)) best = { y: ly, id };
  }
  return best;
}

const num = (v) => Math.round(v * 10) / 10;

function main() {
  const source = JSON.parse(readFileSync(join(root, 'tools/snap-placements/node-pictures.json'), 'utf8'));
  const ecology = JSON.parse(readFileSync(join(root, 'public/assets/content/street-ecology.json'), 'utf8')).streets;
  const out = Object.fromEntries(Object.keys(CLASSES).map((cls) => [cls, {}]));
  const failed = [];
  const seated = [];
  for (const [tsid, row] of Object.entries(source.streets).sort(([a], [b]) => a.localeCompare(b))) {
    const street = JSON.parse(readFileSync(join(root, 'public/assets/streets', `${tsid}.json`), 'utf8'));
    const counts = ecology[tsid]?.counts || {};
    const floors = streetFloors(street);
    for (const [cls, rule] of Object.entries(CLASSES)) {
      const spots = row[cls];
      if (!spots?.length) continue;
      if (rule.snaps[tsid]?.length) failed.push(`${row.label} ${cls}: the snaps already measure it`);
      const have = cls === 'trees' ? TREE_CLASSES.reduce((n, c) => n + (counts[c] || 0), 0) : counts[cls] || 0;
      if (spots.length > have) failed.push(`${row.label} ${cls}: ${spots.length} spots, the file names ${have}`);
      if (cls === 'trees' && spots.some((s) => !counts[s[2]])) failed.push(`${row.label}: a tree class the file does not name`);
      out[cls][tsid] = spots.map((spot) => {
        const [x, y] = spot;
        const under = floorUnder(floors, x, y);
        if (!under) {
          failed.push(`${row.label} ${cls} ${x},${y}: no floor under it`);
          return spot;
        }
        if (!rule.seat || under.y - y <= SEAT_HANG) return spot;
        // A side resting on a nearer floor (a step under it) stays, as nodes.py seat_spots.
        const q = (rule.cells[spot[2]] || Object.values(rule.cells)[0]) / 4;
        if ([x - q, x + q].some((px) => { const f = floorUnder(floors, px, y); return f && f.y - y <= SEAT_HANG; })) return spot;
        seated.push(`${row.label} ${cls} ${x}: ${y} -> ${num(under.y)} (${under.id})`);
        return [x, num(under.y), ...spot.slice(2)];
      });
    }
  }

  const body = Object.entries(CLASSES).map(([cls, rule]) => {
    const rows = Object.entries(out[cls]).map(([tsid, spots]) => `  ${JSON.stringify(tsid)}: ${JSON.stringify(spots)},`).join('\n');
    return `export const ${rule.export} = Object.freeze({\n${rows}\n});\n`;
  }).join('\n');
  const text = `// Generated by tools/snap-placements/node-pictures.mjs from tools/snap-placements/node-pictures.json: never edit by hand.
/**
 * #633 (G1182): Peat Bogs, Dirt Piles and trants where 2011-2012 whole-street pictures show them, on
 * streets no player's snap covers. { [G tsid]: rows } in street px (0, 0 = the street's top left):
 * PEAT_PICTURE_SPOTS and DIRT_PILE_PICTURE_SPOTS [x, y, variant] (the frame cell's bottom centre;
 * peat<n>, dirt<n>), TREE_PICTURE_SPOTS [x, y, class, stage] (the trunk's foot). street-ecology.js
 * MEASURED_NODE_SPOTS and measuredTreeSpots read them after node-spots-data.js.
 */

${body}`;
  const file = join(root, 'public/js/node-picture-spots-data.js');
  let before = '';
  try { before = readFileSync(file, 'utf8'); } catch { /* new */ }
  if (failed.length) console.error(failed.join('\n'));
  for (const line of seated) console.log(`seated ${line}`);
  if (check) {
    if (before !== text || failed.length) {
      console.error('public/js/node-picture-spots-data.js is stale: run node tools/snap-placements/node-pictures.mjs');
      process.exit(1);
    }
    console.log(`node picture spots are current (${Object.keys(source.streets).length} streets)`);
    return;
  }
  if (failed.length) process.exit(1);
  writeFileSync(file, text);
  console.log(`wrote public/js/node-picture-spots-data.js (${Object.keys(source.streets).length} streets)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
