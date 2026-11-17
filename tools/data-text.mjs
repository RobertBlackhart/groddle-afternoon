/**
 * G955 (#472): GameServerJS text enters our data as characters, not HTML entities.
 *
 * GSJS strings are Flash htmlText ("Plant &amp; Certify", "i &lt;3 u", "&#34;freedom&#34;"): the
 * client showed them through tf.htmlText. The game draws most of them as plain text (Pixi Text,
 * textContent), where an entity shows as written. So the builders decode them here, once:
 *   - a plain string (no tags): every entity becomes its character;
 *   - a markup string (GSJS <split>, <br>, <b>, <a href="event:...">, read by js/quest-text.js and
 *     the plain-text converters in js/html-text.js): every entity but &lt; &gt; &amp;, which keep
 *     saying "this is text, not a tag" inside markup.
 * tests/g955-no-entities-in-data.test.js holds the shipped data to that.
 */
import { decodeEntities } from '../public/js/html-text.js?v=6bbf4d1f';

export const MARKUP = /<\/?[a-z][^>]*>/i;
const KEEP_IN_MARKUP = new Set(['lt', 'gt', 'amp']);

/** One GSJS string as data text. */
export function dataText(s) {
  return MARKUP.test(s) ? decodeEntities(s, { keep: KEEP_IN_MARKUP }) : decodeEntities(s);
}

/** Every string in a built catalog (keys too) as data text; returns a new value. */
export function decodeDataText(value) {
  if (typeof value === 'string') return dataText(value);
  if (Array.isArray(value)) return value.map(decodeDataText);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[dataText(k)] = decodeDataText(v);
    return out;
  }
  return value;
}

/** An entity a data string should no longer hold (see the rules above), or null. */
export function strayEntity(s) {
  const markup = MARKUP.test(s);
  for (const m of String(s).matchAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi)) {
    if (markup && KEEP_IN_MARKUP.has(m[1].toLowerCase())) continue;
    return m[0];
  }
  return null;
}
