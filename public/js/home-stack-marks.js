/**
 * Decoration Mode marks (Austin 2026-11-23, on the day's calls: "visually allow owners to see which
 * are set as decoration and which are freebies"). The remake's own UI (inventions register:
 * home-stack-marks); Glitch's owner saw nothing to tell the two apart.
 *
 * Online, at the player's own home (their house with its back yard, their Tower floors and their
 * home street), two kinds of stack lie on the floor side by side:
 *
 * - decor: what the owner keeps in their own save, chiefly what they set down in Decoration Mode
 *   (house_lock, takeable.js 33-36: locked to the owner; visitors see Pick up greyed). Only the
 *   owner can pick it up. It carries a small lock pip, seen only by the owner: while the pointer is
 *   on it or its menu is open (a tap on a phone), and on every one of them in Decoration Mode.
 * - shared: what was dropped there (G1190, takeable_drop / takeable_pickup ran unchanged in a house):
 *   anyone there can pick it up. It stays plain; its menu's header says so, for the owner.
 *
 * Nowhere else (solo, a visit, a public street, offline) are stacks marked: there is no difference
 * to tell. The pip's colours are the tooltip tokens (--surface-tip, --text-tip) read from the page.
 */

export const HOME_MARK_TEXT = Object.freeze({
  decor: 'Set by you · only you can pick this up',
  shared: 'Anyone here can pick this up',
});

/**
 * PURE: the mark a stack drawn here carries: 'decor', 'shared' or ''.
 * ownHome: the player stands at their own home online (drops-mp-feature homeStackMarks);
 * fromSave: the stack is the player's own (game.js listDroppedStacks), not one the server shares;
 * shared: a stack the server shares (drops-mp.js normalizeGroundStack `shared`).
 */
export function homeStackMark({ ownHome = false, fromSave = false, shared = false } = {}) {
  if (!ownHome) return '';
  if (fromSave) return 'decor';
  return shared ? 'shared' : '';
}

/** PURE: the line a marked stack's menu header adds under its subtitle ('' for none). */
export function homeMarkNote(mark) {
  return HOME_MARK_TEXT[mark] || '';
}

/**
 * PURE: whether a decor stack's lock pip shows now: in Decoration Mode always, else while the
 * pointer is on it or its menu is open. A shared or unmarked stack never shows one.
 */
export function homePipShown(mark, { decorating = false, hovered = false, menuOpen = false } = {}) {
  return mark === 'decor' && Boolean(decorating || hovered || menuOpen);
}

/** The pip's size, screen px: a disc this wide at the art's top left corner. */
export const HOME_PIP_PX = 14;

/** A CSS colour token's value on the page ('#rrggbb' or rgb()), or the fallback off a page. */
export function tokenColour(name, fallback) {
  try {
    const v = globalThis.getComputedStyle?.(globalThis.document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch {
    return fallback;
  }
}

/**
 * The lock pip, a Pixi container centred on (0, 0), HOME_PIP_PX across: a tooltip-dark disc with a
 * thin light rim and a small padlock (a body and its shackle) in the tooltip's text colour.
 */
export function drawLockPip(PIXI) {
  const bg = tokenColour('--surface-tip', '#3a332b');
  const ink = tokenColour('--text-tip', '#fbf7ef');
  const r = HOME_PIP_PX / 2;
  const pip = new PIXI.Container();
  pip.label = 'home-lock-pip';
  pip.eventMode = 'none';
  const g = new PIXI.Graphics();
  g.circle(0, 0, r).fill({ color: bg, alpha: 0.88 }).stroke({ width: 1, color: ink, alpha: 0.7 });
  // The shackle: an arch over the body.
  g.moveTo(-2.2, -0.5).lineTo(-2.2, -2.2).arc(0, -2.2, 2.2, Math.PI, 0).lineTo(2.2, -0.5).stroke({ width: 1.3, color: ink });
  // The body.
  g.roundRect(-3.4, -0.8, 6.8, 4.8, 1).fill({ color: ink });
  pip.addChild(g);
  return pip;
}
