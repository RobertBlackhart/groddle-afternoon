/**
 * #345: on an iPhone, Add to Home Screen with "Open as Web App" plays full screen, like an app. The play
 * pages (solo, online, and the phone page a phone opens first) now name a web app manifest
 * (public/manifest.webmanifest: display standalone, the site's icons and its ground colour #dcefc9) and
 * Safari's apple-mobile-web-app-* tags, so that is how it opens. No start_url: it opens the page it was
 * added from, and the phone gate there still shows the phone page first (Austin 2026-11-13).
 * Browser check: WebKit (402 x 812, iPhone) fetches and parses it from /play/phone/ (where /play/online/
 * sends a phone) and every icon loads; Chrome with the iPhone's insets (62/34 upright, 62/21 sideways)
 * keeps the HUD inside them. Standalone itself (display-mode) needs a real iPhone.
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
      assert.match(html, /<meta name="theme-color" content="#dcefc9" \/>/, page);
      assert.match(html, /viewport-fit=cover/, page);
    }
  });
});
