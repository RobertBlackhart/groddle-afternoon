/**
 * The Menu on a short screen (the mobile QA, 2026-11-12): its Settings (Zoom, night tint, the street
 * map) ran past the bottom and under the pack row, and it did not scroll. It stops above the pack
 * row and scrolls; on a phone its rows are 44 px.
 * Run: node --test tests/menu-short-screen.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'public/style.css'), 'utf8');

describe('the Menu on a short screen', () => {
  it('stops above the pack row and scrolls', () => {
    assert.match(css, /@media \(max-height: 760px\) \{\s*\[data-ui="modern"\] \.top-bar \.more-list \{\s*max-height: calc\(100dvh - var\(--hud-h\) - 16px - 80px\);\s*overflow-y: auto; overscroll-behavior: contain;/);
  });
  it('#378: a phone caps and scrolls the Menu at any height, upright too', () => {
    const at = css.indexOf(':root.touch-phone[data-ui="modern"] .top-bar .more-list {');
    assert.ok(at > 0, 'phone Menu rule');
    const rule = css.slice(at, css.indexOf('}', at));
    assert.match(rule, /max-height: calc\(100dvh - var\(--hud-h\) - 16px - 80px - var\(--safe-t\) - var\(--safe-b\)\);/);
    assert.match(rule, /overflow-y: auto;/);
    // Not inside a height media query: a Home Screen app upright is 874 px tall.
    const before = css.slice(0, at);
    assert.ok(before.lastIndexOf('@media') < before.lastIndexOf('}\n}'), 'outside any @media block');
  });
  it('a phone\'s rows are thumb targets', () => {
    assert.match(css, /:root\.touch-phone\[data-ui="modern"\] \.top-bar \.more-list \.chrome-btn \{ min-height: 44px; \}/);
  });
});
