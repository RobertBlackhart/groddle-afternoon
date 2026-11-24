/**
 * Page art (tools/page-art/render.py): sharp renders of small pictures for the Encyclopedia and the
 * Item catalog, at k times the 1x file, under public/assets/page-art/<path under assets/>@<k>x.webp.
 * The game never loads them. The page builders read the folder here and draw every picture with all
 * its files in a width-described srcset (sources()), so a browser takes the smallest file that
 * covers the drawn size at the screen's density.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { imageSize } from '../image-size.mjs';

export const PAGE_ART = 'assets/page-art';

/** The page art under pub, keyed by the 1x picture's public path: { src, w, h, k }. */
export function loadPageArt(pub) {
  const out = new Map();
  const base = join(pub, PAGE_ART);
  if (!existsSync(base)) return out;
  const walk = (dir, rel) => {
    for (const f of readdirSync(dir).sort()) {
      const abs = join(dir, f);
      if (statSync(abs).isDirectory()) { walk(abs, `${rel}${f}/`); continue; }
      const m = /^(.+)@(\d+)x\.webp$/.exec(f);
      if (!m) continue;
      const size = imageSize(abs);
      if (size) out.set(`assets/${rel}${m[1]}.webp`, { src: `${PAGE_ART}/${rel}${f}`, w: size.w, h: size.h, k: Number(m[2]) });
    }
  };
  walk(base, '');
  return out;
}

let cached = null;
/** loadPageArt(pub), read once per process. */
export function pageArt(pub) {
  if (!cached || cached.pub !== pub) cached = { pub, map: loadPageArt(pub) };
  return cached.map;
}

/**
 * Every file of a picture, smallest first: [{ src, w }]. pic: { src, w, hi?, hiW?, page? } as
 * tools/encyclopedia/data.mjs picture() returns it.
 */
export function sources(pic) {
  const list = [{ src: pic.src, w: pic.w }];
  if (pic.hi) list.push({ src: pic.hi, w: pic.hiW || pic.w * 3 });
  if (pic.page) list.push({ src: pic.page.src, w: pic.page.w });
  return list.sort((a, b) => a.w - b.w);
}

/**
 * The largest size a picture may be drawn at, as a scale of its 1x file: two device px per css px
 * when it has a 2x or sharper file (its @3x, its page art), one when it has only its 1x.
 */
export function sharpScale(pic) {
  const best = Math.max(...sources(pic).map((s) => s.w));
  return best >= pic.w * 2 ? best / (2 * pic.w) : best / pic.w;
}

/** The srcset and sizes attributes for a picture drawn w css px wide ('' when it has one file). */
export function srcsetAttrs(pic, w, prefix = '', escape = (s) => s) {
  const list = sources(pic);
  if (list.length < 2) return '';
  return ` srcset="${list.map((s) => `${prefix}${escape(s.src)} ${s.w}w`).join(', ')}" sizes="${w}px"`;
}
