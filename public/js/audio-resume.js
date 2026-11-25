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
 *
 * #660 (root R25): on an iPad, music the system stopped while the browser was minimized came back
 * faster than it should, more so some times than others. The old element and its MediaElementSource
 * were played again as they were; WebKit can carry them on at the wrong rate after the audio
 * session comes back (not reproduced on Linux WebKit, which has no iOS audio session). So when the
 * page comes back from a background in which its audio stopped (the context left "running", or the
 * element was paused), the music is rebuilt instead: a new element and source node at the same
 * place in the track, once the context runs again (rebuildVoice). Music that played on through the
 * background (Android, a desktop tab) is left as it is. The Flash client's music never changed
 * speed (SoundMaster played it through Flash's own mixer).
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
 * Returns { ctx, el }: resume the context, play the element. back (#660): the page is coming back
 * from a background in which its audio stopped (stopped: the context left "running" while away);
 * then a live voice is rebuilt ({ ctx, el: false, rebuild: true }) rather than played as it was.
 */
export function audioResumePlan({ ctxState = '', muted = false, hidden = false, voice = null, back = false, stopped = false } = {}) {
  if (muted || hidden) return { ctx: false, el: false };
  const ctx = contextNeedsResume(ctxState);
  const live = Boolean(voice && !voice.stopped && voice.el);
  const el = Boolean(live && !voice.looper && voice.el.paused && !voice.el.ended);
  if (back && live && (ctx || el || stopped)) return { ctx, el: false, rebuild: true };
  return { ctx, el };
}

/**
 * Wires the one resume path. getCtx/getVoice/isMuted read the game's live state; rebuildVoice
 * (optional, #660) makes the street music again at the same place; onResume (optional) hears what
 * was tried. Returns { resume, dispose }: resume() runs the plan now.
 */
export function createAudioResumer({ getCtx, getVoice, isMuted, rebuildVoice = null, doc = globalThis.document, win = globalThis.window, onResume = null } = {}) {
  let busy = false;
  // #660: the page went to the background (away), and whether its context left "running" there.
  let away = false;
  let awayCtx = null;
  let ctxStopped = false;
  const onCtxState = () => { if (awayCtx && awayCtx.state !== 'running') ctxStopped = true; };
  const watchCtx = (ctx) => {
    if (awayCtx === ctx) return;
    awayCtx?.removeEventListener?.('statechange', onCtxState);
    awayCtx = ctx;
    awayCtx?.addEventListener?.('statechange', onCtxState);
  };
  const settle = () => {
    away = false;
    ctxStopped = false;
    watchCtx(null);
  };
  async function resume(reason = '') {
    if (busy) return null;
    const ctx = getCtx?.() || null;
    const voice = getVoice?.() || null;
    const hidden = doc?.visibilityState === 'hidden';
    if (hidden) {
      if (!away) {
        away = true;
        ctxStopped = Boolean(ctx && ctx.state !== 'running');
      }
      watchCtx(ctx);
    }
    const back = Boolean(rebuildVoice) && away;
    const plan = audioResumePlan({ ctxState: ctx?.state, muted: Boolean(isMuted?.()), hidden, voice, back, stopped: ctxStopped });
    if (!plan.ctx && !plan.el && !plan.rebuild) {
      // Back, and the music played on through the background (or there is none): nothing to mend.
      if (!hidden) settle();
      return plan;
    }
    busy = true;
    try {
      if (plan.ctx) {
        try { await ctx.resume(); } catch { /* still interrupted: the next event tries again */ }
      }
      if (plan.rebuild) {
        // Once the context runs again: a new element would otherwise start its clock on a stopped graph.
        if (!ctx || ctx.state === 'running') {
          settle();
          rebuildVoice(voice);
        }
      } else if (plan.el && voice.play) voice.play();
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
      watchCtx(null);
      for (const [target, type, fn] of handlers.splice(0)) target.removeEventListener(type, fn, { capture: true });
    },
  };
}
