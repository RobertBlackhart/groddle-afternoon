/**
 * G952: hand corrections to Mortar Barnacles measured on the 2012 snaps (barnacle-spots.json stays
 * as measured). Each row moves one measured barnacle by dx street px, found by its measured x, and
 * says why. Departures from Glitch: keep this list short and say so on every row.
 */
export const BARNACLE_NUDGES = Object.freeze({
  // Ivalo Trims: both 2012 snaps (zoi, mackenzie) show this barnacle half over the left edge of the
  // trunk; Austin 2026-11-17 preferred it nudged onto the trunk.
  GTJ34OO4UHV1NLQ: Object.freeze([Object.freeze({ x: 466.5, dx: 12, why: 'Austin 2026-11-17: onto the trunk (Glitch had it half over the edge)' })]),
});

/** The measured spots with BARNACLE_NUDGES applied ({ [tsid]: [[x, y, blister], ...] }, a new object). */
export function nudgedBarnacleSpots(spots, nudges = BARNACLE_NUDGES) {
  const out = { ...spots };
  for (const [tsid, rows] of Object.entries(nudges)) {
    if (!out[tsid]) continue;
    out[tsid] = out[tsid].map((r) => {
      const n = rows.find((m) => m.x === r[0]);
      return n ? [r[0] + n.dx, ...r.slice(1)] : r;
    });
  }
  return out;
}
