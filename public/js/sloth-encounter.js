/**
 * The Sloth's encounter as Glitch played it (register G889, report #245): which of its
 * animations plays when, from GSJS items/npc_sloth.js (setState 642-794, setStateComplete
 * 796-850, onIdleTick 575-582, hideSloth 510-519, metalizeComplete 537-561, createSnail 367-421,
 * the feed handler 249-305) and items/sloth_knocker.js (knock 44-63).
 *
 * Pure: slothTimeline() turns one event into steps { at (ms from now), anim?, idle?, hidden? }
 * that js/features/resource-nodes-feature.js plays on the Sloth it draws from js/sloth-art.js.
 * A new timeline replaces the one playing, as setState cancels the state timers (npc_sloth.js
 * 647-650). `idle: true` hands the Sloth to the idle ticks: hangIdle1 or hangIdle2 every 3-6 s
 * (onIdleTick). `hidden: true` leaves it hidden up in the leaves.
 */

import { SLOTH_FPS, SLOTH_SHEETS, SLOTH_STEP } from './sloth-art.js?v=a2768e2f';

/** A label's own length on the 30 fps timeline. */
export function slothLabelMs(label) {
  const sheet = SLOTH_SHEETS[label];
  return sheet ? Math.round((sheet.swf[1] / SLOTH_FPS) * 1000) : 0;
}

/** The cell of `label` to draw `ms` after it began (loopers wrap, the rest hold the last). */
export function slothCellAt(label, ms, loop = false) {
  const sheet = SLOTH_SHEETS[label];
  if (!sheet) return 0;
  const n = Math.max(0, Math.floor((Math.max(0, ms) * SLOTH_FPS) / (1000 * SLOTH_STEP)));
  return loop ? n % sheet.count : Math.min(sheet.count - 1, n);
}

/** onIdleTick: hangIdle1 or hangIdle2, then the next tick 3, 4, 5 or 6 s later. */
export function slothIdleTick(rng = Math.random) {
  const pick = (list) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  return { anim: pick(['hangIdle1', 'hangIdle2']), nextMs: pick([3, 4, 5, 6]) * 1000 };
}

/** onPlayerCollision 604-607: a hiding Sloth peeks at most every 20 s. */
export const SLOTH_PEEK_GAP_MS = 20 * 1000;

/**
 * Steps for one event:
 *  - 'arrive': the knock got it down (callSloth 337-346 -> setState idle from hidden 677-699):
 *    drop (1 s), then idle.
 *  - 'feed' with opts.plan (resource-nodes.js slothFeedPlan): eat (looping) until each spit, the
 *    spit, eat again 1.5 s after it (createSnail 407-421); 1.5 s after the last spit
 *    metalizeComplete: finishedEating, or climbUp at once after the 8th rod (opts.full,
 *    metalize_count > 7, 543-546).
 *  - 'hide': 20 s with no rod (hideSloth): climbUp (5 s), hidden.
 *  - 'peek': walked under (onPlayerCollision): peek (1 s); peekIdle a second after it ends
 *    (setStateComplete peeking 818-823); peekWithdraw 5 s after that (setState hidden from peeking).
 *  - 'peekSpit': Friend of Metal (onPlayerCollision 591-601): peek, then peekSpit with its snails,
 *    peekIdle 1.2 s after, hidden 3 s after (setStateComplete peekSpit 825-834).
 */
export function slothTimeline(event, opts = {}) {
  switch (event) {
    case 'arrive':
      return [{ at: 0, anim: 'drop' }, { at: 1000, idle: true }];
    case 'feed': {
      const rounds = opts.plan?.rounds || [];
      const steps = [{ at: 0, anim: 'eat' }];
      rounds.forEach((round, i) => {
        steps.push({ at: round.atMs, anim: 'spit' });
        if (i < rounds.length - 1) steps.push({ at: round.atMs + 1500, anim: 'eat' });
      });
      const done = opts.plan?.doneMs ?? 1500;
      if (opts.full) steps.push({ at: done, anim: 'climbUp' }, { at: done + 5000, hidden: true });
      else steps.push({ at: done, anim: 'finishedEating' }, { at: done + 1000, idle: true });
      return steps;
    }
    case 'hide':
      return [{ at: 0, anim: 'climbUp' }, { at: 5000, hidden: true }];
    case 'peek':
      return [{ at: 0, anim: 'peek' }, { at: 2000, anim: 'peekIdle' }, { at: 6000, anim: 'peekWithdraw' }, { at: 7000, hidden: true }];
    case 'peekSpit':
      return [
        { at: 0, anim: 'peek' },
        { at: 1000, anim: 'peekSpit' },
        { at: 3200, anim: 'peekIdle' },
        { at: 5000, anim: 'peekWithdraw' },
        { at: 6000, hidden: true },
      ];
    default:
      return [];
  }
}
