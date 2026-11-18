/**
 * R16 (Austin 2026-11-17): every invention, in one place. tools/inventions/inventions.json lists
 * what the remake made up that Glitch did not have, and this test fails when the code gains a new
 * one that the register does not list:
 *
 * - a new marker in the code ("the remake's own", "ours", "no source", "stand-in", "invented",
 *   "reimagined", "Glitch had no", ...; tools/inventions/scan.mjs MARKERS) that
 *   tools/inventions/markers.json does not claim for an entry;
 * - a new member of a family held in data: a remake-only sound key, a `designed` season, a made
 *   deco, sprite or map, a `reimagined` checklist or inventory row, a Known gaps "On purpose" row.
 *
 * When it fails: add an entry to tools/inventions/inventions.json (or extend the one it belongs
 * to; status proposed unless Austin has ruled), then `node tools/inventions/scan.mjs --claim <id>
 * <file>`; for a family, copy `node tools/inventions/scan.mjs --families` into the entry's
 * `members`. A hit that only uses the word: `--claim not-an-invention <file>`. A mark you removed or
 * reworded: `--prune`.
 * Run: node --test tests/inventions-register.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  FAMILIES, KINDS, NOT_AN_INVENTION, STATUSES,
  claimProblems, commentStart, familyDrift, hitKey, loadMarkers, loadRegister, registerProblems, scanMarkers, staleClaims,
} from '../tools/inventions/scan.mjs';

const register = loadRegister();
const markers = loadMarkers();
const hits = scanMarkers();
const where = (h) => `${h.file}:${h.line} [${h.marker}] ${h.text.slice(0, 110)}`;

describe('inventions register (R16)', () => {
  it('is well formed: ids, kinds, statuses, rulings, files, one entry per family', () => {
    assert.deepEqual(registerProblems(register), []);
  });

  it('claims every invention marker in the code', () => {
    const { unclaimed } = claimProblems(hits, markers, register);
    assert.equal(unclaimed.length, 0,
      `${unclaimed.length} new invention mark(s) the register does not list. Register each (tools/inventions/inventions.json), then node tools/inventions/scan.mjs --claim <id> <file>:\n${unclaimed.slice(0, 25).map(where).join('\n')}`);
  });

  it('names only entries that exist', () => {
    const { unknown } = claimProblems(hits, markers, register);
    assert.deepEqual(unknown, []);
  });

  it('holds no claim for a mark that is gone (node tools/inventions/scan.mjs --prune)', () => {
    const stale = staleClaims(hits, markers);
    assert.equal(stale.length, 0, `stale claims:\n${stale.slice(0, 25).map((s) => `${s.file}: ${s.key}`).join('\n')}`);
  });

  it('lists every member of each family held in data', async (t) => {
    for (const d of await familyDrift(register)) {
      if (d.skipped) { t.diagnostic(`skipped ${d.family}: ${d.skipped} (partial checkout)`); continue; }
      assert.deepEqual({ family: d.family, new: d.added, gone: d.removed }, { family: d.family, new: [], gone: [] },
        `family ${d.family}: update entry ${d.entry}'s members (node tools/inventions/scan.mjs --families)`);
    }
  });

  it('keeps the precedents that started R16 (G248, G265, G286, G297, G344, G44b)', () => {
    const rows = new Set(register.entries.filter((e) => e.status === 'dropped').flatMap((e) => e.rows));
    for (const row of ['G248', 'G265', 'G286', 'G297', 'G344', 'G44b']) assert.ok(rows.has(row), row);
  });
});

describe('inventions scanner', () => {
  const root = mkdtempSync(join(tmpdir(), 'inventions-'));
  mkdirSync(join(root, 'public/js'), { recursive: true });
  mkdirSync(join(root, 'tools'), { recursive: true });
  writeFileSync(join(root, 'public/game.js'), '');
  writeFileSync(join(root, 'public/js/thing.js'), [
    "import { a } from './a.js?v=1234abcd'; // the remake's own word filter",
    'export const LINES = Object.freeze({',
    "  busy: 'Everyone is busy.', // ours",
    "  away: 'Nobody is home.', // ours",
    "  hello: 'I guess so!',",
    '});',
    '/** A soft glow under the drop (no source: the client drew none). */',
    'export function glow() { const ours = 1; return ours; }',
  ].join('\n'));
  const found = scanMarkers(root);
  rmSync(root, { recursive: true, force: true });

  it('finds the marks in comments and code, and not a word in dialogue or a variable', () => {
    assert.deepEqual(found.map((h) => `${h.line}:${h.marker}`), ['1:remake-own', '3:ours', '4:ours', '7:no-source']);
  });

  it('tells two copy lines apart by the words before the mark', () => {
    assert.notEqual(found[1].key, found[2].key);
    assert.match(found[1].key, /busy/);
  });

  it('keys a mark by its words, not a module key', () => {
    const a = hitKey('remake-own', "x.js?v=1234abcd'; // the remake's own filter", 22, 16);
    const b = hitKey('remake-own', "x.js?v=99999999'; // the remake's own filter", 22, 16);
    assert.equal(a, b);
  });

  it('finds the comment on a line', () => {
    assert.equal(commentStart('  * a doc line'), 0);
    assert.equal(commentStart("const a = 'https://x'; // ours"), 23);
    assert.equal(commentStart("const a = 'https://x';"), -1);
    assert.equal(commentStart('# ours', 'tools/x.py'), 0);
  });

  it('names the symbol a mark sits under', () => {
    assert.equal(found[3].symbol, 'glow');
  });

  it('refuses a kept or dropped entry with no ruling, and an unknown kind', () => {
    const bad = { entries: [
      { id: 'x', title: 'X', kind: 'sparkle', status: 'kept', why: 'y', where: [{ file: 'public/game.js' }] },
    ] };
    const problems = registerProblems(bad);
    assert.ok(problems.some((p) => /kind sparkle/.test(p)));
    assert.ok(problems.some((p) => /needs a ruling/.test(p)));
    assert.ok(problems.some((p) => /family remake-sound-keys has no entry/.test(p)));
  });

  it('keeps its vocabulary', () => {
    assert.deepEqual(KINDS, ['behaviour', 'visual', 'data', 'placement', 'UI', 'content']);
    assert.deepEqual(STATUSES, ['kept', 'proposed', 'under-review', 'dropped']);
    assert.equal(NOT_AN_INVENTION, 'not-an-invention');
    assert.ok(Object.keys(FAMILIES).includes('designed-seasons'));
  });
});
