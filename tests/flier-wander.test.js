/**
 * Street Butterflies and Batterflies wander inside their street (lane flyk, 2026-11-24: "street
 * butterflies and batterflies seeming to loop spawn").
 *
 * The cause: a street Butterfly flew one way across the street and was put back in at the far end
 * (online js/street-creatures.js flyerAt, solo game.js `if (b.x > WORLD_W + 40) b.x = -40`), so on
 * Hechey Track one came in at the left edge every 40 s, and on the 33 butterfly streets no wider
 * than two screens the exit and the re-entry were on one screen. A Batterfly swung 170 px either
 * side of its spot on an 18 s sine, so near an end of the street it flew off it and came back.
 *
 * Glitch flew each one at random over the whole street, in its band over the floor, never out of
 * it (npc_butterfly.js flyAround 886-969, npc_batterfly.js flyAround 1039-1052:
 * apiStartFlyingInTheArea(g.l, floor - band, g.r - g.l, band)). Now both kinds fly a seeded path
 * over the street (flierAt) that every page draws from the same clock, solo and online alike.
 *
 * The sweep: every Butterfly and Batterfly the realtime server lays out (its data/objects.json, the
 * same layout solo spawns), 30 minutes of its path, its art inside [0, street width] and no jump.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FLIER_LIFT, FLY_WANDER, flierAt, flierPlan, flierSeed, flightFloor, pathTime } from '../public/js/street-creatures.js?v=8574c2a4';
import { platformsScreen, streetWidth } from '../public/js/street-model.js?v=a9a05f9d';
import { serverPath, skipWithoutServer } from '../tools/repos.mjs';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const HECHEY_TRACK = 'GLI2V0UN7RD1T2J';
const MINUTES = 30;
const STEP_MS = 1000;

/** Every flier the server lays out, with its street's width and floor: { tsid, label, kind, i, x, y, worldW, floor }. */
function fliers() {
  const streets = JSON.parse(readFileSync(serverPath('data/objects.json'), 'utf8')).streets;
  const out = [];
  for (const [tsid, row] of Object.entries(streets)) {
    const rows = [
      ...(row.butterflies || []).filter((r) => r[3] === 1).map((r) => ['butterfly', r]),
      ...(row.batterflies || []).map((r) => ['batterfly', r]),
    ];
    if (!rows.length) continue;
    const file = join(root, 'public/assets/streets', `${tsid}.json`);
    if (!existsSync(file)) continue;
    const data = JSON.parse(readFileSync(file, 'utf8'));
    const worldW = streetWidth(data);
    const floor = flightFloor(platformsScreen(data), worldW);
    for (const [kind, [i, x, y]] of rows) out.push({ tsid, label: data.label || tsid, kind, i, x, y, worldW, floor });
  }
  return out;
}

let all = [];
before(() => {
  if (!skipWithoutServer) all = fliers();
});

describe('street fliers wander inside their street (flierAt)', () => {
  it(`no Butterfly or Batterfly on any street leaves [0, street width] or jumps, over ${MINUTES} minutes`, { skip: skipWithoutServer }, () => {
    const out = [];
    const counts = { butterfly: 0, batterfly: 0 };
    for (const f of all) {
      counts[f.kind] += 1;
      const half = FLIER_LIFT[f.kind].halfW;
      const home = { kind: f.kind, seed: flierSeed(f.kind, f.i, f.x), worldW: f.worldW, floor: f.floor, groundY: f.y };
      const max = flierPlan(home).speed * STEP_MS + 1e-6;
      let prev = null;
      let bad = null;
      for (let t = 0; t <= MINUTES * 60000 && !bad; t += STEP_MS) {
        const p = flierAt(home, t);
        if (p.x - half < 0 || p.x + half > f.worldW) bad = `at ${t / 1000} s its art spans ${Math.round(p.x - half)}..${Math.round(p.x + half)}`;
        else if (prev && Math.abs(p.x - prev.x) > max) bad = `at ${t / 1000} s it jumped ${Math.round(prev.x)} -> ${Math.round(p.x)}`;
        prev = p;
      }
      if (bad) out.push(`${f.label} (${f.tsid}) ${f.kind}:${f.i} on ${f.worldW} px: ${bad}`);
    }
    assert.ok(counts.butterfly >= 1500, `${counts.butterfly} flying Butterflies swept`);
    assert.ok(counts.batterfly >= 100, `${counts.batterfly} Batterflies swept`);
    assert.deepEqual(out, []);
  });

  it('on Hechey Track none comes in at the edge of the street: each turns back inside it', { skip: skipWithoutServer }, () => {
    const hechey = all.filter((f) => f.tsid === HECHEY_TRACK);
    assert.ok(hechey.length >= 2, 'Hechey Track has its flying Butterflies');
    for (const f of hechey) {
      const home = { kind: f.kind, seed: flierSeed(f.kind, f.i, f.x), worldW: f.worldW, floor: f.floor, groundY: f.y };
      let turns = 0;
      let prev = null;
      let low = Infinity;
      let high = -Infinity;
      for (let t = 0; t <= 10 * 60000; t += 100) {
        const p = flierAt(home, t);
        if (prev && p.dir !== prev.dir) turns += 1;
        low = Math.min(low, p.x);
        high = Math.max(high, p.x);
        prev = p;
      }
      assert.ok(turns >= 4, `${f.kind}:${f.i} turns ${turns} times in 10 minutes`);
      assert.ok(low >= FLY_WANDER.butterfly.edge - 1e-9 && high <= f.worldW - FLY_WANDER.butterfly.edge + 1e-9, `${low}..${high}`);
      // ...and it goes about the street, not round its spot.
      assert.ok(high - low > f.worldW / 2, `${f.kind}:${f.i} ranges ${Math.round(low)}..${Math.round(high)} of ${f.worldW}`);
    }
  });

  it('every page draws a flier from the same seed and clock: solo, online, and two players alike', () => {
    // Solo (game.js spawnButterflies, animal-husbandry-feature batterflyFlight) and online
    // (street-objects-feature) seed it by its kind, spawn index and spot.
    const game = read('public/game.js');
    assert.match(game, /seed: flierSeed\('butterfly', flyIndex, spotX\),/);
    assert.doesNotMatch(game, /WORLD_W \+ 40/, 'no wrap round');
    const shared = read('public/js/features/street-objects-feature.js');
    assert.match(shared, /seed: flierSeed\('butterfly', obj\.index, spot\.x\),/);
    assert.match(shared, /batterflyHome', t, Number\(spot\[0\]\), Number\(spot\[1\]\), engine\)/);
    const husbandry = read('public/js/features/animal-husbandry-feature.js');
    assert.match(husbandry, /seed: flierSeed\('batterfly', m \? Number\(m\[1\]\) : 0, x\),/);
    assert.match(husbandry, /return batterflyFlight\(engine, entity\.key, x, surfaceAt\(engine, x, y\)\);/);
    // Two players, their clocks 10 s apart, at the same moment on the server's clock.
    const home = { kind: 'butterfly', seed: flierSeed('butterfly', 4, 1200), worldW: 2400, groundY: 600 };
    const server = 2_000_000_000_000;
    const a = flierAt(home, pathTime({ lag: 900, holdEnd: 0 }, server - 4000, 4000));
    const b = flierAt(home, pathTime({ lag: 900, holdEnd: 0 }, server + 6000, -6000));
    assert.deepEqual(a, b);
  });

  it('the server takes a verb on a Batterfly from anywhere it flies (creatureReach)', { skip: skipWithoutServer }, () => {
    // Its path spans the whole street (above), so its reach does too, up and down (as a Butterfly's,
    // G755); objects_creatures_test.go TestABatterflyIsReachedAnywhereItFliesOnItsStreet holds every
    // Batterfly from a street's width away. Its Guano pile keeps its spot's reach.
    const go = readFileSync(serverPath('objects_creatures.go'), 'utf8');
    assert.match(go, /if spot\.fly \|\| spot\.kind == "batterfly" \{\n\t\treturn math\.Inf\(1\), math\.Inf\(1\)/);
    const objects = readFileSync(serverPath('objects.go'), 'utf8');
    assert.match(objects, /if spot\.kind == "batterfly" && m\.Verb == "pickup" \{/);
    // A Batterfly waits for the player at it, for everyone (npc_batterfly.js onWaitStart 1074-1081).
    assert.doesNotMatch(objects, /spot\.kind == "batterfly" \{\n\t\t\tno\("bad_verb"/);
    assert.doesNotMatch(read('public/js/features/street-objects-feature.js'), /a\.kind === 'batterfly' \|\| now\.has/);
  });
});
