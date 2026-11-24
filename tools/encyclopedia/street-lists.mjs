/**
 * #668 (Austin 2026-11-24): "Streets with…" lists, generated from the same street data as the
 * street pages (streets.mjs addStreets: the remake's own populationForStreet, its vendors, shrines
 * and subway stations), so a player can find every street with a community garden, a shrine to a
 * Giant, a kind of vendor, a subway station, or a rock, tree, animal or other thing.
 *
 *   /encyclopedia/streets/with/          every list, by kind
 *   /encyclopedia/streets/with/<slug>/   one list: its streets by region, each linking its page
 *
 * Each list is also a search entry (section "lists") whose name holds the thing's own words, so
 * searching "community garden" finds the list first, then the streets (whose facts say so). Each
 * street page links the lists it is on. tools/encyclopedia/build.mjs writes the pages.
 *
 * Not made, because the data puts them on (nearly) every street: quoins (every outdoor street gets
 * the planner's eight, js/street-ecology.js) and Qurazy markers (1,306 of 1,423 locations,
 * js/qurazy-markers.js).
 */
import { article, esc, fmt } from './parts.mjs';
import { KIND_ORDER, kindOf, GIANT_NAMES, giantIcon } from './streets.mjs';
import { picture, slug } from './data.mjs';

export const LISTS_PATH = 'encyclopedia/streets/with/';
/** The kinds of list, in the order the lists page shows them. */
export const LIST_KINDS = ['Gardens', 'Shrines', 'Vendors', 'Subway', ...KIND_ORDER];
/** Words each kind of list also answers to in the search. */
const KIND_WORDS = {
  Gardens: 'community garden gardens plot plant crops herbs gardening',
  Shrines: 'shrine giant donate favor',
  Vendors: 'vendor store shop buy sell',
  Subway: 'subway station train underground',
  Animals: 'animal creature',
  'Trees and plants': 'tree plant trant harvest',
  Rocks: 'rock mining mine ore',
  'Things to harvest': 'harvest',
  'Other things': '',
};

/**
 * Every list: [{ slug, kind, title, short, words, icon, about (the thing's page key or null),
 * rows: [{ key, place, n, note }] }], each list's rows in no order (the page sorts them), and
 * `of`: street key -> the lists it is on.
 */
export function streetLists(d, info) {
  const lists = new Map();
  // A list by its address; a street is on it once (a vendor's store and the vendor standing there are one list).
  const list = (id, make) => {
    const l = lists.get(id) || lists.set(id, { ...make(), rows: [] }).get(id);
    return { rows: { push: (r) => { if (!l.rows.some((x) => x.key === r.key)) l.rows.push(r); } } };
  };
  const streets = [...d.entries.values()].filter((e) => e.section === 'streets');
  for (const e of streets) {
    const st = e.street;
    const row = (extra = {}) => ({ key: e.key, place: st.place, n: 1, note: '', ...extra });
    if (st.gardens) {
      list('community-garden', () => ({ kind: 'Gardens', title: 'Streets with a Community Garden', short: 'Community garden', words: '', icon: info('item:proto_crop_garden_large')?.icon || null, about: null }))
        .rows.push(row({ n: st.gardens, note: st.gardens > 1 ? `${fmt(st.gardens)} gardens` : '' }));
    }
    if (st.giant) {
      const g = GIANT_NAMES[st.giant] || st.giant;
      const about = info(`people:npc_shrine_${st.giant}`) ? `people:npc_shrine_${st.giant}` : null;
      list(`shrine-to-${slug(g)}`, () => ({ kind: 'Shrines', title: `Streets with a Shrine to ${g}`, short: `Shrine to ${g}`, words: `${g} shrines`, icon: picture(giantIcon(st.giant)), about }))
        .rows.push(row());
    }
    const stores = [...new Set([st.store, ...st.npcStores.map((v) => v.store)].filter((k) => k && info(`stores:${k}`)))];
    for (const k of stores) {
      const s = info(`stores:${k}`);
      list(slug(s.name), () => ({ kind: 'Vendors', title: `Streets with ${article(s.name)} ${s.name}`, short: s.name, words: `${s.name}s`, icon: s.icon || null, about: `stores:${k}` }))
        .rows.push(row());
    }
    if (st.surface || st.station) {
      list('subway-station', () => ({ kind: 'Subway', title: 'Streets with a Subway Station', short: 'Subway station', words: 'subway stations', icon: null, about: null }))
        .rows.push(row({ note: st.surface ? `${st.surface.name} station` : 'a station' }));
    }
    for (const [cls, n] of st.here) {
      const k = d.keyOf(cls);
      const it = k && info(k);
      if (!it) continue;
      const kind = cls.startsWith('npc_') && !k.startsWith('animals:') ? 'Other things' : cls === 'barnacle' ? 'Things to harvest' : kindOf(cls);
      const plural = (k.startsWith('item:') ? d.items.get(k.slice(5))?.plural : d.entries.get(k)?.creature?.plural) || '';
      const id = slug(it.name);
      list(id, () => ({ kind, title: plural && plural !== it.name ? `Streets with ${plural}` : `Streets with ${article(it.name)} ${it.name}`, short: it.name, words: `${it.name} ${plural}`, icon: it.icon || null, about: k }))
        .rows.push(row({ n, note: n > 1 ? `${fmt(n)}` : '' }));
    }
  }
  const out = [...lists].map(([id, l]) => ({ slug: id, ...l, words: `${l.words} ${KIND_WORDS[l.kind] || ''}`.trim() }))
    .sort((a, b) => LIST_KINDS.indexOf(a.kind) - LIST_KINDS.indexOf(b.kind) || a.short.localeCompare(b.short, 'en', { sensitivity: 'base' }));
  const of = new Map();
  for (const l of out) for (const r of l.rows) (of.get(r.key) || of.set(r.key, []).get(r.key)).push(l);
  return { lists: out, of };
}

/** A list's search entry for search.json (section "lists"). */
export const listEntry = (l) => ({ s: 'lists', id: l.slug, n: l.title, g: `${l.short} ${l.words}`, st: 'source', ic: l.icon?.src || '', h: `${LISTS_PATH}${l.slug}/`, c: l.rows.length });

const many = (n, one, more = `${one}s`) => `${fmt(n)} ${n === 1 ? one : more}`;

/** One list's page body: its streets by region, as plain links (a common thing is on hundreds). */
export function listPage(l, { info, P, kit, entrySearch }) {
  const nameOf = (k) => info(k)?.name || k;
  const byPlace = new Map();
  for (const r of l.rows) (byPlace.get(r.place) || byPlace.set(r.place, []).get(r.place)).push(r);
  const places = [...byPlace.keys()].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'en', { sensitivity: 'base' }));
  const groups = places.map((pk) => {
    const rows = byPlace.get(pk).sort((a, b) => nameOf(a.key).localeCompare(nameOf(b.key), 'en', { sensitivity: 'base' }));
    const region = info(pk) ? `<a href="${P.href(pk)}">${esc(nameOf(pk))}</a>` : esc(nameOf(pk));
    return `<section class="ency-group" aria-label="${esc(nameOf(pk))}"><h2>${region} <span class="count">${fmt(rows.length)}</span></h2><ul class="snd-names">${rows.map((r) => `<li><a href="${P.href(r.key)}">${esc(nameOf(r.key))}</a>${r.note ? ` <span class="st-list-note">${esc(r.note)}</span>` : ''}</li>`).join('')}</ul></section>`;
  }).join('\n      ');
  const about = l.about && info(l.about) ? ` More about it: <a href="${P.href(l.about)}">${esc(nameOf(l.about))}</a>.` : '';
  const counted = l.rows.some((r) => r.n > 1) && l.kind !== 'Subway' ? ' A number after a street is how many it has.' : '';
  return `
  <header class="masthead note-head cat-head">
    <div class="wrap">
      <div class="ency-entry-top">
      <p class="kicker"><a href="../../../">Groddle Encyclopedia</a> · <a href="../../">Streets</a> · <a href="../">Streets with…</a></p>
      ${entrySearch('../../../')}
      </div>
      <h1>${esc(l.title)}</h1>
      <p class="lead">${esc(many(l.rows.length, 'street'))} in ${esc(many(places.length, 'region'))}, as the remake builds them.${about}${counted}</p>
    </div>
  </header>

  <main class="band cat-main">
    <div class="wrap">
      ${groups}
      <p class="note-all"><a href="../">Every list of streets</a> · <a href="../../">All streets</a> · <a href="../../../">Search the encyclopedia</a></p>
    </div>
  </main>
`;
}

/** The page of every list, by kind, each a chip with how many streets it has. */
export function listsIndex(lists, { P, entrySearch }) {
  const byKind = LIST_KINDS.map((k) => [k, lists.filter((l) => l.kind === k)]).filter(([, ls]) => ls.length);
  const kindTitle = { Gardens: 'Gardens', Shrines: 'Shrines', Vendors: 'Vendors', Subway: 'The subway' };
  const bands = byKind.map(([k, ls]) => `<section class="ency-group st-lists" aria-label="${esc(kindTitle[k] || k)}"><h2>${esc(kindTitle[k] || k)} <span class="count">${fmt(ls.length)}</span></h2>
        ${P.chips(ls.map((l) => P.chip(`${esc(l.short)} <b>${fmt(l.rows.length)}</b>`, { pic: l.icon ? { ...l.icon, hi: null } : null, link: `${l.slug}/` })))}</section>`).join('\n      ');
  return `
  <header class="masthead note-head cat-head">
    <div class="wrap">
      <div class="ency-entry-top">
      <p class="kicker"><a href="../../">Groddle Encyclopedia</a> · <a href="../">Streets</a> · Streets with…</p>
      ${entrySearch('../../')}
      </div>
      <h1>Streets with…</h1>
      <p class="lead">Every street that has a community garden, a shrine to each Giant, each kind of vendor, a subway station, or each rock, tree, animal and thing to harvest, by region. ${esc(many(lists.length, 'list'))}, made from the same data as the street pages. The number on each is how many streets.</p>
    </div>
  </header>

  <main class="band cat-main">
    <div class="wrap">
      ${bands}
      <p class="note-all"><a href="../">All streets</a> · <a href="../../">Search the encyclopedia</a></p>
    </div>
  </main>
`;
}
