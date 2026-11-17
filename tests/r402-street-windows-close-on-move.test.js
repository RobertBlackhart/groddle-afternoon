/**
 * #402: the Hardware Vendor's store stayed open after a Ticket took the player to Beam Me Down
 * (a scene: engine.enterScene, not enterStreet, which alone closed the store). The client closed
 * every Dialog on a move (Dialog.as close_on_move 58, 285, 367-373) but the map, an item's info,
 * the familiar and a confirmation. game.js closeStreetBoundWindows runs in clearWorldEntities, so
 * every move closes the windows that belong to the street left: streets, scenes and instances.
 * Run: node --test tests/r402-street-windows-close-on-move.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const src = readFileSync(join(ROOT, 'game.js'), 'utf8');
const fn = (name) => src.match(new RegExp(`\\n(?:async )?function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`))[0];

/** closeStreetBoundWindows over stubs: `open` names the windows up; returns what it closed. */
function run(open, { mailboxAt = false } = {}) {
  const closed = [];
  const is = (k) => () => open.includes(k);
  const close = (k) => () => closed.push(k);
  new Function(
    'isVendorOpen', 'closeVendor', 'isShrineOpen', 'closeShrinePanel', 'isGardenOpen', 'closeGardenPanel',
    'isFeedPickerOpen', 'closeFeedPicker', 'isRookMuseumExhibitOpen', 'closeRookMuseumExhibit',
    'isMailboxOpen', 'mailboxAt', 'closeMailboxPanel',
    `${fn('closeStreetBoundWindows')}; closeStreetBoundWindows();`
  )(
    is('vendor'), close('vendor'), is('shrine'), close('shrine'), is('garden'), close('garden'),
    is('feed'), close('feed'), is('exhibit'), close('exhibit'),
    is('mail'), mailboxAt, close('mail'),
  );
  return closed;
}

describe('#402: windows tied to the street close on any move', () => {
  it('the vendor, shrine, garden, feed picker and exhibit close; nothing else is touched', () => {
    assert.deepEqual(run(['vendor']), ['vendor']);
    assert.deepEqual(run(['vendor', 'shrine', 'garden', 'feed', 'exhibit']), ['vendor', 'shrine', 'garden', 'feed', 'exhibit']);
    assert.deepEqual(run([]), [], 'a closed window is not closed again');
  });

  it('mail closes only when it was opened at a mailbox (the top bar opens it anywhere)', () => {
    assert.deepEqual(run(['mail'], { mailboxAt: true }), ['mail']);
    assert.deepEqual(run(['mail'], { mailboxAt: false }), []);
  });

  it('every move runs it: clearWorldEntities, which enterScene (a Ticket\'s scene) and enterStreet call', () => {
    const clear = fn('clearWorldEntities');
    assert.match(clear, /if \(!keepWindows\) closeStreetBoundWindows\(\);/);
    // G944: only a visited home rebuilt in place for its owner's change (scene.keepWindows) is no move.
    assert.match(src, /enterScene\(scene\) \{\n(?: {4}\/\/[^\n]*\n)? {4}clearWorldEntities\(\{ keepWindows: scene\.keepWindows === true \}\);/, 'a scene is a move');
    const enter = fn('enterStreet');
    assert.match(enter, /\n {2}clearWorldEntities\(\);/, 'a street is a move');
  });

  it('a home room rebuilt in place (decorating) keeps its windows', () => {
    assert.match(src, /async refreshHomeScene\(opts = \{\}\) \{[\s\S]*?inPlace: true/);
    assert.match(src, /clearWorldEntities\(\{ keepWindows: opts\.inPlace === true \}\);/);
  });
});
