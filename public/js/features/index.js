/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=eb79a9c5';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=95aa25d0';
import { questOffersFeature } from './quest-offers-feature.js?v=bf38176d';
import { meditationFeature } from './meditation-feature.js?v=55f80433';
import { teleportationFeature } from './teleportation-feature.js?v=9ce752fa';
import { racesFeature } from './races-feature.js?v=5f63a6fd';
import { mayhemFeature } from './mayhem-feature.js?v=ba703d27';
import { crownsFeature } from './crowns-feature.js?v=d3c7230f';
import { patchesFeature } from './patches-feature.js?v=84b0213c';
import { foxesFeature } from './foxes-feature.js?v=bef0fbc5';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=031bd334';
import { homesFeature } from './homes-feature.js?v=f873085d';
import { rookAttackFeature } from './rook-attack-feature.js?v=8e549de2';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=50eec979';
import { doorsFeature } from './doors-feature.js?v=efc599c8';
import { locationEventsFeature } from './location-events-feature.js?v=0843b12e';
import { puzzlesFeature } from './puzzles-feature.js?v=ea3c879e';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=9e647c76';
import { streetJobsFeature } from './street-jobs-feature.js?v=74301c04';
import { imaginationFeature } from './imagination-feature.js?v=22ea2dc8';
import { supplyFeature } from './supply-feature.js?v=1f7fb81a';
import { giantIconsFeature } from './giant-icons-feature.js?v=13194bce';
import { rubeFeature } from './rube-feature.js?v=e582e07c';
import { unlearningFeature } from './unlearning-feature.js?v=25a2e1d2';
import { dropsFeature } from './drops-feature.js?v=89ee0a00';
import { masterGardenFeature } from './master-garden-feature.js?v=9c55d7a4';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=7a7a9216';
import { questInstancesFeature } from './quest-instances-feature.js?v=f102bbf3';
import { partySpacesFeature } from './party-spaces-feature.js?v=2f4ea9ca';
import { seasonsFeature } from './seasons-feature.js?v=596e65cf';
import { cameraModeFeature } from './camera-mode-feature.js?v=48c30c54';
import { newxpFeature } from './newxp-feature.js?v=e24c0219';
import { streetMinimapFeature } from './street-minimap-feature.js?v=6114a047';

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
import { smugglingFeature } from './smuggling-feature.js?v=8698a538'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=031c2947'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=3450c089'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=2d0c4e26'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=cae5ec31'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=c2fe8914'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=26b16173'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=a40bbfc3'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=c81d1d7b'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=6995a6ea'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=4f80fded'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=f925b5e9'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=23b5ec36'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=20d5afc4'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=5e784aa2'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=7209c26d'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=c9b8530b'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=ec4958c8'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=c082140d'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=211a741f'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=74d78119'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=006daab4'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=7e16fca2'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=e2c0fc13'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=ece2608a'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=a1b9173f'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=eae75ac5'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1f53d243'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=67d555fb'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=35da29f8'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=e9d6936f'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=d7048259'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=206e59f9'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=790e3a40'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=2b811c3e'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=76a23f59'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=0cddcf43'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=d80f4413'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=51ad1593'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=2153b79b'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=3646ccfd'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=c5291278'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=201ee314'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=c1a90af7'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=876cc0ee'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=31bf537d'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=aab0390a'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=1b49d24d'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=45641e59'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=bddd6560'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=c2193454'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=d7c15f12'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=29529a4f'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=b9370703'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=afd02c0a'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=12d3f896'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=2e37db59'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=511f054d'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=b79be47f'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=8c441944'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=65db41c0'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=a1ce5e06'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=13f55213'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=498a021a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=b10477ee'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=c3296368'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=947cd1a8'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=1f51f2eb'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=98a40c60'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=acc8b5d7'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=b0bb72c6'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=cd8abb7a'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=7fba2b35'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=80ba6a58'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=694ec21c'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=eb642a1c'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=a920d1b5'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=794229af'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=05a164d4'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=5fe0c57c'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=43b41edf'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=635dadfa'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=5ee14383'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=6cba14a5'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=483200c3'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=c821dac3'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=72f3ac78'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=cecb5897'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=320e6edf'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=f1e7c2b8'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=ebba1281'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=ed80100f'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=36de9fac'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=b6751d34'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=b8c8178d'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=d8acb6e4'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=c55c5c3b'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=0ef5d343'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=e5a59ebf'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=709e1dcb'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=170fc467'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=f3dd2d5c'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=e464c9f3'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=81aff345'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=ed145a32'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=5761ac0b'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=8b5699ea'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=e79b8dec'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=2a86f5e6'; FEATURES.push(skillBubblesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=da5b8a91'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=5c2244e9'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=2f63d0ff'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=a0c9638a'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=c04547e8'; FEATURES.push(accountBackupFeature);
