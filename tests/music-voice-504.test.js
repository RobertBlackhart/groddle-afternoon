/**
 * #504 (root R25): a short looped street track played twice, layered: the hand-over to its decoded
 * buffer only paused the element once, and Safari could undo that pause. js/music-voice.js keeps one
 * copy: the hand-over disconnects the element and drops its src, and a handed-over voice's element
 * is never played again (not by the autoplay retry, not by the G1000 resume path).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createMusicVoice } from '../public/js/music-voice.js?v=75c8cf57';

const root = join(import.meta.dirname, '..');

function rig({ refuse = false } = {}) {
  const log = [];
  const listeners = {};
  const el = {
    paused: true,
    ended: false,
    currentTime: 4.5,
    src: 'subway.mp3',
    play() {
      log.push('el.play');
      if (refuse) return Promise.reject(new Error('NotAllowedError'));
      this.paused = false;
      return Promise.resolve();
    },
    pause() { log.push('el.pause'); this.paused = true; },
    removeAttribute(k) { if (k === 'src') { this.src = ''; log.push('el.src-dropped'); } },
    load() { log.push('el.load'); },
  };
  const node = { disconnect() { log.push('node.disconnect'); } };
  const gain = { disconnect() { log.push('gain.disconnect'); } };
  const ctx = {
    currentTime: 100,
    createBufferSource() {
      const src = { started: null, connect: () => log.push('buffer.connect'), start(at, offset) { this.started = { at, offset }; log.push('buffer.start'); }, stop() { log.push('buffer.stop'); } };
      return src;
    },
  };
  const win = { addEventListener(type, fn) { (listeners[type] ||= []).push(fn); } };
  const voice = createMusicVoice({ url: 'subway.mp3', el, node, gain, ctx, win });
  return { voice, el, ctx, log, listeners };
}

describe('#504 a street music voice plays exactly one copy', () => {
  it('a short loop hands over to its buffer at the element\'s point, and the element goes for good', () => {
    const { voice, el, log } = rig();
    voice.play();
    assert.equal(el.paused, false);
    assert.equal(voice.handOver({ duration: 4 }), true);
    assert.equal(voice.looper.started.offset, 0.5, 'from the element\'s place, wrapped to the buffer');
    assert.ok(log.includes('node.disconnect'), 'the element no longer reaches the gain');
    assert.equal(el.src, '', 'its src is dropped (a pending play() is aborted)');
    assert.equal(el.paused, true);
    assert.equal(voice.handOver({ duration: 4 }), false, 'never two buffers');
  });

  it('a handed-over voice cannot be played as an element again: not by play(), not by the resume path', () => {
    const { voice, el, log } = rig();
    voice.play();
    voice.handOver({ duration: 9 });
    const plays = log.filter((l) => l === 'el.play').length;
    // Safari undoes the pause after an interruption: the element reads paused, the voice still refuses.
    el.paused = true;
    assert.equal(voice.play(), false);
    assert.equal(log.filter((l) => l === 'el.play').length, plays);
  });

  it('the autoplay retry does not play an element whose voice has handed over meanwhile', async () => {
    const { voice, log, listeners } = rig({ refuse: true });
    voice.play();
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(listeners.pointerdown.length, 1);
    voice.handOver({ duration: 9 });
    for (const fn of listeners.pointerdown) fn();
    assert.equal(log.filter((l) => l === 'el.play').length, 1, 'only the refused first play');
  });

  it('time() follows the buffer once it has taken over (Music off and on resumes there)', () => {
    const { voice, ctx } = rig();
    voice.handOver({ duration: 4 });
    voice.looper.buffer = { duration: 4 };
    ctx.currentTime = 102;
    assert.equal(voice.time(), 2.5);
    ctx.currentTime = 104;
    assert.equal(voice.time(), 0.5);
  });

  it('a stopped voice never plays and lets everything go', async () => {
    const { voice, log } = rig();
    voice.handOver({ duration: 4 });
    voice.stop(0);
    assert.equal(voice.play(), false);
    await new Promise((r) => setTimeout(r, 5));
    assert.ok(log.includes('buffer.stop') && log.includes('gain.disconnect'));
  });

  it('game.js builds its street voice with createMusicVoice and hands short loops over through it', () => {
    const game = readFileSync(join(root, 'public/game.js'), 'utf8');
    const fn = game.slice(game.indexOf('function streetMusicVoice('), game.indexOf('function startStreetTrack('));
    assert.match(fn, /createMusicVoice\(\{ url, el, node, gain, ctx: audio\.ctx, win: window \}\)/);
    assert.match(fn, /voice\.handOver\(buffer\)/);
    assert.doesNotMatch(fn, /el\.pause\(\)/, 'no lone pause at the hand-over');
  });
});
