/**
 * G892: the skill-package words other players see over a Glitch at work.
 *
 * players/inc_skill_packages.js runSkillPackage 207-314: when a package with a
 * duration runs with an overlay_id (pet, nibble, squeeze, milk, massage, harvest, scoop,
 * revive), the actor's own announcement carries word_progress, so the actor's
 * client draws its word progress bar instead of the SWF (InLocationAnnouncementOverlay.as
 * 441-442; js/word-progress.js already does). Everyone else on the street gets a
 * pc_overlay over the actor (apiSendAnnouncementX, 294-314): the overlay in Tiny
 * Speck's thought bubble (bubble: true), 40 x 40 (bubble_width when given),
 * delta_y -110, for the package's duration, never cancelled early.
 *
 * Online, the actor sends one emote word sp_<overlay>_<seconds> when the timed verb
 * starts (the server relays any [a-z0-9_]{1,24} word, hub.go wordRe), and each other
 * client draws the bubble over that player for those seconds. The art is the CC0
 * glitch-overlays FLAs, drawn by tools/overlays/build.mjs into overlays-more.json.
 */

import { OVERLAY_BUBBLE_URL, loadMoreOverlays, overlayBubbleBox, playOverlay } from './overlays.js?v=eda942a8';
import { textureFromUrl } from './textures.js?v=8e0a8c38';
import { SPEECH_BUBBLE_Z } from './fx-z.js?v=18dda7e3';

/** inc_skill_packages.js 294-305: the bubble the others see. */
export const SKILL_BUBBLE = Object.freeze({ wh: 40, dy: -110, src: 'players/inc_skill_packages.js 294-314' });

/**
 * Each overlay, the verbs that play it ({ classId: [verb ids] }) and its GSJS call.
 * wh: the larger of bubble_width and the height 40 (InLocationAnnouncementOverlay.as 425).
 */
export const SKILL_BUBBLES = Object.freeze({
  butterfly_milk: { on: { npc_butterfly: ['milk'], npc_batterfly: ['milk'] }, wh: 40, src: 'items/npc_butterfly.js 736, npc_batterfly.js 862' },
  butterfly_massage: { on: { npc_butterfly: ['massage'], npc_batterfly: ['massage'] }, wh: 40, src: 'items/npc_butterfly.js 813, npc_batterfly.js 895' },
  pig_pet: { on: { npc_piggy: ['pet'], npc_kitty: ['pet'] }, wh: 40, src: 'items/npc_piggy.js 955, npc_kitty.js 432' },
  pig_nibble: { on: { npc_piggy: ['nibble'], npc_kitty: ['nibble'] }, wh: 40, src: 'items/npc_piggy.js 882, npc_kitty.js 503' },
  chicken_squeeze: { on: { npc_chicken: ['squeeze'], npc_kitty_chicken: ['squeeze'] }, wh: 40, src: 'items/npc_chicken.js 776, npc_kitty_chicken.js 942' },
  trant_pet: {
    on: Object.fromEntries(['trant_fruit', 'trant_egg', 'trant_bean', 'trant_bubble', 'trant_spice', 'trant_gas', 'wood_tree'].map((c) => [c, ['pet']])),
    wh: 40,
    src: 'items/include/trants.js 35, wood_tree.js 1060',
  },
  trant_harvest: { on: Object.fromEntries(['trant_fruit', 'trant_egg', 'trant_bean', 'trant_bubble', 'trant_spice', 'trant_gas'].map((c) => [c, ['harvest']])), wh: 40, src: 'items/include/trants.js 250' },
  // include/rook.js 128: bubble_width 75 for the longer word.
  rooked_revive: { on: { '*': ['rook_revive'] }, wh: 75, src: 'items/include/rook.js 128' },
  jellisac_scoop: { on: { jellisac: ['scoop'] }, wh: 40, src: 'items/jellisac.js 67' },
});

/** The overlay a timed verb shows the others, or null. Verb ids may carry a ':' suffix (feed:cherry). */
export function skillBubbleFor(classId, verbId) {
  const verb = String(verbId || '').split(':')[0];
  for (const [key, row] of Object.entries(SKILL_BUBBLES)) {
    if ((row.on[classId] || row.on['*'] || []).includes(verb)) return key;
  }
  return null;
}

const MAX_SECONDS = 99;

/** The emote word for an overlay shown for `ms` (whole seconds, 1..99), or null. */
export function skillBubbleWord(key, ms) {
  if (!SKILL_BUBBLES[key]) return null;
  const s = Math.max(1, Math.min(MAX_SECONDS, Math.round((Number(ms) || 0) / 1000)));
  return `sp_${key}_${s}`;
}

/** { key, durationMs } from an emote word, or null for any other word. */
export function parseSkillBubbleWord(word) {
  const m = /^sp_([a-z_]+)_(\d{1,2})$/.exec(String(word || ''));
  if (!m || !SKILL_BUBBLES[m[1]] || Number(m[2]) < 1) return null;
  return { key: m[1], durationMs: Number(m[2]) * 1000 };
}

/**
 * Draw an overlay in the thought bubble standing on the point `at()` gives (the avatar's
 * feet; the bubble's bottom sits SKILL_BUBBLE.dy above them), its art fitted to wh and
 * centred in the bubble's top (overlays.js overlayBubbleBox). Returns { stop(), done }.
 */
export function playSkillBubble(engine, key, at, { durationMs = 2000, alive = null, holdMs = null } = {}) {
  const row = SKILL_BUBBLES[key];
  const { PIXI } = engine || {};
  const layer = engine?.fxLayer;
  const handle = { key, stopped: false, overlay: null, bubble: null, done: null, stop() { handle.stopped = true; handle.overlay?.stop(); } };
  if (!row || !PIXI?.Sprite || !layer) {
    handle.done = Promise.resolve(false);
    return handle;
  }
  handle.done = loadMoreOverlays().then((manifest) => {
    const meta = manifest?.[key];
    if (!meta || handle.stopped) return false;
    const [sw, sh] = meta.stage;
    const k = row.wh / Math.max(sw, sh);
    const box = overlayBubbleBox(sw * k, sh * k);
    const point = () => { const p = at(); return { x: p.x, y: p.y + SKILL_BUBBLE.dy }; };
    const bubble = new PIXI.Sprite(textureFromUrl(OVERLAY_BUBBLE_URL, { scale: 4, resolution: 4 }));
    bubble.anchor.set(0.5, 1);
    bubble.width = box.w;
    bubble.height = box.h;
    bubble.alpha = 0;
    bubble.eventMode = 'none';
    bubble.zIndex = SPEECH_BUBBLE_Z;
    bubble.label = `overlay:${key}-bubble`;
    layer.addChild(bubble);
    handle.bubble = bubble;
    const place = () => {
      if (bubble.destroyed) return;
      const p = point();
      bubble.x = p.x;
      bubble.y = p.y;
    };
    place();
    const h = playOverlay(PIXI, key, {
      layer,
      at: () => { const p = point(); return { x: p.x, y: p.y - box.artBottom }; },
      wh: row.wh,
      durationMs,
      loop: true,
      alive,
      holdMs,
      zIndex: SPEECH_BUBBLE_Z + 1,
      // The word fades in and out in its own frames; the bubble keeps the overlay's fade.
      onFrame: () => {
        place();
        if (!bubble.destroyed && h.sprite) bubble.alpha = h.sprite.alpha;
      },
    });
    handle.overlay = h;
    if (handle.stopped) h.stop();
    return h.done.finally(() => { if (!bubble.destroyed) bubble.destroy(); });
  }).catch(() => false);
  return handle;
}
