/**
 * The floor at your own home is everyone's (live v0.63.0 regression after #655; G1190; Austin's
 * ruling: "the house floor is shared, as Glitch").
 *
 * v0.63.0 put every Decoration Mode pack drop, and every move, into the owner's save as locked decor
 * (game.js dropPackStackAt `decor: true`, homes-feature moveStack `row.decor = true`), the floor too:
 * stacks set on the floor showed the owner's lock, no visitor could take them, and nothing unlocked
 * them again.
 *
 * Glitch: takeable_drop set house_lock only when the plat under the stack belonged to furniture
 * (items/include/takeable.js 179-198, `plats[i].source`); doModifyItem, the Decoration Mode move,
 * deleted house_lock first and set it again only on a furniture plat (main.js 4852-4890). And a like
 * stack took no more than its class's stackmax (Eleven's Location.addItem 475-503, it.count < it.stackmax;
 * a Moonstone's stackmax is 3, gem_moonstone.js:15).
 *
 * These run the real drops-mp feature through the real feature host (js/feature-host.js) with a
 * realtime client that records what it sends.
 *
 * Run: node --test tests/home-floor-share.test.js
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createFeatureHost } from '../public/js/feature-host.js?v=b87e2cbc';
import { dropsMpFeature } from '../public/js/features/drops-mp-feature.js?fresh=floorshare';
import { ownRowToSharedFloor, packToSharedFloor } from '../public/js/home-floor-share.js?v=703dac80';
import { createDroppedItemState, dropInventoryStack, likeStackAt, mergeDroppedStacks, setDownStack } from '../public/js/world-items.js?v=f5f9e017';
import { GAME_DIR } from '../tools/repos.mjs';

const TABLE = { items: { honey: { max: 40 }, emblem_mab: { max: 1 }, gem_moonstone: { max: 3 } }, untradeable: {} };
const OP = 'drop-00000000000000f1';

function fakeClient() {
  const handlers = {};
  return {
    state: 'online',
    street: 'HOUSE_7',
    sent: [],
    on(ev, fn) { (handlers[ev] ||= []).push(fn); return () => {}; },
    send(kind, payload) { this.sent.push([kind, payload]); return true; },
    emit(ev, msg) { for (const fn of handlers[ev] || []) fn(msg); },
  };
}

const settle = () => new Promise((r) => setTimeout(r, 30));

describe('Decoration Mode at your own house online: the floor is shared, furniture is yours', () => {
  const client = fakeClient();
  const applied = new Set();
  const state = createDroppedItemState({ streets: { RH_HOME_INT: [
    // v0.63.0's locked floor stack: in the save, `decor`, nothing under it.
    { id: 'world-item-1', classTsid: 'honey', count: 5, x: 1000, y: 620, decor: true },
    { id: 'world-item-2', classTsid: 'gem_moonstone', count: 3, x: 1200, y: 400, on: 4, decor: true },
  ] } });
  let host;
  const engine = {
    mode: 'multiplayer',
    started: true,
    streetTsid: 'RH_HOME_INT',
    dropTsid: 'RH_HOME_INT',
    inv: { honey: 6, emblem_mab: 1 },
    player: { x: 1000, y: 620 },
    droppedItems: state,
    query(hook, ...args) {
      if (hook === 'realtimeClient') return client;
      if (hook === 'homeDropOrigin') return { owner: 7, room: 'interior', floor: 0, houseX: 750, own: true };
      if (hook === 'ledgerReceipt') {
        if (applied.has(args[0])) return false;
        applied.add(args[0]);
        return true;
      }
      return host.query(hook, ...args);
    },
    collect: () => [],
    redrawDroppedStacks: () => {},
    setData: () => {},
    toast: () => {},
    pushActivity: () => {},
    playSound: () => {},
    floatText: () => {},
    refreshPack: () => {},
    save: () => {},
    dropWorldStack: () => ({ ok: true }),
  };
  const drops = () => client.sent.filter(([k]) => k === 'ground_drop');

  before(async () => {
    globalThis.document = { baseURI: 'https://groddle.localhost/' };
    globalThis.GRODDLE_MP_BOOT = { nonce: 'abcdef0123' };
    globalThis.fetch = async (url) => {
      const body = String(url).includes('trade-items.json') ? TABLE : { drops: [] };
      return { status: 200, ok: true, headers: { get: () => null }, json: async () => body, text: async () => JSON.stringify(body) };
    };
    host = createFeatureHost([dropsMpFeature]);
    dropsMpFeature.init(engine);
    dropsMpFeature.onTick(16, 0, engine);
    await settle();
    client.emit('msg:ground_state', { street: 'HOUSE_7', stacks: [] });
  });
  after(() => {
    delete globalThis.document;
    delete globalThis.GRODDLE_MP_BOOT;
    delete globalThis.fetch;
    delete globalThis.groddleDrops;
  });

  it('(a) a pack stack set on the floor goes to the server as a shared drop, not into the save', async () => {
    const rows = state.streets.RH_HOME_INT.length;
    assert.equal(packToSharedFloor(host, engine, { classTsid: 'honey', count: 4, x: 1300, y: 620, floor: true }), true);
    await settle();
    assert.deepEqual(drops().at(-1)[1].item, { c: 'honey', n: 4 });
    assert.deepEqual([drops().at(-1)[1].x, drops().at(-1)[1].y, drops().at(-1)[1].ox], [1300, 620, 750], 'where it was set down, from the house');
    assert.equal(state.streets.RH_HOME_INT.length, rows, 'no save row');
    assert.equal(engine.inv.honey, 6, 'the pack gives it up on the answer');
    client.emit('msg:ground_dropped', { op: OP, status: 'settled', stack: { id: OP, c: 'honey', n: 4, x: 550, y: 620, by: { id: 7, name: 'Ada' }, at: 1 } });
    assert.equal(engine.inv.honey, 2);
  });

  it('(b) on a shelf or table (not the floor) it is not shared: game.js keeps it in the save, locked', async () => {
    const sent = client.sent.length;
    assert.equal(packToSharedFloor(host, engine, { classTsid: 'honey', count: 1, x: 1300, y: 400, floor: false }), false);
    await settle();
    assert.equal(client.sent.length, sent, 'nothing sent');
    const row = dropInventoryStack(state, { honey: 1 }, 'RH_HOME_INT', 'honey', 1, { x: 1500, y: 400 }, { mergeRadius: 12, decor: true });
    assert.equal(row.stack.decor, true, 'the owner\'s decor (the lock pip: only you can pick this up)');
    // Homes-feature says which: the floor is a target on no piece (packDropTarget's `on`).
    const homes = readFileSync(join(GAME_DIR, 'public/js/features/homes-feature.js'), 'utf8');
    assert.match(homes, /function packDropOpts\(engine, was, target\) \{[\s\S]{0,200}floor: target\?\.on == null,/);
    const game = readFileSync(join(GAME_DIR, 'public/game.js'), 'utf8');
    const at = game.slice(game.indexOf('  dropPackStackAt(classTsid, count, x, y,'), game.indexOf('  takeDroppedStack(id) {'));
    assert.ok(at.indexOf('packToSharedFloor(features, engine, { classTsid, count: n, x, y, floor })') > 0, 'game.js asks first');
    assert.ok(at.indexOf('packToSharedFloor(') < at.indexOf('beforeRemove?.(n);'), 'before the pack changes');
  });

  it('a class or count the server does not take stays the owner\'s own (an emblem is one to a stack)', () => {
    assert.equal(packToSharedFloor(host, engine, { classTsid: 'note', count: 1, x: 1300, y: 620, floor: true }), false);
    assert.equal(dropsMpFeature.sharedDropFits('emblem_mab', 2, engine), null);
    assert.equal(dropsMpFeature.sharedDropFits('emblem_mab', 1, engine), true);
  });

  it('(c) a locked floor stack moved to the floor comes off the save and goes down shared', async () => {
    const res = ownRowToSharedFloor(host, engine, { state, key: 'RH_HOME_INT', inv: engine.inv, id: 'world-item-1', x: 1100, y: 620 });
    assert.deepEqual(res, { ok: true, shared: true, count: 5 });
    assert.equal(state.streets.RH_HOME_INT.find((r) => r.id === 'world-item-1'), undefined, 'out of the save');
    assert.equal(engine.inv.honey, 7, 'in the pack until the server answers');
    await settle();
    assert.deepEqual(drops().at(-1)[1].item, { c: 'honey', n: 5 });
    assert.equal(drops().at(-1)[1].x, 1100);
    const shared = { id: 'drop-00000000000000f2', c: 'honey', n: 5, x: 350, y: 620, by: { id: 7, name: 'Ada' }, at: 1 };
    client.emit('msg:ground_dropped', { op: shared.id, status: 'settled', stack: shared });
    client.emit('msg:ground_added', { stack: shared });
    assert.equal(engine.inv.honey, 2, 'given up once the server says it is down');
    assert.ok(globalThis.groddleDrops.stacks.some((s) => s.id === 'drop-00000000000000f2'), 'on the shared floor');
  });

  it('a refused share leaves it in the pack: nothing vanishes', async () => {
    state.streets.RH_HOME_INT.push({ id: 'world-item-9', classTsid: 'honey', count: 2, x: 900, y: 620, decor: true });
    const before = engine.inv.honey;
    assert.equal(ownRowToSharedFloor(host, engine, { state, key: 'RH_HOME_INT', inv: engine.inv, id: 'world-item-9', x: 950, y: 620 }).ok, true);
    await settle();
    client.emit('msg:ground_dropped', { ref: drops().at(-1)[1].ref, status: 'refused', why: 'busy', text: 'Wait a moment, you are still dropping something.' });
    assert.equal(engine.inv.honey, before + 2, 'in the pack');
  });

  it('offline it stays the owner\'s own, where it was (the caller moves it in the save)', () => {
    client.state = 'offline';
    const res = ownRowToSharedFloor(host, engine, { state, key: 'RH_HOME_INT', inv: engine.inv, id: 'world-item-2', x: 1, y: 620 });
    client.state = 'online';
    assert.equal(res.reason, 'own');
    assert.equal(state.streets.RH_HOME_INT.find((r) => r.id === 'world-item-2').count, 3);
  });

  it('homes-feature: a move to the floor shares the save\'s stack and takes the lock off; a shelf keeps it', () => {
    const homes = readFileSync(join(GAME_DIR, 'public/js/features/homes-feature.js'), 'utf8');
    const mv = homes.slice(homes.indexOf('function moveStack('), homes.indexOf('function claimShared('));
    assert.match(mv, /if \(target\.on == null\) \{\s+const shared = shareOwnStack\(engine, row, target\);\s+if \(shared\) return shared;\s+\}/);
    assert.match(mv, /if \(target\.on != null\) row\.decor = true;\s+else delete row\.decor;/);
    assert.doesNotMatch(mv, /^\s+row\.decor = true;$/m, 'never locked on the floor');
  });
});

describe('a like stack takes no more than its stackmax (Eleven Location.addItem 475-503)', () => {
  const ROOM = 'RH_HOME_INT';
  it('a full Moonstone stack (3) takes no fourth: the drop lies as its own stack', () => {
    const s = createDroppedItemState({ streets: { [ROOM]: [{ id: 'a', classTsid: 'gem_moonstone', count: 3, x: 100, y: 620 }] } });
    const res = dropInventoryStack(s, { gem_moonstone: 1 }, ROOM, 'gem_moonstone', 1, { x: 100, y: 620 }, {});
    assert.equal(res.merged, false);
    assert.deepEqual(s.streets[ROOM].map((r) => r.count), [3, 1]);
  });

  it('two Moonstones dropped on one fill it to 3; the rest lies beside it', () => {
    const s = createDroppedItemState({ streets: { [ROOM]: [{ id: 'a', classTsid: 'gem_moonstone', count: 2, x: 100, y: 620 }] } });
    const res = dropInventoryStack(s, { gem_moonstone: 2 }, ROOM, 'gem_moonstone', 2, { x: 100, y: 620 }, {});
    assert.equal(res.merged, true);
    assert.equal(res.joined, 1);
    assert.deepEqual(s.streets[ROOM].map((r) => r.count), [3, 1]);
  });

  it('a move onto a full stack finds no like stack; onto one with room it fills it and the rest stays moved', () => {
    const s = createDroppedItemState({ streets: { [ROOM]: [
      { id: 'a', classTsid: 'gem_moonstone', count: 3, x: 100, y: 620 },
      { id: 'b', classTsid: 'gem_moonstone', count: 2, x: 400, y: 620 },
      { id: 'c', classTsid: 'gem_moonstone', count: 2, x: 700, y: 620 },
    ] } });
    const rows = s.streets[ROOM];
    assert.equal(likeStackAt(rows, rows[2], 100, null), null, 'full');
    assert.equal(likeStackAt(rows, rows[2], 400, null)?.id, 'b');
    assert.equal(mergeDroppedStacks(s, ROOM, 'c', 'a').reason, 'full');
    const res = mergeDroppedStacks(s, ROOM, 'c', 'b');
    assert.deepEqual([res.ok, res.count, res.left], [true, 1, 1]);
    assert.deepEqual(rows.map((r) => [r.id, r.count]), [['a', 3], ['b', 3], ['c', 1]], 'nothing made or lost');
  });

  it('an emblem (stackmax 1) never joins another; honey under its 40 does', () => {
    const s = createDroppedItemState({ streets: { [ROOM]: [{ id: 'a', classTsid: 'emblem_mab', count: 1, x: 100, y: 620 }] } });
    assert.equal(dropInventoryStack(s, { emblem_mab: 1 }, ROOM, 'emblem_mab', 1, { x: 100, y: 620 }, {}).merged, false);
    const h = createDroppedItemState({ streets: { [ROOM]: [{ id: 'a', classTsid: 'honey', count: 30, x: 100, y: 620, on: 2 }] } });
    assert.deepEqual(setDownStack(h, ROOM, 'honey', 20, { x: 100, y: 400 }, { on: 2, into: 'a' }).merged, true);
    assert.deepEqual(h.streets[ROOM].map((r) => r.count), [40, 10], 'filled to 40, ten beside it');
  });
});
