/** The rook badge's HEALTH / ANGRY line sits above the stun stars (G892: Tiny Speck's star arc), not over the top one (Austin 2026-11-15 screenshot). */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BADGE_PARTS } from '../public/js/rook-badge-place.js?v=e2bcbbaa';

const src = readFileSync(new URL('../public/js/features/rook-attack-feature.js', import.meta.url), 'utf8');

describe('rook badge: the phase line clears the stun stars', () => {
  it('the line\'s bottom is above the star arc, and the badge keeps room for it', () => {
    const starsY = Number(src.match(/export const STARS_Y = (-\d+);/)[1]);
    assert.match(src, /phase\.y = STARS_Y - (\d+);/);
    const y = starsY - Number(src.match(/phase\.y = STARS_Y - (\d+);/)[1]);
    assert.ok(y < starsY, `phase line bottom ${y} must be above the arc's top ${starsY}`);
    const lineTop = y - 13; // an 11 px bold line
    assert.ok(BADGE_PARTS.core.top <= lineTop, 'the placed badge reserves room for the line');
    // The arc's middle stars stand clear of the white disc (r 38).
    assert.ok(starsY + 12 < -38);
  });
});
