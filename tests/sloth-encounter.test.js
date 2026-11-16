/**
 * G889 (#245): the Sloth drawn from Tiny Speck's npc_sloth.swf and its animations played at the
 * GSJS moments (items/npc_sloth.js setState / setStateComplete / createSnail / hideSloth).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SLOTH_SHEETS } from '../public/js/sloth-art.js?v=a2768e2f';
import { SLOTH_PEEK_GAP_MS, slothCellAt, slothIdleTick, slothLabelMs, slothTimeline } from '../public/js/sloth-encounter.js?v=4e56e4cf';
import { slothFeedPlan } from '../public/js/resource-nodes.js?v=739a3eba';

const anims = (steps) => steps.filter((s) => s.anim).map((s) => s.anim);

describe('Sloth encounter timeline', () => {
  it('plays cells at 15 a second: loopers wrap, the rest hold their last', () => {
    assert.equal(slothCellAt('eat', 0, true), 0);
    assert.equal(slothCellAt('eat', 1000, true), 15 % SLOTH_SHEETS.eat.count);
    assert.equal(slothCellAt('eat', 10_000, true), 150 % SLOTH_SHEETS.eat.count);
    assert.equal(slothCellAt('drop', 10_000), SLOTH_SHEETS.drop.count - 1);
    assert.equal(slothLabelMs('drop'), 1000, 'drop is the 1 s setState gives it');
  });

  it('drops when the knock gets it down, then idles (setState idle from hidden)', () => {
    const steps = slothTimeline('arrive');
    assert.deepEqual(anims(steps), ['drop']);
    assert.deepEqual(steps.find((s) => s.idle), { at: 1000, idle: true });
  });

  it('idles on hangIdle1 or hangIdle2 every 3-6 s (onIdleTick)', () => {
    assert.deepEqual(slothIdleTick(() => 0), { anim: 'hangIdle1', nextMs: 3000 });
    assert.deepEqual(slothIdleTick(() => 0.99), { anim: 'hangIdle2', nextMs: 6000 });
  });

  it('chews, spits each round and chews again, then finishes eating (createSnail, metalizeComplete)', () => {
    const plan = { max: 8, rounds: [{ atMs: 3000, snails: 3, count: 3, rod: 3 }, { atMs: 5500, snails: 4, count: 7, rod: 7 }, { atMs: 8500, snails: 1, count: 8, rod: 7 }], doneMs: 10000 };
    const steps = slothTimeline('feed', { plan });
    assert.deepEqual(steps.filter((s) => s.anim).map((s) => [s.at, s.anim]), [
      [0, 'eat'], [3000, 'spit'], [4500, 'eat'], [5500, 'spit'], [7000, 'eat'], [8500, 'spit'], [10000, 'finishedEating'],
    ]);
    assert.equal(steps.at(-1).idle, true);
    // After the 8th rod it climbs away at once (metalize_count > 7 -> hideSloth).
    const full = slothTimeline('feed', { plan, full: true });
    assert.deepEqual(full.slice(-2), [{ at: 10000, anim: 'climbUp' }, { at: 15000, hidden: true }]);
  });

  it('climbs up after 20 s without a rod, and peeks when walked under', () => {
    assert.deepEqual(slothTimeline('hide'), [{ at: 0, anim: 'climbUp' }, { at: 5000, hidden: true }]);
    assert.deepEqual(anims(slothTimeline('peek')), ['peek', 'peekIdle', 'peekWithdraw']);
    assert.equal(slothTimeline('peek').at(-1).hidden, true);
    assert.deepEqual(anims(slothTimeline('peekSpit')), ['peek', 'peekSpit', 'peekIdle', 'peekWithdraw']);
    assert.equal(SLOTH_PEEK_GAP_MS, 20000);
  });

  it('spits every round a real feed plans', () => {
    const plan = slothFeedPlan(() => 0.5);
    const spits = slothTimeline('feed', { plan }).filter((s) => s.anim === 'spit');
    assert.deepEqual(spits.map((s) => s.at), plan.rounds.map((r) => r.atMs));
  });
});
