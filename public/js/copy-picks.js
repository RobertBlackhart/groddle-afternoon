/**
 * R18 part 2 (G974, G500, G557 #125): every item picker hands over the copy the player chose, not
 * just its type. In Glitch each of these was its own itemstack (stackmax 1 with instance props: a
 * pick, a Firefly Jar, a named Cubimal, a Draught with its Giant, a Still, a Teleportation Script,
 * a home machine and its tank: items/<class>.js 15-19), and every verb that moved one named the
 * itemstack chosen (main.js doVerb 2926-3250; give, mail, auctions and the Butler's package all
 * took an itemstack tsid). The remake's pack is one count per class with each copy's wear and words
 * beside it (js/tools.js copies, in pack order), so a picker that offered the class moved the last
 * copy, whichever the player meant.
 *
 * Here, for every picker (Give, Gift Box wrap, mail, auction post, the Butler's gift and package,
 * and the pack verbs that set a machine down or put a stack into storage):
 *  - copyPicks: one pick per copy where a class's copies differ (wear, uses, contents, words),
 *    identical copies with no words of their own sharing one pick with their count, each labelled
 *    so the player can tell them apart (a note under the name: "45/100", "Alph", “Rufus”);
 *    null when the class has nothing to tell apart (one pick for the class, as before).
 *  - packPicks: the picker's items for some pack classes, through copyPicks.
 *  - copyWire: what the chosen copies carry on the wire (r: wear, t: words).
 *  - takeCopies: just before the count goes down, moves the chosen copies last so they are the ones
 *    that go (takeToolCopy(state, c, { copy }) for one, pickToolCopies for several), found again
 *    by what they hold if the pack moved in between.
 *
 * Plops are not told apart: what a Plop holds is not known until it is examined (plop.js 219-240),
 * so the picker never shows it; Give still sends the Plop's seeds along as a drop does (G605).
 */
import { TOOL_CONDITION_CATALOG, cleanCopyTag, copyTags, pickToolCopies, takeToolCopy, toolCopies } from './tools.js?v=4156bba8';
import { scriptFromTag, scriptLabel } from './teleportation.js?v=e95cf7cb';
import { favorGiantName } from './potions.js?v=4f4c996d';

const sameTag = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

function firstPhrase(list) {
  const s = Array.isArray(list) ? String(list.find((p) => typeof p === 'string' && p.trim()) || '') : '';
  return s.length > 18 ? `${s.slice(0, 17).trimEnd()}…` : s;
}

/** PURE: the words that tell one copy apart, for the tile under its name ('' for none). */
export function copyNote(classTsid, r, t = null) {
  const def = TOOL_CONDITION_CATALOG[classTsid];
  if (!def) return '';
  const parts = [];
  switch (def.tag) {
    case 'name': {
      const name = typeof t === 'string' ? t : t && typeof t === 'object' ? String(t.name || '') : '';
      parts.push(name ? `“${name}”` : 'No name');
      if (t && typeof t === 'object' && Number(t.level) > 1) parts.push(`Level ${Math.floor(Number(t.level))}`);
      break;
    }
    case 'giant':
      if (t) parts.push(favorGiantName(t));
      break;
    case 'phrases': {
      const p = firstPhrase(t);
      parts.push(p ? `“${p}”` : 'No phrases');
      break;
    }
    case 'still':
      parts.push(`${Math.max(0, Math.floor(Number(t?.hooch) || 0))} Hooch`);
      break;
    case 'script': {
      const s = scriptFromTag(t);
      parts.push(s?.destination ? s.destination.label || s.destination.tsid : 'No destination');
      break;
    }
    default:
      break;
  }
  const n = Math.max(0, Math.floor(Number(r) || 0));
  if (def.bits) {
    const on = def.bits.filter((_, i) => n & (1 << i)).map((b) => ({ kiss: 'Lips', moon: 'Moon' }[b] || b));
    parts.push(on.length ? on.join(', ') : 'No upgrades');
  } else if (def.jar) parts.push(`${n} ${n === 1 ? 'Firefly' : 'Fireflies'}`);
  else if (def.fuel) parts.push(`Fuel ${n}/${def.capacity}`);
  else if (def.charges) parts.push(`${n} ${String(def.meter || 'Uses').toLowerCase()} left`);
  else if (!def.noMeter) {
    if (!def.contents && n <= 0) parts.push('Broken');
    else parts.push(`${n}/${def.capacity}`);
  }
  return parts.join(' · ');
}

/**
 * The picks one class offers: [{ copy, copies, count, r, t, note, title? }] in pack order (copy is
 * the first of its copies, copies every one, all alike), or null when one pick for the whole class
 * does (not a class with copies, one plain copy, or all of them alike with no words).
 * `label`: the class's name, for the title of a script ("Teleportation Script to Hechey Track").
 */
export function copyPicks(state, classTsid) {
  const def = TOOL_CONDITION_CATALOG[classTsid];
  if (!def || !state) return null;
  const copies = toolCopies(state, classTsid);
  if (!copies.length) return null;
  const tags = def.tags ? copyTags(state, classTsid) : [];
  const groups = [];
  copies.forEach((c, i) => {
    const r = c.remaining;
    const t = tags[i] ?? null;
    const same = t == null ? groups.find((g) => g.t == null && g.r === r) : null;
    if (same) {
      same.copies.push(i);
      same.count += 1;
      return;
    }
    groups.push({ copy: i, copies: [i], count: 1, r, t });
  });
  if (groups.length === 1 && groups[0].t == null) return null;
  return groups.map((g) => {
    const out = { ...g, note: copyNote(classTsid, g.r, g.t) };
    if (def.tag === 'script') {
      const s = scriptFromTag(g.t);
      if (s) out.title = scriptLabel(s);
    }
    return out;
  });
}

/** A pick's key in a picker: the class, and which copies ("pick#3"). */
export function pickKey(classTsid, pick = null) {
  return pick && Number.isInteger(pick.copy) ? `${classTsid}#${pick.copy}` : String(classTsid);
}

/**
 * The picker's items (js/ui/item-picker.js) for pack classes: `rows` [{ c, count, label, max?, ...rest }]
 * (one per class). A class whose copies differ becomes one item per pick, its count and max that
 * pick's, `copy` and `copies` on it; the rest stay one item. Keys from pickKey.
 */
export function packPicks(state, rows = []) {
  const out = [];
  for (const row of rows) {
    const picks = row?.c ? copyPicks(state, row.c) : null;
    if (!picks) {
      out.push({ ...row, key: row.key ?? pickKey(row.c) });
      continue;
    }
    const cap = Number.isFinite(Number(row.max)) ? Math.max(1, Math.floor(Number(row.max))) : Infinity;
    for (const p of picks) {
      out.push({
        ...row,
        key: pickKey(row.c, p),
        count: p.count,
        max: Math.max(1, Math.min(p.count, cap)),
        note: p.note,
        ...(p.title ? { title: p.title } : {}),
        copy: p.copy,
        copies: p.copies.slice(),
        r: p.r,
        t: p.t,
      });
    }
  }
  return out;
}

/** The copies of a class that hold `r` and `t` now, `prefer` first when they still do. */
function copiesLike(state, classTsid, pick, n) {
  const copies = toolCopies(state, classTsid);
  const tags = TOOL_CONDITION_CATALOG[classTsid]?.tags ? copyTags(state, classTsid) : [];
  const fits = (i) => i >= 0 && i < copies.length && copies[i].remaining === pick.r && sameTag(tags[i] ?? null, pick.t ?? null);
  const want = [];
  for (const i of Array.isArray(pick.copies) ? pick.copies : [pick.copy]) if (Number.isInteger(i) && fits(i) && !want.includes(i)) want.push(i);
  for (let i = 0; i < copies.length && want.length < n; i += 1) if (!want.includes(i) && fits(i)) want.push(i);
  return want.slice(0, n);
}

/**
 * What `n` of the chosen copies carry when they leave: { r, t } (t only for one copy, as on the
 * wire everywhere). A pick with no copies (a class with nothing to tell apart) answers null: the
 * caller sends what it always did (leavingToolWear, leavingCopyTag).
 */
export function copyWire(classTsid, pick, n = 1) {
  if (!pick || !Array.isArray(pick.copies) || !TOOL_CONDITION_CATALOG[classTsid]) return null;
  const out = { r: pick.r };
  const k = Math.floor(Number(n) || 0);
  if (k === 1 && pick.t != null) {
    const t = cleanCopyTag(classTsid, pick.t);
    if (t != null) out.t = t;
  }
  return out;
}

/**
 * The chosen copies are about to leave (the count goes down next): they move last, so the count
 * going down takes them and the others keep their places. One copy goes through
 * takeToolCopy(state, c, { copy }). Returns the ranks moved ([] when the pick names none: the last
 * ones go, as before).
 */
export function takeCopies(state, classTsid, pick, n = 1) {
  if (!state || !pick || !Array.isArray(pick.copies) || !TOOL_CONDITION_CATALOG[classTsid]) return [];
  const k = Math.max(1, Math.floor(Number(n) || 1));
  const ranks = copiesLike(state, classTsid, pick, k);
  if (!ranks.length) return [];
  if (ranks.length === 1) takeToolCopy(state, classTsid, { copy: ranks[0] });
  else pickToolCopies(state, classTsid, ranks.sort((a, b) => a - b));
  return ranks;
}

/** The ranks a pick's `n` copies stand at now (for the pack's slot that empties: bags-feature packTakeUnit). */
export function pickRanks(state, classTsid, pick, n = 1) {
  if (!state || !pick || !Array.isArray(pick.copies)) return [];
  return copiesLike(state, classTsid, pick, Math.max(1, Math.floor(Number(n) || 1)));
}

/**
 * The pack's slots the chosen copies sit in are the ones that empty when they leave, now or when the
 * server answers within `wait` ms (bags-feature packTakeUnit), not the class's last slot.
 */
export function markLeaving(engine, classTsid, pick, n = 1, wait = undefined) {
  if (!engine?.toolState || !pick || !Array.isArray(pick.copies)) return 0;
  const ranks = pickRanks(engine.toolState, classTsid, pick, n);
  for (const rank of ranks) engine.query?.('packTakeUnit', classTsid, rank, 1, engine, wait != null ? { wait } : undefined);
  return ranks.length;
}
