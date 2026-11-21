/**
 * Workarounds for Pixi 8 behaviour the game relies on from Pixi 7. Install
 * once, before the Application is created.
 */
export function installPixiFixes(PIXI) {
  installSizedSprites(PIXI);
  installArcLastPoint(PIXI);
}

/**
 * After fill()/stroke() Pixi starts the next path at the last point of the
 * previous one (GraphicsPath.getLastPoint). For an `arc` it reads the wrong
 * slots of the instruction (counterclockwise flag and transform), so the
 * next path began at NaN and was not drawn: the Rainbow Run bands after the
 * first and the rook HUD's red health arc vanished (Pixi 8.22). Use the
 * arc's real end point.
 */
function installArcLastPoint(PIXI) {
  const proto = PIXI?.GraphicsPath?.prototype;
  if (!proto || proto.groddleArcLastPoint) return;
  const getLastPoint = proto.getLastPoint;
  proto.getLastPoint = function getLastPointWithArcs(out) {
    let i = this.instructions.length - 1;
    while (i >= 0 && this.instructions[i].action === 'closePath') i--;
    const last = this.instructions[i];
    if (last?.action === 'arc') {
      const [x, y, radius, , endAngle] = last.data;
      out.x = x + Math.cos(endAngle) * radius;
      out.y = y + Math.sin(endAngle) * radius;
      return out;
    }
    return getLastPoint.call(this, out);
  };
  proto.groddleArcLastPoint = true;
}

/**
 * Sized sprites keep their size when the image arrives. A sprite given a
 * width/height before its texture loaded (js/textures.js hands out a 1x1
 * placeholder) stores the size, but Pixi 8 only re-applies it when the
 * texture is swapped, not when a dynamic texture updates: a 280px garden bed
 * sized while loading became 51,000px wide. Pixi 7 re-applied it on every
 * texture update; so do we. Also unhooks dynamic textures on destroy (Pixi
 * 8.22 leaves the listener on the shared texture).
 */
function installSizedSprites(PIXI) {
  const proto = PIXI?.Sprite?.prototype;
  if (!proto || proto.groddleSizedSprites) return;
  const desc = Object.getOwnPropertyDescriptor(proto, 'texture');
  if (!desc?.set) return;
  proto.groddleTextureUpdate = function groddleTextureUpdate() {
    if (this.destroyed || !this._texture) return;
    if (this._width) this._setWidth(this._width, this._texture.orig.width);
    if (this._height) this._setHeight(this._height, this._texture.orig.height);
    this.onViewUpdate();
  };
  Object.defineProperty(proto, 'texture', {
    configurable: true,
    enumerable: desc.enumerable,
    get: desc.get,
    set(value) {
      const prev = this._texture;
      if (prev?.dynamic) prev.off('update', this.groddleTextureUpdate, this);
      desc.set.call(this, value);
      const next = this._texture;
      if (next?.dynamic) {
        next.off('update', this.onViewUpdate, this);
        next.on('update', this.groddleTextureUpdate, this);
      }
    },
  });
  const destroy = proto.destroy;
  proto.destroy = function destroyUnhooked(options) {
    const texture = this._texture;
    if (texture?.dynamic) texture.off('update', this.groddleTextureUpdate, this);
    return destroy.call(this, options);
  };
  proto.groddleSizedSprites = true;
}

/**
 * #577/#578 (R30): a destroyed TextureSource is never drawn. Destroying a source sets its `style`
 * to null (TextureSource.destroy); a sprite or a batch still holding it then reached
 * GlTextureSystem._initSource on the next render, whose updateStyle read `style.addressModeU` and
 * threw. The throw came out of Pixi's own render listener, so the ticker never asked for another
 * frame and the game froze for good (players mining Sparkly rocks in a Party Space). A destroyed
 * source now draws as Texture.EMPTY (nothing), once told to `onDestroyed(source)` so the cause can
 * still be found; it is not uploaded or kept on the GPU. Works on the WebGL and WebGPU texture
 * systems (each makes a source's GPU copy in _initSource).
 * @param {any} PIXI
 * @param {any} renderer a Pixi 8 renderer
 * @param {{ onDestroyed?: (source: any) => void }} [opts]
 * @returns {boolean} true once installed
 */
export function guardDestroyedSources(PIXI, renderer, { onDestroyed = null } = {}) {
  const system = renderer?.texture;
  if (!system || typeof system._initSource !== 'function') return false;
  if (system.groddleDestroyedGuard) return true;
  const init = system._initSource;
  const gpuOf = typeof system.getGlSource === 'function' ? system.getGlSource : system.getGpuSource;
  system._initSource = function initLiveSource(source) {
    if (source && (source.destroyed || !source.style)) {
      const empty = PIXI?.Texture?.EMPTY?.source;
      if (onDestroyed) {
        try { onDestroyed(source); } catch { /* the draw goes on */ }
      }
      if (empty && empty !== source && !empty.destroyed && typeof gpuOf === 'function') return gpuOf.call(this, empty);
    }
    return init.call(this, source);
  };
  system.groddleDestroyedGuard = true;
  return true;
}

/**
 * #577/#578 (R30): Pixi's render is a ticker listener (TickerPlugin adds Application.render at
 * UPDATE_PRIORITY.LOW), and the Ticker asks for the next frame only after its listeners return
 * (Ticker._tick), so one throw in a render stopped the whole game for good, movement and all, while
 * the HUD around it went on. The render now runs in a guard (`guard(fn)`, game.js's frame stage
 * "render": reported once, by name) at the same priority, so a bad frame is one bad frame.
 * @param {any} PIXI
 * @param {any} app a Pixi 8 Application
 * @param {(fn: () => void) => void} guard runs fn and keeps its throw
 * @returns {boolean} true once installed
 */
export function guardTickerRender(PIXI, app, guard) {
  const ticker = app?.ticker;
  if (!ticker || typeof app.render !== 'function' || typeof guard !== 'function') return false;
  if (app.groddleRenderGuard) return true;
  const render = app.render;
  ticker.remove(render, app);
  const guarded = () => guard(() => render.call(app));
  ticker.add(guarded, null, PIXI?.UPDATE_PRIORITY?.LOW ?? -25);
  app.groddleRenderGuard = guarded;
  return true;
}
