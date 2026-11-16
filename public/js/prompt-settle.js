/**
 * Interaction-hint hysteresis. A new hint (or none) must hold for `settleMs`
 * before it replaces the shown one, so hopping at a ladder top or walking
 * the edge of an item's range doesn't flick the hint back and forth.
 */
export function createPromptSettler(settleMs = 180) {
  let pendingId = '';
  let since = 0;
  /**
   * @param {{ key: string, label: string }|null} want this frame's hint
   * @param {string} shownId the shown hint's id ('' when hidden)
   * @param {number} now ms
   * @returns {boolean} true when `want` should be applied now
   */
  return function settle(want, shownId, now) {
    const id = promptId(want);
    if (id !== pendingId) {
      pendingId = id;
      since = now;
    }
    return id === shownId || now - since >= settleMs;
  };
}

export function promptId(want) {
  return want ? `${want.key}|${want.label}` : '';
}

/**
 * G903: the smallest sideways step (px) that takes `chip` just past the boxes it `hit` and clear of
 * every box in `all` (a 4 px gap), at most its own width and inside 0..`screenRight`; null when none
 * does. A signpost's Enter hint steps aside off the notices this way, so it stays over the post
 * instead of dropping onto the arms. Boxes are { left, right, top, bottom }.
 */
export function promptSideStep(chip, all, hit, screenRight) {
  const w = chip.right - chip.left;
  const steps = hit.flatMap((o) => [o.left - 6 - chip.right, o.right + 6 - chip.left]).sort((a, b) => Math.abs(a) - Math.abs(b));
  for (const dx of steps) {
    if (Math.abs(dx) > w) continue;
    const c = { left: chip.left + dx, right: chip.right + dx, top: chip.top, bottom: chip.bottom };
    if (c.left < 4 || c.right > screenRight - 4) continue;
    if (!all.some((o) => c.left < o.right + 4 && c.right > o.left - 4 && c.top < o.bottom + 4 && c.bottom > o.top - 4)) return dx;
  }
  return null;
}
