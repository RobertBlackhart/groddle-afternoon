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
import { execFileSync, spawnSync } from 'node:child_process';
import { SITE_DIR, skipWithoutSite } from '../tools/repos.mjs';
import { gameFiles, gameText } from '../tools/build-economy.mjs';
import { RARE_STORE } from '../public/js/quest-rooms/penalty.js?v=74819fef';
import { CAMERA_OFFER } from '../public/js/snaps.js?v=55d4c257';

import { ISLAND_CURRANTS, ISLAND_FLAGS, normalizeNewxpSave } from '../public/js/newxp.js?v=02f902e6';

const root = join(import.meta.dirname, '..');
const economy = () => JSON.parse(readFileSync(join(SITE_DIR, 'data/economy.json'), 'utf8'));
const hasPhp = spawnSync('php', ['-v']).status === 0;
const skip = skipWithoutSite || !hasPhp;

function php(op, args) {
  const code = `
    foreach (['Economy', 'LedgerMath'] as $c) require ${JSON.stringify(SITE_DIR)} . "/src/$c.php";
    use Groddle\\Minn\\{Economy, LedgerMath};
    $in = json_decode(stream_get_contents(STDIN), true);
    $a = $in['args'];
    echo json_encode(match ($in['op']) {
      'check' => LedgerMath::check($a[0], $a[1], [], $a[2], (float) $a[3], 50000.0, Economy::shared(), null, fn (): int => 0, 1763319600),
      'holdings' => LedgerMath::holdings($a[0], Economy::shared()),
      'baseline' => LedgerMath::markBaseline905($a[0]),
    });`;
  const out = execFileSync('php', ['-r', code], { input: JSON.stringify({ op, args }) });
  return JSON.parse(String(out), (k, v) => (Array.isArray(v) && !v.length && ['items', 'made', 'runs', 'capped', 'detail', 'held', 'spent'].includes(k) ? {} : v));
}

const counts = (items = {}, currants = 0) => ({ items, currants });
const none = counts();
/** A made-up multiplayer save: the pack, the purse and feature slices. */
function save({ inv = {}, currants = 0, features = {}, level = 1, xp = 300, dropped = null } = {}) {
  const out = { playerState: JSON.stringify({ version: 7, inventory: inv, player: { currants, xp, level }, systems: { quests: { active: {}, completed: [] }, achievements: { unlocked: [] }, features } }) };
  if (dropped) out.droppedItems = JSON.stringify({ streets: dropped });
  return out;
}
const credited = (more = {}) => ({ base: { base: 1 }, level: { level: 1 }, mark: { base: 1, base905: 1 }, ...more });

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

describe('G948 A14: the island rock\'s 978 currants stand once per character', { skip }, () => {
  const island = (flags) => ({ newxp: { v: 1, status: 'active', stage: 'island', skill: 'animalkinship_1', flags, island: 'quest_given' } });

  it('the game pays them once, flagging it in the same tick, and the flag survives a reload', () => {
    assert.ok(ISLAND_FLAGS.includes('island_currants'));
    assert.deepEqual(normalizeNewxpSave({ status: 'active', stage: 'island', flags: ['island_currants'] }).flags, ['island_currants']);
    const src = readFileSync(join(root, 'public/js/features/newxp-feature.js'), 'utf8');
    const pay = src.slice(src.indexOf('async function islandRockScript('), src.indexOf('function bagShopProfile('));
    assert.match(pay, /if \(!hasFlag\('island_currants'\)\) \{\n\s+engine\.pc\.currants = \(Number\(engine\.pc\.currants\) \|\| 0\) \+ ISLAND_CURRANTS;\n\s+setFlag\('island_currants'\);/);
  });

  it('a new player\'s 978 stand with no budget; without the flag, or a second time, they go through the budget', () => {
    const r = php('check', [none, credited(), save({ currants: ISLAND_CURRANTS, features: island(['currants_revealed', 'island_currants']) }), 0]);
    assert.deepEqual(r.reconciled.clamped, none);
    assert.equal(r.after.currants, ISLAND_CURRANTS);
    assert.ok(r.rows.some(([k, ref, n]) => k === 'tut' && ref === 'islandcurrants:currants' && n === ISLAND_CURRANTS));
    const unflagged = php('check', [none, credited(), save({ currants: ISLAND_CURRANTS, features: island(['currants_revealed']) }), 0]);
    assert.equal(unflagged.reconciled.clamped.currants, ISLAND_CURRANTS);
    const again = php('check', [none, credited({ tut: { 'islandcurrants:currants': ISLAND_CURRANTS } }), save({ currants: ISLAND_CURRANTS, features: island(['island_currants']) }), 0]);
    assert.equal(again.reconciled.clamped.currants, ISLAND_CURRANTS);
  });

  it('only what the write shows beyond the ledger: a bag already bought leaves the rest', () => {
    const r = php('check', [none, credited(), save({ currants: ISLAND_CURRANTS - 500, inv: { bag_generic: 1 }, features: island(['island_currants']) }), 0]);
    assert.deepEqual(r.reconciled.clamped, none, 'the bag (island set) and the change both stand');
    assert.ok(r.rows.some(([k, ref, n]) => k === 'tut' && ref === 'islandcurrants:currants' && n === ISLAND_CURRANTS - 500));
  });
});
