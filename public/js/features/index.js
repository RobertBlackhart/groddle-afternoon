/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=5fdccf83';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=433c7402';
import { questOffersFeature } from './quest-offers-feature.js?v=ba74a8de';
import { meditationFeature } from './meditation-feature.js?v=ca569a98';
import { teleportationFeature } from './teleportation-feature.js?v=ada01ec9';
import { racesFeature } from './races-feature.js?v=5a5ccc51';
import { mayhemFeature } from './mayhem-feature.js?v=fe5c369f';
import { crownsFeature } from './crowns-feature.js?v=411ed7a5';
import { patchesFeature } from './patches-feature.js?v=47dfaa40';
import { foxesFeature } from './foxes-feature.js?v=47ddb1cf';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=8ee21f50';
import { homesFeature } from './homes-feature.js?v=5788ddce';
import { rookAttackFeature } from './rook-attack-feature.js?v=0f3b9d84';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=211fc3cc';
import { doorsFeature } from './doors-feature.js?v=e5afce17';
import { locationEventsFeature } from './location-events-feature.js?v=802ff117';
import { puzzlesFeature } from './puzzles-feature.js?v=f7fe7857';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=57304deb';
import { streetJobsFeature } from './street-jobs-feature.js?v=fad9d8b3';
import { imaginationFeature } from './imagination-feature.js?v=09179b4e';
import { supplyFeature } from './supply-feature.js?v=7bb86248';
import { giantIconsFeature } from './giant-icons-feature.js?v=48071e31';
import { rubeFeature } from './rube-feature.js?v=6e581a56';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=ea633f39';
import { masterGardenFeature } from './master-garden-feature.js?v=abffeaa5';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=428d95a6';
import { questInstancesFeature } from './quest-instances-feature.js?v=be1e2c0d';
import { partySpacesFeature } from './party-spaces-feature.js?v=95e83b5f';
import { seasonsFeature } from './seasons-feature.js?v=6a2f27ea';
import { cameraModeFeature } from './camera-mode-feature.js?v=48c30c54';
import { newxpFeature } from './newxp-feature.js?v=a3b8b8ff';
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
import { smugglingFeature } from './smuggling-feature.js?v=aa8dddbf'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=c5037c77'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=44fcb786'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=8a192a8c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=1aa857df'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=b877dfb6'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=8653e59a'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=13cba6e6'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=c81d1d7b'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=fc474775'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=ff1c0a22'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=25617daa'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=e554321c'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=1035cbff'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=14756d31'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=b4f9467f'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=c562644a'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=e74ee9e5'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=290afde2'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=87299b2d'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=74d78119'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=1ab231dd'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=7e16fca2'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=fe0bcd2a'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=457b05f8'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=fe1533a1'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=eae75ac5'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1f53d243'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=8c10be35'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=71352473'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=5bec4ab5'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=3d33668f'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=2486432a'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=3876e218'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=7f4acc2f'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=d1ec7c3e'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=3d77c475'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=8a2797f7'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=1770799c'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=8657c7fe'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=5b5f2d89'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=a818e86b'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=459967f3'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=4517cb45'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=909fab33'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=898c8a6d'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=7b0457aa'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=537c4c5f'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=f3c1230c'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=35f3e1b1'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=91a128bf'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=01ed9654'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=7667a57b'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=2a412173'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=53fd0b85'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=1812a015'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=511f054d'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=f6fa9d5b'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=161581f7'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=61c94239'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=e0e9d60f'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=95aef623'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=498a021a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=d8556d06'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=4cfc54a5'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=6e46557e'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=c702688b'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=06e53a5d'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=6409da61'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=8502a6a5'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=423113cc'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=80ba6a58'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=790d6978'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=0cfcc867'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=84d38250'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=794229af'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=972f2d54'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=5fe0c57c'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=1e172a53'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=1884da22'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=75df307b'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=1e7ec6c9'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=ca809457'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=06329998'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=bdd29a54'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=5a72415a'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=25a3f1e5'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=737bee56'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=141a1290'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=74f9d0f6'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=b8c8178d'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=975eb9f2'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=c55c5c3b'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=0ef5d343'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=e5a59ebf'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=449436b7'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=39cca99d'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=8075feb9'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=3f52c185'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=45f0fe7e'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=56c2bb78'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=cbb8b4be'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=a08d9f4b'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=76c3c80d'; FEATURES.push(skillBubblesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=9b8ac08b'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=9b4f3876'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=65860ac5'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=e59d3336'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=c11d2556'; FEATURES.push(accountBackupFeature);
