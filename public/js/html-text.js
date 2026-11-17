/**
 * PURE (G955, #472): the one place HTML entities become characters.
 *
 * Glitch's text is Flash htmlText: the client set it with tf.htmlText (QuestElementUI.as 159-176,
 * ChatArea, the item and NPC bubbles), so GameServerJS wrote "i &lt;3 u" and "Plant &amp; Certify"
 * and the Flash text field showed "i <3 u". The data builders now decode that once where the text
 * enters our data (build-street-jobs.mjs, build-quests.mjs, tools/build-verb-responses.mjs), so the shipped data holds characters, and the game
 * escapes only where it writes HTML (notify-view.js escapeHtml). What still arrives as HTML at run
 * time (the location XML, the activity lines notify builds as HTML, GSJS markup with <br> and
 * <split>) turns into plain text here, never through a module's own short list of replaces.
 */

const NAMED = Object.freeze({
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
});

/** An entity's text: "&lt;", "&#34;", "&#x9;" and the named ones above. */
export const ENTITY = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;

/**
 * Every entity in `text` as its character. `keep` names entities left as they are (the markup
 * data keeps &lt; &gt; &amp;, which say "this is text, not a tag"). Unknown names stay.
 */
export function decodeEntities(text, { keep = null } = {}) {
  return String(text ?? '').replace(ENTITY, (whole, body) => {
    if (keep?.has(body.toLowerCase())) return whole;
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : whole;
    }
    return NAMED[body.toLowerCase()] ?? whole;
  });
}

/**
 * HTML (or GSJS markup) as plain text for a Pixi Text, a textContent or a comparison: tags dropped,
 * <split> and <br> as `split` and `br`, entities decoded once, non-breaking spaces as spaces.
 * `collapse` folds every run of white space to one space (one-line labels and keys).
 */
export function htmlToText(html, { split = '\n\n', br = '\n', collapse = false } = {}) {
  let s = String(html ?? '')
    .replace(/<split\b[^>]*>/gi, split)
    .replace(/<br\s*\/?>/gi, br)
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s).replace(/ /g, ' ');
  if (collapse) return s.replace(/\s+/g, ' ').trim();
  return s.replace(/\n{3,}/g, '\n\n').trim();
}
