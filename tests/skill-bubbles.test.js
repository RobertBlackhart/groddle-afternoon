// G892: the skill-package words other players see in a bubble over a Glitch at work
// (public/js/skill-bubbles.js, features/skill-bubbles-feature.js), held to the GSJS calls they
// cite, the wire word to the server's word rule, and Butterfly care to no drawn stand-ins.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SKILL_BUBBLE, SKILL_BUBBLES, parseSkillBubbleWord, skillBubbleFor, skillBubbleWord } from '../public/js/skill-bubbles.js?v=5805a64a';
import { SKILL_BUBBLE_WORD } from '../public/js/realtime-client.js?v=73e1ae86';
import { onSkillBubble, skillBubblesFeature } from '../public/js/features/skill-bubbles-feature.js?v=ec937e17';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gsjs = join(root, '..', 'glitch-GameServerJS');
const hasGsjs = existsSync(join(gsjs, 'players/inc_skill_packages.js'));
const manifest = JSON.parse(readFileSync(join(root, 'public/assets/sprites/overlays/overlays-more.json'), 'utf8'));

describe('skill-bubbles: which verb shows which word', () => {
  it('maps the verbs GSJS runs with an overlay_id', () => {
    assert.equal(skillBubbleFor('npc_butterfly', 'milk'), 'butterfly_milk');
    assert.equal(skillBubbleFor('npc_butterfly', 'massage'), 'butterfly_massage');
    assert.equal(skillBubbleFor('npc_piggy', 'pet'), 'pig_pet');
    assert.equal(skillBubbleFor('npc_piggy', 'nibble'), 'pig_nibble');
    assert.equal(skillBubbleFor('npc_chicken', 'squeeze'), 'chicken_squeeze');
    assert.equal(skillBubbleFor('trant_bean', 'pet'), 'trant_pet');
    assert.equal(skillBubbleFor('wood_tree', 'pet'), 'trant_pet');
    assert.equal(skillBubbleFor('trant_fruit', 'harvest'), 'trant_harvest');
    assert.equal(skillBubbleFor('npc_piggy', 'rook_revive'), 'rooked_revive');
    assert.equal(skillBubbleFor('jellisac', 'scoop'), 'jellisac_scoop');
    // A tool package (wood_tree harvest plays the hatchet) and plain verbs show nothing.
    assert.equal(skillBubbleFor('wood_tree', 'harvest'), null);
    assert.equal(skillBubbleFor('npc_piggy', 'feed:cherry'), null);
    assert.equal(skillBubbleFor('rock_beryl_1', 'mine'), null);
  });

  it('every word is built, and every cited call names its overlay_id', { skip: !hasGsjs }, () => {
    const sp = readFileSync(join(gsjs, 'players/inc_skill_packages.js'), 'utf8');
    // The bubble to the others: 40 x 40 (or bubble_width), delta_y -110.
    assert.match(sp, /delta_y: args\.pc_delta_y \? args\.pc_delta_y : -110,\s*bubble: true,\s*width: args\.bubble_width \? args\.bubble_width : 40,\s*height: 40/);
    assert.equal(SKILL_BUBBLE.wh, 40);
    assert.equal(SKILL_BUBBLE.dy, -110);
    for (const [key, row] of Object.entries(SKILL_BUBBLES)) {
      assert.ok(manifest[key], `${key} built`);
      const [file, line] = row.src.split(' ');
      const text = readFileSync(join(gsjs, file), 'utf8').split('\n');
      assert.match(text[Number(line.replace(',', '')) - 1], new RegExp(`overlay_id\\s*[:=]\\s*'${key}'`), row.src);
    }
    assert.match(readFileSync(join(gsjs, 'items/include/rook.js'), 'utf8'), /overlay_id:'rooked_revive'[^\n]*bubble_width: 75/);
    assert.equal(SKILL_BUBBLES.rooked_revive.wh, 75);
  });
});

describe('skill-bubbles: the wire word', () => {
  it('round-trips whole seconds and fits the server word rule (hub.go wordRe [a-z0-9_]{1,24})', () => {
    for (const key of Object.keys(SKILL_BUBBLES)) {
      const w = skillBubbleWord(key, 99_000);
      assert.match(w, /^[a-z0-9_]{1,24}$/, w);
      assert.match(w, SKILL_BUBBLE_WORD, w);
      assert.deepEqual(parseSkillBubbleWord(w), { key, durationMs: 99_000 });
    }
    assert.equal(skillBubbleWord('pig_pet', 2600), 'sp_pig_pet_3');
    assert.equal(skillBubbleWord('pig_pet', 100), 'sp_pig_pet_1');
    assert.equal(skillBubbleWord('nope', 1000), null);
    assert.equal(parseSkillBubbleWord('sp_nope_3'), null);
    assert.equal(parseSkillBubbleWord('eyeballing'), null);
    assert.equal(parseSkillBubbleWord('sp_pig_pet_0'), null);
  });
});

function fakeEngine(mode, sent, over = {}) {
  const data = {};
  return {
    mode,
    data,
    query(hook) { return hook === 'realtimeClient' ? { emote: (e) => (sent.push(e), true), on: () => () => {} } : null; },
    setData(k, v) { data[k] = String(v); },
    param: () => null,
    ...over,
  };
}

describe('skill-bubbles feature', () => {
  it('online, a timed milk sends its word for the verb\'s seconds; solo sends nothing', () => {
    const sent = [];
    const online = fakeEngine('multiplayer', sent);
    skillBubblesFeature.verbStarted({ classId: 'npc_butterfly' }, { id: 'milk', durationMs: 3000 }, online);
    assert.deepEqual(sent, ['sp_butterfly_milk_3']);
    assert.equal(online.data.skillBubbleSent, 'sp_butterfly_milk_3');
    skillBubblesFeature.verbStarted({ classId: 'npc_piggy' }, { id: 'feed:cherry', durationMs: 3000 }, online);
    assert.equal(sent.length, 1);
    const solo = fakeEngine('solo', sent);
    skillBubblesFeature.verbStarted({ classId: 'npc_piggy' }, { id: 'pet', durationMs: 2000 }, solo);
    assert.equal(sent.length, 1);
  });

  it('another player\'s word draws a bubble over that player only while they are here', () => {
    const sent = [];
    let here = true;
    const engine = fakeEngine('multiplayer', sent, { query: (hook) => (hook === 'remoteAvatar' && here ? { x: 10, y: 20 } : null) });
    assert.equal(onSkillBubble(engine, { id: 4, e: 'sp_pig_pet_2' }), true);
    assert.equal(onSkillBubble(engine, { id: 4, e: 'eyeballing' }), false);
    here = false;
    assert.equal(onSkillBubble(engine, { id: 4, e: 'sp_pig_pet_2' }), false);
  });
});

describe('Butterfly care draws no stand-ins (G892)', () => {
  it('no emoji float, burst dots or squash on milk and massage', () => {
    const game = readFileSync(join(root, 'public/game.js'), 'utf8');
    assert.ok(!game.includes('🥛'));
    const fn = game.slice(game.indexOf('function playButterflyCareAnimation'), game.indexOf('function playHatchetAnimation'));
    assert.ok(fn.length > 0 && !/burst\(|scale|floatText/.test(fn), 'the care only holds the Butterfly still');
    const husbandry = readFileSync(join(root, 'public/js/features/animal-husbandry-feature.js'), 'utf8');
    const step = husbandry.slice(husbandry.indexOf('function stepButterflyCare'), husbandry.indexOf('function setWalkPose'));
    assert.ok(!/scale|rotation/.test(step));
  });
});
