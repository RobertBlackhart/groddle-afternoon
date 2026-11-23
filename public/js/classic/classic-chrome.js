/**
 * The Classic interface's chrome (classic-spec build-plan §2-§4): each piece installs once, stays
 * mounted, and shows only under <html data-ui="classic"> (css/classic.css), so the interface can
 * switch both ways at runtime. classic-prefs.js installInterfaceSettings() (called once by game.js)
 * installs this, with the game's engine (its view snapshot, sounds and home) and the player's
 * avatar still (game.js ownerPortraitUrl) for the pictures the 2012 chrome showed.
 */
import { installClassicFrame } from './classic-frame.js?v=4de826a9';
import { installClassicTopbar } from './classic-topbar.js?v=16ec7052';
import { installClassicGrowl } from './classic-growl.js?v=267e11d1';
import { installClassicPanes } from './classic-panes.js?v=63d4057e';
import { installClassicPack } from './classic-pack.js?v=10f10463';
import { installClassicHub } from './classic-hub.js?v=752271ca';
import { installClassicSkills } from './classic-skills.js?v=0c8f3b8b';

let installed = null;

export function installClassicChrome({ doc = globalThis.document, win = globalThis, engine = null, avatarPortrait = null } = {}) {
  if (installed) return installed;
  installed = {
    frame: installClassicFrame({ doc, win }),
    topbar: installClassicTopbar({ doc, win, avatarPortrait }),
    growl: installClassicGrowl({ doc, win }),
    panes: installClassicPanes({ doc, win }),
    pack: installClassicPack({ doc }),
    hub: installClassicHub({ doc, win, engine, avatarPortrait }),
  };
  // Skills steps back to the hub (classic-skills.js).
  installed.skills = installClassicSkills({ doc, win, engine, hub: installed.hub });
  // QA: the quest-complete box, a Magic Rock conversation and a plain NPC prompt on demand,
  // through the game's own award queue and scripted dialogue.
  win.groddleClassicQA = {
    conversation: () => engine?.scriptedDialogue?.({ title: 'Juice Medley Melee', kicker: 'Magic Rock', beats: [{ text: 'You know what this street needs? Juice. Lots of juice. Make me some?', response: 'Yeah!' }] }),
    prompt: () => engine?.scriptedDialogue?.({ title: 'Mr. Block', kicker: 'Leaving so soon?', cancelable: true, beats: [{ text: 'Oh, are you not having fun here? You can come back and try the riddles again later.', response: 'Leave the playroom' }] }),
    questComplete: () => engine?.award?.({ kind: 'quest', title: 'Juice Medley Melee', body: 'That juice looks mighty bracing, kid. But I forgot something.', subtitle: '+50 iMG · +20 currants', primaryLabel: 'OK' }),
  };
  return installed;
}
