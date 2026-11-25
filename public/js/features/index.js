/**
 * Feature registry (see js/feature-host.js). Add a feature by importing it
 * here and appending it to FEATURES; game.js never needs to change.
 * Order matters only for first-answer hooks (enterGate, query, ecologyOverride).
 */

import { questFlagsFeature } from './quest-flags-feature.js?v=17c6ef48';
import { hellFeature } from './hell-feature.js?v=74604dfc';
import { resourceNodesFeature } from './resource-nodes-feature.js?v=37a86d7a';
import { questOffersFeature } from './quest-offers-feature.js?v=cc54329c';
import { meditationFeature } from './meditation-feature.js?v=afbafa27';
import { teleportationFeature } from './teleportation-feature.js?v=cd05f3d1';
import { racesFeature } from './races-feature.js?v=07f10d7d';
import { mayhemFeature } from './mayhem-feature.js?v=6aea206e';
import { crownsFeature } from './crowns-feature.js?v=8279217d';
import { patchesFeature } from './patches-feature.js?v=908cadb2';
import { foxesFeature } from './foxes-feature.js?v=5b14364d';
import { heliKittiesFeature } from './heli-kitties-feature.js?v=3cb698cc';
import { homesFeature } from './homes-feature.js?v=9ebb7192';
import { rookAttackFeature } from './rook-attack-feature.js?v=9b3efcfa';
import { streetFurnitureFeature } from './street-furniture-feature.js?v=e2364e68';
import { doorsFeature } from './doors-feature.js?v=4de9bab5';
import { locationEventsFeature } from './location-events-feature.js?v=ac6acbc9';
import { puzzlesFeature } from './puzzles-feature.js?v=57fc6d11';
import { puzzleScenesFeature } from './puzzle-scenes-feature.js?v=69d28f38';
import { streetJobsFeature } from './street-jobs-feature.js?v=18cb1093';
import { imaginationFeature } from './imagination-feature.js?v=18225e91';
import { supplyFeature } from './supply-feature.js?v=62d053d6';
import { giantIconsFeature } from './giant-icons-feature.js?v=f822b09f';
import { rubeFeature } from './rube-feature.js?v=0456ce0a';
import { unlearningFeature } from './unlearning-feature.js?v=250c2d07';
import { dropsFeature } from './drops-feature.js?v=46276af2';
import { masterGardenFeature } from './master-garden-feature.js?v=4a705987';
import { animalHusbandryFeature } from './animal-husbandry-feature.js?v=639d2a8c';
import { questInstancesFeature } from './quest-instances-feature.js?v=c29705a9';
import { partySpacesFeature } from './party-spaces-feature.js?v=62d06d74';
import { seasonsFeature } from './seasons-feature.js?v=b8d77d64';
import { cameraModeFeature } from './camera-mode-feature.js?v=4f0896d8';
import { newxpFeature } from './newxp-feature.js?v=c9033c0a';
import { streetMinimapFeature } from './street-minimap-feature.js?v=e1810579';

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
import { smugglingFeature } from './smuggling-feature.js?v=0506a2dc'; FEATURES.push(smugglingFeature);
import { homeTowerFeature } from './home-tower-feature.js?v=4663a659'; FEATURES.push(homeTowerFeature);
import { secretSpotsFeature } from './secret-spots-feature.js?v=e5eb304b'; FEATURES.push(secretSpotsFeature);
import { musicblocksFeature } from './musicblocks-feature.js?v=de29fab4'; FEATURES.push(musicblocksFeature);
import { shrineHintFeature } from './shrine-hint-feature.js?v=db3ad1b2'; FEATURES.push(shrineHintFeature);
import { towerRoomsFeature } from './tower-rooms-feature.js?v=fbab9eb6'; FEATURES.push(towerRoomsFeature);
import { midTowerFeature } from './mid-tower-feature.js?v=4af620dc'; FEATURES.push(midTowerFeature);
import { treeDeathFeature } from './tree-death-feature.js?v=64d79b71'; FEATURES.push(treeDeathFeature);
import { enchantedForestFeature } from './enchanted-forest-feature.js?v=b3a54471'; FEATURES.push(enchantedForestFeature);
import { jujuBanditsFeature } from './juju-bandits-feature.js?v=5fe2cd52'; FEATURES.push(jujuBanditsFeature);
import { craftybotFeature } from './craftybot-feature.js?v=03c6d919'; FEATURES.push(craftybotFeature);
import { moodDecayFeature } from './mood-decay-feature.js?v=2d7f9267'; FEATURES.push(moodDecayFeature);
import { animalMoodFeature } from './animal-mood-feature.js?v=06351677'; FEATURES.push(animalMoodFeature);
import { butlerFeature } from './butler-feature.js?v=a2067412'; FEATURES.push(butlerFeature);
import { mailCourierFeature } from './mail-courier-feature.js?v=7878f36c'; FEATURES.push(mailCourierFeature);
import { pouchFeature } from './elemental-pouch-feature.js?v=94f1f360'; FEATURES.push(pouchFeature);
import { bagsFeature } from './bags-feature.js?v=af96f8bc'; FEATURES.push(bagsFeature);
import { hiSignsFeature } from './hi-signs-feature.js?v=cae8b4dc'; FEATURES.push(hiSignsFeature);
import { gwendolynRoom23Feature } from './gwendolyn-room-23-feature.js?v=185c0fc1'; FEATURES.push(gwendolynRoom23Feature);
import { cubimalRaceFeature } from './cubimal-race-feature.js?v=4a3dc201'; FEATURES.push(cubimalRaceFeature);
import { symphoniousMaximusFeature } from './symphonious-maximus-feature.js?v=9a54b747'; FEATURES.push(symphoniousMaximusFeature);
import { hiddenFloorsFeature } from './hidden-floors-feature.js?v=f5824d9a'; FEATURES.push(hiddenFloorsFeature);
import { vicarsPeakFeature } from './vicars-peak-feature.js?v=cb444319'; FEATURES.push(vicarsPeakFeature);
import { thornfadLettersFeature } from './thornfad-letters-feature.js?v=4f061d4e'; FEATURES.push(thornfadLettersFeature);
import { streetToysFeature } from './street-toys-feature.js?v=30f14486'; FEATURES.push(streetToysFeature);
import { koulatoJarsFeature } from './koulato-jars-feature.js?v=2ad3cc85'; FEATURES.push(koulatoJarsFeature);
import { rebuiltRoomsFeature } from './rebuilt-rooms-feature.js?v=fd719c29'; FEATURES.push(rebuiltRoomsFeature);
import { quarterFeature } from './quarter-feature.js?v=0dac2777'; FEATURES.push(quarterFeature);
import { deadEndsFeature } from './dead-ends-feature.js?v=1a5e981f'; FEATURES.push(deadEndsFeature);
import { interrogationRoomFeature } from './interrogation-room-feature.js?v=3b2769d5'; FEATURES.push(interrogationRoomFeature);
import { towerFloorsFeature } from './tower-floors-feature.js?v=2613cfb3'; FEATURES.push(towerFloorsFeature);
import { subwayFeature } from './subway-feature.js?v=cb91cac2'; FEATURES.push(subwayFeature);
import { vendorNpcsFeature } from './vendor-npcs-feature.js?v=424e2096'; FEATURES.push(vendorNpcsFeature);
import { powdersFeature } from './powders-feature.js?v=10156f0a'; FEATURES.push(powdersFeature);
import { itemVerbsFeature } from './item-verbs-feature.js?v=910bc4ee'; FEATURES.push(itemVerbsFeature);
import { artifactsFeature } from './artifacts-feature.js?v=9ccc0455'; FEATURES.push(artifactsFeature);
import { doorDrinkFeature } from './door-drink-feature.js?v=d24aec55'; FEATURES.push(doorDrinkFeature);
import { buffTriggersFeature } from './buff-triggers-feature.js?v=f2ebb38e'; FEATURES.push(buffTriggersFeature);
import { snoConesFeature } from './sno-cones-feature.js?v=141035ab'; FEATURES.push(snoConesFeature);
import { bureaucraticHallsFeature } from './bureaucratic-halls-feature.js?v=100547fa'; FEATURES.push(bureaucraticHallsFeature);
import { potionsFeature } from './potions-feature.js?v=cc0d63c5'; FEATURES.push(potionsFeature);
import { purpleJourneyFeature } from './purple-journey-feature.js?v=a3bcf3c3'; FEATURES.push(purpleJourneyFeature);
import { smallItemsFeature } from './small-items-feature.js?v=9241237d'; FEATURES.push(smallItemsFeature);
import { crabsFeature } from './crabs-feature.js?v=be237a37'; FEATURES.push(crabsFeature);
// G1245 (#661, ours): the Vine Radio on a home street, its Choose music sheet and its music.
import { radioFeature } from './vine-radio-feature.js?v=8c3ea8c2'; FEATURES.push(radioFeature);
import { fireDragonFeature } from './fire-dragon-feature.js?v=76927062'; FEATURES.push(fireDragonFeature);
import { hellBarFeature } from './hell-bar-feature.js?v=4617844b'; FEATURES.push(hellBarFeature);
import { machineRoomsFeature } from './machine-rooms-feature.js?v=d02fddd0'; FEATURES.push(machineRoomsFeature);
import { gardenGuanoFeature } from './garden-guano-feature.js?v=3d55f5cf'; FEATURES.push(gardenGuanoFeature);
import { worldDropFeature } from './world-drop-feature.js?v=7d09823a'; FEATURES.push(worldDropFeature);
import { gardenNoticesFeature } from './garden-notices-feature.js?v=0e6e850e'; FEATURES.push(gardenNoticesFeature);
import { soloFeatsFeature } from './solo-feats-feature.js?v=ab2e9ba7'; FEATURES.push(soloFeatsFeature);
import { slashCommandsFeature } from './slash-commands-feature.js?v=f76b2963'; FEATURES.push(slashCommandsFeature);
import { hellTicketsFeature } from './hell-tickets-feature.js?v=af5ebdb5'; FEATURES.push(hellTicketsFeature);
import { packTreeVerbsFeature } from './pack-tree-verbs-feature.js?v=0ffcfd94'; FEATURES.push(packTreeVerbsFeature);
import { packToolVerbsFeature } from './pack-tool-verbs-feature.js?v=f00362ca'; FEATURES.push(packToolVerbsFeature);
import { streetSpiritsFeature } from './street-spirits-feature.js?v=49469efe'; FEATURES.push(streetSpiritsFeature);
import { mapRoutesFeature } from './map-routes-feature.js?v=72996531'; FEATURES.push(mapRoutesFeature);
import { swfFeature } from './swf-feature.js?v=a6816a87'; FEATURES.push(swfFeature);
import { machineArtFeature } from './machine-art-feature.js?v=793b8311'; FEATURES.push(machineArtFeature);
import { conversationsFeature } from './conversations-feature.js?v=fdd94fd8'; FEATURES.push(conversationsFeature);
import { quoinShardsFeature } from './quoin-shards-feature.js?v=5d71a1eb'; FEATURES.push(quoinShardsFeature);
import { helpMineFeature } from './help-mine-feature.js?v=50971161'; FEATURES.push(helpMineFeature);
import { familiarDialogFeature } from './familiar-dialog-feature.js?v=bf5413ed'; FEATURES.push(familiarDialogFeature);
import { spiritLonelinessFeature } from './spirit-loneliness-feature.js?v=2b53b47a'; FEATURES.push(spiritLonelinessFeature);
import { funpickleFeature } from './funpickle-feature.js?v=214489b1'; FEATURES.push(funpickleFeature);
import { qurazyFeature } from './qurazy-feature.js?v=5b8f0e39'; FEATURES.push(qurazyFeature);
import { energyDecayFeature } from './energy-decay-feature.js?v=c316d470'; FEATURES.push(energyDecayFeature);
import { partyFeature } from './party-feature.js?v=e218803f'; FEATURES.push(partyFeature);
import { sharedQuoinsFeature } from './shared-quoins-feature.js?v=15495d40'; FEATURES.push(sharedQuoinsFeature);
import { tradeFeature } from './trade-feature.js?v=49f051d5'; FEATURES.push(tradeFeature);
import { ledgerFeature } from './ledger-feature.js?v=aae43c2d'; FEATURES.push(ledgerFeature);
import { vendorFinderFeature } from './vendor-finder-feature.js?v=e3bc39b4'; FEATURES.push(vendorFinderFeature);
import { buddiesFeature } from './buddies-feature.js?v=d51d7588'; FEATURES.push(buddiesFeature);
import { profilesFeature } from './profiles-feature.js?v=354e9858'; FEATURES.push(profilesFeature);
import { neighboursMpFeature } from './neighbours-mp-feature.js?v=283b1dde'; FEATURES.push(neighboursMpFeature);
import { questsMpFeature } from './quests-mp-feature.js?v=e1b8a98f'; FEATURES.push(questsMpFeature);
import { peatQuestMpFeature } from './peat-quest-mp-feature.js?v=68e2ead1'; FEATURES.push(peatQuestMpFeature);
import { groupsFeature } from './groups-feature.js?v=3869ac03'; FEATURES.push(groupsFeature);
import { giftsFeature } from './gifts-feature.js?v=fe0f70ab'; FEATURES.push(giftsFeature);
import { auctionsFeature } from './auctions-feature.js?v=0cba5176'; FEATURES.push(auctionsFeature);
import { playerMailFeature } from './player-mail-feature.js?v=060bc06a'; FEATURES.push(playerMailFeature);
import { followMpFeature } from './follow-mp-feature.js?v=7ca5d0c4'; FEATURES.push(followMpFeature);
import { summonMpFeature } from './summon-mp-feature.js?v=6f4aa38d'; FEATURES.push(summonMpFeature);
import { hogHaulMpFeature } from './hog-haul-mp-feature.js?v=d8134654'; FEATURES.push(hogHaulMpFeature);
import { dropsMpFeature } from './drops-mp-feature.js?v=88ce728e'; FEATURES.push(dropsMpFeature);
import { gravesMpFeature } from './graves-mp-feature.js?v=4d35c231'; FEATURES.push(gravesMpFeature);
import { doorKeysFeature } from './door-keys-feature.js?v=7875c813'; FEATURES.push(doorKeysFeature);
import { boardsMpFeature } from './boards-mp-feature.js?v=40e75fde'; FEATURES.push(boardsMpFeature);
import { bugReportFeature } from './bug-report-feature.js?v=911a2d92'; FEATURES.push(bugReportFeature);
import { playerVerbsMpFeature } from './player-verbs-mp-feature.js?v=c280af8b'; FEATURES.push(playerVerbsMpFeature);
import { snapsFeature } from './snaps-feature.js?v=351a647c'; FEATURES.push(snapsFeature);
import { homeStreetMpFeature } from './home-street-mp-feature.js?v=a60a6e84'; FEATURES.push(homeStreetMpFeature);
import { swoonerfliesFeature } from './swoonerflies-feature.js?v=0e4de29e'; FEATURES.push(swoonerfliesFeature);
import { homePoolMpFeature } from './home-pool-mp-feature.js?v=eda3419c'; FEATURES.push(homePoolMpFeature);
import { yardVerbsMpFeature } from './yard-verbs-mp-feature.js?v=aa160ae4'; FEATURES.push(yardVerbsMpFeature);
import { homeMachinesFeature } from './home-machines-feature.js?v=2d5a535e'; FEATURES.push(homeMachinesFeature);
import { homeStorageFeature } from './home-storage-feature.js?v=29b15204'; FEATURES.push(homeStorageFeature);
import { homeLiveFeature } from './home-live-feature.js?v=84b01b4b'; FEATURES.push(homeLiveFeature);
import { questVerbsFeature } from './quest-verbs-feature.js?v=bcd229ef'; FEATURES.push(questVerbsFeature);
import { itemVerbsMoreFeature } from './item-verbs-more-feature.js?v=62a38d82'; FEATURES.push(itemVerbsMoreFeature);
import { yourLooksFeature } from './your-looks-feature.js?v=7e1f2688'; FEATURES.push(yourLooksFeature);
import { questPinsFeature } from './quest-pins-feature.js?v=0e07d9a1'; FEATURES.push(questPinsFeature);
import { zoneEffectsFeature } from './zone-effects-feature.js?v=75786bbd'; FEATURES.push(zoneEffectsFeature);
import { updateReadyFeature } from './update-ready-feature.js?v=b410467c'; FEATURES.push(updateReadyFeature);
import { butlerImFeature } from './butler-im-feature.js?v=a7e20a57'; FEATURES.push(butlerImFeature);
import { playerImFeature } from './player-im-feature.js?v=9b563808'; FEATURES.push(playerImFeature);
import { chatReactionsFeature } from './chat-reactions-feature.js?v=704d27da'; FEATURES.push(chatReactionsFeature);
import { chatThreadsFeature } from './chat-threads-feature.js?v=7ed5df7b'; FEATURES.push(chatThreadsFeature);
import { presenceMpFeature } from './presence-mp-feature.js?v=21272297'; FEATURES.push(presenceMpFeature);
import { communityMpFeature } from './community-mp-feature.js?v=dffac45d'; FEATURES.push(communityMpFeature);
import { questPlateFeature } from './quest-plate-feature.js?v=3ab3fd3b'; FEATURES.push(questPlateFeature);
import { aggressiveHoeingFeature } from './aggressive-hoeing-feature.js?v=977f9355'; FEATURES.push(aggressiveHoeingFeature);
import { partyScrapingFeature } from './party-scraping-feature.js?v=66f3ff2a'; FEATURES.push(partyScrapingFeature);
import { gardenGnomeFeature } from './garden-gnome-feature.js?v=7a679077'; FEATURES.push(gardenGnomeFeature);
import { collectionTrophiesFeature } from './collection-trophies-feature.js?v=b0b999c0'; FEATURES.push(collectionTrophiesFeature);
import { recipeMemoryFeature } from './recipe-memory-feature.js?v=baea8d15'; FEATURES.push(recipeMemoryFeature);
import { compoundDiscoveryFeature } from './compound-discovery-feature.js?v=fb490c50'; FEATURES.push(compoundDiscoveryFeature);
import { sharedGardensFeature } from './shared-gardens-feature.js?v=6a4f9e22'; FEATURES.push(sharedGardensFeature);
import { sharedPatchesFeature } from './shared-patches-feature.js?v=8be547e3'; FEATURES.push(sharedPatchesFeature);
import { cubimalBattleFeature } from './cubimal-battle-feature.js?v=57ce328b'; FEATURES.push(cubimalBattleFeature);
import { chatPurgeFeature } from './chat-purge-feature.js?v=cb6c250d'; FEATURES.push(chatPurgeFeature);
import { streetFixesFeature } from './street-fixes-feature.js?v=06e9f5a2'; FEATURES.push(streetFixesFeature);
import { skillBubblesFeature } from './skill-bubbles-feature.js?v=59736136'; FEATURES.push(skillBubblesFeature);
// G947 (M3): crews on a home street (help mine, help dig); answers help-mine-feature's queries there.
import { homeCrewMpFeature } from './home-crew-mp-feature.js?v=f049b63a'; FEATURES.push(homeCrewMpFeature);
// TODAYCARD: the start card's Today panel and nudge for a returning player (asks solo-feats for startCardFeat).
import { startTodayFeature } from './start-today-feature.js?v=061705a3'; FEATURES.push(startTodayFeature);
import { chickenScareFeature } from './chicken-scare-feature.js?v=122bdcc7'; FEATURES.push(chickenScareFeature);
import { gameTeleporterFeature } from './game-teleporter-feature.js?v=3f4bb706'; FEATURES.push(gameTeleporterFeature);
import { levelUpMpFeature } from './level-up-mp-feature.js?v=22659e6d'; FEATURES.push(levelUpMpFeature);
// G982 Pot Luck Day, part A: the chicken costumes (after seasons-feature, whose seasonOn it asks).
import { potLuckFeature } from './pot-luck-feature.js?v=24662363'; FEATURES.push(potLuckFeature);
import { potLuckFeastFeature } from './pot-luck-feast-feature.js?v=95f6f6af'; FEATURES.push(potLuckFeastFeature);
// G1009 Thanksgiving Day's feast: eat-in-place piles of the week's table food (asks pot-luck-feast for its counts).
import { feastDayFeature } from './feast-day-feature.js?v=90fa4f09'; FEATURES.push(feastDayFeature);
import { calendarFeature } from './calendar-feature.js?v=911e7478'; FEATURES.push(calendarFeature);
// G1195 Happy New Ur: the countdown at the Groddle midnights of December 31, the show and the party street.
import { newUrFeature } from './new-ur-feature.js?v=48ca651e'; FEATURES.push(newUrFeature);
import { newUrPartyFeature } from './new-ur-party-feature.js?v=62874ea6'; FEATURES.push(newUrPartyFeature);
import { streetObjectsFeature } from './street-objects-feature.js?v=1d781af7'; FEATURES.push(streetObjectsFeature);
import { realtimeFeature } from './realtime-feature.js?v=6b9cb086'; FEATURES.push(realtimeFeature);
import { accountBackupFeature } from './account-backup-feature.js?v=5ce4b0a4'; FEATURES.push(accountBackupFeature);
