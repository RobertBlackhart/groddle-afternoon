/**
 * G1169 / G1170: street decos whose old Children of Ur PNG export lost the SWF's bitmap fill (wood
 * grain, bark, stone) and drew as flat colour now ship FFDec's raster render of Tiny Speck's CC0
 * SWF (tools/deco-pipeline/build.py SWF_WINS), at the old PNG's size so placements do not move.
 * - bottletree_burb_wndw_1 (the bottletree hut with two windows and a face, 33 Firebog streets) was
 *   a flat orange blob; the 2012 street templates show wood grain.
 * - legs_front_1_small (the Peatland Moors foreground leg) was a flat olive pipe 188x264 stretched
 *   4.4x; the template shows dark spotted bark, and sharp.py now ships a copy sized for it.
 * - column1, column3, column_plain (Firebog root columns: flat brown, flat red), adobe_2_short,
 *   archway_x_middleplus and door_asset_gray (Abbasid stone): the same loss.
 * - bottletree_body3 (131 placements): the export is yellow with spots; the SWF and the template of
 *   Shimla Mirch Herb Gardens draw it brown.
 * Pixels come from `dwebp -pam`; the pixel checks skip where it is not installed.
 * Run: node --test tests/deco-bitmap-fill.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decoDir = join(root, 'public/assets/decos/groddle');
const srcDir = join(root, 'assets-src/decos/groddle');
const rows = new Map(JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan.json'), 'utf8')).decos.map((r) => [r.name, r]));
const sharpRows = new Map(JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan-sharp.json'), 'utf8')).decos.map((r) => [r.name, r]));

const FIXED = ['bottletree_burb_wndw_1', 'legs_front_1_small', 'column1', 'column3', 'column_plain', 'adobe_2_short', 'archway_x_middleplus', 'door_asset_gray'];

let dwebp = true;
try { execFileSync('dwebp', ['-version'], { stdio: 'ignore' }); } catch { dwebp = false; }

/** RGBA pixels of a WebP via dwebp's PAM output. */
function pixels(file) {
  const b = execFileSync('dwebp', ['-quiet', '-pam', file, '-o', '-'], { maxBuffer: 1 << 28 });
  const head = b.toString('latin1', 0, 200);
  const end = head.indexOf('ENDHDR\n') + 'ENDHDR\n'.length;
  const w = Number(/WIDTH (\d+)/.exec(head)[1]);
  const h = Number(/HEIGHT (\d+)/.exec(head)[1]);
  return { w, h, d: b.subarray(end) };
}

/**
 * Over fully opaque pixels: mean RGB, and the share of horizontal neighbour steps in luminance of
 * 2 to 40 (texture; a flat fill steps 0-1, outlines step more).
 */
function measure(file) {
  const { w, h, d } = pixels(file);
  let n = 0, r = 0, g = 0, bl = 0, steps = 0, tex = 0;
  const lum = (i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] !== 255) continue;
      n++; r += d[i]; g += d[i + 1]; bl += d[i + 2];
      if (x + 1 < w && d[i + 7] === 255) {
        const s = Math.abs(lum(i + 4) - lum(i));
        steps++;
        if (s >= 2 && s <= 40) tex++;
      }
    }
  }
  return { rgb: [r / n, g / n, bl / n], texture: tex / steps };
}

describe('G1169: decos that lost a bitmap fill ship the SWF render', () => {
  it('each is rendered from its CC0 bundle SWF at the old PNG size', () => {
    for (const name of FIXED) {
      const r = rows.get(name);
      assert.ok(r, name);
      assert.equal(r.mode, 'swf', `${name} mode`);
      assert.match(r.reason, /^corrected: the old PNG lost the .* bitmap fill/, name);
      assert.match(r.swf, /^bundle:(firebog|abbasid1)\.swf#/, name);
      const b = readFileSync(join(srcDir, `${name}.png`));
      assert.deepEqual(r.size2, [b.readUInt32BE(16), b.readUInt32BE(20)], `${name} keeps the PNG size`);
    }
  });

  it('the shipped art has texture where the old export was flat', { skip: !dwebp && 'needs dwebp' }, () => {
    // Floors sit well above each old file's share (bottletree_burb_wndw_1 0.009, column1 0.007,
    // adobe_2_short 0.015, door_asset_gray 0.034) and under the SWF render's.
    const floor = { bottletree_burb_wndw_1: 0.025, column1: 0.04, column3: 0.055, adobe_2_short: 0.1, archway_x_middleplus: 0.15, door_asset_gray: 0.1 };
    for (const [name, min] of Object.entries(floor)) {
      const m = measure(join(decoDir, `${name}.webp`));
      assert.ok(m.texture >= min, `${name} texture ${m.texture.toFixed(3)} < ${min}`);
    }
  });

  it('the Firebog columns are brown wood, not flat red', { skip: !dwebp && 'needs dwebp' }, () => {
    for (const name of ['column1', 'column3', 'column_plain']) {
      const { rgb: [r, g] } = measure(join(decoDir, `${name}.webp`));
      assert.ok(r - g < 40 && g > 20, `${name} rgb ${r.toFixed(0)},${g.toFixed(0)}`);
    }
  });
});

describe('G1169: bottletree_body3 is brown wood, not the yellow export', () => {
  it('ships the SWF render', () => {
    const r = rows.get('bottletree_body3');
    assert.equal(r.mode, 'swf');
    assert.match(r.reason, /^corrected: /);
  });

  it('is brown', { skip: !dwebp && 'needs dwebp' }, () => {
    // Old export: mean 123,81,7 (yellow); the SWF: about 106,62,17.
    const { rgb: [r, g, b] } = measure(join(decoDir, 'bottletree_body3.webp'));
    assert.ok(r < 115 && g < 72 && b > 10, `rgb ${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)}`);
  });
});

describe('G1170: the Peatland Moors foreground bottletree leg', () => {
  it('is dark spotted bark, not the olive export', { skip: !dwebp && 'needs dwebp' }, () => {
    // Old export: mean 97,74,28; the SWF's bark: about 69,49,18.
    const { rgb: [r, g] } = measure(join(decoDir, 'legs_front_1_small.webp'));
    assert.ok(r < 85 && g < 62, `rgb ${r.toFixed(0)},${g.toFixed(0)}`);
  });

  it('has a sharp copy with 3 texels per view px where Peatland Moors draws it', () => {
    const street = JSON.parse(readFileSync(join(root, 'public/assets/streets/GLICF642CTI16R1.json'), 'utf8'));
    const fg = street.layers.find((l) => l.name === 'foreground');
    const leg = fg.decos.find((d) => d.sprite === 'legs_front_1_small');
    assert.ok(leg, 'placed on the foreground');
    const s = sharpRows.get('legs_front_1_small');
    assert.equal(s.kind, 'webp');
    const file = join(decoDir, `legs_front_1_small@${s.res}x.webp`);
    assert.ok(existsSync(file), file);
    assert.ok((s.size[0] / Math.abs(leg.w)) >= 2.9, `${s.size[0]} texels over ${leg.w} view px`);
  });
});
