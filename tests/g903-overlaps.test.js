/**
 * G903 (lane fix19b QA): three overlaps. On a computer the signpost's "Enter Choose a road" hint,
 * moved down off the notices, lay on the post's arms; in Modern the Butler's bubble lay over the
 * street map's corner card; the "N roads under construction" tag still drew in Arial.
 * Run: node --test tests/g903-overlaps.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promptSideStep } from '../public/js/prompt-settle.js?v=cb790f3a';
import { clearSpeechOfBox } from '../public/js/speech-placement.js?v=0371ea0c';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const game = read('public/game.js');
const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

describe('G903: the signpost hint stays off the arms', () => {
  // Measured at 1280x800 on Empty Via 5 (Modern): the hint over the post, the notices beside it, the arms under it.
  const chip = { left: 261, right: 398, top: 170, bottom: 196 };
  const notices = { left: 390, right: 830, top: 192, bottom: 290 };
  const arms = [{ left: 335, right: 480, top: 222, bottom: 255 }, { left: 210, right: 335, top: 250, bottom: 282 }, { left: 335, right: 480, top: 280, bottom: 312 }];

  it('steps sideways off the notices, clear of the arms, staying over the post', () => {
    const dx = promptSideStep(chip, [notices, ...arms], [notices], 1280);
    assert.equal(dx, notices.left - 6 - chip.right);
    const moved = { ...chip, left: chip.left + dx, right: chip.right + dx };
    assert.ok(![notices, ...arms].some((o) => overlap(moved, o)));
    assert.ok(moved.right > 300, 'still over the post');
  });

  it('no step further than its own width, none off the screen', () => {
    const wide = { left: 0, right: 1280, top: 150, bottom: 300 };
    assert.equal(promptSideStep(chip, [wide], [wide], 1280), null);
    const edge = { left: 2, right: 139, top: 170, bottom: 196 };
    assert.equal(promptSideStep(edge, [{ left: 100, right: 700, top: 160, bottom: 200 }], [{ left: 100, right: 700, top: 160, bottom: 200 }], 1280), null);
  });

  it('game.js: a sign hint passes its arms; one moved down onto them waits', () => {
    assert.match(game, /promptKeepClear\(wantArms\)/);
    assert.match(game, /wantArms = arms;\s*want = !conn/);
    const fn = game.slice(game.indexOf('function promptKeepClear('), game.indexOf('/** The notifier\'s zones'));
    assert.match(fn, /side = hit\.length && arms \? promptSideStep\(chip, \[\.\.\.boxes, \.\.\.armBoxes\], hit/);
    assert.match(fn, /const stillHit = \[\.\.\.boxes, \.\.\.armBoxes\]\.some/);
  });
});

describe('G903: speech bubbles keep off the street map', () => {
  it('a bubble under the map card at the top right moves off it', () => {
    // The Butler on the home street at 1280x800 (view px): the bubble's body ran under the card.
    const map = { left: 1028, right: 1220, top: 56, bottom: 134 };
    const fix = clearSpeechOfBox({ left: 835, width: 336, height: 120, tip: 266, speakerX: 990, feet: 490, deepest: 380, box: map, viewWidth: 1228, viewBottom: 782 });
    assert.ok(fix && fix.how !== 'over');
  });

  it('positionSpeechBubble clears the minimap box as it does the HUD column and the notices', () => {
    assert.match(game, /hudColumnBox\(\[document\.getElementById\('street-minimap'\)\]/);
    const fn = game.slice(game.indexOf('function positionSpeechBubble('), game.indexOf('function drawSpeechBubble('));
    assert.match(fn, /const mapBox = !outOfView && minimapViewBox\(\);/);
    assert.match(fn, /box: mapBox,/);
  });
});

describe('G903: the construction tag uses the signposts\' font', () => {
  it('street-jobs draws "N roads under construction" in the world font (Nunito, R17), not Arial', () => {
    const src = read('public/js/features/street-jobs-feature.js');
    const tag = src.slice(src.indexOf('roads under construction'), src.indexOf('tag.anchor.set'));
    assert.match(tag, /fontFamily: WORLD_FONT_FAMILY/);
    assert.doesNotMatch(tag, /Arial/);
    assert.match(read('public/js/world-text.js'), /export const WORLD_FONT_FAMILY = 'Nunito, /);
    assert.match(read('public/js/street-render.js'), /export const SIGN_FONT_FAMILY = WORLD_FONT_FAMILY;/);
  });
});
