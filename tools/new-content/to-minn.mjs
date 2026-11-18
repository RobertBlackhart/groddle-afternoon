#!/usr/bin/env node
/**
 * Creates the New content page in Minn (/new-content/, template "Full-width
 * page"), which is its source from then on: the words are core blocks edited
 * in Minn Admin (Austin 2026-11-17). It outlines content Groddle Afternoon
 * adds that Glitch never had, starting with Pot Luck Day (Thanksgiving 2026):
 * each entry is written up here as its plan first, then kept as the record of
 * what was built. The plan's working copy is research/seasonal/pot-luck-day-plan.md
 * (section 9) and the seasons audit research/audits-2026-11-17/seasons/.
 * The page wears the site's nc- styles (style.css): rules, badges, items and
 * steps as cards in the Project page's sewn-on look, each with a Tiny Speck icon.
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
/** Every Tiny Speck icon the page's cards wear (each needs its nc-icon-<name> rule in style.css). */
export const ICONS = ['emblem_pot', 'furniture_table', 'chicken_egg', 'camera', ...RULES.map((r) => r.icon), ...BADGES.map((b) => b.icon), ...ITEMS.map((i) => i.icon)].filter((v, i, a) => a.indexOf(v) === i);

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
      group('div', 'nc-rules', null, RULES.map((r) => card('nc-rule', r.icon, r.tone, [h(3, r.title, { cls: 'nc-rule-title' }), p('nc-rule-line', r.words)]))),
    ]),

    group('section', 'band band-alt nc-band', 'pot-luck-day', [group('div', 'wrap', null, [
      card('nc-event', 'emblem_pot', 'accent', [
        p('nc-chips', `${chip('Status: building', 'status')} ${chip('Nov 22-29, 2026', 'date')}`),
        h(2, 'Pot Luck Day', { id: 'pot-luck-day-h', cls: 'nc-event-title' }),
        p('nc-event-line', 'A harvest festival for Thanksgiving week, November 22 to 29, 2026. Pot, the Giant of cooking and plenty, hosts it.'),
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
            ['<strong>Pot Luck Day (planned)</strong>', '<strong>5</strong>', '<strong>1</strong>', '<strong>5</strong>'],
          ], { cls: 'nc-size', numCols: [1, 2, 3] }),
        ]),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'Badges'),
        p('nc-part-lead', 'The event is built backward from its badges: each one names something to do, and everything else exists to make that possible.'),
        group('div', 'nc-badges', null, BADGES.map((b) => card('nc-badge', b.icon, b.tone, [
          p('nc-medal', ''),
          h(4, b.name, { cls: 'nc-badge-name' }),
          p('nc-badge-line', b.words),
          ...(b.tiers ? [p('nc-chips nc-tiers', b.tiers.map(([tier, n]) => chip(`${tier} · ${n}`)).join(' '))] : []),
        ]))),
      ]),

      card('nc-feature', 'furniture_table', 'moss', [
        h(3, 'The Harvest Table', { cls: 'nc-feature-title' }),
        p('nc-feature-line', 'A long table by the Groddle Forest Junction signpost. Lay a dish or a crop on it and it stays there for others to see, so the table fills up as the week goes on. Each day’s first offering brings a little mood and favor with Pot.'),
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
        p('nc-feature-line', 'Drop a costume on a chicken and it wears it for the rest of the week, then the costume falls off. Glitch never dressed its animals, but its chickens already take items dropped on them, so this follows the same habit. The costumes are drawn from Tiny Speck’s own chicken art file: one is a paper-plate turkey tail tied on behind, the other a tall rooster plume.'),
      ]),

      group('div', 'nc-part', null, [
        h(3, 'New items'),
        group('div', 'nc-items', null, ITEMS.map((it) => card('nc-item', it.icon, it.tone, [
          h(4, it.name, { cls: 'nc-item-name' }),
          p('nc-item-line', it.words),
          p('nc-item-after', `After the season ${chip(it.after, it.tone)}`),
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
            p('', 'Everything else ends on its own: costumes fall off, feathers rot and the table is packed away.'),
          ]),
          group('div', 'nc-last nc-tone-sky', null, [
            h(4, 'Later: left for another year', { cls: 'nc-last-title' }),
            p('', 'A cranberry crop, a turkey round-up race, gratitude notes, leaf piles to jump in, a Golden Turkey to find, new music and a festival street. Each would make the festival bigger than any of Glitch’s own except Zilloween.'),
          ]),
        ]),
      ]),

      group('div', 'nc-callout', null, [
        h(3, 'Decided'),
        list([
          'Costumed chickens are seen by everyone on the street, and the costume falls off when the festival ends.',
          'Both costumes: the Turkey Tailfan and the Rooster Plume.',
          'One shared Harvest Table for everyone, filled together.',
          'November only this year, as Pot Luck Day. A return on Pot Twoday can wait for another year.',
        ]),
      ]),

      card('nc-note', 'camera', 'sky', [
        h(3, 'Art', { cls: 'nc-note-title' }),
        p('nc-note-line', 'The badges’ pictures are being drawn now in the style of Tiny Speck’s own badges, and the costumes are rendered from the original chicken’s art file. They will be shown here as they are approved.'),
      ]),
    ])]),

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
