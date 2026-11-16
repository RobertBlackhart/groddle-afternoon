/**
 * #380b (Firefox, Arjun Plunge at its right end): the report's picture was only the street's sky.
 * There the street's layers are clipped at their ends (street-render's edge clip, a stencil mask), and
 * Firefox drew a masked layer into an off-screen target as nothing: Pixi gave the target its stencil only
 * when the first mask came, mid-draw. game.js stageCanvas gives the target its depth and stencil first.
 * Browser check (Firefox and Chrome, 1687x966, Wide zoom, the reported spot x 1476 y 595): the picture
 * went from 15 colours (sky only) to 373 in Firefox; Chrome 376, unchanged.
 * Run: node --test tests/r380-report-picture-masks.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const game = readFileSync(join(import.meta.dirname, '..', 'public/game.js'), 'utf8');

describe('#380b report pictures keep clipped layers', () => {
  it('stageCanvas makes its target\'s depth and stencil before drawing', () => {
    const fn = game.slice(game.indexOf('function stageCanvas('), game.indexOf('\n}\n', game.indexOf('function stageCanvas(')));
    // G844: through js/render-probe.js ensureDepthStencil (the same ensureDepthStencilTexture).
    const stencil = fn.indexOf('ensureDepthStencil(app.renderer, rt)');
    const draw = fn.indexOf('app.renderer.render({ container: app.stage, target: rt, clear: true, clearColor: [0, 0, 0, 0] })');
    assert.ok(stencil > 0 && draw > stencil, 'stencil first, then the draw');
    assert.match(fn, /out = app\.renderer\.extract\.canvas\(rt\);/);
    assert.match(fn, /rt\.destroy\(true\);/);
  });
  it('the report picture and the view snapshot both draw through it', () => {
    assert.match(game, /return stageCanvas\(VIEW_W, VIEW_H, resolution\);/);
    assert.match(game, /const shot = \(w, h\) => stageCanvas\(w, h, resolution\);/);
    assert.doesNotMatch(game, /extract\.canvas\(\{ target: app\.stage/);
  });
});
