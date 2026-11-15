/**
 * #349: the start card said "You start on Hechey Track" (fixed page text) to a player whose save
 * started on Froughtful Fen. js/start-street.js fills the line from the nameplate of the street
 * loading under the card, and leaves it out with no street yet or while the card offers the tutorial
 * (which starts in the clouds). Today's goals stay as they are (Austin's call).
 * Browser check (WebKit 874 x 402): a fresh save shows no street line beside the tutorial choice; the
 * same save reloaded reads "You start on Froughtful Fen.", and the card is one centred column.
 * Run: node --test tests/start-street.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mountStartStreet, startStreetName } from '../public/js/start-street.js?v=7d8ce49c';

/** The four elements the module reads, and an observer the test fires by hand. */
function fakePage(plateText) {
  const els = {
    'start-street-line': { hidden: true, closest: () => null },
    'start-street': { textContent: '' },
    'street-name': { textContent: plateText },
  };
  const doc = { getElementById: (id) => els[id] || null };
  const observers = [];
  class Observer { constructor(cb) { this.cb = cb; this.on = true; observers.push(this); } observe() {} disconnect() { this.on = false; } }
  const fire = () => { for (const o of observers) if (o.on) o.cb([]); };
  return { els, doc, Observer, fire };
}

describe('the start card names the street you start on', () => {
  it('reads the street from the nameplate', () => {
    assert.equal(startStreetName('Froughtful Fen · Shimla Mirch · 1:33 PM'), 'Froughtful Fen');
    assert.equal(startStreetName('  Hechey   Track '), 'Hechey Track');
    assert.equal(startStreetName('…'), '');
    assert.equal(startStreetName(''), '');
    assert.equal(startStreetName(null), '');
  });

  it('follows the street under the card, and stops when the card closes', () => {
    const { els, doc, Observer, fire } = fakePage('…');
    const stop = mountStartStreet({ doc, Observer });
    assert.equal(els['start-street-line'].hidden, true, 'nothing named while the street loads');
    els['street-name'].textContent = 'Froughtful Fen · Shimla Mirch';
    fire();
    assert.equal(els['start-street'].textContent, 'Froughtful Fen');
    assert.equal(els['start-street-line'].hidden, false);
    stop();
    els['street-name'].textContent = 'Palsa Mosch · Shimla Mirch';
    fire();
    assert.equal(els['start-street'].textContent, 'Froughtful Fen', 'the card is gone: the line no longer moves');
  });

  it('says nothing about a street while the card offers the tutorial', () => {
    const { els, doc, Observer, fire } = fakePage('Froughtful Fen · Shimla Mirch');
    mountStartStreet({ doc, Observer });
    assert.equal(els['start-street-line'].hidden, false);
    els['newxp-start'] = {};
    fire();
    assert.equal(els['start-street-line'].hidden, true);
  });

  it('the page no longer writes a street in, and Today\'s goals keep their words', () => {
    for (const page of ['public/play/index.html', 'public/play/online/index.html']) {
      const html = readFileSync(join(import.meta.dirname, '..', page), 'utf8');
      assert.doesNotMatch(html, /You start on <strong>Hechey Track/, page);
      assert.match(html, /for a Triple Jump\.<span id="start-street-line" hidden> You start on <strong id="start-street"><\/strong>\.<\/span><\/p>/, page);
      assert.match(html, /Today’s goals/, page);
    }
  });

  it('with the keys hidden on a phone the card is one column', () => {
    const css = readFileSync(join(import.meta.dirname, '../public/style.css'), 'utf8');
    assert.match(css, /:root\.touch-phone \.start-keys \{ display: none; \}\n(?:\/\*[\s\S]*?\*\/\n)?:root\.touch-phone \.start-card \{ grid-template-columns: minmax\(0, 1fr\); width: min\(560px, 100%\); \}/);
  });
});
