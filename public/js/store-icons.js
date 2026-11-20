/**
 * Each store's icon (G1074, report #564, Austin 2026-11-20): one item the store sells, the most
 * basic one a new player meets there, shown by its pack icon (assets/sprites/icons/<class>.webp,
 * Tiny Speck's CC0 item art). The vendor finder's rows (js/vendor-finder.js, the panel from the
 * currants) and the Encyclopedia's Sold by filter (tools/catalog/build.mjs) both read this map, so
 * a store looks the same in both. Keyed by the store's key in store-catalog.js (catalog_stores.js
 * store_id in the comment); tests/store-icons.test.js checks every store has one it sells.
 *
 * The remake's own: Glitch gave a store no picture of its own (the hub map drew one shop icon,
 * map_icon_shop, for every store: glitch-client MapHub.as 679-693; a Street Spirit looks the
 * same whatever it sells).
 */

/** store key -> item class. */
export const STORE_ICON_ITEMS = Object.freeze({
  produce: 'carrot', // 3
  hardware: 'hatchet', // 4
  sno_cone: 'sno_cone_blue', // 5: the first and cheapest
  gardening: 'watering_can', // 6
  kitchen: 'knife_and_board', // 7
  groceries: 'bun', // 8
  alchemical: 'beaker', // 9
  animal: 'butterfly_lotion', // 10
  tools: 'tinkertool', // 11: "no tinkertool to correct the problem? The Tool Vendor ... will help you out"
  gardening_tools: 'hoe', // 12: the scarecrow's "infinite number of hoes"
  emporium: 'honey', // 13
  liquor: 'beer', // 15
  meals: 'basic_omelet', // 16
  mining: 'pick', // 18
  toys: 'emotional_bear', // 19
  bags: 'bag_generic', // 24
});

/** The store's icon item class, or ''. */
export function storeIconItem(key) {
  return STORE_ICON_ITEMS[key] || '';
}

/** The store's icon (a pack icon URL relative to the game's root), or ''. */
export function storeIconUrl(key) {
  const cls = storeIconItem(key);
  return cls ? `assets/sprites/icons/${cls}.webp` : '';
}
