/**
 * Update ready (Austin, 2026-10-31): instead of a message to everyone before a deploy, an open game
 * learns a new version is out and offers to save and reload. Pure: no DOM of its own, so
 * tests/update-ready.test.js drives it with a fake fetch and fake timers. The pill and its wiring are
 * js/features/update-ready-feature.js.
 *
 * - The deploy (tools/deploy/build-id.mjs, from kinsta.sh and the local sync) stamps each play page
 *   with <meta name="groddle-build" content="<id>"> and writes play/build.json { build, version }.
 *   A page with no stamp (a QA server on the repo's public/) never checks.
 * - The check fetches play/build.json with cache: 'no-store' and a ?t= buster (a few dozen bytes).
 *   It runs about every CHECK_EVERY_MS (jittered by JITTER either way, so one deploy does not bring
 *   every open game at once), when the tab is shown again, and in multiplayer when the realtime
 *   socket comes back after a drop (a server restart reconnects everyone: a random wait of up to
 *   RECONNECT_SPREAD_MS spreads them out). Shown and reconnect checks wait MIN_GAP_MS after the last.
 * - A failed check is silent; the next waits twice as long each time, up to BACKOFF_MAX_MS.
 * - A different build is announced once (onUpdate), and checking stops: the reload loads the newest.
 * - #307/#308: online, the realtime server refusing a rock, tree or node as too far brings the notice
 *   back (createReachReminder): an older page may draw shared things where the server no longer has
 *   them. Never a reload by itself.
 */

export const CHECK_EVERY_MS = 5 * 60_000;
/** The interval varies by this share either way (4 to 6 minutes). */
export const JITTER = 0.2;
/** Shown-again and reconnect checks skip when the last check was this recent. */
export const MIN_GAP_MS = 60_000;
/** A reconnect check waits a random 0..this, so a server restart does not bring every client at once. */
export const RECONNECT_SPREAD_MS = 20_000;
export const BACKOFF_MAX_MS = 30 * 60_000;
/** A reach refusal brings the notice back at most this often (a player may swing at one rock a few times). */
export const REMIND_GAP_MS = 60_000;
/** The file the deploy writes (tools/deploy/build-id.mjs BUILD_FILE), from the site root. */
export const BUILD_PATH = 'play/build.json';

/** The words (plain, no em dashes). */
export const UPDATE_TEXT = Object.freeze({
  pill: 'Update ready',
  tip: 'A new version is ready. Save your game and reload',
  saving: 'Saving…',
  activity: 'A new version is ready. Update ready at the top saves your game and reloads.',
  waiting: 'A new version is ready. Update ready at the top saves your game and reloads; it shows when nothing else is open.',
  notSaved: 'Your game could not be saved just now, so it did not reload. Try again in a moment.',
  reach: 'This page is an older version of the game, so some things may not be where everyone else sees them. Update ready at the top saves your game and reloads.',
});

/** The build this page was stamped with ('' when it was not: then nothing checks). */
export function ownBuild(doc = globalThis.document) {
  const v = doc?.querySelector?.('meta[name="groddle-build"]')?.getAttribute?.('content');
  return typeof v === 'string' ? v.trim() : '';
}

/** The build file's address with a cache buster: `<site root>/play/build.json?t=<ms>`. */
export function buildUrl(baseUri, at = Date.now()) {
  return `${new URL(BUILD_PATH, baseUri).href}?t=${Math.floor(at)}`;
}

/** The wait before the next scheduled check: the interval, jittered, doubled per failure up to the cap. */
export function nextDelay({ failures = 0, random = Math.random } = {}) {
  const base = CHECK_EVERY_MS * (1 - JITTER + 2 * JITTER * random());
  return Math.round(Math.min(BACKOFF_MAX_MS, base * 2 ** Math.min(Math.max(0, failures), 8)));
}

/**
 * @param {object} opts
 * @param {string} opts.own this page's build (ownBuild); empty disables every check
 * @param {(at: number) => string} opts.url the build file's address (buildUrl)
 * @param {typeof fetch} [opts.fetch]
 * @param {(fn: () => void, ms: number) => any} [opts.setTimeout]
 * @param {(id: any) => void} [opts.clearTimeout]
 * @param {() => number} [opts.now]
 * @param {() => number} [opts.random]
 * @param {(info: { build: string, version: string }) => void} [opts.onUpdate] once, on the first different build
 */
export function createUpdateCheck({
  own,
  url,
  fetch: fetchFn = globalThis.fetch?.bind(globalThis),
  setTimeout: later = globalThis.setTimeout?.bind(globalThis),
  clearTimeout: cancel = globalThis.clearTimeout?.bind(globalThis),
  now = () => Date.now(),
  random = Math.random,
  onUpdate = () => {},
} = {}) {
  const self = String(own || '');
  let timer = null;
  let spreadTimer = null;
  let failures = 0;
  let lastAt = -Infinity;
  let inFlight = null;
  let latest = null;
  let running = false;
  let checks = 0;

  const enabled = () => Boolean(self && fetchFn && later);

  function schedule(ms) {
    if (timer != null) cancel?.(timer);
    timer = later(() => {
      timer = null;
      check('interval');
    }, ms);
  }

  function stopTimers() {
    if (timer != null) cancel?.(timer);
    if (spreadTimer != null) cancel?.(spreadTimer);
    timer = spreadTimer = null;
  }

  /** Fetches the build file now (one at a time); resolves to the newer build or null. */
  function check(reason = 'manual') {
    if (!enabled() || latest) return Promise.resolve(latest);
    if (inFlight) return inFlight;
    lastAt = now();
    checks += 1;
    inFlight = (async () => {
      let found = null;
      try {
        const res = await fetchFn(url(now()), { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json' } });
        if (!res?.ok) throw new Error(`build file ${res?.status}`);
        const body = await res.json();
        const build = typeof body?.build === 'string' ? body.build.trim() : '';
        if (!build) throw new Error('no build in the build file');
        failures = 0;
        if (build !== self) found = { build, version: typeof body.version === 'string' ? body.version : '', reason };
      } catch {
        failures += 1;
      }
      inFlight = null;
      if (found) {
        latest = found;
        running = false;
        stopTimers();
        try { onUpdate(found); } catch { /* the pill's trouble, not the check's */ }
      } else if (running) {
        schedule(nextDelay({ failures, random }));
      }
      return latest;
    })();
    return inFlight;
  }

  /** A check that waits MIN_GAP_MS after the last one (shown again, reconnect); `spread` waits 0..that ms first. */
  function nudge(reason, { spread = 0 } = {}) {
    if (!enabled() || latest || !running) return false;
    if (now() - lastAt < MIN_GAP_MS) return false;
    if (spread > 0) {
      if (spreadTimer != null) return false;
      spreadTimer = later(() => {
        spreadTimer = null;
        if (now() - lastAt >= MIN_GAP_MS) check(reason);
      }, Math.floor(random() * spread));
      return true;
    }
    check(reason);
    return true;
  }

  return {
    /** Starts the schedule: the first check after one jittered interval (the page just loaded the newest). */
    start() {
      if (running || !enabled() || latest) return false;
      running = true;
      lastAt = now();
      schedule(nextDelay({ failures, random }));
      return true;
    },
    stop() {
      running = false;
      stopTimers();
    },
    check,
    /** The tab is shown again. */
    shown: () => nudge('visible'),
    /** The realtime socket came back after a drop. */
    reconnected: () => nudge('reconnect', { spread: RECONNECT_SPREAD_MS }),
    /** The realtime server refused a shared thing as too far (#307/#308): a new build may be why. */
    reached: () => nudge('reach'),
    get own() { return self; },
    get latest() { return latest; },
    get running() { return running; },
    get failures() { return failures; },
    get checks() { return checks; },
    get scheduled() { return timer != null; },
  };
}

/**
 * #307/#308 (G703): a tab left open across releases drew shared rocks, trees and peat where its own
 * build put them, and the realtime server, which had moved them (server v0.29.0), refused the swing as
 * too far. When such a refusal comes and the check already knows a newer build, the Update ready
 * notice is said again (`say`, at most once per REMIND_GAP_MS); when it does not know one yet, a
 * check runs now (the shown-again gap holds). Nothing reloads by itself (Austin 2026-10-31).
 * @param {{ check: ReturnType<typeof createUpdateCheck>, now?: () => number, say?: (text: string) => void }} opts
 */
export function createReachReminder({ check, now = () => Date.now(), say = () => {} } = {}) {
  let lastAt = -Infinity;
  let count = 0;
  return {
    /** A reach refusal arrived: true when the notice was said again. */
    reached() {
      if (!check?.latest) {
        check?.reached?.();
        return false;
      }
      if (now() - lastAt < REMIND_GAP_MS) return false;
      lastAt = now();
      count += 1;
      say(UPDATE_TEXT.reach);
      return true;
    },
    get count() { return count; },
  };
}

/** Below this opacity (on the window or any of its parents) a window counts as not shown: a fade's last frames. */
export const SHOWN_OPACITY = 0.05;

/**
 * Windows that never hold the pill back: the Reports window and its picture bar. Their pictures leave
 * them out (bug-report-feature REPORT_LEAVE_OUT), so a picture sent while an update waited showed the
 * bar without the pill, as if the page had lost it (the 2026-11-19 desktop report: v0.51.0 found, two
 * later pictures with no pill).
 */
export const UPDATE_IGNORES = Object.freeze(['bug-report-panel', 'report-shutter']);

/**
 * Whether a player can see `el` (the 2026-11-19 desktop report: the pill stayed away for over an hour
 * after the game found a new build). A window counts when it has a box of some size inside the
 * window, its own visibility is not hidden (visibility is inherited, so this covers its parents), and
 * neither it nor any parent is display: none or faded out (opacity under SHOWN_OPACITY). A window
 * moved off the screen, shrunk to nothing, faded or made invisible no longer holds the pill back.
 */
export function shownToPlayer(el, win = globalThis) {
  try {
    if (!el || el.hidden) return false;
    const rects = el.getClientRects?.();
    if (!rects?.length) return false;
    const w = Number(win?.innerWidth) || Infinity;
    const h = Number(win?.innerHeight) || Infinity;
    let inView = false;
    for (const r of rects) {
      if (r.width >= 2 && r.height >= 2 && r.right > 0 && r.bottom > 0 && r.left < w && r.top < h) {
        inView = true;
        break;
      }
    }
    if (!inView) return false;
    const style = (n) => win?.getComputedStyle?.(n) || null;
    const own = style(el);
    if (own && (own.visibility === 'hidden' || own.visibility === 'collapse')) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = n === el ? own : style(n);
      if (!cs) break;
      if (cs.display === 'none') return false;
      const op = Number.parseFloat(cs.opacity);
      if (Number.isFinite(op) && op < SHOWN_OPACITY) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** A short name for a window in the report's line: "#id", else ".first-class". */
function nameOf(el) {
  if (el?.id) return `#${el.id}`;
  const cls = String(el?.className?.baseVal ?? el?.className ?? '').trim().split(/\s+/)[0];
  return cls ? `.${cls}` : String(el?.tagName || '').toLowerCase();
}

const ignored = (el) => UPDATE_IGNORES.some((id) => el?.id === id || el?.closest?.(`#${id}`));

/**
 * What would make the pill rude right now, and which window: { reason, what } (reason '' when
 * nothing). A race or other scene, a quest dialogue, the trade window, an open panel (.glitch-modal)
 * or a modal dialog (role=dialog aria-modal, or dialog[open]), each only while a player can see it
 * (shownToPlayer). The Reports window never counts (UPDATE_IGNORES).
 */
export function blockingDetail(engine, doc = globalThis.document, win = globalThis) {
  try {
    if (engine?.inScene?.()) return { reason: 'scene', what: String(engine?.sceneTsid || '') };
    if (engine?.questDialogueOpen?.()) return { reason: 'dialogue', what: '' };
    const trade = doc?.getElementById?.('trade-window');
    if (trade && shownToPlayer(trade, win)) return { reason: 'trade', what: '#trade-window' };
    for (const p of doc?.querySelectorAll?.('.glitch-modal:not([hidden])') || []) {
      if (!ignored(p) && shownToPlayer(p, win)) return { reason: 'panel', what: nameOf(p) };
    }
    for (const d of doc?.querySelectorAll?.('[role="dialog"][aria-modal="true"], dialog[open]') || []) {
      if (!ignored(d) && shownToPlayer(d, win)) return { reason: 'modal', what: nameOf(d) };
    }
  } catch { /* no page */ }
  return { reason: '', what: '' };
}

/** The pill waits while this says why ('' when nothing): blockingDetail's reason. */
export function blockingUi(engine, doc = globalThis.document, win = globalThis) {
  return blockingDetail(engine, doc, win).reason;
}

/** A pill hidden this long while an update waits says the news once more (HiddenNudge). */
export const HIDDEN_NUDGE_MS = 5 * 60_000;

/**
 * The fallback (2026-11-19): an update waits but the pill has stayed hidden for HIDDEN_NUDGE_MS in a
 * row (something held it back), so the "A new version is ready" line is said once more, once per
 * page. update(shown) is called with each placement; it is true the one time the line is due.
 */
export function createHiddenNudge({ now = () => Date.now(), after = HIDDEN_NUDGE_MS } = {}) {
  let since = null;
  let said = false;
  return {
    update(shown) {
      if (shown) {
        since = null;
        return false;
      }
      if (since == null) since = now();
      if (said || now() - since < after) return false;
      said = true;
      return true;
    },
    /** How long the pill has been hidden while an update waits (0 while it shows). */
    get hiddenFor() { return since == null ? 0 : Math.max(0, now() - since); },
    get said() { return said; },
  };
}

/**
 * PURE: the update state in a report (bug-report-feature reportContext, in its `panels`):
 * "upd d35e7518 current" (no newer build found), "upd d35e7518>f0e1d2c3 shown" (the pill is up), or
 * "upd d35e7518>f0e1d2c3 hidden 63m modal #craftybot-label" (what held it back). '' on an unstamped page.
 */
export function updateLine({ own = '', latest = '', shown = false, hiddenMs = 0, reason = '', what = '' } = {}) {
  if (!own) return '';
  if (!latest) return `upd ${own} current`;
  if (shown) return `upd ${own}>${latest} shown`;
  const mins = Math.floor(Math.max(0, Number(hiddenMs) || 0) / 60_000);
  return [`upd ${own}>${latest} hidden ${mins}m`, reason, what].filter(Boolean).join(' ');
}

/**
 * Saves, then reloads (the Update ready click). Solo: engine.save() writes the save to this browser
 * at once. Multiplayer: engine.save() and then the store's flush, which resolves once the cloud save
 * is written; the page reloads only when it was ('saved', or 'pending' when a newer change came in
 * meanwhile: the page's own pagehide flush sends that one). The location is written by the game's
 * own beforeunload, as on any reload. Resolves to true when it reloaded.
 * @param {{ engine: object, store?: { flush?: Function }, reload: () => void, say?: (text: string) => void }} opts
 */
export async function saveThenReload({ engine, store, reload, say = () => {} }) {
  try {
    // G737: game.js savePlayerState says false when the save did not go in; the page must not reload then.
    if (engine?.save?.() === false) throw new Error('not saved');
  } catch {
    say(UPDATE_TEXT.notSaved);
    return false;
  }
  if (typeof store?.flush === 'function') {
    let state = '';
    try {
      state = await store.flush();
    } catch {
      state = 'offline';
    }
    if (state !== 'saved' && state !== 'pending') {
      say(UPDATE_TEXT.notSaved);
      return false;
    }
  }
  reload();
  return true;
}
