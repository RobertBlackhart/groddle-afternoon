// #498 (first trip to Hell): the Wine of the Dead went into the pack unseen. As Glitch drew a
// FLOOR_TO_PACK (ItemstackAnimation.as 237-269) for pc.createItemFromSource, an item an NPC gives
// now flies from it into the pack, and the purchase line is the newest notice of its moment.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PACK_FLIGHT, packFlightFrames, packFlightCountFrames, packFlightCount, flyItemToPack, noteFlown, unflownItems } from '../public/js/pack-flight.js?v=8da4ab78';

const root = join(import.meta.dirname, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

class El {
  constructor(tag) { Object.assign(this, { tag, style: {}, kids: [], attrs: {}, anims: [], parent: null }); }
  setAttribute(k, v) { this.attrs[k] = v; }
  append(...k) { for (const c of k) { c.parent = this; this.kids.push(c); } }
  appendChild(c) { this.append(c); return c; }
  remove() { if (this.parent) this.parent.kids = this.parent.kids.filter((c) => c !== this); this.parent = null; }
  animate(frames, opts) { const a = { frames, opts, onfinish: null, oncancel: null }; this.anims.push(a); return a; }
}
const fakeDoc = () => { const body = new El('body'); return { body, createElement: (t) => new El(t) }; };

describe('#498 an item given from the street flies into the pack', () => {
  it('keeps the client timings: grow 1 s, sit 0.7 s, fly 0.5 s, 80 px icon ending at half size', () => {
    assert.equal(PACK_FLIGHT.riseMs, 1000);
    assert.equal(PACK_FLIGHT.holdMs, 700);
    assert.equal(PACK_FLIGHT.flyMs, 500);
    assert.equal(PACK_FLIGHT.iconPx, 80);
    assert.equal(PACK_FLIGHT.endScale, 0.5);
  });

  it('grows from nothing at the source, rises, sits, then lands on the slot', () => {
    const f = packFlightFrames({ x: 100, y: 300 }, { x: 640, y: 760 });
    assert.equal(f.length, 4);
    assert.match(f[0].transform, /translate\(100px, 300px\).*scale\(0\)/);
    assert.match(f[1].transform, new RegExp(`translate\\(100px, ${300 - PACK_FLIGHT.risePx}px\\).*scale\\(1\\)`));
    assert.equal(f[1].transform, f[2].transform, 'it sits');
    assert.ok(Math.abs(f[1].offset - 1000 / 2200) < 1e-9);
    assert.ok(Math.abs(f[2].offset - 1700 / 2200) < 1e-9);
    assert.match(f[3].transform, /translate\(640px, 760px\).*scale\(0\.5\)/);
    assert.equal(f[3].offset, 1);
  });

  it('shows the count until it flies, as "+N" (or "-N")', () => {
    const c = packFlightCountFrames();
    assert.equal(c[1].opacity, 1);
    assert.equal(c[2].opacity, 0);
    assert.ok(c[2].offset > c[1].offset);
    assert.equal(packFlightCount(1), '+1');
    assert.equal(packFlightCount(5), '+5');
    assert.equal(packFlightCount(-2), '-2');
  });

  it('draws one page element with the icon and count, gone when it lands', () => {
    const doc = fakeDoc();
    let done = 0;
    const el = flyItemToPack({ doc, from: { x: 10, y: 20 }, to: { x: 30, y: 40 }, iconUrl: 'assets/x.webp', count: 1, onDone: () => { done += 1; } });
    assert.ok(el);
    assert.equal(doc.body.kids.length, 1);
    assert.equal(el.attrs['aria-hidden'], 'true');
    assert.equal(el.kids[0].src, 'assets/x.webp');
    assert.equal(el.kids[1].textContent, '+1');
    assert.equal(el.anims[0].opts.duration, 2200);
    el.anims[0].onfinish();
    assert.equal(doc.body.kids.length, 0);
    assert.equal(done, 1);
  });

  it('draws nothing with reduced motion, no icon or no points', () => {
    const doc = fakeDoc();
    const base = { doc, from: { x: 1, y: 2 }, to: { x: 3, y: 4 }, iconUrl: 'a.webp' };
    assert.equal(flyItemToPack({ ...base, reduced: true }), null);
    assert.equal(flyItemToPack({ ...base, iconUrl: '' }), null);
    assert.equal(flyItemToPack({ ...base, to: null }), null);
    assert.equal(doc.body.kids.length, 0);
  });
});

describe('#498 who flies what', () => {
  it('the engine offers flyToPack, landing on the slot that shows the item (else the pack bar)', () => {
    const g = read('public/game.js');
    assert.match(g, /flyToPack: \(classTsid, count, source\) => flyToPackFrom\(classTsid, count, source\)/);
    const fn = g.slice(g.indexOf('function packFlightTarget('), g.indexOf('function slugFlightTarget('));
    assert.match(fn, /findPackSlotElement\(classTsid\)/);
    assert.match(fn, /getElementById\('pack-items'\)/);
    assert.match(fn, /flyItemToPack\(/);
    assert.match(fn, /prefers-reduced-motion/);
  });

  it("Hell's Bartender: the wine flies after the pack is redrawn, the purchase line after the quest's news", () => {
    const f = read('public/js/features/hell-bar-feature.js');
    const fn = f.slice(f.indexOf('function applyGrant('), f.indexOf('function converse('));
    assert.ok(fn.indexOf("engine.achievement('vendor_bought:wine_of_the_dead'") < fn.indexOf('engine.pushActivity(line)'));
    assert.ok(fn.indexOf('engine.refreshPack()') < fn.indexOf('engine.flyToPack?.(WINE, 1, bartender?.sprite)'));
    assert.match(fn, /if \(result\.ok\) engine\.flyToPack/);
  });

  it('the other NPCs that hand over an item from themselves: the Rube, the Fox Ranger, the Smuggler', () => {
    assert.match(read('public/js/features/rube-feature.js'), /engine\.flyToPack\?\.\(res\.give, 1, rube\.sprite\)/);
    const fox = read('public/js/features/foxes-feature.js');
    assert.match(fox, /engine\.flyToPack\?\.\(FOX_BRUSH_ID, FOX_LICENSE\.brush, ranger\?\.sprite\)/);
    assert.match(fox, /engine\.flyToPack\?\.\(FOX_BAIT_ID, FOX_LICENSE\.bait, ranger\?\.sprite\)/);
    const smug = read('public/js/features/smuggling-feature.js');
    assert.match(smug, /engine\.flyToPack\?\.\(RECEIVE_REWARDS\.item, RECEIVE_REWARDS\.count, from\.sprite\)/);
    assert.match(smug, /giveRewards\(engine, npc\)/);
    assert.match(smug, /giveRewards\(engine, receiver\)/);
  });
});

describe('G1016 an item that flew is not floated from the avatar too (Glitch showed only the flight)', () => {
  it('a flown item drops out of the gain\'s floats for one flight\'s time; others stay', () => {
    const t0 = 5_000_000;
    noteFlown('fox_brush', t0);
    assert.deepEqual(unflownItems({ fox_brush: 1, fox_bait: 5 }, t0 + 10), { fox_bait: 5 });
    const span = PACK_FLIGHT.riseMs + PACK_FLIGHT.holdMs + PACK_FLIGHT.flyMs;
    assert.deepEqual(unflownItems({ fox_brush: 1 }, t0 + span), {});
    assert.deepEqual(unflownItems({ fox_brush: 1 }, t0 + span + 1), { fox_brush: 1 }, 'a later gain of the same item floats again');
    assert.deepEqual(unflownItems(undefined, t0), {});
  });

  it('game.js notes only a flight it drew and pushActivity floats the rest; the log line keeps the item', () => {
    const g = read('public/game.js');
    const fly = g.slice(g.indexOf('function flyToPackFrom('), g.indexOf('function slugFlightTarget('));
    assert.match(fly, /if \(flight\) noteFlown\(classTsid\)/);
    const push = g.slice(g.indexOf('function pushActivity('), g.indexOf('function logGain('));
    assert.match(push, /notify\.activity\(msg, \{ labelOf \}\)/);
    assert.match(push, /floatGains\(effectTokens\(\{ \.\.\.msg\.effects, items: unflownItems\(msg\.effects\.items\) \}, labelOf\)\)/);
  });

  it('every handover flies before its gain line: the Fox Ranger and the Smuggler (the Rube and the bartender log plain lines)', () => {
    const fox = read('public/js/features/foxes-feature.js');
    assert.ok(fox.indexOf('engine.flyToPack?.(FOX_BRUSH_ID') < fox.indexOf("base: 'The Fox Ranger gave you a Fox Brush'"));
    assert.ok(fox.indexOf('engine.flyToPack?.(FOX_BAIT_ID') < fox.indexOf("base: 'The Fox Ranger gave you Fox Bait'"));
    const smug = read('public/js/features/smuggling-feature.js');
    const fn = smug.slice(smug.indexOf('function giveRewards('), smug.indexOf('function deliver('));
    assert.ok(fn.indexOf('engine.refreshPack?.()') < fn.indexOf('engine.flyToPack?.('));
    assert.ok(fn.indexOf('engine.flyToPack?.(') < fn.indexOf('engine.pushActivity?.('));
    assert.doesNotMatch(read('public/js/features/rube-feature.js'), /pushActivity\?\.\(\{[^}]*effects/);
    const bar = read('public/js/features/hell-bar-feature.js');
    assert.doesNotMatch(bar.slice(bar.indexOf('function applyGrant('), bar.indexOf('function converse(')), /effects: \{ items/);
  });
});
