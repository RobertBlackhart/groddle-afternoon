/**
 * #407 (G865): on a phone a pack stack lifted by a long press could be dragged over an open
 * cabinet, but letting go there did nothing: the cabinet listened only for the mouse's HTML5 drop
 * (js/ui/storage-windows.js), and the touch lift (game.js setupPackDrops) dropped only on pack
 * slots. Now the touch lift tells the element under the finger ('pack-touch-over' while it moves,
 * 'pack-touch-drop' where it is let go, 'pack-touch-end' when the lift ends), and the cabinet
 * puts the stack in as a mouse drop does (CabinetDialog.as findDropTarget: an empty slot, or the
 * same class under its stackmax).
 * Run: node --test tests/g865-cabinet-touch-drop.test.js
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { page, FakeEl } from './social-fake-dom.js';
import { openCabinetWindow, closeStorageWindow } from '../public/js/ui/storage-windows.js?fresh=g865-cabinet-touch-drop';

const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');

describe('a touch drag from the pack onto a cabinet (#407)', () => {
  const saved = {};
  let h;
  let t;
  const puts = [];
  let refuse = null;

  before(() => {
    for (const k of ['document', 'setTimeout']) saved[k] = globalThis[k];
    t = page();
    t.doc.removeEventListener = () => {};
    globalThis.document = t.doc;
    globalThis.setTimeout = (fn) => { fn(); return 0; };
    h = openCabinetWindow({
      title: 'Cabinet',
      cols: 4,
      rowsDisplay: 2,
      slots: [{ classTsid: 'apple', count: 3 }, null, { classTsid: 'cherry', count: 1 }, null],
      item: (cls) => ({ label: cls, icon: '' }),
      accepts: (cls) => (cls === refuse ? 'That cannot go in here.' : null),
      stackmax: () => 10,
      put: (stack) => { puts.push(stack); },
      take: () => {},
      move: () => {},
    });
  });
  after(() => {
    try { closeStorageWindow(); } catch { /* the fake DOM's elements have no remove() */ }
    for (const [k, v] of Object.entries(saved)) globalThis[k] = v;
  });

  const slot = (i) => h.root.querySelector(`[data-hst-slot="${i}"]`);
  function packSlot(cls, count, extra = {}) {
    const s = new FakeEl('button');
    s.dataset.tsid = cls;
    s.dataset.packCount = String(count);
    Object.assign(s.dataset, extra);
    return s;
  }
  /** What game.js touchElsewhere sends: a cancelable event at the element under the finger, heard on the document. */
  function send(type, target, detail) {
    const e = { type, target, detail, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    for (const fn of t.doc.listeners[type] || []) fn(e);
    return e;
  }

  it('lights the slot it would go into, and names a refusal', () => {
    const apple = packSlot('apple', 2);
    const over = send('pack-touch-over', slot(1), { slot: apple, x: 200, y: 300 });
    assert.equal(over.defaultPrevented, true);
    assert.ok(slot(1).classList.contains('is-over'));
    refuse = 'pick';
    send('pack-touch-over', slot(3), { slot: packSlot('pick', 1), x: 220, y: 300 });
    assert.ok(slot(3).classList.contains('is-no'));
    assert.ok(!slot(1).classList.contains('is-over'), 'the last slot goes dark');
    refuse = null;
    send('pack-touch-end', null, undefined);
    assert.ok(!slot(3).classList.contains('is-no'), 'the lift ending clears it');
  });

  it('let go on an empty slot: the whole stack goes in, as a mouse drop', async () => {
    const e = send('pack-touch-drop', slot(1), { slot: packSlot('apple', 2, { packBag: 'bag_generic_1' }), x: 200, y: 300 });
    await Promise.resolve();
    assert.equal(e.defaultPrevented, true, 'taken');
    assert.deepEqual(puts, [{ cls: 'apple', count: 2, copy: null, bag: 'bag_generic_1', slot: 1 }]);
  });

  it('a full slot of another class, a refused class, or somewhere outside the window takes nothing', async () => {
    puts.length = 0;
    send('pack-touch-drop', slot(2), { slot: packSlot('apple', 1), x: 0, y: 0 });
    refuse = 'pick';
    send('pack-touch-drop', slot(3), { slot: packSlot('pick', 1), x: 0, y: 0 });
    refuse = null;
    const out = send('pack-touch-drop', t.doc.body, { slot: packSlot('apple', 1), x: 0, y: 0 });
    await Promise.resolve();
    assert.deepEqual(puts, []);
    assert.equal(out.defaultPrevented, false, 'outside the cabinet: not ours');
  });

  it('game.js sends them from the touch lift when the finger is off the pack', () => {
    const fn = game.slice(game.indexOf('function setupPackDrops()'), game.indexOf('function renderPackBar()'));
    assert.match(fn, /new CustomEvent\(type, \{ bubbles: true, cancelable: true, detail: \{ slot: touch\.slot, x, y \} \}\)/);
    assert.match(fn, /else touchElsewhere\('pack-touch-over', event\.clientX, event\.clientY\);/);
    assert.match(fn, /!dropOn\(el\) && touchElsewhere\('pack-touch-drop', event\.clientX, event\.clientY\)/);
    assert.match(fn, /document\.dispatchEvent\(new CustomEvent\('pack-touch-end'\)\);/);
  });
});
