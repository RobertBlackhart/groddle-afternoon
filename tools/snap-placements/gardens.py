#!/usr/bin/env python3.11
"""Street garden beds and the scarecrow measured from players' full-street snaps (G940, report #469).

Tiny Speck's 2012 location files say how many Gardens a street had (street-ecology.json
counts.garden), never where, how big or of which kind: each garden_new was set by hand with its own
width, height and garden_type (items/garden_new.js instanceProps, 27-29), and the remake planned at
most two beds anywhere on the street. The players' snaps show every one.

Evidence: the Eleven Giants project's full-street snaps from Nov-Dec 2012
(research/eleven-snaps/<region>/<collector>/<Street Name>_<collector>.png, see its README), 1 px =
1 street px with the top left at the street's bounds l, t: the space the game draws in
(street-model.js platformsScreen). Reference only: no snap pixel is ever copied into the repo. What
this writes are positions and sizes read from them, which are facts.

GUIDE below is read by eye off a zoomed crop of each snap: per bed the left edge of its front-left
plot and the bottom of its front row (about 5 px), the plots across and deep (counted), the kind the
snap shows and the bed art. Every street's plots add up to Zog's Glitchy Tools 2012 count for it
(research/coverage/deep-dive-2026-10-27/zoggish-hub-objects-2012.tsv, "Crop Garden plots": Middle
Arbor 63, Community Gardens 62, Mmumawwa Wala 27), which also says each is a crop garden: Zog lists
herb garden plots only on the three Herb Gardens streets. Where a bed has nothing growing the kind
cannot be seen, so it follows Zog (crop), or GSJS's default garden_type where Zog has no row (Egret
Taun Towers Basement).

The measurer then fits each bed: it draws the bed as the game does (js/garden-view.js gardenLayout
at GARDEN_SCALE 0.7, GardenView.as build: each plot's base, our CC0 garden_new art, on the snap's own
ground colour, plus the bed art for a framed bed) and slides it over the snap within SEARCH px by
normalized cross-correlation of how much darker than the ground each pixel is (soil is, plants and
seeds are not), so a bed's spot is where its plots are, to the pixel. The
scarecrow (npc_gardening_vendor) is fitted the same way with our CC0 idle frame
(assets/sprites/vendors/npc_gardening_vendor_idle.webp, frame 0).

Each bed is written as [x, y, cols, rows, kind, style]: x, y the bed's foot as game.js spawnGarden
takes it (the centre of the bed's box, plants left out, and its bottom), kind 'crop' or 'herb',
style the garden_new bed art ('none': bare plots, as on most streets; 'strip_1': the wooden frame on
Doonboggle Trail). The vendor is [x, y], its feet. A fit at least FIT_MIN sure, inside the search, moves the
bed off the guide ('fit'); else the guide stands ('eye': plants hide most of a busy bed's soil). The
scarecrow's fit must reach VENDOR_MIN.

The game reads public/js/garden-spots-data.js, written from the JSON here (js/garden-beds.js).

Usage (python3.11 has numpy + Pillow):
  python3.11 -I tools/snap-placements/gardens.py            fit, write garden-spots.json and js/garden-spots-data.js
  python3.11 -I tools/snap-placements/gardens.py --check    exit 1 when the .js does not match the .json (no snaps needed)
  python3.11 -I tools/snap-placements/gardens.py --crops <dir>   also save each street's beds outlined on its snap (local only)
With no research/eleven-snaps beside the repo (a public clone) it says so and writes nothing.
"""
import argparse, json, math, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SNAPS = os.path.join(ROOT, '..', 'research', 'eleven-snaps')
OUT = os.path.join(ROOT, 'public', 'assets', 'content', 'garden-spots.json')
JS_OUT = os.path.join(ROOT, 'public', 'js', 'garden-spots-data.js')
ART = os.path.join(ROOT, 'public', 'js', 'garden-art.js')

SCALE = 0.7  # garden-view.js GARDEN_SCALE
SEARCH = (30, 22)  # px either way, x and y, around the guide
FIT_MIN = 0.55  # a bed's fit at least this sure moves it off the guide
VENDOR_MIN = 0.6
# vendor-npcs.js VENDOR_NPC_ART.npc_gardening_vendor: idle crop 155 x 183 at (15, 15) of a 178 px cell;
# vendorAnchor puts the feet at the cell's centre (74 px into the crop) and the crop's bottom.
VENDOR_FRAME = (155, 183)
VENDOR_FOOT_X = 178 / 2 - 15

# Hand-read: [front-left plot's left x, front row's bottom y, cols, rows, kind, style, base art].
GUIDE = {
    'GCR101UN0NJ1QPQ': {  # Middle Arbor (report #469): 3 beds by 'All may plant', 1 past the mailbox, 4 by 'Free to plant'
        'snap': 'Groddle Forest/cleops/Middle Arbor_cleops.png',
        'plots2012': 63,
        'beds': [
            [428, 703, 4, 3, 'crop', 'none', 'wet'],
            [790, 733, 2, 2, 'crop', 'none', 'wet'],
            [1067, 748, 3, 3, 'crop', 'none', 'wet'],
            [1970, 823, 2, 1, 'crop', 'none', 'wet'],
            [3302, 913, 3, 2, 'crop', 'none', 'wet'],
            [3657, 943, 4, 3, 'crop', 'none', 'wet'],
            [4330, 945, 3, 3, 'crop', 'none', 'wet'],
            [4777, 932, 3, 3, 'crop', 'none', 'wet'],
        ],
        'vendor': [4140, 930],
    },
    'GCR101NQ4BU1SKS': {  # Community Gardens
        'snap': 'Groddle Heights/mackenzie/Community Gardens_mackenzie.png',
        'plots2012': 62,
        'beds': [
            [925, 583, 3, 1, 'crop', 'none', 'wet'],
            [1303, 541, 4, 1, 'crop', 'none', 'wet'],
            [1655, 595, 2, 2, 'crop', 'none', 'wet'],
            [2045, 677, 3, 2, 'crop', 'none', 'wet'],
            [2422, 655, 4, 3, 'crop', 'none', 'wet'],
            [3228, 720, 4, 3, 'crop', 'none', 'wet'],
            [3677, 750, 3, 3, 'crop', 'none', 'wet'],
            [4030, 718, 3, 2, 'crop', 'none', 'wet'],
            [4305, 768, 2, 1, 'crop', 'none', 'wet'],
            [4475, 805, 2, 2, 'crop', 'none', 'wet'],
        ],
        'vendor': [2950, 655],
    },
    'GIFCNFNEJRG2ON4': {  # Mmumawwa Wala
        'snap': 'Vantalu/zoi/Mmumawwa Wala_zoi.png',
        'plots2012': 27,
        'beds': [
            [580, 762, 2, 2, 'crop', 'none', 'wet'],
            [1130, 663, 4, 2, 'crop', 'none', 'wet'],
            [2762, 853, 3, 2, 'crop', 'none', 'wet'],
            [4190, 900, 3, 3, 'crop', 'none', 'wet'],
        ],
        'vendor': [2535, 862],
    },
    'GHVEI9NVJ203LRO': {  # Egret Taun Towers Basement: three bare beds under the grow lamps
        'snap': 'Besara/cleops/Egret Taun Towers Basement_cleops.png',
        'plots2012': None,
        'beds': [
            [182, 524, 4, 3, 'crop', 'none', 'wet'],
            [712, 526, 4, 3, 'crop', 'none', 'wet'],
            [2002, 526, 4, 3, 'crop', 'none', 'wet'],
        ],
        'vendor': None,
    },
    'GA94GCF7H3D30IM': {  # Doonboggle Trail: the tutorial's framed bed (features/newxp-feature.js)
        'snap': 'Gentle Island/zoi/Doonboggle Trail_zoi.png',
        'plots2012': None,
        'beds': [
            [1297, 1381, 4, 2, 'crop', 'strip_1', 'dry'],
        ],
        'vendor': None,
    },
}


def garden_art():
    src = open(ART).read()
    out = {}
    pat = r'(\w+): \{url: "([^"]+)", x: (\d+), y: (\d+), w: (\d+), h: (\d+), ox: (-?[\d.]+), oy: (-?[\d.]+), x0: (-?[\d.]+), y0: (-?[\d.]+), w0: (-?[\d.]+), h0: (-?[\d.]+)'
    for m in re.finditer(pat, src):
        g = m.groups()
        out[g[0]] = {'url': g[1], 'x': int(g[2]), 'y': int(g[3]), 'w': int(g[4]), 'h': int(g[5]),
                     'ox': float(g[6]), 'oy': float(g[7]), 'x0': float(g[8]), 'y0': float(g[9]), 'w0': float(g[10]), 'h0': float(g[11])}
    return out


def metrics():
    t = math.trunc
    art = garden_art()
    return {'baseRight': t(85 * SCALE), 'plotLeft': t(7 * SCALE), 'plotRight': t(5 * SCALE), 'plotTop': t(-3 * SCALE),
            'plotW': t(art['dry']['w0'] * SCALE), 'plotH': t(art['dry']['h0'] * SCALE)}


def layout(cols, rows, style):
    """garden-view.js gardenLayout: bed pieces, plot origins and the box, in scaled px."""
    art = garden_art()
    m = metrics()
    beds = []
    name = style.split('_')[0]
    if style != 'none':
        style_cols = int(style.split('_')[1]) if '_' in style else 1
        whole = f'{name}_{rows}_{cols}'
        tile = f'{name}_{rows}_{style_cols}'
        if whole in art:
            beds = [(whole, 0, 0)]
        elif tile in art:
            step = m['baseRight'] * style_cols
            beds = [(tile, i * step, 0) for i in range(cols // style_cols)]
    plots = []
    for r in range(1, rows + 1):
        for c in range(1, cols + 1):
            row = rows - r
            plots.append((m['plotLeft'] + (m['plotW'] / 2 + m['plotRight']) * row + m['baseRight'] * (c - 1),
                          (m['plotH'] + m['plotTop']) * (rows - 1 - row)))
    x0 = y0 = math.inf
    x1 = y1 = -math.inf
    def add(f, x, y):
        nonlocal x0, y0, x1, y1
        x0 = min(x0, x + f['x0'] * SCALE); y0 = min(y0, y + f['y0'] * SCALE)
        x1 = max(x1, x + (f['x0'] + f['w0']) * SCALE); y1 = max(y1, y + (f['y0'] + f['h0']) * SCALE)
    for b, bx, by in beds:
        add(art[b], bx, by)
    for px, py in plots:
        add(art['dry'], px, py)
    return {'beds': beds, 'plots': plots, 'box': (x0, y0, x1, y1)}


def piece(Image, art, name):
    f = art[name]
    im = Image.open(os.path.join(ROOT, 'public', f['url'])).convert('RGBA').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    return im.resize((max(1, round(f['w'] * SCALE)), max(1, round(f['h'] * SCALE))), Image.LANCZOS), f['ox'] * SCALE, f['oy'] * SCALE


def bed_template(np, Image, art, cols, rows, style, base, ground):
    """The bed as spawnGarden draws it, on `ground`, with a little ground round it: (RGB array, its
    left and top in the bed's box space, the box)."""
    lay = layout(cols, rows, style)
    x0, y0, x1, y1 = lay['box']
    pad = 6
    W, H = int(math.ceil(x1 - x0)) + 2 * pad, int(math.ceil(y1 - y0)) + 2 * pad
    canvas = Image.new('RGBA', (W, H), tuple(int(v) for v in ground) + (255,))
    def put(name, x, y):
        im, ox, oy = piece(Image, art, name)
        canvas.alpha_composite(im, (int(round(x + ox - x0)) + pad, int(round(y + oy - y0)) + pad))
    for b, bx, by in lay['beds']:
        put(b, bx, by)
    for px, py in lay['plots']:
        put(base, px, py)
    return np.asarray(canvas.convert('RGB')).astype(np.float64) / 255, x0 - pad, y0 - pad, lay['box']


def gray(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def ncc_window(np, I, T, M=None):
    """Normalized cross-correlation of template T over every offset in I (both grey)."""
    H, W = I.shape
    h, w = T.shape
    if M is None:
        M = np.ones_like(T)
    shape = (H + h, W + w)
    F1 = np.fft.rfft2(I, shape)
    F2 = np.fft.rfft2(I * I, shape)
    n = M.sum()
    Tp = (T - (T * M).sum() / n) * M
    c = lambda F, k: np.fft.irfft2(F * np.conj(np.fft.rfft2(k, shape)), shape)[:H - h + 1, :W - w + 1]
    num = c(F1, Tp)
    s1 = c(F1, M)
    s2 = c(F2, M)
    var = np.maximum(s2 - s1 * s1 / n, 0)
    return num / np.sqrt((Tp * Tp).sum() * np.maximum(var, 1e-9))


def fit_bed(np, Image, art, snap, bed):
    fx, fy, cols, rows, kind, style, base = bed
    lay = layout(cols, rows, style)
    bx0, by0, bx1, by1 = lay['box']
    m = metrics()
    # The guide's front-left plot: row 0, col 1 (x = plotLeft), its base's bottom at the box's (plots only).
    left0 = fx - m['plotLeft']
    front = (m['plotH'] + m['plotTop']) * (rows - 1) + art['dry']['h0'] * SCALE
    top0 = fy - front
    sx, sy = SEARCH
    # The ground: the snap's median colour in a band just in front of the bed.
    band = snap[int(fy + 4):int(fy + 14), int(fx):int(fx + bx1 - bx0)]
    ground = np.median(band.reshape(-1, 3), axis=0) * 255 if band.size else np.array([100, 85, 30])
    T, ox, oy, _ = bed_template(np, Image, art, cols, rows, style, base, ground)
    h, w = T.shape[:2]
    L, Tt = int(round(left0 + ox)) - sx, int(round(top0 + oy)) - sy
    region = snap[max(0, Tt):Tt + h + 2 * sy, max(0, L):L + w + 2 * sx]
    # Soil is darker than the ground round it, plants and seeds are not: match the bases' shape (the
    # template's own darkness) against how much darker than the ground each snap pixel is.
    g = float(gray(ground.reshape(1, 1, 3) / 255)[0, 0])
    sc = ncc_window(np, np.clip(g - gray(region), 0, None), np.clip(g - gray(T), 0, None))
    y, x = np.unravel_index(np.argmax(sc), sc.shape)
    dx, dy = max(0, L) + int(x) - ox - left0, max(0, Tt) + int(y) - oy - top0
    score = float(sc[y, x])
    # The fit stands when it is sure (FIT_MIN) and inside the search; else the guide does (plants
    # hide most of a busy bed's soil, and the eye reads it better than the correlation).
    fitted = score >= FIT_MIN and abs(dx) < sx - 1 and abs(dy) < sy - 1
    left = left0 + (dx if fitted else 0)
    top = top0 + (dy if fitted else 0)
    foot_x = left + (bx0 + bx1) / 2
    foot_y = top + by1
    return {'x': round(foot_x, 1), 'y': round(foot_y, 1), 'cols': cols, 'rows': rows, 'kind': kind, 'style': style,
            'score': round(score, 3), 'moved': (round(dx), round(dy)), 'how': 'fit' if fitted else 'eye', 'left': left, 'top': top}


def fit_vendor(np, Image, snap, guess):
    sheet = Image.open(os.path.join(ROOT, 'public', 'assets', 'sprites', 'vendors', 'npc_gardening_vendor_idle.webp')).convert('RGBA')
    fw, fh = VENDOR_FRAME
    fr = np.asarray(sheet.crop((0, 0, fw, fh))).astype(np.float64) / 255
    M = (fr[..., 3] > 0.5).astype(np.float64)
    gx, gy = guess
    pad = 40
    L, Tt = int(gx - VENDOR_FOOT_X) - pad, int(gy - fh) - pad
    region = snap[max(0, Tt):Tt + fh + 2 * pad, max(0, L):L + fw + 2 * pad]
    sc = ncc_window(np, gray(region), gray(fr), M)
    y, x = np.unravel_index(np.argmax(sc), sc.shape)
    return {'x': round(max(0, L) + int(x) + VENDOR_FOOT_X, 1), 'y': round(max(0, Tt) + int(y) + fh, 1), 'score': round(float(sc[y, x]), 3)}


def js_module(streets):
    rows = []
    for tsid in sorted(streets):
        s = streets[tsid]
        row = {'beds': s['beds']}
        if s.get('vendor'):
            row['vendor'] = s['vendor']
        rows.append(f'  {json.dumps(tsid)}: {json.dumps(row, separators=(",", ":"))}')
    body = ',\n'.join(rows)
    return ('// Generated by tools/snap-placements/gardens.py from assets/content/garden-spots.json: never edit by hand.\n'
            '/**\n'
            ' * G940 (report #469): each street garden bed and the scarecrow where players\' 2012 full-street snaps\n'
            ' * show them (see the JSON\'s source note). { [G tsid]: { beds: [[x, y, cols, rows, kind, style], ...],\n'
            ' * vendor?: [x, y] } }: a bed\'s foot as game.js spawnGarden takes it, its plots across and deep, crop or\n'
            ' * herb, and its garden_new bed art; the Gardening Tools Vendor\'s feet. js/garden-beds.js reads it.\n'
            ' */\n'
            f'export const GARDEN_SPOTS = Object.freeze({{\n{body}{"," if body else ""}\n}});\n')


def save_crops(Image, snap_img, tsid, label, fits, vendor, crops):
    from PIL import ImageDraw
    im = snap_img.copy()
    d = ImageDraw.Draw(im)
    art = garden_art()
    for f in fits:
        lay = layout(f['cols'], f['rows'], f['style'])
        x0, y0, x1, y1 = lay['box']
        d.rectangle((f['left'] + x0, f['top'] + y0, f['left'] + x1, f['top'] + y1), outline=(255, 0, 255), width=2)
        base, _, _ = piece(Image, art, 'dry')
        edge = base.getchannel('A').point(lambda a: 255 if a > 128 else 0)
        from PIL import ImageFilter
        ring = Image.eval(edge.filter(ImageFilter.MaxFilter(3)), lambda a: a) 
        ring = Image.composite(ring, Image.new('L', ring.size, 0), Image.eval(edge, lambda a: 255 - a))
        for px, py in lay['plots']:
            im.paste((0, 255, 255), (int(round(f['left'] + px)), int(round(f['top'] + py))), ring)
        d.ellipse((f['x'] - 4, f['y'] - 4, f['x'] + 4, f['y'] + 4), fill=(255, 255, 0))
        d.text((f['x'] - 30, f['y'] + 6), f"{f['cols']}x{f['rows']} {f['how']} {f['score']}", fill=(255, 255, 0))
    if vendor:
        d.ellipse((vendor['x'] - 6, vendor['y'] - 6, vendor['x'] + 6, vendor['y'] + 6), fill=(255, 128, 0))
        d.text((vendor['x'] - 30, vendor['y'] + 8), f"vendor {vendor['score']}", fill=(255, 128, 0))
    os.makedirs(crops, exist_ok=True)
    tiles = []
    for f in fits:
        lay = layout(f['cols'], f['rows'], f['style'])
        x0, y0, x1, y1 = lay['box']
        box = (int(f['left'] + x0 - 30), int(f['top'] - 70), int(f['left'] + x1 + 30), int(f['top'] + y1 + 30))
        tiles.append(im.crop(box).resize(((box[2] - box[0]) * 2, (box[3] - box[1]) * 2)))
    if vendor:
        box = (int(vendor['x'] - 110), int(vendor['y'] - 200), int(vendor['x'] + 110), int(vendor['y'] + 20))
        tiles.append(im.crop(box))
    W = max(t.width for t in tiles)
    H = sum(t.height + 4 for t in tiles)
    sheet = Image.new('RGB', (W, H), (30, 30, 30))
    y = 0
    for t in tiles:
        sheet.paste(t, (0, y))
        y += t.height + 4
    sheet.save(os.path.join(crops, f"{tsid}-{re.sub(r'[^a-z0-9]+', '-', label.lower())}.png"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--snaps', default=SNAPS)
    ap.add_argument('--out', default=OUT)
    ap.add_argument('--crops', default='')
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()
    if args.check:
        want = js_module(json.load(open(args.out))['streets'])
        have = open(JS_OUT).read() if os.path.exists(JS_OUT) else ''
        if want != have:
            print(f'{os.path.relpath(JS_OUT, ROOT)} is stale: run python3.11 -I tools/snap-placements/gardens.py')
            return 1
        print(f'{os.path.relpath(JS_OUT, ROOT)} matches {os.path.relpath(args.out, ROOT)}')
        return 0
    snaps_dir = os.path.abspath(args.snaps)
    if not os.path.isdir(snaps_dir):
        print(f'no snaps at {snaps_dir} (research/eleven-snaps is not public): nothing to measure, {os.path.relpath(args.out, ROOT)} left as it is')
        return 0
    import numpy as np
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    art = garden_art()
    index = json.load(open(os.path.join(ROOT, 'public', 'assets', 'streets', 'index.json')))['streets']
    streets = {}
    bad = 0
    for tsid, g in sorted(GUIDE.items()):
        meta = index[tsid]
        street = json.load(open(os.path.join(ROOT, 'public', meta['file'])))
        b = street['bounds']
        img = Image.open(os.path.join(snaps_dir, g['snap'])).convert('RGB')
        if img.size != (b['r'] - b['l'], b['b'] - b['t']):
            raise SystemExit(f"{meta['label']}: snap {img.size} is not the street's {b['r'] - b['l']}x{b['b'] - b['t']}")
        snap = np.asarray(img).astype(np.float64) / 255
        fits = [fit_bed(np, Image, art, snap, bed) for bed in g['beds']]
        vendor = fit_vendor(np, Image, snap, g['vendor']) if g['vendor'] else None
        plots = sum(f['cols'] * f['rows'] for f in fits)
        print(f"{tsid} {meta['label']}: {len(fits)} beds, {plots} plots" + (f" (2012: {g['plots2012']})" if g['plots2012'] else ''))
        for f in fits:
            print(f"  bed {f['cols']}x{f['rows']} {f['kind']} at {f['x']},{f['y']} by {f['how']} (fit {f['score']} moved {f['moved']})")
        if vendor:
            flag = '' if vendor['score'] >= VENDOR_MIN else '  LOW'
            print(f"  scarecrow at {vendor['x']},{vendor['y']} score {vendor['score']}{flag}")
            bad += vendor['score'] < VENDOR_MIN
        if g['plots2012'] and plots != g['plots2012']:
            print(f"  plots {plots} != 2012's {g['plots2012']}")
            bad += 1
        if args.crops:
            save_crops(Image, img, tsid, meta['label'], fits, vendor, args.crops)
        streets[tsid] = {
            'label': meta['label'],
            'snap': g['snap'],
            **({'plots2012': g['plots2012']} if g['plots2012'] else {}),
            'beds': [[f['x'], f['y'], f['cols'], f['rows'], f['kind'], f['style']] for f in fits],
            'how': [f['how'] for f in fits],
            **({'vendor': [vendor['x'], vendor['y']], 'vendorScore': vendor['score']} if vendor else {}),
        }
    if bad:
        print(f'{bad} fits under the floor: check the guide and the crops before writing')
        return 1
    if args.dry:
        return 0
    def num(v):
        return int(v) if isinstance(v, float) and v.is_integer() else v
    for s in streets.values():
        s['beds'] = [[num(v) for v in bed] for bed in s['beds']]
        if 'vendor' in s:
            s['vendor'] = [num(v) for v in s['vendor']]
    out = {
        'source': 'G940 (report #469): street garden beds and the Gardening Tools Vendor (the scarecrow) measured by '
                  'tools/snap-placements/gardens.py from players\' full-street snaps of Nov-Dec 2012 gathered by the '
                  'Eleven Giants project (research/eleven-snaps/<snap>; reference only, no pixels kept): each bed read '
                  'by eye (plots across and deep counted, the kind the snap shows, the front-left plot to about 3 px) and, '
                  'where the fit is sure (how: fit), fitted to the pixel with our CC0 garden_new art drawn as '
                  'js/garden-view.js draws it; the scarecrow fitted with our CC0 idle frame. '
                  'Each bed is [x, y, cols, rows, kind, style]: its foot as game.js spawnGarden takes it (the centre and '
                  'bottom of the bed box, plants left out, street px, 0, 0 = the street\'s top left), plots across and '
                  'deep, crop or herb, and the garden_new bed art. vendor is the scarecrow\'s feet. plots2012 is Zog\'s '
                  'Glitchy Tools 2012 count of the street\'s crop garden plots (research/coverage/deep-dive-2026-10-27/'
                  'zoggish-hub-objects-2012.tsv), which the beds add up to. Do not edit by hand.',
        'streets': streets,
    }
    with open(args.out, 'w') as f:
        f.write(json.dumps(out, ensure_ascii=False, separators=(',', ':')).replace('},"G', '},\n"G').replace('{"source"', '{\n"source"') + '\n')
    with open(JS_OUT, 'w') as f:
        f.write(js_module(streets))
    print(f'wrote {os.path.relpath(args.out, ROOT)} and {os.path.relpath(JS_OUT, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
