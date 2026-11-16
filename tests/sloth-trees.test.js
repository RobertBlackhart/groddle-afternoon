/** G891: every Sloth in its own street's tree (js/sloth-trees.js, tools/build-sloth-spots.mjs). */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { slothSpotFromRow } from '../public/js/sloth-trees.js?v=a3299191';
import { SLOTH_SPOTS } from '../public/js/sloth-spots-data.js?v=7396e9db';
import { buildSlothSpots, slothStreets } from '../tools/build-sloth-spots.mjs';
import { measuredNodeSpots, populationForStreet } from '../public/js/street-ecology.js?v=7435cfce';
import { SLOTH_SHEETS } from '../public/js/sloth-art.js?v=a2768e2f';
import {
  resourcePlacementGroups,
  resourceSpawnPlan,
  slothGeometry,
  slothSpotsFromArt,
} from '../public/js/features/resource-nodes-feature.js?v=e78c6e36';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ecology = JSON.parse(readFileSync(join(root, 'public/assets/content/street-ecology.json'), 'utf8'));
const street = (tsid) => JSON.parse(readFileSync(join(root, 'public/assets/streets', `${tsid}.json`), 'utf8'));

/**
 * The 7 Sloths hanging out in the Eleven players' 2012 snaps (hands on the branch, street px with
 * y up negative, measured by the sloth audit; reference positions only, no snap pixels).
 */
const SNAPPED = [
  ['GA55645B8O528MI', 0, -90, -540, 1], // Jonna Jinx (cleops)
  ['GA55645B8O528MI', 1, 2057, -796, -1],
  ['GDO3JFLC5TQ2NOR', 1, -142, -562, 1], // Panna Meral (cleops)
  ['GDO97PV01MQ236V', 0, -2078, -564, 1], // Billore Crys (Crys2_cleops)
  ['GDO97PV01MQ236V', 1, -730, -409, -1],
  ['GHFO1IFRP3J28EU', 1, 2240, -545, 1], // Leetha Beetha (Beetha2_cleops)
  ['GHFEKBJFP0J2J9Q', 0, 1270, -1872, -1], // Kaha Haha (cleops)
];

describe('sloth trees (G891)', () => {
  it('the written spots are current and the tool finds one tree per Sloth', () => {
    const { text, wrong } = buildSlothSpots();
    assert.deepEqual(wrong, []);
    assert.equal(readFileSync(join(root, 'public/js/sloth-spots-data.js'), 'utf8'), text, 'run node tools/build-sloth-spots.mjs');
  });

  it('places all 84 Sloths on the 37 streets, as many per street as its location file names', () => {
    const want = slothStreets(ecology);
    assert.equal(Object.keys(want).length, 37);
    assert.deepEqual(Object.keys(SLOTH_SPOTS).sort(), Object.keys(want).sort());
    let total = 0;
    for (const [tsid, { label, want: n }] of Object.entries(want)) {
      assert.equal(SLOTH_SPOTS[tsid].length, n, label);
      total += n;
    }
    assert.equal(total, 84);
  });

  it('numbers each street left to right, the rule run on the street art', () => {
    for (const [tsid, rows] of Object.entries(SLOTH_SPOTS)) {
      const xs = rows.map((r) => r[0]);
      assert.deepEqual(xs, [...xs].sort((a, b) => a - b), tsid);
      // A builder street runs the same rule on its own art at run time.
      assert.deepEqual(slothSpotsFromArt(street(tsid)).map((s) => [s.x, s.y, s.sloth.dir, s.sloth.floor, s.sloth.knocker.x, s.sloth.knocker.y]), rows, tsid);
    }
  });

  it('hangs the 7 snapped Sloths within 24 px of the snaps, on the side they hung', () => {
    for (const [tsid, index, sx, sy, dir] of SNAPPED) {
      const { l, t } = street(tsid).bounds;
      const spot = slothSpotFromRow(SLOTH_SPOTS[tsid][index]);
      assert.ok(Math.abs(spot.x - (sx - l)) <= 24, `${tsid} ${index} x ${spot.x} vs ${sx - l}`);
      assert.ok(Math.abs(spot.y - (sy - t)) <= 21, `${tsid} ${index} y ${spot.y} vs ${sy - t}`);
      assert.equal(spot.dir, dir, `${tsid} ${index} dir`);
    }
  });

  it('keeps every Sloth well inside its street: Kaha Haha is no longer cut off at the top', () => {
    const climb = Math.max(...Object.values(SLOTH_SHEETS).map((s) => s.origin.y));
    for (const [tsid, rows] of Object.entries(SLOTH_SPOTS)) {
      const { l, r, t, b } = street(tsid).bounds;
      for (const row of rows) {
        const spot = slothSpotFromRow(row);
        // Its tallest frame (climbing up into the leaves) stays under the top edge: the closest is
        // Paaviri Vent's first tree, its crown 151 px under the edge.
        assert.ok(spot.y - climb >= 40, `${tsid}: the sloth's top ${spot.y - climb} px under the top edge`);
        assert.ok(spot.x > 0 && spot.x < r - l && spot.floor <= b - t, tsid);
        const lift = spot.floor - spot.y;
        assert.ok(lift >= 150 && lift <= 260, `${tsid} lift ${lift}`);
        assert.ok(spot.knocker.y < spot.floor && spot.knocker.y > spot.y, `${tsid} Knocker between the branch and the floor`);
      }
    }
    // Kaha Haha's one Sloth: 1268,-1860 left of its trunk (the snap: 1270,-1872), 640 px under the top.
    const kaha = slothSpotFromRow(SLOTH_SPOTS.GHFEKBJFP0J2J9Q[0]);
    assert.deepEqual([kaha.x, kaha.y, kaha.dir], [1268 + 2000, -1860 + 2500, -1]);
    assert.ok(kaha.y - climb > 500);
  });

  it('a sloth street plans no Sloth and spawns npc_sloth:<i> at the i-th tree from the left', () => {
    const tsid = 'GDOT3LP63TQ204B'; // Heera Amond, 4 Sloths
    const pop = populationForStreet(tsid, ecology.streets[tsid]);
    assert.equal(measuredNodeSpots(tsid).npc_sloth.length, 4);
    assert.ok(!resourcePlacementGroups(pop).some((g) => g.key.endsWith('npc_sloth')));
    const asked = [];
    const plan = resourceSpawnPlan(pop, (key) => { asked.push(key); return []; }).filter((p) => p.classTsid === 'npc_sloth');
    assert.ok(!asked.some((key) => key.endsWith('npc_sloth')));
    assert.deepEqual(plan.map((p) => p.key), ['npc_sloth:0', 'npc_sloth:1', 'npc_sloth:2', 'npc_sloth:3']);
    plan.forEach((p, i) => {
      const [x, y, dir, floor, kx, ky] = SLOTH_SPOTS[tsid][i];
      assert.deepEqual([p.x, p.y, p.sloth.dir, p.sloth.floor, p.sloth.knocker.x, p.sloth.knocker.y], [x, y, dir, floor, kx, ky]);
    });
  });

  it('a street with Sloths but no tree spawns none (no floor stand-in)', () => {
    const bare = { bounds: { l: 0, r: 1000, t: -500, b: 0 }, layers: [], platforms: [{ x1: 0, y1: -10, x2: 1000, y2: -10 }] };
    const plan = resourceSpawnPlan({ resourceNodeClasses: ['npc_sloth'] }, () => [{ x: 10, y: 400 }], bare);
    assert.deepEqual(plan, []);
  });

  it('mirrors a left-hand Sloth and reaches from its leaves down to the floor', () => {
    const right = slothGeometry({ x: 1000, y: 400, sloth: { dir: 1, floor: 600, knocker: { x: 890, y: 525 } } });
    const left = slothGeometry({ x: 1000, y: 400, sloth: { dir: -1, floor: 600, knocker: { x: 1110, y: 525 } } });
    assert.equal(right.box.bottom, 600);
    assert.equal(right.box.top, 400 - 96);
    assert.deepEqual([left.box.left, left.box.right], [2000 - right.box.right, 2000 - right.box.left]);
    assert.equal(left.mouth.x, 2000 - right.mouth.x);
    assert.equal(left.speech.x, 2000 - right.speech.x);
    // The Knocker on the trunk stays outside the sloth's box, so each is its own thing to point at.
    assert.ok(right.knocker.x < right.box.left && left.knocker.x > left.box.right);
  });
});
