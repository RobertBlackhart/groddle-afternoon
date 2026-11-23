/**
 * TODAYCARD (Austin 2026-11-20, "Let's go with the Today in Ur direction"; report #568): a
 * returning player's start card shows a Today panel (the skill, the Feat, a tip) in place of the keys,
 * and one personal nudge in place of "Today's goals". A new save keeps the first-steps goal and keys.
 * Browser check (1440 x 900 and 400 x 860): a new save shows the tutorial choice and the keys; the save
 * reloaded shows the nudge, the tiles and Hold ?; Start learning opens Skills, See Feats the Feat panel.
 * Run: node --test tests/start-today.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { androidBrowser, badgeCandidates, featTile, pickNudge, pickTip, skillTile, START_TIPS, studyLeft, tipText } from '../public/js/start-today.js?v=476bbcd3';
import { runAt } from '../public/js/feats-mp.js?v=d5cb2199';
import { FEAT_BY_ID } from '../public/js/solo-feats.js?v=3bc9b43c';

const read = (rel) => readFileSync(join(import.meta.dirname, '..', rel), 'utf8');

const badge = (classTsid, current, num, extra = {}) => ({
  def: { classTsid, name: classTsid.replace(/_/g, ' '), desc: `Did ${num} things.`, isSecret: false, ...extra.def },
  unlocked: false,
  conditions: [{ type: 'counter', name: 'x', num, current }],
  ...extra.row,
});

describe('the nudge', () => {
  it('keeps started, unfinished, visible one-counter badges', () => {
    const rows = [
      badge('half_way', 5, 10),
      badge('not_started', 0, 10),
      badge('done', 10, 10),
      badge('secret', 5, 10, { def: { isSecret: true } }),
      badge('unlocked', 5, 10, { row: { unlocked: true } }),
      { ...badge('two_parts', 5, 10), conditions: [{ type: 'counter', num: 10, current: 5 }, { type: 'counter', num: 3, current: 1 }] },
      { ...badge('group', 5, 10), conditions: [{ type: 'group_count', num: 10, current: 5 }] },
      badge('one_step', 0, 1),
    ];
    assert.deepEqual(badgeCandidates(rows).map((b) => b.classTsid), ['half_way']);
  });

  it('picks the badge most of its way done, with what is left and the badge in bold', () => {
    const badges = badgeCandidates([badge('far', 4, 10), badge('near', 7, 10), badge('nearer_same', 70, 100)]);
    const n = pickNudge({ badges });
    assert.equal(n.kind, 'badge');
    assert.equal(n.id, 'near', 'ties on the share go to fewer left');
    assert.equal(n.kicker, 'An idea pops into your head');
    assert.equal(`${n.lead}${n.name}${n.after}`, '3 more for near (did 10 things, 7 so far).');
  });

  it('skips a badge under a third done, then takes the newest quest\'s next step', () => {
    const quests = [{ classTsid: 'q1', title: 'Porcine Pleaser', requirements: [{ desc: 'Pet Piggies', current: 6, total: 6 }, { desc: 'Pet more', current: 2, total: 6 }] }];
    const n = pickNudge({ badges: badgeCandidates([badge('barely', 1, 10)]), quests });
    assert.equal(n.kind, 'quest');
    assert.equal(n.kicker, 'A Giant whispers to you');
    assert.equal(`${n.lead}${n.name}${n.after}`, 'Porcine Pleaser: Pet more, 2 of 6.');
    assert.equal(pickNudge({ badges: [], quests: [] }), null, 'nothing started: the first-steps goal stays');
  });
});

describe('the tiles', () => {
  it('the skill tile: what you are learning and the time left, or a Start learning button', () => {
    const learning = skillTile({ name: 'Animal Kinship II', classTsid: 'animalkinship_2', remainingSeconds: 7440, progress: 0.25 }, 0);
    assert.deepEqual(learning, { state: 'learning', title: 'Learning Animal Kinship II', sub: '2h 04m left', progress: 0.25, classTsid: 'animalkinship_2', action: '' });
    const idle = skillTile(null, 16);
    assert.equal(idle.title, 'Not learning a skill');
    assert.equal(idle.action, 'Start learning');
    assert.match(idle.sub, /16 ready to start\.$/);
    assert.equal(skillTile(null, 0).action, '', 'none ready: no button');
    assert.equal(studyLeft(45), '45s');
    assert.equal(studyLeft(61), '2m');
    assert.equal(studyLeft(3600), '1h 00m');
  });

  it('the Feat tile: the shared Feat online, your nearest Feat solo', () => {
    const now = 1_000_000;
    const world = featTile({ mode: 'world', title: "Tottly's Toys", what: 'Play with toys.', total: 33, goal: 420, end: now + 12 * 3600_000 }, now);
    assert.deepEqual(world, { title: 'Today’s Feat: Tottly\'s Toys', sub: 'Play with toys. 33 of 420 · ends in 12 hours.', progress: 33 / 420, action: 'How to help' });
    const scheduled = featTile({ mode: 'world', title: 'Ramble', what: 'Walk.', end: now + 30 * 60_000 }, now);
    assert.equal(scheduled.sub, 'Walk. Ends in 30 minutes.', 'before the server counts: the name and the end');
    assert.equal(scheduled.progress, null);
    const solo = featTile({ mode: 'solo', title: 'Ramble', what: 'Walk.', value: 1, goal: 3 }, now);
    assert.deepEqual(solo, { title: 'Feat: Ramble', sub: 'Walk. 1 of 3.', progress: 1 / 3, action: 'See Feats' });
    assert.equal(featTile({ mode: 'solo', allDone: true }).action, 'See Feats');
    assert.equal(featTile(null), null);
  });

  it('G1150 (#618): the install, currants, favor and skill-time tips; Android only where it applies', () => {
    for (const t of [
      'On Android, pick Install app or Add to Home screen in your browser menu to play full screen.',
      'Click your currants to find the nearest vendor.',
      'Click your favor to find the nearest shrine.',
      'Each skill takes a little longer to learn than the last.',
    ]) assert.ok(START_TIPS.includes(t), t);
    assert.ok(!START_TIPS.some((t) => /Upgrade|Rook/.test(t)), 'Upgrades and Rooks are left for players to teach');
    const seen = (o) => new Set(Array.from({ length: 400 }, (_, i) => pickTip(() => i / 400, o)));
    assert.ok(![...seen({})].some((t) => /^On Android/.test(t)), 'not on a desktop');
    assert.ok(![...seen({ touch: true })].some((t) => /^On Android/.test(t)), 'not on an iPhone');
    assert.ok([...seen({ touch: true, android: true })].some((t) => /^On Android/.test(t)), 'on an Android phone');
    assert.equal(tipText('Click your currants to find the nearest vendor.', { touch: true }), 'Tap your currants to find the nearest vendor.');
    assert.equal(tipText('Click your favor to find the nearest shrine.'), 'Click your favor to find the nearest shrine.');
    assert.equal(androidBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131.0 Mobile Safari/537.36'), true);
    assert.equal(androidBrowser('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131.0 Mobile Safari/537.36', true), false, 'already installed');
    assert.equal(androidBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1'), false);
  });

  it('a tip each visit; a phone gets only the ones that name no key', () => {
    assert.equal(pickTip(() => 0), START_TIPS[0]);
    assert.equal(pickTip(() => 0.9999), START_TIPS.at(-1));
    for (let i = 0; i < 20; i += 1) assert.doesNotMatch(pickTip(() => i / 20, { touch: true }), /^(Press|Hold)\b/);
    for (const t of START_TIPS) {
      assert.doesNotMatch(t, /—|Glitch/, t);
      assert.match(t, /\.$/, t);
    }
  });
});

describe('the feature', () => {
  const feature = read('public/js/features/start-today-feature.js');
  const feats = read('public/js/features/solo-feats-feature.js');

  it('is registered, above the pinned multiplayer lines', () => {
    const index = read('public/js/features/index.js');
    const at = index.indexOf("import { startTodayFeature } from './start-today-feature.js");
    assert.ok(at > 0 && at < index.indexOf('import { chickenScareFeature }'));
  });

  it('a new save (the tutorial choice, a new character) keeps the keys; others get Today', () => {
    assert.match(feature, /const next = doc\.getElementById\('newxp-start'\) \|\| engine\.newPlayer \? 'new' : 'today';/);
    assert.match(feature, /if \(today\) today\.hidden = mode !== 'today';\s*if \(keys\) keys\.hidden = mode === 'today';\s*if \(hint\) hint\.hidden = mode !== 'today';/);
    // Features do not tick before Start, so the card keeps its own second, ended by the start.
    assert.match(feature, /timer = setInterval\(\(\) => \{\s*if \(engine\.started\) \{\s*clearInterval\(timer\);/);
  });

  it('the buttons start the game, then open Skills or the Feat panel', () => {
    assert.match(feature, /startThen\(engine, \(\) => engine\.openSkillTree\?\.\(\)\)/);
    assert.match(feature, /startThen\(engine, \(\) => document\.getElementById\('feat-btn'\)\?\.click\(\)\)/);
    assert.match(feature, /const btn = document\.getElementById\('start-btn'\);[\s\S]*?btn\.click\(\);/, 'through Start exploring, so beginGame runs');
  });

  it('online, the card names the Feat from the server\'s schedule (the session starts after Start)', () => {
    assert.match(feats, /const due = runAt\(Date\.now\(\)\);/);
    assert.match(read('public/js/features/realtime-feature.js'), /if \(!session \|\| !engine\.started\) return;\s*if \(session\.client\.state === 'idle'\) session\.start\(\);/);
    const due = runAt(Date.now());
    assert.ok(FEAT_BY_ID[due.feat], 'the schedule names a Feat the card can describe');
    assert.ok(due.end > Date.now());
  });

  it('draws with textContent, never player or badge text as HTML', () => {
    assert.doesNotMatch(feature.replace(/el\.innerHTML = '<img[^']*';/, ''), /innerHTML/);
  });

  it('the card markup and styles', () => {
    for (const page of ['public/play/index.html', 'public/play/online/index.html']) {
      const html = read(page);
      assert.match(html, /<section id="start-today" class="start-today" aria-labelledby="start-today-title" hidden>\s*<h3 id="start-today-title">Today<\/h3>\s*<div id="start-tiles" class="start-tiles"><\/div>\s*<p class="start-tip"><b>Tip:<\/b> <span id="start-tip-text"><\/span><\/p>\s*<\/section>/, page);
    }
    const css = read('public/style.css');
    assert.match(css, /\.start-tile-meter\[hidden\],\n\.start-tile-act\[hidden\],\n\.start-tile\[hidden\] \{ display: none; \}/, 'display: block must not show a hidden bar');
    assert.match(css, /:root\.touch-phone \.start-keyhint \{ display: none; \}/);
  });
});
