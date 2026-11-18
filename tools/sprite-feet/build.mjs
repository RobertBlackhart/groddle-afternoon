#!/usr/bin/env node
/**
 * Where each sprite's art stands in its cell (R12, G515, G583): the measured foot point that
 * js/sprite-feet.js puts on a sprite's x, y, so a Piggy, a Chicken, a vendor or a dropped crate
 * stands on its line instead of floating on the blank rows Tiny Speck's cells keep under the art,
 * and turns about the point under it instead of hopping.
 *
 * Glitch's own registration: the client put an item's SWF stage bottom centre on its point
 * (LocationItemstackView.as _positionViewDO 853-854, HandleSpecialConfigsCmd.as 153-154, the stage
 * size from ItemSSManager.as 638-642), and the avatar sheets carry their own feet
 * (AvatarSSManager.as 781-782, frame_offset_y). The OGA sheets we ship are cut to the art's
 * animation bounds, not to that stage, and nothing records where the stage was, so the foot is
 * measured from the art itself (tools/sprite-feet/measure.py: the lowest row of solid texels and
 * the middle of the art across it). Art that does keep Glitch's registration is not listed here:
 * the world art (tools/world-art/render.py trims each SWF state; art.json `lift`), the vector
 * avatar and NPC Glitch sheets (their own midX / feetY, js/avatar-pack.js), and street decos (the
 * street XML places a deco by its bottom centre, as the client did).
 *
 * Measured: every sheet tests/sheet-sources.js reads (game.js SHEETS and the js/ modules' sheets,
 * the clip's own cells), and every other 1x image under public/assets/sprites (the whole image).
 * A file sliced at two cell sizes gets one entry per size. Written: only feet off the cell's bottom
 * centre by a pixel or more (the rest stand right with the plain fallback).
 *
 *   node tools/sprite-feet/build.mjs           rewrite public/js/sprite-feet-data.js
 *   node tools/sprite-feet/build.mjs --check   exit 1 when it is behind the art or the sheets
 *
 * Needs python3.11 with Pillow and numpy (as tests/sheet-blank-cells.test.js). A sparse checkout
 * without some art may name a full tree to read the missing files from:
 * SPRITE_FEET_ART_FALLBACK=/path/to/public.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUB = join(ROOT, 'public');
const OUT = join(PUB, 'js', 'sprite-feet-data.js');
const SPRITES = 'assets/sprites';
/**
 * Folders under assets/sprites not measured: art that keeps Glitch's own registration (see the
 * header; overlays and the hi signs play at their SWF's registration from frames.json), and art
 * that never stands on a line (emotes, Encyclopedia and giant pictures, loading screens).
 */
const NOT_MEASURED = /^assets\/sprites\/(world|avatar|overlays|hi-signs|emotes|encyclopedia|giant-icons|giant-portraits|loading)\//;
/** Feet closer than this (1x px) to the cell's bottom centre are left to the fallback. */
const MIN_OFF = 1;

const fallback = process.env.SPRITE_FEET_ART_FALLBACK || '';
const fileOf = (rel) => {
  const own = join(PUB, rel);
  if (existsSync(own) || !fallback) return own;
  return join(fallback, rel);
};

function walk(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

async function sheetRows() {
  const { gameSheetTable, collectSheets } = await import('../../tests/sheet-sources.js');
  // Packed states (js/packed-sheets.js cutPackedFrames) keep their original OGA cell round each
  // cropped box: the foot is measured in that cell, as the sprite's frames are (orig and trim).
  const { PACKED_SHEETS } = await import('../../public/js/packed-sheets-data.js?v=192c6f15');
  const packed = new Map();
  for (const states of Object.values(PACKED_SHEETS)) {
    for (const d of Object.values(states)) packed.set(d.path, { x: d.at[0], y: d.at[1], w: d.cell[0], h: d.cell[1] });
  }
  return [...gameSheetTable(), ...(await collectSheets())].map((r) => (packed.has(r.path) && !r.trim ? { ...r, trim: packed.get(r.path) } : r));
}

/** One job per file and cell size: the clips cut from it at that size, their cells together. */
export async function jobs() {
  const byCut = new Map();
  for (const r of await sheetRows()) {
    const path = r.path.replace(/^\.?\//, '');
    if (!path.startsWith('assets/') || NOT_MEASURED.test(path)) continue;
    const density = r.density || 1;
    const cut = r.derive ? `d${r.derive.cols}x${r.derive.rows}` : `${r.trim?.w ?? r.fw}x${r.trim?.h ?? r.fh}`;
    const key = `${path}|${cut}`;
    const cells = r.cells ?? Array.from({ length: r.n }, (_, i) => (r.first || 0) + i);
    const job = byCut.get(key);
    if (job) {
      for (const c of cells) if (!job.cells.includes(c)) job.cells.push(c);
      continue;
    }
    byCut.set(key, { key, rel: path, fw: r.fw ?? null, fh: r.fh ?? null, cols: r.cols ?? null, cells: [...cells], derive: r.derive || null, density, trim: r.trim || null });
  }
  const sheets = new Set([...byCut.values()].map((j) => j.rel));
  // Every other image: a 1x file, or an @Nx file with no 1x twin; split 3x parts (.p1@3x) are not art of their own.
  const files = walk(join(PUB, SPRITES)).map((p) => relative(PUB, p).split('\\').join('/'));
  const have = new Set(files);
  for (const rel of files) {
    if (!/\.(webp|png)$/.test(rel) || /\.p\d+(@\d+x)?\.(webp|png)$/.test(rel)) continue;
    if (sheets.has(rel) || NOT_MEASURED.test(rel)) continue;
    const m = /@(\d+(?:\.\d+)?)x\.(webp|png)$/.exec(rel);
    if (m && have.has(rel.replace(/@\d+(?:\.\d+)?x\./, '.'))) continue;
    byCut.set(`${rel}|whole`, { key: `${rel}|whole`, rel, fw: null, fh: null, cols: null, cells: [0], derive: null, density: m ? Number(m[1]) : 1, trim: null });
  }
  return [...byCut.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

export function measureJobs(list) {
  const input = list
    .map((j) => ({ ...j, path: fileOf(j.rel) }))
    .filter((j) => existsSync(j.path));
  const missing = list.length - input.length;
  const out = execFileSync('python3.11', ['-I', join(ROOT, 'tools', 'sprite-feet', 'measure.py')], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  return { feet: JSON.parse(out), missing };
}

/**
 * The animal (or NPC, or machine) a sheet belongs to, so all its states share one foot x. Tiny
 * Speck cut every state of one NPC to the same box (the Chicken's walk, peck, sit and stand are all
 * 148 x 110), the box of one SWF stage, so the art keeps its place between states; a foot x per
 * state would slide the animal sideways each time it changes animation. A family is one cell size
 * and: the name before `_x1_` (OGA sheets, `npc_chicken__x1_walk_png_...`), a class named in
 * FAMILY_CLASSES (its sheets sit in two folders), else the sheet's folder (crabs/, craftybot/,
 * foxes/ hold one NPC's states each).
 */
const FAMILY_CLASSES = ['npc_chicken', 'npc_piggy', 'npc_butterfly', 'npc_batterfly'];
export function familyOf(rel, cut) {
  const name = rel.slice(rel.lastIndexOf('/') + 1);
  const cls = FAMILY_CLASSES.find((c) => name.startsWith(`${c}_`));
  if (cls) return `${cls}|${cut}`;
  const oga = /^(.*?)_{1,2}x1_/.exec(name);
  if (oga) return `${rel.slice(0, rel.lastIndexOf('/') + 1)}${oga[1]}|${cut}`;
  return `${rel.slice(0, rel.lastIndexOf('/') + 1)}|${cut}`;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const half = (v) => Math.round(v * 2) / 2;

/**
 * { path: [cell w, cell h, foot x, foot y] or a list of them (one per cell size) }, off-centre feet
 * only. y is each sheet's own (its feet on the line in every state); x the family's: its walk's
 * (an animal turns while it walks, so it turns on its feet), else the median of its states.
 */
export function table(list, feet) {
  const famX = new Map();
  for (const j of list) {
    const f = feet[j.key];
    if (!f) continue;
    if (j.key.endsWith('|whole')) continue;
    const fam = familyOf(j.rel, `${f[0]}x${f[1]}`);
    if (!famX.has(fam)) famX.set(fam, { all: [], walk: [] });
    famX.get(fam).all.push(f[2]);
    if (/walk/i.test(j.rel.slice(j.rel.lastIndexOf('/') + 1))) famX.get(fam).walk.push(f[2]);
  }
  const xOf = (fam) => {
    const row = famX.get(fam);
    return half(median(row.walk.length ? row.walk : row.all));
  };
  const rows = new Map();
  for (const j of list) {
    const f = feet[j.key];
    if (!f) continue;
    const [cw, ch, , fy] = f;
    // A whole image keeps its cell's middle: a still picture (a tree, a crate) stays where the street
    // put it; only a sheet's art (an animation, which turns) is mirrored about its own middle.
    const fx = j.key.endsWith('|whole') ? cw / 2 : xOf(familyOf(j.rel, `${cw}x${ch}`));
    if (Math.abs(fx - cw / 2) < MIN_OFF && ch - fy < MIN_OFF) continue;
    if (!rows.has(j.rel)) rows.set(j.rel, []);
    const cuts = rows.get(j.rel);
    if (!cuts.some((c) => c[0] === cw && c[1] === ch)) cuts.push([cw, ch, fx, fy]);
  }
  return [...rows.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}

export function render(rows) {
  const lines = rows.map(([rel, cuts]) => `  ${JSON.stringify(rel)}: ${JSON.stringify(cuts.length === 1 ? cuts[0] : cuts)},`);
  return `/**
 * Generated by tools/sprite-feet/build.mjs from the art (alpha >= 50%). Do not edit by hand.
 *
 * SPRITE_FEET[path] = [cell w, cell h, foot x, foot y] at 1x, or a list of them when the file is
 * cut at more than one cell size: where the art stands in its cell (the lowest solid row, and the
 * middle of the art across, the line a turn mirrors it about). Only feet off the cell's bottom centre are listed; js/sprite-feet.js
 * puts the foot on the sprite's point.
 */
export const SPRITE_FEET = Object.freeze({
${lines.join('\n')}
});
`;
}

async function main() {
  const check = process.argv.includes('--check');
  const list = await jobs();
  const { feet, missing } = measureJobs(list);
  if (missing) {
    console.error(`sprite-feet: ${missing} file(s) missing (a sparse checkout? set SPRITE_FEET_ART_FALLBACK)`);
    process.exit(2);
  }
  const text = render(table(list, feet));
  const old = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (check) {
    if (old !== text) {
      console.error('sprite-feet: public/js/sprite-feet-data.js is behind the art; run node tools/sprite-feet/build.mjs');
      process.exit(1);
    }
    console.log(`sprite-feet: up to date (${list.length} cuts measured)`);
    return;
  }
  if (old !== text) writeFileSync(OUT, text);
  console.log(`sprite-feet: ${list.length} cuts measured, ${table(list, feet).length} files off centre${old === text ? ' (unchanged)' : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
