/**
 * A street page's "On the street now" (register G1277, report #686). A player found no Wood Trees
 * on Thicket where its page lists 3: all three had been felled, and a felled Wood Tree is a Patch,
 * as in Glitch (wood_tree.js onDie). Austin 2026-11-25: "Maybe the live count could say last check
 * within last 24 hours, so a cached lookup rather then a realtime check."
 *
 * tools/encyclopedia/streets.mjs liveBlock draws div[data-live-street] hidden, with the names of
 * the tree classes the count may hold. This asks the site's groddle/v1/streets/live (the site keeps
 * the realtime server's count, at most an hour old, and never shows one older than a day:
 * groddle-afternoon-site src/StreetLive.php), and shows the block filled:
 *
 *   On the street now (checked 3 hours ago)
 *   - Wood Tree: none of 3 standing (all 3 felled, Patches now)
 *   - Bean Tree: standing
 *
 * Without JavaScript, without the site (a static copy of the game) or without a count, the block
 * stays hidden and the page shows its starting counts only.
 */

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "checked 3 hours ago": how long since the count, in the largest whole unit. */
export function agoText(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return 'checked just now';
  if (s < 3600) return `checked ${plural(Math.floor(s / 60), 'minute')} ago`;
  if (s < 86400) return `checked ${plural(Math.floor(s / 3600), 'hour')} ago`;
  return 'checked a day ago';
}

/**
 * The list's lines for a street's row ({trees: {class: [standing, gone]}, patches: {empty,
 * seedlings, dead, grown: {class: n}}}), by the tree names the page carries; a class the page has
 * no name for is left out.
 */
export function liveLines(row, names) {
  const lines = [];
  const named = (map) => Object.entries(map || {}).filter(([c]) => names[c]).sort((a, b) => names[a[0]].localeCompare(names[b[0]]));
  for (const [cls, [standing, gone]] of named(row?.trees)) {
    const total = standing + gone;
    const wood = cls === 'wood_tree';
    const left = wood ? 'felled, Patches now' : 'died';
    const leftOne = wood ? 'felled, a Patch now' : 'died';
    let line;
    if (!gone) line = total === 1 ? 'standing' : `all ${total} standing`;
    else if (!standing) line = total === 1 ? `none standing (it ${wood ? 'was felled and is a Patch now' : 'died'})` : `none of ${total} standing (all ${total} ${left})`;
    else line = `${standing} of ${total} standing (${gone} ${gone === 1 ? leftOne : left})`;
    lines.push(`${names[cls]}: ${line}`);
  }
  const p = row?.patches || {};
  const grown = named(p.grown);
  if (grown.length) lines.push(`Grown since in its Patches: ${grown.map(([c, n]) => (n > 1 ? `${names[c]} ${n}` : names[c])).join(', ')}`);
  if (p.seedlings) lines.push(`${plural(p.seedlings, 'Seedling')} growing in its Patches`);
  if (p.dead) lines.push(`${plural(p.dead, 'dead tree')} waiting to be cleared`);
  if (p.empty) lines.push(plural(p.empty, 'empty Patch', 'empty Patches'));
  return lines;
}

/** Fills and shows the block from the site's answer; false (left hidden) when there is nothing to show. */
export function fill(el, answer, nowMs) {
  if (!answer || !Number.isInteger(answer.checked) || !answer.street) return false;
  let names = {};
  try { names = JSON.parse(el.dataset.liveNames || '{}'); } catch { return false; }
  const lines = liveLines(answer.street, names);
  if (!lines.length) return false;
  el.querySelector('.st-live-when').textContent = `(${agoText(nowMs / 1000 - answer.checked)})`;
  el.querySelector('.st-live-list').innerHTML = lines.map((l) => `<li>${esc(l)}</li>`).join('');
  el.hidden = false;
  return true;
}

/** Asks the site for the street's count and fills the block; any failure leaves it hidden. */
export async function load(el, fetchFn = fetch, now = Date.now) {
  try {
    const url = new URL(el.dataset.liveUrl, document.baseURI);
    url.searchParams.set('street', el.dataset.liveStreet);
    const r = await fetchFn(url, { credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!r.ok) return false;
    return fill(el, await r.json(), now());
  } catch {
    return false;
  }
}

if (typeof document !== 'undefined') {
  const el = document.querySelector('[data-live-street]');
  if (el) load(el);
}
