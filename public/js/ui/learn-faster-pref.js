/**
 * #377 (Austin 2026-11-15): the shrine's Learn Faster? fold, as the player left it, for this tab's
 * session (sessionStorage): '1' open, '0' closed, null not chosen yet. Storage can be missing or throw
 * (private windows): then nothing is remembered and the default holds (js/shrines.js learnFasterOpen).
 */
export const LEARN_FASTER_OPEN_KEY = 'groddle.shrine.learnFasterOpen';

export function loadLearnFasterOpen(storage = globalThis.sessionStorage) {
  try {
    const v = storage?.getItem(LEARN_FASTER_OPEN_KEY);
    return v === '1' || v === '0' ? v : null;
  } catch {
    return null;
  }
}

export function saveLearnFasterOpen(open, storage = globalThis.sessionStorage) {
  try {
    storage?.setItem(LEARN_FASTER_OPEN_KEY, open ? '1' : '0');
  } catch {
    /* this panel only */
  }
}
