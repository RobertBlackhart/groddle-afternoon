/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=0f649865';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=f612340f';
import { questOffersFeature } from './quest-offers-feature.js?v=561c16e3';
import { meditationFeature } from './meditation-feature.js?v=e66acb22';
import { teleportationFeature } from './teleportation-feature.js?v=31009d39';
import { racesFeature } from './races-feature.js?v=2c2f9964';
import { mayhemFeature } from './mayhem-feature.js?v=91fbf7bc';
import { crownsFeature } from './crowns-feature.js?v=0e103fb4';
import { patchesFeature } from './patches-feature.js?v=8a54db61';
import { foxesFeature } from './foxes-feature.js?v=6677856c';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=c1131793';
import { homesFeature } from './homes-feature.js?v=a953ef7c';
import { rookAttackFeature } from './rook-attack-feature.js?v=c0722c98';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=407aaf23';
import { doorsFeature } from './doors-feature.js?v=7a42b673';
import { locationEventsFeature } from './location-events-feature.js?v=ac6acbc9';
import { puzzlesFeature } from './puzzles-feature.js?v=84b3c18c';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=93ff2cdc';
import { streetJobsFeature } from './street-jobs-feature.js?v=962ee9b6';
import { imaginationFeature } from './imagination-feature.js?v=4fac9ecb';
import { supplyFeature } from './supply-feature.js?v=3941918a';
import { giantIconsFeature } from './giant-icons-feature.js?v=53b264fa';
import { rubeFeature } from './rube-feature.js?v=d85402a7';
import { unlearningFeature } from './unlearning-feature.js?v=1de46622';
import { dropsFeature } from './drops-feature.js?v=d839ece2';
import { masterGardenFeature } from './master-garden-feature.js?v=51baf08c';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=f2391bb1';
import { questInstancesFeature } from './quest-instances-feature.js?v=767fc7a3';
import { partySpacesFeature } from './party-spaces-feature.js?v=c39f420f';
import { seasonsFeature } from './seasons-feature.js?v=e1fa21af';
import { cameraModeFeature } from './camera-mode-feature.js?v=2a8eeea8';
import { newxpFeature } from './newxp-feature.js?v=04de76b1';
import { streetMinimapFeature } from './street-minimap-feature.js?v=da58dd50';

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
import { smugglingFeature } from './smuggling-feature.js?v=0d3ad3e5'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=6b189997'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=4e691e73'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=f0c3de49'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=3e9fff66'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=3df1c305'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=08a5aef9'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=9159b951'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=dea8593f'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=e370f4d0'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=0ea66a9d'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=565a3c73'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=f0423e59'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=16aa72a7'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=69309bc4'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=9f1c4047'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=b33074b7'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=039192d5'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=a39b7402'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=ac67e690'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=77b68213'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=9a8baa9e'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=b76a80ce'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=30f14486'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=2ad3cc85'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=0a7a7b7b'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=582a8195'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=33b645b5'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=01b23324'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=daac4ee3'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=e8cfbffa'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=c745a041'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=5dd7a3fb'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=1e985de8'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=ef5c57a5'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=1376b517'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=11c4c554'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=be0fc1b8'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=602b8e6a'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=937ee337'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=758109b7'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=d8928074'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=93efb414'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=2f9f274b'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=e83e9814'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=12e5a652'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=da3c29b8'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=c019a6ff'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=13b5cb98'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=d66baadc'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=e27bdc52'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=b1ad298c'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=7680823f'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=e61a351b'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=c524d210'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=96ac7196'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=a2bc95fc'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5d71a1eb'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=209d2535'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=03903974'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=516ed7ae'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=5b025eca'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=1605bd4f'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=3b73a07a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=15495d40'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=9bd8db07'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=e611006c'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=e16bce73'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=44258102'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=4c1eae6f'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=155b3db6'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=7ff4d30e'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=e4a8cd47'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=c286c41f'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=886c89bd'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=37c078f6'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=a9c67252'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7ca5d0c4'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=17fdf393'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=246511bc'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=3f718120'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=80979d18'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=4fb2a4d5'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=bacfd497'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=755096fc'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=7633cfea'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=76da4dcf'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=f0c0d6c2'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=f061fa05'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=ab943b97'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=49957775'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=458e2207'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=5aacf300'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=9e341a9b'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=15a5a755'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=ad7b142c'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=be4b0e76'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=d1472b78'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=7782d1b3'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=96cb99c8'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=29207f5c'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=43ab292a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=48eaef4d'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=f54b829f'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=cd6489dd'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=d9656427'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=c6ce38d8'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=ba6fd060'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=3800e7d5'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=9329a5be'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=9a9ae8f2'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=4b26af25'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=126783df'; FEATURES.push(homeCrewMpFeature);
// TODAYCARD: the start card's Today panel and nudge for a returning player (asks solo-feats for startCardFeat).
import { startTodayFeature } from './start-today-feature.js?v=f6cf1ccd'; FEATURES.push(startTodayFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=bf547b89'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=1e9ccf98'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=a878804e'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=adfca9df'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=785f283b'; FEATURES.push(feastDayFeature);
import { calendarFeature } from './calendar-feature.js?v=0b10be39'; FEATURES.push(calendarFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=a7a41c6e'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=faf1bb4d'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=1b10b444'; FEATURES.push(accountBackupFeature);
