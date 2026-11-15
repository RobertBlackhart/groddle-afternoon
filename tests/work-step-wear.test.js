/**
 * #366: project work steps said "1 wear a unit" for a Focusing Orb, which has no wear meter. In
 * Glitch the orb and the other wear-free tools have points_capacity 0 and display_wear 0
 * (glitch-GameServerJS items/focusing_orb.js 25-26), so the step line names wear only for a tool
 * that wears, and working with the orb spends nothing.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import {
  canUseTool,
  createToolConditionState,
  useToolCondition,
  workStepCost,
  workUnitWear,
} from '../public/js/tools.js?v=1bc47590';

const GSJS = new URL('../../glitch-GameServerJS/items/', import.meta.url);
const jobs = JSON.parse(readFileSync(new URL('../public/assets/content/street-jobs.json', import.meta.url), 'utf8'));

function workTools() {
  const out = new Set();
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    if (o.type === 'work') for (const c of o.classIds?.length ? o.classIds : [o.classId]) out.add(c);
    Object.values(o).forEach(walk);
  };
  walk(jobs);
  return [...out];
}

describe('#366 project work step wear', () => {
  it('names no wear for the Focusing Orb and wear for a Shovel', () => {
    assert.equal(workStepCost({ classIds: ['focusing_orb'], energy: 8, wear: 1 }), '8 energy');
    assert.equal(workStepCost({ classIds: ['shovel'], energy: 8, wear: 2 }), '8 energy · 2 wear a unit');
    assert.equal(workStepCost({ classId: 'construction_tool', energy: 20, wear: 2 }), '20 energy · 2 wear a unit');
    assert.equal(workUnitWear(['shovel', 'ace_of_spades'], 1), 1);
  });

  it('spends no wear on the orb, as canUseTool tracks no condition for it', () => {
    const state = createToolConditionState();
    assert.equal(canUseTool(state, 'focusing_orb', 1).condition.tracked, false);
    const res = useToolCondition(state, 'focusing_orb', 1);
    assert.equal(res.ok, true);
    assert.equal(res.wear, 0);
  });

  it('every work-step tool shows wear exactly when its GSJS item displays wear', () => {
    let checked = 0;
    for (const cls of workTools()) {
      let src;
      try {
        src = readFileSync(new URL(`${cls}.js`, GSJS), 'utf8');
      } catch {
        continue; // the GSJS checkout sits beside the worktree; skip a class it lacks
      }
      const display = /"display_wear"\s*:\s*"1"/.test(src);
      assert.equal(workUnitWear([cls], 1) > 0, display, `${cls}: display_wear ${display ? 1 : 0}`);
      checked += 1;
    }
    if (checked) assert.ok(checked > 20);
  });
});
