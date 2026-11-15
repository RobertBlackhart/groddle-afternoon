#!/usr/bin/env node
/**
 * Ladder gaps (#381, G826; G615 before it): ladders Tiny Speck drew from loose tile pieces (no
 * <tiling> block in the location XML) where the pieces leave a stretch with no rungs or posts, in
 * the 2012 files exactly as on our streets. Austin 2026-11-09 (G615, Harbinger Heath): add the
 * missing steps. This finds every such gap and writes the mends to public/js/ladder-gap-fixes.js,
 * which js/street-fixes.js adds to a street's middleground when it loads (the street files stay
 * what the source says).
 *
 *   node tools/ladder-gaps.mjs            list the gaps and write public/js/ladder-gap-fixes.js
 *   node tools/ladder-gaps.mjs --check    exit 1 if that file is stale (tests/street-fixes.test.js)
 *   node tools/ladder-gaps.mjs --list     list only
 *   node tools/ladder-gaps.mjs --measure  print LADDER_ART measured from the art (ImageMagick)
 *
 * A gap: two pieces on one ladder (x within 24 px of its zone) whose drawn parts (the art's opaque
 * rows, LADDER_ART) leave more than 1.5 px uncovered between them. A mend fills it with the
 * ladder's own centre piece at the street's scale, stacked as many times as fit, each squeezed or
 * stretched a little to fill the gap exactly, as G615's one step did.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { STREET_FIXES } from '../public/js/street-fixes.js?v=ec61843c';

/** The ladder tile pieces (the loose-piece kind; trunk, rock and vine-rope ladders are single art). */
export const LADDER_PIECE = /^(zutto_|firebog_|arbito_|groddle_)?ladder_(tile_|int_step$|interior_\dsteps$)/;

/**
 * Each piece's art: [width, height, first opaque row, opaque rows] in the image's own pixels
 * (assets/decos/groddle/<name>.webp; --measure prints it again).
 */
export const LADDER_ART = Object.freeze({
  arbito_ladder_tile_center_01_stone: [142, 100, 0, 100],
  arbito_ladder_tile_center_02_stone: [146, 100, 0, 98],
  arbito_ladder_tile_center_03_stone: [146, 100, 0, 100],
  firebog_ladder_tile_cap_0_vine: [36, 100, 0, 100],
  firebog_ladder_tile_cap_1_vine: [36, 100, 0, 100],
  firebog_ladder_tile_center_01_vine: [36, 100, 0, 100],
  groddle_ladder_tile_cap_1_basicWood: [120, 100, 0, 100],
  groddle_ladder_tile_center_00_basicWood: [120, 100, 0, 100],
  ladder_int_step: [144, 104, 0, 104],
  ladder_interior_2steps: [144, 196, 0, 196],
  ladder_interior_3steps: [144, 398, 0, 398],
  ladder_interior_4steps: [144, 392, 0, 392],
  ladder_tile_cap_00_cord: [56, 98, 0, 97],
  ladder_tile_cap_0_blue: [150, 100, 0, 100],
  ladder_tile_cap_0_bogwood: [144, 100, 0, 100],
  ladder_tile_cap_0_interior: [194, 100, 0, 95],
  ladder_tile_cap_0_stone: [140, 100, 0, 100],
  ladder_tile_cap_0_tree: [220, 100, 22, 78],
  ladder_tile_cap_1_blue: [148, 100, 0, 100],
  ladder_tile_cap_1_bogwood: [144, 100, 0, 100],
  ladder_tile_cap_1_interior: [194, 100, 0, 100],
  ladder_tile_cap_1_metal: [128, 100, 0, 100],
  ladder_tile_cap_1_stone: [150, 100, 0, 100],
  ladder_tile_cap_1_tree: [220, 100, 0, 86],
  ladder_tile_center_01_blue: [100, 100, 0, 100],
  ladder_tile_center_01_bogwood: [144, 100, 0, 100],
  ladder_tile_center_01_icy: [194, 100, 0, 100],
  ladder_tile_center_01_interior: [194, 100, 0, 100],
  ladder_tile_center_01_spine: [63, 100, 0, 100],
  ladder_tile_center_01_stake_left: [180, 100, 31, 49],
  ladder_tile_center_01_tree: [220, 100, 0, 100],
  ladder_tile_center_02_icy: [194, 100, 0, 100],
  ladder_tile_center_02_tree: [220, 100, 0, 100],
  ladder_tile_center_03_icy: [194, 100, 0, 100],
  ladder_tile_center_03_tree: [220, 100, 0, 100],
  ladder_tile_center_04_icy: [194, 100, 0, 100],
  ladder_tile_center_04_stone: [140, 100, 0, 100],
  ladder_tile_center_04_tree: [220, 100, 0, 100],
  ladder_tile_center_05_tree: [220, 100, 0, 100],
  ladder_tile_center_06_tree: [220, 100, 0, 100],
  zutto_ladder_tile_cap_0_tree: [260, 210, 0, 210],
  zutto_ladder_tile_cap_1_tree: [278, 218, 0, 218],
  zutto_ladder_tile_center_01_stone: [140, 100, 0, 100],
  zutto_ladder_tile_center_01_tree: [260, 150, 0, 150],
  zutto_ladder_tile_center_02_stone: [140, 100, 0, 100],
  zutto_ladder_tile_center_02_tree: [262, 202, 0, 202],
  zutto_ladder_tile_center_03_stone: [142, 110, 0, 110],
  zutto_ladder_tile_center_03_tree: [268, 194, 0, 194],
  zutto_ladder_tile_center_04_tree: [266, 184, 0, 184],
});

/** A deco's drawn part, top and bottom (street y, down is +): its box less the art's clear rows. */
export function drawnSpan(deco, art = LADDER_ART) {
  const a = art[deco.sprite];
  const top = deco.y - deco.h;
  if (!a) return [top, deco.y];
  const [, H, from, rows] = a;
  return [top + (deco.h * from) / H, top + (deco.h * (from + rows)) / H];
}

/** The ladder pieces on one ladder zone, lowest first, with their drawn spans. */
export function ladderPieces(street, ladder, art = LADDER_ART) {
  const top = ladder.y - ladder.h;
  const out = [];
  for (const layer of street.layers || []) {
    for (const deco of layer.decos || []) {
      if (!LADDER_PIECE.test(deco.sprite || '') || Math.abs(deco.x - ladder.x) > 24) continue;
      // A piece laid on its side (Kelba Vallu's vine rope) is no step of the ladder.
      const turn = ((Number(deco.r) || 0) % 360 + 540) % 360 - 180;
      if (Math.abs(turn) > 5) continue;
      const [pt, pb] = drawnSpan(deco, art);
      if (pb < top - 40 || pt > ladder.y + 40) continue;
      out.push({ layer: layer.id, deco, pt, pb });
    }
  }
  return out.sort((a, b) => b.pb - a.pb || a.pt - b.pt);
}

/** Every gap on a street: { ladder, layer, lower, upper, top, bottom } (street y). */
export function findLadderGaps(street, art = LADDER_ART) {
  const gaps = [];
  for (const ladder of street?.ladders || []) {
    if (ladder.tiling) continue;
    const pieces = ladderPieces(street, ladder, art);
    if (pieces.length < 2) continue;
    let covered = pieces[0].pt;
    let below = pieces[0];
    for (const p of pieces.slice(1)) {
      if (p.pb < covered - 1.5) gaps.push({ ladder, layer: p.layer, lower: below.deco, upper: p.deco, top: p.pb, bottom: covered });
      if (p.pt < covered) {
        covered = p.pt;
        below = p;
      }
    }
  }
  return gaps;
}

/** 'bogwood' of ladder_tile_cap_1_bogwood; the interior pieces' kind for ladder_int_step and ladder_interior_3steps. */
function pieceKind(sprite) {
  const m = /^((?:zutto_|firebog_|arbito_|groddle_)?)ladder_tile_(?:cap|center)_\d+_(.+)$/.exec(sprite);
  if (m) return { prefix: m[1], kind: m[2] };
  if (/^ladder_(int_step|interior_\dsteps)$/.test(sprite)) return { prefix: '', kind: 'interior' };
  return null;
}
const isCentre = (sprite) => /ladder_tile_center_/.test(sprite);

/**
 * The piece that fills a gap: a centre piece of the ladder (below the gap first), else the street's
 * own centre piece of the same kind, else that kind's first centre piece, else the piece below.
 */
export function fillerFor(street, gap, art = LADDER_ART) {
  if (isCentre(gap.lower.sprite)) return gap.lower.sprite;
  if (isCentre(gap.upper.sprite)) return gap.upper.sprite;
  const own = ladderPieces(street, gap.ladder, art).map((p) => p.deco.sprite).find(isCentre);
  if (own) return own;
  const k = pieceKind(gap.lower.sprite) || pieceKind(gap.upper.sprite);
  if (k) {
    const decos = (street.layers || []).flatMap((l) => l.decos || []);
    const same = decos.map((d) => d.sprite).find((s) => isCentre(s) && pieceKind(s)?.kind === k.kind && pieceKind(s)?.prefix === k.prefix && art[s]);
    if (same) return same;
    const first = `${k.prefix}ladder_tile_center_01_${k.kind}`;
    if (art[first]) return first;
  }
  return gap.lower.sprite;
}

/** The deco rows that mend one gap (ids `fix_g826_<ladder>_<n>`). */
export function mendGap(street, gap, n0 = 0, art = LADDER_ART) {
  const sprite = fillerFor(street, gap, art);
  const a = art[sprite];
  const decos = (street.layers || []).flatMap((l) => l.decos || []);
  const like = decos.find((d) => d.sprite === sprite) || null;
  // The street's scale for that art: as it is drawn there, else as the piece below is.
  const la = art[gap.lower.sprite];
  const scale = like ? like.h / a[1] : la ? gap.lower.h / la[1] : 0.5;
  const drawnH = (a[3] * scale) || 1;
  const height = gap.bottom - gap.top;
  const count = Math.max(1, Math.round(height / drawnH));
  const each = height / count;
  const boxH = (each * a[1]) / a[3];
  const w = Math.round(a[0] * scale * 10) / 10;
  const rows = [];
  for (let i = 0; i < count; i += 1) {
    const segBottom = gap.bottom - i * each;
    const y = segBottom + (boxH * (a[1] - a[2] - a[3])) / a[1];
    const row = {
      id: `fix_g826_${gap.ladder.id}_${n0 + i}`,
      sprite,
      x: gap.lower.x,
      y: Math.round(y * 10) / 10,
      w,
      h: Math.round(boxH * 10) / 10,
      z: Math.min(gap.lower.z ?? 0, gap.upper.z ?? 0),
      r: gap.lower.r || 0,
    };
    if (like?.flip) row.flip = true;
    rows.push(row);
  }
  return rows;
}

/** { tsid: { label, gaps: [...], decos: [...] } } for every street with a gap. */
export function ladderGapFixes(streetsDir, art = LADDER_ART) {
  const out = {};
  for (const f of readdirSync(streetsDir).filter((n) => /^G.*\.json$/.test(n)).sort()) {
    const street = JSON.parse(readFileSync(join(streetsDir, f), 'utf8'));
    // A gap a hand fix already mends (G615, Harbinger Heath) is not found again.
    const mg = (street.layers || []).find((l) => l.id === 'middleground');
    if (mg) mg.decos = [...(mg.decos || []), ...(STREET_FIXES[street.tsid]?.decos || [])];
    const gaps = findLadderGaps(street, art);
    if (!gaps.length) continue;
    const decos = [];
    const perLadder = new Map();
    for (const gap of gaps) {
      const n0 = perLadder.get(gap.ladder.id) || 0;
      const rows = mendGap(street, gap, n0, art);
      perLadder.set(gap.ladder.id, n0 + rows.length);
      decos.push(...rows);
    }
    out[street.tsid] = { label: street.label, gaps, decos };
  }
  return out;
}

function render(fixes) {
  const lines = [
    '/**',
    ' * GENERATED by tools/ladder-gaps.mjs (do not edit): the missing steps of ladders Tiny Speck drew',
    ' * from loose tile pieces with gaps between them (#381, G826; the 2012 location files have the same',
    ' * gaps). Austin 2026-11-09 (G615): add the missing steps. js/street-fixes.js adds these rows to a',
    " * street's middleground when it loads. Each gap: ladder id, the gap's top and bottom (street y).",
    ' */',
    'export const LADDER_GAP_FIXES = Object.freeze({',
  ];
  for (const [tsid, fix] of Object.entries(fixes)) {
    lines.push(`  // ${fix.label}: ${fix.gaps.map((g) => `${g.ladder.id} ${Math.round(g.top)}..${Math.round(g.bottom)}`).join(', ')}`);
    lines.push(`  ${tsid}: Object.freeze([`);
    for (const d of fix.decos) {
      const fields = Object.entries(d).map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`);
      lines.push(`    Object.freeze({ ${fields.join(', ')} }),`);
    }
    lines.push('  ]),');
  }
  lines.push('});', '');
  return lines.join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const pub = join(root, 'public');
  const target = join(pub, 'js/ladder-gap-fixes.js');
  const args = new Set(process.argv.slice(2));
  if (args.has('--measure')) {
    const dir = join(pub, 'assets/decos/groddle');
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.webp') && !n.includes('@')).sort()) {
      const name = f.slice(0, -5);
      if (!LADDER_PIECE.test(name)) continue;
      const o = execFileSync('magick', [join(dir, f), '-format', '%w %h %@', 'info:']).toString().trim();
      const [w, h, box] = o.split(' ');
      const [, rows, from] = /^\d+x(\d+)\+\d+\+(\d+)$/.exec(box) || [];
      console.log(`  ${name}: [${w}, ${h}, ${from}, ${rows}],`);
    }
    process.exit(0);
  }
  const fixes = ladderGapFixes(join(pub, 'assets/streets'));
  if (!args.has('--check')) {
    let n = 0;
    for (const [tsid, fix] of Object.entries(fixes)) {
      for (const g of fix.gaps) {
        n += 1;
        console.log(`${tsid} ${fix.label}: ${g.ladder.id} x ${g.ladder.x}, ${Math.round(g.bottom - g.top)} px at ${Math.round(g.top)}..${Math.round(g.bottom)} (${g.lower.sprite} below, ${g.upper.sprite} above)`);
      }
    }
    console.log(`${n} gaps on ${Object.keys(fixes).length} streets`);
  }
  if (args.has('--list')) process.exit(0);
  const text = render(fixes);
  if (args.has('--check')) {
    const now = existsSync(target) ? readFileSync(target, 'utf8') : '';
    if (now !== text) {
      console.error('public/js/ladder-gap-fixes.js is stale: run node tools/ladder-gaps.mjs');
      process.exit(1);
    }
    console.log('public/js/ladder-gap-fixes.js is current');
  } else {
    writeFileSync(target, text);
    console.log('wrote public/js/ladder-gap-fixes.js');
  }
}
