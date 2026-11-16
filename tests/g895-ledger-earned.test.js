/**
 * G895 (#432): what a save's own records say it earned is credited by the site's ledger outside
 * the earning budget (groddle-afternoon-site src/LedgerMath.php earned / markBaseline / check, run
 * through the php CLI on made-up fixture saves), so an honest pack is never corrected for it:
 * a shrine's emblems up to the emblems the shrine record gained, a few a day. A forged pile beyond
 * the record or the day's count is still taken back.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE_DIR, skipWithoutSite } from '../tools/repos.mjs';

const hasPhp = spawnSync('php', ['-v']).status === 0;
const skip = skipWithoutSite || !hasPhp;

/** One LedgerMath call in PHP. */
function php(op, args) {
  const code = `
    foreach (['Economy', 'LedgerMath'] as $c) require ${JSON.stringify(SITE_DIR)} . "/src/$c.php";
    use Groddle\\Minn\\{Economy, LedgerMath};
    $in = json_decode(stream_get_contents(STDIN), true);
    $e = Economy::shared();
    $a = $in['args'];
    $out = match ($in['op']) {
      'check' => LedgerMath::check($a[0], $a[1], [], $a[2], (float) $a[3], 50000.0, $e),
      'baseline' => LedgerMath::markBaseline($a[0]),
    };
    echo json_encode($out);`;
  const out = execFileSync('php', ['-r', code], { input: JSON.stringify({ op, args }) });
  return JSON.parse(String(out), (k, v) => (Array.isArray(v) && !v.length && ['items', 'made', 'runs', 'capped', 'detail'].includes(k) ? {} : v));
}

const constant = (name) => (skip ? 0 : Number(new RegExp(`const ${name} = (\\d+);`).exec(readFileSync(join(SITE_DIR, 'src/LedgerMath.php'), 'utf8'))?.[1]));
const EMBLEM_DAILY = constant('EMBLEM_DAILY');
const EMBLEM_WAIT = constant('EMBLEM_WAIT');

const counts = (items = {}, currants = 0) => ({ items, currants });

/** A multiplayer save's entries: the pack and the shrine record (js/shrines.js normalizeShrineState). */
function save({ inv = {}, emblems = {} } = {}) {
  return {
    playerState: JSON.stringify({
      version: 7,
      inventory: inv,
      player: { currants: 0, xp: 5000, level: 5 },
      systems: { quests: { completed: [] }, achievements: { unlocked: [] }, shrines: { emblems, favor: {}, donations: 0 } },
    }),
  };
}

/** Credited rows as Ledger::credited hands them over (daily kinds without the day). */
function creditedFrom(rows) {
  const out = { base: { base: 1 } };
  for (const [kind, ref, n] of rows) (out[kind] ||= {})[ref] = n;
  return out;
}

const rowsOf = (r, kind) => r.rows.filter((x) => x[0] === kind);

describe('G895: the ledger credits a shrine\'s emblems from the save\'s shrine record', { skip }, () => {
  it('marks the record the first time it is seen, without paying', () => {
    assert.deepEqual(php('baseline', [save({ emblems: { lem: 3, zille: 0 } })]), [['mark', 'base', 1], ['mark', 'emblem:lem', 3]]);
  });

  it('an emblem the record gained stands with no budget at all, and moves the mark', () => {
    const credited = creditedFrom([['mark', 'base', 1], ['mark', 'emblem:lem', 3]]);
    const ledger = counts({ emblem_lem: 3 });
    const r = php('check', [ledger, credited, save({ inv: { emblem_lem: 4 }, emblems: { lem: 4 } }), 0]);
    assert.deepEqual(r.reconciled.clamped, counts());
    assert.deepEqual(r.after.items, { emblem_lem: 4 });
    assert.deepEqual(rowsOf(r, 'mark'), [['mark', 'emblem:lem', 4]]);
    assert.deepEqual(rowsOf(r, 'markday'), [['markday', 'emblem', 1]]);
    assert.deepEqual(r.credits.detail.earned, { emblem_lem: 1 });
  });

  it('a forged emblem the record does not show goes through the budget and is taken back', () => {
    const credited = creditedFrom([['mark', 'base', 1], ['mark', 'emblem:lem', 3]]);
    const r = php('check', [counts({ emblem_lem: 3 }), credited, save({ inv: { emblem_lem: 5 }, emblems: { lem: 3 } }), 0]);
    assert.deepEqual(r.reconciled.clamped, counts({ emblem_lem: 2 }));
    assert.deepEqual(rowsOf(r, 'mark'), []);
  });

  it('a forged record and pile stand only up to the day\'s count; the next few wait, the rest go', () => {
    const credited = creditedFrom([['mark', 'base', 1]]);
    const pile = 500;
    const r = php('check', [counts(), credited, save({ inv: { emblem_zille: pile }, emblems: { zille: pile } }), 0]);
    assert.deepEqual(r.after.items, { emblem_zille: EMBLEM_DAILY }, 'the day\'s count is credited');
    assert.deepEqual(r.held.items, { emblem_zille: EMBLEM_WAIT }, 'a few wait in the save, outside the ledger');
    assert.deepEqual(r.reconciled.clamped, counts({ emblem_zille: pile - EMBLEM_DAILY - EMBLEM_WAIT }));
    assert.deepEqual(rowsOf(r, 'mark'), [['mark', 'emblem:zille', pile - EMBLEM_WAIT]], 'only the waiting ones stay owed');
    // The same day again: the count is used, so only the waiting ones stand (still held), nothing new is credited.
    const again = creditedFrom([['mark', 'base', 1], ['mark', 'emblem:zille', pile - EMBLEM_WAIT], ['markday', 'emblem', EMBLEM_DAILY]]);
    const r2 = php('check', [counts({ emblem_zille: EMBLEM_DAILY }), again, save({ inv: { emblem_zille: pile }, emblems: { zille: pile } }), 0]);
    assert.deepEqual(r2.after.items, { emblem_zille: EMBLEM_DAILY });
    assert.deepEqual(r2.held.items, { emblem_zille: EMBLEM_WAIT });
  });

  it('emblems of every Giant share the day\'s count, and one waiting is credited on a later day', () => {
    const credited = creditedFrom([['mark', 'base', 1], ['markday', 'emblem', EMBLEM_DAILY - 1]]);
    const r = php('check', [counts(), credited, save({ inv: { emblem_lem: 1, emblem_zille: 1 }, emblems: { lem: 1, zille: 1 } }), 0]);
    assert.deepEqual(r.after.items, { emblem_lem: 1 });
    assert.deepEqual(r.held.items, { emblem_zille: 1 });
    assert.deepEqual(r.reconciled.clamped, counts(), 'an honest emblem past the count is never taken');
    const tomorrow = creditedFrom([['mark', 'base', 1], ['mark', 'emblem:lem', 1]]);
    const r2 = php('check', [counts({ emblem_lem: 1 }), tomorrow, save({ inv: { emblem_lem: 1, emblem_zille: 1 }, emblems: { lem: 1, zille: 1 } }), 0]);
    assert.deepEqual(r2.after.items, { emblem_lem: 1, emblem_zille: 1 });
    assert.deepEqual(rowsOf(r2, 'mark'), [['mark', 'emblem:zille', 1]]);
  });

  it('an emblem spent in the write that earned it is not kept owed for a forged one later', () => {
    const credited = creditedFrom([['mark', 'base', 1], ['mark', 'emblem:lem', 2]]);
    const r = php('check', [counts({ emblem_lem: 2 }), credited, save({ inv: { emblem_lem: 2 }, emblems: { lem: 3 } }), 0]);
    assert.deepEqual(rowsOf(r, 'mark'), [['mark', 'emblem:lem', 3]]);
    assert.deepEqual(rowsOf(r, 'markday'), []);
  });
});
