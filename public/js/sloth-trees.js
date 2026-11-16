/**
 * G891: where each Sloth hangs, found from its street's own trees (the sloth audit's place.py,
 * research/sloths-2026-11-16/audit-2, ported). Glitch placed every npc_sloth by hand in a tree
 * canopy, with instance props for its side (`dir`) and how far its hit box reached down
 * (`hitbox_extension`: npc_sloth.js 28-57, onCreate 572, onPropsChanged 614-618); the 2012
 * location files keep only how many a street had. The trees survive in the street art:
 *
 * 1. Crowns: the `tree_plane_foliage_*` decos of the street-wide layers in front of the items
 *    (z > 0: `middleplus`, or `middle plus` on Pitonia Lood and Kaha Haha), merged where their
 *    boxes come within CROWN_GAP of each other.
 * 2. Trees: the `tree_plane_trunk_*` and `tree_plane_01a` decos of the street-wide layers behind
 *    (z < 0, not the sky). A trunk has a crown when the crown's x range (CROWN_GAP to spare)
 *    covers it and the crown's lower edge lies between 200 px over the trunk's top and its base;
 *    one crown over several trunks keeps the trunk nearest its centre. That leaves out bare
 *    trees, acacias, shrub rows and crown pieces at a street's ends.
 * 3. The sloth: on the side of the trunk the crown spreads further to (`dir`), BRANCH_OFFSET
 *    out, at the crown's lower edge but never less than MIN_LIFT over the floor below it (its
 *    origin, the SWF's point: the HIDE ME box above it sits in the leaves, the hanging sloth
 *    under it).
 * 4. The Knocker: on the trunk, its foot KNOCKER_LIFT over the floor at the trunk.
 *
 * On the 37 sloth streets this finds exactly as many trees as the location file has Sloths
 * (84), and puts the 7 sloths seen hanging out in the Eleven players' 2012 snaps within 24 px
 * across and 21 px up of where the snaps show them, each on the right side of its trunk.
 * tools/build-sloth-spots.mjs writes the 37 streets' spots (js/sloth-spots-data.js); a street
 * with no written spots (a builder street) runs this on its own art.
 *
 * Pure: street JSON in (street px, y up negative), screen px out (0, 0 = the street's top left).
 */

export const CROWN_GAP = 40;
export const BRANCH_OFFSET = 110;
export const MIN_LIFT = 170;
export const KNOCKER_LIFT = 75;
/** The sloth's HIDE ME box from its origin (js/sloth-art.js SLOTH_CANOPY), for the "narrow" flag. */
const HIDE_BOX = Object.freeze({ x: -52, w: 164 });

const CROWN_RE = /^tree_plane_foliage/;
const TRUNK_RE = /^tree_plane_trunk|^tree_plane_01a/;

/** Python's round (half to even), so the spots match place.py to the pixel. */
function pyRound(v) {
  const r = Math.round(v);
  return Math.abs(v % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

function streetBoxes(street, keepLayer, re) {
  const b = street.bounds;
  const W = b.r - b.l;
  const H = b.b - b.t;
  const out = [];
  for (const layer of street.layers || []) {
    if (!keepLayer(layer, W)) continue;
    for (const d of layer.decos || []) {
      if (!re.test(String(d.sprite || ''))) continue;
      const x = d.x + b.l;
      const y = d.y + b.t + (H - layer.h);
      out.push({ x, x0: x - d.w / 2, x1: x + d.w / 2, y0: y - d.h, y1: y });
    }
  }
  return out;
}

const near = (a, c) => a.x0 <= c.x1 + CROWN_GAP && a.x1 >= c.x0 - CROWN_GAP && a.y0 <= c.y1 + CROWN_GAP && a.y1 >= c.y0 - CROWN_GAP;

function mergeCrowns(boxes) {
  const crowns = [];
  for (const box of boxes) {
    const merged = { x0: box.x0, x1: box.x1, y0: box.y0, y1: box.y1 };
    for (const c of crowns.filter((c) => near(box, c))) {
      crowns.splice(crowns.indexOf(c), 1);
      Object.assign(merged, { x0: Math.min(merged.x0, c.x0), x1: Math.max(merged.x1, c.x1), y0: Math.min(merged.y0, c.y0), y1: Math.max(merged.y1, c.y1) });
    }
    crowns.push(merged);
  }
  for (let again = true; again;) {
    again = false;
    outer: for (let i = 0; i < crowns.length; i += 1) {
      for (let j = i + 1; j < crowns.length; j += 1) {
        const a = crowns[i];
        const c = crowns[j];
        if (!near(a, c)) continue;
        Object.assign(a, { x0: Math.min(a.x0, c.x0), x1: Math.max(a.x1, c.x1), y0: Math.min(a.y0, c.y0), y1: Math.max(a.y1, c.y1) });
        crowns.splice(j, 1);
        again = true;
        break outer;
      }
    }
  }
  return crowns.sort((a, b) => a.x0 - b.x0);
}

/** The nearest platform line under (x, y) (street px), or null. */
export function floorBelow(platforms, x, y) {
  let best = null;
  for (const p of platforms || []) {
    const lo = Math.min(p.x1, p.x2);
    const hi = Math.max(p.x1, p.x2);
    if (x < lo || x > hi) continue;
    const t = p.x2 !== p.x1 ? (x - p.x1) / (p.x2 - p.x1) : 0;
    const py = p.y1 + t * (p.y2 - p.y1);
    if (py > y && (best == null || py < best)) best = py;
  }
  return best;
}

/**
 * The street's sloth trees, left to right: [{ x, y, dir, floor, knocker: { x, y }, trunk, crown,
 * flags }] in screen px. `dir` 1 hangs right of the trunk, -1 left; `floor` is the floor under
 * the sloth (its hit box reaches down to it); flags: 'no floor', 'lift' (outside 150-260 px),
 * 'narrow' (the HIDE ME box sticks out past the crown).
 */
export function slothTrees(street) {
  if (!street?.bounds || !Array.isArray(street.layers)) return [];
  const b = street.bounds;
  const crowns = mergeCrowns(streetBoxes(street, (l, W) => l.z > 0 && l.w === W, CROWN_RE));
  const trunks = streetBoxes(street, (l, W) => l.z < 0 && l.w === W && l.name !== 'sky', TRUNK_RE);
  const centre = (c) => (c.x0 + c.x1) / 2;
  const byCrown = new Map();
  for (const t of trunks) {
    const cands = crowns.filter((c) => c.x0 - CROWN_GAP <= t.x && t.x <= c.x1 + CROWN_GAP && t.y0 - 200 <= c.y1 && c.y1 <= t.y1);
    if (!cands.length) continue;
    const crown = cands.reduce((a, c) => (Math.abs(centre(c) - t.x) < Math.abs(centre(a) - t.x) ? c : a));
    const had = byCrown.get(crown);
    if (!had || Math.abs(centre(crown) - t.x) < Math.abs(centre(crown) - had.x)) byCrown.set(crown, t);
  }
  const out = [];
  for (const [crown, t] of byCrown) {
    const dir = centre(crown) >= t.x ? 1 : -1;
    const x = pyRound(t.x + dir * BRANCH_OFFSET);
    const edge = crown.y1;
    const floor = floorBelow(street.platforms, x, edge - 60);
    const trunkFloor = floorBelow(street.platforms, t.x, t.y0);
    const flags = [];
    let y;
    if (floor == null) {
      y = pyRound(edge + 10);
      flags.push('no floor');
    } else {
      y = pyRound(Math.min(edge, floor - MIN_LIFT));
      const lift = pyRound(floor) - y;
      if (lift < 150 || lift > 260) flags.push('lift');
      const bx0 = x + (dir > 0 ? HIDE_BOX.x : -HIDE_BOX.x - HIDE_BOX.w);
      if (bx0 < crown.x0 || bx0 + HIDE_BOX.w > crown.x1) flags.push('narrow');
    }
    const fy = floor == null ? y + MIN_LIFT : pyRound(floor);
    const kx = pyRound(t.x);
    const ky = trunkFloor == null ? fy - KNOCKER_LIFT : pyRound(trunkFloor - KNOCKER_LIFT);
    out.push({
      x: x - b.l,
      y: y - b.t,
      dir,
      floor: fy - b.t,
      knocker: { x: kx - b.l, y: ky - b.t },
      trunk: pyRound(t.x) - b.l,
      crown: { x0: pyRound(crown.x0) - b.l, x1: pyRound(crown.x1) - b.l, edge: pyRound(edge) - b.t },
      flags,
    });
  }
  return out.sort((a, b2) => a.x - b2.x);
}

/** One spot row as js/sloth-spots-data.js keeps it: [x, y, dir, floor, knockerX, knockerY]. */
export function slothSpotRow(tree) {
  return [tree.x, tree.y, tree.dir, tree.floor, tree.knocker.x, tree.knocker.y];
}

/** A spot row back as { x, y, dir, floor, knocker } (screen px). */
export function slothSpotFromRow(row) {
  if (!Array.isArray(row) || !row.slice(0, 6).every(Number.isFinite)) return null;
  const [x, y, dir, floor, kx, ky] = row;
  return { x, y, dir: dir < 0 ? -1 : 1, floor, knocker: { x: kx, y: ky } };
}
