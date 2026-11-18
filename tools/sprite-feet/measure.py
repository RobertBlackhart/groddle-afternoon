"""Measure where the art stands in each cell of a sprite (tools/sprite-feet/build.mjs runs this).

    python3.11 -I tools/sprite-feet/measure.py < jobs.json > feet.json

A job: { key, path, fw, fh, cols, first, n, cells, derive, density, trim }. Cell i of the clip is
grid cell first + i (or cells[i]) at (col * fw, row * fh) in 1x units, density texels per 1x px;
derive { cols, rows } cuts fw x fh from the image's size (js/quest-rooms/kit.js sheetFrames); fw or
cols null is the whole image. trim { x, y, w, h } places a cropped cut inside its w x h cell (game.js
SHEETS trim). The answer per key: [cell w, cell h, foot x, foot y, frames measured], or null.

Per frame: the lowest row with at least MIN_PIXELS texels of alpha >= 50% (a soft shadow or one
stray texel does not count), and the middle of the frame's solid span across (the line a turn
mirrors the art about without moving it: the lowest feet alone wander with each stride, a
Piggy's down hoof crosses 30 px of its 88 px cell in one walk). Art that hovers over its own
shadow (a portal door, a dust trap) stands on the shadow: when a faint blob (alpha >= 5%) at
least a third as wide as the art sits under the solid art with empty rows between, the foot is
that blob's middle row (the shadow is drawn round the spot it stands over). Per clip: y is the 75th percentile of the frames' lowest rows (a stride that reaches
a texel lower in one frame does not lift the rest), x the frames' median. Both in 1x px from the
cell's top left, to 0.5 px. Empty clips report null.
"""
import json
import sys

import numpy as np
from PIL import Image

ALPHA = 128
MIN_PIXELS = 2
FAINT = 12


def frame_foot(alpha):
    solid = alpha >= ALPHA
    counts = solid.sum(axis=1)
    rows = np.nonzero(counts >= MIN_PIXELS)[0]
    if rows.size == 0:
        return None
    low = int(rows[-1])
    cols = np.nonzero(solid.sum(axis=0) >= MIN_PIXELS)[0]
    if cols.size == 0:
        cols = np.nonzero(solid.any(axis=0))[0]
    x = (int(cols[0]) + int(cols[-1]) + 1) / 2
    shadow = hover_shadow(alpha, low, int(cols[-1]) - int(cols[0]) + 1)
    return x, (shadow if shadow is not None else low + 1)


def hover_shadow(alpha, low, art_w):
    """The middle row (bottom edge) of a shadow drawn apart under hovering art, or None."""
    faint = (alpha[low + 1:] >= FAINT).sum(axis=1) >= 3
    empty = np.nonzero(~faint)[0]
    if empty.size == 0:
        return None
    after = np.nonzero(faint[empty[0]:])[0]
    if after.size == 0 or after[0] < max(4, round(0.03 * alpha.shape[0])):
        return None
    gap = int(empty[0] + after[0])
    start = low + 1 + gap
    end = start
    while end + 1 < alpha.shape[0] and (alpha[end + 1] >= FAINT).sum() >= 3:
        end += 1
    wide = np.nonzero((alpha[start:end + 1] >= FAINT).any(axis=0))[0]
    if wide.size == 0 or wide[-1] - wide[0] + 1 < art_w / 3:
        return None
    return (start + end + 1) / 2


def half(v):
    return round(v * 2) / 2


def measure(job, cache):
    im = cache.get(job['path'])
    if im is None:
        im = np.asarray(Image.open(job['path']).convert('RGBA'))[:, :, 3]
        cache.clear()
        cache[job['path']] = im
    d = job['density']
    H, W = im.shape
    if job.get('derive'):
        tw, th, cols = W // job['derive']['cols'], H // job['derive']['rows'], job['derive']['cols']
    elif job.get('fw') and job.get('cols'):
        tw, th, cols = round(job['fw'] * d), round(job['fh'] * d), job['cols']
    else:
        tw, th, cols = W, H, 1
    cells = job.get('cells') or [job.get('first', 0) + i for i in range(job.get('n') or 1)]
    trim = job.get('trim') or {'x': 0, 'y': 0, 'w': tw / d, 'h': th / d}
    xs, ys = [], []
    for c in cells:
        x0, y0 = (c % cols) * tw, (c // cols) * th
        if y0 + th > im.shape[0] or x0 + tw > im.shape[1]:
            continue
        f = frame_foot(im[y0:y0 + th, x0:x0 + tw])
        if f:
            xs.append(f[0] / d)
            ys.append(f[1] / d)
    if not ys:
        return None
    fx = half(float(np.median(xs)) + trim['x'])
    fy = half(float(np.percentile(ys, 75, method='higher')) + trim['y'])
    return [half(trim['w']), half(trim['h']), fx, fy, len(ys)]


def main():
    jobs = json.load(sys.stdin)
    cache = {}
    out = {}
    for job in sorted(jobs, key=lambda j: j['path']):
        out[job['key']] = measure(job, cache)
    json.dump(out, sys.stdout, sort_keys=True)


main()
