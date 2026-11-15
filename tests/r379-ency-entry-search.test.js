/**
 * #379: every encyclopedia entry page has a search box in its header (tools/encyclopedia/parts.mjs
 * entrySearch), a plain form to the encyclopedia's home, whose search reads ?q=.
 * Browser check: a piggy and an apple page, "butterfly" + Enter, land on /encyclopedia/?q=butterfly with 23 matches.
 * Run: node --test tests/r379-ency-entry-search.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { entrySearch } from '../tools/encyclopedia/parts.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const page = (p) => readFileSync(join(ROOT, 'public/encyclopedia', p, 'index.html'), 'utf8');

describe('#379 a search box on every encyclopedia entry page', () => {
  it('is a GET form to the home with a q field', () => {
    const html = entrySearch('../../');
    assert.match(html, /<form class="ency-jump" action="\.\.\/\.\.\/" method="get" role="search">/);
    assert.match(html, /<input type="search" name="q" placeholder="Search the encyclopedia"/);
  });
  it('sits in the header of an item, an animal, a quest and a street page', () => {
    for (const p of ['items/apple', 'animals/npc_piggy', 'quests/animalkinship_nibble_meat', 'streets/hechey-track']) {
      const html = page(p);
      const head = html.slice(html.indexOf('<header class="masthead note-head cat-item-head">'), html.indexOf('</header>', html.indexOf('cat-item-head')));
      assert.match(head, /<form class="ency-jump" action="\.\.\/\.\.\/"/, p);
    }
  });
  it('the home reads ?q= into its search', () => {
    const js = readFileSync(join(ROOT, 'public/encyclopedia/encyclopedia.js'), 'utf8');
    assert.match(js, /input\.value = params\.get\('q'\) \|\| '';/);
    assert.match(readFileSync(join(ROOT, 'public/encyclopedia/items/catalog.css'), 'utf8'), /\.ency-entry-top \{/);
  });
});
