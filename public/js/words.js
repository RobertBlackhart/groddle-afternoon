/**
 * Shared count and article words for player text: "1 second" / "2 seconds", "a Bean" / "an
 * Egg Plant", "a Spicy Grog" / "3 Spicy Grogs". GSJS common.js pluralize; item.js formatStack
 * reads an item's own article (a or an) the same way.
 */

/** common.js pluralize: "1 minute", "3 minutes". */
export function pluralize(count, single, plural = `${single}s`) {
  return count === 1 ? `1 ${single}` : `${count} ${plural}`;
}

/** "a" or "an" before a word, by its first letter: "a Bean Tree", "an Egg Plant". */
export function withArticle(word) {
  const w = String(word ?? '');
  return `${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}`;
}

/** item.js formatStack: "a Cherry" for one, else "3 Cherries". */
export function countWords(count, single, plural = `${single}s`) {
  return count === 1 ? withArticle(single) : `${count} ${plural}`;
}

/**
 * A Super Harvest's own line, as Glitch sent it: "Super Harvest! " and buildSimpleVerbMessage's
 * item_give (items/item.js 79-180), the bonus items only, the item's plural past one, no period:
 * "Super Harvest! +6 Sprigs of Silvertongue". Every super harvest in the source made its bonus a
 * second grant with this line (createItemFromOffsetDelayed, players/inc_items.js 379-452): include/
 * garden.js 486-498, include/trants.js 281-290, npc_piggy.js 1590-1601, npc_chicken.js 1493,
 * npc_butterfly.js 1265, jellisac.js 182-193. The verb's own line counts the ordinary yield only,
 * so the two add up to what reached the pack (G953, #436).
 */
export function superHarvestWords(qty, single, plural = `${single}s`) {
  return `Super Harvest! +${qty} ${qty > 1 ? plural : single}`;
}
