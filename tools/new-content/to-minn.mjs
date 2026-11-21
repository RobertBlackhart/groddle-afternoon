#!/usr/bin/env node
/**
 * Creates the Groddle Originals page in Minn (/originals/, template "Full-width
 * page"; Austin 2026-11-21, was /new-content/), which is its source from then
 * on: the words are core blocks edited in Minn Admin. It lists what Groddle
 * Afternoon makes that Glitch never had, in Glitch's spirit, one entry per
 * original with its own status (live, building, planned) and dates
 * (ORIGINALS), starting with Pot Luck Day and its Thanksgiving feast. The
 * words describe what each original is, never where its work stands, so they
 * do not date. Pot Luck Day's plan is research/seasonal/pot-luck-day-plan.md
 * (section 9), the seasons audit research/audits-2026-11-17/seasons/.
 * The page wears the site's nc- styles (style.css): rules, badges, items and
 * steps as cards in the Project page's sewn-on look, each with a Tiny Speck icon.
 *
 *   MINN_USER=admin MINN_PASS=... node tools/new-content/to-minn.mjs [--site=https://groddle.localhost] [--dry] [--force]
 *
 * --site is the Minn site to write to (default the local one); the live site is
 * written only by giving it here, and only by Austin or the lead.
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
/** A core table in the Notes table look (.note-table-wrap); columns in numCols are right aligned. */
const table = (head, rows, { cls = '', numCols = [] } = {}) => {
  const cell = (tag, i, words) => (numCols.includes(i) ? `<${tag} class="has-text-align-right" data-align="right">${words}</${tag}>` : `<${tag}>${words}</${tag}>`);
  const className = `note-table-wrap${cls ? ` ${cls}` : ''}`;
  return block('table', { hasFixedLayout: false, className }, `<figure class="wp-block-table ${className}"><table><thead><tr>${head.map((c, i) => cell('th', i, c)).join('')}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((c, i) => cell('td', i, c)).join('')}</tr>`).join('')}</tbody></table></figure>`);
};
const band = (id, alt, title, inner) => group('section', `band${alt ? ' band-alt' : ''}`, id, [group('div', 'wrap', null, [h(2, title, { id: `${id}-h` }), ...inner])]);
/** A small rounded label (.nc-chip), inside a paragraph. */
const chip = (words, tone = '') => `<span class="nc-chip${tone ? ` nc-chip-${tone}` : ''}">${words}</span>`;
/**
 * Each card wears a Tiny Speck icon (CC0, the game's public/assets/sprites/icons),
 * or for Pot Luck Day's badges and items the art made for them (public/assets/badges/pld_*,
 * the item icons; listed in tools/provenance/made-sprites.json)
 * through its nc-icon-<name> class in the site's style.css, and a tone
 * (nc-tone-moss, -sky, -sun, -plum, -accent).
 */
const card = (cls, icon, tone, inner) => group('div', `${cls} nc-icon-${icon} nc-tone-${tone}`, null, inner);

/** The rules every new piece follows: a title, its line, the icon and tone of its card. */
export const RULES = [
  { title: 'Tiny Speck’s own work first', icon: 'tinkertool', tone: 'moss', words: 'New things are built from the original art, sounds and game code wherever they can be: a new creature starts from an original animal’s own art file, a new recipe from existing ingredients.' },
  { title: 'New art is marked as new', icon: 'note', tone: 'sun', words: 'Anything drawn for Groddle is labelled that way, on the <a href="/restoration/">Restoration</a> report and in the game’s credits.' },
  { title: 'Sized like Glitch’s own events', icon: 'egghunt_egg_1', tone: 'sky', words: 'Glitch’s seasons were small: a handful of items and a badge or two. New events aim for the same.' },
  { title: 'Nothing that lasts as power', icon: 'bag_gift_box_wrapped', tone: 'plum', words: 'Seasonal rewards are looks, mood, favor and keepsakes. Seasonal things end gracefully, and what stays is a badge or a keepsake.' },
  { title: 'Shared where it can be', icon: 'street_spirit_groddle', tone: 'accent', words: 'When something happens on a street, everyone there should see it.' },
];
/** Pot Luck Day's badges. */
export const BADGES = [
  { name: 'Feast Bringer', icon: 'pld_feast_bringer', tone: 'sun', words: 'Finishing the festival’s quest, Pot’s Empty Table' },
  { name: 'Plume Fluffer I, II and III', icon: 'pld_plume_fluffer_1', tone: 'plum', words: 'Dressing 5, 23 and 61 chickens in costume', tiers: [['I', 5], ['II', 23], ['III', 61]] },
  { name: 'Good Neighbor', icon: 'pld_good_neighbor', tone: 'moss', words: 'Laying 11 dishes or crops on the Harvest Table' },
];
/** Pot Luck Day's new items, and what becomes of each after the season (its chip tone). */
export const ITEMS = [
  { name: 'Turkey Tailfan', icon: 'turkey_tailfan', words: 'A paper-plate costume for a chicken, from the Toy Vendor', after: 'Used up', tone: 'sun' },
  { name: 'Rooster Plume', icon: 'rooster_plume', words: 'A tall comb and tail for a chicken, from the Toy Vendor', after: 'Used up', tone: 'sun' },
  { name: 'Fancy feather', icon: 'fancy_feather', words: 'Sometimes dropped by a dressed chicken when squeezed', after: 'Rots to loam', tone: 'plum' },
  { name: 'Harvest Stuffing', icon: 'harvest_stuffing', words: 'A new dish for the Awesome Pot', after: 'Food', tone: 'sky' },
  { name: 'Pot’s Cornucopia', icon: 'pots_cornucopia', words: 'A keepsake for your home, the quest’s reward, drawn from Tiny Speck’s Cornucopia of Crops', after: 'Stays', tone: 'moss' },
];
/**
 * The originals, one entry each, in the order the page shows them: its status ('live', 'building'
 * or 'planned'), its dates as players read them, and the anchor of its section.
 */
export const ORIGINALS = [
  { id: 'pot-luck-day', title: 'Pot Luck Day', status: 'live', dates: 'Nov 22-29, 2026, Pacific time', feast: 'Thanksgiving feast Nov 26' },
  { id: 'phone', title: 'Playing on a phone', status: 'live', dates: 'Since Nov 12, 2026 (v0.35.0)' },
];

/** What playing on a phone gives (js/touch-controls.js, js/touch-pinch.js, js/phone/companion.js, style.css touch-phone). */
export const PHONE_PARTS = [
  'The street fills the screen, held upright or sideways.',
  'Touch controls: a stick to walk and climb (in Settings it can follow your thumb instead), Jump, and Act, which does what Enter does on a keyboard.',
  'Tap the street to walk there, tap a thing to see what you can do with it, and tap a ladder to climb it.',
  'Pinch with two fingers to zoom in and out.',
  'The pack row scrolls sideways, so every bag and stack can be reached.',
  'Panels, Mail, Decorate and the character builder fit the screen.',
  'A phone opens first on a companion page for reports, mail and friends, with a button into the full game.',
  'Reports sent from a phone can carry pictures from the phone.',
];
const STATUS_WORDS = { live: 'Live', building: 'Building', planned: 'Planned' };

/** Every Tiny Speck icon the page's cards wear (each needs its nc-icon-<name> rule in style.css). */
export const ICONS = ['emblem_pot', 'furniture_table', 'chicken_egg', 'camera', ...RULES.map((r) => r.icon), ...BADGES.map((b) => b.icon), ...ITEMS.map((i) => i.icon)].filter((v, i, a) => a.indexOf(v) === i);

/** The page's blocks. */
export function originalsContent() {
  const pld = ORIGINALS.find((o) => o.id === 'pot-luck-day');
  const phone = ORIGINALS.find((o) => o.id === 'phone');
  const jump = [['#how', 'How an original is made'], ...ORIGINALS.map((o) => [`#${o.id}`, o.title])]
    .map(([href, label]) => `<a href="${href}">${label}</a>`).join(' ');
  return [
    group('header', 'masthead', null, [group('div', 'wrap', null, [
      p('kicker', 'Groddle Field Notes · Originals'),
      h(1, 'Groddle Originals'),
      p('lead', 'Groddle Afternoon brings back the Glitch that Tiny Speck closed in 2012. These are the other things: made for Groddle in Glitch’s spirit, things Glitch never had. Each one has its own entry below, with its status and its dates.'),
      p('jump', jump),
    ])]),

    band('how', false, 'How an original is made', [
      p('section-lead', 'A few rules every original follows, so it sits beside Glitch’s own work without standing out.'),
      group('div', 'nc-rules', null, RULES.map((r) => card('nc-rule', r.icon, r.tone, [h(3, r.title, { cls: 'nc-rule-title' }), p('nc-rule-line', r.words)]))),
    ]),

    group('section', 'band band-alt nc-band', pld.id, [group('div', 'wrap', null, [
      card('nc-event', 'emblem_pot', 'accent', [
        p('nc-chips', `${chip(STATUS_WORDS[pld.status], 'status')} ${chip(pld.dates, 'date')} ${chip(pld.feast, 'date')}`),
        h(2, pld.title, { id: `${pld.id}-h`, cls: 'nc-event-title' }),
        p('nc-event-line', 'A harvest festival for Thanksgiving week at Groddle Forest Junction, hosted by Pot, the Giant of cooking and plenty. It runs from the Sunday before Thanksgiving to the Sunday after, whole days on Pacific time. In 2026 that is November 22 to 29, starting at midnight Pacific (08:00 UTC) on the 22nd and ending at midnight after the 29th.'),
      ]),

      group('div', 'nc-split', null, [
        group('div', 'nc-part', null, [
          h(3, 'Why a new festival'),
          p('', 'Glitch never had a Thanksgiving, or any harvest feast. Its calendar named a crop day, Croppaday, and Pot’s day, Pot Twoday, but nothing happened on either. Players filled the gap themselves, bringing crops to the signpost at Groddle Forest Junction. Pot Luck Day starts from that: a table by that signpost, filled by everyone.'),
        ]),
        group('div', 'nc-part', null, [
          h(3, 'How big it is'),
          p('', 'Glitch’s seasonal events were built from items and verbs, almost never quests. Pot Luck Day is sized against them:'),
          table(['Event', 'New items', 'Quests', 'Badges'], [
            ['Zilloween (Glitch’s largest)', '18, plus 5 recipes', '0', '12'],
            ['Glitchmas 2011', '6', '0', '1'],
            ['Egg Hunt', '6', '0', '1'],
            ['Pi Day', '1', '0', '0'],
            ['<strong>Pot Luck Day</strong>', '<strong>5</strong>', '<strong>1</strong>', '<strong>5</strong>'],
          ], { cls: 'nc-size', numCols: [1, 2, 3] }),
        ]),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'Badges'),
        p('nc-part-lead', 'The festival is built backward from its badges: each one names something to do, and everything else is there to make it possible. Their pictures are drawn in the style of Tiny Speck’s own badges.'),
        group('div', 'nc-badges', null, BADGES.map((b) => card('nc-badge', b.icon, b.tone, [
          p('nc-medal', ''),
          h(4, b.name, { cls: 'nc-badge-name' }),
          p('nc-badge-line', b.words),
          ...(b.tiers ? [p('nc-chips nc-tiers', b.tiers.map(([tier, n]) => chip(`${tier} · ${n}`)).join(' '))] : []),
        ]))),
      ]),

      card('nc-feature', 'furniture_table', 'moss', [
        h(3, 'The Harvest Table', { cls: 'nc-feature-title' }),
        p('nc-feature-line', 'A long table by the Groddle Forest Junction signpost, shared by everyone. Lay a dish or a crop on it and it stays there for others to see, so the table fills up as the week goes on. Your first offering of each game day brings a little mood and favor with Pot. When the festival ends the table is packed away.'),
      ]),

      card('nc-feature', 'harvest_stuffing', 'sun', [
        h(3, 'The Thanksgiving feast', { cls: 'nc-feature-title' }),
        p('nc-feature-line', 'On Thanksgiving Day (November 26 in 2026), all day on Pacific time, the week’s food spills off the Harvest Table: 16 piles of it lie on the ground to the right of the table, made from the dishes and crops everyone laid that week. Eat a bite right where it lies; each pile has three bites, the first to eat a bite gets it, and everyone may have 11 bites that day. An eaten pile is laid again a little later while the week’s food lasts, and if the week was thin Pot adds harvest dishes of his own. At midnight the leftovers are packed away; the table stays until the festival ends.'),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'The quest: Pot’s Empty Table'),
        list([
          'Pot wants a feast, and a feast needs a cook.',
          'Make three harvest dishes from recipes the game already has: Pumpkin Pie, Hot Potatoes, Wavy Gravy, Corny Fritter or Potcorn.',
          'Dress one chicken for the occasion.',
          'Lay your dishes on the Harvest Table. Pot gives you the Cornucopia keepsake, some favor and the Feast Bringer badge.',
        ], { ordered: true, cls: 'nc-steps' }),
      ]),

      card('nc-feature', 'chicken_egg', 'plum', [
        h(3, 'Chicken costumes', { cls: 'nc-feature-title' }),
        p('nc-feature-line', 'The Toy Vendor sells two costumes during the festival, 150 currants each. Drop one on a chicken and it wears it for everyone on the street to see until the festival ends, then the costume falls off. Glitch never dressed its animals, but its chickens already take items dropped on them, so this follows the same habit. Both costumes are drawn from Tiny Speck’s own chicken art file: a paper-plate turkey tail tied on behind, and a tall rooster plume.'),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'New items'),
        group('div', 'nc-items', null, ITEMS.map((it) => card('nc-item', it.icon, it.tone, [
          h(4, it.name, { cls: 'nc-item-name' }),
          p('nc-item-line', it.words),
          p('nc-item-after', `After the festival ${chip(it.after, it.tone)}`),
        ]))),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'What lasts'),
        group('div', 'nc-lasts', null, [
          group('div', 'nc-last nc-tone-moss', null, [
            h(4, 'Stays', { cls: 'nc-last-title' }),
            list(['The five badges, which count toward your totals.', 'The Cornucopia keepsake.']),
          ]),
          group('div', 'nc-last nc-tone-sun', null, [
            h(4, 'Ends on its own', { cls: 'nc-last-title' }),
            p('', 'Everything else ends on its own: costumes fall off, feathers rot, the feast’s leftovers are packed away at midnight and the table at the festival’s end.'),
          ]),
          group('div', 'nc-last nc-tone-sky', null, [
            h(4, 'Ideas for another year', { cls: 'nc-last-title' }),
            p('', 'A cranberry crop, a turkey round-up race, gratitude notes, leaf piles to jump in, a Golden Turkey to find, new music and a festival street. Each would make the festival bigger than any of Glitch’s own except Zilloween, so none is in it.'),
          ]),
        ]),
      ]),
    ])]),

    group('section', 'band nc-band', phone.id, [group('div', 'wrap', null, [
      card('nc-event', 'camera', 'sky', [
        p('nc-chips', `${chip(STATUS_WORDS[phone.status], 'status')} ${chip(phone.dates, 'date')}`),
        h(2, phone.title, { id: `${phone.id}-h`, cls: 'nc-event-title' }),
        p('nc-event-line', 'Glitch was a Flash game and never ran on a phone. Groddle Afternoon plays in a phone’s browser, upright or sideways.'),
      ]),
      group('div', 'nc-part', null, [
        h(3, 'What works on a phone'),
        list(PHONE_PARTS),
      ]),
      group('div', 'nc-callout', null, [
        h(3, 'Newer than the rest of the game'),
        p('', 'Phone play is newer than the rest of Groddle, so some things still fit a computer better. If something goes wrong on a phone, a report tagged [Mobile] helps.'),
      ]),
    ])]),

    group('div', 'wrap report-foot', null, [
      p('', 'Each original’s entry says whether it is live, being built or planned, and when it runs. The <a href="/changelog/">Notes</a> say when something ships.'),
    ]),
  ].join('\n\n');
}

async function main() {
  const content = originalsContent();
  if (args.dry) {
    console.log(content);
    return;
  }
  const minn = new Minn(SITE);
  await minn.signIn(process.env.MINN_USER || 'admin', process.env.MINN_PASS || '');
  const found = await minn.rest('GET', '/wp/v2/pages?slug=originals&status=publish,draft,private,pending&context=edit');
  if (found[0] && !args.force) {
    console.log(`page ${found[0].id} is already there; left alone (--force overwrites it)`);
    return;
  }
  const body = { title: 'Groddle Originals', slug: 'originals', status: 'publish', template: 'page-wide', excerpt: 'Things made for Groddle in Glitch’s spirit that Glitch never had, each with its status and dates, starting with Pot Luck Day.', content };
  const saved = found[0] ? await minn.rest('POST', `/wp/v2/pages/${found[0].id}`, body) : await minn.rest('POST', '/wp/v2/pages', body);
  console.log(`${found[0] ? 'overwrote' : 'created'} page ${saved.id} at ${saved.link}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
