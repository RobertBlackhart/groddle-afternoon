/**
 * PHONE LAYOUT (G1194, root R1; Austin 2026-11-23: direction C, Glitch-like compact): the phone's
 * HUD in named regions with one layout pass (js/ui/phone-layout.js). The street pill, the growing
 * actions pill, notices over the pills and sheets over the controls were R1's overlaps; here:
 * - the regions never overlap at 375x667, 402x812 and 812x402 in every sheet state (pure, and in
 *   Chrome on the real game: every piece measured, every pair checked);
 * - the pill holds four fixed icons (Full screen, Report a problem, Social, the Menu) and cannot grow:
 *   a button added to it does not show, Quests is a Menu row;
 * - the pinned quest stands over the stick upright and beside it sideways, clear of its ring;
 * - a sheet, the Social drawer and an open bag dock the stage (engine.setStageDock, owners);
 * - notices keep to their region (js/notify-view.js `region`);
 * - #595: nothing in the top row or the caption is cut (an ellipsis, or text wider than its box)
 *   with big counts at 360 to 402 px wide, and in the tutorial the pill is only as wide as its icons;
 * - #5: the verb menu and the chooser keep off the stick, Act and Jump, Act taps open and choose
 *   every time, and favor on the caption takes a real touch tap (a 44 px tall hit area);
 * - the pinned quest never covers the stick (the tutorial too), and the action chip ("Tap · choose
 *   from 4", drawn on the canvas) keeps off Act, Jump, the stick and the card (R1 audit #5).
 * Run: node --test tests/phone-layout.test.js
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAP, PILL_IDS, STICK, boxesOverlap, fullScreenWay, layoutProblems, menuRoomOf, phoneRegions, pillBadge,
} from '../public/js/ui/phone-layout.js?v=540b665a';
import { phonePins } from '../public/js/ui/quest-pin-button.js?v=ec4d53fa';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const css = read('public/style.css');
const game = read('public/game.js');

const SIZES = [[375, 667], [402, 812], [812, 402]];
const STATES = ['', 'bag', 'map', 'half'];
const named = (r) => ({ strip: r.strip, caption: r.caption, notices: r.notices, pin: r.pin, stick: r.stick, act: r.act, jump: r.jump, pack: r.pack, sheet: r.sheet });

describe('phone layout: the regions (pure)', () => {
  it('nothing overlaps at three sizes in every sheet state, with a pinned quest and the pack row', () => {
    const bad = [];
    for (const [width, height] of SIZES) {
      for (const sheet of STATES) {
        const pack = { left: width / 2 - 165, right: width / 2 + 165, top: height - 66, bottom: height - 6 };
        const r = phoneRegions({ width, height, sheet, pack, bagTop: height - 66 - 150, caption: { w: 220, h: 26 }, captionUnder: height > width, pin: { w: 200, h: 50 } });
        for (const p of layoutProblems(named(r), { width, height, allow: height > width ? [] : [['strip', 'caption']] })) bad.push(`${width}x${height} ${sheet || 'street'}: ${p}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('upright the caption sits under the stats and the notices under it; sideways the caption is in the top row', () => {
    const up = phoneRegions({ width: 402, height: 812, caption: { w: 200, h: 26 } });
    assert.ok(up.caption.top >= up.strip.bottom && up.notices.top >= up.caption.bottom + GAP);
    const side = phoneRegions({ width: 812, height: 402, caption: { w: 200, h: 26 } });
    assert.ok(side.caption.top >= side.strip.top && side.caption.bottom <= side.strip.bottom);
    assert.equal(side.notices.top, side.strip.bottom + GAP);
    // Sideways with no room between the pills (topbar.js .is-under) it drops under them.
    const under = phoneRegions({ width: 667, height: 375, caption: { w: 200, h: 26 }, captionUnder: true });
    assert.equal(under.notices.top, under.caption.bottom + GAP);
  });

  it('the pinned quest: over the stick upright, beside it sideways (clear of its ring), gone under a sheet', () => {
    const up = phoneRegions({ width: 375, height: 667, pin: { w: 200, h: 50 } });
    assert.equal(up.pin.left, up.stick.left);
    assert.equal(up.pin.bottom, up.stick.top - GAP);
    const side = phoneRegions({ width: 812, height: 402, pin: { w: 200, h: 50 } });
    assert.ok(side.pin.left >= side.stick.right, 'beside the stick');
    assert.equal(side.stick.right - side.stick.left, STICK);
    assert.ok(!boxesOverlap(side.pin, side.act) && !boxesOverlap(side.pin, side.stick));
    for (const sheet of ['bag', 'map', 'half']) assert.equal(phoneRegions({ width: 375, height: 667, sheet, bagTop: 400, pin: { w: 200, h: 50 } }).pin, null, sheet);
  });

  it('the pinned quest follows the controls where the page laid them out, and waits rather than cover the stick', () => {
    // The tutorial hides the pack row but the controls keep standing on its band: measured, they win.
    const stick = { left: 8, top: 520, right: 140, bottom: 652 };
    const r = phoneRegions({ width: 390, height: 844, packShown: false, pin: { w: 200, h: 50 }, controls: { stick, act: { left: 232, top: 576, right: 292, bottom: 636 }, jump: { left: 302, top: 564, right: 378, bottom: 640 } } });
    assert.deepEqual(r.stick, stick);
    assert.equal(r.pin.bottom, stick.top - GAP);
    assert.ok(!boxesOverlap(r.pin, r.stick));
    // A stick so high there is no room above it under the caption: the card waits.
    const high = phoneRegions({ width: 390, height: 844, pin: { w: 200, h: 50 }, controls: { stick: { left: 8, top: 80, right: 140, bottom: 212 } } });
    assert.equal(high.pin, null);
  });

  it('#5: a menu\'s room is above the controls upright and between the stick and Act sideways, none under a sheet', () => {
    const up = phoneRegions({ width: 390, height: 844, caption: { w: 200, h: 26 } });
    const r = menuRoomOf(up, { width: 390 });
    assert.equal(r.floor, Math.min(up.stick.top, up.act.top, up.jump.top) - GAP);
    assert.equal(r.top, up.notices.top);
    const side = phoneRegions({ width: 812, height: 402 });
    const s2 = menuRoomOf(side, { width: 812 });
    assert.equal(s2.left, side.stick.right + GAP);
    assert.equal(812 - s2.right, side.act.left - GAP);
    assert.equal(s2.floor, side.pack.top - GAP);
    assert.equal(menuRoomOf(phoneRegions({ width: 390, height: 844, sheet: 'half' }), { width: 390 }), null);
  });

  it('the Map takes the whole height (sideways the whole screen) and leaves the notices no room', () => {
    const up = phoneRegions({ width: 402, height: 812, sheet: 'map' });
    assert.deepEqual([up.sheet.top, up.sheet.bottom], [up.strip.bottom + GAP, 812]);
    assert.equal(up.notices.bottom, up.notices.top);
    assert.equal(up.pack, null);
    const side = phoneRegions({ width: 812, height: 402, sheet: 'map' });
    assert.deepEqual(side.sheet, { left: 0, top: 0, right: 812, bottom: 402 });
    assert.equal(side.strip, null);
  });

  it('a sheet docks the stage (above the pack upright, a column sideways), an open bag too; the Map and the street do not', () => {
    const pack = { left: 30, right: 345, top: 600, bottom: 660 };
    const half = phoneRegions({ width: 375, height: 667, sheet: 'half', pack });
    assert.equal(half.sheet.bottom, pack.top - GAP);
    assert.deepEqual(half.dock, { side: 'bottom', css: 667 - half.sheet.top, zoom: true });
    const column = phoneRegions({ width: 812, height: 402, sheet: 'half' });
    assert.deepEqual(column.dock, { side: 'left', css: column.sheet.right, zoom: true });
    assert.ok(812 - column.sheet.right >= 240, 'the street keeps room beside the column');
    const bag = phoneRegions({ width: 812, height: 402, sheet: 'bag', bagTop: 190 });
    assert.deepEqual(bag.dock, { side: 'bottom', css: 212, zoom: true });
    assert.equal(phoneRegions({ width: 375, height: 667, sheet: 'map' }).dock, null);
    assert.equal(phoneRegions({ width: 375, height: 667 }).dock, null);
  });

  it('badges, full screen and the safe area', () => {
    assert.deepEqual([pillBadge(0), pillBadge(3), pillBadge(140)], ['', '3', '99+']);
    assert.equal(fullScreenWay({ canRequest: true }), 'api');
    assert.equal(fullScreenWay({ canRequest: false }), 'tip');
    assert.equal(fullScreenWay({ standalone: true, canRequest: true }), 'hide');
    const r = phoneRegions({ width: 402, height: 874, safe: { t: 62, b: 34 } });
    assert.ok(r.strip.top >= 62 && r.pack.bottom <= 874 - 34);
  });
});

describe('phone layout: wiring', () => {
  it('the pill shows only its four icons, so it cannot grow', () => {
    assert.deepEqual([...PILL_IDS], ['fullscreen-btn', 'bug-btn', 'social-btn', 'more-btn']);
    assert.match(css, /:root\.phone-layout\[data-ui="modern"\] body:not\(\.nx-hide-actions\) \.top-bar \.top-actions > :not\(#fullscreen-btn, #bug-btn, #social-btn, \.more-menu\) \{ display: none !important; \}/);
    // Quests is a Menu row on the phone layout (js/ui/topbar.js fitTopActions).
    assert.match(read('public/js/ui/topbar.js'), /classList\.contains\('phone-layout'\) && !steps\.includes\('quest'\) \? \['quest', \.\.\.steps\] : steps/);
  });

  it('the pinned quest card stays out of the old phone button on the phone layout', () => {
    const doc = (cls) => ({ documentElement: { classList: { contains: (c) => cls.includes(c) }, dataset: { ui: 'modern' } } });
    assert.equal(phonePins(doc(['touch-phone'])), true);
    assert.equal(phonePins(doc(['touch-phone', 'phone-layout'])), false);
  });

  it('game.js: phones only, the stage dock has owners, the notices take the region', () => {
    assert.match(game, /function installPhoneLayout\(\) \{\s*if \(!TOUCH_PHONE \|\| phoneLayout\) return;/);
    assert.match(game, /active: \(\) => modernUi\(\),/);
    assert.match(game, /setStageDock\(dock = null, owner = 'window'\)/);
    assert.match(game, /const next = stageDockOf\(stageDocks\);/);
    assert.match(game, /closeup: dock && !dock\.zoom \? 0 : phoneCloseup\(\),/);
    assert.match(game, /region: \(\) => phoneLayout\?\.noticeRegion\(\) \|\| null,/);
    assert.match(read('public/js/notify-view.js'), /if \(zones\.region && !place\.wait && zones\.top \+ place\.dy \+/);
  });

  it('Classic keeps its own look: the layout is Modern and phones only, and classic.css never names it', () => {
    for (const line of css.split('\n').filter((l) => l.includes('phone-layout') && /\{/.test(l) && !l.trim().startsWith('/*') && !l.trim().startsWith('.phone-pill-btn'))) {
      assert.ok(/:root\.phone-layout(\[data-ui="modern"\])?/.test(line), line.slice(0, 120));
    }
    assert.ok(!read('public/css/classic.css').includes('phone-layout'));
  });
});

let chromium = null;
try { chromium = (await import('playwright')).chromium; } catch { /* no Playwright */ }

/**
 * R1 (Chrome, the real game): every HUD piece measured at three sizes in every sheet state; any two
 * that overlap, or one off the screen, fail.
 */
describe('phone layout: no overlaps on the real game (Chrome)', { skip: !chromium && 'no playwright' }, () => {
  const LOCK_WAIT_MS = 30 * 60_000;
  const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
  let server = null;
  let chrome = null;
  before(async () => {
    const { openBrowser } = await import('../tools/qa/browser.mjs');
    const { startServer } = await import('../tools/qa/serve.mjs');
    chrome = await openBrowser({ label: 'phone-layout overlap test', waitMs: LOCK_WAIT_MS });
    server = await startServer({ root: join(root, 'public') });
  }, { timeout: LOCK_WAIT_MS + 60_000 });
  after(async () => {
    await chrome?.close();
    await server?.stop();
  });

  it('375x667, 402x812 and 812x402: street, open bag, Map, Quests, Social and the Menu', { timeout: 180_000 }, async () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const ctx = await chrome.browser.newContext({ viewport: { width: 402, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('groddle-play-device', 'qa-game'); } catch { /* none */ } });
    const tab = await ctx.newPage();
    const errors = [];
    tab.on('pageerror', (e) => errors.push(e.message));
    await tab.goto(`${base}/play/?autostart=1&questoffer=off&hstip=0`);
    await tab.waitForFunction(() => !document.body.classList.contains('is-booting') && document.getElementById('overlay')?.classList.contains('hidden') && document.documentElement.classList.contains('phone-layout'), null, { timeout: 60_000 });
    await tab.evaluate(() => {
      for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === 'Got it' && b.offsetParent) b.click();
      window.groddleQA?.questPins?.pin('animalkinship_pet_piggies');
      // The pill cannot grow: a button some feature adds to it does not show.
      const extra = Object.assign(document.createElement('button'), { id: 'phone-layout-test-extra', type: 'button', className: 'chrome-btn hud-ibtn', textContent: 'X' });
      document.querySelector('.top-bar .top-actions').append(extra);
    });
    const open = {
      street: () => {},
      bag: () => document.querySelector('#pack-bags .pack-bag')?.click(),
      map: () => document.getElementById('menu-map-btn').click(),
      quests: () => document.getElementById('menu-quest-btn').click(),
      social: () => document.getElementById('social-btn').click(),
      menu: () => document.getElementById('more-btn').click(),
    };
    const shut = {
      bag: () => document.querySelector('#pack-bags .pack-bag')?.click(),
      map: () => document.getElementById('map-close').click(),
      quests: () => document.getElementById('quest-close').click(),
      social: () => window.groddleSocial.close(),
      menu: () => document.getElementById('more-btn').click(),
    };
    const bad = [];
    for (const [w, h] of SIZES) {
      await tab.setViewportSize({ width: w, height: h });
      await tab.waitForTimeout(500);
      for (const state of Object.keys(open)) {
        await tab.evaluate(`(${open[state]})()`);
        await tab.evaluate(() => window.groddleQA?.notify?.notice('A notice for the layout check, long enough for two lines on a phone.', 6000));
        await tab.waitForTimeout(600);
        const got = await tab.evaluate((st) => {
          const seen = (el) => el && el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) && el.getBoundingClientRect().width > 0;
          const rect = (el) => {
            const r = el.getBoundingClientRect();
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
          };
          const pieces = {
            stats: document.getElementById('hud-stats'),
            pill: document.querySelector('.top-bar .top-actions'),
            caption: document.getElementById('street-nameplate'),
            notices: document.querySelector('.notify-notices:not(.is-waiting)'),
            pin: document.getElementById('quest-pins'),
            prompt: null,
            stick: document.querySelector('.touch-stick'),
            act: document.querySelector('.touch-act'),
            jump: document.querySelector('.touch-jump'),
            pack: document.getElementById('pack-row'),
            bag: document.querySelector('#pack-bar .pack-bag-row:not([hidden])'),
            sheet: st === 'map' ? document.querySelector('#map-panel .map-card') : st === 'quests' ? document.querySelector('#quest-panel') : st === 'social' ? document.getElementById('local-chat-dock') : st === 'menu' ? document.getElementById('more-list') : null,
          };
          const boxes = {};
          for (const [k, el] of Object.entries(pieces)) if (seen(el) && (k !== 'notices' || el.children.length)) boxes[k] = rect(el);
          // The action chip ("Tap · choose from 4") is drawn on the canvas: its box is canvas data promptCss.
          const pc = document.querySelector('#game-root canvas')?.dataset.promptCss;
          // Under the Map it is covered, as the street is.
          if (pc && st !== 'map') {
            const [left, top, right, bottom] = pc.split(',').map(Number);
            boxes.prompt = { left, top, right, bottom };
          }
          // The Map covers everything under it (sideways the top row too): only what is in front counts.
          const front = (k) => {
            const b = boxes[k];
            const at = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, (b.left + b.right) / 2)), Math.min(innerHeight - 1, Math.max(0, (b.top + b.bottom) / 2)));
            return st !== 'map' || k === 'sheet' || Boolean(at && (pieces[k].contains(at) || at.contains(pieces[k])));
          };
          for (const k of Object.keys(boxes)) if (k !== 'prompt' && !front(k)) delete boxes[k];
          const pillShown = [...document.querySelectorAll('.top-bar .top-actions > *, .top-bar .top-actions .more-menu > button')].filter((b) => seen(b) && (b.tagName === 'BUTTON' || b.tagName === 'A')).sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left).map((b) => b.id);
          return { boxes, pillShown, sheet: document.documentElement.dataset.phoneSheet, dock: document.querySelector('#game-root canvas')?.dataset.phoneDock || '' };
        }, state);
        const where = `${w}x${h} ${state}`;
        if (!got.boxes.sheet && state !== 'street' && state !== 'bag') bad.push(`${where}: the sheet did not open`);
        if (state === 'bag' && !got.boxes.bag) bad.push(`${where}: the bag did not open`);
        for (const p of layoutProblems(got.boxes, { width: w, height: h })) bad.push(`${where}: ${p}${/prompt/.test(p) ? ` ${JSON.stringify(got.boxes.prompt)}` : ''}`);
        if (state !== 'map' && got.pillShown.join(',') !== 'fullscreen-btn,bug-btn,social-btn,more-btn') bad.push(`${where}: the pill shows ${got.pillShown.join(',')}`);
        if (['bag', 'quests', 'social', 'menu'].includes(state) && !got.dock) bad.push(`${where}: the stage did not dock`);
        // Every piece is there to be checked (a missing one would pass by not being measured).
        if (state === 'street') for (const k of ['stats', 'pill', 'caption', 'notices', 'pin', 'stick', 'act', 'jump', 'pack']) if (!got.boxes[k]) bad.push(`${where}: no ${k} to measure`);
        if (shut[state]) await tab.evaluate(`(${shut[state]})()`);
        await tab.waitForTimeout(300);
      }
    }
    await ctx.close();
    assert.deepEqual(bad, []);
    assert.deepEqual(errors, []);
  });

  it('#595: the top row and the caption never cut a count or a name, with big counts at 360 to 402 wide, and in the tutorial', { timeout: 180_000 }, async () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const ctx = await chrome.browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('groddle-play-device', 'qa-game'); } catch { /* none */ } });
    const tab = await ctx.newPage();
    const errors = [];
    tab.on('pageerror', (e) => errors.push(e.message));
    const ready = () => !document.body.classList.contains('is-booting') && document.getElementById('overlay')?.classList.contains('hidden') && document.documentElement.classList.contains('phone-layout');
    /** Text cut short (an ellipsis, or content wider than its box), and the top row's pieces overlapping or empty. */
    const look = () => {
      const seen = (el) => el && el.checkVisibility({ visibilityProperty: true }) && el.getBoundingClientRect().width > 0;
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      const cut = [];
      const sel = '#hud-stats, #hud-stats .hud-cur strong, #hud-stats .ring-num, .top-bar .top-actions, #street-nameplate, #street-name, #street-name > *, #dametime-clock, #favor-stat strong, #newxp-pill, #newxp-pill [data-nx-label], #newxp-pill button';
      for (const el of document.querySelectorAll(sel)) {
        if (!seen(el)) continue;
        const name = el.id || el.className || el.tagName;
        if (/…|\.\.\./.test(el.textContent)) cut.push(`${name} "${el.textContent.trim().slice(0, 30)}"`);
        else if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1) cut.push(`${name} ${el.scrollWidth}>${el.clientWidth}`);
        else if (getComputedStyle(el).textOverflow === 'ellipsis' && el.clientWidth > 0 && el.scrollWidth > el.clientWidth) cut.push(`${name} ellipsis`);
      }
      const boxes = {};
      for (const [k, el] of Object.entries({ stats: document.getElementById('hud-stats'), tutorial: document.getElementById('newxp-pill'), pill: document.querySelector('.top-bar .top-actions'), caption: document.getElementById('street-nameplate'), pin: document.getElementById('quest-pins'), stick: document.querySelector('.touch-stick'), act: document.querySelector('.touch-act'), jump: document.querySelector('.touch-jump') })) if (seen(el)) boxes[k] = rect(el);
      const pc = document.querySelector('#game-root canvas')?.dataset.promptCss;
      if (pc) {
        const [left, top, right, bottom] = pc.split(',').map(Number);
        boxes.prompt = { left, top, right, bottom };
      }
      // The pill is as wide as what it shows (the tutorial left it four icons wide holding only Sound).
      const pill = document.querySelector('.top-bar .top-actions');
      const shown = [...pill.querySelectorAll('button, a')].filter((b) => seen(b) && b.closest('.more-list') == null);
      const used = shown.reduce((n, b) => n + b.getBoundingClientRect().width, 0);
      return { cut, boxes, pillW: pill.getBoundingClientRect().width, used, shown: shown.length, counts: [document.getElementById('stat-img')?.textContent, document.getElementById('stat-currants')?.textContent, document.querySelector('#favor-stat strong')?.textContent] };
    };
    const bad = [];
    const check = (where, got, w, h) => {
      for (const c of got.cut) bad.push(`${where}: cut ${c}`);
      for (const p of layoutProblems(got.boxes, { width: w, height: h })) bad.push(`${where}: ${p}${/prompt/.test(p) ? ` ${JSON.stringify(got.boxes.prompt)}` : ''}`);
      if (got.pillW - got.used > 24) bad.push(`${where}: the pill is ${Math.round(got.pillW)} px wide for ${Math.round(got.used)} px of ${got.shown} icons`);
      // Pills that do not touch: at least a few px apart.
      const left = got.boxes.stats || got.boxes.tutorial;
      if (left && got.boxes.pill && got.boxes.pill.left - left.right < 4) bad.push(`${where}: the pills touch (${Math.round(got.boxes.pill.left - left.right)} px apart)`);
    };
    await tab.goto(`${base}/play/?autostart=1&questoffer=off&hstip=0`);
    await tab.waitForFunction(ready, null, { timeout: 60_000 });
    const set = await tab.evaluate(() => window.groddleQA.hudStats({ currants: 123456, imagination: 61234, favor: 1302 }));
    assert.equal(set.currants, 123456);
    for (const [w, h] of [[360, 780], [375, 667], [390, 844], [402, 812]]) {
      await tab.setViewportSize({ width: w, height: h });
      await tab.waitForTimeout(700);
      const got = await tab.evaluate(look);
      if (!got.boxes.stats || !got.boxes.caption || !got.boxes.pill) bad.push(`${w}x${h}: the top row is missing a piece`);
      if (got.counts[2] == null) bad.push(`${w}x${h}: no favor shown`);
      check(`${w}x${h} play ${got.counts.join(' ')}`, got, w, h);
    }
    await tab.goto(`${base}/play/?autostart=1&questoffer=off&hstip=0&newxp=clouds`);
    await tab.waitForFunction(() => document.getElementById('newxp-pill') && !document.getElementById('newxp-pill').hidden, null, { timeout: 60_000 });
    // A quest pinned before the tutorial (its card stood on the stick there, Austin's iPhone).
    await tab.evaluate(() => window.groddleQA?.questPins?.pin('animalkinship_pet_piggies'));
    for (const [w, h] of [[360, 780], [390, 844], [844, 390]]) {
      await tab.setViewportSize({ width: w, height: h });
      await tab.waitForTimeout(700);
      const got = await tab.evaluate(look);
      if (!got.boxes.stick) bad.push(`${w}x${h} tutorial: no stick to measure`);
      check(`${w}x${h} tutorial`, got, w, h);
    }
    await ctx.close();
    assert.deepEqual(bad, []);
    assert.deepEqual(errors, []);
  });

  it('#5 (Austin\'s iPhone): menus keep off the stick, Act and Jump, Act taps open and choose every time, and the caption\'s favor takes a real tap', { timeout: 240_000 }, async () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const ctx = await chrome.browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1, userAgent: UA });
    await ctx.addInitScript(() => { try { localStorage.setItem('groddle-play-device', 'qa-game'); } catch { /* none */ } });
    const tab = await ctx.newPage();
    const errors = [];
    tab.on('pageerror', (e) => errors.push(e.message));
    await tab.goto(`${base}/play/?autostart=1&questoffer=off&hstip=0`);
    await tab.waitForFunction(() => !document.body.classList.contains('is-booting') && document.getElementById('overlay')?.classList.contains('hidden') && document.documentElement.classList.contains('phone-layout'), null, { timeout: 60_000 });
    await tab.evaluate(() => {
      for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === 'Got it' && b.offsetParent) b.click();
      window.groddleQA.hudStats({ favor: 52 });
    });
    const centre = (sel) => tab.evaluate((q) => {
      const el = document.querySelector(q);
      if (!el || !el.getClientRects().length) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height };
    }, sel);
    /** What is open now, and every menu card against the controls. */
    const menus = () => tab.evaluate(() => {
      const seen = (el) => el && !el.hidden && el.checkVisibility({ visibilityProperty: true }) && el.getBoundingClientRect().width > 0;
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      };
      const verb = document.getElementById('verb-menu');
      const chooser = document.getElementById('enter-chooser');
      const boxes = {};
      if (seen(verb)) boxes.verbMenu = rect(verb.querySelector('.verb-menu-card') || verb);
      if (seen(chooser)) boxes.chooser = rect(chooser.querySelector('.feed-picker-card, .verb-menu-card') || chooser);
      for (const k of ['stick', 'act', 'jump']) {
        const el = document.querySelector(`.touch-${k}`);
        if (seen(el)) boxes[k] = rect(el);
      }
      return { verb: seen(verb), chooser: seen(chooser), boxes };
    });
    const bad = [];
    const tapAct = async () => {
      const a = await centre('.touch-act');
      await tab.touchscreen.tap(a.x, a.y);
      await tab.waitForTimeout(450);
    };
    for (const [w, h] of [[360, 780], [390, 844], [402, 812], [812, 402]]) {
      await tab.setViewportSize({ width: w, height: h });
      await tab.waitForTimeout(700);
      const where = `${w}x${h}`;
      // The caption's favor: a finger on it opens the Giants' panel; its hit area is a thumb tall.
      const fav = await centre('#street-nameplate > #favor-stat');
      if (!fav) bad.push(`${where}: no favor on the caption`);
      else {
        const hit = await tab.evaluate(({ x, y }) => {
          const el = document.getElementById('favor-stat');
          const r = el.getBoundingClientRect();
          // The hit area, top to bottom: the element under each point.
          const top = [...Array(60).keys()].map((i) => y - 30 + i).filter((py) => el.contains(document.elementFromPoint(x, py)));
          return { tall: top.length ? top.at(-1) - top[0] + 1 : 0, w: r.width };
        }, fav);
        if (hit.tall < 44) bad.push(`${where}: favor's hit area is ${hit.tall} px tall`);
        await tab.touchscreen.tap(fav.x, fav.y);
        await tab.waitForTimeout(300);
        if (!(await tab.evaluate(() => !document.getElementById('favor-pop')?.hidden))) bad.push(`${where}: a tap on favor did not open the Giants' panel`);
        await tab.keyboard.press('Escape');
        await tab.waitForTimeout(200);
      }
      // Tap 1 opens (the chooser of several things, or the verb menu); each tap on Act then chooses, until
      // an action runs; once it is over a tap opens again. Every menu keeps off the controls.
      let opened = 0;
      for (let round = 0; round < 2; round++) {
        await tapAct();
        let m = await menus();
        if (!m.verb && !m.chooser) {
          bad.push(`${where} round ${round + 1}: Act opened nothing`);
          break;
        }
        opened += 1;
        for (let step = 0; step < 4 && (m.verb || m.chooser); step++) {
          for (const p of layoutProblems(m.boxes, { width: w, height: h })) bad.push(`${where} round ${round + 1} ${m.chooser ? 'chooser' : 'verb menu'}: ${p}`);
          await tapAct();
          m = await menus();
        }
        if (m.verb || m.chooser) bad.push(`${where} round ${round + 1}: taps on Act did not choose`);
        await tab.keyboard.press('Escape');
        // Let the chosen action finish (Pet, Talk to...) before the next round.
        await tab.waitForFunction(() => !document.getElementById('action-progress') || document.getElementById('action-progress').hidden, null, { timeout: 15_000 }).catch(() => {});
        await tab.waitForTimeout(900);
      }
      if (opened < 2) bad.push(`${where}: Act opened a menu ${opened} of 2 times`);
    }
    await ctx.close();
    assert.deepEqual(bad, []);
    assert.deepEqual(errors, []);
  });
});
