#!/usr/bin/env node
/**
 * Creates the Maps page in Minn (/restoration/maps/, a child of the
 * restoration report, template "Full-width page"; Austin 2026-11-14), which is
 * its source from then on: the words are core blocks edited in Minn Admin, and
 * the maps are the groddle/restoration-maps block drawn from
 * public/restoration/maps.json (tools/restoration-maps/build-data.mjs), so a
 * region restored later shows up with no page edit.
 *
 *   MINN_USER=admin MINN_PASS=... node tools/restoration-maps/to-minn.mjs [--site=https://groddle.localhost] [--dry] [--force]
 *
 * Creates the page once. If it is already there it is left alone, since it may
 * have been edited since; --force overwrites it with the words below.
 */
import { attrJson, Minn } from '../changelog/to-minn.mjs';
import { group, h, p } from '../restoration/to-minn.mjs';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const SITE = String(args.site || 'https://groddle.localhost').replace(/\/$/, '');

export const PATH = '/restoration/maps/';
export const SLUG = 'maps';
export const TEMPLATE = 'page-wide';
const data = (part) => `<!-- wp:groddle/restoration-maps ${attrJson({ part })} /-->`;
const band = (id, alt, title, inner) => group('section', `band${alt ? ' band-alt' : ''}`, id, [group('div', 'wrap', null, [h(2, title, { id: `${id}-h` }), ...inner])]);

/** The page's blocks: our words around the maps drawn from maps.json. */
export function mapsContent() {
  return [
    group('header', 'masthead', null, [group('div', 'wrap', null, [
      p('kicker', 'Groddle Field Notes · Restoration report'),
      h(1, 'Maps'),
      p('lead', 'Every map in Groddle Afternoon beside Tiny Speck’s own map of the same place. Each region’s “before” is the map the Glitch Encyclopedia showed in 2012: Tiny Speck’s painting with the game’s roads and names on it, saved by the Internet Archive. The paintings themselves were lost as files when Glitch closed. Every one is back, restored from those 2012 maps, and the World map was sharpened for today’s screens. Wipe across, flip or enlarge any of them to see the difference.'),
      data('summary'),
      p('jump', '<a href="#world">The World map</a> <a href="#restored">Restored from 2012</a> <a href="#how">How they were made</a> <a href="/restoration/">The restoration report</a>'),
    ])]),
    band('world', false, 'The World map', [
      p('section-lead', 'Tiny Speck’s two World map charts survive whole, but only at 760 x 460, so they looked soft on a sharp screen. These copies were sharpened at twice the size from the charts themselves: the same lines, lettering and places. The originals still draw on a standard screen.'),
      data('world'),
    ]),
    band('restored', true, 'Restored from 2012', [
      p('section-lead', 'For these regions Tiny Speck’s own painting came back. The 2012 Encyclopedia showed nearly every region’s map with the game’s roads, names and buttons drawn on top, and that map is the picture on the left. It was the starting point: an image model took the markings off and sharpened it without moving anything, and the result was toned back to 2012’s colour. Where the Encyclopedia drew no markings, the painting was only sharpened. Vortex of Random’s 2012 map turned out to be The Seams’ painting with Vortex’s own roads and names on it, so the two regions share one restore.'),
      data('restored'),
    ]),
    band('how', false, 'How they were made', [
      p('section-lead', 'Each restore is toned to its own 2012 picture: the average saturation and lightness of its middle tones are matched, leaving out the 2012 roads, white lettering and pale paper sea, so they do not count. Gamma is used rather than a brightness boost, so the light paper sea keeps its grain.'),
      p('', 'Before a restore ships it is laid beside its 2012 map at the same size and checked by eye: every cliff, rock, hollow, pool and building has to sit where 2012 had it, and nothing may stand where 2012 had only a road or a name. A try that moves, adds or loses something goes back with the change asked for in words and is painted again. Anything still different after that is written on the region’s card; a restore that still differs ships with its differences written there unless it is worse than the painting it replaces, and a later try that passes takes its place.'),
      p('', 'The before pictures are Tiny Speck’s own 2012 Encyclopedia maps, shown as Tiny Speck made them, with the game’s roads and names on them, the same way the game plays Tiny Speck’s original recordings. Every other picture on this page is CC0: Tiny Speck’s own art, which they gave to the public domain, or a picture made for Groddle Afternoon and given to the public domain the same way. The record of how each map was made, from what, and who chose it, and the list of the 2012 maps with where each was saved from, ship with the game’s source.'),
    ]),
    group('div', 'wrap report-foot', null, [
      p('', 'This page fills itself from those records, so a region restored in a new release appears here on its own.'),
    ]),
  ].join('\n\n');
}

async function main() {
  const content = mapsContent();
  if (args.dry) {
    console.log(content);
    return;
  }
  const minn = new Minn(SITE);
  await minn.signIn(process.env.MINN_USER || 'admin', process.env.MINN_PASS || '');
  const parent = (await minn.rest('GET', '/wp/v2/pages?slug=restoration&status=publish,draft,private,pending&context=edit'))[0];
  if (!parent) throw new Error('no restoration page to put this under (tools/restoration/to-minn.mjs makes it)');
  const found = (await minn.rest('GET', `/wp/v2/pages?slug=${SLUG}&parent=${parent.id}&status=publish,draft,private,pending&context=edit`))[0];
  if (found && !args.force) {
    console.log(`page ${found.id} is already there; left alone (--force overwrites it)`);
    return;
  }
  const body = { title: 'Maps', slug: SLUG, parent: parent.id, status: 'publish', template: TEMPLATE, excerpt: 'Every map in Groddle Afternoon beside Tiny Speck’s own 2012 Encyclopedia map of the same place: the World map sharpened and every region restored from 2012.', content };
  const saved = found ? await minn.rest('POST', `/wp/v2/pages/${found.id}`, body) : await minn.rest('POST', '/wp/v2/pages', body);
  console.log(`${found ? 'overwrote' : 'created'} page ${saved.id} at ${saved.link}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
