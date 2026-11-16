#!/usr/bin/env node
/**
 * The Sloth's animations (register G889, report #245), all from Tiny Speck's CC0 files.
 *
 * Source: tinyspeck/glitch-items inhabitants/sloth/npc_sloth.swf, sprite 123 (sloth_mc, 771
 * frames, the labels npc_sloth.as 3 lists). The sloth hangs from its own striped branch, which is
 * part of the sprite. FFDec renders the frames at zoom 1 into one sheet per label, every second
 * frame (STEP 2: 15 drawings a second of the 30 fps timeline), each cell cropped to what that label
 * draws, with the sprite's origin (the item's x, y) at `origin` inside the cell.
 *
 * Left out or swapped (tools/vector-sprites/swf-parts.mjs, a work copy only):
 *  - shape 104, the olive "HIDE ME" marker at depth 127: the author's note of where the street's
 *    canopy covers the sloth (the game draws leaves there instead);
 *  - the rod in hand (rodContainer_mc, sprite 99). npc_sloth.js createSnail 401-405 swaps it after
 *    every spit (rod1..rod7, broadcastConfig), so eat and spit are drawn as three layers that
 *    stack in the SWF's own depth order: the sloth under the rod (depths under 110), the rod
 *    (depth 110, one sheet per rod1..rod7) and the paw over it (depths 112-126). The builder
 *    checks that the three layers together match the whole render.
 * The costume stays as Glitch's defaults: initInstanceProps (npc_sloth.js 27-29) gives every
 * Sloth head redBandana and jacket darkJacket, which are what the SWF places.
 *
 * The Knocker (misc/sloth_knocker, sloth_knocker.js) is OpenGameArt's own client renders
 * (extracted_street_furniture sloth_knocker x1 "1" still and "tool_animation" strip), copied.
 *
 * Output (lossless WebP, tools/webp-lossless.mjs):
 *   public/assets/sprites/sloth/sloth_<label>.webp           body labels
 *   public/assets/sprites/sloth/sloth_<eat|spit>.webp        the sloth under the rod
 *   public/assets/sprites/sloth/sloth_<eat|spit>_paw.webp    the paw over the rod
 *   public/assets/sprites/sloth/sloth_<eat|spit>_rod<n>.webp the rod, n = 1..7
 *   public/assets/sprites/sloth/sloth_knocker.webp, sloth_knocker_knock.webp
 *   public/js/sloth-art.js (generated: cells, columns, origins, the canopy box, fits)
 *   tools/vector-sprites/sloth.json (generated: the same sheets at 3x, one character, swapped in
 *   on first draw; run node tools/vector-sprites/build.mjs --manifest tools/vector-sprites/sloth.json
 *   after this)
 *
 * Usage: node tools/sloth-art/build.mjs [--work <dir>] [--check]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { FFDEC, JAVA, swfSprites } from '../vector-sprites/swf-labels.mjs';
import { swapParts } from '../vector-sprites/swf-parts.mjs';
import { encodeLosslessWebp, replacePngWithWebp } from '../webp-lossless.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUDIT = join(os.homedir(), 'Documents/glitch-audit');
export const SLOTH_SWF = join(AUDIT, 'glitch-items/inhabitants/sloth/npc_sloth.swf');
const KNOCKER_OGA = join(AUDIT, 'opengameart/extracted_street_furniture/glitch-assets/sloth_knocker');
const OUT_DIR = join(ROOT, 'public/assets/sprites/sloth');
const OUT_JS = join(ROOT, 'public/js/sloth-art.js');
const OUT_MANIFEST = join(ROOT, 'tools/vector-sprites/sloth.json');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const WORK = opt('--work', join(os.tmpdir(), 'sloth-art-work'));
const CHECK = args.includes('--check');

export const SPRITE = 123;
export const STEP = 2;
/** The olive HIDE ME marker (DefineShape 104, depth 127). */
export const HIDE_ME = 104;
/** rodContainer_mc and the rods (exported classes; rod1 is what the container places). */
export const ROD_CONTAINER = 99;
export const RODS = ['rod1', 'rod2', 'rod3', 'rod4', 'rod5', 'rod6', 'rod7'];
/** What sprite 123 places itself (FFDec -dumpSWF): containers 55, 98, 99 and shapes 100-122. */
const PLACED = [55, 98, 99, 100, 103, 104, ...Array.from({ length: 18 }, (_, i) => 105 + i)];
/** The paw drawn over the rod: the shapes at depths 112, 113 and 126 (the rod is at 110). */
const PAW = [109, 117, 118, 119, 120, 121, 122];
/** Labels drawn whole (no rod in hand) and the two drawn in layers. */
export const BODY_LABELS = ['hidden', 'peek', 'peekIdle', 'peekWithdraw', 'drop', 'hangIdle1', 'hangIdle2',
  'finishedEating', 'talk', 'climbUp', 'peekSpit'];
export const ROD_LABELS = ['eat', 'spit'];
/** The three layers must match the whole render this well (1 = identical). */
const LAYER_FIT_MIN = 0.98;
/** sloth_knocker.js getAssetInfo 85: the placement box from the item's x, y. */
const KNOCKER_POSITION = { x: -17, y: -51, w: 34, h: 52 };
const KNOCKER_CELL = { w: 34, h: 50 };

const nullAll = (keep) => Object.fromEntries(PLACED.filter((id) => !keep.includes(id)).map((id) => [id, null]));
/** Work copies: parts maps for tools/vector-sprites/swf-parts.mjs swapParts. */
export const LAYERS = Object.freeze({
  whole: { [HIDE_ME]: null },
  body: { [HIDE_ME]: null, rod1: null },
  under: { [HIDE_ME]: null, rod1: null, ...Object.fromEntries(PAW.map((id) => [id, null])) },
  paw: nullAll(PAW),
  ...Object.fromEntries(RODS.map((rod, i) => [rod, { ...nullAll([ROD_CONTAINER]), ...(i ? { rod1: rod } : {}) }])),
});

function ffdec(argv) {
  return execFileSync(JAVA, ['-jar', FFDEC, ...argv], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 900000 });
}

function rgba(png) {
  const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', png], { encoding: 'utf8' }).trim().split(' ').map(Number);
  const data = execFileSync('magick', [png, '-depth', '8', 'RGBA:-'], { maxBuffer: 1 << 30 });
  return { w, h, data };
}

function blank(w, h) {
  return { w, h, data: Buffer.alloc(w * h * 4) };
}

/** Copy `src` into `dst` with src (0,0) at dst (x,y), clipped to `clip` (or dst). */
function blit(dst, src, x, y, clip = null) {
  const c = clip || { x: 0, y: 0, w: dst.w, h: dst.h };
  for (let sy = 0; sy < src.h; sy += 1) {
    const dy = y + sy;
    if (dy < c.y || dy >= c.y + c.h) continue;
    for (let sx = 0; sx < src.w; sx += 1) {
      const dx = x + sx;
      if (dx < c.x || dx >= c.x + c.w) continue;
      src.data.copy(dst.data, (dy * dst.w + dx) * 4, (sy * src.w + sx) * 4, (sy * src.w + sx) * 4 + 4);
    }
  }
}

/** Source-over `src` onto `dst` at (x, y) (straight alpha). */
function over(dst, src, x, y) {
  for (let sy = 0; sy < src.h; sy += 1) {
    const dy = y + sy;
    if (dy < 0 || dy >= dst.h) continue;
    for (let sx = 0; sx < src.w; sx += 1) {
      const dx = x + sx;
      if (dx < 0 || dx >= dst.w) continue;
      const i = (sy * src.w + sx) * 4;
      const sa = src.data[i + 3] / 255;
      if (!sa) continue;
      const j = (dy * dst.w + dx) * 4;
      const da = dst.data[j + 3] / 255;
      const oa = sa + da * (1 - sa);
      for (let k = 0; k < 3; k += 1) {
        dst.data[j + k] = Math.round((src.data[i + k] * sa + dst.data[j + k] * da * (1 - sa)) / oa);
      }
      dst.data[j + 3] = Math.round(oa * 255);
    }
  }
}

/** The drawn pixels' box (alpha above 8), or null. */
function drawn(img) {
  let x0 = img.w; let y0 = img.h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < img.h; y += 1) {
    for (let x = 0; x < img.w; x += 1) {
      if (img.data[(y * img.w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

/** Premultiplied RGBA likeness of two same-size pictures: 1 - sum|diff| / sum(both). */
function likeness(a, b) {
  let diff = 0;
  let total = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const aa = a.data[i + 3];
    const ba = b.data[i + 3];
    if (!aa && !ba) continue;
    for (let k = 0; k < 3; k += 1) {
      const x = (a.data[i + k] * aa) / 255;
      const y = (b.data[i + k] * ba) / 255;
      diff += Math.abs(x - y);
      total += x + y;
    }
    diff += Math.abs(aa - ba);
    total += aa + ba;
  }
  return total ? 1 - diff / total : 1;
}

/** One layer's work SWF, its frames (1-based) and the sprite origin in its canvas. */
function renderLayer(name) {
  const swf = join(WORK, `${name}.swf`);
  if (!existsSync(swf)) swapParts(SLOTH_SWF, swf, LAYERS[name]);
  const dir = join(WORK, name);
  const done = existsSync(dir) && readdirSync(dir).some((d) => d.startsWith('DefineSprite_') && readdirSync(join(dir, d)).length);
  if (!done) {
    mkdirSync(dir, { recursive: true });
    ffdec(['-zoom', '1', '-selectid', String(SPRITE), '-format', 'sprite:png', '-export', 'sprite', dir, swf]);
  }
  const frames = join(dir, readdirSync(dir).find((d) => d.startsWith('DefineSprite_')));
  // The canvas is the sprite's bounds over all frames: FFDec's SVG export of a frame says where
  // the origin sits in it (its first matrix is the translate).
  const regFile = join(WORK, `${name}-origin.json`);
  if (!existsSync(regFile)) {
    const svgDir = join(WORK, `${name}-svg`);
    mkdirSync(svgDir, { recursive: true });
    ffdec(['-zoom', '1', '-select', `${SPRITE}:219-219`, '-selectid', String(SPRITE), '-format', 'sprite:svg', '-export', 'sprite', svgDir, swf]);
    const sub = join(svgDir, readdirSync(svgDir).find((d) => d.startsWith('DefineSprite_')));
    const svg = readFileSync(join(sub, readdirSync(sub)[0]), 'utf8');
    const m = /matrix\(1\.0, 0\.0, 0\.0, 1\.0, (-?[\d.]+), (-?[\d.]+)\)/.exec(svg);
    if (!m) throw new Error(`${name}: no origin in FFDec's SVG`);
    writeFileSync(regFile, JSON.stringify({ x: Number(m[1]), y: Number(m[2]) }));
  }
  const reg = JSON.parse(readFileSync(regFile, 'utf8'));
  const cache = new Map();
  return {
    origin: { x: Math.round(reg.x), y: Math.round(reg.y) },
    frame(n) {
      if (!cache.has(n)) cache.set(n, rgba(join(frames, `${n}.png`)));
      return cache.get(n);
    },
  };
}

/** Frames a label's sheet holds: every STEP-th from its first. */
export function labelFrames([start, count], step = STEP) {
  return Array.from({ length: Math.ceil(count / step) }, (_, k) => start + k * step);
}

/** The squarest grid for n cells of w x h. */
function columns(n, w, h) {
  return Math.max(1, Math.min(n, Math.round(Math.sqrt((n * h) / w))));
}

/**
 * One sheet: the frames of `layer` cropped to their union (origin-relative), laid out in a grid.
 * Returns the manifest entry and the picture.
 */
function sheet(layer, frames, file) {
  let box = null;
  for (const n of frames) {
    const b = drawn(layer.frame(n));
    if (!b) continue;
    const r = { x0: b.x0 - layer.origin.x, y0: b.y0 - layer.origin.y, x1: b.x1 - layer.origin.x, y1: b.y1 - layer.origin.y };
    box = box ? { x0: Math.min(box.x0, r.x0), y0: Math.min(box.y0, r.y0), x1: Math.max(box.x1, r.x1), y1: Math.max(box.y1, r.y1) } : r;
  }
  if (!box) throw new Error(`${file}: nothing drawn`);
  const cell = { w: box.x1 - box.x0 + 2, h: box.y1 - box.y0 + 2 };
  const origin = { x: 1 - box.x0, y: 1 - box.y0 };
  const cols = columns(frames.length, cell.w, cell.h);
  const rows = Math.ceil(frames.length / cols);
  const img = blank(cell.w * cols, cell.h * rows);
  frames.forEach((n, i) => {
    const cx = (i % cols) * cell.w;
    const cy = Math.floor(i / cols) * cell.h;
    blit(img, layer.frame(n), cx + origin.x - layer.origin.x, cy + origin.y - layer.origin.y, { x: cx, y: cy, w: cell.w, h: cell.h });
  });
  return { entry: { file, cell, cols, count: frames.length, origin }, img };
}

function writeWebp(img, out) {
  const png = out.replace(/\.webp$/, '.tmp.png');
  execFileSync('magick', ['-size', `${img.w}x${img.h}`, '-depth', '8', 'RGBA:-', `PNG32:${png}`], { input: img.data, maxBuffer: 1 << 30 });
  replacePngWithWebp(png, out);
}

/** The three layers stacked (under, rod, paw) against the whole render, frame by frame. */
function layerFit(labels, layers) {
  const fits = {};
  for (const label of ROD_LABELS) {
    let sum = 0;
    const frames = labelFrames(labels[label]);
    for (const n of frames) {
      const whole = layers.whole.frame(n);
      const stack = blank(whole.w, whole.h);
      for (const name of ['under', 'rod1', 'paw']) {
        const l = layers[name];
        over(stack, l.frame(n), layers.whole.origin.x - l.origin.x, layers.whole.origin.y - l.origin.y);
      }
      sum += likeness(stack, whole);
    }
    fits[label] = +(sum / frames.length).toFixed(4);
  }
  return fits;
}

function main() {
  mkdirSync(WORK, { recursive: true });
  const sprite = swfSprites(SLOTH_SWF).find((s) => s.id === SPRITE);
  if (!sprite || sprite.frames !== 771) throw new Error(`sprite ${SPRITE} is not the 771-frame sloth_mc`);
  const labels = Object.fromEntries(sprite.labels.map((l) => [l.name, [l.start, l.count]]));
  const layers = Object.fromEntries(Object.keys(LAYERS).map((name) => [name, renderLayer(name)]));

  const fits = layerFit(labels, layers);
  const weak = Object.entries(fits).filter(([, f]) => f < LAYER_FIT_MIN);
  if (weak.length) throw new Error(`the rod layers do not stack into the whole sloth (${weak.map(([l, f]) => `${l} ${f}`).join(', ')})`);

  const pictures = [];
  const sheets = {};
  for (const label of BODY_LABELS) {
    const s = sheet(layers.body, labelFrames(labels[label]), `sloth_${label}.webp`);
    sheets[label] = { ...s.entry, swf: labels[label] };
    pictures.push([s.entry.file, s.img]);
  }
  for (const label of ROD_LABELS) {
    const frames = labelFrames(labels[label]);
    const under = sheet(layers.under, frames, `sloth_${label}.webp`);
    const paw = sheet(layers.paw, frames, `sloth_${label}_paw.webp`);
    const rods = RODS.map((rod) => sheet(layers[rod], frames, `sloth_${label}_${rod}.webp`));
    sheets[label] = { ...under.entry, swf: labels[label], paw: paw.entry, rods: rods.map((r) => r.entry) };
    pictures.push([under.entry.file, under.img], [paw.entry.file, paw.img], ...rods.map((r) => [r.entry.file, r.img]));
  }

  // The HIDE ME marker's box, origin-relative: where the street's canopy covered the sloth.
  const marked = renderLayerMarker(layers.whole.origin);

  // The Knocker: its still and its knock strip (cells of 34 x 50, read from the strip).
  const strip = rgba(join(KNOCKER_OGA, readdirSync(KNOCKER_OGA).find((f) => f.includes('_x1_tool_animation_png_'))));
  const kCols = Math.round(strip.w / KNOCKER_CELL.w);
  const kRows = Math.round(strip.h / KNOCKER_CELL.h);
  let kCount = 0;
  for (let i = 0; i < kCols * kRows; i += 1) {
    const cell = blank(KNOCKER_CELL.w, KNOCKER_CELL.h);
    blit(cell, strip, -(i % kCols) * KNOCKER_CELL.w, -Math.floor(i / kCols) * KNOCKER_CELL.h);
    if (drawn(cell)) kCount = i + 1;
  }
  const knocker = {
    still: 'sloth_knocker.webp',
    knock: { file: 'sloth_knocker_knock.webp', cell: KNOCKER_CELL, cols: kCols, count: kCount },
    // The still is the placement box's picture: the item's x, y is 17 px in, 51 px down (getAssetInfo).
    origin: { x: -KNOCKER_POSITION.x, y: -KNOCKER_POSITION.y },
  };

  const js = [
    '/**',
    ' * GENERATED by tools/sloth-art/build.mjs. Do not edit.',
    ' *',
    ' * The Sloth from Tiny Speck\'s CC0 glitch-items inhabitants/sloth/npc_sloth.swf (sprite 123,',
    ' * sloth_mc, hanging from its own striped branch; the HIDE ME marker left out), every second frame',
    ' * of the 30 fps timeline. Each sheet: cell size, columns, cell count, and the sprite origin (the',
    ' * item\'s x, y) inside a cell; swf is the label\'s [first frame, frames] in the SWF. eat and spit are',
    ' * three layers in the SWF\'s depth order: the sheet itself (under the rod), rods[n - 1] (rodn in',
    ' * hand, npc_sloth.js createSnail 401-405) and paw (over the rod); layerFit is how well they stack',
    ' * into the whole render. canopy is the HIDE ME marker\'s box (origin-relative): where a street\'s',
    ' * canopy covered the hidden sloth. The Knocker is OpenGameArt\'s sloth_knocker x1 sheets (CC0).',
    ' */',
    'export const SLOTH_ART_DIR = \'assets/sprites/sloth/\';',
    '/** The SWF timeline\'s rate, and how many of its frames each cell stands for. */',
    'export const SLOTH_FPS = 30;',
    `export const SLOTH_STEP = ${STEP};`,
    '/** npc_sloth.as 5: the labels that loop (devil is not drawn here). */',
    'export const SLOTH_LOOPERS = Object.freeze([\'eat\']);',
    `export const SLOTH_SHEETS = Object.freeze(${JSON.stringify(sheets)});`,
    `export const SLOTH_CANOPY = Object.freeze(${JSON.stringify(marked)});`,
    `export const SLOTH_LAYER_FIT = Object.freeze(${JSON.stringify(fits)});`,
    `export const SLOTH_KNOCKER_ART = Object.freeze(${JSON.stringify(knocker)});`,
    '',
  ].join('\n');

  const manifest = `${JSON.stringify(vectorManifest(sheets), null, 1)}\n`;
  const files = [...pictures.map(([f]) => f), knocker.still, knocker.knock.file];
  if (CHECK) {
    const have = existsSync(OUT_JS) ? readFileSync(OUT_JS, 'utf8') : '';
    const haveManifest = existsSync(OUT_MANIFEST) ? readFileSync(OUT_MANIFEST, 'utf8') : '';
    const lost = files.filter((f) => !existsSync(join(OUT_DIR, f)));
    if (have !== js || haveManifest !== manifest || lost.length) {
      console.error(`sloth art is stale${lost.length ? ` (${lost.length} files missing)` : ''}: run node tools/sloth-art/build.mjs`);
      process.exit(1);
    }
    return;
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const [file, img] of pictures) writeWebp(img, join(OUT_DIR, file));
  encodeLosslessWebp(join(KNOCKER_OGA, readdirSync(KNOCKER_OGA).find((f) => f.includes('_x1_1_png_'))), join(OUT_DIR, knocker.still));
  encodeLosslessWebp(join(KNOCKER_OGA, readdirSync(KNOCKER_OGA).find((f) => f.includes('_x1_tool_animation_png_'))), join(OUT_DIR, knocker.knock.file));
  writeFileSync(OUT_JS, js);
  writeFileSync(OUT_MANIFEST, manifest);
  const px = pictures.reduce((n, [, img]) => n + img.w * img.h, 0);
  console.log(`sloth art: ${pictures.length} sheets, ${(px / 1e6).toFixed(2)} M px at 1x; layer fit ${JSON.stringify(fits)}; canopy ${JSON.stringify(marked)}; knocker ${kCount} frames`);
}

/** tools/vector-sprites/build.mjs jobs: each layer's parts, each sheet's label, cells and step. */
function vectorManifest(sheets) {
  const job = (name, parts, list) => ({
    name: `sloth_${name}`,
    character: 'npc_sloth',
    swf: 'inhabitants/sloth/npc_sloth.swf',
    sprite: SPRITE,
    parts,
    sheets: list.map(([label, s]) => ({
      path: `assets/sprites/sloth/${s.file}`,
      label,
      fw: s.cell.w,
      fh: s.cell.h,
      cols: s.cols,
      frames: s.count,
      step: STEP,
    })),
  });
  return {
    about: 'GENERATED by tools/sloth-art/build.mjs. The Sloth (js/sloth-art.js, G889, #245): Tiny Speck\'s CC0 glitch-items inhabitants/sloth/npc_sloth.swf sprite 123 (sloth_mc), the HIDE ME marker (shape 104) left out, every second frame. Body labels whole; eat and spit as three layers (under the rod, the rod rod1..rod7, the paw over it). One character: every sheet sharp or none. Swapped in on first draw. Run: node tools/vector-sprites/build.mjs --manifest tools/vector-sprites/sloth.json',
    firstDraw: true,
    webp: true,
    budget: { maxSide: 8192, maxMB: 64 },
    jobs: [
      job('body', LAYERS.body, BODY_LABELS.map((l) => [l, sheets[l]])),
      job('under', LAYERS.under, ROD_LABELS.map((l) => [l, sheets[l]])),
      job('paw', LAYERS.paw, ROD_LABELS.map((l) => [l, sheets[l].paw])),
      ...RODS.map((rod, i) => ({
        ...job(rod, LAYERS[rod], ROD_LABELS.map((l) => [l, sheets[l].rods[i]])),
        minScore: 0.88,
        minScoreWhy: 'The rod alone: a thin bar a few 1x pixels across whose antialiased edges are most of what it draws, so the 3:1 downscale scores it lower than the body (0.88-0.94) though it lines up exactly.',
      })),
    ],
  };
}

/** The marker's drawn box in the original SWF's hidden frame (what the whole render lacks there). */
function renderLayerMarker(wholeOrigin) {
  const file = join(WORK, 'marker.json');
  if (!existsSync(file)) {
    const dir = join(WORK, 'marker');
    mkdirSync(dir, { recursive: true });
    ffdec(['-zoom', '1', '-select', `${SPRITE}:2-2`, '-selectid', String(SPRITE), '-format', 'sprite:png', '-export', 'sprite', dir, SLOTH_SWF]);
    const sub = join(dir, readdirSync(dir).find((d) => d.startsWith('DefineSprite_')));
    const orig = rgba(join(sub, readdirSync(sub)[0]));
    const whole = rgba(join(WORK, 'whole', readdirSync(join(WORK, 'whole')).find((d) => d.startsWith('DefineSprite_')), '2.png'));
    if (orig.w !== whole.w || orig.h !== whole.h) throw new Error('the marker render and the whole render differ in size');
    const diff = blank(orig.w, orig.h);
    for (let i = 0; i < orig.data.length; i += 4) {
      let d = 0;
      for (let k = 0; k < 4; k += 1) d += Math.abs(orig.data[i + k] - whole.data[i + k]);
      if (d > 24) diff.data[i + 3] = 255;
    }
    const b = drawn(diff);
    writeFileSync(file, JSON.stringify({ x: b.x0 - wholeOrigin.x, y: b.y0 - wholeOrigin.y, w: b.x1 - b.x0, h: b.y1 - b.y0 }));
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

main();
