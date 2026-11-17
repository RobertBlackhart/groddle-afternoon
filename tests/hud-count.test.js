/**
 * #372 (Austin 2026-11-15): a phone's top bar shows iMG, currants and favor side by side in one row,
 * counts over 9,999 shortened on a phone only (17.2K, 110.5K, 1.2M: one decimal, no trailing .0,
 * cut rather than rounded); a desktop window keeps the whole number.
 * Run: node --test tests/hud-count.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HUD_SHORT_OVER, hudCount, renderTopBar } from '../public/js/ui/topbar.js?v=b8c31e13';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

describe('#372 top bar counts on a phone', () => {
  it('shortens over 9,999 to one decimal, no trailing .0, never more than you have', () => {
    const cases = [[17230, '17.2K'], [110510, '110.5K'], [1234567, '1.2M'], [20000, '20K'], [10000, '10K'], [17299, '17.2K'], [999999, '999.9K'], [1_000_000, '1M'], [2_500_000_000, '2.5B']];
    for (const [n, want] of cases) assert.equal(hudCount(n, true), want, String(n));
    assert.equal(HUD_SHORT_OVER, 9999);
    for (const n of [0, 7, 250, 9999]) assert.equal(hudCount(n, true), String(n));
    assert.equal(hudCount('110510', true), '110.5K');
  });

  it('a desktop keeps the number as it was', () => {
    for (const n of [0, 250, 17230, 110510, 1234567]) assert.equal(hudCount(n, false), String(n));
    assert.equal(hudCount(17230), '17230');
  });

  it('the game writes the iMG and the bar currants through it on a phone; the pack and vendor keep the whole number', () => {
    const game = readFileSync(join(PUBLIC, 'game.js'), 'utf8');
    assert.match(game, /document\.getElementById\('stat-img'\)\.textContent = hudCount\(pc\.imagination, TOUCH_PHONE\);/);
    assert.match(game, /if \(curEl\) curEl\.textContent = hudCount\(cur, TOUCH_PHONE\);\s*const packCur = document\.getElementById\('pack-currants'\);\s*if \(packCur\) packCur\.textContent = cur;/);
  });

  it('favor shortens on a phone only', () => {
    const doc = (phone) => {
      const els = {};
      const node = (id) => (els[id] ||= { id, hidden: true, textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k]; }, hasAttribute(k) { return k in this.attrs; }, removeAttribute(k) { delete this.attrs[k]; }, querySelector: () => null });
      return { els, documentElement: { classList: { contains: (c) => phone && c === 'touch-phone' } }, querySelector: () => null, getElementById: node };
    };
    const favor = { name: 'Spriggan', points: 12_345, target: 20_000, icon: 'x.webp' };
    const phone = doc(true);
    renderTopBar(phone, { favor });
    assert.equal(phone.els['stat-favor'].textContent, '12.3K');
    const desk = doc(false);
    renderTopBar(desk, { favor });
    assert.equal(desk.els['stat-favor'].textContent, '12,345');
  });
});
