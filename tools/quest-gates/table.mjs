/**
 * The quest offer table (root R18, Austin 2026-11-17: data comes from the original wherever the
 * original has it). build-quests.mjs builds every quest's offer gate from glitch-GameServerJS:
 *
 *   who offers   the scans in build-quests.mjs (level map, xp lines, skill map, setAvailableQuests,
 *                achievements, chain offers) and SPECIAL_TRIGGERS below (call sites read by hand,
 *                each with its file and line)
 *   conditions   the quest file's own `prerequisites` and `prereq_quests`, and its canOffer
 *                (translated to custom_code gates in public/js/quest-rooms/catalog.js)
 *
 * Where the dump keeps no giver for a quest, the Magic Rock delivers it once the quest file's own
 * conditions pass (trigger type 'prerequisites', or 'quest' for each prereq quest; inferred: true).
 * Those conditions are still the original's.
 *
 * STAND_INS: quests whose file has no conditions and whose giver is lost. Nothing in GSJS offers
 * them (tests/quest-gates-gsjs.test.js checks that no quests_offer, startQuest or setAvailableQuests
 * names them outside `seenOnlyIn`), so any gate is the remake's own: each row says why, what GSJS
 * holds and the register row.
 *
 * GATE_DEVIATIONS: quests whose gate differs from what GSJS has (conditions, giver or canOffer).
 * Each row cites the register row, and Austin's ruling where he made one (ruling: null = none on
 * record; those are listed in the R18 evidence line for his call).
 *
 * tests/quest-gates-gsjs.test.js fails when a quest's gate differs from GSJS without a row here.
 */

/** Hand-read call sites (build-quests.mjs adds these as offer triggers). */
export const SPECIAL_TRIGGERS = Object.freeze({
  hell_hole: { source: 'players/player.js 1444-1445', triggers: [{ type: 'event', event: 'death', where: 'hell_one' }] },
  hell_quest: { source: 'players/player.js 1446-1447', triggers: [{ type: 'event', event: 'death', where: 'purgatory' }] },
  baqala_nostalgia: { source: 'locations/savanna.js 32', triggers: [{ type: 'region', region: 'Savanna' }] },
  buy_two_bags: { source: 'locations/newbie_island.js 387', triggers: [{ type: 'event', event: 'newxp_island' }] },
  leave_gentle_island: { source: 'locations/home.js 420', triggers: [{ type: 'event', event: 'newxp_home' }] },
  rube_spy: { source: 'locations/home.js 175', triggers: [{ type: 'event', event: 'rube_visited_home' }] },
  card_carrying_qualification: { source: 'items/subway_gate.js 158', triggers: [{ type: 'event', event: 'subway_gate' }] },
  stale_but_necessary: { source: 'items/cup_of_water.js 171', triggers: [{ type: 'event', event: 'item_use', item: 'cup_of_water' }] },
  treasure_map_1: { source: 'items/treasure_map_1.js 85', triggers: [{ type: 'event', event: 'item_use', item: 'treasure_map_1' }] },
  create_giant_icon: { source: 'items/include/shrines.js 154', triggers: [{ type: 'event', event: 'emblems', count: 4 }] },
  donate_to_all_shrines: { source: 'items/include/shrines.js 1264', triggers: [{ type: 'event', event: 'shrine_donation' }] },
  last_pilgrimage_of_esquibeth: {
    source: 'items/npc_shrine_zille.js 582',
    triggers: [{ type: 'event', event: 'shrine_donation', afterQuest: 'donate_to_all_shrines', delaySec: 1800 }],
  },
  zero_mood: { source: 'players/inc_metabolics.js 216', triggers: [{ type: 'event', event: 'mood_zero', adminOnly: true }] },
  smuggling_basic: { source: 'items/npc_smuggler.js 376', triggers: [{ type: 'npc', npc: 'npc_smuggler' }] },
  high_jump: { source: 'quests/de_embiggenify_part2.js 79', triggers: [{ type: 'quest', quest: 'de_embiggenify_part2', delaySec: 60 }] },
});

const NO_GIVER = 'no quests_offer, startQuest, setAvailableQuests or skill-map line names it; only the admin /testquest (main.js 2359-2372) offers it';

/**
 * Giver lost and no conditions in the quest file: the remake's stand-in gate. `seenOnlyIn` lists the
 * GSJS files outside the quest's own that name it in an offer call, each explained in `gsjs`.
 */
export const STAND_INS = Object.freeze({
  meditativearts_meditation_station: { gate: { quests: ['meditativearts_get_max_relax'] }, row: 'R18', gsjs: NO_GIVER, why: 'Meditative Arts series; no giver survives (familiar turn-in)' },
  master_milker: { gate: { quests: ['animalkinship_milk_butterflies'] }, row: 'R18', gsjs: NO_GIVER, why: 'milking quest after the Animal Kinship milking quest' },
  rannacramble: { gate: { quests: ['master_milker'], region: 'Aranna' }, row: 'G277', gsjs: NO_GIVER, why: '"Take a hike through Aranna"' },
  doody_inspector: { gate: { quests: ['animalkinship_pet_piggies'] }, row: 'R18', gsjs: NO_GIVER, why: 'piggy plops follow piggy care' },
  buy_bag: {
    gate: { level: 2 }, row: 'G460', seenOnlyIn: ['quests/learn_first_skill.js'],
    gsjs: 'started only by learn_first_skill onComplete_custom (learn_first_skill.js 74-76), the 2011 tutorial that nothing in the 2012 source starts (EXCLUDE removed_feature); the original gate was "once your first skill is under way"',
    why: 'early pack-space quest (source: emergency, newxp era)',
  },
  spice_must_flow: { gate: { npc: 'street_spirit_groddle' }, row: 'R18', gsjs: `${NO_GIVER}; end_npcs street_spirit_groddle, and its offer is a street spirit speaking`, why: 'end_npcs: street_spirit_groddle' },
  // Meet the Merchants (G121): part 1's offer is the pet rock talking ("I'm your pet rock"), so the
  // Magic Rock gives it; its end NPC, the Gardening Tools Vendor, then offers parts 2-4 (their offer text
  // is the scarecrow: "buy these items from me"), each once the last one is turned in. Parts 2-4's
  // quests are the files' own prereq_quests.
  vendor_ping_pong_part1: { gate: { level: 2 }, row: 'G121', gsjs: NO_GIVER, why: 'offer is the pet rock speaking; end_npcs npc_gardening_vendor' },
  vendor_ping_pong_part2: { gate: { npc: 'npc_gardening_vendor', quests: ['vendor_ping_pong_part1'] }, row: 'G121', gsjs: NO_GIVER, why: 'offer is the Gardening Tools Vendor speaking' },
  vendor_ping_pong_part3: { gate: { npc: 'npc_gardening_vendor', quests: ['vendor_ping_pong_part2'] }, row: 'G121', gsjs: NO_GIVER, why: 'offer is the Gardening Tools Vendor speaking' },
  vendor_ping_pong_part4: { gate: { npc: 'npc_gardening_vendor', quests: ['vendor_ping_pong_part3'] }, row: 'G121', gsjs: NO_GIVER, why: 'offer is the Gardening Tools Vendor speaking' },
  manor_mystery: { gate: { street: 'Hauki Seeks' }, row: 'G121', gsjs: NO_GIVER, why: '"the Manor on Hauki Seeks"' },
  jump_in_hole: { gate: { level: 5 }, row: 'G456', gsjs: NO_GIVER, why: 'exploration quest; no gate in source' },
  ultimate_smoothie_1: { gate: { skills: ['blending_1'] }, row: 'R18', gsjs: NO_GIVER, why: 'smoothie ingredients; Blending' },
  rising_moon: { gate: { level: 5 }, row: 'R18', gsjs: NO_GIVER, why: 'emotional bear + moon, both sold by street spirits' },
  betterlearning_collect_favor_points: { gate: { quests: ['betterlearning_get_favor_at_shrines'] }, row: 'G62', gsjs: NO_GIVER, why: 'Better Learning favor series' },
  betterlearning_donate_to_shrines: { gate: { quests: ['betterlearning_get_favor_at_shrines'] }, row: 'G62', gsjs: NO_GIVER, why: 'Better Learning favor series' },
  betterlearning_get_giant_emblem: { gate: { quests: ['betterlearning_get_favor_at_shrines'] }, row: 'G62', gsjs: NO_GIVER, why: 'Better Learning favor series' },
  engineering_assemble_machine: {
    gate: { skills: ['engineering_1'] }, row: 'G443',
    gsjs: `${NO_GIVER}; machine_stand.js 157-161 comments its own check out "until quest is rebuilt"`,
    why: 'Engineering intro quest',
  },
  teleportation_teleport_between_zones: { gate: { skills: ['teleportation_1'] }, row: 'R18', gsjs: NO_GIVER, why: 'Teleportation series' },
  soilappreciation_tend_patches: { gate: { skills: ['soil_appreciation_1'] }, row: 'G466', gsjs: NO_GIVER, why: 'Soil Appreciation series' },
  soilappreciation_pet_seedlings_to_trees: { gate: { skills: ['soil_appreciation_2'] }, row: 'R18', gsjs: NO_GIVER, why: 'Soil Appreciation series' },
  soilappreciation_tend_patch_get_drop: { gate: { skills: ['soil_appreciation_3'] }, row: 'G462', gsjs: NO_GIVER, why: 'Soil Appreciation series' },
  soilappreciation_plant_beans_in_back_yard_patches: { gate: { skills: ['soil_appreciation_4'] }, row: 'R18', gsjs: NO_GIVER, why: 'Soil Appreciation series' },
  mini_me_mini_you: { gate: { level: 10 }, row: 'G447', gsjs: NO_GIVER, why: 'Cubimal giving; no gate in source' },
});

/**
 * Quests whose gate differs from GSJS where GSJS has one. `kind`: 'giver' (who offers),
 * 'conditions' (prerequisites / prereq_quests), 'canOffer' (the file's canOffer not kept as written).
 * canOffer gates kept as written (custom_code rows in catalog.js OFFER_OVERRIDES) need no row.
 */
export const GATE_DEVIATIONS = Object.freeze({
  // Quest rooms (public/js/quest-rooms/catalog.js OFFER_OVERRIDES, each with its own why).
  help_juju_bandits: { kind: ['giver'], row: 'G70', ruling: null, why: 'npc_juju_bandit stands in for the Savanna dust trap (inc_special_locations.js 294)' },
  join_club: { kind: ['giver', 'conditions'], row: 'G80', ruling: null, why: 'the Butler offers it at 30128 iMG (inc_stats.js 313-322); the Magic Rock when there is no Butler (no_butler)' },
  join_club_reminisce: { kind: ['canOffer'], row: 'R18', ruling: null, why: 'canOffer is admins only (pc.is_god); opened to players through the Play Cube an hour after Join the Club' },
  an_autumn_day: { kind: ['giver'], row: 'G562', ruling: null, why: 'a Zutto street spirit offered it (street_spirit_zutto.js 441-449); the remake offers it once A Summer\'s Day is done' },
  le_miserable: {
    kind: ['giver', 'conditions'], row: 'G107', ruling: 'Austin 2026-10-24: one real day after Firefly Whistle (source: ten days)',
    why: 'a Zutto street spirit offered it (street_spirit_zutto.js 441-449); the familiar offers it a day after Firefly Whistle (canOffer: ten days)',
  },
  last_pilgrimage_of_esquibeth: { kind: ['giver'], row: 'G79', ruling: null, why: 'the shrine\'s 30-minute check (npc_shrine_*.js 582) as a delayed chain offer' },
  stale_but_necessary: { kind: ['giver'], row: 'G318', ruling: null, why: 'same source trigger (cup_of_water.js 171), kept for the built room' },
  rube_spy: { kind: ['giver', 'conditions'], row: 'G586', ruling: null, why: 'the Rube visiting your home (home.js 175) becomes: once you have traded with The Rube' },
  puzzle_level_light_perspective: { kind: ['conditions'], row: 'G78', ruling: null, why: 'quests_offer ignores the file\'s over_level 13 (inc_quests.js 586-602), so the xp offer drops it' },
  where_the_blue_grew: { kind: ['conditions'], row: 'G109', ruling: null, why: 'quests_login offers it (inc_quests.js 101-104); quests_offer ignores prerequisites, so any of the four completist badges offers it' },
  tower_quest: { kind: ['giver', 'conditions'], row: 'G71', ruling: null, why: 'the Ghost of Gwendolyn in Room 23; over_level 12 stands in for the lost giver\'s level' },
  smuggle_the_smuggler_part1: { kind: ['giver'], row: 'G313', ruling: null, why: 'no giver survives; the Smuggler offers it after a delivery' },
  firefly_whistle: { kind: ['giver'], row: 'R18', ruling: null, why: 'npc_firefly.js 437 offers it by its overlay (done_payload quest_name); the familiar delivers it' },
  // Home Tower (js/features/home-tower-feature.js): the Magic Rock's list names it (magic_rock.js
  // 778-780) but canOffer returns false (build_a_tower.js 67-69), so the 2012 game never offered it.
  build_a_tower: { kind: ['canOffer'], row: 'R18', ruling: null, why: 'canOffer false in the source; the remake offers it at level 18 without a Tower' },
  // Tutorial practice quests: a later quest's prereq is met by the skill and its tool (G484, ticket 28).
  animalkinship_1: { kind: ['conditions'], row: 'G484', ruling: null, why: 'PREREQ_PROXY: the skill stands for the newxp practice quest' },
  ezcooking_1: { kind: ['conditions'], row: 'G484', ruling: null, why: 'PREREQ_PROXY: the skill and Knife & Board' },
  lightgreenthumb_1: { kind: ['conditions'], row: 'G484', ruling: null, why: 'PREREQ_PROXY: the skill and Watering Can' },
  soilappreciation_1: { kind: ['conditions'], row: 'G484', ruling: null, why: 'PREREQ_PROXY: the skill and Shovel' },
});
