/**
 * #524: with a bag open, the pack row marks which bag it is. Glitch drew the open bag's slot in its
 * tray's colour, joined to the tray above it (PackSlot.as drawFullBox 119-141: the fill is
 * pack_container.backgroundColor, the border glow its borderColor; markSlotOpenForTsid in
 * PackDisplayManager.as openContainer). Classic does that; Modern, whose tray floats, rings the slot in
 * gold with the route signpost's glow and points a caret up at the tray.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const style = readFileSync(join(root, 'public/style.css'), 'utf8');
const classic = readFileSync(join(root, 'public/css/classic.css'), 'utf8');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');

/** The body of the rule whose selector is exactly `selector` (one line or a block). */
function rule(css, selector) {
  const at = css.indexOf(`\n${selector} {`);
  assert.ok(at >= 0, `rule ${selector}`);
  const open = css.indexOf('{', at + selector.length);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('the open bag is marked in the pack row (#524)', () => {
  it('a bag slot carries is-open while its tray is open', () => {
    assert.match(game, /slot\.classList\.toggle\('is-open', Boolean\(s\.bag\.open\)\)/);
  });

  it('Modern: a gold ring and glow, and a caret up to the tray', () => {
    const body = rule(style, '.pack-slots .pack-slot.pack-bag.is-open');
    assert.match(body, /box-shadow:\s*inset 0 0 0 2px var\(--status-warn\)/);
    assert.match(body, /var\(--c-yellow-93\)/, 'the signpost glow colour (MapHub.as 72)');
    assert.doesNotMatch(body, /--surface-moss/, 'not the faint selected-slot tint it had');
    const caret = rule(style, '.pack-slots .pack-slot.pack-bag.is-open::before');
    assert.match(caret, /content:\s*''/);
    assert.match(caret, /top:\s*-\d+px/, 'above the slot, toward the tray');
    assert.match(caret, /border-bottom:\s*\d+px solid var\(--status-warn\)/);
  });

  it('Classic: the slot takes the open tray\'s colour and border, no Modern caret', () => {
    const body = rule(classic, ':root[data-ui="classic"] #game-root .pack-slots .pack-slot.pack-bag.is-open');
    const tray = rule(classic, ':root[data-ui="classic"] #game-root .pack-bag-row');
    const trayBg = tray.match(/background:\s*([^;]+);/)[1].trim();
    assert.equal(trayBg, 'var(--c-classic-bag-panel)');
    assert.match(body, new RegExp(`background:\\s*${trayBg.replace(/[()]/g, '\\$&')}`));
    assert.match(body, /box-shadow:\s*0 0 0 1px var\(--c-classic-bag-border\)/);
    assert.match(body, /border-radius:\s*0 0 5px 5px/, 'square on top, joined to the tray');
    assert.match(rule(classic, ':root[data-ui="classic"] #game-root .pack-slots .pack-slot.pack-bag.is-open::before'), /content:\s*none/);
  });
});
