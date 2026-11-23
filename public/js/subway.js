/**
 * The Ur subway (register row G115): rules, source copy, the solo ride
 * schedule and the station and train street builders. Pure data and
 * functions (no Pixi, no DOM); features/subway-feature.js runs it.
 *
 * Source (glitch-GameServerJS, CC0):
 * - config_prod.js transit_instances.subway_1 (js/subway-line.js, generated
 *   by tools/build-subway.mjs): fare 50, Red Line forwards (next_stop) and
 *   Blue Line backwards (previous_stop), train template LTJ101M7R9O1HTT,
 *   min_capacity 3, initial_departure_timeout 60 s, departure_timeout 10 s,
 *   arrival_timeout 30 s, 12 stations with their surface street
 *   (connects_to) and map_pos.
 * - items/subway_gate.js "A Red Button": push plays SUBWAY_BUTTON; without
 *   the you_have_papers badge, or under the dont_get_caught buff, a refusal;
 *   otherwise "Train tickets 50C." with the two lines' next stops. Paying
 *   puts you straight into the train (transit_enter_instance), "Whoops!
 *   Looks like you can't afford that." when you can't.
 * - locations/inc_transit.js: the ride. Boarding counts transit
 *   subways_entered (once per boarding, however many stops you stay on).
 *   Doors close with "This train will depart for X in a few seconds." and
 *   TRAIN_DEPARTS, it departs 3 s later ("This train is departing.",
 *   window overlays, TRAVELLING_TRAIN), 10 s before arrival "The next stop
 *   is X, arriving in 10 seconds.", brakes 7 s later (TRAIN_ARRIVES), then
 *   "The train has arrived at X." and the prompt "This stop is X. Get off
 *   train?" (yes / no, 10 s). Yes puts you on that station at x 0, y -136
 *   (players/player.js transit_disembark_callback); no, or no answer, rides
 *   on: the doors close 7 s after arrival and it departs at 10 s.
 * - achievements subwayfarer 23, ground_hogger 103, commuter_mug 251,
 *   chute_jockey 503 (group transit, counter subways_entered).
 * - items/subway_map.js "Subway Map": verb view, "Direct your peepers at
 *   this here map", opens the Subway System map.
 *
 * Solo adaptations: the source waited up to 60 s for 3 riders; with no one
 * else coming the train leaves 10 s after you board (the source's own
 * departure_timeout between stops), and a hop between stations takes 20 s
 * instead of 30 (the "arriving in 10 seconds" call and the brakes keep their
 * source offsets). Stops keep the source's 10 s dwell and prompt.
 *
 * The stations and the train were never archived (not in the public
 * locations dump), so they are rebuilt from footage (Lily Linguistic's
 * VVyjuuRxDUw and bvOH7rsQ6qo, reference only) with the subway1.swf pieces
 * (js/subway-art.js): one station layout shared by all 12 (the source used
 * one subway template per station), each with its own name sign.
 */

import { SUBWAY_LINE } from './subway-line.js?v=d74b3ee0';
import { SUBWAY_ART } from './subway-art.js?v=789979e3';
import { MIN_GROUND_CLEARANCE } from './movement.js?v=f4be1a05';

export { SUBWAY_LINE, SUBWAY_ART };

export const SUBWAY_ART_BASE = 'assets/sprites/subway/';
export const FARE = SUBWAY_LINE.fare;
export const PAPERS_BADGE = 'you_have_papers';
export const CARD_BADGE = 'card_carrying_qualification';
export const DUBIOUS_BUFF = 'dont_get_caught';
export const RIDE_COUNTER = 'transit:subways_entered';
export const DIRECTIONS = Object.freeze(['forwards', 'backwards']);

/** The four transit badges (achievements/*.js conditions 553-556). */
export const SUBWAY_BADGES = Object.freeze([
  Object.freeze({ id: 'subwayfarer', rides: 23 }),
  Object.freeze({ id: 'ground_hogger', rides: 103 }),
  Object.freeze({ id: 'commuter_mug', rides: 251 }),
  Object.freeze({ id: 'chute_jockey', rides: 503 }),
]);

/**
 * Each line's colour, the one table every subway map draws from (the Map's Subway view, the station's
 * Subway Map and the line map on the train, G1127): the Red Line red and the Blue Line blue, as on the
 * Subway System map in the footage (bvOH7rsQ6qo t0016). They are design tokens (style.css --subway-red,
 * --subway-blue) a shade deeper than the footage's, so a line's name and Next stop read on the cream
 * card as text, not only as a stroke. LINE_COLOURS is the CSS value for a style (a custom property or a
 * style attribute; SVG presentation attributes do not take var()).
 */
export const LINE_TOKENS = Object.freeze({ forwards: '--subway-red', backwards: '--subway-blue' });
export const LINE_COLOURS = Object.freeze({ forwards: `var(${LINE_TOKENS.forwards})`, backwards: `var(${LINE_TOKENS.backwards})` });

export const lineName = (direction) => (direction === 'backwards' ? SUBWAY_LINE.backwards_name : SUBWAY_LINE.forwards_name);

/* ------------------------------------------------------------------ */
/* Stations                                                            */
/* ------------------------------------------------------------------ */

export const STATIONS = SUBWAY_LINE.stations;
const BY_ID = new Map(STATIONS.map((s) => [s.id, s]));
const BY_TSID = new Map();
for (const s of STATIONS) {
  BY_TSID.set(s.tsid, s);
  BY_TSID.set(s.streetTsid, s);
}

export const CAR_TSID = SUBWAY_LINE.car.streetTsid;
export const CAR_LABEL = SUBWAY_LINE.car.label;

export const stationById = (id) => BY_ID.get(Number(id)) || null;
/** A station by its L or G tsid. */
export const stationByTsid = (tsid) => BY_TSID.get(String(tsid || '')) || null;
export const isCarTsid = (tsid) => !!tsid && (tsid === CAR_TSID || tsid === SUBWAY_LINE.template_tsid);
export const surfaceStation = (surfaceTsid) => STATIONS.find((s) => s.surfaceStreetTsid === surfaceTsid || s.connects_to === surfaceTsid) || null;

/** The station a direction's train reaches next (transit_get_next_stop / transit_get_previous_stop). */
export function nextStation(id, direction = 'forwards') {
  const here = stationById(id);
  if (!here) return null;
  return stationById(direction === 'backwards' ? here.previous_stop : here.next_stop);
}

/** "Groddle Forest Junction" -> sub_sign_groddle_forest_junction, the station's own sign. */
export const signPiece = (station) => `sub_sign_${String(station?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

/** A station by id, name, slug or tsid (QA routes). */
export function findStation(key) {
  const raw = String(key ?? '').trim();
  if (!raw) return null;
  const byId = /^\d+$/.test(raw) ? stationById(raw) : null;
  if (byId) return byId;
  const tsid = stationByTsid(raw.toUpperCase());
  if (tsid) return tsid;
  const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return STATIONS.find((s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, '') === slug
    || s.label.toLowerCase().replace(/[^a-z0-9]+/g, '') === slug
    || s.surfaceLabel.toLowerCase().replace(/[^a-z0-9]+/g, '') === slug) || null;
}

/* ------------------------------------------------------------------ */
/* Source copy                                                         */
/* ------------------------------------------------------------------ */

export const TEXT = Object.freeze({
  gateLabel: 'A Red Button',
  gateTooltip: 'Buy a ticket',
  gateDesc: 'A button on an old ruin, but still operative! A subway gate.',
  refusePapers: "I'm sorry: without Your Papers, you may not use public transportation.",
  refuseDubious: "I'm sorry: public transportation is not available to those engaging in journeys of dubious purpose.",
  cantAfford: "Whoops! Looks like you can't afford that.",
  noThanks: 'No thanks',
  ok: 'OK',
  papersIncomplete: 'You have acquired and activated your Card-Carrying Qualification, and you have Your Papers but you need to complete them. Try clicking on Your Papers in your pack.',
  // The source goes on "or you can avoid the red tape by getting them from another player. Hint: Try Auctions": there are no other players here.
  papersAtHall: 'You can get Your Papers at the Bureaucratic Hall on Gregarious Grange.',
  cardNotActive: 'You have acquired your Card-Carrying Qualification, but you need to activate it. Try clicking on the Card-Carrying Qualification in your pack. After that, return to the Bureaucratic Hall on Gregarious Grange and purchase and complete Your Papers.',
  mapLabel: 'Subway Map',
  mapTooltip: 'Direct your peepers at this here map',
  mapViewed: 'You viewed a Subway Map.',
  mapTitle: 'Subway System',
  yes: 'yes',
  no: 'no',
  /** G1139: /stuck off a train car with no ride (the remake's own words). */
  strandedOff: "You're off the train, back on the platform.",
});

/** subway_gate.js push: the ticket conversation for a station. */
export function ticketOffer(stationId) {
  const fwd = nextStation(stationId, 'forwards');
  const back = nextStation(stationId, 'backwards');
  if (!fwd || !back) return null;
  return {
    title: `Train tickets ${FARE}C.`,
    text: 'Which line would you like to ride?',
    lines: [
      { direction: 'forwards', name: SUBWAY_LINE.forwards_name, next: fwd.name },
      { direction: 'backwards', name: SUBWAY_LINE.backwards_name, next: back.name },
    ],
    choices: [
      // #387: each button says where its line goes next (the source's buttons named only the line).
      { value: 'pay-forwards', label: `${SUBWAY_LINE.forwards_name}, next stop ${fwd.name} (${FARE}C)` },
      { value: 'pay-backwards', label: `${SUBWAY_LINE.backwards_name}, next stop ${back.name} (${FARE}C)` },
      { value: 'no-pay', label: TEXT.noThanks },
    ],
  };
}

/** The gate's refusal, or null when the player may buy a ticket (papers first, then the buff, as in push). */
export function gateRefusal({ hasPapers = false, dubious = false } = {}) {
  if (!hasPapers) return { code: 'papers', text: TEXT.refusePapers };
  if (dubious) return { code: 'dubious', text: TEXT.refuseDubious };
  return null;
}

/**
 * R24: what the gate asks of this player (engine.unlockedAchievements, engine.hasBuff): the
 * you_have_papers badge, and the dont_get_caught buff (carrying contraband).
 */
export function gateTerms(engine) {
  return {
    hasPapers: (engine?.unlockedAchievements || []).includes(PAPERS_BADGE),
    dubious: Boolean(engine?.hasBuff?.(DUBIOUS_BUFF)),
  };
}

/**
 * R24: the gate's answer for this player (gateRefusal, or null when it sells a ticket). The gate
 * and the Map's routes (features/map-routes-feature.js) both ask this, so a route rides the subway
 * only when the gate would let you through.
 */
export const gateFor = (engine) => gateRefusal(gateTerms(engine));

/** subway_gate.js onConversation 'ok' after the papers refusal: where the player stands with the Bureaucratic Hall. */
export function papersHint({ hasCardBadge = false, hasPapersItem = false, hasCardItem = false } = {}) {
  if (hasCardBadge) return hasPapersItem ? TEXT.papersIncomplete : TEXT.papersAtHall;
  if (hasCardItem) return TEXT.cardNotActive;
  return null;
}

/** Pay the fare from a pc ({ currants }); false when it can't be afforded (stats_try_remove_currants). */
export function payFare(pc) {
  if (!pc || (Number(pc.currants) || 0) < FARE) return false;
  pc.currants -= FARE;
  return true;
}

export const announce = Object.freeze({
  // Solo: the source's "when N more players board, or in S seconds" has no players to wait for.
  boarding: (seconds) => `This train will be departing in ${seconds} ${seconds === 1 ? 'second' : 'seconds'}.`,
  doorsClose: (next) => ({ text: 'This train will depart for {name} in a few seconds.', name: next }),
  departing: () => ({ text: 'This train is departing.' }),
  nextStop: (next) => ({ text: 'The next stop is {name}, arriving in 10 seconds.', name: next }),
  arrived: (here) => ({ text: 'The train has arrived at {name}.', name: here }),
  getOff: (here) => `This stop is ${here}. Get off train?`,
});

/** Badges a ride count has reached (for tests and QA). */
export const badgesReached = (rides) => SUBWAY_BADGES.filter((b) => rides >= b.rides).map((b) => b.id);

/* ------------------------------------------------------------------ */
/* The ride                                                            */
/* ------------------------------------------------------------------ */

const S = 1000;
/** Source timings (seconds), for the record and the tests. */
export const SOURCE_TIMING = Object.freeze({
  initialDeparture: SUBWAY_LINE.initial_departure_timeout,
  departure: SUBWAY_LINE.departure_timeout,
  arrival: SUBWAY_LINE.arrival_timeout,
  doorsToDepart: 3,
  preArrival: 10,
  brakesAfterPreArrival: 7,
  prompt: 10,
});

/** Solo timings in ms; `scale` < 1 speeds a QA run up. */
export function rideTiming(scale = 1) {
  const k = Number.isFinite(scale) && scale > 0 ? scale : 1;
  return Object.freeze({
    board: 10 * S * k, // boarding to departure (source departure_timeout; the source waited 60 s for riders)
    doors: 3 * S * k, // doors close this long before departure
    travel: 20 * S * k, // departure to arrival (source 30 s)
    preArrival: 10 * S * k, // "arriving in 10 seconds", before arrival
    brakes: 3 * S * k, // TRAIN_ARRIVES this long before arrival (source: 7 s after the call)
    dwell: SUBWAY_LINE.departure_timeout * S * k, // arrival to departure
    prompt: SOURCE_TIMING.prompt * S * k,
  });
}

/**
 * A ride from boarding. The train is at `stop` (a station id) heading
 * `direction`; times are wall-clock ms.
 */
export function createRide({ stop, direction = 'forwards', now = 0, timing = rideTiming() } = {}) {
  const next = nextStation(stop, direction);
  if (!next) return null;
  return {
    stop: Number(stop),
    direction: direction === 'backwards' ? 'backwards' : 'forwards',
    phase: 'boarding', // boarding | moving | stopped
    boardedAt: now,
    departAt: now + timing.board,
    doorsAt: now + timing.board - timing.doors,
    arriveAt: 0,
    preAt: 0,
    brakesAt: 0,
    doorsClosed: false,
    called: false,
    braked: false,
    stops: 0,
    timing,
  };
}

/** The station the ride is heading for (or standing at, once it arrives). */
export const rideNext = (ride) => (ride ? nextStation(ride.stop, ride.direction) : null);

/**
 * Advance a ride to `now`; returns the events that fired, in order:
 * { type: 'doors', next } | { type: 'depart', next } | { type: 'call', next } |
 * { type: 'brakes' } | { type: 'arrive', station }.
 */
export function stepRide(ride, now) {
  const out = [];
  if (!ride) return out;
  const t = ride.timing;
  for (let guard = 0; guard < 8; guard += 1) {
    if (ride.phase !== 'moving') {
      if (!ride.doorsClosed && now >= ride.doorsAt) {
        ride.doorsClosed = true;
        out.push({ type: 'doors', next: rideNext(ride) });
        continue;
      }
      if (now >= ride.departAt) {
        ride.phase = 'moving';
        ride.arriveAt = ride.departAt + t.travel;
        ride.preAt = ride.arriveAt - t.preArrival;
        ride.brakesAt = ride.arriveAt - t.brakes;
        ride.called = false;
        ride.braked = false;
        out.push({ type: 'depart', next: rideNext(ride) });
        continue;
      }
      break;
    }
    if (!ride.called && now >= ride.preAt) {
      ride.called = true;
      out.push({ type: 'call', next: rideNext(ride) });
      continue;
    }
    if (!ride.braked && now >= ride.brakesAt) {
      ride.braked = true;
      out.push({ type: 'brakes' });
      continue;
    }
    if (now >= ride.arriveAt) {
      const here = rideNext(ride);
      ride.stop = here.id;
      ride.phase = 'stopped';
      ride.stops += 1;
      ride.doorsClosed = false;
      ride.departAt = ride.arriveAt + t.dwell;
      ride.doorsAt = ride.departAt - t.doors;
      out.push({ type: 'arrive', station: here });
      continue;
    }
    break;
  }
  return out;
}

/** Whether "Get off train?" may still be answered yes (transit_disembark_callback: not once departed). */
export const canDisembark = (ride) => !!ride && ride.phase === 'stopped';

/**
 * The line you are riding, for its map (M on the train; Austin 2026-11-01). The client's transit
 * map while riding (glitch-client HubMapDialog.as start 913-935, updateMapTransit 800-826,
 * MapTransit.as setPlayerLocation 180-240, line buttons 125-135): the line being ridden only (the other line's button
 * says "You're on the Red Line"), the star at the train's current station, grey while it moves,
 * and "Next stop:" with the next station, from the server's transit_status (inc_transit.js
 * current_tsid / next_tsid / is_moving). The remake adds the stops in order and the stop you
 * picked to get off at (`chosen`, a station id).
 *
 * Returns { direction, lineName, colour, at, moving, next, stops: [{ id, name, hubName, away }],
 * chosen: { id, name, away } | null }, the stops in riding order from the next one round the loop
 * to the one the train is at (away 1 is the next stop; the train's own station is the last, its
 * away the loop's length, 0 while the train stands there).
 */
export function lineView(ride, chosen = null) {
  if (!ride || !stationById(ride.stop)) return null;
  const direction = ride.direction === 'backwards' ? 'backwards' : 'forwards';
  const at = stationById(ride.stop);
  const moving = ride.phase === 'moving';
  const stops = [];
  let s = nextStation(at.id, direction);
  for (let away = 1; s && away <= STATIONS.length; away += 1) {
    stops.push({ id: s.id, name: s.name, hubName: s.hubName, away: s.id === at.id && !moving ? 0 : away });
    s = nextStation(s.id, direction);
  }
  const pick = chosen == null ? null : stops.find((x) => x.id === Number(chosen)) || null;
  return {
    direction,
    lineName: lineName(direction),
    colour: LINE_COLOURS[direction],
    at: { id: at.id, name: at.name, hubName: at.hubName },
    moving,
    next: stops[0] ? { ...stops[0] } : null,
    stops,
    chosen: pick ? { id: pick.id, name: pick.name, away: pick.away } : null,
  };
}

/**
 * PURE (#538, our own touch; Glitch's star stayed on the station it left, grey, MapTransit.as
 * setPlayerLocation): how far the train is through the hop it is making, 0 leaving its station to 1 at
 * the next, from the ride's known departure and arrival times, like a progress bar. 0 while the train
 * stands. `steps` > 0 rounds down to that many even steps (reduced motion: the star jumps, never glides).
 */
export function rideProgress(ride, now, { steps = 0 } = {}) {
  if (!ride || ride.phase !== 'moving') return 0;
  const span = Number(ride.arriveAt) - Number(ride.departAt);
  if (!(span > 0)) return 1;
  let p = Math.min(1, Math.max(0, (Number(now) - Number(ride.departAt)) / span));
  if (steps > 0 && p < 1) p = Math.floor(p * steps) / steps;
  return p;
}

/** PURE: the point `p` (0..1, clamped) of the way along the straight line from `a` to `b` ({ x, y }). */
export function linePoint(a, b, p) {
  const k = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
}

/** The Red Line's stations in order as [x, y] (config_prod.js map_pos; the Blue Line runs them backwards). */
export function subwayPoints(stations = STATIONS) {
  return stations.map((s) => [s.map_pos[0], s.map_pos[1]]);
}

/**
 * A closed Catmull-Rom curve through the points, as cubic Bezier segments
 * [[p0, c1, c2, p1], ...] (one a pair of neighbouring stations). Every subway map draws its track
 * with this (js/map-views.js renderSubwayMapSvg), and the train's star rides it (curvePoint).
 */
export function subwaySegments(pts) {
  const n = pts.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push([p1, c1, c2, p2]);
  }
  return out;
}

/** A cubic's point and direction (radians) at t. */
export function cubicAt([p0, c1, c2, p1], t) {
  const u = 1 - t;
  const x = u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0];
  const y = u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1];
  const dx = 3 * u * u * (c1[0] - p0[0]) + 6 * u * t * (c2[0] - c1[0]) + 3 * t * t * (p1[0] - c2[0]);
  const dy = 3 * u * u * (c1[1] - p0[1]) + 6 * u * t * (c2[1] - c1[1]) + 3 * t * t * (p1[1] - c2[1]);
  return { x, y, angle: Math.atan2(dy, dx) };
}

const CURVE_STEPS = 48;
let curveCache = null;
/** The default line's segments with their running lengths (CURVE_STEPS samples each), made once. */
function lineCurve(stations) {
  if (stations === STATIONS && curveCache) return curveCache;
  const segs = subwaySegments(subwayPoints(stations)).map((seg) => {
    const lens = [0];
    let prev = cubicAt(seg, 0);
    for (let i = 1; i <= CURVE_STEPS; i += 1) {
      const pt = cubicAt(seg, i / CURVE_STEPS);
      lens.push(lens[i - 1] + Math.hypot(pt.x - prev.x, pt.y - prev.y));
      prev = pt;
    }
    return { seg, lens };
  });
  if (stations === STATIONS) curveCache = segs;
  return segs;
}

/**
 * PURE (G1127, #606): the point `p` (0..1, clamped) of the way along the drawn track from station
 * `fromId` to its neighbour `toId`, either way round the loop, by distance along the curve so the star
 * keeps an even pace. Null when the two are not neighbours on the line.
 */
export function curvePoint(fromId, toId, p, stations = STATIONS) {
  const n = stations.length;
  const i = stations.findIndex((s) => s.id === Number(fromId));
  const j = stations.findIndex((s) => s.id === Number(toId));
  if (i < 0 || j < 0 || n < 2) return null;
  let index;
  let back;
  if ((i + 1) % n === j) [index, back] = [i, false];
  else if ((j + 1) % n === i) [index, back] = [j, true];
  else return null;
  const k = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  const end = (s) => ({ x: s.map_pos[0], y: s.map_pos[1] });
  if (k <= 0) return end(stations[i]);
  if (k >= 1) return end(stations[j]);
  const { seg, lens } = lineCurve(stations)[index];
  const want = (back ? 1 - k : k) * lens[CURVE_STEPS];
  let a = 1;
  while (a < CURVE_STEPS && lens[a] < want) a += 1;
  const span = lens[a] - lens[a - 1];
  const t = (a - 1 + (span > 0 ? (want - lens[a - 1]) / span : 0)) / CURVE_STEPS;
  const pt = cubicAt(seg, t);
  return { x: pt.x, y: pt.y };
}

/**
 * PURE (#538): where the star sits on the line map (map_pos space): on the train's station while it
 * stands, `p` of the way to the next stop while it moves. G1127 (#606): along the curved track the map
 * draws (curvePoint), no longer the straight line between the two stops. Null for a ride the map
 * cannot place.
 */
export function lineStarPoint(view, p = 0) {
  const at = view && stationById(view.at?.id);
  if (!at) return null;
  const from = { x: at.map_pos[0], y: at.map_pos[1] };
  const next = view.moving && view.next ? stationById(view.next.id) : null;
  if (!next) return from;
  return curvePoint(at.id, next.id, p) || linePoint(from, { x: next.map_pos[0], y: next.map_pos[1] }, p);
}

/** The line map's footer: where you get off, if you picked a stop. */
export const lineText = Object.freeze({
  title: (line) => `${line} map`,
  at: (name) => `The train is at ${name}.`,
  between: (from, to) => `The train is between ${from} and ${to}.`,
  next: 'Next stop:',
  pick: 'Pick a stop to mark where you get off. The train still asks at every stop.',
  getOffAt: (name, away) => (away === 0 ? `You get off here, at ${name}.` : `You get off at ${name}, ${away} ${away === 1 ? 'stop' : 'stops'} from here.`),
  yourStop: 'Your stop',
  mark: (name) => `Get off at ${name}`,
  unmark: 'Clear your stop',
});

/* ------------------------------------------------------------------ */
/* Streets                                                             */
/* ------------------------------------------------------------------ */

/*
 * The station, world space (x right, y up negative), floor at the source's arrival y -136. G838
 * (#385): laid out from the 2012 whole-street snaps of all 12 stations (research/eleven-snaps/Subway,
 * 1500 x 700 renders at 1:1, reference only), each piece found by matching our own CC0 subway1.swf art
 * against them. A Glitch street is centred on x 0, so the station runs -750 to 750 and the source's
 * step-off spot (transit_disembark_callback x 0) falls at the Subway Map post, where riders arrive in
 * bvOH7rsQ6qo t047. Left to right: the stairs flush with the left end, the crack with its pipes, the
 * station's sign up above the crack's right end, the column, the Subway Map post, a crack running down
 * the wall, then the train's nose with the ticket post and the green gate box, A Red Button on its
 * face under the grille. Every station is the same but for its sign and the map post (STATION_SPOTS).
 * Snap px map to world as x - 750, y - 719 (the avatar's feet in the GFJ snap at y 583).
 */
export const STATION_FLOOR = -136;
export const STATION_BOUNDS = Object.freeze({ l: -750, r: 750, t: -640, b: -50 });
/**
 * #385: the walking line climbs the stairs to the entrance, so you walk up the steps as in Glitch
 * (a player's rebuild of the station for Eleven draws the platform line as a slope from the floor up
 * to the entrance). No station's location file survives, so the line is read off what does: the
 * step noses in the 2012 snaps (the bottom tread at x -620, y -167; the top one at the left end, y
 * -244) and the twelve surface doors' own arrival points into their stations (connect x, y: GFJ
 * -582, -170; Jutuan Central -714, -239; Onto Parada -717, -242; Somewhat Sump -685, -257), which
 * sit along it from x -720 to -520, 15 to 55 px over it (dropped onto the line). It meets the floor
 * at x -580. One line for all 12 stations: they share one layout and one stairs.
 */
export const STATION_STAIRS_LINE = Object.freeze({ x1: -748, y1: -244, x2: -580, y2: -136 });
/** The walking line's y at world x: up the stairs left of their foot, the floor elsewhere. */
export function stationFloorY(x) {
  const { x1, y1, x2, y2 } = STATION_STAIRS_LINE;
  const at = Number(x);
  if (!Number.isFinite(at) || at >= x2) return STATION_FLOOR;
  const c = Math.max(x1, at);
  return Math.round(y1 + ((y2 - y1) * (c - x1)) / (x2 - x1));
}
// The stairs' flat back stands flush with the station's left end (l -750 + 132 / 2), as in the snaps.
// `train` is the nose's left edge; `sign` and `map` are GFJ's (STATION_SPOTS has each station's).
// #509: A Red Button's centre at x 433 (snap x 1183 in every 2012 station snap), 27 x 47 px.
export const STATION_X = Object.freeze({ stairs: -684, crack: -627, sign: -447, column: -212, map: 0, arrive: 0, crack2: 24, train: 155, post: 377, gate: 478, button: 433, floorCrack: -544 });
/**
 * G1149 (#619): the gate closes the platform. The ticket post's striped arm reaches across to the green
 * gate box at the platform's front edge (the 2012 snaps), so nobody walks on past it; the floor ran to
 * the right end and you walked past the gate, the button then on the box's far face from you. A wall
 * at the box's left face, ceiling to floor, solid to a walker coming from the left only (pc_perm -1,
 * Wall.as pc_solid_from_left), so anyone already past it (an old saved spot) can walk back. You stop
 * facing A Red Button, on the box's left face as in every snap. All 12 stations share it.
 */
export const STATION_GATE_WALL = Object.freeze({ id: 'wall_subway_gate', x: 395, y: STATION_FLOOR - 410, h: 410, pc_perm: -1 });
/**
 * A Red Button on the gate box's face (#509: centre x 433, 27 x 47, as the snaps show it), drawn
 * mirrored. G1221 (#619): Tiny Speck's subway_gate art has the plate's thick edge on its left and the
 * plate rising to the right; every 2012 station snap and the 2012 video still show it the other way
 * round (the plate's top edge falling to the right, the button bulging left), so the station placed
 * it flipped. The spot stays: only the mirror was wrong. All 12 stations draw the same button.
 */
export const STATION_BUTTON = Object.freeze({ piece: 'subway_gate', x: STATION_X.button, y: STATION_FLOOR - 37, w: 27, h: 47, z: 4, flip: true });

/**
 * Each station's sign (centre x, centre y) and Subway Map post (centre x, foot y), world px, read off
 * its snap: the signs hang 173 px wide at slightly different spots, Pitika Parse's post stands 72 px
 * further right. Missing stations take GFJ's.
 */
export const STATION_SPOTS = Object.freeze({
  'Groddle Forest Junction': { sign: [-447, -498], map: [0, -174] },
  'Eastern Approach': { sign: [-445, -493], map: [0, -174] },
  'Gregarious Grange': { sign: [-451, -488], map: [0, -174] },
  'Jutuan Central': { sign: [-416, -466], map: [0, -174] },
  'Kongu Hop': { sign: [-449, -489], map: [10, -165] },
  'Mallos Means': { sign: [-451, -501], map: [8, -162] },
  'Onto Parada': { sign: [-450, -489], map: [0, -174] },
  'Pitika Parse': { sign: [-418, -476], map: [72, -173] },
  'Somewhat Sump': { sign: [-390, -483], map: [0, -174] },
  'Tallish Crest': { sign: [-444, -494], map: [0, -174] },
  'Thiruvan Thrive': { sign: [-450, -489], map: [2, -162] },
  'Torpan Cleft': { sign: [-449, -493], map: [0, -174] },
});
/** The sign's drawn width in the snaps (the art keeps its own shape). */
export const STATION_SIGN_W = 174;
/**
 * The station's camera: the client framed the platform with the feet about 0.86 down the location
 * view (bvOH7rsQ6qo t003, VVyjuuRxDUw t001), y_cam_offset 216 (movement.js yCamOffsetAnchor:
 * 0.5 + 216 / 600). At the default 150 the sign over the crack hung above the top of the view.
 */
export const STATION_Y_CAM_OFFSET = 216;
export const stationSpots = (station) => STATION_SPOTS[station?.name] || STATION_SPOTS['Groddle Forest Junction'];

const art = (piece, x, y, z, extra = {}) => {
  const [, w, h] = SUBWAY_ART[piece] || [null, 0, 0];
  return Object.freeze({ piece, x, y, w: extra.w ?? w, h: extra.h ?? h, z, ...(extra.flip ? { flip: true } : {}), ...(extra.alpha ? { alpha: extra.alpha } : {}), ...(extra.frame ? { frame: Object.freeze([...extra.frame]) } : {}) });
};

/** Art rows: x centre, y bottom (world), z under the avatar (negative) or over it. */
export function stationArt(station) {
  const F = STATION_FLOOR;
  const { l, r } = STATION_BOUNDS;
  const X = STATION_X;
  const rows = [];
  const tiles = (piece, bottom, z, w = SUBWAY_ART[piece][1]) => {
    for (let x = l - 20; x < r + 20; x += w - 2) rows.push(art(piece, x + w / 2, bottom, z));
  };
  tiles('wall_1', F - 160, -70);
  tiles('wall_1', F - 160 - 220, -71);
  tiles('ceiling_1', F - 410, -66);
  tiles('back_platform_1', F - 120, -64);
  // The crack with its pipes, drawn 1.2 times its art in the snaps; the narrow crack at 0.8.
  rows.push(art('wall_crack_1', X.crack, F - 238, -62, { w: 247, h: 122 }));
  const piece = signPiece(station);
  const [, sw, sh] = SUBWAY_ART[piece] || [null, 135, 56];
  const signH = Math.round((STATION_SIGN_W * sh) / sw);
  const [signX, signY] = stationSpots(station).sign;
  rows.push(art(piece, signX, signY + signH / 2, -60, { w: STATION_SIGN_W, h: signH }));
  rows.push(art('wall_crack_2', X.crack2, F - 203, -62, { w: 59, h: 118 }));
  // The train stands in the trench: nose at the left, body running off the right end (0.91 of the art).
  rows.push(art('train_1', X.train + 629 / 2, F - 129, -56, { w: 629, h: 297 }));
  rows.push(art('platform_crack_1', X.floorCrack, F - 10, -48));
  // The column's foot stands nearer than the walking line, so it draws over the avatar (zIndex 50, game.js makePlayer; Austin, 2026-10-29).
  rows.push(art('column_1', X.column, F + 36, 60));
  rows.push(art('ticket_post_back', X.post, F - 63, -24));
  rows.push(art('subway_gate_static', X.gate, F + 40, -22));
  rows.push(art('door_asset_stairs', X.stairs, F - 2, -40));
  return rows;
}

/** Art rows at or over the avatar (game.js makePlayer zIndex 50) stand in the station's front layer. */
export const FRONT_Z = 50;

/**
 * An art row as a street deco (x centre, y bottom, as a deco's registration point), its
 * subway1.swf file named outright (street-render.js deco.src). `origin` puts it in a T_ layer's
 * screen space.
 */
function artDeco(row, i, origin = null) {
  return {
    id: `subway_${row.piece}_${i}`,
    sprite: row.piece,
    src: `${SUBWAY_ART_BASE}${SUBWAY_ART[row.piece][0]}`,
    x: origin ? row.x - origin.l : row.x,
    y: origin ? row.y - origin.t : row.y,
    w: row.w,
    h: row.h,
    z: row.z,
    r: 0,
    ...(row.flip ? { flip: true } : {}),
    ...(row.frame ? { frame: [...row.frame] } : {}),
  };
}

/**
 * The station's middleground: the platform floor (subway_platform_1 is a library deco), then
 * the station's art behind the avatar (stationArt). #482: the art is the street's own, so the
 * street map's snapshot (a picture of the street view) shows the station, not a bare wall and
 * floor; only A Red Button and the Subway Map post, which take clicks, stay the feature's.
 * Nothing behind the floor reaches below its top edge (F - 120).
 */
export function stationDecos(station) {
  const { l, r } = STATION_BOUNDS;
  const out = [];
  let i = 0;
  for (let x = l - 20; x < r + 20; x += 954, i += 1) {
    out.push({ id: `subway_platform_${i}`, sprite: 'subway_platform_1', x: Math.round(x + 957 / 2), y: STATION_FLOOR + 127, w: 957, h: 247, z: -100 + i, r: 0 });
  }
  stationArt(station).forEach((row, n) => {
    if (row.z < FRONT_Z) out.push(artDeco(row, n));
  });
  return out;
}

/** The station's art in front of the avatar (the column's foot), a T_ layer in screen space. */
export function stationFrontDecos(station) {
  return stationArt(station).flatMap((row, n) => (row.z >= FRONT_Z ? [artDeco(row, n, STATION_BOUNDS)] : []));
}

/*
 * The train car, world space, floor at the source's y -59. The car wall
 * (subway_interior_1, 1200 x 700) is placed so its windows fall where the
 * source's window overlays do (inc_transit.js transit_start_subway_windows:
 * left edges x -528, -52, 441, 275 x 161). Riders stand on the dark floor
 * strip in front of the yellow line, 644 px below the tile's top; the bench
 * seats' front edge (548 px down) is a ledge 96 px above that floor
 * (VVyjuuRxDUw t018 and t030: feet ~31 video px below the yellow line, about
 * 41 world px; t018 and t040: a rider standing on a seat, feet on its front
 * edge). Ads run along the light band over the windows, the SOLD poster sits
 * on the wall by the first window, poles stand at the wall seams and reach
 * just below the riders' feet.
 */
export const CAR_FLOOR = SUBWAY_LINE.car.y;
/** Where the floor and the seat edge fall in the wall tile, px below its top. */
export const CAR_TILE_FLOOR = 644;
export const CAR_TILE_SEAT = 548;
export const CAR_TILE_TOP = CAR_FLOOR - CAR_TILE_FLOOR;
export const CAR_SEAT = CAR_TILE_TOP + CAR_TILE_SEAT;
/**
 * The view ends a thin strip below the riders' feet, as in the footage (t018, t030: the
 * location view's bottom edge ~32 video px under the feet, about 42 world px). The camera
 * never looks past the street's bottom bound plus its own ground clearance
 * (movement.js MIN_GROUND_CLEARANCE, street-render.js worldH), so the bound sits that much
 * higher.
 */
export const CAR_VIEW_BELOW = 42;
export const CAR_BOUNDS = Object.freeze({ l: -800, r: 1000, t: CAR_TILE_TOP - 39, b: CAR_FLOOR + CAR_VIEW_BELOW - MIN_GROUND_CLEARANCE });
/**
 * Under that edge (behind the pack, and in a view taller than the car) the wall tile's own
 * floor strip (rows 612-672) carries on down CAR_FLOOR_RUN px, then its bottom edge (rows
 * 672-700) and the black of its last rows.
 */
export const CAR_FLOOR_BAND = Object.freeze([612, 672]);
export const CAR_FLOOR_RUN = 420;
export const CAR_UNDERFLOOR = 0x0d0c08;
export const CAR_TILE_X = Object.freeze([-1665, -465, 735]);
export const CAR_WINDOWS = Object.freeze([-528, -52, 441].map((left) => left + 275 / 2 - 2.5));
export const CAR_WINDOW_BOTTOM = CAR_TILE_TOP + 458;
/** inc_transit.js floor overlays (left edges -713, -216, 369; 642 x 89). */
export const CAR_FLOOR_LIGHTS = Object.freeze([-713, -216, 369].map((left) => left + 642 / 2));
const AD_CYCLE = [1, 2, 3, 4, 5];

export function carArt() {
  const rows = [];
  const [, tw, th] = SUBWAY_ART.subway_interior_1;
  const [b0, b1] = CAR_FLOOR_BAND;
  for (const x of CAR_TILE_X) {
    rows.push(art('subway_interior_1', x + tw / 2, CAR_TILE_TOP + th, -70));
    // The floor carried on below the tile's floor strip, then the tile's own bottom edge.
    rows.push(art('subway_interior_1', x + tw / 2, CAR_TILE_TOP + b1 + CAR_FLOOR_RUN, -69, { h: CAR_FLOOR_RUN, frame: [0, b0, tw, b1 - b0] }));
    rows.push(art('subway_interior_1', x + tw / 2, CAR_TILE_TOP + th + CAR_FLOOR_RUN, -69, { h: th - b1, frame: [0, b1, tw, th - b1] }));
  }
  // Ads: 290-wide panels with small gaps along the band (tile y 210-300).
  const adBottom = CAR_TILE_TOP + 296;
  let i = 0;
  for (let x = CAR_BOUNDS.l - 120; x < CAR_BOUNDS.r + 150; x += 298, i += 1) {
    rows.push(art(`subway_ad_${AD_CYCLE[i % AD_CYCLE.length]}`, x, adBottom, -64));
  }
  rows.push(art('subway_ad_6', CAR_WINDOWS[0] - 225, CAR_TILE_TOP + 456, -63));
  // The static panes; while the train moves the window overlay plays over each (subway-feature setMoving).
  for (const cx of CAR_WINDOWS) rows.push(art('subway_window_static', cx, CAR_WINDOW_BOTTOM, -62));
  return rows;
}

/** The car's middleground: its wall, ads and windows as the street's own art (#482, as stationDecos). */
export function carDecos() {
  return carArt().map((row, n) => artDeco(row, n));
}

/**
 * Poles at the wall seams, a street layer in front of the riders (screen space, like any
 * T_ layer). The layer has no size of its own, so it moves with the street instead of
 * as a parallax canvas (street-render.js): a parallax layer is pinned to the view's
 * bottom when the view is taller than the car, and the poles would float off the floor.
 */
export function carFrontDecos() {
  const { l, t } = CAR_BOUNDS;
  return [CAR_TILE_X[1] + 310, CAR_TILE_X[2] + 310].map((x, i) => ({
    id: `subway_pole_${i}`, sprite: 'subway_interior_pole_1', x: x - l, y: CAR_FLOOR + 12 - t, w: 25, h: 550, z: i, r: 0,
  }));
}

/** Bench seats as one-way ledges at the seat's front edge (an avatar can stand on the benches in VVyjuuRxDUw t018, t040). */
export function carBenches() {
  const spans = [[0, 265], [333, 738], [817, 1200]];
  const out = [];
  for (const x0 of CAR_TILE_X) {
    for (const [a, b] of spans) {
      const x1 = Math.max(CAR_BOUNDS.l, x0 + a + 12);
      const x2 = Math.min(CAR_BOUNDS.r, x0 + b - 12);
      if (x2 - x1 > 40) out.push({ id: `plat_bench_${x0 + a}`, x1, y1: CAR_SEAT, x2, y2: CAR_SEAT, pc_perm: -1 });
    }
  }
  return out;
}

const why = Object.freeze({
  street: 'config_prod.js transit_instances.subway_1 and inc_data_maps_prod.js; no location XML (the stations and the train are not in tinyspeck/glitch-locations).',
  look: 'Station: the 2012 whole-street snaps of all 12 stations (1:1, reference only); car: footage VVyjuuRxDUw and bvOH7rsQ6qo (reference only) at ~1.45 world px per video px; art from subway1.swf (js/subway-art.js).',
});

export const STATION_MUSIC = 'SUBWAY_STATION_HUM';
/**
 * The car's music_file. #303 (G705): its recording (inc_data_sounds.js 195, hum_caboose_4.mp3)
 * is lost, and the subway stand-in theme played under the recovered TRAVELLING_TRAIN loop
 * (subway_loop3, inc_transit.js 287), two tracks at once. ambient-music.json now maps the key to
 * silence, so a ride is the train loop alone; the station's music comes back on arrival.
 */
export const CAR_MUSIC = 'SUBWAY_CAR_HUM';

/**
 * A station's street JSON. Its one door is the stairs up to the surface
 * street, arriving in front of that street's subway entrance.
 */
export function stationStreet(station, { surfaceDoor = null } = {}) {
  const { l, r, t, b } = STATION_BOUNDS;
  const S = STATION_STAIRS_LINE;
  // #385: up the stairs to the entrance, then the platform floor.
  const platforms = [
    { id: 'plat_subway_stairs', x1: S.x1, y1: S.y1, x2: S.x2, y2: S.y2, pc_perm: -1 },
    { id: 'plat_subway_platform', x1: S.x2, y1: STATION_FLOOR, x2: r, y2: STATION_FLOOR, pc_perm: -1 },
  ];
  const [, sw, sh] = SUBWAY_ART.door_asset_stairs;
  const door = {
    id: 'door_subway_stairs',
    x: STATION_X.stairs - l,
    y: STATION_FLOOR - 2 - t,
    w: sw,
    h: sh,
    // #385: the steps' foot is under the line that climbs them; /stuck (street-model.js stuckWay)
    // stands you on the line over it.
    stand: { x: STATION_X.stairs - l, y: stationFloorY(STATION_X.stairs) - t },
    sprite: 'door_asset_stairs',
    src: `${SUBWAY_ART_BASE}${SUBWAY_ART.door_asset_stairs[0]}`,
    key_id: 0,
    requires_level: 0,
    is_locked: false,
    hidden: false,
    connect: {
      tsid: station.connects_to,
      label: station.surfaceLabel,
      street: station.surfaceStreetTsid,
      hub_id: station.surfaceHubId,
      ...(surfaceDoor ? { arrive: { x: surfaceDoor.x, y: surfaceDoor.y } } : {}),
    },
  };
  return {
    source: `reconstruction: ${station.label} (${station.tsid}, not in tinyspeck/glitch-locations); laid out from the 2012 station snaps with subway1.swf art`,
    reconstructed: true,
    tsid: station.streetTsid,
    label: station.label,
    hubId: station.hubId,
    hubName: station.hubName,
    swf_file: 'subway1.swf',
    musicFile: STATION_MUSIC,
    ownLight: true,
    physics: { setting: { y_cam_offset: STATION_Y_CAM_OFFSET }, delta: {} },
    bounds: { ...STATION_BOUNDS },
    platforms,
    barriers: [{ ...STATION_GATE_WALL }],
    layers: [
      { id: 'middleground', name: 'middleground', z: 0, w: r - l, h: b - t, decos: stationDecos(station) },
      { id: 'T_subway_station_front', name: 'middleplus', z: 1, w: 0, h: 0, decos: stationFrontDecos(station) },
    ],
    signposts: [],
    doors: [door],
    stats: { platformCount: platforms.length, layerCount: 2, decoCount: stationDecos(station).length + stationFrontDecos(station).length, signpostCount: 0, doorCount: 1, ladderCount: 0, barrierCount: 1 },
    gradient: { top: '3A3B36', bottom: '55564F' },
    ladders: [],
    subway: { station: station.id },
    why: { ...why, layout: 'Stairs (the walking line climbs them to the entrance, #385), wall crack, the station sign, a column, the Subway Map post at the step-off spot (x 0, y -136 as in transit_disembark_callback), the train nose with the ticket post and the gate box with A Red Button, as the 2012 snaps show.' },
  };
}

/** The train car's street JSON (no doors: you leave at a stop, as in the source prompt). */
export function carStreet() {
  const { l, r, t, b } = CAR_BOUNDS;
  const platforms = [
    { id: 'plat_subway_car', x1: l, y1: CAR_FLOOR, x2: r, y2: CAR_FLOOR, pc_perm: -1 },
    ...carBenches(),
  ];
  return {
    source: `reconstruction: ${CAR_LABEL} (${SUBWAY_LINE.template_tsid}, not in tinyspeck/glitch-locations); from footage with subway1.swf art`,
    reconstructed: true,
    tsid: CAR_TSID,
    label: CAR_LABEL,
    hubId: SUBWAY_LINE.car.hubId,
    hubName: SUBWAY_LINE.car.hubName,
    swf_file: 'subway1.swf',
    musicFile: CAR_MUSIC,
    ownLight: true,
    bounds: { ...CAR_BOUNDS },
    platforms,
    layers: [
      { id: 'middleground', name: 'middleground', z: 0, w: r - l, h: b - t, decos: carDecos() },
      { id: 'T_subway_car_front', name: 'middleplus', z: 1, w: 0, h: 0, decos: carFrontDecos() },
    ],
    signposts: [],
    doors: [],
    stats: { platformCount: platforms.length, layerCount: 2, decoCount: carDecos().length + carFrontDecos().length, signpostCount: 0, doorCount: 0, ladderCount: 0, barrierCount: 0 },
    gradient: { top: '2E2F2A', bottom: '45463F' },
    ladders: [],
    subway: { car: true },
    why: { ...why, layout: 'The car wall with three benches per 1200 px, windows where the source overlays sit, ads over them, poles at the seams; riders arrive at x 0 + rand(-300, 400), y -59 (transit_enter_instance).' },
  };
}

export function subwayIndexEntry(street) {
  return {
    label: street.label,
    file: `assets/streets/${street.tsid}.json`,
    hubId: street.hubId,
    hubName: street.hubName,
    platforms: street.platforms.length,
    decos: street.stats.decoCount,
    reconstructed: true,
  };
}

/**
 * Screen-space arrival on a station from its surface door: the door's connect x, on the walking line
 * there (#385: the surface doors' arrival points are up the stairs, x -519 to -717).
 */
export function stationArrival(connectX) {
  const { l, r, t } = STATION_BOUNDS;
  const x = Math.max(STATION_STAIRS_LINE.x1 + 8, Math.min(r - 120, Number(connectX) || STATION_X.stairs + 90));
  return { x: Math.round(x - l), y: stationFloorY(x) - t };
}

/** Screen-space spots inside the station and the car. */
export const stationScreen = (x, y = stationFloorY(x)) => ({ x: x - STATION_BOUNDS.l, y: y - STATION_BOUNDS.t });
export const carScreen = (x, y = CAR_FLOOR) => ({ x: x - CAR_BOUNDS.l, y: y - CAR_BOUNDS.t });

/** transit_enter_instance: x 0 + randInt(-300, 400), y -59. */
export function boardingSpot(rng = Math.random) {
  const x = SUBWAY_LINE.car.x + Math.floor(-300 + rng() * 701);
  return carScreen(x, CAR_FLOOR);
}

/** transit_disembark_callback: the station's x, y (0, -136). */
export const disembarkSpot = (station) => stationScreen(station.x, station.y);
