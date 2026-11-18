/**
 * G978 (Austin 2026-11-17, R16 calls): the inventions he ruled out are gone from the game and
 * recorded as dropped in tools/inventions/inventions.json with the ruling. Each test reads the
 * code that drew one, so it cannot come back unregistered.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { VENDOR_PROFILES } from '../public/js/vendor.js?v=d88e1a67';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const game = read('public/game.js');
const register = JSON.parse(read('tools/inventions/inventions.json'));
const entry = (id) => register.entries.find((e) => e.id === id);
const fn = (src, name) => {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at >= 0, name);
  return src.slice(at, src.indexOf('\n}\n', at) + 2);
};

function dropped(id) {
  const e = entry(id);
  assert.equal(e?.status, 'dropped', id);
  assert.match(e.ruling, /Austin 2026-11-17 \(G978/, id);
  assert.ok(e.rows.includes('G978'), id);
}

describe('G978: dropped inventions stay gone', () => {
  it('the vendor crest: no disc or store letter on a Street Spirit (GSJS spirits have only store_id)', () => {
    dropped('vendor-crest');
    const spawn = fn(game, 'spawnVendorNpc');
    assert.doesNotMatch(spawn, /crest|badge|\.circle\(/);
    for (const v of Object.values(VENDOR_PROFILES)) assert.equal('badge' in v, false, v.key);
    assert.doesNotMatch(read('build-stores.mjs'), /badge/);
    assert.match(read('public/js/features/street-spirits-feature.js'), /const \[body, label\] = g\.children;/);
  });
});
