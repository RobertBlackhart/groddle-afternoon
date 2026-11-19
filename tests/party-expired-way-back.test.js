/**
 * A Party Space that ran out while its guest was away sent the next load to Baqala: the way back
 * (the street the party was entered from) lived only inside the party record, which
 * normalizePartyRecord drops once the party has expired, so reloadLocation fell to DEFAULT_STREET
 * (GA5101HF7F429V5, Empty Via 5 in Baqala, a street still being built). Glitch kept the way back on
 * the player, not the instance (players/inc_instances.js 82-99, 140-175), so an ended instance put
 * you back where you came from. The record now keeps it as `wayBack`.
 * Also: the Interrogation room's fallback named that street Hechey Track.
 * Run: node --test tests/party-expired-way-back.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PARTY_SPACES, normalizePartyRecord, startParty } from '../public/js/party-spaces.js?v=a748a93f';
import { partySpacesFeature } from '../public/js/features/party-spaces-feature.js?v=53c916ec';
import { INTERROGATION_FALLBACK } from '../public/js/interrogation-room.js?v=b22294fe';

const root = join(import.meta.dirname, '..');
const index = JSON.parse(readFileSync(join(root, 'public/assets/streets/index.json'), 'utf8'));
const MOON = PARTY_SPACES.moon.streetTsid;
const FROM = { tsid: 'GLI32G3NUTD100I', label: 'Somewhere', x: 1234.4, y: -88.6 };

/** A party entered from FROM, saved while inside, and loaded after it ran out. */
function expiredSave() {
  const party = startParty(null, 'party_pack_toxic_moon', { now: 0 }).party;
  party.inside = true;
  party.returnTo = { ...FROM };
  return JSON.parse(JSON.stringify({ instructionsRead: true, party }));
}

describe('an expired party still leads back where it was entered from', () => {
  it('normalizePartyRecord drops the party but keeps its way back, across loads', () => {
    const rec = normalizePartyRecord(expiredSave(), 3_600_000 * 24);
    assert.equal(rec.party, null, 'the party is over');
    assert.deepEqual(rec.wayBack, { tsid: FROM.tsid, label: 'Somewhere', x: 1234, y: -89 });
    const again = normalizePartyRecord(JSON.parse(JSON.stringify(rec)), 3_600_000 * 48);
    assert.deepEqual(again.wayBack, rec.wayBack, 'a second load before you leave keeps it');
  });

  it('a live party keeps it on the party, and a party street is never a way back', () => {
    const save = expiredSave();
    const live = normalizePartyRecord(save, 1000);
    assert.equal(live.party.returnTo.tsid, FROM.tsid);
    assert.equal(live.wayBack, null);
    save.party.returnTo = { tsid: MOON, x: 1, y: 2 };
    assert.equal(normalizePartyRecord(save, 3_600_000 * 24).wayBack, null);
    assert.equal(normalizePartyRecord({ wayBack: { tsid: '' } }).wayBack, null);
  });

  it('the next load goes to that street, not Baqala', () => {
    partySpacesFeature.restore(normalizePartyRecord(expiredSave(), 3_600_000 * 24));
    assert.deepEqual(partySpacesFeature.reloadLocation({ tsid: MOON, x: 5, y: 5 }), { tsid: FROM.tsid, x: 1234, y: -89 });
    assert.equal(partySpacesFeature.save().wayBack.tsid, FROM.tsid, 'saved again as it is');
    // The way back reached: off the party streets it has done its job.
    partySpacesFeature.onStreetEnter({ tsid: FROM.tsid }, { streetTsid: FROM.tsid, setData() {}, instanceHold: null, mode: 'solo', param: () => null });
    assert.equal(partySpacesFeature.save().wayBack, null);
    partySpacesFeature.restore({});
  });

  it('with no way back kept at all, the old default still holds', () => {
    partySpacesFeature.restore({});
    assert.equal(partySpacesFeature.reloadLocation({ tsid: MOON, x: 5, y: 5 }).tsid, 'GA5101HF7F429V5');
  });

  it('the Interrogation room names its fallback street by its own name', () => {
    assert.equal(INTERROGATION_FALLBACK.label, index.streets[INTERROGATION_FALLBACK.tsid].label);
  });
});
