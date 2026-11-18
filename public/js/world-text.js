/**
 * The one font every in-world text draws in (R17, G898 #429, G903): speech bubbles, nameplates,
 * floating numbers, signposts, labels, counters and timers on the street, drawn by Pixi or a
 * canvas. Every such style takes its family from here (tests/world-text.test.js fails on a style
 * that names a family of its own).
 *
 * The family is the UI's self-hosted Nunito (style.css @font-face, assets/fonts/nunito, SIL OFL
 * 1.1 with OFL.txt beside it; never a request to Google). The remake's styles asked for Trebuchet
 * MS, Arial, Verdana, Georgia, Fredoka or Courier New by name, which Android does not have: a
 * phone drew whatever face it had, a bold serif on the signposts (#429).
 *
 * Glitch drew its world text in fonts embedded in the client SWF: HelveticaEmbed (nameplates,
 * AbstractAvatarView.as 195; the stylesheet default, CSSManager.as 75) and VAGRoundedBoldEmbed
 * (counts, QuantityPickerSpecial.as 227), both proprietary (TSEngineAssets/src/Assets.as 887-900).
 * Neither can ship, so Classic draws the world in Nunito too, as its CSS already draws its titles
 * in Nunito where the client used VAG Rounded (style.css --font-classic-title).
 *
 * Canvas text never redraws when a font arrives later, and Pixi caches a font's measured height, so
 * the font is loaded before the first street draws (loadWorldFont, awaited with the signposts in
 * street-render.js loadSignpostTextures) and the cached metrics are dropped once it has.
 */

/** Nunito first, then a plain sans-serif every phone has. */
export const WORLD_FONT_FAMILY = 'Nunito, "Helvetica Neue", Arial, sans-serif';

/** The faces the world draws: Nunito is one variable file per style (weights 200-1000); the world has no italic. */
export const WORLD_FONT_FACES = Object.freeze(['700 16px Nunito']);

/** How long a street waits for the font before it draws with the fallback. */
const WORLD_FONT_WAIT_MS = 3000;

/**
 * A Pixi text style in the world font: `style` keeps its size, weight, colours and the rest; the
 * family is always this module's.
 * @param {Record<string, unknown>} [style]
 */
export function worldTextStyle(style = {}) {
  return { ...style, fontFamily: WORLD_FONT_FAMILY };
}

/**
 * A canvas 2D `font` (or CSS font shorthand, for a DOM copy of a world text) in the world font:
 * worldCanvasFont(11) is '11px Nunito, ...', worldCanvasFont(39, '700') '700 39px Nunito, ...'.
 */
export function worldCanvasFont(size, weight = '') {
  return `${weight ? `${weight} ` : ''}${size}px ${WORLD_FONT_FAMILY}`;
}

/**
 * A player's or companion Glitch's name over its head (game.js makeLocalCompanion, the realtime
 * feature's other players): one style for both.
 */
export const NAMEPLATE_STYLE = Object.freeze(worldTextStyle({
  fontSize: 12,
  fill: 0x4e4943,
  fontWeight: '700',
  dropShadow: { alpha: 0.92, blur: 2, color: 0xffffff, distance: 0 },
}));

/**
 * Name labels drawn in the world (vendors, garden beds): light text with a dark outline and a soft
 * shadow, so they read over dark forests and pale skies alike.
 * @param {number} fontSize
 */
export function worldLabelStyle(fontSize) {
  return worldTextStyle({
    fontSize,
    fontWeight: '700',
    fill: 0xfffaf0,
    stroke: { color: 0x2b2418, width: 3, join: 'round' },
    dropShadow: { color: 0x000000, alpha: 0.35, blur: 2, distance: 1, angle: Math.PI / 2 },
  });
}

/**
 * Pixi's own default family (Arial) becomes the world font, for a text made with no family at all.
 * Install once, before the first text is made.
 * @param {typeof import('pixi.js')} PIXI
 */
export function installWorldText(PIXI) {
  const defaults = PIXI?.TextStyle?.defaultTextStyle;
  if (defaults) defaults.fontFamily = WORLD_FONT_FAMILY;
}

let worldFont = null;

/**
 * Loads the world font's faces. Resolves true once they are in, false without document.fonts, on
 * an error or after `wait` (that street keeps the fallback; the next call asks again). Once in,
 * Pixi's cached text metrics are dropped, so nothing keeps a fallback face's height.
 * @param {number} [wait]
 * @param {typeof import('pixi.js')} [PIXI]
 */
export function loadWorldFont(wait = WORLD_FONT_WAIT_MS, PIXI = globalThis.PIXI) {
  if (worldFont) return worldFont;
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  if (!fonts || typeof fonts.load !== 'function') return Promise.resolve(false);
  const loads = WORLD_FONT_FACES.map((face) => Promise.resolve(fonts.load(face)).then((got) => Array.isArray(got) && got.length > 0, () => false));
  const asking = Promise.race([
    Promise.all(loads).then((all) => all.every(Boolean)),
    new Promise((resolve) => setTimeout(() => resolve(false), wait)),
  ]);
  worldFont = asking.then((ok) => {
    if (!ok) worldFont = null;
    else PIXI?.CanvasTextMetrics?.clearMetrics?.();
    return ok;
  });
  return worldFont;
}
