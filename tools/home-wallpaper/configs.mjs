/**
 * GSJS wallpaper / floor / ceiling configs (inc_data_homes.js) and the interior frame configs,
 * and which finishes the remake ships. Run directly, prints them as JSON on stdout for
 * tools/home-wallpaper/build.py; build-homes.mjs imports finishShown for the catalog.
 * GameServerJS is data: the file is evaluated in an empty vm context, nothing else runs.
 */
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GSJS = process.env.GLITCH_GSJS || join(process.env.HOME || '', 'Documents/glitch-audit/glitch-GameServerJS');

/**
 * G400 (Austin 2026-11-22: unhide the hidden home finishes where art survives; inventions
 * register unhidden-home-finishes). inc_data_homes.js defines these with is_visible false, so
 * Glitch never offered them; their pieces are in the CC0 home_wallpaper.swf and the remake ships
 * them with Tiny Speck's names and prices. `drop`: config fields left out because their piece is
 * not in the SWF. darkstar_black_ceiling_left is missing, and homes_get_ceiling_sprite
 * (locations/inc_homes.js) only ever draws a ceiling's main / main_2.. pieces, so the ceiling is
 * whole without it. Test Greenhouse Ceiling stays hidden (a test asset).
 */
export const UNHIDDEN_FINISHES = Object.freeze({
  walls: Object.freeze({ blue_tiles: {}, darkstar_black: {}, club_light: {} }),
  floors: Object.freeze({ darkstar_black_floor: {}, rook_forestfloor: {}, sky_dark_floor: {} }),
  ceilings: Object.freeze({ darkstar_black_ceiling: Object.freeze({ drop: Object.freeze(['left']) }), rook_forest: {} }),
});

/** True when the remake ships config `key` of `kind` (walls / floors / ceilings). */
export function finishShown(kind, key, conf) {
  return conf?.is_visible === true || Object.hasOwn(UNHIDDEN_FINISHES[kind] || {}, key);
}

/** inc_data_homes.js configs, each with `shown` (finishShown) and the unhidden ones' drops applied. */
export function homeConfigs() {
  const ctx = {};
  const src = readFileSync(join(GSJS, 'inc_data_homes.js'), 'utf8');
  vm.runInNewContext(`${src}\nthis.out = { walls: homes_wallpaper_configs, floors: homes_floor_configs, ceilings: homes_ceiling_configs, frames: homes_interior_frames };`, ctx, { timeout: 5000 });
  const out = JSON.parse(JSON.stringify(ctx.out));
  for (const kind of ['walls', 'floors', 'ceilings']) {
    for (const [key, conf] of Object.entries(out[kind])) {
      conf.shown = finishShown(kind, key, conf);
      for (const field of UNHIDDEN_FINISHES[kind][key]?.drop || []) delete conf[field];
    }
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.stdout.write(JSON.stringify(homeConfigs()));
