/**
 * #668: the encyclopedia's search, as pure functions (no DOM), so tests import the same code the
 * home page runs (public/encyclopedia/encyclopedia.js).
 *
 * Every page is an entry of search.json (name `n`, id, `g` its group, section `s`); its facts
 * (the lines its page shows, tools/encyclopedia/search-facts.mjs) come in per-section files
 * listed in search.json `facts`, and join the index when they arrive.
 *
 *  - Words are folded (case, accents, punctuation) and stemmed (gardens -> garden, berries ->
 *    berry), so a plural finds the singular and back.
 *  - Every query word must match somewhere in the entry: its name (inside a word, as before),
 *    its id, group and section (inside a word), or a fact (the start of a word).
 *  - Ranking: a word found in the name beats one in the id, group or section, which beats one
 *    in a fact; ties put the "Streets with…" lists first, then names that start with the query.
 *  - One typo (a letter missing, extra, changed or two swapped) is allowed in words of five
 *    letters or more, only when nothing matches as typed.
 *  - A "How do I…" guide (section "how", tools/encyclopedia/guides.mjs) carries its question as
 *    its name and strong keywords `k`, which count as name words; when every query word starts a
 *    word of its question or keywords, the guide comes before everything else.
 */

/** Lower case, accents, apostrophes and punctuation folded. */
export const fold = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** A word's simple stem: plurals folded to the singular (gardens -> garden, berries -> berry, boxes -> box). */
export function stem(w) {
  if (w.length <= 3 || /\d/.test(w)) return w;
  if (/ies$/.test(w) && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(?:ss|sh|ch|x|z)es$/.test(w)) return w.slice(0, -2);
  if (/oes$/.test(w) && w.length > 5) return w.slice(0, -2);
  if (/[^su]s$/.test(w) && !/(?:is|ous)$/.test(w)) return w.slice(0, -1);
  return w;
}

/** Folded, stemmed words. */
export const words = (s) => fold(s).split(' ').filter(Boolean).map(stem);

/** Is `b` one edit from `a` (a letter added, dropped, changed, or two side by side swapped)? */
export function oneEdit(a, b) {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < la && i < lb && a[i] === b[i]) i += 1;
  if (la === lb) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // changed
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // swapped
  }
  return la < lb ? a.slice(i) === b.slice(i + 1) : a.slice(i + 1) === b.slice(i); // added, dropped
}
/** Shortest word the one-typo match is allowed on. */
export const FUZZY_MIN = 5;

/** Where a word was found, best first. */
export const FIELD = Object.freeze({ name: 0, meta: 1, fact: 2 });
/** How it was found: the whole word, its start, inside it, or one typo off. */
const HOW = { exact: 0, prefix: 1, inside: 2, fuzzy: 3 };

/** How query word `w` matches index word `t` ('' when it does not), with `fuzzy` allowing one typo. */
function matchHow(w, t, fuzzy) {
  if (t.startsWith(w)) return t.length === w.length ? 'exact' : 'prefix';
  if (t.includes(w)) return 'inside';
  if (fuzzy && w.length >= FUZZY_MIN && oneEdit(w, t)) return 'fuzzy';
  return '';
}

/**
 * The index of search.json's entries (`sections`: its [{ key, label }], for the section words).
 * Facts join it later (addFacts).
 */
export function createIndex(entries, sections = []) {
  const label = Object.fromEntries(sections.map((s) => [s.key, s.label]));
  const index = { entries, words: new Map(), facts: entries.map(() => null), at: new Map(entries.map((e, i) => [`${e.s}:${e.id}`, i])) };
  // #668: a guide's question and keywords, the words that rank it first.
  index.strong = entries.map((e) => (e.k == null ? null : [...new Set([...words(e.n), ...words(e.k)])]));
  entries.forEach((e, i) => {
    for (const w of words(e.n)) note(index, w, i, FIELD.name);
    for (const w of words(e.k || '')) note(index, w, i, FIELD.name);
    for (const w of words(`${String(e.id).replace(/[_-]/g, ' ')} ${e.g || ''} ${label[e.s] || ''}`)) note(index, w, i, FIELD.meta);
  });
  return index;
}

function note(index, w, i, field) {
  let at = index.words.get(w);
  if (!at) index.words.set(w, (at = new Map()));
  if (!at.has(i) || at.get(i) > field) at.set(i, field);
}

/** One section's facts ({ id: "line\nline" }, as tools/encyclopedia/search-facts.mjs writes them). */
export function addFacts(index, section, facts) {
  for (const [id, text] of Object.entries(facts || {})) {
    const i = index.at.get(`${section}:${id}`);
    if (i === undefined || !text) continue;
    const lines = String(text).split('\n').filter(Boolean);
    index.facts[i] = lines;
    for (const line of lines) for (const w of words(line)) note(index, w, i, FIELD.fact);
  }
  return index;
}

/** Each entry that has every word, with its score (lower is better). */
function matchAll(index, ws, fuzzy) {
  let acc = null;
  for (const w of ws) {
    const best = new Map(); // entry -> score of this word
    for (const [t, at] of index.words) {
      const how = matchHow(w, t, fuzzy);
      if (!how) continue;
      for (const [i, field] of at) {
        // In a fact, a word must start the fact's word: "ash" is not in "wash".
        if (field === FIELD.fact && how === 'inside') continue;
        if (acc && !acc.has(i)) continue;
        const score = field * 10 + HOW[how];
        if (!best.has(i) || best.get(i) > score) best.set(i, score);
      }
    }
    if (acc) for (const [i, s] of best) best.set(i, acc.get(i) + s);
    acc = best;
    if (!acc.size) break;
  }
  return acc || new Map();
}

/** Words a question carries that say nothing about the thing ("where to find a hoe"), left out when others remain. */
export const STOP_WORDS = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'with', 'where', 'what', 'which', 'how', 'is', 'are', 'do', 'does', 'can', 'i', 'my', 'find']);

/** The query's words: folded, stemmed, once each, without the question words when others remain. */
export function queryWords(query) {
  const all = [...new Set(words(query))];
  const kept = all.filter((w) => !STOP_WORDS.has(w));
  return kept.length ? kept : all;
}

/** Do the words of `ts` hold the query words `ws` side by side, in order (a fact word may run on: garden -> gardens)? */
function holdsPhrase(ts, ws, fuzzy) {
  if (ws.length < 2) return true;
  for (let i = 0; i + ws.length <= ts.length; i += 1) if (ws.every((w, j) => inFact(w, ts[i + j], fuzzy))) return true;
  return false;
}

/**
 * The entries matching `query`, best first: { hits: [{ e, i, score, why }], fuzzy }, `why` the
 * fact that says why an entry matched when its name alone does not hold every word ('' when it
 * does), `fuzzy` true when nothing matched as typed and these are one typo off.
 * opts.section keeps one section.
 *
 * Order: a guide whose question or keywords hold every query word (the start of a word) first;
 * then entries that hold the query as a phrase (in the name, or in one fact); then the
 * score (where each word was found: name, then id, group and section, then facts); then the
 * "Streets with…" lists; then the shorter fact (a list line says it outright, a long paragraph
 * only mentions it); then names that start with the query, shorter names, and A to Z.
 */
export function search(index, query, { section = '' } = {}) {
  const ws = queryWords(query);
  if (!ws.length) return { hits: [], fuzzy: false };
  const keep = (found) => (section ? new Map([...found].filter(([i]) => index.entries[i].s === section)) : found);
  let fuzzy = false;
  let found = keep(matchAll(index, ws, false));
  if (!found.size) {
    fuzzy = true;
    found = keep(matchAll(index, ws, true));
  }
  const first = ws[0];
  const hits = [...found].map(([i, score]) => {
    const e = index.entries[i];
    const name = words(e.n);
    const inName = ws.every((w) => name.some((t) => matchHow(w, t, fuzzy)));
    const why = inName ? '' : bestFact(index.facts[i], ws, fuzzy);
    const phrase = holdsPhrase(name, ws, fuzzy) || (why && holdsPhrase(words(why), ws, fuzzy)) ? 0 : 1;
    const strong = index.strong?.[i];
    const guide = strong && ws.every((w) => strong.some((t) => inFact(w, t, fuzzy))) ? 0 : 1;
    return { e, i, score, why: guide ? why : '', guide, phrase, list: e.s === 'lists' ? 0 : 1, starts: name[0]?.startsWith(first) ? 0 : 1 };
  });
  hits.sort((a, b) => a.guide - b.guide || a.phrase - b.phrase || a.score - b.score || a.list - b.list || a.why.length - b.why.length
    || a.starts - b.starts || a.e.n.length - b.e.n.length || a.e.n.localeCompare(b.e.n));
  return { hits: hits.map(({ e, i, score, why }) => ({ e, i, score, why })), fuzzy };
}

/** Does fact word `t` hold query word `w` (its start, or one typo off when fuzzy)? */
const inFact = (w, t, fuzzy) => { const how = matchHow(w, t, fuzzy); return Boolean(how) && how !== 'inside'; };

/** The fact that holds the most query words, as a phrase if one does, the shortest such; or ''. */
export function bestFact(lines, ws, fuzzy = false) {
  let best = '';
  let bestRank = null;
  const better = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
  for (const line of lines || []) {
    const ts = words(line);
    const n = ws.filter((w) => ts.some((t) => inFact(w, t, fuzzy))).length;
    if (!n) continue;
    const rank = [-n, holdsPhrase(ts, ws, fuzzy) ? 0 : 1, line.length];
    if (!bestRank || better(rank, bestRank) < 0) { best = line; bestRank = rank; }
  }
  return best;
}

/**
 * A fact cut to about `max` characters around its first matching word, as parts to draw:
 * [{ text, hit }] (hit: a query word, to mark), with "…" where it was cut.
 */
export function snippet(line, query, { max = 90, fuzzy = false } = {}) {
  const ws = queryWords(query);
  const parts = [];
  const re = /[\p{L}\p{N}'’]+/gu;
  let at = 0;
  let firstHit = -1;
  for (let m; (m = re.exec(line));) {
    const t = stem(fold(m[0]).replace(/ /g, ''));
    if (!ws.some((w) => inFact(w, t, fuzzy))) continue;
    if (m.index > at) parts.push({ text: line.slice(at, m.index), hit: false });
    if (firstHit < 0) firstHit = m.index;
    parts.push({ text: m[0], hit: true });
    at = m.index + m[0].length;
  }
  if (at < line.length) parts.push({ text: line.slice(at), hit: false });
  if (line.length <= max) return parts;
  // A window round the first hit, cut at spaces.
  let start = Math.max(0, Math.min(firstHit < 0 ? 0 : firstHit - Math.floor(max / 3), line.length - max));
  if (start > 0) start = line.indexOf(' ', start) + 1 || start;
  let end = Math.min(line.length, start + max);
  if (end < line.length && line.lastIndexOf(' ', end) > start) end = line.lastIndexOf(' ', end);
  const out = [];
  let pos = 0;
  for (const p of parts) {
    const a = pos;
    const b = pos + p.text.length;
    pos = b;
    if (b <= start || a >= end) continue;
    out.push({ text: p.text.slice(Math.max(0, start - a), Math.min(p.text.length, end - a)), hit: p.hit });
  }
  if (start > 0) out.unshift({ text: '…', hit: false });
  if (end < line.length) out.push({ text: '…', hit: false });
  return out;
}
