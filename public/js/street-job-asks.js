/**
 * G1073 (chat 2026-11-20, Austin's ruling: explain the board, no balance change): players at a
 * street project board read "needs Master Chef II" on a work step that had not opened yet as a rule
 * for joining, and nothing said that anyone can give the items or where an item comes from.
 *
 * In Glitch an item ask needs no skill (quest.js 1471: any player with the item can contribute);
 * only tool work needs the tool and the skill (quest.js 942-986, 1489). So the board:
 * - says so in one line (JOB_ASK_TEXT.rule) while the project takes contributions;
 * - names a work step's skill only once that step is open (a locked step says it opens later);
 * - links each item ask still open to the item's Encyclopedia page, at its "In the remake" part
 *   (How to get it: vendors, gardens, recipes; tools/encyclopedia), the page the pack's item card
 *   links to (js/encyclopedia-links.js). An item with no page gets no link; nothing is made up here.
 */

export const JOB_ASK_TEXT = Object.freeze({
  rule: 'Anyone can give items. Skills are only needed for tool work.',
  getIt: 'Where to get it',
  getItTip: 'Opens its Encyclopedia page in a new tab',
  noSkillNearStart: 'no skill needed this close to the start',
});

/** The item page's "In the remake" heading (tools/encyclopedia: How to get it is under it). */
export const ITEM_GET_ANCHOR = '#remake-h';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** PURE: true when the board shows the rule line: the project takes contributions and asks for items or work. */
export function showAskRule(reqs, open) {
  return Boolean(open) && (reqs || []).some((r) => !r.done && (r.type === 'item' || r.type === 'work'));
}

/**
 * PURE: the skill words on a work row, '' for none. A step that has not opened yet names no skill
 * (G1073); an open one says what it needs. Report #425: solo near the start the skill is lower
 * (skillWas the source's) or waived.
 */
export function workSkillNote(r, skillLabel = (id) => String(id)) {
  if (!r || r.type !== 'work' || r.done || !r.open) return '';
  if (r.skillWas && !r.skill) return JOB_ASK_TEXT.noSkillNearStart;
  if (!r.skill) return '';
  const was = r.skillWas ? ` (${ROMAN[Number(String(r.skillWas).match(/_(\d+)$/)?.[1])] || skillLabel(r.skillWas)} further out)` : '';
  return `needs ${skillLabel(r.skill)}${was}`;
}

/** PURE: the Encyclopedia subject for an item ask still open, or null (js/encyclopedia-links.js subjects). */
export function itemAskSubject(r, itemName = (id) => String(id)) {
  if (!r || r.type !== 'item' || r.done || !r.classId) return null;
  return { id: String(r.classId), name: String(itemName(r.classId) || r.classId) };
}

/** PURE: an Encyclopedia page address taken to its How to get it part. */
export function itemGetHref(href) {
  const h = String(href || '');
  if (!h) return '';
  return `${h.replace(/#.*$/, '')}${ITEM_GET_ANCHOR}`;
}
