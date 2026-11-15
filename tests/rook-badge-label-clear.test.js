/** The rook badge's HEALTH / ANGRY line sits above the seven stun stars, not over the top one (Austin 2026-11-15 screenshot). */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BADGE_PARTS } from '../public/js/rook-badge-place.js?v=e7c389ef';

const src = readFileSync(new URL('../public/js/features/rook-attack-feature.js', import.meta.url), 'utf8');

describe('rook badge: the phase line clears the stun stars', () => {
  it('the line\'s bottom is above the top star\'s tip, and the badge keeps room for it', () => {
    const ring = Number(src.match(/Math\.sin\(ang\) \* \(r \+ (\d+)\)/)[1]);
    const r = Number(src.match(/const r = (\d+);\s+b\.disc\.clear\(\);/)[1]);
    const starRing = r + ring;
    const starTip = starRing + 7; // the lit star's radius
    const y = Number(src.match(/phase\.y = (-\d+);/)[1]);
    assert.ok(-y > starTip, `phase line bottom ${y} must be above the star tip -${starTip}`);
    const lineTop = y - 13; // an 11 px bold line
    assert.ok(BADGE_PARTS.core.top <= lineTop, 'the placed badge reserves room for the line');
  });
});
