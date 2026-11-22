// The project bubble's "!" is drawn as a shape (Austin 2026-11-22: it looked blurry stretched from
// the 5x19 quest_bubble_active.png at street zoom), same teal and outline, inside the icon's box.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JOB_BANG, JOB_INDICATOR_LOOK, drawJobBang } from '../public/js/job-indicator.js?v=e4a48327';

function recorder() {
  const calls = [];
  const g = new Proxy({}, { get: (_, k) => (...a) => { calls.push([k, ...a]); return g; } });
  return { g, calls };
}

describe('the project bubble "!"', () => {
  it('draws a bar and a dot in the picture teal, inside the 5 x 19 icon box', () => {
    const { g, calls } = recorder();
    assert.equal(drawJobBang(g), g);
    const fills = calls.filter((c) => c[0] === 'fill');
    assert.equal(fills.length, 2, 'the bar and the dot');
    for (const f of fills) assert.equal(f[1].color, 0x055c73);
    const xs = [];
    const ys = [];
    for (const [k, ...a] of calls) {
      if (k === 'moveTo' || k === 'lineTo') { xs.push(a[0]); ys.push(a[1]); }
      if (k === 'quadraticCurveTo') { xs.push(a[0], a[2]); ys.push(a[1], a[3]); }
      if (k === 'ellipse') { xs.push(a[0] - a[2], a[0] + a[2]); ys.push(a[1] - a[3], a[1] + a[3]); }
    }
    assert.ok(Math.min(...xs) >= 0 && Math.max(...xs) <= JOB_INDICATOR_LOOK.iconW);
    assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) <= JOB_INDICATOR_LOOK.iconH);
    assert.ok(JOB_BANG.bar.bottom < JOB_BANG.dot.y - JOB_BANG.dot.ry, 'a gap between bar and dot');
  });

  it('uses the shape, baked smooth, instead of stretching the picture', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../public/js/job-indicator.js', import.meta.url), 'utf8');
    assert.match(src, /drawJobBang\(new PIXI\.Graphics\(\)\)/);
    assert.match(src, /cacheAsTexture\(\{ resolution: 8, antialias: true \}\)/);
  });
});
