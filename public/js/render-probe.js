/**
 * G844 (#393, Firefox on Windows at DPR 3 on a 4K screen): drawing into a render texture came back
 * fully transparent on that GPU, so three pictures drawn off screen were empty: the report's world
 * picture (game.js stageCanvas, black once made a JPEG), the street map's picture (it kept only its
 * lines, js/ui/street-minimap.js snapshotStreetView) and the ground skirt's band (its fade took the
 * raw pale sky colour, js/street-render.js buildGroundSkirt). Not reproduced here, so:
 * - probeRenderTexture: at boot, a small solid square drawn into a render texture and read back,
 *   with the GPU's name and limits, carried in a report's context (renderProbeLine);
 * - pixelsTransparent / canvasTransparent: an all-transparent picture counts as failed wherever a
 *   picture is drawn off screen, and each caller falls back (game.js copies the screen, the map
 *   keeps its lines, the skirt darkens the sky colour);
 * - ensureDepthStencil: every off-screen target gets its depth and stencil before drawing, as the
 *   screen has them (#380b: Firefox drew nothing past a mask into a target without them).
 */

/** Gives a render texture's target its depth and stencil before anything draws into it (#380b). */
export function ensureDepthStencil(renderer, rt) {
  try {
    renderer?.renderTarget?.getRenderTarget?.(rt)?.ensureDepthStencilTexture?.();
  } catch {
    /* a renderer without them (WebGPU makes its own): drawn as before */
  }
  return rt;
}

/** PURE: whether RGBA pixels hold nothing drawn: every alpha at or under `floor`. No pixels: true. */
export function pixelsTransparent(px, floor = 0) {
  if (!px?.length) return true;
  for (let i = 3; i < px.length; i += 4) if (px[i] > floor) return false;
  return true;
}

/**
 * Whether a drawn canvas came back with nothing on it. Small canvases are read whole; a large one
 * is read as a `sample`-wide copy (a picture that drew has its sky or ground across it). A canvas
 * of no size is empty; one that cannot be read (or is not a canvas) counts as drawn: it is used
 * as it is, as before. `doc` null: no copy is made (a large canvas is read whole or not at all).
 */
export function canvasTransparent(canvas, doc = globalThis.document, sample = 96) {
  if (!canvas || typeof canvas !== 'object') return false;
  if (!canvas.width || !canvas.height) return true;
  try {
    const scale = Math.min(1, sample / canvas.width);
    const w = Math.max(1, Math.round(canvas.width * scale));
    const h = Math.max(1, Math.round(canvas.height * scale));
    let ctx = null;
    if (scale === 1 && typeof canvas.getContext === 'function') {
      try { ctx = canvas.getContext('2d', { willReadFrequently: true }); } catch { ctx = null; }
    }
    if (!ctx) {
      if (!doc) return false;
      const c = doc.createElement('canvas');
      c.width = w;
      c.height = h;
      ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(canvas, 0, 0, w, h);
    }
    return pixelsTransparent(ctx.getImageData(0, 0, w, h).data);
  } catch {
    return false;
  }
}

/** The GPU's name as WebGL gives it: RENDERER, or the debug extension's when RENDERER is masked (Chrome). */
function glRendererName(gl) {
  let name = '';
  try { name = String(gl.getParameter(gl.RENDERER) || ''); } catch { name = ''; }
  // Firefox gives the real name in RENDERER (and warns that the extension is going away).
  if (!name || /^WebKit WebGL$/i.test(name)) {
    try {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) name = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || name);
    } catch { /* not offered */ }
  }
  return name;
}

/**
 * Draws an 8 x 8 solid square into a render texture and reads it back, without and with its
 * depth and stencil. Returns { ok, plain, api, gl, maxTexture, maxRenderbuffer, resolution }:
 * ok/plain true when the square came back, false when it came back transparent or threw, null
 * when it could not be tried.
 */
export function probeRenderTexture(PIXI, renderer) {
  const out = { ok: null, plain: null, api: '', gl: '', maxTexture: 0, maxRenderbuffer: 0, resolution: Number(renderer?.resolution) || 0 };
  if (!PIXI?.RenderTexture || !renderer?.extract) return out;
  const gl = renderer.gl || null;
  if (gl) {
    out.api = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext ? 'webgl2' : 'webgl';
    out.gl = glRendererName(gl).slice(0, 120);
    try {
      out.maxTexture = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0;
      out.maxRenderbuffer = Number(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 0;
    } catch { /* a lost context */ }
  } else {
    out.api = 'webgpu';
  }
  const one = (stencil) => {
    let rt = null;
    let g = null;
    try {
      rt = PIXI.RenderTexture.create({ width: 8, height: 8, resolution: out.resolution || 1 });
      if (stencil) ensureDepthStencil(renderer, rt);
      g = new PIXI.Graphics().rect(0, 0, 8, 8).fill(0xff00ff);
      renderer.render({ container: g, target: rt, clear: true, clearColor: [0, 0, 0, 0] });
      const { pixels } = renderer.extract.pixels(rt);
      return !pixelsTransparent(pixels);
    } catch {
      return false;
    } finally {
      g?.destroy();
      rt?.destroy(true);
    }
  };
  out.plain = one(false);
  out.ok = one(true);
  return out;
}

/**
 * PURE: a probe as one short line for a report's context, with the renderer's resolution and the
 * context's restores as they are when the report is written, e.g.
 * "rt ok (plain ok) · res 3 · tex 16384 · rb 16384 · restores 0 · motion reduce · webgl2 · ANGLE (NVIDIA ...)".
 * `motion` is 'reduce' when the device asks for less motion (#529: a phone's "Remove animations"
 * stops the Make panel's flourishes, so the digest says so); otherwise it is left out.
 * G1166 (#621, #622: "restores 2", a skin that lightened and rocks that went invisible): after a
 * restore, or whenever one has been drawn, the line also says how many street bakes the last
 * restore dropped (`dropped`, "bakes dropped N") and how many draws of a destroyed texture there
 * have been since it (`dead`, since boot when there was none: "dead draws N", each drawn as nothing
 * by js/pixi-fixes.js guardDestroyedSources), e.g. "restores 2 · bakes dropped 25 · dead draws 0".
 */
export function renderProbeLine(probe, { resolution, restores = 0, motion = '', dropped = 0, dead = 0 } = {}) {
  if (!probe) return '';
  const word = (v) => (v === true ? 'ok' : v === false ? 'failed' : 'untried');
  const res = Number(resolution ?? probe.resolution) || 0;
  const restored = Number(restores) || 0;
  const deadDraws = Math.max(0, Number(dead) || 0);
  return [
    `rt ${word(probe.ok)} (plain ${word(probe.plain)})`,
    `res ${Math.round(res * 100) / 100}`,
    probe.maxTexture ? `tex ${probe.maxTexture}` : '',
    probe.maxRenderbuffer ? `rb ${probe.maxRenderbuffer}` : '',
    `restores ${restored}`,
    restored > 0 ? `bakes dropped ${Math.max(0, Number(dropped) || 0)}` : '',
    restored > 0 || deadDraws > 0 ? `dead draws ${deadDraws}` : '',
    motion ? `motion ${String(motion).slice(0, 12)}` : '',
    probe.api || '',
    probe.gl || '',
  ].filter(Boolean).join(' · ').slice(0, 200);
}

/* ------------------------------------------------------------------ readback */

/**
 * R29 (#517, a high-resolution AMD machine: a blank street map and a flat brown ground band): there
 * reading an off-screen picture back fails (the probe fails with and without depth and stencil,
 * while pictures drawn off screen still show), and only the report picture fell back to a copy of
 * the screen. Every read of pixels from the GPU goes through here (tests/r29-readback.test.js
 * scans for any other):
 * - readbackCanvas / readbackPixels: `passes` ({ container, transform }) drawn into a render
 *   texture and read back; when the probe failed, or the read throws or comes back with nothing
 *   drawn, the same passes are drawn to the screen and copied in the same task (screenReadback).
 * - readbackExtract: the renderer's own extract for a thing off the stage (the chooser's tile
 *   art), null when it comes back empty; it has no screen copy (the caller has its fallback).
 * - configureReadback: the probe's result, the QA switch (&readback=fail: the probe counts as
 *   failed and no render texture is read, as on that machine), the stage drawn again after a
 *   screen copy, and a count of the copies.
 */
const readback = { failed: false, forced: false, redraw: null, onCopy: null, redrawOwed: false };

/** PURE: whether a probe (probeRenderTexture) says reading a render texture back fails. */
export function readbackFailed(probe) {
  return probe?.ok === false || probe?.plain === false;
}

/** The probe's result, `force` (QA: reads fail as on #517's machine), `redraw()` (the stage to the screen), `onCopy(label)`. */
export function configureReadback({ probe = null, force = false, redraw = null, onCopy = null } = {}) {
  readback.forced = Boolean(force);
  readback.failed = readback.forced || readbackFailed(probe);
  readback.redraw = typeof redraw === 'function' ? redraw : null;
  readback.onCopy = typeof onCopy === 'function' ? onCopy : null;
}

/** Whether render textures are read first (false once the probe failed or QA forced it). */
export function readbackUsesTexture() {
  return !readback.failed;
}

const CLEAR = [0, 0, 0, 0];

/** Draws `passes` into `target` (undefined: the screen), the first clearing it to `clearColor`; `k` scales each one's transform. */
function drawPasses(renderer, passes, target, clearColor, k = 1, Matrix = null) {
  passes.forEach(({ container, transform }, i) => {
    if (!container) return;
    const opts = { container, clear: i === 0 };
    if (target) opts.target = target;
    if (i === 0) opts.clearColor = clearColor;
    let m = transform || null;
    if (k !== 1) {
      // Pixi puts a given transform in place of the container's own: scaled from its own when none is given.
      const b = m || container.localTransform || { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
      const v = [b.a * k, b.b * k, b.c * k, b.d * k, b.tx * k, b.ty * k];
      m = Matrix ? new Matrix(...v) : { a: v[0], b: v[1], c: v[2], d: v[3], tx: v[4], ty: v[5] };
    }
    if (m) opts.transform = m;
    renderer.render(opts);
  });
}

/** Once the task's own work is done (a microtask, before the browser shows the frame), the stage goes back on the screen. */
function owedRedraw() {
  if (readback.redrawOwed || !readback.redraw) return;
  readback.redrawOwed = true;
  queueMicrotask(() => {
    readback.redrawOwed = false;
    try { readback.redraw?.(); } catch { /* the next frame draws it */ }
  });
}

/**
 * PURE: premultiplied RGBA from the same picture over black and over white: where the two differ
 * the picture let the background through, so its alpha is 255 less that difference.
 */
export function alphaFromBlackWhite(black, white) {
  const out = new Uint8ClampedArray(black.length);
  for (let i = 0; i < black.length; i += 4) {
    const d = ((white[i] - black[i]) + (white[i + 1] - black[i + 1]) + (white[i + 2] - black[i + 2])) / 3;
    out[i] = black[i];
    out[i + 1] = black[i + 1];
    out[i + 2] = black[i + 2];
    out[i + 3] = Math.max(0, Math.min(255, Math.round(255 - d)));
  }
  return out;
}

/**
 * The passes drawn to the screen and copied in the same task (no preserveDrawingBuffer: WebGL keeps
 * the buffer until the page is shown), `width` x `height` at `resolution` from the top left, scaled
 * to fit the screen when larger. Drawn twice, over black and over white, so the copy keeps what was
 * clear (alphaFromBlackWhite): the street map's sky and the skirt's gaps stay clear as in a render
 * texture. Returns { pixels (premultiplied RGBA), width, height } or null. The stage is drawn again
 * before the frame is shown (configureReadback redraw).
 */
export function screenReadback(PIXI, renderer, { width, height, resolution = 1, passes = [], label = '' } = {}, doc = globalThis.document) {
  const src = renderer?.canvas || renderer?.view?.canvas || null;
  if (!src?.width || !src?.height || !doc?.createElement || !passes.length) return null;
  const outW = Math.max(1, Math.round(width * resolution));
  const outH = Math.max(1, Math.round(height * resolution));
  const fit = Math.min(1, src.width / outW, src.height / outH);
  const k = (resolution / (Number(renderer.resolution) || 1)) * fit;
  const sw = Math.max(1, Math.min(src.width, Math.round(outW * fit)));
  const sh = Math.max(1, Math.min(src.height, Math.round(outH * fit)));
  try {
    const c = doc.createElement('canvas');
    c.width = outW;
    c.height = outH;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const shot = (clearColor) => {
      drawPasses(renderer, passes, undefined, clearColor, k, PIXI?.Matrix);
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(src, 0, 0, sw, sh, 0, 0, outW, outH);
      return ctx.getImageData(0, 0, outW, outH).data;
    };
    const black = shot([0, 0, 0, 1]);
    const white = shot([1, 1, 1, 1]);
    readback.onCopy?.(label);
    return { pixels: alphaFromBlackWhite(black, white), width: outW, height: outH };
  } catch {
    return null;
  } finally {
    owedRedraw();
  }
}

/** Premultiplied RGBA as a new canvas (straight alpha, as a 2D canvas keeps it). */
function pixelsCanvas({ pixels, width, height }, doc) {
  const c = doc.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(width, height);
  const d = img.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const a = pixels[i + 3];
    if (!a) continue;
    d[i] = Math.min(255, Math.round((pixels[i] * 255) / a));
    d[i + 1] = Math.min(255, Math.round((pixels[i + 1] * 255) / a));
    d[i + 2] = Math.min(255, Math.round((pixels[i + 2] * 255) / a));
    d[i + 3] = a;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** The passes in a new render texture (its depth and stencil first, #380b), read back by `read(rt)`; null when it threw. */
function textureRead(PIXI, renderer, { width, height, resolution = 1, passes = [] }, read) {
  if (!readbackUsesTexture() || !PIXI?.RenderTexture || !renderer?.extract) return null;
  let rt = null;
  try {
    rt = ensureDepthStencil(renderer, PIXI.RenderTexture.create({ width, height, resolution }));
    drawPasses(renderer, passes, rt, CLEAR);
    return read(rt);
  } catch {
    return null;
  } finally {
    rt?.destroy(true);
  }
}

/**
 * `passes` drawn to a new canvas `width` x `height` at `resolution` (the report picture, the street
 * map): a render texture read back, else (the probe failed, or the read threw or came back with
 * nothing drawn) the screen copy. Null when neither gave a picture. `sample`: how wide a copy the
 * emptiness check reads (canvasTransparent).
 */
export function readbackCanvas(PIXI, renderer, opts = {}, doc = globalThis.document) {
  const out = textureRead(PIXI, renderer, opts, (rt) => renderer.extract.canvas(rt));
  if (out && !canvasTransparent(out, doc, opts.sample)) return out;
  const copy = screenReadback(PIXI, renderer, opts, doc);
  if (!copy || pixelsTransparent(copy.pixels)) return null;
  try {
    return pixelsCanvas(copy, doc);
  } catch {
    return null;
  }
}

/**
 * `passes` drawn and read as premultiplied RGBA ({ pixels, width, height }, the ground skirt's
 * colour): a render texture read back, else the screen copy, as readbackCanvas. Null when
 * neither could be read; an empty read stands when the screen copy is empty too.
 */
export function readbackPixels(PIXI, renderer, opts = {}, doc = globalThis.document) {
  const out = textureRead(PIXI, renderer, opts, (rt) => renderer.extract.pixels(rt));
  if (out?.pixels?.length && !pixelsTransparent(out.pixels)) return out;
  const copy = screenReadback(PIXI, renderer, opts, doc);
  if (copy && !pixelsTransparent(copy.pixels)) return copy;
  return out?.pixels ? out : copy;
}

/**
 * The renderer's own extract of a thing off the stage (`opts` as extract.canvas takes them: the
 * chooser's tile art), or null when the probe failed or it comes back empty or throws.
 */
export function readbackExtract(renderer, opts, doc = globalThis.document) {
  if (!readbackUsesTexture() || !renderer?.extract) return null;
  try {
    const out = renderer.extract.canvas(opts);
    return out && !canvasTransparent(out, doc) ? out : null;
  } catch {
    return null;
  }
}

/**
 * One row of the screen as drawn, `fromTop` CSS px under the drawing buffer's top edge, read straight from
 * the default framebuffer (the phone band's colour, game.js sampleStageSkyEdge). R29: the one place a
 * player's game reads pixels; a GPU sync, so callers read only when something changed. Returns
 * { row, width, ms } or null (no WebGL, a lost context, a framebuffer bound, nothing drawn).
 */
export function readScreenRow(gl, { fromTop = 2, resolution = 1 } = {}) {
  if (!gl || gl.isContextLost?.() || gl.getParameter(gl.FRAMEBUFFER_BINDING) !== null) return null;
  const width = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  if (!(width > 0) || !(h > 2)) return null;
  const row = new Uint8Array(width * 4);
  const t0 = globalThis.performance?.now?.() ?? Date.now();
  gl.readPixels(0, h - 1 - Math.min(h - 1, Math.round(fromTop * (resolution || 1))), width, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
  return { row, width, ms: (globalThis.performance?.now?.() ?? Date.now()) - t0 };
}
