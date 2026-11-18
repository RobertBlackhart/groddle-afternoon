#!/usr/bin/env node
/**
 * Creates the New content page in Minn (/new-content/, template "Full-width
 * page"), which is its source from then on: the words are core blocks edited
 * in Minn Admin (Austin 2026-11-17). It outlines content Groddle Afternoon
 * adds that Glitch never had, starting with Pot Luck Day (Thanksgiving 2026):
 * each entry is written up here as its plan first, then kept as the record of
 * what was built. The plan's working copy is research/seasonal/pot-luck-day-plan.md
 * (section 9) and the seasons audit research/audits-2026-11-17/seasons/.
 *
 *   MINN_USER=admin MINN_PASS=... node tools/new-content/to-minn.mjs [--site=https://groddle.localhost] [--dry] [--force]
 *
 * Creates the page once. If it is already there it is left alone, since it may
 * have been edited since; --force overwrites it with the words below.
 */
import { block, Minn } from '../changelog/to-minn.mjs';
import { p, h, group } from '../restoration/to-minn.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const SITE = String(args.site || 'https://groddle.localhost').replace(/\/$/, '');

const li = (words) => block('list-item', null, `<li>${words}</li>`);
const list = (items, { ordered = false, cls = '' } = {}) => {
  const tag = ordered ? 'ol' : 'ul';
  const attrs = { ...(ordered ? { ordered: true } : {}), ...(cls ? { className: cls } : {}) };
  return block('list', Object.keys(attrs).length ? attrs : null, `<${tag} class="wp-block-list${cls ? ` ${cls}` : ''}">${items.map(li).join('\n')}</${tag}>`);
};
const table = (head, rows) => block('table', null,
  `<figure class="wp-block-table"><table><thead><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></figure>`);
const band = (id, alt, title, inner) => group('section', `band${alt ? ' band-alt' : ''}`, id, [group('div', 'wrap', null, [h(2, title, { id: `${id}-h` }), ...inner])]);

/** The page's blocks. */
export function newContentContent() {
  const jump = [['#how', 'How new content is made'], ['#pot-luck-day', 'Pot Luck Day']]
    .map(([href, label]) => `<a href="${href}">${label}</a>`).join(' ');
  return [
    group('header', 'masthead', null, [group('div', 'wrap', null, [
      p('kicker', 'Groddle Field Notes · New content'),
      h(1, 'New content'),
      p('lead', 'Groddle Afternoon began as a restoration: bringing back the Glitch that Tiny Speck closed in 2012. This page is for what comes next, things Glitch never had, made in its spirit. Each one is planned here in the open first, and the same entry becomes the record of what was built.'),
      p('jump', jump),
    ])]),

    band('how', false, 'How new content is made', [
      p('section-lead', 'A few rules every new piece follows, so it sits beside the original without standing out.'),
      list([
        '<strong>Tiny Speck’s own work first.</strong> New things are built from the original art, sounds and game code wherever they can be: a new creature starts from an original animal’s own art file, a new recipe from existing ingredients.',
        '<strong>New art is marked as new.</strong> Anything drawn for Groddle is labelled that way, on the <a href="/restoration/">Restoration</a> report and in the game’s credits.',
        '<strong>Sized like Glitch’s own events.</strong> Glitch’s seasons were small: a handful of items and a badge or two. New events aim for the same.',
        '<strong>Nothing that lasts as power.</strong> Seasonal rewards are looks, mood, favor and keepsakes. Seasonal things end gracefully, and what stays is a badge or a keepsake.',
        '<strong>Shared where it can be.</strong> When something happens on a street, everyone there should see it.',
      ]),
    ]),

    band('pot-luck-day', true, 'Pot Luck Day', [
      p('section-lead', '<strong>Status: planning.</strong> A harvest festival for Thanksgiving week, November 22 to 29, 2026. Pot, the Giant of cooking and plenty, hosts it.'),
      h(3, 'Why a new festival'),
      p('', 'Glitch never had a Thanksgiving, or any harvest feast. Its calendar named a crop day, Croppaday, and Pot’s day, Pot Twoday, but nothing happened on either. Players filled the gap themselves, bringing crops to the signpost at Groddle Forest Junction. Pot Luck Day starts from that: a table by that signpost, filled by everyone.'),
      h(3, 'How big it is'),
      p('', 'Glitch’s seasonal events were built from items and verbs, almost never quests. Pot Luck Day is sized against them:'),
      table(['Event', 'New items', 'Quests', 'Badges'], [
        ['Zilloween (Glitch’s largest)', '18, plus 5 recipes', '0', '12'],
        ['Glitchmas 2011', '6', '0', '1'],
        ['Egg Hunt', '6', '0', '1'],
        ['Pi Day', '1', '0', '0'],
        ['<strong>Pot Luck Day (planned)</strong>', '<strong>5</strong>', '<strong>1</strong>', '<strong>4</strong>'],
      ]),
      h(3, 'Badges'),
      p('', 'The event is built backward from its badges: each one names something to do, and everything else exists to make that possible.'),
      table(['Badge', 'Earned by'], [
        ['Feast Bringer', 'Finishing the festival’s quest, Pot’s Empty Table'],
        ['Plume Fluffer I, II and III', 'Dressing 5, 23 and 61 chickens in costume'],
        ['Good Neighbor', 'Laying 11 dishes or crops on the Harvest Table'],
      ]),
      h(3, 'The Harvest Table'),
      p('', 'A long table by the Groddle Forest Junction signpost. Lay a dish or a crop on it and it stays there for others to see, so the table fills up as the week goes on. Each day’s first offering brings a little mood and favor with Pot.'),
      h(3, 'The quest: Pot’s Empty Table'),
      list([
        'Pot wants a feast, and a feast needs a cook.',
        'Make three harvest dishes from recipes the game already has: Pumpkin Pie, Hot Potatoes, Wavy Gravy, Corny Fritter or Potcorn.',
        'Dress one chicken for the occasion.',
        'Lay your dishes on the Harvest Table. Pot gives you the Cornucopia keepsake, some favor and the Feast Bringer badge.',
      ], { ordered: true }),
      h(3, 'Chicken costumes'),
      p('', 'Drop a costume on a chicken and it wears it for the rest of the week, then the costume falls off. Glitch never dressed its animals, but its chickens already take items dropped on them, so this follows the same habit. The costumes are drawn from Tiny Speck’s own chicken art file: one is a paper-plate turkey tail tied on behind, the other a tall rooster plume.'),
      h(3, 'New items'),
      table(['Item', 'What it is', 'After the season'], [
        ['Turkey Tailfan', 'A paper-plate costume for a chicken, from the Toy Vendor', 'Used up'],
        ['Rooster Plume', 'A tall comb and tail for a chicken, from the Toy Vendor', 'Used up'],
        ['Fancy feather', 'Sometimes dropped by a dressed chicken when squeezed', 'Rots to compost'],
        ['Harvest Stuffing', 'A new dish for the Awesome Pot', 'Food'],
        ['Pot’s Cornucopia', 'A keepsake for your home, the quest’s reward, drawn from Tiny Speck’s Cornucopia of Crops', 'Stays'],
      ]),
      h(3, 'What lasts'),
      list([
        'The four badges, which count toward your totals.',
        'The Cornucopia keepsake.',
        'Everything else ends on its own: costumes fall off, feathers rot and the table is packed away.',
      ]),
      h(3, 'Left for another year'),
      p('', 'A cranberry crop, a turkey round-up race, gratitude notes, leaf piles to jump in, a Golden Turkey to find, new music and a festival street. Each would make the festival bigger than any of Glitch’s own except Zilloween.'),
      h(3, 'Still to decide'),
      list([
        'Whether costumed chickens are seen by everyone on the street (the plan) or only by the player who dressed them.',
        'Turkey, rooster or both costumes.',
        'One shared Harvest Table for everyone, or one each.',
        'Whether the festival returns on Pot Twoday in the game’s own calendar, for players who miss November.',
      ]),
      h(3, 'Art'),
      p('', 'The badges’ pictures are being drawn now in the style of Tiny Speck’s own badges, and the costumes are rendered from the original chicken’s art file. They will be shown here as they are approved.'),
    ]),

    group('div', 'wrap report-foot', null, [
      p('', 'Everything on this page is a plan until it ships; the <a href="/changelog/">Notes</a> say when it does.'),
    ]),
  ].join('\n\n');
}

async function main() {
  const content = newContentContent();
  if (args.dry) {
    console.log(content);
    return;
  }
  const minn = new Minn(SITE);
  await minn.signIn(process.env.MINN_USER || 'admin', process.env.MINN_PASS || '');
  const found = await minn.rest('GET', '/wp/v2/pages?slug=new-content&status=publish,draft,private,pending&context=edit');
  if (found[0] && !args.force) {
    console.log(`page ${found[0].id} is already there; left alone (--force overwrites it)`);
    return;
  }
  const body = { title: 'New content', slug: 'new-content', status: 'publish', template: 'page-wide', excerpt: 'Things Glitch never had, made in its spirit: each planned here in the open first, starting with Pot Luck Day.', content };
  const saved = found[0] ? await minn.rest('POST', `/wp/v2/pages/${found[0].id}`, body) : await minn.rest('POST', '/wp/v2/pages', body);
  console.log(`${found[0] ? 'overwrote' : 'created'} page ${saved.id} at ${saved.link}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
