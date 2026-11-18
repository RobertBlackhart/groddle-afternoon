/**
 * G978 (Austin 2026-11-17, R16 calls): the inventions he ruled out are gone from the game and
 * recorded as dropped in tools/inventions/inventions.json with the ruling. Each test reads the
 * code that drew one, so it cannot come back unregistered.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { VENDOR_PROFILES } from '../public/js/vendor.js?v=d88e1a67';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const game = read('public/game.js');
const register = JSON.parse(read('tools/inventions/inventions.json'));
const entry = (id) => register.entries.find((e) => e.id === id);
const fn = (src, name) => {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at >= 0, name);
  return src.slice(at, src.indexOf('\n}\n', at) + 2);
};

function dropped(id) {
  const e = entry(id);
  assert.equal(e?.status, 'dropped', id);
  assert.match(e.ruling, /Austin 2026-11-17 \(G978/, id);
  assert.ok(e.rows.includes('G978'), id);
}

describe('G978: dropped inventions stay gone', () => {
  it('the vendor crest: no disc or store letter on a Street Spirit (GSJS spirits have only store_id)', () => {
    dropped('vendor-crest');
    const spawn = fn(game, 'spawnVendorNpc');
    assert.doesNotMatch(spawn, /crest|badge|\.circle\(/);
    for (const v of Object.values(VENDOR_PROFILES)) assert.equal('badge' in v, false, v.key);
    assert.doesNotMatch(read('build-stores.mjs'), /badge/);
    assert.match(read('public/js/features/street-spirits-feature.js'), /const \[body, label\] = g\.children;/);
  });
});

describe('G978: no dot bursts', () => {
  it('nothing scatters coloured dots round the avatar after an action (no client counterpart)', () => {
    dropped('burst-dots');
    assert.doesNotMatch(game, /\bburst\(/);
    assert.doesNotMatch(game, /\bparticles\b/);
    assert.doesNotMatch(read('public/js/paradise-course-runtime.js'), /host\.burst/);
    assert.doesNotMatch(read('public/js/features/seasons-feature.js'), /\bburst\(|tickFx/);
  });
});

describe('G978: flyers fly on (npc_butterfly.js flyAround)', () => {
  it('a yard Butterfly never stops in the air and flies level at its own height; street flyers too', async () => {
    dropped('flyer-hover-bob');
    const { YARD_WANDER, yardPlan, yardWanderAt } = await import('../public/js/yard-wander.js?v=347e657a');
    const { CREATURE_PATHS, flyerAt } = await import('../public/js/street-creatures.js?v=d7a9a5d4');
    assert.equal('pauses' in YARD_WANDER.npc_butterfly, false);
    assert.equal('bob' in YARD_WANDER.npc_butterfly, false);
    const plan = yardPlan({ id: 'a5', classId: 'npc_butterfly', left: 300, right: 800 });
    assert.ok(plan.segs.every((s) => s.pose === 'walk'), 'no hover');
    const animal = { id: 'a5', classId: 'npc_butterfly', homeX: 500, worldW: 2000 };
    const lifts = new Set();
    for (let t = 0; t < 60_000; t += 500) lifts.add(yardWanderAt(animal, t).lift);
    assert.equal(lifts.size, 1, 'one height, no bob');
    assert.deepEqual(Object.keys(CREATURE_PATHS.fly).sort(), ['margin', 'speed']);
    const home = { x0: 100, baseY: 400, worldW: 2000 };
    assert.equal(flyerAt(home, 0).y, flyerAt(home, 3_333).y);
    assert.doesNotMatch(game, /b\.phase/);
  });
});
