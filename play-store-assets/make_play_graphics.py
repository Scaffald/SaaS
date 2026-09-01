#!/usr/bin/env python3
"""Generate the Google Play graphic assets Scaffald doesn't already have.

Play requires, at minimum:

  Feature graphic   1024 x 500   PNG/JPEG, no alpha   <- did not exist
  App icon           512 x 512   32-bit PNG           <- reuse existing 512
  Phone screenshots  >=2         ratio 9:16 .. 16:9   <- see screenshots/README.md

Run from the repo root:

    python3 play-store-assets/make_play_graphics.py

Paths are resolved relative to this file, deliberately. The App Store
equivalent (app-store-assets/make_screenshots.py) hardcodes
/sessions/affectionate-zen-hypatia/... from whatever machine it was written on
and cannot run anywhere else.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
HERE = Path(__file__).resolve().parent
OUT = HERE / "graphics"
ICON_512 = ROOT / "app-store-assets" / "icons" / "marketing" / "icon-square-512.png"
ICON_1024 = ROOT / "app-store-assets" / "icons" / "marketing" / "icon-square-1024.png"

# Brand palette, taken from app-store-assets/make_screenshots.py so the two
# stores do not drift apart visually.
BG_TOP = (214, 243, 247)
BG_BOTTOM = (180, 226, 234)
BRAND = (10, 61, 79)
ACCENT_DEEP = (0, 131, 143)
TEXT_DIM = (60, 90, 105)
WHITE = (255, 255, 255)

FEATURE_W, FEATURE_H = 1024, 500


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """A real font if the system has one, Pillow's default if not."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def vertical_gradient(size: tuple[int, int], top: tuple, bottom: tuple) -> Image.Image:
    w, h = size
    grad = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        grad.putpixel(
            (0, y),
            tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)),
        )
    return grad.resize((w, h), Image.LANCZOS)


def make_feature_graphic() -> Path:
    """1024x500, no alpha.

    Play crops and overlays this in several places, so everything that must
    survive is kept inside a generous safe area rather than pushed to the
    edges.
    """
    img = vertical_gradient((FEATURE_W, FEATURE_H), BG_TOP, BG_BOTTOM)
    draw = ImageDraw.Draw(img)

    # Icon on the left, optically centred.
    src = ICON_1024 if ICON_1024.exists() else ICON_512
    if not src.exists():
        raise SystemExit(f"no source icon at {src}")
    icon = Image.open(src).convert("RGBA")
    icon_size = 260
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

    # Rounded corners, so it reads as an app icon rather than a pasted square.
    mask = Image.new("L", (icon_size, icon_size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, icon_size, icon_size), radius=int(icon_size * 0.22), fill=255
    )
    icon_x, icon_y = 84, (FEATURE_H - icon_size) // 2
    img.paste(icon, (icon_x, icon_y), mask)

    text_x = icon_x + icon_size + 64
    draw.text((text_x, 168), "Scaffald", font=font(76, bold=True), fill=BRAND)
    draw.text(
        (text_x, 258),
        "Hiring for the technical trades",
        font=font(34),
        fill=ACCENT_DEEP,
    )
    draw.text(
        (text_x, 306),
        "Find trade jobs. Build your crew.",
        font=font(28),
        fill=TEXT_DIM,
    )

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "feature-graphic-1024x500.png"
    img.convert("RGB").save(path, "PNG")  # RGB: Play rejects alpha here
    return path


def copy_icon() -> Path:
    """Play wants 512x512 32-bit PNG. One already exists; place it by Play's name."""
    if not ICON_512.exists():
        raise SystemExit(f"no 512 icon at {ICON_512}")
    icon = Image.open(ICON_512).convert("RGBA")
    if icon.size != (512, 512):
        icon = icon.resize((512, 512), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / "app-icon-512x512.png"
    icon.save(path, "PNG")
    return path


def main() -> int:
    made = [make_feature_graphic(), copy_icon()]
    for p in made:
        with Image.open(p) as im:
            print(f"  {im.size[0]}x{im.size[1]}  {im.mode:<5} {p.relative_to(ROOT)}")
    print("\nStill needed: phone screenshots — see play-store-assets/screenshots/README.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
