/**
 * ON-SCREEN SHARP ART (G961, Austin 2026-11-17: "draw it sharp"): art too big to keep decoded at
 * 3x (the Scion of Purple: 118 frames up to 2160 x 1269 at 3x, about 720 MB as RGBA sheets) is
 * drawn sharp only while something on screen plays it, and only where that costs nothing a
 * player would feel.
 *
 * - The art: js/sprite-onscreen.js (tools/vector-sprites, manifest "onScreen"): Tiny Speck's
 *   vector SWF (CC0) at 3x, frame-matched to the 1x sheet, each frame cropped to its own box
 *   and packed per label into KTX2 atlases (Basis Universal ETC1S). The worker transcodes them
 *   to a format the GPU keeps compressed (BC7, ASTC 4x4, ETC2 or BC3: one byte a texel, a
 *   quarter of RGBA), with Pixi's own KTX2 loader and libktx, served from vendor/pixi.
 * - Who: only a computer (never the phone gate's phone, window.GRODDLE_DEVICE), drawing at 1.5 or
 *   more device px per world px, that does not report low memory (navigator.deviceMemory under
 *   4 GB), whose GPU takes the atlas size (max texture side) and keeps one of those compressed
 *   formats. Everyone else keeps the 1x sheet and loads nothing new (sharpAllowed).
 * - When: hold(path, label) fetches that label's atlases (the caller holds what is playing and
 *   what plays next); release(path, label) destroys them, GPU copy and all, once nothing holds
 *   them. Until a label is in, frames() is null and the 1x frames draw.
 * QA: ?onscreensharp=off keeps the 1x (before/after measurements); the Purple Journey publishes
 * what it holds as the canvas's data-purple-sharp.
 */

import { ONSCREEN_SPRITES } from './sprite-onscreen.js?v=cdeffc77';

/** Under this many GB (navigator.deviceMemory, Chrome's rounded figure) a device keeps the 1x. */
export const LOW_MEMORY_GB = 4;
/** Below this many device px per world px the 1x art already fills the screen. */
export const MIN_RESOLUTION = 1.5;
/** GPU formats the transcoder may pick that stay compressed (js: Pixi's KTX2 worker order). */
export const COMPRESSED_FORMATS = ['bc7-rgba-unorm', 'astc-4x4-unorm', 'etc2-rgba8unorm', 'bc3-rgba-unorm'];
/** Pixi's KTX2 transcoder (libktx, Apache-2.0), self-hosted: the default URLs are a CDN's. */
export const KTX_TRANSCODER = Object.freeze({
  jsUrl: 'vendor/pixi/transcoders-8.23.0/ktx/libktx.js',
  wasmUrl: 'vendor/pixi/transcoders-8.23.0/ktx/libktx.wasm',
});

/** PURE: the largest atlas side in ONSCREEN_SPRITES (or the given map). */
export function largestAtlasSide(map = ONSCREEN_SPRITES) {
  let side = 0;
  for (const entry of map.values()) {
    for (const atlases of Object.values(entry.groups)) for (const [, w, h] of atlases) side = Math.max(side, w, h);
  }
  return side;
}

/**
 * PURE: whether this device may load on-screen sharp art, and why not.
 * @param {{ device?: string|null, resolution?: number, deviceMemory?: number|null, maxTextureSize?: number,
 *   formats?: string[], off?: boolean, atlasSide?: number }} env
 * @returns {{ ok: boolean, reason: string }}
 */
export function sharpAllowed({ device = null, resolution = 1, deviceMemory = null, maxTextureSize = 0, formats = [], off = false, atlasSide = largestAtlasSide() } = {}) {
  if (off) return { ok: false, reason: 'off' };
  if (device === 'phone') return { ok: false, reason: 'phone' };
  if (!(Number(resolution) >= MIN_RESOLUTION)) return { ok: false, reason: 'resolution' };
  if (deviceMemory != null && Number(deviceMemory) < LOW_MEMORY_GB) return { ok: false, reason: 'low memory' };
  if (!(Number(maxTextureSize) >= atlasSide)) return { ok: false, reason: 'max texture size' };
  if (!COMPRESSED_FORMATS.some((f) => formats.includes(f))) return { ok: false, reason: 'no compressed format' };
  return { ok: true, reason: '' };
}

/** PURE: bytes a TextureSource takes on the GPU (one byte a texel for the 4x4 block formats). */
export function textureBytes(source) {
  const px = (source?.pixelWidth || 0) * (source?.pixelHeight || 0);
  const format = String(source?.format || '');
  if (/^(bc1|bc4|etc2-rgb8|eac-r11)/.test(format)) return px / 2;
  if (/^(bc|astc-4x4|etc2|eac)/.test(format)) return px;
  return px * 4;
}

/** What each COMPRESSED_FORMATS entry needs: a WebGL extension, or a WebGPU feature. */
const FORMAT_NEEDS = {
  'bc7-rgba-unorm': ['EXT_texture_compression_bptc', 'texture-compression-bc'],
  'astc-4x4-unorm': ['WEBGL_compressed_texture_astc', 'texture-compression-astc'],
  'etc2-rgba8unorm': ['WEBGL_compressed_texture_etc', 'texture-compression-etc2'],
  'bc3-rgba-unorm': ['WEBGL_compressed_texture_s3tc', 'texture-compression-bc'],
};

/**
 * The compressed formats the game's own renderer can upload, in the transcoder's order. Pixi's
 * getSupportedTextureFormats asks a separate WebGL 1 context, which may offer what the game's
 * WebGL 2 context does not.
 */
export function rendererCompressedFormats(renderer) {
  try {
    const gl = renderer?.gl;
    if (gl) {
      const have = new Set(gl.getSupportedExtensions() || []);
      return COMPRESSED_FORMATS.filter((f) => have.has(FORMAT_NEEDS[f][0]) && gl.getExtension(FORMAT_NEEDS[f][0]));
    }
    const features = renderer?.gpu?.device?.features;
    return features ? COMPRESSED_FORMATS.filter((f) => features.has(FORMAT_NEEDS[f][1])) : [];
  } catch {
    return [];
  }
}

/** The renderer's largest texture side (WebGL or WebGPU), or 0. */
export function maxTextureSizeOf(renderer) {
  try {
    const gl = renderer?.gl;
    if (gl) return Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0;
    return Number(renderer?.gpu?.device?.limits?.maxTextureDimension2D) || 0;
  } catch {
    return 0;
  }
}

/**
 * The default atlas loader (`formats`: rendererCompressedFormats, so the worker transcodes to one the
 * renderer takes): Pixi's KTX2 worker, transcoder from vendor/pixi, data URL keyed by
 * js/data-urls.js. Resolves a CompressedSource at the art's density (frames in 1x units).
 */
export function ktx2Loader(PIXI, formats, base = globalThis.document?.baseURI || globalThis.location?.href || '') {
  const abs = (u) => new URL(u, base).href;
  let ready = false;
  return async (url, density) => {
    if (!ready) {
      PIXI.setKTXTranscoderPath({ jsUrl: abs(KTX_TRANSCODER.jsUrl), wasmUrl: abs(KTX_TRANSCODER.wasmUrl) });
      ready = true;
    }
    const keyed = globalThis.groddleDataUrl ? globalThis.groddleDataUrl(url) : url;
    const options = await PIXI.loadKTX2onWorker(abs(keyed), formats);
    // TextureSource multiplies width and height by the resolution: pass them in 1x units. The atlases hold
    // premultiplied colour (tools/vector-sprites writeOnScreen).
    return new PIXI.CompressedSource({
      ...options,
      width: options.width / density,
      height: options.height / density,
      resolution: density,
      alphaMode: 'premultiplied-alpha',
      label: url,
      autoGarbageCollect: false,
    });
  };
}

/**
 * The holder. `load(url, density)` resolves a TextureSource (ktx2Loader in the game; tests pass
 * their own). `allowed` is sharpAllowed's verdict: when it says no, hold() loads nothing.
 * `onReady(path, label)` runs when a held label's frames arrive.
 */
export function createOnscreenSharp({ PIXI, load, allowed = { ok: false, reason: 'unset' }, onReady = null, sprites = ONSCREEN_SPRITES }) {
  /** `${path}#${label}` -> { path, label, refs, frames: Map<cell, Texture>|null, sources, promise } */
  const held = new Map();
  let loads = 0;
  let released = 0;

  const free = (entry) => {
    for (const t of entry.frames?.values() || []) if (!t.destroyed) t.destroy(false);
    for (const s of entry.sources || []) if (!s.destroyed) s.destroy();
    entry.frames = null;
    entry.sources = [];
    released += 1;
  };

  const start = (entry) => {
    const art = sprites.get(entry.path);
    const atlases = art?.groups?.[entry.label] || [];
    loads += atlases.length;
    entry.promise = Promise.all(atlases.map(([url]) => load(url, art.density))).then((sources) => {
      if (entry.refs <= 0) {
        for (const s of sources) s?.destroy?.();
        return false;
      }
      const d = art.density;
      const orig = new PIXI.Rectangle(0, 0, art.fw, art.fh);
      const frames = new Map();
      atlases.forEach(([, , , list], i) => {
        for (const [cell, x, y, w, h, cx, cy] of list) {
          frames.set(cell, new PIXI.Texture({
            source: sources[i],
            frame: new PIXI.Rectangle(x / d, y / d, w / d, h / d),
            orig,
            trim: new PIXI.Rectangle(cx / d, cy / d, w / d, h / d),
          }));
        }
      });
      entry.sources = sources;
      entry.frames = frames;
      onReady?.(entry.path, entry.label);
      return true;
    }).catch(() => {
      // A failed load keeps the 1x; the entry stays so it is not fetched again this hold.
      return false;
    });
  };

  return {
    allowed,
    /** Hold a label's sharp frames (fetched on first hold). False when this device keeps the 1x. */
    hold(path, label) {
      if (!allowed.ok || !sprites.get(path)?.groups?.[label]) return false;
      const key = `${path}#${label}`;
      let entry = held.get(key);
      if (!entry) {
        entry = { path, label, refs: 0, frames: null, sources: [], promise: null };
        held.set(key, entry);
      }
      entry.refs += 1;
      if (!entry.promise) start(entry);
      return true;
    },
    /** Let go of a label; at no holders its textures and GPU copies are destroyed. */
    release(path, label) {
      const key = `${path}#${label}`;
      const entry = held.get(key);
      if (!entry) return;
      entry.refs -= 1;
      if (entry.refs > 0) return;
      held.delete(key);
      free(entry);
    },
    /** The sharp Texture per sheet cell for a held label once it is in (blank cells absent), else null. */
    frames(path, label) {
      return held.get(`${path}#${label}`)?.frames || null;
    },
    /** Drop everything (a scene teardown). */
    releaseAll() {
      for (const entry of held.values()) free(entry);
      held.clear();
    },
    /** QA: what is held, and GPU bytes. */
    stats() {
      const rows = [...held.values()].map((e) => ({
        path: e.path,
        label: e.label,
        refs: e.refs,
        loaded: Boolean(e.frames),
        format: e.sources[0]?.format || '',
        gpuMB: +(e.sources.reduce((a, s) => a + textureBytes(s), 0) / 1048576).toFixed(1),
      }));
      return { allowed: allowed.ok, reason: allowed.reason, loads, released, held: rows, gpuMB: +rows.reduce((a, r) => a + r.gpuMB, 0).toFixed(1) };
    },
  };
}
