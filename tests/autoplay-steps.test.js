/**
 * G971: a QA autoplay may not report success without the steps it was meant
 * to play. js/autoplay-log.js turns a success word with declared steps
 * missing into hollow:<word>; every quest-room autoplay declares its steps
 * (room.autoplaySteps) and logs each one with a state check (ctx.step).
 * Run: node --test tests/autoplay-steps.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUTOPLAY_FAILURE, autoplayLog, playRoomAutoplay, runOutcome } from '../public/js/autoplay-log.js?v=55bb4823';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('the autoplay step log', () => {
  it('passes the word only when every declared step was logged, repeats counted', () => {
    const log = autoplayLog(['drop', 'drop', 'ledge', 'exit']);
    log.step('drop');
    log.step('ledge');
    log.step('exit');
    assert.equal(log.finish('exited'), 'hollow:exited');
    assert.deepEqual(log.missing(), ['drop']);
    assert.equal(log.summary(), '3/4 missing=drop');
    log.step('drop');
    assert.equal(log.finish('exited'), 'exited');
    assert.equal(log.summary(), '4/4');
  });

  it("an 'exited' with no step played is hollow (Mental Block's old run)", () => {
    const log = autoplayLog(['drop:0', 'ledge:0', 'exit']);
    assert.equal(log.finish('exited'), 'hollow:exited');
    assert.deepEqual(log.missing(), ['drop:0', 'ledge:0', 'exit']);
  });

  it('a step whose state check fails is refused, not done', () => {
    const log = autoplayLog(['drop']);
    assert.equal(log.step('drop', false), false);
    assert.deepEqual(log.refused(), ['drop']);
    assert.equal(log.finish('exited'), 'hollow:exited');
    assert.match(log.summary(), /refused=drop/);
  });

  it('words that already report failure pass through; no declared steps is undeclared', () => {
    for (const w of ['stuck', 'stuck:drop0', 'error:x', 'none', 'no-bot', 'timeout']) {
      assert.ok(AUTOPLAY_FAILURE.test(w), w);
      assert.equal(autoplayLog(['a']).finish(w), w);
    }
    // A mode that ends on a word like 'failed' or 'wrong' is still checked against its steps.
    assert.equal(autoplayLog(['short']).finish('failed'), 'hollow:failed');
    assert.equal(autoplayLog(undefined).finish('exited'), 'undeclared:exited');
    assert.equal(autoplayLog([]).finish('done'), 'undeclared:done');
  });

  it('playRoomAutoplay wires ctx.step to the room\'s declared steps and restores it', async () => {
    const room = {
      autoplaySteps: (ctx, mode) => (mode === 'one' ? ['a'] : ['a', 'b']),
      async autoplay(ctx, mode) {
        ctx.step('a', true);
        if (mode !== 'one') ctx.step('b', false);
        return 'exited';
      },
    };
    const ctx = { step: 'before' };
    assert.equal((await playRoomAutoplay(room, ctx, 'one')).word, 'exited');
    const hollow = await playRoomAutoplay(room, ctx, 'full');
    assert.equal(hollow.word, 'hollow:exited');
    assert.deepEqual(hollow.missing, ['b']);
    assert.deepEqual(hollow.refused, ['b']);
    assert.equal(ctx.step, 'before');
    const bare = await playRoomAutoplay({ autoplay: async () => 'exited' }, {}, '');
    assert.equal(bare.word, 'undeclared:exited');
  });

  it("reads a run's end the way js/quest-instance.js leaves it", () => {
    assert.equal(runOutcome(null), 'none');
    assert.equal(runOutcome({ status: 'active' }), 'active');
    assert.equal(runOutcome({ status: 'solved' }), 'solved');
    assert.equal(runOutcome({ status: 'left', outcome: 'complete' }), 'complete');
    assert.equal(runOutcome({ status: 'left', outcome: 'abandoned' }), 'abandoned');
  });
});

describe('every quest-room autoplay declares and logs its steps', () => {
  const dir = 'public/js/quest-rooms';
  const rooms = readdirSync(join(root, dir)).filter((f) => f.endsWith('.js')).map((f) => ({ f, src: read(`${dir}/${f}`) }));
  const players = rooms.filter(({ src }) => /\n {2}async autoplay\(|\.autoplay = async/.test(src));

  it('finds the room autoplays (the scan is not empty)', () => {
    assert.ok(players.length >= 20, `${players.length} room autoplays`);
  });

  for (const { f, src } of players) {
    it(`${f}: autoplaySteps beside autoplay, each step logged with a check, no bare success word`, () => {
      assert.match(src, /\n {2}autoplaySteps\(|\.autoplaySteps = /, `${f} declares autoplaySteps`);
      assert.match(src, /ctx\.step\(/, `${f} logs steps with ctx.step`);
      // The run's last word comes from a step check, never a bare return of a success word at the end.
      const body = src.slice(src.search(/\n {2}async autoplay\(|\.autoplay = async/));
      const end = body.indexOf('\n  },') > 0 ? body.indexOf('\n  },') : body.indexOf('\n  };');
      const last = body.slice(0, end).trim().split('\n').at(-1).trim();
      assert.doesNotMatch(last, /^return '(complete|exited|done|left|free|talked)';$/, `${f}: ${last}`);
    });
  }

  it('the quest-instance runner plays rooms through the log and publishes the steps', () => {
    const qi = read('public/js/features/quest-instances-feature.js');
    assert.match(qi, /playRoomAutoplay\(room, ctx, mode\)/);
    assert.match(qi, /qiAutoplaySteps/);
    assert.match(qi, /step: \(name, ok = true\) => Boolean\(ok\)/, 'a room context always has ctx.step');
  });
});

