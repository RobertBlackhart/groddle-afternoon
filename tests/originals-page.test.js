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
import { ALT_PARTS, MODERN_PARTS, ORIGINALS, PHONE_PARTS, originalsContent } from '../tools/new-content/to-minn.mjs';

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

  it('has Playing on a phone as its second entry, live since November 12, 2026', () => {
    assert.equal(ORIGINALS[1].id, 'phone');
    assert.equal(ORIGINALS[1].title, 'Playing on a phone');
    assert.equal(ORIGINALS[1].status, 'live');
    assert.match(ORIGINALS[1].dates, /Nov 12, 2026/);
    assert.ok(html.indexOf('id="pot-luck-day"') < html.indexOf('id="phone"'), 'Pot Luck Day first');
    assert.match(text, /Glitch was a Flash game and never ran on a phone/);
    assert.match(text, /upright or sideways/);
    for (const part of [/stick/, /follow your thumb/, /Jump/, /Act, which does what Enter does/, /tap a ladder to climb/, /Pinch/, /pack row scrolls/, /Panels, Mail, Decorate and the character builder/, /companion page for reports, mail and friends/, /carry pictures/]) {
      assert.ok(PHONE_PARTS.some((l) => part.test(l)), String(part));
    }
    assert.match(text, /newer than the rest/i);
    assert.match(text, /tagged \[Mobile\]/);
  });

  it('has The Modern interface third, live since October 30, 2026, beside Classic', () => {
    assert.equal(ORIGINALS[2].id, 'modern-interface');
    assert.equal(ORIGINALS[2].status, 'live');
    assert.match(ORIGINALS[2].dates, /Oct 30, 2026 \(v0\.6\.0\)/);
    assert.ok(html.indexOf('id="phone"') < html.indexOf('id="modern-interface"'));
    assert.match(text, /faithful copy of it as Classic/);
    for (const part of [/Warm paper/, /three floating pills/, /Social drawer/, /one row/, /search/, /Side sheets/, /verb menu/, /Imagination hub on X/]) {
      assert.ok(MODERN_PARTS.some((l) => part.test(l)), String(part));
    }
    assert.match(text, /share one game/);
    assert.match(text, /Menu and choose Interface, or press the comma key for Preferences/);
  });

  it('has Alternate characters fourth, live since November 12, 2026, with their limits', () => {
    assert.equal(ORIGINALS[3].id, 'alternate-characters');
    assert.equal(ORIGINALS[3].status, 'live');
    assert.match(ORIGINALS[3].dates, /Nov 12, 2026 \(v0\.35\.0\)/);
    assert.ok(html.indexOf('id="modern-interface"') < html.indexOf('id="alternate-characters"'));
    for (const part of [/Up to three characters/, /start card/, /switch from anywhere/, /Only the sign-in is shared/, /once a day/, /Retire/, /30 days/]) {
      assert.ok(ALT_PARTS.some((l) => part.test(l)), String(part));
    }
    // Glitch's own rule could not be established from the sources: no comparison is claimed.
    const section = html.slice(html.indexOf('id="alternate-characters"'), html.indexOf('report-foot'));
    assert.ok(section.length > 200);
    assert.doesNotMatch(section, /Glitch/);
  });
});
