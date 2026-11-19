// R28 (#519): one way to wait for the save. An online action that must be in the stored save first
// (so the site's ledger has seen it) waits through savedThrough (js/save-store.js), which counts
// writes the site accepted after the change. Twelve features each copied a loop that flushed and
// waited for the state to read "saved"; the walking autosave keeps a busy save going saving,
// pending, saving, so those loops gave up and the player was told the save failed. This scan fails
// on any comparison of a save state with 'saved' outside save-store.js.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const pub = join(here, '../public');

/** Every game script: game.js plus public/js. */
function gameScripts() {
  const out = [join(pub, 'game.js')];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.js')) out.push(full);
    }
  };
  walk(join(pub, 'js'));
  return out;
}

/** Drop comments so doc lines may still name the old shape. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, '')).replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

// x === 'saved', x !== "saved", 'saved' === x (any equality test against the word).
const SAVED_TESTS = [/[=!]==?\s*(['"`])saved\1/g, /(['"`])saved\1\s*[=!]==?/g];
const OWNER = 'js/save-store.js';
/** Files that compare with 'saved' for another reason, and why. */
const ALLOWED = Object.freeze({
  // One flush before a reload that accepts "pending" too; it never waits in a loop.
  'js/update-check.js': 1,
  // The street builder's own draft status, not the game save.
  'js/builder/editor.js': 1,
});

function offenders(text, rel = 'x.js') {
  const out = [];
  code(text).split('\n').forEach((line, i) => {
    for (const re of SAVED_TESTS) for (const m of line.matchAll(re)) out.push(`${rel}:${i + 1} ${m[0]}`);
  });
  return out;
}

describe('R28 (#519): waiting for the save goes through savedThrough in js/save-store.js', () => {
  it('no game script compares a save state with "saved" outside save-store.js', () => {
    const found = [];
    const allowed = {};
    for (const file of gameScripts()) {
      const rel = relative(pub, file).split('\\').join('/');
      if (rel === OWNER) continue;
      const hits = offenders(readFileSync(file, 'utf8'), rel);
      if (ALLOWED[rel] != null) allowed[rel] = hits.length;
      else found.push(...hits);
    }
    assert.deepEqual(found, [], 'wait with savedThrough(saveStore) from js/save-store.js: a busy save never reads "saved"');
    assert.deepEqual(allowed, ALLOWED, 'the allowed files still have exactly their own check (drop an entry once it is gone)');
  });

  it('the scan catches the old loops, and leaves other uses of the word alone', () => {
    const old = [
      "    if (saveStore.state === 'saved') return true;",
      "  return saveStore.state === 'saved';",
      "    if (now === 'saved') return true;",
      '    if (store.state == "saved") break;',
      "  while (saveStore.state !== 'saved') await saveStore.flush();",
      "  if ('saved' === state) return;",
    ].join('\n');
    assert.equal(offenders(old).length, 6);
    const fine = [
      "  pill.dataset.state = 'saved';",
      "  return state || 'saved';",
      "  case 'saved': return 'Saved';",
      "  // if (saveStore.state === 'saved') in a comment",
      "  say(`x:${ok ? 'saved' : 'refused'}`);",
      '  return savedThrough(store);',
    ].join('\n');
    assert.deepEqual(offenders(fine), []);
  });

  it('every feature that waits for the save names savedThrough', () => {
    const features = ['trade', 'solo-feats', 'player-mail', 'home-street-mp', 'home-storage', 'boards-mp', 'drops-mp', 'mayhem', 'crowns', 'auctions', 'shared-gardens', 'shared-patches', 'street-jobs'];
    for (const name of features) {
      const src = code(readFileSync(join(pub, `js/features/${name}-feature.js`), 'utf8'));
      assert.match(src, /import \{[^}]*\bsavedThrough\b[^}]*\} from '\.\.\/save-store\.js/, `${name} imports savedThrough`);
      assert.match(src, /savedThrough\((?:saveStore|store)\)/, `${name} waits through it`);
    }
  });
});
