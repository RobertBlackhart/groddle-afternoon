/**
 * G948: step 0 of the G942 grants audit (research/audits-2026-11-17/grants/design.md section 7), the
 * quick fixes that stop the multiplayer ledger taking earned goods back from honest players. The site
 * side (groddle-afternoon-site src/LedgerMath.php) runs through the php CLI on made-up fixture saves;
 * no player data. Gap numbers are gaps.md part A (honest losses) and B (free gains).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_DIR, skipWithoutSite } from '../tools/repos.mjs';
import { gameFiles, gameText } from '../tools/build-economy.mjs';
import { RARE_STORE } from '../public/js/quest-rooms/penalty.js?v=74819fef';
import { CAMERA_OFFER } from '../public/js/snaps.js?v=55d4c257';

const economy = () => JSON.parse(readFileSync(join(SITE_DIR, 'data/economy.json'), 'utf8'));

describe('G948 A20/A21: the economy builder reads every game folder', () => {
  it('scans js/quest-rooms, js/ui, js/classic, js/builder and js/phone too', () => {
    const files = gameFiles('public/js');
    for (const dir of ['quest-rooms', 'ui', 'classic', 'builder', 'phone', 'features']) {
      assert.ok(files.some((f) => f.startsWith(`public/js/${dir}/`)), dir);
    }
    assert.ok(files.includes('public/js/quest-rooms/penalty.js'));
    assert.match(gameText(), /[^a-z0-9_]rube_potato[^a-z0-9_]/);
  });

  it('the Rube Shaped Potato is no longer credit-gated, and the Camera is no longer capped at 5 a day', { skip: skipWithoutSite }, () => {
    const t = economy();
    // Every class the Extremely Rare Items Vendor sells (quest-rooms/penalty.js) can be bought, so none is credit-only.
    for (const o of RARE_STORE.offers) assert.notEqual(t.items[o.classTsid]?.g, 'credit', o.classTsid);
    assert.ok(RARE_STORE.offers.some((o) => o.classTsid === 'rube_potato'));
    assert.equal(t.items.rube_potato.g, undefined, 'a 500,000-currant purchase reads as an exchange, not a forged potato');
    assert.equal(t.items[CAMERA_OFFER.classTsid].g, undefined);
    assert.equal(t.items[CAMERA_OFFER.classTsid].cap, undefined);
  });
});
