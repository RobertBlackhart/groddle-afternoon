/**
 * G892: the Rook badge's stun meter, Tiny Speck's own stars (glitch-client
 * TSEngineAssets/src/assets/graphics/rook_star_bg.png and rook_star_stars.png, CC0,
 * copied unchanged to assets/ui/).
 *
 * RookIncidentHeaderView.as:
 * - 86-110: rook_star_bg (85 x 50, the arc of empty stars) sits centred over the head;
 *   rook_star_stars (85 x 550, eleven 50 px frames, one more lit star each) is masked
 *   to one frame over it.
 * - updateStun 496-524: frame = floor(11 x stun / max_stun), at least the first star
 *   once any stun lands; a change flashes the stars five times (0.1 s out, 0.1 s back),
 * - moveStars 526-537: then empties them and, 0.5 s later, onStarTick 670-681 steps one
 *   frame each 100 ms (stars_timer) up to the new count.
 */

export const ROOK_STARS = Object.freeze({
  bg: 'assets/ui/rook_star_bg.png',
  stars: 'assets/ui/rook_star_stars.png',
  w: 85,
  h: 50,
  frames: 11,
  flashes: 5,
  flashMs: 100,
  restMs: 500,
  stepMs: 100,
});

/** The lit frame for a stun share (0..1): -1 for none, else 0..10 (updateStun 504-511). */
export function stunStarFrame(perc) {
  const p = Math.min(1, Math.max(0, Number(perc) || 0));
  if (p <= 0) return -1;
  return Math.max(1, Math.floor(ROOK_STARS.frames * p + 1e-9)) - 1;
}

/** A fresh meter showing `frame` with nothing to animate. */
export function stunStarsState(frame = -1) {
  return { target: frame, from: frame, changedAt: -Infinity };
}

/**
 * What the meter shows at time t (ms) for the stun share `perc`: { frame (-1 none),
 * alpha, state }. A new target starts the flash (on the frame shown before), then
 * the empty rest, then the climb one frame per step.
 */
export function stepStunStars(state, perc, t) {
  const st = state || stunStarsState();
  const target = stunStarFrame(perc);
  const S = ROOK_STARS;
  const flashEnd = S.flashes * 2 * S.flashMs;
  const shownAt = (s, at) => {
    const e = at - s.changedAt;
    if (e < flashEnd) return s.from;
    if (e < flashEnd + S.restMs) return -1;
    const climbed = Math.floor((e - flashEnd - S.restMs) / S.stepMs) - 1;
    return s.target < 0 ? -1 : Math.min(s.target, climbed);
  };
  let next = st;
  if (target !== st.target) next = { target, from: shownAt(st, t), changedAt: t };
  const e = t - next.changedAt;
  // Each flash: out over 0.1 s, back over 0.1 s (linear tweens).
  const alpha = e < flashEnd ? Math.abs(((e % (2 * S.flashMs)) / S.flashMs) - 1) : 1;
  return { frame: shownAt(next, t), alpha, state: next };
}
