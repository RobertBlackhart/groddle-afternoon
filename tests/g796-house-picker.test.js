/**
 * G796 (Austin 2026-11-22: build all ten, free, move saves onto the originals): the house on the
 * home street is Glitch's furniture_chassis, one of ten houses with a choice per part, from the
 * CC0 SWFs (tools/house-art/build.mjs), customized with the house's Customize verb
 * (furniture_chassis.js verbs.customize; the client's ChassisManager / ConfiggerUI), free.
 * This file: the Customize window, free (ui/house-picker.js, the door's customize verb, Classic).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultHouseConfig } from '../public/js/home-house.js?v=3c88c47c';
import { createHomeState, setHomeHouse } from '../public/js/homes.js?v=10f6604f';
import { homesFeature } from '../public/js/features/homes-feature.js?v=2b773d47';
import { HOUSE_PICKER_TEXT } from '../public/js/ui/house-picker.js?v=9d018a82';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

describe('the Customize window', () => {
  it('every house and part is free: changing it takes nothing (Glitch sold six for credits)', () => {
    const state = createHomeState({ owned: true, style: 'meadow' });
    const r = setHomeHouse(state, { chassis: 'whimsy', config: { top: 4 }, facingRight: true });
    assert.equal(r.ok, true);
    assert.deepEqual(state.house, { chassis: 'whimsy', config: { ...defaultHouseConfig('whimsy'), top: 4 }, facingRight: true });
    assert.match(HOUSE_PICKER_TEXT.note, /free/);
    assert.doesNotMatch(read('public/js/ui/house-picker.js'), /imagination|currants|credits:/);
    const inv = JSON.parse(read('tools/inventions/inventions.json')).entries;
    assert.ok(inv.some((e) => e.id === 'house-styles-free'));
  });

  it('the house door offers customize on your own home street only', () => {
    const verbs = [{ id: 'enter_house', label: 'enter house', sort: 10 }];
    const away = { homeContext: () => ({ inHome: false }) };
    assert.equal(homesFeature.decorateVerbs({ classId: 'home_door', state: { room: 'street' } }, verbs, away), null);
    assert.equal(homesFeature.decorateVerbs({ classId: 'npc_mailbox', state: {} }, verbs, away), null);
    assert.equal(homesFeature.runVerbOverride({ classId: 'home_door' }, 'enter_house', away), null);
  });

  it('has a Classic look under the Classic root, with no original-game name in it', () => {
    const css = read('public/css/classic.css');
    assert.match(css, /:root\[data-ui="classic"\] \.house-picker \.hp-card \{/);
    assert.match(css, /:root\[data-ui="classic"\] \.house-picker \.hp-rows \{/);
    assert.doesNotMatch(css, /Glitch/);
  });
});
