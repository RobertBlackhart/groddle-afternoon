/**
 * Paced waits (js/pace.js PACED_WAITS, R21): one row each, and every copy of the wait reads it.
 *
 * rock_respawn (#521, Austin 2026-11-19): a mined-out rock reforms 8 min on in Glitch
 * (items/include/mining.js 422, apiSetTimerX('onRespawn', 1000 * 60 * (8 + extra_time))); the remake
 * takes 0.3 of that, 144 s. Five places use it across the three repos: solo mining (js/mining.js
 * mineRock), a visited home's rocks (js/yard-stock-mp.js), help-mining crews
 * (js/features/help-mine-feature.js), the realtime server (objects.go, from data/objects.json
 * rules.rockRespawnMs) and the site (src/HomeYard.php, from data/yard-verbs.json respawnMs, and its
 * fallback). This fails when any of them disagrees with the row.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { PACED_WAITS, ROCK_RESPAWN_MS, pacedWaitMs } from '../public/js/pace.js?v=ef709496';
import { createMineRock, mineRock, tickMineRock } from '../public/js/mining.js?v=2f096b98';
import { ROCK_RESPAWN_MS as YARD_ROCK_RESPAWN_MS, applyStockAct } from '../public/js/yard-stock-mp.js?v=7efdf803';
import { createInventory } from '../public/js/inventory.js?v=6414dbdc';
import { ruleTables } from '../tools/build-realtime-objects.mjs';
import { serverPath, sitePath, skipWithoutServer, skipWithoutSite } from '../tools/repos.mjs';

const game = (rel) => readFileSync(new URL(`../public/js/${rel}`, import.meta.url), 'utf8');

describe('paced waits read one row (js/pace.js PACED_WAITS)', () => {
  it('the rock row: Glitch 480 s at 0.3 is 144 s, ruled by Austin for #521', () => {
    assert.deepEqual({ ...PACED_WAITS.rock_respawn }, { glitchMs: 480000, factor: 0.3, ruling: 'Austin 2026-11-19, #521' });
    assert.equal(pacedWaitMs('rock_respawn'), 144000);
    assert.equal(ROCK_RESPAWN_MS, 144000);
    assert.throws(() => pacedWaitMs('no_such_wait'));
  });

  it('solo mining: a cleared rock reforms ROCK_RESPAWN_MS on, not a ms sooner', () => {
    const rock = createMineRock('rock_sparkly_1', { chunksRemaining: 3 });
    const r = mineRock(rock, createInventory({ pick: 1 }), { energy: 100, imagination: 0, xp: 0 }, {
      learned: ['mining_1'], requireSkill: true, rng: () => 0.99, now: 1000,
    });
    assert.equal(r.cleared, true);
    assert.equal(rock.respawnAt, 1000 + ROCK_RESPAWN_MS);
    assert.equal(tickMineRock(rock, 1000 + ROCK_RESPAWN_MS - 1), false);
    assert.equal(tickMineRock(rock, 1000 + ROCK_RESPAWN_MS), true);
    assert.doesNotMatch(game('mining.js'), /respawnAt\s*=\s*[^;\n]*\b\d{4,}\b/, 'no hand-typed respawn time in mining.js');
  });

  it('a visited home\'s rock and a help-mining crew take the same number', () => {
    assert.equal(YARD_ROCK_RESPAWN_MS, ROCK_RESPAWN_MS);
    const rocks = [{ classId: 'rock_metal_1', rock: { classTsid: 'rock_metal_1', chunksRemaining: 3, chunksMax: 50, depleted: false, respawnAt: 0 } }];
    const items = [{ id: 1, protoClass: 'proto_metal_rock', endClass: 'rock_metal_2', rx: -300, wear: 0 }];
    const b = applyStockAct({ rocks, nodes: {}, items }, { kind: 'rock', target: 'rock:0', verb: 'mine', took: 3, at: 2000 }, 2000);
    assert.equal(b.rock.depleted, true);
    assert.equal(b.rock.respawnAt, 2000 + ROCK_RESPAWN_MS);
    assert.match(game('yard-stock-mp.js'), /import \{ ROCK_RESPAWN_MS \} from '\.\/pace\.js/);
    const help = game('features/help-mine-feature.js');
    assert.match(help, /import \{ ROCK_RESPAWN_MS \} from '\.\.\/pace\.js/);
    assert.match(help, /rock\.respawnAt = Date\.now\(\) \+ ROCK_RESPAWN_MS;/);
    assert.doesNotMatch(help, /RESPAWN_MS\s*=\s*\d/, 'no hand-typed respawn time in help-mine-feature.js');
  });

  it('the realtime server reads rules.rockRespawnMs, which is the pace row', { skip: skipWithoutServer }, () => {
    const trants = JSON.parse(readFileSync(new URL('../public/assets/content/trants.json', import.meta.url), 'utf8'));
    assert.equal(ruleTables(trants).rockRespawnMs, ROCK_RESPAWN_MS);
    const objects = JSON.parse(readFileSync(serverPath('data', 'objects.json'), 'utf8'));
    assert.equal(objects.rules.rockRespawnMs, ROCK_RESPAWN_MS, 'data/objects.json is stale: node tools/build-realtime-objects.mjs');
    const go = readFileSync(serverPath('objects.go'), 'utf8');
    assert.doesNotMatch(go, /\brockRespawn\s*=/, 'no hand-typed rockRespawn constant');
    assert.match(go, /o\.schedule\(street, ob, o\.w\.rockRespawn\(\), o\.respawnRock\)/);
    // objects_test.go pins the same number so a pace change shows up in the server's own tests.
    const goTest = readFileSync(serverPath('objects_test.go'), 'utf8');
    const pinned = Number(goTest.match(/rockRespawn\(\); got != (\d+)\*time\.Second/)?.[1]) * 1000;
    assert.equal(pinned, ROCK_RESPAWN_MS);
  });

  it('the site reads respawnMs from data/yard-verbs.json, and its fallback is the same', { skip: skipWithoutSite }, () => {
    const verbs = JSON.parse(readFileSync(sitePath('data', 'yard-verbs.json'), 'utf8'));
    assert.equal(verbs.respawnMs, ROCK_RESPAWN_MS, 'data/yard-verbs.json is stale: node tools/build-yard-verbs.mjs');
    const php = readFileSync(sitePath('src', 'HomeYard.php'), 'utf8');
    const fallbacks = [...php.matchAll(/\$rules\['respawnMs'\]\s*\?\?\s*(\d+)/g)].map((m) => Number(m[1]));
    assert.deepEqual(fallbacks, [ROCK_RESPAWN_MS]);
  });
});
