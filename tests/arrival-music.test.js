/**
 * #474: after the Rooks' Woods quest sent the player home, the Woods' music kept playing on the home
 * street until the next Ur street. Every arrival names its own music: a street (enterStreet, its hub
 * or its music_file), a feature scene with a music_file (enterScene) or set aside and put back
 * (resumeScene), and your home. The home was the one arrival that named none, so whatever played last
 * (an instance's, a quest room's, a street's music_file) carried in. Glitch's home streets each had
 * their style's music_file (music_map HOME_STREET_GRODDLE_WHISTLE, HOME_STREET_FIREBOGS,
 * HOME_STREET_URALIA), looped as any street's is (location.js 481-482).
 *
 * Run: node --test tests/arrival-music.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME_STYLES, homeMusicFile } from '../public/js/homes.js?v=10f6604f';
import { resolveAmbientTheme, setAmbientMusicConfig, tracksForTheme } from '../public/js/ambient-music.js?v=75a5ad20';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const game = read('public/game.js');

/** The body of a top-level function in game.js (from its line to the next top-level function). */
function fnBody(src, head) {
  const at = src.indexOf(head);
  assert.ok(at >= 0, `${head} is in game.js`);
  const next = src.slice(at + head.length).search(/\n(async )?function /);
  return src.slice(at, next < 0 ? undefined : at + head.length + next);
}

/** An engine method's body (two-space indent in the engine object). */
function methodBody(src, head) {
  const at = src.indexOf(head);
  assert.ok(at >= 0, `${head} is in game.js`);
  const end = src.indexOf('\n  },', at);
  return src.slice(at, end);
}

describe('#474 every home names its own music', () => {
  const cfg = setAmbientMusicConfig(JSON.parse(read('public/assets/content/ambient-music.json')));

  it("each style's home street music_file resolves to a theme with recordings on disk", () => {
    assert.deepEqual(Object.keys(HOME_STYLES).map((s) => homeMusicFile(s)), ['HOME_STREET_GRODDLE_WHISTLE', 'HOME_STREET_FIREBOGS', 'HOME_STREET_URALIA']);
    assert.equal(homeMusicFile('nonsense'), 'HOME_STREET_GRODDLE_WHISTLE', 'an unknown style is the Meadow');
    for (const style of Object.keys(HOME_STYLES)) {
      const theme = resolveAmbientTheme({ hubId: 'home', hubName: 'Homes', musicFile: homeMusicFile(style) });
      assert.equal(theme, `street:${homeMusicFile(style)}`, style);
      const tracks = tracksForTheme(theme);
      assert.ok(tracks.length, `${style} has tracks`);
      for (const t of tracks) assert.ok(existsSync(join(root, 'public', t)), t);
    }
    assert.ok(cfg);
  });

  it("a home's theme is never the Rooks' Woods' (or any instance's) theme, so arriving switches it", () => {
    const rook = resolveAmbientTheme({ hubName: 'Rook Woods' });
    for (const style of Object.keys(HOME_STYLES)) assert.notEqual(resolveAmbientTheme({ hubId: 'home', musicFile: homeMusicFile(style) }), rook);
  });

  it('renderHomeScene, the one way onto the home street, into the house and onto a Tower floor, sets it', () => {
    const body = fnBody(game, 'async function renderHomeScene(');
    assert.match(body, /musicFile: homeMusicFile\(homeState\.style\),/);
    assert.match(body, /if \(state\.started && audio\.ctx\) setAmbientForStreet\(currentStreet\);/);
    // The music after currentStreet is the home: set before it, the last place's would be named.
    assert.ok(body.indexOf('setAmbientForStreet(currentStreet)') > body.indexOf('currentStreet = {'));
  });

  it('every way home reaches renderHomeScene (trips, instance and quest room exits, Teleport Home, the door, a feature, a reload)', () => {
    // streetTripTo and enterStreet: a home place is arriveInHome, never a street file.
    assert.match(fnBody(game, 'async function streetTripTo('), /if \(isHomePlaceTsid\(tsid\) && homeState\.owned\) return arriveInHome\(tsid, opts\);/);
    assert.match(fnBody(game, 'async function enterStreet('), /if \(isHomePlaceTsid\(tsid\) && homeState\.owned\) return arriveInHome\(/);
    assert.match(fnBody(game, 'async function arriveInHome('), /renderHomeScene\(/);
    assert.match(fnBody(game, 'async function teleportHome('), /renderHomeScene\(/);
    // engine.enter: every feature's way out (quest rooms, party spaces, races, puzzle scenes).
    const enter = methodBody(game, '  async enter(tsid, opts = {}) {');
    assert.match(enter, /if \(tsid === HOME_STREET_TSID \|\| tsid === HOME_INTERIOR_TSID\) \{[\s\S]*renderHomeScene\(/);
    assert.match(enter, /enterStreetWithTransition\(/);
    // The instances' own ways back go by a street trip, never by drawing a street themselves.
    for (const fn of ['async function returnFromRookWoods(']) assert.match(fnBody(game, fn), /enterStreetWithTransition\(/);
    // No feature draws a home room itself: they all ask the engine.
    for (const f of readdirSync(join(root, 'public/js/features'))) {
      if (!f.endsWith('.js')) continue;
      assert.doesNotMatch(read(`public/js/features/${f}`), /renderHomeScene\(/, f);
    }
  });

  it('the other arrivals name theirs: a street, a scene with a music_file, a scene put back', () => {
    assert.match(fnBody(game, 'async function enterStreet('), /setAmbientForStreet\(data\);/);
    const scene = methodBody(game, '  enterScene(scene) {');
    assert.match(scene, /if \(scene\.musicFile\) \{[\s\S]{0,200}setAmbientForStreet\(currentStreet\);/);
    assert.match(methodBody(game, '  resumeScene(parked, spot = null) {'), /resumeWorld\(parked, spot, \{ scene: true \}\);/);
    // G911: the world park the scenes share (and the rooms game.js holds for a party).
    assert.match(fnBody(game, 'function resumeWorld('), /setAmbientForStreet\(currentStreet\);/);
  });

  it("another player's home plays its style's music too (a scene with a music_file)", () => {
    const n = read('public/js/features/neighbours-mp-feature.js');
    assert.match(n, /musicFile: homeMusicFile\(visitorHomeState\(visit\.view\)\.style\),/);
  });
});
