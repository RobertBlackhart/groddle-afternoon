/**
 * Every quest requirement line reads as words in the quest log. GSJS left a few `desc`s as raw keys
 * ("black_pepper_made", "Gift_5_neighbors"); build-quests.mjs REQUIREMENT_TEXT gives them words.
 * Run: node --test tests/quest-requirement-text.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const quests = JSON.parse(readFileSync(join(root, 'public', 'assets', 'content', 'quests.json'), 'utf8'));

describe('quest requirement text', () => {
  it('has no raw keys in any requirement line', () => {
    const raw = [];
    for (const q of Object.values(quests)) {
      for (const r of q.requirements || []) {
        if (/^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$/.test(String(r.desc || '').trim())) raw.push(`${q.classTsid} ${r.id}: ${r.desc}`);
      }
    }
    assert.deepEqual(raw, []);
  });

  // #671: the quest editor's placeholders ("Toggle flag grind_100_chunks_of_sparkly_in_neva_neva",
  // "Increment counter butlers_zombied to 31") and a raw id inside a line. Hidden quests too: the
  // encyclopedia shows their steps.
  it('has no editor placeholder or raw id anywhere in a requirement line', () => {
    const bad = [];
    for (const q of Object.values(quests)) {
      for (const r of q.requirements || []) {
        const desc = String(r.desc || '').trim();
        if (!desc || /\b(Toggle flag|Increment counter)\b/i.test(desc) || /\b[a-z0-9]+_[a-z0-9_]+\b/.test(desc)) bad.push(`${q.classTsid} ${r.id}: ${desc}`);
      }
    }
    assert.deepEqual(bad, []);
  });

  it('has no placeholder quest desc (A Summer\'s Day was "Blah blah, part 1")', () => {
    // A stub with no offer and no steps (potionmaking_make_and_use_essence_of_hole_potion) is offered nowhere.
    const bad = Object.values(quests)
      .filter((q) => String(q.offer || '').trim() || (q.requirements || []).length)
      .filter((q) => !String(q.desc || '').trim() || /^(blah\b|part \d+$)/i.test(String(q.desc).trim()))
      .map((q) => `${q.classTsid}: "${q.desc}"`);
    assert.deepEqual(bad, []);
  });

  it('words the placeholders of Sparkly of Interest, the butlers, A Summer\'s Day and the Winter Walk', () => {
    const desc = (id) => quests[id].requirements.map((r) => r.desc);
    assert.deepEqual(desc('sparkly_of_interest_2'), ['Mine 100 chunks of sparkly while in Neva Neva', 'Grind 100 chunks of sparkly while in Neva Neva']);
    assert.deepEqual(desc('butler_zombies'), ['Say "zombie" to 31 butlers in one game day']);
    assert.deepEqual(desc('blue_and_white_part1'), ["Stay until the summer's day ends"]);
    assert.deepEqual(desc('winter_walk_part2'), ['Stay until the winter walk ends']);
  });

  it('words Umbrian Black and White and The nicest day in the neighborhood', () => {
    const desc = (id) => quests[id].requirements.map((r) => r.desc);
    assert.deepEqual(desc('umbra_black_white'), ['Make a mound of Black Pepper', 'Make a vial of White Gas', 'Make a piece of Licorice']);
    assert.deepEqual(desc('neighbor_gifts'), ['Leave gifts with the butlers of 5 neighbors']);
  });
});
