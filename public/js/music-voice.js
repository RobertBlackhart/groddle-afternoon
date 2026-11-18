/**
 * The street music voice (game.js streetMusicVoice builds its element, source node and gain): one
 * track that plays as exactly ONE copy.
 *
 * A track streams from an <audio> element through a MediaElementSource into the music bus. A short
 * loop (60 s or less) hands over to a decoded AudioBuffer once it has one, because an element's loop
 * leaves a gap at the seam. #504 (root R25): the hand-over only paused the element, once; Safari
 * may ignore or undo that pause (a pause during a pending play(), a resume after an interruption),
 * and then the element and the buffer played the track together, almost in step. So the hand-over
 * takes the element out for good: its node is disconnected from the gain and its src dropped
 * (which also aborts a pending play()), and play() on a handed-over voice does nothing: the buffer
 * runs on the AudioContext, so resuming the context brings it back (js/audio-resume.js).
 */

/**
 * el: the <audio> element; node: its MediaElementSource (connected to gain); gain: the voice's
 * GainNode; ctx: the AudioContext; win: where the autoplay retry listens (window).
 */
export function createMusicVoice({ url, el, node, gain, ctx, win = globalThis.window }) {
  const voice = {
    url,
    el,
    gain,
    stopped: false,
    /** The decoded loop that took over from the element (#504), or null. */
    looper: null,
    /** The looper's start: ctx time and offset into the buffer, for time(). */
    loopFrom: null,
    /** Plays the element: only while the voice streams (never stopped, never handed over). */
    play() {
      if (voice.stopped || voice.looper) return false;
      const started = el.play();
      // Autoplay refused before the first click or key: start on the next one.
      started?.catch?.(() => {
        const retry = () => {
          if (!voice.stopped && !voice.looper && el.paused) el.play()?.catch?.(() => {});
        };
        // A tap on an iPhone is a gesture when it ends (touchend), not when it starts.
        for (const type of ['pointerdown', 'keydown', 'touchend']) win?.addEventListener?.(type, retry, { once: true, capture: true });
      });
      return true;
    },
    /**
     * #504: the buffer takes over at the element's point and the element goes for good. False when
     * the voice is stopped or already handed over (nothing changes).
     */
    handOver(buffer) {
      if (voice.stopped || voice.looper || !buffer) return false;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(gain);
      const offset = (el.currentTime || 0) % buffer.duration;
      src.start(0, offset);
      voice.looper = src;
      voice.loopFrom = { at: ctx.currentTime, offset };
      silence();
      return true;
    },
    /** Where the track is, in seconds (the looper's place once it has taken over). */
    time() {
      if (voice.looper && voice.loopFrom) {
        const d = voice.looper.buffer?.duration || 0;
        const t = voice.loopFrom.offset + Math.max(0, ctx.currentTime - voice.loopFrom.at);
        return d > 0 ? t % d : t;
      }
      return el.currentTime || 0;
    },
    stop(afterSec = 0) {
      voice.stopped = true;
      setTimeout(() => {
        silence();
        try { voice.looper?.stop(); } catch { /* ended */ }
        try { gain.disconnect(); } catch { /* */ }
      }, Math.max(0, afterSec) * 1000);
    },
  };
  function silence() {
    try { node?.disconnect(); } catch { /* already */ }
    try { el.pause(); } catch { /* */ }
    el.removeAttribute?.('src');
    try { el.load?.(); } catch { /* */ }
  }
  return voice;
}
