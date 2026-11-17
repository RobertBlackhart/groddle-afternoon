/**
 * G918 (#447, iPhone): "Let other apps' music keep playing", a Sound setting in the Sound popover
 * (js/ui/topbar.js installOtherMusic), shared by Modern and Classic.
 *
 * On iOS a playing <audio> element takes the phone's audio session for media playback, which
 * stops Spotify, a podcast or anything else playing. The street music streams through one such
 * element (game.js streetMusicVoice). Two parts:
 *   - for every player: no street music element exists while Mute is on or Music is at 0
 *     (streetMusicWanted), so a player who turned the music off keeps their own;
 *   - this setting: the game's own music stays off, effects keep playing, and where the browser
 *     has the Audio Session API (Safari 17 and later) the page asks for an 'ambient' session,
 *     which mixes with other apps' audio. On an iPhone an ambient session follows the silent
 *     switch, so the hint says the switch then mutes the game too. Off asks for 'auto' again.
 *
 * The 2012 client had no such setting (a Flash game shared the speakers with everything); this
 * is a phone-era addition. The choice is kept on this device with the other sound settings
 * (js/audio-pref.js loadOtherMusic / saveOtherMusic); this module holds no storage of its own.
 */

export const OTHER_MUSIC_LABEL = "Let other apps' music keep playing";
export const OTHER_MUSIC_HINT = "The game's music stays off and its effects still play. On an iPhone the silent switch then mutes the game too.";

/**
 * PURE: whether the street music element may exist and play: never while muted, at Music 0
 * (`music` 0..1 or 0..100) or with other apps' music let through.
 */
export function streetMusicWanted({ muted = false, music = 1, otherMusic = false } = {}) {
  const level = Number(music);
  return !muted && !otherMusic && Number.isFinite(level) && level > 0;
}

/**
 * Asks the browser for an 'ambient' audio session (mixes with other apps) when `on`, else 'auto'.
 * Feature-detected (navigator.audioSession, Safari 17+); elsewhere it does nothing.
 * Returns the type now set, or null where there is no such API.
 */
export function applyAudioSession(on, nav = globalThis.navigator) {
  const session = nav?.audioSession;
  if (!session || !('type' in session)) return null;
  const type = on ? 'ambient' : 'auto';
  try {
    if (session.type !== type) session.type = type;
    return session.type;
  } catch {
    return null;
  }
}
