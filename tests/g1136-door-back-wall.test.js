/**
 * G1136 / #612: a placed Door stands at the base of the back wall, 65 px
 * behind the walk line, on every floor (inc_homes.js homes_rebuild_floor
 * 749-750: doors at b - (108 + frame_height); the walk line, where every other
 * floor piece stands, at b - (43 + frame_height)). Saved Doors move there on
 * load, and a Door draws behind the room's other floor pieces.
 * Run: node --test tests/g1136-door-back-wall.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DOOR_CLASS, addFloor, createFloorsState } from '../public/js/home-floors.js?v=8ee8cfe9';
import {
  DOOR_FOOT_Y,
  INTERIOR,
  createHomeDecorState,
  floorRestY,
  moveFurniture,
  normalizeHomeDecorState,
  placeFurniture,
  renderOrder,
} from '../public/js/home-decor.js?v=f6d82a18';

function houseWithDoor(x = 600) {
  const ground = createHomeDecorState({ starterKit: true });
  ground.storage[DOOR_CLASS] = 1;
  ground.storage.furniture_chair = 1;
  const placed = placeFurniture(ground, {}, DOOR_CLASS, { x, y: INTERIOR.floorY });
  assert.equal(placed.ok, true);
  return { ground, door: placed.item };
}

describe('G1136: the Door stands at the back wall', () => {
  it('is 65 px behind the walk line; other floor pieces stay on it', () => {
    assert.equal(DOOR_FOOT_Y, INTERIOR.floorY - 65);
    assert.equal(floorRestY(DOOR_CLASS), DOOR_FOOT_Y);
    assert.equal(floorRestY('furniture_chair'), INTERIOR.floorY);
    const { ground, door } = houseWithDoor();
    assert.equal(door.y, DOOR_FOOT_Y);
    const chair = placeFurniture(ground, {}, 'furniture_chair', { x: 300, y: INTERIOR.floorY });
    assert.equal(chair.item.y, INTERIOR.floorY);
  });

  it('stays there when moved', () => {
    const { ground, door } = houseWithDoor();
    const moved = moveFurniture(ground, door.id, { x: 400, y: INTERIOR.floorY + 30 });
    assert.equal(moved.ok, true);
    assert.equal(ground.placed.find((r) => r.id === door.id).y, DOOR_FOOT_Y);
  });

  it('the Door down on a new floor stands there too', () => {
    const fs = createFloorsState();
    const { ground, door } = houseWithDoor();
    fs.pending = { floor: 0, id: door.id };
    const res = addFloor(fs, ground);
    assert.equal(res.ok, true);
    assert.equal(res.decor.placed.find((r) => r.id === res.link.down).y, DOOR_FOOT_Y);
  });

  it('a saved Door on the walk line moves back on load; a saved chair does not', () => {
    const saved = {
      geo: 2,
      starterKit: true,
      placed: [
        { id: 1, classTsid: DOOR_CLASS, slot: 'floor', x: 600, y: INTERIOR.floorY, z: 2 },
        { id: 2, classTsid: 'furniture_chair', slot: 'floor', x: 300, y: INTERIOR.floorY, z: 1 },
      ],
      nextId: 3,
    };
    const state = normalizeHomeDecorState(saved);
    assert.equal(state.placed.find((r) => r.id === 1).y, DOOR_FOOT_Y);
    assert.equal(state.placed.find((r) => r.id === 2).y, INTERIOR.floorY);
    // Back to front: the Door before the chair, though its z is higher.
    assert.deepEqual(renderOrder(state).map((r) => r.id), [1, 2]);
  });
});
