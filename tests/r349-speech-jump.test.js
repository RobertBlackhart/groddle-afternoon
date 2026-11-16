/**
 * #349 (a phone): an activity bubble (a butterfly's answer) slid aside and back while the player
 * jumped beside its speaker. A jump carried the player's head box up into the bubble; the slide and
 * the drop under the speaker came and went faster than the reverse hold. Glitch never moved a bubble
 * off avatars (ChatBubble.as keepInBounds 98-205). js/speech-placement.js standingFeet keeps an
 * airborne avatar's head box where it stood, so a jump never moves a bubble; a standing head beside
 * the speaker is still cleared (G357, G427).
 * Run: node --test tests/r349-speech-jump.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEECH_AIR_HOLD_MS, slideOffAvatars, standingFeet } from '../public/js/speech-placement.js?v=0371ea0c';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FRAME = 1000 / 60;
// A 200 x 50 bubble over a short speaker at x 200, tail tip at y 300 (body 239-289).
const bubble = { left: 100, width: 200, height: 50, tip: 300, speakerX: 200 };
// The player beside the speaker, standing with its feet at 450, 110 px of art: head top 340, under the body.
const head = (feet) => ({ left: 225, right: 265, top: feet - 110, bottom: feet });

describe('#349 a jump never moves a bubble', () => {
  it('keeps an airborne head box where it stood, through a big jump', () => {
    const st = {};
    const slides = [];
    // Standing, then a 1.5 s jump up to 200 px high and back down.
    for (let i = 0; i < 120; i++) {
      const t = i * FRAME;
      const air = i >= 10 && i < 100;
      const rise = air ? Math.sin(((i - 10) / 90) * Math.PI) * 200 : 0;
      const feet = standingFeet(st, { y: 450 - rise, airborne: air, now: t });
      if (air) assert.equal(feet, 450);
      slides.push(slideOffAvatars({ ...bubble, avatars: [head(feet)] }).dx);
    }
    assert.deepEqual([...new Set(slides)], [0]);
    // Without the hold, the same jump slid the bubble (the bug).
    assert.notEqual(slideOffAvatars({ ...bubble, avatars: [head(450 - 150)] }).dx, 0);
  });

  it('follows an avatar that drops below where it stood, and one up a long time', () => {
    const st = {};
    standingFeet(st, { y: 450, now: 0 });
    assert.equal(standingFeet(st, { y: 520, airborne: true, now: 100 }), 520);
    assert.equal(standingFeet(st, { y: 300, airborne: true, now: SPEECH_AIR_HOLD_MS + 1 }), 300);
    // Landed higher up: it stands there now.
    assert.equal(standingFeet(st, { y: 380, airborne: false, now: SPEECH_AIR_HOLD_MS + 50 }), 380);
    assert.equal(standingFeet(st, { y: 330, airborne: true, now: SPEECH_AIR_HOLD_MS + 100 }), 380);
  });

  it('still slides a bubble off another player standing in it', () => {
    const st = {};
    const feet = standingFeet(st, { y: 330, now: 0 });
    assert.notEqual(slideOffAvatars({ ...bubble, avatars: [head(feet)] }).dx, 0);
  });

  it('game.js measures every avatar box from standing feet; remote players say when they are in the air', () => {
    const game = readFileSync(join(ROOT, 'public/game.js'), 'utf8');
    const fn = game.slice(game.indexOf('function speechAvoidBoxes('), game.indexOf('function positionSpeechBubble('));
    assert.match(fn, /player\.onGround === false && !climb\.active : t\.airborne === true/);
    assert.match(fn, /standingFeet\(st, \{ y: spr\.y, airborne, now \}\)/);
    assert.match(fn, /top: feet - art, bottom: feet/);
    const rt = readFileSync(join(ROOT, 'public/js/features/realtime-feature.js'), 'utf8');
    assert.match(rt, /const SPEECH_AIRBORNE = new Set\(\['lift', 'liftTriple', 'fall'\]\);/);
    assert.match(rt, /r\.target\.airborne = SPEECH_AIRBORNE\.has\(at\.anim\);/);
  });
});
