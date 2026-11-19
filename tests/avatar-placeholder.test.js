/**
 * R33 (#537): a look still being painted is never drawn as the default outfit.
 * Your own Glitch: the first loading card waits for your look (capped), and a new look keeps the
 * one you wear until it is painted (js/avatar-placeholder.js ownPackFor, whenOwnLookReady).
 * Run: node --test tests/avatar-placeholder.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OWN_LOOK_WAIT_MS, ownPackFor, whenOwnLookReady } from '../public/js/avatar-placeholder.js?v=ff68d2e6';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

/** The body of `function name(` in `src`, up to the next top-level function. */
function fnBody(src, name) {
  const at = src.indexOf(`function ${name}(`);
  assert.ok(at >= 0, `${name} is in the source`);
  return src.slice(at, src.indexOf('\n}\n', at));
}

/** A clock the waits move on. */
function fakeClock() {
  let t = 0;
  return { now: () => t, wait: async (ms) => { t += ms; } };
}

describe('your own look', () => {
  const painted = { key: 'mine', pending: false };
  const standIn = { key: 'mine#pending', pending: true };

  it('a painted look goes on', () => {
    assert.equal(ownPackFor(painted, null), painted);
    assert.equal(ownPackFor(painted, { key: 'old', pending: false }), painted);
    assert.equal(ownPackFor(painted, standIn), painted);
  });

  it('a look still being painted leaves the look you wear on (no default outfit between)', () => {
    const worn = { key: 'old', pending: false };
    assert.equal(ownPackFor(standIn, worn), worn);
  });

  it('with nothing of yours to show yet the stand-in goes on', () => {
    assert.equal(ownPackFor(standIn, null), standIn);
    const other = { key: 'other#pending', pending: true };
    assert.equal(ownPackFor(standIn, other), standIn);
  });

  it('the loading card waits until the look is on', async () => {
    const clock = fakeClock();
    let ready = false;
    const steps = [];
    const r = await whenOwnLookReady({ ready: () => { steps.push(clock.now()); if (clock.now() >= 400) ready = true; return ready; }, ...clock });
    assert.deepEqual(r, { ready: true, ms: 400 });
    assert.ok(steps.length > 2, 'asked again while it waited');
  });

  it('about 3 s at most, then the game shows', async () => {
    assert.ok(OWN_LOOK_WAIT_MS >= 2500 && OWN_LOOK_WAIT_MS <= 3500);
    const clock = fakeClock();
    const r = await whenOwnLookReady({ ready: () => false, ...clock });
    assert.deepEqual(r, { ready: false, ms: OWN_LOOK_WAIT_MS });
  });

  it('a look already on (the default, or a quick paint) holds nothing', async () => {
    const clock = fakeClock();
    assert.deepEqual(await whenOwnLookReady({ ready: () => true, ...clock }), { ready: true, ms: 0 });
  });
});

describe('game wiring', () => {
  const game = read('public/game.js');

  it('putting a look on keeps the worn one while the new one paints', () => {
    assert.match(fnBody(game, 'applyPlayerAppearance'), /swapPlayerPack\(ownPackFor\(getAppearanceTextures\(playerAppearance, \{ full: true \}\), player\.pack\)\)/);
    assert.match(fnBody(game, 'ownLookWorn'), /return Boolean\(player\?\.pack && !player\.pack\.pending\);/);
  });

  it('the first loading card goes only once your look is on, or the wait is over', () => {
    assert.match(game, /const ownLookIn = \(\) => whenOwnLookReady\(\{ ready: ownLookWorn \}\)/);
    // Straight into the game (autostart, a started game, a reload): the card waits for the look.
    assert.match(game, /if \(startCardWaits\) startOverlay\.classList\.add\('is-waiting'\);\s*else ownLookIn\(\)\.then\(\(\) => endBoot\(\)\);/);
    assert.doesNotMatch(game, /else endBoot\(\);/);
    // The start card: the street drawn and your look on.
    assert.match(game, /drawn: Promise\.all\(\[whenSceneDrawn\(\{[\s\S]*?\}\), ownLookIn\(\)\]\)\.then\(\(\[ok\]\) => ok\),/);
  });
});
