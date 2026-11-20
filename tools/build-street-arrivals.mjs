#!/usr/bin/env node
/**
 * Write public/assets/content/street-arrivals.json: every street's incoming arrivals, the points
 * Glitch set a player down on when they came in by a signpost or door of another street. GSJS
 * geo_links_get_incoming (locations/inc_geo_links.js 336-357) lists them, one per door or signpost
 * connect elsewhere whose target is the street (geo_links_get_outgoing_to 359-415: the connect's x
 * and y), and a Map teleport landed on one of them (players/inc_teleportation.js 482-503). The
 * remake's streets carry those points on their signpost and door connects (`arrive`, in the
 * target street's screen space, as tools/build-ancestral-nostalgia.mjs reads them), so this
 * collects, for each street of the index, the arrivals of every street that leads there.
 * js/street-arrival.js stands an arrival with no spot of its own on one of them (G913).
 *
 * Shape: { "<index tsid>": [[x, y], ...] } sorted by x then y, streets with none left out.
 *
 *   node tools/build-street-arrivals.mjs          write
 *   node tools/build-street-arrivals.mjs --check  exit 1 if the file is stale
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stationArrival, stationByTsid } from '../public/js/subway.js?v=36c6d2b2';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const OUT = join(pub, 'assets/content/street-arrivals.json');

/** street-loader.js resolveIndexTsid's aliases: the tsid without its G or L. */
const body = (tsid) => String(tsid || '').slice(1);

export function buildArrivals() {
  const index = JSON.parse(readFileSync(join(pub, 'assets/streets/index.json'), 'utf8')).streets;
  const byBody = new Map(Object.keys(index).map((t) => [body(t), t]));
  const points = new Map();
  const add = (target, arrive) => {
    const to = byBody.get(body(target));
    if (!to || !arrive || !Number.isFinite(arrive.x) || !Number.isFinite(arrive.y)) return;
    if (!points.has(to)) points.set(to, new Map());
    const x = Math.round(arrive.x);
    const y = Math.round(arrive.y);
    points.get(to).set(`${x},${y}`, [x, y]);
  };
  for (const [tsid, row] of Object.entries(index)) {
    const file = join(pub, row.file || `assets/streets/${tsid}.json`);
    if (!existsSync(file)) continue;
    const street = JSON.parse(readFileSync(file, 'utf8'));
    for (const sign of street.signposts || []) {
      for (const c of sign?.connects || []) if (c && body(c.tsid) !== body(tsid)) add(c.tsid, c.arrive);
    }
    for (const door of street.doors || []) {
      const to = door?.connect?.tsid || door?.connect?.street;
      // A subway entrance's archived connect has no `arrive`: the station's spot is the one
      // subway-feature prepareStreet gives it (js/subway.js stationArrival: its x, on the walking line, #385).
      const station = !door?.connect?.arrive && stationByTsid(to);
      if (station) add(station.streetTsid, stationArrival(door.connect.x));
      else if (to && body(to) !== body(tsid)) add(to, door.connect.arrive);
    }
  }
  const out = {};
  for (const tsid of Object.keys(index).sort()) {
    const set = points.get(tsid);
    if (set?.size) out[tsid] = [...set.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }
  return out;
}

/** One street a line, so a diff names the streets that changed. */
export function render(table) {
  const rows = Object.entries(table).map(([tsid, pts]) => `${JSON.stringify(tsid)}:${JSON.stringify(pts)}`);
  return `{\n${rows.join(',\n')}\n}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const text = render(buildArrivals());
  if (process.argv.includes('--check')) {
    const now = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (now !== text) {
      console.error('public/assets/content/street-arrivals.json is stale: run node tools/build-street-arrivals.mjs');
      process.exit(1);
    }
    console.log('street-arrivals.json is current');
  } else {
    writeFileSync(OUT, text);
    const table = JSON.parse(text);
    console.log(`${Object.keys(table).length} streets, ${Object.values(table).reduce((n, p) => n + p.length, 0)} arrivals`);
  }
}
