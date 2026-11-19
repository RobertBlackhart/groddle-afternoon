/**
 * FLICKER (Austin 2026-11-19, Switchback at the right end: "a bottom light brown background on
 * the right side ... it flickers"): long thin quads cut into pieces the GPU always draws.
 *
 * A rect or a sprite is two triangles split along its diagonal. On the Framework's Intel GPU
 * (Mesa, through ANGLE on Vulkan and on OpenGL alike) the second triangle of a long thin quad is
 * sometimes not drawn at all, depending on where the camera puts it: the skirt's deep fill
 * (6,900 x 88 world px) lost its lower-right half at 21% of camera positions, so the lighter
 * band under it flashed in the bottom-right corner while walking. Austin's MacBook showed the same.
 * Measured in a raw WebGL copy of Pixi's batch draw at render resolution 2.9 (SwiftShader never
 * drops it):
 *
 *   dropped: 6900x88 (78:1), 2900x40 (73:1), 2048x20 (102:1), 800x8 (100:1), 700x3 (233:1)
 *   always drawn: 6900x108 (64:1), 4096x64 (64:1), 2048x40 (51:1), 3500x80 (44:1),
 *                 500x2 and 256x1 (1,450 and 742 device px long, at any shape)
 *
 * So it is the shape, not the size: at most 64:1 was always drawn, at any length; 70:1 and
 * thinner dropped once longer than about 2,000 device px. Pieces here are at most 32:1, or
 * QUAD_SHORT long (1,024 device px at the top resolution, render-density MAX_RENDER_RESOLUTION 4),
 * and never more than QUAD_SPAN.
 */

/** A piece's widest length to height: half the thinnest shape always drawn (64:1). */
export const QUAD_ASPECT_MAX = 32;

/** World px a piece may run whatever its height (1,024 device px at resolution 4; 1,450 measured fine). */
export const QUAD_SHORT = 256;

/** The longest piece in any case, in world px. */
export const QUAD_SPAN = 2048;

/** PURE: the longest piece a quad `thickness` world px thick is cut into. */
export function quadPieceLength(thickness) {
  const t = Math.abs(Number(thickness) || 0);
  return Math.min(QUAD_SPAN, Math.max(QUAD_SHORT, Math.floor(QUAD_ASPECT_MAX * t)));
}

/**
 * PURE: [x, x + length) cut into consecutive pieces for a quad `thickness` px thick: [{ x, w }].
 * `max` caps the piece length (quadPieceLength by default). Pieces meet edge to edge.
 */
export function quadSpans(x, length, thickness, max = quadPieceLength(thickness)) {
  const start = Number(x) || 0;
  const total = Math.max(0, Number(length) || 0);
  const step = Math.max(1, Number(max) || QUAD_SPAN);
  const out = [];
  for (let at = 0; at < total; at += step) out.push({ x: start + at, w: Math.min(step, total - at) });
  return out;
}

/** A filled rect on Pixi Graphics `g` drawn as pieces (quadSpans). Returns `g`. */
export function wideRect(g, x, y, w, h, fill) {
  for (const s of quadSpans(x, w, h)) g.rect(s.x, y, s.w, h).fill(fill);
  return g;
}
