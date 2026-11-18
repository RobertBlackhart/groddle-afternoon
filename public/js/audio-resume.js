/**
 * G1000 (root R25): music and sounds come back after the page was away (AFK, another tab, a phone
 * call, the screen locked). One path brings both back:
 *
 *  - The AudioContext: Chrome and Firefox leave it "suspended" (autoplay, a long background), and
 *    Safari leaves it "interrupted" after a call, Siri or another app's audio, and does not resume
 *    it on its own. Either state is resumed (not "closed"; "running" needs nothing).
 *  - The street music <audio> element: the system pauses it with the interruption and nothing played
 *    it again. A streaming voice that is paused (not stopped, not ended) is played again.
 *  - A voice whose short loop has switched to its decoded buffer (#504) is never played as an
 *    element again: its buffer runs on the context, so resuming the context brings it back, and
 *    playing the element as well would sound the track twice.
 *
 * Tried when the page comes back (visibilitychange to visible, focus, pageshow) and on any gesture
 * (pointerdown, keydown, touchend: an iPhone tap is a gesture when it ends, G918), never while
 * muted (G918: a muted game makes no music element play) or while the page is hidden.
 */

/** Context states a resume() can bring back. */
export const RESUMABLE_CONTEXT = Object.freeze(['suspended', 'interrupted']);

/** Events that try again: the page coming back, and gestures (which browsers require to start audio). */
export const RESUME_EVENTS = Object.freeze({
  doc: Object.freeze(['visibilitychange']),
  win: Object.freeze(['focus', 'pageshow', 'pointerdown', 'keydown', 'touchend']),
});

/** Whether an AudioContext in this state should be resumed. */
export const contextNeedsResume = (ctxState) => RESUMABLE_CONTEXT.includes(String(ctxState || ''));

/**
 * What a resume should do, pure. voice: the street music voice ({ el, stopped, looper }) or null.
 * Returns { ctx, el }: resume the context, play the element.
 */
export function audioResumePlan({ ctxState = '', muted = false, hidden = false, voice = null } = {}) {
  if (muted || hidden) return { ctx: false, el: false };
  const el = Boolean(voice && !voice.stopped && !voice.looper && voice.el && voice.el.paused && !voice.el.ended);
  return { ctx: contextNeedsResume(ctxState), el };
}

/**
 * Wires the one resume path. getCtx/getVoice/isMuted read the game's live state; onResume (optional)
 * hears what was tried. Returns { resume, dispose }: resume() runs the plan now.
 */
export function createAudioResumer({ getCtx, getVoice, isMuted, doc = globalThis.document, win = globalThis.window, onResume = null } = {}) {
  let busy = false;
  async function resume(reason = '') {
    if (busy) return null;
    const ctx = getCtx?.() || null;
    const voice = getVoice?.() || null;
    const plan = audioResumePlan({ ctxState: ctx?.state, muted: Boolean(isMuted?.()), hidden: doc?.visibilityState === 'hidden', voice });
    if (!plan.ctx && !plan.el) return plan;
    busy = true;
    try {
      if (plan.ctx) {
        try { await ctx.resume(); } catch { /* still interrupted: the next event tries again */ }
      }
      if (plan.el && voice.play) voice.play();
    } finally {
      busy = false;
    }
    onResume?.(reason, plan);
    return plan;
  }
  const handlers = [];
  const on = (target, type) => {
    if (!target?.addEventListener) return;
    const fn = () => { resume(type); };
    target.addEventListener(type, fn, { capture: true });
    handlers.push([target, type, fn]);
  };
  for (const type of RESUME_EVENTS.doc) on(doc, type);
  for (const type of RESUME_EVENTS.win) on(win, type);
  return {
    resume,
    dispose() {
      for (const [target, type, fn] of handlers.splice(0)) target.removeEventListener(type, fn, { capture: true });
    },
  };
}
