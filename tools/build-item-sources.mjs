/**
 * Where each item the console can give comes from in the game today (Austin 2026-11-24: "as an
 * admin I want to know which items can only be given out by admins as they aren't yet implemented
 * in game"). Writes groddle-afternoon-site data/item-sources.json, which the site's admin/catalog
 * route (src/AdminConsole.php catalog) joins onto the give catalog for the console's Give pop-up
 * (console/console.js itemGroups, the Browse view). Administrators only: nothing here reaches a
 * player.
 *
 * One row per class the give catalog carries (the site's data/economy.json items, the ledger's
 * tradeable classes): its category, the kinds of source the game has for it, whether a player can
 * get it in the game today, its base price and Glitch's own rare tag. Nothing is a hand list:
 *
 *  - A class the Item Catalog lists (public/encyclopedia/items/data.json, tools/catalog/build.mjs,
 *    itself built from the game's tables: vendors, recipes, harvests, drop tables, quests, cards,
 *    handouts) takes the catalog's category and its "get" kinds (sold, made, harvest, other).
 *    It can be got when the catalog's status is in the remake (source) or between players
 *    (multiplayer, kind multiplayer).
 *  - A class the catalog leaves out (cubimal figures and other NPC-kind items, classes the coverage
 *    inventory excluded) takes the inventory's judgement (research/coverage/inventory.sqlite
 *    entities: status source is obtainable, its evidence's "obtainable: vendor:" is kind sold, any
 *    other way kind other; excluded and the rest are not) and its category from its GSJS file and
 *    catalog_tags.js (tools/catalog/build.mjs categoryOf).
 *  - Either way, the remake's own supply tables win when they give it (tools/job-obtainable.mjs
 *    obtainableItems: every vendor, the starting kit, harvests, mining, the fixpoint over recipes,
 *    garden, transforms and machines, holiday stock): the Test Tube, which the Alchemical Goods
 *    Vendor sells, is a class the inventory once excluded as a test id. Their kind stands in when
 *    nothing else named one.
 *  - A class Glitch never had (the remake's own, in neither) can be got unless the economy table
 *    says nothing in the remake grants it (data/economy.json gate g "credit"); kind other, category
 *    Food when the trade table calls it food (assets/content/trade-items.json), else Other.
 *
 * Rarity: Glitch carried no rarity scale. Its only mark is the "rare" tag (items/catalog_tags.js
 * "rare", the rare_item parent: a handful of numbered limited editions), carried here as rare 1.
 * The console shows base price (GSJS base_cost) as price, never as rarity.
 *
 *   node tools/build-item-sources.mjs           write it
 *   node tools/build-item-sources.mjs --check   exit 1 when it is stale
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { requireSite, sitePath } from './repos.mjs';
import { GSJS, INVENTORY_DB, categoryOf, readGsjsItem } from './catalog/build.mjs';
import { readItemTags } from './inventory/gsjs-data.mjs';
import { obtainableItems } from './job-obtainable.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = sitePath('data', 'item-sources.json');
const CATALOG = join(root, 'public', 'encyclopedia', 'items', 'data.json');
const TRADE = join(root, 'public', 'assets', 'content', 'trade-items.json');

/** The kinds of source, in the console's words (the catalog's GETS, and between players). */
export const KINDS = Object.freeze({
  sold: 'Sold by a vendor',
  made: 'Made',
  harvest: 'Harvested',
  other: 'Found or given',
  multiplayer: 'Between players',
});

/** Why a class cannot be got, in the console's words. */
export const WHY = Object.freeze({
  unbuilt_original: 'Never finished in Glitch',
  missing: 'Not in the remake yet',
  lost: 'Lost for now',
  excluded: 'Left out of the remake',
  credit: 'Nothing in the remake gives it',
  unknown: 'No source found',
});

/** The catalog statuses a player can get a class in (tools/catalog/build.mjs STATUSES). */
export const OBTAINABLE = Object.freeze(['source', 'multiplayer']);

/** The kind of an obtainableItems source ("vendor:produce", "recipe:pot", "garden:<seed>", "trant"...). */
export function supplyKind(source) {
  const s = String(source || '');
  if (s.startsWith('vendor:')) return 'sold';
  if (/^(recipe|garden|transform|assembly|incubation|herdkeeping|still|paper|piggy_plop|season:zilloween_carve)/.test(s)) return 'made';
  if (/^(trant|mining|ore_grinder|smelter|wood_tree|animal_kinship|batterfly|fox_brushing|harvest|drop)/.test(s)) return 'harvest';
  return 'other';
}

/**
 * One class's row from what the game knows of it: catalog (its data.json item or null), inventory
 * ({ status, evidence } or null), gsjs ({ tags, parents, takeable, baseCost } or null), gate (the
 * economy's g), trade (its trade-items.json row or null), supply (its obtainableItems source or null).
 * @returns {{ cat: string, src: string[], ok: 0|1, price?: number, rare?: 1, why?: string }}
 */
export function sourceRow({ catalog = null, inventory = null, gsjs = null, gate = null, trade = null, supply = null } = {}) {
  let cat;
  let src = [];
  let ok;
  let why = '';
  if (catalog) {
    cat = catalog.category;
    ok = OBTAINABLE.includes(catalog.status);
    src = ok ? (catalog.status === 'multiplayer' ? ['multiplayer'] : [...catalog.get]) : [];
    why = ok ? '' : WHY[catalog.status] || WHY.unknown;
  } else if (inventory) {
    cat = gsjs ? categoryOf(gsjs) : 'Other';
    ok = inventory.status === 'source';
    src = ok ? [/obtainable: vendor:/.test(inventory.evidence || '') ? 'sold' : 'other'] : [];
    why = ok ? '' : WHY[inventory.status] || WHY.unknown;
  } else {
    cat = gsjs ? categoryOf(gsjs) : trade?.food ? 'Food' : 'Other';
    ok = gate !== 'credit';
    src = ok ? ['other'] : [];
    why = ok ? '' : WHY.credit;
  }
  // The remake's supply tables give it: obtainable, whatever the catalog or inventory thought (their
  // kind only when nothing else named one: the catalog's ways are the fuller account).
  if (supply && !ok) {
    ok = true;
    why = '';
    src = [supplyKind(supply)];
  }
  // The economy's own test (named nowhere in the game) always wins: nothing grants it.
  if (gate === 'credit' && ok) { ok = false; src = []; why = WHY.credit; }
  const price = catalog?.price || gsjs?.baseCost || 0;
  const rare = gsjs?.tags?.includes('rare') || gsjs?.parents?.includes('rare_item');
  return { cat, src, ok: ok ? 1 : 0, ...(price > 0 ? { price } : {}), ...(rare ? { rare: 1 } : {}), ...(why ? { why } : {}) };
}

function readInventoryRows(path = INVENTORY_DB) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    return new Map(db.prepare("SELECT id, kind, status, evidence FROM entities WHERE kind IN ('item', 'npc')").all().map((r) => [r.id, { kind: r.kind, status: r.status, evidence: r.evidence || '' }]));
  } finally {
    db.close();
  }
}

/** Every give class's row, in the economy table's order. */
export async function itemSources() {
  const economy = JSON.parse(readFileSync(sitePath('data', 'economy.json'), 'utf8')).items;
  const catalog = new Map(JSON.parse(readFileSync(CATALOG, 'utf8')).items.map((i) => [i.id, i]));
  const trade = JSON.parse(readFileSync(TRADE, 'utf8')).items || {};
  const inventory = readInventoryRows();
  const tags = readItemTags(GSJS);
  const supply = (await obtainableItems()).sources;
  const items = {};
  for (const [c, row] of Object.entries(economy)) {
    let gsjs = null;
    if (existsSync(join(GSJS, 'items', `${c}.js`))) {
      gsjs = readGsjsItem(c);
      gsjs.tags = [...new Set([...gsjs.tags, ...(tags.get(c) || []).map((t) => t.replace(/,$/, ''))])];
    }
    items[c] = sourceRow({ catalog: catalog.get(c) || null, inventory: inventory.get(c) || null, gsjs, gate: row.g || null, trade: trade[c] || null, supply: supply[c] || null });
  }
  return items;
}

export function itemSourcesJson(items) {
  const doc = 'Generated by groddle-afternoon tools/build-item-sources.mjs (do not edit). For the console\'s Give pop-up only (AdminConsole catalog): each give class\'s cat (the Item Catalog\'s category), src (kinds of source in the game today), ok 1 when a player can get it in the game, price (GSJS base_cost), rare 1 for Glitch\'s rare tag (Glitch had no rarity scale), why when it cannot be got.';
  const rows = Object.entries(items).map(([c, r]) => `${JSON.stringify(c)}:${JSON.stringify(r)}`).join(',\n');
  return `{"_doc":${JSON.stringify(doc)},\n"kinds":${JSON.stringify(KINDS)},\n"items":{\n${rows}}}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  requireSite();
  const items = await itemSources();
  const text = itemSourcesJson(items);
  if (process.argv.includes('--check')) {
    let have = '';
    try { have = readFileSync(OUT, 'utf8'); } catch { /* missing */ }
    if (have !== text) {
      console.error(`${OUT} is stale: run node tools/build-item-sources.mjs`);
      process.exit(1);
    }
    process.exit(0);
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, text);
  const rows = Object.values(items);
  const admin = rows.filter((r) => !r.ok);
  console.log(`item sources: ${rows.length} give classes, ${admin.length} with no source in the game (admin only), ${rows.filter((r) => r.rare).length} tagged rare`);
}
