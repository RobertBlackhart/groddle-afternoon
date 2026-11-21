/**
 * #570 (G1077): the words on a street's sign decos. The client printed a deco's `sign_txt` inside
 * it (glitch-client DecoRenderer.as 287-322): a TextField as wide as the deco (`_tf.width = w`,
 * wrapping), its htmlText `<p class="<sign_css_class>">sign_txt</p>`, centred on the deco's middle
 * (`_tf.y = -tf.height / 2 - h / 2`), turned back the right way on a flipped deco (`_tf.scaleX = -1`)
 * and turning with it; a signed deco stood on top of its layer (Deco.as 36
 * should_be_rendered_standalone, LayerRenderer.as addDeco: "stack standalones on top"). The class is
 * the editor's choice of 16 (locodeco PropertiesPanel.mxml 28-45: White, White-, White+, White++,
 * then Tan, Gray, Mud and Yellow in VAG Rounded, each in three sizes); a sign's own `<font color size>`
 * wins over it (the gardens' dark brown 19 px lines).
 *
 * The stylesheet that gave each class its font, size and colour came from the server at run time
 * (CSSManager) and was not archived, so SIGN_CLASS_STYLES is inferred from the editor's names and
 * the sizes the game already prints recovered signs at (inventions.json deco-sign-styles).
 * build-street-layers.mjs carries `signText` and `signClass` into the street JSON;
 * js/street-render.js draws them (signWords).
 */
import { WORLD_FONT_FAMILY } from './world-text.js?v=6b49f88c';

/** The default class (Deco.as 20). */
export const DEFAULT_SIGN_CLASS = 'default_deco_sign';

const WHITE = 0xffffff;
const TAN = 0xf3e2b8;
const GRAY = 0xc9c9c9;
const MUD = 0x4a3a28;
const YELLOW = 0xffd84a;
/** The three VAG sizes (the plain, med and lg names) and the White ones, tiny to lg. */
const SIZE = Object.freeze({ tiny: 14, base: 18, med: 22, lg: 26 });

/** Each sign class's look: { size, fill, rounded } (rounded: the VAG Rounded classes). */
export const SIGN_CLASS_STYLES = Object.freeze({
  default_deco_sign: Object.freeze({ size: SIZE.base, fill: WHITE, rounded: false }),
  default_deco_sign_tiny: Object.freeze({ size: SIZE.tiny, fill: WHITE, rounded: false }),
  default_deco_sign_med: Object.freeze({ size: SIZE.med, fill: WHITE, rounded: false }),
  default_deco_sign_lg: Object.freeze({ size: SIZE.lg, fill: WHITE, rounded: false }),
  ...Object.fromEntries([['tan', TAN], ['gray', GRAY], ['mud', MUD], ['yellow', YELLOW]].flatMap(([name, fill]) => [
    [`deco_sign_vag_${name}`, Object.freeze({ size: SIZE.base, fill, rounded: true })],
    [`deco_sign_vag_med_${name}`, Object.freeze({ size: SIZE.med, fill, rounded: true })],
    [`deco_sign_vag_lg_${name}`, Object.freeze({ size: SIZE.lg, fill, rounded: true })],
  ])),
});

/**
 * Sign decos whose words a feature prints itself, in its own way (shown and hidden with the
 * street's events): those keep them, so nothing prints twice.
 * - Gentle Island's hint signs (js/newxp.js ISLAND_SIGNS, newxp-feature islandSigns);
 * - the Animal Kinship and Light Green Thumb practice streets' (js/skillquest-ak.js AK_SIGNS);
 * - the forgotten floor's EXIT (js/hidden-floors.js EXIT_SIGNS: blank_1324050033524, a deco the
 *   street JSON keeps without its id, so named by sprite and place, `blank@708,-301`).
 * tests/g1077-deco-signs.test.js keeps the list equal to those tables.
 */
export const SIGN_WORDS_ELSEWHERE = Object.freeze(new Set([
  'groddle_sign_blank_1343929965175', 'groddle_sign_blank_1343929965176', 'groddle_sign_blank_1343176167389',
  'groddle_sign_blank_1343176167390', 'groddle_sign_blank_1343260081007', 'groddle_sign_blank_1343260081008',
  'groddle_sign_blank_1343169537341', 'groddle_sign_blank_1343260081002', 'groddle_sign_blank_1343260081003',
  'groddle_sign_blank_1343260081004', 'groddle_sign_blank_1342730285889', 'groddle_sign_blank_1342730285890',
  'groddle_sign_blank_1343260081005', 'groddle_sign_blank_1343260081006',
  'groddle_sign_blank_1340840145185', 'groddle_sign_blank_1340318892614', 'groddle_sign_blank_1340318892615',
  'groddle_sign_blank_1342128759601', 'groddle_sign_blank_1342128759604', 'groddle_sign_blank_1342132710696',
  'blank@708,-301',
]));

/** PURE: whether a feature prints this deco's words itself (SIGN_WORDS_ELSEWHERE, by id or by sprite and place). */
export function signWordsElsewhere(deco) {
  return SIGN_WORDS_ELSEWHERE.has(deco?.id) || SIGN_WORDS_ELSEWHERE.has(`${deco?.sprite}@${deco?.x},${deco?.y}`);
}

const ENTITIES = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' });

/** PURE: a Flash htmlText colour ("#382D2C", "382D2C") as a number, or null. */
function colourOf(value) {
  const m = String(value || '').trim().match(/^#?([0-9a-f]{6})$/i);
  return m ? parseInt(m[1], 16) : null;
}

/**
 * PURE: a sign's htmlText as plain lines and the first `<font>` tag's colour and size (a sign sets
 * them for all its words). `<br>` and `<p>` break the line; other tags drop; entities decode.
 */
export function parseSignMarkup(markup) {
  const raw = String(markup || '');
  let fill = null;
  let size = null;
  const font = raw.match(/<font\b([^>]*)>/i);
  if (font) {
    const attr = (name) => font[1].match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
    const c = attr('color');
    const s = attr('size');
    fill = colourOf(c && (c[1] ?? c[2] ?? c[3]));
    const n = Number(s && (s[1] ?? s[2] ?? s[3]));
    size = Number.isFinite(n) && n > 0 ? n : null;
  }
  const text = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p\b[^>]*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (all, name) => (name[0] === '#' ? String.fromCodePoint(Number(name.slice(1))) : ENTITIES[name.toLowerCase()] ?? all))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim();
  return { text, fill, size };
}

/**
 * PURE: what a signed deco prints, or null: { text, style } with a PIXI.Text style (the class's
 * font, size and colour, the sign's own `<font>` over it, centred and wrapped at the deco's width).
 */
export function signWords(deco) {
  if (!deco?.signText || signWordsElsewhere(deco)) return null;
  const { text, fill, size } = parseSignMarkup(deco.signText);
  if (!text) return null;
  const look = SIGN_CLASS_STYLES[deco.signClass] || SIGN_CLASS_STYLES[DEFAULT_SIGN_CLASS];
  return {
    text,
    style: {
      fontFamily: WORLD_FONT_FAMILY,
      fontWeight: look.rounded ? '800' : '700',
      fontSize: size ?? look.size,
      fill: fill ?? look.fill,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: Math.max(20, Number(deco.w) || 200),
      lineHeight: Math.round((size ?? look.size) * 1.2),
    },
  };
}
