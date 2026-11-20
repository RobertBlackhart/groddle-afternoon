#!/usr/bin/env node
/**
 * Loading-card strips rendered from each street's own CC0 layers (G316, #543).
 *
 * The card's 840 x 160 street picture used to be Tiny Speck's loading_image
 * from the c2.glitch.bz CDN (Wayback), which is in no CC0 release. This draws
 * the same kind of picture with the game's own street renderer
 * (public/js/street-render.js over the CC0 glitch-locations decos): the whole
 * street, every parallax layer scaled to the street's width and stood on its
 * bottom, the bottom band of it at 840 px wide (tools/loading-strips/render.html),
 * written at SCALE times that size so the card stays sharp on a Retina screen.
 *
 * Until #543 only the 82 streets that had a CDN strip got one. Now every street in
 * assets/streets/index.json does, except the ones listed in skipped.json with the
 * reason (the render failed or drew nothing worth showing); their card has no picture,
 * as before.
 *
 * Writes public/assets/loading-strips/<street>.jpg, tools/loading-strips/skipped.json
 * and public/assets/content/loading-images.json (street tsid -> { local, tsid }; the
 * game looks a card up by the street's G or L tsid).
 *
 *   node tools/loading-strips/build.mjs [--only <tsid,...>] [--missing] [--port 8797]
 *       [--scale 2] [--quality 0.7] [--out <dir>] [--batch 40]
 *   node tools/loading-strips/build.mjs --check   (map, skip list and files agree; no browser)
 *
 * --missing renders only streets with no strip and no skip entry (resume a stopped run).
 * --out writes the pictures somewhere else and leaves the map and skip list alone (trials).
 * Takes the shared browser lock (tools/qa/browser-lock.mjs; BROWSER_LOCK or
 * GRODDLE_BROWSER_LOCK) one batch at a time, so other browser work gets turns.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const PUBLIC = join(ROOT, 'public');
export const STRIP_DIR = 'assets/loading-strips';
const MAP = join(PUBLIC, 'assets/content/loading-images.json');
const SKIPPED = join(HERE, 'skipped.json');
/** The whole set stays under this (#543: about 70 to 90 MB for every street). */
export const BUDGET_BYTES = 95 * 1024 * 1024;
/** A strip whose thumbnail's luma spread is under this is a flat sky: nothing to show. */
export const MIN_SPREAD = 4;

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
/**
 * #543: 2x the card's 840 x 160 (1680 x 320) at JPEG quality 0.7, so every street fits the
 * budget; the card draws it 980 css px wide, so a 2x screen scales it up only 1.17x.
 * (G446 had 2.5x at 0.75, about 90 KB a strip, for 82 streets; at that size the whole set
 * would be about 130 MB. 2.2x measured about 91 MiB for the set: too near the budget.)
 */
export const SCALE = Number(arg('--scale', '2'));
export const QUALITY = Number(arg('--quality', '0.7'));

/** Every street the index lists, sorted. */
export function allStreets() {
  return Object.keys(JSON.parse(readFileSync(join(PUBLIC, 'assets/streets/index.json'), 'utf8')).streets).sort();
}

/** street tsid -> { label, why } for the streets with no strip. */
export function skippedStreets() {
  return existsSync(SKIPPED) ? JSON.parse(readFileSync(SKIPPED, 'utf8')).streets : {};
}

/** street tsid -> { local, tsid } for every street that has a strip. */
export function stripMap() {
  const skipped = skippedStreets();
  const out = {};
  for (const t of allStreets()) if (!skipped[t]) out[t] = { local: `${STRIP_DIR}/${t}.jpg`, tsid: t };
  return out;
}

function check() {
  const map = JSON.parse(readFileSync(MAP, 'utf8'));
  const want = stripMap();
  const problems = [];
  const streets = new Set(allStreets());
  for (const t of Object.keys(skippedStreets())) if (!streets.has(t)) problems.push(`skipped.json names ${t}, not a street`);
  if (JSON.stringify(map) !== JSON.stringify(want)) problems.push('loading-images.json is not the strip map (run build.mjs)');
  for (const row of Object.values(want)) if (!existsSync(join(PUBLIC, row.local))) problems.push(`missing ${row.local}`);
  const shipped = new Set(Object.values(want).map((r) => r.local.split('/').pop()));
  let bytes = 0;
  for (const f of readdirSync(join(PUBLIC, STRIP_DIR))) {
    if (!shipped.has(f)) problems.push(`stray ${STRIP_DIR}/${f}`);
    bytes += statSync(join(PUBLIC, STRIP_DIR, f)).size;
  }
  if (bytes > BUDGET_BYTES) problems.push(`strips total ${(bytes / 1048576).toFixed(1)} MB, over the ${BUDGET_BYTES / 1048576} MB budget`);
  for (const p of problems) console.log(`  ${p}`);
  console.log(`${Object.keys(want).length} strips (${(bytes / 1048576).toFixed(1)} MB), ${Object.keys(skippedStreets()).length} skipped; ${problems.length} problems`);
  process.exit(problems.length ? 1 : 0);
}

const withTimeout = (p, ms) => {
  let timer;
  const late = new Promise((_, no) => { timer = setTimeout(() => no(new Error(`timed out after ${ms / 1000} s`)), ms); });
  return Promise.race([p, late]).finally(() => clearTimeout(timer));
};

async function build() {
  const { chromium } = await import('playwright');
  const { acquireLock, lockPath } = await import('../qa/browser-lock.mjs');
  const lockDir = process.env.BROWSER_LOCK ? resolve(process.env.BROWSER_LOCK) : lockPath();
  const out = arg('--out') ? resolve(arg('--out')) : join(PUBLIC, STRIP_DIR);
  const trial = Boolean(arg('--out'));
  const index = JSON.parse(readFileSync(join(PUBLIC, 'assets/streets/index.json'), 'utf8')).streets;
  const only = arg('--only') ? new Set(arg('--only').split(',')) : null;
  const skipped = trial ? {} : skippedStreets();
  let streets = allStreets().filter((t) => !only || only.has(t));
  if (process.argv.includes('--missing')) streets = streets.filter((t) => !skipped[t] && !existsSync(join(out, `${t}.jpg`)));
  const batch = Number(arg('--batch', '40'));
  const port = Number(arg('--port', '8797'));
  // The installed Chrome, as tools/qa/browser.mjs uses (GRODDLE_BROWSER_CHANNEL= for Playwright's own).
  const channel = process.env.GRODDLE_BROWSER_CHANNEL ?? 'chrome';
  mkdirSync(out, { recursive: true });
  const saveSkipped = () => {
    if (trial) return;
    const sorted = Object.fromEntries(Object.entries(skipped).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(SKIPPED, `${JSON.stringify({ about: 'Streets with no loading-card strip and why (tools/loading-strips/build.mjs, #543). Their card shows no picture.', streets: sorted }, null, 1)}\n`);
  };
  const server = spawn(process.execPath, [join(ROOT, 'tools/serve-static.mjs'), ROOT, String(port)], { stdio: 'ignore' });
  let done = 0;
  try {
    await new Promise((r) => setTimeout(r, 500));
    for (let at = 0; at < streets.length; at += batch) {
      const lock = await acquireLock({ path: lockDir, label: 'loading-strips render', waitMs: Infinity });
      let browser = null;
      try {
        browser = await chromium.launch({ ...(channel ? { channel } : {}), headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
        const context = await browser.newContext({ viewport: { width: 900, height: 300 } });
        let page = null;
        const open = async () => {
          page = await context.newPage();
          page.on('pageerror', (e) => console.log(`pageerror: ${e.message}`));
          await page.goto(`http://127.0.0.1:${port}/tools/loading-strips/render.html?scale=${SCALE}&q=${QUALITY}`);
          await page.waitForFunction(() => window.stripReady === true, null, { timeout: 60000 });
        };
        await open();
        for (const tsid of streets.slice(at, at + batch)) {
          const label = String(index[tsid].label || '').trim();
          const skip = (why) => {
            delete skipped[tsid];
            skipped[tsid] = { label, why };
            if (!trial) rmSync(join(out, `${tsid}.jpg`), { force: true });
            console.log(`${tsid} ${label}: skipped, ${why}`);
          };
          let r;
          try {
            r = await withTimeout(page.evaluate((file) => window.renderStrip(file), index[tsid].file), 120000);
          } catch (e) {
            skip(`render failed: ${String(e.message || e).split('\n')[0].slice(0, 160)}`);
            await page.close().catch(() => {});
            await open();
            continue;
          }
          done += 1;
          if (!r.drawn) { skip('nothing drawn (no deco of the street loaded)'); continue; }
          if (r.spread < MIN_SPREAD) { skip(`blank picture (luma spread ${r.spread})`); continue; }
          delete skipped[tsid];
          const data = Buffer.from(r.url.split(',')[1], 'base64');
          writeFileSync(join(out, `${tsid}.jpg`), data);
          console.log(`${tsid} ${label}: ${r.W}x${r.H}, ${r.drawn} decos${r.missing ? `, ${r.missing} textures never loaded` : ''}, spread ${r.spread}, ${data.length} bytes`);
        }
        await context.close();
      } finally {
        await browser?.close().catch(() => {});
        lock.release();
      }
      saveSkipped();
      // Let a waiting lane take the lock between batches (waiters poll every 2 s).
      if (at + batch < streets.length) await new Promise((r) => setTimeout(r, 8000));
    }
  } finally {
    server.kill();
  }
  if (!trial) {
    saveSkipped();
    writeFileSync(MAP, `${JSON.stringify(stripMap())}\n`);
  }
  console.log(`rendered ${done} of ${streets.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) check();
  else await build();
}
