/**
 * Which game build wrote a save (G737). A tab left open across a release would write back a whole
 * save without the fields the newer build added. So each save names the build that wrote it
 * ({ id, at }: the play page's stamp, tools/deploy/build-id.mjs, at being the build's commit time
 * in seconds), and a page of a different, older build never writes over a save a newer one stored.
 * Only a newer build's save can carry fields an older one would drop, so that is the whole rule:
 * the same build always writes (two tabs), and so does a newer one (the first save after a release).
 *
 * The same rule runs in three places: the site's multiplayer save route (groddle-afternoon-site
 * src/SaveShape.php olderBuild, a 409 groddle_save_outdated), the multiplayer store at boot
 * (js/save-store.js), and solo in game.js against this browser's stored save.
 * A page with no stamp (a QA server on the repo) names no build.
 */

const BUILD_ID = /^[0-9a-f]{1,40}$/;

/** A build stamp as saves keep it: { id, at } or null. */
export function cleanBuild(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !BUILD_ID.test(value.id)) return null;
  const at = Number(value.at);
  return { id: value.id, at: Number.isInteger(at) && at > 0 ? at : 0 };
}

/** This page's build from its stamp (<meta name="groddle-build" content data-at>), or null. */
export function pageBuild(doc = globalThis.document) {
  const meta = doc?.querySelector?.('meta[name="groddle-build"]');
  if (!meta) return null;
  return cleanBuild({ id: String(meta.getAttribute?.('content') || '').trim(), at: Number(meta.getAttribute?.('data-at')) });
}

/**
 * Whether a page of build `incoming` must not write over a save stored by build `stored`: the
 * stored save names a build with a time, the page names another one (or none), and it is not newer.
 */
export function buildRefuses(stored, incoming) {
  const s = cleanBuild(stored);
  if (!s || s.at <= 0) return false;
  const i = cleanBuild(incoming);
  if (i && i.id === s.id) return false;
  return (i?.at || 0) < s.at;
}

const STAMP_HEAD = /^\{"version":\d+,"build":\{"id":"([0-9a-f]{1,40})","at":(\d{1,12})\}/;

/**
 * The build a stored player state names (js/player-save.js writes it right after the version), read
 * from its head without parsing the rest, or null.
 */
export function saveStampOf(raw) {
  if (typeof raw !== 'string') return null;
  const m = STAMP_HEAD.exec(raw);
  return m ? { id: m[1], at: Number(m[2]) } : null;
}
