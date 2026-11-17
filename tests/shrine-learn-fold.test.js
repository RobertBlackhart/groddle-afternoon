/**
 * #377 (Austin 2026-11-15): the shrine's Learn Faster? box folds. Closed it is one line, its title and
 * the favor it would spend; closed by default on a phone (room for the items), open on a desktop, and
 * the player's choice holds for the session.
 * Browser check (WebKit 402 x 660 and 1280 x 800, Ferncaster End with &shrinedemo=1&shrinefavor=250):
 * the phone opens it closed (34 px, "Not learning a skill"), the desktop open; a toggle is kept on reopening.
 * Run: node --test tests/shrine-learn-fold.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { learnFasterOpen, learnFasterSummary } from '../public/js/shrines.js?v=2ebaf1e5';
import { LEARN_FASTER_OPEN_KEY, loadLearnFasterOpen, saveLearnFasterOpen } from '../public/js/ui/learn-faster-pref.js?v=08249a09';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

describe('#377 the Learn Faster fold', () => {
  it('opens on a desktop, closes on a phone, and the session choice wins', () => {
    assert.equal(learnFasterOpen({ phone: false }), true);
    assert.equal(learnFasterOpen({ phone: true }), false);
    assert.equal(learnFasterOpen({ phone: true, stored: '1' }), true);
    assert.equal(learnFasterOpen({ phone: false, stored: '0' }), false);
    assert.equal(learnFasterOpen(), true);
  });

  it('sums up the favor it would spend, or why not, in a few words', () => {
    assert.equal(learnFasterSummary({ ok: true, spendPoints: 250 }), 'Spend 250 favor');
    assert.equal(learnFasterSummary({ ok: false, reason: 'not_learning' }), 'Not learning a skill');
    assert.equal(learnFasterSummary({ ok: false, reason: 'no_favor' }), 'No favor yet');
    assert.equal(learnFasterSummary({ ok: false, reason: 'max_acceleration' }), 'Learning at full speed');
    assert.equal(learnFasterSummary({ ok: false, reason: 'unknown_giant' }), "Can't spend now");
  });

  it('keeps the choice for the session, and a storage that throws forgets it', () => {
    const mem = new Map();
    const tab = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v) };
    assert.equal(loadLearnFasterOpen(tab), null);
    saveLearnFasterOpen(false, tab);
    assert.equal(mem.get(LEARN_FASTER_OPEN_KEY), '0');
    assert.equal(loadLearnFasterOpen(tab), '0');
    const broken = { getItem() { throw new Error('private'); }, setItem() { throw new Error('private'); } };
    assert.equal(loadLearnFasterOpen(broken), null);
    assert.doesNotThrow(() => saveLearnFasterOpen(true, broken));
  });

  it('the shrine panel draws the toggle and keeps the choice through js/ui/learn-faster-pref.js', () => {
    const game = readFileSync(join(PUBLIC, 'game.js'), 'utf8');
    const fn = game.slice(game.indexOf('function renderShrineLearnFaster('), game.indexOf('function confirmShrineFavorSpend('));
    assert.match(fn, /learnFasterOpen\(\{ stored: loadLearnFasterOpen\(\), phone: TOUCH_PHONE \}\)/);
    assert.match(fn, /saveLearnFasterOpen\(next\);/);
    assert.match(fn, /data-shrine-learn-toggle/);
    assert.match(fn, /aria-expanded="\$\{open\}"/);
    assert.equal(LEARN_FASTER_OPEN_KEY, 'groddle.shrine.learnFasterOpen');
    const css = readFileSync(join(PUBLIC, 'style.css'), 'utf8');
    assert.match(css, /\.shrine-learn\[data-collapsed\] > :not\(\.shrine-learn-head\) \{ display: none; \}/);
    assert.match(css, /\.shrine-learn:not\(\[data-collapsed\]\) \.shrine-learn-sum \{ display: none; \}/);
  });
});
