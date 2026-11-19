/**
 * R33 (#537): what a Glitch is drawn as while its look is still being painted.
 *
 * A look that is not the default is painted in the browser (js/avatar-compositor.js), and until
 * it is in, game.js drew the default look's prerendered sheets: the catalog's default outfit,
 * which reads as a real player's real clothes. Glitch never showed you that for yourself: your
 * own look was loaded before the street showed (BootStrapController.as 948-968).
 *
 * Your own Glitch: the first loading card waits for your look (OWN_LOOK_WAIT_MS at most,
 * whenOwnLookReady), and a new look you put on keeps the one you wear until it is painted
 * (ownPackFor).
 */

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
