/**
 * G897 (#427, #433): a closed outline as one flat point list with no point
 * repeated, for Graphics.poly(points, true).
 *
 * A path of lineTo and arcTo steps handed to Pixi 8 repeats a point wherever
 * a lineTo ends on the tangent point an arcTo then starts from (or an arc
 * ends where the next line starts). Pixi's stroke builder divides by the
 * length of each segment, so a zero-length one gives NaN vertices. Most GPUs
 * drop those triangles; some phone GPUs draw them to the middle of the
 * canvas, and thin lines ran from a speech bubble's corners to one point
 * above-left of it. Here the arcs are worked out in plain JS and repeated
 * points dropped, so no segment has zero length.
 */

/** Points closer than this (px) count as the same point. */
export const OUTLINE_EPSILON = 0.05;

/** Line pieces in a corner arc of radius `r` and `sweep` radians (about what Pixi's arcTo uses). */
export function arcSegments(r, sweep) {
  return Math.max(2, Math.ceil(Math.sqrt(Math.max(0, r)) * 2 * Math.abs(sweep) / (Math.PI / 2)));
}

/**
 * Flatten path steps (["moveTo", x, y], ["lineTo", x, y],
 * ["arcTo", x1, y1, x2, y2, r], ["closePath"]) into [x0, y0, x1, y1, ...].
 * arcTo follows canvas arcTo: a line from the pen to the first tangent point,
 * then the arc. Consecutive points within OUTLINE_EPSILON, and a last point
 * on the first, are dropped.
 */
export function outlinePoints(steps, eps = OUTLINE_EPSILON) {
  const out = [];
  const push = (x, y) => {
    const n = out.length;
    if (n >= 2 && Math.hypot(out[n - 2] - x, out[n - 1] - y) < eps) return;
    out.push(x, y);
  };
  let px = 0;
  let py = 0;
  for (const [op, ...a] of steps) {
    if (op === 'moveTo' || op === 'lineTo') {
      [px, py] = a;
      push(px, py);
    } else if (op === 'arcTo') {
      const [x1, y1, x2, y2, r] = a;
      const d1x = px - x1;
      const d1y = py - y1;
      const d2x = x2 - x1;
      const d2y = y2 - y1;
      const l1 = Math.hypot(d1x, d1y);
      const l2 = Math.hypot(d2x, d2y);
      const cross = d1x * d2y - d1y * d2x;
      if (!(r > 0) || l1 < eps || l2 < eps || Math.abs(cross) < 1e-9) {
        [px, py] = [x1, y1];
        push(px, py);
        continue;
      }
      const u1x = d1x / l1;
      const u1y = d1y / l1;
      const u2x = d2x / l2;
      const u2y = d2y / l2;
      const angle = Math.acos(Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y)));
      const reach = r / Math.tan(angle / 2);
      const sx = x1 + u1x * reach;
      const sy = y1 + u1y * reach;
      const ex = x1 + u2x * reach;
      const ey = y1 + u2y * reach;
      // The centre sits along the bisector, r / sin(angle / 2) from the corner.
      const bx = u1x + u2x;
      const by = u1y + u2y;
      const bl = Math.hypot(bx, by);
      const cd = r / Math.sin(angle / 2);
      const cx = x1 + (bx / bl) * cd;
      const cy = y1 + (by / bl) * cd;
      const a0 = Math.atan2(sy - cy, sx - cx);
      let sweep = Math.atan2(ey - cy, ex - cx) - a0;
      if (sweep > Math.PI) sweep -= Math.PI * 2;
      if (sweep < -Math.PI) sweep += Math.PI * 2;
      const n = arcSegments(r, sweep);
      push(sx, sy);
      for (let i = 1; i < n; i++) {
        const t = a0 + (sweep * i) / n;
        push(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
      }
      push(ex, ey);
      [px, py] = [ex, ey];
    }
  }
  while (out.length >= 4 && Math.hypot(out[0] - out[out.length - 2], out[1] - out[out.length - 1]) < eps) out.length -= 2;
  return out;
}
