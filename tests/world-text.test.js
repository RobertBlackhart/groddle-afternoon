// R17 (G898 #429, G903): every in-world text (Pixi text styles, canvas fonts, the DOM copy of a
// bubble's amount) takes its family from js/world-text.js, the self-hosted Nunito with a plain
// sans-serif fallback. A style that names a family of its own (Trebuchet MS, Arial, Verdana...)
// fell back badly on Android; this fails on any new one.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  NAMEPLATE_STYLE,
  WORLD_FONT_FACES,
  WORLD_FONT_FAMILY,
  installWorldText,
  loadWorldFont,
  worldCanvasFont,
  worldLabelStyle,
  worldTextStyle,
} from '../public/js/world-text.js?v=2dd95179';

const root = join(import.meta.dirname, '..');
const pub = join(root, 'public');
const read = (p) => readFileSync(join(root, p), 'utf8');

/** The game's code: game.js and public/js, less the module itself and the level builder's editor. */
function gameSources() {
  const out = [join(pub, 'game.js')];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (name !== 'builder') walk(p);
      } else if (name.endsWith('.js') && name !== 'world-text.js') out.push(p);
    }
  };
  walk(join(pub, 'js'));
  return out;
}

/** Lines matching `re`, as 'file:line: text'. */
function hits(re) {
  const found = [];
  for (const file of gameSources()) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (re.test(line)) found.push(`${relative(root, file)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return found;
}

describe('the world font (R17)', () => {
  it('is the self-hosted Nunito, then a sans-serif every phone has', () => {
    assert.match(WORLD_FONT_FAMILY, /^Nunito, /);
    assert.match(WORLD_FONT_FAMILY, /, sans-serif$/);
    assert.doesNotMatch(WORLD_FONT_FAMILY, /Trebuchet|Verdana|Georgia|Fredoka|Courier|, serif/);
    // The face style.css serves from assets/fonts/nunito (tests/nunito-font.test.js), never Google.
    assert.match(read('public/style.css'), /font-family: Nunito;[\s\S]*?src: url\("assets\/fonts\/nunito\/nunito-roman-latin\.woff2"\)/);
    assert.ok(WORLD_FONT_FACES.every((face) => / Nunito$/.test(face)));
    // The STOOT memorial's inscription is the one italic world text (game.js makeStootMemorial).
    assert.ok(WORLD_FONT_FACES.some((face) => face.startsWith('italic ')));
  });

  it('builds styles and canvas fonts that keep their sizes and colours', () => {
    assert.deepEqual(worldTextStyle({ fontSize: 13, fill: 0x453b34, fontFamily: 'Arial' }), { fontSize: 13, fill: 0x453b34, fontFamily: WORLD_FONT_FAMILY });
    assert.equal(worldCanvasFont(11), `11px ${WORLD_FONT_FAMILY}`);
    assert.equal(worldCanvasFont(39, '700'), `700 39px ${WORLD_FONT_FAMILY}`);
    assert.equal(NAMEPLATE_STYLE.fontFamily, WORLD_FONT_FAMILY);
    assert.equal(NAMEPLATE_STYLE.fontSize, 12);
    assert.equal(NAMEPLATE_STYLE.fontWeight, '700');
    const label = worldLabelStyle(11);
    assert.equal(label.fontFamily, WORLD_FONT_FAMILY);
    assert.equal(label.fontSize, 11);
    assert.equal(label.fill, 0xfffaf0);
  });

  it('becomes Pixi\'s default family, for a text made with none', () => {
    const PIXI = { TextStyle: { defaultTextStyle: { fontFamily: 'Arial', fontSize: 26 } } };
    installWorldText(PIXI);
    assert.equal(PIXI.TextStyle.defaultTextStyle.fontFamily, WORLD_FONT_FAMILY);
    assert.equal(PIXI.TextStyle.defaultTextStyle.fontSize, 26);
    assert.match(read('public/game.js'), /installPixiFixes\(PIXI\);\n(?:  \/\/.*\n)*  installWorldText\(PIXI\);\n  loadWorldFont\(\);\n/);
  });

  it('loads every face once, then drops Pixi\'s cached metrics measured before it', async () => {
    const asked = [];
    let cleared = 0;
    const realDoc = globalThis.document;
    globalThis.document = { fonts: { load: (font) => { asked.push(font); return Promise.resolve([{ family: 'Nunito' }]); } } };
    try {
      const PIXI = { CanvasTextMetrics: { clearMetrics: () => { cleared += 1; } } };
      assert.equal(await loadWorldFont(50, PIXI), true);
      assert.deepEqual(asked, [...WORLD_FONT_FACES]);
      assert.equal(cleared, 1);
      assert.equal(await loadWorldFont(50, PIXI), true);
      assert.equal(asked.length, WORLD_FONT_FACES.length);
      // The first street awaits it with the signposts (street-render.js loadSignpostTextures).
      assert.match(read('public/js/street-render.js'), /export function loadSignFont\(wait\) \{\n  return loadWorldFont\(wait\);\n\}/);
    } finally {
      globalThis.document = realDoc;
    }
  });

  it('no in-world text style names a font family of its own', () => {
    // Pixi styles: `fontFamily: '...'` (a literal), not the module's WORLD_FONT_FAMILY.
    assert.deepEqual(hits(/\bfontFamily\s*:\s*['"`]/), []);
    // Canvas text: `ctx.font = '11px sans-serif'`.
    assert.deepEqual(hits(/\.font\s*=\s*['"`]/), []);
    // A family-first `font:` option (the quest rooms' kit.label took `font: 'Georgia, serif'`).
    assert.deepEqual(hits(/\bfont\s*:\s*['"`](?!inherit|var\()[A-Za-z"']/), []);
    // A literal stack held in a constant for styles (paradise-course-runtime.js FONT, job-indicator.js font).
    assert.deepEqual(hits(/\b(?:const|let)\s+\w*(?:FONT|[Ff]ont)\w*\s*=\s*['"`].*(?:sans-serif|serif|monospace)/), []);
  });

  it('draws the bubble amount\'s flight to the HUD in the pill\'s own font', () => {
    const game = read('public/game.js');
    const flight = game.slice(game.indexOf("el.className = 'slug-flight';"), game.indexOf('document.body.appendChild(el);', game.indexOf("el.className = 'slug-flight';")));
    assert.match(flight, /font: worldCanvasFont\(SLUG_LAYOUT\.fontSize \* A\.growScale, '700'\),/);
    assert.doesNotMatch(flight, /Trebuchet/);
  });

  it('keeps the shared styles shared: nameplates and world labels', () => {
    const game = read('public/game.js');
    assert.match(game, /new PIXI\.Text\(\{ text: profile\.name, style: NAMEPLATE_STYLE \}\)/);
    assert.match(read('public/js/features/realtime-feature.js'), /new PIXI\.Text\(\{ text: p\.name, style: NAMEPLATE_STYLE \}\)/);
    assert.doesNotMatch(game, /function WORLD_LABEL_STYLE/);
    assert.equal((game.match(/style: worldLabelStyle\(1[12]\)/g) || []).length, 2);
  });
});
