/**
 * G1208 (#590): after a logout mid-quest the top bar said Jappa Chae while the scene showed Budae
 * Bada's one-arm Hobak Habitat signpost (the report's spot, 1767,876 in page terms, is x -1233 on a
 * street 6000 wide: beside Budae Bada's signpost_3 at -1173, where Jappa Chae has none).
 * enterStreet named the street (currentStreet, the top bar, the signposts' hit areas) before it
 * awaited the deco manifest, the signpost art, the arrivals table and the shrine art, and removed
 * the old scene before those awaits too; two loads that overlapped each did half, and the older
 * load's scene, added later, drew over the newer one. Glitch built one location at a time
 * (NetController.as 352-358, moveHasEnded 1748-1781).
 *
 * Now each load takes a turn (js/street-move.js createLoadTurns) and stops at its next step once a
 * newer one has begun, the old scene goes right before the new one is built, a home's scene takes
 * a turn too, and the first street at load is a trip (streetMove.run) so a trip sent meanwhile waits.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createLoadTurns, createStreetMove } from '../public/js/street-move.js?v=1c4431bf';

const root = join(import.meta.dirname, '..');
const src = readFileSync(join(root, 'public/game.js'), 'utf8');

/** A model of enterStreet's steps: name the street, wait for art, build the scene. */
function makeWorld(turns) {
  const world = { label: '', scenes: [], current: null };
  const tick = () => new Promise((r) => setImmediate(r));
  async function enter(street, waits) {
    const load = turns?.begin();
    await tick();
    if (load?.stale()) return null;
    world.label = street;
    for (let i = 0; i < waits; i += 1) await tick();
    if (load?.stale()) return null;
    world.scenes = world.scenes.filter((s) => s !== world.current);
    world.current = street;
    world.scenes.push(street);
    return street;
  }
  return { world, enter };
}

describe('G1208 the street named is the street drawn', () => {
  it('without turns, two overlapping loads leave the label on one street and a second scene drawn', async () => {
    const { world, enter } = makeWorld(null);
    // The old removal before the waits: model it as the slow load building after the fast one.
    const slow = enter('Budae Bada', 4);
    const fast = enter('Jappa Chae', 1);
    await Promise.all([slow, fast]);
    assert.equal(world.label, 'Jappa Chae');
    assert.equal(world.current, 'Budae Bada', 'the class: the label and the scene disagree');
  });

  it('with turns, the newest load names and draws the street; the older stops untouched', async () => {
    const turns = createLoadTurns();
    const { world, enter } = makeWorld(turns);
    const slow = enter('Budae Bada', 4);
    const fast = enter('Jappa Chae', 1);
    const [a, b] = await Promise.all([slow, fast]);
    assert.equal(a, null, 'the older load stopped');
    assert.equal(b, 'Jappa Chae');
    assert.equal(world.label, world.current);
    assert.deepEqual(world.scenes, ['Jappa Chae'], 'one scene in the world');
  });

  it('a turn goes stale only when a newer one begins', () => {
    const turns = createLoadTurns();
    const a = turns.begin();
    assert.equal(a.stale(), false);
    const b = turns.begin();
    assert.equal(a.stale(), true);
    assert.equal(b.stale(), false);
  });

  it('a trip the game sends during the first street waits for it (streetMove.run then queue)', async () => {
    const move = createStreetMove({ maxWaitMs: 5000 });
    const order = [];
    let release;
    const boot = move.run(() => new Promise((r) => { release = r; }).then(() => order.push('boot')));
    const sent = move.queue(async () => order.push('sent'));
    await new Promise((r) => setImmediate(r));
    assert.deepEqual(order, [], 'the sent trip has not started beside the first load');
    release();
    await Promise.all([boot, sent]);
    assert.deepEqual(order, ['boot', 'sent']);
  });

  it('game.js: every step of enterStreet checks its turn, and the old scene goes right before the new is built', () => {
    const start = src.indexOf('async function enterStreet(tsid, opts = {}) {');
    const body = src.slice(start, src.indexOf('\n}\n', start));
    const begin = body.indexOf('const load = streetLoads.begin();');
    assert.ok(begin > 0, 'enterStreet takes a turn');
    const lines = body.split('\n');
    const awaits = lines.map((l, i) => [l, i]).filter(([l]) => /\bawait\b/.test(l));
    assert.ok(awaits.length >= 5, `awaits: ${awaits.length}`);
    for (const [line, i] of awaits) {
      assert.ok(body.indexOf(line) > begin, `turn taken before: ${line.trim()}`);
      const next = lines.slice(i + 1, i + 3).join('\n');
      const own = /await loadDecoManifest\(\)/.test(line); // the signpost art follows it at once
      assert.ok(own || /if \(load\.stale\(\)\) return null;/.test(next), `checked after: ${line.trim()}`);
    }
    const removal = body.indexOf('world.removeChild(bgLayer);');
    assert.ok(removal > body.indexOf('await loadSignpostTextures(PIXI);'), 'the old scene goes after the art awaits');
    assert.ok(removal < body.indexOf('bgLayer = buildStreetView('), 'and right before the new one');
    assert.match(src, /async function renderHomeScene\([^)]*\) \{\n(?:\s*\/\/[^\n]*\n)*\s*streetLoads\.begin\(\);/, 'a home scene takes a turn');
    assert.match(src, /await streetMove\.run\(\(\) => enterStreet\(startTsid, startOpts\)\);/, 'the first street is a trip');
    assert.match(src, /async function spawnShrine\(placement = null, \{ stale = \(\) => false \} = \{\}\)/);
  });
});
