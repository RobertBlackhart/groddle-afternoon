/**
 * The encyclopedia's search (tools/encyclopedia/build.mjs writes the pages):
 *  - the home page (input[data-search]) loads search.json and shows matches
 *    from every section, items included, as tiles grouped by section, with a
 *    section filter; the query lives in the address (?q=&s=). #668: each
 *    section's facts (what its pages say) load after it, and a match found in
 *    a fact shows that fact under its tile (./search-core.js ranks and cuts);
 *  - a section's list (input[data-filter], and select[data-group] drawn as the
 *    themed combobox of ./items/combobox.js) hides the tiles that do not match
 *    (?q=&g=), so the list it draws without JavaScript stays the source; on
 *    Music and sounds the status chips (a[data-st], anchors to the By status
 *    lists without JavaScript) filter it by status too (?st=);
 *  - a sound's page plays its synth stand-in (button[data-synth], shown only
 *    here) through the game's own recipes, loaded on the first press, and one
 *    player at a time.
 */
import { combobox } from './items/combobox.js?v=f2510e19';
import { addFacts, createIndex, search as find, snippet } from './search-core.js?v=eb80f5cc';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => n.toLocaleString('en-US');
/** Lower case, accents and punctuation folded, for search. */
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ');
const LIMIT = 60;

function filterList(input) {
  const tiles = [...document.querySelectorAll('li[data-name]')];
  const hay = tiles.map((li) => fold(li.dataset.name));
  const groups = [...document.querySelectorAll('.ency-group, .snd-sub')];
  const count = $('count');
  const chips = [...document.querySelectorAll('a[data-st]')];
  const inStatus = tiles.map((li) => li.dataset.status || '');
  let status = '';
  const total = tiles.length;
  const label = count.textContent.replace(/^[\d,]+ /, '');
  const pick = document.querySelector('select[data-group]');
  const inGroup = tiles.map((li) => li.closest('.ency-group')?.dataset.group || '');
  const run = () => {
    const words = fold(input.value).split(' ').filter(Boolean);
    const group = pick?.value || '';
    let shown = 0;
    tiles.forEach((li, i) => {
      const ok = (!group || inGroup[i] === group) && (!status || inStatus[i] === status) && words.every((w) => hay[i].includes(w));
      li.hidden = !ok;
      if (ok) shown += 1;
    });
    for (const g of groups) g.hidden = !g.querySelector('li[data-name]:not([hidden])');
    const p = new URLSearchParams();
    if (input.value) p.set('q', input.value);
    if (group) p.set('g', group);
    if (status) p.set('st', status);
    for (const c of chips) c.setAttribute('aria-pressed', String(c.dataset.st === status));
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
    count.textContent = shown === total ? `${fmt(total)} ${label}` : `${fmt(shown)} of ${fmt(total)} ${label}`;
  };
  const params = new URLSearchParams(location.search);
  if (params.get('q')) input.value = params.get('q');
  if (pick && [...pick.options].some((o) => o.value === params.get('g'))) pick.value = params.get('g');
  if (chips.some((c) => c.dataset.st === params.get('st'))) status = params.get('st');
  for (const c of chips) {
    c.setAttribute('role', 'button');
    c.setAttribute('aria-pressed', 'false');
    c.addEventListener('click', (ev) => {
      ev.preventDefault();
      status = status === c.dataset.st ? '' : c.dataset.st;
      run();
    });
  }
  input.addEventListener('input', run);
  if (pick) {
    pick.addEventListener('change', run);
    combobox(pick);
  }
  if (input.value || pick?.value || status) run();
}

/** A sound's synth stand-in, played with the game's own recipe (public/js/synth-sfx.js). */
function synthButtons() {
  let ctx = null;
  for (const b of document.querySelectorAll('button[data-synth]')) {
    b.hidden = false;
    b.addEventListener('click', async () => {
      const { playSynthRecipe } = await import(b.dataset.synthModule);
      ctx ||= new AudioContext();
      if (ctx.state === 'suspended') await ctx.resume();
      for (const a of document.querySelectorAll('audio')) a.pause();
      playSynthRecipe(ctx, ctx.destination, b.dataset.synth, { volume: 1.6 });
    });
  }
  // One recording at a time.
  document.addEventListener('play', (ev) => {
    for (const a of document.querySelectorAll('audio')) if (a !== ev.target) a.pause();
  }, true);
}

async function search(input) {
  const base = '../';
  const data = await (await fetch(input.dataset.search)).json();
  const label = Object.fromEntries(data.sections.map((s) => [s.key, s.label]));
  const inRemake = new Set(data.inRemake);
  // #668: names first; each section's facts (what its pages say) join the index as they arrive.
  const index = createIndex(data.entries, data.sections);
  const params = new URLSearchParams(location.search);
  input.value = params.get('q') || '';
  let section = params.get('s') || '';
  const chips = $('sections');
  chips.innerHTML = [['', 'All'], ...data.sections.map((s) => [s.key, s.label])]
    .map(([k, l]) => `<button type="button" class="chip" data-s="${esc(k)}" aria-pressed="${k === section}">${esc(l)}</button>`).join(' ');
  const why = (line, fuzzy) => (line ? ` <span class="ency-tile-why">${snippet(line, input.value, { fuzzy }).map((p) => (p.hit ? `<mark>${esc(p.text)}</mark>` : esc(p.text))).join('')}</span>` : '');
  const sub = (e) => (e.s === 'lists' ? `${fmt(e.c || 0)} ${e.c === 1 ? 'street' : 'streets'}` : `<span class="cat-st st-${esc(e.st)}">${esc(data.statuses[e.st] || e.st)}</span>`);
  const tile = ({ e, why: line }, fuzzy) => `<li><a class="ency-tile${inRemake.has(e.st) ? '' : ' ency-tile-out'}${line ? ' ency-tile-fact' : ''}" href="${base}${e.h}"><span class="ency-tile-pic">${e.ic ? `<img class="ency-ic" src="${base}${esc(e.ic)}" alt="" loading="lazy" decoding="async" />` : '<span class="ency-ic cat-ph" aria-hidden="true"></span>'}</span> <span class="ency-tile-name">${esc(e.n)}<span class="ency-sep">,</span></span> <span class="ency-tile-sub">${sub(e)}</span>${why(line, fuzzy)}</a></li>`;
  const run = () => {
    const q = input.value.trim();
    const p = new URLSearchParams();
    if (input.value) p.set('q', input.value);
    if (section) p.set('s', section);
    history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
    for (const c of chips.children) c.setAttribute('aria-pressed', String(c.dataset.s === section));
    chips.hidden = !q;
    $('cards').hidden = Boolean(q);
    if (!q) { $('results').innerHTML = ''; $('count').textContent = ''; return; }
    const { hits, fuzzy } = find(index, q, { section });
    const groups = new Map();
    for (const h of hits) { if (!groups.has(h.e.s)) groups.set(h.e.s, []); groups.get(h.e.s).push(h); }
    const n = `${fmt(hits.length)} match${hits.length === 1 ? '' : 'es'}`;
    $('count').textContent = !hits.length ? 'Nothing matches. Try fewer words.' : fuzzy ? `${n} for a spelling close to yours.` : n;
    $('results').innerHTML = [...groups].map(([s, list]) => `<section class="ency-group"><h2>${esc(label[s])} <span class="count">${fmt(list.length)}</span></h2><ul class="ency-tiles ency-grid">${list.slice(0, LIMIT).map((h) => tile(h, fuzzy)).join('')}</ul>${list.length > LIMIT ? `<p class="cat-muted">${fmt(list.length - LIMIT)} more: add a word, or pick ${esc(label[s])} above.</p>` : ''}</section>`).join('');
  };
  let frame = 0;
  const later = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; run(); }); };
  input.addEventListener('input', later);
  chips.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-s]');
    if (!b) return;
    section = b.dataset.s;
    run();
  });
  run();
  const folder = new URL('.', new URL(input.dataset.search, location.href));
  await Promise.all(Object.entries(data.facts || {}).map(async ([s, path]) => {
    try {
      addFacts(index, s, await (await fetch(new URL(path, folder))).json());
      if (input.value.trim()) later();
    } catch { /* that section's names still search */ }
  }));
}

const filter = document.querySelector('input[data-filter]');
if (filter) filterList(filter);
if (document.querySelector('button[data-synth], audio')) synthButtons();
const box = document.querySelector('input[data-search]');
if (box) search(box).catch(() => { $('count').textContent = 'The search could not be loaded.'; });
