/**
 * G1073 (chat 2026-11-20): players at Hazy Gate 5's board (job 552) read "needs Master Chef II" on a
 * work step that had not opened as a rule for joining. Austin's ruling (option A, explain the board):
 * one line saying anyone can give items and skills are only for tool work, each item ask links to
 * where the item comes from (the item's Encyclopedia page, as the pack's item card does), and a work
 * row names its skill only once that step is open. Glitch: items need no skill (quest.js 1471), tool
 * work needs the tool and the skill (quest.js 942-986, 1489).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeStreetJobState, phaseRequirements } from '../public/js/street-jobs.js?v=49beeb2b';
import { ITEM_GET_ANCHOR, JOB_ASK_TEXT, itemAskSubject, itemGetHref, showAskRule, workSkillNote } from '../public/js/street-job-asks.js?v=c2511e10';

import { streetJobsFeature, projectApi } from '../public/js/features/street-jobs-feature.js?v=7417e031';
import { createToolConditionState } from '../public/js/tools.js?v=4156bba8';
import { Display, FakeEl, fakePixi } from './fake-scene.js';

const root = join(import.meta.dirname, '..');
const catalog = JSON.parse(readFileSync(join(root, 'public/assets/content/street-jobs.json'), 'utf8'));
const feature = readFileSync(join(root, 'public/js/features/street-jobs-feature.js'), 'utf8');
const game = readFileSync(join(root, 'public/game.js'), 'utf8');
const label = (id) => ({ saucery_2: 'Saucery II', masterchef_2: 'Master Chef II', masterchef_1: 'Master Chef I' })[id] || id;

describe('G1073: the street project board explains who can give what', () => {
  const reqs = phaseRequirements(normalizeStreetJobState({}), catalog, '552');

  it('Hazy Gate 5 opens on plain vegetables; its work steps are locked', () => {
    const open = reqs.filter((r) => r.open);
    assert.ok(open.length >= 3);
    assert.ok(open.every((r) => r.type === 'item' && !r.skill));
    assert.deepEqual(reqs.filter((r) => r.type === 'work').map((r) => [r.skill, r.open]), [['saucery_2', false], ['masterchef_2', false]]);
  });

  it('a locked work step names no skill; an open one does', () => {
    for (const r of reqs.filter((x) => x.type === 'work')) assert.equal(workSkillNote(r, label), '', r.id);
    const work = reqs.find((r) => r.skill === 'masterchef_2');
    assert.equal(workSkillNote({ ...work, open: true }, label), 'needs Master Chef II');
    assert.equal(workSkillNote({ ...work, open: true, skill: 'masterchef_1', skillWas: 'masterchef_2' }, label), 'needs Master Chef I (II further out)');
    assert.equal(workSkillNote({ ...work, open: true, skill: '', skillWas: 'masterchef_2' }, label), JOB_ASK_TEXT.noSkillNearStart);
    assert.equal(workSkillNote({ ...work, open: false, skill: '', skillWas: 'masterchef_2' }, label), '');
    assert.equal(workSkillNote({ ...work, open: true, done: true }, label), '');
    assert.equal(workSkillNote(reqs.find((r) => r.type === 'item'), label), '');
  });

  it('the rule line: plain, short, shown while the project takes items or work', () => {
    assert.equal(JOB_ASK_TEXT.rule, 'Anyone can give items. Skills are only needed for tool work.');
    for (const t of Object.values(JOB_ASK_TEXT)) assert.doesNotMatch(t, /[–—]/);
    assert.equal(showAskRule(reqs, true), true);
    assert.equal(showAskRule(reqs, false), false);
    assert.equal(showAskRule(reqs.map((r) => ({ ...r, done: true })), true), false);
    assert.equal(showAskRule([{ type: 'currants', done: false }], true), false);
  });

  it('each open item ask goes to its Encyclopedia page at How to get it', () => {
    const zucchini = reqs.find((r) => r.classId === 'zucchini');
    assert.deepEqual(itemAskSubject(zucchini, () => 'Zucchini'), { id: 'zucchini', name: 'Zucchini' });
    assert.equal(itemAskSubject({ ...zucchini, done: true }), null);
    assert.equal(itemAskSubject(reqs.find((r) => r.type === 'work')), null);
    assert.equal(itemGetHref('https://x.test/encyclopedia/items/zucchini/'), `https://x.test/encyclopedia/items/zucchini/${ITEM_GET_ANCHOR}`);
    assert.equal(itemGetHref(''), '');
    // The anchor is the item page's "In the remake" heading, where How to get it is.
    const page = readFileSync(join(root, 'public/encyclopedia/items/zucchini/index.html'), 'utf8');
    assert.match(page, new RegExp(`id="${ITEM_GET_ANCHOR.slice(1)}"`));
    const after = page.slice(page.indexOf(`id="${ITEM_GET_ANCHOR.slice(1)}"`));
    assert.match(after.slice(0, 2000), /How to get it/);
  });

  it('the board (solo and shared, one renderPanel) uses them; the old always-on skill line is gone', () => {
    assert.doesNotMatch(feature, /else if \(r\.skill\) meta\.push\(`needs /);
    assert.match(feature, /const skillNote = workSkillNote\(r, skillLabel\);/);
    assert.match(feature, /<p class="sj-rule" data-sj-rule hidden><\/p>\s*<ul class="sj-reqs" data-sj-reqs><\/ul>/);
    assert.match(feature, /rule\.hidden = !showAskRule\(reqs, open\);/);
    assert.match(feature, /const getLink = askGetLink\(engine, itemAskSubject\(r, itemLabel\)\);/);
    assert.match(feature, /a\.href = itemGetHref\(a\.href\);/);
    // The link is the game's own Encyclopedia link (js/encyclopedia-links.js), handed to features by the engine.
    assert.match(game, /encyclopediaLink: \(subject, className = ''\) => encyclopedia\.link\(document, subject, className\),/);
    assert.match(game, /encyclopediaLoad: \(\) => encyclopedia\.load\(\),/);
  });
});

describe('G1073: Hazy Gate 5\'s board as drawn, solo and online', () => {
  const HAZY = '552';
  let engine;
  const saved = {};
  const linked = [];
  before(async () => {
    for (const k of ['document', 'window', 'fetch', 'PIXI']) saved[k] = globalThis[k];
    globalThis.window = { addEventListener() {}, removeEventListener() {} };
    const body = new FakeEl('body');
    globalThis.document = { baseURI: 'https://groddle.localhost/', createElement: (t) => new FakeEl(t), createTextNode: (t) => ({ text: t }), head: new FakeEl('head'), body, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
    globalThis.PIXI = fakePixi;
    globalThis.fetch = async (url) => {
      const rel = String(url).split('?')[0].replace(/^\//, '');
      try {
        return { ok: true, status: 200, json: async () => JSON.parse(readFileSync(join(root, 'public', rel), 'utf8')) };
      } catch {
        return { ok: false, status: 404, json: async () => null };
      }
    };
    engine = {
      mode: 'solo', PIXI: fakePixi, entityLayer: new Display(), fxLayer: new Display(),
      streetTsid: catalog.jobs[HAZY].connecting[0], street: { tsid: catalog.jobs[HAZY].connecting[0] }, player: { x: 500, y: 800 },
      interactables: [], inv: {}, pc: { level: 1, energy: 100, mood: 100, currants: 0 }, learnedSkills: [], unlockedAchievements: [],
      param: () => null, placement: () => [], toolState: createToolConditionState(), query: () => null, register: (t) => t,
      say() {}, setData() {}, toast() {}, prompt() {}, pushActivity() {}, floatText() {}, updateHud() {}, refreshPack() {}, playSound() {},
      award() {}, save() {}, achievement() {}, grantAchievement() {},
      // The game's Encyclopedia link (game.js engine.encyclopediaLink): an item with a page gets one.
      encyclopediaReady: true,
      encyclopediaLink: (subject, className) => {
        linked.push(subject.id);
        const a = new FakeEl('a');
        a.className = `ency-link ${className}`;
        a.href = `https://groddle.localhost/encyclopedia/items/${subject.id}/`;
        a.textContent = 'In the Encyclopedia';
        return a;
      },
    };
    streetJobsFeature.init(engine);
    streetJobsFeature.restore({}, engine);
    await projectApi.ready();
  });
  after(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete globalThis[k];
      else globalThis[k] = v;
    }
  });

  for (const mode of ['solo', 'multiplayer']) {
    it(`${mode}: the rule line, no skill on the locked work, a way to each vegetable`, () => {
      engine.mode = mode;
      streetJobsFeature.restore({}, engine);
      linked.length = 0;
      projectApi.open(engine, HAZY);
      const nodes = globalThis.document.body.all();
      const texts = nodes.map((n) => n.textContent).filter(Boolean);
      const rule = nodes.find((n) => n.textContent === JOB_ASK_TEXT.rule);
      assert.ok(rule && !rule.hidden, 'the rule line shows');
      assert.ok(!texts.some((t) => /saucery|master ?chef/i.test(t) && /needs /.test(t)), 'no "needs <skill>" on a locked work row');
      assert.ok(texts.some((t) => t.includes('opens after the earlier steps')));
      const links = nodes.filter((n) => n.dataset?.sjGet);
      assert.deepEqual(links.map((a) => a.dataset.sjGet).sort(), ['broccoli', 'cabbage', 'corn', 'onion', 'rice', 'zucchini']);
      for (const a of links) {
        assert.equal(a.textContent, JOB_ASK_TEXT.getIt);
        assert.equal(a.href, `https://groddle.localhost/encyclopedia/items/${a.dataset.sjGet}/${ITEM_GET_ANCHOR}`);
      }
    });
  }

  it('the work step names its skill once it opens', () => {
    engine.mode = 'solo';
    streetJobsFeature.restore({}, engine);
    const { state } = streetJobsFeature._state();
    const src = catalog.classes[catalog.jobs[HAZY].phases[0].classTsid].requirements;
    state.jobs[HAZY] = { phase: 0, got: Object.fromEntries(src.filter((r) => r.group === 1 && r.bucket === '1').map((r) => [r.id, r.num])), mine: {}, startedAt: 1 };
    projectApi.open(engine, HAZY);
    const texts = globalThis.document.body.all().map((n) => n.textContent).filter(Boolean);
    assert.ok(texts.some((t) => /needs saucery/i.test(t)), 'the open step says what it needs');
    assert.ok(!texts.some((t) => /needs master ?chef/i.test(t)), 'the other bucket\'s step is still locked');
  });
});
