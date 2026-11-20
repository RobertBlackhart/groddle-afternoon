#!/usr/bin/env node
/**
 * #563: the eleven Giants' symbols as carved on their shrines, cut from Tiny Speck's own vector
 * shrine art (CC0 glitch-items shrines/npc_shrine_base/npc_shrine_<giant>.swf). Every base shrine
 * SWF carries all eleven symbols as their own DefineShapes (each a dark carving, #71675b, and a
 * light edge, #dccab2); the shrine shows its Giant's. This exports them with FFDec and keeps the
 * carving path of each, so the symbol reads as one flat shape at icon size, as the client's own
 * flat giant_<name>.png symbols did in the favor window (FavorProgressUI.as 120-121).
 *
 * Which shape is which Giant: the shape ids of npc_shrine_lem.swf (SHAPE_IDS), checked once
 * against the client's giant_<name>.png silhouettes (TSEngineAssets/src/assets/graphics): each
 * carving's best match is its own Giant, and no two share one (2026-11-20). The other base SWFs
 * hold the same eleven shapes under other ids.
 *
 * Writes public/assets/sprites/giant-symbols/<giant>.svg (the game's Giant ids: ti for Tii).
 * Needs Java and FFDec (tools/java.mjs, tools/vector-sprites/swf-labels.mjs FFDEC).
 * Run: node tools/giant-symbols/build.mjs [--work=<dir>]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JAVA } from '../java.mjs';
import { FFDEC } from '../vector-sprites/swf-labels.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const ITEMS = join(os.homedir(), 'Documents/glitch-audit/glitch-items');
const SWF = join(ITEMS, 'shrines/npc_shrine_base/npc_shrine_lem/npc_shrine_lem.swf');
const OUT = join(ROOT, 'public/assets/sprites/giant-symbols');

/** DefineShape id in npc_shrine_lem.swf -> Giant. */
export const SHAPE_IDS = Object.freeze({
  alph: 19, cosma: 17, friendly: 15, grendaline: 13, humbaba: 11, lem: 21, mab: 9, pot: 7, spriggan: 5, ti: 3, zille: 1,
});

/** The carving's colour in the SWF, kept as the file's fill (style.css tints it through a mask). */
export const CARVING = '#71675b';

/** FFDec's SVG of one shape -> a plain SVG of its carving path alone. Pure. */
export function carvingSvg(svg, giant) {
  const num = (re) => {
    const m = svg.match(re);
    if (!m) throw new Error(`${giant}: no ${re}`);
    return m.slice(1).map(Number);
  };
  const [w] = num(/width="([\d.]+)px"/);
  const [h] = num(/height="([\d.]+)px"/);
  const [tx, ty] = num(/matrix\(1\.0, 0\.0, 0\.0, 1\.0, ([-\d.]+), ([-\d.]+)\)/);
  const paths = [...svg.matchAll(/<path d="([^"]+)" fill="(#[0-9a-f]{6})"/gi)];
  const carving = paths.filter((p) => p[2].toLowerCase() === CARVING);
  if (carving.length !== 1) throw new Error(`${giant}: ${carving.length} carving paths`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`
    + `<path transform="translate(${tx} ${ty})" d="${carving[0][1]}" fill="${CARVING}" fill-rule="evenodd"/></svg>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const workArg = process.argv.find((a) => a.startsWith('--work='));
  const work = resolve(workArg ? workArg.slice(7) : join(os.tmpdir(), 'giant-symbols'));
  if (!existsSync(join(work, `${SHAPE_IDS.lem}.svg`))) {
    mkdirSync(work, { recursive: true });
    execFileSync(JAVA, ['-jar', FFDEC, '-format', 'shape:svg', '-export', 'shape', work, SWF], { stdio: 'ignore' });
  }
  mkdirSync(OUT, { recursive: true });
  for (const [giant, id] of Object.entries(SHAPE_IDS)) {
    const svg = carvingSvg(readFileSync(join(work, `${id}.svg`), 'utf8'), giant);
    writeFileSync(join(OUT, `${giant}.svg`), svg);
    console.log(`${giant}: shape ${id}, ${svg.length} bytes`);
  }
}
