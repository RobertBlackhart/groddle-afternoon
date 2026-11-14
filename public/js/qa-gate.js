/**
 * Which pages get the QA handles that change the game (G738): window.groddleQA's grants, quest
 * completion, travel and avatar moves, and the feature handles that run verbs, move the player or
 * send test messages. One rule, decided here:
 *
 * - solo: always (the game is the player's own, saved in this browser);
 * - multiplayer: only on a local host (127.0.0.1, localhost, ::1 and *.localhost), where
 *   tools/qa/online-smoke.mjs and the two-player checks drive them on groddle.localhost.
 *
 * Online anywhere else the handles are not made at all. Read-only inspectors (where things are
 * drawn, what the page holds) stay: they change nothing (game.js keeps a read-only groddleQA).
 * The site and the realtime server still check everything a page sends; this only takes away the
 * ready-made levers.
 */

import { GAME_MODE, MULTIPLAYER } from './game-mode.js?v=1ecf2899';

/** A host name a developer's own machine serves (never a public site). */
export function isLocalHost(hostname) {
  const h = String(hostname || '').toLowerCase().replace(/\.$/, '');
  return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]' || h.endsWith('.localhost');
}

/** Whether this page may have the handles that change the game. */
export function qaHandlesAllowed({ mode = GAME_MODE, hostname = globalThis.location?.hostname } = {}) {
  return mode !== MULTIPLAYER || isLocalHost(hostname);
}

/**
 * Sets globalThis[name] = value when this page may have it (qaHandlesAllowed), and returns the
 * value it set, or null. A refused handle is removed if something set it before.
 */
export function exposeQA(name, value, { allowed = qaHandlesAllowed(), scope = globalThis } = {}) {
  if (!scope) return null;
  if (allowed) {
    scope[name] = value;
    return value;
  }
  try { delete scope[name]; } catch { /* not ours to remove */ }
  return null;
}

/** The read-only part of an object: only `keys` (a nested object takes its own key list). */
export function pickReadOnly(source, keys) {
  const out = {};
  for (const key of keys) {
    if (Array.isArray(key)) {
      const [name, inner] = key;
      if (source?.[name] && typeof source[name] === 'object') out[name] = pickReadOnly(source[name], inner);
    } else if (source && key in source) {
      out[key] = source[key];
    }
  }
  return out;
}
