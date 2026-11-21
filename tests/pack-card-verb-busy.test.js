/**
 * A verb picked on a pack card (Race, Name, Teleport...) is not refused with "Not right now."
 * because of a window or menu the player left open beside the pack (live chat 2026-11-20: a
 * Crab Cubimal's Race refused on an ordinary street).
 * - Opening a pack card closes the world's verb menu and the Enter chooser: Glitch had one
 *   interaction menu, and a pack item's menu replaced the world's (InteractionMenuController.as
 *   startItemstackMenu 709-710, imm.reset).
 * - While the card's verb runs, an open panel (the Map, a project's card) does not count as busy:
 *   Glitch sent the itemstack verb whatever dialog was up, and Race asked only ok_states in_pack
 *   (npc_cubimal_fox.js verbs.race 488-490).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const src = readFileSync(join(ROOT, 'game.js'), 'utf8');
const fn = (name) => {
  const m = src.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
  assert.ok(m, `game.js has ${name}`);
  return m[0];
};

describe('pack card verbs and busy()', () => {
  it('a pack card verb does not count an open panel as busy; anything else still does', () => {
    const make = new Function('features', 'engine', 'panelOnScreen', `
      let packCardVerbRunning = false;
      ${fn('runPackCardVerb')}
      ${fn('panelMakesBusy')}
      return { runPackCardVerb, panelMakesBusy };`);
    const seen = [];
    const features = { runPackVerb: (cls, verb, eng, featureId, picked) => { seen.push([cls, verb, featureId, picked]); return api.panelMakesBusy(); } };
    const api = make(features, {}, () => true);
    assert.equal(api.panelMakesBusy(), true, 'the Map open: the world is busy');
    assert.equal(api.runPackCardVerb('npc_cubimal_crab', 'cubimal_race', 'cubimal-race', {}), false, 'Race from the card is not');
    assert.deepEqual(seen, [['npc_cubimal_crab', 'cubimal_race', 'cubimal-race', {}]]);
    assert.equal(api.panelMakesBusy(), true, 'busy again after the verb');
    const throwing = make({ runPackVerb: () => { throw new Error('x'); } }, {}, () => true);
    assert.throws(() => throwing.runPackCardVerb('a', 'b', '', {}));
    assert.equal(throwing.panelMakesBusy(), true, 'a verb that throws leaves the flag down');
  });

  it('busy() asks panelMakesBusy, and both card verb paths run through runPackCardVerb', () => {
    const busy = src.match(/\n {2}busy\(\{ ignoreHome = false[\s\S]*?\n {2}\},/)[0];
    assert.match(busy, /panelMakesBusy\(\)/);
    assert.doesNotMatch(busy, /panelOnScreen\(\)/);
    assert.equal((src.match(/features\.runPackVerb\(/g) || []).length, 1, 'only runPackCardVerb calls features.runPackVerb');
    assert.equal((src.match(/closePackPopover\(\);\n\s+runPackCardVerb\(/g) || []).length, 2);
  });

  it('opening a pack card closes the world verb menu and the Enter chooser', () => {
    let closedMenu = 0;
    let chooserClosed = '';
    const close = new Function('menuTarget', 'closeVerbMenu', 'enterChooser', `${fn('closeWorldMenusForPack')}; return closeWorldMenusForPack;`)(
      { label: 'Piggy' }, () => { closedMenu += 1; }, { isOpen: () => true, close: (r) => { chooserClosed = r; } });
    close();
    assert.equal(closedMenu, 1);
    assert.equal(chooserClosed, 'pack');
    const render = fn('renderPackPopover');
    assert.match(render, /if \(pop\.hidden\) closeWorldMenusForPack\(\);\n\s+pop\.hidden = false;/);
  });
});
