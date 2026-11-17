/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=5fdccf83';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=eebefe5c';
import { questOffersFeature } from './quest-offers-feature.js?v=9a5069ea';
import { meditationFeature } from './meditation-feature.js?v=ca569a98';
import { teleportationFeature } from './teleportation-feature.js?v=ada01ec9';
import { racesFeature } from './races-feature.js?v=5a5ccc51';
import { mayhemFeature } from './mayhem-feature.js?v=fe5c369f';
import { crownsFeature } from './crowns-feature.js?v=411ed7a5';
import { patchesFeature } from './patches-feature.js?v=4af438ad';
import { foxesFeature } from './foxes-feature.js?v=1da3a4f3';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=6f3f4532';
import { homesFeature } from './homes-feature.js?v=47c80ffb';
import { rookAttackFeature } from './rook-attack-feature.js?v=a4c40af4';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=7100db73';
import { doorsFeature } from './doors-feature.js?v=c5d7167b';
import { locationEventsFeature } from './location-events-feature.js?v=802ff117';
import { puzzlesFeature } from './puzzles-feature.js?v=f7fe7857';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=57304deb';
import { streetJobsFeature } from './street-jobs-feature.js?v=a3590b5f';
import { imaginationFeature } from './imagination-feature.js?v=09179b4e';
import { supplyFeature } from './supply-feature.js?v=7bb86248';
import { giantIconsFeature } from './giant-icons-feature.js?v=bb41b1b1';
import { rubeFeature } from './rube-feature.js?v=6e581a56';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=1251db2f';
import { masterGardenFeature } from './master-garden-feature.js?v=ffb37f8c';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=e50d36ea';
import { questInstancesFeature } from './quest-instances-feature.js?v=eda868ee';
import { partySpacesFeature } from './party-spaces-feature.js?v=07ed9c4e';
import { seasonsFeature } from './seasons-feature.js?v=41a3a3da';
import { cameraModeFeature } from './camera-mode-feature.js?v=48c30c54';
import { newxpFeature } from './newxp-feature.js?v=484f5b59';
import { streetMinimapFeature } from './street-minimap-feature.js?v=f2017350';

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
import { smugglingFeature } from './smuggling-feature.js?v=c47e5b09'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=36f072a5'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=fcd3244b'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=bc7c3cb6'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=dd83a841'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=a22372a5'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=0fd582c4'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=fc946308'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=c81d1d7b'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=af10630d'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=923e3722'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=5394b11c'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=0a1da990'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=21e5fc1e'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=495a6fe7'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=78b0d88a'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=c562644a'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=a28f11ca'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=16196a97'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=87299b2d'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=74d78119'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=1ab231dd'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=7e16fca2'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=fe0bcd2a'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=457b05f8'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=ab4d4e00'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=eae75ac5'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1f53d243'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=806a7108'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=e7fe57f2'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=e73be87b'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=e5be7227'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=993ca715'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=3876e218'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=de04a754'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=2aec92a0'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=6ea09827'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=f8b69cd9'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=81e5313b'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=af7d791d'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=7e1797e2'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=a818e86b'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=459967f3'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=42beb9e8'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=08876f36'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=191c7f39'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=fbeb645e'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=361434e6'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=676705ca'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=35f3e1b1'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=91a128bf'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=8fd50df1'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=7667a57b'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=2a412173'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=53fd0b85'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=181e0fac'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=511f054d'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=c017c263'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=155093cd'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=72733693'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=533e3cec'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=8d96ca6b'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=498a021a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=b10477ee'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=4cfc54a5'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=a25ea362'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=c702688b'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=5e9706b7'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=c8e48e1d'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=030a5a7a'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=53cc832d'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=80ba6a58'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=d02d43d3'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=0cfcc867'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=84d38250'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=794229af'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=f0d650d7'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=5fe0c57c'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=1e172a53'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=bd1fd2e5'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=75df307b'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=32ca552a'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=ca809457'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=886cfcdf'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=bdd29a54'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=b132dd03'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=8f4adf11'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=2c8706de'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=141a1290'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=6cc34bb4'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=b8c8178d'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=f5e4c8a9'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=c55c5c3b'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=0ef5d343'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=e5a59ebf'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=48f55f12'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=cbb20e8c'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=ea21d7e1'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=3f52c185'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=45f0fe7e'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=5206612f'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=3d2a0086'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=a08d9f4b'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=43aa6f33'; FEATURES.push(skillBubblesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=16dad5af'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=9b4f3876'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=81d80b14'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=964a7a8b'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=c11d2556'; FEATURES.push(accountBackupFeature);
