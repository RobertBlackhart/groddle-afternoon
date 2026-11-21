/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=00c337a8';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=ceb23742';
import { questOffersFeature } from './quest-offers-feature.js?v=561c16e3';
import { meditationFeature } from './meditation-feature.js?v=c2f53556';
import { teleportationFeature } from './teleportation-feature.js?v=3f04f41b';
import { racesFeature } from './races-feature.js?v=b1e95040';
import { mayhemFeature } from './mayhem-feature.js?v=95f5ffe5';
import { crownsFeature } from './crowns-feature.js?v=ba5b5b30';
import { patchesFeature } from './patches-feature.js?v=8a8d3cba';
import { foxesFeature } from './foxes-feature.js?v=61b13631';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=e927974f';
import { homesFeature } from './homes-feature.js?v=6fbc64c4';
import { rookAttackFeature } from './rook-attack-feature.js?v=65347d8a';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=3d6f4802';
import { doorsFeature } from './doors-feature.js?v=7ae44de1';
import { locationEventsFeature } from './location-events-feature.js?v=3836af7a';
import { puzzlesFeature } from './puzzles-feature.js?v=e2a94477';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=f7b635a0';
import { streetJobsFeature } from './street-jobs-feature.js?v=559b107f';
import { imaginationFeature } from './imagination-feature.js?v=12c10ad3';
import { supplyFeature } from './supply-feature.js?v=77894316';
import { giantIconsFeature } from './giant-icons-feature.js?v=0e1344b3';
import { rubeFeature } from './rube-feature.js?v=c637b78f';
import { unlearningFeature } from './unlearning-feature.js?v=7f13f85e';
import { dropsFeature } from './drops-feature.js?v=8775eb00';
import { masterGardenFeature } from './master-garden-feature.js?v=2d1128d3';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=cab8980a';
import { questInstancesFeature } from './quest-instances-feature.js?v=86e0dca4';
import { partySpacesFeature } from './party-spaces-feature.js?v=2ca7400b';
import { seasonsFeature } from './seasons-feature.js?v=5187456f';
import { cameraModeFeature } from './camera-mode-feature.js?v=342ee030';
import { newxpFeature } from './newxp-feature.js?v=876ec89c';
import { streetMinimapFeature } from './street-minimap-feature.js?v=ce5f6c28';

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
import { smugglingFeature } from './smuggling-feature.js?v=bcc85d76'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=c2441d2e'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=42e8d299'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=bc50e48c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=b714fdd3'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=61907e25'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=0354f4a9'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=144d020e'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=272c5e99'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=599c6484'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=f8155342'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=11d67547'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=7fef4068'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=804920e8'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=53e4bf19'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=bc2c299b'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=b33074b7'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=e3132a10'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=6f5720d5'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=7568e0de'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=e9262dc1'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=de9c3275'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=6d5e8160'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=64f84b6f'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=335655e2'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=8ab04873'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=cb5fb778'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=7a113af2'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=01b23324'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=e209339d'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=dd379eb6'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=f554394a'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=6c435509'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=d8cb65f5'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=8ef203ae'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=35c40794'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=8e57297f'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=9e5188b8'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=d1e90a6a'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=f9e5cee8'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=b4fc876a'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=fd737c24'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=0c10e4a8'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=ec2515ea'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=ad60f132'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=4c9f0a5b'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=eed75d28'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=6e3f1a92'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=6c843b5c'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=a229062f'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=8cff20cb'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=b1ad298c'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=66baeb5c'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=ef6c54aa'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=2887e39b'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=d97a7cae'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=cdd10676'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5d71a1eb'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=4d400009'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=482f8727'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=933a97bd'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=e636b72c'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=d1721576'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=83668378'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=15495d40'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=900ab79e'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=e611006c'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=1807accb'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=7233c0f2'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=ac5ae229'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=8dced19d'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=7ff4d30e'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=b041f5a1'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=c286c41f'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=bb749988'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=2ab7fe36'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=a9c67252'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7ca5d0c4'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=e6cea331'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=6dfc48dc'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=3f718120'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=50c87d8a'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=2ccdbc3c'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=625c4cbf'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=2a55bf61'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=579ea907'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=76da4dcf'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=61984fa0'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=cc83ea47'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=189406c6'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=3a05f4b5'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=363d95e2'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=ed80100f'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=f662e606'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=2617ab5b'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=2ded54c7'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=d1472b78'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=3254a662'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=96cb99c8'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=29207f5c'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=43ab292a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=c72c691d'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=f54b829f'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=b8025591'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=d9656427'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=c6ce38d8'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=ba6fd060'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=03be28f4'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=8adfda5f'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=0aa6eba6'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=5b011a78'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=a9704e10'; FEATURES.push(homeCrewMpFeature);
// TODAYCARD: the start card's Today panel and nudge for a returning player (asks solo-feats for startCardFeat).
import { startTodayFeature } from './start-today-feature.js?v=e287e5c3'; FEATURES.push(startTodayFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=30a2cde2'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=36fe5c21'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=acb74312'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=667da444'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=1dd30337'; FEATURES.push(feastDayFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=80712559'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=24d0afae'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=1b10b444'; FEATURES.push(accountBackupFeature);
