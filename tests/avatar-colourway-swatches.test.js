/**
 * #611 (G1144): the wardrobe's colourway chips were coloured from color_1 alone (avatar-looks.js
 * variantSwatch), so 112 of 343 multi-colourway articles showed near-identical chips: the Rook
 * headpiece's all-black colourway 707 read pale khaki beside cream and pink, because its color_1 is
 * the skull. Each chip now shows the slots that tell the article's colourways apart, as the rig
 * draws them (colourwaySwatches, chipBands).
 * Run: node --test tests/avatar-colourway-swatches.test.js
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { SWATCH_NEAR, chipBands, colourDistance, colourwaySwatches, expandCatalog, slotColour, swatchBackground } from '../public/js/avatar-looks.js?v=5a28384d';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = expandCatalog(JSON.parse(readFileSync(join(root, 'public/assets/avatar/catalog.json'), 'utf8')));
const rgb = (hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
const articles = Object.entries(catalog.types).flatMap(([type, items]) => items.filter((i) => i.variants?.length > 1).map((item) => ({ type, item })));

/** How far apart two chips look: the largest gap at any point across them, band by band as drawn. */
function chipGap(a, b) {
  const A = chipBands(a);
  const B = chipBands(b);
  const at = (bands, p) => bands.find(([, from, to]) => p >= from && p <= to)[0];
  let most = 0;
  for (let p = 0; p <= 100; p += 2) most = Math.max(most, colourDistance(rgb(at(A, p)), rgb(at(B, p))));
  return most;
}

/** How far apart two colourways' colours really are: the largest gap in a slot both of them show. */
function realGap(item, i, j) {
  const keys = new Set([...Object.keys(item.variants[i].colors), ...Object.keys(item.variants[j].colors)]);
  let most = 0;
  for (const k of keys) {
    const a = slotColour(item.variants[i].colors[k]);
    const b = slotColour(item.variants[j].colors[k]);
    if (a && b) most = Math.max(most, colourDistance(a, b));
  }
  return most;
}

describe('wardrobe colourway chips (#611)', () => {
  it('the Rook headpiece: its black colourway 707 shows black, beside cream and pink', () => {
    const rook = catalog.types.hat.find((h) => h.name === 'rook_headpiece');
    assert.deepEqual(rook.variants.map((v) => v.id), [612, 656, 707]);
    const chips = colourwaySwatches(rook);
    const black = rgb(chips[2].main);
    assert.ok(Math.max(...black) < 40, `707 reads dark (${chips[2].main})`);
    assert.ok(Math.min(...rgb(chips[0].main)) > 180, `612 reads cream (${chips[0].main})`);
    for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) assert.ok(chipGap(chips[i], chips[j]) >= SWATCH_NEAR * 3, `${i} and ${j} far apart`);
  });

  it('a slot shows its filter as the rig draws it; a hidden slot shows nothing', () => {
    // color_1 of the Rook's 707: D6D9B2 lightened 39, the pale khaki the old chip showed.
    const khaki = slotColour({ tintColor: 'D6D9B2', brightness: '39', saturation: '-44', contrast: '-36', tintAmount: '78', alpha: '100' });
    assert.ok(Math.min(...khaki) > 150, String(khaki));
    assert.equal(slotColour({ tintColor: '00FF00', brightness: '0', saturation: '0', contrast: '0', tintAmount: '0', alpha: '0' }), null);
    assert.deepEqual(slotColour(undefined), [208, 208, 208], 'an untinted slot: its light art');
  });

  it('every article: no two colourways whose colours really differ get near-identical chips', () => {
    assert.ok(articles.length > 300, `${articles.length} multi-colourway articles`);
    const bad = [];
    let pairs = 0;
    for (const { type, item } of articles) {
      const chips = colourwaySwatches(item);
      assert.equal(chips.length, item.variants.length, item.name);
      for (let i = 0; i < chips.length; i++) {
        for (let j = i + 1; j < chips.length; j++) {
          const real = realGap(item, i, j);
          if (real < SWATCH_NEAR) continue;
          pairs += 1;
          const seen = chipGap(chips[i], chips[j]);
          if (seen < SWATCH_NEAR) bad.push(`${type}/${item.name} colourways ${i} and ${j}: ${real.toFixed(0)} apart, chips ${seen.toFixed(0)}`);
        }
      }
    }
    assert.ok(pairs > 2000, `${pairs} pairs checked`);
    assert.deepEqual(bad, []);
  });

  it('chips draw as one colour, or the main colour with one or two corner bands', () => {
    assert.equal(swatchBackground({ main: '112233', extra: [] }), '#112233');
    assert.equal(swatchBackground({ main: '112233', extra: [null, '112233'] }), '#112233', 'hidden or same corners fold away');
    assert.equal(swatchBackground({ main: '112233', extra: ['aabbcc'] }), 'linear-gradient(135deg, #112233 0% 60%, #aabbcc 60% 100%)');
    assert.deepEqual(chipBands({ main: '112233', extra: [null, 'aabbcc'] }).map((b) => b[0]), ['112233', '112233', 'aabbcc']);
    assert.equal(swatchBackground(null), '#d8d8d8');
  });

  it('the wardrobe paints its chips from colourwaySwatches, not color_1', () => {
    const src = readFileSync(join(root, 'public/game.js'), 'utf8');
    assert.match(src, /const chips = colourwaySwatches\(item\);/);
    assert.match(src, /btn\.style\.background = swatchBackground\(chips\[i\]\);/);
    assert.doesNotMatch(src, /variantSwatch\(/);
  });
});
