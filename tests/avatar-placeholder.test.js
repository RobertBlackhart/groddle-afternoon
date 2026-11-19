/**
 * R33 (#537): a look still being painted is never drawn as the default outfit.
 * Other players (and you, with nothing of yours to show yet): the placeholder Glitch, the default
 * look's sheets washed pale and see-through like Glitch's placeholder skin (washPlaceholderPixels).
 * Your own Glitch: the first loading card waits for your look (capped), and a new look keeps the
 * one you wear until it is painted (js/avatar-placeholder.js ownPackFor, whenOwnLookReady).
 * Run: node --test tests/avatar-placeholder.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { OWN_LOOK_WAIT_MS, PLACEHOLDER_SHEETS, PLACEHOLDER_WASH, isPlaceholderPack, ownPackFor, washPlaceholderPixels, whenOwnLookReady } from '../public/js/avatar-placeholder.js?v=ae5c39e4';

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

describe('the placeholder Glitch', () => {
  it('keeps no colour: two outfits of one brightness wash to the same grey', () => {
    const red = washPlaceholderPixels(new Uint8ClampedArray([200, 40, 40, 255]));
    const teal = washPlaceholderPixels(new Uint8ClampedArray([40, 120, 75, 255]));
    assert.equal(red[0], red[1]);
    assert.equal(red[1], red[2]);
    assert.ok(Math.abs(red[0] - teal[0]) <= 2, `${red[0]} vs ${teal[0]}`);
  });

  it('is pale (white down to the floor) and see-through, with a little shading kept', () => {
    const px = washPlaceholderPixels(new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255, 30, 30, 30, 100]));
    assert.equal(px[0], PLACEHOLDER_WASH.floor, 'black outline: the floor');
    assert.equal(px[4], 255, 'white stays white');
    assert.ok(px[8] > px[0] && px[8] < px[4]);
    assert.equal(px[3], Math.round(255 * PLACEHOLDER_WASH.alpha));
    assert.equal(px[11], Math.round(100 * PLACEHOLDER_WASH.alpha));
    assert.ok(PLACEHOLDER_WASH.floor >= 180, 'never dark like a coat or hair');
    assert.ok(PLACEHOLDER_WASH.alpha > 0.3 && PLACEHOLDER_WASH.alpha < 0.8, 'see-through, still seen');
  });

  it('leaves empty pixels empty', () => {
    assert.deepEqual([...washPlaceholderPixels(new Uint8ClampedArray([12, 34, 56, 0]))], [12, 34, 56, 0]);
  });

  it('has the stand and walk, the jump and the climb', () => {
    assert.deepEqual([...PLACEHOLDER_SHEETS], ['base', 'jump', 'climb']);
    assert.equal(isPlaceholderPack({ placeholderLook: true }), true);
    assert.equal(isPlaceholderPack({ pending: true }), false);
    assert.equal(isPlaceholderPack(null), false);
  });
});

describe('game wiring', () => {
  const game = read('public/game.js');

  it('a look still being painted comes back as the placeholder, never the default outfit', () => {
    const pack = fnBody(game, 'vectorAnimPack');
    assert.doesNotMatch(pack, /vectorDefaultPack\(`\$\{key\}#pending`\)/);
    // The default sheets go out only for the default look itself.
    assert.deepEqual(pack.match(/vectorDefaultPack\([^)]*\)/g), ['vectorDefaultPack(key)']);
    assert.match(pack, /if \(lk === defaultVectorLookKey\(\)\) return vectorDefaultPack\(key\);/);
    assert.match(pack, /if \(!avatarCatalog\) return vectorPlaceholderPack\(`\$\{key\}#pending`\);/);
    assert.match(pack, /bake\.askedAt = performance\.now\(\);\s*return vectorPlaceholderPack\(`\$\{key\}#pending`\);\s*$/);
    const ph = fnBody(game, 'vectorPlaceholderPack');
    assert.match(ph, /pack\.pending = true;/);
    assert.match(ph, /animPackFromSheets\(key, \{ \.\.\.sheets \}, VECTOR_AVATAR\)/);
  });

  it('the placeholder is washed once from the default look\'s sheets, at 1x', () => {
    const body = fnBody(game, 'placeholderSheets');
    assert.match(body, /if \(vectorPlaceholderSheets !== undefined\) return vectorPlaceholderSheets;/);
    assert.match(body, /for \(const name of PLACEHOLDER_SHEETS\)/);
    assert.match(body, /canvas\.width = def\.cols \* def\.fw;\s*canvas\.height = def\.rows \* def\.fh;/);
    assert.match(body, /washPlaceholderPixels\(px\.data\);/);
    assert.match(body, /new PIXI\.CanvasSource\(\{ resource: canvas, resolution: 1, scaleMode: 'linear' \}\)/);
  });

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
