/**
 * The remake's pace for timed skills: how much of Glitch's own time a system takes here.
 *
 * Ours (register G983, Austin 2026-11-17): players pushed back on Glitch's slow mining once v0.41.0
 * gave it Glitch's full 20, 14, 10 and 8 s (G758, #330). Austin's ruling is a compromise at about
 * one third of Glitch: 0.3 of the package's own duration, so Mining I to IV take 6, 4.2, 3 and 2.4 s
 * and the ranks keep Glitch's proportions. The speed cards (Manic Mining I-III, the package's
 * img_upgrades duration_multiplier) still apply first; energy, tool wear, xp and yield per swing
 * stay Glitch's. tools/inventions/inventions.json entry remake-pace.
 *
 * Only systems that call pace() take it: today mining alone (js/mining.js miningProfile). Austin is
 * weighing the same pace for every timed system; `default` is that figure, for a system to switch to
 * later by calling pace() with its own name. Every other package keeps Glitch's times for now.
 *
 * PACED_WAITS holds the single waits the remake paces (a row each: Glitch's time, the factor, the
 * ruling). Every copy of such a wait reads it from here: the game's modules import it, and the
 * builders carry it to the realtime server (tools/build-realtime-objects.mjs rules.rockRespawnMs and
 * rules.rockRespawnExtra)
 * and the site (tools/build-yard-verbs.mjs respawnMs). tests/pace-waits.test.js fails when any copy
 * disagrees with its row.
 */

/** The share of Glitch's time each system takes (G983). */
export const REMAKE_PACE = Object.freeze({
  default: 0.3,
  mining: 0.3,
});

/**
 * The skill packages each paced system runs (GSJS items/catalog_skill_packages.js ids), so a table
 * built from the package data (tools/encyclopedia/skill-times.mjs) shows the time the game takes.
 */
export const PACED_PACKAGES = Object.freeze({
  mining: 'mining',
  mining_fancypick: 'mining',
});

/**
 * Waits at the remake's pace, one row each: Glitch's own time (ms), the factor, the ruling.
 *
 * rock_respawn: a mined-out rock reforms 8 min on in Glitch (items/include/mining.js 422,
 * apiSetTimerX('onRespawn', 1000 * 60 * (8 + extra_time))). The remake had 45 s, so with swings at
 * 0.3 (G983) two rocks on a street alternated forever (#521). Austin 2026-11-19: 480 s x 0.3 = 144 s.
 *
 * rock_respawn_extra: Glitch added a random 0-16 min to that wait when more than 80 chunks had been
 * taken since the rock last reformed (mining.js 415-417, extra_time += Math.random() * 16.0), which in
 * the remake means a 150-chunk mega rock. Austin 2026-11-19: 0-960 s x 0.3, so 0-288 s more.
 */
export const PACED_WAITS = Object.freeze({
  rock_respawn: Object.freeze({ glitchMs: 480000, factor: 0.3, ruling: 'Austin 2026-11-19, #521' }),
  rock_respawn_extra: Object.freeze({ glitchMs: 960000, factor: 0.3, ruling: 'Austin 2026-11-19' }),
});

/** A paced wait's time in the remake, in whole ms (Glitch's time x its factor). */
export function pacedWaitMs(id) {
  const row = PACED_WAITS[id];
  if (!row) throw new Error(`pace.js: no paced wait ${id}`);
  return Math.round(row.glitchMs * row.factor);
}

/** A mined-out rock comes back this long after (144 s: Glitch's 8 min at 0.3). */
export const ROCK_RESPAWN_MS = pacedWaitMs('rock_respawn');

/** The most a mega rock's wait can grow by (288 s: Glitch's 16 min at 0.3). */
export const ROCK_RESPAWN_EXTRA_MS = pacedWaitMs('rock_respawn_extra');

/** mining.js 415: the extra wait comes once more than this many chunks were taken since the rock reformed. */
export const ROCK_RESPAWN_EXTRA_AFTER = 80;

/**
 * A cleared rock's wait to reform, given the chunks taken since it last reformed: ROCK_RESPAWN_MS,
 * plus a random share of ROCK_RESPAWN_EXTRA_MS past 80 chunks (mining.js 408-422). `rng` is only
 * drawn on for that share, so an ordinary rock's rolls are untouched.
 */
export function rockRespawnMs(chunksTaken, rng = Math.random) {
  if (!(Number(chunksTaken) > ROCK_RESPAWN_EXTRA_AFTER)) return ROCK_RESPAWN_MS;
  return ROCK_RESPAWN_MS + Math.round(rng() * ROCK_RESPAWN_EXTRA_MS);
}

/** A system's share of Glitch's time (`default` for a system not named). */
export function paceFor(system) {
  const own = REMAKE_PACE[system];
  return Number.isFinite(own) ? own : REMAKE_PACE.default;
}

/** `sourceMs` (Glitch's duration, after any speed card) at the system's pace, in whole ms. */
export function pace(system, sourceMs) {
  const ms = Number(sourceMs);
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms * paceFor(system));
}

/** The system a skill package belongs to when it is paced, or null (Glitch's own time). */
export function pacedSystemOf(packageId) {
  return PACED_PACKAGES[packageId] || null;
}
