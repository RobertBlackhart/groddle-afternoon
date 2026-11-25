/**
 * G1173: Groddle Ladder's sky crack (skyCrack_01_masked) drew its white mask on top instead of the
 * starry night. The deco's own code masks one child with another (MainTimeline frame1:
 * masked.mask = topmask, both cacheAsBitmap: an alpha mask), so Flash drew the crack fading out
 * under a white gradient it never showed; FFDec's static render and SVG export draw the mask as art.
 * tools/deco-pipeline/build.py SCRIPT_MASKS renders the art and the mask apart and multiplies the
 * alphas, and sharp.py turns the SVG's mask child into an alpha <mask>. A sweep of every location
 * SWF's ABC for the mask property found this one deco; the streets place it once.
 * Run: node --test tests/deco-script-masks.test.js   (pixel checks need dwebp)
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
let dwebp = true;
try { execFileSync('dwebp', ['-version'], { stdio: 'ignore' }); } catch { dwebp = false; }

/** RGBA pixels of a WebP (dwebp -pam). */
function pixels(path) {
  const b = execFileSync('dwebp', ['-quiet', '-pam', new URL(path, ROOT).pathname, '-o', '-'], { maxBuffer: 1 << 28 });
  const head = b.toString('latin1', 0, 128);
  const w = Number(/WIDTH (\d+)/.exec(head)[1]);
  const h = Number(/HEIGHT (\d+)/.exec(head)[1]);
  return { w, h, d: b.subarray(head.indexOf('ENDHDR\n') + 7) };
}

const NAME = 'skyCrack_01_masked';

describe('decos masked by their own code (G1173)', () => {
  it('the build knows the deco and its two children, and the plan rows record it', () => {
    assert.match(read('tools/deco-pipeline/build.py'), /SCRIPT_MASKS = \{\n\s+'skyCrack_01_masked': \('masked', 'topmask'\),\n\}/);
    const row = read('tools/deco-pipeline/plan.json').split('\n').find((l) => l.startsWith(`{"name":"${NAME}"`));
    assert.ok(row && JSON.parse(row.replace(/,$/, '')).script_mask?.join() === 'masked,topmask', 'plan.json row');
  });

  it('the shipped SVG masks the crack with topmask and never draws topmask as art', () => {
    const svg = read(`public/assets/decos/groddle/${NAME}.svg`);
    const mask = /<mask id="([^"]+)"[^>]*mask-type:alpha[^>]*>(<use[^>]*id="topmask"[^>]*\/>)<\/mask>/.exec(svg);
    assert.ok(mask, 'topmask inside an alpha <mask>');
    assert.equal(svg.split('id="topmask"').length, 2, 'topmask only once, inside the mask');
    assert.match(svg, new RegExp(`<g mask="url\\(#${mask[1]}\\)"><use[^>]*id="masked"`));
  });

  it('the shipped WebPs show the starry crack at the top, not white, and fade out below', { skip: !dwebp && 'needs dwebp' }, () => {
    for (const file of [`${NAME}.webp`, `${NAME}@1.5x.webp`]) {
      const { w, h, d } = pixels(`public/assets/decos/groddle/${file}`);
      const k = w / 2090;
      let white = 0;
      let opaque = 0;
      for (let y = Math.round(20 * k); y < Math.round(200 * k); y += 3) {
        for (let x = Math.round(600 * k); x < Math.round(1400 * k); x += 3) {
          const i = (y * w + x) * 4;
          if (d[i + 3] < 200) continue;
          opaque += 1;
          if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) white += 1;
        }
      }
      assert.ok(opaque > 1000, `${file}: the crack's top is drawn`);
      assert.ok(white / opaque < 0.05, `${file}: ${Math.round((100 * white) / opaque)}% of the crack's top is the white mask`);
      // Below the mask's fade the crack is gone (the sky layer's skyCrack_01 behind it shows).
      // (Before: the crack drawn whole there, mean alpha 22 of 255.)
      let low = 0;
      let n = 0;
      for (let y = Math.round(900 * k); y < Math.min(h, Math.round(1200 * k)); y += 3) {
        for (let x = Math.round(200 * k); x < Math.round(1000 * k); x += 3) { low += d[(y * w + x) * 4 + 3]; n += 1; }
      }
      assert.ok(low / n < 1, `${file}: the lower crack fades out (mean alpha ${(low / n).toFixed(1)})`);
    }
  });

  it('every *_masked deco a street places is one the build masks', () => {
    const masked = new Set();
    for (const f of readdirSync(new URL('public/assets/streets/', ROOT))) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      for (const m of read(`public/assets/streets/${f}`).matchAll(/"sprite": ?"([^"]*_masked)"/g)) masked.add(m[1]);
    }
    assert.deepEqual([...masked].sort(), [NAME]);
  });
});
