/**
 * #553 (Austin 2026-11-19): street projects whose words named the wrong street. The location XML's
 * title_override/desc_override were copied between neighbours: the Amerran Huddles board said
 * "Build Perhoni Flim", three said "Kitkaa Carom", Tamila was "Tamlia", the Tower streets were cut
 * short. build-street-jobs.mjs corrects them from each project's own street and hub
 * (tools/street-jobs-words.mjs, the source text kept beside each fix), tidies stray whitespace, and
 * fails (with --check too) on any street project whose words name another street or hub.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  STREET_JOB_CORRECTIONS,
  correctStreetJobWords,
  streetJobWordFailures,
  streetJobWordProblems,
  tidyJobText,
} from '../tools/street-jobs-words.mjs';

const ROOT = new URL('../', import.meta.url);
const catalog = JSON.parse(readFileSync(new URL('public/assets/content/street-jobs.json', ROOT), 'utf8'));
const job = (id) => catalog.jobs[id];

describe('#553: every street project names its own street and hub', () => {
  it('no street project fails the words check', () => {
    assert.deepEqual(streetJobWordFailures(catalog), []);
    assert.ok(Object.values(catalog.jobs).filter((j) => j.kind === 'street').length > 600);
  });

  it('the reported ones read right', () => {
    assert.equal(job(203).title, 'Build Amerran Huddles In Chakra Phool');
    assert.equal(job(203).desc, 'Expand Chakra Phool by building a new street, Amerran Huddles.');
    assert.equal(job(212).title, 'Build Tower St South In Jethimadh');
    assert.equal(job(299).desc, 'Expand Ilmenskie Deeps by building a new street, Malika Whim.');
    assert.equal(job(301).desc, 'Expand Ilmenskie Deeps by building a new street, Churni Sanctum.');
    assert.equal(job(336).title, 'Build Stake Claim Rd F In Baqala');
    assert.equal(job(383).desc, 'Expand Choru by building a new street, Tumble Rd 3.');
    assert.equal(job(494).title, 'Build Kifti Crown In Tamila');
    assert.equal(job(491).title, 'Build Mesob Medium In Tamila');
    assert.equal(job(492).title, 'Build Chari Chalks In Tamila');
    for (const [id, dir] of [[209, 'East'], [220, 'North'], [231, 'West']]) assert.equal(job(id).title, `Build Tower St ${dir} In Jethimadh`);
    assert.equal(job(231).desc, 'Expand Jethimadh by building a new street, Tower St West.');
    // The right ones are untouched.
    assert.equal(job(200).title, 'Build Perhoni Flim In Chakra Phool');
    assert.equal(job(198).desc, 'Expand Chakra Phool by building a new above ground street, Ivalo Trims.');
  });

  it('stray whitespace and a title\'s full stop are gone everywhere', () => {
    for (const [id, j] of Object.entries(catalog.jobs)) {
      if (j.kind !== 'street') continue;
      assert.equal(j.title, tidyJobText(j.title, { title: true }), id);
      assert.equal(j.desc, tidyJobText(j.desc), id);
    }
    assert.equal(job(193).title, 'Build Ratin Jot Jog In Chakra Phool');
    assert.equal(job(296).title, 'Build Malaren Urge In Bortola');
    assert.equal(job(699).desc, 'Expand into Pollokoo by building a new street, ZilZiil Zeal.');
  });
});

describe('#553: the check catches a new one', () => {
  const base = { kind: 'street', label: 'Amerran Huddles', hub: 'Chakra Phool' };
  it('another street, another hub, a swapped pair, a shortened name, stray space', () => {
    const ok = { ...base, title: 'Build Amerran Huddles In Chakra Phool', desc: 'Expand Chakra Phool by building a new street, Amerran Huddles.' };
    assert.deepEqual(streetJobWordProblems(ok), []);
    assert.deepEqual(streetJobWordProblems({ ...base, title: 'Build Amerran Huddles', desc: '' }), [], 'the builder\'s own default');
    assert.ok(streetJobWordProblems({ ...ok, title: 'Build Perhoni Flim In Chakra Phool' }).length);
    assert.ok(streetJobWordProblems({ ...ok, title: 'Build Amerran Huddles In Tamlia' }).length);
    assert.ok(streetJobWordProblems({ ...ok, desc: 'Expand Chakra Phool by building a new street, Kitkaa Carom.' }).length);
    assert.ok(streetJobWordProblems({ ...ok, desc: 'Expand Amerran Huddles by building a new street, Chakra Phool.' }).length);
    assert.ok(streetJobWordProblems({ ...ok, desc: 'Expand Zhambu by building a new street, Amerran Huddles.' }).length);
    assert.ok(streetJobWordProblems({ ...ok, desc: 'Expand Chakra Phool by building a new street, Huddles.' }).length);
    assert.ok(streetJobWordProblems({ ...ok, title: 'Build Amerran Huddles In Chakra Phool.' }).length);
    assert.ok(streetJobWordProblems({ ...ok, desc: `${ok.desc} ` }).length);
    // The source's other true forms pass.
    assert.deepEqual(streetJobWordProblems({ kind: 'street', label: 'Lemmen Connect', hub: 'Chakra Phool', title: 'Build Lemmen Connect In Chakra Phool', desc: 'Expand from Shimla Mirch into Chakra Phool by building a new above ground street, Lemmen Connect.' }), []);
    assert.deepEqual(streetJobWordProblems({ kind: 'street', label: 'Tlemcen', hub: 'Shimla Mirch', title: 'Build Tlemcen Street', desc: 'Expand Shimla Mirch by creating a new street, Tlemcen, connected right here to Somewhat Sump.' }), []);
  });

  it('a correction whose source text changed stops the build', () => {
    assert.throws(() => correctStreetJobWords('203', { title: 'Build Something Else In Chakra Phool', desc: STREET_JOB_CORRECTIONS[203].desc.source }), /the source now reads/);
    const out = correctStreetJobWords('203', { title: ` ${STREET_JOB_CORRECTIONS[203].title.source} `, desc: `${STREET_JOB_CORRECTIONS[203].desc.source}\n` });
    assert.deepEqual(out, { title: STREET_JOB_CORRECTIONS[203].title.fixed, desc: STREET_JOB_CORRECTIONS[203].desc.fixed });
    for (const [id, fix] of Object.entries(STREET_JOB_CORRECTIONS)) {
      assert.ok(fix.why && (fix.title || fix.desc), id);
      for (const f of [fix.title, fix.desc].filter(Boolean)) assert.notEqual(f.source, f.fixed, id);
    }
  });

  it('the builder\'s --check passes on the built file (when the Tiny Speck sources are here)', { skip: !existsSync(new URL('../glitch-GameServerJS/quests', ROOT)) && 'no GameServerJS checkout' }, () => {
    const out = execFileSync(process.execPath, ['build-street-jobs.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
    assert.match(out, /street jobs are current \(\d+ street projects, words checked\)/);
  });
});
