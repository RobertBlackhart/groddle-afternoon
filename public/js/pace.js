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
