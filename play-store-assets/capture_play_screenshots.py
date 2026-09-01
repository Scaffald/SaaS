#!/usr/bin/env python3
"""Frame real app captures as Play-spec phone screenshots.

Takes screenshots you captured from a real build and composes them onto a
branded 1080x1920 canvas with a headline, matching the five marketing panels in
app-store-assets/make_screenshots.py.

    # put real captures in play-store-assets/screenshots/raw/ named
    # 01-jobs_map.png, 02-quick_apply.png, ... then:
    python3 play-store-assets/capture_play_screenshots.py

This does NOT synthesise app UI. If a raw capture is missing, the panel is
skipped and reported — a listing with three real screenshots is fine; a
listing with five invented ones is a policy problem. See screenshots/README.md.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
RAW = HERE / "screenshots" / "raw"
OUT = HERE / "screenshots"

W, H = 1080, 1920  # 9:16 — inside Play's 0.5625..1.778 range

BG_TOP = (214, 243, 247)
BG_BOTTOM = (180, 226, 234)
BRAND = (10, 61, 79)
ACCENT_DEEP = (0, 131, 143)
TEXT_DIM = (60, 90, 105)

PANELS = [
    ("01-jobs_map", "FIND WORK", "Skilled trade jobs,\nright on your map."),
    ("02-quick_apply", "ONE-TAP APPLY", "Apply in seconds,\nnot afternoons."),
    ("03-worker_card", "FOR EMPLOYERS", "See who can actually\ndo the work."),
    ("04-messaging", "TALK DIRECTLY", "No recruiters\nin the middle."),
    ("05-assessments", "PROVE IT", "Skills employers\nactually trust."),
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def gradient(size: tuple[int, int]) -> Image.Image:
    w, h = size
    g = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(h - 1, 1)
        g.putpixel((0, y), tuple(
            int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)
        ))
    return g.resize((w, h), Image.LANCZOS)


def compose(raw_path: Path, kicker: str, headline: str) -> Image.Image:
    img = gradient((W, H))
    draw = ImageDraw.Draw(img)

    draw.text((80, 120), kicker, font=font(34, bold=True), fill=ACCENT_DEEP)
    draw.multiline_text((80, 180), headline, font=font(64, bold=True),
                        fill=BRAND, spacing=14)

    shot = Image.open(raw_path).convert("RGBA")
    # Scale to the frame width, preserving the capture's own aspect ratio —
    # never stretch a real screenshot to fit.
    frame_w = W - 160
    scale = frame_w / shot.width
    shot = shot.resize((frame_w, int(shot.height * scale)), Image.LANCZOS)

    max_h = H - 460
    if shot.height > max_h:
        # Crop from the bottom rather than squash; the top of a screen carries
        # the content that identifies it.
        shot = shot.crop((0, 0, shot.width, max_h))

    x, y = 80, 400
    radius = 36
    mask = Image.new("L", shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, shot.width, shot.height),
                                           radius=radius, fill=255)
    shadow = Image.new("RGBA", (shot.width + 24, shot.height + 24), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (12, 12, shot.width + 12, shot.height + 12), radius=radius,
        fill=(10, 61, 79, 40))
    img.paste(shadow, (x - 12, y - 12), shadow)
    img.paste(shot, (x, y), mask)
    return img


def main() -> int:
    if not RAW.exists():
        print(f"No raw captures directory: {RAW}")
        print("Create it and add real captures — see screenshots/README.md.")
        return 1

    made, missing = [], []
    for name, kicker, headline in PANELS:
        src = next((RAW / f"{name}{ext}" for ext in (".png", ".jpg")
                    if (RAW / f"{name}{ext}").exists()), None)
        if src is None:
            missing.append(name)
            continue
        out = OUT / f"phone-{name}.png"
        compose(src, kicker, headline).save(out, "PNG")
        made.append(out)

    for p in made:
        with Image.open(p) as im:
            print(f"  {im.size[0]}x{im.size[1]}  {p.name}")
    if missing:
        print("\nNo raw capture for (skipped, not invented):")
        for m in missing:
            print(f"  - {m}")
    if len(made) < 2:
        print(f"\nPlay requires at least 2 phone screenshots; {len(made)} produced.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
