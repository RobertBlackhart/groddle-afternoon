/**
 * G1174: a deco's own blur, drawn at its own size whatever the deco's w x h.
 *
 * Flash drew a filter at its own size in screen px: DecoRenderer.as syncRendererWithModel scaled a
 * deco's art to its placed w x h (decoAsset.scaleX = w / the SWF stage width) but never the
 * BlurFilter a child of it carried. The deco files are rendered once at the SWF's stage size
 * (tools/deco-pipeline/build.py), so the blur is baked in at the stage's scale, and a deco squashed
 * to a fraction of its stage drew a hard edge: Egret Taun Towers Basement's box_blur_1 under the
 * ceiling, 255 px of a 633 px stage, drew its 75 px blur 30 px wide, a hard black band.
 *
 * blurFix says how much blur a placement lost on each axis (a box blur of that width, three times,
 * as Flash's quality 3 did; blurs add by their variance); blurredDecoCanvas draws the deco at its
 * placed size with that blur added, on a canvas padded for the spread. A placement drawn larger than
 * its stage keeps the file's blur (wider than Flash's, never sharper).
 */
import { DECO_BLURS } from './deco-blur-data.js';

/**
 * Which placements get their blur back: an axis drawn at under BLUR_FIX_SCALE of its stage (the file
 * keeps under half the blur Flash drew) that lost at least BLUR_FIX_MIN px (a box's width, world px).
 * A milder squash looks the same, and each fix is a canvas blurred as the street loads.
 */
export const BLUR_FIX_SCALE = 0.5;
export const BLUR_FIX_MIN = 20;
/** The canvas's longest side: the blurred art is soft, so a smaller copy draws the same. */
export const BLUR_CANVAS_MAX = 512;

/**
 * PURE: the blur a deco `name` drawn at w x h lost to its squash, or null: { ex, ey } (the box width
 * to add on each axis, world px) and { px, py } (the padding its spread needs, 1.5 boxes a side).
 */
export function blurFix(name, w, h, table = DECO_BLURS) {
  const row = table?.[name];
  if (!row || !(w > 0) || !(h > 0)) return null;
  const [sw, sh, bx, by] = row;
  const lost = (b, s) => (s < BLUR_FIX_SCALE ? Math.sqrt(Math.max(0, b * b - (b * s) ** 2)) : 0);
  const ex = lost(bx, w / sw);
  const ey = lost(by, h / sh);
  if (Math.max(ex, ey) < BLUR_FIX_MIN) return null;
  const r = (n) => Math.round(n * 100) / 100;
  return { ex: r(ex), ey: r(ey), px: Math.ceil(1.5 * ex), py: Math.ceil(1.5 * ey) };
}

/** Three running box blurs of `width` px along one axis of premultiplied RGBA `d` (w x h). */
function boxBlur3(d, w, h, width, horizontal) {
  const r = Math.max(0, Math.round((width - 1) / 2));
  if (!r) return;
  const n = horizontal ? w : h;
  const lines = horizontal ? h : w;
  const step = horizontal ? 4 : w * 4;
  const line = new Float32Array(n * 4);
  const out = new Float32Array(n * 4);
  const k = 1 / (2 * r + 1);
  for (let l = 0; l < lines; l += 1) {
    const base = horizontal ? l * w * 4 : l * 4;
    for (let i = 0; i < n; i += 1) for (let c = 0; c < 4; c += 1) line[i * 4 + c] = d[base + i * step + c];
    for (let pass = 0; pass < 3; pass += 1) {
      for (let c = 0; c < 4; c += 1) {
        let sum = 0;
        for (let i = -r; i <= r; i += 1) if (i >= 0 && i < n) sum += line[i * 4 + c];
        for (let i = 0; i < n; i += 1) {
          out[i * 4 + c] = sum * k;
          const add = i + r + 1;
          const drop = i - r;
          if (add < n) sum += line[add * 4 + c];
          if (drop >= 0) sum -= line[drop * 4 + c];
        }
      }
      line.set(out);
    }
    for (let i = 0; i < n; i += 1) for (let c = 0; c < 4; c += 1) d[base + i * step + c] = line[i * 4 + c];
  }
}

/**
 * The deco's image drawn at w x h with `fix`'s blur added, on a canvas (w + 2 px) x (h + 2 py) in
 * world px scaled to at most BLUR_CANVAS_MAX a side: { canvas, scale } (canvas px per world px).
 */
export function blurredDecoCanvas(image, w, h, fix, doc = globalThis.document) {
  const W = w + 2 * fix.px;
  const H = h + 2 * fix.py;
  const scale = Math.min(1, BLUR_CANVAS_MAX / Math.max(W, H));
  const cw = Math.max(1, Math.round(W * scale));
  const ch = Math.max(1, Math.round(H * scale));
  const canvas = doc.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, fix.px * scale, fix.py * scale, w * scale, h * scale);
  const img = ctx.getImageData(0, 0, cw, ch);
  const d = new Float32Array(img.data.length);
  for (let i = 0; i < d.length; i += 4) {
    const a = img.data[i + 3] / 255;
    d[i] = img.data[i] * a;
    d[i + 1] = img.data[i + 1] * a;
    d[i + 2] = img.data[i + 2] * a;
    d[i + 3] = img.data[i + 3];
  }
  boxBlur3(d, cw, ch, fix.ex * scale, true);
  boxBlur3(d, cw, ch, fix.ey * scale, false);
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    const un = a > 0 ? 255 / a : 0;
    img.data[i] = Math.min(255, Math.round(d[i] * un));
    img.data[i + 1] = Math.min(255, Math.round(d[i + 1] * un));
    img.data[i + 2] = Math.min(255, Math.round(d[i + 2] * un));
    img.data[i + 3] = Math.min(255, Math.round(a));
  }
  ctx.putImageData(img, 0, 0);
  return { canvas, scale };
}
