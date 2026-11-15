/**
 * #346 (a phone held sideways): the Social drawer opened about 276 px tall (it stopped above the pack
 * row) and its head rows (title, who's here, tabs, the view's chips) left room for one or two chat
 * lines. Sideways (style.css PHONE SIDEWAYS 3) it runs to the foot of the screen and the who's-here
 * row shares the close arrow's row, the title stepping aside (still read aloud).
 * Browser check (WebKit 874 x 402, two zz-smoke players on groddle.localhost): the drawer 276 -> 344 px,
 * its chat log 42 -> 177 px, 2 -> 6 lines in view; solo Activity keeps its title; upright and on a
 * computer nothing changes (the rules are for a touch phone under 500 px tall, sideways).
 * Run: node --test tests/phone-social-sideways.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(import.meta.dirname, '../public/style.css'), 'utf8');
const start = css.indexOf('/* === PHONE SIDEWAYS 3 (phone2');
const end = css.indexOf('/* === end PHONE SIDEWAYS 3 === */');
const block = css.slice(start, end);
const rule = (sel) => {
  const i = block.indexOf(`${sel} {`);
  assert.ok(i >= 0, sel);
  return block.slice(i, block.indexOf('}', i));
};
const P = ':root.touch-phone[data-ui="modern"] .social-drawer';

describe('the Social drawer held sideways', () => {
  it('is one block, after chk6\'s sideways block, for a sideways phone only', () => {
    assert.ok(start > css.indexOf('/* === end PHONE SIDEWAYS 2 === */') && end > start);
    assert.match(block, /@media \(max-height: 500px\) and \(orientation: landscape\) \{/);
  });
  it('runs to the foot of the screen (not while the keyboard is up: that rule fills the box above it)', () => {
    const r = rule(':root.touch-phone:not(.kbd-up)[data-ui="modern"] #game-root .local-chat-dock.social-drawer.is-open');
    assert.match(r, /height: calc\(100% - var\(--social-top, 8px\) - var\(--safe-b\) \/ 2 - var\(--sp-2\)\);/);
    assert.match(r, /max-height: none;/);
  });
  it('puts who is here beside the close arrow and keeps the log the room that is left', () => {
    assert.match(rule(`${P} .social-body`), /grid-template-rows: auto auto minmax\(0, 1fr\) auto;/);
    assert.match(rule(`${P} .social-status`), /grid-area: 1 \/ 1 \/ 2 \/ 2;/);
    assert.match(rule(`${P} .social-head`), /grid-area: 1 \/ 2 \/ 2 \/ 3;/);
    assert.match(rule(`${P} .social-view`), /grid-area: 3 \/ 1 \/ 4 \/ 3;/);
    // The title is only set aside when the who's-here row is there (solo shows "Activity").
    assert.match(rule(`${P} .social-body:has(> .social-status:not([hidden])) .social-title`), /clip-path: inset\(50%\)/);
    assert.match(rule(`${P} .social-body:not(:has(> .social-status:not([hidden]))) .social-head`), /grid-column: 1 \/ 3;/);
  });
});
