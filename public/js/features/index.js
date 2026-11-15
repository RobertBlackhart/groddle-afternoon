/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=657cce8b';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=6632a711';
import { questOffersFeature } from './quest-offers-feature.js?v=ba74a8de';
import { meditationFeature } from './meditation-feature.js?v=46a28c1e';
import { teleportationFeature } from './teleportation-feature.js?v=aacf3423';
import { racesFeature } from './races-feature.js?v=c8e85464';
import { mayhemFeature } from './mayhem-feature.js?v=48217b49';
import { crownsFeature } from './crowns-feature.js?v=95bc6524';
import { patchesFeature } from './patches-feature.js?v=0233ef48';
import { foxesFeature } from './foxes-feature.js?v=c31e8c4e';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=b349c9f1';
import { homesFeature } from './homes-feature.js?v=62970967';
import { rookAttackFeature } from './rook-attack-feature.js?v=f71e531d';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=f3233cb6';
import { doorsFeature } from './doors-feature.js?v=c61f3897';
import { locationEventsFeature } from './location-events-feature.js?v=f2b6c156';
import { puzzlesFeature } from './puzzles-feature.js?v=01b85c43';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=312535e7';
import { streetJobsFeature } from './street-jobs-feature.js?v=916f699c';
import { imaginationFeature } from './imagination-feature.js?v=8614c1d9';
import { supplyFeature } from './supply-feature.js?v=c9d31c98';
import { giantIconsFeature } from './giant-icons-feature.js?v=34a12ecc';
import { rubeFeature } from './rube-feature.js?v=43cb0b61';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=b2af6a72';
import { masterGardenFeature } from './master-garden-feature.js?v=8c4ac0ad';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=f4374fd8';
import { questInstancesFeature } from './quest-instances-feature.js?v=b6043c5e';
import { partySpacesFeature } from './party-spaces-feature.js?v=463ab573';
import { seasonsFeature } from './seasons-feature.js?v=89d9d45a';
import { cameraModeFeature } from './camera-mode-feature.js?v=54801f97';
import { newxpFeature } from './newxp-feature.js?v=22207b2f';
import { streetMinimapFeature } from './street-minimap-feature.js?v=5024ed88';

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
import { smugglingFeature } from './smuggling-feature.js?v=148ce137'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=6f21477c'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=113b627e'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=8a192a8c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=bda3ce2d'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=354d6c4c'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=2211580f'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=5fb9fc3d'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=d0074c1a'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=b34e3450'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=b20eb15e'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=f44b2753'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=4cbf9e29'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=8f10a686'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=dd7994a7'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=d7859737'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=155827ff'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=a18ddb11'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=d602f4e7'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=a5426e5b'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=f8f56337'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=725c10e0'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=95d9d5cf'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=058be0da'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=9d324fc5'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=80416d0d'; FEATURES.push(rebuiltRoomsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1a5cb977'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=5df97095'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=6a7ee8c7'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=8aab3b6e'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=c5bb0cf4'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=3ef624d6'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=ce1cb6d1'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=0cb2e326'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=0dbc4bfe'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=ee33beb7'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=d38c7249'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=20ae578a'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=d39061cb'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=81628c86'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=98791d2a'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=027ef301'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=eab35a2b'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=b97fb4bb'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=99cb0e54'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=29110368'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=9ea6b5e4'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=9b03304d'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=35f3e1b1'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=91a128bf'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=2c73ff8d'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=f265122e'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=b4d1f5bc'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=f992a644'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=1812a015'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=86bfb0ce'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=5751f158'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=39ef7811'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=e69c886a'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=8733ceaa'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=8eb61368'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=ae589bdd'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=05da3ce0'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=b63b8999'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { buddiesFeature } from './buddies-feature.js?v=1ffc8739'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=34f031a3'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=c7b73483'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=8502a6a5'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=418c77a9'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=fc20c899'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=1b4bb678'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=07d945df'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=bd2bb34e'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=012de487'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=74d2470d'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=e2ce0344'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=24eaae92'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=2c41a666'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=7678606f'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=d213826f'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=d4cc4286'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=3b01019e'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=7ee0f4b2'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=04d94f28'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=2a3420f6'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=d2119ebd'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=1e638f15'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=e62527a6'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=c551d117'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=a5f403ec'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=e9f0fd21'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=39f1e2d0'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=2b01b30e'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=5e25473a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=dc0d111b'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=cc188112'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=8c450cc5'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=87c028f4'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=1b720254'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=56dbc8cd'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=0bfab39e'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=b8b82d27'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=39e41b46'; FEATURES.push(streetFixesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=33193e0d'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=01019afc'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=d5c3c5de'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=ab12a23e'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=baf69e8d'; FEATURES.push(accountBackupFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=2c5b9ca6'; FEATURES.push(vendorFinderFeature);
