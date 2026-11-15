/**
 * G740: the realtime server's move watch (groddle-afternoon-server movewatch.go, log only) reads
 * where players arrive on each street from data/entries.json, written by
 * tools/build-realtime-entries.mjs from the game's own street files.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serverPath, skipWithoutServer } from '../tools/repos.mjs';
import { entriesData } from '../tools/build-realtime-entries.mjs';

const root = join(import.meta.dirname, '..');

describe('street entry points for the move watch (G740)', () => {
  it('holds every signpost and door arrive point, in the street they lead into', () => {
    const { streets } = entriesData();
    assert.ok(Object.keys(streets).length > 1000);
    // GA5101HF7F429V5's signpost connects into LA510IHD1F426DS arriving at 300,609 (its street file).
    const from = JSON.parse(readFileSync(join(root, 'public/assets/streets/GA5101HF7F429V5.json'), 'utf8'));
    const c = from.signposts.flatMap((s) => s.connects).find((k) => k.tsid === 'LA510IHD1F426DS');
    assert.deepEqual(c.arrive, { x: 300, y: 609 });
    assert.ok(streets.GA510IHD1F426DS.some(([x, y]) => x === 300 && y === 609));
    // Its own signposts, in screen space (x - bounds.l, y - bounds.t).
    const s = from.signposts[0];
    assert.ok(streets.GA5101HF7F429V5.some(([x, y]) => x === s.x - from.bounds.l && y === s.y - from.bounds.t));
  });

  it('is current in the realtime server repo', { skip: skipWithoutServer }, () => {
    assert.equal(readFileSync(serverPath('data', 'entries.json'), 'utf8'), `${JSON.stringify(entriesData())}\n`, 'run node tools/build-realtime-entries.mjs');
    const go = readFileSync(serverPath('movewatch.go'), 'utf8');
    assert.match(go, /\/\/go:embed data\/entries\.json/);
    // A watch, never a rule: nothing in it refuses, replies or moves a player.
    assert.doesNotMatch(go, /replyLocked|closeLocked|"t": "teleport"|cl\.player\.X =/);
  });
});
