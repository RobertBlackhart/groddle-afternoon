/**
 * Two player reports from 2026-11-08 (v0.23.0, Modern, a ~2000 px window):
 * - G582: the camera keeps a street's end left of the Social drawer (its folded rail or the open
 *   drawer), as the original client reserved its right column in its location viewport; the ground
 *   skirt runs on past the end for the strip the camera then shows.
 * - G583: trees and Chickens stand on their feet, not on their frames' empty rows under them
 *   (Guillermo Gamera Way's Bubble Tree on the upper ledge and a Chicken on the arch landing).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { cameraTargetX, cameraLocationViewWidth, cameraOverlayCenterX } from '../public/js/movement.js?fresh=railcam';
import { footOf } from '../public/js/sprite-feet.js?fresh=railcam';
import { quadSpans } from '../public/js/wide-quads.js?fresh=railcam';

const root = join(import.meta.dirname, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

/** A WebP's pixel size from its header (VP8X, VP8L or VP8). */
function webpSize(file) {
  const b = readFileSync(file);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF');
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
}

describe('G582: the camera reserves the Social drawer over the world', () => {
  const game = read('public/game.js');

  it('measures the drawer (rail or open, 0 hidden) and keeps the old rail as a fallback', () => {
    const fn = game.slice(game.indexOf('function syncCameraSafeArea()'), game.indexOf('function cameraTargetForPlayer('));
    assert.match(fn, /socialDrawer\?\.inset\(\)\?\.right/);
    assert.match(fn, /getElementById\('play-context'\)/);
    assert.match(fn, /overlapCss > 0\s*\?/);
    // Re-measured the frame the drawer opens, folds or hides (it writes --inset-r as it does).
    assert.match(game, /function followDrawerInset\(\)[\s\S]*?getPropertyValue\('--inset-r'\) !== drawerInsetSeen\) syncCameraSafeArea\(\)/);
    assert.match(game, /socialDrawer\?\.frame\(\);\n(  [a-zA-Z]+(?:\?\.[a-zA-Z]+)?\(\);\n)*  followDrawerInset\(\);/);
  });

  it('Classic reserves nothing: its chat column sits beside the world', () => {
    const drawer = read('public/js/ui/social-drawer.js');
    // insetNow: only a drawer over the right half of the root counts, not Classic's column.
    assert.match(drawer, /r\.left < rr\.left \+ rr\.width \/ 2 \|\| r\.left >= rr\.right - 1\) return \{ left: 0, right: 0 \}/);
    assert.match(read('public/css/classic.css'), /--inset-r: 0px !important/);
  });

  it('at a street end the whole street shows left of the reserve, and overlays stay in it', () => {
    const view = 1031;
    const world = 6000;
    for (const inset of [0, 37, 170]) {
      const cam = cameraTargetX(world - 20, 0, world, view, 4.4, inset);
      // The street's last pixel is inside the free width, not under the drawer.
      assert.ok(cam + cameraLocationViewWidth(view, inset) >= world - 0.5, `inset ${inset}`);
      assert.ok(cameraOverlayCenterX(view, 200, view, inset, 10) + 100 <= view - inset);
    }
  });

  it('the ground skirt runs on past the right end, mirrored about it', () => {
    const render = read('public/js/street-render.js');
    assert.match(render, /function buildGroundSkirt\([^)]*rightPad = 0\)/);
    // Whole texels ending on the end (edgeMirrorTexels' rule): a rounded-down texture left a gap there.
    assert.match(render, /const padW = wholeTexels\(pad, res\) \/ res;/);
    // The band's last padW px, rendered once, laid on in pieces (js/wide-quads.js, the flicker fix),
    // each flipped about the end: texel u (world W - padW + u) lands at W + padW - u.
    assert.match(render, /renderer\.render\(\{ container: shell, target: rt, transform: new PIXI\.Matrix\(1, 0, 0, 1, -\(W - padW\), -top\), clear: true \}\);\n\s*textures\.push\(rt\);\n\s*const pieces = quadPieceViews\(PIXI, rt, views\);/);
    assert.match(render, /spr\.scale\.x = -1;\n\s*spr\.x = W \+ padW - piece\.dx;/);
    assert.match(render, /function quadPieceViews\(PIXI, texture, views\) \{\n\s*const spans = quadSpans\(0, texture\.width, texture\.height\);/);
    for (const [W, padW, band] of [[6000, 900, 56], [3000, 899.6551724137931, 12]]) {
      const pieces = quadSpans(0, padW, band);
      assert.equal(pieces[0].x, 0);
      assert.equal(pieces.at(-1).x + pieces.at(-1).w, padW, 'the pieces cover the whole pad');
      for (const { x: dx, w } of pieces) {
        const at = W + padW - dx;
        for (const u of [dx, dx + w / 2, dx + w]) assert.ok(Math.abs((W - padW + u) + (at - (u - dx)) - 2 * W) < 1e-9, `mirrored about W (${W}, ${u})`);
      }
    }
    // The fills and fades span fullW (the street and the pad), in pieces.
    for (const part of ['wideRect(new PIXI.Graphics(), 0, sourceH, fullW, depth,', 'const ramps = (texture) => quadSpans(0, fullW, fadeDepth).map(', 'strip.addChild(...ramps(fadeTexture), ...ramps(shadeTexture), deep)', 'wideRect(new PIXI.Graphics(), 0, sourceH + fadeDepth, fullW,']) {
      assert.ok(render.includes(part), part);
    }
    assert.match(render, /const ramps = [^\n]*\n\s*const spr = new PIXI\.Sprite\(texture\);\n\s*spr\.x = s\.x;\n\s*spr\.y = sourceH;\n\s*spr\.width = s\.w;/);
    assert.match(render, /const fullW = W \+ pad;/);
    const fill = quadSpans(0, 6900, 88);
    assert.equal(fill.reduce((sum, s) => sum + s.w, 0), 6900);
    assert.match(render, /Number\(opts\.skirtRight\)/);
    assert.match(game, /skirtRight: SKIRT_RIGHT_PAD/);
    // Wide enough for the largest reserve the camera takes (0.42 of the view) at the Original zoom.
    const pad = Number(game.match(/const SKIRT_RIGHT_PAD = (\d+)/)[1]);
    assert.ok(pad >= 0.42 * 1000 * 2, `pad ${pad}`);
  });
});

describe('G875 (#423): upright on a phone the folded rail floats over the sky, so the camera reserves nothing', () => {
  const game = read('public/game.js');
  const src = game.slice(game.indexOf('function uprightRailFloats('), game.indexOf('/** G875: uprightRailFloats as'));
  const floats = ({ phone = true, modern = true, w = 402, h = 812, open = false } = {}) =>
    new Function('TOUCH_PHONE', 'modernUi', 'socialDrawer', `${src}; return uprightRailFloats;`)(phone, () => modern, { isOpen: () => open })({ clientWidth: w, clientHeight: h });

  it('only an upright phone in Modern with the drawer folded', () => {
    assert.equal(floats(), true);
    assert.equal(floats({ w: 812, h: 402 }), false, 'sideways the rail covers most of the height');
    assert.equal(floats({ open: true }), false, 'the open drawer covers the world');
    assert.equal(floats({ phone: false, w: 800, h: 1200 }), false, 'a tall desktop window keeps the reserve');
    assert.equal(floats({ modern: false }), false, 'Classic measures nothing anyway');
  });

  it('then the drawer counts 0 and the edge mirrors plan for no reserve', () => {
    const fn = game.slice(game.indexOf('function syncCameraSafeArea()'), game.indexOf('function cameraTargetForPlayer('));
    assert.match(fn, /cameraRailFloats = uprightRailFloats\(root\);\n  const drawerCss = cameraRailFloats \? 0 : /);
    assert.match(game, /edgeMirror: \{ insetShare: \(\) => \(modernUi\(\) && !cameraRailFloats \? CAMERA_RESERVE_SHARE : 0\) \}/);
    // At the right end, no reserve: the street's last pixel meets the screen's edge.
    const cam = cameraTargetX(6000 - 20, 0, 6000, 560, 4.4, 0);
    assert.equal(cam + 560, 6000);
  });
});

describe('G583: trees and Chickens stand on their feet', () => {
  // G583's hand measurements (fixc lane, 2026-11-08): [cell height, blank rows under the trunk's
  // lowest solid row] per stage. R12 measures every sprite the same way (js/sprite-feet-data.js).
  const TRANT_PADS = {
    trant_fruit: [249, { 1: 7, 3: 7, 5: 3, 7: 10, 10: 6 }],
    trant_egg: [278, { 1: 15, 3: 15, 5: 12, 7: 14, 10: 7 }],
    trant_bean: [270, { 1: 14, 3: 13, 5: 12, 7: 8, 10: 4 }],
    trant_bubble: [277, { 1: 9, 3: 9, 5: 10, 7: 11, 10: 7 }],
    trant_gas: [258, { 1: 17, 3: 16, 5: 15, 7: 10, 10: 5 }],
    trant_spice: [250, { 1: 36, 3: 26, 5: 20, 7: 21, 10: 6 }],
  };
  it('every trant frame stands on its trunk: the measured feet keep G583 (within a pixel), x in the middle', () => {
    for (const [classId, [h, pads]] of Object.entries(TRANT_PADS)) {
      for (const [stage, pad] of Object.entries(pads)) {
        const url = `assets/sprites/trants/frames/${classId}_m${stage}.webp?v=1`;
        assert.equal(webpSize(join(root, 'public', url.split('?')[0])).h, h, `${classId} m${stage} height`);
        const foot = footOf(url);
        assert.ok(Math.abs((1 - foot.y) * h - pad) <= 1, `${classId} m${stage}: ${(1 - foot.y) * h} blank rows, G583 measured ${pad}`);
        assert.equal(foot.x, 0.5, 'a still picture keeps its middle');
      }
    }
  });

  it('street, demo and Patch trees stand on their feet, and again whenever their texture changes', () => {
    const game = read('public/game.js');
    assert.match(game, /spawnTrees[\s\S]*?const spr = new PIXI\.Sprite\(tex\);[\s\S]{0,400}standOnFeet\(spr\)/);
    assert.doesNotMatch(game, /treeAnchorY|trantFootOf/);
    assert.match(read('public/js/features/patches-feature.js'), /standOnFeet\(sprite\)/);
  });

  it('a Chicken stands on its feet in the street, the yard, the tutorial and husbandry', () => {
    // The walk's feet: 96 of its 110 px cell (G583 hand-measured 97: the lowest row with one texel).
    const walk = footOf('assets/sprites/npc_chicken__x1_walk_png_1354830385.webp', { width: 148, height: 110 });
    assert.equal(walk.y * 110, 96);
    for (const url of ['assets/sprites/npc_chicken__x1_pecking_once_png_1354830398.webp', 'assets/sprites/animals/npc_chicken_stand.webp']) {
      assert.ok(footOf(url, { width: 148, height: 110 }).y * 110 >= 96, url);
    }
    const game = read('public/game.js');
    assert.match(game, /function makeAnimated[\s\S]*?standOnFeet\(anim\)/);
    assert.match(game, /function spawnChickens[\s\S]*?makeAnimated\('chickenWalk'/);
    for (const f of ['yard-verbs-mp-feature.js', 'animal-husbandry-feature.js', 'newxp-feature.js']) {
      assert.match(read(`public/js/features/${f}`), /else standOnFeet\(spr\);/, f);
    }
  });
});
