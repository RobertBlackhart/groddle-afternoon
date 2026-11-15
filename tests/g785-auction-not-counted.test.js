/**
 * G785 / #362: a tradeable stack the site has not counted yet (the ledger catches up with the pack at its own pace)
 * said "This type of item can not be auctioned.", which read as a rule. It now says it is not counted yet; a class
 * the auction table does not list still gets the 2012 refusal.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUCTION_TEXT } from '../public/js/auctions.js?v=9a1488e7';

const src = readFileSync(new URL('../public/js/features/auctions-feature.js', import.meta.url), 'utf8');

describe('G785: not counted yet is not "can not be auctioned"', () => {
  it('keeps the 2012 refusal and adds a plain not-counted line', () => {
    assert.equal(AUCTION_TEXT.forbidden, 'This type of item can not be auctioned.');
    assert.match(AUCTION_TEXT.notCounted, /not counted for trading yet/);
    assert.doesNotMatch(AUCTION_TEXT.notCounted, /—/);
  });
  it('the sell box says not counted for a listed class the pack holds, and refuses the rest', () => {
    assert.match(src, /const pending = countItem\(engine\.inv, c\) > 0 && \(!table \|\| !!table\.items\?\.\[c\]\);/);
    assert.match(src, /pick\.pending \? T\.notCounted : T\.forbidden/);
  });
  it('the pack popover gives the not-counted reason (it only shows Sell for classes the table lists)', () => {
    assert.match(src, /if \(t && !t\.items\?\.\[c\]\) return null;/);
    assert.match(src, /reason: can \? '' : T\.notCounted/);
  });
});
