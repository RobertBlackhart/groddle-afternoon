/**
 * R33 (#537): what a Glitch is drawn as while its look is still being painted.
 *
 * A look that is not the default is painted in the browser (js/avatar-compositor.js), and until
 * it is in, game.js drew the default look's prerendered sheets: the catalog's default outfit,
 * which reads as a real player's real clothes. Glitch never did that. Another player whose
 * sheets had not loaded wore the placeholder skin (AvatarSSManager.as setUpAvatarWithConfig
 * 311-316: AvatarSwf.as showPlaceholderSkin, the pale see-through "placeholder symbols 3" body
 * parts, no clothes), and your own look was loaded before the street showed
 * (BootStrapController.as 948-968).
 *
 * The placeholder here is the default look's sheets washed to that pale, see-through figure
 * (washPlaceholderPixels): every colour, so every outfit, is gone, and the Glitch's shape and a
 * faint shading stay. Tiny Speck's placeholder parts are in the CC0 Avatar.swf, but the
 * compositor paints only the clothed rig, so the wash stands in for them; it is painted once, at
 * 1x, from sheets already in memory (game.js vectorPlaceholderPack).
 *
 * Your own Glitch: the first loading card waits for your look (OWN_LOOK_WAIT_MS at most,
 * whenOwnLookReady), and a new look you put on keeps the one you wear until it is painted
 * (ownPackFor). Only with nothing of yours to show yet does your Glitch wear the placeholder.
 */

/** The sheets the placeholder has: the stand and walk, the jump and the climb (the rest hold the stand). */
export const PLACEHOLDER_SHEETS = Object.freeze(['base', 'jump', 'climb']);

/**
 * The wash: each pixel's brightness kept as a little shading between `floor` and white, and its
 * cover times `alpha` (Glitch's placeholder torso is white at 0.32 to 0.71 alpha, its skull 0.14
 * to 1: sideTorso3, sideSkull3 in Avatar2011.fla).
 */
export const PLACEHOLDER_WASH = Object.freeze({ floor: 205, alpha: 0.62 });

/**
 * Wash RGBA pixels (un-premultiplied, as getImageData gives them) in place to the placeholder:
 * grey from white down to `floor` by brightness, cover scaled by `alpha`.
 * @param {Uint8ClampedArray|number[]} data
 * @param {{ floor?: number, alpha?: number }} [wash]
 * @returns {typeof data}
 */
export function washPlaceholderPixels(data, wash = PLACEHOLDER_WASH) {
  const floor = Math.max(0, Math.min(255, wash.floor ?? PLACEHOLDER_WASH.floor));
  const alpha = Math.max(0, Math.min(1, wash.alpha ?? PLACEHOLDER_WASH.alpha));
  const span = (255 - floor) / 255;
  for (let i = 0; i + 3 < data.length; i += 4) {
    const a = data[i + 3];
    if (!a) continue;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const v = Math.round(floor + lum * span);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = Math.round(a * alpha);
  }
  return data;
}

/** True for a pack that stands in for a look still being painted (the placeholder). */
export function isPlaceholderPack(pack) {
  return Boolean(pack?.placeholderLook);
}

/** How long the first loading card waits for your own look before the game shows without it. */
export const OWN_LOOK_WAIT_MS = 3000;

/**
 * The pack your own Glitch wears when asked for `next`: a painted (not pending) pack goes on; a
 * look still being painted leaves on the look you wear, if it is a real one, and only with
 * nothing of yours to show yet is the stand-in (`next`) worn.
 * @param {{ pending?: boolean }|null} next
 * @param {{ pending?: boolean }|null} current
 */
export function ownPackFor(next, current) {
  if (!next?.pending) return next;
  if (current && !current.pending) return current;
  return next;
}

/**
 * Resolves once `ready()` is true, or after `capMs`: { ready, ms }. Checks every `stepMs`.
 * @param {{ ready: () => boolean, capMs?: number, stepMs?: number, now?: () => number, wait?: (ms: number) => Promise<any> }} o
 */
export async function whenOwnLookReady({ ready, capMs = OWN_LOOK_WAIT_MS, stepMs = 50, now = () => performance.now(), wait } = {}) {
  const sleep = wait || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const t0 = now();
  for (;;) {
    if (ready()) return { ready: true, ms: Math.round(now() - t0) };
    const left = capMs - (now() - t0);
    if (left <= 0) return { ready: false, ms: Math.round(now() - t0) };
    await sleep(Math.min(stepMs, left));
  }
}
