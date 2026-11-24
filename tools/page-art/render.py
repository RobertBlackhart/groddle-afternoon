"""Page art: sharp renders of small pictures for the Encyclopedia and the Item catalog.

Austin 2026-11-23: "The butterfly in the encyclopedia is really blurry." The pages draw small
pictures bigger than their files: a tile draws a pack icon up to three times its 1x size, an
item page's hero up to 4.2 times (hero.mjs), a creature's still up to three times. The pack
icons' @3x files are true 3x renders, but 3x of an 18 px bean is 54 px, and the bean's tile is
48 css px (2 to 3 device px each on a phone), its hero 76. So the pages get a picture of their
own, rendered from the same CC0 vector art (tinyspeck/glitch-items SWFs) at k times the 1x
file, never loaded by the game (its textures keep their 1x/3x files and budgets):

    public/assets/page-art/<path under assets/ without .webp>@<k>x.webp

k = min(9, ceil(416 / long side of the 1x file)): 416 is two device px for every css px of the
largest box the pages draw a picture in (the hero, 208 css px), and 9 covers the hero's 4.2x
upscale at two device px each. A picture whose @3x already reaches 416 needs none.

Each render is checked against the sharpest raster the game already ships for it (its @3x,
else its 1x; aspect within 12%, RMSE of the render shrunk to that size at most MAX_DIFF, on
white and on black) and placed exactly as tools/icon-hires/hires.py places a 3x icon: the
trimmed render scaled to k times the 1x file's trim box, on a canvas exactly k times the 1x
canvas, so every srcset candidate frames the picture the same way. Lossy WebP at quality 90
with lossless alpha (the pages only: tools/vector-sprites' "lossy" manifests do the same).

The plan (tools/page-art/plan.json) maps a 1x picture's path under public/ to its vector
source, with hires.py's keys (swf, frame, sprite, swap, flop), or {"copy": "<path>"} for a
picture that is a byte copy of another's (the lost artifacts show the Large Petrified Rock).
{"by": "<tool>", "pin": true} marks a picture another tool draws (the quoin icons have no vectors:
tools/quoin-art/page.mjs renders them from the hand-traced quoin SVGs). {"refused": "<why>", "pin": true} keeps a render checked by eye and refused out of later runs. A row may set `k` (its density, else k_for) and `max_diff` (a render checked by eye whose
filters or shadow shift it past MAX_DIFF).

    python3 -I tools/page-art/render.py --plan                 regenerate the pack-icon rows of plan.json
    python3 -I tools/page-art/render.py WORKDIR [--write] [path ...]

Without --write the renders go to WORKDIR/page; WORKDIR/report.json lists each with its diff.
"""
import json, math, os, re, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
SPIKE = os.path.normpath(os.path.join(HERE, '../..'))
sys.path.insert(0, os.path.join(SPIKE, 'tools/icon-hires'))
import hires  # noqa: E402  (box, diff, ffdec: the 3x icon pipeline)
import swfinfo  # noqa: E402

PUB = os.path.join(SPIKE, 'public')
ICONS = 'assets/sprites/icons'
OUT = 'assets/page-art'
PLAN = os.environ.get('PAGE_ART_PLAN') or os.path.join(HERE, 'plan.json')  # PAGE_ART_PLAN: try another plan
ITEMS = os.path.expanduser('~/Documents/glitch-audit/glitch-items')
PAGE_SIDE = 416   # two device px per css px of the hero box (tools/catalog/hero.mjs HERO_BOX 208)
K_MAX = 9         # the hero's 4.2x upscale of a small 1x icon, at two device px
MAX_DIFF = 0.12
QUALITY = 90
ZOOMS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64]


def k_for(w, h):
    """The density a 1x picture of w x h needs, or 0 when its @3x is already enough."""
    k = min(K_MAX, math.ceil(PAGE_SIDE / max(w, h, 1)))
    return k if k > 3 else 0


def out_path(src, k):
    """public-relative path of a picture's page art: assets/page-art/<rest>@<k>x.webp."""
    assert src.startswith('assets/'), src
    return f'{OUT}/{src[len("assets/"):-len(".webp")]}@{k}x.webp'


def quantize(z):
    return next((q for q in ZOOMS if q >= z), ZOOMS[-1])


def swf_index():
    found = {}
    for d, _, files in os.walk(ITEMS):
        for f in sorted(files):
            if f.endswith('.swf'):
                found.setdefault(f[:-4], []).append(os.path.join(d, f))
    return found


def tilde(p):
    home = os.path.expanduser('~')
    return '~' + p[len(home):] if p.startswith(home) else p


def make_plan():
    """Pack icons whose @3x falls short of PAGE_SIDE: their vector source from hires.py's plan,
    else the item's own SWF (its `iconic` frame when it has one; a *_broken tool's
    broken_iconic). Rows for other pictures (not under the icons folder) are kept as written."""
    old = json.load(open(PLAN)) if os.path.exists(PLAN) else {}
    hp = json.load(open(os.path.join(SPIKE, 'tools/icon-hires/plan.json')))
    sys.path.insert(0, os.path.join(SPIKE, 'tools'))
    swfs = swf_index()
    rock = f'{ICONS}/petrified_rock_large.webp'
    rock_bytes = open(os.path.join(PUB, rock), 'rb').read()
    plan, missing = {k: v for k, v in old.items() if not k.startswith(ICONS + '/')}, []
    files = sorted(os.listdir(os.path.join(PUB, ICONS)))
    for f in files:
        if '@' in f or not f.endswith('.webp'):
            continue
        i, src = f[:-5], f'{ICONS}/{f}'
        w, h = hires.box(os.path.join(PUB, src))[4:6]
        if not k_for(w, h):
            continue
        row = old.get(src)
        if row and row.get('pin'):
            plan[src] = row; continue
        if src != rock and open(os.path.join(PUB, src), 'rb').read() == rock_bytes:
            plan[src] = {'copy': rock}; continue
        if i in hp:
            plan[src] = {k: v for k, v in hp[i].items() if k in ('swf', 'frame', 'sprite', 'swap', 'flop', 'zoom')}
            plan[src].pop('zoom', None)
            continue
        base, frame = i, None
        if i not in swfs and i.endswith('_broken') and i[:-7] in swfs:
            base, frame = i[:-7], 'broken_iconic'
        if base not in swfs:
            missing.append(i); continue
        cands = swfs[base]
        swf = next((c for c in cands if os.path.basename(os.path.dirname(c)) == base), cands[0])
        if frame is None:
            info = swfinfo.read(swf)
            frame = 'iconic' if 'iconic' in {**info['labels'], **info['scenes']} else 1
        plan[src] = {'swf': tilde(swf), **({'frame': frame} if frame != 1 else {})}
    json.dump(dict(sorted(plan.items())), open(PLAN, 'w'), indent=1)
    open(PLAN, 'a').write('\n')
    print(f'{len(plan)} rows in {PLAN}; no vector source for {len(missing)}: {" ".join(missing)}')


def export_all(jobs, work, tag):
    """hires.export, its root-frame groups and sprite jobs run four at a time."""
    groups = {}
    for i, j in jobs:
        groups.setdefault(('s', i) if j.get('sprite') else (j['zoom'], j['frame']), []).append((i, j))
    found = {}
    with ThreadPoolExecutor(4) as pool:
        for part in pool.map(lambda g: hires.export(g, work, tag), groups.values()):
            found.update(part)
    return found


def encode(png, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = f'{dst}.tmp-{os.getpid()}.webp'
    subprocess.run(['cwebp', '-quiet', '-q', str(QUALITY), '-alpha_q', '100', '-m', '6', '-exact',
                    '-metadata', 'none', png, '-o', tmp], check=True)
    os.replace(tmp, dst)


def ref_of(src):
    """The sharpest raster shipped for a picture: its @3x sibling, else itself."""
    hi = src[:-5] + '@3x.webp'
    return hi if os.path.exists(os.path.join(PUB, hi)) else src


def run(work, write, only):
    plan = json.load(open(PLAN))
    if only:
        plan = {s: p for s, p in plan.items() if s in only}
    work = os.path.abspath(work)
    os.makedirs(os.path.join(work, 'swf'), exist_ok=True)
    root = PUB if write else os.path.join(work, 'page')
    report, jobs, meta = {}, [], {}
    for src, p in sorted(plan.items()):
        one = os.path.join(PUB, src)
        if not os.path.exists(one):
            report[src] = {'ok': False, 'why': 'no 1x picture'}; continue
        ow, oh, ox, oy, w, h = hires.box(one)
        k = p.get('k') or k_for(w, h)
        if not k:
            report[src] = {'ok': False, 'why': 'its @3x is enough'}; continue
        if p.get('refused'):
            report[src] = {'ok': False, 'why': f'refused: {p["refused"]}'}; continue
        if p.get('copy') or p.get('by'):
            continue  # a copy is made below; `by` names the tool that draws it (quoins: tools/quoin-art/page.mjs)
        swf = os.path.expanduser(p['swf'])
        info = swfinfo.read(swf)
        frame = p.get('frame', 1)
        if not isinstance(frame, int):
            names = info['sprites'].get(p['sprite'], {}).get('labels', {}) if p.get('sprite') else {**info['labels'], **info['scenes']}
            frame = names.get(frame)
            if not frame:
                report[src] = {'ok': False, 'why': f'no label {p["frame"]!r}'}; continue
        i = re.sub(r'[^a-z0-9_]+', '_', src[len('assets/'):-5].lower())
        rw = os.path.join(work, 'swf', f'{i}.swf')
        swfinfo.rewrite(swf, rw, pad=1.0, swaps=p.get('swap'))
        sw, sh = info['stage']
        zoom = p.get('zoom') or quantize(math.ceil(1.1 * k * max(ow / max(sw, 1), oh / max(sh, 1))))
        jobs.append((i, {'swf': rw, 'frame': frame, 'zoom': zoom, 'sprite': p.get('sprite')}))
        meta[i] = dict(src=src, k=k, box=(ow, oh, ox, oy, w, h), flop=bool(p.get('flop')), max_diff=p.get('max_diff', MAX_DIFF))
        report[src] = {'swf': tilde(swf), 'frame': frame, 'k': k}
    renders = export_all(jobs, work, 'a')
    again = []
    for i, j in jobs:
        r = renders.get(i) and hires.box(renders[i])
        m = meta[i]
        need = (m['k'] * m['box'][0], m['k'] * m['box'][1])
        if r and r[0] >= 3 and r[1] >= 3 and (r[0] < need[0] or r[1] < need[1]) and j['zoom'] < ZOOMS[-1]:
            again.append((i, {**j, 'zoom': quantize(math.ceil(j['zoom'] * 1.1 * max(need[0] / r[0], need[1] / r[1])))}))
    renders.update(export_all(again, work, 'b'))
    for i, j in jobs:
        m = meta[i]
        src, k, (ow, oh, ox, oy, w, h) = m['src'], m['k'], m['box']
        rep = report[src]
        png = renders.get(i)
        r = png and hires.box(png)
        if not r or r[0] < 3 or r[1] < 3:
            rep.update(ok=False, why='empty render'); continue
        ref = os.path.join(PUB, ref_of(src))
        rb = hires.box(ref)
        aspect = abs(r[0] / r[1] - ow / oh) / (ow / oh)
        d = hires.diff(png, ref, rb[0], rb[1], m['flop'])
        rep.update(render=[r[0], r[1]], aspect=round(aspect, 3), diff=d, against=ref_of(src), png=png)
        if r[0] < k * ow or r[1] < k * oh:
            rep.update(ok=False, why=f'render {r[0]}x{r[1]} smaller than {k}x the picture'); continue
        if aspect > 0.12:
            rep.update(ok=False, why=f'aspect: picture {ow}x{oh}, render {r[0]}x{r[1]}'); continue
        if d > m['max_diff']:
            rep.update(ok=False, why=f'art differs (diff {d})'); continue
        dst = os.path.join(root, out_path(src, k))
        tmp = os.path.join(work, f'{i}.page.png')
        subprocess.run(['magick', png, *(['-flop'] if m['flop'] else []), '-trim', '+repage', '-filter', 'Lanczos',
                        '-resize', f'{ow * k}x{oh * k}!', '-background', 'none', '-gravity', 'NorthWest',
                        '-extent', f'{w * k}x{h * k}-{ox * k}-{oy * k}', '-strip', tmp], check=True)
        encode(tmp, dst)
        os.unlink(tmp)
        rep.update(ok=True, out=out_path(src, k))
    for src, p in sorted(plan.items()):
        if not p.get('copy') or src not in plan:
            continue
        w, h = hires.box(os.path.join(PUB, src))[4:6]
        k = p.get('k') or k_for(w, h)
        frm = os.path.join(root, out_path(p['copy'], k))
        if not os.path.exists(frm):
            report[src] = {'ok': False, 'why': f'copy: {out_path(p["copy"], k)} not rendered'}; continue
        dst = os.path.join(root, out_path(src, k))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(frm, dst)
        report[src] = {'ok': True, 'copy': p['copy'], 'out': out_path(src, k)}
    json.dump(report, open(os.path.join(work, 'report.json'), 'w'), indent=1)
    ok = [s for s, r in report.items() if r.get('ok')]
    print(f'{len(ok)} page renders, {len(report) - len(ok)} rejected')
    for s, r in sorted(report.items()):
        if not r.get('ok'):
            print('  --', s, r.get('diff', ''), r.get('why', ''))


if __name__ == '__main__':
    args = sys.argv[1:]
    if args == ['--plan']:
        make_plan()
    else:
        rest = [a for a in args[1:] if a != '--write']
        run(args[0], '--write' in args[1:], set(rest))
