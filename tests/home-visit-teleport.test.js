/**
 * G1226 (report #648): teleporting was refused on another player's home street ("This place has its
 * own way out. Teleporting will have to wait."), and worked again back in Ur. A visit is drawn as a
 * scene (MPH_<owner>, its house MPH_<owner>_IN, a Tower floor MPH_<owner>_T<n>), and the teleport
 * feature refused any scene as a held place.
 *
 * In Glitch teleportation_can_teleport (GameServerJS players/inc_teleportation.js 126-296) never asks
 * where the player stands, only the target (219-262); teleportation_teleport leaves an instance
 * (360-366) and lands a visitor going to someone's private home outside it (371-373). So a visitor
 * teleports from a home street, house or Tower floor as from anywhere; the visit ends as any trip off
 * it does (neighbours-mp-feature onStreetEnter). Other held places still refuse.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_DIR } from '../tools/repos.mjs';

const TARGET = { tsid: 'GCR10NQRPKJ16H6', x: 300, y: -90, label: 'Sylvan Grove', hubId: '58', hubName: 'Groddle Forest' };
const NO_EXIT = 'This place has its own way out. Teleporting will have to wait.';

function tpEngine(over = {}) {
  const log = { gates: [] };
  return {
    log,
    started: true,
    mode: 'multiplayer',
    inv: {},
    toolState: {},
    pc: { energy: 90, mood: 50, xp: 0, imagination: 0 },
    learnedSkills: ['teleportation_1', 'teleportation_2', 'teleportation_3', 'teleportation_4'],
    player: { x: 500, y: 400, vx: 0, vy: 0, onGround: true, height: 96 },
    street: { label: 'A home street', hubId: '', hubName: '' },
    streetTsid: 'MPH_77',
    param: () => null,
    setData() {},
    toast() {},
    pushActivity() {},
    updateHud() {},
    save() {},
    // A visit is a scene: game.js transientInstance is true there.
    transientInstance: () => true,
    homeContext: () => ({ inHome: false }),
    streetExists: () => true,
    visitedStreets: () => [TARGET.tsid],
    travelGate: (tsid, meta) => { log.gates.push(meta); return { ok: true }; },
    closeMap() {},
    busy: () => false,
    query: () => null,
    ...over,
  };
}

describe('teleporting from someone else\'s home', () => {
  it('a visit\'s home street, house and Tower floor let a teleport go, through the target\'s own gate', async () => {
    const { teleportationFeature: tp } = await import('../public/js/features/teleportation-feature.js?fresh=home-visit-a');
    tp.restore({ targets: { 1: TARGET } });
    for (const tsid of ['MPH_77', 'MPH_77_IN', 'MPH_77_T3']) {
      const engine = tpEngine({ streetTsid: tsid });
      const check = tp.mapTeleport('check', TARGET, engine);
      assert.notEqual(check.error, NO_EXIT, tsid);
      assert.equal(engine.log.gates.at(-1)?.via, 'teleport', `${tsid}: the target is still asked`);
    }
  });

  it('every other held place still has its own way out', async () => {
    const { teleportationFeature: tp } = await import('../public/js/features/teleportation-feature.js?fresh=home-visit-b');
    tp.restore({ targets: { 1: TARGET } });
    for (const tsid of ['RACE_SCENE', 'NB_12', 'MPH_07', 'MPH_77_X', 'HALL_3']) {
      assert.equal(tp.mapTeleport('check', TARGET, tpEngine({ streetTsid: tsid })).error, NO_EXIT, tsid);
    }
  });

  it('the source checks only the target, and lands a visitor outside a private home', () => {
    const gsjs = join(GAME_DIR, '../glitch-GameServerJS/players/inc_teleportation.js');
    if (!existsSync(gsjs)) return;
    const src = readFileSync(gsjs, 'utf8');
    assert.match(src, /loc\.pols_is_pol\(\) && !loc\.pols_is_owner\(this\) && !loc\.getProp\('is_public'\)/);
  });
});
