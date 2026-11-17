/**
 * The vendor finder (G774, report #351, Austin 2026-11-15: "build next, the vendor finder"): a
 * click on the currants in the top bar opens a small panel of the vendors near you, one row for
 * each kind of vendor by what it sells, with the nearest street that has one; a row sets that
 * street as your destination, as the favor panel's Giants find their closest Shrine (#258, game.js
 * findNearestShrine) through the Map's route (map-routes.js findRoute: of several streets an open
 * one wins, G780).
 *
 * The remake's own: Glitch's currants opened nothing (glitch-client YouDisplayManager.as 131-132).
 * Where vendors stand is Glitch's: a Street Spirit sells its street's store (production map data,
 * assets/streets/index.json `store`, the map's store icons; vendor.js selectVendorProfile) on
 * every street whose archived objects hold one (street-ecology.json counts.street_spirit), and the
 * vendor NPCs stand where the archive put them (street-ecology.json `vendors`, vendor-npcs.js:
 * the Tool Vendor, the scarecrow, Uncle Friendly, Helga, the Meal Vendor, the Sno Cone machine).
 * Their names are catalog_stores.js's (store-catalog.js).
 *
 * Pure; the panel is js/ui/topbar.js installCurrants, the game side features/vendor-finder-feature.js.
 */
import { STORE_CATALOG } from './store-catalog.js?v=74b56af3';
import { VENDOR_NPCS } from './vendor-npcs.js?v=90b0c123';

/** The panel's words (the remake's own). */
export const VENDOR_FINDER_TEXT = Object.freeze({
  title: 'Vendors near you',
  chipSub: 'Click to find the vendors near you',
  here: 'Here',
  /** No road reaches one from here (the Map's own answer says why when the row is chosen). */
  noWay: 'No road there yet',
  rowTip: (label) => `Set the nearest ${label} as your destination`,
  hops: (n) => `${n} ${n === 1 ? 'street' : 'streets'}`,
  /** One of a kind ("Helga's Liquor Store is in ..."), else the nearest of several. */
  found: (kind, street) => `${kind.streets.length === 1 ? kind.label : `The nearest ${kind.label}`} is in ${street}. It is set as your destination.`,
  set: (kind) => `Directions to the nearest ${kind.label} are set.`,
  /** The shrine finder's words for "on this street" (game.js findNearestShrine). */
  hereLine: (kind) => `${kind.streets.length === 1 ? kind.label : `The nearest ${kind.label}`} is right here in your location!`,
  none: (kind) => `Can’t find a way to a ${kind.label} from here.`,
});

const G = (t) => String(t || '').replace(/^L/, 'G');

/** A street whose vendor the game picks itself (vendor.js selectVendorProfile: Hechey Track stays the groceries stop). */
export const STORE_OVERRIDES = Object.freeze({ GLI2V0UN7RD1T2J: 'groceries' });
export const sameStreet = (a, b) => Boolean(a) && Boolean(b) && G(a) === G(b);

/**
 * Every kind of vendor and the streets it stands on, in catalog_stores.js order; kinds that
 * stand nowhere are left out. `ecology`: street-ecology.json; `streetIndex`: assets/streets/index.json.
 * @returns {{ key: string, label: string, streets: string[] }[]}
 */
export function vendorKinds(ecology, streetIndex, stores = STORE_CATALOG) {
  const byKey = new Map(stores.map((s) => [s.key, new Set()]));
  const byStoreId = new Map(stores.map((s) => [s.storeId, s.key]));
  const index = streetIndex?.streets || {};
  for (const [tsid, row] of Object.entries(ecology?.streets || {})) {
    if (!(Number(row?.counts?.street_spirit) > 0)) continue;
    const key = STORE_OVERRIDES[G(tsid)] || (index[G(tsid)] || index[tsid])?.store;
    if (byKey.has(key)) byKey.get(key).add(G(tsid));
  }
  for (const [tsid, row] of Object.entries(ecology?.vendors || {})) {
    for (const [cls, n] of Object.entries(row || {})) {
      const key = byStoreId.get(VENDOR_NPCS[cls]?.storeId);
      if (key && Number(n) > 0) byKey.get(key).add(G(tsid));
    }
  }
  return stores
    .map((s) => ({ key: s.key, label: s.label, streets: [...byKey.get(s.key)].sort() }))
    .filter((k) => k.streets.length);
}

/**
 * The panel's rows: for each kind, where its nearest one is from `here` (`find(streets)` gives
 * { destination, hops } by road, { unknown } while that can't be told (the roads loading, at
 * home), or null when no road gets there).
 * Nearest first (one on this street at the top), the kinds with no answer last, ties in catalog order.
 * @returns {{ key, label, here: boolean, destination: string, hops: number|null }[]}
 */
export function vendorFinderRows(kinds, { here = '', find = () => null } = {}) {
  const rows = (kinds || []).map((k, order) => {
    if (k.streets.some((t) => sameStreet(t, here))) return { key: k.key, label: k.label, here: true, destination: G(here), hops: 0, order };
    const r = find(k.streets);
    const hops = Number.isFinite(r?.hops) ? r.hops : null;
    return { key: k.key, label: k.label, here: false, destination: hops == null ? '' : String(r.destination || ''), hops, ...(r?.unknown ? { unknown: true } : {}), order };
  });
  const rank = (r) => (r.hops == null ? Infinity : r.hops);
  return rows.sort((a, b) => rank(a) - rank(b) || a.order - b.order).map(({ order, ...r }) => r);
}

/** What a row says on its right: Here, or the street and how far. */
export function vendorRowWhere(row, label = (t) => t) {
  if (row.here) return VENDOR_FINDER_TEXT.here;
  if (row.unknown) return '';
  if (row.hops == null || !row.destination) return VENDOR_FINDER_TEXT.noWay;
  return `${label(row.destination)} · ${VENDOR_FINDER_TEXT.hops(row.hops)}`;
}
