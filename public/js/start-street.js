/**
 * #349: the start card's "You start on <street>." named Hechey Track, written into the page, whatever
 * street the save starts on (a player starting on Froughtful Fen read Hechey Track). The street loads
 * under the card, so its nameplate (#street-name) already says where you start: the line follows it
 * while the card is up, and stays out (the goals end at "Triple Jump.") until a street has a name, and
 * while the card offers the tutorial (#newxp-start, features/newxp-feature.js): that starts in the
 * clouds, and its own words say so.
 *
 *   mountStartStreet({ doc, Observer })   watches #street-name; returns stop()
 *   startStreetName(text)                 PURE: the street of a nameplate's text ("Fen · Region · 1:33 PM")
 */

/** PURE: the street alone from the nameplate's text; '' while it has none ("…" while loading). */
export function startStreetName(text) {
  const street = String(text || '').split('·')[0].replace(/\s+/g, ' ').trim();
  return /^(…|\.\.\.)?$/.test(street) ? '' : street;
}

/** Fills #start-street from #street-name now and on every change; stop() ends it (the card closed). */
export function mountStartStreet({ doc = globalThis.document, Observer = globalThis.MutationObserver } = {}) {
  const line = doc?.getElementById?.('start-street-line');
  const slot = doc?.getElementById?.('start-street');
  const plate = doc?.getElementById?.('street-name');
  if (!line || !slot || !plate) return () => {};
  const sync = () => {
    const name = startStreetName(plate.textContent);
    if (slot.textContent !== name) slot.textContent = name;
    line.hidden = !name || Boolean(doc.getElementById('newxp-start'));
  };
  sync();
  if (typeof Observer !== 'function') return () => {};
  const watch = new Observer(sync);
  watch.observe(plate, { childList: true, characterData: true, subtree: true });
  const actions = line.closest?.('.start-card')?.querySelector?.('.start-actions');
  if (actions) watch.observe(actions, { childList: true, subtree: true });
  return () => watch.disconnect();
}
