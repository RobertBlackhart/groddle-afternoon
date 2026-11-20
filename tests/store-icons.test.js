/**
 * G1074 (report #564, Austin 2026-11-20): each store has an icon, one item it sells, in one shared
 * map (js/store-icons.js) that the vendor finder (the panel from the currants) and the
 * Encyclopedia's Sold by filter both read. The vendor finder's rows show it as the favor panel's
 * Giants show their shrine symbols (#563).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { STORE_ICON_ITEMS, storeIconItem, storeIconUrl } from '../public/js/store-icons.js?v=94487095';
import { STORE_CATALOG } from '../public/js/store-catalog.js?v=c6ebb2bd';
import { VENDOR_PROFILES } from '../public/js/vendor.js?v=71211643';
import { vendorFinderRows, vendorKinds } from '../public/js/vendor-finder.js?v=7fbfc51d';

const PUB = new URL('../public/', import.meta.url);
const read = (rel) => readFileSync(new URL(rel, PUB), 'utf8');

describe('G1074: every store has an icon item it sells (js/store-icons.js)', () => {
  it('every store in the catalog has one, and the store sells it', () => {
    for (const store of STORE_CATALOG) {
      const cls = storeIconItem(store.key);
      assert.ok(cls, `${store.label} (${store.key}) has an icon item`);
      assert.ok(store.offers.some((o) => o.classTsid === cls), `${store.label} sells ${cls}`);
      assert.ok(VENDOR_PROFILES[store.key].offers.some((o) => o.classTsid === cls), `the game's ${store.label} offers ${cls}`);
    }
  });

  it('names no store the catalog does not have', () => {
    const keys = new Set(STORE_CATALOG.map((s) => s.key));
    for (const key of Object.keys(STORE_ICON_ITEMS)) assert.ok(keys.has(key), key);
  });

  it('each is the pack icon the game already shows, with its 3x render', () => {
    for (const store of STORE_CATALOG) {
      const url = storeIconUrl(store.key);
      assert.equal(url, `assets/sprites/icons/${storeIconItem(store.key)}.webp`);
      assert.ok(existsSync(new URL(url, PUB)), url);
      assert.ok(existsSync(new URL(url.replace(/\.webp$/, '@3x.webp'), PUB)), `${url} @3x`);
    }
    assert.equal(storeIconUrl('nowhere'), '');
  });

  it('the starter stores show the starter items the ruling named', () => {
    assert.equal(STORE_ICON_ITEMS.groceries, 'bun');
    assert.equal(STORE_ICON_ITEMS.kitchen, 'knife_and_board');
    assert.equal(STORE_ICON_ITEMS.gardening, 'watering_can');
  });
});

describe('G1074: the vendor finder shows each store\'s icon', () => {
  const ecology = JSON.parse(read('assets/content/street-ecology.json'));
  const index = JSON.parse(read('assets/streets/index.json'));

  it('every kind and every row carries its store\'s icon', () => {
    const kinds = vendorKinds(ecology, index);
    assert.ok(kinds.length >= 14);
    for (const k of kinds) assert.equal(k.icon, storeIconUrl(k.key), k.key);
    const rows = vendorFinderRows(kinds, { here: 'GLI2V0UN7RD1T2J', find: () => null });
    for (const r of rows) assert.equal(r.icon, storeIconUrl(r.key), r.key);
    assert.equal(rows[0].icon, 'assets/sprites/icons/bun.webp', 'the starter street\'s Groceries Vendor');
  });

  it('the panel draws it before the name, in the favor rows\' 20 px box, Modern and Classic', () => {
    const topbar = read('js/ui/topbar.js');
    assert.match(topbar, /\(r\.icon \? `<img src="\$\{esc\(r\.icon\)\}" alt="" width="20" height="20" \/>` : '<span class="vf-noic" aria-hidden="true"><\/span>'\)\n\s+\+ `<span class="vf-name">/);
    const style = read('style.css');
    assert.match(style, /\.vf-row \{\n\s+display: grid; grid-template-columns: 20px max-content minmax\(0, 1fr\);/);
    assert.match(style, /\[data-ui="modern"\] \.vf-row img \{ width: 20px; height: 20px; object-fit: contain; justify-self: center; \}/);
    assert.match(style, /\[data-ui="modern"\] \.favor-row img \{ width: 20px; height: 20px; object-fit: contain; justify-self: center; \}/, 'the same box as the Giants\' rows');
    assert.match(read('css/classic.css'), /#vendor-finder-pop :is\(\.vf-row img, \.vf-noic\) \{ flex: none; width: calc\(20 \* var\(--cu\)\); height: calc\(20 \* var\(--cu\)\);/);
  });
});
