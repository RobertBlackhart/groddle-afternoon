/**
 * G889 (#245): the Sloth's animations rendered from Tiny Speck's npc_sloth.swf (tools/sloth-art/build.mjs).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from '../tools/image-size.mjs';
import { SLOTH_ART_DIR, SLOTH_CANOPY, SLOTH_KNOCKER_ART, SLOTH_LAYER_FIT, SLOTH_SHEETS, SLOTH_STEP } from '../public/js/sloth-art.js?v=a2768e2f';

const pub = join(dirname(fileURLToPath(import.meta.url)), '../public');

describe('Sloth art from npc_sloth.swf', () => {
  it('has every animation the encounter plays, each sheet the size its cells say', () => {
    const labels = ['hidden', 'peek', 'peekIdle', 'peekWithdraw', 'drop', 'hangIdle1', 'hangIdle2', 'eat', 'spit',
      'finishedEating', 'talk', 'climbUp', 'peekSpit'];
    const sheets = [];
    for (const label of labels) {
      const s = SLOTH_SHEETS[label];
      assert.ok(s, label);
      assert.equal(s.count, Math.ceil(s.swf[1] / SLOTH_STEP), `${label}: every second frame of the SWF label`);
      sheets.push(s);
      if (s.paw) sheets.push(s.paw, ...s.rods);
    }
    for (const s of sheets) {
      const size = imageSize(readFileSync(join(pub, SLOTH_ART_DIR, s.file)));
      assert.equal(size.format, 'webp', s.file);
      assert.equal(size.w, s.cell.w * s.cols, `${s.file} width`);
      assert.equal(size.h, s.cell.h * Math.ceil(s.count / s.cols), `${s.file} height`);
    }
  });

  it('draws eat and spit in three layers that stack into the whole sloth, rod1..rod7 in hand', () => {
    for (const label of ['eat', 'spit']) {
      assert.equal(SLOTH_SHEETS[label].rods.length, 7);
      assert.deepEqual(SLOTH_SHEETS[label].rods.map((r) => r.file), [1, 2, 3, 4, 5, 6, 7].map((n) => `sloth_${label}_rod${n}.webp`));
      assert.equal(SLOTH_SHEETS[label].rods[0].count, SLOTH_SHEETS[label].count);
      assert.ok(SLOTH_LAYER_FIT[label] >= 0.98, `${label} fit ${SLOTH_LAYER_FIT[label]}`);
    }
  });

  it('keeps the HIDE ME marker out and knows where it was', () => {
    // The marker sat over the branch's top, up and right of the origin (the hidden sloth's den).
    assert.deepEqual(SLOTH_CANOPY, { x: -52, y: -96, w: 164, h: 88 });
    assert.ok(existsSync(join(pub, SLOTH_ART_DIR, SLOTH_KNOCKER_ART.still)));
    assert.ok(SLOTH_KNOCKER_ART.knock.count > 30);
  });

  it('records where the art came from', () => {
    const src = readFileSync(join(pub, 'js/sloth-art.js'), 'utf8');
    assert.match(src, /Tiny Speck's CC0 glitch-items inhabitants\/sloth\/npc_sloth\.swf/);
    const manifest = JSON.parse(readFileSync(join(pub, '../tools/vector-sprites/sloth.json'), 'utf8'));
    assert.ok(manifest.jobs.every((job) => job.swf === 'inhabitants/sloth/npc_sloth.swf' && job.parts['104'] === null));
  });
});
