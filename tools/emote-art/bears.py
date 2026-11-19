"""The Emotional Bear's four emotes (hug, high five, moon, kiss), drawn from Tiny Speck's CC0 SWF.

Source: glitch-items misc/emotional_bear/emotional_bear.swf (CC0; the .fla beside it is the same
art). glitch-GameServerJS items/emotional_bear.js sends the one hugged, high-fived, mooned or kissed
a vp_overlay of item_class emotional_bear in state hug (5 s), high_5 (4 s), moon (6 s) or kiss
(3 s). Those states are scenes of the SWF's root timeline (DefineSceneAndFrameLabelData): hug
10-100, moon 101-245, high_5 246-322, kiss 323-391, each fading in from an empty first frame and out
to an empty last one. The kiss scene draws its own lips; misc/lips/lips.swf is the Lips item only.

The art leaves the SWF's 300 x 300 stage (the bear swells up to the camera), so FFDec renders a
copy whose stage grows by one stage size on every side (tools/icon-hires/swfinfo.py rewrite, as
tools/vector-sprites padStage). Each emote is drawn at the zoom that fits its scene's art (the
union of every frame's alpha box) in FIT, the 220 x 226 box the solo game shows it in (style.css
.emotional-bear-fx img), cropped to that union, and written as a looping lossy WebP (lossless
alpha), the format the four shipped in. Every frame lasts the overlay's time over the scene's
frames rounded down to 10 ms (50, 50, 40 and 40 ms: the pace the shipped files had), and the empty
last frame holds the rest of the overlay, so a loop never restarts inside it. The 2012 client ran
the scene at the SWF's 30 frames a second (the 2012 kiss recording, emo_bear_kiss.mp4, is 73 frames
at 30 fps), so the remake's emotes play slower than Glitch's; that pace is kept here.

bears.json records, per emote, the scene, zoom, crop, size, frame time, every frame's alpha box in
the render and the file's sha256. --check decodes each shipped file and compares the picture shown
during each scene frame with the render (when Java, FFDec and glitch-items are on this machine) or
with the recorded alpha boxes (otherwise): a file cut from the wrong cells, or drawn over its own
earlier frames (the trails the first files had, #530), fails either way.
"""
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SPIKE = os.path.dirname(os.path.dirname(HERE))
TOOLS = os.path.dirname(HERE)
META = os.path.join(HERE, 'bears.json')
SWF_REL = 'misc/emotional_bear/emotional_bear.swf'
FFDEC = os.path.expanduser('~/Documents/glitch-audit/tools/ffdec/ffdec.jar')
FIT = (220, 226)
QUALITY = 85
# Alpha above this counts as drawn when boxes are measured (lossy colour; the alpha is lossless).
ALPHA_MIN = 16
# A shipped frame's alpha box may differ from the render's by this many pixels on a side.
BOX_SLACK = 2
# Mean absolute difference (0-255, premultiplied RGBA) a shipped frame may have from its render.
MAD_MAX = 6.0
# state -> (file stem, overlay ms): items/emotional_bear.js announce_vp_overlay durations.
EMOTES = {
    'hug': ('hug', 5000),
    'high_5': ('high-five', 4000),
    'moon': ('moon', 6000),
    'kiss': ('kiss', 3000),
}


def items_dir():
    for d in (os.environ.get('GLITCH_ITEMS'), os.path.join(os.path.dirname(SPIKE), 'glitch-items'),
              os.path.expanduser('~/Documents/glitch-audit/glitch-items')):
        if d and os.path.isfile(os.path.join(d, SWF_REL)):
            return d
    return None


def java():
    sys.path.insert(0, TOOLS)
    from java_path import JAVA  # noqa: E402  (tools/java_path.py)
    return shutil.which(JAVA) or (JAVA if os.path.isfile(JAVA) else None)


def can_render():
    return bool(items_dir() and os.path.isfile(FFDEC) and java())


def out_path(stem):
    return os.path.join(SPIKE, 'public', 'assets', 'sprites', 'emotional-bear', f'{stem}.webp')


def scenes(swf):
    sys.path.insert(0, os.path.join(TOOLS, 'icon-hires'))
    import swfinfo  # noqa: E402
    info = swfinfo.read(swf)
    starts = sorted(info['scenes'].items(), key=lambda kv: kv[1])
    out = {}
    for i, (name, start) in enumerate(starts):
        end = (starts[i + 1][1] if i + 1 < len(starts) else info['frames'] + 1) - 1
        out[name] = (start, end)
    return out


def frame_ms(overlay, count):
    return (overlay // count) // 10 * 10


def durations(overlay, count):
    ms = frame_ms(overlay, count)
    return [ms] * (count - 1) + [overlay - ms * (count - 1)]


def box(img, floor=ALPHA_MIN):
    return img.getchannel('A').point(lambda a: 255 if a > floor else 0).getbbox()


def union(boxes):
    got = [b for b in boxes if b]
    return (min(b[0] for b in got), min(b[1] for b in got), max(b[2] for b in got), max(b[3] for b in got))


def render(swf, first, last, zoom, work):
    """FFDec's frames first..last of the root timeline at `zoom`, transparent, as RGBA images."""
    from PIL import Image
    out = os.path.join(work, f'{first}-{last}z{zoom:.6f}')
    if not os.path.isdir(out):
        tmp = out + '.tmp'
        shutil.rmtree(tmp, ignore_errors=True)
        subprocess.run([java(), '-Djava.awt.headless=true', '-jar', FFDEC, '-zoom', f'{zoom:.6f}', '-select', f'{first}-{last}',
                        '-ignorebackground', '-format', 'frame:png', '-export', 'frame', os.path.join(tmp, 'root'), swf],
                       check=True, capture_output=True)
        os.replace(tmp, out)
    return [Image.open(os.path.join(out, 'root', f'{k}.png')).convert('RGBA') for k in range(first, last + 1)]


def padded(work):
    sys.path.insert(0, os.path.join(TOOLS, 'icon-hires'))
    import swfinfo  # noqa: E402
    src = os.path.join(items_dir(), SWF_REL)
    swf = os.path.join(work, 'emotional_bear.pad1.swf')
    swfinfo.rewrite(src, swf, pad=1.0)
    return src, swf


def cut(swf, state, first, last, work, zoom=None):
    """The scene's frames at the zoom that fits FIT (or `zoom`), cropped to their union."""
    fixed = zoom is not None
    if not fixed:
        b = union([box(f, 0) for f in render(swf, first, last, 1.0, work)])
        zoom = round(min(FIT[0] / (b[2] - b[0]), FIT[1] / (b[3] - b[1])), 6)
    for _ in range(6):
        frames = render(swf, first, last, zoom, work)
        crop = union([box(f, 0) for f in frames])
        w, h = crop[2] - crop[0], crop[3] - crop[1]
        if w <= FIT[0] and h <= FIT[1]:
            return zoom, crop, [f.crop(crop) for f in frames]
        if fixed:
            break
        # Antialiasing spills a pixel past the zoomed box: draw a little smaller.
        zoom = round(zoom * min(FIT[0] / w, FIT[1] / h) * 0.999, 6)
    raise SystemExit(f'{state}: {w} x {h} at zoom {zoom:.6f} does not fit {FIT[0]} x {FIT[1]}')


def premul(img):
    """Premultiplied RGBA: the colour under a transparent pixel does not count."""
    from PIL import Image, ImageChops
    r, g, b, a = img.split()
    return Image.merge('RGBA', [ImageChops.multiply(c, a) for c in (r, g, b)] + [a])


def mad(a, b):
    from PIL import ImageChops, ImageStat
    d = ImageChops.difference(premul(a), premul(b))
    return sum(ImageStat.Stat(d).mean) / 4


def shown(path, durs):
    """The picture on screen during each scene frame's own time (the encoder may join same frames)."""
    from PIL import Image, ImageSequence
    im = Image.open(path)
    pics = []
    for f in ImageSequence.Iterator(im):
        f.load()
        pics.append((f.info.get('duration') or 0, f.convert('RGBA')))
    out, at, i, end = [], 0, 0, pics[0][0] if pics else 0
    for d in durs:
        while i < len(pics) - 1 and at >= end:
            i += 1
            end += pics[i][0]
        out.append(pics[i][1])
        at += d
    return out, sum(d for d, _ in pics), im.size, im.info.get('loop')


def encode(frames, durs, dst):
    with tempfile.TemporaryDirectory() as tmp:
        args = ['img2webp', '-loop', '0', '-lossy', '-q', str(QUALITY), '-m', '6']
        for k, (f, d) in enumerate(zip(frames, durs)):
            p = os.path.join(tmp, f'{k:03d}.png')
            f.save(p)
            args += ['-d', str(d), p]
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        subprocess.run(args + ['-o', dst + '.tmp'], check=True, capture_output=True)
        os.replace(dst + '.tmp', dst)


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def build(work):
    src, swf = padded(work)
    table = scenes(src)
    meta = {
        'about': 'The Emotional Bear emotes (tools/emote-art/bears.py): scenes of glitch-items ' + SWF_REL + ' (CC0) rendered by FFDec '
                 'on a stage padded by one stage size, at the zoom that fits the scene\'s art in the fit box, cropped to its alpha union, '
                 'lossy WebP at the given quality (lossless alpha), loop 0. frames: the scene\'s root timeline range; frameMs: the overlay '
                 'time over the frames rounded down to 10 ms, the empty last frame holding the rest; boxes: each rendered frame\'s alpha box.',
        'swf': SWF_REL, 'swfSha256': sha(src), 'fit': list(FIT), 'quality': QUALITY, 'emotes': {},
    }
    for state, (stem, overlay) in EMOTES.items():
        first, last = table[state]
        zoom, crop, frames = cut(swf, state, first, last, work)
        durs = durations(overlay, len(frames))
        dst = out_path(stem)
        encode(frames, durs, dst)
        meta['emotes'][state] = {
            'file': os.path.relpath(dst, os.path.join(SPIKE, 'public')), 'scene': state, 'frames': [first, last], 'count': len(frames),
            'overlayMs': overlay, 'frameMs': durs[0], 'zoom': zoom, 'crop': list(crop), 'size': list(frames[0].size),
            'boxes': [list(b) if b else None for b in (box(f) for f in frames)], 'sha256': sha(dst),
        }
        print(f'{dst}: {len(frames)} frames of {frames[0].size[0]}x{frames[0].size[1]} at zoom {zoom:.4f}, {os.path.getsize(dst)} bytes')
    write_meta(meta)
    return len(EMOTES)


def write_meta(meta):
    """bears.json, with each list of numbers (a box, a size, a range) on one line."""
    text = json.dumps(meta, indent=1)
    text = re.sub(r'\[\s*(-?[\d.]+(?:,\s*-?[\d.]+)*)\s*\]', lambda m: '[' + ', '.join(x.strip() for x in m.group(1).split(',')) + ']', text)
    open(META, 'w').write(text + '\n')


def check(work):
    """Problems with the shipped emotes (empty when current), and whether the render was compared."""
    from PIL import Image  # noqa: F401
    stale = []
    if not os.path.exists(META):
        return ['bears.json is missing'], False
    meta = json.load(open(META))
    rendering = can_render()
    if rendering:
        src, swf = padded(work)
        if sha(src) != meta['swfSha256']:
            stale.append(f'{SWF_REL} is not the SWF bears.json was built from')
        table = scenes(src)
    if set(meta['emotes']) != set(EMOTES):
        stale.append('bears.json does not list hug, high_5, moon and kiss')
    for state, (stem, overlay) in EMOTES.items():
        e = meta['emotes'].get(state)
        if not e:
            continue
        path = out_path(stem)
        if not os.path.exists(path):
            stale.append(f'{stem}.webp is missing')
            continue
        if sha(path) != e['sha256']:
            stale.append(f'bears.json does not describe {stem}.webp')
        count = e['frames'][1] - e['frames'][0] + 1
        if e['count'] != count or len(e['boxes']) != count or e['overlayMs'] != overlay:
            stale.append(f'{stem}: bears.json frames or overlay time are wrong')
            continue
        durs = durations(overlay, count)
        got, total, size, loop = shown(path, durs)
        if total != overlay or list(size) != e['size'] or loop != 0:
            stale.append(f'{stem}.webp: {total} ms, {size[0]} x {size[1]}, loop {loop}; want {overlay} ms, {e["size"]}, loop 0')
            continue
        if rendering:
            if tuple(table.get(state, ())) != tuple(e['frames']):
                stale.append(f'{stem}: the SWF\'s {state} scene is {table.get(state)}, not {e["frames"]}')
                continue
            _, crop, frames = cut(swf, state, *e['frames'], work, zoom=e['zoom'])
            if list(crop) != e['crop']:
                stale.append(f'{stem}: the render crops to {crop}, bears.json says {e["crop"]}')
                continue
            bad = [k for k, (g, s) in enumerate(zip(got, frames)) if mad(g, s) > MAD_MAX]
            if bad:
                stale.append(f'{stem}.webp: frames {bad[:8]} are not the SWF\'s {state} scene')
            want = [box(f) for f in frames]
        else:
            want = [tuple(b) if b else None for b in e['boxes']]
        off = []
        for k, (g, w) in enumerate(zip(got, want)):
            b = box(g)
            if (b is None) != (w is None) or (b and any(abs(x - y) > BOX_SLACK for x, y in zip(b, w))):
                off.append(k)
        if off:
            stale.append(f'{stem}.webp: frames {off[:8]} do not draw where the scene does (mis-cut or drawn over earlier frames)')
    return stale, rendering
