/**
 * #585: "I cant see any quest objectives when loading up the quest tab". The Quests sheet read
 * "Active 8 · Offered 4 · Done 8" over a blank list: the report said "quest:active 0/20 cards, tabs
 * 8/4/8", every card in the list and none shown, and no "No active quests" line either. The list
 * is swapped for a fresh draw only when the markup changed or rows were lost (G255, #155), so a list
 * holding every card but showing none stayed blank, through closing and opening the sheet. Now:
 * - the redraw also swaps when the shown list shows fewer rows than the draw (questLogNeedsSwap,
 *   visibleRowCount);
 * - a card whose words, progress or pin throw is still counted, sorted and shown (arrange), and a
 *   quest whose steps are not a list, or a saved quest without its progress, still draws.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadContentCatalogsFromDir } from '../public/js/content-catalogs.js?v=10b118dd';
import { createQuestState, getQuestProgress, listQuestLogNewestFirst, listQuests } from '../public/js/quests.js?v=90a2ee3d';
import { createQuestSheet, questLogNeedsSwap, questProgress, questStep, visibleRowCount } from '../public/js/ui/quest-sheet.js?v=86be8b53';
import { FakeEl, matches } from './social-fake-dom.js';

const pub = join(import.meta.dirname, '../public');
const game = readFileSync(join(pub, 'game.js'), 'utf8');

before(async () => {
  await loadContentCatalogsFromDir(join(pub, 'assets/content'));
});

/** The FakeEl the Quests sheet needs (as tests/quest-list-count.test.js). */
class El extends FakeEl {
  get className() { return this.attrs.class || ''; }
  set className(v) { this.attrs.class = String(v); }
  get nodeType() { return 1; }
  get childNodes() { return this.children; }
  set innerHTML(v) { this._html = String(v); this.children = []; }
  get innerHTML() { return this._html || ''; }
  appendChild(n) { this.append(n); return n; }
  insertBefore(n, ref) {
    if (!ref) return this.appendChild(n);
    this.adopt([n]);
    this.children.splice(this.children.indexOf(ref), 0, n);
    return n;
  }
  remove() {
    if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((c) => c !== this);
    this.parentElement = null;
  }
  #pick(sel) {
    const parts = sel.split(',').map((p) => p.trim());
    return this.all().filter((n) => parts.some((p) => (p.startsWith(':scope >')
      ? n.parentElement === this && matches(n, p.slice(8).trim())
      : matches(n, p))));
  }
  querySelector(sel) { return this.#pick(sel)[0] || null; }
  querySelectorAll(sel) { return this.#pick(sel); }
}
const doc = { createElement: (t) => new El(t) };

function card(title, { quest = '', cls = '' } = {}) {
  const c = new El('div');
  c.className = `q-card${cls ? ` ${cls}` : ''}`;
  if (quest) c.dataset.quest = quest;
  const t = new El('div');
  t.className = 'q-title';
  t.textContent = title;
  c.append(t);
  return c;
}

describe('#585 a list holding every card but showing none is drawn again', () => {
  it('swaps when the shown list shows fewer rows than the draw, the markup and the count the same', () => {
    const same = { drawn: '<a>', lastDrawn: '<a>', shownCount: 20, drawnCount: 20 };
    assert.equal(questLogNeedsSwap({ ...same, shownVisible: 0, drawnVisible: 8 }), true, 'Active 8 over a blank list');
    assert.equal(questLogNeedsSwap({ ...same, shownVisible: 8, drawnVisible: 8 }), false, 'no swap under the pointer (G255)');
    assert.equal(questLogNeedsSwap(same), false, 'without the counts, as before');
  });

  it('counts the rows a box shows', () => {
    const box = new El('div');
    const a = card('A');
    const b = card('B');
    const c = card('C');
    b.hidden = true;
    box.append(a, b, c);
    assert.equal(visibleRowCount(box), 2);
    assert.equal(visibleRowCount(null), 0);
  });

  it('game.js asks it with the rows the live list and the fresh draw show', () => {
    const block = game.slice(game.indexOf("const qShown = document.getElementById('quest');"), game.indexOf('renderQuestTracker();'));
    assert.match(block, /questLogNeedsSwap\(\{ drawn, lastDrawn: questLogDrawn, shownCount: qShown\.childElementCount, drawnCount: qBox\.childElementCount, shownVisible: visibleRowCount\(qShown\), drawnVisible: visibleRowCount\(qBox\) \}\)/);
    assert.ok(block.indexOf('visibleRowCount(qBox)') < block.indexOf('qShown.replaceChildren'), 'read before the swap moves the nodes');
  });
});

describe('#585 one bad quest never blanks the list', () => {
  it('a card whose steps are not a list, or whose pin throws, is counted and shown with the rest', () => {
    const data = {};
    const warn = console.warn;
    console.warn = () => {};
    try {
      const sheet = createQuestSheet({
        document: doc,
        questInfo: (id) => (id === 'odd' ? { requirements: { r1: { desc: 'Odd', num: 1 } } } : { requirements: [{ desc: 'Pet a Piggy', current: 1, num: 2 }] }),
        isPinned: (id) => { if (id === 'pinbroke') throw new Error('pins gone'); return false; },
        setData: (k, v) => { data[k] = v; },
        storage: { getItem: () => 'oldest', setItem() {} },
      });
      const box = new El('div');
      box.append(card('Odd Steps', { quest: 'odd' }), card('Pin Broke', { quest: 'pinbroke' }), card('Piggy Petter', { quest: 'pet' }),
        card('Old One', { cls: 'done' }), card('Put Off', { cls: 'q-put-off' }));
      const counts = sheet.arrange(box);
      assert.deepEqual(counts, { active: 3, offered: 1, done: 1 });
      const active = box.children.filter((n) => n.dataset.questTab === 'active');
      assert.equal(active.length, 3);
      assert.ok(active.every((n) => !n.hidden), 'every active card shows');
      assert.equal(visibleRowCount(box), 3);
      assert.equal(data.questTabShown, 'active:3,offered:1,done:1');
    } finally {
      console.warn = warn;
    }
  });

  it('steps that are not a list read as no steps', () => {
    assert.equal(questProgress({ a: 1 }), 0);
    assert.deepEqual(questStep({ a: 1 }), { step: '', count: '', percent: 0 });
  });

  it('a saved quest without its progress is still listed', () => {
    const [a, b] = listQuests().filter((q) => (q.requirements || []).length).map((q) => q.classTsid);
    const state = createQuestState();
    state.active[a] = { classTsid: a, startedAt: 2 };
    state.active[b] = { classTsid: b, progress: {}, startedAt: 1 };
    assert.equal(getQuestProgress(state, a).requirements[0].current, 0);
    assert.deepEqual(listQuestLogNewestFirst(state).map((r) => r.def.classTsid), [a, b]);
  });
});
