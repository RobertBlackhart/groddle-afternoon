/**
 * #685 (an iPhone, upright): the Buddies window ran under the status bar. It and its kin (Groups,
 * Account, House Keys and the Butler, a home street's window, Interface) were sized to the screen less
 * 2rem (#272/#280) with no top inset. One rule (style.css PHONEPANELS) keeps the shade clear of the safe
 * area (--safe-t, which upright takes the status bar's fade too, R52) and the window that much shorter.
 * WebKit has no env() inset in a test, so --safe-t is set the way phone-layout.test.js does.
 * Run: node --test tests/r685-panel-safe-top.test.js
 */
import { after as afterAll, before as beforeAll, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const css = read('public/style.css');
/** A feature's injected STYLE string, as its source holds it. */
const styleOf = (p, name = 'STYLE') => {
  const src = read(p);
  const at = src.indexOf(`const ${name} = \``);
  assert.ok(at >= 0, `${p} has ${name}`);
  return src.slice(at + name.length + 10, src.indexOf('`;', at));
};
const PANELS = [
  ['public/js/features/buddies-feature.js', 'buddies'],
  ['public/js/features/groups-feature.js', 'grp'],
  ['public/js/features/account-backup-feature.js', 'account'],
  ['public/js/features/neighbours-mp-feature.js', 'keys'],
  ['public/js/features/home-street-mp-feature.js', 'hs'],
  ['public/js/classic/classic-prefs.js', 'prefs', 'PREFS_STYLE'],
];

let webkit = null;
try { await import('../tools/qa/playwright-env.mjs'); webkit = (await import('playwright')).webkit; } catch { /* no Playwright */ }

describe('#685 the Menu windows keep clear of the status bar', { skip: !webkit && 'no playwright' }, () => {
  const LOCK_WAIT_MS = 30 * 60_000;
  let wk = null;
  beforeAll(async () => {
    const { openBrowser } = await import('../tools/qa/browser.mjs');
    wk = await openBrowser({ engine: 'webkit', label: 'r685 panel safe top test', waitMs: LOCK_WAIT_MS });
  }, { timeout: LOCK_WAIT_MS + 60_000 });
  afterAll(async () => { await wk?.close(); });

  it('an iPhone 402x874 upright (inset 59 px plus the fade) and a computer', { timeout: 120_000 }, async () => {
    for (const [w, h, safeT, safeB] of [[402, 874, 73, 34], [1440, 900, 0, 0]]) {
      const ctx = await wk.browser.newContext({ viewport: { width: w, height: h }, ...(safeT ? { isMobile: true, hasTouch: true } : {}) });
      const page = await ctx.newPage();
      for (const [file, k, name] of PANELS) {
        const panel = k === 'prefs' ? 'prefs-window' : `${k}-panel`;
        const rows = Array.from({ length: 60 }, (_, i) => `<li>Row ${i}</li>`).join('');
        await page.setContent(`<!doctype html><html data-ui="modern" class="${safeT ? 'touch-phone' : ''}" style="--safe-t: ${safeT}px; --safe-b: ${safeB}px"><head><style>${css}</style><style>${styleOf(file, name)}</style></head>
<body><div class="${k}-shade"><section class="${panel}"><h2>Window</h2><ul>${rows}</ul></section></div></body></html>`);
        const r = await page.$eval(`.${panel}`, (e) => ({ ...e.getBoundingClientRect().toJSON(), vh: innerHeight }));
        assert.ok(r.top >= safeT, `${w}x${h} ${panel}: top ${Math.round(r.top)} clears the ${safeT} px status bar`);
        assert.ok(r.bottom <= r.vh - safeB, `${w}x${h} ${panel}: bottom ${Math.round(r.bottom)} clears the home bar`);
        if (!safeT) assert.equal(Math.round(r.top), 16, `${panel}: a computer keeps its 16 px`);
      }
      await ctx.close();
    }
  });
});
