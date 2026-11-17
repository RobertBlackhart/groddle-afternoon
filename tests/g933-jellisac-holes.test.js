/**
 * G933 (#453, #460): on Quinmchary a planned Jellisac sat on a ledge while the street's third hole
 * (ground_cutaway_hollow3 at 577,657) stood empty. Jellisacs live in the ground cutaway hollows
 * (168 of the 211 measured on players' snaps sit in one), so one the snaps never measured is seated
 * in an empty hole before any is planned on a floor (tools/build-jellisac-hole-spots.mjs).
 *
 * Run: node --test tests/g933-jellisac-holes.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildJellisacHoleSpots, seatInHoles, streetHoles } from '../tools/build-jellisac-hole-spots.mjs';
import { JELLISAC_SPOTS } from '../public/js/node-spots-data.js?v=97d4281c';
import { measuredNodeSpots } from '../public/js/street-ecology.js?v=c9852cb0';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('Jellisacs sit in their street\'s empty holes first (#453)', () => {
  it('the data file is current', () => {
    assert.equal(read('public/js/jellisac-hole-spots-data.js'), buildJellisacHoleSpots().text, 'run node tools/build-jellisac-hole-spots.mjs');
  });

  it('Quinmchary seats its tenth Jellisac in the third hole, the nine measured first in their order', () => {
    const street = JSON.parse(read('public/assets/streets/GTJ101FB0SO17JK.json'));
    assert.deepEqual(streetHoles(street).map(([x]) => x), [63, 111, 577]);
    const rows = measuredNodeSpots('GTJ101FB0SO17JK').jellisac;
    assert.equal(rows.length, 10);
    assert.deepEqual(rows.slice(0, 9).map((r) => [r.x, r.y]), JELLISAC_SPOTS.GTJ101FB0SO17JK.map(([x, y]) => [x, y]));
    assert.deepEqual([rows[9].x, rows[9].y], [577, 653]);
  });

  it('a hole a measured Jellisac sits in is taken; never more than the file names', () => {
    const measured = [[100, 500, 2]];
    const holes = [[98, 504], [400, 600], [700, 610]];
    assert.deepEqual(seatInHoles(measured, holes, 2), [[100, 500, 2], [400, 600, 1]]);
    assert.deepEqual(seatInHoles(measured, holes, 1), [[100, 500, 2]]);
    assert.equal(seatInHoles([], holes, 5).length, 3);
  });

  it('only the middleground hollows count (a background layer\'s are drawn elsewhere)', () => {
    const street = { bounds: { l: -100, t: -500 }, layers: [
      { name: 'bg_2', decos: [{ sprite: 'ground_cutaway_hollow2', x: 0, y: 0 }] },
      { name: 'middleground', decos: [{ sprite: 'ground_cutaway_hollow3', x: 0, y: 0 }, { sprite: 'ground_cutaway_fossil1', x: 10, y: 0 }] },
    ] };
    assert.deepEqual(streetHoles(street), [[100, 496]]);
  });
});
