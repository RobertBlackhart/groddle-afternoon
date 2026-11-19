/**
 * G916 (#446): where a street's Mortar Barnacles go when no picture of the street shows them.
 *
 * Glitch set every barnacle by hand (mortar_barnacle.js obey_physics false) and the location
 * files only count them (LA9T7IFRDIA2N0K.xml lists eight Mortar Barnacle objrefs with no x or y;
 * the item files that held the positions were never archived). The 201 barnacles measured on
 * players' 2012 snaps (assets/content/barnacle-spots.json, tools/snap-placements/barnacles.py)
 * show the habit this rule copies:
 *  - all but two sit in front of a wooden wall of the street's own art: a bottle tree's body or
 *    window (99), its legs and root pipes (53), a sprout (10), and the like; none rests on a floor;
 *  - the art's bottom edge 41 to 128 px over the floor in front (the middle half 59 to 105, median
 *    81), so a Glitch standing on that floor scrapes it, and almost never under a ledge.
 * So for each wall deco of those kinds over a floor (BARNACLE_WALL_DECO), it takes spots on the
 * deco's middle, BARNACLE_LIFTS over the floor, with no ledge between, clear of signposts, doors and
 * ladder feet. Where a street has too few, the next tiers are any big deco of the middleground over
 * a floor, then the underside of a low ledge (a line solid from below, 90 to 170 px over a floor),
 * then the floor itself (flagged: the old fallback).
 * Spots are spread along the street: the farthest from those already taken, left to right on ties,
 * so the result depends only on the street. Pure (no Pixi, no DOM).
 *
 * G936 (Austin 2026-11-17, Konka Brink): with the art's masks (opts.masks, measured from the deco art
 * by tools/build-barnacle-wall-spots.mjs --measure), a wall spot counts only where the barnacle's
 * art sits on the wall's drawn art (its alpha, through the deco's flip and rotation; a box held
 * spots in the air beside a pipe and on a log turned 80 degrees), with no ground art (front_ground,
 * ground_generic, grass and the like) of a nearer layer, or later in the wall's own layer, drawn over
 * it: a barnacle there reads as lying on the dirt. A spot hanging over the art's edge slides in until
 * it sits on it (SEAT_MAX). On the outer part of a round wall (a sprout, a bottle tree's body) a
 * barnacle faces outward and sits a few px in (ROUND_NUDGE). The barnacle art opens to the left
 * (BARNACLE_VARIANT_FACES: blister1/3/5 open to the left, 2/4/6 to the right), so on the left part it stays as
 * drawn and on the right part it is mirrored (`mirror: true`). Without masks the rule is G916's.
 */
import { platformsScreen, isStandable } from './street-model.js?v=a9a05f9d';

/** The wall art barnacles sat on in the measured streets (sprite stems). */
export const BARNACLE_WALL_DECO = /^(background_)?bottletree|^legs_|^ground_rootpipe|^sprout/;
/** Bottom of the barnacle art over the floor in front, tried in this order (the measured middle half first). */
export const BARNACLE_LIFTS = Object.freeze([80, 60, 100, 45, 120]);
/** Mortar Barnacle art height (resource-nodes.js mortar_barnacle frames are 39-47 px). */
const ART_H = 44;
/** Two barnacles at least this far apart (px). */
export const BARNACLE_GAP = 70;
/**
 * G936: with masks, a street whose walls hold too few at BARNACLE_GAP closes them up to this before
 * any goes on the floor (Konka Brink: its rotated log and the air beside its pipe no longer count).
 */
export const BARNACLE_GAP_CLOSE = 48;
const SAMPLE_PX = 16;
const LIFT_MIN = Math.min(...BARNACLE_LIFTS) - 4;
const LIFT_MAX = Math.max(...BARNACLE_LIFTS) + 6;
/**
 * G936: ground art that, drawn over a wall, makes a barnacle there read as lying on the floor
 * (ground_rootpipe is a wall, not ground).
 */
export const GROUND_COVER_DECO = /^(front_ground|foreground|ground_(?!rootpipe)|grass|stone_moss|soil_|crosssection_|bg2_mudflat|platform_|walkway|floor$|firebog_puddle|(decor_)?plants\d)/;
/**
 * G936: walls whose art ends in a foot on the floor (a legs deco's moss, a root pipe's mound of dirt):
 * their bottom WALL_FOOT_SHARE is ground, not wall.
 */
export const WALL_FOOT_DECO = /^legs_|^ground_rootpipe/;
export const WALL_FOOT_SHARE = 0.15;
/**
 * G936: which way each blister variant's art faces (its open mouth): the full state of
 * mortar-barnacle-blister1/3/5 opens to the left, 2/4/6 to the right (Austin 2026-11-17: the
 * edge barnacles on Konka Brink's second sprout faced in because the rule took every variant as left).
 * Glitch never mirrored a barnacle (itemstacks are not flipped); facing outward is the remake's polish.
 */
export const BARNACLE_VARIANT_FACES = Object.freeze({ 1: 'left', 2: 'right', 3: 'left', 4: 'right', 5: 'left', 6: 'right' });

/** G936: round walls, whose outer barnacles turn to face outward (the root pipes are round barrels too: Austin 2026-11-17, Konka Brink). */
export const ROUND_WALL_DECO = /^(background_)?sprout|^(background_)?bottletree_body|^ground_rootpipe/;
/** G936: points of the barnacle art (from its bottom centre) that must sit on the wall's art: its shell, less the frame's rim. */
export const BARNACLE_CORE = Object.freeze({ xs: Object.freeze([-8, -4, 0, 4, 8]), ys: Object.freeze([-36, -28, -20, -12, -6]) });
/** G936: how far a spot hanging over the wall art's edge may slide in to sit on it (px), in steps of SEAT_STEP. */
export const SEAT_MAX = 32;
const SEAT_STEP = 2;
/** G936: the outer part of a round wall: past this share of its half width from the middle, at the barnacle's height. */
export const ROUND_OUTER = 0.4;
/** G936: an outer barnacle on a round wall sits this many px further in (Austin: "bump them a few pixels"). */
export const ROUND_NUDGE = 6;
const MAX_SLOPE = 0.4;
const RESERVED_PAD = 50;

function floorAt(p, x) {
  if (x < p.x1 || x > p.x2) return null;
  if (p.x2 === p.x1) return p.y1;
  return p.y1 + ((p.y2 - p.y1) * (x - p.x1)) / (p.x2 - p.x1);
}

/** Every line crossing x, with its y there. */
function linesAt(plats, x) {
  const out = [];
  for (const p of plats) {
    const y = floorAt(p, x);
    if (y != null) out.push({ p, y });
  }
  return out;
}

const slopeOf = (p) => (p.x2 === p.x1 ? Infinity : Math.abs((p.y2 - p.y1) / (p.x2 - p.x1)));

/**
 * Floors a Glitch can stand on at x: standable, not steep. A floor counts when no other
 * standable floor lies within `clear` px over it (so there is room to stand).
 */
function floorsAt(lines, clear = 60) {
  const floors = lines.filter(({ p }) => isStandable(p) && slopeOf(p) <= MAX_SLOPE);
  return floors.filter((f) => !floors.some((g) => g !== f && g.y < f.y && f.y - g.y < clear));
}

/** Nothing solid between the barnacle art and the floor in front of it, and none across the art. */
function openAbove(lines, floorY, top) {
  return !lines.some(({ y }) => y < floorY - 2 && y > top - 4);
}

/**
 * The art in the avatars' plane: the middleground (world coordinates) and every street-sized layer
 * at z -1 to 1 (layer coordinates, which street-render.js parallaxLayerOffset leaves on the
 * middleground); on a street whose middleground holds no art (its plane drawn in T_ layers), z -2
 * too. 190 of the measured barnacles sit on middleground art, 10 on a z 1 layer.
 */
function planeDecos(street) {
  const b = street?.bounds || { l: 0, t: 0, r: 0, b: 0 };
  const W = b.r - b.l;
  const H = b.b - b.t;
  const layers = street?.layers || [];
  const mg = layers.find((l) => l.id === 'middleground' || l.name === 'middleground');
  const minZ = mg?.decos?.length ? -1 : -2;
  const out = [];
  layers.forEach((layer, li) => {
    const isMg = layer === mg;
    if (!isMg && !(Math.abs(layer.w - W) <= 2 && Math.abs(layer.h - H) <= 2 && layer.z >= minZ && layer.z <= 1)) return;
    // lz, order: the draw order (street-render.js: layers by z, then decos by z, then as listed).
    (layer.decos || []).forEach((d, order) => {
      out.push({ d, x: isMg ? d.x - b.l : d.x, y: isMg ? d.y - b.t : d.y, lz: layer.z ?? li, order });
    });
  });
  return out;
}

const MASK_BITS = new WeakMap();

/** PURE (G936): a mask { w, h, d } (cols, rows, base64 bits row-major, 1 = drawn) as its bytes. */
function maskBits(mask) {
  let bytes = MASK_BITS.get(mask);
  if (!bytes) {
    const bin = typeof atob === 'function' ? atob(mask.d) : Buffer.from(mask.d, 'base64').toString('binary');
    bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    MASK_BITS.set(mask, bytes);
  }
  return bytes;
}

/**
 * PURE (G936): whether the deco's drawn art covers street point (px, py). The deco is drawn as
 * street-render.js draws it: anchor bottom centre at (x, y), sized w x h, mirrored by `flip`, turned
 * `r` degrees about the anchor. `mask` undefined: no mask measured, so the deco's box counts.
 * maxV: only the art above that share of its height (from the top) counts.
 */
export function decoCovers(deco, x, y, mask, px, py, maxV = 1) {
  const w = Number(deco.w) || 0;
  const h = Number(deco.h) || 0;
  if (!(w > 0 && h > 0) || mask === null) return false;
  const a = (-(Number(deco.r) || 0) * Math.PI) / 180;
  const dx = px - x;
  const dy = py - y;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  const u = deco.flip ? 0.5 - lx / w : 0.5 + lx / w;
  const v = 1 + ly / h;
  if (!(u >= 0 && u < 1 && v >= 0 && v < maxV)) return false;
  if (mask === undefined) return true;
  const bits = maskBits(mask);
  const i = Math.floor(v * mask.h) * mask.w + Math.floor(u * mask.w);
  return ((bits[i >> 3] >> (7 - (i & 7))) & 1) === 1;
}

const maskOf = (masks, sprite) => (Object.prototype.hasOwnProperty.call(masks, sprite) ? masks[sprite] : undefined);

/** G936: whether a barnacle at (x, y) sits on the wall's art with no ground art drawn over it there. */
function seatsOn(wall, covers, masks, x, y) {
  const mask = maskOf(masks, wall.sprite);
  const maxV = WALL_FOOT_DECO.test(String(wall.sprite || '')) ? 1 - WALL_FOOT_SHARE : 1;
  for (const oy of BARNACLE_CORE.ys) {
    for (const ox of BARNACLE_CORE.xs) {
      const px = x + ox;
      const py = y + oy;
      if (!decoCovers(wall.d, wall.x, wall.y, mask, px, py, maxV)) return false;
      for (const c of covers) if (decoCovers(c.d, c.x, c.y, maskOf(masks, c.d.sprite), px, py)) return false;
    }
  }
  return true;
}

/** G936: the wall art's drawn run at height py through x: { l, r } (street px), or null off the art. */
function artRun(wall, masks, x, py) {
  const mask = maskOf(masks, wall.sprite);
  const on = (px) => decoCovers(wall.d, wall.x, wall.y, mask, px, py);
  if (!on(x)) return null;
  const reach = Math.max(Number(wall.d.w) || 0, Number(wall.d.h) || 0);
  let l = x;
  let r = x;
  while (l > x - reach && on(l - 1)) l -= 1;
  while (r < x + reach && on(r + 1)) r += 1;
  return { l, r };
}

function decoBoxes(street, test) {
  const out = [];
  for (const entry of planeDecos(street)) {
    const { d, x, y } = entry;
    if (!(d.w >= 60 && d.h >= 80) || !test(String(d.sprite || ''))) continue;
    // The art's middle: bottle trees and legs are drawn narrower than their boxes.
    out.push({ l: x - d.w * 0.3, r: x + d.w * 0.3, t: y - d.h * 0.9, b: y - d.h * 0.05, sprite: d.sprite, d, x, y, lz: entry.lz, order: entry.order });
  }
  return out;
}

function reservedBoxes(reserved = []) {
  return reserved.map((s) => s.block || { l: s.x - (s.clearance || 40), r: s.x + (s.clearance || 40), t: s.y - 120, b: s.y });
}

const blocked = (boxes, x, y) => boxes.some((b) => x > b.l - RESERVED_PAD && x < b.r + RESERVED_PAD && y > b.t - ART_H && y < b.b + ART_H);

/** Keep the art inside the street, off its very ends. */
const EDGE_PX = 40;

/** G936: the ground art drawn over a wall: nearer plane layers, or later in the wall's own layer. */
function coversOf(wall, plane) {
  return plane.filter((c) => !c.d.hidden && GROUND_COVER_DECO.test(String(c.d.sprite || ''))
    && (c.lz > wall.lz || (c.lz === wall.lz && ((c.d.z || 0) > (wall.d.z || 0) || ((c.d.z || 0) === (wall.d.z || 0) && c.order > wall.order)))));
}

/** G936: a slid spot still hangs over a floor, BARNACLE_LIFTS' range above it (a few px of slack), with nothing between. */
function overFloor(plats, x, y) {
  const lines = linesAt(plats, x);
  const f = floorsAt(lines).filter((g) => g.y > y).sort((a, b) => a.y - b.y)[0];
  if (!f || f.y - y < LIFT_MIN || f.y - y > LIFT_MAX) return false;
  return openAbove(lines, f.y, y - ART_H);
}

/** G936: SEAT_MAX's shifts, nearest first (left before right on ties). */
const SEAT_SHIFTS = Object.freeze([0, ...Array.from({ length: SEAT_MAX / SEAT_STEP }, (_, i) => [-(i + 1) * SEAT_STEP, (i + 1) * SEAT_STEP]).flat()]);

function wallCandidates(street, plats, boxes, reserved, tier, masks = null, plane = []) {
  const out = [];
  const W = (street?.bounds?.r ?? 0) - (street?.bounds?.l ?? 0);
  for (const d of boxes) {
    const lo = Math.max(d.l, EDGE_PX);
    const hi = Math.min(d.r, W - EDGE_PX);
    if (masks && d.d.hidden) continue;
    const covers = masks ? coversOf(d, plane) : [];
    for (let x = Math.ceil(lo / SAMPLE_PX) * SAMPLE_PX; x <= hi; x += SAMPLE_PX) {
      const lines = linesAt(plats, x);
      for (const f of floorsAt(lines)) {
        for (const lift of BARNACLE_LIFTS) {
          const y = Math.round(f.y - lift);
          if (y > d.b || y - ART_H < d.t) continue;
          if (!openAbove(lines, f.y, y - ART_H)) continue;
          if (blocked(reserved, x, y)) continue;
          if (!masks) {
            out.push({ x, y, tier, lift });
            break;
          }
          // G936: on the wall's drawn art and under no ground art, sliding in off its edge if need be.
          const sx = SEAT_SHIFTS.map((s) => x + s).find((nx) => nx >= EDGE_PX && nx <= W - EDGE_PX && overFloor(plats, nx, y) && seatsOn(d, covers, masks, nx, y));
          if (sx === undefined || blocked(reserved, sx, y)) continue;
          out.push({ x: sx, y, tier, lift, wall: d, covers });
          break;
        }
      }
    }
  }
  return out;
}

/**
 * G936: a pick on the outer part of a round wall faces outward (the art opens to the left, so the
 * right part's are mirrored) and sits ROUND_NUDGE px in, where it still sits on the art.
 */
function faceOutward(spot, masks, plats) {
  const { wall, covers, ...out } = spot;
  if (!masks || !wall || !ROUND_WALL_DECO.test(String(wall.sprite || ''))) return out;
  const run = artRun(wall, masks, spot.x, spot.y - ART_H / 2);
  if (!run || run.r - run.l < 2) return out;
  const t = (spot.x - (run.l + run.r) / 2) / ((run.r - run.l) / 2);
  if (Math.abs(t) < ROUND_OUTER) return out;
  const side = Math.sign(t);
  const nx = spot.x - side * ROUND_NUDGE;
  const fits = overFloor(plats, nx, spot.y) && seatsOn(wall, covers, masks, nx, spot.y);
  // The way it should face; the builder mirrors a variant whose art faces the other way (BARNACLE_VARIANT_FACES).
  return { ...out, x: fits ? nx : spot.x, face: side > 0 ? 'right' : 'left' };
}

function undersideCandidates(plats, reserved) {
  const out = [];
  for (const u of plats) {
    if (u.pcPerm !== 1 || slopeOf(u) > MAX_SLOPE) continue;
    for (let x = Math.ceil(u.x1 / SAMPLE_PX) * SAMPLE_PX; x <= u.x2; x += SAMPLE_PX) {
      const uy = floorAt(u, x);
      const lines = linesAt(plats, x);
      const f = floorsAt(lines).filter((g) => g.y > uy + 90 && g.y < uy + 170).sort((a, b) => a.y - b.y)[0];
      if (!f) continue;
      const y = Math.round(uy + ART_H + 2);
      if (!openAbove(lines, f.y, uy + 1)) continue;
      if (blocked(reserved, x, y)) continue;
      out.push({ x, y, tier: 3, lift: Math.round(f.y - y) });
    }
  }
  return out;
}

function floorCandidates(plats, reserved) {
  const out = [];
  for (const p of plats) {
    if (!isStandable(p) || slopeOf(p) > MAX_SLOPE) continue;
    for (let x = Math.ceil((p.x1 + 30) / SAMPLE_PX) * SAMPLE_PX; x <= p.x2 - 30; x += SAMPLE_PX) {
      const y = Math.round(floorAt(p, x));
      const lines = linesAt(plats, x);
      if (!floorsAt(lines).some((f) => Math.abs(f.y - y) < 1)) continue;
      if (blocked(reserved, x, y)) continue;
      out.push({ x, y, tier: 4, lift: 0 });
    }
  }
  return out;
}

/** PURE (G936): the deco sprites whose masks the rule reads on a street: its walls (big decos) and its ground art. */
export function barnacleMaskSprites(street) {
  const out = new Set();
  for (const { d } of planeDecos(street)) {
    const name = String(d.sprite || '');
    if ((d.w >= 60 && d.h >= 80) || GROUND_COVER_DECO.test(name)) out.add(name);
  }
  return [...out].sort();
}

/** Farthest-point picks within one tier, away from `taken`; ties go to the leftmost. */
function spread(cands, n, taken, gap = BARNACLE_GAP) {
  const picks = [];
  const pool = [...cands].sort((a, b) => a.x - b.x || a.y - b.y);
  const dist = (c) => {
    let d = Infinity;
    for (const t of [...taken, ...picks]) d = Math.min(d, Math.hypot(c.x - t.x, c.y - t.y));
    return d;
  };
  while (picks.length < n) {
    let best = null;
    let bestD = -1;
    for (const c of pool) {
      const d = dist(c);
      if (d >= gap && d > bestD + 1e-9) {
        best = c;
        bestD = d;
      }
    }
    if (!best) break;
    picks.push(best);
  }
  return picks;
}

/**
 * PURE: `count` barnacle spots for a street, { x, y, tier, lift } in street px (0, 0 = the street's
 * top left; x, y the art's bottom centre, as barnacle-spots.json), left to right. tier 1 a wall of
 * the measured kinds, 2 another big deco, 3 a ledge's underside, 4 the floor. `keep` are spots
 * already placed (measured on a picture): new ones keep BARNACLE_GAP from them.
 * @param {object} street   the street JSON (bounds, platforms, layers)
 * @param {number} count
 * G936: with `masks` ({ [sprite]: { w, h, d } | null }, tools/barnacle-wall-masks.json) a wall spot must
 * sit on the wall's drawn art under no ground art, and one on a round wall's outer part faces outward
 * (`mirror: true` on the right part) and sits ROUND_NUDGE px in.
 * @param {{ reserved?: object[], keep?: {x:number,y:number}[], masks?: object }} [opts]  reserved: street-ecology.js streetReservedSpots
 */
export function barnacleWallSpots(street, count, { reserved = [], keep = [], masks = null } = {}) {
  const want = Math.max(0, Math.floor(Number(count) || 0));
  if (!want || !street?.platforms?.length) return [];
  const plats = platformsScreen(street);
  const res = reservedBoxes(reserved);
  const taken = keep.map((k) => ({ x: k.x, y: k.y }));
  const picks = [];
  const plane = masks ? planeDecos(street) : [];
  const walls = () => wallCandidates(street, plats, decoBoxes(street, (s) => BARNACLE_WALL_DECO.test(s)), res, 1, masks, plane);
  const others = () => wallCandidates(street, plats, decoBoxes(street, (s) => !BARNACLE_WALL_DECO.test(s) && !/^(ground|front_ground|grass|shadow|foreground|walkway|bridge|ladder|stone_moss|treetop|hanging|firebog_puddle)/.test(s)), res, 2, masks, plane);
  const tiers = [
    [walls],
    [others],
    [() => undersideCandidates(plats, res)],
    // G936: the walls again, closer together, before the floor.
    ...(masks ? [[walls, BARNACLE_GAP_CLOSE], [others, BARNACLE_GAP_CLOSE]] : []),
    [() => floorCandidates(plats, res)],
  ];
  for (const [tier, gap] of tiers) {
    if (picks.length >= want) break;
    picks.push(...spread(tier(), want - picks.length, [...taken, ...picks], gap));
  }
  return picks.map((p) => faceOutward(p, masks, plats)).sort((a, b) => a.x - b.x || a.y - b.y);
}
