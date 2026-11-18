/**
 * Handovers: the items a person, a creature or a scene in the remake hands you, where no store,
 * recipe, drop table, quest reward or other table says so (register G1021, report #505). The item
 * catalog (tools/catalog/build.mjs waysFor) reads the tables first; these lines name the rest.
 *
 * Each entry points at the code that hands the item out (`site`, a file under public/, and `mark`,
 * text that must stand in it), so a handover that moves or goes fails `build.mjs --check` instead
 * of leaving an old sentence on the page. Its words are ours, built from the game's own data where
 * there is any (names from GSJS, quest titles from quests.json for quests the game offers, chances
 * and commands from the modules). An item with no table and no handover fails the check too: the
 * catalog never falls back to naming the file that gave it.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUB = join(import.meta.dirname, '..', '..', 'public');
const mod = (name) => import(join(PUB, 'js', name));

/** About 1 in n, for a chance of 1/n. */
const oneIn = (chance) => `about 1 in ${Math.round(1 / chance)}`;

/**
 * The handovers, each as { items, site, mark, text(h) }. h.name(id) is an item's or creature's
 * GSJS name, h.quest(id) a quest's “title” (the check fails when the game does not offer it),
 * h.skill(id) a skill's name, h.m the loaded modules.
 */
const HANDOUTS = [
  {
    items: ['wine_of_the_dead'],
    site: 'js/features/hell-bar-feature.js',
    mark: 'grantWine(',
    text: (h) => `Trade ${h.a('drink_ticket')} ${h.name('drink_ticket')} to ${h.name('hell_bartender')} in the ${h.m.hellBar.HELL_BAR_LABEL}, ${h.m.hell.HELL_BAR.entranceStreetLabel}.`,
  },
  {
    items: ['drink_ticket'],
    site: 'js/features/hell-tickets-feature.js',
    mark: 'ticketGiven: true',
    text: (h) => `Handed to you once, when you take the quest ${h.quest('hell_quest')}.`,
  },
  {
    items: ['drink_ticket'],
    site: 'js/features/hell-tickets-feature.js',
    mark: "effect.classTsid === TICKET_CLASS) grantTicket(engine)",
    text: (h) => `After that, while you stay dead, a companion visits your grave ${oneIn(h.m.hellTickets.GRAVE_VISIT.chance)} times you croak and leaves one.`,
  },
  {
    items: ['juju_trowel'],
    site: 'js/quest-rooms/juju-camp.js',
    mark: "ctx.give('juju_trowel'",
    text: (h) => `The ${h.name('npc_juju_grandma')} hands you one in the Juju Hideout on the quest ${h.quest('help_juju_bandits')}.`,
  },
  {
    items: ['note_hint'],
    site: 'js/quest-rooms/juju-camp.js',
    mark: "w.give('note_hint'",
    text: (h) => `The ${h.name('npc_juju_grandma')} hands you the first on the quest ${h.quest('help_juju_bandits')}, and each dig at a clue that is not the last turns up the next.`,
  },
  {
    items: ['juju_paperweight'],
    site: 'js/quest-rooms/juju-camp.js',
    mark: "w.give('juju_paperweight'",
    text: (h) => `Dug up at the last clue on the quest ${h.quest('help_juju_bandits')}.`,
  },
  {
    items: ['conch'],
    site: 'js/quest-rooms/esquibeth.js',
    mark: "ctx.give('conch'",
    text: (h) => `Taken from the pedestal in the hollow on the quest ${h.quest('last_pilgrimage_of_esquibeth')}.`,
  },
  {
    items: ['crabato_juice'],
    site: 'js/crabs.js',
    mark: 'items: { [CRABATO_JUICE]: 1 }',
    text: () => 'Hug a crab you have flattered that day: it gives you one, once a day.',
  },
  {
    items: ['crabphones'],
    site: 'js/features/crabs-feature.js',
    mark: 'addItem(engine.inv, CRABPHONES, 1)',
    text: () => 'Play a musicblock for a crab when it asks: it gives you a pair.',
  },
  {
    items: ['faded_heart'],
    site: 'js/ghost-quest.js',
    mark: 'export function grantFadedHeart',
    text: (h) => `Given at the end of the quest ${h.quest(h.m.ghost.PHANTOM_QUEST_ID)}.`,
  },
  {
    items: ['fortune'],
    site: 'js/features/small-items-feature.js',
    mark: 'addItem(engine.inv, FORTUNE, 1)',
    text: (h) => `Break ${h.a('fortune_cookie')} ${h.name('fortune_cookie')}: the fortune is inside.`,
  },
  {
    items: ['plate_of_beans'],
    site: 'js/features/small-items-feature.js',
    mark: 'PLATE_OF_BEANS',
    text: (h) => `Type ${h.m.smallItems.BEANS_TEXT.command} in Local chat.`,
  },
  {
    items: ['greeter_twig'],
    site: 'js/features/newxp-feature.js',
    mark: "addItem(engine.inv, 'greeter_twig', 1)",
    text: (h) => `Given when you finish the new player tour, with the quest ${h.quest('leave_gentle_island')}.`,
  },
  {
    items: ['homestreet_ticket'],
    site: 'js/home-ticket.js',
    mark: 'HOME_TICKET_CLASS',
    text: () => 'The Magic Rock gives you one on the new player tour, or the first time you open the Home panel without one.',
  },
  {
    items: ['teleportation_script_imbued'],
    site: 'js/features/street-jobs-feature.js',
    mark: 'teleportationFeature.grantScript(',
    text: () => 'Everyone who helped finish a street project gets one to the new street.',
  },
  {
    items: ['teleportation_script'],
    site: 'js/teleportation.js',
    mark: "has(ctx.learned, 'teleportation_4')",
    text: (h) => `Written where you stand, on ${h.name('paper')} with a working ${h.name('quill')}, once you know ${h.skill('teleportation_4')} and ${h.skill('penmanship_1')}: it takes you back there.`,
  },
];

/**
 * The handovers by item id ({ text, site }[]), and what failed: a site gone, a mark not in it, a
 * quest the game does not offer, an item missing from GSJS.
 * @param {{ nameOf: (id: string) => string, quests: object, offered: (id: string) => boolean, skillName: (id: string) => string }} o
 */
export async function loadHandouts({ nameOf, quests, offered, skillName }) {
  const m = {
    hell: await mod('hell.js'),
    hellBar: await mod('hell-bar.js'),
    hellTickets: await mod('hell-tickets.js'),
    ghost: await mod('ghost-quest.js'),
    smallItems: await mod('small-items.js'),
  };
  const problems = [];
  const files = new Map();
  const byItem = new Map();
  for (const entry of HANDOUTS) {
    const where = `${entry.site} (${entry.items.join(', ')})`;
    const h = {
      m,
      name: (id) => {
        const n = nameOf(id);
        if (!n) problems.push(`${where}: no GSJS name for ${id}`);
        return n || id;
      },
      skill: (id) => skillName(id),
      a: (id) => (/^[aeiou]/i.test(nameOf(id) || id) ? 'an' : 'a'),
      quest: (id) => {
        if (!quests[id] || !offered(id)) problems.push(`${where}: the quest ${id} is not one the game offers`);
        return `“${String(quests[id]?.title || id).trim()}”`;
      },
    };
    if (!files.has(entry.site)) {
      try {
        files.set(entry.site, readFileSync(join(PUB, entry.site), 'utf8'));
      } catch {
        files.set(entry.site, null);
      }
    }
    const src = files.get(entry.site);
    if (src == null) problems.push(`${where}: the file is gone`);
    else if (!src.includes(entry.mark)) problems.push(`${where}: "${entry.mark}" is no longer in it`);
    const text = entry.text(h);
    for (const id of entry.items) {
      if (!byItem.has(id)) byItem.set(id, []);
      byItem.get(id).push({ text, site: entry.site });
    }
  }
  return { byItem, problems };
}

export const HANDOUT_ITEMS = Object.freeze([...new Set(HANDOUTS.flatMap((e) => e.items))]);
