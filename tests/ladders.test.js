/**
 * Getting off at a ladder's top (street-model.js ladderTopDeck).
 * Run: node --test tests/ladders.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ladderTopDeck, platformsScreen, wallsScreen, platformYAt, LADDER_GRAB_BELOW, findClimbWallNear, isStandable, worldToScreen } from '../public/js/street-model.js?v=2918abe5';
import { ladderMount, LADDER_UP_PRESS_MS } from '../public/js/movement.js?v=0a356337';
import { lightLayout, LOW } from '../public/js/quest-rooms/light-perspective.js?v=160693c7';

const here = dirname(fileURLToPath(import.meta.url));
const streets = join(here, '../public/assets/streets');
const index = JSON.parse(readFileSync(join(streets, 'index.json'), 'utf8')).streets;

describe('ladder tops', () => {
  it('steps onto a deck just above or below the top, never onto the floor', () => {
    const deckAbove = [{ x1: 0, y1: 300, x2: 200, y2: 300 }, { x1: 0, y1: 600, x2: 2000, y2: 600 }];
    // Climber clamped at the top (yTop + 2) of a ladder from 600 up to 296.
    assert.equal(ladderTopDeck(deckAbove, 100, 298, 600), 300);
    // Archived shape: the ladder ends 40 px above its deck.
    assert.equal(ladderTopDeck(deckAbove, 100, 262, 600), 300);
    // No deck within reach: stay on the ladder.
    assert.equal(ladderTopDeck([{ x1: 0, y1: 600, x2: 2000, y2: 600 }], 100, 540, 600), null);
    assert.equal(ladderTopDeck(deckAbove, 1000, 298, 600), null);
  });

  it('mounts the deck on most archived ladders', () => {
    let withDeck = 0;
    let mounted = 0;
    for (const tsid of Object.keys(index)) {
      const street = JSON.parse(readFileSync(join(streets, `${tsid}.json`), 'utf8'));
      if (!street.ladders?.length) continue;
      const plats = platformsScreen(street);
      for (const wall of wallsScreen(street).filter((w) => w.source === 'ladder')) {
        // A deck a player could mean: a surface within 48 px of the top that is not the base floor.
        // An underside (pc_perm 1) is no deck: Purplysa's secret ladder ends under one.
        const deck = plats.filter((p) => p.pcPerm !== 1).map((p) => platformYAt(p, wall.x)).filter((y) => y != null && y - wall.yTop > -46 && y - wall.yTop <= 48 && y < wall.yBot - 8);
        if (!deck.length) continue;
        withDeck += 1;
        if (ladderTopDeck(plats, wall.x, wall.yTop + 2, wall.yBot) != null) mounted += 1;
      }
    }
    assert.ok(withDeck > 600, String(withDeck));
    assert.equal(mounted, withDeck);
  });
});

describe('climbing input (game.js)', () => {
  const game = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'public/game.js'), 'utf8');

  it('does not re-grab a ladder with a still-held Up/Down right after leaving it', () => {
    // Hopping off sideways or jumping while Up/Down is held must not flip back onto the ladder next frame.
    assert.match(game, /climb\.wall = null;(\s*climb\.goalY = null;)?\s*\/\/[^\n]*\n[^\n]*\n\s*climb\.regrabLock = true;/); // goalY: a tapped ladder's height (touch-controls)
    assert.match(game, /if \(!up && !down\) climb\.regrabLock = false;/);
    assert.match(game, /locked: climb\.regrabLock,/);
    assert.match(game, /climbHit && up && !climb\.regrabLock && ladderMount\(/);
  });

  it('treats Up/W as climb, not jump, while on a ladder (only Space jumps off)', () => {
    assert.match(game, /e\.key === ' ' \|\| \(!climb\.active && \['ArrowUp', 'w', 'W'\]\.includes\(e\.key\)\)/);
  });

  it('runs the climb cycle only while moving on the ladder (CLIMB_PAUSE holds the frame)', () => {
    // The Glitch sheets report climb or climbPause from vy (js/ladder-anim.js, tests/ladder-anim.test.js);
    // the sheetless fallback still stops its cycle at rest.
    assert.match(game, /if \(player\.vy !== 0 \|\| player\.anims\) setPlayerAnim\('climb'\);\s*(?:\/\/[^\n]*\s*)?else if \(player\.playing\) player\.stop\(\);/);
    assert.match(game, /return ladderAnimState\(player\.vy\);/);
    assert.match(game, /if \(swap === 'stop'\) player\.stop\(\);\s*else player\.play\(\);/);
  });
});

describe('how far under a ladder Up reaches it (#396, street-model findClimbWallNear)', () => {
  const walls = [{ id: 'l', x: 100, yTop: 300, yBot: 600 }];

  it('reaches 113 px over the feet, the top of Glitch\'s avatar hit box', () => {
    // AbstractAvatarView.as drawHitBox: hit_box_height 123, hit_box_offset_y 10 under the feet.
    assert.equal(LADDER_GRAB_BELOW, 123 - 10);
    assert.equal(findClimbWallNear(walls, 100, 600 + 70, 40)?.wall.id, 'l');
    assert.equal(findClimbWallNear(walls, 100, 600 + 113, 40)?.wall.id, 'l');
    assert.equal(findClimbWallNear(walls, 100, 600 + 114, 40), null);
    // The rest is as it was: across, and over the top.
    assert.equal(findClimbWallNear(walls, 141, 600 + 70, 40), null);
    assert.equal(findClimbWallNear(walls, 100, 300 - 28, 40)?.wall.id, 'l');
    assert.equal(findClimbWallNear(walls, 100, 300 - 29, 40), null);
  });

  it('takes Amlou Amoo\'s ladder from the floor 70 px under its foot with a fresh Up', () => {
    const street = JSON.parse(readFileSync(join(streets, 'GA98LV0U3BO2FA0.json'), 'utf8'));
    const src = street.ladders.find((l) => l.id === 'ladder_1329430830672');
    assert.deepEqual([src.x, src.y], [1876, -725]);
    const ladder = wallsScreen(street).find((w) => w.id === src.id);
    const floors = platformsScreen(street).filter(isStandable).map((p) => platformYAt(p, ladder.x, 0)).filter((y) => y != null && y > ladder.yBot);
    const floor = Math.min(...floors);
    assert.ok(Math.abs(floor - worldToScreen(street, 0, -655).y) < 2, `floor ${floor}`);
    assert.ok(floor - ladder.yBot > 64, 'out of the old 64 px reach');
    const hit = findClimbWallNear(wallsScreen(street), ladder.x + 10, floor, 40);
    assert.equal(hit?.wall.id, src.id);
    // game.js handleInput: standing on that floor is atBase, so Down walks on and a fresh Up climbs.
    const atBase = floor >= hit.yBot - 4;
    assert.equal(ladderMount({ near: true, up: true, upPressedMs: 0, onGround: true, atBase }), 'up');
    assert.equal(ladderMount({ near: true, down: true, onGround: true, atBase }), '');
    assert.equal(ladderMount({ near: true, up: true, upPressedMs: LADDER_UP_PRESS_MS + 1, onGround: true, atBase }), '');
  });
});

describe('getting on a ladder (#382, movement.js ladderMount)', () => {
  const fresh = { near: true, up: true, upPressedMs: 0, onGround: true };

  it('gets on with a fresh Up press or a held Down, as AvatarController onUpKey/onDownKey', () => {
    assert.equal(ladderMount(fresh), 'up');
    assert.equal(ladderMount({ ...fresh, upPressedMs: LADDER_UP_PRESS_MS }), 'up');
    assert.equal(ladderMount({ near: true, down: true, onGround: true }), 'down');
    assert.equal(ladderMount({ near: true, down: true, upPressedMs: Infinity }), 'down');
  });

  it('does not catch a ladder with an Up held from before', () => {
    assert.equal(ladderMount({ ...fresh, upPressedMs: LADDER_UP_PRESS_MS + 1 }), '');
    assert.equal(ladderMount({ ...fresh, upPressedMs: 2000 }), '');
    assert.equal(ladderMount({ ...fresh, upPressedMs: Infinity }), '');
  });

  it('does not grab in the air after a jump, even on a fresh press', () => {
    assert.equal(ladderMount({ ...fresh, onGround: false, jumpedSinceFloor: true }), '');
    // Off a ledge without jumping the press still takes it (no jump to keep).
    assert.equal(ladderMount({ ...fresh, onGround: false, jumpedSinceFloor: false }), 'up');
  });

  it('lets Up jump from the deck at a ladder top (the switches in Walk Toward the Light)', () => {
    assert.equal(ladderMount({ ...fresh, onTopDeck: true }), '');
    assert.equal(ladderMount({ near: true, down: true, onGround: true, onTopDeck: true }), 'down');
  });

  it('keeps the old limits: in reach, not just off, one direction, Down not at the bottom', () => {
    assert.equal(ladderMount({ ...fresh, near: false }), '');
    assert.equal(ladderMount({ ...fresh, locked: true }), '');
    assert.equal(ladderMount({ ...fresh, down: true }), '');
    assert.equal(ladderMount({ near: true, down: true, atBase: true }), '');
  });

  it('is what handleInput asks before startClimb (game.js)', () => {
    const game = readFileSync(join(here, '..', 'public/game.js'), 'utf8');
    assert.match(game, /if \(up && !ladderUp\.held\) ladderUp\.pressAt = now;\s*ladderUp\.held = up;/);
    // Not on `climb`, which a street load replaces ({ active: false, wall: null }).
    assert.match(game, /const ladderUp = \{ held: false, pressAt: -Infinity \};/);
    assert.match(game, /if \(climbHit && ladderMount\(\{ \.\.\.mountArgs, near: Math\.abs\(player\.x - climbHit\.x\) < 28 \}\)\) \{\s*startClimb\(climbHit\);/);
    assert.match(game, /jumpedSinceFloor: jumpState\.jumpedSinceFloor,/);
    assert.match(game, /onTopDeck = Boolean\(climbHit && up && player\.onGround && standsOnLadderTop\(climbHit\)\)/);
  });

  it('finds the top deck of the ladders beside the switches in Walk Toward the Light', () => {
    const layout = lightLayout();
    for (const id of ['d', 'e']) {
      const l = layout.ladders.find((it) => it.id === id);
      const slab = layout.slabs.find((it) => it.id === id);
      const plats = [{ x1: slab.x1, y1: slab.y, x2: slab.x2, y2: slab.y }, { x1: 0, y1: LOW, x2: 8000, y2: LOW }];
      // The room's ladder wall tops out 24 px over the slab (kit.ladder(l.x, l.top - 24, ...)).
      const deck = ladderTopDeck(plats, l.x, l.top - 24 + 4, LOW);
      assert.equal(deck, slab.y, id);
    }
  });
});
