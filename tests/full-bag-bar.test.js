/**
 * G656 (mr granberry's Ideas post "full bag indicator"): in the Modern pack row a full bag's bar
 * takes the accent colour, so 16 of 16 never looks like 15 of 16. Classic already prints the
 * count on the opener strip (PackSlot.as 147-176), so its own strip style is unchanged.
 * Run: node --test tests/full-bag-bar.test.js
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const pub = join(import.meta.dirname, '..', 'public');
const game = readFileSync(join(pub, 'game.js'), 'utf8');
const style = readFileSync(join(pub, 'style.css'), 'utf8');
const classic = readFileSync(join(pub, 'css', 'classic.css'), 'utf8');

describe('a full bag reads full at a glance', () => {
  it('marks the opener is-full at capacity', () => {
    assert.match(game, /const bagFull = s\.bag\.capacity > 0 && s\.bag\.used >= s\.bag\.capacity;\s*opener\.classList\.toggle\('is-full', bagFull\);/);
  });

  it('Modern colours a full bar with the accent; Classic keeps its count strip', () => {
    assert.match(style, /\n\.pack-bag-opener\.is-full \{ background: var\(--accent\); \}/);
    assert.ok(!classic.includes('is-full'), 'Classic shows the count instead');
  });

  it('G1193: Modern puts a dark backdrop behind a full bag, and says full to a screen reader', () => {
    assert.match(game, /slot\.classList\.toggle\('is-bag-full', bagFull\);/);
    assert.match(game, /if \(bagFull && slot\.getAttribute\('aria-label'\)\) slot\.setAttribute\('aria-label', `\$\{slot\.getAttribute\('aria-label'\)\}, full`\);/);
    assert.match(style, /\n\[data-ui="modern"\] \.pack-slots \.pack-slot\.pack-bag\.is-bag-full \{ background: var\(--c-navy-26\); \}/);
    assert.ok(!classic.includes('is-bag-full'), 'Classic keeps its count strip');
  });
});
