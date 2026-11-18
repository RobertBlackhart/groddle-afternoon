/**
 * #491 (phone, the Bean Seasoner's Make menu): the ingredient and "you have" icons were <img width="22"
 * height="22"> with no object-fit, so a Bean or a spice stretched to a square, and the "← Bean Seasoner"
 * way back wrapped and spilled out of its pill. One rule in style.css keeps every fixed-box icon's shape
 * (:where(img[width][height]) { object-fit: contain }), the Make rows share one icon helper, and the
 * pill stays on one line.
 * Run: node --test tests/icon-aspect.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '../public');
const read = (p) => readFileSync(join(PUBLIC, p), 'utf8');
const css = read('style.css');
const game = read('game.js');

function sources() {
  const out = [['game.js', game]];
  const walk = (dir) => {
    for (const e of readdirSync(join(PUBLIC, dir), { withFileTypes: true })) {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) { if (e.name !== 'vendor') walk(rel); }
      else if (e.name.endsWith('.js')) out.push([rel, read(rel)]);
    }
  };
  walk('js');
  return out;
}

describe('#491: a fixed-box icon keeps its shape', () => {
  it('style.css keeps every <img width height> contained, under any rule of its own', () => {
    assert.match(css, /^:where\(img\[width\]\[height\]\) \{ object-fit: contain; \}$/m);
    // No later rule stretches those icons back.
    assert.doesNotMatch(css, /img\[width\][^{]*\{[^}]*object-fit: fill/);
  });

  it('the Make rows draw their icons through one helper', () => {
    assert.match(game, /function makeRowIconHtml\(classTsid\) \{/);
    assert.equal((game.match(/\$\{makeRowIconHtml\((i|h)\.classTsid\)\}/g) || []).length, 2);
    assert.doesNotMatch(game, /<div class="q-req"[^`]*<img src="\$\{itemIconUrl/);
  });

  it('every icon template with a fixed width and height is one the rule covers (no inline object-fit fill or stretch)', () => {
    const fixed = [];
    for (const [file, src] of sources()) {
      for (const m of src.matchAll(/<img\b[^>]*\bwidth="\d+"[^>]*\bheight="\d+"[^>]*>/g)) {
        fixed.push(file);
        assert.doesNotMatch(m[0], /object-fit:\s*(fill|cover)/, `${file}: ${m[0]}`);
      }
    }
    assert.ok(fixed.length >= 10, `${fixed.length} fixed-box icon templates`);
  });

  it('the way back to the tools stays on one line inside its pill', () => {
    const rule = css.slice(css.indexOf('[data-ui="modern"] #make-panel .make-tools-back {'));
    assert.match(rule.slice(0, rule.indexOf('}')), /white-space: nowrap;[\s\S]*text-overflow: ellipsis;|overflow: hidden;\n\s+white-space: nowrap;\n\s+text-overflow: ellipsis;/);
    assert.match(css, /\.make-nav :is\(\.make-question, \.make-tools-back\) \{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; \}/);
  });
});
