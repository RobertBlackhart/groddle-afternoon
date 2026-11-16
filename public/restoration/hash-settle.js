/**
 * A #link into /restoration/ lands on its heading (#made-h, #honest-h, #rooms, #room-<id>...).
 *
 * The browser jumps to the anchor while the page is still short: restoration.js fills the street,
 * the systems board, the numbers, the quest rooms and the designers' levels from data.json after
 * the jump, and they grow the page by thousands of pixels (about 7,300 on a 1280 wide window), so
 * the heading moved far down after the jump. With the page's smooth scrolling (restoration.css)
 * Chrome glided to the old place, and Safari never followed the heading at all. So, while the
 * page settles: the jump is instant (smooth scrolling resumes once it has settled), and each time
 * the page's height changes the target is put back at the top, under the sticky section bar (the
 * theme's style.css pads the window's top by the bar's height for anchors). It stops at the first
 * sign of the reader's own scrolling (wheel, touch, a key, a click), once the page has loaded and
 * kept still for a moment, or after a few seconds at most. A reload or a step back or forward is
 * left to the browser, which puts the reader back where they were.
 */

/** The reader's own input: after any of these the page stays where they put it. */
export const READER_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
/** Settled: the page loaded and its height kept still this long (ms). */
export const QUIET_MS = 700;
/** Give up re-landing after this long (ms), however the page is still moving. */
export const MAX_MS = 8000;

/**
 * The element a hash lands on, or null. `#room-<id>` opens that room's dialog (restoration.js), so
 * the page behind it lands on the Quest rooms band and closing the dialog leaves the reader there.
 */
export function hashTarget(hash, doc) {
  if (typeof hash !== 'string' || hash.length < 2 || hash[0] !== '#') return null;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  if (id.startsWith('room-')) return doc.getElementById('rooms');
  return doc.getElementById(id);
}

/** Whether this page load came from following a link or typing the address (not a reload or a history step). */
export function freshVisit(win) {
  const entry = win.performance.getEntriesByType?.('navigation')?.[0];
  return !entry || (entry.type !== 'reload' && entry.type !== 'back_forward');
}

/**
 * Keeps the hash's target in place while the page settles. Call it as early as the page's script
 * runs, before it fills anything. Returns { stop, done }; done() is true once it has let go.
 */
export function settleHash({ win = window, doc = document, quietMs = QUIET_MS, maxMs = MAX_MS } = {}) {
  const root = doc.documentElement;
  if (!freshVisit(win) || !hashTarget(win.location.hash, doc)) return { stop() {}, done: () => true };
  const now = () => win.performance.now();
  const start = now();
  let lastChange = start;
  let frame = 0;
  let finished = false;
  // Instant while settling, so a jump started on the short page never glides to a stale place.
  const before = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  const land = () => {
    frame = 0;
    if (finished) return;
    const target = hashTarget(win.location.hash, doc);
    if (target) target.scrollIntoView({ block: 'start' });
  };
  const changed = () => {
    lastChange = now();
    if (!frame) frame = win.requestAnimationFrame(land);
  };
  const observer = new win.ResizeObserver(changed);
  const options = { capture: true, passive: true };
  const stop = () => {
    if (finished) return;
    finished = true;
    observer.disconnect();
    if (frame) win.cancelAnimationFrame(frame);
    win.clearInterval(timer);
    for (const type of READER_EVENTS) win.removeEventListener(type, stop, options);
    win.removeEventListener('hashchange', stop);
    root.style.scrollBehavior = before;
  };
  const timer = win.setInterval(() => {
    const t = now();
    if (t - start >= maxMs || (doc.readyState === 'complete' && t - lastChange >= quietMs)) {
      land();
      stop();
    }
  }, 100);
  for (const type of READER_EVENTS) win.addEventListener(type, stop, options);
  // A link followed on the page is the reader's own move too.
  win.addEventListener('hashchange', stop);
  // The body's box grows as the sections fill and pictures load; the first call lands at once.
  observer.observe(doc.body);
  return { stop, done: () => finished };
}
