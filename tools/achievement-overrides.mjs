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
 * (so a source that changes is noticed, not overwritten). A row's `text` rewords the
 * badge's own words (statusText, desc) where they still say what the row replaces.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * #441 (G914, Austin 2026-11-17: every hub Completist needs every street of its hub,
 * as Ix and Brillah). Tiny Speck's achievements/<hub>_completist.js:17-22 asks for a
 * count that some hubs outgrew. "Every street" is exploration.js availableHubStreets:
 * on the hub's street list, loadable in the remake, and counting by location.js:2756-2770
 * (no subway station, machine room or start street). Same condition id and counter, so
 * progress carries over; a badge already earned stays (topUpCompletists only raises).
 * `left` names what the hub's list holds that is not counted, for the record.
 */
const everyStreet = (id, hub, was, num, left) => Object.freeze({
  conditions: Object.freeze([
    Object.freeze({ id, type: 'counter', group: 'streets_visited_in_hub', name: `number_${hub}`, num, desc: `number_${hub}` }),
  ]),
  replaces: Object.freeze([Object.freeze({ group: 'streets_visited_in_hub', name: `number_${hub}`, num: was })]),
  left: Object.freeze(left),
  source: `Austin 2026-11-17 (#441), every street of hub ${hub}, over glitch-GameServerJS/achievements:17-22 (${was})`,
});

export const ACHIEVEMENT_CONDITION_OVERRIDES = Object.freeze({
  // G914: inc_data_maps_prod.js hub street lists against assets/streets/index.json.
  aranna_completist: everyStreet('609', '101', 26, 28, [
    'GHVQ4NDEGMB23JQ Old Sabudana Drama Towers (not archived)', 'GHVR9OQH76A2B2E main street for hub 101 (dev)']),
  besara_completist: everyStreet('604', '98', 32, 34, [
    'GA9MU59GB792T80 Besara Community Machine Room', 'GA5A1KPKK3H2A5R Old Egret Taun Towers, GA5I99FGF5D2ELI Willis Brone Towers, GA9VA0QI1H92PKK Petrif Willow Towers (not archived)',
    'GA912ITK8S82IQ6 main street for hub 98 (dev)']),
  bortola_completist: everyStreet('490', '75', 35, 37, [
    'GA9S5T1LA0D27NG GA9TEC6GB0D2B2M GA9U0VLRB0D2JES GA9U90TVB0D2EAH Bortola Start (greeting)', 'GHV2CQPL1E32QM8 Mallos Means Subway Station',
    'GHVMSOGBUA32RPV Old Hauki Seeks Manor (not archived)', 'GIFNQSJ1UD02M6B main street for hub 75, GIFNQTD2UD02IQ3 Concept_01 (dev)']),
  groddle_forest_completist: everyStreet('483', '56', 41, 42, [
    'GIF16EM56A12FSB Forest Community Machine Room', 'GCRC6VC9MAO1Q7F GFJ Subway Station',
    'GCR1G73RL7T1VKI GDO11O4750D2CFE GDO4U6RN50D2L74 GDOP37CA40D2FNT Forest Start, GDOMNN2592D272G New Forest Start (dev, not archived)',
    'GCR1017NNFL18O5 Keylocked Door Level 01, GCR168NJLQL175U Stacked Forest 03, GCR1KTHS7ST1KD9 DontLookAtThis, GLI1013Q5BB14E0 main street for hub 56 (dev)',
    'GCR17I2DB0O1CB0 Luster Pose, GCR17J1HB0O1PP8 Coulcairn, GCR17KJHB0O1U2H Fendeer (not archived)']),
  groddle_meadows_completist: everyStreet('485', '58', 40, 43, [
    'GCR101Q98A12EHH Meadow Community Machine Room', 'GCR177QO65T1EON Gregarious Grange Subway Station',
    'GCRHDVFAKNL1TKD GCR16B8SMQL16C3 GCR1G5N9T1M14FB Stacked Meadow 01/02/05, GCR1IH8KM7T1HGH Meadow Start, GLI32FCEUTD1984 main street for hub 58 (dev)',
    'GCR10281EUK11H0 Old Gregarious Towers (not archived)']),
  muufo_completist: everyStreet('599', '97', 32, 35, [
    'GHVHDUF7PVC2D3E GHVC6LAT70D23MG GHVDQMOA80D245R Muufo Start (greeting)',
    'GDOMH1GUD5D2IQ4 Old Hakusan Heaps Towers, GDORGE5P8ME2SJB Panko Press Towers (not archived)', 'GA9TBK6SGR726VM main street for hub 97 (dev)']),
  rasana_completist: everyStreet('655', '109', 37, 38, [
    'GUV47PRP8DF2CG6 ZZ Kumbham Bham obs, GUV3BKB1DOE2BJ2 main street for hub 109 (dev)']),
  tamila_completist: everyStreet('605', '92', 31, 33, [
    'GA9PJHDPE5D262P Jeban Journey Towers, GIF3H0KG2H72DIB Goorsh Gam Towers (not archived)', 'GIF1OI3OQQ523OK main street for hub 92 (dev)']),
  // achievements/uralia_completist.js's status text says four streets (its line 5); the hub's list grew
  // after it, so the text follows the count (Austin 2026-11-17).
  uralia_completist: Object.freeze({
    ...everyStreet('493', '51', 4, 6, ['GHV1U3M48M22D54 Eastern Approach Subway Station']),
    text: Object.freeze({ statusText: Object.freeze([Object.freeze(['four streets', 'six streets'])]) }),
  }),

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
    if (!def) continue;
    // A row's `text` ({ field: [[from, to]] }) rewords the badge's own words while they still say `from`.
    for (const [field, pairs] of Object.entries(row.text || {})) {
      if (typeof def[field] !== 'string') continue;
      for (const [from, to] of pairs) def[field] = def[field].split(from).join(to);
    }
    if (!overrideApplies(row, def.conditions || [])) continue;
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
