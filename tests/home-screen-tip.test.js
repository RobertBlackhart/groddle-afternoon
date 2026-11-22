/**
 * G807 (#345): tell iPhone and iPad players that Safari's Add to Home Screen opens the game full
 * screen, like an app. Once, until closed (remembered per browser), never in the Home Screen app
 * itself, and only where it works: the pages carry the web app meta and manifest that make it so.
 * Run: node --test tests/home-screen-tip.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { HOME_SCREEN_TEXT, HOME_SCREEN_TIP_KEY, dismissTip, homeScreenTipDue, iosSafari, mountHomeScreenTip, runsStandalone, tipDismissed } from '../public/js/home-screen-tip.js?v=d6aa7d11';
import { FakeEl } from './fake-scene.js';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, 'public', rel), 'utf8');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15';
const IPHONE_CHROME = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
const MAC = IPAD_DESKTOP;

function memory({ broken = false } = {}) {
  const m = new Map();
  return {
    getItem: (k) => { if (broken) throw new Error('blocked'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (broken) throw new Error('blocked'); m.set(k, String(v)); },
  };
}

function fakeDoc() {
  const byId = new Map();
  const head = new FakeEl('head');
  const body = new FakeEl('body');
  const track = (el) => {
    const append = el.append.bind(el);
    el.append = (...kids) => { for (const k of kids) if (k?.id) byId.set(k.id, k); append(...kids); };
    el.remove = () => { byId.delete(el.id); };
    return el;
  };
  track(head);
  track(body);
  return { head, body, getElementById: (id) => byId.get(id) || null, createElement: (t) => track(new FakeEl(t)) };
}

describe('G807: the Add to Home Screen tip', () => {
  it('iPhone and iPad Safari only (an iPad asks for the desktop site: MacIntel with touch)', () => {
    assert.equal(iosSafari({ userAgent: IPHONE }), true);
    assert.equal(iosSafari({ userAgent: IPAD_DESKTOP, platform: 'MacIntel', maxTouchPoints: 5 }), true);
    assert.equal(iosSafari({ userAgent: MAC, platform: 'MacIntel', maxTouchPoints: 0 }), false);
    assert.equal(iosSafari({ userAgent: IPHONE_CHROME }), false);
    assert.equal(iosSafari({ userAgent: ANDROID }), false);
    assert.equal(iosSafari({}), false);
  });

  it('due until closed, never in the Home Screen app; ?hstip= forces it for QA', () => {
    assert.equal(homeScreenTipDue({ nav: { userAgent: IPHONE } }), true);
    assert.equal(homeScreenTipDue({ nav: { userAgent: IPHONE }, standalone: true }), false);
    assert.equal(homeScreenTipDue({ nav: { userAgent: IPHONE }, dismissed: true }), false);
    assert.equal(homeScreenTipDue({ nav: { userAgent: ANDROID } }), false);
    assert.equal(homeScreenTipDue({ nav: { userAgent: ANDROID }, qa: '1' }), true);
    assert.equal(homeScreenTipDue({ nav: { userAgent: IPHONE }, qa: '0' }), false);
    assert.equal(runsStandalone({ navigator: { standalone: true } }), true);
    assert.equal(runsStandalone({ navigator: {}, matchMedia: (q) => ({ matches: q === '(display-mode: standalone)' }) }), true);
    assert.equal(runsStandalone({ navigator: {}, matchMedia: () => ({ matches: false }) }), false);
    assert.equal(runsStandalone({ get navigator() { throw new Error('no'); } }), false);
  });

  it('the close is remembered per browser; blocked storage never throws', () => {
    const s = memory();
    assert.equal(tipDismissed(s), false);
    dismissTip(s);
    assert.equal(tipDismissed(s), true);
    assert.equal(s.getItem(HOME_SCREEN_TIP_KEY), '1');
    const broken = memory({ broken: true });
    assert.doesNotThrow(() => dismissTip(broken));
    assert.equal(tipDismissed(broken), false);
    assert.equal(tipDismissed(null), false);
  });

  it('mounts once on an iPhone, and Got it hides it for good', () => {
    const doc = fakeDoc();
    const storage = memory();
    const win = { navigator: { userAgent: IPHONE }, matchMedia: () => ({ matches: false }), location: { search: '' }, localStorage: storage };
    const tip = mountHomeScreenTip(doc, { host: doc.body, win });
    assert.ok(tip);
    assert.equal(mountHomeScreenTip(doc, { host: doc.body, win }), tip, 'one tip');
    const close = tip.all().find((n) => n.dataset?.homeScreenTipClose === '');
    assert.equal(close.textContent, HOME_SCREEN_TEXT.close);
    close.fire('click');
    assert.equal(tip.hidden, true);
    assert.equal(storage.getItem(HOME_SCREEN_TIP_KEY), '1');
    assert.equal(mountHomeScreenTip(fakeDoc(), { win }), null, 'closed: not again');
    const android = { ...win, navigator: { userAgent: ANDROID }, localStorage: memory() };
    assert.equal(mountHomeScreenTip(fakeDoc(), { win: android }), null);
    assert.equal(mountHomeScreenTip(fakeDoc(), { win: { ...win, navigator: { userAgent: IPHONE, standalone: true }, localStorage: memory() } }), null);
  });

  it('plain short words, no em dashes', () => {
    for (const t of Object.values(HOME_SCREEN_TEXT)) assert.doesNotMatch(t, /[–—]/);
    assert.match(HOME_SCREEN_TEXT.body, /Add to Home Screen/);
    assert.ok(HOME_SCREEN_TEXT.body.length < 120);
  });

  it('the phone page and the game show it; every page it shows on can go full screen', () => {
    assert.match(read('js/phone/companion.js'), /mountHomeScreenTip\(doc, \{ host: play \}\);/);
    assert.match(read('game.js'), /mountHomeScreenTip\(document, \{ host: document\.body, floating: true \}\);/);
    for (const page of ['play/index.html', 'play/online/index.html', 'play/phone/index.html']) {
      const html = read(page);
      assert.match(html, /<link rel="manifest" href="manifest\.webmanifest" \/>/, page);
      assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes" \/>/, page);
      assert.match(html, /<link rel="apple-touch-icon" /, page);
    }
    const manifest = JSON.parse(read('manifest.webmanifest'));
    assert.equal(manifest.display, 'standalone');
  });
});
