/**
 * #348 (an upright phone on Froughtful Fen): a street only 850 px tall holds the view under the
 * window's height (js/location-view.js phoneStage), and the band above the canvas showed
 * #game-root's own sky blue. game.js syncLocationViewHeight now paints the band with the street's
 * sky (js/street-render.js stageSkyColour, --stage-sky). And under 760 px wide the street's name
 * drops under the pills, where the route card (To: / Next:) sat over it: the card goes under it.
 * Browser check (WebKit, 402 x 812, DPR 3): the band is the Fen's olive, the card's top is 104 px
 * under a name that ends at 96 px; at 1280 x 800 nothing moved.
 * Run: node --test tests/phone-short-street.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stageSkyColour } from '../public/js/street-render.js?v=04647f8c';
import { resolvedStyleCss } from './css-tokens.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const street = (tsid) => JSON.parse(readFileSync(join(root, 'public/assets/streets', `${tsid}.json`), 'utf8'));

describe('a short street on an upright phone', () => {
  it('paints the band above with the street\'s own sky', () => {
    assert.equal(stageSkyColour(street('GTJ103U2KJK1BLG')), '#858200');
    assert.equal(stageSkyColour({ gradient: { top: '0x1A2B3C', bottom: '000000' } }), '#1a2b3c');
    // No gradient: the painted fallback sky's top (street-render themeTop).
    assert.equal(stageSkyColour({}), '#8eb8d8');
    assert.equal(stageSkyColour({ gradient: { top: 'nonsense' } }), '#8eb8d8');
  });

  it('the band takes --stage-sky, and the page blue only without it', () => {
    const css = resolvedStyleCss();
    const rules = [...css.matchAll(/(?:^|\n)#game-root \{([^}]*)\}/g)].map((m) => m[1]);
    const last = rules.filter((r) => /background:/.test(r)).at(-1);
    assert.match(last, /background: var\(--stage-sky, #[0-9a-f]{6}\)/);
  });

  it('under 760 px the route card starts below the street name', () => {
    const css = resolvedStyleCss();
    const px = (expr) => {
      // calc() of px, rem and n * px terms, the tokens already resolved (--safe-t and --minimap-h are 0 here).
      const body = expr.replace(/var\(--(?:safe-t|minimap-h)(?:, 0px)?\)/g, '0px').replace(/^calc\((.*)\)$/, '$1');
      return body.split('+').reduce((sum, term) => {
        const t = term.trim();
        const m = t.match(/^(?:(\d+(?:\.\d+)?) \* )?(-?\d+(?:\.\d+)?)(px|rem)$/);
        assert.ok(m, `term ${t}`);
        return sum + (m[1] ? Number(m[1]) : 1) * Number(m[2]) * (m[3] === 'rem' ? 16 : 1);
      }, 0);
    };
    const narrow = css.slice(css.indexOf('#348: under 760 px'));
    const card = narrow.match(/\.route-gps \{ top: ([^;]+);/)[1];
    // The last narrow nameplate rule wins (it adds the notch inset).
    const plate = [...css.matchAll(/@media \(max-width: 760px\) \{\s*\[data-ui="modern"\] \.street-nameplate,\s*\[data-ui="modern"\] \.street-nameplate\.is-placed \{ top: ([^;]+);/g)].at(-1)[1];
    const hudH = 44;
    assert.ok(px(card) >= px(plate) + hudH, `card ${px(card)} vs name ${px(plate)} + ${hudH}`);
  });
});

describe('G860 (#416): under 760 px the route card and the pinned quests', () => {
  const css = readFileSync(join(root, 'public/style.css'), 'utf8');
  const narrow = css.slice(css.indexOf('#348: under 760 px'), css.indexOf('/* PHONE MAP (Austin 2026-11-13'));
  it('the card goes under the pins while they show, by their height', () => {
    const m = narrow.match(/#game-root:not\(\[data-sheet\]\):has\(#quest-pins:not\(\[hidden\]\)\) \.route-gps \{ top: ([^;]+);/);
    assert.ok(m, 'the rule is in the narrow block');
    const base = narrow.match(/\[data-ui="modern"\] #game-root \.route-gps \{ top: calc\(([^;]+)\);/)[1];
    assert.equal(m[1], `calc(${base} + var(--quest-pins-h, 0px) + var(--space-2))`);
  });
  it('the pins stand at the card\'s height, and game.js keeps --quest-pins-h', () => {
    assert.match(css, /@media \(max-width: 760px\) \{\n\s+\[data-ui="modern"\] #game-root #quest-pins:not\(\[hidden\]\) \{ top: calc\(2 \* var\(--hud-h\) \+ var\(--space-4\)\); \}/);
    assert.match(readFileSync(join(root, 'public/game.js'), 'utf8'), /root\.style\.setProperty\('--quest-pins-h', `\$\{h\}px`\)/);
  });
});
