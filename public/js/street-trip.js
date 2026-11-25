/**
 * R46 (#614): a street trip that failed partway had no way back. A fetch that failed ("Failed to
 * fetch") threw out of the trip; the feature that sent you had already changed its own state (the
 * Subway cleared your ride before the station loaded) and nothing put it back, so you stood in a
 * still train car with no ride and no way off until a reload.
 *
 * Glitch's server owned the move (players/player.js transit_disembark_callback 2707,
 * teleportToLocationDelayed): the client only asked, and a client whose load failed reconnected
 * where the server had it. The remake's trip is the client's own, so it gets one failure contract
 * here, used by every street trip (game.js streetTripTo, under enterStreetWithTransition):
 * - the load is tried again once (tripWithRetry, TRIP_TRIES);
 * - when it still fails, a street it had begun to tear down is put back (restore), so you stand
 *   where you were, in a working state;
 * - you are told in one short line (tripFailedLine);
 * - it throws a TripFailed. engine.enter, the trip every feature takes, turns that into false
 *   (enterResult): a feature checks the result and puts its own state back (or changes it only
 *   after arrival).
 */

/** Tries a trip's load gets: the first and one more. */
export const TRIP_TRIES = 2;

/** The line a failed trip says (plain, short). */
export function tripFailedLine(label) {
  const place = String(label || '').trim();
  return `Couldn't reach ${place || 'that place'}. Try again.`;
}

/** A trip that failed after its retry; the player has been told (`said`). */
export class TripFailed extends Error {
  constructor(label, cause) {
    super(`Trip failed: ${label || 'unknown'}${cause?.message ? ` (${cause.message})` : ''}`);
    this.name = 'TripFailed';
    this.tripFailed = true;
    this.said = true;
    this.cause = cause;
  }
}

/**
 * Runs a trip's load under the contract. `load(attempt)` builds the new street (throws on a failed
 * fetch); `snapshot()` notes where you are before it; `undo()` puts back what the caller changed
 * before the trip; `changed(snap)` says whether a failed load had begun replacing that place;
 * `restore(snap)` puts it back; `say(line)` tells the player; `warn(err, step)` logs. Resolves
 * with load's answer, or throws a TripFailed once the player is back where they were and told.
 */
export async function tripWithRetry({ load, snapshot, undo, changed, restore, say, warn, label = '', tries = TRIP_TRIES } = {}) {
  const was = snapshot?.();
  let last = null;
  for (let attempt = 0; attempt < Math.max(1, tries); attempt += 1) {
    try {
      return await load(attempt);
    } catch (err) {
      last = err;
      warn?.(err, attempt);
    }
  }
  try {
    undo?.();
  } catch (err) {
    warn?.(err, 'undo');
  }
  if (changed?.(was)) {
    try {
      await restore?.(was);
    } catch (err) {
      warn?.(err, 'restore');
    }
  }
  say?.(tripFailedLine(label));
  throw new TripFailed(label, last);
}

/**
 * engine.enter's answer: true once `trip()` has arrived, false when it failed (never a throw). A
 * failure the trip did not already announce (one outside its load) is said here.
 */
export async function enterResult(trip, { say, warn, label = '' } = {}) {
  try {
    await trip();
    return true;
  } catch (err) {
    warn?.(err);
    if (!err?.said) say?.(tripFailedLine(label));
    return false;
  }
}

/**
 * #674: the sound a trip starts with. A teleport (opts.teleport) played TELEPORT_AWAY, or
 * TELEPORT_AWAY_HUB when the place you go is in another hub than the one you stand in
 * (players/player.js teleportToLocation 674-678). Every instances_enter took that path
 * (players/inc_instances.js 89-104), so boarding the Subway car (hub 66) from any station, and
 * getting off again, played TELEPORT_AWAY_HUB. Any other trip (a signpost, a door) whooshes.
 */
export function tripSound({ teleport = false, fromHubId = '', toHubId = '' } = {}) {
  if (!teleport) return 'SIGNPOST_TRAVEL';
  const from = String(fromHubId ?? '');
  const to = String(toHubId ?? '');
  return from && to && from !== to ? 'TELEPORT_AWAY_HUB' : 'TELEPORT_AWAY';
}
