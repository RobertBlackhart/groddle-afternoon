/**
 * G1021 (#505): an item page's "How to get it" comes from where the game hands the item out
 * (tools/catalog/build.mjs readRemake's tables, tools/catalog/handouts.mjs for handovers), never
 * from the name of the remake file that gave it ("Part of the Hell Bar in the remake."), and no
 * quest the game never offers is a way to get anything.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUEST_OFFERED, buildCatalog, readQuestStatus } from '../tools/catalog/build.mjs';
import { loadHandouts } from '../tools/catalog/handouts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const quests = JSON.parse(readFileSync(join(root, 'public/assets/content/quests.json'), 'utf8'));
const status = readQuestStatus();
const offered = (id) => QUEST_OFFERED.has(status.get(id));
const built = await buildCatalog();
const pages = Object.entries(built.files).filter(([p]) => /items\/[^/]+\/index\.html$/.test(p));
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ');
const howTo = (html) => {
  const a = html.indexOf('<h3>How to get it</h3>');
  if (a < 0) return '';
  const end = html.indexOf('</section>', a);
  const b = html.indexOf('<h3 class="cat-for">', a);
  return text(html.slice(a, b > 0 && b < end ? b : end));
};
const page = (id) => built.files[`encyclopedia/items/${id}/index.html`];

describe('item pages say how to get each item from the game itself (G1021)', () => {
  it('every item in the remake has a way backed by a table or a handover, and the build reports none missing', () => {
    assert.deepEqual(built.problems, []);
    const source = built.data.items.filter((i) => i.status === 'source');
    assert.ok(source.length > 800);
    for (const item of source) assert.ok(howTo(page(item.id)).replace('How to get it', '').trim(), `${item.id} says nothing`);
  });

  it('no page names the remake file that gave it', () => {
    const bad = pages.filter(([, html]) => /Part of [^.]+ in the remake\.|The remake gives it out as you play/.test(howTo(html))).map(([p]) => p);
    assert.deepEqual(bad, []);
  });

  it('no way to get anything is a quest the game never offers', () => {
    const byTitle = new Map();
    for (const [id, q] of Object.entries(quests)) byTitle.set(String(q.title || '').trim(), [...(byTitle.get(String(q.title || '').trim()) || []), id]);
    const bad = [];
    for (const [p, html] of pages) {
      for (const m of howTo(html).matchAll(/the quest “([^”]+)”/g)) {
        if (!(byTitle.get(m[1]) || []).some(offered)) bad.push(`${p}: ${m[1]}`);
      }
      // The encyclopedia's Quests tiles: a plain "a reward" or "given to you" only for a quest the game offers.
      for (const m of html.matchAll(/href="[^"]*quests\/([a-z0-9_]+)\/"[\s\S]*?ency-tile-sub">([^<]*)</g)) {
        if (/^(a reward|given to you)$/.test(m[2]) && !offered(m[1])) bad.push(`${p}: tile ${m[1]} ${m[2]}`);
      }
    }
    assert.deepEqual(bad, []);
    assert.match(text(page('wine_of_the_dead')), /Day of the Undead Butlers , a reward, never offered in Glitch/);
  });

  it('#505: Wine of the Dead and the Diabolical Drink Ticket say where they come from', () => {
    assert.match(howTo(page('wine_of_the_dead')), /Trade a Diabolical Drink Ticket to Hell's Bartender in the Hell Bar, Panka Surazu\./);
    const ticket = howTo(page('drink_ticket'));
    assert.match(ticket, /Handed to you once, when you take the quest “Beelzebooze”\./);
    assert.match(ticket, /After that, while you stay dead, a companion visits your grave about 1 in 3 times you croak and leaves one\./);
  });

  it('the tables name the card, the store and the trophy instead of the file', () => {
    assert.match(howTo(page('paradise_ticket_beam_me_down')), /Comes with the Imagination upgrade card “Ticket To Beam Me Down”\./);
    assert.match(howTo(page('race_ticket_space_race')), /Race Ticket Dispenser/);
    assert.match(howTo(page('trophy_street_creator_wood')), /one of each of its five pieces/);
    assert.match(howTo(page('door_key_11')), /Mazza'la Gala Party Space/);
  });

  it('a handover whose code moved, or whose quest the game does not offer, fails the check', async () => {
    const { problems } = await loadHandouts({ nameOf: (id) => id, quests, offered: () => false, skillName: (id) => id });
    assert.ok(problems.some((p) => /hell_quest is not one the game offers/.test(p)), problems.join('\n'));
    const fine = await loadHandouts({ nameOf: (id) => id, quests, offered, skillName: (id) => id });
    assert.deepEqual(fine.problems, [], 'every site still holds its mark');
  });
});
