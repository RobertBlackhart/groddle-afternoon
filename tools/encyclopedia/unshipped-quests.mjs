/**
 * Quests Tiny Speck wrote that were not in Glitch at the end (Austin 2026-11-23: "What if we fully
 * add all of the quests in code that never shipped into the Encyclopedia. That might help our users
 * explore and request some to be completed."). Each gets a page from GSJS's own text with a status
 * chip, what is missing, who gave it, words about any reference material, and, for the never
 * finished ones, a way to ask for it on the Ideas board.
 *
 * Research: ~/Documents/glitch-audit/research/coverage/missing-gameplay-2026-11-23.md (sections 1b,
 * 1c, 1d). The inventory (research/coverage/inventory.sqlite) still marks some of these "excluded",
 * so this list is the encyclopedia's record of them and of their status; it wins over the inventory
 * for the quests it names (data.mjs, and tools/catalog/build.mjs readQuestStatus for the item pages).
 *
 * Statuses (parts.mjs STATUS):
 *  - unbuilt_original: never finished or never offered by Tiny Speck;
 *  - retired_original: live once, then retired by Tiny Speck;
 *  - staff_only: only Tiny Speck's staff were ever offered it;
 *  - source: built in the remake though the inventory lists it as excluded (A Holiday Thing, built in
 *    the Glitchmas season: js/seasons.js saysYay, js/seasons-data.js holidayQuest,
 *    js/features/seasons-feature.js offerHolidayQuest; the quest detector only reads quests.json solo).
 *
 * Words are ours and players read them (tests/player-copy-dev-refs.test.js): plain, no file names,
 * no em dashes, no player names. `{quests:<id>}` becomes a link to that quest's page.
 * Reference pictures and videos are never shown: `refs` only says, in words, what survives.
 *
 * Sources per entry:
 *  - camera line: quests/say_cheese.js ... dead_head.js, requirements = {}, no giver, nothing else in
 *    GSJS names them; the only other trace is the retired snapshotting_1 skill.
 *  - learn_first_skill, tutorial_reinforcement, get_first_tool: the 2011 Magic Rock tutorial
 *    (learn_first_skill.js 76 starts tutorial_reinforcement; get_first_tool.js 125; street_spirit*.js
 *    531-676). The 2012-09 blog progress report says Tiny Speck "completely rebuilt the introduction
 *    new players get to the game", which became the Gentle Island tutorial (newbie_island.js).
 *  - you_croaked: players/player.js 1295 //this.quests_offer('you_croaked', true); a November 2010
 *    press screenshot shows it live (refs.db 10083).
 *  - zero_mood: offered only to admins at zero mood (inc_metabolics.js 215-217).
 *  - the rest: build-quests.mjs EXCLUDE and the inventory's evidence for each.
 */

/** The camera quests, in the order their files chain them. */
export const CAMERA_LINE = Object.freeze(['say_cheese', 'questswhere_the_heart_isjs', 'snappy_explorer', 'animal_qrazy', 'omg_bacon', 'wierd_n_wild', 'dead_head']);

const CAMERA = {
  status: 'unbuilt_original',
  gave: 'Written in the Magic Rock’s voice, as one of a line of seven camera quests. Nothing in Tiny Speck’s code hands it out.',
  half: 'Half written: the words and the rewards are there, but Tiny Speck never wrote its steps, so nothing could look at the picture or finish the quest.',
  remake: 'It isn’t playable in Groddle yet. Groddle already has a camera; what this quest still needs is a way to tell what is in a snap.',
  ask: true,
};

const NO_STEPS = 'Half written: Tiny Speck never wrote its steps, so nothing could ever finish it. What survives is shown below.';
const MAGIC_ROCK = 'Written in the Magic Rock’s voice. Nothing in Tiny Speck’s code hands it out.';
const NOT_YET = 'It isn’t playable in Groddle yet.';
const GENTLE = 'It isn’t planned for Groddle: the Gentle Island tutorial is in the game.';

export const UNSHIPPED_QUESTS = Object.freeze({
  ...Object.fromEntries(CAMERA_LINE.map((id) => [id, CAMERA])),

  animal_friend: { status: 'unbuilt_original', gave: MAGIC_ROCK, half: NO_STEPS, remake: NOT_YET, ask: true },
  daily_mechanics: { status: 'unbuilt_original', gave: MAGIC_ROCK, half: NO_STEPS, remake: NOT_YET, ask: true },
  homelier_sweet_home: { status: 'unbuilt_original', gave: 'Nothing in Tiny Speck’s code hands it out.', half: NO_STEPS, remake: NOT_YET, ask: true },
  slice_of_pie: { status: 'unbuilt_original', gave: 'Written for a Ranger to give, with a Bureaucrat at the end. Nothing in Tiny Speck’s code hands it out.', half: NO_STEPS, remake: NOT_YET, ask: true },
  pied_pepper: { status: 'unbuilt_original', gave: 'Written for Zilloween. Nothing in Tiny Speck’s code ever offered it.', remake: NOT_YET, ask: true },
  butler_zombies: { status: 'unbuilt_original', gave: 'Written for Zilloween. Tiny Speck wrote how Butlers count the word, but nothing hands out the quest.', remake: `${NOT_YET} It would need other players’ Butlers, so it belongs online.`, ask: true },
  grub_giver: { status: 'unbuilt_original', gave: 'Nothing offers it.', half: 'Half written: its offer stops in the middle of a sentence, and the steps only ask for the cooking, not for giving each dish away.', remake: NOT_YET, ask: true },
  tower_defense: { status: 'unbuilt_original', gave: 'Nothing offers it. Its only trace outside its own file is a test street named Tower Defense.', half: NO_STEPS, remake: NOT_YET, ask: true },
  multiplayer_races: { status: 'unbuilt_original', gave: 'Its only course was on Tiny Speck’s test servers, and no race ticket leads to it.', half: 'Half written: its offer is placeholder text.', remake: NOT_YET, ask: true },
  manor_mystery: { status: 'unbuilt_original', gave: 'Nothing in Tiny Speck’s code offers it. Its words point to the Manor on Hauki Seeks.', half: 'Half written: the Manor’s notes never reach the end of the hunt, the person at the end has nothing to say, and the upper floors of the Manor were never saved.', remake: NOT_YET, ask: true },
  orld_ugs_esara: { status: 'unbuilt_original', gave: 'Nothing offers it.', half: 'Half written: nothing in the game ever marks the hugs it asks for, so it could not finish.', remake: NOT_YET, ask: true },
  gardening_plant_5_seed_types: { status: 'unbuilt_original', gave: 'Nothing offers it.', half: 'Half written: nothing in Tiny Speck’s code counts the seeds it asks you to plant, so it could never finish.', remake: NOT_YET, ask: true },

  zero_mood: {
    status: 'staff_only',
    chip: 'Staff only',
    gave: 'Your Magic Rock offered it only to Tiny Speck’s staff, and only when their mood fell to zero.',
    remake: 'It isn’t playable in Groddle and isn’t planned: players were never offered it.',
  },

  learn_first_skill: {
    status: 'retired_original',
    year: 2012,
    gave: 'Your Magic Rock gave it in the 2011 tutorial, soon after you arrived.',
    replaced: 'The Gentle Island tutorial replaced the old introduction in 2012.',
    remake: GENTLE,
    refs: 'It survives in words only: our reference library holds two 2011 videos of new players starting the game, and both show this quest being completed. We describe them here rather than show them.',
  },
  tutorial_reinforcement: {
    status: 'retired_original',
    year: 2012,
    gave: 'It came straight after {quests:learn_first_skill} in the 2011 tutorial.',
    replaced: 'The Gentle Island tutorial replaced the old introduction in 2012.',
    remake: GENTLE,
    refs: 'It survives in words only: our reference library holds a picture of its quest window (pet a Pig, water a Tree, mark the Map, for 150 xp, 20 energy and 30 mood) and a quest log showing it done. We describe them here rather than show them.',
  },
  get_first_tool: {
    status: 'retired_original',
    year: 2012,
    gave: 'Offered in the 2011 tutorial once you knew a skill: get the tool that goes with it. Street Spirits checked it when you bought one.',
    replaced: 'The Gentle Island tutorial replaced the old introduction in 2012.',
    remake: GENTLE,
    refs: 'It survives in words only: a fan wiki of 2012 listed it among the early quests.',
  },
  you_croaked: {
    status: 'retired_original',
    gave: 'Offered the moment you croaked, in the 2010 game.',
    replaced: 'Tiny Speck later switched it off; the year is not known. {quests:hell_hole} and {quests:hell_quest} took over in Naraka.',
    remake: 'It isn’t planned for Groddle: Naraka in Groddle works the later way.',
    refs: 'It survives in words only: our reference library holds a November 2010 press screenshot of its New Quest window over the croak screen. We describe it here rather than show it.',
  },

  glitchmas2010: {
    status: 'source',
    gave: 'Your Magic Rock offers it once a year, in the Glitchmas season.',
    remake: 'You can do this quest in the remake during the Glitchmas season.',
  },
});

/**
 * GSJS quest files with no page, and why. Street-project jobs (quests.json isJob) are not listed
 * here: they belong to the Feats and street projects section (tools/encyclopedia/sections.mjs).
 */
export const NO_PAGE = Object.freeze({
  cal_test_1: 'a Tiny Speck test quest (collect some apples)',
  chris_test: 'a Tiny Speck test quest',
  jason_test_quest: 'a Tiny Speck test quest',
  potionmaking_make_and_use_essence_of_hole_potion: 'a stub with an empty description',
  missing: 'a placeholder file, not a quest',
  quest: 'the shared quest base code, not a quest',
  quest_scripting: 'helper functions for quest places, not a quest',
});

/** The chip on an entry's page: Never finished by Tiny Speck, Retired by Tiny Speck in 2012, Staff only. */
export function unshippedChip(u) {
  if (!u) return '';
  if (u.chip) return u.chip;
  if (u.status === 'unbuilt_original') return 'Never finished by Tiny Speck';
  if (u.status === 'retired_original') return `Retired by Tiny Speck${u.year ? ` in ${u.year}` : ''}`;
  return '';
}

/** A quest's status: this list's, else the inventory's. */
export const questStatusOf = (id, inventoryStatus) => UNSHIPPED_QUESTS[id]?.status || inventoryStatus;
