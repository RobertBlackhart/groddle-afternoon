#!/usr/bin/env python3.11
"""G916 (#446): Mortar Barnacles measured on gameplay video frames and screenshots of a street.

For streets no full-street snap covers (tools/snap-placements/barnacles.py needs one), a frame is
registered on the street's full-street template (GoodnightGroddleArchive FullStreetTemplates:
community screenshots stitched 1 px = 1 street px; reference only) by normalized cross-correlation
(grey, FFT, coarse at 1/4 then refined at full size) over a range of scales (street px per frame
px), and our CC0 barnacle art (assets/sprites/resources/mortar-barnacle-blister1-6.webp, frames 1-3,
scaled to the frame) is matched in the frame. Each hit maps to street px through the registration.
Nothing is copied from the pictures: what comes out is positions.

Accept a hit by eye and by numbers: the frame registers well (score over ~0.55, the scale agreeing
with the street's other frames, the game's minimap agreeing on where the camera is), the art scores
0.87 or more, and where two frames show the same barnacle they agree within a few px. The accepted
spots go in public/assets/content/barnacle-picture-spots.json with the frames they came from, and
tools/build-barnacle-wall-spots.mjs places the rest by rule.

usage: python3.11 -I tools/snap-placements/barnacle-frames.py <repo> <template.png> <out.json> <frame>...
  env SCALES="a,b,step" (default 1.30,1.62,0.02), CROP="l,t,r,b" (the game view in the frame),
  BTH (art score floor for the printout, default 0.80)
"""
import sys, os, json, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
repo, tpl_path, out_path, frames = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
D = 4
SPR = os.path.join(repo, 'public/assets/sprites/resources')
FR = {1: (39, 44), 2: (35, 40), 3: (35, 39), 4: (36, 40), 5: (32, 39), 6: (39, 47)}

def gray(a): return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def ncc(I, T, M=None):
    H, W = I.shape; h, w = T.shape
    if M is None: M = np.ones_like(T)
    shape = (H + h, W + w)
    F1 = np.fft.rfft2(I, shape); F2 = np.fft.rfft2(I * I, shape)
    n = M.sum(); Tp = (T - (T * M).sum() / n) * M
    c = lambda F, k: np.fft.irfft2(F * np.conj(np.fft.rfft2(k, shape)), shape)[:H - h + 1, :W - w + 1]
    num = c(F1, Tp); s1 = c(F1, M); s2 = c(F2, M)
    var = np.maximum(s2 - s1 * s1 / n, 0)
    sc = num / np.sqrt((Tp * Tp).sum() * np.maximum(var, 1e-9))
    sc[var / n < 1e-4] = 0
    return sc

tpl = Image.open(tpl_path).convert('RGB')
TW, TH = tpl.size
Td = gray(np.asarray(tpl.resize((TW // D, TH // D), Image.LANCZOS)).astype(np.float64) / 255)
a, b, st = [float(x) for x in os.environ.get('SCALES', '1.30,1.62,0.02').split(',')]
crop = [int(x) for x in os.environ.get('CROP', '16,40,660,465').split(',')]
sprites = {v: Image.open(os.path.join(SPR, f'mortar-barnacle-blister{v}.webp')).convert('RGBA') for v in FR}
out = []
for fp in frames:
    im = Image.open(fp).convert('RGB').crop(crop)
    best = None
    s = a
    while s <= b + 1e-9:
        pw, ph = int(im.width * s / D), int(im.height * s / D)
        P = gray(np.asarray(im.resize((pw, ph), Image.LANCZOS)).astype(np.float64) / 255)
        sc = ncc(Td, P)
        y, x = np.unravel_index(np.argmax(sc), sc.shape)
        if best is None or sc[y, x] > best[0]: best = (float(sc[y, x]), s, int(x) * D, int(y) * D)
        s += st
    score, s, ox, oy = best
    # refine at full res around the coarse offset
    pw, ph = int(round(im.width * s)), int(round(im.height * s))
    P = gray(np.asarray(im.resize((pw, ph), Image.LANCZOS)).astype(np.float64) / 255)
    x0, y0 = max(0, ox - 12), max(0, oy - 12)
    region = gray(np.asarray(tpl.crop((x0, y0, min(TW, x0 + pw + 24), min(TH, y0 + ph + 24)))).astype(np.float64) / 255)
    if region.shape[0] >= ph and region.shape[1] >= pw:
        sc = ncc(region, P); y, x = np.unravel_index(np.argmax(sc), sc.shape); ox, oy, score = x0 + int(x), y0 + int(y), float(sc[y, x])
    # barnacles in the frame: our art at 1/s
    F = gray(np.asarray(im).astype(np.float64) / 255)
    hits = []
    for v, (fw, fh) in FR.items():
        for state in (1, 2, 3):
            fr = sprites[v].crop((state * fw, 0, state * fw + fw, fh))
            w2, h2 = max(6, round(fw / s)), max(6, round(fh / s))
            fr = np.asarray(fr.resize((w2, h2), Image.LANCZOS)).astype(np.float64) / 255
            M = (fr[..., 3] > 0.5).astype(np.float64)
            sc = ncc(F, gray(fr), M)
            for yy, xx in zip(*np.where(sc >= float(os.environ.get('BTH', '0.80')))):
                hits.append((float(sc[yy, xx]), xx + w2 / 2, yy + h2, v))
    hits.sort(reverse=True)
    picks = []
    for h in hits:
        if all(abs(h[1] - p[1]) > 10 or abs(h[2] - p[2]) > 10 for p in picks): picks.append(h)
    street = [{'x': round(ox + bx * s, 1), 'y': round(oy + by * s, 1), 'v': v, 'score': round(sc_, 3), 'fx': round(bx + crop[0]), 'fy': round(by + crop[1])} for sc_, bx, by, v in picks]
    out.append({'frame': fp, 'reg': {'score': round(score, 3), 'scale': round(s, 3), 'ox': ox, 'oy': oy}, 'barnacles': street})
    print(os.path.basename(fp), 'reg', round(score, 3), 's', round(s, 3), 'at', ox, oy, 'barnacles', [(b_['fx'], b_['fy'], b_['x'], b_['y'], b_['score']) for b_ in street])
json.dump(out, open(out_path, 'w'), indent=1)
