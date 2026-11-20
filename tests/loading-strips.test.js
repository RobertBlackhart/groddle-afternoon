/**
 * #543: every street the renderer can draw has a loading-card picture, and the whole set
 * stays light (under 95 MB). Streets with no picture are listed in
 * tools/loading-strips/skipped.json with the reason; their card shows no picture.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUDGET_BYTES, STRIP_DIR, allStreets, skippedStreets, stripMap } from '../tools/loading-strips/build.mjs';

const pub = join(dirname(fileURLToPath(import.meta.url)), '../public');

describe('loading-card strips for every street (#543)', () => {
  it('every street has a strip or a reason it has none', () => {
    const map = JSON.parse(readFileSync(join(pub, 'assets/content/loading-images.json'), 'utf8'));
    const skipped = skippedStreets();
    const streets = allStreets();
    for (const t of streets) {
      if (skipped[t]) {
        assert.ok(skipped[t].why && skipped[t].why.length > 5, `${t}: skipped with a reason`);
        assert.equal(map[t], undefined, `${t}: skipped, so no card picture`);
        assert.equal(existsSync(join(pub, STRIP_DIR, `${t}.jpg`)), false, `${t}: skipped, so no file`);
      } else {
        assert.deepEqual(map[t], { local: `${STRIP_DIR}/${t}.jpg`, tsid: t }, `${t}: in the card map`);
        assert.ok(existsSync(join(pub, map[t].local)), `${t}: strip file`);
      }
    }
    assert.deepEqual(map, stripMap());
    for (const t of Object.keys(skipped)) assert.ok(streets.includes(t), `${t}: skipped.json names a street`);
    // Only the few streets with nothing to draw are left out (the 82 of G316 were all there were).
    assert.ok(Object.keys(map).length >= streets.length - 40, `${Object.keys(map).length} of ${streets.length} streets have a strip`);
  });

  it('the whole set stays under 95 MB, one JPEG per street and nothing else', () => {
    const dir = join(pub, STRIP_DIR);
    const files = readdirSync(dir);
    let total = 0;
    for (const f of files) {
      assert.match(f, /^G[A-Z0-9]+\.jpg$/, f);
      const size = statSync(join(dir, f)).size;
      assert.ok(size < 400 * 1024, `${f}: ${size} bytes`);
      total += size;
    }
    assert.equal(files.length, Object.keys(stripMap()).length);
    assert.ok(total < BUDGET_BYTES, `strips total ${(total / 1048576).toFixed(1)} MB`);
    assert.equal(BUDGET_BYTES, 95 * 1024 * 1024);
  });

  it('the render page draws with the game\'s own module copies, so the deco route reaches street-render', () => {
    // A bare './js/textures.js' is a second module copy: its 2x/3x route never reached the copy
    // street-render.js loads with, decos asked for .png files that no longer ship, and a machine
    // room drew all black.
    const html = readFileSync(join(pub, '../tools/loading-strips/render.html'), 'utf8');
    assert.doesNotMatch(html, /from '\.\/js\//);
    const game = readFileSync(join(pub, 'game.js'), 'utf8');
    const names = [...html.matchAll(/keyed\('([a-z-]+)'\)/g)].map((m) => m[1]);
    assert.deepEqual(names.sort(), ['deco-hires', 'pixi-fixes', 'street-model', 'street-render', 'textures']);
    for (const n of names) assert.match(game, new RegExp(`from '\\./js/${n}\\.js\\?v=[0-9a-f]+'`), n);
    const render = readFileSync(join(pub, 'js/street-render.js'), 'utf8');
    const ver = (src, n) => new RegExp(`from '\\./(?:js/)?${n}\\.js(\\?v=[0-9a-f]+)'`).exec(src)?.[1];
    for (const n of ['textures', 'deco-hires', 'street-model']) assert.equal(ver(game, n), ver(render, n), `${n}: game.js and street-render.js load one copy`);
  });

  it('the card still loads one picture per trip, the street\'s own', () => {
    const game = readFileSync(join(pub, 'game.js'), 'utf8');
    assert.match(game, /const loadingImg = resolveLoadingImg\(tsid\);/);
    const fx = readFileSync(join(pub, 'js/screen-fx.js'), 'utf8');
    assert.equal((fx.match(/snap\.src = /g) || []).length, 1);
  });
});
