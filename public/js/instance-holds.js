/**
 * What a feature's instance hold (engine.instanceHold) means for engine.busy() (R41, G1083, #576).
 *
 * A hold marks the street as a feature's instance: travel is frozen there (engine.transientInstance
 * counts every hold: map routes, signposts, Teleport home answer to it), and a game held there
 * (Game of Crowns, Hog Haul, Mayhem, a quest room) also counts as busy, so nothing else starts
 * mid-game. A place hold is only where you are: a Party Space holds its street, but standing in
 * one is not being busy. Verbs, Cubimals, emotes, chat and vendors work there as on any street
 * (Glitch put no location check on them: npc_cubimal_*.js verbs.race has none). An action that
 * would take you out of the place (a quest room starting) asks busy({ leaving: true }), which
 * still counts it.
 */

/** Holds that are a place to be, not something being done (party-spaces-feature HOLD). */
export const PLACE_HOLDS = Object.freeze(['party']);

/** Whether a hold makes the player busy; { leaving: true } for an action that leaves the place. */
export function holdKeepsBusy(hold, { leaving = false } = {}) {
  if (!hold) return false;
  return leaving || !PLACE_HOLDS.includes(hold);
}
