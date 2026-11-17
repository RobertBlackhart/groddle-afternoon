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
 */
import { platformsScreen, isStandable } from './street-model.js?v=9f16f4ab';

/** The wall art barnacles sat on in the measured streets (sprite stems). */
export const BARNACLE_WALL_DECO = /^(background_)?bottletree|^legs_|^ground_rootpipe|^sprout/;
/** Bottom of the barnacle art over the floor in front, tried in this order (the measured middle half first). */
export const BARNACLE_LIFTS = Object.freeze([80, 60, 100, 45, 120]);
/** Mortar Barnacle art height (resource-nodes.js mortar_barnacle frames are 39-47 px). */
const ART_H = 44;
/** Two barnacles at least this far apart (px). */
export const BARNACLE_GAP = 70;
const SAMPLE_PX = 16;
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
  for (const layer of layers) {
    const isMg = layer === mg;
    if (!isMg && !(Math.abs(layer.w - W) <= 2 && Math.abs(layer.h - H) <= 2 && layer.z >= minZ && layer.z <= 1)) continue;
    for (const d of layer.decos || []) out.push({ d, x: isMg ? d.x - b.l : d.x, y: isMg ? d.y - b.t : d.y });
  }
  return out;
}

function decoBoxes(street, test) {
  const out = [];
  for (const { d, x, y } of planeDecos(street)) {
    if (!(d.w >= 60 && d.h >= 80) || !test(String(d.sprite || ''))) continue;
    // The art's middle: bottle trees and legs are drawn narrower than their boxes.
    out.push({ l: x - d.w * 0.3, r: x + d.w * 0.3, t: y - d.h * 0.9, b: y - d.h * 0.05, sprite: d.sprite });
  }
  return out;
}

function reservedBoxes(reserved = []) {
  return reserved.map((s) => s.block || { l: s.x - (s.clearance || 40), r: s.x + (s.clearance || 40), t: s.y - 120, b: s.y });
}

const blocked = (boxes, x, y) => boxes.some((b) => x > b.l - RESERVED_PAD && x < b.r + RESERVED_PAD && y > b.t - ART_H && y < b.b + ART_H);

/** Keep the art inside the street, off its very ends. */
const EDGE_PX = 40;

function wallCandidates(street, plats, boxes, reserved, tier) {
  const out = [];
  const W = (street?.bounds?.r ?? 0) - (street?.bounds?.l ?? 0);
  for (const d of boxes) {
    const lo = Math.max(d.l, EDGE_PX);
    const hi = Math.min(d.r, W - EDGE_PX);
    for (let x = Math.ceil(lo / SAMPLE_PX) * SAMPLE_PX; x <= hi; x += SAMPLE_PX) {
      const lines = linesAt(plats, x);
      for (const f of floorsAt(lines)) {
        for (const lift of BARNACLE_LIFTS) {
          const y = Math.round(f.y - lift);
          if (y > d.b || y - ART_H < d.t) continue;
          if (!openAbove(lines, f.y, y - ART_H)) continue;
          if (blocked(reserved, x, y)) continue;
          out.push({ x, y, tier, lift });
          break;
        }
      }
    }
  }
  return out;
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

/** Farthest-point picks within one tier, away from `taken`; ties go to the leftmost. */
function spread(cands, n, taken) {
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
      if (d >= BARNACLE_GAP && d > bestD + 1e-9) {
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
 * @param {{ reserved?: object[], keep?: {x:number,y:number}[] }} [opts]  reserved: street-ecology.js streetReservedSpots
 */
export function barnacleWallSpots(street, count, { reserved = [], keep = [] } = {}) {
  const want = Math.max(0, Math.floor(Number(count) || 0));
  if (!want || !street?.platforms?.length) return [];
  const plats = platformsScreen(street);
  const res = reservedBoxes(reserved);
  const taken = keep.map((k) => ({ x: k.x, y: k.y }));
  const picks = [];
  const tiers = [
    () => wallCandidates(street, plats, decoBoxes(street, (s) => BARNACLE_WALL_DECO.test(s)), res, 1),
    () => wallCandidates(street, plats, decoBoxes(street, (s) => !BARNACLE_WALL_DECO.test(s) && !/^(ground|front_ground|grass|shadow|foreground|walkway|bridge|ladder|stone_moss|treetop|hanging|firebog_puddle)/.test(s)), res, 2),
    () => undersideCandidates(plats, res),
    () => floorCandidates(plats, res),
  ];
  for (const tier of tiers) {
    if (picks.length >= want) break;
    picks.push(...spread(tier(), want - picks.length, [...taken, ...picks]));
  }
  return picks.sort((a, b) => a.x - b.x || a.y - b.y);
}
