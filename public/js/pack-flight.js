/**
 * An item given from something in the street flies into the pack (#498), as the client drew a
 * FLOOR_TO_PACK announcement (glitch-client ItemstackAnimation.as 237-269; the server raised one
 * for every pc.createItemFromSource, e.g. items/hell_bartender.js 342 grantWine): the item's icon
 * (80 px) grows from nothing at its source over 1 s (easeOutBack) while rising to a float height,
 * with "+N" beside it growing to 24 px; it sits there 0.7 s; then the count goes and the icon flies
 * 0.5 s (easeOutBack) to the pack slot that holds it, shrinking to half size.
 *
 * The client's float height came from its stylesheet (offsets.itemstack_animation_zenith), which is
 * not in the client source: PACK_FLIGHT.risePx is the guessed stand-in (tools/inventions/inventions.json
 * pack-flight-rise), as is the count's colour (the client's itemstack_animation_add class).
 *
 * A page element (as the slug flights in game.js animateSpeechSlugs), so it stays sharp at any pixel
 * ratio and can end over the pack bar. Reduced motion: no flight. This file only draws; game.js
 * engine.flyToPack finds the points.
 */

export const PACK_FLIGHT = Object.freeze({
  /** ItemstackAnimation.as 237-269: grow and rise 1 s, sit 0.7 s, fly 0.5 s. */
  riseMs: 1000,
  holdMs: 700,
  flyMs: 500,
  /** go(): item_icon_wh 80 for a floor/pc/familiar flight. */
  iconPx: 80,
  /** The fly tween ends at icon_perc .5. */
  endScale: 0.5,
  /** end_text_size: the count grows to 24 px. */
  textPx: 24,
  /** Guessed float height (the client's CSS offset is lost): how far above the source it rises. */
  risePx: 60,
  /** TSTweener easeOutBack (Penner, s = 1.70158) as a CSS curve. */
  ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
});

const total = (A) => A.riseMs + A.holdMs + A.flyMs;

/**
 * The icon's keyframes (Web Animations), pure: from the source point (scale 0) up RISE_PX to full
 * size, held, then to `to` at half size. Points are client pixels.
 */
export function packFlightFrames(from, to, A = PACK_FLIGHT) {
  const t = total(A);
  const at = (p, k) => `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px) translate(-50%, -50%) scale(${k})`;
  const top = { x: from.x, y: from.y - A.risePx };
  return [
    { transform: at(from, 0), offset: 0, easing: A.ease },
    { transform: at(top, 1), offset: A.riseMs / t },
    { transform: at(top, 1), offset: (A.riseMs + A.holdMs) / t, easing: A.ease },
    { transform: at(to, A.endScale), offset: 1 },
  ];
}

/** The count's keyframes: shown while the icon grows and sits, gone as it flies (val_tf.visible = false). */
export function packFlightCountFrames(A = PACK_FLIGHT) {
  const t = total(A);
  const off = (A.riseMs + A.holdMs) / t;
  return [
    { opacity: 1, offset: 0 },
    { opacity: 1, offset: off },
    { opacity: 0, offset: Math.min(1, off + 0.01) },
    { opacity: 0, offset: 1 },
  ];
}

/** "+3", or "-1" for a count taken away (go(): txt). */
export function packFlightCount(count) {
  const n = Math.abs(Math.round(Number(count) || 0));
  return `${Number(count) < 0 ? '-' : '+'}${n}`;
}

/**
 * Flies one icon. `from`/`to` are client points; `iconUrl` the item's icon. Returns the element
 * (removed when it lands), or null when it cannot be drawn (no document, no points, reduced motion).
 */
export function flyItemToPack({ doc = globalThis.document, from, to, iconUrl, count = 1, reduced = false, A = PACK_FLIGHT, onDone = null } = {}) {
  if (reduced || !doc?.createElement || !doc.body || !iconUrl) return null;
  if (![from?.x, from?.y, to?.x, to?.y].every(Number.isFinite)) return null;
  const el = doc.createElement('div');
  el.className = 'pack-flight';
  el.setAttribute('aria-hidden', 'true');
  Object.assign(el.style, {
    position: 'fixed', left: '0', top: '0', zIndex: 'var(--z-notice)', pointerEvents: 'none',
    width: `${A.iconPx}px`, height: `${A.iconPx}px`, transformOrigin: '50% 50%',
    filter: 'drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.5))',
  });
  const img = doc.createElement('img');
  img.src = iconUrl;
  img.alt = '';
  Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'contain', display: 'block' });
  const label = doc.createElement('span');
  label.textContent = packFlightCount(count);
  Object.assign(label.style, {
    position: 'absolute', left: `${A.iconPx + 4}px`, top: '50%', transform: 'translateY(-50%)',
    font: `800 ${A.textPx}px/1 var(--font-ui, sans-serif)`, color: '#ffffff', whiteSpace: 'nowrap',
    textShadow: '0 0 2px rgba(0, 0, 0, 0.7), 0 0 3px rgba(0, 0, 0, 0.7), 0 0 4px rgba(0, 0, 0, 0.7)',
  });
  el.append(img, label);
  doc.body.appendChild(el);
  const finish = () => {
    el.remove();
    onDone?.();
  };
  if (typeof el.animate !== 'function') {
    finish();
    return null;
  }
  const anim = el.animate(packFlightFrames(from, to, A), { duration: total(A), fill: 'forwards' });
  label.animate?.(packFlightCountFrames(A), { duration: total(A), fill: 'forwards' });
  anim.onfinish = finish;
  anim.oncancel = finish;
  return el;
}

/*
 * G1016 (Austin 2026-11-18): an item that flies into the pack is not also floated as "+N <item>"
 * from the avatar: Glitch showed only the flight (the FLOOR_TO_PACK announcement was the gain's one
 * picture). game.js notes each flight drawn; pushActivity floats only the items that did not fly.
 */
const flown = new Map();

/** Note that `classTsid` just flew into the pack (a flight was drawn). */
export function noteFlown(classTsid, now = Date.now()) {
  if (classTsid) flown.set(String(classTsid), now);
}

/** A gain's items minus those that flew into the pack within one flight's time (theirs is the flight). */
export function unflownItems(items = {}, now = Date.now(), A = PACK_FLIGHT) {
  const out = {};
  for (const [id, n] of Object.entries(items || {})) {
    const at = flown.get(id);
    if (at != null && now - at >= 0 && now - at <= total(A)) continue;
    out[id] = n;
  }
  return out;
}
