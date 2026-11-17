// G892 (stand-ins audit 2026-11-16, class A, scenes and props): code-drawn shapes swapped for Tiny
// Speck's own CC0 art where it survives.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { TRAINING2_TABLE_ART, TRAINING2_TABLE_SCALE, training2Layout, training2TableTop } from '../public/js/newxp.js?v=6ef1ea3a';
import { FURNITURE_UPGRADES } from '../public/js/furniture-upgrades-data.js?v=ced89b64';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const AUDIT = join(process.env.HOME || '', 'Documents/glitch-audit');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('training2 tables (A2, A2b)', () => {
  it('are the shipped furniture renders, with their own plats and feet', () => {
    for (const art of Object.values(TRAINING2_TABLE_ART)) {
      const row = FURNITURE_UPGRADES[art.classTsid].upgrades[art.upgrade];
      assert.equal(row.art.path, art.path);
      assert.equal(row.art.w, art.w);
      assert.equal(row.art.h, art.h);
      assert.equal(art.rest, row.platY - row.art.foot, `${art.classTsid} ${art.upgrade} rest`);
      assert.ok(existsSync(join(ROOT, art.path)), art.path);
      if (existsSync(join(AUDIT, 'glitch-items'))) assert.ok(existsSync(join(AUDIT, 'glitch-items', art.swf)), art.swf);
    }
    assert.equal(FURNITURE_UPGRADES.furniture_table.upgrades['63'].name, 'White Tablecloth Table');
    assert.equal(FURNITURE_UPGRADES.furniture_counter.upgrades['408'].name, 'Firebog Counter');
  });

  it('stand the food and drinks (GSJS location_targets) on their tops', () => {
    const L = training2Layout();
    for (const id of ['food_2', 'food_3']) assert.ok(Math.abs(training2TableTop('food', L.floorY) - L.items[id].y) <= 2, id);
    for (const id of ['drink_1', 'drink_2', 'drink_3']) assert.ok(Math.abs(training2TableTop('drinks', L.floorY) - L.items[id].y) <= 2, id);
    // Every item stands over its table's art, not past its ends.
    for (const [kind, ids] of [['food', ['food_2', 'food_3']], ['drinks', ['drink_1', 'drink_2', 'drink_3']]]) {
      const half = (TRAINING2_TABLE_ART[kind].w * TRAINING2_TABLE_SCALE) / 2;
      for (const id of ids) assert.ok(Math.abs(L.items[id].x - L.tables[kind].x) < half - 10, id);
    }
  });

  it('are drawn from that art, not as shapes', () => {
    const src = read('js/features/newxp-feature.js');
    const at = src.indexOf('function buildTraining2(');
    const body = src.slice(at, src.indexOf('\n}\n', at));
    assert.match(body, /TRAINING2_TABLE_ART\[kind\]/);
    assert.doesNotMatch(body, /ellipse\(|roundRect\(|0x9a5a2b|0xf4f4f4/);
  });
});
