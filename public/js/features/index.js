/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=6da8c49f';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=3534ec3d';
import { questOffersFeature } from './quest-offers-feature.js?v=0b747f6e';
import { meditationFeature } from './meditation-feature.js?v=9f2a3044';
import { teleportationFeature } from './teleportation-feature.js?v=0ce61bb6';
import { racesFeature } from './races-feature.js?v=b793f436';
import { mayhemFeature } from './mayhem-feature.js?v=f3e019fc';
import { crownsFeature } from './crowns-feature.js?v=187b8f62';
import { patchesFeature } from './patches-feature.js?v=cf35208a';
import { foxesFeature } from './foxes-feature.js?v=27eecaab';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=29ae9e64';
import { homesFeature } from './homes-feature.js?v=bde46754';
import { rookAttackFeature } from './rook-attack-feature.js?v=ab7c4e62';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=16f550e7';
import { doorsFeature } from './doors-feature.js?v=138cb758';
import { locationEventsFeature } from './location-events-feature.js?v=0843b12e';
import { puzzlesFeature } from './puzzles-feature.js?v=68bd794b';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=04d43597';
import { streetJobsFeature } from './street-jobs-feature.js?v=eda4d6a4';
import { imaginationFeature } from './imagination-feature.js?v=f4a3cd56';
import { supplyFeature } from './supply-feature.js?v=1d6610ef';
import { giantIconsFeature } from './giant-icons-feature.js?v=46500e62';
import { rubeFeature } from './rube-feature.js?v=730d1e5d';
import { unlearningFeature } from './unlearning-feature.js?v=7f13f85e';
import { dropsFeature } from './drops-feature.js?v=439d100b';
import { masterGardenFeature } from './master-garden-feature.js?v=9b88faf8';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=6078b49b';
import { questInstancesFeature } from './quest-instances-feature.js?v=67d2d6c3';
import { partySpacesFeature } from './party-spaces-feature.js?v=2d308035';
import { seasonsFeature } from './seasons-feature.js?v=2519c4c7';
import { cameraModeFeature } from './camera-mode-feature.js?v=d32a5196';
import { newxpFeature } from './newxp-feature.js?v=ff53f7e1';
import { streetMinimapFeature } from './street-minimap-feature.js?v=bef90c18';

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
import { smugglingFeature } from './smuggling-feature.js?v=03678dc2'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=4265db80'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=f07ff7bf'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=bfd18406'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=385fca78'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=10bdb7cb'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=a00b16c6'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=baee9f1e'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=1e3fe39a'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=7df0ba26'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=9fe5c23a'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=d201ffa1'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=d7a43e23'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=ceb3de8f'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=115921a7'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=bc37d750'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=25097a18'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=30ae4879'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=beca0263'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=deeb5129'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=a941e685'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=4360f8f6'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=c78aecad'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=e2c0fc13'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=ece2608a'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=9d7146dc'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=efb3295c'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=fa93819e'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=01b23324'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=bea02e2c'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=f1af44aa'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=0ec207e7'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=7e77144d'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=c12c3aa0'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=a65f467f'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=76c1ae0d'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=c81dda8c'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=efcf1496'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=de86378a'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=41fd1f15'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=217bb44b'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=6e7e7646'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=aa25dccb'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=011d6249'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=dce530f8'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=70b81650'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=79dcaafd'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=c27abc43'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=c3b42875'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=928b931f'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=2b25486f'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=6fefdab1'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=4d60d402'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=328e5ade'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=446384ae'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=87f989b0'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=6c74f60c'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5b0e6fb9'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=3ec303de'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=8ea7eec4'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=d9285ea6'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=b7cdfe8f'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=77d11314'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=498a021a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=022bfd0e'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=33284c0e'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=e611006c'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=2465d218'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=49e76ed2'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=6020f0a2'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=ffdee9f3'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=65a87edd'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=494ceec1'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=ead77bd3'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=2ce63fe1'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=7dec460b'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=abf6adfb'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=794229af'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=2444170f'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=64c9fa28'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=c0d49c11'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=7f944c3d'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=e8f89ff3'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=6cba14a5'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=47d368eb'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=5033ab5c'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=ba82a75c'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=debe70e7'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=41c2abaf'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=af7053ff'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=f54cdcd2'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=ed80100f'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=f9471992'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=92d34263'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=a2d872bf'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=ad892e68'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=96cb99c8'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=66d8b228'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=43ab292a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=724da5aa'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=f54b829f'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=96c0c785'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=98a4aa71'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=02523e82'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=9d002aca'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=da9c5310'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=0982c913'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=cee3361b'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=e679b579'; FEATURES.push(skillBubblesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=96c96e70'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=1df09118'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=2835ca06'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=4fe0c265'; FEATURES.push(potLuckFeastFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=f062a728'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=f6a532fd'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=1b10b444'; FEATURES.push(accountBackupFeature);
