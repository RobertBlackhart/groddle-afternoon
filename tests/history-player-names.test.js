/**
 * No player names in the public files (Austin 2026-11-23: scrub the files and the generator; no
 * history rewrite). public/restoration/history.json is built from commit messages
 * (tools/build-restoration.mjs historyLog) and some old commit bodies name players: the generator
 * drops each body line naming one, a subject says "a player" (tools/restoration/player-names.mjs).
 * The names come from a private list outside the repo (../research/private/player-names.txt or
 * GRODDLE_PLAYER_NAMES); without it the checks against real names skip, as research-backed tests do.
 * Run: node --test tests/history-player-names.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PLAYER_NAMES_PATH, loadPlayerNames, parsePlayerNames, playerNamesIn, scrubChange } from '../tools/restoration/player-names.mjs';
import { historyLog } from '../tools/build-restoration.mjs';

const ROOT = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const LIST = loadPlayerNames();

// Made-up names only: the real ones never enter the repo.
const FAKE = parsePlayerNames('# a comment\nZeb Quillon\nmossy\n\nnot: Uncle Zeb Quillon\n');

describe('the matcher (made-up names)', () => {
  it('reads names and game phrases, skipping comments', () => {
    assert.deepEqual(FAKE, { names: ['Zeb Quillon', 'mossy'], not: ['Uncle Zeb Quillon'] });
  });

  it('a whole word, case as written; a game phrase holding a name is not the player', () => {
    assert.deepEqual(playerNamesIn('#12 (Zeb Quillon, Safari): the map', FAKE), ['Zeb Quillon']);
    assert.deepEqual(playerNamesIn("Chat: mossy said \"stuck\"", FAKE), ['mossy']);
    assert.deepEqual(playerNamesIn('the mossyness of a rock, Mossy Gate', FAKE), [], 'whole words in the case written');
    assert.deepEqual(playerNamesIn('Uncle Zeb Quillon sells hoes', FAKE), []);
    assert.deepEqual(playerNamesIn('anything', null), []);
  });

  it('a change keeps its subject without the name and drops the body lines naming one', () => {
    const c = scrubChange({ hash: 'x', text: 'Zeb Quillon can see the map at Uncle Zeb Quillon', details: ['#12 (Zeb Quillon): "the map is gone"', 'The map draws again', 'mossy in chat'] }, FAKE);
    assert.equal(c.text, 'a player can see the map at Uncle Zeb Quillon');
    assert.deepEqual(c.details, ['The map draws again']);
    assert.equal(scrubChange(c, null), c, 'no list: untouched');
  });

  it('the generator scrubs every change it writes', () => {
    const list = parsePlayerNames('Juju Hideout\n');
    const { changes } = historyLog({ playerNames: list });
    assert.ok(changes.length > 100);
    for (const c of changes) {
      assert.deepEqual(playerNamesIn(c.text, list), [], c.hash);
      for (const l of c.details) assert.deepEqual(playerNamesIn(l, list), [], c.hash);
    }
    assert.ok(changes.some((c) => /a player/.test(c.text)), 'a subject naming one says a player');
  });

  it('the list lives outside the repo and is never written into it', () => {
    assert.ok(!PLAYER_NAMES_PATH.startsWith(ROOT + '/') || process.env.GRODDLE_PLAYER_NAMES, PLAYER_NAMES_PATH);
    assert.match(read('tools/build-restoration.mjs'), /changes\.push\(scrubChange\(\{ hash, date, kind: kinds\[m\[1\]\], text: m\[2\]\.trim\(\), details \}, names\)\);/);
  });
});

describe('the public files name no player (the private list)', { skip: LIST ? false : `no private list at ${PLAYER_NAMES_PATH}` }, () => {
  it('history.json', () => {
    const history = JSON.parse(read('public/restoration/history.json'));
    const left = [];
    for (const c of history.changes) {
      for (const n of playerNamesIn(c.text, LIST)) left.push(`${c.hash} subject: ${n.length} letters`);
      for (const l of c.details) for (const n of playerNamesIn(l, LIST)) left.push(`${c.hash} body: ${n.length} letters`);
    }
    // The failure names the commit, never the player (this output can land in a public log).
    assert.deepEqual(left, []);
  });

  it('tests/decor-display-box.test.js', () => {
    assert.equal(playerNamesIn(read('tests/decor-display-box.test.js'), LIST).length, 0);
  });
});
