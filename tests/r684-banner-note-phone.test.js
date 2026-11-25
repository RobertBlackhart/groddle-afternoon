/**
 * #684 (a phone, upright 402x849 and sideways 874x402): Decoration Mode's note under the banner (why a
 * button is off, #182) was centred on the banner (style.css BUILDER), but a phone docks the banner at the
 * left (PHONE LAYOUT, the home's row), so a note wider than the banner ran off the screen's left edge
 * (-59 px upright, -132 px sideways). It hangs from the banner's left now and is no wider than the screen.
 * Run: node --test tests/r684-banner-note-phone.test.js
 */
import { after as afterAll, before as beforeAll, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'public/style.css'), 'utf8');
const NOTE = 'The next expansion will cost 1 Wall Segment (you have 0). A Wall Segment is made with a Construction Tool.';

let chromium = null;
try { chromium = (await import('playwright')).chromium; } catch { /* no Playwright */ }

describe('#684 the banner note stays on a phone screen', { skip: !chromium && 'no playwright' }, () => {
  const LOCK_WAIT_MS = 30 * 60_000;
  let chrome = null;
  beforeAll(async () => {
    const { openBrowser } = await import('../tools/qa/browser.mjs');
    chrome = await openBrowser({ label: 'r684 banner note test', waitMs: LOCK_WAIT_MS });
  }, { timeout: LOCK_WAIT_MS + 60_000 });
  afterAll(async () => { await chrome?.close(); });

  it('upright 402x849 and sideways 874x402, and centred on a computer', { timeout: 120_000 }, async () => {
    for (const [w, h, phone] of [[402, 849, true], [874, 402, true], [1440, 900, false]]) {
      const ctx = await chrome.browser.newContext({ viewport: { width: w, height: h } });
      const page = await ctx.newPage();
      await page.setContent(`<!doctype html><html data-ui="modern" class="${phone ? 'phone-layout touch-phone' : ''}" style="--pr-homes-l: 8px; --pr-homes-t: 180px"><head><style>${css}</style></head>
<body><div id="game-root" style="position: fixed; inset: 0"><div class="homes-bar hb-builder"><header class="hb-banner"><div class="hb-banner-text"><p class="hb-title">Decorating</p></div>
<div class="hb-banner-actions"><button class="hb-bt">Expand</button></div><button class="hb-close">×</button><p class="hb-banner-note">${NOTE}</p></header></div></div></body></html>`);
      const r = await page.$eval('.hb-banner-note', (e) => ({ note: e.getBoundingClientRect().toJSON(), banner: e.parentElement.getBoundingClientRect().toJSON(), vw: innerWidth }));
      await ctx.close();
      assert.ok(r.note.left >= 0, `${w}x${h}: note left ${Math.round(r.note.left)} is on the screen`);
      assert.ok(r.note.right <= r.vw, `${w}x${h}: note right ${Math.round(r.note.right)} within ${r.vw}`);
      if (phone) assert.ok(Math.abs(r.note.left - r.banner.left) < 2, `${w}x${h}: note hangs from the banner's left (${JSON.stringify([r.note.left, r.banner.left])})`);
      else assert.ok(Math.abs((r.note.left + r.note.right) / 2 - (r.banner.left + r.banner.right) / 2) < 1, 'centred on the banner on a computer');
    }
  });
});
