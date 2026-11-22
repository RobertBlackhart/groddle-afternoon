/**
 * Vector avatar looks: the saved appearance (js/character-builder.js,
 * bodyStyle 'vector') as article names, real GSJS colourways and palette
 * colours, resolved against assets/avatar/catalog.json into the look the
 * compositor draws (js/avatar-compositor.js).
 *
 * Saved shape (all optional; missing parts fall back to the catalog default):
 *   outfit:  { eyes, mouth, nose, ears, hair, hat, shirt, coat, dress, pants, skirt, shoes } -> article name | 'none'
 *   variant: { [type]: index into the article's GSJS colourways }
 *   tint:    { [type]: 'rrggbb' }  custom color_1 (overrides the colourway's)
 *   skinColor / hairColor: GSJS data_avatar_colors id, or skinTint / hairTint 'rrggbb'
 *   face:    { eye_scale, eye_dist, eye_height, ... } (AvatarConfig numbers)
 */

import { applyCM, colorMatrixFor } from './avatar-rig.js?v=b67f0da8';

/** Article types the builder offers, in tab order. */
export const LOOK_TYPES = Object.freeze(['hair', 'hat', 'eyes', 'mouth', 'nose', 'ears', 'shirt', 'coat', 'dress', 'pants', 'skirt', 'shoes']);
/** Types a look may leave empty. */
export const OPTIONAL_TYPES = Object.freeze(['hat', 'coat', 'dress', 'skirt', 'hair', 'shirt', 'pants', 'shoes', 'nose', 'ears']);

/**
 * The face sliders: Vanity's groups and order (glitch-client DimsPane.as 35-48), their labels
 * (VanityModel.as dims_name_map) and the 2012 client's ranges (the game page's ava_settings,
 * 2012-04-27). Heights and widths were whole pixels there ("int"), scales a number. `def` is the
 * rig's value for a look that never set one (js/avatar-rig.js faceNumbers).
 */
export const FACE_DIMS = Object.freeze([
  { part: 'eyes', label: 'Eyes', settings: [
    { key: 'eye_scale', label: 'Size', min: 0.65, max: 1.2, step: 0.01, def: 1 },
    { key: 'eye_height', label: 'Height', min: -5, max: 5, step: 1, def: 0 },
    { key: 'eye_dist', label: 'Width', min: -3, max: 2, step: 1, def: 0 },
  ] },
  { part: 'nose', label: 'Nose', settings: [
    { key: 'nose_scale', label: 'Size', min: 0.65, max: 1.45, step: 0.01, def: 1 },
    { key: 'nose_height', label: 'Height', min: -5, max: 6, step: 1, def: 0 },
  ] },
  { part: 'mouth', label: 'Mouth', settings: [
    { key: 'mouth_scale', label: 'Size', min: 0.75, max: 1.45, step: 0.01, def: 1 },
    { key: 'mouth_height', label: 'Height', min: -3, max: 4, step: 1, def: 0 },
  ] },
  { part: 'ears', label: 'Ears', settings: [
    { key: 'ears_scale', label: 'Size', min: 0.6, max: 1.2, step: 0.01, def: 1 },
    { key: 'ears_height', label: 'Height', min: -4, max: 1, step: 1, def: 0 },
  ] },
].map((g) => Object.freeze({ ...g, settings: Object.freeze(g.settings.map((d) => Object.freeze(d))) })));
const FACE_DIM_BY_KEY = new Map(FACE_DIMS.flatMap((g) => g.settings.map((d) => [d.key, d])));

const HEX = /^[0-9a-f]{6}$/i;
export const cleanHex = (v) => {
  const s = String(v ?? '').replace(/^#/, '').toLowerCase();
  return HEX.test(s) ? s : null;
};

/** A solid colorize (tintAmount 100) like the palettes use. */
export function tintColor(hex) {
  return { tintColor: hex, tintAmount: '100', brightness: '0', saturation: '0', contrast: '0', alpha: '100' };
}

/**
 * catalog.json packs each GSJS colour filter (article colourways, palettes)
 * as one string of these fields joined by spaces (tools/avatar-compositor
 * build.mjs packColors).
 */
export const COLOR_FIELDS = Object.freeze(['tintColor', 'brightness', 'saturation', 'contrast', 'tintAmount', 'alpha']);

function unpackColors(colors) {
  const out = {};
  for (const [k, v] of Object.entries(colors || {})) {
    if (typeof v !== 'string') { out[k] = v; continue; }
    const vals = v.split(' ');
    out[k] = Object.fromEntries(COLOR_FIELDS.map((f, i) => [f, vals[i] ?? '']));
  }
  return out;
}

/** catalog.json as loaded, with its packed colours back as objects. Idempotent (marks the catalog). */
export function expandCatalog(catalog) {
  if (!catalog || catalog.colorsExpanded) return catalog;
  for (const items of Object.values(catalog.types || {})) {
    for (const item of items) for (const v of item.variants || []) v.colors = unpackColors(v.colors);
  }
  for (const list of Object.values(catalog.palettes || {})) for (const p of list) p.colors = unpackColors(p.colors);
  catalog.colorsExpanded = true;
  return catalog;
}

/** Catalog lookup helpers. */
export function catalogItem(catalog, type, name) {
  return catalog?.types?.[type]?.find((i) => i.name === name) || null;
}

/** The default saved look (catalog.defaultLook) as saved fields. */
export function defaultVectorFields(catalog) {
  const d = catalog?.defaultLook || {};
  return normalizeVectorFields({ outfit: d.outfit, variant: d.variant, tint: d.tint, skinColor: d.skinColor, hairColor: d.hairColor, skinTint: d.skinTint, hairTint: d.hairTint, face: d.face }, catalog);
}

/**
 * Clean saved vector fields: names must exist in the catalog (when given),
 * hat and hair rules are left to the rig (slotAssignments).
 */
export function normalizeVectorFields(raw = {}, catalog = null) {
  const out = { outfit: {}, variant: {}, tint: {}, face: {} };
  const outfit = raw.outfit || {};
  for (const type of LOOK_TYPES) {
    let name = outfit[type];
    if (name && typeof name === 'object') name = name.name;
    if (typeof name !== 'string' || !name) continue;
    if (name !== 'none' && catalog && !catalogItem(catalog, type, name)) continue;
    out.outfit[type] = name;
  }
  for (const [type, v] of Object.entries(raw.variant || {})) {
    const n = Math.trunc(Number(v));
    if (LOOK_TYPES.includes(type) && Number.isFinite(n) && n >= 0) out.variant[type] = n;
  }
  for (const [type, v] of Object.entries(raw.tint || {})) {
    const hex = cleanHex(v);
    if (LOOK_TYPES.includes(type) && hex) out.tint[type] = hex;
  }
  for (const k of ['skinColor', 'hairColor']) {
    const n = Math.trunc(Number(raw[k]));
    if (Number.isFinite(n) && n > 0) out[k] = n;
  }
  for (const k of ['skinTint', 'hairTint']) {
    const hex = cleanHex(raw[k]);
    if (hex) out[k] = hex;
  }
  for (const k of ['eye_scale', 'eye_dist', 'eye_height', 'nose_scale', 'nose_height', 'mouth_scale', 'mouth_height', 'ears_scale', 'ears_height']) {
    const n = Number(raw.face?.[k]);
    // -5..5, or the slider's wider 2012 range (nose_height went to 6).
    const dim = FACE_DIM_BY_KEY.get(k);
    if (Number.isFinite(n)) out.face[k] = Math.max(Math.min(-5, dim.min), Math.min(Math.max(5, dim.max), n));
  }
  return out;
}

/** Colours for an article: its colourway, then a custom color_1 tint. */
export function articleColors(item, variantIndex = 0, tintHex = null) {
  const variants = item?.variants || [];
  const v = variants[Math.min(Math.max(0, variantIndex | 0), Math.max(0, variants.length - 1))];
  const colors = { ...(v?.colors || item?.colors || {}) };
  if (tintHex) colors.color_1 = tintColor(tintHex);
  return colors;
}

/**
 * Palette colours. Skin is a flat hard-light tint (skin_tint_color, see
 * avatar-rig.js hardLightMatrix); hair uses the palette's colour filters.
 */
function paletteColors(catalog, slot, id, hex) {
  const entry = hex ? null : catalog?.palettes?.[slot]?.find((p) => p.id === id);
  if (slot === 'skin') {
    const tint = hex || cleanHex(entry?.color);
    return tint ? { tint } : null;
  }
  // A custom hair colour needs its highlight layer too (color_10, drawn over
  // color_1): shaped like the palette's, a brighter, contrastier same hue.
  if (hex) return { color_1: tintColor(hex), color_10: { ...tintColor(hex), brightness: '20', saturation: '-20', contrast: '80' } };
  return entry?.colors || null;
}

/**
 * The compositor look for saved vector fields: missing parts use the
 * catalog default; 'none' leaves the slot empty.
 */
export function resolveLook(fields, catalog) {
  const f = normalizeVectorFields(fields, catalog);
  const d = catalog?.defaultLook || {};
  const outfit = {};
  for (const type of LOOK_TYPES) {
    const name = f.outfit[type] ?? (typeof d.outfit?.[type] === 'object' ? d.outfit[type].name : d.outfit?.[type]);
    if (!name || name === 'none') continue;
    const item = catalogItem(catalog, type, name);
    if (!item) continue;
    const defVariant = d.variant?.[type] ?? 0;
    const sameAsDefault = name === (d.outfit?.[type]?.name ?? d.outfit?.[type]);
    const variant = f.variant[type] ?? (sameAsDefault ? defVariant : 0);
    const tint = f.tint[type] ?? (sameAsDefault && f.variant[type] === undefined ? cleanHex(d.tint?.[type]) : null);
    outfit[type] = { name, colors: articleColors(item, variant, tint) };
  }
  const skinId = f.skinColor ?? (f.skinTint ? null : d.skinColor);
  const hairId = f.hairColor ?? (f.hairTint ? null : d.hairColor);
  return {
    outfit,
    colors: {
      skin: paletteColors(catalog, 'skin', skinId, f.skinTint ?? (f.skinColor ? null : cleanHex(d.skinTint))) || {},
      hair: paletteColors(catalog, 'hair', hairId, f.hairTint ?? (f.hairColor ? null : cleanHex(d.hairTint))) || {},
    },
    face: { ...(d.face || {}), ...f.face },
  };
}

/** Stable key for a resolved look (texture cache). */
export function lookKey(look) {
  const parts = [];
  for (const type of LOOK_TYPES) {
    const a = look.outfit?.[type];
    if (!a) continue;
    parts.push(`${type}=${a.name}:${JSON.stringify(a.colors)}`);
  }
  parts.push(`skin=${JSON.stringify(look.colors?.skin || {})}`, `hair=${JSON.stringify(look.colors?.hair || {})}`, `face=${JSON.stringify(look.face || {})}`);
  return parts.join('|');
}

const rgbHex = (c) => [c.r, c.g, c.b].map((v) => Math.max(0, Math.min(255, Math.round(Number(v) || 0))).toString(16).padStart(2, '0')).join('');

/**
 * Carry a v1 recoloured look (hair/skin/shirt/pants/shoes RGB) onto the
 * vector default outfit as palette-style tints, so a player's chosen
 * colours survive the move off the raster sheets.
 */
export function vectorFieldsFromColors(app) {
  const fields = { tint: {} };
  if (app?.skin) fields.skinTint = rgbHex(app.skin);
  if (app?.hair) fields.hairTint = rgbHex(app.hair);
  if (app?.shirt) fields.tint.shirt = rgbHex(app.shirt);
  if (app?.pants) fields.tint.pants = rgbHex(app.pants);
  if (app?.shoes) fields.tint.shoes = rgbHex(app.shoes);
  return normalizeVectorFields(fields);
}

/**
 * #611 (G1144): how far apart two colours look, 0 (the same) to 255 (black and white): a weighted
 * RGB distance ("redmean"), close enough to the eye's for telling swatches apart.
 */
export function colourDistance(a, b) {
  const rm = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db) / 3;
}

/** Two colours closer than this read as the same chip at swatch size. */
export const SWATCH_NEAR = 24;

/** The light grey a colour slot's art is drawn in before its filter (the rig tints it, avatar-rig.js colorMatrixFor). */
const SLOT_BASE = Object.freeze([208, 208, 208, 1]);

/**
 * The colour one slot of a colourway shows: its GSJS filter on the slot's light art, as the rig
 * draws it, [r, g, b]; the bare art for a slot the colourway leaves untinted; null for a slot it
 * hides (alpha 0, as a top hat's unused colour_N layers are).
 */
export function slotColour(color) {
  if (!color) return SLOT_BASE.slice(0, 3);
  const [r, g, b, a] = applyCM(colorMatrixFor(color), SLOT_BASE);
  if (!(a > 0.05)) return null;
  return [r, g, b].map((v) => Math.round(v));
}

const hexOf = (rgb) => rgb.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');

/** How far apart one slot looks in two colourways: a slot shown in one and hidden in the other is as far as it gets. */
function slotGap(a, b) {
  if (!a && !b) return 0;
  if (!a || !b) return 255;
  return colourDistance(a, b);
}

/**
 * #611 (G1144): the chips for an article's colourways, one per variant: { main, extra } (hex;
 * extra the corner colours, see below). Swatches had been coloured from color_1 alone, so 112 of
 * 343 multi-colourway articles showed near-identical chips (the Rook headpiece's black colourway
 * 707 read pale khaki: its color_1 is the skull). The main colour is the slot, shown in every
 * colourway, that tells the most pairs of them apart; then up to two more, in the chip's corner,
 * each the slot that tells apart the most pairs still alike (none when the main one tells them all
 * apart). Each slot shows its filter as the rig draws it, not the bare tint colour.
 */
export function colourwaySwatches(item) {
  // { main, extra: [hex | null] } per colourway: extra holds the corner slots' colours, null where that colourway hides the slot.
  const variants = item?.variants || [];
  if (!variants.length) return [];
  const slots = [...new Set(variants.flatMap((v) => Object.keys(v.colors || {})))]
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  if (!slots.length) return variants.map(() => ({ main: hexOf(SLOT_BASE.slice(0, 3)), extra: [] }));
  const colours = Object.fromEntries(slots.map((k) => [k, variants.map((v) => slotColour(v.colors?.[k]))]));
  const pairs = [];
  for (let i = 0; i < variants.length; i++) for (let j = i + 1; j < variants.length; j++) pairs.push([i, j]);
  const gaps = Object.fromEntries(slots.map((k) => [k, pairs.map(([i, j]) => slotGap(colours[k][i], colours[k][j]))]));
  const apart = (list) => list.filter((d) => d >= SWATCH_NEAR).length;
  const spread = (list) => list.reduce((n, d) => n + Math.min(d, 128), 0);
  const shown = (k) => colours[k].filter(Boolean).length;
  // The main slot: shown in the most colourways, then telling the most pairs apart; ties keep the lower slot (color_1 first).
  let main = slots[0];
  for (const k of slots) {
    const key = [shown(k), apart(gaps[k]), spread(gaps[k])];
    const was = [shown(main), apart(gaps[main]), spread(gaps[main])];
    if (key[0] > was[0] || (key[0] === was[0] && (key[1] > was[1] || (key[1] === was[1] && key[2] > was[2] + 0.5)))) main = k;
  }
  // Then up to two more slots, each the one that tells apart the most pairs still alike, judged as
  // the chip draws them: a colourway that hides a slot shows its main colour in that corner.
  const neutral = SLOT_BASE.slice(0, 3);
  const mainOf = colours[main].map((c) => c || neutral);
  const drawn = (k) => colours[k].map((c, i) => c || mainOf[i]);
  const drawnGaps = (k) => pairs.map(([i, j]) => colourDistance(drawn(k)[i], drawn(k)[j]));
  const picked = [main];
  let best = pairs.map(([i, j]) => colourDistance(mainOf[i], mainOf[j]));
  while (picked.length < SWATCH_SLOTS) {
    let next = null;
    let nextKey = null;
    let nextGaps = null;
    for (const k of slots) {
      if (picked.includes(k)) continue;
      const g = drawnGaps(k);
      const both = best.map((d, p) => Math.max(d, g[p]));
      if (apart(both) <= apart(best)) continue;
      const key = [apart(both), apart(g), spread(g)];
      if (!nextKey || key[0] > nextKey[0] || (key[0] === nextKey[0] && (key[1] > nextKey[1] || (key[1] === nextKey[1] && key[2] > nextKey[2] + 0.5)))) {
        next = k;
        nextKey = key;
        nextGaps = g;
      }
    }
    if (!next) break;
    picked.push(next);
    best = best.map((d, p) => Math.max(d, nextGaps[p]));
  }
  return variants.map((v, i) => {
    const [m, ...rest] = picked.map((k) => colours[k][i]);
    return { main: hexOf(m || neutral), extra: rest.map((c) => (c ? hexOf(c) : null)) };
  });
}

/** A chip's colours at most: its main colour and two corners. */
export const SWATCH_SLOTS = 3;

/**
 * A chip's CSS background: the main colour, then each extra colour as a band across its lower
 * right corner (a hidden slot leaves the main colour there).
 */
export function swatchBackground(chip) {
  return chipBands(chip).length > 1 ? `linear-gradient(135deg, ${chipBands(chip).map(([c, from, to]) => `#${c} ${from}% ${to}%`).join(', ')})` : `#${chipBands(chip)[0][0]}`;
}

/** PURE: a chip's bands as drawn, [[hex, from %, to %], ...]: the main colour, then each corner (the main colour where hidden). */
export function chipBands(chip) {
  const main = chip?.main || 'd8d8d8';
  const extra = (chip?.extra || []).map((c) => c || main);
  while (extra.length && extra[extra.length - 1] === main) extra.pop();
  if (!extra.length) return [[main, 0, 100]];
  if (extra.length === 1) return [[main, 0, 60], [extra[0], 60, 100]];
  return [[main, 0, 52], [extra[0], 52, 74], [extra[1], 74, 100]];
}

/**
 * A random look from the catalog: every face part, a hair style (a hat one
 * time in four, only with hair it allows), a top (a dress one time in six),
 * a coat one time in four, a bottom, shoes, real colourways and palette
 * colours. Draws from the GSJS wardrobe only: SWF-only articles (swfOnly)
 * stay out, so adding one never reshuffles seeded looks (js/npc-glitch-looks.js).
 */
export function randomVectorFields(catalog, rng = Math.random) {
  const pick = (list) => list[Math.floor(rng() * list.length) % list.length];
  const items = (type) => (catalog?.types?.[type] || []).filter((i) => !i.swfOnly);
  const outfit = {};
  const variant = {};
  const choose = (type) => {
    const list = items(type);
    if (!list.length) return null;
    const item = pick(list);
    outfit[type] = item.name;
    if (item.variants?.length) variant[type] = Math.floor(rng() * item.variants.length) % item.variants.length;
    return item;
  };
  for (const type of ['eyes', 'mouth', 'nose', 'ears', 'hair', 'shoes']) choose(type);
  if (rng() < 1 / 6 && items('dress').length) { choose('dress'); outfit.shirt = 'none'; outfit.pants = 'none'; } else { choose('shirt'); if (rng() < 0.2 && items('skirt').length) { choose('skirt'); outfit.pants = 'none'; } else choose('pants'); }
  if (rng() < 0.25) {
    const hats = items('hat').filter((h) => catalog.hatHair?.[h.name]?.includes(outfit.hair));
    if (hats.length) {
      const h = pick(hats);
      outfit.hat = h.name;
      if (h.variants?.length) variant.hat = Math.floor(rng() * h.variants.length) % h.variants.length;
    }
  }
  if (!outfit.hat) outfit.hat = 'none';
  if (!(rng() < 0.25 && choose('coat'))) outfit.coat = 'none';
  const skin = catalog?.palettes?.skin || [];
  const hair = catalog?.palettes?.hair || [];
  return normalizeVectorFields({ outfit, variant, skinColor: skin.length ? pick(skin).id : undefined, hairColor: hair.length ? pick(hair).id : undefined }, catalog);
}
