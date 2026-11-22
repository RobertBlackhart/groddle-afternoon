/**
 * G805 (The Catface, 2026-11-14): after the featured project moved to a thin line under the street
 * name, a player took it for gone. The line is a little stronger (a thicker track, a bigger star
 * ringed in the bubble's colour), and the first time it is drawn for a viewer a hint under the bubble
 * says what it is, while the track pulses twice. Shown once per browser; never while the line is not
 * drawn (a phone carries it in the Menu instead, the tutorial hides it). Glitch had no featured
 * project (G656).
 * Run: node --test tests/featured-line-hint.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FEATURED_TEXT } from '../public/js/featured-project.js?v=0149799d';
import { FEATURED_HINT_ID, FEATURED_HINT_KEY, featuredHint, featuredHintSeen } from '../public/js/ui/featured-project.js?v=d0b0e9b1';

const root = join(import.meta.dirname, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const F = { jobId: '377', label: 'Tumble Rd 1', percent: 40 };

function store(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

function fakeDoc({ drawn = true } = {}) {
  class El {
    constructor(tag) {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.attrs = {};
      this.style = {};
      this.dataset = {};
      this.hidden = false;
      this.listeners = {};
      this.classes = new Set();
      this.classList = { add: (c) => this.classes.add(c), remove: (c) => this.classes.delete(c), contains: (c) => this.classes.has(c) };
      this.offsetWidth = 200;
      this._text = '';
    }
    get id() { return this.attrs.id || ''; }
    set id(v) { this.attrs.id = v; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    append(...n) { this.children.push(...n); }
    replaceChildren(...n) { this.children = [...n]; }
    addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text + this.children.map((c) => c.textContent || '').join(''); }
    *walk() { for (const c of this.children) { if (c instanceof El) { yield c; yield* c.walk(); } } }
  }
  const body = new El('body');
  const doc = {
    body,
    documentElement: { clientWidth: 1280 },
    createElement: (t) => new El(t),
    createElementNS: (ns, t) => new El(t),
    getElementById: (id) => [...body.walk()].find((n) => n.id === id) || null,
    addEventListener() {},
    removeEventListener() {},
  };
  const line = new El('button');
  line.getClientRects = () => (drawn ? [1] : []);
  line.getBoundingClientRect = () => ({ left: 400, right: 760, bottom: 48, width: drawn ? 360 : 0 });
  body.append(line);
  return { doc, line };
}

describe('the featured line says what it is, once (G805)', () => {
  it('the first time it is drawn: a hint under it, the track pulses, and the browser remembers', () => {
    const { doc, line } = fakeDoc();
    const s = store();
    featuredHint(doc, line, F, { storage: s, hintMs: 5 });
    const hint = doc.getElementById(FEATURED_HINT_ID);
    assert.ok(hint && !hint.hidden, 'the hint shows');
    assert.equal(hint.textContent, FEATURED_TEXT.hint('Tumble Rd 1'));
    assert.equal(hint.style.top, '58px', 'just under the line');
    assert.ok(line.classList.contains('is-hinting'));
    assert.equal(s.m.get(FEATURED_HINT_KEY), '1');
    assert.equal(featuredHintSeen(s), true);
    // Never twice: another draw on this page, or a new page in this browser.
    assert.equal(featuredHint(doc, line, F, { storage: s }), null);
    const again = fakeDoc();
    assert.equal(featuredHint(again.doc, again.line, F, { storage: s }), null);
  });

  it('a click on the hint opens the project and puts it away', () => {
    const { doc, line } = fakeDoc();
    let opened = 0;
    line._onOpen = () => (opened += 1);
    featuredHint(doc, line, F, { storage: store(), hintMs: 5 });
    const hint = doc.getElementById(FEATURED_HINT_ID);
    hint.onclick();
    assert.equal(opened, 1);
    assert.equal(hint.hidden, true);
    assert.equal(line.classList.contains('is-hinting'), false);
  });

  it('not while the line is not drawn (a phone, the tutorial): kept for later', () => {
    const { doc, line } = fakeDoc({ drawn: false });
    const s = store();
    featuredHint(doc, line, F, { storage: s });
    assert.equal(doc.getElementById(FEATURED_HINT_ID), null);
    assert.equal(s.m.size, 0);
  });

  it('a browser that keeps nothing still gets it once', () => {
    const { doc, line } = fakeDoc();
    const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
    featuredHint(doc, line, F, { storage: blocked, hintMs: 5 });
    assert.ok(doc.getElementById(FEATURED_HINT_ID));
  });

  it('a stronger line in both skins, and plain words', () => {
    const js = read('public/js/ui/featured-project.js');
    assert.match(js, /\.featured-line \.fp-track \{[^}]*height: 3px;[^}]*currentColor 28%/);
    assert.match(js, /\.featured-line \.fp-star \{[^}]*width: 0\.8rem; height: 0\.8rem;[^}]*drop-shadow/);
    assert.match(js, /@media \(prefers-reduced-motion: reduce\) \{ \.featured-line\.is-hinting \.fp-track \{ animation: none; \} \}/);
    assert.match(js, /if \(!line\.hidden\) featuredHint\(doc, line, f, o\);/);
    const classic = read('public/css/classic.css');
    assert.match(classic, /#featured-project-pill \.fp-star \{[^}]*width: calc\(12 \* var\(--cu\)\)/);
    assert.match(classic, /:root\[data-ui="classic"\] \.fp-hint \{/);
    assert.doesNotMatch(FEATURED_TEXT.hint('X'), /—|Glitch/);
  });
});
