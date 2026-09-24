#!/usr/bin/env python3
"""Generate the extension icons (extension/icons/icon-{16,32,48,128}.png).

A white key on a navy rounded square, just enough to be recognizable in the toolbar.
Run: python3 tools/make-icons.py  (needs Pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "extension" / "icons"
BG = (30, 58, 95)      # navy
FG = (255, 255, 255)


def draw(size: int) -> Image.Image:
    # Draw at 4x and downscale for smooth edges
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=s * 0.22, fill=BG)

    # Key: ring on the left, shaft to the right, two teeth below the shaft
    u = s / 16
    ring_c = (5.2 * u, 8 * u)
    d.ellipse((ring_c[0] - 3.2 * u, ring_c[1] - 3.2 * u, ring_c[0] + 3.2 * u, ring_c[1] + 3.2 * u), fill=FG)
    d.ellipse((ring_c[0] - 1.4 * u, ring_c[1] - 1.4 * u, ring_c[0] + 1.4 * u, ring_c[1] + 1.4 * u), fill=BG)
    d.rectangle((8 * u, 7.1 * u, 14 * u, 8.9 * u), fill=FG)
    d.rectangle((11 * u, 8.9 * u, 12.2 * u, 11 * u), fill=FG)
    d.rectangle((13 * u, 8.9 * u, 14 * u, 10.4 * u), fill=FG)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    OUT.mkdir(exist_ok=True)
    for n in (16, 32, 48, 128):
        draw(n).save(OUT / f"icon-{n}.png")
        print("wrote", OUT / f"icon-{n}.png")
