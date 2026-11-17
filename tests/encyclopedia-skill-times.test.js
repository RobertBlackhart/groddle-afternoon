/**
 * G956 (Austin 2026-11-17): the Encyclopedia shows how long timed skills take,
 * a rank x best speed card table per skill package (tools/encyclopedia/skill-times.mjs),
 * on every skill page in it and every speed card's page. Every cell must be what
 * skillPackageDetails (the port of GSJS getSkillPackageDetails) returns.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SKILL_PACKAGES, skillPackageDetails } from '../public/js/skill-packages.js?v=bfb87281';
import { GSJS_SKILL_PACKAGES } from '../public/js/skill-bubbles.js?v=60df8d16';
import { TIME_TABLES, cardsFor, learnedFor, tablesForCard, tablesForSkill, timeText } from '../tools/encyclopedia/skill-times.mjs';

const pub = join(import.meta.dirname, '..', 'public');
const page = (section, id) => readFileSync(join(pub, 'encyclopedia', section, id, 'index.html'), 'utf8');
/** The "How long it takes" band of a page, or ''. */
const band = (html) => html.match(/<section[^>]*aria-labelledby="time-h">[\s\S]*?<\/section>/)?.[0] || '';
const rowOf = (html, name) => html.match(new RegExp(`<tr[^>]*><th scope="row">(?:<a [^>]*>|<strong>)?${name}(?:</a>|</strong>)?[\\s\\S]*?</tr>`))?.[0] || '';

describe('encyclopedia: how long timed skills take (G956)', () => {
  it('every cell, energy and tool wear is what skillPackageDetails gives, for every package sharing the table', () => {
    let cells = 0;
    for (const t of TIME_TABLES) {
      for (const id of t.ids) {
        for (const r of t.rows) {
          const base = skillPackageDetails(id, learnedFor(r.skill));
          assert.equal(base.skill, r.skill, `${id} ${r.skill}: the row applies`);
          assert.equal(r.energy, base.energy_cost ?? null, `${id} ${r.skill}: energy`);
          assert.equal(r.wear, base.tool_wear ?? null, `${id} ${r.skill}: tool wear`);
          r.cells.forEach((c, col) => {
            const d = skillPackageDetails(id, learnedFor(r.skill), cardsFor(t.cards, col));
            assert.equal(c.duration, d.duration ?? null, `${id} ${r.skill} col ${col}: duration`);
            assert.equal(c.max, d.duration_max ?? null, `${id} ${r.skill} col ${col}: duration_max`);
            // Only the best card counts: owning just the column's card gives the same time.
            if (col) assert.equal(skillPackageDetails(id, learnedFor(r.skill), [t.cards[col - 1].id]).duration ?? null, c.duration, `${id} ${r.skill}: best card only`);
            cells += 1;
          });
        }
      }
    }
    assert.ok(cells > 150, `${cells} cells checked`);
  });

  it('covers every package whose time changes with rank or a speed card, and only those the original ran', () => {
    const want = Object.entries(SKILL_PACKAGES).filter(([id, p]) => {
      const rows = Object.values(p.skills || {});
      if (!rows.some((r) => r.duration)) return false;
      if (/never run|details only|test package/.test(GSJS_SKILL_PACKAGES[id] || '')) return false;
      const cards = Object.values(p.img_upgrades || {}).some((u) => u.duration_multiplier);
      return cards || new Set(rows.map((r) => `${r.duration}|${r.duration_max}`)).size > 1;
    }).map(([id]) => id).sort();
    assert.deepEqual(TIME_TABLES.flatMap((t) => t.ids).sort(), want);
    for (const id of ['mining', 'mining_fancypick', 'refining', 'gardening_harvest', 'ak_piggy_nibble', 'meditative_arts', 'jellisac_scooping']) assert.ok(want.includes(id), id);
    for (const id of ['bubbletuning', 'spicemilling', 'smelting', 'tinkering']) assert.ok(!want.includes(id), id);
  });

  it('Mining I-IV take 20, 14, 10 and 8 s, cut by Manic Mining I-III, and a Pick and a Fancy Pick share the table', () => {
    const [t] = tablesForSkill('mining_1');
    assert.deepEqual(t.ids, ['mining', 'mining_fancypick']);
    assert.deepEqual(t.rows.map((r) => r.cells.map(timeText)), [
      ['20 s', '18 s', '15 s', '10 s'], ['14 s', '12.6 s', '10.5 s', '7 s'], ['10 s', '9 s', '7.5 s', '5 s'], ['8 s', '7.2 s', '6 s', '4 s'],
    ]);
    const html = band(page('skills', 'mining_3'));
    assert.match(html, /<h3>Mining a rock with a Pick or a Fancy Pick<\/h3>/);
    assert.match(html, /A Pick and a Fancy Pick take the same time, energy and wear\./);
    assert.match(rowOf(html, 'Mining III'), /^<tr class="ency-time-here">[\s\S]*<td class="num-col">10 s<\/td><td class="num-col">9 s<\/td><td class="num-col">7\.5 s<\/td><td class="num-col">5 s<\/td><td class="num-col">8<\/td><td class="num-col">1<\/td><\/tr>$/);
    assert.match(band(page('imagination', 'mining_time_2')), /<th scope="col" class="num-col ency-time-here"><span class="ency-time-with">with<\/span> <strong>Manic Mining II<\/strong>[\s\S]*It cuts the time by 25%\./);
  });

  it('draws each table on every skill page in it (its row marked) and every speed card page (its column marked)', () => {
    const skills = new Set(TIME_TABLES.flatMap((t) => t.rows.map((r) => r.skill)).filter((s) => s !== 'no_skill'));
    const cards = new Set(TIME_TABLES.flatMap((t) => t.cards.map((c) => c.id)));
    for (const s of skills) {
      const html = band(page('skills', s));
      assert.ok(html, `${s}: has the band`);
      for (const t of tablesForSkill(s)) {
        const block = html.slice(html.indexOf(`id="time-${t.ids[0]}"`));
        assert.ok(block, `${s}: table ${t.ids[0]}`);
        const name = block.match(/<tr class="ency-time-here"><th scope="row"><strong>([^<]+)<\/strong>/)?.[1];
        assert.ok(name, `${s}: its row is marked in ${t.ids[0]}`);
        const r = t.rows.find((x) => x.skill === s);
        const row = rowOf(block, name);
        for (const c of r.cells) assert.ok(row.includes(`>${timeText(c)}<`), `${s} ${t.ids[0]}: ${timeText(c)}`);
      }
    }
    for (const c of cards) {
      const html = band(page('imagination', c));
      assert.equal((html.match(/class="ency-time"/g) || []).length, tablesForCard(c).length, `${c}: one table per package`);
      assert.match(html, /<th scope="col" class="num-col ency-time-here">/, `${c}: its column is marked`);
    }
    // No other skill or card page has the band.
    for (const [section, has] of [['skills', skills], ['imagination', cards]]) {
      for (const id of readdirSync(join(pub, 'encyclopedia', section), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)) {
        assert.equal(Boolean(band(page(section, id))), has.has(id), `${section}/${id}`);
      }
    }
  });

  it('says ranges, instant goes and longer meditation in plain words, with no em-dashes', () => {
    assert.match(band(page('skills', 'meditativearts_1')), /4 to 16 s[\s\S]*Where a time is a range, each go takes a random time inside it\./);
    assert.match(band(page('imagination', 'meditative_arts_focus_2')), /It makes each go last 50% longer\./);
    assert.match(band(page('imagination', 'jellisac_hands_speed_2')), /It takes the wait away\./);
    assert.match(band(page('skills', 'animalkinship_7')), />instant</);
    for (const s of ['mining_1', 'animalkinship_3', 'refining_2', 'light_green_thumb_2']) assert.ok(!band(page('skills', s)).includes('\u2014'), s);
  });
});
