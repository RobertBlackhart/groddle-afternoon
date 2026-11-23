/**
 * Winter Walk's big icicles fall (register row G472). Pure rules (no Pixi, no DOM); the
 * rebuilt-rooms feature runs them on the walk (features/rebuilt-rooms-feature.js).
 *
 * Source: no GSJS (the walk template's event scripts are lost, js/winter-walk-streets.js). The
 * Glitch Tribute Blog's 37374550569 says "you hit icicles to make these large ones fall", and the
 * walk's caption asks about the ding-a-ling-ling of tapped icicles. The recording 2Xko9Hy-cLE
 * ("A Winter Walk", Lily Linguistic, 3:04; research/refs-review-2026-11-10 D; reference only,
 * nothing of it ships) shows how, 1:25.6-1:26.3: a big icicle hangs from the overhang; the
 * avatar walks along the floor to just short of under it (about 70 px left of its point, no
 * click, the pointer still); within an eighth of a second it is down, stuck point-first in the
 * snow as a tall snow pillar, snow cap up, right where it hung, beside a short pillar that
 * stood from the start. The avatar climbs the short pillar, hops onto the new one and takes the
 * mote over it (+3,000 iMG at 1:29). A fallen icicle stays down.
 *
 * Ours: the trigger box's size (the recording shows one fall), how tall a fallen icicle stands
 * (one hop from the floor, as the walk's short pillars, so each is a step), its width, and the
 * sound: the recording's music covers the fall (a short bright transient at the landing,
 * 1:26.2), so it plays Tiny Speck's own ICE_CUBE recording (items/ice_knob.js 320).
 */

/** Under an icicle: the avatar's feet this close across (the recording: ~70 px short of its point). */
export const ICICLE_TRIGGER_HALF = 70;
/** ...and on the floor (feet within this of the walk line). */
export const ICICLE_TRIGGER_FLOOR = 24;
/** The drop: down within an eighth of a second in the recording; a little longer so it is seen. */
export const ICICLE_FALL_MS = 260;
/** A fallen icicle stands one hop off the floor (the walk's short pillars rise 95 px). */
export const ICICLE_RISE = Object.freeze({ min: 70, max: 100 });
/** Its cap, narrower than the walk's own pillars (150-170) so it stands between them. */
export const ICICLE_PILLAR_W = 112;
export const ICICLE_PILLAR_SPRITE = 'icicle_1b_al1';
/** icicle_1b_al1's height over its width (282 x 674): drawn at its own shape. */
export const ICICLE_PILLAR_ASPECT = 674 / 282;
export const ICICLE_SOUND = 'ICE_CUBE';

/**
 * G1203 (Austin 2026-11-23, an invention: the walk's template and its scripts are lost, so how a
 * tap sounded there is unknown): the caption asks about the ding-a-ling-ling of tapped icicles,
 * so a click or a tap on a hanging icicle plays a chime from Tiny Speck's own icicle notes, the
 * ones Lotha Harte's tapped icicles play (WM_D1, WM_D2, WM_E2; js/street-toys.js). WM_E2, its
 * highest, reads as the lightest ding. The tap works from anywhere on the walk (no walk under it,
 * so it never drops one) and leaves the falls as they were.
 */
export const ICICLE_CHIME = 'WM_E2';
export const ICICLE_CHIME_VERB = Object.freeze({ id: 'click_broadcast', label: 'Tap', enabled: true, durationMs: 0 });

/** Whether icicle i still hangs (a tap chimes; a falling or fallen one does not). */
export function icicleTappable(state, i) {
  return state?.stage?.[i] === 'hang';
}

/**
 * The tap box of an icicle drawn at layer x, y (its point, the art's bottom centre) and h tall:
 * the whole icicle, a little wider than the art so a thin one is easy to hit. { x, y, w, h }, bottom-centre.
 */
export function icicleTapBox(x, y, h) {
  const w = Math.max(48, Math.round(h * 318 / 842) + 16);
  return { x, y, w, h: Math.max(60, h) };
}

/**
 * Where icicle `ic` ({ x, top, h }, world) stands once fallen, on the floor `floorY` (world):
 * centre x, cap top y, cap width, and the standable line on its cap.
 */
export function fallenIcicle(ic, floorY) {
  const rise = Math.max(ICICLE_RISE.min, Math.min(ICICLE_RISE.max, Math.round(ic.h * 0.5)));
  const top = floorY - rise;
  const half = Math.round(ICICLE_PILLAR_W * 0.42);
  return { x: ic.x, top, w: ICICLE_PILLAR_W, rise, plat: { x1: ic.x - half, x2: ic.x + half, y: top } };
}

/** Whether the avatar's feet (world x, y) are under icicle `ic`, on the floor. */
export function underIcicle(ic, feet, floorY) {
  if (!feet || !Number.isFinite(feet.x) || !Number.isFinite(feet.y)) return false;
  return Math.abs(feet.x - ic.x) <= ICICLE_TRIGGER_HALF && Math.abs(feet.y - floorY) <= ICICLE_TRIGGER_FLOOR;
}

/** A fresh state for one visit to the walk: every icicle hanging. */
export function createIcicleState(count) {
  return { stage: Array.from({ length: count }, () => 'hang'), startedAt: Array.from({ length: count }, () => 0) };
}

/**
 * One frame: start the fall of any hanging icicle the avatar stands under, and land those whose
 * drop is over. Returns { started: [i], landed: [i] }.
 */
export function stepIcicles(state, icicles, feet, floorY, now) {
  const started = [];
  const landed = [];
  icicles.forEach((ic, i) => {
    if (state.stage[i] === 'hang' && underIcicle(ic, feet, floorY)) {
      state.stage[i] = 'fall';
      state.startedAt[i] = now;
      started.push(i);
    } else if (state.stage[i] === 'fall' && now - state.startedAt[i] >= ICICLE_FALL_MS) {
      state.stage[i] = 'down';
      landed.push(i);
    }
  });
  return { started, landed };
}

/** 0..1 through a fall (eased in: it drops, gathering speed). */
export function fallProgress(state, i, now) {
  if (state.stage[i] === 'down') return 1;
  if (state.stage[i] !== 'fall') return 0;
  const t = Math.min(1, Math.max(0, (now - state.startedAt[i]) / ICICLE_FALL_MS));
  return t * t;
}

/** QA trail: "1:hang,2:down,...". */
export function icicleSummary(state) {
  return state.stage.map((s, i) => `${i + 1}:${s}`).join(',');
}
