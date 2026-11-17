// G892: the Rook badge's stun meter is Tiny Speck's rook_star_bg / rook_star_stars (TSEngineAssets, CC0),
// stepped the way RookIncidentHeaderView.as updateStun / moveStars / onStarTick stepped it.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOK_STARS, stepStunStars, stunStarFrame, stunStarsState } from '../public/js/rook-stun-stars.js?v=62d5c3cb';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const client = join(root, '..', 'glitch-client');
const pngSize = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];

describe('rook stun stars', () => {
  it('ships the client PNGs unchanged: an 85 x 50 arc and eleven 50 px frames', () => {
    for (const name of ['rook_star_bg.png', 'rook_star_stars.png']) {
      const ours = readFileSync(join(root, 'public/assets/ui', name));
      const src = join(client, 'TSEngineAssets/src/assets/graphics', name);
      if (existsSync(src)) assert.ok(ours.equals(readFileSync(src)), `${name} is the client's own bytes`);
    }
    assert.deepEqual(pngSize(readFileSync(join(root, 'public/assets/ui/rook_star_bg.png'))), [ROOK_STARS.w, ROOK_STARS.h]);
    assert.deepEqual(pngSize(readFileSync(join(root, 'public/assets/ui/rook_star_stars.png'))), [ROOK_STARS.w, ROOK_STARS.h * ROOK_STARS.frames]);
  });

  it('the frame is floor(11 x share), at least the first star once any stun lands (updateStun 504-511)', () => {
    assert.equal(stunStarFrame(0), -1);
    assert.equal(stunStarFrame(0.01), 0);
    assert.equal(stunStarFrame(2 / 11), 1);
    assert.equal(stunStarFrame(0.5), 4);
    assert.equal(stunStarFrame(1), 10);
    assert.equal(stunStarFrame(3), 10);
  });

  it('a change flashes five times, empties, rests 0.5 s, then climbs a frame each 100 ms', () => {
    let st = stunStarsState(1);
    let out = stepStunStars(st, 5 / 11, 0);
    st = out.state;
    assert.equal(st.target, 4);
    assert.equal(out.frame, 1, 'the old count flashes');
    assert.equal(out.alpha, 1);
    assert.equal(stepStunStars(st, 5 / 11, 100).alpha, 0);
    assert.equal(stepStunStars(st, 5 / 11, 200).alpha, 1);
    assert.equal(stepStunStars(st, 5 / 11, 999).frame, 1);
    assert.equal(stepStunStars(st, 5 / 11, 1000).frame, -1, 'moveStars empties it');
    assert.equal(stepStunStars(st, 5 / 11, 1599).frame, -1);
    assert.equal(stepStunStars(st, 5 / 11, 1600).frame, 0);
    assert.equal(stepStunStars(st, 5 / 11, 1900).frame, 3);
    assert.equal(stepStunStars(st, 5 / 11, 5000).frame, 4);
    // Unchanged share: no new animation.
    assert.equal(stepStunStars(st, 5 / 11, 5000).state, st);
  });

  it('the badge draws the PNG frames, not vector stars', () => {
    const src = readFileSync(join(root, 'public/js/features/rook-attack-feature.js'), 'utf8');
    const draw = src.slice(src.indexOf('function drawHud'), src.indexOf('function drawHud') + 3000);
    assert.ok(!/drawStar\(b\.stars/.test(draw));
    assert.match(draw, /stepStunStars\(b\.starState, perc, t\)/);
    if (existsSync(join(client, 'com'))) {
      const view = readFileSync(join(client, 'com/tinyspeck/engine/view/ui/RookIncidentHeaderView.as'), 'utf8');
      assert.match(view, /new Timer\(100\); \/\/how fast to animate the stars/);
      assert.match(view, /const FLASH_COUNT:uint = 5;/);
      assert.match(view, /StageBeacon\.setTimeout\(stars_timer\.start, 500\);/);
    }
  });
});
