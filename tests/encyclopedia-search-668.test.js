/**
 * #668 (desktop): "you can not look up a concept; only match words ... there is apparently no
 * search that will return all streets that have community gardens." The encyclopedia's search
 * matched only an entry's name, id and group. Now (Austin 2026-11-24):
 *  - each page's facts are searchable (tools/encyclopedia/search-facts.mjs writes them from the
 *    pages as built, per section; public/encyclopedia/search-core.js indexes and ranks them, the
 *    same module the home page runs), with plurals folded and one typo allowed when nothing
 *    matches as typed, and the matched fact shown under the result;
 *  - "Streets with…" lists (tools/encyclopedia/street-lists.mjs) gather every street with a
 *    community garden, a shrine, a vendor, a subway station or a rock, tree or animal, each a
 *    search entry, linked from the Streets list, the encyclopedia's home and each street page.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { INVENTORY_DB } from '../tools/catalog/build.mjs';
import { loadEncyclopedia } from '../tools/encyclopedia/data.mjs';
import { pageFacts, listWords, dropBoilerplate } from '../tools/encyclopedia/search-facts.mjs';
import { addFacts, createIndex, fold, oneEdit, search, snippet, stem, words } from '../public/encyclopedia/search-core.js?v=fc694f9e';

const pub = join(import.meta.dirname, '..', 'public');
const dir = join(pub, 'encyclopedia');
const skip = existsSync(INVENTORY_DB) ? false : `needs the coverage inventory at ${INVENTORY_DB}`;
const read = (rel) => readFileSync(join(dir, rel), 'utf8');
const data = JSON.parse(read('search.json'));
const index = createIndex(data.entries, data.sections);
for (const [s, path] of Object.entries(data.facts || {})) addFacts(index, s, JSON.parse(read(path)));
const d = skip ? null : await loadEncyclopedia();
const keyOf = (h) => `${h.e.s}:${h.e.id}`;
const find = (q, opts) => search(index, q, opts);

/** The streets the game data gives a community garden (a Garden, or a herb bed in a planter box). */
const gardenStreets = () => [...d.entries.values()].filter((e) => e.section === 'streets' && e.street.gardens > 0).map((e) => e.key).sort();

describe('#668 encyclopedia search: words', () => {
  it('folds case, accents and punctuation, and stems plurals', () => {
    assert.equal(fold("Bishop's Arch"), 'bishops arch');
    assert.deepEqual(words('Community Gardens'), ['community', 'garden']);
    assert.equal(stem('berries'), 'berry');
    assert.equal(stem('boxes'), 'box');
    assert.equal(stem('potatoes'), 'potato');
    assert.equal(stem('glass'), 'glass');
    assert.equal(stem('rocks'), 'rock');
    assert.equal(stem('gas'), 'gas');
  });

  it('allows one typo: a letter missing, extra, changed or two swapped', () => {
    assert.ok(oneEdit('gardn', 'garden'));
    assert.ok(oneEdit('gardden', 'garden'));
    assert.ok(oneEdit('gardon', 'garden'));
    assert.ok(oneEdit('graden', 'garden'));
    assert.ok(!oneEdit('gard', 'garden'));
  });

  it("reads a page's facts band by band, without numbers, prices or the shared verbs", () => {
    const html = `<main><section class="band"><div class="wrap"><h2>About this street</h2><dl class="cat-facts"><dt>Region</dt><dd>Groddle Heights</dd><dt>Shrine</dt><dd><a>Shrine to Humbaba</a></dd></dl></div></section>
      <section class="band"><div class="wrap"><h2>Roads from here</h2><h3>Signposts</h3><p class="ency-chips"><a>Community Gardens</a></p></div></section>
      <section class="band"><div class="wrap"><h2>What is here</h2><h3>Rocks</h3><p class="ency-chips"><a><span>Metal Rock <b>3</b><span class="ency-sep">,</span></span></a> <a><span>Beryl Rock</span></a></p><h3>Other things</h3><p class="ency-chips"><span class="ency-chip"><span>Community gardens <b>10</b></span></span></p></div></section>
      <section class="band"><div class="wrap"><h2>Verbs</h2><dl><div><dt>pick up</dt><dd>Put it in your pack</dd></div></dl></div></section></main>`;
    assert.deepEqual(pageFacts(html), ['Shrine: Shrine to Humbaba', 'Rocks: Metal Rock, Beryl Rock', 'Other things: Community gardens']);
    assert.equal(listWords('Hoe, 63 currants, sell for 40'), 'Hoe');
    assert.equal(listWords('450 iMG, 45 favor with Mab'), 'favor with Mab');
    const shared = new Map(Array.from({ length: 10 }, (_, i) => [`x${i}`, ['Nothing to hand in.', `Own fact ${i}.`]]));
    assert.deepEqual(dropBoilerplate(shared).get('x3'), ['Own fact 3.']);
  });

  it('cuts a long fact around the first word it matched, and marks the words', () => {
    const parts = snippet(`${'a long start of a sentence '.repeat(6)}with a Community Garden at the end`, 'community gardens', { max: 50 });
    assert.equal(parts[0].text, '…');
    assert.deepEqual(parts.filter((p) => p.hit).map((p) => p.text), ['Community', 'Garden']);
  });
});

describe('#668 encyclopedia search: results', () => {
  it('"community garden" finds the How do I guide and the list first, then every street with one, each saying why', { skip }, () => {
    const want = gardenStreets();
    assert.ok(want.length >= 10, `${want.length} streets with a community garden`);
    const { hits, fuzzy } = find('community garden');
    assert.equal(fuzzy, false);
    // The guide to them comes first (tests/encyclopedia-how-668.test.js), then the list.
    assert.equal(keyOf(hits[0]), 'how:community-gardens');
    assert.equal(keyOf(hits[1]), 'lists:community-garden');
    const got = new Set(hits.map(keyOf));
    for (const k of want) assert.ok(got.has(k), `${k} is not found`);
    for (const h of hits.filter((x) => want.includes(keyOf(x)) && x.e.n !== 'Community Gardens')) assert.match(h.why, /Community garden/i, keyOf(h));
    // The list holds the same streets.
    const list = read('streets/with/community-garden/index.html');
    for (const k of want) assert.ok(list.includes(`href="../../../../encyclopedia/streets/${k.slice(8)}/"`), `${k} is not on the list`);
  });

  it('"gardens" and "community gardn" (one typo) find them too', { skip }, () => {
    const want = gardenStreets();
    for (const q of ['gardens', 'community gardn', 'Community Gardens']) {
      const { hits } = find(q);
      const got = new Set(hits.map(keyOf));
      assert.ok(got.has('lists:community-garden'), q);
      for (const k of want) assert.ok(got.has(k), `${q}: ${k}`);
    }
    assert.equal(find('community gardn').fuzzy, true);
    assert.deepEqual(find('community gardn').hits.slice(0, 2).map(keyOf), ['how:community-gardens', 'lists:community-garden']);
  });

  it("an item's facts are searchable: each seed the Gardening Tools Vendor sells, by the vendor", { skip }, () => {
    const store = d.entries.get('stores:gardening_tools');
    const seeds = store.shop.offers.map((o) => o.classTsid).filter((id) => /seed/.test(id) && d.items.has(id));
    assert.ok(seeds.length >= 5, `${seeds.length} seeds`);
    const { hits } = find('seed gardening tools vendor', { section: 'items' });
    const got = new Map(hits.map((h) => [h.e.id, h]));
    for (const id of seeds) {
      assert.ok(got.has(id), `${id} is not found by its vendor`);
      assert.match(got.get(id).why, /Gardening Tools Vendor/, id);
    }
  });

  it('a word in the name ranks above the same word in a fact', () => {
    for (const q of ['piggy', 'metal rock', 'shrine humbaba']) {
      const ws = words(q);
      const { hits } = find(q);
      const inName = (h) => ws.every((w) => words(h.e.n).some((t) => t.includes(w)));
      const lastName = hits.findLastIndex(inName);
      const firstFact = hits.findIndex((h) => h.why);
      assert.ok(lastName >= 0 && firstFact > lastName, `${q}: last name match ${lastName}, first fact match ${firstFact}`);
    }
  });

  it('every query word must match: a word no page has finds nothing', () => {
    assert.equal(find('community zzzqqq').hits.length, 0);
    assert.ok(find('shrine humbaba').hits.every((h) => /humbaba/i.test(`${h.e.n} ${h.e.id} ${h.e.g || ''} ${index.facts[h.i]?.join(' ') || ''}`)));
  });
});

describe('#668 the "Streets with…" lists', () => {
  it('are each a search entry, a page, and linked from the lists page, which the Streets list and the home link', { skip }, () => {
    const lists = data.entries.filter((e) => e.s === 'lists' && e.id !== 'all');
    assert.ok(lists.length >= 40, `${lists.length} lists`);
    const all = read('streets/with/index.html');
    for (const l of lists) {
      assert.ok(existsSync(join(pub, l.h, 'index.html')), l.h);
      assert.ok(all.includes(`href="${l.id}/"`), `${l.id} is not on the lists page`);
      assert.ok(l.c > 0, l.id);
    }
    assert.ok(read('streets/index.html').includes('href="with/"'));
    assert.ok(read('index.html').includes('href="streets/with/"'));
    for (const id of ['community-garden', 'shrine-to-humbaba', 'gardening-goods-vendor', 'subway-station', 'metal-rock', 'fruit-tree', 'dirt-pile', 'piggy', 'mailbox']) {
      assert.ok(lists.some((l) => l.id === id), `no list ${id}`);
    }
  });

  it("each shrine list holds exactly the streets with that Giant's shrine", { skip }, () => {
    const streets = [...d.entries.values()].filter((e) => e.section === 'streets');
    for (const g of ['alph', 'humbaba', 'ti']) {
      const name = { alph: 'alph', humbaba: 'humbaba', ti: 'tii' }[g];
      const want = streets.filter((e) => e.street.giant === g);
      const html = read(`streets/with/shrine-to-${name}/index.html`);
      assert.equal((html.match(/<li><a href="[^"]*\/streets\/[^"]+\/">/g) || []).length, want.length, g);
    }
  });

  it('a street page links the lists it is on, and says it has a community garden', { skip }, () => {
    const page = read('streets/kipacre-greens/index.html');
    assert.match(page, /Other streets with these/);
    assert.match(page, /<a href="\.\.\/with\/community-garden\/">Community garden<\/a>/);
    assert.match(page, /Community gardens <b>7<\/b>/);
  });
});

describe('#668 index size', () => {
  it('keeps search.json under 950 KB and the facts, loaded per section after it, under 2x the 870 KB index', () => {
    const names = Buffer.byteLength(read('search.json'));
    const facts = Object.values(data.facts).map((p) => Buffer.byteLength(read(p)));
    const total = facts.reduce((a, b) => a + b, 0);
    assert.ok(names < 950_000, `search.json ${names} bytes`);
    assert.ok(Math.max(...facts) < 450_000, `largest facts file ${Math.max(...facts)} bytes`);
    assert.ok(total < 1_740_000, `facts ${total} bytes`);
    const zipped = gzipSync(Buffer.concat([read('search.json'), ...Object.values(data.facts).map(read)].map((s) => Buffer.from(s)))).length;
    assert.ok(zipped < 450_000, `gzip ${zipped} bytes`);
  });
});
