/**
 * G1063 (#556): Enlarge Yer Slots (buy_bag) stayed at "Purchase a Generic Bag 0/1" after a Generic
 * Bag was bought. Since G979 game.js started it with assignQuest, so the run was never marked
 * managed, and the offer engine routes events for managed runs only (quest-offers-feature
 * questContext managedOnly): the vendor buy never reached it. Runs are now accepted as the engine
 * accepts them, and a run started that way is adopted on load.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContentCatalogsFromDir } from '../public/js/content-catalogs.js?v=10b118dd';
import { createQuestState, assignQuest } from '../public/js/quests.js?v=4a3fb1da';
import {
  FIRST_SKILL_QUEST_ID,
  acceptOffer,
  claimFirstSkillQuest,
  routeQuestEvent,
  settleFirstSkillQuest,
} from '../public/js/quest-offers.js?v=c755e2a7';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'public/assets/content');
const read = (rel) => readFileSync(join(ROOT, 'public', rel), 'utf8');
const progress = (qs) => qs.active[FIRST_SKILL_QUEST_ID]?.progress?.generic_bag_purchased ?? null;
// The offer engine's own routing context (quest-offers-feature questContext).
const engineCtx = (inv) => ({ inv, managedOnly: true, pc: { currants: 0, xp: 0, energy: 50, mood: 50 } });

/** As game.js startFirstSkillQuest now does: the first skill claims it, then the engine's accept. */
function startAtFirstSkill(inv) {
  const qs = createQuestState();
  assert.equal(claimFirstSkillQuest(qs, { skills: 1 }), true);
  assert.equal(acceptOffer(qs, FIRST_SKILL_QUEST_ID, { inv, now: 1 }).ok, true);
  return qs;
}

/** A save from v0.48.0 to v0.52.0: started with assignQuest, never marked managed. */
function oldRun() {
  const qs = createQuestState();
  claimFirstSkillQuest(qs, { skills: 1 });
  assignQuest(qs, FIRST_SKILL_QUEST_ID, { ignorePrereq: true });
  return qs;
}

describe('G1063: Enlarge Yer Slots counts the bag', () => {
  before(async () => { await loadContentCatalogsFromDir(CONTENT); });

  it('a Generic Bag bought with the first-skill run going counts through the engine (#556)', () => {
    const qs = startAtFirstSkill({ bag_generic: 1 });
    const r = routeQuestEvent(qs, 'vendor_bought:bag_generic', 1, engineCtx({ bag_generic: 2 }));
    assert.equal(progress(qs), 1);
    assert.deepEqual(r.completable.map((row) => [row.classTsid, row.turnIn]), [[FIRST_SKILL_QUEST_ID, 'familiar']]);
  });

  it('a run an older build started is adopted on load, then a coloured bag bought counts', () => {
    const qs = oldRun();
    routeQuestEvent(qs, 'vendor_bought:bag_generic', 1, engineCtx({}));
    assert.equal(progress(qs), 0, 'the report: the engine passed it by');
    assert.equal(settleFirstSkillQuest(qs, { now: 5 }).adopted, true);
    assert.equal(settleFirstSkillQuest(qs, { now: 6 }).adopted, false, 'once');
    routeQuestEvent(qs, 'vendor_bought:bag_generic_blue', 1, engineCtx({}));
    assert.equal(progress(qs), 1);
  });

  it('game.js accepts it as the engine does; the engine adopts an older run', () => {
    const game = read('game.js');
    const fn = game.slice(game.indexOf('function startFirstSkillQuest()'), game.indexOf('function handleSkillCompletions('));
    assert.match(fn, /acceptOffer\(questState, FIRST_SKILL_QUEST_ID, \{ inv, countItem, addItem, now: Date\.now\(\) \}\)/);
    assert.doesNotMatch(fn, /assignQuest\(/);
    assert.match(read('js/features/quest-offers-feature.js'), /settleFirstSkillQuest\(qs, \{ now \}\)\.adopted/);
  });
});
