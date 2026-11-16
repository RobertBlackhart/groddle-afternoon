/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=5fdccf83';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=4801180f';
import { questOffersFeature } from './quest-offers-feature.js?v=ba74a8de';
import { meditationFeature } from './meditation-feature.js?v=ca569a98';
import { teleportationFeature } from './teleportation-feature.js?v=c20e18ed';
import { racesFeature } from './races-feature.js?v=907497f2';
import { mayhemFeature } from './mayhem-feature.js?v=8c04be08';
import { crownsFeature } from './crowns-feature.js?v=1038b993';
import { patchesFeature } from './patches-feature.js?v=358aadb2';
import { foxesFeature } from './foxes-feature.js?v=1c9d3bc0';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=0ea8f799';
import { homesFeature } from './homes-feature.js?v=903f0722';
import { rookAttackFeature } from './rook-attack-feature.js?v=e4771b60';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=3ac37ff7';
import { doorsFeature } from './doors-feature.js?v=fe3701f6';
import { locationEventsFeature } from './location-events-feature.js?v=dafc63f6';
import { puzzlesFeature } from './puzzles-feature.js?v=16fce15d';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=ba3cc346';
import { streetJobsFeature } from './street-jobs-feature.js?v=716bfb0a';
import { imaginationFeature } from './imagination-feature.js?v=09179b4e';
import { supplyFeature } from './supply-feature.js?v=7bb86248';
import { giantIconsFeature } from './giant-icons-feature.js?v=2c69dfe0';
import { rubeFeature } from './rube-feature.js?v=e955092a';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=ea633f39';
import { masterGardenFeature } from './master-garden-feature.js?v=586c40c0';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=e6c4593d';
import { questInstancesFeature } from './quest-instances-feature.js?v=3a10df9a';
import { partySpacesFeature } from './party-spaces-feature.js?v=3a0c1efe';
import { seasonsFeature } from './seasons-feature.js?v=d7169df7';
import { cameraModeFeature } from './camera-mode-feature.js?v=48c30c54';
import { newxpFeature } from './newxp-feature.js?v=af84a8f3';
import { streetMinimapFeature } from './street-minimap-feature.js?v=3d66ea1d';

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
import { smugglingFeature } from './smuggling-feature.js?v=4ecda338'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=9c8359ad'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=44fcb786'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=8a192a8c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=b4f8869c'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=b877dfb6'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=8653e59a'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=792562b2'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=b1ed4b03'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=1b4bf00b'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=39c37f6a'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=0103c333'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=f08fbf7f'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=bcf12278'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=a1fc0306'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=d7859737'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=c562644a'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=b37e85ee'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=99382bd8'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=4576d01b'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=74d78119'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=fe390ee8'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=0a4b5e2a'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=04cba080'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=35f168df'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=dad750d2'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=a1e8d19b'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1f53d243'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=3cc66ed3'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=53afece3'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=439a4879'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=c3ee159c'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=2b35c3b7'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=3876e218'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=7880e102'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=c4d27a2f'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=06057300'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=99c96b12'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=59cf7ac2'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=839ba3cb'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=dda986e7'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=a818e86b'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=e7e430da'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=eab35a2b'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=5aba792e'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=e88c0c7f'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=26c2fabf'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=35ea0ec8'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=a61c5def'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=35f3e1b1'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=91a128bf'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=a615db82'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=baab6046'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=2a412173'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=a59b549b'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=1812a015'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=511f054d'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=f65fccc6'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=0065e274'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=1bbd5dca'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=286e342a'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=4150c908'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=3d5c3798'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=d8556d06'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=4cfc54a5'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=11c9ef0a'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=23707eae'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=06e53a5d'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=1675162b'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=8502a6a5'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=b0194e4a'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=80ba6a58'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=d6f6589a'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=0cfcc867'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=84d38250'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7219b64f'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=905b0272'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=f523ea81'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=1e172a53'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=cfbf2bc9'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=c75bb986'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=1e7ec6c9'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=cb740e39'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=b994ab14'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=bdd29a54'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=cfd7cb48'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=48dcf23e'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=e0b29887'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=141a1290'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=7c52fbf7'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=7411ae0e'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=a5f403ec'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=016d8599'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=c55c5c3b'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=0ef5d343'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=e5a59ebf'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=dc0d111b'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=39cca99d'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=c600c863'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=87c028f4'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=1b720254'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=8a8a1272'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=41a8f11a'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=70055774'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=659c902e'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=c5617e10'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=b29d3998'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=e99156b2'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=c11d2556'; FEATURES.push(accountBackupFeature);
