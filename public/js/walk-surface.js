/**
 * Ground following for things that are items in the original (animals, NPCs,
 * dropped and placed things) on the imported street platforms, all in screen
 * space. They go by the item rule (street-model.js isItemSolid, the client's
 * item_solid_from_top): a shelf the avatar walks through holds them, an underside
 * or a line soft to items does not. A caller placing the avatar passes
 * `isStandable` instead.
 */

import { isItemSolid, platformYAt } from './street-model.js?v=9f16f4ab';

/**
 * The surface at x closest to the creature's current feet y, accepting only a
 * gentle step up or a short step down. Null over a gap (the creature turns).
 */
export function walkSurfaceY(platforms, x, y, { up = 40, down = 70 } = {}, solid = isItemSolid) {
  let best = null;
  for (const p of platforms || []) {
    if (!solid(p)) continue;
    const py = platformYAt(p, x, 0);
    if (py == null || py < y - up || py > y + down) continue;
    if (best == null || Math.abs(py - y) < Math.abs(best - y)) best = py;
  }
  return best;
}

/** How far a walker's floor is followed in one step (px), as street-creatures.js walkerSpan walks it. */
export const FOLLOW_STEP_PX = 2;

/**
 * #494: the floor a walker stands on at toX, followed along its own line from where it stood
 * (fromX, feet at fromY) by its walk's small step (walkSurfaceY's up and down), as
 * street-creatures.js walkerSpan finds the run of floor it may walk. A walk set by a clock, or
 * a shared path that snaps, can move a walker far in one frame (a page's first frame, a clock
 * offset arriving); the plain lookup from its old height then finds no floor within reach and
 * the walker stays at that height in the air (the Meal Vendor on Level 2 East). Null when the
 * line breaks before toX (a gap: the walker's own rule decides).
 */
export function followFloorY(platforms, fromX, fromY, toX, { up = 40, down = 70, step = FOLLOW_STEP_PX } = {}, solid = isItemSolid) {
  const reach = { up, down };
  let y = walkSurfaceY(platforms, fromX, fromY, reach, solid);
  if (y == null || !Number.isFinite(toX)) return y;
  const sign = toX >= fromX ? 1 : -1;
  const s = Math.max(0.5, Number(step) || FOLLOW_STEP_PX);
  for (let x = fromX + sign * s; (toX - x) * sign > 0; x += sign * s) {
    const ny = walkSurfaceY(platforms, x, y, reach, solid);
    if (ny == null) return null;
    y = ny;
  }
  return walkSurfaceY(platforms, toX, y, reach, solid);
}

/** First surface at or below y (where something dropped at y lands), or null. */
export function landingY(platforms, x, y, solid = isItemSolid) {
  let best = null;
  for (const p of platforms || []) {
    if (!solid(p)) continue;
    const py = platformYAt(p, x, 0);
    if (py == null || py < y - 4) continue;
    if (best == null || py < best) best = py;
  }
  return best;
}

/**
 * How far under a line a stack's point may sit and still be on it (a point the
 * game rounded, or set a couple of px into the floor as trees and animals are).
 */
export const STACK_SINK_PX = 8;

/**
 * Where a stack set down at (x, y) comes to rest: the first line that holds
 * items at or below its point (a point up to STACK_SINK_PX under a line is on
 * that line), or null with no line under it. In the original a dropped or
 * created stack obeys physics (item obey_physics, true for takeables): it goes
 * in at the point the server gives it (takeable.js takeable_drop 164-167, pc.y
 * - 20; createItemStackWithPoof at the caller's y) and falls to the first line
 * that holds items (PlatformLine.as 127 getPlatsSolidFromTopForItems), where
 * the client draws it with its art's bottom centre on that point
 * (LocationItemstackView.as _positionViewDO 853-854).
 */
export function stackRestY(platforms, x, y, solid = isItemSolid) {
  return landingY(platforms, x, y - STACK_SINK_PX, solid);
}

/** The surface at x nearest a reference y in either direction (spawning on the right floor). */
export function nearestSurfaceY(platforms, x, refY, solid = isItemSolid) {
  let best = null;
  for (const p of platforms || []) {
    if (!solid(p)) continue;
    const py = platformYAt(p, x, 0);
    if (py == null) continue;
    if (best == null || Math.abs(py - refY) < Math.abs(best - refY)) best = py;
  }
  return best;
}
