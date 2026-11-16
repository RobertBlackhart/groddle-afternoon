/**
 * G862 (#420): with a full pack, Buy is refused with Glitch's line (inc_stores.js:170-173, PACK_COPY.buyNone),
 * but on a phone the notice waits behind the open shop (js/notify-view.js noRoomBeside) and shows only after
 * it closes. The count pop says the reason itself on a phone, until the count or the item changes.
 * Run: node --test tests/vendor-refusal-phone.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');
const css = readFileSync(join(root, 'public/style.css'), 'utf8');
const notify = readFileSync(join(root, 'public/js/notify-view.js'), 'utf8');

describe('G862: a refused buy says why inside the shop on a phone', () => {
  it('the Buy click keeps the refusal for the item and tab, and still raises the notice', () => {
    assert.match(game, /vendorRefusal = r\.ok \? null : \{ tsid: vendorSelected, tab: vendorTab, text: String\(r\.msgs\[0\] \|\| ''\) \};\n\s*toast\(r\.msgs\[0\]\);/);
    assert.match(game, /\? \{ ok: false, reason: 'pack_full', msgs: \[PACK_COPY\.buyNone\] \}/);
  });
  it('the pop draws it as an alert, escaped; a count change, another item or the shelf clears it', () => {
    assert.match(game, /\$\{vendorRefusal \? `\n\s*<p class="vendor-refusal" role="alert">\$\{escapeHtml\(vendorRefusal\.text\)\}<\/p>` : ''\}/);
    assert.match(game, /if \(vendorRefusal && \(vendorRefusal\.tsid !== vendorSelected \|\| vendorRefusal\.tab !== vendorTab\)\) vendorRefusal = null;\n\s*if \(detail && vendorSelected\) \{/);
    assert.match(game, /const applyQ = \(n\) => \{\n\s*vendorQty = Math\.max\(1, Math\.min\(maxQ, n\)\);\n\s*vendorRefusal = null;/);
  });
  it('shown only in a phone\'s modern pop, where the notice waits; hidden everywhere else', () => {
    assert.match(css, /#vendor-panel \.vendor-refusal \{ display: none; \}/);
    assert.match(css, /:root\.touch-phone\[data-ui="modern"\] #vendor-panel \.vendor-detail\.count-pop \.vendor-refusal \{\n\s*display: block;/);
    assert.match(notify, /if \(noRoomBeside\(zones\.rootW, room\)\) \{\n\s*place = \{ dy: 0, wait: true \};/);
  });
});
