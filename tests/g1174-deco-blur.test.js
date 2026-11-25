/**
 * G1174: Egret Taun Towers Basement drew a hard black band under the ceiling. The band is its
 * box_blur_1 decos (a black box whose SWF puts a 75 px BlurFilter on it), squashed to 255 px of the
 * SWF's 633 px stage: the deco files bake the blur at the stage's scale, so it drew 30 px wide. Flash
 * scaled the art to w x h (DecoRenderer.as syncRendererWithModel) but drew the filter at its own size,
 * so js/deco-blur.js adds back the blur a squash took away (tools/deco-pipeline/deco-blurs.py reads
 * each deco SWF's blur into js/deco-blur-data.js).
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';
import { BLUR_FIX_SCALE, blurFix } from '../public/js/deco-blur.js?v=4f5d88ea';
import { DECO_BLURS } from '../public/js/deco-blur-data.js?v=1024382d';

const ROOT = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');

describe('a deco keeps its own blur when squashed (G1174)', () => {
  it('box_blur_1 carries its SWF\'s 75 px blur on a 677 x 633 stage', () => {
    assert.deepEqual(DECO_BLURS.box_blur_1, [677, 633, 75, 75]);
  });

  it('Egret Taun Towers Basement\'s ceiling boxes get back the vertical blur they lost', () => {
    const street = JSON.parse(read('public/assets/streets/GHVEI9NVJ203LRO.json'));
    const boxes = street.layers.find((l) => l.name === 'elev').decos.filter((d) => d.sprite === 'box_blur_1');
    assert.equal(boxes.length, 4);
    const fix = blurFix('box_blur_1', 1071, 255);
    // 75 px wanted, 75 x 255 / 633 = 30 px baked: sqrt(75^2 - 30^2) = 68.6 px more, three boxes wide each side.
    assert.equal(fix.ex, 0, 'drawn wider than its stage: the file\'s blur is kept');
    assert.ok(Math.abs(fix.ey - 68.65) < 0.05, `ey ${fix.ey}`);
    assert.equal(fix.py, Math.ceil(1.5 * fix.ey));
    for (const d of boxes) assert.ok(blurFix(d.sprite, d.w, d.h), `${d.x},${d.y} ${d.w}x${d.h}`);
  });

  it('a deco at its stage size, a deco with no blur, or a mild squash draws as it is', () => {
    assert.equal(blurFix('box_blur_1', 677, 633), null);
    assert.equal(blurFix('wall_1', 100, 20), null);
    assert.equal(blurFix('box_blur_1', 677, Math.ceil(633 * BLUR_FIX_SCALE)), null, `at ${BLUR_FIX_SCALE} of its stage or more`);
    assert.equal(blurFix('box_blur_1', 1071, 203 * 0.1 + 600), null);
  });

  it('the street renderer draws a squashed blurred deco with its lost blur, never its sharp copy', () => {
    const src = read('public/js/street-render.js');
    assert.match(src, /const lostBlur = !own && !animated \? blurFix\(sprite, deco\.w, deco\.h\) : null;/);
    assert.match(src, /const sharp = !own && !animated && !lostBlur && isSharpDeco\(url\);/);
    assert.match(src, /if \(lostBlur\) onLoaded\(tex\.source, \(\) => applyLostBlur\(PIXI, spr, tex, deco, lostBlur, sizeDeco\)\);/);
  });

  it('sweep: the placements on every street that get a blur back', () => {
    let placements = 0;
    const streets = new Set();
    for (const f of readdirSync(new URL('public/assets/streets/', ROOT))) {
      if (!f.endsWith('.json') || f === 'index.json') continue;
      const s = JSON.parse(read(`public/assets/streets/${f}`));
      for (const l of s.layers || []) {
        for (const d of l.decos || []) {
          if (blurFix(d.sprite, d.w, d.h)) { placements += 1; streets.add(s.tsid); }
        }
      }
    }
    assert.ok(streets.has('GHVEI9NVJ203LRO'));
    assert.ok(placements > 50 && placements < 400, `${placements} placements on ${streets.size} streets`);
  });
});
