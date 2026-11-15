/**
 * #365: the Make window showed how many you can make and what you carry of each ingredient, but
 * not how many of the product you already carry. The recipe view and the result now say it in the
 * ingredient lines' words ("Bun · you have 4"). The remake's own line: the Flash client said
 * "You have N" under each ingredient (MakingComponentUI.as 134-157) and never the product's count.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { productHaveRows, recipeOutputRows } from '../public/js/ui/recipe-outputs.js?v=610c067f';

const names = { bun: 'Bun', element_red: 'Red Element', element_green: 'Green Element' };
const name = (cls) => names[cls] || cls;

describe('#365 the Make window says how many of the product you carry', () => {
  it('one row per output, counted from the pack', () => {
    const pack = { bun: 4 };
    const rows = productHaveRows(recipeOutputRows({ outputs: [{ classTsid: 'bun', qty: 1 }] }), (c) => pack[c] || 0, name);
    assert.deepEqual(rows, [{ classTsid: 'bun', name: 'Bun', have: 4, text: 'Bun · you have 4' }]);
  });

  it('says 0 for a product you do not carry, and names each output of a many-output recipe once', () => {
    const rows = productHaveRows(
      [{ classTsid: 'element_red', qty: 20 }, { classTsid: 'element_green', qty: 2 }, { classTsid: 'element_red', qty: 5 }],
      (c) => (c === 'element_red' ? 37 : 0),
      name,
    );
    assert.deepEqual(rows.map((r) => r.text), ['Red Element · you have 37', 'Green Element · you have 0']);
  });

  it('the recipe view and the result screen draw the line (game.js)', () => {
    const game = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
    assert.match(game, /data-make-have=/);
    assert.match(game, /data-mr-have/);
    assert.match(game, /productHaveRows\(outRows,/);
  });
});
