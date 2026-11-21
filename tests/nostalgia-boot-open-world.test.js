/**
 * Live report 212 (2026-11-12, Friendly): "when your time runs out in ancestral lands, you get
 * sometimes placed in a region that doesn't have street projects done, and you cannot get out."
 * do_baqala_boot (GSJS players/inc_special_locations.js 199-226) picks one of 26 streets in Kajuu,
 * Andra, Tamila and Besara; every one of them is a street project, so on a fresh world all 26 sit
 * past roads still being built. The kick now keeps Glitch's pick only when the starter street
 * reaches it by open roads, and otherwise sets you down on the open-world street nearest it.
 *
 * 1. On a fresh world none of the 26 is open (the bug's cause), and for each the nearest open
 *    street (street-graph nearestOpenStreet) is reachable from Hechey Track.
 * 2. openBootTarget: an open pick stands; a closed one moves (to one of the 26 at its arrival
 *    point, else to the street's own arrival); no answer keeps the pick.
 * 3. The wiring: juju-bandits-feature asks street-jobs-feature's openStreetNear, which grows the
 *    open world from the starter street only (never from a pocket you stand in).
 * 4. G1075 (R11, 2026-11-21): a kick right after logging in, before the roads have loaded, waits
 *    for them. It used to take Glitch's pick (a street past a road still being built), and landing
 *    there opened that pocket's roads for you alone (street-jobs.js noteArrival, openWayHome).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { closedStreets, normalizeStreetJobState } from '../public/js/street-jobs.js?v=32e4718f';
import { nearestOpenStreet, reachableStreets, streetGraph } from '../public/js/street-graph.js?v=dcc5cae4';
import { routeGraph } from '../public/js/map-routes.js?v=70f30ddf';
import { openBootTarget, pickBootTarget } from '../public/js/ancestral-nostalgia.js?v=3d97122d';
import { NOSTALGIA_BOOT_STREETS } from '../public/js/ancestral-nostalgia-data.js?v=0adb9184';
import { SAVANNA_HUBS } from '../public/js/juju-bandits.js?v=6cf92f4f';
import { FEATURES } from '../public/js/features/index.js?v=d494b810';
import { createBuffState, applyBuff, hasBuff, removeBuff } from '../public/js/buffs.js?v=2ed95a93';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));
const catalog = json('public/assets/content/street-jobs.json');
const index = json('public/assets/streets/index.json');
const { graph } = routeGraph(json('public/assets/content/signpost-graph.json'));

const fresh = normalizeStreetJobState({ initialized: true });
const shut = new Set(closedStreets(fresh, catalog, { exemptFrom: [index.default] }));
const reach = reachableStreets(streetGraph(graph, { closed: shut }), { starts: [index.default] });
// The kick never lands in the Savanna it sends you from (Xalanga's Languid Line S is the nearest open street to Andra's six).
const skip = (t) => SAVANNA_HUBS.includes(String(index.streets[t]?.hubId));

describe('1. a fresh world: the 26 boot streets are all past closed roads', () => {
  it('none of them is reachable from the starter street', () => {
    assert.equal(NOSTALGIA_BOOT_STREETS.length, 26);
    for (const row of NOSTALGIA_BOOT_STREETS) assert.equal(reach.has(row.tsid), false, row.label);
  });

  it('each has an open-world street near it, reachable and outside the Savanna', () => {
    for (const row of NOSTALGIA_BOOT_STREETS) {
      const near = nearestOpenStreet(graph, { reach, from: row.tsid, skip });
      assert.ok(near, `${row.label}: no open street joins it`);
      assert.ok(reach.has(near), `${row.label} -> ${near}`);
      assert.ok(index.streets[near], `${near} is a real street`);
      assert.equal(skip(near), false, `${row.label} -> ${index.streets[near].label} is in the Savanna`);
    }
  });

  it('without the skip, Andra\'s nearest open street would be in Xalanga (a Savanna hub)', () => {
    const near = nearestOpenStreet(graph, { reach, from: NOSTALGIA_BOOT_STREETS.find((r) => r.hubId === '89').tsid });
    assert.equal(skip(near), true);
  });

  it('an open street is its own nearest', () => {
    assert.equal(nearestOpenStreet(graph, { reach, from: index.default }), index.default);
    assert.equal(nearestOpenStreet(graph, { reach: null, from: index.default }), null);
  });
});

describe('2. openBootTarget', () => {
  const pick = pickBootTarget(NOSTALGIA_BOOT_STREETS, { streetRoll: 0.6, arrivalRoll: 0 });

  it('keeps an open pick, and the pick when the roads are unknown', () => {
    assert.equal(openBootTarget(pick, pick.tsid, NOSTALGIA_BOOT_STREETS), pick);
    assert.equal(openBootTarget(pick, null, NOSTALGIA_BOOT_STREETS), pick);
  });

  it('moves a closed pick to another of the 26 at its own arrival point', () => {
    const other = NOSTALGIA_BOOT_STREETS[0];
    const out = openBootTarget(pick, other.tsid, NOSTALGIA_BOOT_STREETS, { arrivalRoll: 0 });
    assert.deepEqual(out, { tsid: other.tsid, label: other.label, arrive: { x: other.arrivals[0][0], y: other.arrivals[0][1] }, movedFrom: pick.tsid });
  });

  it('moves a closed pick to any open street, landing at that street\'s own arrival', () => {
    const near = nearestOpenStreet(graph, { reach, from: pick.tsid, skip });
    const out = openBootTarget(pick, near, NOSTALGIA_BOOT_STREETS);
    assert.equal(out.tsid, near);
    assert.equal(out.arrive, null);
    assert.ok(reach.has(out.tsid));
  });
});

describe('3. the wiring', () => {
  const juju = read('public/js/features/juju-bandits-feature.js');
  const jobs = read('public/js/features/street-jobs-feature.js');
  it('the kick asks for the open street nearest Glitch\'s pick (a forced QA destination stays)', () => {
    assert.match(juju, /engine\.query\?\.\('openStreetNear', pick\.tsid, engine, \{ skipHubs: SAVANNA_HUBS \}\)/);
    assert.match(juju, /if \(!pick \|\| rows\.length\) return pick;/);
  });
  it('the open world grows from the starter street only', () => {
    assert.match(jobs, /openStreetNear\(tsid, engine, options\) \{\n\s+return openStreetNear\(tsid, engine, options\);/);
    assert.match(jobs, /starts: \[streetIndex\.default\] \}\)/);
  });
});

describe('4. a kick before the roads load waits for them (G1075)', () => {
  const feature = FEATURES.find((f) => f.id === 'juju-bandits');
  const savanna = { hubId: '86', platforms: [], bounds: { l: 0, r: 3000, t: -1000, b: 0 } };
  const flush = () => new Promise((r) => setImmediate(r));

  function makeEngine(roads) {
    const buffs = createBuffState();
    const data = {};
    const engine = {
      data, buffs, travels: [], street: savanna, inv: {}, player: { x: 500, y: 0 },
      pc: { imaginationUpgrades: [] },
      questState: { active: { help_juju_bandits: {} }, completed: [] },
      param: (k) => (k === 'nostalgiademo' ? '3' : null),
      setData: (k, v) => { data[k] = String(v); },
      achievement() {}, save() {}, refreshPack() {}, pushActivity() {},
      hasBuff: (id) => hasBuff(buffs, id, Date.now()),
      applyBuff: (id) => applyBuff(buffs, id, null, Date.now()),
      removeBuff: (id) => removeBuff(buffs, id, null, Date.now()),
      buffRow: (id) => (hasBuff(buffs, id, Date.now()) ? buffs.active[id] : null),
      prompt: () => '',
      travel: async (tsid, meta) => {
        engine.travels.push({ tsid, ...meta });
        engine.street = { ...savanna, hubId: '85' };
        feature.onStreetClear(engine);
        feature.onStreetEnter(engine.street, engine);
        return { ok: true };
      },
      streetExists: () => true,
      inScene: () => false, transientInstance: () => false, questDialogueOpen: () => false, acting: () => false,
      // street-jobs-feature's answers: nothing while the roads load, then the open street near the pick.
      query: (hook) => {
        if (hook === 'openRoadsLoaded') return roads.loaded;
        if (hook === 'openStreetNear') return roads.loaded ? 'GOPENSTREET' : null;
        return null;
      },
    };
    return engine;
  }

  it('lands on the open street once the roads are in, not on Glitch\'s pick', async () => {
    feature.restore(undefined);
    const roads = { loaded: false };
    const engine = makeEngine(roads);
    feature.onStreetClear(engine);
    feature.onStreetEnter(savanna, engine);
    let now = Date.now();
    const play = (s) => { for (let i = 0; i < s; i += 1) feature.onTick(16, (now += 1000), engine); };
    play(8);
    await flush();
    assert.equal(engine.travels.length, 0, 'no kick while the roads load');
    assert.equal(engine.data.nostalgiaState, 'booting');
    roads.loaded = true;
    play(4);
    await flush();
    assert.equal(engine.travels.length, 1);
    assert.equal(engine.travels[0].tsid, 'GOPENSTREET');
    feature.restore(undefined);
  });

  it('gives up waiting after a while and takes Glitch\'s pick, as before', async () => {
    feature.restore(undefined);
    const engine = makeEngine({ loaded: false });
    feature.onStreetClear(engine);
    feature.onStreetEnter(savanna, engine);
    let now = Date.now();
    for (let i = 0; i < 120; i += 1) feature.onTick(16, (now += 1000), engine);
    await flush();
    assert.equal(engine.travels.length, 1);
    assert.ok(NOSTALGIA_BOOT_STREETS.some((r) => r.tsid === engine.travels[0].tsid));
    feature.restore(undefined);
  });
});
