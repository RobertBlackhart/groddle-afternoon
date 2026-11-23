/**
 * Peter out Peat (register G451, Austin's ruling 2026-11-07: as the original, online only).
 * Pure: no DOM, no socket. Started within 100 px of a Peat Bog with all 4 harvests left; the bog
 * says "Empty me out! Go!" for 5 s and 9 seconds run; when they end the bog is looked at, and no
 * harvests left sets the quest's flag, anything else fails it
 * (quests/bogspecialization_harvest_full_peat_bog_in_time_period.js 67-92, items/catalog_buffs.js
 * 149-169). The players do the emptying: one harvest each a game day, two with the
 * bog_specialization_dig_peat_bog_twice upgrade (peat_1.js 142-160), so it takes four players, or
 * two with the upgrade. The server decides all of it (groddle-afternoon-server objects_peat.go).
 *
 * Solo stopped offering it: a bog there can never be emptied by anyone else. A solo save that
 * already holds it has it taken out of the log (retireSoloPeatQuest), with one line saying why.
 */

export const PEAT_QUEST = 'bogspecialization_harvest_full_peat_bog_in_time_period';
export const PEAT_BOG = 'peat_1';
export const PEAT_FULL = 4; // peat_1.js harvests_remaining 0-4
export const PEAT_REACH = 100; // onStarted: pc.findCloseStack(is_bog, 100)
export const PEAT_EVENT = 'peat_bog:emptied'; // js/quest-offers.js routes it to peat_bog_fully_harvested
/** The bog's 9 seconds (catalog_buffs.js 152 duration 9; objects_peat.go bogFor). */
export const PEAT_FOR_MS = 9000;
/** How long a quest's timer waits for the server's word past its 9 s, a trip there and back. */
export const PEAT_ANSWER_GRACE_MS = 4000;
export const PEAT_TEXT = Object.freeze({
  notClose: 'You need to be near a full Peat Bog.', // onStarted 72
  call: 'Empty me out! Go!', // onStarted 77
  callMs: 5000,
  noServer: 'You need to be online to try this.', // ours
  retired: '“Peter out Peat” takes other players, so it has left your quest log here. It waits for you online.', // ours
});

/** The nearest full bog within reach of x, y, from the street's resource nodes, or null. */
export function fullBogNear(nodes, x, y) {
  let best = null;
  let bestD = Infinity;
  for (const n of nodes || []) {
    if (n?.classTsid !== PEAT_BOG || Number(n.node?.units) !== PEAT_FULL) continue;
    const spr = n.target?.sprite;
    if (!spr || spr.destroyed) continue;
    const d = Math.hypot(spr.x - x, spr.y - y);
    if (d <= PEAT_REACH && d < bestD) {
      best = n;
      bestD = d;
    }
  }
  return best;
}

/**
 * A solo save that holds the quest: out of the log, and nothing left waiting (the offer state's
 * lists are the ones js/quest-offers.js keeps). True when the player held it, so they are told.
 */
export function retireSoloPeatQuest(questState) {
  if (!questState) return false;
  const offers = questState.offers;
  const held = Boolean(questState.active?.[PEAT_QUEST] || offers?.declined?.[PEAT_QUEST]);
  if (questState.active) delete questState.active[PEAT_QUEST];
  if (offers && typeof offers === 'object') {
    for (const key of ['offered', 'declined', 'managed', 'timers', 'failed', 'distinct', 'repeats']) {
      if (offers[key] && typeof offers[key] === 'object') delete offers[key][PEAT_QUEST];
    }
    if (Array.isArray(offers.queue)) offers.queue = offers.queue.filter((id) => id !== PEAT_QUEST);
  }
  return held;
}

/**
 * G1187 (Austin 2026-11-23, an invention: Glitch had no shared countdown, the timer buff ran on
 * the quest holder alone, quest line 80): everyone on the street who hears the bog's
 * "Empty me out! Go!" (bog_call, sent the moment the 9 s start) sees the same timer the holder
 * sees, a Peter out Peat chip in their buff strip counting down. The holder keeps their own buff
 * and gets no second chip.
 */
export function peatHelperRun(street, id, now = Date.now()) {
  return { street: String(street || ''), id: String(id || ''), startedAt: now, endsAt: now + PEAT_FOR_MS };
}

/**
 * The helper's chip as a buff strip row ({ classTsid, def, appliedAt, expiresAt, sourceItem }), or
 * null: no run, another street, the 9 s over, or the player holds the quest's own timer.
 */
export function peatHelperRow(run, { street, holding = false, now = Date.now(), def = null, sourceItem = null } = {}) {
  if (!run || holding || !def) return null;
  if (run.street !== String(street || '') || now >= run.endsAt) return null;
  return { classTsid: PEAT_QUEST, def, appliedAt: run.startedAt, expiresAt: run.endsAt, sourceItem: sourceItem || def.itemClass || null, helper: true };
}
