// #538 (Austin's ruling, 2026-11-19, our own touch): on the train's line map the star slides from the
// stop the train left to the next stop over the hop's known time, like a progress bar, and sits on the
// stop while the train stands. Glitch kept the star on the station it left, grey (MapTransit.as
// setPlayerLocation). Under reduced motion it steps instead of gliding.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { STATIONS, createRide, curvePoint, lineStarPoint, linePoint, lineView, nextStation, rideProgress, rideTiming, stationById, stepRide } from '../public/js/subway.js?v=0a87a908';
import { applyTrain } from '../public/js/subway-mp.js?v=ffd57d82';

const root = join(import.meta.dirname, '..');
const feature = readFileSync(join(root, 'public/js/features/subway-feature.js'), 'utf8');
const views = readFileSync(join(root, 'public/js/map-views.js'), 'utf8');
const pos = (id) => ({ x: stationById(id).map_pos[0], y: stationById(id).map_pos[1] });

describe('linePoint: progress 0..1 to a point between two stops', () => {
  const a = { x: 100, y: 200 };
  const b = { x: 300, y: 100 };
  it('starts on the first stop, ends on the second, halfway is the middle', () => {
    assert.deepEqual(linePoint(a, b, 0), a);
    assert.deepEqual(linePoint(a, b, 1), b);
    assert.deepEqual(linePoint(a, b, 0.5), { x: 200, y: 150 });
    assert.deepEqual(linePoint(a, b, 0.25), { x: 150, y: 175 });
  });
  it('clamps past the ends and treats a bad progress as the start', () => {
    assert.deepEqual(linePoint(a, b, -1), a);
    assert.deepEqual(linePoint(a, b, 2), b);
    assert.deepEqual(linePoint(a, b, NaN), a);
  });
});

describe('rideProgress: the share of the hop gone', () => {
  const t = rideTiming(1);
  it('0 while boarding and standing, rising evenly to 1 at arrival while moving', () => {
    const ride = createRide({ stop: 3, direction: 'forwards', now: 0, timing: t });
    assert.equal(rideProgress(ride, 5000), 0);
    stepRide(ride, ride.departAt);
    assert.equal(ride.phase, 'moving');
    assert.equal(rideProgress(ride, ride.departAt), 0);
    assert.equal(rideProgress(ride, ride.departAt + t.travel / 2), 0.5);
    assert.equal(rideProgress(ride, ride.departAt + t.travel / 4), 0.25);
    assert.equal(rideProgress(ride, ride.arriveAt + 999), 1);
    stepRide(ride, ride.arriveAt);
    assert.equal(ride.phase, 'stopped');
    assert.equal(rideProgress(ride, ride.arriveAt + 1000), 0);
    assert.equal(rideProgress(null, 0), 0);
  });
  it('reduced motion: whole steps, never in between', () => {
    const ride = createRide({ stop: 3, direction: 'forwards', now: 0, timing: t });
    stepRide(ride, ride.departAt);
    assert.equal(rideProgress(ride, ride.departAt + t.travel * 0.2, { steps: 4 }), 0);
    assert.equal(rideProgress(ride, ride.departAt + t.travel * 0.6, { steps: 4 }), 0.5);
    assert.equal(rideProgress(ride, ride.departAt + t.travel * 0.99, { steps: 4 }), 0.75);
    assert.equal(rideProgress(ride, ride.arriveAt, { steps: 4 }), 1);
  });
  it('a shared train joined mid-hop picks up where the server says it is', () => {
    const ride = createRide({ stop: 3, direction: 'forwards', now: 0, timing: t });
    applyTrain(ride, { train: 'T1', street: 'TRAIN_0000000000000001', line: 'forwards', stop: 3, phase: 'moving', riders: [], need: 0, departIn: 0, arriveIn: t.travel / 2 }, 1000);
    stepRide(ride, 1000);
    assert.equal(rideProgress(ride, 1000), 0.5);
  });
});

describe('lineStarPoint: the star on the line map', () => {
  it('on the train\'s station while it stands, sliding to the next stop while it moves', () => {
    const t = rideTiming(1);
    const ride = createRide({ stop: 3, direction: 'backwards', now: 0, timing: t });
    const next = nextStation(3, 'backwards').id;
    assert.deepEqual(lineStarPoint(lineView(ride), 0.7), pos(3), 'standing: the progress is ignored');
    stepRide(ride, ride.departAt);
    const v = lineView(ride);
    assert.deepEqual(lineStarPoint(v, 0), pos(3));
    assert.deepEqual(lineStarPoint(v, 1), pos(next));
    // G1127 (#606): half way along the curved track the map draws, not the straight line's middle.
    assert.deepEqual(lineStarPoint(v, 0.5), curvePoint(3, next, 0.5));
    stepRide(ride, ride.arriveAt);
    assert.deepEqual(lineStarPoint(lineView(ride), 0), pos(next));
    assert.equal(lineStarPoint(null, 0), null);
    assert.equal(STATIONS.length, 12);
  });
});

describe('wiring', () => {
  it('the star is one mark over the stops that never takes a tap, placed every tick on the train', () => {
    // G1127: drawn by the Map's Subway view in ride mode (js/map-views.js renderSubwayMapSvg).
    assert.match(views, /`<image class="map-you subway-you subway-line-star\$\{riding\.moving \? ' moving' : ''\}" data-star="1" [^`]*pointer-events="none"\/>`/);
    assert.match(feature, /const p = rideProgress\(ride, now, \{ steps: reducedMotion\(\) \? 4 : 0 \}\);\n\s*const pt = lineStarPoint\(view, p\);/);
    assert.match(feature, /drawLineMap\(engine\);\n\s*placeLineStar\(engine, t\);/);
    assert.match(feature, /lineMap\.star = lineMap\.svg\.querySelector\('\[data-star\]'\);\n\s*placeLineStar\(engine, Date\.now\(\)\);/);
  });
});
