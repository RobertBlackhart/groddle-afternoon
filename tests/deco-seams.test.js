/**
 * G1162 (#624): street decos drawn from Tiny Speck's vector art have no light hairlines inside.
 * FFDec exports every Flash colour region as its own anti-aliased path, so where two regions share
 * an edge the background showed through (Thornfad Layers' rock wall ug_wall_heights, Sapslow Tweeds'
 * tree_deciduous1, Groddle Forest Junction's wallpaper_tree_short_1/_2, mound_dirt_*, bush_1).
 * Flash drew a shared edge once and the art was solid. tools/deco-pipeline/build.py seals every
 * render (seal_seams) and sharp.py strokes every opaque SVG region with its own fill (seal_svg);
 * both record how much of the PNG's solid inside a shipped file leaves see-through (seam_gaps) and
 * their --check fails over seam_max.
 * Run: node --test tests/deco-seams.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { python311 } from './python311.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decoDir = join(root, 'public/assets/decos/groddle');
const plan = JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan.json'), 'utf8'));
const sharp = JSON.parse(readFileSync(join(root, 'tools/deco-pipeline/plan-sharp.json'), 'utf8'));
const seamMax = plan.settings.seam_max;
const REPORTED = ['ug_wall_heights', 'heights_face_1', 'tree_deciduous1', 'wallpaper_tree_short_1', 'wallpaper_tree_short_2', 'mound_dirt_1', 'bush_1'];
const python = python311;

describe('deco seams (G1162)', () => {
  it('every 2x/3x WebP rendered from a SWF was sealed and is as solid inside as its PNG', () => {
    assert.ok(seamMax > 0 && seamMax <= 0.5, `seam_max ${seamMax}`);
    assert.ok(plan.settings.seam_radius >= 1 && plan.settings.seam_radius_free >= 1);
    const swf = plan.decos.filter((r) => r.mode === 'swf');
    assert.ok(swf.length > 2500);
    for (const r of swf) {
      assert.equal(typeof r.seam, 'number', `${r.name}: no seam measure (built before G1162)`);
      assert.ok(r.seam <= seamMax, `${r.name}: ${r.seam}% see-through inside`);
    }
  });

  it('every sharp SVG and WebP is as solid inside as its PNG, and every SVG is sealed', () => {
    assert.ok(sharp.settings.seal_stroke > 0 && sharp.settings.seal_stroke <= 1);
    for (const r of sharp.decos) {
      assert.equal(typeof r.seam, 'number', `${r.name}: no seam measure`);
      assert.ok(r.seam <= seamMax, `${r.name}: ${r.seam}% see-through inside`);
    }
    for (const r of sharp.decos) {
      if (r.kind === 'svg') assert.equal(typeof r.sealed, 'boolean', r.name);
      else assert.equal(r.sealed, undefined, r.name);
    }
    for (const name of REPORTED) {
      const r = sharp.decos.find((x) => x.name === name);
      if (r?.kind !== 'svg') continue;
      // FFDec's export of these has the seams, so the shipped copy is the sealed one.
      assert.equal(r.sealed, true, name);
      const svg = readFileSync(join(decoDir, `${name}.svg`), 'utf8');
      // No opaque solid-colour region left without its own-colour stroke.
      assert.doesNotMatch(svg, /<path [^>]*fill="#[0-9a-f]{6}" fill-rule="evenodd" stroke="none"/, name);
      assert.match(svg, /stroke-linejoin="round" vector-effect="non-scaling-stroke"/, name);
    }
  });

  it('seal_seams closes a hairline between two regions, keeps the outer edge and a gap the PNG has', { skip: !existsSync(python) && 'needs python3.11' }, () => {
    const code = `
import sys, json
sys.path.insert(0, ${JSON.stringify(join(root, 'tools/deco-pipeline'))})
import build
import numpy as np
from PIL import Image
x = np.zeros((40, 60, 4), np.uint8)
x[5:35, 5:30] = (200, 50, 50, 255)
x[5:35, 30:55] = (50, 50, 200, 255)
# FFDec's shared edge: each side half covers the column, 1 - 0.5 * 0.5 opaque, light background between.
x[5:35, 30] = (120, 50, 130, 191)
# A real gap the PNG has: column 15 see-through in both.
x[5:35, 15, 3] = 0
ref = np.zeros((40, 60), np.uint8)
ref[5:35, 5:55] = 255
ref[5:35, 15] = 0
out, n = build.seal_seams(Image.fromarray(x, 'RGBA'), ref)
o = np.asarray(out)
src = Image.fromarray(np.dstack([x[..., :3], ref]), 'RGBA')
print(json.dumps(dict(n=n, seam=int(o[20, 30, 3]), gap=int(o[20, 15, 3]), edge=[int(o[20, 4, 3]), int(o[20, 55, 3]), int(o[4, 20, 3])],
    colour=o[20, 30, :3].tolist(), before=build.seam_gaps(Image.fromarray(x, 'RGBA'), src, None), after=build.seam_gaps(out, src, None))))
`;
    const r = JSON.parse(execFileSync(python, ['-I', '-c', code], { encoding: 'utf8' }));
    assert.equal(r.seam, 255, 'the hairline is solid');
    assert.equal(r.gap, 0, 'the PNG\'s own gap stays open');
    assert.deepEqual(r.edge, [0, 0, 0], 'outer edges not fattened');
    assert.ok(r.colour[0] > 60 && r.colour[2] > 60, `seam colour ${r.colour} mixes its neighbours`);
    assert.ok(r.before > 1 && r.after === 0, `seam_gaps ${r.before} -> ${r.after}`);
  });

  it('the reported decos\' shipped files measure solid inside (from the files)', { skip: !existsSync(python) && 'needs python3.11' }, () => {
    const code = `
import sys, json, os
sys.path.insert(0, ${JSON.stringify(join(root, 'tools/deco-pipeline'))})
import build
rows = {r['name']: r for r in build.read_plan()['decos'].values()}
out = {}
for n in ${JSON.stringify(REPORTED)}:
    src = build.load(build.src_png(n))
    out[n] = [build.seam_gaps(build.decode_webp(os.path.join(build.OUT, f)), src, rows[n].get('shift'))
              for f in (n + '.webp', n + '@1.5x.webp') if os.path.exists(os.path.join(build.OUT, f))]
print(json.dumps(out))
`;
    const r = JSON.parse(execFileSync(python, ['-I', '-c', code], { encoding: 'utf8', timeout: 120000 }));
    for (const [name, gaps] of Object.entries(r)) {
      assert.ok(gaps.length >= 1, name);
      for (const g of gaps) assert.ok(g <= seamMax, `${name}: ${g}% see-through inside`);
    }
  });
});
