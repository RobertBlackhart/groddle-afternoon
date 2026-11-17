/**
 * The one rule for which street others share with you online (pure; realtime-feature
 * sharedStreet, shared-quoins-feature and rook-attack-feature build on it).
 *
 * A street is shared unless it is a place of your own: a feature's held instance or scene
 * (engine.transientInstance), a home, or a place Glitch kept to one player (G945, audit M21
 * and M22: instance_me with a max of 1, js/private-streets.js, generated from the location
 * data). On those, others never appear, and quoins and objects stay local.
 */

import { isPrivateStreet } from './private-streets.js?v=e0a38930';

/** The public street others can share with you now, or '' in a private place. */
export function publicStreet(engine) {
  if (!engine?.player || !engine.streetTsid) return '';
  if (engine.transientInstance?.()) return '';
  if (engine.homeContext?.().inHome) return '';
  if (isPrivateStreet(engine.streetTsid)) return '';
  return String(engine.streetTsid);
}
