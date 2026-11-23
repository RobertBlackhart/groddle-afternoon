/**
 * Where a world verb's result line goes (game.js runVerbFinish): a float over the thing, a notice
 * at the top, and the Activity log (js/notify.js lanes).
 *
 * - A thing that answers in its own bubble (a rock's "Metal, man! METAL!" with its slugs, a
 *   Piggy's line) has said it: the line goes to the log only. #640: a Metal Rock's line is long
 *   ("You mine 5 Chunks of Metal Rock. -10 energy, +2 iMG, +5 Chunk of Metal Rock.", over
 *   RESULT_FLOAT_MAX_CHARS), and the long-line branch raised it as a notice even under the
 *   bubble, so Metal Rock alone showed two. Glitch sent the verb's words to the Activity log
 *   (pc.sendActivity) and the rock talked back in its bubble (include/mining.js 420-495); no growl.
 * - A gain short enough to float rises from the thing and lands in the log (NOTIFY).
 * - Else the line is a notice, which wraps, and its log line (Austin 2026-11-13).
 */

/** A float is one line that never wraps: a longer result sentence is a notice instead (Austin 2026-11-13). */
export const RESULT_FLOAT_MAX_CHARS = 72;

/**
 * PURE: { float, notice, log } for a verb's first line. `log` is 'gain' (the log only, as a gain),
 * 'log' (the log only) or 'activity' (with the notice). `shown` is false when the thing's bubble
 * already answered (and the result does not ask for the line beside it), `changed` when the verb
 * gained or cost something, `canFloat` when the thing is on screen to float from.
 */
export function resultLineRoute({ ok = false, changed = false, shown = true, line = '', canFloat = true } = {}) {
  const gain = Boolean(ok && changed);
  if (!shown) return { float: false, notice: false, log: gain ? 'gain' : 'log' };
  if (gain && canFloat && String(line).length <= RESULT_FLOAT_MAX_CHARS) return { float: true, notice: false, log: 'gain' };
  return { float: false, notice: true, log: 'activity' };
}
