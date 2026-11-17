/**
 * #311 (The Catface): picking up a Musicblock shows three lines over it (the activity line, the
 * "acquired" line and "Tunes n/5"); the top two faded after 55 frames (about 0.25 s at full
 * strength, gone in under a second) while the first lasted 110. Glitch's pickup had none of these
 * (musicblock_*.js only sendActivity and the tune), so they match the remake's own first line.
 * Run: node --test tests/musicblock-lines.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');

describe('#311 a verb result\'s lines last alike', () => {
  it('the first line lives 110 frames', () => {
    assert.match(game, /toastLine, 0xfff4d6, \{ life: 110 \}\);/);
  });
  it("the result's later lines live as long", () => {
    assert.match(game, /resultFloatY\(target, spoke \|\| Boolean\(reactionText\)\) - i \* 16, m, 0xfff4d6, \{ life: 110 \}\);/);
  });
  it('G938: the street block\'s own "Tunes n/m" line went with the street drop', () => {
    // The start street's block is an ordinary ground stack; its pick up says what any stack's does.
    assert.equal(game.indexOf('`Tunes ${picked.collection.owned}/${picked.collection.total}`'), -1);
  });
});
