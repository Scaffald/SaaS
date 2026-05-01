"""Generate all iOS App Store icon variants from the Scaffald master icon.

App Store marketing icon: 1024x1024, no alpha, no rounded corners.
We flatten the existing transparent icon onto the brand background, then
produce all the standard iOS sizes the asset catalog expects, plus a few
marketing variants useful for press kits.
"""
from PIL import Image
import os

SRC = "/sessions/affectionate-zen-hypatia/mnt/UNI-Construct/apps/scaffald/assets/icon.png"
OUT = "/sessions/affectionate-zen-hypatia/mnt/UNI-Construct/app-store-assets/icons"

# Brand background sampled from the existing icon (light cyan #d6f3f7 area)
BRAND_BG = (214, 243, 247, 255)

os.makedirs(OUT, exist_ok=True)
os.makedirs(f"{OUT}/ios", exist_ok=True)
os.makedirs(f"{OUT}/marketing", exist_ok=True)

src = Image.open(SRC).convert("RGBA")
print(f"Source: {src.size}")

# --- App Store marketing icon: flatten alpha, no transparency ---
flat_master = Image.new("RGB", (1024, 1024), BRAND_BG[:3])
flat_master.paste(src, (0, 0), src)
flat_master.save(f"{OUT}/AppStore-1024.png", "PNG", optimize=True)
print("Wrote AppStore-1024.png (no alpha)")

# Standard iOS app icon sizes (width @1x, scale)
# Source: Apple's App Icon size reference for iOS 17+
ios_sizes = [
    # iPhone notification
    (20, 2, "iphone-notification-40"),
    (20, 3, "iphone-notification-60"),
    # iPhone settings
    (29, 2, "iphone-settings-58"),
    (29, 3, "iphone-settings-87"),
    # iPhone Spotlight
    (40, 2, "iphone-spotlight-80"),
    (40, 3, "iphone-spotlight-120"),
    # iPhone app
    (60, 2, "iphone-app-120"),
    (60, 3, "iphone-app-180"),
    # iPad notifications
    (20, 1, "ipad-notification-20"),
    (20, 2, "ipad-notification-40"),
    # iPad settings
    (29, 1, "ipad-settings-29"),
    (29, 2, "ipad-settings-58"),
    # iPad Spotlight
    (40, 1, "ipad-spotlight-40"),
    (40, 2, "ipad-spotlight-80"),
    # iPad app
    (76, 1, "ipad-app-76"),
    (76, 2, "ipad-app-152"),
    # iPad Pro
    (83.5, 2, "ipad-pro-167"),
]

emitted = set()
for base, scale, label in ios_sizes:
    px = int(round(base * scale))
    if px in emitted:
        continue
    emitted.add(px)
    img = flat_master.resize((px, px), Image.LANCZOS)
    img.save(f"{OUT}/ios/icon-{px}.png", "PNG", optimize=True)

print(f"Wrote {len(emitted)} unique iOS icon sizes")

# --- Marketing variants ---
# 1) Transparent (icon glyph only on transparent BG) — useful for web/press
src.save(f"{OUT}/marketing/icon-transparent-1024.png", "PNG", optimize=True)

# 2) Rounded preview — what users will actually see on the home screen
def rounded(img, radius_pct=0.2237):
    """Apply an iOS-style superellipse-ish round-rect mask. We use a simple
    rounded rect at 22.37% radius which is Apple's published value."""
    from PIL import ImageDraw
    w, h = img.size
    radius = int(min(w, h) * radius_pct)
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, w, h), radius=radius, fill=255)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out

rounded(flat_master.convert("RGBA")).save(f"{OUT}/marketing/icon-rounded-preview-1024.png", "PNG", optimize=True)

# 3) Square master (RGB, used for any non-iOS surface that won't round corners)
flat_master.save(f"{OUT}/marketing/icon-square-1024.png", "PNG", optimize=True)

# 4) Half-size 512 marketing (handy for emails / readme)
flat_master.resize((512, 512), Image.LANCZOS).save(
    f"{OUT}/marketing/icon-square-512.png", "PNG", optimize=True
)

print("Wrote marketing variants (transparent, rounded-preview, square 1024 + 512)")
print("Done.")
