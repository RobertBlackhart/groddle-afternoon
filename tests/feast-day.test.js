/**
 * Thanksgiving Day's feast (G1009): the rules (js/feast-day.js, mirroring the server's
 * feast_day.go), the solo table's per-class counts (js/pot-luck-feast.js), the eat-from-stock path
 * (game.js eatFromStock) and the feature drawing and eating its piles solo (vendored Pixi in a vm).
 * Run: node --test tests/feast-day.test.js
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, 'public', p), 'utf8');

function loadPixi() {
  const g = { console, setTimeout, clearTimeout, navigator: { userAgent: 'node' }, performance };
  g.window = g;
  g.self = g;
  g.globalThis = g;
  vm.createContext(g);
  vm.runInContext(readFileSync(join(ROOT, 'public/vendor/pixi/pixi-8.23.0.min.js'), 'utf8'), g);
  return g.PIXI;
}
class FakeImage {
  constructor() {
    this.naturalWidth = 40;
    this.naturalHeight = 30;
    this.width = 40;
    this.height = 30;
  }
}
const PIXI = loadPixi();
globalThis.PIXI = PIXI;
globalThis.Image = FakeImage;
const { installPixiFixes } = await import('../public/js/pixi-fixes.js?v=173fb649');
installPixiFixes(PIXI);

const {
  FEAST_DAY_LINES,
  FEAST_DAY_RULES,
  FEAST_PILE_CLASS,
  FEAST_SPOTS,
  biteSolo,
  createFeastDayState,
  drawClass,
  feastDayKey,
  refillDue,
  remaining,
  servingsLeft,
  settleFeastDay,
  thanksgivingDay,
} = await import('../public/js/feast-day.js?v=3302a66f');
const { HARVEST_DISHES, createTableState, layOffering, packAway, TABLE_STREET } = await import('../public/js/pot-luck-feast.js?v=89e24bce');
const { feastDayFeature } = await import('../public/js/features/feast-day-feature.js?v=570eeef1');

const at = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h + 8); // Pacific standard time
const fixed = (v) => () => v;

describe('the day (Ur clock)', () => {
  it('is the fourth Thursday of November, 00:00 to 23:59 Pacific', () => {
    assert.equal(thanksgivingDay(2026), 26);
    assert.equal(thanksgivingDay(2027), 25);
    assert.equal(feastDayKey(at(2026, 11, 26, 0)), 'feast_day:2026');
    assert.equal(feastDayKey(at(2026, 11, 26, 23)), 'feast_day:2026');
    assert.equal(feastDayKey(at(2026, 11, 25, 23)), '');
    assert.equal(feastDayKey(at(2026, 11, 27, 0)), '');
  });

  it('lays its spots where feast_day.go does: 230 to 750, clear of the Hardware Vendor', () => {
    assert.equal(FEAST_SPOTS.length, 20);
    assert.equal(FEAST_SPOTS[0], 230);
    assert.equal(FEAST_SPOTS[19], 750);
    assert.equal(FEAST_SPOTS[1], 257); // feast_day.go: 230 + (520 + 9) / 19
  });
});

describe('the pool', () => {
  it('a thin week is topped up to 20 dishes by Pot, a full one is not', () => {
    const s = createFeastDayState();
    assert.equal(settleFeastDay(s, 'feast_day:2026', { corn: 6, carrot: 1 }, fixed(0)), 'started');
    const pot = Object.values(s.pot).reduce((a, n) => a + n, 0);
    assert.equal(pot, 13);
    assert.deepEqual(Object.keys(s.pot).sort(), [...HARVEST_DISHES].sort());
    assert.equal(s.piles.filter((p) => p.b === 3).length, 20);
    assert.equal(servingsLeft(s, { corn: 6, carrot: 1 }), 60);
    const full = createFeastDayState();
    settleFeastDay(full, 'feast_day:2026', { corn: 30 }, fixed(0));
    assert.deepEqual(full.pot, {});
    assert.equal(servingsLeft(full, { corn: 30 }), 90);
  });

  it('draws weighted by what is left of each class (sorted, as the server)', () => {
    const s = createFeastDayState();
    assert.equal(drawClass(s, { carrot: 1, corn: 3 }, fixed(0)), 'carrot');
    assert.equal(drawClass(s, { carrot: 1, corn: 3 }, fixed(0.3)), 'corn');
    s.placed.carrot = 1;
    assert.equal(drawClass(s, { carrot: 1, corn: 3 }, fixed(0)), 'corn');
    assert.deepEqual(remaining(s, { carrot: 1, corn: 3 }), { corn: 3 });
    assert.equal(drawClass(s, {}, fixed(0)), '');
  });

  it('a bite: first eater wins, 11 a player, an emptied spot refills 20 s later', () => {
    const s = createFeastDayState();
    const counts = { potato: 40 };
    settleFeastDay(s, 'feast_day:2026', counts, fixed(0));
    const n = s.piles[4].n;
    for (let i = 0; i < 3; i += 1) assert.equal(biteSolo(s, 4, n, counts, 1000).ok, true);
    assert.equal(s.piles[4].b, 0);
    assert.equal(biteSolo(s, 4, n, counts, 1000).code, 'gone');
    assert.equal(s.refill[4], 1000 + FEAST_DAY_RULES.refillMs);
    assert.deepEqual(refillDue(s, counts, 1000 + 19_999, fixed(0)), []);
    assert.deepEqual(refillDue(s, counts, 1000 + 20_000, fixed(0)), [4]);
    assert.equal(s.piles[4].b, 3);
    assert.notEqual(s.piles[4].n, n);
    for (let i = 0; i < 8; i += 1) {
      const p = s.piles.find((x) => x.s >= 10 && x.b > 0);
      assert.equal(biteSolo(s, p.s, p.n, counts).ok, true);
    }
    assert.equal(s.ate, 11);
    const full = biteSolo(s, 15, s.piles[15].n, counts);
    assert.equal(full.code, 'full');
    assert.equal(full.msg, FEAST_DAY_LINES.full);
    assert.equal(s.piles[15].b, 3, "a refused bite is not taken");
  });

  it('a lay on the day gives an empty spot something again, 20 s later', () => {
    const s = createFeastDayState();
    settleFeastDay(s, 'feast_day:2026', {}, fixed(0)); // Pot's 20, all out
    for (let i = 0; i < 3; i += 1) biteSolo(s, 0, s.piles[0].n, {}, 1000);
    assert.equal(s.refill[0], undefined, 'nothing left to lay');
    assert.deepEqual(refillDue(s, {}, 50_000), []);
    assert.deepEqual(refillDue(s, { corn: 1 }, 60_000, fixed(0)), [], 'armed, not yet laid');
    assert.deepEqual(refillDue(s, { corn: 1 }, 80_000, fixed(0)), [0]);
    assert.equal(s.piles[0].c, 'corn');
  });

  it('the leftovers are packed away on any other day', () => {
    const s = createFeastDayState();
    settleFeastDay(s, 'feast_day:2026', {}, fixed(0));
    assert.equal(settleFeastDay(s, '', {}), 'packed');
    assert.equal(s.piles.some((p) => p.b), false);
    assert.equal(biteSolo(s, 0, 1, {}).code, 'no_season');
    // A saved feast from last year is packed as it is settled.
    const old = createFeastDayState({ key: 'feast_day:2025', piles: [{ s: 1, n: 3, c: 'corn', b: 2 }], ate: 4 });
    assert.equal(old.piles[1].b, 2);
    settleFeastDay(old, 'feast_day:2026', { corn: 30 }, fixed(0));
    assert.equal(old.ate, 0);
  });
});

describe('the solo Harvest Table counts each kind laid this season', () => {
  it('counts every lay, past the 40 rows it keeps, and packs them away with it', () => {
    const t = createTableState({}, 'pot_luck_day:2026');
    for (let i = 0; i < 45; i += 1) layOffering(t, { c: 'corn' });
    layOffering(t, { c: 'pumpkin_pie' });
    assert.deepEqual(t.counts, { corn: 45, pumpkin_pie: 1 });
    assert.deepEqual(createTableState(t, 'pot_luck_day:2026').counts, { corn: 45, pumpkin_pie: 1 });
    packAway(t, '');
    assert.deepEqual(t.counts, {});
  });

  it('a save from before the counts counts its kept rows', () => {
    const t = createTableState({ key: 'pot_luck_day:2026', rows: [{ c: 'corn' }, { c: 'corn' }, { c: 'onion' }], total: 9 }, 'pot_luck_day:2026');
    assert.deepEqual(t.counts, { corn: 2, onion: 1 });
  });
});

describe('game.js eats a feast bite from a one-item stock, never the pack', () => {
  const game = read('game.js');
  it('the pack Eat takes a stock and eats from it', () => {
    assert.match(game, /function usePackItem\(classTsid, count = 1, stock = null\) \{\n  if \(!state\.started\) return false;\n[^\n]*\n  const from = stock \|\| inv;/);
    assert.match(game, /: useItem\(from, pc, classTsid\);/);
    assert.match(game, /function eatFromStock\(classTsid\) \{\n  return usePackItem\(classTsid, 1, \{ \[classTsid\]: 1 \}\) === true;/);
  });
  it('the bite asks the pack Eat refusals first (full energy, stuffed, dead)', () => {
    const fn = game.slice(game.indexOf('function stockEatGate('), game.indexOf('\n}\n', game.indexOf('function stockEatGate(')));
    for (const want of ["features.query('packUseGate'", 'playerIsDead()', "features.metabolicGate('energy', 'gain'", 'canEatFood(foodState, pc, energyCap())']) assert.ok(fn.includes(want), want);
    assert.match(game, /eatGate: \(classTsid\) => stockEatGate\(classTsid\),\n  eatFromStock: \(classTsid\) => eatFromStock\(classTsid\),/);
  });
});

describe('the feature lays, draws and eats the piles solo', () => {
  const targets = [];
  const eaten = [];
  let gate = { ok: true };
  const engine = {
    PIXI,
    mode: 'solo',
    streetTsid: TABLE_STREET,
    street: { bounds: { l: -3000, t: -1000, r: 3000, b: 0 } },
    platforms: [],
    groundY: 0,
    started: true,
    inv: {},
    entityLayer: new PIXI.Container(),
    param: (k) => (k === 'seasondate' ? '2026-11-26' : ''),
    register(t) {
      const target = { ...t };
      targets.push(target);
      return target;
    },
    unregister(t) {
      const i = targets.indexOf(t);
      if (i >= 0) targets.splice(i, 1);
      t.sprite?.destroy?.();
    },
    eatGate: () => gate,
    eatFromStock: (c) => (eaten.push(c), true),
    setData() {},
    toast() {},
    playSound() {},
    save() {},
    updateHud() {},
    query: (hook) => (hook === 'feastLayCounts' ? { corn: 30 } : null),
    inScene: () => false,
  };
  const piles = () => targets.filter((t) => t.classId === FEAST_PILE_CLASS);

  before(() => {
    feastDayFeature.init(engine);
    feastDayFeature.onStreetEnter({}, engine);
  });

  it('20 piles of the week’s food stand right of the table, at their spots', () => {
    assert.equal(piles().length, 20);
    assert.equal(piles()[0].label.toLowerCase(), 'corn');
    assert.equal(piles()[0].sprite.x, 230 + 3000);
    assert.equal(piles()[0].subtitle, 'Thanksgiving feast · 90 servings left');
    assert.equal(feastDayFeature.feastDayServings(engine), 90);
  });

  it('Eat eats the food from a stock and the pile shows one bite fewer (its count state)', () => {
    const p = piles().find((t) => t.feastSpot === 3);
    const before3 = p.sprite.texture;
    assert.equal(feastDayFeature.verbsFor(p, engine)[0].enabled, true);
    feastDayFeature.runVerb(p, 'eat', engine);
    assert.deepEqual(eaten, ['corn']);
    assert.notEqual(p.sprite.texture, before3, 'the 2 state, not the 3');
    assert.equal(feastDayFeature.feastDayServings(engine), 89);
  });

  it('a refused eat (full energy) takes no bite', () => {
    gate = { ok: false, msg: 'You already have full energy.' };
    const p = piles().find((t) => t.feastSpot === 5);
    feastDayFeature.runVerb(p, 'eat', engine);
    gate = { ok: true };
    assert.equal(eaten.length, 1);
    assert.equal(feastDayFeature.feastDayServings(engine), 89);
  });

  it('an emptied pile goes, refills, and the eleventh bite is the last', () => {
    const spot = (s) => piles().find((t) => t.feastSpot === s);
    feastDayFeature.runVerb(spot(3), 'eat', engine);
    feastDayFeature.runVerb(spot(3), 'eat', engine);
    assert.equal(spot(3), undefined, 'eaten up');
    for (let s = 6; eaten.length < 11; s += 1) {
      feastDayFeature.runVerb(spot(s), 'eat', engine);
    }
    assert.equal(feastDayFeature.verbsFor(spot(19), engine)[0].enabled, false);
    feastDayFeature.runVerb(spot(19), 'eat', engine);
    assert.equal(eaten.length, 11);
    assert.equal(spot(19).sprite.destroyed, false);
  });

  it('the solo feast is saved with the player and packed away the next day', () => {
    const saved = feastDayFeature.save();
    assert.equal(saved.feast.key, 'feast_day:2026');
    assert.equal(saved.feast.ate, 11);
    engine.param = (k) => (k === 'seasondate' ? '2026-11-27' : '');
    feastDayFeature.onStreetEnter({}, engine);
    assert.equal(piles().length, 0);
    assert.equal(feastDayFeature.feastDayServings(engine), null);
  });
});
