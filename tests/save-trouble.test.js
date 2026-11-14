/**
 * G737: a save that does not go in is shown, retried with a growing wait and cleared when one goes
 * in; a held save writes nothing (js/save-trouble.js, game.js savePlayerState).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { RETRY_FIRST_MS, RETRY_MAX_MS, SAVE_TROUBLE_COPY, createSaveHealth, retryDelay } from '../public/js/save-trouble.js?v=bbec104f';

function fakeTimers() {
  const due = [];
  return {
    due,
    setTimeout(fn, ms) { const t = { fn, ms }; due.push(t); return t; },
    clearTimeout(t) { const i = due.indexOf(t); if (i >= 0) due.splice(i, 1); },
    runNext() { const t = due.shift(); t?.fn(); return t?.ms; },
  };
}

describe('a save that fails is shown and retried', () => {
  it('retries after 5 s, doubling to a minute', () => {
    assert.equal(retryDelay(1), RETRY_FIRST_MS);
    assert.equal(retryDelay(2), 2 * RETRY_FIRST_MS);
    assert.equal(retryDelay(50), RETRY_MAX_MS);
  });

  it('shows the card once, retries by itself, and clears it with a notice when a save goes in', () => {
    const timers = fakeTimers();
    const shown = [];
    const said = [];
    const reported = [];
    let works = false;
    const health = createSaveHealth({
      timers,
      retry: () => (works ? health.ok() : health.failed(new Error('QuotaExceededError'))),
      onChange: (s) => shown.push(s),
      say: (t) => said.push(t),
      report: (e) => reported.push(e.message),
    });
    health.failed(new Error('QuotaExceededError'));
    assert.deepEqual(shown, ['failed']);
    assert.equal(timers.runNext(), RETRY_FIRST_MS);
    assert.equal(timers.runNext(), 2 * RETRY_FIRST_MS);
    assert.deepEqual(shown, ['failed'], 'no card again for each retry');
    assert.deepEqual(reported, ['QuotaExceededError'], 'one error logged once');
    works = true;
    timers.runNext();
    assert.deepEqual(shown, ['failed', 'ok']);
    assert.deepEqual(said, [SAVE_TROUBLE_COPY.recovered]);
    assert.equal(timers.due.length, 0, 'nothing left waiting');
    health.ok();
    assert.deepEqual(said, [SAVE_TROUBLE_COPY.recovered], 'a save that always worked says nothing');
  });

  it('Try again saves now and a later ordinary save clears it too', () => {
    const timers = fakeTimers();
    let tries = 0;
    const health = createSaveHealth({ timers, retry: () => { tries += 1; } });
    health.failed(new Error('x'));
    health.retryNow();
    assert.equal(tries, 1);
    assert.equal(timers.due.length, 0);
    health.ok();
    assert.equal(health.state, 'ok');
  });

  it('a held save stays held: no retry, no card change on failures', () => {
    const timers = fakeTimers();
    const shown = [];
    const health = createSaveHealth({ timers, retry: () => {}, onChange: (s) => shown.push(s) });
    assert.equal(health.hold('unreadable'), true);
    assert.equal(health.held, 'unreadable');
    health.failed(new Error('x'));
    health.ok();
    assert.equal(health.hold('newer'), false, 'the first hold stays');
    assert.deepEqual(shown, ['unreadable']);
    assert.equal(timers.due.length, 0);
  });
});

describe('game.js reports every save to the save card', () => {
  const src = readFileSync(new URL('../public/game.js', import.meta.url), 'utf8');
  const fn = src.slice(src.indexOf('function savePlayerState() {'), src.indexOf('function loadDroppedItems()'));
  it('a held save writes nothing, a failure and a success are reported', () => {
    assert.match(fn, /if \(!state\.started \|\| saveHealth\.held\) return false;/);
    assert.match(fn, /catch \(err\) \{\s*saveHealth\.failed\(err\);\s*return false;/);
    assert.match(fn, /saveHealth\.ok\(\);\s*return true;/);
  });
});
