/**
 * G1166 (#621, #622: an iPad-class Apple GPU whose report said "restores 2"): what a lost and
 * restored WebGL context must draw again, and what a report says about it. A restored context
 * gives every render texture back empty. Reproduced in Chrome with WEBGL_lose_context (two
 * restores): the edge mirrors and the ground skirt stayed empty (tests/edge-mirror.test.js,
 * tests/textures.test.js), and so did every cacheAsTexture picture: a signpost's number keys.
 * Run: node --test tests/g1166-context-restore.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { redrawCachedTextures } from '../public/js/pixi-fixes.js?v=4dcac864';

const PUBLIC = join(import.meta.dirname, '..', 'public');
const read = (p) => readFileSync(join(PUBLIC, p), 'utf8');

/** A container; `cached` gives it a render group drawn through cacheAsTexture (Pixi 8's shape). */
function node({ cached = false, children = [], destroyed = false } = {}) {
  const n = { children, destroyed, redrawn: 0 };
  if (cached) {
    n.renderGroup = { isCachedAsTexture: true, textureNeedsUpdate: false };
    n.updateCacheTexture = () => {
      n.redrawn += 1;
      n.renderGroup.textureNeedsUpdate = true;
    };
  }
  return n;
}

describe('G1166 cached pictures draw again after a restored context', () => {
  it('marks every cached container under the stage, nested ones too, and nothing else', () => {
    const key1 = node({ cached: true });
    const key2 = node({ cached: true });
    const inner = node({ cached: true });
    const outer = node({ cached: true, children: [inner] });
    const plain = node();
    const plainGroup = node();
    plainGroup.renderGroup = { isCachedAsTexture: false };
    plainGroup.updateCacheTexture = () => assert.fail('a render group not cached as a texture is left alone');
    const gone = node({ cached: true, destroyed: true });
    const stage = node({ children: [node({ children: [key1, key2, plain] }), outer, plainGroup, gone] });
    assert.equal(redrawCachedTextures(stage), 4);
    for (const n of [key1, key2, inner, outer]) {
      assert.equal(n.redrawn, 1);
      assert.equal(n.renderGroup.textureNeedsUpdate, true);
    }
    assert.equal(gone.redrawn, 0, 'a destroyed container is skipped');
    assert.equal(redrawCachedTextures(null), 0);
  });

  it('runs from the restore handler, after the street bakes are dropped', () => {
    const game = read('game.js');
    assert.match(game, /import \{[^}]*redrawCachedTextures[^}]*\} from '\.\/js\/pixi-fixes\.js\?v=[0-9a-f]{8}';/);
    assert.match(game, /app\.canvas\.addEventListener\('webglcontextrestored', \(\) => \{[\s\S]{0,700}bgLayer\?\.dropBakes\?\.\(\)[\s\S]{0,300}redrawCachedTextures\(app\.stage\)/);
  });
});
