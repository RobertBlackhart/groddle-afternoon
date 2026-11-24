/**
 * G1167: a street's sky gradient was pinned to the view and stretched behind the pack, so its top
 * colour always sat at the top of the screen. Glitch painted the gradient into the backmost layer's
 * own graphics at that layer's w x h (LocationView.as 101-106 fastUpdateGradient, DrawUtil.as
 * drawBGForLoc / drawVerticalGradientBG), so it moved with that layer's parallax and a player on the
 * ground mostly saw the lower colours: Kipacre Greens (GCR202JSVIN1STL, top E6FDFF, bottom FFF759)
 * shows yellow over the treeline in the 2012 template and in ground-level snaps, where the remake
 * showed pale cyan. The view never showed past that layer in Glitch (TSMainView.resizeToStage held
 * the view to the smallest layer); where the remake's does, the end colours carry on (SpreadMethod.PAD).
 * Run: node --test tests/g1167-sky-gradient-layer.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildStreetView,
  layerIsDrawn,
  parallaxLayerOffset,
  skyColourAt,
  skyGradientLayerIndex,
  skyGradientPlacement,
  groundBelowSpan,
  skirtFadeColour,
} from '../public/js/street-render.js?v=1e049218';

const here = dirname(fileURLToPath(import.meta.url));
const read = (rel) => readFileSync(join(here, '..', rel), 'utf8');
const street = (tsid) => JSON.parse(read(`public/assets/streets/${tsid}.json`));
const KIPACRE = 'GCR202JSVIN1STL';
const rgb = (c) => [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];

/** The bits of Pixi buildStreetView touches with no deco art, plus sprites for the sky. */
function fakePixi() {
  class Container {
    constructor() {
      this.children = [];
      this.parent = null;
      this.destroyed = false;
      this.listeners = {};
      this.x = 0;
      this.y = 0;
      this.width = 0;
      this.height = 0;
      this.visible = true;
      this.scale = { x: 1, y: 1, set(x, y = x) { this.x = x; this.y = y; } };
    }
    addChild(...kids) {
      for (const kid of kids) {
        kid.parent?.removeChild(kid);
        kid.parent = this;
        this.children.push(kid);
      }
      return kids[0];
    }
    removeChild(kid) {
      const i = this.children.indexOf(kid);
      if (i >= 0) this.children.splice(i, 1);
      kid.parent = null;
      return kid;
    }
    once(name, fn) {
      (this.listeners[name] ||= []).push(fn);
    }
    destroy() {
      this.destroyed = true;
    }
  }
  class Graphics extends Container {}
  for (const verb of ['rect', 'fill', 'ellipse', 'roundRect', 'moveTo', 'lineTo', 'stroke', 'circle']) {
    Graphics.prototype[verb] = function chain() {
      return this;
    };
  }
  class Sprite extends Container {
    constructor(texture) {
      super();
      this.texture = texture;
      this.tint = 0xffffff;
    }
  }
  const Texture = { WHITE: { white: true }, from: (canvas) => ({ canvas }) };
  class ColorMatrixFilter {}
  // The layer colours are flashColorMatrixFilter (G1171): a Filter with its own programs.
  class Filter { constructor(o) { Object.assign(this, o); } }
  class UniformGroup { constructor(u) { this.uniforms = {}; for (const k in u) this.uniforms[k] = u[k].value; } update() {} }
  const GlProgram = { from: (o) => o };
  const GpuProgram = { from: (o) => o };
  return { Container, Graphics, Sprite, Texture, ColorMatrixFilter, Filter, UniformGroup, GlProgram, GpuProgram };
}

/** The gradient canvas (gradientTexture) needs a document; a stub is enough here. */
function withDocument(fn) {
  const had = 'document' in globalThis;
  const was = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ createLinearGradient: () => ({ addColorStop() {} }), fillRect() {} }),
    }),
  };
  try {
    return fn();
  } finally {
    if (had) globalThis.document = was;
    else delete globalThis.document;
  }
}

describe('G1167: the layer the gradient is painted on', () => {
  it('is the backmost drawn layer by z (LocationView _layerRenderers[0])', () => {
    assert.equal(skyGradientLayerIndex([{ id: 'middleground', z: 0 }, { id: 'bg', z: -2 }, { id: 'sky', z: -3 }]), 2);
    // Hidden layers never draw (Location.as 541-542), so the next one back takes it.
    assert.equal(skyGradientLayerIndex([{ id: 'middleground', z: 0 }, { id: 'bg', z: -2 }, { id: 'sky', z: -3, hidden: true }]), 1);
    // No z: the list index stands in, as the layers' zIndex does.
    assert.equal(skyGradientLayerIndex([{ id: 'T_a' }, { id: 'middleground' }]), 0);
    // A scene with only its middleground paints it there.
    assert.equal(skyGradientLayerIndex([{ id: 'middleground', z: 0 }]), 0);
    assert.equal(skyGradientLayerIndex([]), -1);
    const kipacre = street(KIPACRE);
    assert.equal(kipacre.layers[skyGradientLayerIndex(kipacre.layers)].id, 'sky');
  });
});

describe('G1167: where the gradient runs (drawVerticalGradientBG over the layer, 0..h)', () => {
  it('spans the layer, its top colour at the layer top and bottom colour at the layer bottom', () => {
    const at = skyGradientPlacement(-120, 1000, 300, 732);
    assert.deepEqual(at.gradient, { y: -120, h: 1000 });
    assert.equal(at.cap, null, 'the view is inside the layer: no cap');
    assert.deepEqual(at.base, { y: 300, h: 732 }, 'the bottom colour under the whole view');
    assert.equal(skyColourAt('E6FDFF', 'FFF759', -120, 1000, -120), 0xe6fdff);
    assert.equal(skyColourAt('E6FDFF', 'FFF759', -120, 1000, 880), 0xfff759);
    // Past the layer its end colours carry on (SpreadMethod.PAD).
    assert.equal(skyColourAt('E6FDFF', 'FFF759', -120, 1000, -500), 0xe6fdff);
    assert.equal(skyColourAt('E6FDFF', 'FFF759', -120, 1000, 1500), 0xfff759);
  });

  it('caps the view above the layer with the top colour, never as a thin strip', () => {
    // An upright phone's camera 6 px over the layer: the cap reaches 1000/16 px and ends under the gradient.
    const at = skyGradientPlacement(0, 1000, -6, 900, 1000 / 16);
    assert.ok(at.cap);
    assert.equal(at.cap.y, -62.5);
    assert.equal(at.cap.y + at.cap.h, 1, 'it reaches 1 px under the gradient top');
    // Far over the layer it starts at the view's top.
    const far = skyGradientPlacement(0, 1000, -300, 900, 62.5);
    assert.equal(far.cap.y, -300);
  });
});

describe('G1167: Kipacre Greens on the ground, as the 2012 template shows it', () => {
  // Original zoom on a 1280 x 800 window: a 1000 x 600 view, the camera on the street's bottom.
  const s = street(KIPACRE);
  const W = s.bounds.r - s.bounds.l;
  const H = s.bounds.b - s.bounds.t;
  const sky = s.layers.find((l) => l.id === 'sky');
  const vpW = 1000;
  const vpH = 600;
  const camY = H - vpH;
  const camX = 2727;

  it('shows the gradient from 40% down at the view top: yellow over the treeline, not the top cyan', () => {
    const layerTop = parallaxLayerOffset(sky, camX, camY, vpW, vpH, W, H).y;
    assert.equal(layerTop, 0, 'the 1000 px sky layer slid to the street top');
    const top = skyColourAt(s.gradient.top, s.gradient.bottom, layerTop, sky.h, camY);
    assert.deepEqual(rgb(top), [240, 251, 189], '0.4 of the way from E6FDFF to FFF759');
    assert.ok(rgb(top)[2] < 0xd0, 'the view top is yellowed, not the old pale cyan');
    assert.equal(skyColourAt(s.gradient.top, s.gradient.bottom, layerTop, sky.h, camY + vpH), 0xfff759);
  });

  it('the street view paints it on the sky layer and moves it with that layer', () => {
    const PIXI = fakePixi();
    const root = withDocument(() => buildStreetView({ ...s, signposts: [] }, PIXI, { available: new Set() }));
    root.updateParallax(camX, camY, vpW, vpH, vpH + 132);
    const skyLc = root.parallaxLayers.find((lc) => lc.label === 'sky');
    const stats = root.skyStats();
    assert.equal(stats.layer, 'sky');
    assert.equal(stats.y, skyLc.y, 'the gradient top is the sky layer top');
    assert.equal(stats.h, sky.h, 'at the layer height, not the view height');
    assert.equal(stats.cap, null);
    const [base, cap, gradient] = root.skyView.children;
    assert.equal(base.tint, 0xfff759, 'the bottom colour under the view');
    assert.equal(cap.tint, 0xe6fdff);
    assert.equal(gradient.width, vpW);
    assert.equal(base.y, camY);
    assert.equal(base.height, vpH + 132, 'the pack band included');
    // Kipacre's sky is the street's height, so it holds still in the street: higher up the view
    // shows more of the top colour, as the template does.
    root.updateParallax(camX, 100, vpW, vpH, vpH + 132);
    assert.equal(root.skyStats().y, 0);
  });

  it('a sky layer shorter than its street slides with the camera and the gradient goes with it (Doon Way)', () => {
    const doon = street('GLIF37ASJFE1AVQ');
    const dSky = doon.layers.find((l) => l.id === 'sky');
    assert.equal(dSky.h, 930);
    const PIXI = fakePixi();
    const root = withDocument(() => buildStreetView({ ...doon, signposts: [] }, PIXI, { available: new Set() }));
    const skyLc = root.parallaxLayers.find((lc) => lc.label === 'sky');
    root.updateParallax(2500, 400, vpW, vpH, vpH + 132);
    assert.equal(skyLc.y, 70, 'on the ground the 930 px layer sits 70 px down the street');
    assert.deepEqual([root.skyStats().y, root.skyStats().h], [70, 930]);
    root.updateParallax(2500, 0, vpW, vpH, vpH + 132);
    assert.equal(skyLc.y, 0);
    assert.equal(root.skyStats().y, 0, 'at the street top it is at the top');
  });
});

describe('G1167: every imported street', () => {
  it('the gradient layer is drawn and covers a ground-level view held to the smallest layer', () => {
    const dir = join(here, '../public/assets/streets');
    let checked = 0;
    for (const f of readdirSync(dir)) {
      if (!/^G[A-Z0-9]+\.json$/.test(f)) continue;
      const st = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (!st.gradient?.top || !st.bounds || st.reconstructed) continue;
      const W = st.bounds.r - st.bounds.l;
      const H = st.bounds.b - st.bounds.t;
      const i = skyGradientLayerIndex(st.layers);
      assert.ok(i >= 0, f);
      const layer = st.layers[i];
      assert.ok(layerIsDrawn(layer), f);
      if (layer.id === 'middleground' || !(layer.w > 0 && layer.h > 0)) continue;
      // TSMainView: the view is never taller than the smallest layer (or the street).
      const minH = Math.min(H, ...st.layers.filter((l) => l.h > 0).map((l) => l.h));
      const vpH = Math.min(600, minH);
      const camY = Math.max(0, H - vpH);
      const top = parallaxLayerOffset(layer, 0, camY, 1000, vpH, W, H).y;
      assert.ok(top <= camY + 1e-6 && top + layer.h >= camY + vpH - 1e-6, `${f}: the layer covers the view`);
      checked++;
    }
    assert.ok(checked > 1000, `checked ${checked}`);
  });
});

describe('G1167: the frame loop places the sky from the layer, not the view', () => {
  it('updateParallax no longer stretches the sky to the view', () => {
    const src = read('public/js/street-render.js');
    const body = src.slice(src.indexOf('root.updateParallax = ('), src.indexOf('root.edgeMirrorFrame?.(camX, vpW);'));
    assert.ok(body.includes('root.placeSky(camX, camY, vpW, skyH);'));
  });

  it('nothing sizes or moves the sky container itself (it holds three sprites: placeSky places them)', () => {
    // The level builder's full-street render set skyView.width/height and so scaled the container:
    // a black sky over the far layers (builder-render golden, Hechey Track).
    const files = [];
    const walk = (rel) => {
      for (const ent of readdirSync(join(here, '..', rel), { withFileTypes: true })) {
        const r = `${rel}/${ent.name}`;
        if (ent.isDirectory()) {
          if (!['vendor', 'assets'].includes(ent.name)) walk(r);
        } else if (/\.(m?js|html)$/.test(ent.name)) files.push(r);
      }
    };
    walk('public');
    const offenders = files.filter((f) => /skyView\.(width|height|x|y|scale)\b\s*=(?!=)/.test(read(f)));
    assert.deepEqual(offenders, []);
    assert.ok(read('public/builder-render/render.js').includes('view.placeSky?.(frame.cam.x, frame.cam.y, frame.vw, frame.vh);'));
    assert.ok(read('public/js/builder/editor.js').includes('v.placeSky?.(S.cam.x, S.cam.y, w, h);'));
  });

  it('the builder: layers at one camera, the sky over another frame, gradient still on the sky layer', () => {
    // The editor's "Layout" overlay and builder-render's full view: updateParallax for a Wide view,
    // then placeSky over the whole picture. The backdrop covers the picture; the gradient stays on the layer.
    const s = street(KIPACRE);
    const PIXI = fakePixi();
    const root = withDocument(() => buildStreetView({ ...s, signposts: [] }, PIXI, { available: new Set() }));
    root.updateParallax(2520, 592, 960, 408, 408);
    root.placeSky(0, 0, 6000, 1000);
    const skyLc = root.parallaxLayers.find((lc) => lc.label === 'sky');
    const [base, cap, gradient] = root.skyView.children;
    assert.deepEqual([base.x, base.y, base.width, base.height], [0, 0, 6000, 1000]);
    assert.deepEqual([gradient.x, gradient.y, gradient.width, gradient.height], [0, skyLc.y, 6000, 1000]);
    assert.equal(cap.visible, false);
    assert.deepEqual([root.skyView.x, root.skyView.y, root.skyView.scale.x, root.skyView.scale.y], [0, 0, 1, 1]);
  });
});

// Austin's iPhone 2026-11-24 (upright, Xhola Mades): under the pack row a band of the sky's bottom
// colour (that street's FFC252 yellow) showed below the dark earth: the bottom colour ran under the
// whole view, and on a low street the camera goes past the street's bottom further than the ground
// skirt runs (c15c56d8680, #617/#654). Below the street's bottom the view is now ground.
describe('below the street the view is ground, never the sky (Austin 2026-11-24)', () => {
  const XHOLA = 'GIFU9C04IE72O8K';
  const x = street(XHOLA);
  const H = x.bounds.b - x.bounds.t;
  const vpW = 700;
  const vpH = 760;
  it('groundBelowSpan: the view below the street bottom, none above it', () => {
    assert.deepEqual(groundBelowSpan(1000, 400, 700), { y: 1000, h: 100 });
    assert.equal(groundBelowSpan(1000, 200, 700), null);
    assert.deepEqual(groundBelowSpan(1000, 1100, 500), { y: 1100, h: 500 }, 'a view all below it');
  });
  it("the game's view paints it in the ground's colour behind the layers, over the sky's yellow", () => {
    assert.equal(x.gradient.bottom.toUpperCase(), 'FFC252', 'Xhola Mades: a yellow sky bottom');
    const PIXI = fakePixi();
    const root = withDocument(() => buildStreetView({ ...x, signposts: [] }, PIXI, { available: new Set(), groundBelow: true }));
    const camY = H - vpH + 60; // the camera 60 px past the street's bottom (the feet win)
    root.updateParallax(1000, camY, vpW, vpH, vpH + 80);
    const ground = root.skyView.children.find((c) => c.label === 'ground-below');
    assert.ok(ground, 'a ground part in the sky view (behind every layer)');
    assert.equal(ground.visible, true);
    assert.deepEqual([ground.y, ground.height, ground.width], [H, camY + vpH + 80 - H, vpW]);
    assert.notEqual(ground.tint, 0xffc252, 'not the sky bottom colour');
    assert.equal(ground.tint, skirtFadeColour(Number.NaN, 0xffc252, 0x6b8f3c), 'the sky bottom darkened till the skirt says its colour');
    root.groundSkirt = { colour: 0x2b2116 };
    root.updateParallax(1000, camY, vpW, vpH, vpH + 80);
    assert.equal(ground.tint, 0x2b2116, "the skirt's own colour once it is built");
    root.updateParallax(1000, 0, vpW, vpH, vpH + 80);
    assert.equal(ground.visible, false, 'a view above the bottom shows none');
  });
  it("the game asks for it; the level builder's pictures do not", () => {
    const PIXI = fakePixi();
    const root = withDocument(() => buildStreetView({ ...x, signposts: [] }, PIXI, { available: new Set() }));
    assert.equal(root.skyView.children.length, 3);
    assert.match(read('public/game.js'), /skirtBelow: VIEW_H - LOCATION_VIEW_H,\n[^\n]*\n    groundBelow: true,/);
  });
});
