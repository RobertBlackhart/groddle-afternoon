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
import { execFileSync } from 'node:child_process';
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

/**
 * G971 ratchet: feature and scene autoplays (a ...autoplay URL param) that still
 * publish their own final word without js/autoplay-log.js. Only shrinks: put an
 * autoplay on the log (declared steps, each logged with a state check, the word
 * from log.finish) and take its file off this list; a new autoplay file starts on
 * the log.
 */
const UNLOGGED = Object.freeze([
  'game.js',
  'js/features/animal-husbandry-feature.js',
  'js/features/artifacts-feature.js',
  'js/features/buff-triggers-feature.js',
  'js/features/bureaucratic-halls-feature.js',
  'js/features/conversations-feature.js',
  'js/features/crabs-feature.js',
  'js/features/craftybot-feature.js',
  'js/features/crowns-feature.js',
  'js/features/cubimal-battle-feature.js',
  'js/features/cubimal-race-feature.js',
  'js/features/dead-ends-feature.js',
  'js/features/drops-feature.js',
  'js/features/elemental-pouch-feature.js',
  'js/features/fire-dragon-feature.js',
  'js/features/foxes-feature.js',
  'js/features/funpickle-feature.js',
  'js/features/game-teleporter-feature.js',
  'js/features/giant-icons-feature.js',
  'js/features/heli-kitties-feature.js',
  'js/features/hell-bar-feature.js',
  'js/features/hell-feature.js',
  'js/features/hell-tickets-feature.js',
  'js/features/help-mine-feature.js',
  'js/features/hi-signs-feature.js',
  'js/features/home-tower-feature.js',
  'js/features/interrogation-room-feature.js',
  'js/features/item-verbs-feature.js',
  'js/features/item-verbs-more-feature.js',
  'js/features/juju-bandits-feature.js',
  'js/features/location-events-feature.js',
  'js/features/machine-art-feature.js',
  'js/features/machine-rooms-feature.js',
  'js/features/mail-courier-feature.js',
  'js/features/map-routes-feature.js',
  'js/features/master-garden-feature.js',
  'js/features/meditation-feature.js',
  'js/features/newxp-feature.js',
  'js/features/pack-tree-verbs-feature.js',
  'js/features/party-spaces-feature.js',
  'js/features/patches-feature.js',
  'js/features/potions-feature.js',
  'js/features/powders-feature.js',
  'js/features/purple-journey-feature.js',
  'js/features/puzzle-scenes-feature.js',
  'js/features/puzzles-feature.js',
  'js/features/quest-offers-feature.js',
  'js/features/quest-verbs-feature.js',
  'js/features/quoin-shards-feature.js',
  'js/features/races-feature.js',
  'js/features/resource-nodes-feature.js',
  'js/features/rook-attack-feature.js',
  'js/features/rube-feature.js',
  'js/features/seasons-feature.js',
  'js/features/secret-spots-feature.js',
  'js/features/shrine-hint-feature.js',
  'js/features/small-items-feature.js',
  'js/features/smuggling-feature.js',
  'js/features/sno-cones-feature.js',
  'js/features/solo-feats-feature.js',
  'js/features/spirit-loneliness-feature.js',
  'js/features/street-furniture-feature.js',
  'js/features/street-jobs-feature.js',
  'js/features/street-spirits-feature.js',
  'js/features/subway-feature.js',
  'js/features/supply-feature.js',
  'js/features/swf-feature.js',
  'js/features/teleportation-feature.js',
  'js/features/tree-death-feature.js',
  'js/features/unlearning-feature.js',
  'js/features/vendor-npcs-feature.js',
]);

describe('feature and scene autoplays: on the step log, or on the shrinking list', () => {
  const tracked = execFileSync('git', ['ls-files', 'public/js', 'public/game.js'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.js') && !f.startsWith('public/js/quest-rooms/') && f !== 'public/js/autoplay-log.js');
  const players = tracked.filter((f) => /['"][a-z0-9]+autoplay[a-z0-9]*['"]/.test(read(f))).map((f) => f.slice('public/'.length));

  it('finds them (the scan is not empty)', () => {
    assert.ok(players.length >= 50, `${players.length} autoplay files`);
  });

  it('every autoplay file outside the list plays through the log', () => {
    const off = players.filter((f) => !UNLOGGED.includes(f) && !read(`public/${f}`).includes('autoplay-log.js'));
    assert.deepEqual(off, [], 'new autoplays declare their steps with js/autoplay-log.js');
  });

  it('the list only shrinks: a listed file on the log, or gone, comes off it', () => {
    const stale = UNLOGGED.filter((f) => !players.includes(f) || read(`public/${f}`).includes('autoplay-log.js'));
    assert.deepEqual(stale, []);
  });

  it('the converted feature autoplays end on log.finish, not a bare done', () => {
    for (const f of ['butler-feature.js', 'door-drink-feature.js', 'doors-feature.js', 'homes-feature.js', 'imagination-feature.js']) {
      const src = read(`public/js/features/${f}`);
      assert.match(src, /autoplayLog\(/, f);
      assert.match(src, /\.finish\(/, f);
    }
    const butler = read('public/js/features/butler-feature.js');
    assert.doesNotMatch(butler, /return done\('(received|named|gift|joke|hint|tower|mailbox|visitors|dancing)'\);/, 'each Butler mode passes its state check to done');
    // The gift mode declares pick, confirm, gift; each step needs the dialog open (a closed dialog
    // keeps its last step's name, and the old gift autoplay clicked a hidden Yes and never reported).
    assert.match(butler, /autoplay\.log = autoplayLog\(\['pick', 'confirm', 'gift'\]\)/);
    assert.match(butler, /const log = autoplay\.log \|\| autoplayLog\(\[autoplay\.mode\]\)/);
    assert.match(butler, /dialogOpen\(\) && dialog\.dataset\.step === 'give'\)/);
    assert.match(butler, /dialogOpen\(\) && dialog\.dataset\.step === 'give:confirm'\)/);
    assert.match(butler, /return done\(`stuck:\$\{dialog\.dataset\.step\}`\)/);
    assert.doesNotMatch(read('public/js/features/homes-feature.js'), /engine\.setData\('homeAutoplay', 'done'\)/);
    assert.doesNotMatch(read('public/js/features/imagination-feature.js'), /engine\.setData\('imgAutoplay', 'done'\)/);
    assert.doesNotMatch(read('public/js/features/door-drink-feature.js'), /engine\.setData\?\.\('doorDrinkAutoplay', 'done'\)/);
    assert.doesNotMatch(read('public/js/features/doors-feature.js'), /engine\.setData\('doorDemo', 'entered'\)/);
  });
});
