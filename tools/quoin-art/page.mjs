#!/usr/bin/env node
/**
 * Page art for the two quoin pack icons (tools/page-art): quoin.webp is the energy quoin's frame 0
 * and moving_quoin.webp its frame 16, each trimmed from the 1x quoin sheet. quoin.swf holds those
 * bitmaps, not vectors, so tools/page-art/render.py cannot draw them; this renders the same cell
 * from the hand-traced quoin SVGs (tools/quoin-art, CC0, traced from that sheet) at k times, cut to
 * the icon's trim box, as public/assets/page-art/sprites/icons/<icon>@<k>x.webp (lossy WebP q90
 * with lossless alpha, as render.py writes). The render shrunk to 1x is checked against the icon.
 *
 *   node tools/quoin-art/page.mjs [--dry]
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { HERE, FW, FH, TYPES, sheetSvg } from './compose.mjs';

const ROOT = join(HERE, '../..');
const PUB = join(ROOT, 'public');
/** icon -> the energy quoin's frame it is (matched pixel for pixel against the 1x sheet). */
export const QUOIN_ICONS = { quoin: 0, moving_quoin: 16 };
const TYPE = 'energy';
/** The 1x quoin sheet (tools/quoin-art/build.mjs SHEET; that module renders on import). */
const SHEET = 'assets/sprites/quoin__x1_1_x1_2_x1_3_x1_4_x1_5_x1_6_x1_7_x1_8_png_1354829599.webp';
const PAGE_SIDE = 416; // tools/page-art/render.py
const K_MAX = 9;
const MAX_DIFF = 0.12;

const magick = (...args) => execFileSync('magick', args, { encoding: 'utf8' }).trim();

function main() {
  const dry = process.argv.includes('--dry');
  const data = JSON.parse(readFileSync(join(HERE, 'frames.json'), 'utf8'));
  const row = TYPES.indexOf(TYPE);
  const dir = mkdtempSync(join(tmpdir(), 'quoin-page-'));
  try {
    for (const [icon, f] of Object.entries(QUOIN_ICONS)) {
      const one = join(PUB, 'assets/sprites/icons', `${icon}.webp`);
      // The icon is the sheet cell trimmed: find where in the cell.
      const [, w, h, x, y] = /^(\d+)x(\d+)\+(\d+)\+(\d+)$/.exec(magick(join(PUB, SHEET), '-crop', `${FW}x${FH}+${f * FW}+${row * FH}`, '+repage', '-format', '%@', 'info:')).map(Number);
      const [iw, ih] = magick(one, '-format', '%w %h', 'info:').split(' ').map(Number);
      if (iw !== w || ih !== h) throw new Error(`${icon}: icon ${iw}x${ih}, cell trim ${w}x${h}`);
      const k = Math.min(K_MAX, Math.ceil(PAGE_SIDE / Math.max(w, h)));
      const svg = join(dir, `${icon}.svg`);
      writeFileSync(svg, sheetSvg(data, [{ type: TYPE, f, col: 0, row: 0 }], { cols: 1, rows: 1 }));
      const big = join(dir, `${icon}.png`);
      execFileSync('rsvg-convert', ['-w', String(FW * k), '-h', String(FH * k), '-f', 'png', '-o', big, svg]);
      const cut = join(dir, `${icon}-cut.png`);
      magick(big, '-crop', `${w * k}x${h * k}+${x * k}+${y * k}`, '+repage', '-strip', cut);
      const scores = ['white', 'black'].map((bg) => Number(/([0-9.]+)\)?$/.exec(execFileSync('magick', [
        '(', one, '-background', bg, '-flatten', ')',
        '(', cut, '-filter', 'Box', '-resize', `${w}x${h}!`, '-background', bg, '-flatten', ')',
        '-metric', 'RMSE', '-compare', '-format', '%[distortion]', 'info:'], { encoding: 'utf8' }))?.[1] ?? 1));
      const diff = Math.max(...scores);
      const rel = `assets/page-art/sprites/icons/${icon}@${k}x.webp`;
      console.log(`${icon}: frame ${f}, ${w * k}x${h * k} (${k}x), diff ${diff.toFixed(4)}${diff > MAX_DIFF ? ' REJECTED' : ''} -> ${rel}`);
      if (diff > MAX_DIFF || dry) continue;
      const dst = join(PUB, rel);
      mkdirSync(dirname(dst), { recursive: true });
      execFileSync('cwebp', ['-quiet', '-q', '90', '-alpha_q', '100', '-m', '6', '-exact', '-metadata', 'none', cut, '-o', `${dst}.tmp.webp`]);
      renameSync(`${dst}.tmp.webp`, dst);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

main();
