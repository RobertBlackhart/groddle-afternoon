/**
 * G1165: players had to work out that Multiply Your Meditation needs 10 others (11 on the street).
 * The count is right (features/quests-mp-feature.js MEDITATE_TOGETHER, the realtime server's
 * radiance.go recount: the others meditating there with you) and the quest's offer speaks of
 * eleven-ness, but its step "Meditate with 10 players" reads as 10 in all. Tiny Speck's words stay;
 * the quest log card adds our hint under them, as It Takes Two's does (G757).
 *
 * Run: node --test tests/g1165-meditate-hint.test.js
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MEDITATE_TOGETHER_HINT, MEDITATE_TOGETHER_QUEST } from '../public/js/quests-mp.js?v=e697cec3';

const ROOT = join(import.meta.dirname, '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const SERVER = process.env.GRODDLE_SERVER_DIR || join(ROOT, '..', 'groddle-afternoon-server');

describe('G1165 Multiply Your Meditation says how many', () => {
  it('Tiny Speck\'s quest words stay as they were', () => {
    const quest = JSON.parse(read('public/assets/content/quests.json'))[MEDITATE_TOGETHER_QUEST];
    assert.equal(quest.title, 'Multiply Your Meditation');
    assert.equal(quest.requirements[0].desc, 'Meditate with 10 players');
    assert.match(quest.offer, /eleven-ness/);
  });

  it('the hint says 10 others, 11 in all, in plain words', () => {
    assert.match(MEDITATE_TOGETHER_HINT, /^Hint: 10 others, 11 in all\./);
    assert.match(MEDITATE_TOGETHER_HINT, /same street at the same time/);
    assert.doesNotMatch(MEDITATE_TOGETHER_HINT, /—|–/);
  });

  it('matches the count the game uses: 10 others', () => {
    assert.match(read('public/js/features/quests-mp-feature.js'), /export const MEDITATE_TOGETHER = 10;/);
  });

  it('the server counts the others, not everyone', { skip: !existsSync(join(SERVER, 'radiance.go')) && 'no server repo beside this one' }, () => {
    assert.match(readFileSync(join(SERVER, 'radiance.go'), 'utf8'), /n := len\(on\) - 1/);
  });

  it('the quest log card shows it under the step while the quest is active', () => {
    const game = read('public/game.js');
    assert.match(game, /if \(p\.active && p\.def\.classTsid === MEDITATE_TOGETHER_QUEST\) \{\n\s+const hint = document\.createElement\('div'\);\n\s+hint\.className = 'q-req q-hint';\n\s+hint\.textContent = MEDITATE_TOGETHER_HINT;/);
  });
});
