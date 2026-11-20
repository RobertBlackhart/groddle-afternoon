/**
 * #562: one icon and one colour per stat (js/stat-icons.js), read by the top bar's rings and
 * counts, the speech bubble's reward slugs (modern skin), the floating amounts and the reward card,
 * so the bubble's "-2 energy" wears the bar's bolt and orange, not a red battery.
 * Run: node --test tests/stat-icons.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  MOOD_FACES,
  STAT_COLORS,
  STAT_CSS_VARS,
  STAT_LOSS,
  STAT_PAINTS,
  applyStatColors,
  contrastRatio,
  drawStatIcon,
  paintStatIcons,
  statChipPaints,
  statIconShapes,
  statIconSvg,
  statIconUrl,
} from '../public/js/stat-icons.js?v=b89600eb';
import { MODERN_SLUG_ICON, SLUG_STYLES, drawSlugGlyph, slugBox, slugPaint } from '../public/js/speech-slugs.js?v=e79cecfa';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const hexNum = (hex) => parseInt(hex.slice(1), 16);
const STATS = ['energy', 'mood', 'xp', 'imagination', 'currants', 'favor'];

/** A Graphics stand-in that records every call. */
let rr;
function newRec() {
  const calls = [];
  rr = new Proxy({}, { get: (_, k) => (k === 'calls' ? calls : (...a) => { calls.push([k, ...a]); return rr; }) });
  return rr;
}

function loadPixi() {
  const g = { console, setTimeout, clearTimeout, navigator: { userAgent: 'node' }, performance };
  g.window = g;
  g.self = g;
  g.globalThis = g;
  vm.createContext(g);
  vm.runInContext(read('public/vendor/pixi/pixi-8.23.0.min.js'), g);
  return g.PIXI;
}

describe('#562: one stat icon map for the top bar and the speech bubble', () => {
  it('the bubble\'s modern slugs paint from the stat map: its tint, its ink, its 16 px icon', () => {
    for (const type of STATS) {
      const gain = slugPaint(type, 5);
      assert.equal(gain.fill, hexNum(STAT_PAINTS[type].tint), type);
      assert.equal(gain.text, hexNum(STAT_PAINTS[type].ink), type);
      assert.deepEqual(gain.icon, MODERN_SLUG_ICON);
      // The icon is the stat map's own drawing, call for call.
      for (const negative of [false, true]) {
        const a = newRec();
        drawSlugGlyph(a, type, negative);
        const b = newRec();
        drawStatIcon(b, type, { negative });
        assert.deepEqual(a.calls, b.calls, `${type} ${negative}`);
        assert.ok(a.calls.length > 2, type);
      }
    }
    // A loss of energy or mood keeps the client's red chip; the icon stays the stat's.
    assert.equal(slugPaint('energy', -2).fill, hexNum(STAT_LOSS.tint));
    assert.equal(slugPaint('mood', -2).text, hexNum(STAT_LOSS.ink));
    assert.equal(slugPaint('imagination', -2).fill, hexNum(STAT_PAINTS.imagination.tint));
    // The modern energy pill is round at both ends (the classic one is the battery's square end).
    assert.equal(slugBox('energy', 7, 7, slugPaint('energy', 2)).rightRadius, 12);
    assert.equal(slugBox('energy', 7, 7).rightRadius, 4);
  });

  it('the classic skin keeps the client\'s slug fills and art', () => {
    const c = slugPaint('energy', -2, { classic: true });
    assert.equal(c.fill, SLUG_STYLES.energy.neg);
    assert.equal(c.classic, true);
    const a = newRec();
    drawSlugGlyph(a, 'energy', true, { classic: true });
    const b = newRec();
    drawStatIcon(b, 'energy', { negative: true });
    assert.notDeepEqual(a.calls, b.calls);
  });

  it('the top bar\'s badges and counts are filled from the map, with no glyph of their own', () => {
    for (const page of ['public/play/index.html', 'public/play/online/index.html']) {
      const html = read(page);
      const bar = html.slice(html.indexOf('<header class="top-bar"'), html.indexOf('id="player-menu"'));
      assert.match(bar, /class="ring-glyph" data-stat-icon="energy"/, page);
      assert.match(bar, /class="ring-glyph" data-stat-icon="mood"/, page);
      assert.match(bar, /class="ring-glyph" data-stat-icon="xp"/, page);
      assert.match(bar, /hud-img[^>]*><span class="stat-icon" data-stat-icon="imagination"/, page);
      assert.match(bar, /currants hud-cur[^>]*><span class="stat-icon" data-stat-icon="currants"/, page);
      // The old hand-drawn bolt and star are gone from the markup.
      assert.doesNotMatch(bar, /<span class="ring-glyph"[^>]*><svg/, page);
    }
    const topbar = read('public/js/ui/topbar.js');
    assert.match(topbar, /import \{ applyStatColors, paintStatIcons \} from '\.\.\/stat-icons\.js/);
    assert.match(topbar, /applyStatColors\(doc\);\n\s*paintStatIcons\(doc\);/);
    assert.doesNotMatch(topbar, /const FACE = \{/);
    const game = read('public/game.js');
    assert.match(game, /const paint = slugPaint\(slug\.type, slug\.amount, \{ classic \}\);/);
    assert.match(game, /drawSlugGlyph\(new PIXI\.Graphics\(\), slug\.type, neg, \{ classic \}\)/);
    assert.match(game, /color: hex\(slug\.paint\.text\)/);
    assert.match(game, /img: floatPaint\('imagination'\)/);
  });

  it('paintStatIcons fills each badge once, and the mood face follows its variant', () => {
    const el = (type, variant = '') => ({ dataset: { statIcon: type, ...(variant ? { statVariant: variant } : {}) }, innerHTML: '' });
    const els = [el('energy'), el('mood', 'critical'), el('xp'), el('imagination'), el('currants'), el('nope')];
    paintStatIcons({ querySelectorAll: () => els });
    assert.equal(els[0].innerHTML, statIconSvg('energy'));
    assert.equal(els[1].innerHTML, statIconSvg('mood', { variant: 'critical' }));
    assert.equal(els[5].innerHTML, '');
    els[0].innerHTML = 'kept';
    paintStatIcons({ querySelectorAll: () => els });
    assert.equal(els[0].innerHTML, 'kept', 'not redrawn when unchanged');
    const faces = MOOD_FACES.map((v) => statIconSvg('mood', { variant: v }));
    assert.equal(new Set(faces).size, 3);
    assert.equal(statIconSvg('mood', { negative: true }), statIconSvg('mood', { variant: 'critical' }));
  });

  it('the stylesheet\'s stat colours are the map\'s, and the map publishes them to the page', () => {
    const css = read('public/style.css');
    const value = (name) => {
      const m = css.match(new RegExp(`^\\s*${name}:\\s*([^;]+);`, 'm'));
      assert.ok(m, name);
      const v = m[1].trim();
      const ref = v.match(/^var\((--[\w-]+)\)$/);
      return ref ? value(ref[1]) : v.toLowerCase();
    };
    for (const [type, name] of Object.entries(STAT_CSS_VARS)) assert.equal(value(name), STAT_COLORS[type], name);
    const set = {};
    applyStatColors({ documentElement: { style: { setProperty: (k, v) => { set[k] = v; } } } });
    assert.equal(set['--energy'], STAT_COLORS.energy);
    assert.equal(set['--mood-tint'], STAT_PAINTS.mood.tint);
    assert.equal(set['--imagination'], STAT_COLORS.imagination);
    // The ring's badge disc takes the ring's colour (amber, then red, when low).
    assert.match(css, /\.top-bar \.ring \.stat-icon-bg \{ fill: var\(--c\); \}/);
    assert.match(statIconSvg('energy'), /<circle class="stat-icon-bg" cx="8" cy="8" r="8" fill="#e8862a"\/>/);
  });

  it('every chip\'s number reads at 4.5:1 on its fill', () => {
    for (const type of STATS) {
      const p = statChipPaints(type, 3);
      assert.ok(contrastRatio(p.tint, p.ink) >= 4.5, `${type} ${contrastRatio(p.tint, p.ink)}`);
    }
    assert.ok(contrastRatio(STAT_LOSS.tint, STAT_LOSS.ink) >= 4.5);
  });

  it('icons stay in their 16 px box and build finite Pixi vertices (G897)', () => {
    const PIXI = loadPixi();
    for (const type of STATS) {
      for (const opts of [{}, { negative: true }, { variant: 'low' }]) {
        assert.ok(statIconShapes(type, opts).length >= 2, type);
        const gr = drawStatIcon(new PIXI.Graphics(), type, opts);
        const out = { geometryData: { vertices: [], indices: [], uvs: [] }, batches: [] };
        PIXI.buildContextBatches(gr.context, out);
        const v = out.geometryData.vertices;
        assert.ok(v.length > 0, type);
        assert.equal(v.filter((x) => !Number.isFinite(x)).length, 0, `${type} ${JSON.stringify(opts)}`);
        assert.ok(Math.min(...v) >= -0.01 && Math.max(...v) <= 16.01, `${type} in its box`);
      }
    }
  });

  it('a stat icon works as an image address (the reward card)', () => {
    const url = statIconUrl('currants');
    assert.ok(url.startsWith('data:image/svg+xml,'));
    assert.match(decodeURIComponent(url), /^data:image\/svg\+xml,<svg [^>]*viewBox="0 0 16 16"/);
  });
});
