/**
 * R12 (#512, #523): where an item's art stood in Glitch. The client drew an item SWF with the
 * bottom centre of its whole stage on the item's x,y (LocationItemstackView.as 853-854: the view at
 * -round(mc_w / 2), -mc_h), mc_w / mc_h the header's size rounded (ItemSSManager.as 512-513).
 * The OGA x1 frames are cut to what is drawn, so the stage they came from is read here from the
 * SWF: its header, and the bounds of what its first frame places (shape, text and morph bounds
 * through every sprite's first frame and each placement's matrix; masks are left out).
 *
 *   swfStage(file)                 { w, h, mcW, mcH, bounds: { x0, x1, y0, y1 } } in px
 *   stageFoot(file, frameW, frameH) [x, y]: the item's x,y in a frame cut to those bounds
 *
 * No dependencies: tools/build-homes.mjs and the tests read it.
 */
import { readFileSync } from 'node:fs';
import zlib from 'node:zlib';

class Bits {
  constructor(buf, byte) { this.buf = buf; this.p = byte * 8; }
  u(n) {
    let v = 0;
    for (let i = 0; i < n; i += 1) {
      v = v * 2 + ((this.buf[this.p >> 3] >> (7 - (this.p & 7))) & 1);
      this.p += 1;
    }
    return v;
  }
  s(n) {
    if (!n) return 0;
    const v = this.u(n);
    return v >= 2 ** (n - 1) ? v - 2 ** n : v;
  }
  align() { this.p = Math.ceil(this.p / 8) * 8; }
  get byte() { return this.p >> 3; }
}

function rect(bits) {
  const n = bits.u(5);
  const r = [bits.s(n), bits.s(n), bits.s(n), bits.s(n)]; // xmin xmax ymin ymax, twips
  bits.align();
  return r;
}

function matrix(bits) {
  let a = 1, b = 0, c = 0, d = 1;
  if (bits.u(1)) { const n = bits.u(5); a = bits.s(n) / 65536; d = bits.s(n) / 65536; }
  if (bits.u(1)) { const n = bits.u(5); b = bits.s(n) / 65536; c = bits.s(n) / 65536; }
  const n = bits.u(5);
  const tx = bits.s(n);
  const ty = bits.s(n);
  return [a, b, c, d, tx, ty];
}

function* tags(buf, pos, end) {
  while (pos < end) {
    const head = buf.readUInt16LE(pos);
    pos += 2;
    const code = head >> 6;
    let len = head & 63;
    if (len === 63) { len = buf.readUInt32LE(pos); pos += 4; }
    yield { code, pos, len };
    pos += len;
    if (code === 0) return;
  }
}

/** The display list after the first ShowFrame of a timeline: depth -> { id, m, clip }. */
function firstFrame(buf, pos, end) {
  const list = new Map();
  for (const { code, pos: p } of tags(buf, pos, end)) {
    if (code === 1) break;
    if (code === 26 || code === 70) {
      const f = buf[p];
      let q = p + 1;
      const f2 = code === 70 ? buf[q++] : 0;
      const depth = buf.readUInt16LE(q);
      q += 2;
      if (code === 70 && ((f2 & 0x08) || ((f2 & 0x10) && (f & 0x02)))) {
        while (buf[q] !== 0) q += 1;
        q += 1;
      }
      let cur = list.get(depth) || {};
      if (f & 0x02) { cur = { id: buf.readUInt16LE(q), m: [1, 0, 0, 1, 0, 0] }; q += 2; }
      if (f & 0x04) cur.m = matrix(new Bits(buf, q));
      if (f & 0x40) cur.clip = true;
      list.set(depth, cur);
    } else if (code === 28) list.delete(buf.readUInt16LE(p + 2));
    else if (code === 5) list.delete(buf.readUInt16LE(p));
  }
  return list;
}

const BOUNDED = new Set([2, 22, 32, 83, 46, 84, 11, 33]); // DefineShape1-4, DefineMorphShape1-2, DefineText1-2

/** The stage and what its first frame draws, in px. */
export function swfStage(file) {
  const raw = readFileSync(file);
  const sig = raw.toString('ascii', 0, 3);
  if (sig !== 'FWS' && sig !== 'CWS') throw new Error(`${file}: unsupported SWF signature ${sig}`);
  const body = sig === 'CWS' ? zlib.inflateSync(raw.subarray(8)) : raw.subarray(8);
  const buf = Buffer.concat([Buffer.alloc(8), body]);
  const head = new Bits(buf, 8);
  const [sx0, sx1, sy0, sy1] = rect(head);
  const start = head.byte + 4;
  const bounds = new Map();
  const sprites = new Map();
  for (const { code, pos, len } of tags(buf, start, buf.length)) {
    if (BOUNDED.has(code)) bounds.set(buf.readUInt16LE(pos), rect(new Bits(buf, pos + 2)));
    else if (code === 39) sprites.set(buf.readUInt16LE(pos), firstFrame(buf, pos + 4, pos + len));
  }
  const box = (list, m) => {
    let out = null;
    for (const depth of [...list.keys()].sort((x, y) => x - y)) {
      const e = list.get(depth);
      if (e.id == null || e.clip) continue;
      const [a, b, c, d, tx, ty] = e.m;
      const [A, B, C, D, TX, TY] = m;
      const t = [A * a + C * b, B * a + D * b, A * c + C * d, B * c + D * d, A * tx + C * ty + TX, B * tx + D * ty + TY];
      let r = null;
      if (bounds.has(e.id)) {
        const [x0, x1, y0, y1] = bounds.get(e.id);
        const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [t[0] * x + t[2] * y + t[4], t[1] * x + t[3] * y + t[5]]);
        r = [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
      } else if (sprites.has(e.id)) r = box(sprites.get(e.id), t);
      if (r) out = out ? [Math.min(out[0], r[0]), Math.max(out[1], r[1]), Math.min(out[2], r[2]), Math.max(out[3], r[3])] : r;
    }
    return out;
  };
  const r = box(firstFrame(buf, start, buf.length), [1, 0, 0, 1, 0, 0]);
  const w = (sx1 - sx0) / 20;
  const h = (sy1 - sy0) / 20;
  return {
    w,
    h,
    mcW: Math.round(w),
    mcH: Math.round(h),
    bounds: r ? { x0: r[0] / 20, x1: r[1] / 20, y0: r[2] / 20, y1: r[3] / 20 } : null,
  };
}

/**
 * The item's x,y (the stage's bottom centre as the client placed it) in a frame of frameW x frameH
 * cut to the drawn bounds: centred across them, and from their bottom down.
 */
export function stageFoot(file, frameW, frameH) {
  const { mcW, mcH, bounds } = swfStage(file);
  const x = frameW / 2 + Math.round(mcW / 2) - (bounds.x0 + bounds.x1) / 2;
  const y = frameH + mcH - bounds.y1;
  return [Math.round(x * 100) / 100, Math.round(y * 100) / 100];
}
