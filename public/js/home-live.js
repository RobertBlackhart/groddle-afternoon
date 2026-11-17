/**
 * G944 (M1, M4, M33): what a home's owner changes at home reaches everyone
 * there, live. In Glitch a home street and house were ordinary shared
 * locations (GameServerJS locations/home.js, players/inc_houses.js): what the
 * owner mined, picked, planted, cultivated, decorated or put in a cabinet was
 * in the one location every player there saw (inc_homes.js 297, 1750, 1838,
 * 2070 apiGeometryUpdated to the whole location; inc_cultivation.js 113-141).
 *
 * The remake's visitors read the owner's home from the site, which reads the
 * owner's stored save (groddle-afternoon-site src/HomeYard.php,
 * src/Neighbours.php homesSlice, src/HomeStreet.php boxes). So one path
 * carries every change, whatever the object: each save the owner's game
 * writes is cut into the parts each of those views reads, and a part that
 * changed is written to the site at once and named to the realtime server
 * (home_refresh, homes_street.go), which tells everyone at that home to read
 * it again. Nothing here knows about rocks, trees or furniture one by one.
 *
 * Kinds (what visitors read again):
 * - yard: the home street's world slot as HomeYard reads it (rocks, resource
 *   nodes, Patches and their trees, animals, sticks, yard machines). An
 *   animal's x is left out: it walks every frame, the same seeded walk on
 *   every page (js/yard-wander.js).
 * - home: the house and street look as Neighbours reads it (systems.home
 *   style, the homes feature's decor, cultivations, back yard and styles, the
 *   Tower's look and floors; upper house floors are the owner's own, G153).
 *   Private counts (furniture storage) and what a
 *   cabinet holds are left out; so are the owner's own tallies (houseVisits,
 *   rockImgDay, magicRock).
 * - boxes: what each placed cabinet holds (contents), for an open
 *   key-holder's window (M33).
 *
 * Pure: no DOM, no engine. features/home-live-feature.js runs it.
 */

export const HOME_LIVE_STREET = 'RH_HOME_EXT';
export const HOME_LIVE_KINDS = Object.freeze(['yard', 'home', 'boxes']);
/** Coalesce: a run of acts goes out as one refresh (the server allows 6, then one per 2 s: homes_street.go). */
export const HOME_LIVE_WAIT_MS = 2500;

const TOWER_LOOK = ['built', 'floors', 'expanding', 'style', 'config', 'facingRight', 'name', 'floorLabels'];

const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

/** A JSON print with object keys in order, so the same state always prints the same. */
export function stablePrint(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stablePrint).join(',')}]`;
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stablePrint(value[k])}`).join(',')}}`;
}

function decorLook(decor) {
  const d = obj(decor);
  if (!d) return null;
  const { storage, ...rest } = d;
  if (Array.isArray(d.placed)) rest.placed = d.placed.map((row) => {
    if (!obj(row)) return row;
    const { contents, ...look } = row;
    return look;
  });
  return rest;
}

function decorContents(decor) {
  const placed = Array.isArray(obj(decor)?.placed) ? decor.placed : [];
  return placed.filter((row) => Array.isArray(row?.contents)).map((row) => [row.id, row.contents]);
}

/** The parts of a save visitors read, by kind (null: this save has no home to show). */
export function homeLiveParts(save) {
  const systems = obj(save?.systems);
  if (systems?.home?.owned !== true) return null;
  const features = obj(systems.features) || {};
  const homes = obj(features.homes) || {};
  const street = obj(save?.world?.streets?.[HOME_LIVE_STREET]) || {};
  const sf = obj(street.features) || {};
  const herd = obj(sf['animal-husbandry']) || {};
  const tower = obj(features['home-tower']) || {};
  const towerDecor = Array.isArray(homes.towerDecor) ? homes.towerDecor : [];
  return {
    yard: {
      rocks: street.rocks || [],
      nodes: obj(sf['resource-nodes'])?.nodes || {},
      plots: obj(sf.patches)?.plots || {},
      animals: (Array.isArray(herd.animals) ? herd.animals : []).map((row) => {
        if (!obj(row)) return row;
        const { x, y, ...rest } = row;
        return rest;
      }),
      sticks: herd.sticks || [],
      machines: herd.machines || [],
    },
    home: {
      style: systems.home.style || '',
      decor: decorLook(homes.decor),
      cult: homes.cult || null,
      backYard: homes.backYard || null,
      streetStyle: homes.streetStyle || '',
      yardStyle: homes.yardStyle || '',
      towerDecor: towerDecor.map(decorLook),
      tower: tower.built === true ? Object.fromEntries(TOWER_LOOK.filter((k) => k in tower).map((k) => [k, tower[k]])) : null,
    },
    boxes: [decorContents(homes.decor), ...towerDecor.map(decorContents)],
  };
}

/** One print per kind ({} without a home). */
export function homeLivePrints(save) {
  const parts = homeLiveParts(save);
  if (!parts) return {};
  return Object.fromEntries(HOME_LIVE_KINDS.map((k) => [k, stablePrint(parts[k])]));
}

/** The kinds whose print differs (a kind never printed before counts as unchanged: nothing was shown from it yet). */
export function changedHomeKinds(before, after) {
  if (!before || !after) return [];
  return HOME_LIVE_KINDS.filter((k) => typeof before[k] === 'string' && typeof after[k] === 'string' && before[k] !== after[k]);
}

/**
 * What goes to the server for a set of changed kinds: "home" makes a visitor read the yard
 * too (features/neighbours-mp-feature.js), so it stands for both and one frame is spared.
 */
export function homeRefreshFrames(kinds) {
  const set = new Set(kinds);
  if (set.has('home')) set.delete('yard');
  return HOME_LIVE_KINDS.filter((k) => set.has(k));
}

/**
 * A visitor's home view (groddle/v1/homes/<id>) as the scene is built from it: without the
 * gardens' plots (updated in place, a garden is not rebuilt for a crop) or a cultivation's wear
 * (the site's count, never drawn). A different key means the scene is built again.
 */
export function visitSceneKey(view) {
  const homes = obj(view?.homes) || {};
  const strip = (st) => {
    const s = obj(st);
    if (!s) return null;
    const { gardens, ...rest } = s;
    rest.items = (Array.isArray(s.items) ? s.items : []).map((it) => {
      if (!obj(it)) return it;
      const { wear, ...look } = it;
      return look;
    });
    return rest;
  };
  return stablePrint({
    home: view?.home || null,
    homes: { ...homes, cult: strip(homes.cult), backYard: strip(homes.backYard) },
    butler: view?.butler || null,
    gnomes: view?.gnomes || null,
    key: view?.key === true,
  });
}

/** The plots of a garden in a home view: yard 'street' (cult) or 'back' (backYard), by its id. */
export function visitGardenPlots(view, yard, id) {
  const homes = obj(view?.homes) || {};
  const st = yard === 'back' ? obj(homes.backYard) : obj(homes.cult);
  return obj(obj(st?.gardens)?.[id]?.plots);
}
