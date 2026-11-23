/**
 * Change name (register G1213, report #636), in the multiplayer Account panel
 * (features/account-backup-feature.js). Glitch's Account page had "Change name"
 * for 100 currants, about once in two months; Austin 2026-11-23: "1000 currants
 * and a month cooldown". The site decides everything (groddle-afternoon-site
 * src/CharacterName.php, groddle/v1/characters/name): the name rules a new
 * character has, nobody else holding the name, the 30 day wait and the cost,
 * taken from the character's ledger in the same transaction as the rename.
 *
 * - The section shows the name now, the price and the wait, and when the next
 *   change is allowed if it is not yet.
 * - Change name asks first, on the form itself: "Change your name from A to B
 *   for 1,000 currants?" with Yes and Cancel. Nothing is sent before Yes.
 * - The answer's receipt (a settled ledger move) is applied once through the
 *   trade slice's applied list (ledgerReceipt), so the purse loses the 1,000
 *   once and the save check agrees; a game that never applied it gets it at
 *   its next load (the site's Ledger::catchUp).
 * - Everyone else sees the new name at once: the site tells the realtime
 *   server, which tells every socket ({"t":"renamed"}, js/realtime-client.js).
 *
 * The site's refusals come back in its words (the wait says the date).
 */
import { characterNameProblem } from './account-forms.js?v=683e1475';

/** Austin 2026-11-23 (the site's CharacterName::COST and DAYS). */
export const RENAME_COST = 1000;
export const RENAME_DAYS = 30;

/** The section's words (plain remake copy, no em-dashes). */
export const CHANGE_NAME_COPY = Object.freeze({
  title: 'Change name',
  now: (name) => `Now: ${name}`,
  formerly: (old) => `Others see "formerly ${old}" on your profile for 30 days.`,
  help: (cost = RENAME_COST, days = RENAME_DAYS) => `Costs ${cost.toLocaleString('en-US')} currants. You can change it once every ${days} days.`,
  label: 'New name',
  submit: 'Change name',
  confirm: (from, to, cost = RENAME_COST, days = RENAME_DAYS) => `Change your name from ${from} to ${to} for ${cost.toLocaleString('en-US')} currants? You can't change it again for ${days} days.`,
  yes: 'Yes, change it',
  no: 'Cancel',
  busy: 'Changing…',
  done: (name, cost = RENAME_COST) => `You're ${name} now. ${cost.toLocaleString('en-US')} currants were taken from your purse.`,
  wait: (date) => `You can change your name again on ${date}.`,
  short: (have, cost = RENAME_COST) => `Changing your name costs ${cost.toLocaleString('en-US')} currants. You have ${Number(have || 0).toLocaleString('en-US')}.`,
  same: 'That is already your name.',
  failed: "Your name didn't change. Try again in a moment.",
});

/** A unix time as the date the site's words use (UTC, "December 23"). */
export function renameDate(unix) {
  return new Date(Number(unix) * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/**
 * What stops a change before anything is asked (pure): '' when it can go to the confirm step.
 * state: the site's GET answer ({ name, cost, nextAt, currants }); purse: the game's currants now.
 */
export function renameProblem(name, state, { purse = null, now = Date.now() / 1000 } = {}) {
  const n = String(name || '').trim().replace(/\s+/g, ' ');
  const bad = characterNameProblem(n);
  if (bad) return bad;
  if (state?.name && n === state.name) return CHANGE_NAME_COPY.same;
  if (state?.nextAt && Number(state.nextAt) > now) return CHANGE_NAME_COPY.wait(renameDate(state.nextAt));
  const cost = Number(state?.cost) || RENAME_COST;
  const have = Number.isFinite(Number(purse)) && purse !== null ? Number(purse) : Number(state?.currants);
  if (Number.isFinite(have) && have < cost) return CHANGE_NAME_COPY.short(have, cost);
  return '';
}

/**
 * Applies a successful rename to the game: the receipt once (the purse loses its currants, the save
 * keeps it), the name the boot data and the chat use, a toast. True when the receipt was applied now.
 */
export function applyRename(engine, r, { scope = globalThis } = {}) {
  const name = String(r?.player?.name || '');
  if (!name) return false;
  if (scope?.GRODDLE_MP_BOOT?.player) scope.GRODDLE_MP_BOOT.player.name = name;
  const op = String(r?.receipt?.op || '');
  const cost = Math.max(0, Math.floor(Number(r?.receipt?.gave?.currants) || 0));
  const applied = Boolean(op) && engine?.query?.('ledgerReceipt', op, engine) === true;
  if (applied && engine?.pc) engine.pc.currants = Math.max(0, (Number(engine.pc.currants) || 0) - cost);
  const line = CHANGE_NAME_COPY.done(name, cost || RENAME_COST);
  engine?.pushActivity?.(line);
  engine?.toast?.(line, 4200);
  engine?.setData?.('characterRenamed', name);
  engine?.refreshPack?.();
  engine?.save?.();
  return applied;
}

function el(doc, tag, attrs = {}, text = '') {
  const node = doc.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  if (text) node.textContent = text;
  return node;
}

let count = 0;

/**
 * Draws Change name into host (the Account panel). account: minn-account (nameChange, changeName);
 * engine: the game (purse, receipt, save); onRenamed({ name, was }) after a change.
 * Returns { root, ready } (ready resolves once the site's state is in).
 */
export function mountChangeName(host, { account, engine = null, onRenamed = () => {}, doc = globalThis.document, scope = globalThis } = {}) {
  const n = ++count;
  const root = el(doc, 'form', { class: 'acct-form acct-change-name', 'data-account-change-name': '', novalidate: true });
  const now = el(doc, 'p', { class: 'acct-message', 'data-change-name-now': '' });
  const formerly = el(doc, 'p', { class: 'acct-message', 'data-change-name-formerly': '', hidden: true });
  const wrap = el(doc, 'div', { class: 'acct-field' });
  const id = `acct-change-name-${n}`;
  const input = el(doc, 'input', { id, name: 'name', type: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '19', required: true, 'aria-describedby': `${id}-help ${id}-error`, 'data-change-name-input': '' });
  const help = el(doc, 'small', { id: `${id}-help` }, CHANGE_NAME_COPY.help());
  const error = el(doc, 'span', { class: 'acct-error', id: `${id}-error`, 'aria-live': 'polite' });
  wrap.append(el(doc, 'label', { for: id }, CHANGE_NAME_COPY.label), input, help, error);
  const submit = el(doc, 'button', { type: 'submit', class: 'acct-submit', 'data-change-name-submit': '' }, CHANGE_NAME_COPY.submit);
  const ask = el(doc, 'div', { class: 'acct-panel', role: 'group', 'data-change-name-confirm': '', hidden: true });
  const askText = el(doc, 'p', { 'data-change-name-confirm-text': '' });
  const yes = el(doc, 'button', { type: 'button', class: 'acct-submit', 'data-change-name-yes': '' }, CHANGE_NAME_COPY.yes);
  const no = el(doc, 'button', { type: 'button', class: 'acct-link', 'data-change-name-no': '' }, CHANGE_NAME_COPY.no);
  ask.append(askText, yes, no);
  const said = el(doc, 'p', { class: 'acct-message', role: 'status', 'aria-live': 'polite', 'data-change-name-said': '' });
  root.append(el(doc, 'strong', {}, CHANGE_NAME_COPY.title), now, formerly, wrap, submit, ask, said);
  host.append(root);

  let state = null;
  let wanted = '';
  const say = (text, tone = 'good') => {
    said.textContent = text;
    said.dataset.tone = tone;
  };
  const fieldError = (text) => {
    error.textContent = text;
    if (text) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  };
  const draw = () => {
    now.textContent = state?.name ? CHANGE_NAME_COPY.now(state.name) : '';
    help.textContent = CHANGE_NAME_COPY.help(Number(state?.cost) || RENAME_COST, Number(state?.days) || RENAME_DAYS);
    formerly.hidden = !state?.formerly;
    formerly.textContent = state?.formerly ? CHANGE_NAME_COPY.formerly(state.formerly) : '';
    const waiting = state?.nextAt && Number(state.nextAt) > Date.now() / 1000;
    if (waiting) say(CHANGE_NAME_COPY.wait(renameDate(state.nextAt)), 'bad');
    input.disabled = Boolean(waiting);
    submit.disabled = Boolean(waiting);
  };
  const showAsk = (on) => {
    ask.hidden = !on;
    submit.hidden = on;
    input.disabled = on;
  };

  const ready = (async () => {
    try {
      state = await account.nameChange();
    } catch {
      state = null;
    }
    draw();
  })();

  root.addEventListener('submit', (e) => {
    e.preventDefault();
    fieldError('');
    say('');
    const name = input.value.trim().replace(/\s+/g, ' ');
    const problem = renameProblem(name, state, { purse: engine?.pc ? Number(engine.pc.currants) || 0 : null });
    if (problem) {
      fieldError(problem);
      input.focus();
      return;
    }
    wanted = name;
    askText.textContent = CHANGE_NAME_COPY.confirm(state?.name || 'you', name, Number(state?.cost) || RENAME_COST, Number(state?.days) || RENAME_DAYS);
    showAsk(true);
    engine?.setData?.('changeNameStep', 'confirm');
    yes.focus();
  });
  no.addEventListener('click', () => {
    showAsk(false);
    engine?.setData?.('changeNameStep', 'cancelled');
    input.focus();
  });
  yes.addEventListener('click', async () => {
    if (yes.disabled) return;
    yes.disabled = true;
    no.disabled = true;
    yes.textContent = CHANGE_NAME_COPY.busy;
    let r;
    try {
      r = await account.changeName(wanted);
    } catch {
      r = { ok: false, message: CHANGE_NAME_COPY.failed };
    }
    yes.disabled = false;
    no.disabled = false;
    yes.textContent = CHANGE_NAME_COPY.yes;
    showAsk(false);
    if (!r?.ok) {
      if (r?.nextAt && state) state = { ...state, nextAt: r.nextAt };
      if (r?.fields?.name) fieldError(r.fields.name);
      else say(r?.message || CHANGE_NAME_COPY.failed, 'bad');
      engine?.setData?.('changeNameStep', `refused:${r?.code || ''}`);
      if (r?.nextAt) draw();
      return;
    }
    const was = state?.name || r.was || '';
    applyRename(engine, r, { scope });
    state = { ...(state || {}), name: r.player.name, nextAt: r.nextAt, formerly: was, currants: Math.max(0, (Number(state?.currants) || 0) - (Number(r.receipt?.gave?.currants) || 0)) };
    input.value = '';
    draw();
    say(CHANGE_NAME_COPY.done(r.player.name, Number(r.receipt?.gave?.currants) || RENAME_COST));
    engine?.setData?.('changeNameStep', 'done');
    onRenamed({ name: r.player.name, was });
  });
  return { root, ready };
}
