/**
 * Report #337 (G759, Semsan Simile): a street whose narrowest layer is narrower than
 * the window drew magnified to fill it (1.76 times on a 1687 px window), so the avatar looked twice
 * its size. Austin's call (2026-11-15): actual size with plain borders at the sides. A street keeps
 * the scale any other street gets in that window; the view stops at the street's width and the
 * canvas is that much narrower, centred (js/location-view.js computerStage, game.js stageArgs
 * sceneBorders, style.css NARROW STREETS). Phones keep filling the screen.
 * Run: node --test tests/narrow-street-borders.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOCATION_VIEW_W, MIN_PACK_HEIGHT, sceneViewWidthCap, stageFor } from '../public/js/location-view.js?v=10371e26';

const here = dirname(fileURLToPath(import.meta.url));
const semsan = JSON.parse(readFileSync(join(here, '../public/assets/streets/GCR105E77812AEF.json'), 'utf8'));
const WORLD_W = semsan.bounds.r - semsan.bounds.l;
const cap = sceneViewWidthCap({ worldW: WORLD_W, street: semsan }, WORLD_W);
// A plain wide street for the same window: what "the same scale as other streets" means.
const wide = (w, h, extra = {}) => stageFor({ width: w, height: h, packReserve: MIN_PACK_HEIGHT, sceneWidth: 6000, sceneHeight: 1000, sceneBorders: true, ...extra });
const narrow = (w, h, extra = {}) => stageFor({ width: w, height: h, packReserve: MIN_PACK_HEIGHT, sceneWidth: cap, sceneHeight: 2240, sceneBorders: true, ...extra });

describe('report #337: Semsan Simile at actual size between borders', () => {
  it('its far layer (960 wide) caps the view', () => {
    assert.equal(semsan.label, 'Semsan Simile');
    assert.equal(WORLD_W, 1200);
    assert.equal(cap, 960);
  });

  for (const [w, h] of [[1687, 966 - 52], [1280, 800 - 52], [2560, 1400]]) {
    it(`${w} x ${h}: the scale of a wide street, a ${LOCATION_VIEW_W} px view, the canvas centred narrower`, () => {
      const n = narrow(w, h);
      const o = wide(w, h);
      assert.ok(Math.abs(n.scale - o.scale) < 1e-9, `scale ${n.scale} vs ${o.scale}`);
      assert.equal(n.viewW, cap);
      assert.equal(n.bordered, true);
      assert.ok(Math.abs(n.cssWidth - cap * n.scale) < 1e-6);
      assert.ok(n.cssWidth < w);
      assert.equal(n.viewH, o.viewH, 'the same height of world');
      // Before: magnified until the 960 view filled the window.
      const before = narrow(w, h, { sceneBorders: false });
      assert.ok(before.scale > n.scale * 1.2, `before ${before.scale}`);
      assert.equal(before.cssWidth, w);
    });
  }

  it('a window no wider than the street draws as before, no borders', () => {
    const n = narrow(960, 700);
    assert.equal(n.bordered, undefined);
    assert.equal(n.cssWidth, 960);
    assert.deepEqual(n, narrow(960, 700, { sceneBorders: false }));
  });

  it('the Original zoom still magnifies, borders only where the street ends', () => {
    const n = narrow(1687, 914, { zoom: 1 });
    assert.ok(n.scale > narrow(1687, 914).scale);
    assert.ok(n.viewW <= cap);
  });

  it('phones are unchanged, upright and sideways', () => {
    for (const [w, h] of [[402, 660], [874, 402]]) {
      const n = narrow(w, h, { phone: true });
      assert.deepEqual(n, narrow(w, h, { phone: true, sceneBorders: false }), `${w} x ${h}`);
      assert.equal(n.bordered, undefined);
    }
  });

  it('game.js asks for borders on streets only, and sizes the canvas from the stage', () => {
    const game = readFileSync(join(here, '../public/game.js'), 'utf8');
    assert.match(game, /sceneBorders: Array\.isArray\(bgLayer\?\.street\?\.layers\),/);
    assert.match(game, /if \(stage\.bordered\) \{\s+root\.style\.setProperty\('--stage-w', `\$\{stage\.cssWidth\.toFixed\(2\)\}px`\);\s+root\.dataset\.stageBordered = '1';/);
    const css = readFileSync(join(here, '../public/style.css'), 'utf8');
    assert.match(css, /#game-root\[data-stage-bordered\] > canvas\[role="application"\] \{\s+width: var\(--stage-w, 100%\) !important;\s+margin-inline: auto;/);
  });
});
