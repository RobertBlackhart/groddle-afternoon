/**
 * Report #338 (G760): Wavy Gravy needs the Super Saucier achievement, as in Glitch
 * (catalog_recipes.js recipe 44, Austin kept the gate on 2026-11-15), but the encyclopedia said so
 * only on the Saucepan's tool page, as "after Super Saucier". Every recipe that asks for an
 * achievement now says it on its tool page and on its result's item page, worded as the Make
 * window words it (js/making.js: "You need to get the Super Saucier achievement.").
 * Built from recipes.json by tools/encyclopedia/build.mjs and tools/catalog/build.mjs.
 * Run: node --test tests/recipe-achievement-pages.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const recipes = Object.values(JSON.parse(readFileSync(join(pub, 'assets/content/recipes.json'), 'utf8')));
const text = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const gated = recipes.filter((r) => (r.achievements || []).length);

describe('report #338: a recipe\'s achievement on the encyclopedia\'s pages', () => {
  it('Wavy Gravy keeps Glitch\'s Super Saucier gate', () => {
    const wavy = recipes.find((r) => r.id === '44');
    assert.equal(wavy.name, 'Wavy Gravy');
    assert.deepEqual(wavy.achievements, ['super_saucier']);
  });

  it('the Saucepan page and the Wavy Gravy page both say it, linking the badge', () => {
    const tool = readFileSync(join(pub, 'encyclopedia/recipes/saucepan/index.html'), 'utf8');
    const block = tool.slice(tool.indexOf('id="r44"'), tool.indexOf('</div>\n          </div>', tool.indexOf('id="r44"')));
    assert.match(block, /href="[^"]*achievements\/super_saucier\/"[^>]*>.*needs the Super Saucier achievement/);
    const item = readFileSync(join(pub, 'encyclopedia/items/wavy_gravy/index.html'), 'utf8');
    assert.match(text(item), /with a Saucepan , needs Saucery I , needs the Super Saucier achievement ,/);
    assert.match(item, /href="[^"]*achievements\/super_saucier\/"/);
  });

  it(`every gated recipe (${gated.length}) says its achievement on its tool page and its result's page`, () => {
    assert.ok(gated.length >= 30);
    for (const r of gated) {
      const toolPage = join(pub, `encyclopedia/recipes/${r.tool}/index.html`);
      assert.ok(existsSync(toolPage), r.tool);
      const html = readFileSync(toolPage, 'utf8');
      const at = html.indexOf(`id="r${r.id}"`);
      assert.ok(at > 0, `${r.name} on ${r.tool}`);
      const block = html.slice(at, html.indexOf('class="ency-recipe"', at + 10) > 0 ? html.indexOf('class="ency-recipe"', at + 10) : undefined);
      for (const a of r.achievements) assert.match(block, new RegExp(`achievements/${a}/`), `${r.name}: ${a}`);
      assert.match(text(block), /needs the .+ achievement/, r.name);
      const out = r.outputs?.[0]?.classTsid;
      const itemPage = join(pub, `encyclopedia/items/${out}/index.html`);
      if (!existsSync(itemPage)) continue;
      assert.match(text(readFileSync(itemPage, 'utf8')), /needs the .+ achievement/, `${r.name}: ${out}`);
    }
  });

  it('no recipe page says "after" a badge any more', () => {
    for (const tool of new Set(gated.map((r) => r.tool))) {
      const html = readFileSync(join(pub, `encyclopedia/recipes/${tool}/index.html`), 'utf8');
      assert.doesNotMatch(text(html), /\bafter [A-Z][\w'-]+( [\w'-]+)* ,? ?\d+ energy/, tool);
    }
  });
});
