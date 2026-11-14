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
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { closeSync, openSync, readSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { imageSize } from '../tools/image-size.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const MAX_SIDE = 4096;
/** Density-suffixed copies a phone never loads (sharp screens only). */
const SHARP_COPY = /@(?:1\.5|2|2\.75|3)x\.(?:webp|png|jpe?g)$/i;

const KNOWN_OVER = new Map([
  // Street decos (2x art, the file every screen under 2.25 density draws).
  ['assets/decos/groddle/alakol_house_big_shadow.webp', 'deco'],
  ['assets/decos/groddle/apartment_xsection_bottom_1.webp', 'deco'],
  ['assets/decos/groddle/apartment_xsection_top_1.webp', 'deco'],
  ['assets/decos/groddle/blur_landscape_piece_01.webp', 'deco'],
  ['assets/decos/groddle/blur_landscape_piece_02.webp', 'deco'],
  ['assets/decos/groddle/bureaucratic_hall_bg.webp', 'deco'],
  ['assets/decos/groddle/cityscape_asset_01.webp', 'deco'],
  ['assets/decos/groddle/cityscape_asset_02.webp', 'deco'],
  ['assets/decos/groddle/cl2_fat_ground_2250px_01.webp', 'deco'],
  ['assets/decos/groddle/cl2_fat_ground_2250px_02.webp', 'deco'],
  ['assets/decos/groddle/ground_front_2500px_02.webp', 'deco'],
  ['assets/decos/groddle/haze_gradient_01.webp', 'deco'],
  ['assets/decos/groddle/k04_lamp_02.webp', 'deco'],
  ['assets/decos/groddle/landscape_piece_01.webp', 'deco'],
  ['assets/decos/groddle/organs_wall_black2.webp', 'deco'],
  ['assets/decos/groddle/patch_rough8.webp', 'deco'],
  ['assets/decos/groddle/stripes_background.webp', 'deco'],
  ['assets/decos/groddle/top_overlay_01.webp', 'deco'],
  // pc_overlay sheet (seasons-feature.js Glitchmas Cracker): 110 cells of 769x394 cannot fit one 4096 texture.
  ['assets/sprites/overlays/glitchmas_cracker.webp', 'overlay sheet'],
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

  it('no sprite sheet or picture a phone loads is over 4096 px, beyond the known list', () => {
    const fresh = [...over].filter(([path]) => !KNOWN_OVER.has(path)).map(([p, s]) => `${p} ${s}`);
    assert.deepEqual(fresh, [], 'over 4096 px on a side: re-cut under 4096 (vendor-npcs.js stripCols)');
  });

  it('the known list only shrinks: every entry is still over 4096', () => {
    const gone = [...KNOWN_OVER.keys()].filter((path) => !over.has(path));
    assert.deepEqual(gone, [], 'now fits: take it off KNOWN_OVER');
  });

  it('no vendor or NPC sheet is on the known list', () => {
    for (const path of KNOWN_OVER.keys()) assert.doesNotMatch(path, /sprites\/(?:vendors|street-spirits|npcs?)\//, path);
  });
});
