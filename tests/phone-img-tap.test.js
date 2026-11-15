/**
 * #350 (a phone held sideways): the iMG on the top bar is a 20 px line at the screen's top edge, and a
 * tap often missed it. Its tap area (style.css, .hud-img::before on a touch phone) runs the bar's
 * height: at least 44 px from the screen's top edge down over the currants (which open nothing on a
 * phone), while favor, positioned after it in the page, keeps its own taps.
 * Browser check (WebKit 874 x 402 and 402 x 812, DPR 3): elementFromPoint finds the iMG from y 0 to
 * 48 over it and over the currants, favor's centre is still favor, and a tap 1 px under the bar's
 * old target opens Upgrades; the bar looks the same.
 * Run: node --test tests/phone-img-tap.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolvedStyleCss } from './css-tokens.js';

const css = resolvedStyleCss();
const PHONE = ':root.touch-phone[data-ui="modern"] .top-bar .hud-stats';
const rule = (sel) => {
  const at = css.lastIndexOf(`${sel} {`);
  assert.ok(at >= 0, sel);
  return css.slice(at, css.indexOf('}', at));
};
// calc() with resolved tokens: px, rem, products by a number; --safe-t is 0 on a computer.
const px = (expr) => {
  let e = expr.replace(/var\(--safe-t, 0px\)/g, '0px').replace(/(\d+(?:\.\d+)?)rem/g, (m, n) => `${n * 16}px`).replace(/px/g, '').replace(/calc/g, '');
  assert.match(e, /^[\d\s.+\-*()]+$/, expr);
  return Function(`return (${e});`)();
};

describe('the iMG on a phone bar', () => {
  it('is drawn 20 px tall and tapped over at least 44 px', () => {
    const drawn = Number(rule(`${PHONE} .hud-cur`).match(/height: (\d+)px/)[1]);
    const before = rule(`${PHONE} .hud-img::before`);
    const top = px(before.match(/top: ([^;]+);/)[1]);
    const bottom = px(before.match(/bottom: ([^;]+);/)[1]);
    assert.ok(top < 0 && bottom < 0, 'it reaches past the drawn pill both ways');
    assert.ok(drawn - top - bottom >= 44, `tap height ${drawn - top - bottom}`);
  });
  it('favor is positioned too, so it paints over the stretched area and keeps its own taps', () => {
    assert.match(css, /\.hud-stats \.hud-img,\s*:root\.touch-phone\[data-ui="modern"\] \.top-bar \.hud-stats #favor-stat \{ position: relative; \}/);
  });
});
