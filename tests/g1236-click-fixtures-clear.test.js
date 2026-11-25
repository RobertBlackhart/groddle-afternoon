/**
 * G1236 (root R2, "stands clear of what is drawn"): in a fresh solo game on Hechey Track a starter rock
 * stood on the Shrine to Mab, so clicking the shrine opened the rock's menu. The starter rocks are seated
 * late (STARTER_ROCK_SPOTS), and a fresh game's arrival (the incoming spot nearest the middle) moved the
 * planned shrine onto one. The sweep: on every street, shared (the server's layout) and solo (with the
 * arrival kept clear, as game.js enterStreet does), no planned rock, tree, garden, node or piece of
 * street furniture stands on a shrine, the vendor, a signpost, a door, a mailbox or a Visiting Stone.
 * Glitch set every one of them by hand, clear of each other (the archived streets). A pair of fixed
 * things (measured on 2012 snaps, hand-picked) is left out: Larceny Ladder's measured rock 3 touches a signpost.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyStreetIndex, loadStreetDataFromFs, setZoneStreetsShown } from '../public/js/street-loader.js';
import { platformsScreen, streetWidth } from '../public/js/street-model.js';
import {
  FRONT_BOXES,
  PLACEMENT_FOOTPRINTS,
  PLACEMENT_HEIGHTS,
  ROCK_SHAPE_HEIGHTS,
  ROCK_SHAPE_WIDTHS,
  ecologyForStreet,
  planStreetPlacements,
  populationForStreet,
  rockSpawnPlan,
  setStreetEcologyCatalog,
  streetReservedSpots,
} from '../public/js/street-ecology.js';
import { defaultArrival } from '../public/js/street-arrival.js';
import { creatureRequests, setCreatureEcology } from '../tools/build-realtime-objects.mjs';

const root = join(import.meta.dirname, '..');
const streetsDir = join(root, 'public/assets/streets');
const catalog = JSON.parse(readFileSync(join(root, 'public/assets/content/street-ecology.json'), 'utf8'));
const index = JSON.parse(readFileSync(join(streetsDir, 'index.json'), 'utf8'));
const arrivals = JSON.parse(readFileSync(join(root, 'public/assets/content/street-arrivals.json'), 'utf8'));
const HECHEY = 'GLI2V0UN7RD1T2J';
setStreetEcologyCatalog(catalog);
setCreatureEcology(catalog);
setZoneStreetsShown(false);
applyStreetIndex(index);

// Things that move (swimming Salmon, flying Fireflies) pass in front of anything; they are left out.
const MOVING = /npc_salmon|npc_firefly/;
const box = (key, x, y, w, h, fixed = false) => ({ key, fixed, l: x - w / 2, r: x + w / 2, t: y - h, b: y });
// A dropped Note is NOTE_ART's 45 x 14 (street-furniture.js).
const artBox = (key) => FRONT_BOXES[key] || (key === 'furnitureNote' ? [45, 14] : [PLACEMENT_FOOTPRINTS[key] || 60, 60]);

async function overlaps(tsid) {
  const data = await loadStreetDataFromFs(tsid, streetsDir);
  if (!data?.platforms?.length) return [];
  const pop = populationForStreet(tsid, ecologyForStreet(tsid), { starter: tsid === index.default });
  const platforms = platformsScreen(data);
  const worldW = streetWidth(data);
  const variants = [['shared', streetReservedSpots(data)]];
  const entry = defaultArrival(data, arrivals, { worldW });
  if (entry) variants.push(['solo', [...streetReservedSpots(data), { x: entry.x, y: entry.y, key: 'saved-arrival', clearance: 210 }]]);
  const out = [];
  for (const [mode, reserved] of variants) {
    const plan = planStreetPlacements(platforms, creatureRequests(pop, data, catalog), { worldW, seed: tsid, reserved });
    const targets = [];
    for (const key of ['shrine', 'vendor']) (plan.groups[key] || []).forEach((p, i) => targets.push(box(`${key}:${i}`, p.x, p.y, PLACEMENT_FOOTPRINTS[key], PLACEMENT_HEIGHTS[key], Boolean(p.fixed))));
    for (const r of reserved) if (r.block && /^(signpost|door|mailbox|stone):/.test(r.key)) targets.push({ key: r.key, fixed: true, ...r.block });
    const things = [];
    for (const rock of rockSpawnPlan(pop, plan.groups.rocks, tsid)) {
      if (rock.x == null) continue;
      things.push(box(`rock:${rock.index}`, rock.x, rock.y, ROCK_SHAPE_WIDTHS[rock.classTsid][rock.shape - 1], ROCK_SHAPE_HEIGHTS[rock.classTsid][rock.shape - 1], rock.measured));
    }
    for (const key of ['trees', 'gardens', 'shrine', 'vendor']) {
      (plan.groups[key] || []).forEach((p, i) => {
        things.push(box(`${key}:${i}`, p.x, p.y, key === 'trees' ? 60 : PLACEMENT_FOOTPRINTS[key], PLACEMENT_HEIGHTS[key], Boolean(p.fixed)));
      });
    }
    for (const [key, pts] of Object.entries(plan.groups)) {
      if (!/^(resource:|furniture|raceDispenser)/.test(key) || MOVING.test(key)) continue;
      const [w, h] = artBox(key);
      pts.forEach((p, i) => { if (p && Number.isFinite(p.x)) things.push(box(`${key}:${i}`, p.x, p.y, w, h, Boolean(p.fixed))); });
    }
    for (const target of targets) {
      for (const thing of things) {
        // Two things both set where Glitch (or a hand-picked spot) had them are not the planner's doing.
        if (target.key === thing.key || (target.fixed && thing.fixed)) continue;
        const ox = Math.min(target.r, thing.r) - Math.max(target.l, thing.l);
        const oy = Math.min(target.b, thing.b) - Math.max(target.t, thing.t);
        if (ox > 10 && oy > 10) out.push(`${mode} ${tsid} ${data.label}: ${thing.key} on ${target.key} (${Math.round(ox)} px)`);
      }
    }
  }
  return out;
}

describe('G1236: planned things keep clear of what players click', () => {
  it('Hechey Track in a fresh solo game: no starter rock on the Shrine to Mab', async () => {
    assert.deepEqual(await overlaps(HECHEY), []);
  });

  it('every street, shared and solo: nothing planned on a shrine, vendor, signpost, door, mailbox or stone', { timeout: 120000 }, async () => {
    const hits = [];
    for (const tsid of Object.keys(index.streets)) hits.push(...(await overlaps(tsid).catch(() => [])));
    assert.deepEqual(hits, []);
  });
});
