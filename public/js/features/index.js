/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=10c16adb';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=2593ea57';
import { questOffersFeature } from './quest-offers-feature.js?v=e76f6d7a';
import { meditationFeature } from './meditation-feature.js?v=9f2a3044';
import { teleportationFeature } from './teleportation-feature.js?v=3f04f41b';
import { racesFeature } from './races-feature.js?v=ecebe259';
import { mayhemFeature } from './mayhem-feature.js?v=b3143de2';
import { crownsFeature } from './crowns-feature.js?v=ab8f49c0';
import { patchesFeature } from './patches-feature.js?v=448295ea';
import { foxesFeature } from './foxes-feature.js?v=50e02f28';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=a210a397';
import { homesFeature } from './homes-feature.js?v=f3de0f6a';
import { rookAttackFeature } from './rook-attack-feature.js?v=6467ae7d';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=b22b65ca';
import { doorsFeature } from './doors-feature.js?v=55836331';
import { locationEventsFeature } from './location-events-feature.js?v=bc9fbc52';
import { puzzlesFeature } from './puzzles-feature.js?v=d4a9ba02';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=d0ab81c7';
import { streetJobsFeature } from './street-jobs-feature.js?v=ae97dbdb';
import { imaginationFeature } from './imagination-feature.js?v=2d76cfdf';
import { supplyFeature } from './supply-feature.js?v=1d6610ef';
import { giantIconsFeature } from './giant-icons-feature.js?v=778acb99';
import { rubeFeature } from './rube-feature.js?v=400ef94c';
import { unlearningFeature } from './unlearning-feature.js?v=7f13f85e';
import { dropsFeature } from './drops-feature.js?v=161f11cf';
import { masterGardenFeature } from './master-garden-feature.js?v=8a2d54b1';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=560b6376';
import { questInstancesFeature } from './quest-instances-feature.js?v=237131c8';
import { partySpacesFeature } from './party-spaces-feature.js?v=e4e33929';
import { seasonsFeature } from './seasons-feature.js?v=982fec14';
import { cameraModeFeature } from './camera-mode-feature.js?v=d32a5196';
import { newxpFeature } from './newxp-feature.js?v=c6c1b956';
import { streetMinimapFeature } from './street-minimap-feature.js?v=265068b4';

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
import { smugglingFeature } from './smuggling-feature.js?v=e7e23536'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=252d8378'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=9c5001e2'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=2a68e814'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=a2460d23'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=10bdb7cb'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=49bad18a'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=0c9d424b'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=b8d4ef62'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=15b6b861'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=e9e4730a'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=a4469b90'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=12695e8c'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=610ca115'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=c87396db'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=b2e45f81'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=25097a18'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=7f0e8e13'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=760616fb'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=9f3bc7c6'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=a941e685'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=9a2535d4'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=c7c24d67'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=12fa3241'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=a5a72b0f'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=9d7146dc'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=231e8258'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=c8c878b3'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=01b23324'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=89df2a36'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=f632a2a7'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=0d072528'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=f8a60534'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=c12c3aa0'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=a65f467f'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=dc87f229'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=c81dda8c'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=694fd658'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=e3186841'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=f3d6b877'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=c29bfd5c'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=24b10121'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=b816faf3'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=5c1eb810'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=160a453e'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=70b81650'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=876d073b'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=1465f0e9'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=0685ed0d'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=9bb0cfad'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=942b174c'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=b1ad298c'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=78582d8b'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=d1cc0838'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=446384ae'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=87f989b0'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=0502cc81'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=0e34c33f'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=aa3c3e82'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=da574cc1'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=fb15bb14'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=ab23d327'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=afaf17ae'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=f606c1a3'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=8c8b1d5c'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=76fc70c8'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=e611006c'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=a971390c'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=045e63e6'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=ca190790'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=00bf3b86'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=4fa15379'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=cb68aaa2'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=c286c41f'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=2adb9738'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=16e487a6'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=3af9f80b'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=03855068'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=9e2260c2'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=64c9fa28'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=3f718120'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=caee397d'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=7f944c3d'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=76cf9a30'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=bf436021'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=04be7474'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=33e721ee'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=0f2bf31d'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=debe70e7'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=35796d2a'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=c81ce907'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=d57a21fe'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=ed80100f'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=f9471992'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=72ea5f30'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=439ca187'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=6bbb765b'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=96cb99c8'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=29207f5c'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=43ab292a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=20eafe76'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=f54b829f'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=0c5daff5'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=d9656427'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=e1af4d02'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=ff0003b6'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=3fa89550'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=9baea409'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=7f961e19'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=18e4da79'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=59f52680'; FEATURES.push(homeCrewMpFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=d676545f'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=70a8ab07'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=2835ca06'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=9b16387d'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=9a08e08a'; FEATURES.push(feastDayFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=2b5fab69'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=04726ec7'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=1b10b444'; FEATURES.push(accountBackupFeature);
