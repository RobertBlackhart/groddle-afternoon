/**
 * #526: the Map draws a street you have not been to as a row of dots, not a road, as Glitch
 * did (glitch-client MapStreet.as 51-63: no road when !street.visited, showDots 142-155:
 * black dots of radius 2.5 every 2 x 2.5 + 3, at 0.4 of the street's alpha). The street you
 * are on counts as visited (MapHub.as 559-562). One SVG for Modern and Classic and every
 * painted map (map-graph.js renderHubMapSvg).
 * Run: node --test tests/map-unvisited-road.test.js
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderHubMapSvg } from '../public/js/map-graph.js?v=3b7d09a6';

const root = join(import.meta.dirname, '..');
const street = (tsid, name, extra = {}) => ({ tsid, name, label: name, loaded: true, loadedTsid: tsid, x1: 100, y1: 100, x2: 300, y2: 120, mx: 200, my: 110, ...extra });
const svgOf = (streets, extra = {}) => renderHubMapSvg({ mapW: 760, mapH: 460, hubs: [], streets, ...extra });

describe('#526: unvisited streets are dotted on the Map', () => {
  it('an unvisited street\'s road is dotted; a visited one, the one you are on and a closed one are not', () => {
    const svg = svgOf([
      street('GA1', 'Never Been', { unvisited: true }),
      street('GA2', 'Been There', { unvisited: false, x1: 300, y1: 300, x2: 500, y2: 320, mx: 400, my: 310 }),
      street('GA3', 'Right Here', { current: true, unvisited: true, x1: 500, y1: 100, x2: 700, y2: 120, mx: 600, my: 110 }),
      street('GA4', 'Far Off', { loaded: false, x1: 100, y1: 400, x2: 300, y2: 420, mx: 200, my: 410 }),
    ]);
    assert.match(svg, /<g class="map-street travelable unvisited" data-tsid="GA1"[^>]*><line class="map-seg travelable unvisited"/);
    assert.match(svg, /<g class="map-street travelable" data-tsid="GA2"[^>]*><line class="map-seg travelable"/);
    assert.match(svg, /<g class="map-street current" data-tsid="GA3"[^>]*><line class="map-seg current"/, 'where you are counts as visited');
    assert.match(svg, /<line class="map-seg dim"[^>]*data-tsid="GA4"/);
    assert.equal((svg.match(/unvisited/g) || []).length, 3, 'GA1 road, group and name only');
    // Still a street you can pick: the hit line and the menu stay.
    assert.match(svg, /data-tsid="GA1"[^>]*data-ctx="map-street"[^>]*>(?:(?!<\/g>).)*map-seg-hit/);
  });

  it('a street under construction keeps its striped road (stripes over dots read as a second dotted kind); its name still dims', () => {
    const svg = svgOf([street('GA1', 'Camsteeple Strat', { unvisited: true, building: true })]);
    assert.match(svg, /<line class="map-seg travelable building"[^>]*\/><line class="map-seg-stripes"/);
    assert.doesNotMatch(svg, /map-seg[^"]*unvisited/);
    assert.match(svg, /class="map-label loaded building unvisited"/);
  });

  it('on a painted map too', () => {
    const svg = svgOf([street('GA1', 'Never Been', { unvisited: true })], { bgLocal: 'assets/maps/x.webp' });
    assert.match(svg, /<line class="map-seg travelable unvisited"/);
  });

  it('the dots are Glitch\'s: black, radius 2.5 every 8, first one 2.5 in, at 0.4 x 0.7 (0.4 x 0.85 hovered)', () => {
    const css = readFileSync(join(root, 'public/style.css'), 'utf8');
    const rule = /\.map-seg\.travelable\.unvisited \{([^}]*)\}/.exec(css)?.[1] || '';
    assert.match(rule, /stroke: #000;/);
    assert.match(rule, /stroke-width: calc\(5px \* var\(--map-line-k, 1\)\);/);
    assert.match(rule, /stroke-dasharray: 0 calc\(8px \* var\(--map-line-k, 1\)\);/);
    assert.match(rule, /stroke-dashoffset: calc\(-2\.5px \* var\(--map-line-k, 1\)\);/);
    assert.match(rule, /opacity: 0\.28;/);
    const hover = /\.map-street\.travelable\.unvisited:hover \.map-seg\.travelable\.unvisited \{([^}]*)\}/.exec(css)?.[1] || '';
    assert.match(hover, /opacity: 0\.34;/);
    assert.match(hover, /stroke: #000;/, 'hovering keeps the dots, not the yellow road');
    // .map-seg rounds the line's caps, which turns each zero-length dash into a dot.
    assert.match(/\n\.map-seg \{([^}]*)\}/.exec(css)?.[1] || '', /stroke-linecap: round;/);
    // The hover rule comes after the plain travelable hover so it wins.
    assert.ok(css.indexOf('.map-street.travelable.unvisited:hover') > css.indexOf('.map-street.travelable:hover .map-seg.travelable'));
  });
});
