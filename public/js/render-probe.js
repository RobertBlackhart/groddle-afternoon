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
 * "rt ok (plain ok) · res 3 · tex 16384 · rb 16384 · restores 0 · webgl2 · ANGLE (NVIDIA ...)".
 */
export function renderProbeLine(probe, { resolution, restores = 0 } = {}) {
  if (!probe) return '';
  const word = (v) => (v === true ? 'ok' : v === false ? 'failed' : 'untried');
  const res = Number(resolution ?? probe.resolution) || 0;
  return [
    `rt ${word(probe.ok)} (plain ${word(probe.plain)})`,
    `res ${Math.round(res * 100) / 100}`,
    probe.maxTexture ? `tex ${probe.maxTexture}` : '',
    probe.maxRenderbuffer ? `rb ${probe.maxRenderbuffer}` : '',
    `restores ${Number(restores) || 0}`,
    probe.api || '',
    probe.gl || '',
  ].filter(Boolean).join(' · ').slice(0, 200);
}
