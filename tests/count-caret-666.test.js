/**
 * Report #666 (desktop, 1536x702): a pack menu's How many (Shake Butterfly Milk, Compress Butterfly
 * Butter) typed "24" as "42", and the number was selected on open some times and not others.
 * After the first digit preview() moved the count, the menu's markup differed, and the next updateHud
 * rebuilt it and focused the new field with its caret at the start. Drop, Drink more and a vendor's
 * count opened on the OK button instead of the field.
 *
 * Glitch: focusing a count selected all of it (InteractionMenu.as 1752-1753, QuantityPickerSpecial.as
 * 234); a count the game rewrote put the caret at the end (QuantityPicker.as 185). Now (count-chooser.js):
 * - no menu redraw under a count field that has the focus (the pack menu, the vendor's other redraws);
 * - a redraw that does happen (a step key) gives the field back its caret and selection (keepCountCaret);
 * - every count field opens focused with its number selected on a computer (openCountField); on a phone
 *   the OK button takes the focus, so the keyboard stays down until the field is pressed.
 * Run: node --test tests/count-caret-666.test.js
 */
import { after as afterAll, before as beforeAll, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindCountField, countStepMarkup, focusedCountField, openCountField, restoreCountCaret, saveCountCaret } from '../public/js/ui/count-chooser.js?v=c268eefe';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const game = read('public/game.js');

/** A field as far as the helpers need: focus, select, a caret, events. */
function fakeField(value = '1', attrs = { 'data-x-num': '' }, doc = { activeElement: null }) {
  const input = new EventTarget();
  Object.assign(input, {
    value,
    dataset: {},
    disabled: false,
    ownerDocument: doc,
    attributes: Object.entries(attrs).map(([name, v]) => ({ name, value: v })),
    selectionStart: 0,
    selectionEnd: 0,
    selectionDirection: 'none',
    closest: () => null,
    focus() { doc.activeElement = input; },
    select() { input.selectionStart = 0; input.selectionEnd = String(input.value).length; },
    setSelectionRange(a, b, d = 'none') { Object.assign(input, { selectionStart: a, selectionEnd: b, selectionDirection: d }); },
  });
  const ok = { focus() { doc.activeElement = ok; } };
  return { doc, input, ok };
}

describe('#666: the count field helpers (count-chooser.js)', () => {
  it('a count opens with its number selected; on a phone the OK button has the focus', () => {
    const was = globalThis.matchMedia;
    try {
      globalThis.matchMedia = () => ({ matches: false });
      const a = fakeField('1');
      assert.equal(openCountField(a.input, a.ok), a.input);
      assert.equal(a.doc.activeElement, a.input);
      assert.deepEqual([a.input.selectionStart, a.input.selectionEnd], [0, 1], 'all of it selected: the first digit replaces it');
      globalThis.matchMedia = (q) => ({ matches: q === '(pointer: coarse)' });
      const b = fakeField('1');
      assert.equal(openCountField(b.input, b.ok), b.ok, 'a finger: OK, the keyboard stays down');
      assert.equal(openCountField(null, b.ok), b.ok);
    } finally {
      globalThis.matchMedia = was;
    }
  });

  it('a redraw gives the focused field back its caret and selection; a rewritten count puts the caret at the end', () => {
    const { doc, input } = fakeField('24');
    bindCountField(input, { max: () => 99, set() {}, confirm() {}, cancel() {} });
    input.focus();
    input.setSelectionRange(1, 1);
    let fresh = null;
    const box = { ownerDocument: doc, contains: (el) => el === input || el === fresh, querySelector: (sel) => (sel === '[data-x-num]' ? fresh : null) };
    assert.equal(focusedCountField(box), input);
    const saved = saveCountCaret(box);
    assert.deepEqual(saved, { hook: '[data-x-num]', value: '24', sel: [1, 1, 'none'] });
    // The redraw: a new field, same hook, same count.
    fresh = fakeField('24', undefined, doc).input;
    assert.equal(restoreCountCaret(box, saved), fresh);
    assert.equal(doc.activeElement, fresh);
    assert.deepEqual([fresh.selectionStart, fresh.selectionEnd], [1, 1], 'the caret where it was, not at the start');
    // A step key rewrote it: the caret goes to the end (QuantityPicker.as 185).
    fresh = fakeField('25', undefined, doc).input;
    restoreCountCaret(box, saved);
    assert.deepEqual([fresh.selectionStart, fresh.selectionEnd], [2, 2]);
  });

  it('the field takes digits only, as Glitch\'s did, and keeps the caret', () => {
    const { input } = fakeField('');
    const seen = [];
    bindCountField(input, { max: () => 99, set() {}, confirm() {}, cancel() {}, preview: (n) => seen.push(n) });
    input.value = '2x';
    input.selectionStart = input.selectionEnd = 2;
    input.dispatchEvent(new Event('input'));
    assert.equal(input.value, '2');
    assert.equal(input.selectionStart, 1);
    assert.deepEqual(seen, [2]);
  });

  it('a text field with a number keypad, so its caret can be read and kept (a number field has none)', () => {
    const row = countStepMarkup({ value: 3, max: 9, verb: 'Drop', attrs: { dec: 'data-a-dec', inc: 'data-a-inc', num: 'data-a-num', max: 'data-a-max' } });
    assert.match(row, /<input type="text" class="count-pop-num" data-a-num value="3" inputmode="numeric" pattern="\[0-9\]\*"/);
    assert.match(game, /<input type="text" value="\$\{vendorQty\}" data-vq-val inputmode="numeric"/);
    assert.match(read('public/play/index.html'), /id="feed-picker-qty-input" class="feed-picker-qty-input" type="text"[^>]*inputmode="numeric"/);
  });

  it('game.js: no pack menu redraw under a count being typed; the vendor\'s other redraws wait too', () => {
    assert.match(game, /if \(packSelected && !focusedCountField\(document\.getElementById\('pack-popover'\)\)\) renderPackPopover\(packSelected\);/);
    assert.equal((game.match(/if \(isVendorOpen\(\) && !typingIn\('vendor-panel'\)\) renderVendorList\(\);/g) || []).length, 2, 'after eating and after a music block');
    // Every count opens on its field: Shake / Compress, Drop, Drink more, Feed, the vendor.
    for (const hook of ['pack-count', 'pack-drop', 'pack-eat']) {
      assert.match(game, new RegExp(`openCountField\\(pop\\.querySelector\\('\\[data-${hook}-num\\]'\\), pop\\.querySelector\\('\\[data-${hook}-confirm\\]'\\)\\)`));
    }
    assert.match(game, /openCountField\(input, document\.getElementById\('feed-picker-qty-go'\)\)/);
    assert.match(game, /else if \(opening\) openCountField\(detail\.querySelector\('\[data-vq-val\]'\), detail\.querySelector\('\[data-v-go\]'\)\);/);
    assert.match(game, /if \(countCaret\) restoreCountCaret\(pop, countCaret\);/);
    assert.match(game, /if \(vqCaret\) restoreCountCaret\(detail, vqCaret\);/);
    const sw = read('public/js/ui/storage-windows.js');
    assert.equal((sw.match(/keepCountCaret\(/g) || []).length, 3, 'take out, the store and the How many dialog');
    assert.equal((sw.match(/openCountField\(/g) || []).length, 4);
    assert.match(read('public/js/features/rook-attack-feature.js'), /openCountField\(pop\.querySelector\('\[data-rook-count-num\]'\)/);
    assert.match(read('public/js/ui/item-picker.js'), /keepCountCaret\(chosen, renderChosen\)/);
  });
});

let chromium = null;
try { chromium = (await import('playwright')).chromium; } catch { /* no Playwright */ }

describe('#666 in Chrome (1536x702): "24" types as 24 in every pack count, and it opens selected', { skip: !chromium && 'no playwright' }, () => {
  const LOCK_WAIT_MS = 30 * 60_000;
  let server = null;
  let chrome = null;
  beforeAll(async () => {
    const { openBrowser } = await import('../tools/qa/browser.mjs');
    const { startServer } = await import('../tools/qa/serve.mjs');
    chrome = await openBrowser({ label: 'count-caret-666 test', waitMs: LOCK_WAIT_MS });
    server = await startServer({ root: join(root, 'public') });
  }, { timeout: LOCK_WAIT_MS + 60_000 });
  afterAll(async () => {
    await chrome?.close();
    await server?.stop();
  });

  it('Shake, Compress, Drop and Drink more: a HUD tick between the digits, a step key, the open selection', { timeout: 120_000 }, async () => {
    const base = `http://127.0.0.1:${server.address().port}`;
    const ctx = await chrome.browser.newContext({ viewport: { width: 1536, height: 702 } });
    const tab = await ctx.newPage();
    tab.setDefaultTimeout(5000);
    await tab.goto(`${base}/play/?autostart=1&questoffer=off&hstip=0`);
    await tab.waitForFunction(() => !document.body.classList.contains('is-booting') && document.getElementById('overlay')?.classList.contains('hidden') && window.groddlePack?.grant, null, { timeout: 40_000 });
    await tab.evaluate(() => {
      for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === 'Got it' && b.offsetParent) b.click();
      window.groddlePack.grant('milk_butterfly', 30);
      window.groddlePack.grant('butterfly_butter', 30);
    });
    // The granted stacks land in a bag: open bags until the stack shows, then open its menu.
    const openSlot = (cls) => tab.evaluate(async (c) => {
      const wait = () => new Promise((d) => setTimeout(d, 200));
      document.querySelector('#pack-popover [data-pack-close]')?.click();
      await wait();
      const find = () => document.querySelector(`.pack-slot[data-tsid="${c}"]`);
      if (!find()) for (const b of document.querySelectorAll('.pack-slot[data-pack-bag]')) { b.click(); await wait(); if (find()) break; b.click(); await wait(); }
      find()?.click();
      await wait();
    }, cls);
    const focused = () => tab.evaluate(() => [...document.activeElement.attributes].map((a) => a.name).find((n) => n.startsWith('data-pack-')) || document.activeElement.tagName);
    // Opens on the field with its number selected; a HUD tick (1.5 s) changes nothing; "2", a tick, "4".
    const typeCount = async (field) => {
      const r = { focus: await focused() };
      await tab.waitForTimeout(1500);
      await tab.keyboard.type('2');
      r.afterOne = await tab.inputValue(field);
      await tab.waitForTimeout(1500);
      await tab.keyboard.type('4');
      r.afterTwo = await tab.inputValue(field);
      // A step key redraws the menu: the caret goes to the end of the rewritten count (QuantityPicker.as 185).
      await tab.keyboard.press('ArrowDown');
      await tab.keyboard.type('1');
      r.afterStep = await tab.inputValue(field);
      return r;
    };
    const got = {};
    for (const [cls, verb] of [['milk_butterfly', 'shake'], ['butterfly_butter', 'compress']]) {
      await openSlot(cls);
      await tab.click(`#pack-popover [data-feature-pack-count^="${verb}"]`);
      got[verb] = await typeCount('[data-pack-count-num]');
    }
    await openSlot('milk_butterfly');
    await tab.click('#pack-popover [data-pack-drop]');
    got.drop = await typeCount('[data-pack-drop-num]');
    await tab.keyboard.press('Escape');
    await tab.keyboard.press('Escape');
    await openSlot('milk_butterfly');
    await tab.click('#pack-popover [data-pack-eat-many]');
    got.drink = await typeCount('[data-pack-eat-num]');
    await ctx.close();
    for (const [what, r] of Object.entries(got)) {
      assert.match(r.focus, /-num$/, `${what}: opens on the field, not OK (${JSON.stringify(r)})`);
      assert.equal(r.afterOne, '2', `${what}: the 1 was selected, the first digit replaced it`);
      assert.equal(r.afterTwo, '24', `${what}: 2, a HUD tick, 4`);
      // 24 - 1 = 23, then "1" at the end. Drink more's most is lower (what a stack allows): its own clamp.
      assert.match(r.afterStep, /^\d+1$/, `${what}: the step key left the caret at the end (${r.afterStep})`);
    }
    assert.equal(got.shake.afterStep, '231');
  });
});
