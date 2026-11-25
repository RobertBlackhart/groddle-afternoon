/**
 * The Test Tube was missing from the Item Catalog: its class id (test_tube) matched the inventory's
 * test/admin id rule (^test_), so the item was excluded as a test class although the Alchemical
 * Goods Vendor and the Tool Vendor sell it (GSJS items/catalog_stores.js). A class a GSJS store sells
 * is a real item; genuine test and admin classes (none of them in a store) stay out.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gsjsItemRefs, judgeItems } from '../tools/inventory/detectors.mjs';

const root = join(import.meta.dirname, '..');
const item = (id, extra = {}) => ({ id, label: id, tags: [], parents: [id, 'takeable'], takeable: true, hidden: false, verbs: [], ...extra });
const judge = (items, { reach = new Map(), refs = {} } = {}) => judgeItems({
  items, reach, present: new Map(), codeCtx: new Map(),
  gsjsRefs: new Map(items.map((it) => [it.id, gsjsItemRefs(it.id, refs[it.id] || [])])),
});

describe('the Test Tube is an item, not a test class', () => {
  it('a test-looking id a GSJS store sells is judged as an item; test and admin classes stay excluded', () => {
    const rows = judge([item('test_tube'), item('test_item'), item('admin_widget'), item('bag_test_item'), item('timer_tester')], {
      reach: new Map([['test_tube', 'vendor:alchemical'], ['test_item', 'somewhere.js']]),
      refs: {
        test_tube: ['items/test_tube.js', 'items/catalog_stores.js', 'items/catalog_recipes.js'],
        test_item: ['items/test_item.js', 'items/catalog.js'],
        admin_widget: ['items/admin_widget.js'],
      },
    });
    const by = Object.fromEntries(rows.map((r) => [r.id, r]));
    assert.equal(by.test_tube.status, 'source');
    assert.match(by.test_tube.evidence, /vendor:alchemical/);
    for (const id of ['test_item', 'admin_widget', 'bag_test_item', 'timer_tester']) {
      assert.equal(by[id].status, 'excluded', id);
      assert.match(by[id].evidence, /test\/admin id/);
    }
  });

  it('GSJS: the Alchemical Goods Vendor and Tool Vendor sell the Test Tube, and no test or admin class is in a store', { skip: !existsSync(join(root, '../glitch-GameServerJS/items/catalog_stores.js')) && 'needs glitch-GameServerJS' }, () => {
    const stores = readFileSync(join(root, '../glitch-GameServerJS/items/catalog_stores.js'), 'utf8');
    assert.ok((stores.match(/['"]test_tube['"]/g) || []).length >= 2);
    for (const id of ['test_item', 'test_item2', 'test_item3', 'bag_test_item', 'js_test_item', 'admin_widget', 'test_chassis', 'test_game_starter', 'timer_tester', 'special_item_that_only_beta_testers_get']) {
      assert.doesNotMatch(stores, new RegExp(`['"]${id}['"]`), id);
    }
  });

  it('the Item Catalog has a Test Tube page that says the vendors sell it', () => {
    const data = JSON.parse(readFileSync(join(root, 'public/encyclopedia/items/data.json'), 'utf8'));
    const tube = data.items.find((i) => i.id === 'test_tube');
    assert.ok(tube, 'test_tube is listed');
    assert.equal(tube.status, 'source');
    assert.deepEqual(tube.get, ['sold']);
    assert.ok(tube.sold.includes('alchemical'));
    for (const id of ['test_item', 'admin_widget', 'bag_test_item']) assert.ok(!data.items.some((i) => i.id === id), id);
    const page = readFileSync(join(root, 'public/encyclopedia/items/test_tube/index.html'), 'utf8');
    assert.match(page, /This can be purchased from an Alchemical Goods Vendor or a Tool Vendor\./);
    assert.match(page, /Alchemical Goods Vendor/);
  });
});
