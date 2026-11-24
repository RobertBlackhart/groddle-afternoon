/**
 * Player names stay out of the public files (Austin 2026-11-23: scrub the files and the generator; no
 * history rewrite). public/restoration/history.json is built from commit messages
 * (tools/build-restoration.mjs historyLog), and some old commit bodies name the players who reported
 * a bug or said something in chat. The generator drops every body line that names a player, and a
 * subject naming one says "a player" instead; tests/history-player-names.test.js fails if a name is
 * left.
 *
 * The names never enter this repo: they are read from a private list outside it,
 * ../research/private/player-names.txt (or GRODDLE_PLAYER_NAMES), built from the research checks
 * (reporters and chat speakers) and the gap register. Without the list (another machine) nothing is
 * scrubbed and the test skips, as the research-backed tests do.
 *
 * The list: one name per line, matched as a whole word, case as written; `#` lines are comments;
 * `not: <phrase>` is a game phrase that holds a name but is not the player (Uncle Friendly, Juju
 * Bandits), masked before matching.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PLAYER_NAMES_PATH = process.env.GRODDLE_PLAYER_NAMES || join(ROOT, '..', 'research', 'private', 'player-names.txt');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Case as written: a name is often a common word in another case (the bandits, friendly).
const word = (s) => new RegExp(`(?<![\\p{L}\\p{N}_])${escape(s)}(?![\\p{L}\\p{N}_])`, 'gu');

/** PURE: the list's text as { names, not } (comments and blank lines skipped). */
export function parsePlayerNames(text = '') {
  const names = [];
  const not = [];
  for (const raw of String(text).split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = /^not:\s*(.+)$/i.exec(line);
    if (m) not.push(m[1].trim());
    else names.push(line);
  }
  return { names, not };
}

/** The private list, or null when it is not on this machine. */
export function loadPlayerNames(path = PLAYER_NAMES_PATH) {
  if (!path || !existsSync(path)) return null;
  const list = parsePlayerNames(readFileSync(path, 'utf8'));
  return list.names.length ? list : null;
}

/** PURE: the list's names found in `text` (game phrases masked first), each once. */
export function playerNamesIn(text, list) {
  if (!list?.names?.length || !text) return [];
  let s = String(text);
  for (const p of list.not || []) s = s.replace(word(p), ' ');
  return list.names.filter((n) => word(n).test(s));
}

/**
 * PURE: a history change without player names: body lines naming one are dropped (they quote or
 * credit a player), a subject naming one says "a player" instead.
 */
export function scrubChange(change, list) {
  if (!list) return change;
  let text = change.text;
  for (const n of playerNamesIn(text, list)) {
    // Not inside a game phrase (Uncle Friendly stays).
    const kept = [];
    for (const p of list.not || []) for (const m of text.matchAll(word(p))) kept.push([m.index, m.index + m[0].length]);
    text = text.replace(word(n), (hit, at) => (kept.some(([a, b]) => at >= a && at < b) ? hit : 'a player'));
  }
  const details = (change.details || []).filter((l) => playerNamesIn(l, list).length === 0);
  return { ...change, text, details };
}
