/**
 * #674 follow-ups: one teleport sound per teleport, and the right one.
 *
 * Glitch played one sound per teleportToLocation: TELEPORT_AWAY, or TELEPORT_AWAY_HUB when the
 * target's hub differed from the current one (players/player.js 674-678).
 * - Quest rooms: instances_enter (players/inc_instances.js 89-104) and instances_exit
 *   (instances_left 175) are teleports. Every quest template that survives in the locations dump
 *   sat in a quest hub (61, 67, 79, 125, 132, 135), never a world hub, so in and out of a room
 *   from a street is TELEPORT_AWAY_HUB. The remake's rooms played no sound going in, and the
 *   signpost whoosh coming out. An exit signpost or exit door was a street move instead
 *   (main.js 1069-1082 signpost.instance_exit, 1172-1182 door.instance_exit), so those keep the whoosh.
 * - The Door Drink's portal made one move, pc.teleportToLocation (items/portal.js 80, 127); the
 *   remake played TELEPORT_AWAY itself and then the trip's teleport sound as well.
 * - The Teleportation skill's jump (players/inc_teleportation.js 400, 529 teleportToLocationDelayed)
 *   is a teleport too; it played the signpost whoosh.
 * Run: node --test tests/teleport-sound-rooms-674.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tripSound } from '../public/js/street-trip.js?v=89addd51';
import { QUEST_HUB_LOST, QUEST_ROOMS, ROOM_HUBS, ROOM_STREETS, roomHub } from '../public/js/quest-rooms/catalog.js?v=10c8100d';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const index = JSON.parse(read('public/assets/streets/index.json'));
const QUEST_HUBS = new Set(['61', '67', '79', '125', '132', '135']);
/** Hubs of the world's streets (everything but the quest hubs and scenes). */
const worldHubs = [...new Set(Object.values(index.streets).map((s) => String(s.hubId)))].filter((h) => h && !QUEST_HUBS.has(h));
const between = (src, from, to) => src.slice(src.indexOf(from), src.indexOf(to, src.indexOf(from)));

describe('#674: quest rooms go in and out by teleport', () => {
  it('every room has a template hub that is no world street\'s', () => {
    for (const roomId of new Set(Object.values(QUEST_ROOMS))) {
      const hub = roomHub(roomId);
      assert.ok(hub === QUEST_HUB_LOST || QUEST_HUBS.has(hub), `${roomId}: ${hub}`);
      assert.ok(!worldHubs.includes(hub), `${roomId}: ${hub} is a world hub`);
      for (const from of worldHubs) assert.equal(tripSound({ teleport: true, fromHubId: from, toHubId: hub }), 'TELEPORT_AWAY_HUB', `${roomId} from hub ${from}`);
    }
  });

  it('the hubs read from the locations dump: the instance copies and the rooms\' own streets', () => {
    assert.deepEqual({ ...ROOM_HUBS }, { le_miserable: '135', vision_quest: '61', gwendolyn: '79', ez_cookin: '132', soil_appreciation: '132' });
    for (const room of ['ez_cookin', 'soil_appreciation']) {
      for (const tsid of ROOM_STREETS[room]) assert.equal(String(index.streets[tsid].hubId), ROOM_HUBS[room], `${room} ${tsid}`);
    }
    assert.equal(String(index.streets.GCR8MORFJI12IR4.hubId), '79', "Room 23, Gwendolyn's tower hub");
    assert.equal(roomHub('rainbow_run'), QUEST_HUB_LOST, 'a lost template: a quest hub, number unknown');
  });

  it('the source: in (start, back from a party, after a reload) plays the teleport; out teleports unless by door or signpost', () => {
    const qi = read('public/js/features/quest-instances-feature.js');
    assert.match(qi, /function teleportInSound\(engine, roomId\) \{\s+engine\.playSound\?\.\(tripSound\(\{ teleport: true, fromHubId: engine\.street\?\.hubId, toHubId: roomHub\(roomId\) \}\)/);
    const start = between(qi, 'async function startInstance(', 'async function gotoStage(');
    assert.match(start, /teleportInSound\(engine, roomId\);\s+await withTransition\(/);
    assert.match(between(qi, 'async function resumeFromParty(', 'function backInRoom('), /teleportInSound\(engine, run\.roomId\);/);
    assert.match(between(qi, 'async function resumeHeldSave(', '/* G886'), /teleportInSound\(engine, run\.roomId\);/);
    const leave = between(qi, 'async function leaveInstance(', '/* G904: away at a party');
    assert.match(leave, /if \(to\) await engine\.enter\(to\.tsid, \{ spawnX: to\.x, spawnY: to\.y, teleport: true \}\)/);
    assert.match(leave, /useTransition, teleport: !opts\.via \}\)/);
    assert.match(leave, /engine\.playSound\?\.\(tripSound\(\{ teleport: !opts\.via, fromHubId: roomHub\(leftRoomId\), toHubId: 'home' \}\)/);
    assert.match(between(qi, 'async function leaveStray(', '\n}\n'), /teleport: true,/);
  });

  it('an exit door or signpost leaves by a street move: via door / signpost, and no extra whoosh of the room\'s own', () => {
    for (const room of ['color-unblocking', 'light-perspective', 'mental-block', 'picto-pattern', 'radiant-glare', 'tile-puzzle', 'le-miserable']) {
      assert.match(read(`public/js/quest-rooms/${room}.js`), /ctx\.leave\(\{ transition: ctx\.fx\(\), via: 'door' \}\)/, room);
    }
    const club = read('public/js/quest-rooms/clubhouse.js');
    assert.match(club, /ctx\.leave\(\{ transition: ctx\.fx\(\), via: 'signpost' \}\)/);
    assert.doesNotMatch(club, /ctx\.sound\('SIGNPOST_TRAVEL'/, 'the trip plays the one whoosh');
    // Glitch: each of these quests left by walking out (onExitLocation then instances_exit tidies up).
    const gsjs = (q) => readFileSync(join(root, '../glitch-GameServerJS/quests', `${q}.js`), 'utf8');
    for (const q of ['puzzle_level_color_blockage', 'puzzle_level_light_perspective', 'mental_block', 'picto_pattern', 'radiant_glare', 'btc_room_3', 'le_miserable']) {
      assert.match(gsjs(q), /function onExitLocation\([^)]*\)\{[\s\S]*?pc\.instances_exit\(/, q);
    }
  });
});

describe('#674: the Door Drink and the Teleportation skill play one teleport sound', () => {
  it('the door plays nothing itself; its trip is the teleport (TELEPORT_AWAY, or _HUB into another hub)', () => {
    const src = read('public/js/features/door-drink-feature.js');
    const travel = between(src, 'function travel(engine, target) {', '\n}\n');
    assert.doesNotMatch(travel, /playSound/);
    assert.match(travel, /engine\.enter\(target\.tsid, \{ spawnX: target\.x, spawnY: target\.y, teleport: true \}\)/);
    const portal = readFileSync(join(root, '../glitch-GameServerJS/items/portal.js'), 'utf8');
    assert.equal((portal.match(/pc\.teleportToLocation\(/g) || []).length, 2, 'doorOpened and openDoor: one teleport each');
    assert.doesNotMatch(portal, /announce_sound/);
    assert.equal(tripSound({ teleport: true, fromHubId: '56', toHubId: '56' }), 'TELEPORT_AWAY');
    assert.equal(tripSound({ teleport: true, fromHubId: '56', toHubId: '93' }), 'TELEPORT_AWAY_HUB');
  });

  it('the skill\'s jump and the stranded car\'s way off are teleports', () => {
    assert.match(read('public/js/features/teleportation-feature.js'), /engine\.enter\(warp\.target\.tsid, \{ spawnX: warp\.target\.x, spawnY: warp\.target\.y, teleport: true \}\)/);
    assert.match(between(read('public/js/features/subway-feature.js'), 'async function leaveStrandedCar(', '\n}\n'), /teleport: true,/);
  });
});
