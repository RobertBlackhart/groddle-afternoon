/**
 * Report #643 (2026-11-23): a player report was sent by accident, most likely a second tap landing on Send report
 * as the window opened. js/note-view.js openReportView keeps Send disabled for REPORT_ARM_MS, and a submit before
 * then does nothing, so every report takes a deliberate press.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../public/js/note-view.js', import.meta.url), 'utf8');
const fn = src.slice(src.indexOf('export function openReportView('), src.indexOf('\n}\n', src.indexOf('export function openReportView(')));

describe('#643: Send report waits a moment before it can be pressed', () => {
  it('waits about a second by default', () => {
    const m = /export const REPORT_ARM_MS = (\d+);/.exec(src);
    assert.ok(m, 'REPORT_ARM_MS is exported');
    assert.ok(Number(m[1]) >= 600 && Number(m[1]) <= 1500, `a short, noticeable wait (${m[1]} ms)`);
  });
  it('the button starts disabled and is armed by a timer', () => {
    assert.match(fn, /el\('button', \{ type: 'submit', className: 'is-primary', disabled: true/);
    assert.match(fn, /setTimeout\(\(\) => \{\s*armed = true;\s*send\.disabled = false;/);
  });
  it('a submit before it is armed sends nothing', () => {
    const submit = fn.slice(fn.indexOf("form.addEventListener('submit'"));
    assert.ok(submit.indexOf('if (!armed) return;') > -1, 'guarded');
    assert.ok(submit.indexOf('if (!armed) return;') < submit.indexOf('opts.onSend'), 'before anything is sent');
  });
});
