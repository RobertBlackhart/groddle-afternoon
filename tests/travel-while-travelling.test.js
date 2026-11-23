/**
 * G1129 (Austin, live): Enter at a signpost started a trip, and Enter again on the loading card
 * started another, so you could bounce between two streets. Now one street change runs at a time
 * (js/street-move.js, Glitch's moveModel.moving: NetController.as actuallyStartLocationMove
 * 352-358, moveHasEnded 1765-1781; TSFrontController.as maybeStartAvatarKeyControl 1237-1266):
 * a trip you ask for mid-move is refused, one the game sends you on waits, the state always clears
 * (after arrival and after a failed load), and a key held through the trip acts again only once
 * it is let go.
 * Run: node --test tests/travel-while-travelling.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStreetMove, travelTurn, GAME_SENT_VIAS } from '../public/js/street-move.js?v=1c4431bf';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');

const fnBody = (head) => {
  const at = game.indexOf(head);
  assert.ok(at >= 0, `${head} in game.js`);
  const end = game.indexOf('\n}\n', at);
  return game.slice(at, end);
};

/** A trip whose street load the test finishes (or fails) by hand. */
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** game.js travelTo in miniature: the turn first, then the trip through the queue. */
function harness() {
  const move = createStreetMove();
  const started = [];
  const loads = [];
  let running = 0;
  let most = 0;
  async function travel(tsid, via = 'signpost') {
    const turn = travelTurn({ moving: move.moving(), via });
    if (turn === 'refuse') return { ok: false, reason: 'moving' };
    while (turn === 'wait' && move.moving()) await move.whenStill();
    return move.queue(async () => {
      running += 1;
      most = Math.max(most, running);
      started.push(tsid);
      const load = deferred();
      loads.push(load);
      try {
        await load.promise;
        return { ok: true, toTsid: tsid };
      } finally {
        running -= 1;
      }
    });
  }
  return { move, travel, started, loads, most: () => most };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('G1129: one street change at a time', () => {
  it('Enter pressed again and again on the loading card starts only the first trip', async () => {
    const h = harness();
    const first = h.travel('B');
    assert.equal(h.move.moving(), true);
    const again = await Promise.all([h.travel('A'), h.travel('B'), h.travel('C'), h.travel('A', 'door'), h.travel('A', undefined)]);
    for (const r of again) assert.deepEqual(r, { ok: false, reason: 'moving' });
    assert.deepEqual(h.started, ['B']);
    h.loads[0].resolve();
    assert.deepEqual(await first, { ok: true, toTsid: 'B' });
    assert.equal(h.move.moving(), false, 'clear once the street is up');
    // After arrival the next trip goes.
    const back = h.travel('A');
    h.loads[1].resolve();
    assert.deepEqual(await back, { ok: true, toTsid: 'A' });
    assert.deepEqual(h.started, ['B', 'A']);
  });

  it('a failed load clears the state too, so travel works again', async () => {
    const h = harness();
    const first = h.travel('B');
    h.loads[0].reject(new Error('fetch failed'));
    await assert.rejects(first, /fetch failed/);
    assert.equal(h.move.moving(), false);
    const next = h.travel('C');
    assert.equal(h.started.at(-1), 'C');
    h.loads[1].resolve();
    assert.equal((await next).ok, true);
  });

  it('a follow the game sends mid-move waits and goes after, never alongside', async () => {
    const h = harness();
    const mine = h.travel('B');
    const follow = h.travel('C', 'follow');
    await tick();
    assert.deepEqual(h.started, ['B'], 'the follow waits');
    h.loads[0].resolve();
    await mine;
    await tick();
    assert.deepEqual(h.started, ['B', 'C']);
    h.loads[1].resolve();
    assert.equal((await follow).ok, true);
    assert.equal(h.most(), 1);
    assert.equal(h.move.moving(), false);
  });

  it('feature moves queued mid-move run one by one, and a failed one does not hold the rest', async () => {
    const move = createStreetMove();
    const order = [];
    let running = 0;
    let most = 0;
    const trip = (name, fail = false) => move.queue(async () => {
      running += 1;
      most = Math.max(most, running);
      order.push(name);
      await tick();
      running -= 1;
      if (fail) throw new Error(`${name} failed`);
      return name;
    });
    const results = await Promise.allSettled([trip('first'), trip('subway', true), trip('platform')]);
    assert.deepEqual(order, ['first', 'subway', 'platform']);
    assert.equal(most, 1);
    assert.equal(results[1].status, 'rejected');
    assert.equal(results[2].value, 'platform');
    assert.equal(move.moving(), false);
  });

  it('a trip that waits on a trip queued from inside itself does not wait for good', async () => {
    const move = createStreetMove({ maxWaitMs: 20 });
    const out = await move.run(() => move.queue(async () => 'inner'));
    assert.equal(out, 'inner');
    assert.equal(move.moving(), false);
  });

  it('only a follow waits; every way you travel yourself is refused mid-move', () => {
    assert.deepEqual([...GAME_SENT_VIAS], ['follow']);
    assert.equal(travelTurn({ moving: false, via: 'signpost' }), 'go');
    for (const via of ['signpost', 'door', 'teleport', '', undefined]) assert.equal(travelTurn({ moving: true, via }), 'refuse');
    assert.equal(travelTurn({ moving: true, via: 'follow' }), 'wait');
    assert.equal(travelTurn({ moving: true, sent: true }), 'wait');
  });
});

describe('G1129: a key held through a trip does not travel again on arrival', () => {
  it('the Enter that started the trip, on auto-repeat, stays stale until let go', async () => {
    const move = createStreetMove();
    assert.equal(move.keyDown('Enter'), false, 'a fresh press acts');
    const load = deferred();
    const trip = move.run(() => load.promise);
    assert.equal(move.keyStale('Enter'), true);
    assert.equal(move.keyDown('Enter'), true, 'its repeats on the card');
    load.resolve();
    await trip;
    assert.equal(move.moving(), false);
    assert.equal(move.keyDown('Enter'), true, 'its repeats after arrival');
    move.keyUp('Enter');
    assert.equal(move.keyDown('Enter'), false, 'a new press after letting go acts');
  });

  it('a key first pressed on the card is stale; one pressed after arrival is not', async () => {
    const move = createStreetMove();
    const load = deferred();
    const trip = move.run(() => load.promise);
    assert.equal(move.keyDown('e'), true);
    load.resolve();
    await trip;
    assert.equal(move.keyStale('e'), true);
    assert.equal(move.keyDown('Enter'), false);
    // A loading card with no trip (a home's card) counts as moving too.
    assert.equal(move.keyDown('1', { moving: true }), true);
    move.releaseKeys();
    assert.equal(move.keyStale('e'), false, 'a lost focus forgets held keys');
    assert.equal(move.keyStale('1'), false);
  });
});

describe('G1129: game.js puts every street change through the one state', () => {
  it('travelTo asks for its turn first: refused mid-move, a follow waits', () => {
    const body = fnBody('async function travelTo(toTsid, meta = {}) {');
    const turnAt = body.indexOf('const turn = travelTurn({ moving: streetMoving(), via: meta.via });');
    assert.ok(turnAt > 0);
    assert.ok(turnAt < body.indexOf('features.travelGate('), 'before the gates, toasts and closing panels');
    assert.match(body, /if \(turn === 'refuse'\) return \{ ok: false, reason: 'moving' \};/);
    assert.match(body, /while \(turn === 'wait' && \(streetMove\.moving\(\) \|\| streetCardUp\(\)\)\) \{/);
  });

  it('every carded trip runs in the state; Back to world is refused mid-move and runs its street inside', () => {
    assert.match(game, /async function enterStreetWithTransition\(tsid, opts = \{\}\) \{[^}]*return streetMove\.queue\(\(\) => streetTripTo\(tsid, opts\)\);/);
    const back = fnBody('async function returnFromHome() {');
    assert.match(back, /if \(streetMoving\(\)\) return false;\s*\/\/[^\n]*\n\s*return streetMove\.run\(\(\) => returnFromHomeTrip\(\)\);/);
    const trip = fnBody('async function returnFromHomeTrip() {');
    assert.match(trip, /await streetTripTo\(destination\.tsid, \{/);
    assert.doesNotMatch(trip, /enterStreetWithTransition\(/, 'a queued trip inside its own trip would wait on itself');
    // No second counter: the old streetTrips is gone.
    assert.doesNotMatch(game, /streetTrips|onStreetTrip/);
    assert.match(fnBody('function streetMoving() {'), /return streetMove\.moving\(\) \|\| streetCardUp\(\) \|\| sceneTransitionBusy\(\);/);
  });

  it('Enter, E and the phone\'s Act rest while a street changes, and a held key waits to be let go', () => {
    const open = fnBody('function tryOpenNearestMenu({ nearestFirst = false } = {}) {');
    // First after the edit modes' own Enter (cultivate-garden-tend.test.js), before anything in reach.
    assert.match(open, /if \(features\.query\('homeEditMode', engine\)\) return;\n(\s*\/\/[^\n]*\n)*\s*if \(streetMoving\(\)\) \{/);
    assert.ok(open.indexOf('if (streetMoving())') < open.indexOf('enterHeldBy()'));
    assert.match(game, /if \(e\.key === 'Enter' \|\| e\.key === 'e' \|\| e\.key === 'E'\) \{\n\s*e\.preventDefault\(\);\n(\s*\/\/[^\n]*\n)*\s*if \(e\.isTrusted && streetMove\.keyStale\(e\.key\)\) return;\n\s*tryOpenNearestMenu\(/);
    assert.match(game, /window\.addEventListener\('keydown', \(e\) => \{ if \(e\.isTrusted\) streetMove\.keyDown\(e\.key, \{ moving: streetMoving\(\) \}\); \}, \{ capture: true \}\);/);
    assert.match(game, /window\.addEventListener\('keyup', \(e\) => \{ if \(e\.isTrusted\) streetMove\.keyUp\(e\.key\); \}, \{ capture: true \}\);/);
    assert.match(game, /window\.addEventListener\('blur', \(\) => streetMove\.releaseKeys\(\)\);/);
  });
});
