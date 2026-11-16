/**
 * #344 (a phone held sideways, Your Home Street): speech bubbles bounced. Each frame's nudges (the
 * view's edge, the buff strip, the notices, the slide off heads, the held side) were drawn at once and
 * only the slide was eased, so nudges that disagreed frame to frame threw a bubble back and forth.
 * js/speech-placement.js settleSpeechMove draws one eased move a frame, measured from the speaker, and
 * a move back the way it came waits until the new place holds (SPEECH_REVERSE_MS).
 * Browser check (WebKit 874 x 402, &homedemo=home&speechdemo=...: the mailbox and the player talking by
 * the house): before, the mailbox's bubble reversed 3 times and the player's jumped 45 px in one frame;
 * after, no reversals and the same moves eased over 6 frames.
 * Run: node --test tests/speech-settle.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SPEECH_REVERSE_MS, SPEECH_SETTLE_EASE, settleSpeechMove } from '../public/js/speech-placement.js?v=0371ea0c';

const FRAME = 1000 / 60;
/** Runs wants (one per frame) through one bubble's record; returns the drawn places. */
function run(wants, { anchors = null } = {}) {
  const state = {};
  return wants.map((w, i) => settleSpeechMove(state, { anchorX: anchors?.[i] ?? 0, anchorY: 0, flip: false, ...w }, i * FRAME));
}

describe('a speech bubble moves once a frame, eased, and does not shake', () => {
  it('a new bubble is drawn where it is wanted', () => {
    assert.deepEqual(run([{ x: 120, y: 40 }])[0], { x: 120, y: 40 });
  });

  it('a nudge eases over frames instead of jumping', () => {
    const out = run([{ x: 100, y: 200 }, ...Array(30).fill({ x: 100, y: 155 })]);
    const steps = out.slice(1).map((p, i) => Math.abs(p.y - out[i].y));
    assert.ok(Math.max(...steps) <= 45 * SPEECH_SETTLE_EASE + 0.01, `largest step ${Math.max(...steps)}`);
    assert.equal(out.at(-1).y, 155, 'it gets there');
  });

  it('a place that flickers between two answers leaves the bubble still', () => {
    const wants = [{ x: 325, y: 140 }];
    for (let i = 0; i < 60; i++) wants.push({ x: i % 2 ? 325 : 404, y: i % 2 ? 140 : 185 });
    const out = run(wants);
    const xs = out.map((p) => p.x);
    let reversals = 0;
    for (let i = 2; i < xs.length; i++) if (Math.sign(xs[i] - xs[i - 1]) && Math.sign(xs[i - 1] - xs[i - 2]) && Math.sign(xs[i] - xs[i - 1]) !== Math.sign(xs[i - 1] - xs[i - 2])) reversals += 1;
    assert.equal(reversals, 0, `drawn x ${xs.slice(0, 12).join(',')}`);
  });

  it('a real move back is taken once the new place has held', () => {
    const wants = [{ x: 0, y: 0 }, ...Array(20).fill({ x: 60, y: 0 }), ...Array(40).fill({ x: 0, y: 0 })];
    const out = run(wants);
    assert.equal(out[20].x, 60);
    const holdFrames = Math.ceil(SPEECH_REVERSE_MS / FRAME);
    assert.equal(out[21 + holdFrames - 2].x, 60, 'still waiting');
    assert.ok(out.at(-1).x < 1, 'then it goes back');
  });

  it('a walking speaker carries its bubble with it, no lag', () => {
    const anchors = Array.from({ length: 30 }, (_, i) => 500 + i * 6);
    const out = run(anchors.map((a) => ({ x: a - 40, y: 100 })), { anchors });
    for (const [i, p] of out.entries()) assert.equal(p.x, anchors[i] - 40);
  });

  it('a change of side moves it at once (the side is already held for 400 ms)', () => {
    const state = {};
    settleSpeechMove(state, { x: 0, y: 100, flip: false }, 0);
    assert.deepEqual(settleSpeechMove(state, { x: 0, y: 260, flip: true }, FRAME), { x: 0, y: 260 });
  });
});
