#!/usr/bin/env node
/**
 * Happy New Ur's item icons (G1195, js/new-ur-party.js), recoloured from Tiny Speck's own CC0 icons
 * (plan research/seasonal/new-year-plan.md section 5). Nothing is drawn: each pixel of the source icon
 * keeps its shape and shading and takes a new colour.
 *
 *   midnight_sparkly          the Sparkly in midnight blue, its white glints gold (the keepsake)
 *   bubbly                    the Slow Gin Fizz, its pink drink and blue bubbles champagne gold
 *   confetti_popper[_colour]  PLACEHOLDER until Grok Bot's popper icon lands (research/art-briefs/
 *                             new-ur-2026-11-23, picture A): the Glitchmas Cracker in each Element's hue
 *
 *   node tools/new-ur-art/build.mjs           write the 1x and 3x WebP icons
 *   node tools/new-ur-art/build.mjs --check   exit 1 when an icon differs from what this would write
 *
 * Needs dwebp, magick and cwebp (as tools/quoin-art and tools/webp-lossless.mjs).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readImage, writeImage } from '../quoin-art/pixels.mjs';
import { encodeLosslessWebp } from '../webp-lossless.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ICONS = join(ROOT, 'public/assets/sprites/icons');

/** RGB 0..255 to HSL (h degrees, s and l 0..1), and back. */
function hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function rgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const mix = (a, b, t) => a + (b - a) * t;

/** Each recolour: a function of one straight-alpha pixel [r, g, b] to [r, g, b]. */
const RECOLOUR = {
  // Dark to midnight navy, mid to night blue, the brightest (the glints) to gold.
  midnight_sparkly: ([r, g, b]) => {
    const l = hsl(r, g, b)[2];
    const navy = [27, 38, 88];
    const blue = [72, 104, 190];
    const gold = [250, 214, 80];
    if (l > 0.95) {
      const t = Math.min(1, (l - 0.95) / 0.04);
      return [150, 170, 230].map((v, i) => mix(v, gold[i], t));
    }
    const t = Math.min(1, Math.pow(l / 0.95, 1.6));
    const pale = [150, 170, 230];
    if (t > 0.6) return blue.map((v, i) => mix(v, pale[i], (t - 0.6) / 0.4));
    return navy.map((v, i) => mix(v, blue[i], t / 0.6));
  },
  // Coloured pixels (the drink, the bubbles) to champagne gold at their own lightness; the glass stays.
  bubbly: ([r, g, b]) => {
    const [, s, l] = hsl(r, g, b);
    if (s < 0.12) return [r, g, b];
    return rgb(46, Math.min(0.85, s * 0.9 + 0.15), Math.min(0.92, l * 1.04));
  },
};
/** The placeholder poppers: the cracker's coloured paper turned to an Element's hue (the mix stays as drawn). */
const HUES = { red: 4, green: 112, blue: 212, shiny: 212 };
for (const [c, h] of Object.entries(HUES)) {
  RECOLOUR[`confetti_popper_${c}`] = ([r, g, b]) => {
    const [, s, l] = hsl(r, g, b);
    if (s < 0.18) return [r, g, b];
    // The Shiny Element is silver-white (its icon): the paper goes silver, not a hue.
    return rgb(h, c === 'shiny' ? s * 0.12 : s, c === 'shiny' ? Math.min(0.94, l * 1.12) : l);
  };
}
RECOLOUR.confetti_popper = (px) => px;

/** Where each icon's pixels come from (Tiny Speck's icon, 1x and 3x). */
const SOURCE = {
  midnight_sparkly: 'sparkly',
  bubbly: 'slow_gin_fizz',
  confetti_popper: 'glitchmas_cracker',
  confetti_popper_red: 'glitchmas_cracker',
  confetti_popper_green: 'glitchmas_cracker',
  confetti_popper_blue: 'glitchmas_cracker',
  confetti_popper_shiny: 'glitchmas_cracker',
};
export const NEW_UR_ICONS = Object.freeze(Object.keys(SOURCE));
/** Placeholders until Grok Bot's art lands (the brief: research/art-briefs/new-ur-2026-11-23). */
export const PLACEHOLDER_ICONS = Object.freeze(NEW_UR_ICONS.filter((id) => id.startsWith('confetti_popper')));

function recolour(srcWebp, fn, tmp, outWebp) {
  const png = join(tmp, 'src.png');
  execFileSync('dwebp', ['-quiet', srcWebp, '-o', png]);
  const img = readImage(png);
  for (let i = 0; i < img.w * img.h; i++) {
    const a = img.p[i * 4 + 3];
    if (a <= 0) continue;
    const k = a / 255;
    const out = fn([img.p[i * 4] / k, img.p[i * 4 + 1] / k, img.p[i * 4 + 2] / k]);
    for (let j = 0; j < 3; j++) img.p[i * 4 + j] = Math.max(0, Math.min(255, out[j])) * k;
  }
  const done = join(tmp, 'out.png');
  writeImage(img, done);
  encodeLosslessWebp(done, outWebp);
}

const ICON_HIRES_JS = join(ROOT, 'public/js/icon-hires.js');
/** js/icon-hires.js HIRES_ICONS with these icons in it (their @3x files are on disk). */
export function iconHiresText(src = readFileSync(ICON_HIRES_JS, 'utf8')) {
  const m = /^export const HIRES_ICONS = new Set\((\[.*\])\);$/m.exec(src);
  const ids = [...new Set([...JSON.parse(m[1]), ...NEW_UR_ICONS])].sort();
  return src.replace(m[0], `export const HIRES_ICONS = new Set(${JSON.stringify(ids, null, 0).replace(/","/g, '", "')});`);
}

function run(check) {
  const tmp = mkdtempSync(join(os.tmpdir(), 'new-ur-art-'));
  const bad = [];
  try {
    for (const id of NEW_UR_ICONS) {
      for (const suffix of ['', '@3x']) {
        const out = join(ICONS, `${id}${suffix}.webp`);
        const dest = check ? join(tmp, `${id}${suffix}.webp`) : out;
        recolour(join(ICONS, `${SOURCE[id]}${suffix}.webp`), RECOLOUR[id], tmp, dest);
        if (check) {
          let have = null;
          try { have = readFileSync(out); } catch { /* missing */ }
          if (!have || !have.equals(readFileSync(dest))) bad.push(`${id}${suffix}.webp`);
        }
      }
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (check && readFileSync(ICON_HIRES_JS, 'utf8') !== iconHiresText()) bad.push('public/js/icon-hires.js does not list them');
  if (!check) writeFileSync(ICON_HIRES_JS, iconHiresText());
  return bad;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const bad = run(true);
    if (bad.length) {
      console.error(`new-ur-art: stale (run node tools/new-ur-art/build.mjs): ${bad.join(', ')}`);
      process.exit(1);
    }
    console.log('new-ur-art: up to date');
  } else {
    run(false);
    console.log(`new-ur-art: wrote ${NEW_UR_ICONS.length * 2} icons`);
  }
}
