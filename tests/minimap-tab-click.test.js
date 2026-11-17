// The street minimap's tab expands it on a click (Austin 2026-11-17): the click hands the focus back to
// the world canvas, and that focusout used to roll the map straight back up. A focus leaving while the
// pointer is over the map is not a roll-out; pointerleave still closes it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'public/js/ui/street-minimap.js'), 'utf8');

test('a focusout under the pointer does not roll the map up', () => {
  const m = src.match(/root\.addEventListener\('focusout', \(e\) => \{([\s\S]*?)\}\);/);
  assert.ok(m, 'focusout handler');
  assert.match(m[1], /matches\?\.\(':hover'\)/);
});

test('leaving the map with the pointer still rolls it up', () => {
  assert.match(src, /root\.addEventListener\('pointerleave', \(\) => \{[\s\S]{0,120}setExpanded\(false\)/);
});
