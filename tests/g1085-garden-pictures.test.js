/**
 * G1085, #575 (R2): Veldt Balm's (GIFGR46M8RE2RC7) street garden bed was planned inside the animal
 * pen (middleground groddle_alakol_house_animal_pen). No player's snap shows Veldt Balm or Kipacre
 * Greens (GCR202JSVIN1STL), so their beds were planned anywhere; Tiny Speck's own whole-street pictures
 * show both streets' plots (garden-beds.js PICTURE_GARDEN_SPOTS). The planner also takes a spot in a
 * pen or on a fence (street-ecology.js penArtCovers, PEN_FREE_GROUPS) for a garden bed last.
 *
 * Run: node --test tests/g1085-garden-pictures.test.js
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyStreetIndex, loadStreetDataFromFs, setZoneStreetsShown } from '../public/js/street-loader.js?v=10376267';
import { isItemFloor, platformYAt, platformsScreen, streetWidth } from '../public/js/street-model.js?v=a9a05f9d';
import {
  FRONT_HIDE_SHARE,
  PLACEMENT_HEIGHTS,
  ecologyForStreet,
  frontCoverShare,
  frontDecoCovers,
  gardenPlacementRequest,
  planStreetPlacements,
  populationForStreet,
  setStreetEcologyCatalog,
  streetReservedSpots,
} from '../public/js/street-ecology.js?v=187e3c76';
import { GARDEN_SPOTS } from '../public/js/garden-spots-data.js?v=3c5d4164';
import { gardenBedWidth } from '../public/js/garden-beds.js?v=fca3bae1';
import { streetGardenBeds } from '../public/js/garden.js?v=0afbe615';
import { placementRequests } from '../tools/build-realtime-objects.mjs';

const root = join(import.meta.dirname, '..');
const streetsDir = join(root, 'public/assets/streets');
setZoneStreetsShown(false);
applyStreetIndex(JSON.parse(readFileSync(join(streetsDir, 'index.json'), 'utf8')));
setStreetEcologyCatalog(JSON.parse(readFileSync(join(root, 'public/assets/content/street-ecology.json'), 'utf8')));

const VELDT_BALM = 'GIFGR46M8RE2RC7';
const KIPACRE_GREENS = 'GCR202JSVIN1STL';
// The fenced pen as drawn (middleground groddle_alakol_house_animal_pen, world x 2660, 1092 wide): screen px.
const VELDT_PEN = { l: 5114, r: 6206 };

function bedsOf(data) {
  const pop = populationForStreet(data.tsid, ecologyForStreet(data.tsid), {});
  const plan = planStreetPlacements(platformsScreen(data), placementRequests(pop), { worldW: streetWidth(data), seed: data.tsid, reserved: streetReservedSpots(data) });
  return streetGardenBeds(data.tsid, plan.groups.gardens || [], pop);
}

describe('G1085 the unsnapped garden streets put their beds where Tiny Speck did', () => {
  it("Veldt Balm's six beds stand where its picture shows them, none in the pen, 48 plots as Zog's 2012 count", async () => {
    const data = await loadStreetDataFromFs(VELDT_BALM, streetsDir);
    const beds = bedsOf(data);
    assert.equal(beds.length, 6);
    assert.deepEqual(beds.map((b) => [b.x, b.y, b.cols, b.rows]), [
      [1635, 727, 3, 3], [2045, 745, 3, 2], [2715, 730, 4, 3], [3240, 735, 3, 3], [3675, 798, 2, 2], [4540, 842, 4, 2],
    ]);
    assert.equal(beds.reduce((n, b) => n + b.cols * b.rows, 0), 48);
    for (const b of beds) assert.ok(b.x + gardenBedWidth(b) / 2 < VELDT_PEN.l, `bed at ${b.x} reaches into the pen`);
    assert.deepEqual(beds.map((b) => b.bed).sort(), ['default', 'default2', 'default3', 'default4', 'default5', 'default6']);
  });

  it("Kipacre Greens' seven beds stand where its picture shows them", async () => {
    const data = await loadStreetDataFromFs(KIPACRE_GREENS, streetsDir);
    assert.deepEqual(bedsOf(data).map((b) => b.x), [905, 1813, 2128, 3080, 3449, 3867, 4265]);
  });

  it('every picture bed stands just above its floor, clear of the front art and of the other beds', async () => {
    for (const tsid of [VELDT_BALM, KIPACRE_GREENS]) {
      const data = await loadStreetDataFromFs(tsid, streetsDir);
      const floors = platformsScreen(data).filter(isItemFloor);
      const fronts = frontDecoCovers(data);
      const beds = bedsOf(data);
      beds.forEach((b, i) => {
        const w = gardenBedWidth(b);
        const above = Math.min(...floors.map((p) => platformYAt(p, b.x, 0)).filter((y) => y != null && y >= b.y).map((y) => y - b.y));
        assert.ok(above >= 10 && above <= 40, `${data.label} bed ${b.x}: ${above} px above its floor`);
        assert.ok(frontCoverShare(b, w, PLACEMENT_HEIGHTS.gardens, fronts) < FRONT_HIDE_SHARE, `${data.label} bed ${b.x} behind the front art`);
        const next = beds[i + 1];
        if (next) assert.ok(b.x + w / 2 < next.x - gardenBedWidth(next) / 2, `${data.label} beds ${b.x} and ${next.x} overlap`);
      });
    }
  });

  it('the planner takes a garden spot in an animal pen last (no picture: Veldt Balm planned as before)', async () => {
    const data = await loadStreetDataFromFs(VELDT_BALM, streetsDir);
    const reserved = streetReservedSpots(data);
    const pens = reserved.filter((r) => r.pen);
    assert.ok(pens.some((p) => Math.abs(p.block.l - VELDT_PEN.l) < 2 && Math.abs(p.block.r - VELDT_PEN.r) < 2), 'the pen is known');
    const plan = planStreetPlacements(platformsScreen(data), [gardenPlacementRequest({ gardens: 6 })], { worldW: streetWidth(data), seed: data.tsid, reserved });
    assert.equal(plan.groups.gardens.length, 6);
    for (const p of plan.groups.gardens) assert.ok(p.x + 140 < VELDT_PEN.l || p.x - 140 > VELDT_PEN.r, `planned bed at ${Math.round(p.x)} in the pen`);
    // A pen keeps nothing else clear: the other groups plan as before.
    assert.ok(!plan.occupied.some((p) => p.pen));
  });

  it('the snapped streets keep their measured beds', () => {
    for (const [tsid, row] of Object.entries(GARDEN_SPOTS)) {
      const pop = populationForStreet(tsid, ecologyForStreet(tsid), {});
      if (!pop.gardens) continue;
      assert.deepEqual(pop.gardenBeds.map((b) => [b.x, b.y, b.cols, b.rows]), row.beds.slice(0, pop.gardens).map((b) => b.slice(0, 4)), tsid);
    }
  });
});
