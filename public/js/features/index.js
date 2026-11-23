/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=9575e2c8';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=f236a24b';
import { questOffersFeature } from './quest-offers-feature.js?v=ffa7a657';
import { meditationFeature } from './meditation-feature.js?v=8e1ad57e';
import { teleportationFeature } from './teleportation-feature.js?v=aece67b4';
import { racesFeature } from './races-feature.js?v=68d6d429';
import { mayhemFeature } from './mayhem-feature.js?v=96917e63';
import { crownsFeature } from './crowns-feature.js?v=ba0e3145';
import { patchesFeature } from './patches-feature.js?v=1892e7af';
import { foxesFeature } from './foxes-feature.js?v=30e8d61e';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=2d43d3c4';
import { homesFeature } from './homes-feature.js?v=6b67e454';
import { rookAttackFeature } from './rook-attack-feature.js?v=a4973946';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=6b6ebb2d';
import { doorsFeature } from './doors-feature.js?v=24165cdd';
import { locationEventsFeature } from './location-events-feature.js?v=ac6acbc9';
import { puzzlesFeature } from './puzzles-feature.js?v=84b3c18c';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=73e17938';
import { streetJobsFeature } from './street-jobs-feature.js?v=dc67b686';
import { imaginationFeature } from './imagination-feature.js?v=78ca51d2';
import { supplyFeature } from './supply-feature.js?v=b5c858d1';
import { giantIconsFeature } from './giant-icons-feature.js?v=47ed1851';
import { rubeFeature } from './rube-feature.js?v=c2078e02';
import { unlearningFeature } from './unlearning-feature.js?v=1de46622';
import { dropsFeature } from './drops-feature.js?v=47408d7d';
import { masterGardenFeature } from './master-garden-feature.js?v=edc9f13c';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=0dc4f6ec';
import { questInstancesFeature } from './quest-instances-feature.js?v=231f37e5';
import { partySpacesFeature } from './party-spaces-feature.js?v=7b9736a7';
import { seasonsFeature } from './seasons-feature.js?v=529c73db';
import { cameraModeFeature } from './camera-mode-feature.js?v=2a8eeea8';
import { newxpFeature } from './newxp-feature.js?v=a277c4a5';
import { streetMinimapFeature } from './street-minimap-feature.js?v=252a33c5';

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
import { smugglingFeature } from './smuggling-feature.js?v=27440554'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=99abad88'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=475f7513'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=dab6d195'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=aeb43492'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=06400a23'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=75e806d1'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=7439d414'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=dea8593f'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=063413d8'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=96f79690'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=66023ab4'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=236baf6c'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=b7958830'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=cc723bf5'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=36824036'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=b33074b7'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=b68754a1'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=df0a9273'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=ac67e690'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=1db03dea'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=f5824d9a'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=b76a80ce'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=30f14486'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=2ad3cc85'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=07d18db4'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=582a8195'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=33b645b5'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=2613cfb3'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=29ff8f84'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=91514b4f'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=16dbe871'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=93d0eb60'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=1e985de8'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=ef5c57a5'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=824ef911'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=50f93687'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=d7b2479b'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=6b5eb7ea'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=38377d92'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=92e5360a'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=1023f9b6'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=2a153009'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=e9f142eb'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=e83e9814'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=462c99fa'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=f35f014a'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=0a10fd37'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=c48c2684'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=bae15b27'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=e52a57b6'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=b1ad298c'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=a229240f'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=d38f569c'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=c524d210'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=96ac7196'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=fff2df06'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5d71a1eb'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=abcf43ec'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=f452cfc8'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=516ed7ae'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=d7430469'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=24cf2d84'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=e218803f'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=15495d40'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=5aa3c434'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=aae43c2d'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=e3bc39b4'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=e9f1256e'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=5d37c0df'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=58b4a33e'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=01a859c1'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=a619d065'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=a7b73885'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=ef444471'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=22942941'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=8c6a8bc9'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7ca5d0c4'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=d1bc3957'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=246511bc'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=e5d63f64'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=8ad0f388'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=4fb2a4d5'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=d66271f5'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=054c5abb'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=52fe9959'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=76da4dcf'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=8ccf6c84'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=f061fa05'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=2eb5629e'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=1b84f22c'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=5432d81b'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=d45b03f8'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=9e341a9b'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=76c22469'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7e1f2688'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=be4b0e76'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=b410467c'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=5b9432bb'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=41a545fd'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=362fe1fb'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=43ab292a'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=d9ce85af'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=5dcc9c90'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=4a0d0a5c'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=d9656427'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=49b913a9'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=9577b7e1'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=6c3e1488'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=6b932f49'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=9a9ae8f2'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=3093c4ca'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=105adc3f'; FEATURES.push(homeCrewMpFeature);
// TODAYCARD: the start card's Today panel and nudge for a returning player (asks solo-feats for startCardFeat).
import { startTodayFeature } from './start-today-feature.js?v=326889da'; FEATURES.push(startTodayFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=711fabf5'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=4701245a'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=c7b6c660'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=c3410362'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=51e6ac11'; FEATURES.push(feastDayFeature);
import { calendarFeature } from './calendar-feature.js?v=48e2a61e'; FEATURES.push(calendarFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=86c2bf26'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=ce1f8176'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=55b0dbfb'; FEATURES.push(accountBackupFeature);
