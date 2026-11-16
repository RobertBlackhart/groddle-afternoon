#!/usr/bin/env node
/**
 * Badge conditions the remake adds where Tiny Speck's own file has none, each
 * cited. The content build (glitch-audit/scripts/extract-gsjs-content.mjs, outside
 * git) writes public/assets/content/achievements.json from GSJS achievements/*.js
 * and applies this table last, and the inventory (tools/inventory/build.mjs)
 * judges the badges with it, so a rebuild keeps the condition.
 *
 *   node tools/achievement-overrides.mjs          apply to achievements.json
 *   node tools/achievement-overrides.mjs --check  exit 1 when achievements.json is stale
 *
 * A row applies only while the GSJS file still has no conditions of its own, or, for a
 * row with `replaces`, while its conditions are still exactly the ones that row names
 * (so a source that changes is noticed, not overwritten).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ACHIEVEMENT_CONDITION_OVERRIDES = Object.freeze({
  // #154 (Austin 2026-11-09: make it earnable, Eleven Giants' rule). Tiny Speck's
  // achievements/brillah_completist.js:17 ships `var conditions = {};`, so nothing
  // granted it; Eleven Giants' eleven-gsjs/achievements/brillah_completist.js:18-23
  // wires it like every other hub Completist: Brillah is hub 112, 27 streets on its map.
  brillah_completist: Object.freeze({
    conditions: Object.freeze([
      Object.freeze({ id: '1000', type: 'counter', group: 'streets_visited_in_hub', name: 'number_112', num: 27, desc: 'number_112' }),
    ]),
    source: 'eleven-gsjs/achievements/brillah_completist.js:18-23',
  }),
  // #408 (Austin 2026-11-16: every Ix street, as Brillah). Tiny Speck's
  // achievements/ix_completist.js:17-22 (and Eleven Giants' the same) asks for 7
  // streets of hub 27 though its text says every location; the map lists 10, one of
  // them a test street (GM413CQ4TLUUS "cal test 5", inc_data_maps_prod.js:15792), so
  // every Ix street is the 9 the remake has (exploration.js availableHubStreets('27')).
  // Same condition id and counter, so progress carries over and a badge already earned stays.
  ix_completist: Object.freeze({
    conditions: Object.freeze([
      Object.freeze({ id: '592', type: 'counter', group: 'streets_visited_in_hub', name: 'number_27', num: 9, desc: 'number_27' }),
    ]),
    replaces: Object.freeze([Object.freeze({ group: 'streets_visited_in_hub', name: 'number_27', num: 7 })]),
    source: 'Austin 2026-11-16 (#408), over glitch-GameServerJS/achievements/ix_completist.js:17-22',
  }),
});

/** Whether a row applies over a badge's own conditions: none, or exactly the ones it replaces. */
function overrideApplies(row, conditions = []) {
  if (!conditions.length) return true;
  const was = row.replaces || [];
  return was.length === conditions.length && was.every((w, i) => {
    const c = conditions[i];
    return c.group === w.group && c.name === w.name && Number(c.num) === w.num;
  });
}

/** achievements.json shape ({ id: { conditions: [{ id, type, group, name, num, desc }] } }), changed in place. */
export function applyAchievementOverrides(catalog) {
  for (const [id, row] of Object.entries(ACHIEVEMENT_CONDITION_OVERRIDES)) {
    const def = catalog[id];
    if (!def || !overrideApplies(row, def.conditions || [])) continue;
    def.conditions = row.conditions.map((c) => ({ ...c }));
  }
  return catalog;
}

/** tools/inventory/gsjs-data.mjs readAchievements shape ([{ id, conditions: [{ id, type, group, name, num }] }]). */
export function withAchievementOverrides(list) {
  return list.map((a) => {
    const row = ACHIEVEMENT_CONDITION_OVERRIDES[a.id];
    if (!row || !overrideApplies(row, a.conditions || [])) return a;
    return { ...a, conditions: row.conditions.map(({ id, type, group, name, num }) => ({ id, type, group, name, num })), conditionsFrom: row.source };
  });
}

const here = dirname(fileURLToPath(import.meta.url));
export const ACHIEVEMENTS_JSON = join(here, '../public/assets/content/achievements.json');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const text = readFileSync(ACHIEVEMENTS_JSON, 'utf8');
  const next = JSON.stringify(applyAchievementOverrides(JSON.parse(text)));
  if (process.argv.includes('--check')) {
    if (next !== text) {
      console.error('achievements.json is missing a condition override: run node tools/achievement-overrides.mjs');
      process.exit(1);
    }
    console.log('achievements.json carries every condition override');
  } else if (next !== text) {
    writeFileSync(ACHIEVEMENTS_JSON, next);
    console.log(`achievements.json: applied ${Object.keys(ACHIEVEMENT_CONDITION_OVERRIDES).length} condition override(s)`);
  } else {
    console.log('achievements.json already carries every condition override');
  }
}
