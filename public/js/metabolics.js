/**
 * Metabolic maximums (players/inc_metabolics.js metabolics_recalc_limits):
 * energy and mood share one maximum, the imagination-era tank
 * (metabolics_calc_max returns metabolics_get_tank()). The remake keeps the
 * tank in pc.energyMax (100 plus Energy Tank cards), so mood tops out there too.
 */
export function moodMax(pc) {
  return Math.max(100, Number(pc?.energyMax) || 100);
}

export function energyMax(pc) {
  return Math.max(100, Number(pc?.energyMax) || 100);
}

/**
 * G213: the one door every energy or mood gain goes through, as in the
 * source: players/inc_metabolics.js metabolics_add_energy 40-53 refuses a
 * gain while dead ("You would have gained energy, but you're dead!") or
 * Super Pooped ("... but you're super pooped!"), and metabolics_add_mood
 * 79-86 while dead, sending that line unless quiet. (metabolics_try_inc 373,
 * which the register cited, has no callers.) game.js installs the feature
 * host's metabolicGate here (features/hell-feature.js); quoins, quoin shards
 * and quest and badge rewards ask before they add.
 */
let gainGate = null;

/** fn(stat, { quiet }) -> { ok: false, msg } blocks; anything else allows. */
export function setMetabolicGainGate(fn) {
  gainGate = typeof fn === 'function' ? fn : null;
}

/** May an `energy` or `mood` gain land now? Returns `{ ok, msg }`. */
export function metabolicGain(stat, { quiet = false } = {}) {
  if (!gainGate || (stat !== 'energy' && stat !== 'mood')) return { ok: true, msg: null };
  const gate = gainGate(stat, { quiet });
  return gate && gate.ok === false ? { ok: false, msg: gate.msg || null } : { ok: true, msg: null };
}

/**
 * G289: the loss side. players/inc_metabolics.js metabolics_lose_energy
 * 108-122 and metabolics_lose_mood 180-194 return 0 (nothing lost) in the
 * newxp_intro / newxp_training1 instances (unless forced; no remake caller
 * forces), and while dead,
 * sending "You would have lost energy, but you're dead!" ("... lost some
 * mood ...") unless quiet. Pooped and Super Pooped never refuse a loss.
 * game.js installs the feature host's metabolicGate(stat, 'loss') here
 * (hell-feature for the dead, newxp-feature for the two intro scenes), and
 * every verb energy cost spends through loseEnergy().
 */
let lossGate = null;

/** fn(stat, { quiet }) -> { ok: false, msg } refuses a loss; anything else allows. */
export function setMetabolicLossGate(fn) {
  lossGate = typeof fn === 'function' ? fn : null;
}

/** May an `energy` or `mood` loss land now? Returns `{ ok, msg }`. */
export function metabolicLoss(stat, { quiet = false } = {}) {
  if (!lossGate || (stat !== 'energy' && stat !== 'mood')) return { ok: true, msg: null };
  const gate = lossGate(stat, { quiet });
  return gate && gate.ok === false ? { ok: false, msg: gate.msg || null } : { ok: true, msg: null };
}

let moodLossNotice = null;

/**
 * inc_metabolics.js 205-213: after a mood loss at or under 50% (20%) of the tank the player reads
 * "Your mood is getting low..." ("very low!"). fn(pc) says it; the idle loss passes noWarn and
 * says it once per crossing itself (js/mood-decay.js moodWarningFor).
 */
export function setMoodLossNotice(fn) {
  moodLossNotice = typeof fn === 'function' ? fn : null;
}

function spend(pc, stat, amount, opts) {
  const x = Math.max(0, Number(amount) || 0);
  if (!pc || !x) return 0;
  if (!metabolicLoss(stat, opts).ok) return 0;
  const before = Math.max(0, Number(pc[stat]) || 0);
  // Property.apiDec stops at the bottom (eleven-server src/model/Property.js).
  pc[stat] = Math.max(0, before - x);
  if (stat === 'mood' && !opts?.noWarn && moodLossNotice) moodLossNotice(pc);
  return before - pc[stat];
}

/** metabolics_lose_energy(x): spends through the loss gate; returns what was lost. */
export function loseEnergy(pc, amount, opts = {}) {
  return spend(pc, 'energy', amount, opts);
}

/** metabolics_lose_mood(x): spends through the loss gate; returns what was lost. */
export function loseMood(pc, amount, opts = {}) {
  return spend(pc, 'mood', amount, opts);
}

/**
 * metabolics_add_energy(x) / metabolics_add_mood(x): a gain through the gain
 * gate, capped at the tank (metabolics_calc_max is the tank, never a flat
 * 100). Returns what landed.
 */
export function gainMetabolic(pc, stat, amount, opts = {}) {
  const x = Math.max(0, Number(amount) || 0);
  if (!pc || !x || (stat !== 'energy' && stat !== 'mood')) return 0;
  if (!metabolicGain(stat, opts).ok) return 0;
  const top = stat === 'energy' ? energyMax(pc) : moodMax(pc);
  const before = Math.max(0, Number(pc[stat]) || 0);
  pc[stat] = Math.max(before, Math.min(top, before + x));
  return pc[stat] - before;
}

/** metabolics_lose_energy / _lose_mood by name: spends through the loss door; returns what was lost. */
export function spendMetabolic(pc, stat, amount, opts = {}) {
  if (stat !== 'energy' && stat !== 'mood') return 0;
  return spend(pc, stat, amount, opts);
}

/**
 * G300: a signed catalog delta (buff ticks, drinks, spices, gases): a rise
 * goes through gainMetabolic (metabolics_add_*), a fall through
 * loseEnergy / loseMood (metabolics_lose_*), as the source branches on the
 * sign (items/include/drink.js 65-106). Returns the signed change that landed.
 */
export function shiftMetabolic(pc, stat, delta, opts = {}) {
  const x = Number(delta) || 0;
  if (stat !== 'energy' && stat !== 'mood') return 0;
  if (x > 0) return gainMetabolic(pc, stat, x, opts);
  if (x < 0) return 0 - spend(pc, stat, -x, opts);
  return 0;
}

const topOf = (pc, stat) => (stat === 'energy' ? energyMax(pc) : moodMax(pc));

/**
 * G970 (root R13): metabolics_set_energy / _set_mood (inc_metabolics.js 230-264). The value is
 * capped at the tank and the difference goes through the gain or the loss door, so the dead gain
 * nothing and Super Pooped no energy, as in the source. Returns the signed change that landed.
 */
export function setMetabolic(pc, stat, value, opts = {}) {
  if (!pc || (stat !== 'energy' && stat !== 'mood')) return 0;
  const target = Math.max(0, Math.min(topOf(pc, stat), Number(value) || 0));
  return shiftMetabolic(pc, stat, target - Math.max(0, Number(pc[stat]) || 0), opts);
}

/**
 * G970: a write past both doors (Property.apiSet / apiSetVal in the source), for what the source
 * writes raw or forces: dying empties both tanks, a resurrection or a new day sets them, a new
 * Energy Tank card refills them, a tutorial scene sets its starting meters (newxp_training2.js 98,
 * metabolics_set_* with force), and QA hooks set theirs. Clamped to 0..tank; `overTank` lets a QA
 * hook top up past the tank for a long headless run. Returns the signed change.
 */
export function forceMetabolic(pc, stat, value, { overTank = false } = {}) {
  if (!pc || (stat !== 'energy' && stat !== 'mood')) return 0;
  const before = Number(pc[stat]) || 0;
  const v = Math.max(0, Number(value) || 0);
  pc[stat] = overTank ? v : Math.min(topOf(pc, stat), v);
  return pc[stat] - before;
}

/** G970: QA kit top-up: raise a stat to at least `floor` past both doors, never lowering it. */
export function topUpMetabolic(pc, stat, floor, opts = {}) {
  if (!pc || (Number(pc[stat]) || 0) >= floor) return 0;
  return forceMetabolic(pc, stat, floor, opts);
}
