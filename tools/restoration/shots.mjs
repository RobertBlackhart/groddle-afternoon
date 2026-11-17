/**
 * Screenshots for the restoration page, captured from the live game by
 * tools/restoration/capture.mjs into public/restoration/shots/<key>.webp
 * (room shots as room-<room>.webp). Each entry is a QA route plus optional
 * shot.mjs-style steps. frame: 'world' crops to the street view above the
 * pack; 'panel' keeps the whole game area so an open panel shows.
 */
const Q = '?autostart=1&fresh=1&resetgame=1&questoffer=off&questfx=0&timedemo=day';
// Hechey Track at ground level by its tree ladder: a fresh game now spawns up in the street's canopy
// (game.js placement('player') since 30e8eca38dd), where the shots lost their street.
const H = '&streetdemo=GLI2V0UN7RD1T2J&streetx=3200&streety=820';
// Clicks the first visible dialogue button (OK / Click anywhere / Next).


export const SHOTS = Object.freeze({
  streets: { route: `${Q}${H}`, wait: 10000 },
  navigation: { route: `${Q}&doordemo=GLI32G3NUTD100I`, wait: 11000 },
  // The Ur subway (G115): buy a Red Line ticket at Somewhat Sump and stop in the moving train.
  subway: { route: `${Q}&subwaydemo=somewhat_sump&subwaypapers=1&subwayautoplay=ride&subwayfast=1&subwayhold=1`, wait: 26000 },
  physics: { route: `${Q}&streetdemo=GUVUMTSQ2FC34ES`, wait: 11000 },
  // Vicar's Peak's top ledge: the arched door, a vined ladder and the tier below (G93).
  'vicars-peak': { route: `${Q}&streetdemo=GCR1516SFHM122V&streetx=1000&streety=185`, wait: 12000 },
  // The Interrogation room (G352): standing by the right partitions, the booth's chair in the light.
  interrogation: { route: `${Q}&streetdemo=GIFLFPPBUUT11SP&streetx=720&streety=970`, wait: 12000 },
  'street-events': { route: `${Q}&puzzledemo=GHVOD0F3T403694`, wait: 12000 },
  camera: { route: `${Q}${H}&camerademo=1&cameraskill=1&cameralook=-1100,-60`, wait: 12000 },
  piggies: { route: `${Q}&animaldemo=piggy&animalrank=2`, wait: 9000 },
  // Gregarious Grange: Hechey Track keeps no butterflies in the archive's ecology.
  // The demo stands you beside a butterfly at boot, but they fly off: step beside the lowest one again.
  butterflies: { route: `${Q}&streetdemo=GLI32G3NUTD100I&animaldemo=butterfly&animalrank=2&tooldemo=butterfly_lotion&toolremaining=5`, wait: 10000, steps: [{ eval: "(() => { const b = window.groddleQA.snapshot().interactables.filter((i) => i.classId === 'npc_butterfly').sort((p, q) => q.y - p.y)[0]; if (b) window.groddleQA.placeAvatar(b.x - 60, b.y); })()" }, { wait: 900 }] },
  trants: { route: `${Q}&harvestdemo=fruit&harvestrank=2&harvestreset=1`, wait: 9000 },
  foxes: { route: `${Q}${H}&foxdemo=1`, wait: 11000 },
  batterflies: { route: `${Q}&streetdemo=GA9114MS8B32FB2`, wait: 11000 },
  gardens: { route: `${Q}&mastergardendemo=1`, wait: 10000 },
  mining: { route: `${Q}&rockdemo=sparkly`, wait: 9000 },
  cooking: { route: `${Q}${H}`, wait: 8000, frame: 'panel', steps: [{ click: '#make-btn' }, { wait: 1200 }] },
  // A fresh game stands in Hechey Track's canopy, where the street's quoins now float (no H).
  quoins: { route: `${Q}`, wait: 9000 },
  shrines: { route: `${Q}&shrinedemo=1`, wait: 10000 },
  imagination: { route: `${Q}${H}&imgdemo=1&imglevel=12`, wait: 10000, frame: 'panel' },
  badges: { route: `${Q}${H}&badgeqa=1`, wait: 9000, frame: 'panel', steps: [{ click: '#more-btn' }, { click: '#achieve-btn' }, { wait: 1500 }] },
  quests: { route: `?autostart=1&fresh=1&resetgame=1&questoffer=now${H}`, wait: 16000, frame: 'panel' },
  'story-quests': { route: `${Q}&questdemo=winter&winterautoplay=surface`, wait: 16000 },
  paradise: { route: `${Q}&paradise=cloud_rings&paradisepreview=ring&paradisefx=0`, wait: 12000 },
  races: { route: `${Q}&racedemo=space_race&raceassist=1&raceautoplay=1`, wait: 16000 },
  'hog-haul': { route: `${Q}&questdemo=hoghaul&racedemo=1&raceassist=1`, wait: 14000 },
  'street-jobs': { route: `${Q}${H}&jobdemo=351`, wait: 10000 },
  parties: { route: `${Q}&partydemo=moon&partyautoplay=hold`, wait: 16000 },
  homes: { route: `${Q}&homedemo=decorate`, wait: 12000 },
  neighbours: { route: `${Q}&stonedemo=1&stoneautoplay=1`, wait: 16000 },
  rooks: { route: `${Q}${H}&rookdemo=attack&rookfx=hold`, wait: 12000 },
  skills: { route: `${Q}${H}&skilltree=mining_3`, wait: 9000, frame: 'panel' },
  meditation: { route: `${Q}${H}&meditatedemo=all&meditateroll=0.99&meditateautoplay=levitate&meditatelevhold=1`, wait: 14000 },
  icons: { route: `${Q}${H}&icondemo=1&iconautoplay=place`, wait: 16000 },
  rube: { route: `${Q}${H}&rubedemo=1&rubeautoplay=offer&rubeseed=3`, wait: 20000, frame: 'panel' },
  hell: { route: `${Q}&helldemo=croak`, wait: 12000 },
  // West of the tree ladder: the Smuggler walks up to 330 px on your right, clear of the Beryl Rock.
  smuggling: { route: `${Q}&streetdemo=GLI2V0UN7RD1T2J&streetx=2700&streety=840&smugglingdemo=give`, wait: 9000 },
  collectibles: { route: `${Q}&stootdemo=1&stootdollautoplay=1&stootquote=38`, wait: 8000 },

  'room:rainbow_run': { route: `${Q}&questdemo=numismatic_hustle&questautoplay=ready`, wait: 16000 },
  'room:top_of_tree': { route: `${Q}&questdemo=high_jump`, wait: 12000, steps: [{ eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }, { eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }] },
  'room:color_unblocking': { route: `${Q}&questdemo=puzzle_level_color_blockage`, wait: 12000 },
  'room:vision_quest': { route: `${Q}&questdemo=eyeballery_identify_object`, wait: 14000 },
  'room:kids_room': { route: `${Q}&questdemo=letter_block_1`, wait: 12000 },
  'room:rube_yard': { route: `${Q}&questdemo=rube_spy`, wait: 12000 },
  'room:le_miserable': { route: `${Q}&questdemo=le_miserable`, wait: 14000 },
  'room:juju_camp': { route: `${Q}&questdemo=help_juju_bandits&questautoplay=scene`, wait: 20000 },
  'room:picto_pattern': { route: `${Q}&questdemo=picto_pattern&questautoplay=solve1`, wait: 18000 },
  'room:radiant_glare': { route: `${Q}&questdemo=radiant_glare&questautoplay=totem`, wait: 24000 },
  'room:an_autumn_day': { route: `${Q}&questdemo=an_autumn_day`, wait: 12000 },
  'room:being_watched': { route: `${Q}&questdemo=stale_but_necessary&questautoplay=veil`, wait: 18000 },
  'room:back_alley': { route: `${Q}&questdemo=fuelmaking_refuel_robot`, wait: 14000 },
  'room:clubhouse': { route: `${Q}&questdemo=join_club`, wait: 14000 },
  'room:light_perspective': { route: `${Q}&questdemo=puzzle_level_light_perspective&questautoplay=mix`, wait: 18000 },
  'room:tile_puzzle': { route: `${Q}&questdemo=btc_room_3`, wait: 12000, steps: [{ eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }, { eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }, { eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }, { eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }, { eval: "[...document.querySelectorAll('button')].find((b) => b.offsetParent && /^(OK|Ok|Click anywhere|Next|Continue)/i.test(b.textContent.trim()))?.click()" }, { wait: 900 }] },
  'room:operation_grow': { route: `${Q}&questdemo=where_the_blue_grew&growx=1480&growstate=1110111`, wait: 12000 },
  'room:gwendolyn': { route: `${Q}&questdemo=tower_quest&questautoplay=desert`, wait: 40000 },
  'room:mental_block': { route: `${Q}&questdemo=mental_block`, wait: 14000 },
  'room:esquibeth': { route: `${Q}&questdemo=last_pilgrimage_of_esquibeth&esqstage=waterfall_04_wider`, wait: 22000 },
  'room:penalty': { route: `${Q}&questdemo=smuggle_the_smuggler_part1`, wait: 14000 },
  'room:firefly_whistle': { route: `${Q}&questdemo=firefly_whistle&questautoplay=look`, wait: 13000 },
  // The practice streets: after the flamingo's hello, walk right to the made counters, lamps and table
  // (EZ Cookin') and to the Dirt Pile below the Patch's mound (Soil Appreciation).
  'room:ez_cookin': { route: `${Q}&questdemo=ezcooking_1&questautoplay=hello`, wait: 14000, steps: [{ hold: 'ArrowRight', ms: 2750 }, { wait: 1800 }] },
  'room:soil_appreciation': { route: `${Q}&questdemo=soilappreciation_1&questautoplay=hello`, wait: 14000, steps: [{ hold: 'ArrowRight', ms: 6200 }, { wait: 1800 }] },

  // Designer levels (tools/restoration/designer-levels.mjs): one shot per course or street.
  'level:radial_heights': { route: `${Q}&paradise=radial_heights&paradisepreview=moon&paradisefx=0`, wait: 12000 },
  'level:arbor_hollow': { route: `${Q}&paradise=arbor_hollow&paradisefx=0`, wait: 12000 },
  'level:abysmal_thrill': { route: `${Q}&paradise=abysmal_thrill&paradisefx=0`, wait: 12000 },
  'level:aerial_boost': { route: `${Q}&paradise=aerial_boost&paradisefx=0`, wait: 12000 },
  'level:mountain_scaling': { route: `${Q}&paradise=mountain_scaling&paradisefx=0`, wait: 12000 },
  'level:starlit_night': { route: `${Q}&paradise=starlit_night&paradisepreview=smile&paradisefx=0`, wait: 12000 },
  'level:slip_n_slide': { route: `${Q}&paradise=slip_n_slide&paradisepreview=finish&paradisefx=0`, wait: 12000 },
  'level:sky_plunge': { route: `${Q}&paradise=sky_plunge&paradisefx=0`, wait: 12000 },
  'level:updraft': { route: `${Q}&paradise=updraft&paradisefx=0`, wait: 12000 },
  'level:drafty_uplift': { route: `${Q}&paradise=drafty_uplift&paradisefx=0`, wait: 12000 },
  'level:beam_me_down': { route: `${Q}&scenedemo=beam_me_down&scenehold=1`, wait: 12000 },
  'level:constellation': { route: `${Q}&scenedemo=constellation&scenehold=1`, wait: 12000 },
  'level:winter_walk': { route: `${Q}&questdemo=winter&winterautoplay=surface`, wait: 16000 },
  'level:greedy': { route: `${Q}&questdemo=greedy&greedyfx=0`, wait: 14000 },
  'level:orangian': { route: `${Q}&puzzledemo=GHVCKEPHO403BN5`, wait: 12000 },
  'level:blooian': { route: `${Q}&puzzledemo=GHVP8TCLT40336S`, wait: 12000 },
  'level:griinolyza': { route: `${Q}&puzzledemo=GHVOD0F3T403694`, wait: 12000 },
  'level:purplysa': { route: `${Q}&puzzledemo=GHVP7QOKT403F5Q`, wait: 12000 },
  'level:amberlyza': { route: `${Q}&puzzledemo=GHVDKQ2O6S23LVJ`, wait: 12000 },
});
