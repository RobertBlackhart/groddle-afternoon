/**
 * #345: on an iPhone, Add to Home Screen with "Open as Web App" plays full screen, like an app. The play
 * pages (solo, online, and the phone page a phone opens first) now name a web app manifest
 * (public/manifest.webmanifest: display standalone, the site's icons and its ground colour #dcefc9) and
 * Safari's apple-mobile-web-app-* tags, so that is how it opens. No start_url: it opens the page it was
 * added from, and the phone gate there still shows the phone page first (Austin 2026-11-13).
 * Browser check: WebKit (402 x 812, iPhone) fetches and parses it from /play/phone/ (where /play/online/
 * sends a phone) and every icon loads; Chrome with the iPhone's insets (62/34 upright, 62/21 sideways)
 * keeps the HUD inside them. Standalone itself (display-mode) needs a real iPhone.
 *
 * #595 (iOS 27 Safari, upright): a light fog in the status bar over the game. Liquid Glass Safari
 * runs the page under the status bar and fades that strip to the page's colour or a fixed top bar's;
 * the play pages paint it the game's dark (style.css, a fixed strip --safe-t tall, 0 sideways and on a
 * computer) and their theme colour is that dark too.
 * Run: node --test tests/web-app-manifest.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const pub = join(import.meta.dirname, '../public');
const manifest = JSON.parse(readFileSync(join(pub, 'manifest.webmanifest'), 'utf8'));
/** A PNG's width and height from its IHDR. */
const pngSize = (file) => { const b = readFileSync(join(pub, file)); return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`; };

describe('Add to Home Screen opens Groddle Afternoon as an app', () => {
  it('the manifest names the game, opens standalone and covers the whole site', () => {
    assert.equal(manifest.name, 'Groddle Afternoon');
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.scope, '/');
    assert.equal(manifest.start_url, undefined, 'it opens the page it was added from');
    assert.equal(manifest.theme_color, '#dcefc9');
    assert.match(manifest.background_color, /^#[0-9a-f]{6}$/);
  });

  it('its icons are the site\'s own, at the sizes it says', () => {
    for (const icon of manifest.icons) {
      if (icon.type === 'image/png') assert.equal(pngSize(icon.src), icon.sizes, icon.src);
      else readFileSync(join(pub, icon.src));
    }
    assert.ok(manifest.icons.some((i) => i.sizes === '192x192'));
  });

  it('every play page links it with Safari\'s web app tags, under a cover viewport', () => {
    for (const page of ['play/index.html', 'play/online/index.html', 'play/phone/index.html']) {
      const html = readFileSync(join(pub, page), 'utf8');
      assert.match(html, /<link rel="manifest" href="manifest\.webmanifest" \/>/, page);
      assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes" \/>/, page);
      assert.match(html, /<meta name="mobile-web-app-capable" content="yes" \/>/, page);
      assert.match(html, /<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" \/>/, page);
      // #595: the game pages' status bar is the game's dark; the phone page keeps the site's ground.
      assert.match(html, page === 'play/phone/index.html' ? /<meta name="theme-color" content="#dcefc9" \/>/ : /<meta name="theme-color" content="#2a2a2a" \/>/, page);
      assert.match(html, /viewport-fit=cover/, page);
    }
  });

  it('upright on a phone, the status bar strip and the page colour are the game\'s dark (#595)', () => {
    const css = readFileSync(join(pub, 'style.css'), 'utf8');
    const rule = css.match(/:root\.touch-phone body::before \{([^}]*)\}/)?.[1] || '';
    assert.match(rule, /position: fixed;/);
    assert.match(rule, /top: 0;/);
    assert.match(rule, /height: var\(--safe-t\);/, 'the top inset: 0 sideways and on a computer');
    assert.match(rule, /background: var\(--c-grey-29\);/);
    assert.match(rule, /pointer-events: none;/);
    assert.match(css, /:root\.touch-phone,\n:root\.touch-phone body \{ background-color: var\(--c-grey-29\); \}/);
    assert.match(css, /--c-grey-29: #2a2a2a;/);
    assert.match(css, /--safe-t: env\(safe-area-inset-top, 0px\);/);
  });
});

