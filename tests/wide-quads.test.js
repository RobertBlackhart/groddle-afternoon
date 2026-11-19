/**
 * FLICKER (Switchback, 2026-11-19): long thin quads drawn as pieces the GPU always draws
 * (js/wide-quads.js). Run: node --test tests/wide-quads.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUAD_ASPECT_MAX, QUAD_SHORT, QUAD_SPAN, quadPieceLength, quadSpans, wideRect } from '../public/js/wide-quads.js?v=f34556e6';
import { MAX_RENDER_RESOLUTION } from '../public/js/render-density.js?v=74c6f5f9';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, '..', rel), 'utf8');

/** The shapes measured on the Intel GPU (render resolution 2.9): [w, h, dropped]. */
const MEASURED = [
  [6900, 88, true], [2900, 40, true], [2048, 20, true], [800, 8, true], [700, 3, true],
  [6900, 108, false], [4096, 64, false], [2048, 40, false], [3500, 80, false], [500, 2, false], [256, 1, false],
];

describe('wide quads (the bottom-right flicker on Switchback)', () => {
  it('cuts a quad into pieces no thinner than the shapes always drawn', () => {
    // The thinnest long shape always drawn (64:1); every dropped one was thinner and long.
    const thinnestDrawn = Math.max(...MEASURED.filter(([w, , d]) => !d && w > QUAD_SHORT * 2).map(([w, h]) => w / h));
    for (const [w, h, dropped] of MEASURED) if (dropped) assert.ok(w / h > thinnestDrawn && w > QUAD_SHORT * 2, `${w}x${h}`);
    assert.ok(QUAD_ASPECT_MAX <= thinnestDrawn / 2, 'half the thinnest shape always drawn');
    for (const [w, h, dropped] of MEASURED) {
      if (!dropped) continue;
      const pieces = quadSpans(0, w, h);
      assert.ok(pieces.length > 1, `${w}x${h} is cut`);
      for (const p of pieces) assert.ok(p.w / h <= QUAD_ASPECT_MAX || p.w <= QUAD_SHORT, `${w}x${h}: a ${p.w} px piece`);
    }
    // Short pieces run whatever their height: at the top resolution under the 1,450 device px drawn at 250:1.
    assert.ok(QUAD_SHORT * MAX_RENDER_RESOLUTION <= 1450);
    assert.equal(quadPieceLength(3), QUAD_SHORT);
    assert.equal(quadPieceLength(20), 640);
    assert.equal(quadPieceLength(88), 2048);
    assert.equal(quadPieceLength(1000), QUAD_SPAN);
  });

  it('lays the pieces edge to edge over the whole length', () => {
    const spans = quadSpans(-200, 6900, 88);
    assert.deepEqual(spans.map((s) => s.w), [2048, 2048, 2048, 756]);
    assert.equal(spans[0].x, -200);
    for (let i = 1; i < spans.length; i += 1) assert.equal(spans[i].x, spans[i - 1].x + spans[i - 1].w);
    assert.equal(spans.at(-1).x + spans.at(-1).w, 6700);
    assert.deepEqual(quadSpans(0, 0, 10), []);
    assert.deepEqual(quadSpans(0, 10.5, 1, 4), [{ x: 0, w: 4 }, { x: 4, w: 4 }, { x: 8, w: 2.5 }]);
    assert.deepEqual(quadSpans(5, 100, 2), [{ x: 5, w: 100 }], 'a short strip stays one quad');
  });

  it('fills a wide rect as its pieces, each with the same fill', () => {
    const calls = [];
    const g = { rect(x, y, w, h) { calls.push(['rect', x, y, w, h]); return this; }, fill(f) { calls.push(['fill', f]); return this; } };
    assert.equal(wideRect(g, -200, 10, 2300, 4, 0x5c9a2a), g);
    assert.deepEqual(calls.filter((c) => c[0] === 'rect').map((c) => c[3]), [256, 256, 256, 256, 256, 256, 256, 256, 252]);
    assert.ok(calls.every((c, i) => (i % 2 ? c[0] === 'fill' && c[1] === 0x5c9a2a : c[0] === 'rect' && c[2] === 10 && c[4] === 4)));
  });

  it('draws the long thin strips of the yard and Operation Grow in pieces', () => {
    for (const rel of ['public/js/rube-yard-scene.js', 'public/js/operation-grow-scene.js']) {
      const src = read(rel);
      assert.ok(!/\.rect\(-200, /.test(src), `${rel}: no street-wide plain rect`);
      assert.match(src, /import \{ wideRect \} from '\.\/wide-quads\.js/);
    }
    assert.equal((read('public/js/rube-yard-scene.js').match(/wideRect\(g, -200, /g) || []).length, 7);
    assert.equal((read('public/js/operation-grow-scene.js').match(/wideRect\(slab, -200, /g) || []).length, 3);
  });
});
