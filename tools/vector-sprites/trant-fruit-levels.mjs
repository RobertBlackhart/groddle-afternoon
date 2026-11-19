#!/usr/bin/env node
/**
 * Report #545: the 1x stills of each fruit-bearing trant holding less fruit
 * (trant-states.mjs FRUIT_LEVELS: trant_<species>_m<stage>_f0 bare, _f1 half).
 *
 * The full stills are OGA cells; these states have none, so they are drawn
 * from the SWF (glitch-items, CC0): the plant's state with the fruit the
 * level hides, rendered by FFDec at 3x, placed in the 3x cell where
 * build.mjs placed the full still's render (results.json offset3x, aligned
 * on the full render when the canvas differs), and box-downscaled 3:1. Then
 * build.mjs writes their @3x files as for any other sheet:
 *
 *   node tools/vector-sprites/trant-states.mjs --write
 *   node tools/vector-sprites/trant-fruit-levels.mjs [--work dir] [--only name]
 *   node tools/vector-sprites/build.mjs --manifest tools/vector-sprites/harvestables.json --only _f0
 *   node tools/vector-sprites/build.mjs --manifest tools/vector-sprites/harvestables.json --only _f1
 *
 * The bubble tree renders through Chromium (svg-raster.mjs): run it under the
 * browser lock (tools/qa/browser-lock.mjs run -- node ...).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { FFDEC, JAVA } from './swf-labels.mjs';
import { freezeState } from './swf-state.mjs';
import { rasteriseSvgs } from './svg-raster.mjs';
import { trantJobs } from './trant-states.mjs';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC = resolve(HERE, '../../public');
const ITEMS = join(os.homedir(), 'Documents/glitch-audit/glitch-items');
const S = 3;

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const WORK = resolve(opt('work', join(os.tmpdir(), 'trant-fruit-levels')));
const only = opt('only', '');

function readRGBA(file) {
  const [w, h] = execFileSync('magick', ['identify', '-format', '%w %h', file], { encoding: 'utf8' }).trim().split(' ').map(Number);
  const raw = execFileSync('magick', [file, '-depth', '8', 'rgba:-'], { maxBuffer: 1 << 28 });
  return { w, h, raw: new Uint8Array(raw.buffer, raw.byteOffset, raw.length) };
}

/** One sprite frame rendered at 3x (PNG, or FFDec SVG through Chromium). */
async function render(swf, sprite, frame, renderer, tag) {
  const dir = join(WORK, tag);
  const png = join(dir, `${frame}.png`);
  if (existsSync(png)) return readRGBA(png);
  mkdirSync(dir, { recursive: true });
  const fmt = renderer === 'svg' ? 'svg' : 'png';
  const out = join(dir, 'export');
  execFileSync(JAVA, ['-jar', FFDEC, '-zoom', String(S), '-select', `${sprite}:${frame}-${frame}`, '-selectid', String(sprite), '-format', `sprite:${fmt}`, '-export', 'sprite', out, swf], { stdio: 'ignore' });
  const sub = readdirSync(out).find((n) => n === `DefineSprite_${sprite}` || n.startsWith(`DefineSprite_${sprite}_`));
  if (!sub) throw new Error(`${tag}: no export of sprite ${sprite}`);
  const file = join(out, sub, `${frame}.${fmt}`);
  if (fmt === 'svg') await rasteriseSvgs([{ svg: file, png }]);
  else renameSync(file, png);
  return readRGBA(png);
}

/** Where `small` sits on `big` (its pixels a subset of big's): the offset with the least alpha difference. */
function align(big, small) {
  if (big.w === small.w && big.h === small.h) return { x: 0, y: 0 };
  let best = null;
  for (let oy = 0; oy <= big.h - small.h; oy++) {
    for (let ox = 0; ox <= big.w - small.w; ox++) {
      let err = 0;
      for (let y = 0; y < small.h && (!best || err < best.err); y += 2) {
        for (let x = 0; x < small.w; x += 2) {
          const a = small.raw[(y * small.w + x) * 4 + 3];
          if (!a) continue;
          err += Math.abs(a - big.raw[((y + oy) * big.w + x + ox) * 4 + 3]);
        }
      }
      if (!best || err < best.err) best = { x: ox, y: oy, err };
    }
  }
  return best;
}

/** The 3x cell: `img` placed at (dx, dy), clipped. */
function cell(img, fw3, fh3, dx, dy) {
  const out = new Uint8Array(fw3 * fh3 * 4);
  for (let y = 0; y < img.h; y++) {
    const ty = y + dy;
    if (ty < 0 || ty >= fh3) continue;
    for (let x = 0; x < img.w; x++) {
      const tx = x + dx;
      if (tx < 0 || tx >= fw3) continue;
      out.set(img.raw.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4), (ty * fw3 + tx) * 4);
    }
  }
  return out;
}

/** 3:1 box downscale, premultiplied. */
function downscale(raw, w3, h3) {
  const w = w3 / S;
  const h = h3 / S;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let j = 0; j < S; j++) {
        for (let i = 0; i < S; i++) {
          const p = ((y * S + j) * w3 + x * S + i) * 4;
          const al = raw[p + 3];
          r += raw[p] * al; g += raw[p + 1] * al; b += raw[p + 2] * al; a += al;
        }
      }
      const d = (y * w + x) * 4;
      if (a) {
        out[d] = Math.round(r / a); out[d + 1] = Math.round(g / a); out[d + 2] = Math.round(b / a);
      }
      out[d + 3] = Math.round(a / (S * S));
    }
  }
  return out;
}

function writeWebp(raw, w, h, file) {
  const png = `${file}.tmp.png`;
  execFileSync('magick', ['-size', `${w}x${h}`, '-depth', '8', 'rgba:-', `PNG32:${png}`], { input: raw, maxBuffer: 1 << 28 });
  execFileSync('cwebp', ['-quiet', '-lossless', '-exact', '-z', '9', '-metadata', 'none', png, '-o', file]);
  unlinkSync(png);
}

async function main() {
  const results = JSON.parse(readFileSync(join(HERE, 'results.json'), 'utf8'));
  const jobs = trantJobs();
  const byPath = new Map(jobs.map((j) => [j.sheets[0].path, j]));
  mkdirSync(WORK, { recursive: true });
  for (const job of jobs.filter((j) => j.fruitOf && (!only || j.name.includes(only)))) {
    const full = byPath.get(job.fruitOf);
    const placed = results[job.fruitOf]?.offset3x;
    if (!full || !placed) throw new Error(`${job.name}: ${job.fruitOf} has no 3x placement in results.json`);
    const sheet = job.sheets[0];
    const swf = join(ITEMS, job.swf);
    const frozen = (j) => {
      const out = join(WORK, `${basename(swf, '.swf')}.${j.name}.swf`);
      if (!j.state) return swf;
      const r = freezeState(swf, out, j.sprite, j.state);
      if (r.missing.length) throw new Error(`${j.name}: not placed: ${r.missing.join(' ')}`);
      return out;
    };
    const big = await render(frozen(full), full.sprite, sheet.swfStart, job.renderer, full.name);
    const less = await render(frozen(job), job.sprite, sheet.swfStart, job.renderer, job.name);
    const at = align(big, less);
    const fw3 = sheet.fw * S;
    const fh3 = sheet.fh * S;
    const raw = downscale(cell(less, fw3, fh3, placed[0] + at.x, placed[1] + at.y), fw3, fh3);
    writeWebp(raw, sheet.fw, sheet.fh, join(PUBLIC, sheet.path));
    console.log(`${job.name}: ${sheet.path} (render ${less.w}x${less.h} at +${at.x},+${at.y} of ${big.w}x${big.h})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
