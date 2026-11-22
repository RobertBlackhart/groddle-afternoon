// G1127 (#606, a player's ideas, none from Glitch; Austin 2026-11-22: build 1, 2 and 4, not 3):
// (1) the line map on the train is the Map's Subway view (the same paper, curved track and window),
// (2) the train's star rides that curve between stops, not a straight line, and (4) each line has its
// own colour, from one table (js/subway.js LINE_COLOURS) that every subway map draws from, made of
// design tokens. The star stays a star (idea 3, a train icon, is not built).
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createRide, lineView, nextStation, rideTiming, stationById, stepRide } from '../public/js/subway.js?v=36c6d2b2';
import { renderSubwayMapSvg } from '../public/js/map-views.js?v=b333b9df';

const root = join(import.meta.dirname, '..');
const feature = readFileSync(join(root, 'public/js/features/subway-feature.js'), 'utf8');
const fn = (name) => {
  const a = feature.indexOf(`function ${name}(`);
  return feature.slice(a, feature.indexOf('\n}\n', a) + 2);
};
const movingRide = (stop, direction) => {
  const ride = createRide({ stop, direction, now: 0, timing: rideTiming(1) });
  stepRide(ride, ride.departAt);
  assert.equal(ride.phase, 'moving');
  return ride;
};

describe('(1) the line map on the train is the Map\'s Subway view', () => {
  const view = lineView(movingRide(3, 'forwards'), nextStation(nextStation(3, 'forwards').id, 'forwards').id);
  const car = renderSubwayMapSvg({ ride: view });
  const tab = renderSubwayMapSvg({ direction: 'forwards' });
  const track = (svg) => /<path class="subway-track" d="([^"]+)"/.exec(svg)?.[1];

  it('the same paper, curved track and frame as the Map\'s', () => {
    assert.ok(track(car));
    assert.equal(track(car), track(tab));
    assert.match(track(car), / C/, 'the track is curves');
    assert.match(car, /<svg viewBox="0 0 760 460"/);
    assert.match(car, /class="subway-paper-art map-bg-soft/);
  });

  it('the ride\'s own marks: the star on the train\'s station, the next stop, your stop ringed, no line buttons', () => {
    const at = stationById(view.at.id);
    assert.match(car, new RegExp(`subway-line-star moving" data-star="1"[^>]*transform="translate\\(${at.map_pos[0]} ${at.map_pos[1]}\\)"`));
    assert.match(car, new RegExp(`<g class="subway-stop is-next" data-station="${view.next.id}"`));
    assert.match(car, /subway_map_next_stop_red/);
    assert.match(car, new RegExp(`<g class="subway-stop is-mine" data-station="${view.chosen.id}"[^]*?class="subway-stop-mine"[^]*?>Your stop</text>`));
    assert.doesNotMatch(car, /subway-line-btn/);
    assert.doesNotMatch(car, /set a destination or teleport/);
    assert.match(car, /aria-label="Red Line map"/);
    assert.match(fn('drawLineMap'), /bindSubwayMap\(lineMap\.svg, \{ onStop: \(e, st\) => chooseStop\(engine, st\.id\) \}\);/);
  });

  it('the station\'s Subway Map is it too, with nothing to press', () => {
    const still = renderSubwayMapSvg({ here: { station: stationById(1), how: 'here' }, next: 6, interactive: false });
    assert.equal(track(still), track(tab));
    assert.doesNotMatch(still, /tabindex|role="button"|subway-line-btn/);
    assert.match(still, /<g class="subway-stop is-next" data-station="6"/);
  });

  it('the window is the Map\'s: its card, scrim and gold frame', () => {
    assert.match(feature, /\.subway-map \{ [^}]*background: var\(--scrim\); \}/);
    assert.match(feature, /\.subway-map-card \{ [^}]*background: var\(--surface\); border: 1px solid var\(--border\); border-radius: var\(--radius-l\);/);
    assert.match(feature, /\.subway-map-zoom, \.subway-line-frame \{ [^}]*border: 1px solid var\(--c-gold-59\);/);
  });
});
