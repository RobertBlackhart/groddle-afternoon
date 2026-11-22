/**
 * G1129 (Austin found it live): Enter at a signpost, then Enter again on the loading card, set off
 * a second trip, and you could bounce between two streets for as long as you held it. Each way to
 * travel started its trip on its own; nothing said a street change was already under way.
 *
 * Glitch had one: the client's moveModel.moving. actuallyStartLocationMove refused a new move while
 * one ran ("can't start a new move, because already moving", NetController.as 352-358), a teleport
 * or follow the server started meanwhile was ignored (1398-1407), avatar key control did not start
 * while moving (TSFrontController.as maybeStartAvatarKeyControl 1237-1266), and moveHasEnded put it
 * back when the new street was up or the move failed (NetController.as 1748-1781).
 *
 * This is that state for the remake. Every street trip runs inside run() (game.js
 * enterStreetWithTransition, Back to world): from its first step until the new street is built and
 * the card has gone, or the load has failed, moving() is true. finally clears it, so a failed load
 * never leaves it stuck. While it is true:
 * - a trip you ask for (a signpost arm, Enter, a door, the Map, a teleport) is refused (travelTurn
 *   'refuse'), as Glitch's client refused it;
 * - a trip the game sends you on (being followed, a feature's own way on: a subway car with no ride,
 *   the server's move) waits its turn (queue, travelTurn 'wait') and goes once the first is done.
 *   The remake's features stand in for Glitch's server, which never sent a move mid-move; waiting
 *   keeps their move instead of losing it.
 * - a key pressed during the trip, or held into it (the Enter that started it, on auto-repeat), is
 *   stale until it is let go (keyStale), so its repeats cannot set off a trip the moment you arrive.
 */

/** Ways of travelling the game starts for you; any other way is yours and is refused mid-move. */
export const GAME_SENT_VIAS = Object.freeze(['follow']);

/**
 * A wait in the queue longer than this goes anyway (a trip that awaits another trip from inside
 * itself would otherwise wait on itself for good). Longer than any card: a slow load and the
 * longest Home to: hold.
 */
export const MAX_QUEUE_WAIT_MS = 30000;

/**
 * PURE: what a new trip does while `moving`: 'go' (nothing under way), 'refuse' (a trip you asked
 * for) or 'wait' (one the game sent you on: `via` in GAME_SENT_VIAS, or `sent`).
 */
export function travelTurn({ moving = false, via = '', sent = false } = {}) {
  if (!moving) return 'go';
  return sent || GAME_SENT_VIAS.includes(String(via || '')) ? 'wait' : 'refuse';
}

/**
 * The street change state. `timers` ({ setTimeout, clearTimeout }) for tests; `maxWaitMs` caps a
 * queued wait (MAX_QUEUE_WAIT_MS).
 */
export function createStreetMove({ timers = globalThis, maxWaitMs = MAX_QUEUE_WAIT_MS } = {}) {
  let depth = 0;
  let waiters = [];
  const held = new Set();
  const stale = new Set();

  const settle = () => {
    const list = waiters;
    waiters = [];
    for (const done of list) done();
  };

  const moving = () => depth > 0;

  /** Runs one trip; moving() from now until it ends, however it ends. */
  async function run(work) {
    // The key that set this trip off (and any other held) is stale until let go.
    if (!depth) for (const key of held) stale.add(key);
    depth += 1;
    try {
      return await work();
    } finally {
      depth -= 1;
      if (!depth) settle();
    }
  }

  /** Resolves once no trip runs (at once when none does). */
  function whenStill() {
    return depth ? new Promise((resolve) => waiters.push(resolve)) : Promise.resolve();
  }

  /** Resolves once no trip runs, or after `ms` (true when it timed out). */
  function stillOrTimeout(ms) {
    if (!depth) return Promise.resolve(false);
    return new Promise((resolve) => {
      let timer = 0;
      const done = () => {
        if (timer) timers.clearTimeout(timer);
        resolve(false);
      };
      waiters.push(done);
      timer = timers.setTimeout(() => {
        waiters = waiters.filter((w) => w !== done);
        resolve(true);
      }, ms);
    });
  }

  /**
   * Runs `work` as a trip once no trip runs: at once when none does, else after the one (or the
   * ones queued before it) has ended. Never alongside another, unless the wait passes maxWaitMs.
   */
  async function queue(work) {
    const until = Date.now() + maxWaitMs;
    while (depth) {
      const left = until - Date.now();
      if (left <= 0 || (await stillOrTimeout(left))) break;
    }
    return run(work);
  }

  return {
    moving,
    run,
    queue,
    whenStill,
    /** A key went down: true when it is stale (pressed while moving, or held since before). */
    keyDown(key, { moving: now = moving() } = {}) {
      held.add(key);
      if (now) stale.add(key);
      return stale.has(key);
    },
    /** A key came up: it is fresh again. */
    keyUp(key) {
      held.delete(key);
      stale.delete(key);
    },
    /** Whether a key down now was pressed during a street change or held into one. */
    keyStale: (key) => stale.has(key),
    /** The window lost focus: its keyups will not come, so no key counts as held. */
    releaseKeys() {
      held.clear();
      stale.clear();
    },
  };
}
