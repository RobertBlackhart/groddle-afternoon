/**
 * #668: the facts on an encyclopedia page, for the search. Every page is drawn from the game
 * data at build time (tools/encyclopedia/build.mjs, tools/catalog/build.mjs); this reads the
 * page as drawn, so the search finds what the page says, band by band. Kept compact: numbers,
 * prices and the same pick up, give and drop on every page are left out, a list is one line,
 * and a long paragraph is cut at a word.
 *
 * PURE (no file system): the builders and tests/encyclopedia-search.test.js import it.
 */

/** Bands and sub-headings whose words are not facts about the entry itself. */
export const SKIP_LABELS = new Set([
  'Roads from here', // the streets next door: a street is not its neighbour
  'Verbs', 'What you can do', // the same pick up, give and drop on most pages
  'Sounds', 'Region music', 'What plays now',
  // Every street that has it: each of those street pages says so, and the lists (street-lists.mjs) gather them.
  'Where to find it', 'Where to find one', 'Streets', 'Who and what lives here', 'Trees, rocks and more', 'More places',
  'In the encyclopedia', 'Linked to this quest', 'Comes next', 'Other streets with these',
  // Conversation, not facts.
  'When it is offered', 'When you finish', 'When you learn it',
  'How long it takes',
  // #668: the guides a page links (guides.mjs howLinks); a guide's words are its own search entry's.
  'How do I…',
]);
/** Fact-list terms that are numbers and codes, not words a player looks for. */
export const SKIP_TERMS = new Set(['Region', 'Base price', 'Sells for', 'Stacks to', 'Tags', 'Music', 'Plural', 'Kind', 'Cost', 'In the deck', 'Buy it', 'Learn time']);
/** Bands whose sentences need no label: Tiny Speck's own description of the thing. */
export const QUIET_LABELS = new Set(['In Tiny Speck’s game', 'About this store', 'About this street', 'The quest']);
/** Longest paragraph and longest list kept, in characters (cut at a word). */
export const PROSE_MAX = 200;
export const LIST_MAX = 320;

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…', times: '×', middot: '·', rarr: '→' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, n) => {
  if (n[0] === '#') return String.fromCodePoint(n[1] === 'x' || n[1] === 'X' ? parseInt(n.slice(2), 16) : Number(n.slice(1)));
  return ENTITIES[n.toLowerCase()] ?? m;
});
/** Markup to plain text on one line. */
export const plain = (s) => decode(String(s).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').replace(/\s+([,.;:!?)])/g, '$1').replace(/\(\s+/g, '(').trim();

/** Cut text at a word, at most `max` characters. */
export function clip(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), Math.floor(max * 0.6))).replace(/[,;:\s]+$/, '')}…`;
}

/**
 * One item of a list without its numbers: "Metal Rock 3" -> "Metal Rock", "Hoe, 63 currants,
 * sell for 40" -> "Hoe", "450 iMG" -> "iMG", "(3) Cherry" -> "Cherry". '' when nothing is left.
 */
export function listWords(text) {
  return text
    .replace(/,?\s*sell for [\d,]+/gi, '')
    .replace(/\(\s*[\d,.]+\s*\)|×[\d,]+|→|\+/g, ' ')
    .replace(/\b\d+(?:[,.]\d+)*\s*(?:currants?|iMG|energy|mood|seconds?|s|min|minutes?|hours?|h|days?|in all|each|at a time|copies|streets?|regions?|times?)?(?![\w-])/gi, ' ')
    .replace(/\b(?:on|up to|quicker after|places)\s*(?=,|$)/gi, ' ')
    .split(',').map((x) => x.replace(/\s+/g, ' ').trim().replace(/:$/, '')).filter((x) => /[a-z]{2}/i.test(x)).join(', ');
}

/**
 * The facts of one page: "Label: text" lines, in page order, one per label. A fact list's term
 * and its value make one fact ("Shrine: Shrine to Humbaba"); a list makes one ("Rocks: Metal
 * Rock, Beryl Rock"), under its sub-heading or else its band; a paragraph is a fact of its own.
 */
export function pageFacts(html) {
  const main = /<main[^>]*>([\s\S]*)<\/main>/.exec(html)?.[1] || '';
  const body = main
    .replace(/<(nav|figure|svg|audio|script|style|table|button)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<p class="(?:cat-source|section-lead|ency-lead-small|cat-status-text|cat-muted)[^"]*"[\s\S]*?<\/p>/g, ' ')
    .replace(/<img\b[^>]*>/g, ' ')
    .replace(/<span class="ency-sep">([^<]*)<\/span>/g, '$1')
    // A tile's small line ("keeps it", "learn it first") says how it is linked, not what it is.
    .replace(/<span class="ency-tile-sub">(?:[^<]|<(?!\/?span)[^>]*>|<span[^>]*>[^<]*<\/span>)*<\/span>/g, ' ');
  const order = [];
  const byLabel = new Map(); // label -> { parts: Set, prose: [] }
  const slot = (label) => {
    if (!byLabel.has(label)) { byLabel.set(label, { parts: new Set(), prose: [] }); order.push(label); }
    return byLabel.get(label);
  };
  for (const band of body.split(/<section\b/).slice(1)) {
    const inner = band.slice(band.indexOf('>') + 1);
    const h2 = plain(/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(inner)?.[1] || '');
    if (SKIP_LABELS.has(h2)) continue;
    // Mark the structure, then read it line by line: \1 a sub-heading, \2 a term and its value, \4 a list item.
    const marked = inner.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, ' ')
      .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (m, t) => `\n\u0001${plain(t)}\n`)
      .replace(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g, (m, t, v) => `\n\u0002${plain(t)}\u0003${plain(v.replace(/<\/li>/g, ', '))}\n`)
      .replace(/<li\b[^>]*>/g, '\n\u0004')
      .replace(/<\/(p|li|div|ul|ol|dl|blockquote)>|<br\s*\/?>/g, '\n');
    let sub = '';
    for (const raw of marked.split('\n')) {
      if (raw.startsWith('\u0001')) { sub = raw.slice(1); continue; }
      if (SKIP_LABELS.has(sub) || [...SKIP_LABELS].some((l) => sub.startsWith(`${l} `))) continue;
      if (raw.startsWith('\u0002')) {
        const [t, v] = raw.slice(1).split('\u0003');
        if (SKIP_TERMS.has(t) || !v) continue;
        const words = /[.!?]$/.test(v) ? v : listWords(v);
        if (words) slot(t).parts.add(words);
        continue;
      }
      const item = raw.startsWith('\u0004');
      const t = plain(item ? raw.slice(1) : raw);
      if (!t) continue;
      const label = sub || h2;
      // What the remake's status means, and the way there on a new world: the same words on many pages.
      if (!sub && h2 === 'In the remake') continue;
      // A sentence stays a sentence; a short item loses its numbers.
      if (/[a-z][.!?…”"]$/i.test(t) && t.split(' ').length > 3) slot(label).prose.push(t);
      else {
        const words = listWords(t);
        if (words) slot(label).parts.add(words);
      }
    }
  }
  const out = [];
  const said = new Set();
  for (const label of order) {
    const { parts, prose } = byLabel.get(label);
    for (const t of prose) {
      const line = QUIET_LABELS.has(label) ? clip(t, PROSE_MAX) : `${label}: ${clip(t, PROSE_MAX)}`;
      if (!said.has(t)) { said.add(t); out.push(line); }
    }
    const list = [...new Set([...parts].join(', ').split(', '))].filter((x) => x && x !== label);
    if (list.length) out.push(`${label}: ${clip(list.join(', '), LIST_MAX)}`);
  }
  return out;
}

/** A sentence on more pages than this is the page's frame, not a fact of its own. */
export const BOILERPLATE_PAGES = 8;

/**
 * Leave out the sentences many pages share ("Nothing to hand in: when the last step is done…"),
 * keeping lists, which are short and many streets do share ("Vendor: Gardening Goods Vendor").
 * `facts` is key -> lines; returns a new map.
 */
export function dropBoilerplate(facts, most = BOILERPLATE_PAGES) {
  const count = new Map();
  const isSentence = (line) => /[.!?…”"]$/.test(line);
  for (const lines of facts.values()) for (const l of new Set(lines)) if (isSentence(l)) count.set(l, (count.get(l) || 0) + 1);
  return new Map([...facts].map(([k, lines]) => [k, lines.filter((l) => (count.get(l) || 0) <= most)]));
}

/** The facts of one section as its file: { id: "line\nline" }, one entry a line, ids sorted. */
export function factsFile(facts) {
  const rows = [...facts].filter(([, lines]) => lines.length).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{\n${rows.map(([id, lines]) => `${JSON.stringify(id)}:${JSON.stringify(lines.join('\n'))}`).join(',\n')}\n}\n`;
}

/** Where each section's facts file is, from the encyclopedia's home (search.json `facts`). */
export const factsPath = (section) => (section === 'items' ? 'items/facts.json' : `facts/${section}.json`);
