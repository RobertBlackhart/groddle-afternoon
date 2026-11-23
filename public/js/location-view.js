/**
 * The street (location) viewport grows with the window, like the original
 * client (VIEWHEIGHT = "grow", Austin 2026-10-26).
 *
 * Sources (tinyspeck glitch-client, CC0):
 * - LayoutModel.as 10: min_vp_h 400; 13: max_vp_h 600.
 * - TSMainView.as resizeToStage 1229-1257: loc_vp_h = stage height less the
 *   header (min_header_h 40), the pack (MIN_PACK_HEIGHT) and 6 px, clamped to
 *   [min_vp_h, max_vp_h], then held to the location's smallest layer height.
 *   It ran on every stage resize, so the view followed the window live.
 * - TSEngineConstants.as 18: MIN_PACK_HEIGHT 132.
 * - CameraMan.as 121-138 and 285: the camera centres on the avatar less
 *   y_cam_offset (PhysicsSetting.as 23: 150), and the getter scales that
 *   offset by loc_vp_h / max_vp_h. So the avatar keeps the same share of the
 *   view at every height (0.5 + 150 / 600 = 0.75): 300 px down a 400 px
 *   view, 450 px down a 600 px one (js/movement.js cameraTargetY).
 *
 * Since g458 the stage fits the window in both axes (stageFor, below): the
 * world is drawn near 1:1 and a bigger window shows more of it, as the
 * original did up to 1000 x 600. The pack overlays the bottom MIN_PACK_HEIGHT
 * of the canvas (the camera never frames the avatar there), so the canvas is
 * the location view plus that allowance. locationViewHeightFor is the older
 * rule for a 960 px view scaled to the page width; `viewh` (QA, the
 * restoration and landing shots) still lays the stage out that way.
 *
 * Remake choices: the smallest view is the remake's old fixed 408 px (a 540 px
 * canvas), 8 px over min_vp_h, so small windows keep exactly the framing
 * every street, room and shot was tuned for (a house's whole wall, the rook
 * orb's headroom). A scene shorter than the window's view holds the view to
 * its own height as the smallest-layer rule did, but never under that floor
 * (the camera already frames short rooms against it and runs the ground
 * skirt below them). `viewh` (QA) pins the window's share.
 */

import { STREET_GROUND_LINES } from './street-ground-lines.js?v=a6a6fa28';

export const MIN_VP_H = 400;
export const MAX_VP_H = 600;
export const MIN_PACK_HEIGHT = 132;
/** The remake's old fixed view width, now the narrowest view (stageFor). */
export const LOCATION_VIEW_W = 960;
/** The widest view before the stage magnifies instead (stageFor). */
export const VIEW_MAX_W = 1680;
/**
 * The tallest view before the stage magnifies instead: 1.2x the source's
 * max_vp_h, so 1440 x 900 still draws 1:1. Streets are 1000 px or taller
 * (all but 38 of 1,463 imported), and a shorter scene holds the view.
 */
export const VIEW_CEIL_H = 720;
/**
 * Where a narrow, tall window (where the 960 px width floor wins) stops
 * growing the view and leaves a band above the canvas instead: streets are
 * 1000 px tall or more (all but 38 of 1,463 imported).
 */
export const VIEW_HOLD_H = 1000;
/**
 * ZOOM (2026-10-30): the world zoom's close end, "Original": the 2012 client's
 * largest view, LayoutModel.as 12-13 max_vp_w 1000 x max_vp_h 600, magnified to
 * fill the window as the old remake's 960 px view did. The floors still hold
 * (never under 960 x 408), so on a very wide window Original shows a little more.
 */
export const ORIGINAL_VIEW_W = 1000;
export const ORIGINAL_VIEW_H = 600;
/**
 * TOUCH PORTRAIT (Austin 2026-11-12, an iPhone held upright): the narrowest view an upright phone
 * shows (phoneStage). Under it a short scene (a room, a home) keeps a band above the canvas
 * instead of magnifying to a keyhole.
 */
export const PHONE_PORTRAIT_MIN_VIEW_W = 560;
/** The remake's smallest view: its old fixed 408 px, inside the source's 400-600. */
export const VIEW_FLOOR_H = 408;
/**
 * PHONE ZOOM RANGE (Austin 2026-11-13 on his iPhone: "the max zoom in is really blurry. Maybe we
 * reset the range so that max zoomed in on the phone scaled to like 56% zoomed in"): the share of
 * the way from the phone's own view to a VIEW_FLOOR_H view filling the screen that the closest
 * phone zoom (closeup 1) goes, geometrically. 1 was the old closest; at 0.56 the old 0.56 is the new
 * closest. Tune here: the slider and the pinch span whatever this leaves.
 */
export const PHONE_CLOSEST_SHARE = 0.56;
/**
 * LANDSCAPE PHONE ZOOM (Austin 2026-11-13: phones play both ways up; "the landscape zoom starts at
 * portrait's 56% closest share, tunable"): the same share for a sideways phone (landscapePhoneStage),
 * its own name so it can differ from portrait's. 0.56 brings a 874 x 402 iPhone from its whole view
 * (1174 x 408 world px, the avatar 86 CSS px) to about 1.55 times as close (the avatar 133 px).
 */
export const LANDSCAPE_PHONE_CLOSEST_SHARE = 0.56;
/** Before the page can be measured (boot, tests): the smallest view. */
export const DEFAULT_VP_H = VIEW_FLOOR_H;

/**
 * Remake-built streets whose art was drawn for one view height. Symphonious
 * Maximus sizes its parallax peaks for the 408 px view (js/symphonious-maximus.js
 * 377-410, layerHeightFor); taller views show the peaks' cut-off feet over the
 * floor while you climb, so the street holds the view at 408.
 */
export const HELD_VIEW_H = Object.freeze({ GUVR3SGQ6EF3400: 408 });

const finite = (value, fallback = NaN) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * The location view height (view pixels) for the room the window leaves.
 * availableHeight: CSS px from the top of the game area to the window's
 * bottom, less the page's own margin under it. displayWidth: the canvas's CSS
 * width. sceneHeight: the current street or room's own height (optional).
 * forced: a QA height for the window's share (optional).
 */
export function locationViewHeightFor({
  availableHeight,
  displayWidth,
  viewWidth = LOCATION_VIEW_W,
  packReserve = MIN_PACK_HEIGHT,
  sceneHeight,
  forced,
} = {}) {
  let view;
  const pinned = finite(forced);
  if (pinned > 0) {
    view = pinned;
  } else {
    const avail = finite(availableHeight);
    const width = finite(displayWidth);
    const vw = finite(viewWidth, LOCATION_VIEW_W);
    view = avail > 0 && width > 0 && vw > 0
      ? avail * (vw / width) - finite(packReserve, MIN_PACK_HEIGHT)
      : DEFAULT_VP_H;
  }
  view = Math.min(MAX_VP_H, Math.max(VIEW_FLOOR_H, Math.floor(view)));
  const scene = finite(sceneHeight);
  if (scene > 0) view = Math.min(view, Math.max(VIEW_FLOOR_H, Math.floor(scene)));
  return view;
}

/** The whole canvas height for a location view: the view plus the pack allowance. */
export function canvasHeightFor(locationViewHeight, packReserve = MIN_PACK_HEIGHT) {
  return finite(locationViewHeight, DEFAULT_VP_H) + finite(packReserve, MIN_PACK_HEIGHT);
}

/**
 * The scene height that holds the view (TSMainView: the smallest of the
 * location's height and its layers' heights). Imported streets carry both;
 * authored rooms only their own world height.
 */
export function sceneViewCap(layer) {
  if (!layer) return NaN;
  let h = finite(layer.sourceWorldH, finite(layer.worldH));
  const street = layer.street;
  const held = finite(HELD_VIEW_H[street?.tsid]);
  if (held > 0) h = Number.isFinite(h) ? Math.min(h, held) : held;
  if (street && Array.isArray(street.layers)) {
    for (const l of street.layers) {
      const lh = finite(l?.h);
      if (lh > 0) h = Number.isFinite(h) ? Math.min(h, lh) : lh;
    }
  }
  return h > 0 ? h : NaN;
}

/** A street layer or room narrower than the view: its width (and its layers'), like sceneViewCap. */
export function sceneViewWidthCap(layer, worldWidth) {
  if (!layer) return finite(worldWidth);
  let w = finite(layer.worldW, finite(worldWidth));
  const street = layer.street;
  if (street && Array.isArray(street.layers)) {
    for (const l of street.layers) {
      const lw = finite(l?.w);
      if (lw > 0) w = Number.isFinite(w) ? Math.min(w, lw) : lw;
    }
  }
  return w > 0 ? w : NaN;
}

/**
 * PURE (#149): whether the zoom changes this stage at all: false when Wide (0) and Original (1)
 * come out at the same scale, as on a street whose narrowest layer is no wider than the Original
 * view (sceneViewWidthCap; the original capped its viewport the same way, TSMainView.as 514).
 * Takes stageFor's arguments without `zoom`.
 */
export function zoomMovesStage(args = {}) {
  if (finite(args.pinnedHeight) > 0) return false;
  const wide = stageFor({ ...args, zoom: 0 }).scale;
  const close = stageFor({ ...args, zoom: 1 }).scale;
  return Math.abs(close - wide) > Math.max(close, wide) * 0.005;
}

/**
 * PURE (PHONE ZOOM): how much closer the closest phone zoom draws than the phone's own view, for
 * stageFor's arguments (1 when it cannot magnify: a pinned page, a room already at the closest).
 * Upright (phoneStage) and sideways (landscapePhoneStage) alike.
 */
export function phoneZoomSpan(args = {}) {
  if (!args.phone || finite(args.pinnedHeight) > 0) return 1;
  const near = stageFor({ ...args, closeup: 1 });
  const far = stageFor({ ...args, closeup: 0 });
  if (!near.phone || !far.phone || !(far.scale > 0)) return 1;
  return near.scale / far.scale;
}

/**
 * The stage for a window (g458, Austin's UI audit): how many CSS px one world
 * px takes (scale) and the view that buys, in world px.
 *
 * - 1:1 by default, so a bigger window shows more world (the original showed
 *   up to 1000 x 600 at 1:1; 1280 x 800 now shows about 1280 x 600).
 * - Past VIEW_MAX_W x VIEW_CEIL_H the stage magnifies instead, so a large
 *   monitor does not draw the art tiny (2x/3x art keeps it sharp).
 * - Under LOCATION_VIEW_W x VIEW_FLOOR_H it shrinks, so the smallest view
 *   every room was tuned for always fits.
 * - A scene narrower or shorter than that view magnifies until it fills it
 *   (homes, short rooms, a street whose narrowest layer is narrower than the
 *   window's view, #580), never past the floors. `sceneBorders` keeps the
 *   scale instead and shows plain borders at the sides (computerStage, #337);
 *   the game no longer asks for it (#580). Phones keep the magnifying rule.
 * - The canvas fills the room exactly, so the page never scrolls; only a view
 *   held at VIEW_HOLD_H (a portrait phone, where the width floor wins) leaves
 *   a band above.
 *
 * - ZOOM: `zoom` (0 to 1, js/world-zoom.js, a device preference) moves the scale
 *   from that rule (0, "Wide", the default) to the same rule with the view
 *   capped at ORIGINAL_VIEW_W x ORIGINAL_VIEW_H (1, "Original"), geometrically,
 *   so each step magnifies by the same share at any window size. Both ends keep
 *   the floors and the scene rule, so every value between does too.
 *
 * - HOUSE FIT (G796 follow-up, Austin 2026-11-22): `fitViewH` (world px, a home street's
 *   house: js/home-house.js houseFitViewH) is the least view the scene asks for. A computer's
 *   stage (and a sideways phone's, built on it) zooms out until the view holds it, at every zoom
 *   level, never past the scene's own height or width (the scene rule above still fills the
 *   window). Glitch zoomed its viewport out for the house the same way, scale = loc_vp_h /
 *   h_needed, though only while the house was being changed (ChassisManager.as scaleVP 189-247).
 *   An upright phone already shows the scene's whole height and keeps its own rule.
 *
 * - GROUND LINE (G1146, report #617): `groundLine` (world px from the scene's top, sceneGroundLine)
 *   is how far down the street's ground art covers its whole width. An upright phone fits the scene
 *   down to there instead of the scene's bottom (phoneStage); the camera keeps every phone above it
 *   (phoneGroundWorldHeight). Computers ignore it.
 *
 * width/height: the CSS room for the canvas (the game area under the top bar).
 * pinnedHeight: `viewh` (QA): the old layout, a LOCATION_VIEW_W view scaled to
 * the page width with that location height (the canvas may then outgrow the
 * window, as before); zoom does not apply to it.
 */
export function stageFor({
  width,
  height,
  packReserve = MIN_PACK_HEIGHT,
  sceneWidth,
  sceneHeight,
  pinnedHeight,
  zoom = 0,
  phone = false,
  closeup = 0,
  sceneBorders = false,
  fitViewH,
  groundLine,
} = {}) {
  const W = finite(width);
  const H = finite(height);
  const pack = finite(packReserve, MIN_PACK_HEIGHT);
  const pinned = finite(pinnedHeight);
  if (phone && !(pinned > 0) && W > 0 && H > W) return phoneStage({ width: W, height: H, packReserve: pack, sceneWidth, sceneHeight, closeup, groundLine });
  if (phone && !(pinned > 0) && W > 0 && H > 0) return landscapePhoneStage({ width: W, height: H, packReserve: pack, sceneWidth, sceneHeight, zoom, closeup, fitViewH });
  return computerStage({ width: W, height: H, packReserve: pack, sceneWidth, sceneHeight, pinnedHeight: pinned, zoom, borders: sceneBorders, fitViewH });
}

/**
 * PURE: stageFor's rule for a computer's window (and the pinned QA page), without the phone stages.
 *
 * NARROW STREETS (#337, G759): with `borders` (a street's own layers: game.js stageArgs), a street
 * narrower than the view (sceneViewWidthCap: its narrowest layer) is not magnified to fill the
 * window. It draws at the scale any other street gets here, the view is capped at the street's
 * width (never under LOCATION_VIEW_W) and the canvas is that much narrower (cssWidth < width,
 * `bordered`), centred, with a plain border at each side (style.css NARROW STREETS). Semsan Simile
 * (its far layer 960 wide) drew 1.76 times bigger than its neighbours in a 1687 px window.
 * Report #580 (Sarda Rapt: its sky 1050 px wide on a 1500 px street) read the borders as black bars
 * on a street you can pan, and Glitch's view never grew past the narrowest layer (TSMainView.as 514,
 * max_vp_w = Math.min(max_vp_w, layer.w)): the game asks for no borders now (game.js stageArgs), so
 * such a street magnifies just enough to fill the window; every other street keeps the zoom's scale.
 */
function computerStage({ width: W, height: H, packReserve: pack, sceneWidth, sceneHeight, pinnedHeight: pinned, zoom, borders = false, fitViewH, fitMinShare = 0 }) {
  if (pinned > 0 || !(W > 0) || !(H > 0)) {
    const viewW = LOCATION_VIEW_W;
    const viewH = locationViewHeightFor({ forced: pinned > 0 ? pinned : NaN, sceneHeight });
    const scale = W > 0 ? W / viewW : 1;
    return { scale, viewW, viewH, canvasH: viewH + pack, cssWidth: viewW * scale, cssHeight: (viewH + pack) * scale, pinned: pinned > 0 };
  }
  const floorH = VIEW_FLOOR_H + pack;
  const sw = finite(sceneWidth) > 0 ? Math.max(LOCATION_VIEW_W, finite(sceneWidth)) : Infinity;
  const sh = finite(sceneHeight) > 0 ? Math.max(VIEW_FLOOR_H, finite(sceneHeight)) : Infinity;
  const border = Boolean(borders) && Number.isFinite(sw);
  const ruleScale = (capW, capH) => {
    let s = W < LOCATION_VIEW_W || H < floorH
      ? Math.min(W / LOCATION_VIEW_W, H / floorH)
      : Math.max(1, W / capW, H / (capH + pack));
    s = Math.max(s, border ? 0 : W / sw, H / (sh + pack));
    return Math.min(s, W / LOCATION_VIEW_W, H / floorH);
  };
  const z = Math.min(1, Math.max(0, finite(zoom, 0)));
  let scale = ruleScale(VIEW_MAX_W, VIEW_CEIL_H);
  if (z > 0) scale *= (ruleScale(ORIGINAL_VIEW_W, ORIGINAL_VIEW_H) / scale) ** z;
  // HOUSE FIT: out until the view holds `fitViewH`, never past the scene's own height or width.
  const fit = Math.min(finite(fitViewH), sh, VIEW_HOLD_H);
  // fitMinShare (a sideways phone): the fit may zoom out to that share of the usual scale and no
  // further, so the player stays a size you can see (Austin 2026-11-22: cap it); a tall house's top
  // may then run off a short screen.
  if (fit > 0) scale = Math.max(Math.min(scale, Math.max(H / (fit + pack), border ? 0 : W / sw)), scale * Math.min(1, Math.max(0, finite(fitMinShare, 0))));
  const fullW = Math.round(W / scale);
  const bordered = border && fullW > Math.round(sw);
  const viewW = bordered ? Math.round(sw) : fullW;
  const room = Math.floor(H / scale + 1e-6) - pack;
  // A scene a few px shorter than the floors leave shows its ground skirt (the camera frames it);
  // only a portrait window, where the width floor wins, is held (VIEW_HOLD_H).
  const viewH = Math.max(VIEW_FLOOR_H, Math.min(room, VIEW_HOLD_H));
  const held = viewH < room;
  return {
    scale,
    viewW,
    viewH,
    canvasH: viewH + pack,
    cssWidth: bordered ? viewW * scale : W,
    cssHeight: held ? (viewH + pack) * scale : H,
    pinned: false,
    ...(bordered ? { bordered: true } : {}),
  };
}

/** G880: the band's colour over a scene with no dark colour of its own (the narrow street's border, style.css --c-grey-29). */
export const SHORT_SCENE_BAND = '#2a2a2a';
/** G880: the most a scene's own top colour may light (relative luminance, 0 to 1) and still fill the band. */
export const SHORT_SCENE_BAND_MAX_LUMA = 0.05;

/**
 * PURE (G880, Austin 2026-11-16): the colour of the band an upright phone leaves above a scene
 * shorter than the screen. Dark everywhere: a scene whose own top colour is dark keeps it (a Tower
 * floor's timber wall, the Back Alley's forest, G863), every other one (a street's light sky, #348,
 * the ground floor's yard, a sunny quest room) gets SHORT_SCENE_BAND. `skyTop` is a #rrggbb.
 */
export function shortSceneBand(skyTop) {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(skyTop || ''));
  if (!m) return SHORT_SCENE_BAND;
  const lin = (h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luma = 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
  return luma <= SHORT_SCENE_BAND_MAX_LUMA ? String(skyTop).toLowerCase() : SHORT_SCENE_BAND;
}

/**
 * PURE (TOUCH PORTRAIT): the stage of an upright phone (the phone gate's phone, a window taller
 * than wide). The width floor that keeps a computer's view 960 px wide drew a portrait iPhone's
 * street as a 0.41x strip under a 400 px band of sky (Austin 2026-11-12). Here the scene's height
 * fits the screen's instead: the view is the scene's own height (VIEW_FLOOR_H to VIEW_HOLD_H, the
 * whole of nearly every street), the canvas fills the window and the view is as wide as that
 * leaves (675 px on a 393 x 659 iPhone, against 1156 x 408 sideways). A scene so short the view
 * would be narrower than PHONE_PORTRAIT_MIN_VIEW_W holds that width and keeps a band above, as a
 * tall window always did; a scene narrower than the view magnifies to fill it. Zoom does not
 * apply (the Wide and Original ends come out the same).
 *
 * PHONE ZOOM: `closeup` (0 to 1, js/world-zoom.js phoneZoom, a pinch) magnifies from that view
 * (0) toward the closest the floors allow (a VIEW_FLOOR_H view filling the screen's height),
 * geometrically like the world zoom, and 1 stops PHONE_CLOSEST_SHARE of the way there (closer drew
 * the art soft: the phone draws 1 backing px per world px, js/render-density.js); the camera then
 * scrolls the street up and down as a computer's does. Fewer world px are drawn, never bigger
 * textures.
 *
 * GROUND LINE (G1146, report #617): with `groundLine`, the scene's height counts only down to it.
 * The canvas runs the pack reserve (132 world px) past the view, which the phone's short pack row
 * leaves mostly open, so fitting the scene's bottom showed 130 px or more of the bare fill under
 * the street's ground (Briarset Croft); fitting the line magnifies about 1.1 times there.
 */
export function phoneStage({ width, height, packReserve = MIN_PACK_HEIGHT, sceneWidth, sceneHeight, closeup = 0, groundLine } = {}) {
  const W = finite(width);
  const H = finite(height);
  const pack = finite(packReserve, MIN_PACK_HEIGHT);
  const sh = finite(sceneHeight);
  let fitH = Math.min(VIEW_HOLD_H, Math.max(VIEW_FLOOR_H, sh > 0 ? Math.floor(sh) : VIEW_HOLD_H));
  // GROUND LINE (G1146): the canvas (the view and the pack reserve under it) ends at the street's
  // ground line, not past its bottom, so the scene magnifies a little to fill the screen.
  const line = finite(groundLine);
  if (line > 0) fitH = Math.min(fitH, Math.max(VIEW_FLOOR_H, Math.floor(line) - pack));
  let scale = Math.min(H / (fitH + pack), W / PHONE_PORTRAIT_MIN_VIEW_W);
  const sw = finite(sceneWidth);
  if (sw > 0) scale = Math.max(scale, W / sw);
  const top = H / (VIEW_FLOOR_H + pack);
  scale = Math.min(scale, top);
  const c = Math.min(1, Math.max(0, finite(closeup, 0)));
  if (c > 0 && top > scale) scale *= (top / scale) ** (c * PHONE_CLOSEST_SHARE);
  const viewW = Math.round(W / scale);
  const room = Math.floor(H / scale + 1e-6) - pack;
  const viewH = Math.max(VIEW_FLOOR_H, Math.min(room, fitH));
  const held = viewH < room;
  return { scale, viewW, viewH, canvasH: viewH + pack, cssWidth: W, cssHeight: held ? (viewH + pack) * scale : H, pinned: false, phone: true };
}

/**
 * The least share of a sideways phone's usual scale the house fit (G796) may zoom out to: 0.72x
 * on a 844x390 phone would fall to 0.38x for the Firebog House, the avatar about 45 CSS px tall;
 * capped it stays at about 0.5x (Austin 2026-11-22: cap it).
 */
export const LANDSCAPE_PHONE_FIT_MIN_SHARE = 0.7;

/**
 * PURE (LANDSCAPE PHONE, Austin 2026-11-13: phones play upright and sideways): the stage of a phone
 * held sideways (the phone gate's phone, a window at least as wide as tall). Level 0 is exactly the
 * computer rule it always took (a 408 px tall view filling the short side: 1174 x 408 world px on a
 * 874 x 402 iPhone), so the whole-street view is never narrower than before. That rule already sits
 * on the view's height floor, so the computer zoom (Wide to Original) draws the same there and
 * pinching did nothing (phoneZoomSpan 1).
 *
 * PHONE ZOOM: `closeup` (0 to 1, js/world-zoom.js phoneZoom, the pinch and the Menu's slider)
 * magnifies from that view toward the scale the same phone reaches upright with a VIEW_FLOOR_H view
 * filling its long side (phoneStage's closest end), geometrically, and 1 stops
 * LANDSCAPE_PHONE_CLOSEST_SHARE of the way there, so the avatar comes out about as big at the closest
 * level either way up. Closer than the floor rule, the view is shorter than VIEW_FLOOR_H (the room
 * the screen leaves over the pack reserve) and the camera scrolls the street up and down, as it
 * does upright. Fewer world px are drawn, never bigger textures.
 */
export function landscapePhoneStage({ width, height, packReserve = MIN_PACK_HEIGHT, sceneWidth, sceneHeight, zoom = 0, closeup = 0, fitViewH } = {}) {
  const W = finite(width);
  const H = finite(height);
  const pack = finite(packReserve, MIN_PACK_HEIGHT);
  const base = computerStage({ width: W, height: H, packReserve: pack, sceneWidth, sceneHeight, pinnedHeight: NaN, zoom, fitViewH, fitMinShare: LANDSCAPE_PHONE_FIT_MIN_SHARE });
  const c = Math.min(1, Math.max(0, finite(closeup, 0)));
  const top = Math.max(W, H) / (VIEW_FLOOR_H + pack);
  if (!(c > 0) || !(top > base.scale) || !(W > 0) || !(H > 0)) return { ...base, phone: true, landscape: true };
  const scale = base.scale * (top / base.scale) ** (c * LANDSCAPE_PHONE_CLOSEST_SHARE);
  const viewW = Math.round(W / scale);
  const viewH = Math.max(1, Math.min(base.viewH, Math.floor(H / scale + 1e-6) - pack));
  return { scale, viewW, viewH, canvasH: viewH + pack, cssWidth: W, cssHeight: H, pinned: false, phone: true, landscape: true };
}

/**
 * PURE (G673, "Zoomed in on a phone, your Glitch sits high in the view"): the camera anchor on a
 * phone. The desktop camera puts the feet at `anchor` (0.75, yCamOffsetAnchor) of the location view,
 * the canvas less the 132 world px pack reserve, which the computer's pack (about 104 CSS px at 1:1)
 * roughly covers: the original's loc_vp_h was the stage less the pack it showed (TSMainView.as
 * resizeToStage 1229-1257). A phone's pack row is shorter (packCoverCss, about 64 CSS px) and stays
 * that size while the zoom magnifies the reserve (120 CSS px at portrait's closest, 152 sideways),
 * so zoomed in the feet sat at 0.75 of a view that ended far above the real pack: 46% down a
 * sideways screen. Here the anchor is `anchor` of the room over the real pack instead (in view px:
 * viewH + packReserve - packCoverCss / scale), never higher than the desktop anchor, never so low
 * the feet come nearer the real pack than `clearance` (js/movement.js MIN_GROUND_CLEARANCE), and at
 * most 0.95 of the view. No measured pack (hidden, not laid out): the anchor as given.
 */
export function phoneCameraAnchor({ anchor = 0.75, viewH, packReserve = MIN_PACK_HEIGHT, packCoverCss, scale, clearance = 40 } = {}) {
  const base = finite(anchor, 0.75);
  const view = finite(viewH);
  const cover = finite(packCoverCss);
  const s = finite(scale);
  if (!(view > 0) || !(cover >= 0) || !(s > 0)) return base;
  const room = view + finite(packReserve, MIN_PACK_HEIGHT) - cover / s;
  const feet = Math.min(base * room, room - finite(clearance, 40));
  return Math.min(0.95, Math.max(base, feet / view));
}

/**
 * The least ground (world px) a phone's camera keeps under the feet, over the pack row or the
 * canvas's bottom, where the street's ground art ends sooner than MIN_GROUND_CLEARANCE under them.
 */
export const PHONE_GROUND_MIN_CLEARANCE = 12;

/**
 * PURE (G1146, report #617, Austin's pick 2026-11-22): the ground line of a street layer (world px
 * from its top; tools/ground-line/build.mjs, js/street-ground-lines.js), or NaN when the scene has
 * none (homes, a street whose art runs on well past its bottom). A room may name its own on its
 * scene (`groundLine`, G1148: Top of Tree).
 */
export function sceneGroundLine(layer, lines = STREET_GROUND_LINES) {
  const own = finite(layer?.groundLine);
  if (own > 0) return own;
  const line = finite(lines?.[layer?.street?.tsid]);
  return line > 0 ? line : NaN;
}

/**
 * PURE (G1146, report #617): the camera's world height on a phone (movement.js cameraTargetY's
 * worldHeight), so the canvas's bottom (the camera's view plus the pack reserve under it) stops at
 * the street's ground line: how far down its ground art covers the whole width. Glitch's camera
 * never went past a street's bottom (CameraMan.as 451-453) and its 600 px view seldom reached it;
 * a phone shows the whole height upright, and scrolled to the bottom sideways, with the pack
 * reserve open under the short pack row, so it showed the bare strip under the ground's last
 * pieces (Briarset Croft, Grimssea Bottom).
 *
 * The feet still keep their room over the real pack row (packCoverCss, as phoneCameraAnchor; none
 * when the row is not shown): `clearance` (MIN_GROUND_CLEARANCE), or only as much ground as the art
 * has under the deepest floor (`floorY`) when that is less, never under PHONE_GROUND_MIN_CLEARANCE.
 * So where the art ends close under the floor the camera stops as low as the pack row needs.
 * Never lower than `worldHeight` (the camera's usual height). No line: `worldHeight` as given.
 */
export function phoneGroundWorldHeight({ worldHeight, groundLine, floorY, packReserve = MIN_PACK_HEIGHT, packCoverCss, scale, clearance = 40 } = {}) {
  const world = finite(worldHeight);
  const line = finite(groundLine);
  if (!(world > 0) || !(line > 0)) return world;
  const pack = finite(packReserve, MIN_PACK_HEIGHT);
  const floor = finite(floorY);
  const s = finite(scale);
  const coverCss = finite(packCoverCss);
  const cover = coverCss > 0 && s > 0 ? coverCss / s : 0;
  let bottom = line;
  if (Number.isFinite(floor)) {
    const room = Math.min(finite(clearance, 40), Math.max(PHONE_GROUND_MIN_CLEARANCE, line - floor));
    bottom = Math.max(bottom, floor + room + cover);
  }
  return Math.min(world, bottom - pack);
}
