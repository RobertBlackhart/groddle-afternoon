/**
 * Pot Luck Day, part A (G982): the season's window and QA overrides (js/seasons.js), the chicken
 * costumes' rules (js/pot-luck.js), the dress flow and the Fancy Feather in the feature
 * (features/pot-luck-feature.js), the server's word on a shared Chicken (js/street-creatures.js),
 * the drop on a Chicken (js/world-drop.js), and the costume art (tools/pot-luck-art).
 * Run: node --test tests/pot-luck.test.js
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from '../tools/image-size.mjs';
import { HIRES_SPRITES } from '../public/js/sprite-hires.js?v=e5d8f9ec';
import { HIRES_ICONS } from '../public/js/icon-hires.js?v=fb952dde';
import { PACKED_SHEETS } from '../public/js/packed-sheets-data.js?v=192c6f15';
import { SEASONS, SEASONAL_STOCK, SEASONAL_ITEMS, activeSeasons, calendarSeasons, daysLeft, parseSeasonDate, potLuckWindow, seasonalConversions, seasonalSources } from '../public/js/seasons.js?v=8b81947e';
import {
  CHICKEN_SHEETS,
  COSTUME_CLASSES,
  COSTUME_SHEETS,
  FEATHER,
  POT_LUCK_ITEMS,
  POT_LUCK_LINES,
  costumeFrame,
  dressCheck,
  dressVerbs,
  featherDrop,
} from '../public/js/pot-luck.js?v=84484e77';
import { applyCreatureState } from '../public/js/street-creatures.js?v=133512c9';
import { dropFor } from '../public/js/world-drop.js?v=0b4f1e4d';
import { potLuckFeature } from '../public/js/features/pot-luck-feature.js?v=2835ca06';
import { problems } from '../tools/pot-luck-art/build.mjs';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const at = (y, m, d) => parseSeasonDate(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

describe('Pot Luck Day window (js/seasons.js)', () => {
  it('is a designed season from the Sunday before US Thanksgiving to the Sunday after, November only', () => {
    assert.equal(SEASONS.pot_luck_day.source, 'designed');
    assert.deepEqual(potLuckWindow(2026), { from: [11, 22], to: [11, 29] });
    assert.deepEqual(potLuckWindow(2027), { from: [11, 21], to: [11, 28] });
    assert.deepEqual(potLuckWindow(2028), { from: [11, 19], to: [11, 26] });
    assert.deepEqual(calendarSeasons(at(2026, 11, 21)), []);
    assert.deepEqual(calendarSeasons(at(2026, 11, 22)), ['pot_luck_day']);
    assert.deepEqual(calendarSeasons(at(2026, 11, 26)), ['pot_luck_day']);
    assert.deepEqual(calendarSeasons(at(2026, 11, 29)), ['pot_luck_day']);
    assert.deepEqual(calendarSeasons(at(2026, 11, 30)), []);
    // No Pot Twoday: nothing in any other month of the year.
    for (let m = 1; m <= 12; m++) for (let d = 1; d <= 28; d++) if (m !== 11) assert.ok(!calendarSeasons(at(2026, m, d)).includes('pot_luck_day'), `${m}/${d}`);
    assert.equal(daysLeft('pot_luck_day', at(2026, 11, 26)), 3);
    assert.equal(daysLeft('pot_luck_day', at(2026, 11, 29)), 0);
  });

  it('takes the QA overrides as the other seasons do', () => {
    assert.deepEqual(activeSeasons(at(2026, 6, 1), { override: 'pot_luck_day' }), { ids: ['pot_luck_day'], primary: 'pot_luck_day', via: 'override' });
    assert.deepEqual(activeSeasons(at(2026, 11, 26), { override: 'none' }).ids, []);
    assert.deepEqual(activeSeasons(at(2026, 11, 26)), { ids: ['pot_luck_day'], primary: 'pot_luck_day', via: 'calendar' });
  });

  it('stocks the Toy Vendor with both costumes, and knows the feather and its rot', () => {
    assert.deepEqual(SEASONAL_STOCK.pot_luck_day.toys.map((o) => [o.classTsid, o.cost]), [['turkey_tailfan', 150], ['rooster_plume', 150]]);
    assert.equal(SEASONAL_ITEMS.turkey_tailfan, 'pot_luck_day');
    assert.ok(seasonalSources().some(([id, src]) => id === 'fancy_feather' && src === 'season:pot_luck_squeeze'));
    assert.ok(seasonalConversions().some((c) => c.inputs[0] === 'fancy_feather' && c.outputs[0] === 'loam'));
  });
});

describe('dress rules (js/pot-luck.js)', () => {
  const base = { classId: 'npc_chicken', street: true, season: true, costume: '', cls: 'turkey_tailfan', have: 1 };
  it('refuses out of season, without the item, on a dressed Chicken and on anything else', () => {
    assert.deepEqual(dressCheck(base), { ok: true });
    assert.equal(dressCheck({ ...base, season: false }).code, 'no_season');
    assert.equal(dressCheck({ ...base, have: 0 }).msg, POT_LUCK_LINES.noItem);
    assert.equal(dressCheck({ ...base, costume: 'rooster_plume' }).code, 'dressed');
    assert.equal(dressCheck({ ...base, classId: 'npc_piggy' }).code, 'not_chicken');
    assert.equal(dressCheck({ ...base, street: false }).code, 'not_chicken');
    assert.equal(dressCheck({ ...base, cls: 'chicken_egg' }).code, 'not_costume');
  });

  it('offers one row per costume in the pack, or one row that says why not', () => {
    assert.deepEqual(dressVerbs({ season: false, inv: { turkey_tailfan: 1 } }), []);
    assert.deepEqual(dressVerbs({ season: true, inv: { turkey_tailfan: 1, rooster_plume: 2 } }).map((r) => [r.id, r.label, r.enabled]), [
      ['potluck:dress:turkey_tailfan', 'Dress in Turkey Tailfan', true],
      ['potluck:dress:rooster_plume', 'Dress in Rooster Plume', true],
    ]);
    assert.deepEqual(dressVerbs({ season: true, inv: {} }).map((r) => [r.id, r.enabled, r.reason]), [['potluck:dress', false, POT_LUCK_LINES.noItem]]);
    assert.deepEqual(dressVerbs({ season: true, costume: 'turkey_tailfan', inv: { rooster_plume: 1 } }).map((r) => [r.id, r.enabled, r.reason]), [['potluck:dress', false, POT_LUCK_LINES.already]]);
  });

  it('takes a costume dropped on a Chicken through its dress row', () => {
    const verbs = dressVerbs({ season: true, inv: { turkey_tailfan: 1, rooster_plume: 1 } });
    assert.equal(dropFor('npc_chicken', 'rooster_plume', verbs).verb.id, 'potluck:dress:rooster_plume');
    assert.equal(dropFor('npc_chicken', 'turkey_tailfan', verbs).verb.id, 'potluck:dress:turkey_tailfan');
    // Dressed: the drop meets the disabled row, which says why.
    const dressed = dressVerbs({ season: true, costume: 'turkey_tailfan', inv: { rooster_plume: 1 } });
    assert.equal(dropFor('npc_chicken', 'rooster_plume', dressed).verb.enabled, false);
    assert.equal(dropFor('npc_piggy', 'rooster_plume', verbs), null);
    assert.equal(dropFor('npc_chicken', 'rooster_plume', []), null, 'out of season the Chicken offers no dress verb');
  });

  it('drops a Fancy Feather one squeeze in four from a dressed Chicken, five a game day', () => {
    const row = { day: '', n: 0 };
    assert.equal(featherDrop(row, { dressed: false, dayKey: 'd1', rng: () => 0 }), false);
    assert.equal(featherDrop(row, { dressed: true, dayKey: 'd1', rng: () => 0.25 }), false);
    let n = 0;
    for (let i = 0; i < 9; i++) if (featherDrop(row, { dressed: true, dayKey: 'd1', rng: () => 0.1 })) n++;
    assert.equal(n, FEATHER.dailyMax);
    assert.equal(featherDrop(row, { dressed: true, dayKey: 'd2', rng: () => 0.1 }), true, 'a new game day');
    assert.equal(FEATHER.chance, 0.25);
  });
});

describe('a shared Chicken (js/street-creatures.js applyCreatureState)', () => {
  it('wears the costume the server holds, and loses it when the server clears it', () => {
    const state = {};
    applyCreatureState('npc_chicken', state, { id: 'chicken:1', cos: 'rooster_plume' });
    assert.equal(state.costume, 'rooster_plume');
    applyCreatureState('npc_chicken', state, { id: 'chicken:1', cos: 'party_hat' });
    assert.equal(state.costume, undefined);
    applyCreatureState('npc_chicken', state, { id: 'chicken:1', cos: 'turkey_tailfan' });
    applyCreatureState('npc_chicken', state, { id: 'chicken:1' });
    assert.equal(state.costume, undefined);
  });
});

/** A small engine for the feature: solo, one street Chicken. */
function fakeEngine({ on = true, preview = false, mode = 'solo', inv = {} } = {}) {
  const chicken = { classId: 'npc_chicken', classIndex: 0, state: {}, sprite: null };
  const e = {
    mode,
    streetTsid: 'GA5101HF7F429V5',
    inv: { ...inv },
    interactables: [chicken],
    counters: [],
    lines: [],
    data: {},
    season: { on, preview },
    target: null,
    query(name, ...args) {
      if (name === 'seasonOn') return args[0] === 'pot_luck_day' && e.season.on;
      if (name === 'seasonPreview') return e.season.preview;
      if (name === 'sharedObjectVerb') return e.sharedAsk ? true : null;
      return null;
    },
    achievement: (c, n) => e.counters.push(`${c}=${n}`),
    toast: (l) => e.lines.push(l),
    pushActivity() {},
    save() {},
    setData: (k, v) => { e.data[k] = v; },
    verbTarget: () => e.target,
  };
  return { e, chicken };
}

describe('the dress flow and the feather (features/pot-luck-feature.js)', () => {
  beforeEach(() => potLuckFeature._reset());

  it('dresses a street Chicken solo: the costume leaves the pack, the save keeps it, the counter counts', () => {
    const { e, chicken } = fakeEngine({ inv: { turkey_tailfan: 1, rooster_plume: 1 } });
    potLuckFeature.init(e);
    const rows = potLuckFeature.decorateVerbs(chicken, [{ id: 'squeeze' }], e);
    assert.deepEqual(rows.map((r) => r.id), ['squeeze', 'potluck:dress:turkey_tailfan', 'potluck:dress:rooster_plume']);
    assert.equal(potLuckFeature.runVerbOverride(chicken, 'potluck:dress:turkey_tailfan', e), true);
    assert.equal(e.inv.turkey_tailfan || 0, 0);
    assert.equal(chicken.state.costume, 'turkey_tailfan');
    assert.deepEqual(potLuckFeature.save().dressed, { 'GA5101HF7F429V5:0': 'turkey_tailfan' });
    assert.deepEqual(e.counters, ['chicken_dressed:turkey_tailfan=1']);
    assert.equal(e.lines.at(-1), POT_LUCK_LINES.dressed.turkey_tailfan);
    // Dressed already: refused, the plume stays in the pack.
    potLuckFeature.runVerbOverride(chicken, 'potluck:dress:rooster_plume', e);
    assert.equal(e.inv.rooster_plume, 1);
    assert.equal(e.lines.at(-1), POT_LUCK_LINES.already);
    assert.deepEqual(potLuckFeature.decorateVerbs(chicken, [], e).map((r) => [r.id, r.enabled]), [['potluck:dress', false]]);
    // The save round-trips.
    const saved = potLuckFeature.save();
    potLuckFeature._reset();
    potLuckFeature.restore(saved);
    assert.deepEqual(potLuckFeature.save().dressed, saved.dressed);
  });

  it('refuses with no season, no costume and on a Chicken that is not the street\'s', () => {
    const { e, chicken } = fakeEngine({ on: false, inv: { turkey_tailfan: 1 } });
    assert.equal(potLuckFeature.decorateVerbs(chicken, [], e), null, 'no rows out of season');
    potLuckFeature.runVerbOverride(chicken, 'potluck:dress:turkey_tailfan', e);
    assert.equal(e.lines.at(-1), POT_LUCK_LINES.noSeason);
    e.season.on = true;
    e.inv = {};
    potLuckFeature.runVerbOverride(chicken, 'potluck:dress:turkey_tailfan', e);
    assert.equal(e.lines.at(-1), POT_LUCK_LINES.noItem);
    e.inv = { turkey_tailfan: 1 };
    const yours = { classId: 'npc_chicken', featureId: 'animal-husbandry', state: {} };
    potLuckFeature.runVerbOverride(yours, 'potluck:dress:turkey_tailfan', e);
    assert.equal(e.lines.at(-1), POT_LUCK_LINES.notChicken);
    assert.equal(e.inv.turkey_tailfan, 1);
    assert.equal(e.counters.length, 0);
  });

  it('asks the server online before anything changes', () => {
    const { e, chicken } = fakeEngine({ mode: 'multiplayer', inv: { rooster_plume: 1 } });
    e.sharedAsk = true;
    potLuckFeature.runVerbOverride(chicken, 'potluck:dress:rooster_plume', e);
    assert.equal(e.inv.rooster_plume, 1);
    assert.equal(chicken.state.costume, undefined);
    // The go-ahead runs it again (sharedObjectVerb answers null with the grant): it lands, held by the server's state.
    e.sharedAsk = false;
    potLuckFeature.runVerbOverride(chicken, 'potluck:dress:rooster_plume', e);
    assert.equal(e.inv.rooster_plume || 0, 0);
    assert.equal(chicken.state.costume, 'rooster_plume');
    assert.deepEqual(potLuckFeature.save().dressed, {}, 'online the server holds it, not the save');
  });

  it('drops Fancy Feathers from a dressed Chicken\'s squeeze, at most five a day, and rots them into loam when the season ends', () => {
    const { e, chicken } = fakeEngine({ inv: { turkey_tailfan: 1 } });
    potLuckFeature.onTick(16, Date.now(), e);
    e.target = chicken;
    const rnd = Math.random;
    Math.random = () => 0.1;
    try {
      potLuckFeature.onEvent('chicken:squoze', 1, e);
      assert.equal(e.inv.fancy_feather || 0, 0, 'a plain Chicken drops none');
      potLuckFeature.runVerbOverride(chicken, 'potluck:dress:turkey_tailfan', e);
      for (let i = 0; i < 8; i++) potLuckFeature.onEvent('chicken:squoze', 1, e);
      assert.equal(e.inv.fancy_feather, FEATHER.dailyMax);
    } finally {
      Math.random = rnd;
    }
    // A preview turning the season off rots nothing.
    e.season = { on: false, preview: true };
    potLuckFeature.onTick(16, Date.now() + 5000, e);
    assert.equal(e.inv.fancy_feather, 5);
    // The calendar's end: the costumes fall off and the feathers turn to loam.
    e.season = { on: false, preview: false };
    potLuckFeature.onTick(16, Date.now() + 10000, e);
    assert.equal(e.inv.fancy_feather || 0, 0);
    assert.equal(e.inv.loam, 5);
    assert.deepEqual(potLuckFeature.save().dressed, {});
    assert.match(e.lines.at(-1), /5 Lumps of Loam/);
  });
});

describe('costume art (tools/pot-luck-art)', () => {
  it('is current: built.json matches the files, the tool and the FLA, and the game names the same sheets', async () => {
    assert.deepEqual(await problems(), []);
  });

  it('has a costume frame for every frame of every clip the Chicken plays, at 1x and 3x', () => {
    const packed = Object.values(PACKED_SHEETS.chicken).map((d) => d.path);
    for (const s of CHICKEN_SHEETS) assert.ok(existsSync(join(pub, s.path)), s.path);
    for (const d of packed) assert.ok(CHICKEN_SHEETS.some((s) => s.path === d), `${d} has a costume`);
    for (const costume of COSTUME_CLASSES) {
      for (const s of CHICKEN_SHEETS) {
        const def = COSTUME_SHEETS[costume][s.clip];
        assert.equal(def.frames, s.frames);
        const one = imageSize(join(pub, def.path));
        assert.deepEqual([one.w, one.h], [def.cols * 148, Math.ceil(def.frames / def.cols) * 110], def.path);
        const three = HIRES_SPRITES.get(def.path);
        assert.ok(three, `${def.path} has a 3x`);
        assert.deepEqual(imageSize(join(pub, three)), { w: one.w * 3, h: one.h * 3, format: 'webp' });
        // Each chicken frame finds its twin: the last cell of the sheet included.
        const k = s.frames - 1;
        const r = costumeFrame(costume, s.path, { x: (k % s.cols) * s.fw, y: Math.floor(k / s.cols) * s.fh });
        assert.deepEqual(r, { path: def.path, x: (k % def.cols) * 148, y: Math.floor(k / def.cols) * 110, w: 148, h: 110 });
      }
    }
    assert.equal(costumeFrame('turkey_tailfan', 'assets/sprites/npc_piggy__x1_walk_png_1354829432.webp', { x: 0, y: 0 }), null);
  });

  it('gives the three items their 1x and 3x pack icons', () => {
    for (const id of Object.keys(POT_LUCK_ITEMS)) {
      assert.ok(HIRES_ICONS.has(id), id);
      const one = imageSize(join(pub, `assets/sprites/icons/${id}.webp`));
      const three = imageSize(join(pub, `assets/sprites/icons/${id}@3x.webp`));
      assert.deepEqual([three.w, three.h], [one.w * 3, one.h * 3]);
    }
  });
});
