/**
 * TODAYCARD (Austin 2026-11-20, "Let's go with the Today in Ur direction"; ideas from report
 * #568): the start card's words for a returning player, worked out from the save. Pure: the feature
 * (features/start-today-feature.js) reads the game and draws them.
 *
 *   pickNudge({ badges, quests })   the one line in place of "Today's goals": a badge you are close to
 *                                   ("An idea pops into your head") or your newest quest's next step
 *                                   ("A Giant whispers to you"); null when neither has started
 *   badgeCandidates(rows)           badge progress rows ({ def, unlocked, conditions }) narrowed to
 *                                   started, unfinished, one-counter, non-secret badges
 *   skillTile(study, available)     the skill tile: what you are learning and the time left, or how many
 *                                   skills are ready
 *   featTile(summary, now)          the Feat tile from solo-feats-feature's featSummary
 *   pickTip(rng, { touch, android }) one tip for this visit
 *   tipText(tip, { touch })         the tip as shown: "Click" reads "Tap" on a phone
 *   studyLeft(seconds)              "2h 04m", "12m", "45s"
 */

/** Tips about things players miss (report #568 asked for a tip that changes each visit). */
export const START_TIPS = Object.freeze([
  'Pick a street on the Map and Set as Destination: an arrow shows you the way.',
  'Press V near a vendor to browse its goods.',
  'Press F to eat: it picks the best food in your pack.',
  'Press C to look around the street in Camera Mode.',
  'Press Shift+T to see your teleport points.',
  'Hold ? for every key.',
  'Skills keep learning while you are away, so start one before you go.',
  'Press H to see how the Feats are going.',
  'Press Enter by anything to see what you can do with it.',
  'Press / to chat with the street.',
  // G1150 (#618, Austin 2026-11-23): four more from a player's list. Upgrades and Rooks are left for
  // players to teach each other. The Android tip shows only in an Android browser (not the installed
  // app): the play pages' manifest.webmanifest (display standalone) makes the install full screen.
  'On Android, pick Install app or Add to Home screen in your browser menu to play full screen.',
  'Click your currants to find the nearest vendor.',
  'Click your favor to find the nearest shrine.',
  // G1150 follow-up: learning slows only past 20 skills, 5% for each skill known or queued, paused
  // ones too (inc_skills.js skills_get_learning_time_modifier 1792-1807; imagination-feature.js
  // skillTimeFactor). Emblems are spent from the pack (emblem_base verbs.spend: unlock a skill or
  // speed one up); a shrine takes favor, not emblems.
  'After 20 skills, each skill you know or have started (paused ones too) makes learning a little slower.',
  'Spend an emblem from your pack (its Spend verb) to unlock a skill or learn one faster. Shrines do not take emblems.',
]);

/** The tips that only make sense in an Android browser. */
const ANDROID_TIP = /^On Android\b/;

const whole = (n) => Math.max(0, Math.floor(Number(n) || 0));

/** "2h 04m", "12m", "45s": the study chip's time, short. */
export function studyLeft(seconds) {
  const s = whole(seconds);
  if (s >= 3600) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${String(m).padStart(2, '0')}m`;
  }
  if (s >= 60) return `${Math.ceil(s / 60)}m`;
  return `${s}s`;
}

/** Started, unfinished badges you can see, with one counter: the ones a single line can describe. */
export function badgeCandidates(rows = []) {
  const out = [];
  for (const row of rows) {
    const def = row?.def;
    if (!def || row.unlocked || def.isSecret) continue;
    const conds = (row.conditions || []).filter((c) => c && c.type === 'counter');
    if (conds.length !== 1 || (row.conditions || []).length !== 1) continue;
    const goal = whole(conds[0].num);
    const current = Math.min(goal, whole(conds[0].current));
    if (goal < 2 || current < 1 || current >= goal) continue;
    out.push({ classTsid: def.classTsid, name: def.name || def.classTsid, desc: def.desc || '', current, goal });
  }
  return out;
}

/**
 * The nudge. Badges first: the one with the most of its way done (ties: fewer to go, then name),
 * at least a third done so it is a real nudge. Then the newest quest's first unfinished step.
 * Returns { kind, kicker, lead, name, after, id } (plain strings, drawn with textContent: lead, the name
 * in bold, after) or null.
 */
export function pickNudge({ badges = [], quests = [] } = {}) {
  const ranked = badges
    .filter((b) => b.current / b.goal >= 1 / 3)
    .sort((a, b) => b.current / b.goal - a.current / a.goal || (a.goal - a.current) - (b.goal - b.current) || a.name.localeCompare(b.name));
  const badge = ranked[0];
  if (badge) {
    const left = badge.goal - badge.current;
    const desc = badge.desc ? `${badge.desc.charAt(0).toLowerCase()}${badge.desc.slice(1).replace(/\.$/, '')}, ` : '';
    return {
      kind: 'badge',
      kicker: 'An idea pops into your head',
      lead: `${left.toLocaleString()} more for `,
      name: badge.name,
      after: ` (${desc}${badge.current.toLocaleString()} so far).`,
      id: badge.classTsid,
    };
  }
  for (const q of quests) {
    const step = (q.requirements || []).find((r) => r.total > 0 && r.current < r.total);
    if (!step) continue;
    return {
      kind: 'quest',
      kicker: 'A Giant whispers to you',
      lead: '',
      name: q.title,
      after: `: ${step.desc}, ${step.current.toLocaleString()} of ${step.total.toLocaleString()}.`,
      id: q.classTsid,
    };
  }
  return null;
}

/**
 * The skill tile. study: engine.skillStudyNow().learning ({ name, classTsid, remainingSeconds, progress })
 * or null; available: how many skills can be started now.
 */
export function skillTile(study, available = 0) {
  if (study) {
    return {
      state: 'learning',
      title: `Learning ${study.name}`,
      sub: `${studyLeft(study.remainingSeconds)} left`,
      progress: Math.max(0, Math.min(1, Number(study.progress) || 0)),
      classTsid: study.classTsid,
      action: '',
    };
  }
  const n = whole(available);
  return {
    state: 'idle',
    title: 'Not learning a skill',
    sub: n ? `Skills keep learning while you are away. ${n} ready to start.` : 'Skills keep learning while you are away.',
    progress: null,
    classTsid: '',
    action: n ? 'Start learning' : '',
  };
}

/** "ends in 12 hours" from an end time. */
function endsIn(end, now) {
  const left = Math.max(0, whole(end) - whole(now));
  if (!left) return 'ending now';
  const minutes = Math.ceil(left / 60_000);
  if (minutes < 90) return `ends in ${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.round(minutes / 60);
  return `ends in ${hours} hour${hours === 1 ? '' : 's'}`;
}

/**
 * The Feat tile from featSummary: { mode: 'world', title, what, total, goal, end } online (today's
 * shared Feat), { mode: 'world', waiting: true } before the server names it, { mode: 'solo', title,
 * what, value, goal } for your nearest personal Feat, { mode: 'solo', allDone: true } when every one
 * is done. null hides the tile.
 */
export function featTile(summary, now = Date.now()) {
  if (!summary) return null;
  if (summary.mode === 'world') {
    if (summary.waiting) return { title: 'Today’s Feat', sub: 'Asking Ur what today’s Feat is…', progress: null, action: '' };
    const total = whole(summary.total);
    const goal = whole(summary.goal);
    let bits = [goal ? `${total.toLocaleString()} of ${goal.toLocaleString()}` : '', summary.end ? endsIn(summary.end, now) : ''].filter(Boolean).join(' · ');
    if (bits) bits = `${bits.charAt(0).toUpperCase()}${bits.slice(1)}.`;
    return {
      title: `Today’s Feat: ${summary.title}`,
      sub: [summary.what, bits].filter(Boolean).join(' '),
      progress: goal ? Math.min(1, total / goal) : null,
      action: 'How to help',
    };
  }
  if (summary.allDone) return { title: 'Your Feats', sub: 'Every Feat is done for now. They open again a game week after you finish them.', progress: null, action: 'See Feats' };
  const value = whole(summary.value);
  const goal = whole(summary.goal);
  return {
    title: `Feat: ${summary.title}`,
    sub: [summary.what, goal ? `${value.toLocaleString()} of ${goal.toLocaleString()}.` : ''].filter(Boolean).join(' '),
    progress: goal ? Math.min(1, value / goal) : null,
    action: 'See Feats',
  };
}

/**
 * One tip for this visit; on a phone (no keyboard) only the tips that name no key, and the Android
 * install tip only where `android` (an Android browser, not already the installed app).
 */
export function pickTip(rng = Math.random, { touch = false, android = false } = {}) {
  const pool = START_TIPS.filter((t) => (!touch || !/^(Press|Hold)\b/.test(t)) && (android || !ANDROID_TIP.test(t)));
  const i = Math.min(pool.length - 1, Math.floor(Math.max(0, Number(rng()) || 0) * pool.length));
  return pool[i];
}

/** The tip as shown: on a phone you tap your currants, you do not click them. */
export function tipText(tip, { touch = false } = {}) {
  const text = String(tip || '');
  return touch ? text.replace(/^Click\b/, 'Tap') : text;
}

/** PURE: an Android browser, not the game already installed as an app (display-mode standalone). */
export function androidBrowser(ua = '', standalone = false) {
  return /Android/.test(String(ua)) && !standalone;
}
