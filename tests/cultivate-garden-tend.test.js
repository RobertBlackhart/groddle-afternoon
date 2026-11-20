/**
 * #558: "I have just set up my first vegetable patch and now I can't move away from it ... the arrow
 * keys only move me around the vegetable plot." In Cultivation Mode, Enter (or E) still went on to
 * the world: at a crop garden it started tending (js/garden-tend.js), whose plots then took the
 * arrows. Tending's ways off (a click off the garden, walking away, Esc) never worked there:
 * homes-feature takes every click on the world and Esc first (it deselects, then leaves the mode),
 * and the arrows walked the plots instead of the avatar. Shift+C while tending did the same.
 *
 * Glitch sent Enter in cult_mode to CultManager alone (LocationInputHandler.as enterKeyHandler
 * 200-204: CultManager.enterKeyHandler only places what you carry), so no interaction began there.
 * Run: node --test tests/cultivate-garden-tend.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');

/** The body of a top-level `function name(...) {` in game.js, up to its closing brace at column 0. */
function fnBody(name) {
  const start = game.indexOf(`\nfunction ${name}(`);
  assert.ok(start >= 0, `${name} is in game.js`);
  const end = game.indexOf('\n}\n', start);
  return game.slice(start, end);
}

/** The first statement lines of a function (up to `count` non-comment lines). */
function firstCode(name, count = 1) {
  return fnBody(name).split('\n').slice(2).map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).slice(0, count).join('\n');
}

describe('#558: Cultivation Mode never hands the arrows to a garden', () => {
  it('Enter and E reach no world interaction while a home edit mode is on', () => {
    assert.equal(firstCode('tryOpenNearestMenu'), "if (features.query('homeEditMode', engine)) return;");
  });

  it('a garden is never tended under an edit mode (the chooser path too)', () => {
    assert.match(fnBody('startGardenTend'), /if \(features\.query\('homeEditMode', engine\)\) return false;\n\s+gardenTend = \{/);
  });

  it('tending already under way stops when an edit mode comes on (Shift+C)', () => {
    assert.match(fnBody('updateGardenTend'), /if \(features\.query\('homeEditMode', engine\) \|\| !entity\?\.sprite/);
    assert.match(game, /run\('garden tend', updateGardenTend\);/);
  });

  it('no Enter hint or signpost arm keys under an edit mode', () => {
    assert.match(game, /run\('prompt', \(\) => \{\n(?:\s*\/\/.*\n)*\s+if \(!menuTarget && !currentAction && !isScreenFxBlocking\(\) && !features\.query\('homeEditMode', engine\)\) \{/);
    assert.equal(firstCode('signpostArmKey'), "if (features.query('homeEditMode', engine)) return false;");
  });
});

describe('#558: nothing stays selected after a thing is bought or moved in Cultivation Mode', () => {
  const homes = readFileSync(join(root, 'public/js/features/homes-feature.js'), 'utf8');
  const start = homes.indexOf('\nfunction placeAtPointer(');
  const body = homes.slice(start, homes.indexOf('\n}\n', start));
  const cultBranch = body.slice(body.indexOf('const st = activeCult();'));

  it('the cultivation branch selects nothing and clears the selection once it is set down', () => {
    assert.ok(cultBranch.includes('nudgeCultivation(') && cultBranch.includes('cultivate(st, engine.pc'), 'found the branch');
    assert.doesNotMatch(cultBranch, /selected = \{ kind: 'cultivation'/);
    // After the refusal's early return, so a refused spot keeps what you carry and your selection.
    assert.match(cultBranch, /return result;\n\s+\}\n(?:\s*\/\/.*\n)*\s+selected = null;\n\s+placing = null;/);
  });
});
