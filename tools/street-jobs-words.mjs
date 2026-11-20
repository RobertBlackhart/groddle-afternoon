/**
 * #553 (Austin 2026-11-19): street projects whose words name the wrong street.
 *
 * Tiny Speck's location XML gives each street project a title_override and desc_override, and
 * some were copied from a neighbour's and never changed: the Amerran Huddles board said "Build
 * Perhoni Flim", three projects said "Kitkaa Carom", Tamila was spelled "Tamlia", and the Tower
 * streets were shortened ("Tower North" for Tower St South). build-street-jobs.mjs corrects them
 * here from each project's own street and hub, in the form the other projects use ("Build <Street>
 * In <Hub>", "Expand <Hub> by building a new street, <Street>."), keeping the source text beside
 * each fix. A shortened name only (the street's own, cut short) keeps the source's sentence with
 * the full name. Every street project's words also lose stray whitespace (tidyJobText), and a
 * title its trailing full stop.
 *
 * streetJobWordProblems is the check (build-street-jobs.mjs --check, tests/street-job-words.test.js):
 * a title names its own street (every word of it) and, after " In ", its own hub; a description
 * names its own street as the new street ("street, <Street>") and its own hub as the one expanded
 * ("Expand <Hub>", "Expand into <Hub>", "Expand from <Other hub> into <Hub>").
 */

/** jobId -> { why, title?: { source, fixed }, desc?: { source, fixed } }: `source` is Tiny Speck's text, tidied. */
export const STREET_JOB_CORRECTIONS = Object.freeze({
  203: { why: 'copied from Perhoni Flim (job 200)', title: { source: 'Build Perhoni Flim In Chakra Phool', fixed: 'Build Amerran Huddles In Chakra Phool' }, desc: { source: 'Expand Chakra Phool by building a new underground street, Perhoni Flim.', fixed: 'Expand Chakra Phool by building a new street, Amerran Huddles.' } },
  212: { why: 'copied from Tower St North (job 220)', title: { source: 'Build Tower North In Jethimadh', fixed: 'Build Tower St South In Jethimadh' }, desc: { source: 'Expand Jethimadh by building a new above ground street, Tower North.', fixed: 'Expand Jethimadh by building a new street, Tower St South.' } },
  299: { why: 'names Ajaya Bliss, another Ilmenskie Deeps street', title: { source: 'Build Ajaya Bliss in Ilmenskie Deeps', fixed: 'Build Malika Whim In Ilmenskie Deeps' }, desc: { source: 'Expand Ilmenskie Deeps by building a new street, Ajaya Bliss.', fixed: 'Expand Ilmenskie Deeps by building a new street, Malika Whim.' } },
  301: { why: 'the street and the hub swapped', desc: { source: 'Expand Churni Sanctum by building a new street, Ilmenskie Deeps.', fixed: 'Expand Ilmenskie Deeps by building a new street, Churni Sanctum.' } },
  336: { why: 'names Firabiz Flaunts and Kitkaa Carom (Chakra Phool)', title: { source: 'Build Firabiz Flaunts In Baqala', fixed: 'Build Stake Claim Rd F In Baqala' }, desc: { source: 'Expand Baqala by building a new street, Kitkaa Carom.', fixed: 'Expand Baqala by building a new street, Stake Claim Rd F.' } },
  383: { why: 'names its board street Chester Way 1E and Kitkaa Carom (Chakra Phool)', title: { source: 'Build Chester Way 1E In Choru', fixed: 'Build Tumble Rd 3 In Choru' }, desc: { source: 'Expand Choru by building a new street, Kitkaa Carom.', fixed: 'Expand Choru by building a new street, Tumble Rd 3.' } },
  494: { why: 'names its board street Afar Whence and Kitkaa Carom (Chakra Phool)', title: { source: 'Build Afar Whence In Tamila', fixed: 'Build Kifti Crown In Tamila' }, desc: { source: 'Expand Tamila by building a new street, Kitkaa Carom.', fixed: 'Expand Tamila by building a new street, Kifti Crown.' } },
  491: { why: 'Tamila spelled Tamlia', title: { source: 'Build Mesob Medium In Tamlia', fixed: 'Build Mesob Medium In Tamila' } },
  492: { why: 'Tamila spelled Tamlia', title: { source: 'Build Chari Chalks In Tamlia', fixed: 'Build Chari Chalks In Tamila' } },
  475: { why: 'expands Zhambu; the street and its board are in Andra', desc: { source: 'Expand Zhambu by building a new street, Modati Modes.', fixed: 'Expand Andra by building a new street, Modati Modes.' } },
  775: { why: 'expands Rasana; the street and its board are in Aranna', desc: { source: 'Expand Rasana by building a new street, Bij Arsul.', fixed: 'Expand Aranna by building a new street, Bij Arsul.' } },
  // Shortened names: the street's own, cut short; the source's sentence kept.
  209: { why: 'Tower St East shortened', title: { source: 'Build Tower East In Jethimadh', fixed: 'Build Tower St East In Jethimadh' }, desc: { source: 'Expand Jethimadh by building a new above ground street, Tower East.', fixed: 'Expand Jethimadh by building a new above ground street, Tower St East.' } },
  220: { why: 'Tower St North shortened', title: { source: 'Build Tower North In Jethimadh', fixed: 'Build Tower St North In Jethimadh' }, desc: { source: 'Expand Jethimadh by building a new street, Tower North.', fixed: 'Expand Jethimadh by building a new street, Tower St North.' } },
  231: { why: 'Tower St West shortened', title: { source: 'Build Tower West In Jethimadh', fixed: 'Build Tower St West In Jethimadh' }, desc: { source: 'Expand Jethimadh by building a new street, Tower West.', fixed: 'Expand Jethimadh by building a new street, Tower St West.' } },
  176: { why: 'Clam Calumny shortened', desc: { source: 'Expand Shimla Mirch by building a new underground street, Calumny.', fixed: 'Expand Shimla Mirch by building a new underground street, Clam Calumny.' } },
  186: { why: 'Lemmen Connect shortened', title: { source: 'Build Lemmen In Chakra Phool', fixed: 'Build Lemmen Connect In Chakra Phool' }, desc: { source: 'Expand from Shimla Mirch into Chakra Phool by building a new above ground street, Lemmen.', fixed: 'Expand from Shimla Mirch into Chakra Phool by building a new above ground street, Lemmen Connect.' } },
  205: { why: 'Iljoki Ease (its label in the location XML) spelled Iijoki', title: { source: 'Build Iijoki Ease In Chakra Phool', fixed: 'Build Iljoki Ease In Chakra Phool' }, desc: { source: 'Expand Chakra Phool by building a new underground street, Iijoki Ease.', fixed: 'Expand Chakra Phool by building a new underground street, Iljoki Ease.' } },
});

/**
 * Projects whose words are right but do not build a street by name: the Jethimadh Tower's unlock
 * (its street is the Tower's first room, Corridor One; the words name the Tower and the street its
 * entrance is on).
 */
export const STREET_JOB_WORDS_EXEMPT = Object.freeze({
  256: 'the Jethimadh Tower unlock names the Tower, not its first room',
});

/** PURE: one line, single spaces, trimmed; a title also loses a trailing full stop. */
export function tidyJobText(text, { title = false } = {}) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return title ? s.replace(/\s*\.+$/, '') : s;
}

/**
 * PURE: the corrected { title, desc } for a street project from its tidied source words. Throws
 * when a correction's source text no longer matches (the source changed: look again).
 */
export function correctStreetJobWords(jobId, { title, desc }) {
  const fix = STREET_JOB_CORRECTIONS[jobId];
  const out = { title: tidyJobText(title, { title: true }), desc: tidyJobText(desc) };
  if (!fix) return out;
  for (const key of ['title', 'desc']) {
    if (!fix[key]) continue;
    if (out[key] !== fix[key].source) throw new Error(`street job ${jobId} ${key}: the source now reads ${JSON.stringify(out[key])}, not ${JSON.stringify(fix[key].source)}`);
    out[key] = fix[key].fixed;
  }
  return out;
}

const words = (s) => String(s || '').toLowerCase().split(/[^\p{L}\p{N}']+/u).filter(Boolean);
const same = (a, b) => words(a).join(' ') === words(b).join(' ');

/**
 * PURE: what is wrong with a street project's words ([] when nothing). `job` is a street-jobs.json
 * row ({ kind: 'street', label, hub, title, desc }).
 */
export function streetJobWordProblems(job, jobId = '') {
  if (!job || job.kind !== 'street' || STREET_JOB_WORDS_EXEMPT[jobId]) return [];
  const out = [];
  const { label = '', hub = '', title = '', desc = '' } = job;
  for (const [key, s] of [['title', title], ['desc', desc]]) {
    if (s !== tidyJobText(s, { title: key === 'title' })) out.push(`${key} has stray whitespace or a trailing full stop`);
  }
  const titleWords = new Set(words(title));
  if (!words(label).every((w) => titleWords.has(w))) out.push(`title does not name ${label}`);
  const inHub = title.match(/ in (.+)$/i)?.[1];
  if (inHub != null && !same(inHub, hub)) out.push(`title names the hub ${inHub}, not ${hub}`);
  if (desc) {
    const built = desc.match(/street, ([^,.]+)/)?.[1];
    if (built == null) out.push('desc names no new street ("street, <Street>")');
    else if (!same(built, label)) out.push(`desc builds ${built}, not ${label}`);
    const expanded = desc.match(/^Expand (?:from .+? into |into )?(.+?) by /)?.[1];
    if (expanded == null) out.push('desc names no hub it expands ("Expand <Hub> by")');
    else if (!same(expanded, hub)) out.push(`desc expands ${expanded}, not ${hub}`);
  }
  return out;
}

/** PURE: every street project with something wrong in its words: [[jobId, problems], ...]. */
export function streetJobWordFailures(catalog) {
  return Object.entries(catalog?.jobs || {})
    .map(([jobId, job]) => [jobId, streetJobWordProblems(job, jobId)])
    .filter(([, problems]) => problems.length);
}
