/**
 * R46 (#614): a street trip that failed partway had no way back. Only 2 of the ~76 engine.enter
 * call sites caught a failure, game.js streetTripTo none, and features changed their own state
 * before the trip and assumed it arrived (the Subway's Get off, G1139). Glitch's server owned the
 * move (players/player.js transit_disembark_callback 2707, teleportToLocationDelayed); a client
 * whose load failed reconnected where it was.
 *
 * Now every trip has one failure contract (js/street-trip.js, game.js streetTripTo and
 * engine.enter): the load is tried again once, a street it began to replace is put back, the
 * player is told in one line, and engine.enter answers false instead of throwing. Callers that
 * change their own state for the trip check that answer (a ratchet below keeps new ones to it).
 * Run: node --test tests/street-trip-r46.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIP_TRIES, TripFailed, enterResult, tripFailedLine, tripWithRetry } from '../public/js/street-trip.js?v=89addd51';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const game = read('public/game.js');

const failedFetch = () => Promise.reject(new TypeError('Failed to fetch'));

describe('the trip failure contract (js/street-trip.js)', () => {
  it('tries a failed load once more and arrives when the second try works', async () => {
    let tries = 0;
    const said = [];
    const out = await tripWithRetry({
      label: 'Gregarious Grange',
      load: () => (++tries === 1 ? failedFetch() : 'street'),
      say: (l) => said.push(l),
    });
    assert.equal(TRIP_TRIES, 2);
    assert.equal(out, 'street');
    assert.equal(tries, 2);
    assert.deepEqual(said, [], 'nothing to say when it got there');
  });

  it('after the retry: puts back a street it began to replace, says one short line, throws TripFailed', async () => {
    const where = { street: 'A', torn: false };
    const restored = [];
    const said = [];
    let tries = 0;
    await assert.rejects(
      tripWithRetry({
        label: 'Gregarious Grange',
        load: () => {
          tries += 1;
          where.torn = true; // failed after clearing the old street
          return failedFetch();
        },
        snapshot: () => ({ street: where.street }),
        changed: () => where.torn,
        restore: (was) => {
          restored.push(was.street);
          where.torn = false;
        },
        say: (l) => said.push(l),
      }),
      (err) => err instanceof TripFailed && err.tripFailed && err.said && /Failed to fetch/.test(err.message),
    );
    assert.equal(tries, 2);
    assert.deepEqual(restored, ['A'], 'back on the street you were on');
    assert.deepEqual(said, ["Couldn't reach Gregarious Grange. Try again."]);
    assert.ok(!/—/.test(tripFailedLine('x')), 'no em dash');
  });

  it('a failure that never touched the street restores nothing', async () => {
    let restored = 0;
    await assert.rejects(tripWithRetry({ load: failedFetch, changed: () => false, restore: () => { restored += 1; } }));
    assert.equal(restored, 0);
  });

  it('enterResult: true on arrival, false (never a throw) on failure, saying a line only once', async () => {
    const said = [];
    const say = (l) => said.push(l);
    assert.equal(await enterResult(async () => {}, { say }), true);
    // The trip already said so (TripFailed): not said twice.
    assert.equal(await enterResult(() => tripWithRetry({ load: failedFetch, say, label: 'Here' }), { say, label: 'Here' }), false);
    assert.deepEqual(said, ["Couldn't reach Here. Try again."]);
    // A failure outside the load is said here.
    assert.equal(await enterResult(() => { throw new Error('boom'); }, { say, label: 'There' }), false);
    assert.deepEqual(said, ["Couldn't reach Here. Try again.", "Couldn't reach There. Try again."]);
  });

  it('game.js: every trip loads under the contract; engine.enter answers it; travel says it once', () => {
    const trip = game.slice(game.indexOf('async function streetTripTo('), game.indexOf('/** Energy tank size'));
    assert.match(trip, /const load = \(extra = \{\}\) => enterStreetOrStay\(tsid,/);
    assert.match(trip, /const arrived = await load\(\);/);
    assert.match(trip, /data = await load\(\{ quiet: true \}\);/);
    assert.doesNotMatch(trip, /await enterStreet\(/, 'no load outside the contract');
    const stay = game.slice(game.indexOf('function enterStreetOrStay('), game.indexOf('async function streetTripTo('));
    assert.match(stay, /return tripWithRetry\(\{/);
    assert.match(stay, /changed: \(was\) => currentStreet !== was\.street \|\| bgLayer !== was\.bg/);
    assert.match(stay, /restore: \(was\) => was\.tsid && enterStreet\(was\.tsid,/);
    const enter = game.slice(game.indexOf('  async enter(tsid, opts = {}) {'), game.indexOf('// G213: every energy/mood gain'));
    assert.match(enter, /const ok = await enterResult\(\(\) => enterStreetWithTransition\(resolved, opts\), \{ say, warn, label \}\);/);
    assert.match(enter, /if \(!ok\) homeState\.inHome = wasHome;/);
    assert.match(enter, /return ok;/);
    const travel = game.slice(game.indexOf('async function travelTo('), game.indexOf('/** Where an ordinary signpost cannot be used'));
    assert.match(travel, /if \(!err\?\.said\) toast\(tripFailedLine\(/);
  });
});

/* ------------------------------------------------------------------ */
/* New callers check engine.enter's answer                              */
/* ------------------------------------------------------------------ */

/**
 * Call sites that ignore engine.enter's answer, per file, when R46 landed. Most change nothing of
 * their own before the trip (a demo, a door with no key); the rest are listed in the R46 lane
 * report. This only goes down: a new call checks the answer (`ok = await engine.enter(...)`,
 * `(await engine.enter(...)) === false`, `return engine.enter(...)`), or converts an old one.
 */
const IGNORED_BASELINE = {
  'js/features/bureaucratic-halls-feature.js': 1,
  'js/features/crowns-feature.js': 3,
  'js/features/door-drink-feature.js': 2,
  'js/features/door-keys-feature.js': 1,
  'js/features/doors-feature.js': 1,
  'js/features/gwendolyn-room-23-feature.js': 2,
  'js/features/hell-feature.js': 4,
  'js/features/hell-tickets-feature.js': 1,
  'js/features/hog-haul-mp-feature.js': 2,
  'js/features/home-tower-feature.js': 2,
  'js/features/homes-feature.js': 1,
  'js/features/location-events-feature.js': 2,
  'js/features/map-routes-feature.js': 1,
  'js/features/mayhem-feature.js': 2,
  'js/features/meditation-feature.js': 1,
  'js/features/neighbours-mp-feature.js': 2,
  'js/features/newxp-feature.js': 10,
  'js/features/party-spaces-feature.js': 2,
  'js/features/purple-journey-feature.js': 1,
  'js/features/puzzle-scenes-feature.js': 1,
  'js/features/puzzles-feature.js': 3,
  'js/features/quest-instances-feature.js': 2,
  'js/features/races-feature.js': 1,
  'js/features/seasons-feature.js': 1,
  'js/features/secret-spots-feature.js': 1,
  'js/features/snaps-feature.js': 1,
  'js/features/street-furniture-feature.js': 2,
  'js/features/street-jobs-feature.js': 1,
  'js/features/subway-feature.js': 1,
  'js/features/teleportation-feature.js': 1,
  'js/quest-rooms/back-alley.js': 1,
  'js/quest-rooms/juju-camp.js': 1,
};

const CALL = /\bengine\.enter\??\.?\(/;
const HANDLED = [
  /=\s*\(?\s*await engine\.enter/,
  /\(\s*await engine\.enter[^\n]*\)\s*(===|!==)/,
  /return\s*\(?\s*(await\s+)?engine\.enter/,
  /=>\s*engine\.enter\??\.?\(/,
];

function jsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) jsFiles(p, out);
    else if (name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Lines calling engine.enter whose answer goes unread (comments left out). */
function ignoredEnterCalls(text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, '');
    if (/^\s*\*/.test(code) || !CALL.test(code)) return;
    if (!HANDLED.some((r) => r.test(code))) out.push(i + 1);
  });
  return out;
}

describe('R46: engine.enter callers read its answer', () => {
  it('the classifier', () => {
    assert.deepEqual(ignoredEnterCalls('  await engine.enter(a);\n  const ok = await engine.enter(b);\n  if ((await engine.enter(c)) === false) x();\n  // engine.enter(d)\n  return engine.enter(e);'), [1]);
  });

  it('no file ignores it more often than when R46 landed', () => {
    const pub = join(root, 'public');
    const seen = {};
    for (const f of jsFiles(join(pub, 'js'))) {
      const n = ignoredEnterCalls(readFileSync(f, 'utf8')).length;
      if (n) seen[relative(pub, f)] = n;
    }
    const over = Object.entries(seen).filter(([f, n]) => n > (IGNORED_BASELINE[f] || 0));
    assert.deepEqual(over, [], `check engine.enter's answer (false: the trip failed and said so) in: ${over.map(([f, n]) => `${f} (${n})`).join(', ')}`);
  });
});
