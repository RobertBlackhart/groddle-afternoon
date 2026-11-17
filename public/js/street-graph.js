/**
 * The street graph (root R11, register G969, Austin 2026-11-17): the one place that knows which
 * street leads to which, with the roads closed by street projects taken out.
 *
 * Why: the remake replays Ur's build-out, so hundreds of streets stand behind a road still under
 * construction (js/street-jobs.js roadClosure). Glitch hid those streets' signpost arms and locked
 * their doors (locations/inc_jobs.js jobs_modify_connections 578-603, then
 * apiReloadDataForGlobalPathFinding in jobs_unlock), so its own path finding had no road there at
 * all. The remake used to keep one closed-street list and leave each walker to apply it: three
 * took it as an optional argument and one ignored it, and each feature learned the rule when a
 * player was stranded or sent the wrong way (#145 haunts behind projects, #162 the way home from
 * the Vortex of Random, #339, #355 a shrine route ending on a closed street, parcels to closed
 * streets, a route drawn through a crossed-out arm). Here the closures are part of the graph: a
 * street graph is built with its closures (`closed`, read when a walk starts), and every walk below
 * (routes, reach, distances) goes round them without being asked.
 *
 * - `roadsFor(engine)`: the game's graph (assets/content/signpost-graph.json, signposts and doors,
 *   fetched once for every feature) with that engine's closures (street-jobs-feature `closedRoads`).
 * - `streetGraph(source, { closed })`: the same over any source (the JSON, a toy adjacency map in a
 *   test, or another street graph with other closures).
 * - `worldRoads()`: the game's graph with no closures, only for the geography walks below, the Map's
 *   rooms list and the closures' owner (street-jobs-feature gives it its own closures).
 * - Walks that go round closed roads: findRoute, reachableStreets, routeDistances, openRoads.
 * - Walks that count every road, built or not, each for a reason of its own (the source test,
 *   tests/street-graph-closures.test.js, lists who may call them): fewestClosures (which projects
 *   to build: the way home, ticket 50 and #162, and the On hold note), closedOnTheWay (the Map's "No
 *   road there yet"), nearestOpenStreet (report 212: the open street nearest a pick), and the
 *   world's geography that must not move as you build: hopsOverEveryRoad (the solo distance curve,
 *   #425) and streetsLeadingTo (G887/G888: which streets are dead ends).
 *
 * Pure apart from the one fetch in loadStreetGraph: no DOM, no Pixi.
 */

/** The signpost graph (tools/build-signpost-graph.mjs); js/data-urls.js keys the URL. */
export const STREET_GRAPH_URL = 'assets/content/signpost-graph.json';

// Registered symbols, so two copies of this module (a page and a test importing it by different keys) agree.
const BASE = Symbol.for('groddle.streetGraph.roads');
const CLOSED = Symbol.for('groddle.streetGraph.closures');

/** L/G (and LLI/GLI, LIF/GIF) aliases of a TSID. */
export function tsidAliases(tsid) {
  const t = String(tsid || '');
  if (!t) return [];
  const out = new Set([t]);
  if (t.startsWith('L')) out.add(`G${t.slice(1)}`);
  if (t.startsWith('G')) out.add(`L${t.slice(1)}`);
  return [...out];
}

export const sameStreet = (a, b) => Boolean(a && b) && String(a).slice(1) === String(b).slice(1);

const gKey = (t) => {
  const s = String(t || '');
  return s.startsWith('L') ? `G${s.slice(1)}` : s;
};

/** Whether `x` is a street graph (streetGraph, roadsFor). */
export function isStreetGraph(x) {
  return Boolean(x && x[BASE]);
}

const isJson = (x) => Boolean(x && typeof x === 'object' && x.streets && typeof x.streets === 'object' && !Array.isArray(x.streets));
const bases = new WeakMap();
const EMPTY = Object.freeze({ roads: Object.freeze({}), locked: new Set(), rooms: [] });

/** The roads under a street graph, signpost-graph.json or an adjacency map (an adjacency map has no closed roads). */
function baseFor(g) {
  if (!g || typeof g !== 'object') return EMPTY;
  if (g[BASE]) return g[BASE];
  let base = bases.get(g);
  if (!base) {
    if (isJson(g)) {
      const built = routeGraph(g);
      base = { roads: built.graph, locked: built.locked, rooms: doorRooms(g) };
    } else base = { roads: g, locked: new Set(), rooms: [] };
    bases.set(g, base);
  }
  return base;
}
const roadsOf = (g) => baseFor(g).roads;

/** Whether `x` is a street graph or signpost-graph.json as fetched (not an adjacency map, not nothing). */
export const isGraphSource = (x) => isStreetGraph(x) || isJson(x);

/** The graph key for a TSID (the street-index key), or null. Takes a street graph or an adjacency map. */
export function graphKey(graph, tsid) {
  if (!graph || !tsid) return null;
  const roads = roadsOf(graph);
  for (const alias of tsidAliases(tsid)) if (Object.prototype.hasOwnProperty.call(roads, alias)) return alias;
  return null;
}

/**
 * Signposts and doors in one adjacency map, plus the locked door edges ("from>to" keys) that a
 * route avoids while it can (G192). Was map-routes.js routeGraph.
 * @param {{ streets?: Record<string, string[]>, doors?: Record<string, string[]>, doorKeys?: Record<string, number> }} json
 * @returns {{ graph: Record<string, string[]>, doors: Record<string, string[]>, locked: Set<string> }}
 */
export function routeGraph(json = {}) {
  const graph = {};
  for (const [k, v] of Object.entries(json?.streets || {})) graph[k] = [...(v || [])];
  const doors = {};
  for (const [k, v] of Object.entries(json?.doors || {})) {
    doors[k] = [...(v || [])];
    const out = new Set(graph[k] || []);
    for (const to of v || []) out.add(to);
    graph[k] = [...out];
    for (const to of v || []) graph[to] ||= [];
  }
  return { graph, doors, locked: new Set(Object.keys(json?.doorKeys || {})) };
}

/**
 * The rooms behind doors (G198): streets no hub map draws (signpost-graph `offMap`) that a door
 * leads into, so the Map can offer them as destinations. The client offered destinations only from
 * a hub map's street menu (InteractionMenuController.startLocationMenu 133-160 "Set as
 * Destination") and its search (WorldModel.searchLocations 349-373 over the hub maps' streets,
 * Hub.as 51-53), plus GetInfoDialog's "nearest ... Set as destination" (1088-1104); a room that is
 * only behind a door was reached by a quest's route or not at all. Rooms behind rooms (Jethimadh
 * Tower's rooms) hang off the drawn street their first door is on.
 * @param {{ doors?: Record<string, string[]>, doorKeys?: Record<string, number>, offMap?: string[] }} json
 * @returns {{ room: string, street: string, via: string, locked: boolean }[]}
 */
export function doorRooms(json = {}) {
  const off = new Set(json?.offMap || []);
  const doors = json?.doors || {};
  const keyed = json?.doorKeys || {};
  const out = new Map();
  const queue = [];
  for (const [from, list] of Object.entries(doors)) {
    if (off.has(from)) continue;
    for (const to of list || []) {
      if (!off.has(to) || out.has(to)) continue;
      out.set(to, { room: to, street: from, via: from, locked: Boolean(keyed[`${from}>${to}`]) });
      queue.push(to);
    }
  }
  for (let i = 0; i < queue.length; i++) {
    const at = queue[i];
    for (const to of doors[at] || []) {
      if (!off.has(to) || out.has(to)) continue;
      out.set(to, { room: to, street: out.get(at).street, via: at, locked: Boolean(keyed[`${at}>${to}`]) });
      queue.push(to);
    }
  }
  return [...out.values()];
}

/**
 * A street graph: `source`'s roads with `closed` taken out. `closed` lists the streets whose road
 * is closed (street projects), as TSIDs in either form, or is a function that answers that list
 * when a walk starts (so the graph follows the projects as they are built); null is none.
 * `locked` overrides the source's locked door edges (a toy map in a test).
 * @param {object} source  signpost-graph.json ({ streets, doors, doorKeys, offMap }), an adjacency map, or a street graph
 * @param {{ closed?: Iterable<string>|(() => Iterable<string>|null)|null, locked?: Set<string>|null }} [opts]
 */
export function streetGraph(source, { closed = null, locked = undefined } = {}) {
  let base = baseFor(source);
  // An adjacency map is copied, so a later change to it never changes the graph.
  if (!source?.[BASE] && !isJson(source)) base = { ...base, roads: Object.fromEntries(Object.entries(base.roads).map(([k, v]) => [k, Array.isArray(v) ? [...v] : []])) };
  if (locked !== undefined) base = { ...base, locked: locked instanceof Set ? locked : new Set(locked || []) };
  return Object.freeze({
    [BASE]: base,
    [CLOSED]: closed,
    /** Locked door edges ("from>to"): a route takes one only when it must (G192). */
    locked: base.locked,
    /** Rooms behind doors that no hub map draws (doorRooms, G198). */
    rooms: base.rooms,
  });
}

/** The streets closed right now, every alias, as a Set. */
export function closedNow(graph) {
  const src = graph?.[CLOSED];
  const list = typeof src === 'function' ? src() : src;
  const out = new Set();
  for (const t of list || []) for (const a of tsidAliases(t)) out.add(a);
  return out;
}

/** Whether a street's road is closed now. */
export function isClosed(graph, tsid) {
  const shut = closedNow(graph);
  return tsidAliases(tsid).some((a) => shut.has(a));
}

/** Whether the graph knows the street. */
export const hasStreet = (graph, tsid) => Boolean(graphKey(graph, tsid));

/** Whether a signpost or door leads from `a` to `b`, built or not (a lookup, not a walk). */
export function hasRoad(graph, a, b) {
  const ka = graphKey(graph, a);
  const kb = graphKey(graph, b) || b;
  return Boolean(ka && (roadsOf(graph)[ka] || []).includes(kb));
}

/** The roads out of a street that are open now (the streets they lead to), [] when it is unknown. */
export function openRoads(graph, tsid) {
  const at = graphKey(graph, tsid);
  if (!at) return [];
  const shut = closedNow(graph);
  return (roadsOf(graph)[at] || []).filter((to) => !shut.has(to));
}

/** Walkers take closures from the graph, never beside it. */
function noLooseClosures(opts, who) {
  for (const k of ['blocked', 'shut', 'closed']) {
    if (opts && opts[k] != null) throw new TypeError(`${who}: closed roads live in the street graph (streetGraph({ closed })), not in a '${k}' option`);
  }
}

/* ------------------------------------------------------------------ routes */

/** Whether the route back from `state` already passes `street`. */
function onChain(seen, state, street) {
  for (let at = state; at != null; at = seen.get(at).back) if (seen.get(at).street === street) return true;
  return false;
}

/**
 * Breadth first over (street, the street you came in from) on the one-way streets and over plain
 * streets elsewhere, so a one-way street can be passed one way and still be a dead end the other.
 */
function bfs(roads, start, targets, closed, locked, rides = null, { oneWay = null, startCut = null } = {}) {
  // A state is the street key, or "street<from" on a street with one-way roads.
  const stateOf = (street, from) => (oneWay?.[street] ? `${street}<${from}` : street);
  const first = stateOf(start, '');
  const seen = new Map([[first, { street: start, from: '', back: null }]]);
  const queue = [first];
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const { street, from } = seen.get(cur);
    const cut = i === 0 ? startCut : oneWay?.[street]?.cut?.[from] ? new Set(oneWay[street].cut[from]) : null;
    const here = roads[street] || [];
    const on = rides?.[street] ? [...here, ...rides[street]] : here;
    for (const next of on) {
      if (cut && cut.has(next)) continue;
      if (locked && locked.has(`${street}>${next}`)) continue;
      if (closed.has(next)) continue;
      // A ride comes up the station stairs, not off a signpost: an arrival the file does not know.
      const came = here.includes(next) ? street : '';
      const state = stateOf(next, came);
      if (seen.has(state)) continue;
      // A one-way street is a state per arrival: never twice on one route (routeStep finds its place by street).
      if (oneWay?.[next] && onChain(seen, cur, next)) continue;
      seen.set(state, { street: next, from: came, back: cur });
      if (targets.has(next)) {
        const path = [];
        for (let at = state; at != null; at = seen.get(at).back) path.unshift(seen.get(at).street);
        return path;
      }
      queue.push(state);
    }
  }
  return null;
}

function routeOver(graph, from, to, closed, { locked = undefined, rides = null, oneWay = null, startCut = null } = {}) {
  const roads = roadsOf(graph);
  const start = graphKey(graph, from);
  if (!start) return null;
  const targets = new Set((Array.isArray(to) ? to : [to]).map((t) => graphKey(graph, t)).filter(Boolean));
  if (!targets.size) return null;
  if (targets.has(start)) return [start];
  for (const t of [...targets]) if (closed.has(t)) targets.delete(t);
  if (!targets.size) return null;
  const doorKeys = locked !== undefined ? locked : baseFor(graph).locked;
  const keyed = doorKeys && doorKeys.size ? doorKeys : null;
  const ways = { oneWay: oneWay && Object.keys(oneWay).length ? oneWay : null, startCut: startCut ? new Set(startCut) : null };
  const noKey = (extra) => bfs(roads, start, targets, closed, keyed, extra, ways);
  const anyDoor = (extra) => (keyed ? bfs(roads, start, targets, closed, null, extra, ways) : null);
  // The subway only when no road gets there (Austin, 2026-11-03: the way to Xalanga rides to Onto
  // Parada), and a locked door only when neither does: the subway needs no key, and the rare keys
  // would otherwise send a fresh player's road to Xalanga through Level 2 West's Key 7 door again.
  return noKey(null) || (rides ? noKey(rides) : null) || anyDoor(null) || (rides ? anyDoor(rides) : null);
}

/**
 * Shortest route over visible signposts and doors (apiFindGlobalPathX, or
 * apiFindShortestGlobalPath when `to` lists several streets). Returns the street keys from `from`
 * to the destination inclusive, [from] when you are already there, or null. It goes round the
 * graph's closed streets and never ends on one: with its arms hidden, apiFindShortestGlobalPath
 * could not reach a closed street at all (#355), and the Map marked it not_a_destination
 * (location.js 2915-2935). Of several destinations (the nearest shrine, the nearest vendor) the
 * nearest open one wins; only closed ones is no route (Austin 2026-11-15: a route to Middle Arbor
 * ran through its crossed signpost arm). A locked door (graph.locked, or `locked`) is taken only
 * when nothing else gets there (G192); `rides` (the subway) only when no road does. `oneWay` and
 * `startCut` (map-routes.js oneWayRoads, startCut) keep a route off the roads a one-way street does
 * not lead to from where you came in, or from where you stand (player report 82).
 * @param {object} graph  a street graph (an adjacency map is one with no closed roads)
 * @param {string} from
 * @param {string|string[]} to
 * @param {{ locked?: Set<string>|null, rides?: Record<string, string[]>|null, oneWay?: Record<string, object>|null, startCut?: Iterable<string>|null }} [opts]
 */
export function findRoute(graph, from, to, opts = {}) {
  noLooseClosures(opts, 'findRoute');
  return routeOver(graph, from, to, closedNow(graph), opts);
}

/**
 * The Map's "No road there yet" (Austin 2026-11-15): when findRoute finds nothing, whether the
 * roads would get there once built. { closed: true } when every destination is itself under
 * construction; { through: [street keys] } with the closed streets on the shortest way there when
 * only closed roads stand in the way; null when no road leads there built or not.
 */
export function closedOnTheWay(graph, from, to, opts = {}) {
  noLooseClosures(opts, 'closedOnTheWay');
  if (!graphKey(graph, from)) return null;
  const shut = closedNow(graph);
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  const open = list.filter((t) => !shut.has(graphKey(graph, t) || t));
  if (!open.length) return list.length ? { closed: true } : null;
  const any = routeOver(graph, from, open, new Set(), opts);
  if (!any) return null;
  const through = any.slice(1).filter((t) => shut.has(t));
  return through.length ? { through } : null;
}

/* ------------------------------------------------------------------ reach */

/**
 * Every street you can walk, ride or be set down on with the roads as they stand: from the
 * starts (the starter street, where you are, the streets already open to you) over the graph's
 * open roads and the ways no closure holds (`free`: the subway, the Collision-triggered
 * Teleporters), as the ticket 50 test does. `keyed: false` leaves out locked doors (a new player
 * holds no keys, G401). A G-keyed Set.
 * @param {object} graph
 * @param {{ starts?: string[], free?: Record<string, string[]>, keyed?: boolean }} [opts]
 */
export function reachableStreets(graph, { starts = [], free = {}, keyed = true, ...rest } = {}) {
  noLooseClosures(rest, 'reachableStreets');
  const roads = roadsOf(graph);
  const shut = closedNow(graph);
  const doorKeys = keyed ? null : baseFor(graph).locked;
  const seen = new Set();
  const queue = [];
  for (const s of starts.map(gKey)) if (s && !seen.has(s)) (seen.add(s), queue.push(s));
  for (let i = 0; i < queue.length; i += 1) {
    const at = queue[i];
    for (const to of roads[at] || []) {
      if (shut.has(to) || seen.has(to)) continue;
      if (doorKeys && doorKeys.has(`${at}>${to}`)) continue;
      seen.add(to);
      queue.push(to);
    }
    for (const to of free[at] || []) if (!seen.has(to)) (seen.add(to), queue.push(to));
  }
  return seen;
}

/**
 * Roads walked from `from` to every street it reaches by open roads: a Map of street key to the
 * number of roads (0 for `from`). Empty when the graph does not know `from`.
 */
export function routeDistances(graph, from) {
  const roads = roadsOf(graph);
  const start = graphKey(graph, from);
  const out = new Map();
  if (!start) return out;
  const shut = closedNow(graph);
  out.set(start, 0);
  const queue = [start];
  for (let i = 0; i < queue.length; i += 1) {
    const at = queue[i];
    for (const next of roads[at] || []) {
      if (out.has(next) || shut.has(next)) continue;
      out.set(next, out.get(at) + 1);
      queue.push(next);
    }
  }
  return out;
}

/* ------------------------------------------- walks that count every road */

/**
 * The street projects to build, in order, on the way from the starts to any of `targets`: the
 * fewest of them (0-1 search: entering a closed street costs one, anything else nothing). With
 * `boards` (street -> the streets its road opens from, street-jobs.json `connecting`) a closed
 * street can only be entered from one of its project board streets, since that is where it is
 * built: Hazy Gate 3's board stands on Ramble Way 4, inside Xalanga, so Xalanga's way in is another
 * one. [{ street, board }] (board: the street walked in from), the first one buildable now; [] when
 * an open way already gets there or nothing does. Used by the way home (ticket 50, #162) and the
 * On hold note (js/quest-reach.js).
 */
export function fewestClosures(graph, { starts = [], targets = [], free = {}, boards = null } = {}) {
  const roads = roadsOf(graph);
  const closed = closedNow(graph);
  const goal = new Set(targets.map(gKey));
  const cost = new Map();
  const prev = new Map();
  const deque = [];
  for (const s of starts.map(gKey)) if (s && !cost.has(s)) (cost.set(s, 0), prev.set(s, null), deque.push(s));
  let end = null;
  while (deque.length) {
    const at = deque.shift();
    if (goal.has(at)) {
      end = at;
      break;
    }
    const c = cost.get(at);
    const step = (to, w) => {
      if (cost.has(to) && cost.get(to) <= c + w) return;
      cost.set(to, c + w);
      prev.set(to, at);
      if (w) deque.push(to);
      else deque.unshift(to);
    };
    for (const to of roads[at] || []) {
      if (!closed.has(to)) step(to, 0);
      else if (!boards || boards[to]?.includes(at)) step(to, 1);
    }
    for (const to of free[at] || []) step(to, 0);
  }
  if (!end) return [];
  const path = [];
  for (let at = end; at; at = prev.get(at)) if (closed.has(at)) path.push({ street: at, board: prev.get(at) || '' });
  return path.reverse();
}

/**
 * Live report 212 (2026-11-12): the street of `reach` (the open world) nearest `from` by roads,
 * counting every road whether it is built yet or not (plus `free` ways), so a pick that lands past
 * a closed road moves to the closest street still joined to the rest of Ur. `from` itself when it
 * is in reach; null when nothing in reach connects to it. `skip(tsid)` passes over streets that
 * will not do as a landing (the walk goes on through them).
 */
export function nearestOpenStreet(graph, { reach, from = '', free = {}, skip = null } = {}) {
  const roads = roadsOf(graph);
  const start = gKey(from);
  if (!start || !reach || typeof reach.has !== 'function') return null;
  const seen = new Set([start]);
  const queue = [start];
  for (let i = 0; i < queue.length; i += 1) {
    const at = queue[i];
    if (reach.has(at) && !skip?.(at)) return at;
    for (const to of [...(roads[at] || []), ...(free[at] || [])]) if (!seen.has(to)) (seen.add(to), queue.push(to));
  }
  return null;
}

/**
 * Report #425 (G882): roads walked from `start` to every street over every signpost and door, each
 * in the direction it goes, built or not: the solo distance curve measures the world's geography,
 * so it never moves as you build. { G tsid: hops }.
 */
export function hopsOverEveryRoad(graph, start) {
  const out = {};
  const home = gKey(start);
  if (!home || !graph || typeof graph !== 'object') return out;
  const next = new Map();
  for (const [from, tos] of Object.entries(roadsOf(graph))) {
    const k = gKey(from);
    if (!next.has(k)) next.set(k, []);
    for (const to of Array.isArray(tos) ? tos : []) next.get(k).push(gKey(to));
  }
  out[home] = 0;
  const queue = [home];
  for (let i = 0; i < queue.length; i += 1) {
    const at = queue[i];
    for (const to of next.get(at) || []) {
      if (to in out) continue;
      out[to] = out[at] + 1;
      queue.push(to);
    }
  }
  return out;
}

/**
 * G887/G888: the streets whose roads lead to `start` (Hechey Track), over every signpost and door
 * plus `extra` ({ from, to } rows: the ways out a feature runs itself), built or not: a road still
 * being built is still Ur's, so a street behind a project is no dead end (the way home opens it,
 * ticket 50). A G-keyed Set.
 */
export function streetsLeadingTo(graph, start, extra = []) {
  const into = new Map();
  const link = (from, to) => {
    const k = gKey(to);
    if (!into.has(k)) into.set(k, []);
    into.get(k).push(gKey(from));
  };
  for (const [from, tos] of Object.entries(roadsOf(graph))) for (const to of tos || []) link(from, to);
  for (const r of extra || []) if (r?.from && r?.to) link(r.from, r.to);
  const home = gKey(start);
  const seen = new Set([home]);
  const queue = [home];
  for (let i = 0; i < queue.length; i += 1) {
    for (const from of into.get(queue[i]) || []) {
      if (seen.has(from)) continue;
      seen.add(from);
      queue.push(from);
    }
  }
  return seen;
}

/* ------------------------------------------------------------------ the game's graph */

let loaded = null;
let loading = null;
const views = new WeakMap();

/**
 * Fetch the game's graph once for every feature. Resolves to true when it is in, false when the
 * fetch failed (tried again on the next call).
 */
export function loadStreetGraph() {
  if (loaded) return Promise.resolve(true);
  if (typeof fetch !== 'function') return Promise.resolve(false);
  loading ||= fetch(STREET_GRAPH_URL)
    .then((r) => r.json())
    .then((json) => {
      loaded = streetGraph(json);
      return true;
    })
    .catch(() => {
      loading = null;
      return false;
    });
  return loading;
}

/** Whether the game's graph is in. */
export const streetGraphLoaded = () => Boolean(loaded);

/**
 * The game's street graph with `engine`'s closures (engine.query('closedRoads', engine): the
 * street projects as they stand, street-jobs-feature), or null until loadStreetGraph is done (or
 * without an engine).
 */
export function roadsFor(engine) {
  if (!loaded || !engine || typeof engine !== 'object') return null;
  let view = views.get(engine);
  if (!view || view[BASE] !== loaded[BASE]) {
    view = streetGraph(loaded, { closed: () => engine.query?.('closedRoads', engine) });
    views.set(engine, view);
  }
  return view;
}

/**
 * The game's graph with no closures: every road, built or not, or null until it loads. Only for
 * the walks that measure the world's geography (hopsOverEveryRoad, streetsLeadingTo), the rooms
 * list, and the closures' owner, which gives it its closures (street-jobs-feature: streetGraph(
 * worldRoads(), { closed })). The source test lists who may ask.
 */
export const worldRoads = () => loaded;

/** loadStreetGraph, then roadsFor(engine) (null when the graph could not be fetched). */
export async function loadRoadsFor(engine) {
  await loadStreetGraph();
  return roadsFor(engine);
}

/** Tests: use `source` (signpost-graph.json or an adjacency map) as the game's graph; null forgets it. */
export function _useStreetGraph(source) {
  loaded = source ? streetGraph(source) : null;
  loading = null;
}
