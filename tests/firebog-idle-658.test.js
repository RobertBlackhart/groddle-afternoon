/**
 * #658: the Firebog street spirits (the bog vendors, Shimla Mirch and the other Firebog hubs)
 * stood still. Their idle strips came from Tiny Speck's OGA sheets, whose recorder advanced only
 * the body (animated_mcs = ['corpus'], street_spirit_firebog.as) and left the flames and hanging
 * vines on frame 1, so all 24 cells were one picture. 2011-12 footage of a Firebog street
 * (reference-videos Eu6dojeQttM at 2:30) shows the flames flicker and the vines sway: the game drew
 * that spirit live. The idle is now the loop swf-record.mjs bakes with every nested clip on its own
 * clock (105 frames, every third kept), its 1x strip drawn from the render too (build.mjs render1x).
 * Run: node --test tests/firebog-idle-658.test.js   (pixel checks need dwebp)
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { STREET_SPIRIT_ART, spiritSheet } from '../public/js/street-spirits.js?v=f9e88445';

const PUB = new URL('../public/', import.meta.url);
let dwebp = true;
try { execFileSync('dwebp', ['-version'], { stdio: 'ignore' }); } catch { dwebp = false; }

/** RGBA pixels of a WebP (dwebp -pam). */
function pixels(path) {
  const b = execFileSync('dwebp', ['-quiet', '-pam', new URL(path, PUB).pathname, '-o', '-'], { maxBuffer: 1 << 28 });
  const head = b.toString('latin1', 0, 128);
  const w = Number(/WIDTH (\d+)/.exec(head)[1]);
  const h = Number(/HEIGHT (\d+)/.exec(head)[1]);
  const at = head.indexOf('ENDHDR\n') + 7;
  return { w, h, d: b.subarray(at) };
}

/** Share of a cell's pixels that differ between cells a and b by more than 32 of 255 in any channel (premultiplied: above lossy WebP noise; a still recorder cell differs by none). */
function change(img, fw, fh, cols, a, b) {
  let n = 0;
  const ax = (a % cols) * fw, ay = Math.floor(a / cols) * fh;
  const bx = (b % cols) * fw, by = Math.floor(b / cols) * fh;
  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const p = ((ay + y) * img.w + ax + x) * 4;
      const q = ((by + y) * img.w + bx + x) * 4;
      // Premultiplied: the colour under a clear pixel is anything at all in a lossy WebP.
      const ap = img.d[p + 3];
      const aq = img.d[q + 3];
      let off = Math.abs(ap - aq) > 32;
      for (let c = 0; c < 3 && !off; c++) off = Math.abs((img.d[p + c] * ap - img.d[q + c] * aq) / 255) > 32;
      if (off) n += 1;
    }
  }
  return n / (fw * fh);
}

const MOVES = 0.001;

describe('#658 Firebog street spirits move while idle', () => {
  it('the idle is the live loop: 105 frames, every third, at 10 frames a second', () => {
    const idle = STREET_SPIRIT_ART.firebog.states.idle;
    assert.equal(idle.live, 'idle_live');
    assert.equal(idle.frames, 105, 'the flames come round every 35 and 15 frames');
    for (const look of ['large', 'medium']) {
      const s = spiritSheet('firebog', look, 'idle');
      assert.equal(s.frames, 35);
      assert.equal(s.fps, 10);
    }
    const manifest = JSON.parse(readFileSync(new URL('../tools/vector-sprites/street-spirits.json', import.meta.url), 'utf8'));
    for (const name of ['street-spirit-firebog-large', 'street-spirit-firebog-medium']) {
      const job = manifest.jobs.find((j) => j.name === name);
      assert.deepEqual(job.record.live, [{ label: 'idle_move', as: 'idle_live', frames: 105 }]);
      const sheets = job.sheets.map((s) => s.path);
      const idle = job.sheets.find((s) => s.label === 'idle_live');
      assert.ok(sheets.indexOf(idle.render1x) < sheets.indexOf(idle.path), 'placed like a sheet built before it');
    }
  });

  for (const [look, fw, fh] of [['large', 94, 244], ['medium', 63, 189]]) {
    for (const density of [1, 3]) {
      const path = `assets/sprites/street-spirits/firebog_${look}_idle${density === 3 ? '@3x' : ''}.webp`;
      it(`${path}: the flames and vines move, and the loop comes round smoothly`, { skip: !dwebp && 'needs dwebp' }, () => {
        const img = pixels(path);
        const W = fw * density;
        const H = fh * density;
        const n = spiritSheet('firebog', look, 'idle').frames;
        const steps = [];
        let most = 0;
        for (let k = 1; k < n; k++) {
          most = Math.max(most, change(img, W, H, 8, 0, k));
          steps.push(change(img, W, H, 8, k - 1, k));
        }
        assert.ok(most > MOVES, `every idle cell matches cell 0 (most change ${(most * 100).toFixed(2)}%)`);
        const seam = change(img, W, H, 8, n - 1, 0);
        assert.ok(seam <= Math.max(...steps) * 1.5, `the loop jumps at its seam: ${(seam * 100).toFixed(2)}% against at most ${(Math.max(...steps) * 100).toFixed(2)}% between cells`);
      });
    }
  }

  it('the talk and cry strips stay the recorder\'s (only the idle is live)', () => {
    assert.equal(STREET_SPIRIT_ART.firebog.states.talk.live, undefined);
    for (const [variant, art] of Object.entries(STREET_SPIRIT_ART)) {
      if (variant === 'firebog') continue;
      for (const sheet of Object.values(art.states)) assert.equal(sheet.live, undefined, variant);
    }
  });
});
