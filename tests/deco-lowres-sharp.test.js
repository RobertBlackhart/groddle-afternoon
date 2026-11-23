/**
 * G1172: background decos the streets draw far larger than their files ship sharp.
 * - 18 decos whose old PNG is a small low-resolution export of the SWF's art (Jethimadh's beehive
 *   hills backhill1/2/3_green, drawn up to 15x; plant_fern_3 12.6x; plant_grass_3 7x; the Firebog
 *   bog willows) were kept as that PNG because the SWF render differed from it, so sharp.py had no
 *   source for them. They now ship FFDec's raster render of Tiny Speck's CC0 SWF
 *   (tools/deco-pipeline/build.py SWF_WINS) at the old PNG size, and sharp.py makes their copies.
 * - The bog willows' glows use the overlay blend, which FFDec draws as a black halo on its
 *   transparent canvas: build.py OVERLAY_AS_NORMAL draws them normal at half their alpha. The
 *   2012 Tuntsa Coze template has yellow and orange lights with a yellow glow; the old PNGs of
 *   _2 and _3 had green lights, and _1 (already from the SWF) had the black halo.
 * - Sealing FFDec's seams (G1162) took 49 decos off the sharp list: their seams had been their
 *   only steps at the 99th percentile. A deco a near placement draws at least `outline_ratio`
 *   times its file now also counts by its outline (99.9th percentile step); the 41 that had
 *   copies before (sharp.py SEALED_OUTLINE) count by it on far layers too, so the big flat rock
 *   walls, hills and wallpapers drawn far over their size have sharp copies again. Other far-only
 *   decos keep the edge rule, which keeps each street's far budget.
 * Pixels come from `dwebp -pam`; the pixel checks skip where it is not installed.
 * Run: node --test tests/deco-lowres-sharp.test.js
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
const plan = new Map(JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan.json'), 'utf8')).decos.map((r) => [r.name, r]));
const sharpPlan = JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan-sharp.json'), 'utf8'));
const sharp = new Map(sharpPlan.decos.map((r) => [r.name, r]));
const buildPy = readFileSync(join(root, 'tools/deco-pipeline/build.py'), 'utf8');

const LOWRES = ['backhill1_green', 'backhill2_green', 'backhill3_green', 'plant_fern_3', 'plant_fern_5', 'plant_grass_3',
  'puzzletube_off_tube_starter', 'miniparty_miner', 'mountain_flora_01d_al1', 'bling_mushroom_beech_1', 'window_stick',
  'graffiti_hell', 'ground_rootpipe1', 'tree_9_part1', 'snow_patch_1', 'crate_1', 'underground_bogwillow_2', 'underground_bogwillow_3'];
const BOGWILLOWS = ['underground_bogwillow_1', 'underground_bogwillow_2', 'underground_bogwillow_3'];
const RESEALED = ['ug_wall_heights', 'heights_face_1', 'wallpaper_tree_short_1', 'wallpaper_tree_short_2', 'jethimadh_frame_wall',
  'mound_dirt_4', 'heights_mound_2', 'heights_mound_3', 'cliff_cover_5', 'dirt_mountain_1'];

let dwebp = true;
try { execFileSync('dwebp', ['-version'], { stdio: 'ignore' }); } catch { dwebp = false; }

function pixels(file) {
  const b = execFileSync('dwebp', ['-quiet', '-pam', file, '-o', '-'], { maxBuffer: 1 << 28 });
  const head = b.toString('latin1', 0, 200);
  const end = head.indexOf('ENDHDR\n') + 'ENDHDR\n'.length;
  return { w: Number(/WIDTH (\d+)/.exec(head)[1]), h: Number(/HEIGHT (\d+)/.exec(head)[1]), d: b.subarray(end) };
}

/** Mean luminance of the half-transparent pixels (alpha 20-180: the glows), and mean G - R over opaque ones. */
function glow(file) {
  const { d } = pixels(file);
  let n = 0, lum = 0, m = 0, gr = 0;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    if (a >= 20 && a <= 180) { n++; lum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; }
    if (a === 255) { m++; gr += d[i + 1] - d[i]; }
  }
  return { halo: lum / n, greenness: gr / m };
}

describe('G1172: low-resolution exports give way to the SWF render', () => {
  it('each ships its CC0 bundle SWF render at the old PNG size', () => {
    for (const name of LOWRES) {
      const r = plan.get(name);
      assert.ok(r, name);
      assert.equal(r.mode, 'swf', `${name} mode`);
      assert.match(r.reason, /^(corrected: |swf$)/, name);
      assert.match(r.swf, /^bundle:\w+\.swf#/, name);
      assert.ok(buildPy.includes(`'${name}':`), `${name} in SWF_WINS`);
      const b = readFileSync(join(srcDir, `${name}.png`));
      assert.deepEqual(r.size2, [b.readUInt32BE(16), b.readUInt32BE(20)], `${name} keeps the PNG size`);
      assert.ok(r.seam <= 0.2, `${name} seams sealed (${r.seam})`);
    }
  });

  it('each has a sharp copy, no longer skipped for want of a source', () => {
    const skipped = new Set(sharpPlan.skipped.map((r) => r.name));
    for (const name of LOWRES) {
      const s = sharp.get(name);
      assert.ok(s, `${name} on the sharp list`);
      assert.ok(!skipped.has(name), `${name} not skipped`);
      const file = s.kind === 'svg' ? join(decoDir, `${name}.svg`) : join(decoDir, `${name}@${s.res}x.webp`);
      assert.ok(existsSync(file), file);
    }
  });

  it("Jethimadh's beehive hills get 3 texels per view px where Tuntsa Coze draws them", () => {
    const street = JSON.parse(readFileSync(join(root, 'public/assets/streets/GIFNH08K9OU1SAB.json'), 'utf8'));
    for (const l of street.layers) {
      for (const d of l.decos || []) {
        if (!/^backhill[123]_green$/.test(d.sprite)) continue;
        const s = sharp.get(d.sprite);
        if (s.kind === 'svg') continue; // rasterised at the need
        assert.ok(s.size[0] / Math.abs(d.w) >= 2.9 || s.size[1] / Math.abs(d.h) >= 2.9, `${d.sprite} ${s.size} for ${d.w}x${d.h}`);
      }
    }
  });
});

describe('G1172: the bog willows glow yellow, not black or green', () => {
  it('their overlay glows render normal at half alpha', () => {
    for (const name of BOGWILLOWS) {
      assert.equal(plan.get(name).overlay, 0.5, name);
      assert.ok(new RegExp(`'${name}': 0\\.5`).test(buildPy), `${name} in OVERLAY_AS_NORMAL`);
    }
  });

  it('the glows are bright and the lights are not green', { skip: !dwebp && 'needs dwebp' }, () => {
    // Before: _1's halo had a mean luminance of 17 (black); _2 and _3 opaque pixels averaged
    // G - R of 24 (green lights). Now about 170 and -1.
    for (const name of BOGWILLOWS) {
      const g = glow(join(decoDir, `${name}.webp`));
      assert.ok(g.halo > 100, `${name} halo luminance ${g.halo.toFixed(0)}`);
      assert.ok(g.greenness < 10, `${name} G - R ${g.greenness.toFixed(1)}`);
    }
  });
});

describe('G1172: decos drawn far over their size count by their outline', () => {
  it('sharp.py has the outline rule', () => {
    assert.equal(sharpPlan.settings.outline_ratio, 2);
  });

  it('the rock walls, hills and wallpapers seamk took off the list are back, sealed', () => {
    for (const name of RESEALED) {
      const s = sharp.get(name);
      assert.ok(s, `${name} on the sharp list`);
      assert.ok(s.ratio >= sharpPlan.settings.outline_ratio, `${name} ratio ${s.ratio}`);
      assert.ok(s.outline >= sharpPlan.settings.edge_min, `${name} outline ${s.outline}`);
      assert.ok(s.seam <= 0.2, `${name} seam ${s.seam}`);
    }
  });

  it("far-only decos keep the edge rule: Ilmenskie's distant hills stay within its far budget", () => {
    // bck_hill_13 (Ilmenskie, far only, edge 16, outline 177): an outline copy would take 18 MB of
    // the street's 96 MB far budget (tests/far-sharp-slack.test.js).
    const py = readFileSync(join(root, 'tools/deco-pipeline/sharp.py'), 'utf8');
    for (const name of ['bck_hill_13', 'bck_hill_9', 'hill_5', 'hill_8']) {
      assert.ok(!sharp.has(name), `${name} has no sharp copy`);
      assert.ok(!py.includes(`'${name}'`), `${name} not in SEALED_OUTLINE`);
    }
    for (const name of ['wallpaper_tree_short_1', 'wallpaper_tree_short_2', 'bck_hill_6', 'dirt_mountain_1']) {
      assert.ok(py.includes(`'${name}'`), `${name} in SEALED_OUTLINE`);
      assert.equal(sharp.get(name)?.s, 0, `${name} is far only`);
    }
  });

  it('soft decos stay off: no sharp row under edge_min on both scores', () => {
    const S = sharpPlan.settings;
    for (const s of sharpPlan.decos) {
      if (s.outline === undefined) continue;
      assert.ok(s.edge >= S.edge_min || s.outline >= S.edge_min, `${s.name} edge ${s.edge} outline ${s.outline}`);
    }
  });
});
