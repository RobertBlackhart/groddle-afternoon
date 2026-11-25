/**
 * #659 (root R52): the Change Style tiles' pictures, painted once into one small canvas per tile.
 *
 * Each tile was a stack of <img> elements (two per layer, plus the field's tallest pieces): 300
 * images over 37 tiles, 73 full-size street decos (a 1648 px mountain drawn 31 px tall), about
 * 200 MB decoded, 161 of them under a CSS brightness filter, all rebuilt on every render of the
 * dialog. On an iPad (WebKit) every tile stayed blank while Chrome on Android drew them; Linux
 * WebKit draws them too, so the device's limit is the likely cause, not reproduced here. A canvas
 * per tile holds only its own pixels (a few hundred KB at 2x); each deco is loaded once per paint,
 * shrunk to the largest size a tile draws it, and let go when the tiles are painted.
 *
 * tileOps turns stylePreviewLayout (features/homes-feature.js: every length a percent of the
 * tile's height, `left` a percent of its width) into pixel ops in the same order the tile's
 * markup drew them; drawOps paints them (brightness as a black layer over the piece's own pixels,
 * which is what CSS brightness(l) does: each colour times l).
 */

/** Device pixels per CSS pixel the tiles are painted at, at most (sharp on a 3x phone, a third less memory). */
export const TILE_MAX_DPR = 2;
/** Decos loaded at once while tiles are painted. */
export const TILE_LOADS_AT_ONCE = 4;

const hex = (c) => `#${Number(c).toString(16).padStart(6, '0')}`;

/**
 * PURE: a layout ({ field, parts }, stylePreviewLayout) as pixel ops for a w x h canvas:
 * { rect: true, x, y, w, h, color, alpha } and { s, cx, bottom, h, flip, lum, alpha } (a deco
 * centred on cx, standing on `bottom`, h tall), back to front.
 */
export function tileOps(layout, w, h) {
  const y = (pct) => (pct * h) / 100;
  const ops = [];
  const piece = (p) => ({ s: p.s, cx: (p.left * w) / 100, bottom: h - y(p.bottom), h: y(p.height), flip: Boolean(p.flip), lum: p.lum ?? 1, alpha: p.alpha ?? 1 });
  for (const p of layout.parts.filter((q) => !q.near)) {
    if (p.band) ops.push({ rect: true, x: 0, y: h - y(p.bottom) - y(p.height), w, h: y(p.height), color: hex(p.color), alpha: p.alpha ?? 1 });
    else ops.push(piece(p));
  }
  ops.push({ rect: true, x: 0, y: h - y(layout.field), w, h: y(layout.field), color: hex(layout.fieldColor), alpha: 1 });
  for (const p of layout.parts.filter((q) => q.near)) ops.push(piece(p));
  return ops;
}

/** PURE: the tallest each deco is drawn over all these tiles' ops, in device pixels (s -> px). */
export function sourceHeights(opLists) {
  const need = new Map();
  for (const ops of opLists) {
    for (const op of ops) if (!op.rect && op.h > 0) need.set(op.s, Math.max(need.get(op.s) || 0, op.h));
  }
  return need;
}

/**
 * A loaded image shrunk by halves (each step a clean 2:1 average) to no less than `height` px tall:
 * { src, aspect }, src a canvas (or the image itself when it is small enough already).
 */
export function shrinkSource(img, height, makeCanvas) {
  const nw = img?.naturalWidth || img?.width || 0;
  const nh = img?.naturalHeight || img?.height || 0;
  if (!nw || !nh) return null;
  const want = Math.max(1, Math.ceil(height));
  let src = img;
  let w = nw;
  let h = nh;
  while (h / 2 >= want) {
    const c = makeCanvas(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
    const g = c.getContext('2d');
    if (!g) break;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(src, 0, 0, c.width, c.height);
    src = c;
    w = c.width;
    h = c.height;
  }
  return { src, aspect: nw / nh };
}

/** Paints ops into a canvas; sources (s -> { src, aspect }) may be missing, and then only the rects show. */
export function drawOps(canvas, ops, sources, makeCanvas) {
  const g = canvas.getContext('2d');
  if (!g) return false;
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  for (const op of ops) {
    if (op.rect) {
      g.globalAlpha = op.alpha;
      g.fillStyle = op.color;
      g.fillRect(op.x, op.y, op.w, op.h);
      continue;
    }
    const art = sources?.get(op.s);
    if (!art || !(op.h > 0)) continue;
    const dh = op.h;
    const dw = dh * art.aspect;
    let pic = art.src;
    if (op.lum < 0.98) {
      // CSS brightness(l): every colour times l, alpha kept. A black layer at 1 - l over the piece's own pixels.
      const c = makeCanvas(Math.max(1, Math.ceil(dw)), Math.max(1, Math.ceil(dh)));
      const s = c.getContext('2d');
      if (s) {
        s.imageSmoothingEnabled = true;
        s.imageSmoothingQuality = 'high';
        s.drawImage(art.src, 0, 0, c.width, c.height);
        s.globalCompositeOperation = 'source-atop';
        s.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, 1 - op.lum)).toFixed(3)})`;
        s.fillRect(0, 0, c.width, c.height);
        pic = c;
      }
    }
    g.save();
    g.globalAlpha = op.alpha;
    if (op.flip) {
      g.translate(op.cx, 0);
      g.scale(-1, 1);
      g.translate(-op.cx, 0);
    }
    g.drawImage(pic, op.cx - dw / 2, op.bottom - dh, dw, dh);
    g.restore();
  }
  g.globalAlpha = 1;
  return true;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`no art: ${url}`));
    img.src = url;
  });
}

/**
 * The tiles' canvases, one per look (kept across renders of the dialog, so a re-render paints
 * nothing again). canvasFor(look) is the tile's canvas; paint(entries, dpr) paints those whose
 * size changed: entries [{ look, layout }] with layout from stylePreviewLayout plus fieldColor.
 */
export function createTilePainter({ doc = globalThis.document, urlFor = (s) => s, load = loadImage, maxDpr = TILE_MAX_DPR, atOnce = TILE_LOADS_AT_ONCE } = {}) {
  const pics = new WeakMap();
  const makeCanvas = (w, h) => {
    const c = doc.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  };
  function canvasFor(look) {
    let pic = pics.get(look);
    if (!pic) {
      pic = { canvas: doc.createElement('canvas'), size: '', pending: '' };
      pic.canvas.className = 'hs-pic';
      pics.set(look, pic);
    }
    return pic.canvas;
  }
  async function paint(entries, dpr = 1) {
    const d = Math.min(maxDpr, Math.max(1, Number(dpr) || 1));
    const jobs = [];
    for (const { look, layout } of entries) {
      const pic = pics.get(look);
      const r = pic?.canvas.getBoundingClientRect?.();
      const w = Math.round((r?.width || 0) * d);
      const h = Math.round((r?.height || 0) * d);
      if (!pic || !w || !h) continue;
      const size = `${w}x${h}`;
      if (pic.size === size || pic.pending === size) continue;
      pic.pending = size;
      pic.canvas.width = w;
      pic.canvas.height = h;
      const ops = tileOps(layout, w, h);
      drawOps(pic.canvas, ops, null, makeCanvas); // the field and bands at once, the decos when they come
      jobs.push({ pic, ops, size });
    }
    if (!jobs.length) return 0;
    const need = sourceHeights(jobs.map((j) => j.ops));
    const names = [...need.keys()];
    const sources = new Map();
    let next = 0;
    const worker = async () => {
      while (next < names.length) {
        const s = names[next++];
        let img = null;
        try { img = await load(urlFor(s)); } catch { img = null; }
        const art = img ? shrinkSource(img, need.get(s), makeCanvas) : null;
        if (art) sources.set(s, art);
      }
    };
    await Promise.all(Array.from({ length: Math.min(atOnce, names.length) }, worker));
    for (const j of jobs) {
      if (j.pic.pending !== j.size) continue; // repainted at another size meanwhile
      drawOps(j.pic.canvas, j.ops, sources, makeCanvas);
      j.pic.size = j.size;
      j.pic.pending = '';
    }
    sources.clear();
    return jobs.length;
  }
  return { canvasFor, paint };
}
