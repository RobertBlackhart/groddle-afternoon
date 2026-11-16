/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=55547e57';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=41af37db';
import { questOffersFeature } from './quest-offers-feature.js?v=ba74a8de';
import { meditationFeature } from './meditation-feature.js?v=31bfc6a2';
import { teleportationFeature } from './teleportation-feature.js?v=aacf3423';
import { racesFeature } from './races-feature.js?v=1b2bb435';
import { mayhemFeature } from './mayhem-feature.js?v=8c04be08';
import { crownsFeature } from './crowns-feature.js?v=54cdc520';
import { patchesFeature } from './patches-feature.js?v=17ec7f1d';
import { foxesFeature } from './foxes-feature.js?v=b1b74d35';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=9ba289c0';
import { homesFeature } from './homes-feature.js?v=dcafaeed';
import { rookAttackFeature } from './rook-attack-feature.js?v=a763c680';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=7188b048';
import { doorsFeature } from './doors-feature.js?v=bf206552';
import { locationEventsFeature } from './location-events-feature.js?v=56c09570';
import { puzzlesFeature } from './puzzles-feature.js?v=3c527ca3';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=a2151f4c';
import { streetJobsFeature } from './street-jobs-feature.js?v=b9b386cc';
import { imaginationFeature } from './imagination-feature.js?v=c15fbc8f';
import { supplyFeature } from './supply-feature.js?v=b2afc1c0';
import { giantIconsFeature } from './giant-icons-feature.js?v=90d0e1e4';
import { rubeFeature } from './rube-feature.js?v=751ede96';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=ea633f39';
import { masterGardenFeature } from './master-garden-feature.js?v=8650326b';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=b9b63f05';
import { questInstancesFeature } from './quest-instances-feature.js?v=dbe6f42d';
import { partySpacesFeature } from './party-spaces-feature.js?v=3a0c1efe';
import { seasonsFeature } from './seasons-feature.js?v=d09867cc';
import { cameraModeFeature } from './camera-mode-feature.js?v=48c30c54';
import { newxpFeature } from './newxp-feature.js?v=57a9a197';
import { streetMinimapFeature } from './street-minimap-feature.js?v=aa11e59e';

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
import { smugglingFeature } from './smuggling-feature.js?v=fbba3801'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=9c8359ad'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=44fcb786'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=8a192a8c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=b9766abf'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=b877dfb6'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=e7db1a27'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=5ce8e303'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=916b3b26'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=f87d2bd5'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=e82be7e9'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=95950676'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=96c9d330'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=da7005ed'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=b2c7bde6'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=d7859737'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=155827ff'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=d28a090f'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=44dfc53d'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=64fe0525'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=74d78119'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=b9088fd6'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=0a4b5e2a'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=98f32af3'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=ba8ab07e'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=dad750d2'; FEATURES.push(rebuiltRoomsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=0b62213c'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=e1502121'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=e122ada3'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=1ea8f282'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=f102fa35'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=2b35c3b7'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=3876e218'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=da100db5'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=0d4b0c15'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=7b619781'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=809269b9'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=ce89b5f3'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=508e849b'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=c077af91'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=06c570db'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=b71b76c3'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=eab35a2b'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=8e17a7b5'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=f6ee5bcb'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=26c2fabf'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=42efae0b'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=0e67cc5b'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=35f3e1b1'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=91a128bf'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=e60ffec8'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=d6dcf4ce'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=2a412173'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=f992a644'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=1812a015'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=86bfb0ce'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=f65fccc6'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=87f00919'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=606f5193'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=6fa5eddc'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=bd51d571'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=43667789'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=05da3ce0'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=4cfc54a5'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=f97113e6'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=f458fe71'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=b540747d'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=2ff4b570'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=8502a6a5'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=39499a06'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=fc20c899'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=0a9d20ae'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=07d945df'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=bd2bb34e'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=c3ed65e9'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=8324908f'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=f523ea81'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=24eaae92'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=780f362b'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=ccbe6838'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=1e7ec6c9'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=876d3976'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=7d1a6ffd'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=3b89f11a'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=f4c34ace'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=c232f54f'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=657a8246'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=141a1290'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=cec38b08'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=5fae4271'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=a5f403ec'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=b57eda92'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=39f1e2d0'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=2b01b30e'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=5e25473a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=dc0d111b'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=cc188112'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=58ace14c'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=87c028f4'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=1b720254'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=8a8a1272'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=57e4c1d6'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=c7b4aa89'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=c759e98d'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=ca549c10'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=ca6c8e43'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=7e93c075'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=baf69e8d'; FEATURES.push(accountBackupFeature);
