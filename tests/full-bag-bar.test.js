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
    assert.match(style, /\n\[data-ui="modern"\] \.pack-slots \.pack-slot\.pack-bag\.is-bag-full \{ background: var\(--surface-bag-full\); \}/);
    assert.ok(!classic.includes('is-bag-full'), 'Classic keeps its count strip');
  });

  it('G1214 (#637): the backdrop is a mid grey design token, never the jet navy', () => {
    const token = style.match(/\n  --surface-bag-full: var\((--c-[a-z]+-\d+[a-z]?)\);/);
    assert.ok(token, 'a --surface-bag-full token in the token block');
    const hex = style.match(new RegExp(`\\n  ${token[1]}: (#[0-9a-f]{6});`))?.[1];
    assert.ok(hex, `${token[1]} is a palette colour`);
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    assert.ok(Math.max(r, g, b) - Math.min(r, g, b) <= 8, `${hex} is a grey`);
    const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lum = (h) => { const [x, y, z] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16))); return 0.2126 * x + 0.7152 * y + 0.0722 * z; };
    const ratio = (a, b2) => { const [hi, lo] = [lum(a), lum(b2)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
    const value = (name) => { let v = style.match(new RegExp(`\\n  ${name}: ([^;]+);`))?.[1]?.trim(); while (v?.startsWith('var(')) v = style.match(new RegExp(`\\n  ${v.slice(4, -1)}: ([^;]+);`))?.[1]?.trim(); return v; };
    const row = value('--surface-card');
    const accent = value('--accent');
    // Mid: still a clear step from the cream row, but far from the old navy's 15:1 against it.
    assert.ok(ratio(hex, row) >= 1.8 && ratio(hex, row) <= 3, `${hex} on the row ${row}: ${ratio(hex, row).toFixed(2)}`);
    // The full bar on it stays readable (3:1 for a graphic).
    assert.ok(ratio(hex, accent) >= 3, `the accent bar ${accent} on ${hex}: ${ratio(hex, accent).toFixed(2)}`);
    assert.ok(!/is-bag-full[^}]*--c-navy-26/.test(style), 'no navy on a full bag');
  });
});
