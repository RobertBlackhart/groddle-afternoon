/**
 * #326 (register G748): many Android GPUs take textures up to 4096 px on a side and draw a bigger
 * one black (the Meal Vendor's idle strip, 1432x5300, turned into a black square on Level 2 East).
 * A phone draws the 1x art (js/render-density.js PHONE_RENDER_RESOLUTION; js/sprite-hires.js and
 * js/deco-hires.js leave the @1.5x/@2x/@3x files unloaded), so every 1x picture under
 * public/assets must fit 4096. The 3x files have their own budget (8192, the vector-sprites
 * manifest and deco-hires-list HIRES_DECOS_BIG) and only load on sharp screens.
 *
 * KNOWN_OVER is what was still over when this test was written (2026-11-14): it may only shrink.
 * A new picture over 4096 fails here; one fixed must come off the list.
 *
 * G765: a street deco's 2x file may stay over 4096 when js/deco-small-list.js gives it a copy that
 * fits (<name>@<res>x.webp, tools/deco-pipeline/small-gpu.py): js/deco-hires.js decoUrl loads the
 * copy where the GPU's limit is below the 2x file, so a small GPU never gets the big one.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { closeSync, openSync, readFileSync, readSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { imageSize } from '../tools/image-size.mjs';
import { SMALL_GPU_DECOS, SMALL_GPU_MAX_SIDE } from '../public/js/deco-small-list.js?v=5d29e2f1';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const MAX_SIDE = 4096;
/** Density-suffixed copies a phone never loads (sharp screens only). */
const SHARP_COPY = /@(?:1\.5|2|2\.75|3)x\.(?:webp|png|jpe?g)$/i;

const KNOWN_OVER = new Map([
  // G765: the 18 street decos have small-GPU copies (SMALL_GPU_DECOS) and the Glitchmas Cracker's
  // sheet is in pages (tools/overlays/build.mjs `pages`).
  // vp_overlay: drawn on a 2D canvas (overlays.js playWindowOverlay), not a GPU texture.
  ['assets/sprites/overlays/overlay_sparkle_powder@0.5x.webp', 'window overlay'],
  // avatar-lab.html only; the game draws the vector avatar sheets.
  ['assets/sprites/avatar_walk_vector.webp', 'lab only'],
]);

function* pictures(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* pictures(p);
    else if (/\.(?:webp|png|jpe?g)$/i.test(e.name) && !SHARP_COPY.test(e.name)) yield p;
  }
}

function headerSize(file) {
  const fd = openSync(file, 'r');
  try {
    const b = Buffer.alloc(65536);
    const n = readSync(fd, b, 0, b.length, 0);
    return imageSize(b.subarray(0, n));
  } finally {
    closeSync(fd);
  }
}

describe('1x pictures fit a 4096 px texture (#326, G748)', () => {
  const over = new Map();
  for (const file of pictures(join(ROOT, 'assets'))) {
    const size = headerSize(file);
    if (size && (size.w > MAX_SIDE || size.h > MAX_SIDE)) over.set(relative(ROOT, file), `${size.w}x${size.h}`);
  }

  const smallCopy = (path) => {
    const m = /^assets\/decos\/groddle\/([^/@]+)\.webp$/.exec(path);
    const row = m && SMALL_GPU_DECOS.get(m[1]);
    return row ? `assets/decos/groddle/${m[1]}@${row[0]}x.webp` : null;
  };

  it('no sprite sheet or picture a phone loads is over 4096 px, beyond the known list', () => {
    const fresh = [...over].filter(([path]) => !KNOWN_OVER.has(path) && !smallCopy(path)).map(([p, s]) => `${p} ${s}`);
    assert.deepEqual(fresh, [], 'over 4096 px on a side: re-cut under 4096 (vendor-npcs.js stripCols)');
  });

  it('the known list only shrinks: every entry is still over 4096', () => {
    const gone = [...KNOWN_OVER.keys()].filter((path) => !over.has(path));
    assert.deepEqual(gone, [], 'now fits: take it off KNOWN_OVER');
  });

  it('G765: every deco 2x file over 4096 has a small-GPU copy that fits, at its logical size', () => {
    assert.equal(SMALL_GPU_MAX_SIDE, MAX_SIDE);
    const decos = [...over.keys()].filter((p) => p.startsWith('assets/decos/'));
    assert.equal(decos.length, SMALL_GPU_DECOS.size);
    for (const path of decos) {
      const copy = smallCopy(path);
      assert.ok(copy, `${path}: no copy in js/deco-small-list.js`);
      const big = headerSize(join(ROOT, path));
      const small = headerSize(join(ROOT, copy));
      assert.ok(small.w <= MAX_SIDE && small.h <= MAX_SIDE, `${copy} ${small.w}x${small.h}`);
      const res = SMALL_GPU_DECOS.get(path.split('/').pop().slice(0, -5))[0];
      assert.ok(Math.abs(small.w / res - big.w) <= 0.5 && Math.abs(small.h / res - big.h) <= 0.5, `${copy} at ${res}`);
    }
  });

  it('G765: the Glitchmas Cracker sheet ships in pages that fit', () => {
    const more = JSON.parse(readFileSync(join(ROOT, 'assets/sprites/overlays/overlays-more.json'), 'utf8'));
    const c = more.glitchmas_cracker;
    assert.ok(c.pageRows > 0 && c.pages.length > 1);
    for (const p of c.pages) assert.ok(!over.has(`assets/sprites/overlays/${p.file}`), p.file);
  });

  it('no vendor or NPC sheet is on the known list', () => {
    for (const path of KNOWN_OVER.keys()) assert.doesNotMatch(path, /sprites\/(?:vendors|street-spirits|npcs?)\//, path);
  });
});
