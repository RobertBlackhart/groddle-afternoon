/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=86039d8a';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=de659247';
import { questOffersFeature } from './quest-offers-feature.js?v=23f081e1';
import { meditationFeature } from './meditation-feature.js?v=6e5d316c';
import { teleportationFeature } from './teleportation-feature.js?v=0ce61bb6';
import { racesFeature } from './races-feature.js?v=852a176e';
import { mayhemFeature } from './mayhem-feature.js?v=2b570578';
import { crownsFeature } from './crowns-feature.js?v=468c6495';
import { patchesFeature } from './patches-feature.js?v=7b6234b7';
import { foxesFeature } from './foxes-feature.js?v=1add1bf7';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=7508308f';
import { homesFeature } from './homes-feature.js?v=02679996';
import { rookAttackFeature } from './rook-attack-feature.js?v=ef6cf800';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=470de985';
import { doorsFeature } from './doors-feature.js?v=1010a3c9';
import { locationEventsFeature } from './location-events-feature.js?v=0843b12e';
import { puzzlesFeature } from './puzzles-feature.js?v=4ec2a7c5';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=d9e85b88';
import { streetJobsFeature } from './street-jobs-feature.js?v=686d7c20';
import { imaginationFeature } from './imagination-feature.js?v=7e88eeb7';
import { supplyFeature } from './supply-feature.js?v=937dbc51';
import { giantIconsFeature } from './giant-icons-feature.js?v=02ae85d1';
import { rubeFeature } from './rube-feature.js?v=fc01a84d';
import { unlearningFeature } from './unlearning-feature.js?v=7f13f85e';
import { dropsFeature } from './drops-feature.js?v=439d100b';
import { masterGardenFeature } from './master-garden-feature.js?v=ab73c9c9';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=162c575f';
import { questInstancesFeature } from './quest-instances-feature.js?v=74a9c7f5';
import { partySpacesFeature } from './party-spaces-feature.js?v=6377444d';
import { seasonsFeature } from './seasons-feature.js?v=62754548';
import { cameraModeFeature } from './camera-mode-feature.js?v=5f9c4449';
import { newxpFeature } from './newxp-feature.js?v=209c9db5';
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
import { smugglingFeature } from './smuggling-feature.js?v=aac92d50'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=44eaa5e8'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=f07ff7bf'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=bfd18406'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=b814d5e4'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=ecdfddce'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=e2cc95f6'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=0e25ba04'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=7348097d'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=db6f8a71'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=c10455c8'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=84dde1b1'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=4a443269'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=83439124'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=4cfa0b10'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=779a262b'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=bf80f937'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=e91e193c'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=58b2e0c6'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=f54c2e1a'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=a941e685'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=b3278c12'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=c78aecad'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=e2c0fc13'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=ece2608a'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=17f7b7cd'; FEATURES.push(rebuiltRoomsFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=738171f8'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=c1ce4941'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=885c3eca'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=99e3ac1c'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=3de0f192'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=8bf56000'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=fa2839ba'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=c12c3aa0'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=38e483fe'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=c27fa5db'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=c81dda8c'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=506708ab'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=ecc7f752'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=0c2e4225'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=ba9d5418'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=aa39a710'; FEATURES.push(crabsFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=f99e0ec3'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=734240d1'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=4806f864'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=70b81650'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=8db93ce5'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=feb1d4ce'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=c3b42875'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=bfcdbc6a'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=caa1fdb6'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=6fefdab1'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=58fe5a13'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=8aa0caaf'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=446384ae'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=87f989b0'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=d40fc17a'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=a7130ee0'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=95033282'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=66755d44'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=2bb55ce5'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=b7cdfe8f'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=0238e21d'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=498a021a'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=022bfd0e'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=33284c0e'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=e611006c'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=a1ec7c6d'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=98a40c60'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=30933c9e'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=3e6a2d18'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=a907feac'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=40ca13c0'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=80ba6a58'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=17b2e94d'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=5f686bb6'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=81ebe78f'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=794229af'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=43954bd7'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=a5f5cbf2'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=96dce4f3'; FEATURES.push(dropsMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=7f944c3d'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=53294761'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=6cba14a5'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=398cf88f'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=7d148442'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=7efe5c50'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=41c14a58'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=c4fafb35'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=12affbac'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=bf913939'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=ed80100f'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=f9471992'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=d2c8d2b6'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7f0af1c8'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=e59012f1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=a2d872bf'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=159862e2'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=248ed4d3'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=c55c5c3b'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=0ef5d343'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=e5a59ebf'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=842d7fa8'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=724da5aa'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=f54b829f'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=1e108c43'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=98a4aa71'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=02523e82'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=9d002aca'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=da9c5310'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=489abc15'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=21485ef2'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=20bb3a1a'; FEATURES.push(skillBubblesFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=f35308d0'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=32a5a7d2'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=2835ca06'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=b3a903a7'; FEATURES.push(potLuckFeastFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=143a7965'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=1640c837'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=efca3d67'; FEATURES.push(accountBackupFeature);
