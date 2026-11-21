/**
 * G1115 (chat 2026-11-21): since #584 (v0.54.1) M at home opens the Map, not the Home panel, so the
 * Home panel's Return to Ur was no longer one key away. The Map at home now shows a Return to Ur
 * card above the map, in both interfaces, whose button is the Home panel's own (returnFromHome).
 *
 * Run: node --test tests/map-return-to-ur-g1115.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const read = (rel) => readFileSync(join(PUBLIC, rel), 'utf8');
const part = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

describe('G1115 Return to Ur on the Map at home', () => {
  const game = read('game.js');
  const card = part(game, 'function renderHomeMapCallout(panel) {', '\n}\n');

  it('at home the home card is the way back: Return to Ur, the Home panel\'s own trip', () => {
    assert.match(card, /const atHome = homeState\.owned && homeIsInstanced\(\);/);
    assert.match(card, /box\.classList\.add\('map-home-return'\);/);
    assert.match(card, /button\.textContent = atHome \? 'Return to Ur' :/);
    assert.match(card, /closeMap\(\);\s+if \(atHome\) returnFromHome\(\);\s+else if \(homeState\.owned\) teleportHome\(\);/);
    // The same function the Home panel's Return to Ur runs, not a copy of it.
    const panel = part(game, "button.addEventListener('click', async () => {\n      const action = button.dataset.homeAction;", '});');
    assert.match(panel, /else if \(action === 'return'\) await returnFromHome\(\);/);
    assert.equal((game.match(/endHomeVisit\(homeState\)/g) || []).length, 1, 'one trip home to Ur');
    assert.doesNotMatch(card, /—/, 'no em dash in its words');
  });

  it('the Map opens at home and draws its cards, the home card among them', () => {
    const open = part(game, 'async function openMap(', '\n}\n');
    assert.doesNotMatch(open, /if \(homeIsInstanced\(\)\) \{\s*openHomePanel\(\)/);
    assert.match(open, /renderMapCards\(panel\);\s+arrangeMapCards\(panel\);\s+panel\.hidden = false;/);
    assert.match(part(game, 'function renderMapCards(panel) {', '\n}\n'), /renderHomeMapCallout\(panel\);/);
  });

  it('on show above the map, not folded into the Shortcuts, in Modern and Classic', () => {
    assert.match(read('js/map-extras.js'), /el\.classList\.contains\('map-home-card'\)[\s\S]{0,80}!el\.matches\('\[data-map-route\], \.nx-map-card, \.map-home-return'\)/);
    // One card in both: Modern's parchment card, Classic's row (classic.css).
    assert.match(read('style.css'), /\n\.map-home-card \{/);
    assert.match(read('css/classic.css'), /#map-panel :is\(\.map-feature-card, \.map-home-card, \.map-route-card\)/);
  });
});
