/**
 * The placement tree of a SWF from FFDec's swf2xml dump: the stage, the main
 * timeline's first-frame placements and every DefineSprite's (frame 1 only),
 * each { id, depth, name, m: [a, b, c, d, tx, ty] } with tx, ty in px (the
 * XML's twips / 20). Line-based: FFDec indents a top-level tag 4 spaces and a
 * sprite's own tags 8, and writes a placement's MATRIX on the line after it.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FFDEC, JAVA } from '../vector-sprites/swf-labels.mjs';

/** swf2xml into `dir` once (cached by name); the XML text. */
export function swfXml(swf, dir) {
  mkdirSync(dir, { recursive: true });
  const out = join(dir, `${swf.split('/').pop().replace(/\.swf$/, '')}.xml`);
  if (!existsSync(out)) execFileSync(JAVA, ['-jar', FFDEC, '-swf2xml', swf, out], { stdio: 'ignore' });
  return readFileSync(out, 'utf8');
}

const num = (s, k, d = 0) => {
  const m = new RegExp(` ${k}="(-?[\\d.]+)"`).exec(s);
  return m ? Number(m[1]) : d;
};

function matrixOf(line) {
  if (!line || !/<matrix /.test(line)) return [1, 0, 0, 1, 0, 0];
  const scale = / hasScale="true"/.test(line);
  const rot = / hasRotate="true"/.test(line);
  return [
    scale ? num(line, 'scaleX', 1) : 1,
    rot ? num(line, 'rotateSkew0') : 0,
    rot ? num(line, 'rotateSkew1') : 0,
    scale ? num(line, 'scaleY', 1) : 1,
    num(line, 'translateX') / 20,
    num(line, 'translateY') / 20,
  ];
}

export function swfTree(xml) {
  const lines = xml.split('\n');
  const rect = /<displayRect [^>]*>/.exec(xml)[0];
  const stage = { w: (num(rect, 'Xmax') - num(rect, 'Xmin')) / 20, h: (num(rect, 'Ymax') - num(rect, 'Ymin')) / 20 };
  const sprites = new Map();
  const main = [];
  let sprite = null; // the DefineSprite whose tags we are in
  let frameDone = new Set(); // sprites (or 'main') past their first ShowFrame
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const top = line.startsWith('    <item ');
    const sub = line.startsWith('        <item ');
    if (top) {
      const m = /type="DefineSpriteTag".* spriteId="(\d+)"/.exec(line);
      sprite = m ? Number(m[1]) : null;
      if (sprite != null) sprites.set(sprite, []);
    }
    const owner = top ? 'main' : sub && sprite != null ? sprite : undefined;
    if (owner === undefined) continue;
    if (/type="ShowFrameTag"/.test(line)) { frameDone.add(owner); continue; }
    if (frameDone.has(owner)) continue;
    if (!/type="PlaceObject[23]?Tag"/.test(line)) continue;
    const id = /characterId="(\d+)"/.exec(line);
    if (!id) continue;
    const row = {
      id: Number(id[1]),
      depth: num(line, 'depth'),
      name: /name="([^"]*)"/.exec(line)?.[1] || '',
      m: / placeFlagHasMatrix="true"/.test(line) ? matrixOf(lines[i + 1]) : [1, 0, 0, 1, 0, 0],
      clip: / placeFlagHasClipDepth="true"/.test(line),
      color: / placeFlagHasColorTransform="true"/.test(line),
      filters: / placeFlagHasFilterList="true"/.test(line),
      blend: / placeFlagHasBlendMode="true"/.test(line),
    };
    (owner === 'main' ? main : sprites.get(owner)).push(row);
  }
  return { stage, main, sprites };
}

/** a ∘ b: b's matrix inside a's space. */
export function mul(a, b) {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}
