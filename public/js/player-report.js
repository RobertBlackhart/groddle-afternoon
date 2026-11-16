/**
 * Report a player (register G872, report #417, Austin 2026-11-16: "public chat only, never IMs").
 * Multiplayer only: Report on another player's menu (js/buddies.js buddyVerbs, under Block), from
 * their Glitch or from a list (a chat name, a Who's here row, a buddy row), never on yourself, and
 * beside Block on the Buddies panel's Added you rows. Glitch had Report Abuse in the chat menu (glitch-client
 * ChatDropdown.as 77) and Block / Report on the player menu (GSJS main.js 3590-3601; the client's
 * three-way confirm, InteractionMenuController.as 869-875), then a window: "You are reporting abuse
 * from <name>. Please provide as much detail as you can." with "Your report:", cancel and report
 * (TSFrontController.as startReportAbuseDialog 2645-2680), and "Reported! Thanks for taking the
 * time to make this report." (reportConfirm 2565-2590).
 *
 * The window here: an optional short note, and Send report as the confirm (nothing goes before it).
 * The site (groddle-afternoon-site src/PlayerReports.php, POST groddle/v1/players/{id}/report) asks
 * the realtime server for the public chat the reporter could see in the last 30 minutes (street,
 * Global, Live Help, Trade and party lines; reports.go) and makes a ticket that shows in the
 * reporter's Reports. Nothing here reads or sends a chat line: the game never sends an IM's words.
 *
 * Pure (no DOM): buddies-feature opens js/note-view.js openReportView with playerReportView's options.
 * QA: canvas data playerReport (open:<id>, sent:<id>:<ticket>, refused:<code>).
 */

/** A note's length (PlayerReports::NOTE_MAX). */
export const PLAYER_REPORT_NOTE_MAX = 500;

export const PLAYER_REPORT_TEXT = Object.freeze({
  verb: 'Report',
  tip: (name) => `Report ${name} to the administrators`,
  kicker: 'Report a player',
  title: (name) => `Report ${name}?`,
  // TSFrontController.as 2672: "You are reporting abuse from <b>name</b>. Please provide as much detail as you can."
  label: (name) => `You are reporting ${name}. What happened? (You can leave this empty.)`,
  hint: 'The administrators get the public chat you could see in the last 30 minutes (street chat, Global, Live Help, Trade and party lines), never your IMs. It shows in your Reports.',
  send: 'Send report',
  sent: 'Reported! Thanks for taking the time to make this report.', // reportConfirm 2570
  failed: "That didn't send. Try again in a moment.",
});

/**
 * The report window's options (js/note-view.js openReportView) for player { id, name }, or null.
 * send(id, note) posts it (minn-account reportPlayer) and resolves the site's answer; a refusal
 * throws with the site's words, shown in the window so the player can cancel or try again.
 * @param {{ player: { id: number, name: string }, send: (id: number, note: string) => Promise<any>, engine?: any }} opts
 */
export function playerReportView({ player, send, engine } = {}) {
  const id = Number(player?.id) || 0;
  const name = String(player?.name || 'them');
  if (!id || typeof send !== 'function') return null;
  engine?.setData?.('playerReport', `open:${id}`);
  return {
    kicker: PLAYER_REPORT_TEXT.kicker,
    title: PLAYER_REPORT_TEXT.title(name),
    label: PLAYER_REPORT_TEXT.label(name),
    hint: PLAYER_REPORT_TEXT.hint,
    send: PLAYER_REPORT_TEXT.send,
    maxWhy: PLAYER_REPORT_NOTE_MAX,
    onSend: async (note) => {
      try {
        const out = await send(id, String(note || '').slice(0, PLAYER_REPORT_NOTE_MAX));
        engine?.setData?.('playerReport', `sent:${id}:${Number(out?.ticket) || 0}`);
        engine?.toast?.(PLAYER_REPORT_TEXT.sent, 4200);
        engine?.pushActivity?.(PLAYER_REPORT_TEXT.sent);
        return { ok: true };
      } catch (err) {
        engine?.setData?.('playerReport', `refused:${err?.code || err?.status || 'failed'}`);
        return { ok: false, text: err?.message || PLAYER_REPORT_TEXT.failed };
      }
    },
  };
}
