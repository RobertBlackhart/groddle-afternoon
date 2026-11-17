/**
 * R18 (Austin 2026-11-17): every quest's offer gate comes from glitch-GameServerJS wherever GSJS has
 * one. A gate that differs from the quest file (prerequisites, prereq_quests, canOffer), a giver that
 * is not the original's, and every stand-in for a lost giver needs a row in
 * tools/quest-gates/table.mjs with its register row. Skipped when the GSJS checkout is not beside
 * the repo.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { GATE_DEVIATIONS, SPECIAL_TRIGGERS, STAND_INS } from '../tools/quest-gates/table.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GS = join(ROOT, '../glitch-GameServerJS');
const skip = existsSync(join(GS, 'quests')) ? false : 'glitch-GameServerJS is not beside the repo';
const quests = JSON.parse(readFileSync(join(ROOT, 'public/assets/content/quests.json'), 'utf8'));
const ROW = /^(G\d+[a-z]?|R18)$/;

function gsjsQuest(id) {
  const path = join(GS, 'quests', `${id}.js`);
  if (!existsSync(path)) return null;
  const src = readFileSync(path, 'utf8');
  const ctx = {};
  vm.runInNewContext(src, ctx, { timeout: 2000 });
  return {
    prerequisites: (ctx.prerequisites || []).map((p) => ({
      condition: p.condition,
      value: typeof p.value === 'function' ? 'custom' : p.value,
      not: Number(p.not) ? 1 : 0,
    })),
    prereqQuests: Array.isArray(ctx.prereq_quests) ? [...ctx.prereq_quests] : [],
    canOffer: typeof ctx.canOffer === 'function',
    neverOffer: /function canOffer\(pc\)\{\s*return false;\s*\}/.test(src),
  };
}
const key = (p) => `${p.condition}|${p.value}|${Number(p.not) ? 1 : 0}`;

/** quest id -> GSJS files (outside the quest's own) whose live code offers it. */
let offerSites = null;
function offerSitesFor(id) {
  if (!offerSites) {
    offerSites = new Map();
    const add = (q, file) => {
      if (!offerSites.has(q)) offerSites.set(q, new Set());
      offerSites.get(q).add(file);
    };
    const walk = (dir) => {
      for (const ent of readdirSync(join(GS, dir), { withFileTypes: true })) {
        const rel = dir ? `${dir}/${ent.name}` : ent.name;
        if (ent.isDirectory()) { if (!ent.name.startsWith('.')) walk(rel); continue; }
        if (!ent.name.endsWith('.js')) continue;
        const code = readFileSync(join(GS, rel), 'utf8').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
        const patterns = [
          /(?:quests_offer|startQuest)\(\s*['"]([a-z0-9_]+)['"]/g,
          /apiSetTimerX\('quests_offer',[^,]+,\s*'([a-z0-9_]+)'\)/g,
          /quest_name['"]?\s*:\s*['"]([a-z0-9_]+)['"]/g,
          /offer_quest', \{quest_id: '([a-z0-9_]+)'/g,
          /quest_id:"([a-z0-9_]+)"/g,
        ];
        for (const re of patterns) for (const m of code.matchAll(re)) add(m[1], rel);
        for (const m of code.matchAll(/(?:setAvailableQuests\(|available_quests = )\[([^\]]*)\]/g)) {
          for (const q of m[1].matchAll(/'([a-z0-9_]+)'/g)) add(q[1], rel);
        }
      }
    };
    walk('');
    // The skill and level maps name quests as values.
    const maps = [
      readFileSync(join(GS, 'inc_data_skills.js'), 'utf8').split('function skills_get_quest_map')[1] || '',
      (readFileSync(join(GS, 'players/inc_quests.js'), 'utf8').split('function quests_level_map')[1] || '').split('function quests_give_level_do')[0],
    ];
    for (const src of maps) {
      for (const line of src.split('\n')) {
        if (/^\s*\/\//.test(line)) continue;
        const m = line.match(/:\s*['"]([a-z0-9_]+)['"]/);
        if (m) add(m[1], 'quest maps');
      }
    }
  }
  return [...(offerSites.get(id) || [])].filter((f) => f !== `quests/${id}.js`);
}

test('build-quests.mjs --check: quests.json is what GSJS and the gate table build', { skip }, () => {
  const run = spawnSync(process.execPath, ['build-quests.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr || run.stdout);
});

test('every quest keeps its GSJS conditions unless a deviation row says why', { skip }, () => {
  const unexplained = [];
  for (const def of Object.values(quests)) {
    const gs = gsjsQuest(def.classTsid);
    if (!gs) continue;
    const dev = GATE_DEVIATIONS[def.classTsid];
    const game = new Set(def.prerequisites.map(key));
    const source = new Set(gs.prerequisites.map(key));
    const extra = [...game].filter((k) => !source.has(k));
    const missing = [...source].filter((k) => !game.has(k));
    const questsSame = JSON.stringify(def.prereqQuests) === JSON.stringify(gs.prereqQuests);
    // A canOffer kept as written: catalog.js OFFER_OVERRIDES puts it in as custom_code gates.
    const canOfferKept = gs.canOffer && questsSame && !missing.length && extra.every((k) => k.startsWith('custom_code|'));
    const conditionsDiffer = (extra.length || missing.length || !questsSame) && !canOfferKept;
    if (conditionsDiffer && !dev?.kind.includes('conditions') && !dev?.kind.includes('canOffer')) {
      unexplained.push(`${def.classTsid}: +${extra.join(',')} -${missing.join(',')} quests ${JSON.stringify(def.prereqQuests)} vs ${JSON.stringify(gs.prereqQuests)}`);
    }
    if (def.prereqProxy && !dev?.kind.includes('conditions')) unexplained.push(`${def.classTsid}: prereqProxy`);
    // canOffer false: the original never offered it.
    if (gs.neverOffer && def.solo && !def.custom && !dev?.kind.includes('canOffer')) unexplained.push(`${def.classTsid}: canOffer returns false`);
  }
  assert.deepEqual(unexplained, []);
});

test('every giver that is not the original\'s has a deviation row', { skip }, () => {
  const unexplained = Object.values(quests)
    .filter((def) => (def.offerTriggers || []).some((t) => t.override))
    .filter((def) => !GATE_DEVIATIONS[def.classTsid]?.kind.includes('giver'))
    .map((def) => def.classTsid);
  assert.deepEqual(unexplained, []);
});

test('a lost giver: the Magic Rock delivers on the quest file\'s own conditions, or a stand-in row', { skip }, () => {
  const problems = [];
  for (const def of Object.values(quests)) {
    const inferred = (def.offerTriggers || []).filter((t) => t.inferred);
    if (!inferred.length) continue;
    const gs = gsjsQuest(def.classTsid);
    const stand = STAND_INS[def.classTsid];
    for (const t of inferred) {
      if (t.type === 'prerequisites' && !gs.prerequisites.length) problems.push(`${def.classTsid}: 'prerequisites' with none in the file`);
      if (t.type === 'quest' && !gs.prereqQuests.includes(t.quest)) problems.push(`${def.classTsid}: 'quest' ${t.quest} is not a prereq_quest`);
      if (t.type === 'inferred') {
        if (!stand) { problems.push(`${def.classTsid}: inferred gate with no STAND_INS row`); continue; }
        const { type, inferred: _i, why, ...gate } = t;
        assert.deepEqual(gate, stand.gate, def.classTsid);
        if (gs.prerequisites.length) problems.push(`${def.classTsid}: the file has prerequisites; use them, not a stand-in`);
        const missingPre = gs.prereqQuests.filter((q) => !(stand.gate.quests || []).includes(q));
        if (missingPre.length) problems.push(`${def.classTsid}: stand-in drops prereq_quests ${missingPre}`);
      }
    }
    // Nothing in GSJS offers it (else the builder's scans would have found a giver).
    const sites = offerSitesFor(def.classTsid).filter((f) => !(stand?.seenOnlyIn || []).includes(f));
    if (sites.length) problems.push(`${def.classTsid}: GSJS offers it in ${sites.join(', ')}`);
  }
  assert.deepEqual(problems, []);
});

test('gate table rows are live and cite a register row', { skip }, () => {
  for (const [id, row] of Object.entries(STAND_INS)) {
    assert.ok(quests[id], `${id} is not a quest`);
    assert.ok((quests[id].offerTriggers || []).some((t) => t.type === 'inferred'), `${id}: stand-in not used`);
    assert.match(row.row, ROW, id);
    assert.ok(row.why && row.gsjs, id);
  }
  for (const [id, row] of Object.entries(GATE_DEVIATIONS)) {
    assert.ok(quests[id], `${id} is not a quest`);
    assert.match(row.row, ROW, id);
    assert.ok(row.why && row.kind.length, id);
    assert.ok(row.ruling === null || /^Austin \d{4}-\d{2}-\d{2}/.test(row.ruling), id);
  }
});

test('each hand-read trigger cites a GSJS line that offers the quest', { skip }, () => {
  for (const [id, { source }] of Object.entries(SPECIAL_TRIGGERS)) {
    const [, file, from, to] = source.match(/^(\S+) (\d+)(?:-(\d+))?$/);
    const lines = readFileSync(join(GS, file), 'utf8').split('\n').slice(Number(from) - 1, Number(to || from));
    assert.ok(lines.some((l) => l.includes(`'${id}'`)), `${id}: ${source}`);
  }
});
