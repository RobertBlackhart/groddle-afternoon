/**
 * #500: in Camera Mode the view could be sent to a far signpost and its arm clicked, which travelled
 * at once without walking there. Glitch: Camera Mode took the street's click listener away, leaving
 * only the drag (LocationInputHandler.as stopListeningForControlEvts 114-126), and a click on a sign
 * the avatar was not touching walked the avatar there first and took that sign on arrival
 * (LocationInputHandler.as 390-399, _moveAvatarToSpriteAndStartInteraction 873-905). game.js now
 * does both (worldPress, armWhenThere); the street map's and the right-click arms menus' arm rows go
 * the same way. A post at hand, the number keys and Enter still go at once.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const game = readFileSync(join(import.meta.dirname, '../public/game.js'), 'utf8');
const fn = (name) => {
  const at = game.indexOf(`function ${name}(`);
  assert.ok(at > 0, name);
  return game.slice(at, game.indexOf('\n}\n', at));
};

describe('#500 a far signpost is walked to first', () => {
  it('no press on the street acts in Camera Mode, a mouse\'s included', () => {
    const at = game.indexOf('function worldPress(e) {');
    const press = game.slice(at, game.indexOf('\n  }\n', at));
    const guard = press.indexOf("if (features.query('cameraModeActive', engine) === true) return;");
    assert.ok(guard > 0, 'the guard is not phone-only');
    assert.ok(guard < press.indexOf('signpostBoardAt('), 'before any arm is looked at');
  });

  it('a click on an arm goes through armWhenThere, which takes it at once only at the post', () => {
    const at = game.indexOf('function worldPress(e) {');
    const press = game.slice(at, game.indexOf('\n  }\n', at));
    assert.match(press, /if \(signBoard\) \{\n[^\n]*\n\s+armWhenThere\(signBoard, \(\) => \{[\s\S]{0,200}travelTo\(conn\.tsid/);
    const there = fn('armWhenThere');
    assert.match(there, /if \(postIsAtHand\(signpostAtHand\(\), hit\.view\)\) \{\n\s+take\(\);/);
    assert.match(there, /startUserWalk\(\{ kind: 'sign', id: post\?\.id \?\? '', x: hit\.view\.x, y: hit\.view\.y \}\)/);
    assert.match(there, /avatarWalk\.signArm = \{ view: hit\.view, take \};/);
    assert.ok(there.indexOf('take();') < there.indexOf('startUserWalk('), 'a post at hand never walks');
  });

  it('the walk takes the arm only when it arrives at that post', () => {
    const end = fn('endUserWalk');
    assert.match(end, /if \(w\.signArm\) \{\n\s+const there = reason === 'arrived' && postIsAtHand\(signpostAtHand\(\), w\.signArm\.view\);/);
    assert.match(end, /if \(there\) w\.signArm\.take\(\);/);
    assert.match(fn('postIsAtHand'), /at\.views\.includes\(view\)/);
  });

  it('the right-click arms menu and the street map\'s arm rows walk to a far post too', () => {
    assert.match(fn('openSignpostArmsMenu'), /if \(row\) armWhenThere\(\{ view, board: row\.board \}, \(\) => takeSignBoard\(\{ view, board: row\.board \}\)\);/);
    assert.match(fn('openMinimapSignpostMenu'), /armWhenThere\(\{ view: row\.view, board: row\.board \}, \(\) => takeSignBoard/);
  });

  it('the post at hand keeps its keys: numbers and Enter take the arm at once', () => {
    assert.match(fn('signpostArmKey'), /return takeSignBoard\(hit\);/);
    assert.doesNotMatch(fn('takeSignBoard'), /armWhenThere|startUserWalk/);
  });
});
