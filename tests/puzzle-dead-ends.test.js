/**
 * G887: streets with no road back to Ur. After G886 a player was still stuck: a reload on the EZ
 * Cookin' practice street, the Map's Puzzle streets card to Orangian (whose one door leads to
 * itself), and then G886's way out ("your last ordinary street") was Orangian, while Orangian's exit
 * door sent him back to the practice street the card was taken from. The way out must only ever be
 * a street whose roads lead to Ur; the source never left anyone on these (the colour levels were a
 * quest instance, quests/puzzle_level_color_blockage.js onStarted questInstanceLocation, left through
 * instances_exit, and players/player.js onLogout moved you out of one).
 */
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRAY_FALLBACK_TSID, strayWayOut, streetsReachingUr } from '../public/js/quest-instance.js?v=7b06754a';
import { COLOUR_LEVEL_STREETS, NO_EXIT_PUZZLE_STREETS } from '../public/js/puzzle-triggers.js?v=72373665';
import { questInstancesFeature as qi } from '../public/js/features/quest-instances-feature.js?v=5244cb18';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const gsjs = (p) => readFileSync(join(root, '../glitch-GameServerJS', p), 'utf8');
const graph = JSON.parse(read('public/assets/content/signpost-graph.json'));
const puzzles = JSON.parse(read('public/assets/content/puzzle-triggers.json')).streets;

const ORANGIAN = 'GHVCKEPHO403BN5';
const EZ = 'GIFII3UBRFB3KBE';
const GIMBAP_BOP = 'GA54VETILKR26N1'; // Umbra's door
const HECHEY = { tsid: 'GLI2V0UN7RD1T2J', x: 410, y: 820 };

function fakeEngine({ tsid = HECHEY.tsid, owned = false } = {}) {
  const log = { entered: [], toasts: [], activity: [], data: {} };
  const engine = {
    log,
    started: true,
    streetTsid: tsid,
    street: { tsid, label: tsid, boxes: [] },
    player: { x: 100, y: 829 },
    questState: { active: {}, completed: [], offers: { managed: {} } },
    setData: (k, v) => { log.data[k] = v; },
    param: () => null,
    save() {},
    updateHud() {},
    busy: () => false,
    inScene: () => false,
    transientInstance: () => false,
    homeContext: () => ({ owned }),
    toast: (t) => log.toasts.push(t),
    pushActivity: (t) => log.activity.push(t),
    query: () => null,
    enter: async (to, opts) => {
      log.entered.push([to, opts]);
      engine.streetTsid = to;
      engine.street = { tsid: to, label: to, boxes: [] };
    },
  };
  return engine;
}

describe('which puzzle streets have no road out (js/puzzle-triggers.js)', () => {
  const ur = streetsReachingUr(graph);

  it('reads the roads that lead back to Hechey Track', () => {
    assert.ok(ur.has(HECHEY.tsid));
    assert.ok(ur.has('LLI2V0UN7RD1T2J'.replace(/^L/, 'G')));
    assert.ok(ur.has(GIMBAP_BOP), "Umbra's door street is Ur's");
    assert.ok(!ur.has(ORANGIAN), "Orangian's one door leads to itself");
    assert.ok(!ur.has(EZ), 'the practice street has no door');
    assert.equal(streetsReachingUr(null), null);
  });

  it('NO_EXIT_PUZZLE_STREETS is every puzzle street (not a held instance) with no road to Ur', () => {
    const found = Object.entries(puzzles).filter(([t, def]) => !def.instance && !ur.has(t)).map(([t]) => t).sort();
    assert.deepEqual([...NO_EXIT_PUZZLE_STREETS].sort(), found);
  });

  it('the colour levels are the ones that end at their own exit door', () => {
    const doors = Object.entries(puzzles).filter(([, def]) => def.exit?.door).map(([t]) => t).sort();
    assert.deepEqual([...COLOUR_LEVEL_STREETS].sort(), doors);
    // Their door is the level's Exit (puzzles-feature verbOverride), never a trip: six lead to
    // themselves, and Fernucopia's (to Jutuan Central) is not in the Map's roads either.
    const src = read('public/js/features/puzzles-feature.js');
    assert.match(src, /if \(!run\?\.def\?\.exit\?\.door \|\| target\?\.classId !== 'street_door'\) return null;/);
  });

  it('in the source the colour levels were a quest instance, left by its exit', () => {
    const q = gsjs('quests/puzzle_level_color_blockage.js');
    assert.match(q, /this\.questInstanceLocation\(pc, location_id, marker\.x, marker\.y, 5\*60, \{preserve_links: true\}\);/);
    assert.match(q, /function onExitLocation\(location\)\{[\s\S]*pc\.instances_exit\('color_unblocking'\);/);
  });
});

describe('the way out is never a dead end (features/quest-instances-feature.js)', () => {
  beforeEach(() => qi.restore({}));

  it('strayWayOut drops a last street the caller says is no ordinary street', () => {
    const notOrangian = (t) => t !== ORANGIAN;
    assert.deepEqual(strayWayOut({ lastStreet: { tsid: ORANGIAN, x: 1, y: 2 }, ordinary: notOrangian }).tsid, STRAY_FALLBACK_TSID);
    assert.deepEqual(strayWayOut({ lastStreet: { tsid: ORANGIAN, x: 1, y: 2 }, homeTsid: 'RH_HOME_EXT', ordinary: notOrangian }).tsid, 'RH_HOME_EXT');
    assert.deepEqual(strayWayOut({ lastStreet: HECHEY, ordinary: notOrangian }), HECHEY);
  });

  it('a save holding Orangian as the last street is repaired on load', () => {
    qi.restore({ lastStreet: { tsid: ORANGIAN, x: 100, y: 829 } });
    assert.equal(qi._state().save.lastStreet, null);
    qi.restore({ lastStreet: { tsid: 'LIFII3UBRFB3KBE', x: 1, y: 2 } });
    assert.equal(qi._state().save.lastStreet, null, 'the practice street by its source tsid too');
    qi.restore({ lastStreet: HECHEY });
    assert.deepEqual(qi._state().save.lastStreet, HECHEY);
  });

  it('standing on a puzzle street with no road out never makes it the last street', () => {
    qi.restore({ lastStreet: HECHEY });
    const engine = fakeEngine({ tsid: ORANGIAN });
    qi.onStreetEnter(engine.street, engine);
    assert.deepEqual(qi._state().save.lastStreet, HECHEY);
    assert.deepEqual(engine.log.entered, [], 'and Orangian itself is left alone (its card run)');
  });

  it("the reported loop: a reload on the practice street goes to Ur, not Orangian", () => {
    qi.restore({ lastStreet: { tsid: ORANGIAN, x: 100, y: 829 } });
    assert.equal(qi.reloadLocation({ tsid: EZ, x: 1443, y: 900 }, fakeEngine()).tsid, STRAY_FALLBACK_TSID);
    qi.restore({ lastStreet: { tsid: ORANGIAN, x: 100, y: 829 } });
    assert.equal(qi.reloadLocation({ tsid: EZ }, fakeEngine({ owned: true })).tsid, 'RH_HOME_EXT');
  });

  it('a quest run whose way back is a dead end comes out on the way out', () => {
    qi.restore({ lastStreet: HECHEY, questId: 'ezcooking_1', roomId: 'ez_cookin', returnTo: { tsid: ORANGIAN, x: 1, y: 2 } });
    assert.deepEqual(qi.reloadLocation({ tsid: EZ }, fakeEngine()), HECHEY);
  });

  it('safeWayOut keeps where you came in unless it is a dead end, and can say the safe-place line', () => {
    qi.restore({ lastStreet: HECHEY });
    const engine = fakeEngine({ tsid: ORANGIAN });
    assert.deepEqual(qi.safeWayOut(engine, { prefer: { tsid: GIMBAP_BOP, x: 5, y: 6 } }), { tsid: GIMBAP_BOP, x: 5, y: 6 });
    assert.deepEqual(qi.safeWayOut(engine, { prefer: { tsid: EZ, x: 5, y: 6 } }), HECHEY);
    assert.deepEqual(qi.safeWayOut(engine, { prefer: { tsid: 'GHVOD0F3T403694', x: 5, y: 6 } }), HECHEY, 'another colour level');
    assert.equal(qi.deadEndStreet(ORANGIAN, engine), true);
    assert.equal(qi.deadEndStreet(EZ, engine), true);
    assert.equal(qi.deadEndStreet(HECHEY.tsid, engine), null);
  });

  it("the puzzle card's way back and the exit door ask the same rule (features/puzzles-feature.js)", () => {
    const src = read('public/js/features/puzzles-feature.js');
    const done = src.slice(src.indexOf('function complete(engine) {'), src.indexOf('/* Map card'));
    assert.match(done, /const back = noExit\(tsid\) \? wayOut\(engine, tsid\) : save\.returnTo;/);
    const out = src.slice(src.indexOf('function wayOut('), src.indexOf('function rememberReturn('));
    assert.match(out, /!deadEnd\(engine, r\.tsid\)/);
    assert.match(out, /engine\.query\?\.\('safeWayOut', engine, \{ prefer, notice \}\)/);
    const card = src.slice(src.indexOf('function rememberReturn('), src.indexOf('function wayBack('));
    assert.match(card, /deadEnd\(engine, engine\.streetTsid\)/, 'a card taken on a dead end keeps the return it had');
  });
});
