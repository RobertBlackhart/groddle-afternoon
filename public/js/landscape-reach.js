/**
 * PURE (G951, Austin 2026-11-17): how far a drawn landscape (the home street and back yard,
 * js/features/homes-feature.js drawLandscape; a neighbour's street, js/features/neighbour-scene.js)
 * must reach past its street's ends so the camera never shows sky where its field, soil or
 * hills should be.
 *
 * The camera (game.js cameraTargetForPlayer, movement.js cameraTargetX) runs from 0 to the
 * street's width less its location view, the view less the right-hand reserve the Social drawer
 * takes (game.js syncCameraSafeArea; movement.js cameraLocationViewWidth caps it at 0.48 of the
 * view), so at the right end it shows up to that reserve past the street (G582). A street
 * narrower than the view sits centred, showing (view - width) / 2 past each end. These scenes
 * are drawn once and must hold for every view up to LANDSCAPE_VIEW_W (a window resize, the zoom
 * and the drawer opening never redraw them). Their field stopped 50 px past the street, so with
 * the drawer open its sky showed under the drawer, and the soil's cross-section art stepped
 * down where the field ended.
 *
 * A parallax layer at rate f sits at camX * (1 - f) (drawLandscape's update), so what it shows,
 * in its own coordinates, runs from camX * f to camX * f + view.
 */
import { cameraLocationViewWidth } from './movement.js?v=f4be1a05';

/** The widest view a drawn landscape must cover (js/location-view.js: VIEW_MAX_W 1680, wider on ultrawide windows). */
export const LANDSCAPE_VIEW_W = 2000;

const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/**
 * The camera's x at both ends of a street `width` wide in a view `viewW` wide, with the most
 * right-hand reserve the camera allows (movement.js cameraLocationViewWidth).
 */
export function cameraEnds(width, viewW) {
  const W = Math.max(0, num(width));
  const view = Math.max(1, num(viewW, 1));
  // game.js cameraTargetForPlayer: a scene narrower than the view sits centred.
  if (view > W) return { min: -(view - W) / 2, max: -(view - W) / 2 };
  const loc = cameraLocationViewWidth(view, view);
  return { min: 0, max: Math.max(0, W - loc) };
}

/**
 * What a layer at parallax rate `f` (1: the field and soil, drawn in street x) can show, in its
 * own x, over every camera and every view up to `viewW`: { left, right }. The right end grows
 * with the view on both sides of the width, so the view as wide as the street and the widest
 * view bound it.
 */
export function landscapeWindow(width, f = 1, viewW = LANDSCAPE_VIEW_W) {
  const W = Math.max(0, num(width));
  const rate = num(f, 1);
  const widest = Math.max(1, num(viewW, LANDSCAPE_VIEW_W));
  const views = W > 0 && W < widest ? [W, widest] : [widest];
  let left = 0;
  let right = W;
  for (const view of views) {
    const cam = cameraEnds(W, view);
    left = Math.min(left, cam.min * rate);
    right = Math.max(right, cam.max * rate + view);
  }
  return { left, right };
}

/**
 * A repeated landscape row (centres at `base + k * every`, each up to `half` wide either side
 * of its centre once its jitter `jitter` moves it) over a layer window: the first and last k
 * whose art could show there. k 0 is the row's first piece as the scenes always drew it, so
 * the pieces in the street keep their place and seed; only pieces past its ends are added.
 */
export function rowRange({ base = 0, every, half = 0, jitter = 0 }, win) {
  const step = num(every);
  if (!(step > 0)) return { first: 0, last: -1 };
  const reach = Math.max(0, num(half)) + Math.abs(num(jitter));
  // A piece shows when its right edge passes the window's left and its left edge is short of the right.
  const first = Math.min(0, Math.floor((win.left - reach - base) / step) + 1);
  const last = Math.ceil((win.right + reach - base) / step) - 1;
  return { first, last };
}
