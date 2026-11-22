/**
 * The house on the home street (G796, pure rules: no Pixi, no DOM).
 *
 * Sources (tinyspeck/glitch-GameServerJS and glitch-client, CC0):
 * - items/furniture_chassis.js          label "Groddle Cottage", the base chassis; instanceProps
 *                                       upgrade_id, facing_right, user_config; can_flip "1";
 *                                       verbs.customize (sort_on 54, owner only, after the intro)
 *                                       runs verbs.upgrade's handler: furniture_upgrade_start
 *                                       with every style and its config (201-346);
 *                                       getDefaultUpgradeConfig (the Cottage's start, 404-412)
 * - items/catalog_furniture.js          furniture_chassis 3334-3523: the nine upgrade styles,
 *                                       each with its name, SWF, start config and credits_cost
 * - locations/inc_homes.js              the chassis stands on the street's door, facing left
 *                                       (setInstanceProp('facing_right', 0), 2459-2504); a street
 *                                       style change keeps it (homes_rebuild_exterior)
 * - items/magic_rock.js                 the three free starter houses a new player picked from
 *                                       (Firebog 220, Tiny Hominid 219, the Cottage: 859-876,
 *                                       showChassisPicker 1075-1171)
 * - glitch-client ChassisManager.as,    the house picker: every style, then one row per part
 *   ChassisPickerUI.as, ConfigOption.as (sorted by label, ConfigOption.as 181-182), with
 *   ConfiggerUI.as                      Randomize and Flip; "You are in House Changing Mode"
 *
 * Remake decisions:
 * - Styles cost credits (real money) in the original; the remake has no credits, so every
 *   house and part is free, as Tower styles are (inventions: house-styles-free).
 * - The remake's first homes drew one of three door-deco houses (Meadow, Firebog, Uralia,
 *   from the Selection Machine's style); saves move onto the originals: Meadow to the
 *   Groddle Cottage, Firebog to the Firebog House, Uralia to the Tiny Hominid House, so the
 *   three stay three different houses and are the three free starter houses Glitch offered
 *   (inventions: house-save-migration).
 * - Art: tools/house-art/build.mjs (every choice of every part, 1x + 3x WebP).
 */

import { HOUSE_ART } from './home-house-art.js?v=b949a0f7';

export { HOUSE_ART };

export const HOUSE_CHASSIS = 'furniture_chassis';
export const HOUSE_ART_DIR = 'assets/sprites/home-house/';

/** catalog_furniture.js furniture_chassis (upgrade id, name, credits_cost) and the base chassis. */
export const HOUSE_STYLES = Object.freeze({
  cottage: Object.freeze({ id: 'cottage', upgradeId: '', name: 'Groddle Cottage', credits: 0 }),
  frog: Object.freeze({ id: 'frog', upgradeId: '201', name: 'Frog House', credits: 140 }),
  creepy: Object.freeze({ id: 'creepy', upgradeId: '213', name: 'Creepy House', credits: 140 }),
  hominid: Object.freeze({ id: 'hominid', upgradeId: '219', name: 'Tiny Hominid House', credits: 0 }),
  firebog: Object.freeze({ id: 'firebog', upgradeId: '220', name: 'Firebog House', credits: 0 }),
  whimsy: Object.freeze({ id: 'whimsy', upgradeId: '249', name: 'House of Whimsy', credits: 180 }),
  orient: Object.freeze({ id: 'orient', upgradeId: '250', name: 'House of Orient', credits: 90 }),
  shipwreck: Object.freeze({ id: 'shipwreck', upgradeId: '709', name: 'Shipwreck', credits: 160 }),
  tipi: Object.freeze({ id: 'tipi', upgradeId: '710', name: 'Tipi Tent', credits: 0 }),
  bone: Object.freeze({ id: 'bone', upgradeId: '711', name: 'Prehistoric Bone Dwelling', credits: 180 }),
});
export const HOUSE_STYLE_IDS = Object.freeze(Object.keys(HOUSE_STYLES));

/**
 * Each style's start config by symbol: getDefaultUpgradeConfig for the Cottage and the
 * catalog's `config` for the rest (the Tipi Tent's is empty: every part's first choice, as
 * the client's ConfigOption falls back to index 0). A part the config leaves out is its
 * first choice.
 */
export const HOUSE_DEFAULT_CONFIG = Object.freeze({
  cottage: { chimney: 'chimney_stone1', door: 'door_wood', entrance: 'entrance_wood', roof: 'roof_wood', siding: 'siding_rocky', window: 'window_circle' },
  frog: { door: 'door_candy', glasses: 'white', window: 'window_dark', housedeco: 'housedeco_mustache', lip: 'lip_pink', siding: 'siding_green_frog_02', stair: 'stair_tongue_01', topdeco: 'topdeco_cupcake' },
  creepy: { door: 'door_pigwood', fence: 'fence_bars', platform: 'platform_wood', roof: 'roof_wood', topdeco: 'topdeco_empty', window: 'window_roundlight', stairsdeco: 'stairsdeco_pig', siding: 'siding_natural' },
  hominid: { base: 'base_mud', door: 'door_Blue', entrance: 'entrance_vines', ground: 'groundstep_rocks', siding: 'siding_Stone', roof: 'roof_GrassGreenMushroom' },
  firebog: { siding: 'body_brown', bottom: 'bottom_brownmed', branches: 'branches_bells', door: 'door_red', steps: 'steps_yellow', platform: 'platform_brown', top: 'topdeco_plant', windows: 'windows_circle' },
  whimsy: { body: 'body_bluepurple_ceramic', door: 'door_round_brown', side: 'side_blue', top: 'top_purple', topdeco: 'topdeco_mushrooms', windows: 'windows_shutters_purple' },
  orient: { baseboard: 'baseboard_redbrick', door: 'door_red_round', housedeco: 'housedeco_red_lamp', roof: 'roofContainer_green', topdeco: 'topdeco_green_rock' },
  shipwreck: { bowdeco: 'bowdeco_mermaid', door: 'door_window', mast: 'mast_tornfabric', siding: 'siding_bluegreen', stairs: 'stairs_planks' },
  tipi: {},
  bone: { body: 'body_two', door: 'door_one', frontbones: 'frontbones_two', skull: 'skull_hogosaurus', stair: 'stair_brokenbone' },
});

/**
 * The save migration (G796): the remake's three first homes (js/homes.js HOME_STYLES, the
 * door-deco houses they drew) onto the original chassis. A home whose save has no house
 * gets this one with its start config.
 */
export const HOUSE_FROM_HOME_STYLE = Object.freeze({ meadow: 'cottage', firebog: 'firebog', uralia: 'hominid' });

/** inc_homes.js 2502: a home street's chassis faces left. */
export const HOUSE_FACING_RIGHT = false;

const styleId = (id) => (HOUSE_STYLES[id] ? id : 'cottage');

/**
 * The rows the client offers for a style, in its order (ConfigOption.as: sorted by label,
 * case-insensitively, there being no config_option_names_sort in any house): { key, label,
 * choices } with choices the symbol names.
 */
export function houseConfigRows(id) {
  const parts = HOUSE_ART[styleId(id)].parts;
  return [...parts].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())).map((p) => ({ key: p.key, label: p.label, choices: p.choices.length, symbols: p.choices }));
}

/** A style's start config as choice numbers (1-based). */
export function defaultHouseConfig(id) {
  const style = styleId(id);
  const def = HOUSE_DEFAULT_CONFIG[style];
  const out = {};
  for (const part of HOUSE_ART[style].parts) {
    const i = part.choices.indexOf(def[part.key]);
    out[part.key] = i >= 0 ? i + 1 : 1;
  }
  return out;
}

/** A full, valid config for a style: every part 1..choices, the start config filling in. */
export function normalizeHouseConfig(id, seed = {}) {
  const style = styleId(id);
  const start = defaultHouseConfig(style);
  const src = seed && typeof seed === 'object' ? seed : {};
  const out = {};
  for (const part of HOUSE_ART[style].parts) {
    const v = Math.floor(Number(src[part.key]));
    out[part.key] = Number.isInteger(v) && v >= 1 && v <= part.choices.length ? v : start[part.key];
  }
  return out;
}

/**
 * A home's house: { chassis, config, facingRight }. A seed with no known chassis is a save from
 * before G796: it takes the house its home style moves to (HOUSE_FROM_HOME_STYLE), facing left.
 */
export function normalizeHouse(seed, homeStyle = 'meadow') {
  const src = seed && typeof seed === 'object' ? seed : {};
  if (!HOUSE_STYLES[src.chassis]) {
    const chassis = HOUSE_FROM_HOME_STYLE[homeStyle] || 'cottage';
    return { chassis, config: defaultHouseConfig(chassis), facingRight: HOUSE_FACING_RIGHT };
  }
  return {
    chassis: src.chassis,
    config: normalizeHouseConfig(src.chassis, src.config),
    facingRight: src.facingRight === true,
  };
}

/** Pick a style: its start config, as the client's upgrade picker showed it (ChassisPickerUI). */
export function setHouseStyle(house, id) {
  if (!HOUSE_STYLES[id]) return { ok: false, reason: 'unknown_style' };
  house.chassis = id;
  house.config = defaultHouseConfig(id);
  return { ok: true, name: HOUSE_STYLES[id].name };
}

/** ConfiggerChoiceElementUI prev / next: one choice along, wrapping round. */
export function stepHouseConfig(id, config, key, dir) {
  const style = styleId(id);
  const part = HOUSE_ART[style].parts.find((p) => p.key === key);
  const cfg = normalizeHouseConfig(style, config);
  if (!part) return cfg;
  const max = part.choices.length;
  const next = ((cfg[key] - 1 + (dir < 0 ? -1 : 1)) % max + max) % max + 1;
  return { ...cfg, [key]: next };
}

/** ChassisManager randomHouse / the Randomize button: a random choice for every part. */
export function randomHouseConfig(id, rand = Math.random) {
  const style = styleId(id);
  const out = {};
  for (const part of HOUSE_ART[style].parts) out[part.key] = 1 + Math.floor(rand() * part.choices.length);
  return normalizeHouseConfig(style, out);
}

/** furniture_base `flip` (can_flip "1"), the Flip button beside Randomize. */
export function flipHouse(house) {
  house.facingRight = house.facingRight !== true;
  return house.facingRight;
}

/**
 * initializehead(): the house's pieces for a style, config and facing, back to front, as sprite
 * placements from the item's foot (the bottom centre of the SWF stage, where Glitch stood the
 * item: LocationItemstackView.as 853-854): { part, file, anchorX, anchorY, w, h, x, y, scaleX,
 * scaleY, depth }. Bands (the house's own shadows and dressing) have part null. Facing left
 * mirrors the whole chassis about its foot (LocationItemstackView._faceLeft).
 */
export function composeHouse(id, config = null, facingRight = HOUSE_FACING_RIGHT) {
  const style = styleId(id);
  const a = HOUSE_ART[style];
  const cfg = normalizeHouseConfig(style, config || {});
  const [fsx, fsy, fx, fy] = a.foot;
  const mx = facingRight === false ? -1 : 1;
  const ops = [];
  a.layers.forEach((layer, depth) => {
    const p = layer.band ? layer.art : layer.art[cfg[layer.part] - 1];
    if (!p) return;
    const [sx, sy, cx, cy] = layer.band ? [1, 1, 0, 0] : layer.m;
    const [file, ox, oy, w, h] = p;
    ops.push({
      part: layer.band ? null : layer.part,
      file,
      anchorX: ox / w,
      anchorY: oy / h,
      w,
      h,
      x: mx * (fx + fsx * cx),
      y: fy + fsy * cy,
      scaleX: mx * fsx * sx,
      scaleY: fsy * sy,
      depth,
    });
  });
  return ops;
}

/** One placement's box (foot-relative). */
export function opBox(op) {
  const x0 = op.x - op.anchorX * op.w * op.scaleX;
  const x1 = x0 + op.w * op.scaleX;
  const y0 = op.y - op.anchorY * op.h * op.scaleY;
  const y1 = y0 + op.h * op.scaleY;
  return { l: Math.min(x0, x1), r: Math.max(x0, x1), t: Math.min(y0, y1), b: Math.max(y0, y1) };
}

/** Bounding box of a composition (foot-relative): { l, r, t, b, w, h }. */
export function houseBounds(ops) {
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
  for (const op of ops) {
    const box = opBox(op);
    l = Math.min(l, box.l);
    r = Math.max(r, box.r);
    t = Math.min(t, box.t);
    b = Math.max(b, box.b);
  }
  return Number.isFinite(l) ? { l, r, t, b, w: r - l, h: b - t } : { l: 0, r: 0, t: 0, b: 0, w: 0, h: 0 };
}

/** The doorway is at least this wide (the door and room to step up to it). */
export const HOUSE_DOORWAY_MIN = 100;

/**
 * Where the house meets the street, foot-relative, measured on its own art: `bounds` (the whole
 * house), `door` (the door piece's middle `x` and `top`, and the doorway `x1`..`x2`: the door's span,
 * at least HOUSE_DOORWAY_MIN wide round its middle, which the street's plants keep clear of) and
 * `sign` (the Mailbox's usual spot: just off the house's left corner).
 */
export function houseLot(id, config = null, facingRight = HOUSE_FACING_RIGHT) {
  const ops = composeHouse(id, config, facingRight);
  const bounds = houseBounds(ops);
  const doors = ops.filter((op) => op.part === 'door');
  const db = doors.length ? houseBounds(doors) : { l: -40, r: 40, t: -150 };
  const mid = (db.l + db.r) / 2;
  const half = Math.max(HOUSE_DOORWAY_MIN, db.r - db.l) / 2;
  const door = { x1: Math.round(Math.max(bounds.l, mid - half)), x2: Math.round(Math.min(bounds.r, mid + half)), x: Math.round(mid), top: Math.round(db.t) };
  const sign = Math.round(bounds.l - 20);
  return { bounds, door, sign };
}

/** The name the house goes by (the style's, as the catalog named it). */
export function houseLabel(house) {
  return HOUSE_STYLES[house?.chassis]?.name || HOUSE_STYLES.cottage.name;
}
