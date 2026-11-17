/**
 * G892: the skill-package word in a thought bubble over another player at work
 * (js/skill-bubbles.js; players/inc_skill_packages.js 294-314).
 *
 * - Your timed pet, nibble, squeeze, milk, massage, scoop or revive (game.js
 *   verbStarted) sends sp_<overlay>_<seconds> on the emote message, online only;
 *   you see your own word progress bar, as the actor did in Glitch.
 * - Another player's word arrives as the realtime client's 'overlay' event, and the
 *   bubble stands over that player's Glitch for those seconds (a new word replaces it).
 * Solo has nobody else to see it.
 *
 * QA: &skillbubbledemo=1 also draws the bubble over your own Glitch, as the others see
 * it (&skillbubblehold=<ms> freezes it there). Canvas data: skillBubbleSent (the last
 * word sent or shown), skillBubbles (bubbles drawn over others).
 */

import { actionDurationFor } from '../action-timing.js?v=b6ce9561';
import { parseSkillBubbleWord, playSkillBubble, skillBubbleFor, skillBubbleWord } from '../skill-bubbles.js?v=5805a64a';

export const SKILL_BUBBLES_FEATURE_ID = 'skill-bubbles';

/** Bubbles over other players (id -> handle), and the client listened to. */
const shown = new Map();
let watched = null;
let off = null;
let selfBubble = null;

function drop(id) {
  shown.get(id)?.stop();
  shown.delete(id);
}

/** Another player's word (the client's 'overlay' event); other overlay words are not ours. */
export function onSkillBubble(engine, { id, e }) {
  const parsed = parseSkillBubbleWord(e);
  if (!parsed) return false;
  const root = () => engine.query?.('remoteAvatar', id);
  if (!root()) return false;
  drop(id);
  const h = playSkillBubble(engine, parsed.key, () => { const r = root(); return r ? { x: r.x, y: r.y } : { x: 0, y: 0 }; }, { durationMs: parsed.durationMs, alive: () => Boolean(root()) });
  shown.set(id, h);
  h.done?.then(() => { if (shown.get(id) === h) shown.delete(id); });
  engine.setData?.('skillBubbles', String(shown.size));
  return true;
}

function watch(engine) {
  const client = engine.mode === 'multiplayer' ? engine.query?.('realtimeClient') : null;
  if (client === watched) return;
  off?.();
  off = null;
  for (const id of [...shown.keys()]) drop(id);
  watched = client;
  if (client?.on) off = client.on('overlay', (msg) => onSkillBubble(engine, msg));
}

export const skillBubblesFeature = {
  id: SKILL_BUBBLES_FEATURE_ID,

  onTick(dtMs, now, engine) {
    watch(engine);
  },

  onStreetClear() {
    for (const id of [...shown.keys()]) drop(id);
    selfBubble?.stop();
    selfBubble = null;
  },

  /** game.js beginVerbAction: a timed verb began (runSkillPackage's bubble to the others). */
  verbStarted(target, verb, engine) {
    const key = skillBubbleFor(target?.classId, verb?.id);
    if (!key) return undefined;
    const ms = Number.isFinite(verb.durationMs) ? Math.max(0, Number(verb.durationMs)) : actionDurationFor(target.classId, verb.id);
    if (!(ms > 0)) return undefined;
    const word = skillBubbleWord(key, ms);
    const client = engine.mode === 'multiplayer' ? engine.query?.('realtimeClient') : null;
    if (client?.emote?.(word)) engine.setData?.('skillBubbleSent', word);
    if (engine.param?.('skillbubbledemo') === '1') {
      selfBubble?.stop();
      const hold = engine.param?.('skillbubblehold');
      selfBubble = playSkillBubble(engine, key, () => ({ x: engine.player?.x || 0, y: engine.player?.y || 0 }), {
        durationMs: hold ? 0 : ms,
        holdMs: hold ? Number(hold) || 0 : null,
      });
      engine.setData?.('skillBubbleSent', word);
    }
    return undefined;
  },
};
