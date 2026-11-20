/**
 * G1061 (#555's class, root R2): planned Street Spirits, shrines and mailboxes stood in trees'
 * crowns (eight on the shared streets: Senna Karup's and Mossystep's vendor, six mailboxes such as
 * Lotha Harte's on a ledge up a tree). Glitch set them down by hand from the street XML, never in a
 * tree; the remake plans them where the archive has no position, and now they keep out of a planned
 * tree's canopy by their art (street-ecology.js UNDER_CANOPY_HEIGHTS / UNDER_CANOPY_WIDTHS), the rule
 * the resource nodes, the Visiting Stone and the Race Ticket Dispenser follow (#256, #555).
 *
 * tools/canopy-placements.mjs lays out every shared street (and each street upgrade) as game.js does
 * and lists the planned ones still drawn in a crown. Only the canopy rule's own last resort may be:
 * the planner had no clear spot left (every other spot steep, behind the front art or on another
 * fixture), named below so a new one fails.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  PLACEMENT_FOOTPRINTS,
  PLACEMENT_HEIGHTS,
  UNDER_CANOPY_HEIGHTS,
  UNDER_CANOPY_WIDTHS,
} from '../public/js/street-ecology.js?v=010c8c45';
import { CROWN_KINDS, crownOverlaps } from '../tools/canopy-placements.mjs';

/**
 * Mossystep (1800 px, two Bean Trees): the lower floor is all behind the front art and every other
 * spot is steeper than 0.3, on its Visiting Stone, on the measured tree's own box or in a crown, so
 * its vendor stays where it stood, 79 px from a Bean Tree's trunk (the plan lists it blocked by the
 * `canopy`). It needs a hand-set spot (Austin's call), not a planner rule.
 */
const LAST_RESORT = new Set(['GCR15ST40FM1M1I:vendor:0']);

describe('G1061: planned vendors, shrines and mailboxes keep out of trees', () => {
  it('each keeps out of a canopy by its own art', () => {
    for (const [key, box] of Object.entries(CROWN_KINDS)) {
      assert.equal(UNDER_CANOPY_HEIGHTS[key], box.h, `${key} height`);
      assert.equal(UNDER_CANOPY_WIDTHS[key] || PLACEMENT_FOOTPRINTS[key], box.w, `${key} width`);
    }
    assert.equal(CROWN_KINDS.vendor.h, PLACEMENT_HEIGHTS.vendor);
    assert.equal(CROWN_KINDS.shrine.h, PLACEMENT_HEIGHTS.shrine);
  });

  it('on every shared street, none is drawn in a crown but the planner\'s last resort', () => {
    const { overlaps, planned } = crownOverlaps();
    assert.ok(planned.vendor > 800 && planned.shrine > 500 && planned.furnitureMailbox > 80, JSON.stringify(planned));
    const fresh = overlaps.filter((o) => !LAST_RESORT.has(`${o.tsid}:${o.key}:${o.index}`))
      .map((o) => `${o.label} (${o.tsid}${o.upgrade ? `, upgrade ${o.upgrade}` : ''}): ${o.key} ${o.index} at ${o.x},${o.y} in tree ${o.tree} at ${o.tx},${o.ty}`);
    assert.deepEqual(fresh, []);
    for (const id of LAST_RESORT) {
      const hit = overlaps.find((o) => `${o.tsid}:${o.key}:${o.index}` === id);
      // Gone from the crown: take it off the list.
      assert.ok(hit, `${id} is clear of the trees now`);
      assert.ok(hit.blocked, `${id}: the planner had a clear spot`);
    }
  });
});
