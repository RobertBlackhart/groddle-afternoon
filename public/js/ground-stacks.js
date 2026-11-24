/**
 * A place's ground stacks, read one way (root issue R50; G1224, report #655).
 *
 * Two stores hold what lies on the ground:
 *
 * - The save's own stacks (js/world-items.js state, game.js droppedItemState, the save's
 *   droppedItems entry): everything in solo; online, a private place's drops, the owner's
 *   locked decor (what the owner sets down in Decoration Mode, house_lock at takeable.js 33-36,
 *   179-198) and the stacks dropped at home before shared house floors (G1190).
 * - The shared stacks online: the realtime server's stacks on a public street or at a home
 *   (features/drops-mp-feature.js, the site's groddle_drops), a street's door keys
 *   (door-keys-feature) and a visit's view of the owner's stacks (neighbours-mp-feature). Each
 *   feature hands them in through the sharedDroppedStacks hook.
 *
 * v0.59.0 (G1190) moved house and Tower drops from the first store to the second, and Decoration
 * Mode, stacking and the owner's own tools kept reading only the first. So every reader goes
 * through here, and tests/ground-stacks.test.js fails when a module reads the save's store
 * (engine.droppedItems) any other way:
 *
 * - groundStacks(engine, tsid): everything on the ground at a place as this player sees it, the
 *   save's own (live rows) then the shared ones (copies, `shared: true`). Decoration Mode, a
 *   count of what stands at home.
 * - ownGroundRows(engine, tsid): the save's own rows at a place (the live array: a change writes
 *   through; call engine.droppedItemsChanged after). For what only the save can change: a
 *   Piggy eating a stack on this page, a Still, a melting Sno Cone, the Crafty Bot's fetch.
 * - ownGroundPlaces(engine) / ownGroundState(engine): the save's own stacks of every place, for a
 *   sweep over them all (melting, a home's x moving) and for js/world-items.js's helpers.
 */

/** The key the save keeps this place's own stacks under (game.js droppedStacksTsid: a Tower floor's own key, G226). */
export function groundKey(engine) {
  return String(engine?.dropTsid ?? engine?.streetTsid ?? '');
}

/** The save's own dropped-stack state ({ version, nextId, streets }), or null before the game loaded one. */
export function ownGroundState(engine) {
  const state = engine?.droppedItems;
  return state && typeof state === 'object' ? state : null;
}

/** The save's own stacks by place key, live ({} when there are none: a change to it is lost, so check ownGroundState first). */
export function ownGroundPlaces(engine) {
  const streets = ownGroundState(engine)?.streets;
  return streets && typeof streets === 'object' ? streets : {};
}

/** The save's own rows at one place: the live array, or a fresh empty one when the save has none there. */
export function ownGroundRows(engine, tsid = groundKey(engine)) {
  const rows = ownGroundPlaces(engine)[String(tsid ?? '')];
  return Array.isArray(rows) ? rows : [];
}

/** Drops the emptied rows of a place, and its key once none is left; true when anything went. */
export function pruneOwnGround(engine, tsid = groundKey(engine)) {
  const streets = ownGroundState(engine)?.streets;
  const key = String(tsid ?? '');
  const rows = streets?.[key];
  if (!Array.isArray(rows)) return false;
  const was = rows.length;
  for (let i = rows.length - 1; i >= 0; i -= 1) if (!(Number(rows[i]?.count) > 0)) rows.splice(i, 1);
  if (!rows.length) delete streets[key];
  return rows.length !== was || !rows.length;
}

/** The shared stacks the features hand in for a place (copies, each `shared: true`). */
export function sharedGroundStacks(engine, tsid = groundKey(engine)) {
  const out = typeof engine?.collect === 'function' ? engine.collect('sharedDroppedStacks', String(tsid ?? ''), engine) : [];
  return (Array.isArray(out) ? out : []).filter((s) => s && typeof s === 'object' && Number(s.count) > 0).map((s) => (s.shared === true ? s : { ...s, shared: true }));
}

/**
 * Everything on the ground at a place as this player sees it: the save's own rows (live, as they
 * are) then the shared stacks. A stack's `shared` says which store it is in.
 */
export function groundStacks(engine, tsid = groundKey(engine)) {
  const own = ownGroundRows(engine, tsid).filter((row) => row && Number(row.count) > 0);
  return [...own, ...sharedGroundStacks(engine, tsid)];
}
