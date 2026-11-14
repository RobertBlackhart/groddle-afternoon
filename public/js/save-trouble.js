/**
 * A save that does not go in is never silent (G737). game.js savePlayerState reports each try
 * here: a failure shows a small card at the top of the game (both skins, never modal), retries by
 * itself with a growing wait, and goes away once a save goes in ("Your game is saving again.").
 *
 * Some saves must not be written at all (hold): a stored save the game could not read, or one a
 * newer version of the game wrote. Then the card says why and what the player can do, and every
 * save of this page is refused before it writes, so the stored save stays as it is.
 *
 * Pure apart from mountSaveTrouble (the card), so tests/save-trouble.test.js drives the rules with
 * fake timers. Plain words, no em dashes.
 */

/** The card's words for each state. */
export const SAVE_TROUBLE_COPY = Object.freeze({
  failed: {
    title: 'Your game is not saving',
    body: 'Something stopped your game saving just now. It keeps trying by itself.',
    button: 'Try again',
  },
  unreadable: {
    title: 'Your saved game could not be read',
    body: 'This is a fresh game, and it will not be saved over the one that could not be read. That save is kept as it was. Reload to try reading it again.',
    button: 'Reload',
  },
  newer: {
    title: 'A newer version saved your game',
    body: 'Your game was saved by a newer version of Groddle Afternoon, so this page will not save over it. Reload to carry on with the newer version.',
    button: 'Reload',
  },
  recovered: 'Your game is saving again.',
});

/** The reasons a page holds its saves (never retried). */
export const SAVE_HOLDS = Object.freeze(['unreadable', 'newer']);

/** The first retry waits this long; each failure after doubles it, up to RETRY_MAX_MS. */
export const RETRY_FIRST_MS = 5000;
export const RETRY_MAX_MS = 60_000;

export function retryDelay(failures) {
  const n = Math.max(1, Math.floor(Number(failures) || 1));
  return Math.min(RETRY_MAX_MS, RETRY_FIRST_MS * 2 ** Math.min(n - 1, 8));
}

/**
 * @param {object} opts
 * @param {() => unknown} opts.retry tries the save again (game.js savePlayerState)
 * @param {(state: string, detail: object) => void} [opts.onChange] 'ok', 'failed' or a hold reason
 * @param {(text: string) => void} [opts.say] a short notice once saving works again
 * @param {(err: unknown) => void} [opts.report] each different error, once
 * @param {{ setTimeout: Function, clearTimeout: Function }} [opts.timers]
 */
export function createSaveHealth({
  retry,
  onChange = () => {},
  say = () => {},
  report = () => {},
  timers = { setTimeout: globalThis.setTimeout?.bind(globalThis), clearTimeout: globalThis.clearTimeout?.bind(globalThis) },
} = {}) {
  let state = 'ok';
  let failures = 0;
  let timer = null;
  const seen = new Set();
  const set = (next, detail = {}) => {
    state = next;
    try { onChange(next, { failures, ...detail }); } catch { /* the card's trouble is not the save's */ }
  };
  const clear = () => {
    if (timer != null) timers.clearTimeout(timer);
    timer = null;
  };
  const health = {
    get state() { return state; },
    get failures() { return failures; },
    /** The reason this page writes nothing, or '' (unreadable, newer). */
    get held() { return SAVE_HOLDS.includes(state) ? state : ''; },
    /** A save went in (or had nothing new to write). */
    ok() {
      if (state !== 'failed') return;
      clear();
      failures = 0;
      set('ok');
      try { say(SAVE_TROUBLE_COPY.recovered); } catch { /* quiet */ }
    },
    /** A save threw: show it, and try again after a wait (a later save may go in first). */
    failed(err) {
      if (health.held) return;
      failures += 1;
      const key = String(err?.message ?? err);
      if (!seen.has(key) && seen.size < 20) {
        seen.add(key);
        try { report(err); } catch { /* quiet */ }
      }
      if (state !== 'failed') set('failed');
      clear();
      timer = timers.setTimeout(() => {
        timer = null;
        retry?.();
      }, retryDelay(failures));
    },
    /** "Try again" on the card: now, not after the wait. */
    retryNow() {
      if (state !== 'failed') return;
      clear();
      retry?.();
    },
    /** Stops every save of this page for a reason in SAVE_HOLDS; the first hold stays. */
    hold(reason) {
      if (!SAVE_HOLDS.includes(reason) || health.held) return false;
      clear();
      set(reason);
      return true;
    },
  };
  return health;
}

/**
 * The card at the top of the game (#save-trouble, data-state). Returns render(state): 'ok' hides
 * it. Failed has Try again (onRetry); a hold has Reload (onReload).
 */
export function mountSaveTrouble(doc = globalThis.document, { onRetry = () => {}, onReload = () => globalThis.location?.reload() } = {}) {
  let box = null;
  return (state) => {
    if (!doc?.body) return;
    const copy = SAVE_TROUBLE_COPY[state];
    if (!copy || typeof copy === 'string') {
      if (box) {
        box.hidden = true;
        box.dataset.state = 'ok';
      }
      return;
    }
    if (!box) {
      box = doc.createElement('section');
      box.id = 'save-trouble';
      box.className = 'save-trouble';
      box.setAttribute('role', 'alert');
      box.setAttribute('aria-labelledby', 'save-trouble-title');
      (doc.getElementById('game-root') || doc.body).append(box);
    }
    const title = doc.createElement('h2');
    title.id = 'save-trouble-title';
    title.textContent = copy.title;
    const body = doc.createElement('p');
    body.textContent = copy.body;
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'save-trouble-btn';
    button.textContent = copy.button;
    button.dataset.saveTrouble = state === 'failed' ? 'retry' : 'reload';
    button.addEventListener('click', () => (state === 'failed' ? onRetry() : onReload()));
    box.replaceChildren(title, body, button);
    box.dataset.state = state;
    box.hidden = false;
  };
}
