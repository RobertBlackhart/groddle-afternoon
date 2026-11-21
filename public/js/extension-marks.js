/**
 * What a bug report can honestly learn about browser extensions that may be changing the game page
 * (#585: an empty Quests list on Firefox that stock AdGuard and uBlock did not reproduce; most likely
 * a hiding rule the player made). A page cannot list extensions, and this never probes extension
 * URLs or files (that would be fingerprinting). It only reads what is already in the game page:
 *
 * - the bait check (startBaitCheck): a small element off screen with class names ad-block lists
 *   hide (BAIT_CLASSES), read again after a frame and a short wait: hidden, no size or removed
 *   means an ad blocker's cosmetic rules run on this page ("yes"), else "no". Then it is removed.
 * - page marks (pageMarks): traces extensions leave in the page, from the table KNOWN_MARKS (one
 *   selector each, easy to extend), then generic ones: custom elements (a tag with a hyphen; the
 *   game has none), style, script or link elements put straight under <html> (the game only uses
 *   head and body), and elements whose src or href is already an extension's own URL.
 *
 * The report form also asks, optionally, which extensions the player uses (js/ui/reports-sheet.js).
 * The three ride in the report's context as adblock, marks and extensions (the site's
 * BugReports.php CONTEXT keeps them).
 */

/** Class names common ad-block lists hide (EasyList's generic element hiding). */
export const BAIT_CLASSES = 'adsbox ad-banner pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads';

/** How long the bait waits after a frame before it is read: generic rules can arrive a little later. */
export const BAIT_WAIT_MS = 600;

/** Known marks: a name and one selector that finds its trace. Add a row to know another. */
export const KNOWN_MARKS = Object.freeze([
  { name: 'Dark Reader', selector: 'html[data-darkreader-mode], html[data-darkreader-scheme], html[data-darkreader-proxy-injected], style.darkreader, meta[name="darkreader"]' },
  { name: 'Grammarly', selector: 'body[data-gr-ext-installed], body[data-new-gr-c-s-check-loaded], grammarly-desktop-integration, grammarly-extension, grammarly-popups' },
  { name: 'LanguageTool', selector: 'html[data-lt-installed], lt-toolbar, lt-mirror, lt-highlighter' },
  { name: 'Stylus', selector: 'style.stylus, style[id^="stylus-"]' },
  { name: 'LastPass', selector: '[data-lastpass-root], [data-lastpass-icon-root]' },
  { name: '1Password', selector: 'com-1password-button, com-1password-menu, [data-com-onepassword-filled]' },
  { name: 'Page translated', selector: 'html.translated-ltr, html.translated-rtl' },
]);

const EXTENSION_URL = ['chrome-extension:', 'moz-extension:', 'safari-web-extension:', 'ms-browser-extension:'];
const EXTENSION_FILES = EXTENSION_URL.flatMap((s) => [`[src^="${s}"]`, `[href^="${s}"]`]).join(', ');
/** How long the marks line may be (BugReports.php CONTEXT 'marks'). */
export const MARKS_MAX = 200;

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function matches(node, selector) {
  try { return Boolean(node?.matches?.(selector)); } catch { return false; }
}

/** The names of the marks found in doc: known ones first, then the generic counts. Read only. */
export function pageMarks(doc = globalThis.document, marks = KNOWN_MARKS) {
  const out = [];
  const html = doc?.documentElement;
  if (!html) return out;
  for (const m of marks) {
    let hit = null;
    try { hit = doc.querySelector(m.selector); } catch { hit = null; }
    if (hit) out.push(m.name);
  }
  const known = marks.map((m) => m.selector).join(', ');
  // Custom elements: the game makes none, so each tag with a hyphen came from outside it.
  const tags = new Set();
  for (const n of doc.querySelectorAll?.('*') || []) {
    const tag = String(n.localName || n.tagName || '').toLowerCase();
    if (tag.includes('-') && !matches(n, known)) tags.add(tag);
  }
  if (tags.size) out.push(`${plural(tags.size, 'other element', 'other elements')} (${[...tags].slice(0, 3).join(', ')}${tags.size > 3 ? ', …' : ''})`);
  // The game puts its style, script and link elements in head or body, never straight under <html>.
  const loose = { style: 0, script: 0, link: 0 };
  for (const n of html.children || []) {
    const tag = String(n.localName || n.tagName || '').toLowerCase();
    if (tag in loose && !matches(n, known)) loose[tag] += 1;
  }
  if (loose.style) out.push(`${plural(loose.style, 'injected style tag', 'injected style tags')}`);
  if (loose.script) out.push(`${plural(loose.script, 'injected script', 'injected scripts')}`);
  if (loose.link) out.push(`${plural(loose.link, 'injected link', 'injected links')}`);
  // An extension's own files already in the page (their URLs are read from it, never asked for).
  let files = 0;
  try { files = (doc.querySelectorAll(EXTENSION_FILES) || []).length; } catch { files = 0; }
  if (files) out.push(plural(files, 'extension file', 'extension files'));
  return out;
}

/** The marks as one line for the report: "Dark Reader, Grammarly, 2 injected style tags". */
export function marksLine(doc = globalThis.document, marks = KNOWN_MARKS) {
  let list = [];
  try { list = pageMarks(doc, marks); } catch { list = []; }
  return list.join(', ').slice(0, MARKS_MAX);
}

/** True when the bait is hidden: removed, display none, invisible or no size. */
export function baitHidden(node, win = globalThis) {
  if (!node || node.isConnected === false) return true;
  let cs = null;
  try { cs = win.getComputedStyle?.(node) || null; } catch { cs = null; }
  if (cs && (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || Number(cs.opacity) === 0)) return true;
  const rects = node.getClientRects?.();
  if (rects && !rects.length) return true;
  const box = node.getBoundingClientRect?.();
  return Boolean(box && (!box.width || !box.height));
}

/** Puts the bait in the page: off screen, unseen by assistive tech, out of the report's picture (#wrap). */
export function placeBait(doc = globalThis.document) {
  const node = doc.createElement('div');
  node.className = BAIT_CLASSES;
  node.setAttribute('aria-hidden', 'true');
  node.setAttribute('data-report-bait', '');
  node.style.cssText = 'position:absolute;left:-10000px;top:-10000px;width:4px;height:4px;overflow:hidden;pointer-events:none;';
  node.textContent = ' ';
  (doc.body || doc.documentElement).append(node);
  return node;
}

/**
 * Starts a bait check: the bait now, read after a frame and `wait` ms, then removed. read() gives
 * "yes" (an ad blocker hides it), "no", or reads it at once while the wait still runs; stop() removes it.
 */
export function startBaitCheck({ doc = globalThis.document, win = globalThis, wait = BAIT_WAIT_MS } = {}) {
  let node = null;
  let result = '';
  let timer = 0;
  try { node = placeBait(doc); } catch { node = null; }
  const finish = () => {
    if (!result && node) result = baitHidden(node, win) ? 'yes' : 'no';
    try { node?.remove?.(); } catch { /* gone */ }
    node = null;
    if (timer) win.clearTimeout?.(timer);
    timer = 0;
  };
  if (node) {
    const later = () => { timer = win.setTimeout?.(finish, wait) || 0; };
    if (typeof win.requestAnimationFrame === 'function') win.requestAnimationFrame(later);
    else later();
  }
  return {
    read() {
      if (!result && node) result = baitHidden(node, win) ? 'yes' : 'no';
      return result;
    },
    stop: finish,
  };
}
