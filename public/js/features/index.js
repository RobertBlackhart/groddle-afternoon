/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=4fc52fd2';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=aca90bbf';
import { questOffersFeature } from './quest-offers-feature.js?v=4c5562d7';
import { meditationFeature } from './meditation-feature.js?v=cfc4f8f0';
import { teleportationFeature } from './teleportation-feature.js?v=67bd0b27';
import { racesFeature } from './races-feature.js?v=87eb2616';
import { mayhemFeature } from './mayhem-feature.js?v=6409227d';
import { crownsFeature } from './crowns-feature.js?v=41b7989d';
import { patchesFeature } from './patches-feature.js?v=fb7eeee3';
import { foxesFeature } from './foxes-feature.js?v=e4388fd8';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=2c00f20b';
import { homesFeature } from './homes-feature.js?v=fcccab54';
import { rookAttackFeature } from './rook-attack-feature.js?v=4ceb555a';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=ec605345';
import { doorsFeature } from './doors-feature.js?v=2cde1d9f';
import { locationEventsFeature } from './location-events-feature.js?v=ac6acbc9';
import { puzzlesFeature } from './puzzles-feature.js?v=0552752e';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=70860e97';
import { streetJobsFeature } from './street-jobs-feature.js?v=5002941d';
import { imaginationFeature } from './imagination-feature.js?v=bf88e042';
import { supplyFeature } from './supply-feature.js?v=6d475c3f';
import { giantIconsFeature } from './giant-icons-feature.js?v=1d4cca1d';
import { rubeFeature } from './rube-feature.js?v=95eeb033';
import { unlearningFeature } from './unlearning-feature.js?v=6f8a14d4';
import { dropsFeature } from './drops-feature.js?v=be983fb0';
import { masterGardenFeature } from './master-garden-feature.js?v=626a9190';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=46d21c0b';
import { questInstancesFeature } from './quest-instances-feature.js?v=9a2f5f9f';
import { partySpacesFeature } from './party-spaces-feature.js?v=22e0da26';
import { seasonsFeature } from './seasons-feature.js?v=63c29453';
import { cameraModeFeature } from './camera-mode-feature.js?v=91a296e1';
import { newxpFeature } from './newxp-feature.js?v=7b673e27';
import { streetMinimapFeature } from './street-minimap-feature.js?v=def6a0dc';

export { questFlagsFeature };

export const FEATURES = [
  questFlagsFeature,
  hellFeature,
  resourceNodesFeature,
  questOffersFeature,
  meditationFeature,
  teleportationFeature,
  racesFeature,
  mayhemFeature,
  crownsFeature,
  patchesFeature,
  foxesFeature,
  heliKittiesFeature,
  homesFeature,
  rookAttackFeature,
  streetFurnitureFeature,
  doorsFeature,
  locationEventsFeature,
  puzzlesFeature,
  puzzleScenesFeature,
  streetJobsFeature,
  imaginationFeature,
  supplyFeature,
  giantIconsFeature,
  rubeFeature,
  unlearningFeature,
  dropsFeature,
  masterGardenFeature,
  animalHusbandryFeature,
  questInstancesFeature,
  partySpacesFeature,
  seasonsFeature,
  cameraModeFeature,
  newxpFeature,
  streetMinimapFeature,
];
import { smugglingFeature } from './smuggling-feature.js?v=85289940'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=7de4d00a'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=d1621748'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=de29fab4'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=8ee85a2e'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=6b1c7042'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=624dd28f'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=5a14d85b'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=a31eb543'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=9cb7548f'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=62326229'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=a3edba25'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=96a28907'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=065be79a'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=49a7c36e'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=1e85c709'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=2b188e8d'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=1ec77aaa'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=56b0ece4'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=8525a3d7'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=9a54b747'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=f5824d9a'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=4f061d4e'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=30f14486'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=2ad3cc85'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=2af8bd80'; FEATURES.push(rebuiltRoomsFeature);
import { quarterFeature } from './quarter-feature.js?v=5874bcfa'; FEATURES.push(quarterFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=2d786839'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=4789b506'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=2613cfb3'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=7e26ecd6'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=7ca4416d'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=5f9ea423'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=a489efdd'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=9ccc0455'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=86bad4be'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=62a7a900'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=71f9481f'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=7e6b2249'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=6d1073a9'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=b8aed59f'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=b441b4e2'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=0433c7cb'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=7c8fa722'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=1c530f1d'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=df48bd74'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=3d55f5cf'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=0382e196'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=f492e2a5'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=3aab8f22'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=5cf9fbe5'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=5beff2b4'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=829617b3'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=86f14a06'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=1bbc9af3'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=a6816a87'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=793b8311'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=fff2df06'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5d71a1eb'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=e0a3361e'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=a5ed201e'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=214489b1'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=5b8f0e39'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=2a56cd9a'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=e218803f'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=15495d40'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=70735aca'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=aae43c2d'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=e3bc39b4'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=69959490'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=571e50fb'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=e937c29c'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=01a859c1'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=bf146d14'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=3869ac03'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=783dbf40'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=8a9d96d9'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=060bc06a'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7ca5d0c4'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=4783c7c3'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=d26ed6db'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=c5f6e74b'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=f1117513'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=8d65e9db'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=ad56cfc1'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=e782867e'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=00d8d53a'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=351a647c'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=8da2076f'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=c54f582e'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=a1a87c1a'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=3e359519'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=b0a30cc3'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=84b01b4b'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=bcd229ef'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=086abf59'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7e1f2688'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=75786bbd'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=b410467c'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=4e583250'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=9b563808'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=7ed5df7b'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=dffac45d'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=3ab3fd3b'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=977f9355'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=66f3ff2a'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=60241f82'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=469e6ea3'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=baea8d15'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=fb490c50'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=6a4f9e22'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=0827f586'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=8ef68a52'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=b8a598aa'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=ad36a0da'; FEATURES.push(homeCrewMpFeature);
// TODAYCARD: the start card's Today panel and nudge for a returning player (asks solo-feats for startCardFeat).
import { startTodayFeature } from './start-today-feature.js?v=326889da'; FEATURES.push(startTodayFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=0411e47c'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=569b3719'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=24662363'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=2188221d'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=fc0b54bb'; FEATURES.push(feastDayFeature);
import { calendarFeature } from './calendar-feature.js?v=911e7478'; FEATURES.push(calendarFeature);
// G1195 Happy New Ur: the countdown at the Groddle midnights of December 31, the show and the party street.
import { newUrFeature } from './new-ur-feature.js?v=68a5efe4'; FEATURES.push(newUrFeature);
import { newUrPartyFeature } from './new-ur-party-feature.js?v=62874ea6'; FEATURES.push(newUrPartyFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=6b505af8'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=ed017c68'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=5ce4b0a4'; FEATURES.push(accountBackupFeature);
