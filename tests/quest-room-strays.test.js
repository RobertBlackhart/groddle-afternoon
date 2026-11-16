/**
 * G886: standing in a quest room with no run open. A ?streetdemo= link to the EZ Cookin' practice
 * street, then a reload, left a player on a street with no doors, an EXIT box that only set the
 * quest's flag and no Leave. The source never did: instances were entered only through their quest
 * (quests/ezcooking_1.js onStarted teleportToLocationDelayed), the practice street's EXIT teleporter
 * took you back where you came in whatever the quest (locations/inc_skillquest.js
 * onTeleporterCollision), and a player logging out in an instance was moved to its exit with "It
 * looks like you ran into some trouble. You've been moved to a safe place." (players/player.js
 * onLogout, inc_instances.js instances_get_exit).
 */
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STRAY_DELAY_MS,
  STRAY_FALLBACK_TSID,
  STRAY_NOTICE,
  normalizeInstanceSave,
  strayWayOut,
} from '../public/js/quest-instance.js?v=7b06754a';
import { BUILT_ROOMS, ROOM_STREETS, roomForStreet, roomModulePath } from '../public/js/quest-rooms/catalog.js?v=10c8100d';
import { FIRST_SKILLS } from '../public/js/newxp.js?v=1f52edd5';
import { slashPlan } from '../public/js/slash-commands.js?v=fb3a8442';
import { questInstancesFeature as qi } from '../public/js/features/quest-instances-feature.js?v=38e93566';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const gsjs = (p) => readFileSync(join(root, '../glitch-GameServerJS', p), 'utf8');
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const EZ = 'GIFII3UBRFB3KBE';
const HECHEY = { tsid: 'GLI2V0UN7RD1T2J', x: 410, y: 820 };
/** js/practice-streets.js EZ_FINISH_BOX in street screen space (GIFII3UBRFB3KBE.json box_finish). */
const EZ_FINISH = { key: 'box_finish', id: 'quest:flag:finish_ezcooking', x: 2620, y: 908, w: 200, h: 800 };

function fakeEngine({ tsid = EZ, held = false, owned = false, params = {}, player = { x: 1443, y: 900 }, scene = false } = {}) {
  const log = { entered: [], toasts: [], activity: [], data: {} };
  const engine = {
    log,
    started: true,
    streetTsid: tsid,
    street: { tsid, label: tsid === EZ ? "Breezy, EZ Cookin'" : 'Hechey Track', boxes: tsid === EZ ? [EZ_FINISH] : [] },
    player: { ...player },
    questState: { active: {}, completed: [], offers: { managed: {} } },
    setData: (k, v) => { log.data[k] = v; },
    param: (k) => params[k] ?? null,
    save() {},
    updateHud() {},
    busy: () => false,
    inScene: () => scene,
    transientInstance: () => scene,
    homeContext: () => ({ owned }),
    toast: (t) => log.toasts.push(t),
    pushActivity: (t) => log.activity.push(t),
    query: (hook) => (hook === 'practiceStreetHeld' && held ? true : null),
    enter: async (to, opts) => {
      log.entered.push([to, opts]);
      engine.streetTsid = to;
      engine.street = { tsid: to, label: 'Elsewhere', boxes: [] };
    },
  };
  return engine;
}

describe('the source rule', () => {
  it('practice streets were entered only through their quest, and their EXIT took you back whatever the quest', () => {
    assert.match(gsjs('quests/ezcooking_1.js'), /function onStarted\(pc\)\{\s*pc\.teleportToLocationDelayed\(config\.newxp_locations\['ezcooking_1'\]/);
    const sq = gsjs('locations/inc_skillquest.js');
    const hit = sq.slice(sq.indexOf('function onTeleporterCollision('), sq.indexOf('function broadcastLocationEvent('));
    assert.match(hit, /var prev = pc\.instances_get_exit\(pc\.location\.instance_id\);\s*if \(prev\)\{\s*pc\.teleportToLocation\(prev\.tsid, prev\.x, prev\.y\);/);
    assert.doesNotMatch(hit, /quests?_|is_complete|getQuest/, 'no quest check on the way out');
  });

  it('an instance left behind moves you to its exit with the safe-place line', () => {
    const player = gsjs('players/player.js');
    assert.ok(player.includes(`this.prompts_add_simple("${STRAY_NOTICE}");`));
    assert.match(gsjs('players/inc_instances.js'), /function instances_get_exit\(id\)\{\s*if \(this\.instances\.previously\[id\]\)\{\s*return this\.instances\.previously\[id\];\s*\}\s*else\{\s*return config\.default_location;/);
  });
});

describe('which places are quest rooms (js/quest-rooms/catalog.js ROOM_STREETS)', () => {
  it('lists every built room whose stages enter an imported street', async () => {
    const found = {};
    for (const roomId of BUILT_ROOMS) {
      const mod = await import(`../public/js/quest-rooms/${roomModulePath(roomId).slice(2)}`);
      const room = mod.room || mod.default;
      if (typeof room?.street !== 'function') continue;
      const stages = new Set(['main', 'desert', typeof room.firstStage === 'string' ? room.firstStage : 'main']);
      for (const stage of stages) {
        let street = null;
        try { street = room.street({ data: {}, questId: '', run: null }, stage); } catch { street = null; }
        if (street?.tsid) (found[roomId] ||= new Set()).add(street.tsid);
      }
    }
    const listed = Object.fromEntries(Object.entries(ROOM_STREETS).map(([id, t]) => [id, [...t].sort()]));
    const seen = Object.fromEntries(Object.entries(found).map(([id, t]) => [id, [...t].sort()]));
    assert.deepEqual(listed, seen);
  });

  it('knows a room street by either tsid prefix, and nothing else', () => {
    assert.equal(roomForStreet(EZ), 'ez_cookin');
    assert.equal(roomForStreet('LIFII3UBRFB3KBE'), 'ez_cookin', 'the link took the source tsid');
    assert.equal(roomForStreet('GHFS40864GB396O'), 'soil_appreciation');
    assert.equal(roomForStreet(HECHEY.tsid), null);
    assert.equal(roomForStreet(''), null);
  });

  it('none of them has a door out (the reason a stray is stuck)', () => {
    for (const tsid of [...Object.values(ROOM_STREETS).flat(), ...FIRST_SKILLS.map((s) => s.street)]) {
      const street = JSON.parse(read(`public/assets/streets/${tsid}.json`));
      assert.equal((street.signposts || []).length, 0, tsid);
      assert.ok((street.doors || []).every((d) => d.instance_exit || d.connect?.street === tsid), `${tsid}: no door to a real street`);
    }
  });
});

describe('the way out (js/quest-instance.js strayWayOut)', () => {
  it('goes to the last ordinary street, else home, else the default street', () => {
    assert.deepEqual(strayWayOut({ lastStreet: HECHEY, homeTsid: 'RH_HOME_EXT' }), HECHEY);
    assert.deepEqual(strayWayOut({ homeTsid: 'RH_HOME_EXT' }), { tsid: 'RH_HOME_EXT', x: null, y: null });
    assert.deepEqual(strayWayOut({}), { tsid: STRAY_FALLBACK_TSID, x: null, y: null });
    assert.deepEqual(strayWayOut({ lastStreet: { tsid: 'QI_MENTAL_BLOCK_MAIN', x: 1, y: 2 } }).tsid, STRAY_FALLBACK_TSID, 'never a room scene');
  });

  it('the default is the street index default', () => {
    assert.equal(JSON.parse(read('public/assets/streets/index.json')).default, STRAY_FALLBACK_TSID);
  });

  it('the save keeps the last street', () => {
    assert.deepEqual(normalizeInstanceSave({ lastStreet: HECHEY }).lastStreet, HECHEY);
    assert.equal(normalizeInstanceSave({}).lastStreet, null);
  });
});

describe('the arrival guard (features/quest-instances-feature.js)', () => {
  beforeEach(() => qi.restore({}));

  it('a link onto the practice street moves you out a beat later, with the safe-place line', async () => {
    const engine = fakeEngine();
    qi.onStreetEnter(engine.street, engine);
    const t0 = Date.now();
    qi.onTick(16, t0, engine);
    assert.deepEqual(engine.log.entered, [], 'not at once: the street settles first');
    assert.equal(engine.log.data.qiStray, 'ez_cookin');
    qi.onTick(16, t0 + STRAY_DELAY_MS + 50, engine);
    await flush();
    assert.equal(engine.log.entered.length, 1);
    assert.equal(engine.log.entered[0][0], STRAY_FALLBACK_TSID, 'no street before it: the default street');
    assert.deepEqual(engine.log.toasts, [STRAY_NOTICE]);
    assert.deepEqual(engine.log.activity, [STRAY_NOTICE]);
  });

  it('goes back to the last ordinary street you stood on, or home when you have one', async () => {
    const engine = fakeEngine({ tsid: HECHEY.tsid, player: { x: 410, y: 820 } });
    qi.onStreetEnter(engine.street, engine);
    assert.deepEqual(qi._state().save.lastStreet, HECHEY);
    Object.assign(engine, { streetTsid: EZ, street: { tsid: EZ, label: 'EZ', boxes: [EZ_FINISH] } });
    qi.onStreetEnter(engine.street, engine);
    assert.deepEqual(qi._state().save.lastStreet, HECHEY, 'the room street is never the way back');
    qi.onTick(16, Date.now() + STRAY_DELAY_MS + 50, engine);
    await flush();
    assert.equal(engine.log.entered[0][0], HECHEY.tsid);
    assert.equal(engine.log.entered[0][1].spawnX, HECHEY.x);
    qi.restore({});
    const owner = fakeEngine({ owned: true });
    qi.onStreetEnter(owner.street, owner);
    qi.onTick(16, Date.now() + STRAY_DELAY_MS + 50, owner);
    await flush();
    assert.equal(owner.log.entered[0][0], 'RH_HOME_EXT');
  });

  it('the EXIT box takes you out at once, with no line', async () => {
    const engine = fakeEngine({ player: { x: 2620, y: 900 } });
    engine.busy = () => true; // even while something else is up
    qi.onStreetEnter(engine.street, engine);
    qi.onTick(16, Date.now(), engine);
    await flush();
    assert.equal(engine.log.entered.length, 1);
    assert.deepEqual(engine.log.toasts, []);
  });

  it('waits while something is busy', () => {
    const engine = fakeEngine();
    engine.busy = () => true;
    qi.onStreetEnter(engine.street, engine);
    qi.onTick(16, Date.now() + STRAY_DELAY_MS * 4, engine);
    assert.deepEqual(engine.log.entered, []);
  });

  it('leaves the tutorial walking its practice street alone, and ordinary streets too', () => {
    const tutorial = fakeEngine({ held: true });
    qi.onStreetEnter(tutorial.street, tutorial);
    qi.onTick(16, Date.now() + STRAY_DELAY_MS * 4, tutorial);
    assert.deepEqual(tutorial.log.entered, []);
    assert.equal(qi.questRoomHere(tutorial), null);
    const street = fakeEngine({ tsid: HECHEY.tsid });
    qi.onStreetEnter(street.street, street);
    qi.onTick(16, Date.now() + STRAY_DELAY_MS * 4, street);
    assert.deepEqual(street.log.entered, []);
    assert.equal(qi.questRoomHere(street), null);
  });

  it('a tutorial practice street with no tutorial on it is a stray too', async () => {
    const ak = FIRST_SKILLS.find((s) => s.id === 'animalkinship_1').street;
    const engine = fakeEngine({ tsid: ak });
    qi.onStreetEnter(engine.street, engine);
    qi.onTick(16, Date.now() + STRAY_DELAY_MS + 50, engine);
    await flush();
    assert.equal(engine.log.entered.length, 1);
  });
});

describe('/stuck and I\'m stuck on a stray', () => {
  beforeEach(() => qi.restore({}));

  it('the room answers as a solved one (nothing to fail), so /stuck takes the quest-room way out', async () => {
    const engine = fakeEngine();
    const here = qi.questRoomHere(engine);
    assert.deepEqual(here, { title: "Breezy, EZ Cookin'", solved: true, stray: true });
    assert.deepEqual(slashPlan('/stuck', { home: { inHome: false }, questRoom: here, stuckWaitMs: 60_000 }), { command: '/stuck', stuck: 'quest-room' });
    assert.equal(await qi.questRoomLeave(engine, { transition: false }), true);
    assert.equal(engine.log.entered[0][0], STRAY_FALLBACK_TSID);
    assert.equal(engine.log.entered[0][1].useTransition, false);
    assert.deepEqual(engine.log.toasts, [], '/stuck says its own line');
  });

  it('a teleport lands on its own target', async () => {
    const engine = fakeEngine();
    await qi.questRoomLeave(engine, { to: HECHEY });
    assert.equal(engine.log.entered[0][0], HECHEY.tsid);
  });
});

describe('a reload saved in a quest room', () => {
  beforeEach(() => qi.restore({ lastStreet: HECHEY }));

  it('starts on the way out and says so once the game runs', () => {
    const engine = fakeEngine();
    assert.deepEqual(qi.reloadLocation({ tsid: EZ, x: 1443, y: 900 }, engine), HECHEY);
    const there = fakeEngine({ tsid: HECHEY.tsid });
    qi.onTick(16, Date.now(), there);
    assert.deepEqual(there.log.toasts, [STRAY_NOTICE]);
  });

  it('not with ?fresh, on an ordinary street, or while the tutorial walks it', () => {
    assert.equal(qi.reloadLocation({ tsid: EZ }, fakeEngine({ params: { fresh: '1' } })), null);
    assert.equal(qi.reloadLocation({ tsid: HECHEY.tsid }, fakeEngine()), null);
    assert.equal(qi.reloadLocation({ tsid: EZ }, fakeEngine({ held: true })), null);
  });

  it('a run open at save time still goes back where it came in', () => {
    qi.restore({ questId: 'ezcooking_1', roomId: 'ez_cookin', returnTo: { tsid: 'GCR10NQRPKJ16H6', x: 1, y: 2 } });
    assert.deepEqual(qi.reloadLocation({ tsid: EZ }, fakeEngine()), { tsid: 'GCR10NQRPKJ16H6', x: 1, y: 2 });
  });
});

describe('the normal quest flow keeps its own ways', () => {
  it('a run never counts as a stray; leaving with no way back saved takes the stray\'s way out', () => {
    const src = read('public/js/features/quest-instances-feature.js');
    const stray = src.slice(src.indexOf('function strayRoom('), src.indexOf('/** Where a stray goes'));
    assert.match(stray, /if \(run \|\| entering \|\| !engine\?\.streetTsid\) return null;/);
    const leave = src.slice(src.indexOf('async function leaveInstance('), src.indexOf('/* G886: standing in a quest room'));
    assert.match(leave, /const back = to \|\| liveBack\(result\.returnTo\) \|\| liveBack\(save\.returnTo\) \|\| strayExit\(engine\);/);
    const start = src.slice(src.indexOf('async function startInstance('), src.indexOf('async function gotoStage('));
    assert.match(start, /wayBackFrom\(here, liveBack\(save\.returnTo\) \|\| strayExit\(engine\)\)/, 'starting from a room street comes back to a real one');
  });

  it('the tutorial holds its practice street only while its skill stage runs or is about to', () => {
    const src = read('public/js/features/newxp-feature.js');
    const held = src.slice(src.indexOf('  practiceStreetHeld() {'), src.indexOf('  reloadLocation(saved, engine) {'));
    assert.match(held, /if \(pendingStage\) return true;/);
    assert.match(held, /active\(\) && save\.stage === 'skill' && \(run\?\.stage === 'skill' \|\| !resumeChecked\)/);
  });
});
