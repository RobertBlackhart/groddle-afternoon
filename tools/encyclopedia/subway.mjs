/**
 * G917 (#445): the Subway System map in the Encyclopedia, at /encyclopedia/subway/.
 *
 * The map is the game's own (js/map-views.js renderSubwayMapSvg, the Map window's Subway view:
 * MapTransit.as, the 12 stations at their config_prod.js map_pos on the client's 760 x 460 frame),
 * drawn here at build time as inline SVG over the remake's recreated paper (SUBWAY_PAPER; Tiny
 * Speck's subway_map_bg_59215.jpg was never archived), with each station a link to its station's
 * street page and its region's name to the region. Under it, the stations in Red Line order: the
 * street the station comes up on, and the next stop each way. Linked from the Encyclopedia's home,
 * the Streets list, and the Subway line of every station street and every street a station comes
 * up on (streets.mjs streetPage).
 *
 * Words about the remake are ours (tests/player-copy-dev-refs.test.js: no file names).
 */
import { join } from 'node:path';
import { esc } from './parts.mjs';

const root = join(import.meta.dirname, '..', '..');
const mod = (name) => import(join(root, 'public', 'js', name));

/** The page's path from the site root. */
export const SUBWAY_PATH = 'encyclopedia/subway/';
/** A station's row on the page. */
export const stationAnchor = (station) => `station-${Number(station?.id) || 0}`;
/** The link a street page's Subway line ends with (p: the path from that page to the site root). */
export const subwayMapLink = (p, station) => `<a class="st-subway-map" href="${p}${SUBWAY_PATH}#${stationAnchor(station)}">Subway map</a>`;

export const SUBWAY_TEXT = Object.freeze({
  title: 'Subway System',
  kicker: 'Subway map',
  lead: (n, red, blue, fare) => `${n} stations under Ur on one loop of track. The ${red} runs round it one way and the ${blue} the other, a ticket at the station's red button costs ${fare} currants, and each station has stairs up to a street above ground.`,
  caption: 'The map as the game’s Map window draws it. Tiny Speck’s own paper for this map was never archived and is lost; this one was made for the remake, with the stations where their map put them.',
  lineNote: (red, blue) => `Shown with the ${red}. The ${blue} runs the same track the other way.`,
  stations: 'Stations',
  phoneHint: 'Slide the map sideways to see all of it.',
  stationsLead: (red) => `In ${red} order. Pick a station on the map, or a name here, for its page.`,
});

/** Builds the page's <header> and <main>; build.mjs wraps it in the page frame. */
export async function subwayPage({ d, P, p, info }) {
  const [{ renderSubwayMapSvg, SUBWAY_PAPER }, { STATIONS, LINE_COLOURS, FARE, lineName, stationById }] = await Promise.all([mod('map-views.js'), mod('subway.js')]);
  const red = lineName('forwards');
  const blue = lineName('backwards');
  const streetHref = (tsid) => {
    const k = tsid && d.streetKeyOf(tsid);
    return k ? P.href(k) : null;
  };
  const streetName = (tsid) => {
    const k = tsid && d.streetKeyOf(tsid);
    return k ? d.entries.get(k).name : d.streetLabel(tsid);
  };
  const streetA = (tsid) => {
    const href = streetHref(tsid);
    return href ? `<a href="${href}">${esc(streetName(tsid))}</a>` : esc(streetName(tsid));
  };
  const placeOf = (s) => {
    const k = d.streetKeyOf(s.surfaceStreetTsid) || d.streetKeyOf(s.streetTsid);
    const place = k ? d.entries.get(k)?.street?.place : null;
    return place && info(place) ? place : null;
  };
  const svg = renderSubwayMapSvg({
    direction: 'forwards',
    buttons: false,
    paper: { href: `${p}${SUBWAY_PAPER.x2}`, hi: null },
    links: (s) => {
      const place = placeOf(s);
      return {
        street: streetHref(s.streetTsid) || streetHref(s.surfaceStreetTsid),
        hub: place ? P.href(place) : null,
        label: `${s.name} station, ${s.hubName}`,
      };
    },
  });
  const rows = STATIONS.map((s) => {
    const place = placeOf(s);
    const next = stationById(s.next_stop);
    const prev = stationById(s.previous_stop);
    return `<li id="${stationAnchor(s)}" class="sub-station">
          <h3>${streetHref(s.streetTsid) ? `<a href="${streetHref(s.streetTsid)}">${esc(s.name)}</a>` : esc(s.name)}</h3>
          <dl class="sub-facts">
            <dt>Region</dt><dd>${place ? `<a href="${P.href(place)}">${esc(info(place).name)}</a>` : esc(s.hubName)}</dd>
            <dt>Stairs up to</dt><dd>${streetA(s.surfaceStreetTsid)}</dd>
            <dt><span class="sub-line sub-red">${esc(red)}</span></dt><dd>Next stop ${next ? `<a href="#${stationAnchor(next)}">${esc(next.name)}</a>` : ''}</dd>
            <dt><span class="sub-line sub-blue">${esc(blue)}</span></dt><dd>Next stop ${prev ? `<a href="#${stationAnchor(prev)}">${esc(prev.name)}</a>` : ''}</dd>
          </dl>
        </li>`;
  }).join('\n        ');
  const body = `
  <header class="masthead note-head cat-head">
    <div class="wrap">
      <p class="kicker"><a href="../">Groddle Encyclopedia</a> · <a href="../streets/">Streets</a> · ${esc(SUBWAY_TEXT.kicker)}</p>
      <h1>${esc(SUBWAY_TEXT.title)}</h1>
      <p class="lead">${esc(SUBWAY_TEXT.lead(STATIONS.length, red, blue, FARE))}</p>
    </div>
  </header>

  <main class="band cat-main">
    <div class="wrap">
      <figure class="sub-map" style="--sub-red: ${LINE_COLOURS.forwards}; --sub-blue: ${LINE_COLOURS.backwards}">
        <div class="sub-map-frame">${svg}</div>
        <p class="sub-map-hint">${esc(SUBWAY_TEXT.phoneHint)}</p>
        <figcaption>${esc(SUBWAY_TEXT.lineNote(red, blue))} ${esc(SUBWAY_TEXT.caption)}</figcaption>
      </figure>
      <section class="ency-group sub-stations" aria-labelledby="stations-h">
        <h2 id="stations-h">${esc(SUBWAY_TEXT.stations)} <span class="count">${STATIONS.length}</span></h2>
        <p class="ency-lead-small">${esc(SUBWAY_TEXT.stationsLead(red))}</p>
        <ol class="sub-list" style="--sub-red: ${LINE_COLOURS.forwards}; --sub-blue: ${LINE_COLOURS.backwards}">
        ${rows}
        </ol>
      </section>
    </div>
  </main>
`;
  return {
    count: STATIONS.length,
    body,
    title: `${SUBWAY_TEXT.title} · Groddle Encyclopedia`,
    description: `The Subway System map from Tiny Speck’s Glitch: ${STATIONS.length} stations on the ${red} and the ${blue}, and the street each one comes up on.`,
  };
}
