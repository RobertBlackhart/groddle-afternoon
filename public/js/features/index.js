/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=657cce8b';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=99caccdc';
import { questOffersFeature } from './quest-offers-feature.js?v=cc379ae5';
import { meditationFeature } from './meditation-feature.js?v=a8f0bb53';
import { teleportationFeature } from './teleportation-feature.js?v=250fea2d';
import { racesFeature } from './races-feature.js?v=61289065';
import { mayhemFeature } from './mayhem-feature.js?v=9ad2f26e';
import { crownsFeature } from './crowns-feature.js?v=f73a04b8';
import { patchesFeature } from './patches-feature.js?v=090141ad';
import { foxesFeature } from './foxes-feature.js?v=79f313af';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=0f598510';
import { homesFeature } from './homes-feature.js?v=dbb90b72';
import { rookAttackFeature } from './rook-attack-feature.js?v=9f958177';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=af04e4fd';
import { doorsFeature } from './doors-feature.js?v=6c247244';
import { locationEventsFeature } from './location-events-feature.js?v=f2b6c156';
import { puzzlesFeature } from './puzzles-feature.js?v=fcd7bb08';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=312535e7';
import { streetJobsFeature } from './street-jobs-feature.js?v=3564567e';
import { imaginationFeature } from './imagination-feature.js?v=b789ef36';
import { supplyFeature } from './supply-feature.js?v=26f0017b';
import { giantIconsFeature } from './giant-icons-feature.js?v=3bab4606';
import { rubeFeature } from './rube-feature.js?v=43cb0b61';
import { unlearningFeature } from './unlearning-feature.js?v=3fa33437';
import { dropsFeature } from './drops-feature.js?v=b2af6a72';
import { masterGardenFeature } from './master-garden-feature.js?v=b2b781dc';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=f6218e47';
import { questInstancesFeature } from './quest-instances-feature.js?v=d6e630a4';
import { partySpacesFeature } from './party-spaces-feature.js?v=463ab573';
import { seasonsFeature } from './seasons-feature.js?v=62f1efdc';
import { cameraModeFeature } from './camera-mode-feature.js?v=805702c3';
import { newxpFeature } from './newxp-feature.js?v=953e5b09';
import { streetMinimapFeature } from './street-minimap-feature.js?v=25efa213';

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
import { smugglingFeature } from './smuggling-feature.js?v=abd962ec'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=c8e43f6e'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=051349a5'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=8a192a8c'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=cfb986a0'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=354d6c4c'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=27cff5bc'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=75ae621e'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=a6dd9a78'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=ebdfc6b6'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=b4a01d3b'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=f010fc81'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=2fe51c33'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=c0ec42aa'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=55cbf7ee'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=d9aae551'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=663192f8'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=b031e028'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=53686374'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=5bc70223'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=f8f56337'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=725c10e0'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=60e6b364'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=058be0da'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=9d324fc5'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=80416d0d'; FEATURES.push(rebuiltRoomsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=1a5cb977'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=fc4c24d8'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=dcc95577'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=85393ecb'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=b4507828'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=29c8679d'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=5bc72711'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=ce1cb6d1'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=a6724f38'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=dcb92beb'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=2831f136'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=e99634ff'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=f6c3c583'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=c6ed0677'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=d39061cb'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=81628c86'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=98791d2a'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=804205c4'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=45d52804'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=60a77d61'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=dad5e933'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=fa5423df'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=efdc784b'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=f1ebd456'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=e7f7d84a'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=e5ca66c6'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=c0ec4d13'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=d9770111'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=7a57b758'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=bde6e7be'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=b927637b'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=86bfb0ce'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=c6838475'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=5aea6144'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=c0810c32'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=04c0d301'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=5f69f614'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=ae589bdd'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=05da3ce0'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=f1787a4a'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=cf33ca1e'; FEATURES.push(ledgerFeature);
import { buddiesFeature } from './buddies-feature.js?v=114d7810'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=424d1cfa'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=50e16891'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=7bc75c60'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=493071d7'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=fc20c899'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=f2b65087'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=30a9afbd'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=edc16076'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=012de487'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=19975fe9'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=4f36ab00'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=b156f075'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=9df28c52'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=7c4cef57'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=0d553804'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=898d613e'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=d4cc4286'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=e5903479'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=7ee0f4b2'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=638a2a25'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=8ec61f8d'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=6bf95f13'; FEATURES.push(homeStorageFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=470989a4'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=2101036b'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=c551d117'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=a5f403ec'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=e72ddf9e'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=39f1e2d0'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=2b01b30e'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=5e25473a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=6ffb8889'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=63769b1d'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=5f41addf'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=eb3d4e75'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=0023e284'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=dbaa717b'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=4fe6b786'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=1a658feb'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=98f1cf68'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=39e41b46'; FEATURES.push(streetFixesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=eb4b9a63'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=5e5eb545'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=039b84f7'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=c7156ab2'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=baf69e8d'; FEATURES.push(accountBackupFeature);
