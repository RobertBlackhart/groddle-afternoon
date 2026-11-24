/**
 * Decoration Mode marks (Austin 2026-11-23: let owners tell what they set as decoration from what
 * anyone may pick up). Online at your own home, your own stacks carry a lock pip (on hover or tap,
 * all of them in Decoration Mode) and shared ones say "Anyone here can pick this up" in their menu
 * header; nowhere else is anything marked. Registered as an invention (home-stack-marks).
 * Run: node --test tests/home-stack-marks.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME_MARK_TEXT, HOME_PIP_PX, drawLockPip, homeMarkNote, homePipShown, homeStackMark, tokenColour } from '../public/js/home-stack-marks.js?v=0ff4c29f';

const ROOT = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

describe('home stack marks: the rules', () => {
  it('marks only at your own home: your own stacks decor, the server\'s shared', () => {
    assert.equal(homeStackMark({ ownHome: true, fromSave: true }), 'decor');
    assert.equal(homeStackMark({ ownHome: true, shared: true }), 'shared');
    assert.equal(homeStackMark({ ownHome: true }), '', 'a door key or other feature stack is not marked');
    assert.equal(homeStackMark({ ownHome: false, fromSave: true }), '', 'solo, a visit, a public street');
    assert.equal(homeStackMark({ ownHome: false, shared: true }), '');
    assert.equal(homeStackMark(), '');
  });

  it('the menu header lines, plain and short with no em dash', () => {
    assert.equal(homeMarkNote('shared'), 'Anyone here can pick this up');
    assert.match(homeMarkNote('decor'), /only you can pick this up/);
    assert.equal(homeMarkNote(''), '');
    for (const t of Object.values(HOME_MARK_TEXT)) assert.doesNotMatch(t, /—/);
  });

  it('the pip shows on decor only: in Decoration Mode always, else on hover or an open menu', () => {
    assert.equal(homePipShown('decor', {}), false, 'unobtrusive: hidden by default');
    assert.equal(homePipShown('decor', { hovered: true }), true);
    assert.equal(homePipShown('decor', { menuOpen: true }), true, 'a tap on a phone opens its menu');
    assert.equal(homePipShown('decor', { decorating: true }), true);
    assert.equal(homePipShown('shared', { decorating: true, hovered: true }), false, 'dropped things stay plain');
    assert.equal(homePipShown('', { decorating: true }), false);
  });

  it('the pip is a small disc in the tooltip tokens', () => {
    assert.ok(HOME_PIP_PX >= 10 && HOME_PIP_PX <= 16);
    assert.equal(tokenColour('--surface-tip', '#123456'), '#123456', 'off a page: the fallback');
    const calls = [];
    const chain = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, a]); return chain; } });
    class Container { constructor() { this.children = []; } addChild(c) { this.children.push(c); } }
    const pip = drawLockPip({ Container, Graphics: function Graphics() { return chain; } });
    assert.equal(pip.label, 'home-lock-pip');
    assert.equal(pip.eventMode, 'none', 'never takes a click from the stack');
    assert.ok(calls.some(([k, a]) => k === 'circle' && a[2] === HOME_PIP_PX / 2));
    const css = read('public/style.css');
    assert.match(css, /--surface-tip:/);
    assert.match(css, /--text-tip:/);
  });
});

describe('home stack marks: the wiring', () => {
  const game = read('public/game.js');
  const drops = read('public/js/features/drops-mp-feature.js');

  it('refreshDroppedWorldItems marks your own stacks and the shared ones only at your own home', () => {
    assert.match(game, /const ownHome = demo \|\| features\.query\('homeStackMarks', engine\) === true;/);
    assert.match(game, /spawnDroppedItemStack\(grown\?\.\[stack\.id\] \? \{ \.\.\.stack, count: stack\.count \+ grown\[stack\.id\] \} : stack, homeStackMark\(\{ ownHome, fromSave: !\(demo && i % 2\), shared: true \}\)\)/);
    // A shared stack being set on a shelf (drops-mp-feature claim, shown before the answer) is drawn locked, as decor.
    assert.match(game, /for \(const stack of sharedStacks\) spawnDroppedItemStack\(stack, homeStackMark\(\{ ownHome, fromSave: stack\.pendingDecor === true, shared: stack\.shared === true \}\)\);/);
    // The demo is solo QA only, at your own home.
    assert.match(game, /const demo = HOME_MARKS_DEMO && \(\(\{ inHome, owned \}\) => Boolean\(inHome && owned\)\)\(engine\.homeContext\(\)\);/);
  });

  it('a decor stack gets a hidden pip, the target its header line, and the pips follow hover, menu and Decoration Mode each frame', () => {
    assert.match(game, /if \(mark === 'decor'\) \{\s*spr\.homePip = drawLockPip\(PIXI\);\s*spr\.homePip\.visible = false;/);
    assert.match(game, /\.\.\.\(mark \? \{ homeMark: mark, homeNote: homeMarkNote\(mark\) \} : \{\}\)/);
    assert.match(game, /homePipShown\(spr\.homeMark, \{ decorating, hovered: hoverTarget\?\.sprite === spr, menuOpen: menuTarget\?\.sprite === spr \}\)/);
    assert.match(game, /const decorating = features\.query\('homeEditMode', engine\) === 'decorate';/);
    assert.match(game, /run\('home lock pips', updateHomeStackPips\);/);
    assert.match(game, /note\.textContent = level \? '' : target\.homeNote \|\| '';/);
  });

  it('drops-mp-feature says when you stand at your own home online', () => {
    assert.match(drops, /homeStackMarks\(engine\) \{\s*if \(!multiplayer \|\| !session \|\| engine\?\.mode !== 'multiplayer'\) return null;\s*const p = session\.here\(\);\s*return p\?\.ownHome === true && homePlaceOf\(p\.street\) != null \? true : null;/);
  });

  it('is registered as an invention', () => {
    const reg = JSON.parse(read('tools/inventions/inventions.json'));
    const e = reg.entries.find((x) => x.id === 'home-stack-marks');
    assert.ok(e, 'inventions.json home-stack-marks');
    assert.equal(e.kind, 'UI');
    assert.ok(e.where.some((w) => w.file === 'public/js/home-stack-marks.js'));
  });
});
