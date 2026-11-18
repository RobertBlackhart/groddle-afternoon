import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WINTER_HAVEN_STREET_ID,
  WINTER_MOTE_REWARDS,
  WINTER_WALK_DURATION_MS,
  WINTER_WALK_ICE_REWARD,
  WINTER_WALK_QUEST_ID,
  WINTER_WALK_STREET_ID,
  collectWinterMote,
  createWinterWalkState,
  enterWinterHaven,
  expireWinterWalk,
  finishWinterWalk,
  returnToWinterWalk,
  winterWalkObjective,
  winterWalkProgress,
  winterWalkRemainingMs,
} from '../public/js/winter-walk.js?v=6e67699f';

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, '..', 'public');

test('Winter Walk uses the source timer, quest id, and first-run ice reward', () => {
  assert.equal(WINTER_WALK_QUEST_ID, 'winter_walk');
  assert.equal(WINTER_WALK_DURATION_MS, 300000);
  assert.equal(WINTER_WALK_ICE_REWARD, 23);
  // The quest's own templates (winter_walk.js:24-33), rebuilt from players' pictures (js/winter-walk-streets.js).
  assert.equal(WINTER_WALK_STREET_ID, 'GIFH2AKJ5I735SV');
  assert.equal(WINTER_HAVEN_STREET_ID, 'GIFNNTRK1073PQ6');
});

test('motes are stage-bound, unique, and pay the benefits behind the recorded iMG moments', () => {
  const state = createWinterWalkState({ now: 1000 });
  assert.equal(collectWinterMote(state, 'haven', 0, 1100).reason, 'wrong_stage');
  // #220: Lily's +120 and +3000 carried her x1.2 mood bonus; the benefit is 100 and 2500.
  assert.equal(collectWinterMote(state, 'surface', 0, 1100).amount, 100);
  assert.equal(collectWinterMote(state, 'surface', 0, 1200).reason, 'already_collected');
  assert.equal(collectWinterMote(state, 'surface', 2, 1300).amount, 2500);
  assert.deepEqual(winterWalkProgress(state), {
    collected: 2,
    total: Object.values(WINTER_MOTE_REWARDS).reduce(
      (sum, rewards) => sum + rewards.length,
      0
    ),
  });
  assert.equal(state.imgEarned, 2600);
});

test('route returns from the haven to the snowy finale and rewards only the first run', () => {
  const first = createWinterWalkState({ now: 0 });
  assert.match(winterWalkObjective(first), /snowy path/);
  assert.equal(enterWinterHaven(first, 1000).ok, true);
  assert.match(winterWalkObjective(first), /Climb/);
  assert.equal(finishWinterWalk(first, 1500).reason, 'wrong_stage');
  assert.equal(returnToWinterWalk(first, 2000).ok, true);
  assert.match(winterWalkObjective(first), /last winter motes/);
  // #220: the white +1098 was a level-60 Qurazy (915 x1.2); +600 and +720 were 500 and 600 x1.2.
  assert.equal(collectWinterMote(first, 'return', 0, 2100).kind, 'qurazy');
  assert.equal(collectWinterMote(first, 'return', 1, 2200).amount, 500);
  assert.equal(collectWinterMote(first, 'return', 2, 2300).amount, 600);
  const done = finishWinterWalk(first, 2400);
  assert.equal(done.ok, true);
  assert.equal(done.iceReward, 23);

  const repeat = createWinterWalkState({ now: 0, repeat: true });
  enterWinterHaven(repeat, 1000);
  returnToWinterWalk(repeat, 1500);
  assert.equal(finishWinterWalk(repeat, 2000).iceReward, 0);
});

test('five-minute expiry is exact and blocks late route progress', () => {
  const state = createWinterWalkState({ now: 5000 });
  assert.equal(winterWalkRemainingMs(state, 304999), 1);
  assert.equal(expireWinterWalk(state, 304999).reason, 'time_remaining');
  assert.equal(collectWinterMote(state, 'surface', 0, 305000).reason, 'expired');
  assert.equal(state.status, 'expired');
});

test('client ships clean recovered exit art, three-phase routing and autoplay QA, and no falling snow', () => {
  const game = fs.readFileSync(path.join(publicDir, 'game.js'), 'utf8');
  const html = fs.readFileSync(path.join(publicDir, 'play/index.html'), 'utf8');
  const css = fs.readFileSync(path.join(publicDir, 'style.css'), 'utf8');
  assert.equal(fs.existsSync(path.join(publicDir, 'assets', 'sprites', 'icons', 'ice.webp')), true);
  assert.equal(
    fs.existsSync(path.join(publicDir, 'assets', 'decos', 'groddle', 'sign_exit_starter_01a.webp')),
    true
  );
  assert.equal(
    fs.existsSync(path.join(publicDir, 'assets', 'decos', 'groddle', 'ladder_interior_4steps.webp')),
    true
  );
  assert.doesNotMatch(game, /spawnWinterSnow|winterSnow/); // G978: no falling snow; the blizzard bank at the portal stays
  assert.match(game, /spawnWinterPortal/);
  assert.match(game, /enterWinterHavenStage/);
  assert.match(game, /reenterWinterWalkStage/);
  assert.match(game, /surface>haven>return/);
  assert.match(game, /recovered-exit-ladder/);
  assert.match(game, /blizzard-bank/);
  assert.match(game, /winterautoplay/);
  assert.match(game, /winterpreview/);
  assert.match(html, /id="winter-walk-hud"/);
  assert.match(css, /\.winter-walk-hud/);
});

test('G962: the passage is portal_wintry and the way home has no light (recording 2Xko9Hy-cLE)', () => {
  const game = fs.readFileSync(path.join(publicDir, 'game.js'), 'utf8');
  const start = game.indexOf('function spawnWinterPortal(');
  const body = game.slice(start, game.indexOf('\nfunction ', start + 10));
  // The code-drawn stand-ins are gone: no ellipse glows, no white beam, no snow_skirt overhang.
  assert.doesNotMatch(body, /\.ellipse\(|\.rect\(-18, -206|white-home-light|ice-passage|snow_skirt_01b_al1/);
  assert.match(game, /const WINTER_PASSAGE_DECO = 'portal_wintry'/);
  assert.match(body, /sceneAnim\(PIXI, WINTER_PASSAGE_DECO/);
  assert.match(body, /art = 'blizzard-bank'/);
  for (const f of ['groddle/portal_wintry.webp', 'animated/portal_wintry.json', 'animated/portal_wintry.webp']) {
    assert.ok(fs.existsSync(path.join(publicDir, 'assets', 'decos', f)), f);
  }
  // About 0.7 x 1.1 of a 125-unit player in the recording: 96 x 125 from the 200 x 260 file.
  const scale = Number(game.match(/const WINTER_PASSAGE_SCALE = ([\d.]+)/)[1]);
  assert.ok(Math.abs(260 * scale - 125) < 10 && Math.abs(200 * scale - 90) < 12);
  // The homeward fade resets when the walk's atmosphere clears.
  assert.match(game, /function clearWinterAtmosphere\(\) \{\n  if \(winterWalkFaded && player\) player\.alpha = 1;/);
});
