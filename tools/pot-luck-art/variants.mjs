// Pot Luck Day chicken costumes (G982), made by editing the chicken FLA's parsed symbols in
// memory (Tiny Speck's npc_chicken.fla, CC0, glitch-items; the file on disk is never touched).
// Ours, not Tiny Speck's: a parts edit of the chicken rig, drawn as Glitch drew (flat fills,
// shading as a second darker shape, no strokes, colours from the chicken's own palette and
// darker or lighter steps of them; research/seasonal/pot-luck-day-plan.md section 2).
//   chicken         Tiny Speck's chicken as is
//   turkey_tailfan  a paper-plate turkey tail fan tied on behind, the wattle a little fuller
//                   (the prototype's 'costume' variant, research/seasonal/pot-luck-day, 2026-10-28)
//   rooster_plume   a taller comb and a tall sweeping tail plume of long sickle feathers
// Every clip, pose and timing stays the chicken's: the edits replace or add art inside the
// part symbols, so the rig's transforms carry them through every frame of both rigs (Chicken_*
// and new_Chicken*, the FLA's idle and rooked frames hand over to the second).
import { loadFla } from '../overlay-art/xfl-svg.mjs';

export const COSTUMES = Object.freeze(['turkey_tailfan', 'rooster_plume']);

const ID = [1, 0, 0, 1, 0, 0];
const mul = (p, q) => [p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1], p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3], p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5]];
const rot = (deg) => { const a = (deg * Math.PI) / 180; return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]; };
const tr = (x, y) => [1, 0, 0, 1, x, y];
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 1];
const f2 = (v) => Math.round(v * 100) / 100;

/** A flat-filled shape element from [[colour, d], ...] (Glitch: flat fills, no strokes). */
function shape(parts, m = ID) {
  const fills = new Map();
  const paths = [];
  parts.forEach(([c, d], i) => { fills.set(i + 1, { t: 's', c: rgb(c) }); paths.push([i + 1, d]); });
  return { k: 'shape', m, fills, paths, strokeStyles: new Map(), strokes: new Map() };
}
const poly = (pts) => 'M' + pts.map(([x, y]) => `${f2(x)} ${f2(y)}`).join('L') + 'Z';

/** One straight feather along +x, length L, width W; bands [[u0, u1, colour]]; a darker lower half for shading. */
function feather(L, W, { base, shade, bands = [] }) {
  const hw = (u) => (W / 2) * Math.pow(Math.sin(Math.PI * Math.min(Math.max(u, 0), 1)), 0.55) * (0.5 + 0.5 * u);
  const N = 28;
  const edge = (u0, u1, side) => Array.from({ length: N + 1 }, (_, i) => { const u = u0 + ((u1 - u0) * i) / N; return [u * L, side * hw(u)]; });
  const strip = (u0, u1) => poly([...edge(u0, u1, -1), ...edge(u0, u1, 1).reverse()]);
  const lower = (u0, u1) => poly([...edge(u0, u1, 0), ...edge(u0, u1, 1).reverse()]);
  const parts = [[base, strip(0, 1)], [shade, lower(0, 1)]];
  for (const [u0, u1, c] of bands) parts.push([c, strip(u0, u1)]);
  return parts;
}

/** A fan of feathers radiating from (ox, oy): angles in degrees (screen space, -90 = up). */
function fan({ ox, oy, from, to, count, L, W, style }) {
  const els = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    els.push(shape(feather(L, W, style(i, t)), mul(tr(ox, oy), rot(from + (to - from) * t))));
  }
  return els;
}

/** The paper plate's feathers: orange, red, yellow and brown card (Glitch's warm crop colours). */
const PAPER = ['#E8833A', '#D9473A', '#F2C14E', '#9A6A43', '#E8833A', '#D9473A', '#F2C14E', '#9A6A43', '#E8833A'];

/** Turkey Tailfan: a paper-plate half circle with paper feathers glued round it, behind the bird's own tail. */
function tailfan() {
  const paper = fan({ ox: -3, oy: 2, from: 182, to: 300, count: 9, L: 24, W: 8,
    style: (i) => ({ base: PAPER[i], shade: PAPER[i], bands: [[0.88, 1, '#F7EFDC']] }) });
  return [...paper, shape([['#E9D7B0', 'M-15 4 A12 12 0 0 1 9 4 Z'], ['#CDB585', 'M-15 4 L9 4 L8 5.4 L-14 5.4 Z']])];
}

/** A point on the cubic bezier p0..p3 at t, and its unit normal. */
function bez(p, t) {
  const u = 1 - t;
  const x = u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0];
  const y = u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1];
  const dx = 3 * u * u * (p[1][0] - p[0][0]) + 6 * u * t * (p[2][0] - p[1][0]) + 3 * t * t * (p[3][0] - p[2][0]);
  const dy = 3 * u * u * (p[1][1] - p[0][1]) + 6 * u * t * (p[2][1] - p[1][1]) + 3 * t * t * (p[3][1] - p[2][1]);
  const n = Math.hypot(dx, dy) || 1;
  return [x, y, -dy / n, dx / n];
}

/**
 * One long curved sickle feather along the bezier `spine`, `W` wide at its widest, its far half
 * a darker step (the shading shape) and a light quill line down the middle third.
 */
function sickle(spine, W, { base, shade, sheen }) {
  const N = 36;
  const hw = (u) => (W / 2) * Math.pow(Math.sin(Math.PI * Math.min(Math.max(u, 0.02), 1)), 0.7) * (0.45 + 0.55 * (1 - u * 0.6));
  const side = (u0, u1, s) => Array.from({ length: N + 1 }, (_, i) => {
    const u = u0 + ((u1 - u0) * i) / N;
    const [x, y, nx, ny] = bez(spine, u);
    return [x + nx * hw(u) * s, y + ny * hw(u) * s];
  });
  const parts = [[base, poly([...side(0, 1, -1), ...side(0, 1, 1).reverse()])]];
  parts.push([shade, poly([...side(0, 1, 0), ...side(0, 1, 1).reverse()])]);
  if (sheen) parts.push([sheen, poly([...side(0.2, 0.75, -0.55), ...side(0.2, 0.75, -0.2).reverse()])]);
  return shape(parts);
}

/** Rooster Plume: long sickle feathers sweeping up and back over the tail, then down. */
const PLUME = [
  // [spine control points (the tail symbol's space: back is -x, up is -y), width, style]
  [[[-2, 2], [-6, -20], [-26, -30], [-38, -12]], 5.2, { base: '#3A260A', shade: '#2A1B07', sheen: '#51350D' }],
  [[[-2, 2], [-4, -26], [-30, -40], [-44, -20]], 5.6, { base: '#51350D', shade: '#3A260A', sheen: '#6E4A16' }],
  [[[-1, 2], [0, -28], [-24, -46], [-40, -34]], 5.4, { base: '#993300', shade: '#7A2900', sheen: '#E3571C' }],
  [[[0, 2], [4, -24], [-14, -44], [-30, -42]], 5.0, { base: '#3A260A', shade: '#2A1B07', sheen: '#51350D' }],
  [[[0, 2], [6, -18], [-6, -36], [-20, -38]], 4.6, { base: '#51350D', shade: '#3A260A', sheen: '#6E4A16' }],
  [[[-2, 3], [-10, -10], [-22, -14], [-30, -2]], 4.4, { base: '#993300', shade: '#7A2900', sheen: '#E3571C' }],
];
function plume() {
  return PLUME.map(([spine, w, style]) => sickle(spine, w, style));
}

function* allEls(els) { for (const e of els) { yield e; if (e.k === 'group') yield* allEls(e.members); } }

/** Replace what a symbol draws on every keyframe, keeping its timing; keep: draw ours behind its own art. */
function replaceArt(tl, els, keep = false) {
  tl.layers.forEach((L, j) => L.frames.forEach((f) => {
    if (keep) { if (j === 0) f.els = [...els, ...f.els]; return; }
    f.els = j === 0 ? els : [];
    f.tween = null;
  }));
}

/** Scale a symbol's art about a point (sx, sy: wider, taller). */
function scaleArt(tl, sx, sy, [px, py]) {
  const S = mul(tr(px, py), mul([sx, 0, 0, sy, 0, 0], tr(-px, -py)));
  for (const L of tl.layers) for (const f of L.frames) f.els = f.els.map((e) => (e.m ? { ...e, m: mul(S, e.m) } : e));
}

/** The bottom middle of what a symbol draws on its first frame (its base, to grow it upward). */
function baseOf(tl) {
  let x0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const L of tl.layers) for (const e of allEls(L.frames[0]?.els || [])) {
    if (e.k !== 'shape') continue;
    for (const [, d] of e.paths) for (const m of String(d).matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)) {
      const [a, b, c, dd, tx, ty] = e.m || ID;
      const x = a * Number(m[1]) + c * Number(m[2]) + tx;
      const y = b * Number(m[1]) + dd * Number(m[2]) + ty;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  return Number.isFinite(y1) ? [(x0 + x1) / 2, y1] : [0, 0];
}

const TAIL = /^(new_)?Chicken_feathers_brown$|TailBigContainer$/;
const WATTLE = /^(new_)?Chicken_comb_bottom$|CombBottom$/;
const COMB = /^(new_)?Chicken_comb_top$|CombTopFrames$/;

export const CHICKEN_FLA_PATH = 'inhabitants/chicken/npc_chicken.fla';

/** The chicken FLA, edited for one costume ('chicken' leaves it as Tiny Speck drew it). */
export function makeVariant(kind, fla) {
  if (kind === 'chicken') return fla;
  const symbols = structuredClone(fla.symbols);
  const v = { ...fla, symbols };
  const each = (re, fn) => { for (const [n, tl] of symbols) if (re.test(n)) fn(tl, n); };
  if (kind === 'turkey_tailfan') {
    each(WATTLE, (tl) => scaleArt(tl, 1.45, 1.45, [0, 0]));
    each(TAIL, (tl) => replaceArt(tl, tailfan(), true));
  } else if (kind === 'rooster_plume') {
    each(COMB, (tl) => scaleArt(tl, 1.15, 1.9, baseOf(tl)));
    each(WATTLE, (tl) => scaleArt(tl, 1.2, 1.3, [0, 0]));
    each(TAIL, (tl) => replaceArt(tl, plume(), true));
  } else {
    throw new Error(`no costume ${kind}`);
  }
  return v;
}

/** A one-frame timeline holding `els` (to draw a part, or our own shapes, alone). */
function timelineOf(name, els) {
  return { name, layers: [{ i: 0, name: 'art', type: 'normal', parent: null, visible: true,
    frames: [{ index: 0, duration: 1, tween: null, accel: 0, curves: null, single: true, rotate: 'auto', turns: 0, label: null, acts: [], els }] }],
    frameCount: 1, labels: new Map(), scripts: new Map() };
}
const inst = (lib, m = ID) => ({ k: 'inst', lib, type: 'graphic', loop: 'single frame', first: 0, m, tp: [0, 0], ct: null, glow: [] });

const hex = ([r, g, b]) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
function recolour(tl, map) {
  for (const L of tl.layers) for (const f of L.frames) for (const e of allEls(f.els)) {
    if (e.k !== 'shape') continue;
    for (const [i, fill] of e.fills) if (fill?.t === 's' && map[hex(fill.c)]) e.fills.set(i, { t: 's', c: [...rgb(map[hex(fill.c)]).slice(0, 3), fill.c[3]] });
  }
}

/** The Fancy Feather: the chicken's own loose feather (Chicken_feather_loose) in harvest card colours. */
const FANCY = { '#FFFFFF': '#E8833A', '#CCCCCC': '#D9473A', '#51350D': '#51350D' };

/**
 * A pack icon's art as SVG text (in a generous box; the builder fits it): the paper fan, the
 * plume, or the recoloured loose feather. `frameSvg` is tools/overlay-art/xfl-svg.mjs's.
 */
export function iconArt(cls, fla, frameSvg) {
  let els;
  const symbols = structuredClone(fla.symbols);
  if (cls === 'turkey_tailfan') els = tailfan();
  else if (cls === 'rooster_plume') els = plume();
  else if (cls === 'fancy_feather') {
    recolour(symbols.get('Chicken_feather_loose'), FANCY);
    els = [inst('Chicken_feather_loose', mul([2.2, 0, 0, 2.2, 0, 0], rot(-35)))];
  } else throw new Error(`no icon for ${cls}`);
  const view = { ...fla, symbols, main: timelineOf('main', els) };
  return frameSvg(view, 0, { scale: 4, box: [-60, -60, 120, 120] });
}

export { loadFla };
