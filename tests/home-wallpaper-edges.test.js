/**
 * Root R27 / G1028 (#508): house and tower rooms lay Tiny Speck's 150 px wallpaper, floor and
 * ceiling pieces edge to edge (js/home-wallpaper.js roomPieces). A piece whose art fades out in
 * its outermost pixels lets the room's dark backdrop through as a hairline where it meets the next
 * piece (woodpanel_1_floor_left's last column was 57% opaque at 2x, 31% at 3x). The build
 * (tools/home-wallpaper/build.py bleed_edges) fills those edges; this test reads every shipped
 * piece at every scale and fails on a joining edge that falls short of the art beside it.
 *
 * The edges mirror build.py joining_edges: wallpaper runs join on all four sides (each other,
 * the floor under and the ceiling over), floor runs left, right and top, ceiling runs left, right
 * and bottom, a floor's `left` piece only on its inner side; the attic, basement, tower base and
 * the repeated 1500 px frame strip side by side. End caps, swatches and shadows join nothing.
 *
 * Pixels come from `dwebp -pam` (libwebp's decoder); the test skips where it is not installed.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { execFile, execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { WALLPAPER_MAPS, WALLPAPER_PIECES } from '../public/js/home-wallpaper-art.js?v=129c514f';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'public', 'assets', 'homes', 'wallpaper');
const run = promisify(execFile);

/** build.py SHELL_JOINS. */
const SHELL_JOINS = {
  attic_end_left: 'R',
  attic_tile: 'LR',
  attic_end_right: 'L',
  crosssection_ground_end_left_groddle1: 'R',
  crosssection_ground_tile_groddle1: 'LR',
  crosssection_ground_end_right_groddle1: 'L',
  crosssection_horizontal_1500px_groddle1: 'LR',
  towerbase_wallpaper_wall: 'LR',
  towerbase_wallpaper_wall_2: 'LR',
};
/** build.py SEAM_DEFICIT: mean alpha steps an edge line may sit under the art 2 placed px inward. */
const SEAM_DEFICIT = 1.0;

/** build.py joining_edges: piece -> Set of 'L' | 'R' | 'T' | 'B'. */
function joiningEdges(maps) {
  const out = new Map();
  const join = (piece, edges) => {
    const set = out.get(piece) || new Set();
    for (const e of edges) set.add(e);
    out.set(piece, set);
  };
  for (const [kind, rows] of Object.entries(maps)) {
    for (const row of Object.values(rows)) {
      for (const [field, val] of Object.entries(row)) {
        const [piece, flag] = String(val).split(',');
        if (kind === 'walls' && !['left', 'right', 'left_open', 'swatch'].includes(field)) join(piece, 'LRTB');
        else if (kind === 'floors' && field.startsWith('main')) join(piece, 'LRT');
        else if (kind === 'floors' && field === 'left') join(piece, flag === 'FLIP' ? 'L' : 'R');
        else if (kind === 'ceilings' && field.startsWith('main')) join(piece, 'LRB');
      }
    }
  }
  for (const [piece, edges] of Object.entries(SHELL_JOINS)) join(piece, edges);
  return out;
}

/** Alpha of line `k` inward from `side` of an RGBA image (width w, height h). */
function edgeLine({ w, h, rgba }, side, k) {
  const vertical = side === 'L' || side === 'R';
  const n = vertical ? h : w;
  const line = new Uint8Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = side === 'L' ? k : side === 'R' ? w - 1 - k : i;
    const y = side === 'T' ? k : side === 'B' ? h - 1 - k : i;
    line[i] = rgba[(y * w + x) * 4 + 3];
  }
  return line;
}

/** build.py edge_deficit: mean alpha steps the edge line falls short of `ref` (capped at 250). */
function edgeDeficit(edge, ref) {
  let sum = 0;
  for (let i = 0; i < edge.length; i += 1) sum += Math.max(0, Math.min(ref[i], 250) - edge[i]);
  return sum / edge.length;
}

function parsePam(buf) {
  const end = buf.indexOf('ENDHDR\n');
  const head = buf.subarray(0, end).toString('latin1');
  const num = (key) => Number(new RegExp(`^${key} (\\d+)$`, 'm').exec(head)?.[1]);
  const w = num('WIDTH');
  const h = num('HEIGHT');
  assert.equal(num('DEPTH'), 4, 'dwebp -pam writes RGBA');
  return { w, h, rgba: buf.subarray(end + 7, end + 7 + w * h * 4) };
}

let dwebp = true;
try {
  execFileSync('dwebp', ['-version'], { stdio: 'ignore' });
} catch {
  dwebp = false;
}

describe('home wallpaper pieces: joining edges are as opaque as the art beside them (R27, #508)', () => {
  const joins = joiningEdges(WALLPAPER_MAPS);

  it('knows which edges join: a floor left piece only inward, runs on every side, caps on none', () => {
    assert.deepEqual([...joins.get('woodpanel_1_floor_left')], ['R']);
    assert.deepEqual([...joins.get('woodpanel_1_floor')].sort(), ['L', 'R', 'T']);
    assert.deepEqual([...joins.get('marble_floor')].sort(), ['L', 'R', 'T']);
    assert.deepEqual([...joins.get('hell_floor_2')].sort(), ['L', 'R', 'T']);
    assert.equal(joins.has('darktealbaseboard_molding_left'), false, 'an end cap meets nothing edge to edge');
    for (const piece of joins.keys()) assert.ok(WALLPAPER_PIECES[piece], `${piece} ships`);
    assert.ok(joins.size > 250, `${joins.size} joining pieces`);
  });

  it('a faded edge line fails, texture noise and art transparent all the way in pass', () => {
    const opaque = new Uint8Array(100).fill(255);
    assert.ok(edgeDeficit(new Uint8Array(100).fill(146), opaque) > SEAM_DEFICIT, '57% opaque edge (#508 @2x)');
    const noisy = opaque.slice();
    noisy[3] = 233;
    noisy[40] = 240;
    assert.ok(edgeDeficit(noisy, opaque) <= SEAM_DEFICIT, 'a few textured pixels');
    const stripe = new Uint8Array(100).fill(70);
    assert.ok(edgeDeficit(stripe, stripe) <= SEAM_DEFICIT, 'a translucent row of the art itself');
    assert.ok(edgeDeficit(new Uint8Array(100).fill(250), opaque) <= SEAM_DEFICIT, '98% is opaque');
  });

  it('every shipped piece at 2x and 3x', { skip: dwebp ? false : 'no dwebp (libwebp)', timeout: 300_000 }, async () => {
    const jobs = [];
    for (const [piece, edges] of joins) {
      for (const scale of [2, 3]) {
        if (scale === 3 && WALLPAPER_PIECES[piece]?.[2] !== 1) continue;
        const file = join(DIR, `${piece}@${scale}x.webp`);
        assert.ok(existsSync(file), `${piece}@${scale}x.webp ships`);
        jobs.push({ piece, scale, edges, file });
      }
    }
    const weak = [];
    let checked = 0;
    let next = 0;
    async function worker() {
      while (next < jobs.length) {
        const job = jobs[next++];
        const { stdout } = await run('dwebp', ['-quiet', '-pam', job.file, '-o', '-'], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024, timeout: 60_000 });
        const img = parsePam(stdout);
        const depth = 2 * job.scale; // 2 placed px inward
        for (const side of job.edges) {
          const deficit = edgeDeficit(edgeLine(img, side, 0), edgeLine(img, side, depth));
          checked += 1;
          if (deficit > SEAM_DEFICIT) weak.push(`${job.piece}@${job.scale}x ${side}: ${deficit.toFixed(1)} alpha steps under the art inward`);
        }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    assert.ok(checked > 1000, `${checked} joining edges checked`);
    assert.deepEqual(weak.sort(), [], 'rebuild with tools/home-wallpaper/build.py (bleed_edges)');
  });
});
