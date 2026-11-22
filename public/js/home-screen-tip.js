/**
 * G807 (#345): on an iPhone or iPad, Safari's Add to Home Screen opens the game full screen, like an
 * app (the play pages' manifest.webmanifest, display standalone, and apple-mobile-web-app-capable),
 * but players did not know. A short tip says so, in iPhone and iPad Safari only, never in the Home
 * Screen app itself, until it is closed; the close is remembered per browser (localStorage, every
 * access in try/catch: a private window just shows it again). A new idea, not Glitch's.
 *
 * Where: the phone page's Play card (js/phone/companion.js, where a phone or touch tablet lands
 * first) and the game (game.js, for an iPad that plays the full game), one key for both.
 * QA: `?hstip=1` shows it in any browser; `?hstip=0` never.
 */

export const HOME_SCREEN_TIP_KEY = 'groddle-home-screen-tip';

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

function storageOf(win) {
  try {
    return win?.localStorage || null;
  } catch {
    return null;
  }
}

export function tipDismissed(storage) {
  try {
    return storage?.getItem(HOME_SCREEN_TIP_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissTip(storage) {
  try {
    storage?.setItem(HOME_SCREEN_TIP_KEY, '1');
  } catch {
    /* a private window: hidden for this visit only */
  }
}

const STYLE = `
.hs-tip { display: flex; align-items: flex-start; gap: 10px; box-sizing: border-box; padding: 10px 12px; border-radius: 14px;
  background: var(--surface-card, #fffdf6); color: var(--c-green-37, #2f5a2b); border: 1px solid color-mix(in srgb, #7aa35a 45%, transparent);
  box-shadow: 0 6px 20px color-mix(in srgb, #000 16%, transparent); font-size: 0.9rem; line-height: 1.35; text-align: left; }
.hs-tip[hidden] { display: none; }
.hs-tip div { flex: 1; min-width: 0; }
.hs-tip strong { display: block; margin-bottom: 2px; }
.hs-tip button { flex: none; min-height: 32px; padding: 4px 12px; border: 0; border-radius: 999px; font: inherit; font-weight: 700; cursor: pointer;
  color: #fff; background: var(--c-violet-54, #7a4fc4); }
.hs-tip.is-floating { position: fixed; z-index: var(--z-overlay, 32); left: 50%; transform: translateX(-50%); width: min(380px, calc(100% - 32px));
  top: calc(env(safe-area-inset-top, 0px) + 64px); }
`;

/**
 * The tip, made and placed when it is due; null otherwise. `floating` puts it over the game, under
 * the top bar; without it, it goes at the end of `host` (the phone page's Play card).
 * @param {Document} doc
 * @param {{ host?: Element, floating?: boolean, win?: Window }} o
 */
export function mountHomeScreenTip(doc, { host = doc?.body, floating = false, win = globalThis.window } = {}) {
  if (!doc || !host) return null;
  const storage = storageOf(win);
  let qa = '';
  try {
    qa = new URLSearchParams(String(win?.location?.search || '')).get('hstip') || '';
  } catch {
    qa = '';
  }
  if (!homeScreenTipDue({ nav: win?.navigator || {}, standalone: runsStandalone(win), dismissed: tipDismissed(storage), qa })) return null;
  if (doc.getElementById?.('home-screen-tip')) return doc.getElementById('home-screen-tip');
  if (!doc.getElementById?.('home-screen-tip-css')) {
    const style = doc.createElement('style');
    style.id = 'home-screen-tip-css';
    style.textContent = STYLE;
    doc.head?.append(style);
  }
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
