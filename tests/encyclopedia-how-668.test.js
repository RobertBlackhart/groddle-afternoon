/**
 * #668 (Austin 2026-11-24): the Encyclopedia's "How do I…" guides, written from questions players
 * asked (tools/encyclopedia/guides.mjs, drawn by guide-pages.mjs, written by build.mjs):
 *  - a page per guide under /encyclopedia/how/<slug>/ and an index, in the site's frame;
 *  - each guide is a search entry that comes first when the query holds its question words;
 *  - every link in a guide resolves to a built page, and the pages a guide covers link back;
 *  - every fact in a guide holds against the game's own code and data, and every number in a
 *    guide is one of those facts, so a guide cannot drift silently (the builder refuses to write
 *    one that does, so `node tools/encyclopedia/build.mjs --check` fails too).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { INVENTORY_DB } from '../tools/catalog/build.mjs';
import { loadEncyclopedia } from '../tools/encyclopedia/data.mjs';
import { GUIDES, HOW_PATH, checkGuides, guideTexts, hrefOf, linksIn } from '../tools/encyclopedia/guides.mjs';
import { addFacts, createIndex, search } from '../public/encyclopedia/search-core.js?v=fc694f9e';

const spike = join(import.meta.dirname, '..');
const pub = join(spike, 'public');
const dir = join(pub, 'encyclopedia');
const skip = existsSync(INVENTORY_DB) ? false : `needs the coverage inventory at ${INVENTORY_DB}`;
const read = (rel) => readFileSync(join(pub, rel), 'utf8');
const data = JSON.parse(read('encyclopedia/search.json'));
const index = createIndex(data.entries, data.sections);
for (const [s, path] of Object.entries(data.facts || {})) addFacts(index, s, JSON.parse(readFileSync(join(dir, path), 'utf8')));
const d = skip ? null : await loadEncyclopedia();
/** A key has a page when its built file is there (the guides' links never depend on the inventory). */
const built = (href) => existsSync(join(pub, href.replace(/\?.*$/, ''), 'index.html'));
const info = (key) => (built(hrefOf(key, () => true)) ? {} : null);

describe('#668 How do I… pages', () => {
  it('has six guides, each a page with its question, its answer and its parts, and an index of them all', () => {
    assert.equal(GUIDES.length, 6);
    const all = read(`${HOW_PATH}index.html`);
    assert.match(all, /<h1>How do I…<\/h1>/);
    for (const g of GUIDES) {
      const html = read(`${HOW_PATH}${g.slug}/index.html`);
      assert.ok(html.includes(`<h1>${g.question}</h1>`), `${g.slug}: question`);
      assert.match(html, /<p class="lead how-answer">/, g.slug);
      for (const part of g.parts) assert.ok(html.includes(`>${part.h}</h2>`), `${g.slug}: ${part.h}`);
      assert.match(html, /<h2 id="used-h">Pages this guide uses<\/h2>/, g.slug);
      assert.ok(all.includes(`href="${g.slug}/"`), `${g.slug} is not on the index`);
      // Plain words: no em dash, no en dash used as one.
      for (const t of [g.question, ...guideTexts(g)]) assert.doesNotMatch(t, /[—–]/, g.slug);
    }
  });

  it('the Encyclopedia home links the index and every guide, above the section cards', () => {
    const home = read('encyclopedia/index.html');
    const strip = home.indexOf('<section class="how-strip" id="how"');
    assert.ok(strip > 0 && strip < home.indexOf('<ul class="ency-cards" id="cards">'));
    assert.ok(home.includes('<a href="how/">How do I…</a>'));
    for (const g of GUIDES) assert.ok(home.includes(`href="how/${g.slug}/"`), g.slug);
  });

  it('every guide page is in the site frame: the header nav, the theme script and button', () => {
    for (const rel of [`${HOW_PATH}index.html`, ...GUIDES.map((g) => `${HOW_PATH}${g.slug}/index.html`)]) {
      const html = read(rel);
      const prefix = '../'.repeat(rel.split('/').length - 1);
      assert.match(html, /<nav class="site-nav"/, rel);
      assert.ok(new RegExp(`<script src="${prefix}site/theme\\.js\\?v=[0-9a-f]{8}"></script>`).test(html.slice(0, html.indexOf('</head>'))), rel);
      assert.match(html, /<button class="site-nav-theme" type="button" aria-label="Colour theme"><\/button>/, rel);
    }
  });
});

describe('#668 How do I… links', () => {
  it('every link in a guide resolves to a built page', () => {
    for (const g of GUIDES) {
      const links = guideTexts(g).flatMap(linksIn);
      assert.ok(links.length >= 3, `${g.slug}: only ${links.length} links`);
      for (const { key } of links) {
        const href = hrefOf(key, info);
        assert.ok(href, `${g.slug}: ${key} names no page`);
        assert.ok(built(href.startsWith('encyclopedia/?') ? 'encyclopedia/' : href), `${g.slug}: ${key} -> ${href} is not built`);
      }
      // And on the page as drawn: every link in its main resolves.
      const rel = `${HOW_PATH}${g.slug}/index.html`;
      const main = read(rel).split('<main')[1].split('</main>')[0];
      for (const [, href] of main.matchAll(/ href="([^"#]+)/g)) {
        const target = resolve(pub, rel, '..', href.replace(/&amp;/g, '&').replace(/\?.*$/, ''));
        assert.ok(existsSync(href.endsWith('/') || /\/\?/.test(href) ? join(target, 'index.html') : target), `${rel}: ${href}`);
      }
    }
  });

  it('the pages a guide covers link back to it: the Visiting Stone to visitors, the Door to floors, and so on', { skip }, () => {
    const pageOf = (key) => {
      if (key.startsWith('list:')) return `encyclopedia/streets/with/${key.slice(5)}/index.html`;
      if (key.startsWith('page:')) return `${key.slice(5)}index.html`;
      return `${hrefOf(key, () => true)}index.html`;
    };
    for (const g of GUIDES) {
      const covers = g.covers(d);
      assert.ok(covers.length, g.slug);
      for (const key of covers) assert.ok(read(pageOf(key)).includes(`encyclopedia/how/${g.slug}/">`), `${key} does not link ${g.slug}`);
    }
    assert.ok(read('encyclopedia/items/visiting_stone/index.html').includes('href="../../../encyclopedia/how/get-visitors/">How do I get visitors to my home street?</a>'));
    assert.ok(read('encyclopedia/streets/with/community-garden/index.html').includes('encyclopedia/how/community-gardens/'));
    assert.ok(read('encyclopedia/imagination/brain_capacity/index.html').includes('encyclopedia/how/learning-time/'));
  });
});

describe('#668 How do I… facts', () => {
  it('every fact holds against the game code and data', { skip }, () => {
    assert.deepEqual(checkGuides(d), []);
  });

  it('every number in a guide is one of its checked facts', () => {
    for (const g of GUIDES) {
      const text = [g.question, ...guideTexts(g)].join('\n');
      const covered = new Array(text.length).fill(false);
      for (const f of g.facts) {
        for (let at = text.indexOf(f.say); at >= 0; at = text.indexOf(f.say, at + 1)) for (let i = at; i < at + f.say.length; i += 1) covered[i] = true;
      }
      // A link's key is a page's address, not a number the guide states (skills:croppery_1).
      for (const m of text.matchAll(/\[\[[^\]|]+/g)) for (let i = m.index; i < m.index + m[0].length; i += 1) covered[i] = true;
      for (const m of text.matchAll(/\d[\d,.]*/g)) assert.ok(covered[m.index], `${g.slug}: "${text.slice(Math.max(0, m.index - 30), m.index + 12)}" is not a checked fact`);
    }
  });

  it('a fact that drifts from the game is caught (the guide says 70 minutes, the garden says 72)', { skip }, () => {
    const g = GUIDES[0];
    const step = g.parts[1].steps;
    const was = step[2];
    step[2] = was.replace('72 minutes', '70 minutes');
    try {
      assert.ok(checkGuides(d).some((f) => f.slug === g.slug && f.say === '72 minutes'));
    } finally { step[2] = was; }
    assert.deepEqual(checkGuides(d), []);
  });

  it('the encyclopedia builder is current (node tools/encyclopedia/build.mjs --check)', { skip }, () => {
    const run = spawnSync(process.execPath, [join(spike, 'tools/encyclopedia/build.mjs'), '--check'], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr || run.stdout);
  });
});

describe('#668 How do I… search', () => {
  const keyOf = (h) => `${h.e.s}:${h.e.id}`;
  it('each guide is a search entry, in its own section listed first', () => {
    assert.equal(data.sections[0].key, 'how');
    for (const g of GUIDES) assert.ok(data.entries.some((e) => e.s === 'how' && e.id === g.slug && e.n === g.question && e.h === `${HOW_PATH}${g.slug}/`), g.slug);
    assert.ok(data.facts.how, 'the guides have facts');
  });

  it('a query that holds a guide\'s question words brings that guide first', () => {
    const samples = {
      'community-gardens': ['community garden', 'where gardens'],
      'get-visitors': ['visitors'],
      'wine-of-the-dead': ['wine of the dead'],
      'house-floors': ['add a floor', 'move door'],
      'learning-time': ['skill slow', 'learning takes long'],
      'find-things': ['find a resource', 'where animals'],
    };
    for (const g of GUIDES) {
      for (const q of new Set([...samples[g.slug], ...g.queries])) {
        const { hits } = search(index, q);
        assert.equal(keyOf(hits[0] || { e: {} }), `how:${g.slug}`, `"${q}" brings ${hits[0] ? keyOf(hits[0]) : 'nothing'} first`);
      }
    }
  });

  it('the guide comes first, and the rest keep their order: the garden list next, the Wine of the Dead item next', () => {
    assert.deepEqual(search(index, 'community garden').hits.slice(0, 2).map(keyOf), ['how:community-gardens', 'lists:community-garden']);
    assert.deepEqual(search(index, 'wine of the dead').hits.slice(0, 2).map(keyOf), ['how:wine-of-the-dead', 'items:wine_of_the_dead']);
    // A query that is not a guide's question keeps its own first result.
    assert.equal(keyOf(search(index, 'salmon').hits[0]), 'animals:npc_salmon');
    assert.equal(keyOf(search(index, 'metal rock').hits[0]), 'lists:metal-rock');
    assert.equal(keyOf(search(index, 'hoe').hits[0]), 'items:hoe');
  });

  it('a guide found by a fact (not its question) ranks with the rest, and says why', () => {
    const found = search(index, 'watering can plot').hits.find((h) => keyOf(h) === 'how:community-gardens');
    assert.ok(found && /Watering Can/.test(found.why), 'the garden guide is found by its step, with that step shown');
  });
});
