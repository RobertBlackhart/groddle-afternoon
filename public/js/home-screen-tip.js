/**
 * G807 (#345): on an iPhone or iPad, Safari's Add to Home Screen opens the game full screen, like an
 * app (the play pages' manifest.webmanifest, display standalone, and apple-mobile-web-app-capable),
 * but players did not know. A short tip says so, in iPhone and iPad Safari only, never in the Home
 * Screen app itself, until it is closed; the close is remembered per browser (every access in
 * try/catch: a private window just shows it again). A new idea, not Glitch's.
 *
 * Where: the phone page's Play card (js/phone/companion.js, where a phone or touch tablet lands
 * first, loading this module only on an iPhone or iPad) and the game (game.js, for an iPad that
 * plays the full game). One key for both: the game's device-preference cache (js/classic/ui-mode.js
 * readUiCache / writeUiCache, key HOME_SCREEN_TIP_CACHE), which the phone page reads by its full
 * name. The caller hands the store in ({ get(), set(v) }); this module touches no storage itself.
 * Its look is in style.css (the game) and play/phone/phone.css (the phone page), from the tokens.
 * QA: `?hstip=1` shows it in any browser; `?hstip=0` never.
 */

/** The ui-mode cache key (readUiCache), and its full stored name (UI_CACHE_PREFIX + it). */
export const HOME_SCREEN_TIP_CACHE = 'homeScreenTip';
export const HOME_SCREEN_TIP_KEY = `groddle.ui.cache.${HOME_SCREEN_TIP_CACHE}`;

export const HOME_SCREEN_TEXT = Object.freeze({
  title: 'Play full screen',
  body: 'In Safari, tap Share, then Add to Home Screen. The game opens from your Home Screen full screen, like an app.',
  close: 'Got it',
  closeLabel: 'Hide this tip',
});

/** PURE: true in iPhone or iPad Safari (an iPad asks for the desktop site, so MacIntel with touch counts). */
export function iosSafari(nav = {}) {
  const ua = String(nav.userAgent || '');
  const ios = /iPhone|iPad|iPod/.test(ua) || (nav.platform === 'MacIntel' && Number(nav.maxTouchPoints) > 1);
  if (!ios) return false;
  // Other browsers and in-app views on iOS: their own menus, or no Add to Home Screen at all.
  return /Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(ua);
}

/** PURE: true when the page already runs as a Home Screen app. */
export function runsStandalone(win = globalThis.window) {
  try {
    if (win?.navigator?.standalone === true) return true;
    return Boolean(win?.matchMedia?.('(display-mode: standalone)')?.matches);
  } catch {
    return false;
  }
}

/**
 * PURE: whether to show the tip. qa: the ?hstip= value ('1' always, '0' never, '' by the device).
 * @param {{ nav?: object, standalone?: boolean, dismissed?: boolean, qa?: string }} o
 */
export function homeScreenTipDue({ nav = {}, standalone = false, dismissed = false, qa = '' } = {}) {
  if (qa === '0') return false;
  if (qa === '1') return true;
  return iosSafari(nav) && !standalone && !dismissed;
}

/** True once the tip was closed in this browser. store: { get() } (null: never closed). */
export function tipDismissed(store) {
  try {
    return String(store?.get?.() ?? '') === '1';
  } catch {
    return false;
  }
}

export function dismissTip(store) {
  try {
    store?.set?.('1');
  } catch {
    /* a private window: hidden for this visit only */
  }
}

/**
 * The tip, made and placed when it is due; null otherwise. `floating` puts it over the game, under
 * the top bar; without it, it goes at the end of `host` (the phone page's Play card).
 * @param {Document} doc
 * @param {{ host?: Element, floating?: boolean, win?: Window, store?: { get: () => any, set: (v: string) => void }, force?: boolean }} o
 */
export function mountHomeScreenTip(doc, { host = doc?.body, floating = false, win = globalThis.window, store = null, force = false } = {}) {
  if (!doc || !host) return null;
  const storage = store;
  let qa = '';
  try {
    qa = new URLSearchParams(String(win?.location?.search || '')).get('hstip') || '';
  } catch {
    qa = '';
  }
  // PHONE LAYOUT (G1194): `force` shows it when asked for (the pill's Full screen on an iPhone, where
  // Safari has no full screen for a page), even after it was closed.
  if (!force && !homeScreenTipDue({ nav: win?.navigator || {}, standalone: runsStandalone(win), dismissed: tipDismissed(storage), qa })) return null;
  if (doc.getElementById?.('home-screen-tip')) return doc.getElementById('home-screen-tip');
  const tip = doc.createElement('aside');
  tip.id = 'home-screen-tip';
  tip.className = `hs-tip${floating ? ' is-floating' : ''}`;
  tip.setAttribute('role', 'note');
  tip.setAttribute('aria-label', HOME_SCREEN_TEXT.title);
  const words = doc.createElement('div');
  const title = doc.createElement('strong');
  title.textContent = HOME_SCREEN_TEXT.title;
  const body = doc.createElement('span');
  body.textContent = HOME_SCREEN_TEXT.body;
  words.append(title, body);
  const close = doc.createElement('button');
  close.type = 'button';
  close.textContent = HOME_SCREEN_TEXT.close;
  close.setAttribute('aria-label', HOME_SCREEN_TEXT.closeLabel);
  close.dataset.homeScreenTipClose = '';
  close.addEventListener('click', () => {
    dismissTip(storage);
    tip.hidden = true;
    tip.remove?.();
  });
  tip.append(words, close);
  host.append(tip);
  return tip;
}
