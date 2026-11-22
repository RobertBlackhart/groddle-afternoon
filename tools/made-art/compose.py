#!/usr/bin/env python3.11
"""
The pictures of the Made for Groddle section of /restoration/ that are not a shipped file as it is:
each a crop, a render or a side-by-side composed from the game's own files, written to
public/assets/made-art/ and recorded in tools/made-art/showcase.json (sha256, size, what it shows
and what it was made from), which tools/made-art/build-data.mjs checks against the files.

  python3.11 -I tools/made-art/compose.py --shots <dir> [--only <group>,...]

--only recomposes those groups (subway, ezc, lp, rg, lp-room, rg-room, ww, ww-room, wh, om, vv, cc) and keeps every other record of
showcase.json as it is, so a new piece does not need the older pieces' screenshots.

<dir> holds the PNG screenshots of the game served from this checkout at deviceScaleFactor 2
(tools/qa/serve.mjs; the steps are in each entry's `made`):
  subway-render.png   js/map-views.js renderSubwayMapSvg at 760 x 460 on the game's style.css, the
                      names and line buttons hidden
  room-before.png     the tutorial's EZ Cooking pick on Breezy, EZ Cookin' (1280 x 800), the avatar
                      placed at x 1640, with the street JSON of 51a268aa9d^ (the stand-ins) served
  room-after.png      the same with today's street
  lp-before.png       Walk Toward the Light (?questdemo=puzzle_level_light_perspective&questautoplay=final,
                      1280 x 800) at its spotlight run, every page element but the canvas hidden, drawn with
                      light-perspective.js of 2026-11-16 before the made art (b4381e64556)
  lp-after.png        the same with today's room
  rg-before.png       Radiant Glare (?questdemo=radiant_glare&questautoplay=mixer, 1280 x 800) at its
                      green mixer, likewise, with radiant-glare.js of b4381e64556
  rg-after.png        the same with today's room
  ww-before.png       Winter Walk (?questdemo=winter, 1280 x 800) walked right to the caption (x -1547), every
                      page element but the canvas hidden, with the street JSON of d9239df55e8 (before the made art)
  ww-after.png        the same with today's street
  om-before.png       The Outer Mind (?questdemo=tower_quest_part2, a 1280 x 1700 window at deviceScaleFactor 1, the whole
                      room's height in view), the avatar placed mid-room on the floor, every page element but the canvas
                      hidden, with gwendolyn.js of 3f234fd386b (before the made art and the re-lay)
  om-after.png        the same with today's room (the avatar at x 720 on its floor)
  vv-before.png       Le Voyage Violet (?purpledemo=1&purpleautoplay=room&purplehold=1, 1280 x 800), the avatar placed
                      at x 560 as the room opens (before the first Scion), every page element but the canvas hidden,
                      with purple-journey-scene.js of 064a563494c (before the made art and the Uralia decos)
  vv-after.png        the same with today's room
  cc-before.png       the home street in the Coral Caves style (?autostart=1&questoffer=off&fresh=1&resetgame=1&homedemo=home
                      &homestreetstyle=pol_ext_coral_high, 1280 x 800), the avatar placed 1100 right of where it starts
                      (x 1680, the boat), every page element but the canvas hidden, with recipes.mjs of 5ffed3be11c
                      (before the made art)
  cc-after.png        the same with today's style

Everything else is drawn from shipped files: Tiny Speck's CC0 art and the made art whose provenance
is in tools/provenance/ (made-decos.json, repainted-maps.json, subway-map-paper.json).
"""
import argparse, hashlib, json, os, subprocess, sys
from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PUB = os.path.join(ROOT, 'public')
OUT = 'public/assets/made-art'
REC = os.path.join(ROOT, 'tools/made-art/showcase.json')
PAPER = (247, 245, 239, 255)

sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rel = lambda p: os.path.relpath(p, ROOT)


def webp(img, name, lossless=False, q=86):
    png = os.path.join(TMP, name + '.png')
    img.save(png)
    dst = os.path.join(ROOT, OUT, name + '.webp')
    args = ['cwebp', '-quiet', '-metadata', 'none'] + (['-lossless', '-z', '9'] if lossless else ['-q', str(q), '-m', '6', '-sharp_yuv', '-alpha_q', '100'])
    subprocess.run(args + [png, '-o', dst], check=True)
    return dst


def source(path):
    return {'file': rel(path), 'sha256': sha(path)}


# EZ Cookin': our measurement drawing and the made props, side by side at the street's own scale

# The pieces at the sizes measured from the snaps (research/art-briefs/ez-cookin/attach/01-measurements-ours.svg),
# in street units, one above the other on a sheet 250 wide: the lamp (its wires from y 15), the counter
# 24 under it, the table 24 under that, all centred at x 125 (y down).
SCENE = (0, 0, 250, 285)
LAMP = (125 - 37.5, 15)  # the drawing's lamp group origin (the wires' top)
COUNTER = (125 - 110, 91)
TABLE = (125 - 91, 179)
S = 3  # px a unit in the files
SS = 4  # supersampling for the drawing


def bez(p0, p1, p2, p3, n=24):
    return [tuple((1 - t) ** 3 * a + 3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3)) for t in (i / n for i in range(n + 1))]


def outline_drawing():
    k = S * SS
    w, h = (SCENE[2] - SCENE[0]) * k, (SCENE[3] - SCENE[1]) * k
    img = Image.new('RGBA', (w, h), PAPER)
    d = ImageDraw.Draw(img)
    ink, lw = (51, 51, 51, 255), round(0.7 * k)
    at = lambda o, x, y: ((o[0] + x - SCENE[0]) * k, (o[1] + y - SCENE[1]) * k)
    box = lambda o, x0, y0, x1, y1: [*at(o, x0, y0), *at(o, x1, y1)]
    # 1. Counter 220 x 64: glass lid 27, steel band 4, tub 33 narrowing to about 197, two seams, two rivets.
    o = COUNTER
    d.rounded_rectangle(box(o, 0, 0, 220, 27), radius=12 * k, fill=(228, 244, 242, 255), outline=ink, width=lw)
    d.rectangle(box(o, 6, 27, 214, 31), fill=(154, 169, 173, 255), outline=ink, width=lw)
    tub = [at(o, 8, 31), at(o, 212, 31), at(o, 204, 58)] + [at(o, *p) for p in bez((204, 58), (202, 62), (198, 64), (194, 64))] + [at(o, 26, 64)] + [at(o, *p) for p in bez((26, 64), (22, 64), (18, 62), (16, 58))]
    d.polygon(tub, fill=(238, 240, 242, 255), outline=ink, width=lw)
    for x in (62, 152):
        d.line([at(o, x, 33), at(o, x, 60)], fill=(153, 153, 153, 255), width=lw)
    for x in (22, 198):
        d.ellipse(box(o, x - 2, 27, x + 2, 31), fill=(255, 255, 255, 255), outline=ink, width=lw)
    # 2. Lamp: cord up (dashed), four wires 22 to one point, shade 75 x 27, diffuser.
    o = LAMP
    for y in range(-15, 0, 4):
        d.line([at(o, 37.5, y), at(o, 37.5, y + 2)], fill=ink, width=lw)
    for x in (12, 28, 47, 63):
        d.line([at(o, 37.5, 0), at(o, x, 22)], fill=ink, width=lw)
    d.rounded_rectangle(box(o, 0, 22, 75, 49), radius=4 * k, fill=(246, 248, 251, 255), outline=ink, width=lw)
    d.ellipse(box(o, 30.5, 47, 44.5, 53), fill=(255, 255, 255, 255), outline=ink, width=lw)
    # 3. Table 182 x 88: oval top 30 with a rim, three rings, scrolled legs and a cross bar.
    o = TABLE
    side = [at(o, 0, 15), at(o, 0, 25)] + [at(o, 91 - 91 * __import__('math').cos(t / 40 * 3.14159), 25 + 17 * __import__('math').sin(t / 40 * 3.14159)) for t in range(41)] + [at(o, 182, 15)]
    d.polygon(side, fill=(221, 230, 230, 255), outline=ink, width=lw)
    for rx, ry, fill in ((91, 15, (238, 247, 246, 255)), (62, 9, (207, 238, 238, 255)), (38, 5, (233, 238, 233, 255))):
        d.ellipse(box(o, 91 - rx, 15 - ry, 91 + rx, 15 + ry), fill=fill, outline=ink, width=lw)
    leg = (85, 85, 85, 255)
    for a, b, c, e in (((70, 42), (55, 55), (75, 70), (62, 86)), ((112, 42), (127, 55), (107, 70), (120, 86)), ((84, 42), (78, 60), (92, 72), (86, 88)), ((98, 42), (104, 60), (90, 72), (96, 88))):
        d.line([at(o, *p) for p in bez(a, b, c, e)], fill=leg, width=round(1.6 * k), joint='curve')
    d.line([at(o, 66, 78), at(o, 116, 78)], fill=leg, width=round(1.6 * k))
    return img.resize((w // SS, h // SS), Image.LANCZOS)


def props_scene():
    w, h = (SCENE[2] - SCENE[0]) * S, (SCENE[3] - SCENE[1]) * S
    img = Image.new('RGBA', (w, h), PAPER)
    deco = lambda n: os.path.join(PUB, 'assets/decos/groddle', f'{n}@1.5x.webp')
    used = []
    # (name, centre x, feet y, drawn w, drawn h): the sizes js/practice-streets.js draws them at (EZ_PROP_ART), the
    # table's top, the counter's feet and the lamp's wires where the drawing has them (the lamp's file ends 2 under
    # its shade, whose top is 27.5 and wires' top 50.5 above the file's foot).
    for name, cx, feet, dw, dh in (('gz_ai_ezc_round_table', 125, 179 + 96, 182, 96), ('gz_ai_ezc_glass_counter', 125, 155, 220, 64), ('gz_ai_ezc_hanging_lamp', 125, 15 + 50.5, 75, 92)):
        p = deco(name)
        used.append(source(p))
        art = Image.open(p).convert('RGBA').resize((round(dw * S), round(dh * S)), Image.LANCZOS)
        x, y = round((cx - dw / 2 - SCENE[0]) * S), round((feet - dh - SCENE[1]) * S)
        img.alpha_composite(art, (x, y)) if y >= 0 else img.alpha_composite(art.crop((0, -y, art.size[0], art.size[1])), (x, 0))
    return img, used


# Walk Toward the Light and Radiant Glare: the light-puzzle rig's made pieces (js/quest-rooms/light-rig-art.js), on paper at
# 3 px a unit, the grey ones also tinted as the rooms tint them (a Pixi tint multiplies each channel).
def tinted(img, hexc):
    if hexc is None:
        return img
    t = Image.new('RGBA', img.size, ((hexc >> 16) & 255, (hexc >> 8) & 255, hexc & 255, 255))
    out = ImageChops.multiply(img, t)
    out.putalpha(img.split()[3])
    return out


def lighten(hexc, t):
    return sum(round(((hexc >> sh) & 255) * (1 - t) + 255 * t) << sh for sh in (16, 8, 0))


def rig_sheet(size, items):
    """items: (name, x, y, w, h, tint) in units, top-left; returns the sheet and the files used."""
    img = Image.new('RGBA', (size[0] * S, size[1] * S), PAPER)
    used = {}
    for name, x, y, w, h, tint in items:
        p = os.path.join(PUB, 'assets/decos/groddle', f'{name}@1.5x.webp')
        used[p] = source(p)
        art = tinted(Image.open(p).convert('RGBA').resize((round(w * S), round(h * S)), Image.LANCZOS), tint)
        img.alpha_composite(art, (round(x * S), round(y * S)))
    return img, list(used.values())


# Tints the rooms use (light-perspective.js LIGHT_COLORS and POLE_TINT, radiant-glare.js LIGHT), lightened 12% (dishes)
# and 12% / 30% (bulbs off / lit) as js/quest-rooms/light-rig-art.js does.
LP_YELLOW, LP_BLUE, LP_POLE = 0xf3d33c, 0x4d6bff, 0xff6a5e
RG = {'red': 0xe8584a, 'yellow': 0xe8d54a, 'blue': 0x4f6fe0}


def lp_props():
    seg, step = 75 * 34 / 32, (75 - 2.55) * 34 / 32
    items = [('gz_ai_lp_shade', 14, 12, 100, 26, None),
             ('gz_ai_lp_dish', 14, 56, 240, 50, None),
             ('gz_ai_lp_dish', 14, 118, 120, 25, lighten(LP_YELLOW, 0.12)),
             ('gz_ai_lp_dish', 140, 118, 120, 25, lighten(LP_BLUE, 0.12))]
    # The pole as the walls draw it (34 wide): segments from the bottom up, each upper one over the one below, the cap on top.
    for i in reversed(range(2)):
        items.append(('gz_ai_lp_pole', 278, 20 + i * step, 34, seg, LP_POLE))
    items.append(('gz_ai_lp_pole_cap', 278, 20 + 6 * 34 / 32 - 17, 34, 17, LP_POLE))
    items += [('gz_ai_lp_ledge_left', 14, 186, 40, 48, None), ('gz_ai_lp_ledge_mid', 54, 186, 236, 48, None), ('gz_ai_lp_ledge_right', 290, 186, 40, 48, None)]
    return rig_sheet((344, 246), items)


def rg_props():
    items = [('gz_ai_rg_spotlight', 12, 14, 62, 150, None)]
    for i, (k, c) in enumerate(RG.items()):
        items.append(('gz_ai_rg_bulb_lit', 90 + i * 46, 6, 53, 59, lighten(c, 0.3)))
        items.append(('gz_ai_rg_bulb_off', 90 + i * 46, 70, 53, 59, lighten(c, 0.12)))
    items += [('gz_ai_rg_bulb_lit', 228, 6, 53, 59, None), ('gz_ai_rg_bulb_off', 228, 70, 53, 59, None), ('gz_ai_rg_knob', 150, 136, 30, 30, None)]
    return rig_sheet((290, 176), items)


# Winter Walk: the made tree arch and one plant of each kind as the street sets them (js/winter-walk-streets.js
# WINTER_WALK_ARCH, WINTER_WALK_CURL_SPLAYS tall3 and low2), on paper at 1.5 px a unit, all on one ground line.
WW_S = 1.5
CURL = {'tall': ('gz_ai_ww_curl_tall', 46, 120, 0.2383), 'low': ('gz_ai_ww_curl_low', 130, 43, 0.0721)}
SPLAY = {'tall3': [(1, -5, False, -9), (0.84, 6, True, 10), (0.72, 1, False, 20)], 'low2': [(1, 5, False, 0), (0.78, -5, True, -4)]}


def foot_turned(art, deg):
    """The art turned `deg` clockwise (as Pixi's angle) about its bottom centre: returns the picture and its foot's place in it."""
    w, h = art.size
    pad = Image.new('RGBA', (w + 2 * h, 2 * h), (0, 0, 0, 0))
    pad.alpha_composite(art, (h, 0))
    return pad.rotate(-deg, resample=Image.BICUBIC), (h + w / 2, h)


def ww_props():
    W, H, GROUND = 840, 388, 368
    img = Image.new('RGBA', (round(W * WW_S), round(H * WW_S)), PAPER)
    used = {}

    def put_art(name, cx, w, h, flip=False, deg=0):
        p = os.path.join(PUB, 'assets/decos/groddle', f'{name}@1.5x.webp')
        used[p] = source(p)
        art = Image.open(p).convert('RGBA').resize((round(w * WW_S), round(h * WW_S)), Image.LANCZOS)
        if flip:
            art = art.transpose(Image.FLIP_LEFT_RIGHT)
        art, (fx, fy) = foot_turned(art, deg)
        img.alpha_composite(art, (round(cx * WW_S - fx), round(GROUND * WW_S - fy)))

    put_art('gz_ai_ww_tree_arch', 20 + 229, 458, 348)
    for kind, splay, root, sc in (('tall', 'tall3', 535, 1.05), ('low', 'low2', 700, 1)):
        name, w0, h0, rf = CURL[kind]
        for k, dx, flip, deg in SPLAY[splay]:
            w, h = w0 * sc * k, h0 * sc * k
            put_art(name, root + dx * sc - (rf - 0.5) * w * (-1 if flip else 1), w, h, flip, deg)
    return img, list(used.values())


# Winter Haven (G922): the three made snowy trees beside the Tiny Speck trees they were redrawn from, each at the
# height the haven draws it (js/winter-walk-streets.js WINTER_HAVEN_TREES), its root on one ground line, flipped as
# the haven flips it. The CC0 trees at their own drawn rows times the street's old scale.
WH_S = 0.6  # px a unit
WH_TREES = (  # made name, its haven size, the CC0 tree, the CC0 drawn rows (alpha over 20), the haven's old scale, flip
    ('gz_ai_wh_tree_bare_3', 277, 805, 'heights_tree_bare_3', (0, 1, 362, 1151), 0.7, False),
    ('gz_ai_wh_tree_bare_2', 297, 965, 'heights_tree_bare_2', (0, 0, 334, 1287), 0.75, True),
    ('gz_ai_wh_tree_bare_4', 622, 647, 'heights_tree_bare_4', (0, 0, 1136, 1294), 0.5, True),
)


def wh_sheet(made):
    W, H, GROUND = 1380, 1000, 985
    img = Image.new('RGBA', (round(W * WH_S), round(H * WH_S)), PAPER)
    used = {}
    for x, (name, w, h, cc0, box, scale, flip) in zip((40, 380, 720), WH_TREES):
        if made:
            p = os.path.join(PUB, 'assets/decos/groddle', f'{name}.webp')
            art = Image.open(p).convert('RGBA')
        else:
            p = os.path.join(PUB, 'assets/decos/groddle', f'{cc0}.webp')
            art = Image.open(p).convert('RGBA')
            art = art.crop(box)  # the library file is the CC0 tree at 1 px a unit
            w, h = round((box[2] - box[0]) * scale), round((box[3] - box[1]) * scale)
        used[p] = source(p)
        art = art.resize((round(w * WH_S), round(h * WH_S)), Image.LANCZOS)
        if flip:
            art = art.transpose(Image.FLIP_LEFT_RIGHT)
        img.alpha_composite(art, (round(x * WH_S), round((GROUND - h) * WH_S)))
    return img, list(used.values())


# Region maps: none since lane maps17. The gallery of regions painted again from their thumbnails (maps:<hub>,...) lost its
# last region when Vortex of Random took The Seams' restore (its 2012 map is the same painting), so the piece, its two
# composed pictures (maps-thumbs.webp, maps-painted.webp) and this part were dropped; they stay in git history.


def main():
    global TMP
    ap = argparse.ArgumentParser()
    ap.add_argument('--shots', required=True)
    ap.add_argument('--only', default='')
    args = ap.parse_args()
    only = set(filter(None, args.only.split(',')))
    want = lambda g: not only or g in only
    TMP = os.path.join(args.shots, 'compose-tmp')
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(os.path.join(ROOT, OUT), exist_ok=True)
    rec = json.load(open(REC))['files'] if only else {}

    def put(name, dst, what, made, sources):
        w, h = Image.open(dst).size
        rec[rel(dst)] = {'what': what, 'w': w, 'h': h, 'sha256': sha(dst), 'made': made, 'from': sources}

    if want('subway'):
        subway(args, put)
    if want('ezc'):
        ezc(args, put)
    if want('lp'):
        img, used = lp_props()
        put('lp-props', webp(img, 'lp-props'), "Walk Toward the Light's made shade, dish, striped pole and stone ledge",
            'the made decos (3x files) at the sizes the room draws them, 3 px a unit, on paper: the shade, the grey dish and two tinted copies as the yellow and blue lights show them, two pole segments stacked and tinted red with the cap, and the ledge (left end, middle, right end)', used)
    if want('rg'):
        img, used = rg_props()
        put('rg-props', webp(img, 'rg-props'), "Radiant Glare's made wall spotlight, caged bulbs and pipe knob",
            'the made decos (3x files) at the sizes of the brief, 3 px a unit, on paper: the spotlight, the caged bulb lit (top) and off (below) tinted red, yellow and blue as the switches tint them and untinted, and the knob', used)
    if want('ww'):
        img, used = ww_props()
        put('ww-props', webp(img, 'ww-props'), "Winter Walk's made tree arch and curling plants",
            'the made decos (3x files) at the sizes the street draws them, 1.5 px a unit, on paper, on one ground line: the tree arch, a tall plant of three copies of its stalk and a low plant of two, splayed as js/winter-walk-streets.js sets them', used)
    if want('wh'):
        for made, name, what in ((True, 'wh-trees', "Winter Haven's made snowy trees"), (False, 'wh-trees-before', "the Tiny Speck trees Winter Haven's snowy trees were redrawn from")):
            img, used = wh_sheet(made)
            how = ('the made decos (their 2x files, the drop at its own resolution) at the heights the haven draws them, 0.6 px a unit, on paper, roots on one ground line, flipped as the haven flips them'
                   if made else 'Tiny Speck\'s heights_tree_bare_3, _2 and _4 (CC0 1.0), cropped to their drawn rows and drawn at the haven\'s old scales (0.7, 0.75, 0.5), 0.6 px a unit, on paper, roots on one ground line, flipped as the haven flipped them')
            put(name, webp(img, name), what, how, used)
    if want('om'):
        box = (0, 192, 1280, 1504)
        for which in ('before', 'after'):
            shot = os.path.join(args.shots, f'om-{which}.png')
            s = Image.open(shot).convert('RGBA')
            assert s.size == (1280, 1700), s.size
            s = s.crop(box).resize((640, 656), Image.LANCZOS)
            name = 'om-room-vectors' if which == 'before' else 'om-room'
            what = "The Outer Mind before: a wide band drawn in plain shapes, four tiers of tube" if which == 'before' else "The Outer Mind re-laid to its 2012 shape with its made pictures"
            module = 'gwendolyn.js of 3f234fd386b (before the made art and the re-lay)' if which == 'before' else "today's room"
            put(name, webp(s, name, q=84), what,
                f"screenshot of the game (a 1280 x 1700 window, deviceScaleFactor 1, questdemo=tower_quest_part2, the avatar placed mid-room on the floor), every page element but the canvas hidden, {module}; cropped to y {box[1]}-{box[3]}, Lanczos to 640 x 656",
                [{'shot': f'om-{which}.png', 'sha256': sha(shot)}])
    if want('vv'):
        box = (0, 32, 2560, 1152)
        for which in ('before', 'after'):
            shot = os.path.join(args.shots, f'vv-{which}.png')
            s = Image.open(shot).convert('RGBA')
            assert s.size == (2560, 1600), s.size
            s = s.crop(box).resize((720, 315), Image.LANCZOS)
            name = 'vv-room-vectors' if which == 'before' else 'vv-room'
            what = "Le Voyage Violet before: stumps, mushrooms, spiral stones and fronds drawn in plain shapes" if which == 'before' else "Le Voyage Violet with its made stump and spiral stone among Tiny Speck's Uralia mushrooms, ghost and owl"
            module = 'purple-journey-scene.js of 064a563494c (before the made art and the Uralia decos)' if which == 'before' else "today's room"
            put(name, webp(s, name, q=84), what,
                f"screenshot of the game (1280 x 800, deviceScaleFactor 2, purpledemo=1&purpleautoplay=room, the avatar placed at x 560 as the room opens), every page element but the canvas hidden, {module}; cropped to y {box[1] // 2}-{box[3] // 2} (CSS px), Lanczos to 720 x 315",
                [{'shot': f'vv-{which}.png', 'sha256': sha(shot)}])
    if want('cc'):
        box = (0, 60, 2560, 1180)
        for which in ('before', 'after'):
            shot = os.path.join(args.shots, f'cc-{which}.png')
            s = Image.open(shot).convert('RGBA')
            assert s.size == (2560, 1600), s.size
            s = s.crop(box).resize((720, 315), Image.LANCZOS)
            name = 'cc-street-before' if which == 'before' else 'cc-street'
            what = "Coral Caves before: Tiny Speck's rocks, beaded branches, fiddleheads and boat, no crystals, spires or kelp" if which == 'before' else "Coral Caves with its made crystal clusters, pale spires and kelp stalks among Tiny Speck's rocks, branches and boat"
            recipe = 'tools/home-styles/recipes.mjs of 5ffed3be11c (before the made art)' if which == 'before' else "today's style"
            put(name, webp(s, name, q=84), what,
                f"screenshot of the game (1280 x 800, deviceScaleFactor 2, homedemo=home&homestreetstyle=pol_ext_coral_high, the avatar placed at x 1680), every page element but the canvas hidden, {recipe}; cropped to y {box[1] // 2}-{box[3] // 2} (CSS px), Lanczos to 720 x 315",
                [{'shot': f'cc-{which}.png', 'sha256': sha(shot)}])
    if want('ww-room'):
        box = (360, 60, 2160, 1118)
        for which in ('before', 'after'):
            shot = os.path.join(args.shots, f'ww-{which}.png')
            s = Image.open(shot).convert('RGBA')
            assert s.size == (2560, 1600), s.size
            s = s.crop(box).resize((720, 423), Image.LANCZOS)
            name = 'ww-room-before' if which == 'before' else 'ww-room'
            what = "Winter Walk at its caption before the made art: a bare Tiny Speck tree and open snow" if which == 'before' else "Winter Walk at its caption with the made tree arch and curling plants"
            street = 'the street JSON of d9239df55e8 (before the made art)' if which == 'before' else "today's street"
            put(name, webp(s, name, q=84), what,
                f"screenshot of the game (1280 x 800, deviceScaleFactor 2, questdemo=winter, walked right to x -1547), every page element but the canvas hidden, {street}; cropped to x {box[0] // 2}-{box[2] // 2}, y {box[1] // 2}-{box[3] // 2} (CSS px), Lanczos to 720 x 423",
                [{'shot': f'ww-{which}.png', 'sha256': sha(shot)}])
    # Crops in device px (CSS px x 2): the spotlight run's shades, poles, dishes and ledge; the mixer's console, dishes and spotlight.
    for room, title, how, box in (('lp', 'Walk Toward the Light at its spotlight run', 'questautoplay=final', (320, 160, 2240, 1288)),
                                  ('rg', "Radiant Glare's mixer lit green", 'questautoplay=mixer', (560, 472, 2480, 1600))):
        if not want(f'{room}-room'):
            continue
        for which in ('before', 'after'):
            shot = os.path.join(args.shots, f'{room}-{which}.png')
            s = Image.open(shot).convert('RGBA')
            assert s.size == (2560, 1600), s.size
            s = s.crop(box).resize((720, 423), Image.LANCZOS)
            name = f'{room}-room-vectors' if which == 'before' else f'{room}-room'
            what = f"{title}, drawn in plain shapes before the made art" if which == 'before' else f"{title} with its made art"
            module = 'the room module of b4381e64556 (before the made art)' if which == 'before' else "today's room"
            put(name, webp(s, name, q=84), what,
                f"screenshot of the game (1280 x 800, deviceScaleFactor 2, {how}), every page element but the canvas hidden, {module}; cropped to x {box[0] // 2}-{box[2] // 2}, y {box[1] // 2}-{box[3] // 2} (CSS px), Lanczos to 720 x 423",
                [{'shot': f'{room}-{which}.png', 'sha256': sha(shot)}])

    doc = {'format': 'groddle-made-showcase/1',
           'about': 'Pictures of the Made for Groddle section composed by tools/made-art/compose.py from shipped files and game screenshots; tools/made-art/build-data.mjs checks each against its sha256.',
           'files': dict(sorted(rec.items()))}
    open(REC, 'w').write(json.dumps(doc, indent=1, ensure_ascii=False) + '\n')
    for f in os.listdir(TMP):
        os.remove(os.path.join(TMP, f))
    os.rmdir(TMP)
    print('\n'.join(f"{k}: {v['w']} x {v['h']}" for k, v in rec.items()))


def subway(args, put):
    # Subway: the sign's little map (Tiny Speck, CC0) and the paper with the line on it.
    sign = os.path.join(PUB, 'assets/sprites/icons/subway_map@3x.webp')
    crop = Image.open(sign).convert('RGBA').crop((27, 47, 259, 205))
    put('subway-sign-map', webp(crop, 'subway-sign-map', lossless=True), "The little map on Tiny Speck's in-world Subway Map sign",
        'crop x 27-259, y 47-205 of the sign (its map panel), lossless', [source(sign) | {'licence': 'CC0 1.0, Tiny Speck: glitch-items misc/subway_map (subway_map.swf)'}])
    shot = os.path.join(args.shots, 'subway-render.png')
    r = Image.open(shot).convert('RGBA')
    assert r.size == (1520, 920), r.size
    r = r.crop((8, 8, 1512, 912)).resize((752, 452), Image.LANCZOS)
    paper = os.path.join(PUB, 'assets/maps/art/subway/subway-map-paper@2x.webp')
    put('subway-map-paper-line', webp(r, 'subway-map-paper-line', q=88), 'The recreated Subway System paper with the Red Line and its stations drawn on it',
        "screenshot of js/map-views.js renderSubwayMapSvg (the Map's Subway view) at 760 x 460, deviceScaleFactor 2, on the game's style.css with the station names and line buttons hidden; the rounded corners cropped (8 px), Lanczos to 752 x 452",
        [source(paper), {'file': 'public/js/map-views.js'}, {'shot': 'subway-render.png', 'sha256': sha(shot)}])


def ezc(args, put):
    # EZ Cookin': the drawing the model was given, and what came back, at the same scale.
    put('ezc-props-outline', webp(outline_drawing(), 'ezc-props-outline'), "Our drawing of EZ Cookin's table, counter and lamp, at their measured sizes",
        'drawn by compose.py from the outlines of research/art-briefs/ez-cookin/attach/01-measurements-ours.svg (our own measurement drawing) at their measured sizes, lamp, counter and table one above the other 24 units apart, 3 px a unit', [])
    scene, used = props_scene()
    put('ezc-props', webp(scene, 'ezc-props'), "EZ Cookin's made table, counter and lamp, at the sizes the street draws them",
        'the three made decos (3x files) at the sizes the street draws them (js/practice-streets.js EZ_PROP_ART), placed as in the drawing beside it, 3 px a unit, on the same paper', used)
    for which, what, how in (('before', "Breezy, EZ Cookin' with Tiny Speck's stand-ins: store_counter, store_lamp_01, k04_table_01 (CC0)", 'the street JSON of 51a268aa9d^ served in place of today\'s'),
                             ('after', "Breezy, EZ Cookin' with its made counters and lamps", "today's street")):
        shot = os.path.join(args.shots, f'room-{which}.png')
        s = Image.open(shot).convert('RGBA')
        assert s.size == (2560, 1600), s.size
        s = s.crop((464, 120, 2440, 1280)).resize((720, 423), Image.LANCZOS)
        name = 'ezc-room-stand-ins' if which == 'before' else 'ezc-room'
        put(name, webp(s, name, q=84), what,
            f"screenshot of the game (1280 x 800, deviceScaleFactor 2): the tutorial's EZ Cooking pick (?newxp=skill&newxpskill=ezcooking_1, Aiight), the avatar placed at x 1640, {how}; the HUD cropped off (x 232-1220, y 60-640), Lanczos to 720 x 423",
            [{'shot': f'room-{which}.png', 'sha256': sha(shot)}])


if __name__ == '__main__':
    main()
