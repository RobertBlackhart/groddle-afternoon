/**
 * Sharp pictures on the Encyclopedia and Restoration pages (Austin 2026-11-23: "The butterfly in the
 * encyclopedia is really blurry. Can that be fixed. Are there other images like that which also
 * need fixed?"). The pages drew small files bigger than they are: the Butterfly's 39 px still at
 * 78 css px, an 18 px bean's 54 px @3x at 76 on its item page, the 52 px catalog cards over 18 px
 * icons. tools/page-art renders those pictures from Tiny Speck's CC0 vector SWFs at k times their
 * 1x file (assets/page-art/), for the pages only, and the builders draw every picture with all its
 * files in a width-described srcset, never bigger than its sharpest file covers.
 * Run: node --test tests/page-art-sharp.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from '../tools/image-size.mjs';
import { PAGE_ART, loadPageArt, sharpScale, sources } from '../tools/page-art/index.mjs';
import { drawnScale } from '../tools/encyclopedia/parts.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const walk = (dir, test, out = []) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, test, out);
    else if (test(f)) out.push(p);
  }
  return out;
};
const sizes = new Map();
const sizeOf = (abs) => {
  if (!sizes.has(abs)) sizes.set(abs, existsSync(abs) ? imageSize(abs) : null);
  return sizes.get(abs);
};
const pageArt = loadPageArt(pub);
/** Has a picture (public path) a file sharper than 2x of its 1x: an @3x sibling or page art? */
const hasSharp = (rel) => pageArt.has(rel) || (/\.(?:webp|png)$/.test(rel) && existsSync(join(pub, rel.replace(/\.(webp|png)$/, '@3x.$1'))));

/** Catalog cards with no file twice their box, and why (tools/page-art/render.py refused them). */
const STAYS_SOFT = {
  batterfly_bar: 'the remake\'s own Batterfly Bar: no vector art',
  esquibeth_note_1: 'its SWF draws the note larger than the icon: the render does not match',
};

describe('pictures on the Encyclopedia and Restoration pages', () => {
  it('each has a file at least as wide as it is drawn, and twice as wide where a sharper file exists', () => {
    const pages = [...walk(join(pub, 'encyclopedia'), (f) => f.endsWith('.html')), ...walk(join(pub, 'restoration'), (f) => f.endsWith('.html'))];
    assert.ok(pages.length > 4000, `${pages.length} pages`);
    const bad = new Map();
    let n = 0;
    for (const page of pages) {
      const html = readFileSync(page, 'utf8');
      for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
        const attr = (k) => (new RegExp(`\\s${k}="([^"]*)"`).exec(tag) || [])[1];
        const w = Number(attr('width'));
        const src = attr('src');
        if (!w || !src || /^(?:data:|https?:)/.test(src) || src.split('?')[0].endsWith('.svg')) continue;
        const files = [src, ...(attr('srcset') || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)]
          .map((c) => resolve(dirname(page), c.split('?')[0]));
        const widths = files.map((f) => sizeOf(f)?.w || 0);
        const best = Math.max(...widths);
        assert.ok(best > 0, `${relative(pub, page)}: ${src} is missing`);
        n++;
        const one = relative(pub, files[0]).replace(/@\d+x\.(webp|png)$/, '.$1');
        const need = hasSharp(one) ? 2 * w : w;
        if (best < need) {
          const key = `${relative(pub, files[widths.indexOf(best)])}: ${best} px drawn at ${w} css px (needs ${need})`;
          if (!bad.has(key)) bad.set(key, relative(pub, page));
        }
      }
    }
    assert.ok(n > 30000, `${n} pictures`);
    assert.deepEqual([...bad].slice(0, 25).map(([k, p]) => `${k}, e.g. ${p}`), [], `${bad.size} pictures drawn bigger than their files`);
  });

  it('the Butterfly is drawn from its page art, sharp at 2x, at the size it always had', () => {
    const html = readFileSync(join(pub, 'encyclopedia/animals/npc_butterfly/index.html'), 'utf8');
    const hero = /<div class="cat-hero-frame[^"]*"><img class="cat-hero-icon"[^>]*>/.exec(html)?.[0];
    assert.ok(hero, 'the Butterfly page has its hero picture');
    assert.match(hero, /srcset="[^"]*butterfly_rest_single\.webp\?v=[0-9a-f]{8} 39w, [^"]*assets\/page-art\/sprites\/butterfly_rest_single@9x\.webp\?v=[0-9a-f]{8} 351w" sizes="78px"/);
    assert.match(hero, /width="78" height="56"/);
  });

  it('the item catalog draws each icon card from files that cover its 52 px box', () => {
    const data = JSON.parse(readFileSync(join(pub, 'encyclopedia/items/data.json'), 'utf8'));
    const js = readFileSync(join(pub, 'encyclopedia/items/catalog.js'), 'utf8');
    assert.match(js, /\$\{PAGE_ART\}\$\{item\.id\}@\$\{item\.pk\}x\.webp \$\{item\.iw \* item\.pk\}w/);
    const bad = [];
    for (const item of data.items.filter((i) => i.icon)) {
      const one = sizeOf(join(pub, 'assets/sprites/icons', `${item.id}.webp`));
      assert.equal(item.iw, one.w, item.id);
      const drawn = (52 * one.w) / Math.max(one.w, one.h);
      const best = Math.max(one.w, item.icon === 3 ? one.w * 3 : 0, item.pk ? one.w * item.pk : 0);
      if (item.pk) assert.ok(existsSync(join(pub, PAGE_ART, 'sprites/icons', `${item.id}@${item.pk}x.webp`)), item.id);
      if (best < 2 * drawn && !STAYS_SOFT[item.id]) bad.push(`${item.id}: ${best} px for ${drawn.toFixed(0)} css px`);
    }
    assert.deepEqual(bad, []);
  });

  it('draws tiles at their own size and heroes no bigger than their sharpest file covers', () => {
    const bean = { src: 'b.webp', w: 18, h: 11, hi: 'b@3x.webp', hiW: 54 };
    assert.equal(drawnScale(bean, 'ency-ic', 48), 1, 'a tile is its own size (catalog.css .ency-ic is width: auto)');
    assert.equal(drawnScale(bean, 'ency-chip-ic', 20), 20 / 18, 'a chip fills its 20 px box');
    assert.equal(drawnScale(bean, 'cat-hero-icon', 144), 1.5, 'a hero with only its @3x: two device px a css px');
    assert.equal(drawnScale({ ...bean, page: { src: 'p.webp', w: 162, h: 99, k: 9 } }, 'cat-hero-icon', 144), 3, 'with page art: three times, as before');
    assert.equal(drawnScale({ src: 'q.webp', w: 86, h: 58 }, 'cat-hero-icon', 144), 1, 'a picture with only its 1x is drawn at its size');
    assert.deepEqual(sources({ ...bean, page: { src: 'p.webp', w: 162 } }).map((s) => s.w), [18, 54, 162]);
    assert.equal(sharpScale({ ...bean, page: { src: 'p.webp', w: 162 } }), 4.5);
  });
});

describe('density files', () => {
  it('every @Nx file is at least N - 0.5 times as wide as its 1x picture', () => {
    const bad = [];
    let n = 0;
    for (const abs of walk(join(pub, 'assets'), (f) => /@\d+x\.(?:webp|png)$/.test(f))) {
      const rel = relative(pub, abs);
      const k = Number(/@(\d+)x\.(?:webp|png)$/.exec(rel)[1]);
      const one = rel.replace(/@\d+x\.(webp|png)$/, '.$1').replace(`${PAGE_ART}/`, 'assets/');
      const a = sizeOf(join(pub, one));
      if (!a) continue; // a dense sheet's parts (<name>.p1@5x.webp) have no 1x of their own
      n++;
      const b = sizeOf(abs);
      if (b.w < (k - 0.5) * a.w) bad.push(`${rel}: ${b.w} px, its 1x ${a.w} px`);
    }
    assert.ok(n > 2800, `${n} files`);
    assert.deepEqual(bad, []);
  });

  it('page art is exactly k times its 1x picture, and only the pages load it', () => {
    assert.ok(pageArt.size > 900, `${pageArt.size} pictures have page art`);
    for (const [one, p] of pageArt) {
      const a = sizeOf(join(pub, one));
      assert.ok(a, `${p.src}: no 1x picture ${one}`);
      assert.ok(Math.abs(p.w - a.w * p.k) <= 1 && Math.abs(p.h - a.h * p.k) <= 1, `${p.src}: ${p.w}x${p.h}, ${p.k} x ${a.w}x${a.h}`);
    }
    for (const id of ['quoin', 'moving_quoin', 'bean_egg', 'apple']) assert.ok(pageArt.has(`assets/sprites/icons/${id}.webp`), id);
    assert.ok(pageArt.has('assets/sprites/butterfly_rest_single.webp'));
    // The game keeps its own 1x/3x files and texture budgets: nothing it runs names the folder.
    const game = walk(join(pub, 'js'), (f) => f.endsWith('.js')).filter((f) => !f.endsWith('data-versions.js'));
    for (const f of [...game, join(pub, 'game.js')]) assert.doesNotMatch(readFileSync(f, 'utf8'), /page-art/, relative(pub, f));
  });
});
