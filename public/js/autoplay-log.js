/**
 * Autoplay step log (G971): a QA autoplay says up front which steps it must
 * play (each block dropped, each switch hit, each quoin taken, the exit), logs
 * a step only once the game's own state shows it happened, and its final word
 * is checked against that list. A run that ends on a success word with steps
 * missing reports `hollow:<word>`, so a script whose presses were all refused
 * can no longer pass as played (Mental Block's autoplay reported 'exited'
 * without dropping a block).
 *
 *   const log = autoplayLog(['drop', 'drop', 'ledge', 'exit']);
 *   log.step('drop', st.next === k + 1);   // false: logged as refused
 *   engine.setData('xAutoplay', log.finish('exited'));
 *
 * A name listed twice must be logged twice. Words that already say the run
 * failed (stuck, error, fail, ...) pass through untouched.
 */

/** Final words that already report a failed or refused run. */
export const AUTOPLAY_FAILURE = /^(stuck|error|fail|none|hollow|undeclared|timeout|refused|blocked|no-)/;

/** Count names into a Map (a name listed n times must be logged n times). */
function tally(names) {
  const out = new Map();
  for (const n of names) out.set(String(n), (out.get(String(n)) || 0) + 1);
  return out;
}

export function autoplayLog(expected) {
  const declared = Array.isArray(expected) && expected.length > 0;
  const want = tally(declared ? expected : []);
  const got = new Map();
  const done = [];
  const refused = [];
  const log = {
    declared,
    expected: declared ? expected.map(String) : [],
    /** Log a step when `ok` (the state check) holds; returns ok. */
    step(name, ok = true) {
      const n = String(name);
      if (!ok) {
        refused.push(n);
        return false;
      }
      got.set(n, (got.get(n) || 0) + 1);
      done.push(n);
      return true;
    },
    count: (name) => got.get(String(name)) || 0,
    done: () => [...done],
    refused: () => [...refused],
    /** Expected steps not logged yet, one entry per missing repeat. */
    missing() {
      const out = [];
      for (const [n, c] of want) for (let i = got.get(n) || 0; i < c; i++) out.push(n);
      return out;
    },
    /** The word to publish: `hollow:<word>` when a success word skipped steps. */
    finish(word) {
      const w = String(word || 'done');
      if (AUTOPLAY_FAILURE.test(w)) return w;
      if (!declared) return `undeclared:${w}`;
      return log.missing().length ? `hollow:${w}` : w;
    },
    /** Short canvas-data line: `5/7 missing=exit,ledge:2 refused=drop:0`. */
    summary() {
      const total = log.expected.length;
      const miss = log.missing();
      let s = `${total - miss.length}/${total}`;
      if (miss.length) s += ` missing=${[...new Set(miss)].join(',')}`;
      if (refused.length) s += ` refused=${[...new Set(refused)].join(',')}`;
      return s;
    },
  };
  return log;
}

/**
 * Run a quest room's autoplay with its declared steps (room.autoplaySteps(ctx,
 * mode) -> names) and ctx.step wired to the log. The quest-instance runner
 * and the room tests both play rooms through this, so a test checks the same
 * word the canvas shows.
 * @returns {Promise<{ word: string, raw: string, missing: string[], done: string[], refused: string[], summary: string }>}
 */
export async function playRoomAutoplay(room, ctx, mode) {
  const log = autoplayLog(room.autoplaySteps?.(ctx, mode));
  const prev = ctx.step;
  ctx.step = log.step;
  try {
    const raw = String((await room.autoplay(ctx, mode)) || 'done');
    return { word: log.finish(raw), raw, missing: log.missing(), done: log.done(), refused: log.refused(), summary: log.summary() };
  } finally {
    ctx.step = prev;
  }
}
