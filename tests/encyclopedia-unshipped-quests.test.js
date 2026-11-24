/**
 * Quests Tiny Speck never shipped, in the encyclopedia (Austin 2026-11-23: "What if we fully add all of
 * the quests in code that never shipped into the Encyclopedia"; tools/encyclopedia/unshipped-quests.mjs):
 *  - every GSJS quest file has a quest page, or a recorded reason it has none (a test stub or a
 *    file that is not a quest: NO_PAGE; a street-project job: the Feats and street projects section);
 *  - each unshipped quest's page carries its chip (Never finished by Tiny Speck, Retired by Tiny Speck
 *    in <year>, Staff only), says plainly it isn't playable or isn't planned, and a never finished one
 *    links the Ideas board;
 *  - A Holiday Thing, built in the Glitchmas season, shows as in the remake;
 *  - the quests list filters by these statuses (chips) and lists each one (By status, without script);
 *  - reference material is words only: no picture on these pages but the shared quest book.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CAMERA_LINE, NO_PAGE, UNSHIPPED_QUESTS, unshippedChip } from '../tools/encyclopedia/unshipped-quests.mjs';
import { GSJS } from '../tools/catalog/build.mjs';

const pub = join(import.meta.dirname, '..', 'public');
const questsDir = join(pub, 'encyclopedia', 'quests');
const quests = JSON.parse(readFileSync(join(pub, 'assets', 'content', 'quests.json'), 'utf8'));
const page = (id) => readFileSync(join(questsDir, id, 'index.html'), 'utf8');
const gsjsQuests = join(GSJS, 'quests');
const skipWithoutGsjs = existsSync(gsjsQuests) ? false : `needs GSJS at ${gsjsQuests}`;
const plain = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

describe('quests Tiny Speck never shipped', () => {
  it('every GSJS quest has a page or a recorded reason it has none', { skip: skipWithoutGsjs }, () => {
    const missing = [];
    for (const id of readdirSync(gsjsQuests).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3))) {
      if (existsSync(join(questsDir, id, 'index.html'))) {
        assert.ok(!NO_PAGE[id], `${id} has a page and a reason it has none`);
        continue;
      }
      if (NO_PAGE[id] || quests[id]?.isJob) continue;
      missing.push(id);
    }
    assert.deepEqual(missing, [], 'GSJS quests with no page and no reason');
  });

  it('gives every unshipped quest a page with its status, chip and what it means for players', () => {
    const counts = {};
    for (const [id, u] of Object.entries(UNSHIPPED_QUESTS)) {
      counts[u.status] = (counts[u.status] || 0) + 1;
      const html = page(id);
      assert.match(html, new RegExp(`<span class="pill st-${u.status}">`), id);
      const chip = unshippedChip(u);
      if (u.status !== 'source') {
        assert.ok(chip, `${id}: a chip`);
        assert.ok(html.includes(`<span class="pill st-${u.status}">${chip}</span>`), `${id}: chip ${chip}`);
        assert.match(plain(html), /isn’t (playable|planned)/, `${id}: says it isn't playable or planned`);
        assert.ok(html.includes('aria-labelledby="unshipped-h"'), `${id}: Not in Groddle band`);
      }
      // GSJS's own words are on the page: the title and the description.
      assert.ok(html.includes('<h1>'), id);
      assert.ok(!/—/.test(plain(html.slice(html.indexOf('<main>'), html.indexOf('In Tiny Speck’s words')))), `${id}: an em dash in our words`);
      // Words only: no picture beyond the shared quest book.
      for (const [, src] of html.slice(html.indexOf('<main>'), html.indexOf('</main>')).matchAll(/<img [^>]*src="([^"]+)"/g)) assert.match(src, /^(\.\.\/){3}assets\//, `${id}: ${src}`);
      if (u.ask) assert.match(html, /<a [^>]*href="(\.\.\/){3}chat\/ideas\/"[^>]*>[\s\S]*?Tell us on the Ideas board/, `${id}: Ideas board link`);
      else assert.ok(!html.includes('chat/ideas/'), `${id}: no ask link`);
    }
    // 19 never finished (the 7 camera quests, 11 more, and Mendel's Apprentice, whose count nothing
    // ever adds to); 4 retired; 1 staff only (Tickle Me Emo); A Holiday Thing built.
    assert.deepEqual(counts, { unbuilt_original: 19, retired_original: 4, staff_only: 1, source: 1 });
    assert.equal(CAMERA_LINE.length, 7);
  });

  it('chips read as the brief asks', () => {
    assert.ok(page('say_cheese').includes('>Never finished by Tiny Speck</span>'));
    assert.ok(page('learn_first_skill').includes('>Retired by Tiny Speck in 2012</span>'));
    assert.ok(page('zero_mood').includes('>Staff only</span>'));
    // Half written: no steps, and it says so.
    assert.match(page('say_cheese'), /Tiny Speck never wrote its steps\./);
    assert.match(plain(page('you_croaked')), /survives in words only/);
  });

  it('shows A Holiday Thing as in the remake, in the Glitchmas season', () => {
    const html = page('glitchmas2010');
    assert.match(html, /<span class="pill st-source">In the remake<\/span>/);
    assert.match(plain(html), /during the Glitchmas season/);
    assert.ok(!html.includes('unshipped-h'));
  });

  it('lets the quests list be browsed by these statuses', () => {
    const html = readFileSync(join(questsDir, 'index.html'), 'utf8');
    for (const st of ['unbuilt_original', 'retired_original', 'staff_only']) {
      assert.match(html, new RegExp(`<a class="chip" href="#st-${st}" data-st="${st}">`), st);
      assert.match(html, new RegExp(`<h3 id="st-${st}">`), st);
    }
    // Every tile carries its status for the chips' filter (public/encyclopedia/encyclopedia.js).
    const tiles = [...html.matchAll(/<li data-name="[^"]*" data-status="([a-z_]+)">/g)];
    assert.equal(tiles.length, readdirSync(questsDir, { withFileTypes: true }).filter((x) => x.isDirectory()).length);
    assert.ok(html.includes('<a href="say_cheese/">Say Cheese</a>'));
  });
});
