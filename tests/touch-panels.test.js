/**
 * TOUCH PANELS: on a phone every sheet's close button is a 44 px target and no window is wider
 * than the screen (Austin 2026-11-12, iPhone).
 * Run: node --test tests/touch-panels.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'public/style.css'), 'utf8');
const html = readFileSync(join(root, 'public/play/index.html'), 'utf8');
const block = css.slice(css.indexOf('/* —— TOUCH PANELS ——'), css.indexOf('/* —— end TOUCH PANELS —— */'));

describe('panels on a phone', () => {
  it('every close button the page names is 44 px or more', () => {
    const rule = block.match(/:root\.touch-phone\[data-ui="modern"\] :is\(([^)]*)\) \{\s*min-width: 44px; min-height: 44px;/);
    assert.ok(rule, 'the close rule');
    const covered = new Set(rule[1].split(',').map((s) => s.trim().replace(/^\./, '')));
    const named = [...html.matchAll(/<button[^>]*class="([^"]*)"[^>]*aria-label="(?:Close|Not right now)[^"]*"/g)].map((m) => m[1].split(/\s+/));
    assert.ok(named.length >= 15);
    for (const classes of named) assert.ok(classes.some((c) => covered.has(c)), classes.join(' '));
  });
  it('no window wider than the screen', () => {
    assert.match(block, /:is\(\.glitch-modal-card, \.side-card, \.ui-sheet, \[role="dialog"\]\) \{ box-sizing: border-box; \}/);
    assert.match(block, /:is\(\.glitch-modal-card, \.side-card, \.ui-sheet, \[role="dialog"\]\):not\([^)]*\) \{ max-width: calc\(100vw - 8px\); \}/);
  });
  // G924 (#451): full-screen layers (inset 0 scrims, stage-sized screens) reach both edges; the cap is for cards.
  it('full-screen layers are not capped', () => {
    const not = block.match(/\[role="dialog"\]\):not\(([^)]*)\) \{ max-width: calc\(100vw - 8px\); \}/);
    assert.ok(not, 'the cap names what it leaves out');
    const left = new Set(not[1].split(',').map((s) => s.trim()));
    for (const c of ['.ui-sheet-center', '.award-screen', '.new-day-screen', '.hog-haul-screen', '.img-reveal', '.quest-dialogue', '.feed-picker', '.imagination-hub']) assert.ok(left.has(c), c);
    for (const c of ['.glitch-modal-card', '.side-card']) assert.ok(!left.has(c), c);
  });
});
