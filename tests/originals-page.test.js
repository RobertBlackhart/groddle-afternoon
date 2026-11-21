/**
 * The Groddle Originals page (tools/new-content/to-minn.mjs, Austin 2026-11-21, was /new-content/):
 * at /originals/, words that describe what ships and do not date, one entry per original with its
 * own status and dates, Pot Luck Day first with its Thanksgiving feast.
 * Run: node --test tests/originals-page.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGINALS, originalsContent } from '../tools/new-content/to-minn.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = originalsContent();
const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

describe('Groddle Originals page', () => {
  it('is written to /originals/ as Groddle Originals', () => {
    const src = readFileSync(join(ROOT, 'tools/new-content/to-minn.mjs'), 'utf8');
    assert.match(src, /slug=originals&/);
    assert.match(src, /title: 'Groddle Originals', slug: 'originals'/);
    assert.doesNotMatch(src, /slug: 'new-content'|slug=new-content/);
    assert.match(text, /Groddle Originals/);
  });

  it('gives each original its own status and dates, Pot Luck Day first and live', () => {
    assert.equal(ORIGINALS[0].id, 'pot-luck-day');
    assert.equal(ORIGINALS[0].status, 'live');
    for (const o of ORIGINALS) {
      assert.ok(['live', 'building', 'planned'].includes(o.status), o.id);
      assert.ok(o.dates, o.id);
      assert.match(html, new RegExp(`id="${o.id}"`));
    }
  });

  it('says what ships, with the dates, Pacific times and the feast', () => {
    assert.match(text, /November 22 to 29/);
    assert.match(text, /Pacific/);
    assert.match(text, /Thanksgiving Day \(November 26 in 2026\)/);
    assert.match(text, /Groddle Forest Junction/);
    assert.match(text, /16 piles/);
    assert.match(text, /11 bites/);
  });

  it('has no words that date: no build status, art in progress or plan', () => {
    assert.doesNotMatch(text, /Status: building|being drawn|\(planned\)|is a plan|planned here/i);
    assert.doesNotMatch(text, /\bnew content\b/i);
    assert.doesNotMatch(html, /—/, 'no em dashes');
  });
});
