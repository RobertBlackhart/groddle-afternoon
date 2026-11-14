/**
 * G738: the QA handles that change the game exist in solo and, online, only on a local host
 * (js/qa-gate.js). Online elsewhere groddleQA keeps its read-only inspectors and nothing else.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { exposeQA, isLocalHost, pickReadOnly, qaHandlesAllowed } from '../public/js/qa-gate.js?v=f4e2cd82';

const pub = join(import.meta.dirname, '..', 'public');
const read = (rel) => readFileSync(join(pub, rel), 'utf8');

describe('the QA gate, by host and mode', () => {
  it('solo keeps the handles everywhere', () => {
    for (const hostname of ['groddleafternoon.com', 'www.groddleafternoon.com', '127.0.0.1', 'groddle.localhost', '']) {
      assert.equal(qaHandlesAllowed({ mode: 'solo', hostname }), true, hostname);
    }
  });

  it('online keeps them on local hosts only', () => {
    for (const hostname of ['127.0.0.1', 'localhost', 'groddle.localhost', 'GRODDLE.LOCALHOST', 'lane.groddle.localhost', '::1', '[::1]']) {
      assert.equal(qaHandlesAllowed({ mode: 'multiplayer', hostname }), true, hostname);
    }
    for (const hostname of ['groddleafternoon.com', 'www.groddleafternoon.com', 'localhost.groddleafternoon.com', 'groddle.localhost.example.com', '10.0.0.5', '']) {
      assert.equal(qaHandlesAllowed({ mode: 'multiplayer', hostname }), false, hostname);
    }
    assert.equal(isLocalHost('notlocalhost'), false);
  });

  it('exposeQA sets a handle only where allowed, and takes away one set before', () => {
    const scope = { groddleThing: 'old' };
    assert.equal(exposeQA('groddleThing', { grant() {} }, { allowed: false, scope }), null);
    assert.equal('groddleThing' in scope, false);
    const value = { grant() {} };
    assert.equal(exposeQA('groddleThing', value, { allowed: true, scope }), value);
    assert.equal(scope.groddleThing, value);
  });

  it('pickReadOnly keeps only the named entries, nested ones too', () => {
    const full = { snapshot: () => 1, placeAvatar: () => 2, notify: { stats: () => 3, grantBadge: () => 4 } };
    const out = pickReadOnly(full, ['snapshot', 'missing', ['notify', ['stats']]]);
    assert.deepEqual(Object.keys(out).sort(), ['notify', 'snapshot']);
    assert.deepEqual(Object.keys(out.notify), ['stats']);
  });
});

describe('the game uses the gate', () => {
  const game = read('game.js');
  const list = /const READ_ONLY_QA = Object\.freeze\(\[([\s\S]*?)\]\);\n/.exec(game)?.[1] || '';

  it('online off a local host, groddleQA is the read-only part only', () => {
    assert.match(game, /window\.groddleQA = qaHandlesAllowed\(\) \? fullQA : pickReadOnly\(fullQA, READ_ONLY_QA\);/);
    assert.doesNotMatch(game, /window\.groddleQA\.\w+ =/, 'nothing is added to it after');
    for (const lever of ['grantBadge', 'completeQuest', 'travel', 'placeAvatar', 'pick', 'phonePinch', 'say', 'notice', 'mayhem']) {
      assert.doesNotMatch(list, new RegExp(`'${lever}'`), lever);
    }
    for (const kept of ['snapshot', 'renderStats', 'memoryStats']) assert.match(list, new RegExp(`'${kept}'`), kept);
    // Each read-only name is a real entry of the full object.
    const full = game.slice(game.indexOf('const fullQA = {'), game.indexOf('window.groddleQA = qaHandlesAllowed()'));
    for (const [, name] of list.matchAll(/'(\w+)'/g)) assert.match(full, new RegExp(`\\n\\s+(${name}(\\(|:)|${name},)|\\b${name}: `), name);
  });

  it('the feature levers that run verbs, move the player or grant are offered through the gate', () => {
    for (const [file, name] of [
      ['js/features/bags-feature.js', 'groddlePack'],
      ['js/features/home-storage-feature.js', 'groddleHomeStorage'],
      ['js/features/shared-patches-feature.js', 'groddleSharedPatches'],
      ['js/features/shared-gardens-feature.js', 'groddleSharedGardens'],
      ['js/features/snaps-feature.js', 'groddleSnaps'],
      ['js/features/world-drop-feature.js', 'groddleWorldDrop'],
      ['js/features/your-looks-feature.js', 'groddleYourLooks'],
      ['js/features/cubimal-battle-feature.js', 'groddleCubiBattle'],
      ['js/features/yard-verbs-mp-feature.js', 'groddleYard'],
      ['js/features/home-pool-mp-feature.js', 'groddleHomePool'],
    ]) {
      const src = read(file);
      assert.match(src, new RegExp(`exposeQA\\('${name}', `), file);
      assert.doesNotMatch(src, new RegExp(`^\\s*(if \\(.*\\) )?(window|globalThis)\\.${name} = `, 'm'), file);
    }
    assert.match(read('js/features/mayhem-feature.js'), /qa && !qa\.mayhem && QA_ALLOWED\)/);
    // The pack's grant stays a solo lever, as before.
    assert.match(read('js/features/bags-feature.js'), /engine\?\.mode === 'multiplayer' \? \{\} : \{ grant:/);
  });
});
