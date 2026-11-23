/**
 * G1149 (#619): at GFJ Subway Station you could walk on past the gate to the platform's right end,
 * and A Red Button then sat on the box's far face from you. The ticket post's arm reaches across to
 * the green gate box (the 2012 station snaps), so the gate closes the platform: a wall at the box's
 * left face stops a walker coming from the left, in front of the button. All 12 stations share it.
 * Run: node --test tests/subway-gate-619.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STATIONS, STATION_FLOOR, STATION_GATE_WALL, STATION_X, stationScreen } from '../public/js/subway.js?v=0a87a908';
import { JUMP_SPEED, NORMAL_BUFF, avatarGround, stepAvatar, steerX } from '../public/js/avatar-step.js?v=39d7b1af';
import { barriersScreen, platformsScreen } from '../public/js/street-model.js?v=a9a05f9d';

const PUB = join(import.meta.dirname, '..', 'public');
const readJson = (rel) => JSON.parse(readFileSync(join(PUB, rel), 'utf8'));

/** Walk (or jump while walking) `dir` for `frames` frames; the world x reached. */
function walk(street, body, dir, frames, { jump = false } = {}) {
  const plats = platformsScreen(street);
  const ctx = { dt: 1, buff: NORMAL_BUFF, platforms: plats, barriers: barriersScreen(street), worldW: street.bounds.r - street.bounds.l, worldH: street.bounds.b - street.bounds.t, ground: (x, y, vy) => avatarGround(plats, x, y, vy ?? 0, { street }) };
  for (let i = 0; i < frames; i++) {
    body.vx = steerX(body.vx, dir, body.onGround, NORMAL_BUFF);
    if (jump && body.onGround) { body.vy = JUMP_SPEED * 1.5; body.onGround = false; }
    stepAvatar(body, ctx);
  }
  return body.x + street.bounds.l;
}

describe('#619 the subway gate closes the platform', () => {
  it('the wall stands at the gate box\'s left face, just left of A Red Button, ceiling to floor', () => {
    const boxLeft = STATION_X.gate - 147 / 2;
    assert.ok(STATION_GATE_WALL.x < boxLeft && boxLeft - STATION_GATE_WALL.x <= 15, 'at the box face');
    assert.ok(STATION_GATE_WALL.x < STATION_X.button - 27 / 2, 'the button is on your side of it');
    assert.equal(STATION_GATE_WALL.y + STATION_GATE_WALL.h, STATION_FLOOR);
    assert.equal(STATION_GATE_WALL.pc_perm, -1, 'solid from the left only, so nobody is shut in past it');
  });

  for (const station of STATIONS) {
    it(`${station.name}: walking right stops at the gate, and you can walk back from past it`, () => {
      const street = readJson(`assets/streets/${station.streetTsid}.json`);
      assert.deepEqual(street.barriers, [{ ...STATION_GATE_WALL }]);
      const at = stationScreen(0);
      const body = { x: at.x, y: at.y, vx: 0, vy: 0, onGround: true };
      const stop = walk(street, body, 1, 400);
      assert.ok(stop < STATION_GATE_WALL.x && stop > STATION_GATE_WALL.x - 5, `stopped at the gate (${stop})`);
      const jumped = walk(street, body, 1, 200, { jump: true });
      assert.ok(jumped < STATION_GATE_WALL.x, `no jumping over it (${jumped})`);
      const past = stationScreen(650);
      const stray = { x: past.x, y: past.y, vx: 0, vy: 0, onGround: true };
      assert.ok(walk(street, stray, -1, 400) < 0, 'from past the gate you walk back to the platform');
    });
  }
});
