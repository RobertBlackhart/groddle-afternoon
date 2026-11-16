/**
 * Report #425 (register G882; Austin 2026-11-16): solo street projects scale by distance from the
 * start, fewer resources and fewer skills near Hechey Track, more further out; online stays exactly
 * as it is. js/street-jobs-solo.js holds the distance (signposts walked from the starter street over
 * assets/content/signpost-graph.json) and the curve; js/street-jobs.js reads `job.solo`, which the
 * feature puts on only in solo.
 * Run: node --test tests/street-jobs-solo-scale.test.js
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SKILLS_WAIVED, SOLO_CURVE, SOLO_PANEL_LINE, applySoloScale, hopsFromStart, soloAmountsLine, soloSkill, soloTerms } from '../public/js/street-jobs-solo.js?v=24c5b7be';
import {
  SOLO_DIVISOR,
  jobDivisor,
  jobRewardsText,
  normalizeStreetJobState,
  phaseIsComplete,
  phaseRequirements,
  settlePhase,
  soloNeed,
  workCheck,
} from '../public/js/street-jobs.js?v=35880b67';
import { projectTable } from '../tools/build-realtime-projects.mjs';
import { PROJECTS_TEXT } from '../public/js/projects-tracker.js?v=85716726';
import { streetJobsFeature, projectApi } from '../public/js/features/street-jobs-feature.js?v=d2743306';
import { createToolConditionState } from '../public/js/tools.js?v=8516a0c3';
import { Display, FakeEl, fakePixi } from './fake-scene.js';

const root = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(root, 'public', rel), 'utf8');
const rawCatalog = () => JSON.parse(read('assets/content/street-jobs.json'));
const graph = JSON.parse(read('assets/content/signpost-graph.json'));
const index = JSON.parse(read('assets/streets/index.json'));
const HECHEY = 'GLI2V0UN7RD1T2J';
const HOPS = hopsFromStart(graph, index.default);
const scaled = () => applySoloScale(rawCatalog(), HOPS, true);
const SYLVAN = '5'; // Sylvan Grove, Groddle Forest, 3 streets out
const MULLAT = '172'; // Mullat, Shimla Mirch, 9 out
const VASKO = '197'; // Vasko Shift, Chakra Phool, 14 out
const FAR = Object.entries(rawCatalog().jobs).find(([, j]) => j.kind === 'street' && HOPS[j.street] >= 20)[0];

describe('the distance from the start', () => {
  it('starts at Hechey Track, the starter street the tutorial lets you out on', () => {
    assert.equal(index.default, HECHEY);
    assert.equal(HOPS[HECHEY], 0);
  });

  it('reaches every street a project builds or upgrades, the same every time', () => {
    const cat = rawCatalog();
    for (const job of Object.values(cat.jobs)) assert.ok(Number.isFinite(HOPS[job.street]), `${job.label} is reached`);
    assert.deepEqual(hopsFromStart(graph, index.default), HOPS);
    assert.equal(HOPS[cat.jobs[SYLVAN].street], 3);
    assert.equal(HOPS[cat.jobs[MULLAT].street], 9);
    assert.equal(HOPS[cat.jobs[VASKO].street], 14);
  });

  it('walks signposts and doors the way they go', () => {
    const g = { streets: { A: ['B'], B: ['C'], D: ['A'] }, doors: { C: ['LX'] } };
    assert.deepEqual(hopsFromStart(g, 'A'), { A: 0, B: 1, C: 2, GX: 3 });
    assert.deepEqual(hopsFromStart(null, 'A'), {});
  });
});

describe('the curve', () => {
  it('eases less with each row and ends at today\'s amounts', () => {
    for (let i = 1; i < SOLO_CURVE.length; i += 1) {
      assert.ok(SOLO_CURVE[i].hops > SOLO_CURVE[i - 1].hops);
      assert.ok(SOLO_CURVE[i].divisor <= SOLO_CURVE[i - 1].divisor);
      assert.ok(SOLO_CURVE[i].skillDrop <= SOLO_CURVE[i - 1].skillDrop);
    }
    const last = SOLO_CURVE[SOLO_CURVE.length - 1];
    assert.equal(last.hops, Infinity);
    assert.equal(last.divisor, SOLO_DIVISOR);
    assert.equal(last.skillDrop, 0);
    assert.deepEqual(soloTerms(null), { hops: null, divisor: SOLO_DIVISOR, skillDrop: 0 });
    assert.deepEqual(soloTerms(3), { hops: 3, divisor: 500, skillDrop: SKILLS_WAIVED });
  });

  it('drops a skill a level at a time, to nothing', () => {
    assert.equal(soloSkill('soil_appreciation_3', 2), 'soil_appreciation_1');
    assert.equal(soloSkill('soil_appreciation_3', 3), '');
    assert.equal(soloSkill('mining_4', 0), 'mining_4');
    assert.equal(soloSkill('refining_2', SKILLS_WAIVED), '');
  });
});

describe('solo amounts and skills', () => {
  it('near the start asks a small basket and no skills', () => {
    const cat = scaled();
    const reqs = phaseRequirements(normalizeStreetJobState({}), cat, SYLVAN);
    assert.equal(jobDivisor(cat.jobs[SYLVAN]), 500);
    for (const r of reqs) {
      assert.equal(r.need, Math.max(1, Math.ceil(r.num / 500)), r.id);
      assert.ok(r.need <= 2, `${r.id} asks ${r.need}`);
      if (r.type === 'work') assert.equal(r.skill, '', `${r.id} needs no skill`);
    }
    const work = reqs.find((r) => r.type === 'work' && r.skillWas);
    const got = Object.fromEntries(reqs.filter((r) => r.bucket === work.bucket && r.group < work.group).map((r) => [r.id, r.need]));
    const st = normalizeStreetJobState({ jobs: { [SYLVAN]: { phase: 0, got } } });
    const check = workCheck(st, cat, SYLVAN, work.id, { inv: { [work.classIds[0]]: 1 }, learned: [], energy: 100 });
    assert.equal(check.ok, true, check.msg);
  });

  it('further out asks more, with skills a level or two lower; far out is today\'s', () => {
    const cat = scaled();
    const mid = phaseRequirements(normalizeStreetJobState({}), cat, MULLAT);
    assert.equal(jobDivisor(cat.jobs[MULLAT]), 200);
    assert.equal(mid.find((r) => r.skillWas === 'soil_appreciation_5').skill, 'soil_appreciation_3');
    assert.equal(mid.find((r) => r.skillWas === 'refining_2').skill, '');
    assert.equal(jobDivisor(cat.jobs[VASKO]), 120);
    const far = phaseRequirements(normalizeStreetJobState({}), cat, FAR);
    const src = cat.classes[cat.jobs[FAR].phases[0].classTsid].requirements;
    far.forEach((r, i) => {
      assert.equal(r.need, soloNeed(src[i].num, SOLO_DIVISOR));
      assert.equal(r.skill, src[i].skill);
      assert.equal(r.skillWas, undefined);
    });
  });

  it('pays the phase rewards over the same divisor', () => {
    const cat = scaled();
    const def = cat.classes[cat.jobs[SYLVAN].phases[0].classTsid];
    assert.match(jobRewardsText(cat.jobs[SYLVAN], def).all, new RegExp(`^All contributors will split: ${Math.round(def.rewards.xp / 500)} iMG`));
    const st = normalizeStreetJobState({});
    const row = { phase: 0, got: {}, mine: {} };
    let cost = 0;
    for (const r of phaseRequirements(st, cat, SYLVAN)) {
      row.got[r.id] = r.need;
      cost += r.need * r.baseCost;
    }
    row.mine[cat.jobs[SYLVAN].phases[0].classTsid] = cost;
    st.jobs[SYLVAN] = normalizeStreetJobState({ jobs: { [SYLVAN]: row } }).jobs[SYLVAN];
    const out = settlePhase(st, cat, SYLVAN, 1000, () => 0.99);
    assert.equal(out.ok, true);
    assert.equal(out.rewards.xp, Math.round(def.rewards.xp / 500));
  });

  it('keeps what a save put in at the old amounts: nothing refunded or taken', () => {
    // A save from before: half of every ask at 1/50, in Sylvan Grove.
    const before = rawCatalog();
    const row = { phase: 0, got: {}, mine: {} };
    for (const r of phaseRequirements(normalizeStreetJobState({}), before, SYLVAN)) row.got[r.id] = Math.floor(r.need / 2);
    const classTsid = before.jobs[SYLVAN].phases[0].classTsid;
    row.mine[classTsid] = 1234;
    const save = normalizeStreetJobState({ jobs: { [SYLVAN]: row } });
    const keep = JSON.stringify(save);
    const cat = scaled();
    const reqs = phaseRequirements(save, cat, SYLVAN);
    for (const r of reqs) assert.equal(r.got, Math.min(r.need, row.got[r.id]), r.id);
    assert.equal(JSON.stringify(save), keep, 'reading the new amounts writes nothing');
    assert.ok(reqs.filter((r) => r.done).length > 0, 'the smaller asks are already met');
  });
});

describe('the words', () => {
  it('the board says the amounts and why they are smaller', () => {
    const cat = scaled();
    assert.equal(soloAmountsLine(cat.jobs[SYLVAN]), 'Solo amounts: 1/500 of the original multiplayer totals, as Sylvan Grove is 3 streets from the start. Its work needs no skills.');
    assert.equal(soloAmountsLine(cat.jobs[MULLAT]), 'Solo amounts: 1/200 of the original multiplayer totals, as Mullat is 9 streets from the start. Its work skills are 2 levels lower.');
    assert.equal(soloAmountsLine(cat.jobs[VASKO]), 'Solo amounts: 1/120 of the original multiplayer totals, as Vasko Shift is 14 streets from the start. Its work skills are a level lower.');
    assert.equal(soloAmountsLine(cat.jobs[FAR]), 'Solo amounts: 1/50 of the original multiplayer totals.');
    assert.equal(soloAmountsLine(rawCatalog().jobs[SYLVAN]), null, 'online has none');
    assert.equal(PROJECTS_TEXT.solo, SOLO_PANEL_LINE);
    assert.equal(SOLO_PANEL_LINE, 'Solo amounts: 1/50 of the original totals, down to 1/500 near the start.');
    for (const line of [SOLO_PANEL_LINE, ...[SYLVAN, MULLAT, VASKO].map((id) => soloAmountsLine(cat.jobs[id]))]) assert.ok(!line.includes('\u2014'), 'no em-dash');
  });
});

describe('online is untouched', () => {
  it('the raw catalog (what multiplayer reads) keeps 1/50 and every skill', () => {
    const cat = rawCatalog();
    const st = normalizeStreetJobState({});
    for (const [id, job] of Object.entries(cat.jobs)) {
      if (job.kind !== 'street' && job.kind !== 'upgrade') continue;
      assert.equal(job.solo, undefined);
      assert.equal(jobDivisor(job), SOLO_DIVISOR, id);
      job.phases.forEach((p, i) => {
        const src = cat.classes[p.classTsid].requirements;
        phaseRequirements(st, cat, id, i).forEach((r, k) => {
          assert.equal(r.need, soloNeed(src[k].num, SOLO_DIVISOR), `${id} ${r.id}`);
          assert.equal(r.skill, src[k].skill, `${id} ${r.id} skill`);
        });
      });
    }
  });

  it('the realtime server\'s table is the same with the solo terms switched off', () => {
    const want = projectTable(rawCatalog());
    const cat = applySoloScale(applySoloScale(rawCatalog(), HOPS, true), HOPS, false);
    assert.deepEqual(projectTable(cat), want);
    for (const row of Object.values(want.jobs)) if (row.kind !== 'hall') assert.equal(row.divisor, SOLO_DIVISOR);
  });

  describe('the feature puts the terms on in solo only', () => {
    let engine;
    const awards = [];
    const saved = {};
    before(async () => {
      for (const k of ['document', 'window', 'fetch', 'PIXI']) saved[k] = globalThis[k];
      globalThis.window = { addEventListener() {}, removeEventListener() {} };
      const body = new FakeEl('body');
      globalThis.document = { baseURI: 'https://groddle.localhost/', createElement: (t) => new FakeEl(t), createTextNode: (t) => ({ text: t }), head: new FakeEl('head'), body, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
      globalThis.PIXI = fakePixi;
      globalThis.fetch = async (url) => {
        const rel = String(url).split('?')[0].replace(/^\//, '');
        try {
          return { ok: true, status: 200, json: async () => JSON.parse(read(rel)) };
        } catch {
          return { ok: false, status: 404, json: async () => null };
        }
      };
      engine = {
        mode: 'multiplayer',
        PIXI: fakePixi,
        entityLayer: new Display(),
        fxLayer: new Display(),
        streetTsid: HECHEY,
        street: { tsid: HECHEY },
        player: { x: 500, y: 800 },
        interactables: [],
        inv: {},
        pc: { level: 1, energy: 100, mood: 100, currants: 0 },
        learnedSkills: [],
        unlockedAchievements: [],
        param: () => null,
        placement: () => [],
        toolState: createToolConditionState(),
        query: () => null,
        register: (t) => t,
        say() {},
        setData() {},
        toast() {},
        prompt() {},
        pushActivity() {},
        floatText() {},
        updateHud() {},
        refreshPack() {},
        playSound() {},
        award: (a) => awards.push(a),
        save() {},
        achievement() {},
        grantAchievement() {},
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

    it('online: no terms, 1/50 and the source skills', () => {
      const cat = projectApi.catalog();
      assert.equal(cat.jobs[SYLVAN].solo, undefined);
      assert.equal(cat.jobs[SYLVAN].hops, 3, 'the distance is known, and unused');
      const src = cat.classes[cat.jobs[SYLVAN].phases[0].classTsid].requirements;
      projectApi.requirements(SYLVAN).forEach((r, i) => {
        assert.equal(r.need, soloNeed(src[i].num, SOLO_DIVISOR));
        assert.equal(r.skill, src[i].skill);
      });
    });

    it('solo: the terms by distance; online again: gone', () => {
      engine.mode = 'solo';
      streetJobsFeature.restore({}, engine);
      const cat = projectApi.catalog();
      assert.deepEqual(cat.jobs[SYLVAN].solo, { hops: 3, divisor: 500, skillDrop: SKILLS_WAIVED });
      assert.ok(projectApi.requirements(SYLVAN).every((r) => r.need <= 2));
      engine.mode = 'multiplayer';
      streetJobsFeature.restore({}, engine);
      assert.equal(cat.jobs[SYLVAN].solo, undefined);
      assert.equal(phaseIsComplete(normalizeStreetJobState({}), cat, SYLVAN), false);
    });

    it('solo: a save\'s phase the smaller amounts already fill finishes when its board opens, keeping every contribution', () => {
      // Mullat (9 out, 1/200): a save from before put in at least the new amount of every ask of phase 1.
      const raw = rawCatalog();
      const job = raw.jobs[MULLAT];
      const cls = job.phases[0].classTsid;
      const got = {};
      for (const r of raw.classes[cls].requirements) got[r.id] = Math.max(1, Math.ceil(r.num / 200));
      const mine = { [cls]: 900 };
      engine.mode = 'solo';
      engine.streetTsid = job.connecting[0];
      engine.inv = { plank: 4 };
      streetJobsFeature.restore({ initialized: true, jobs: { [MULLAT]: { phase: 0, got, mine, startedAt: 1 } } }, engine);
      const before = awards.length;
      projectApi.open(engine, MULLAT);
      const { state } = streetJobsFeature._state();
      assert.equal(state.jobs[MULLAT].phase, 1, 'on to phase 2');
      assert.equal(state.jobs[MULLAT].mine[cls], 900, 'the contribution stands');
      // The phase's performance drop may add to the pack; nothing it held goes back or out.
      assert.ok(engine.inv.plank >= 4, 'nothing refunded or taken');
      assert.equal(awards.length, before + 1, 'the phase card');
      assert.match(awards.at(-1).steps.map((x) => x.text).join(' '), /Solo amounts are 1\/200 of the original multiplayer totals, and the phase rewards scale by the same 1\/200\./);
      // Phase 2's rows: a skill two levels lower says so, a waived one too.
      const texts = globalThis.document.body.all().map((n) => n.textContent).filter(Boolean);
      const phase2 = raw.classes[job.phases[1].classTsid].requirements.filter((r) => r.skill);
      for (const r of phase2) {
        const level = Number(r.skill.match(/_(\d+)$/)[1]);
        if (level <= 2) assert.ok(texts.some((t) => t.includes('no skill needed this close to the start')), r.id);
        else assert.ok(texts.some((t) => / \((III|IV|V|VI) further out\)/.test(t)), r.id);
      }
      projectApi.open(engine, MULLAT);
      assert.equal(state.jobs[MULLAT].phase, 1, 'once');
      engine.mode = 'multiplayer';
      streetJobsFeature.restore({}, engine);
    });
  });
});
