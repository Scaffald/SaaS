"""Generate App Store marketing screenshot templates for Scaffald.

We render 5 panels at each required device size:

  iPhone 6.9" (iPhone 16 Pro Max)        1290 x 2796   — required
  iPhone 6.5" (iPhone 11 Pro Max etc)    1242 x 2688   — long-supported
  iPad 13"   (iPad Pro M4)               2064 x 2752   — required for iPad

Each panel = brand background + headline + sub + a stylized device-frame
mockup of the screen. These are *templates* — the in-app mockups are
illustrative, not real screen captures, so when you have real device
captures you can drop them into the device frame areas and re-export.

Style is deliberately minimal so it survives Apple's App Store compression
and reads on a 4-inch preview row.
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/sessions/affectionate-zen-hypatia/mnt/UNI-Construct/app-store-assets/screenshots"
ICON_SRC = "/sessions/affectionate-zen-hypatia/mnt/UNI-Construct/apps/scaffald/assets/icon.png"
LOGO_SRC = "/sessions/affectionate-zen-hypatia/mnt/UNI-Construct/apps/scaffald/assets/logo-full.png"

# Brand palette
BG_TOP = (214, 243, 247)      # light cyan
BG_BOTTOM = (180, 226, 234)   # slightly deeper
BRAND = (10, 61, 79)          # dark navy (wordmark color)
ACCENT = (38, 198, 218)       # cyan accent
ACCENT_DEEP = (0, 131, 143)   # deep teal
WHITE = (255, 255, 255)
TEXT_DIM = (60, 90, 105)
SHADOW = (10, 61, 79, 60)

# 5 marketing panels
PANELS = [
    {
        "kicker": "FIND WORK",
        "headline": "Skilled trade jobs,\nright on your map.",
        "sub": "Browse openings near you. Filter by trade, pay, and shift.",
        "screen": "jobs_map",
    },
    {
        "kicker": "ONE-TAP APPLY",
        "headline": "Apply in seconds,\nnot afternoons.",
        "sub": "Save your trade profile once. Apply to anything with one tap.",
        "screen": "quick_apply",
    },
    {
        "kicker": "HIRE FAST",
        "headline": "Build your crew\nfor Monday morning.",
        "sub": "Search verified workers. See certs, location, and ratings instantly.",
        "screen": "worker_card",
    },
    {
        "kicker": "BUILT-IN MESSAGING",
        "headline": "Talk directly.\nNo recruiters.",
        "sub": "Chat with employers and crew leads in-app. Stay on the job.",
        "screen": "messaging",
    },
    {
        "kicker": "PROVE YOUR SKILLS",
        "headline": "Assessments employers\nactually trust.",
        "sub": "Verify your trade skills and stand out to the best contractors.",
        "screen": "assessments",
    },
]

DEVICE_SIZES = [
    ("iphone-6.9", 1290, 2796),
    ("iphone-6.5", 1242, 2688),
    ("ipad-13", 2064, 2752),
]


def font(size, bold=False):
    """Find a usable font on the box. Falls back to default if nothing matches."""
    candidates_bold = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ]
    candidates_reg = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for c in (candidates_bold if bold else candidates_reg):
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()


def gradient(width, height, top, bottom):
    base = Image.new("RGB", (width, height), top)
    px = base.load()
    for y in range(height):
        t = y / max(1, height - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(width):
            px[x, y] = (r, g, b)
    return base


def rounded_rect_mask(size, radius):
    mask = Image.new("L", size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def draw_device_frame(canvas, x, y, w, h, render_screen):
    """Draw an iPhone-style frame with notch and a screen image."""
    # Outer bezel
    bezel_radius = int(min(w, h) * 0.075)
    bezel = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(bezel)
    # subtle drop shadow
    shadow = Image.new("RGBA", (w + 80, h + 80), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((40, 60, w + 40, h + 60), radius=bezel_radius, fill=(10, 30, 45, 90))
    shadow = shadow.filter_blur() if False else shadow
    try:
        from PIL import ImageFilter
        shadow = shadow.filter(ImageFilter.GaussianBlur(20))
    except Exception:
        pass
    canvas.paste(shadow, (x - 40, y - 60), shadow)

    # Bezel body
    d.rounded_rectangle((0, 0, w, h), radius=bezel_radius, fill=(20, 32, 42))
    # Screen
    pad = int(w * 0.025)
    screen_w = w - pad * 2
    screen_h = h - pad * 2
    screen_img = Image.new("RGB", (screen_w, screen_h), WHITE)
    render_screen(screen_img)
    screen_radius = int(bezel_radius * 0.7)
    screen_mask = rounded_rect_mask((screen_w, screen_h), screen_radius)
    bezel.paste(screen_img, (pad, pad), screen_mask)

    # Dynamic Island
    island_w = int(w * 0.32)
    island_h = int(island_w * 0.28)
    island_x = (w - island_w) // 2
    island_y = int(pad * 1.4)
    d.rounded_rectangle(
        (island_x, island_y, island_x + island_w, island_y + island_h),
        radius=island_h // 2,
        fill=(8, 12, 18),
    )

    canvas.paste(bezel, (x, y), bezel)


# ----- Screen content renderers -----

def screen_status_bar(d, w, time_str="9:41"):
    f = font(int(w * 0.045), bold=True)
    d.text((int(w * 0.06), int(w * 0.04)), time_str, fill=BRAND, font=f)
    # right side icons (signal / wifi / battery) — simple shapes
    rx = w - int(w * 0.06)
    by = int(w * 0.05)
    # battery
    d.rounded_rectangle((rx - int(w * 0.07), by, rx, by + int(w * 0.03)), radius=3, outline=BRAND, width=2)
    d.rectangle((rx - int(w * 0.067), by + 3, rx - int(w * 0.013), by + int(w * 0.03) - 3), fill=BRAND)


def render_jobs_map(img):
    w, h = img.size
    d = ImageDraw.Draw(img)
    # Map area
    d.rectangle((0, 0, w, int(h * 0.55)), fill=(220, 235, 240))
    # Faux roads
    for i, y in enumerate([0.18, 0.30, 0.42]):
        d.line((0, int(h * y), w, int(h * y) + (i * 30 - 30)), fill=(200, 220, 225), width=8)
    for x in [0.25, 0.55, 0.78]:
        d.line((int(w * x), 0, int(w * x) - 30, int(h * 0.55)), fill=(200, 220, 225), width=8)

    # Job pins
    pins = [(0.30, 0.18), (0.62, 0.28), (0.45, 0.40), (0.80, 0.45), (0.20, 0.45)]
    for px, py in pins:
        cx, cy = int(w * px), int(h * py)
        r = int(w * 0.05)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ACCENT_DEEP)
        d.ellipse((cx - r + 8, cy - r + 8, cx + r - 8, cy + r - 8), fill=WHITE)
        d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=ACCENT_DEEP)

    screen_status_bar(d, w)

    # Bottom card list
    list_top = int(h * 0.58)
    d.rounded_rectangle((0, list_top, w, h), radius=int(w * 0.08), fill=WHITE)
    # Drag handle
    d.rounded_rectangle(
        (w // 2 - int(w * 0.07), list_top + 18, w // 2 + int(w * 0.07), list_top + 26),
        radius=4, fill=(200, 215, 220)
    )

    f_h = font(int(w * 0.055), bold=True)
    f_s = font(int(w * 0.038))
    f_t = font(int(w * 0.034), bold=True)

    d.text((int(w * 0.06), list_top + int(w * 0.06)), "12 jobs near you", fill=BRAND, font=f_h)

    cards = [
        ("Structural Welder", "Shaw Industrial · 2.1 mi", "$42–55 /hr"),
        ("Journeyman Electrician", "Vanguard Electric · 5.8 mi", "$38–48 /hr"),
        ("Scaffold Builder", "Apex Scaffold · 7.3 mi", "$32–42 /hr"),
    ]
    cy = list_top + int(w * 0.18)
    for title, sub, pay in cards:
        d.rounded_rectangle((int(w * 0.05), cy, w - int(w * 0.05), cy + int(w * 0.20)), radius=20, fill=(244, 250, 252))
        d.text((int(w * 0.08), cy + int(w * 0.025)), title, fill=BRAND, font=f_t)
        d.text((int(w * 0.08), cy + int(w * 0.085)), sub, fill=TEXT_DIM, font=f_s)
        # Pay pill
        pw = int(w * 0.32)
        ph = int(w * 0.07)
        px_ = w - int(w * 0.08) - pw
        py_ = cy + int(w * 0.025)
        d.rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ph // 2, fill=ACCENT)
        bbox = d.textbbox((0, 0), pay, font=f_s)
        tw = bbox[2] - bbox[0]
        d.text((px_ + (pw - tw) // 2, py_ + (ph - (bbox[3] - bbox[1])) // 2 - 4), pay, fill=WHITE, font=f_s)
        cy += int(w * 0.24)


def render_quick_apply(img):
    w, h = img.size
    d = ImageDraw.Draw(img)
    img.paste(Image.new("RGB", (w, h), (250, 253, 254)))
    d = ImageDraw.Draw(img)
    screen_status_bar(d, w)

    # Hero card
    top = int(h * 0.10)
    d.rounded_rectangle((int(w * 0.05), top, w - int(w * 0.05), top + int(h * 0.25)), radius=24, fill=WHITE, outline=(220, 235, 240), width=2)
    d.rectangle((int(w * 0.10), top + int(w * 0.06), int(w * 0.10) + int(w * 0.16), top + int(w * 0.06) + int(w * 0.16)), fill=ACCENT)
    f_t = font(int(w * 0.062), bold=True)
    f_s = font(int(w * 0.040))
    d.text((int(w * 0.30), top + int(w * 0.05)), "Pipefitter", fill=BRAND, font=f_t)
    d.text((int(w * 0.30), top + int(w * 0.13)), "Northstar Mechanical", fill=TEXT_DIM, font=f_s)
    d.text((int(w * 0.30), top + int(w * 0.18)), "$45 /hr · Full-time", fill=ACCENT_DEEP, font=f_s)

    # "Your profile" preview
    p_top = top + int(h * 0.30)
    f_lbl = font(int(w * 0.040), bold=True)
    d.text((int(w * 0.08), p_top), "YOUR SAVED PROFILE", fill=ACCENT_DEEP, font=f_lbl)

    fields = [
        ("Trade", "Pipefitter (8 yrs)"),
        ("Location", "Houston, TX"),
        ("Certifications", "OSHA 30 · NCCER · TWIC"),
        ("Availability", "Mon Apr 12"),
    ]
    cy = p_top + int(w * 0.07)
    for label, val in fields:
        d.rounded_rectangle((int(w * 0.05), cy, w - int(w * 0.05), cy + int(w * 0.13)), radius=18, fill=WHITE, outline=(220, 235, 240), width=2)
        d.text((int(w * 0.08), cy + int(w * 0.020)), label, fill=TEXT_DIM, font=font(int(w * 0.034)))
        d.text((int(w * 0.08), cy + int(w * 0.06)), val, fill=BRAND, font=font(int(w * 0.044), bold=True))
        cy += int(w * 0.155)

    # Big apply button
    btn_y = h - int(h * 0.10)
    d.rounded_rectangle((int(w * 0.06), btn_y - int(w * 0.09), w - int(w * 0.06), btn_y), radius=int(w * 0.045), fill=ACCENT_DEEP)
    f_btn = font(int(w * 0.055), bold=True)
    txt = "Quick Apply"
    bb = d.textbbox((0, 0), txt, font=f_btn)
    d.text(((w - (bb[2] - bb[0])) // 2, btn_y - int(w * 0.075)), txt, fill=WHITE, font=f_btn)


def render_worker_card(img):
    w, h = img.size
    d = ImageDraw.Draw(img)
    screen_status_bar(d, w)

    # Header
    f_h = font(int(w * 0.062), bold=True)
    d.text((int(w * 0.06), int(h * 0.07)), "Available Workers", fill=BRAND, font=f_h)
    f_s = font(int(w * 0.036))
    d.text((int(w * 0.06), int(h * 0.115)), "Within 25 mi · Available this week", fill=TEXT_DIM, font=f_s)

    # Filter chips
    cy = int(h * 0.16)
    cx = int(w * 0.06)
    for chip, active in [("All trades", True), ("Welders", False), ("Electricians", False), ("HVAC", False)]:
        f_c = font(int(w * 0.034), bold=True)
        bb = d.textbbox((0, 0), chip, font=f_c)
        cw = bb[2] - bb[0] + int(w * 0.06)
        ch = int(w * 0.075)
        fill = ACCENT_DEEP if active else WHITE
        text_fill = WHITE if active else BRAND
        d.rounded_rectangle((cx, cy, cx + cw, cy + ch), radius=ch // 2, fill=fill, outline=(200, 220, 225), width=2)
        d.text((cx + int(w * 0.03), cy + (ch - (bb[3] - bb[1])) // 2 - 4), chip, fill=text_fill, font=f_c)
        cx += cw + int(w * 0.025)

    # Worker cards
    workers = [
        ("Marcus Reyes", "Welder · 12 yrs · 4.9", "Houston, TX · 3.2 mi", "Available Mon"),
        ("Jordan Pace", "Electrician · 7 yrs · 4.8", "Pearland, TX · 8.1 mi", "Available Wed"),
        ("Sam Whitfield", "HVAC Tech · 5 yrs · 4.7", "Sugar Land, TX · 11.4 mi", "Available Now"),
    ]
    cy = int(h * 0.28)
    for name, role, loc, avail in workers:
        d.rounded_rectangle((int(w * 0.05), cy, w - int(w * 0.05), cy + int(w * 0.22)), radius=22, fill=WHITE, outline=(220, 235, 240), width=2)
        # Avatar
        ax = int(w * 0.10)
        ay = cy + int(w * 0.04)
        ar = int(w * 0.07)
        d.ellipse((ax, ay, ax + ar * 2, ay + ar * 2), fill=ACCENT)
        initials = "".join(p[0] for p in name.split()[:2])
        f_i = font(int(w * 0.05), bold=True)
        bb = d.textbbox((0, 0), initials, font=f_i)
        d.text((ax + ar - (bb[2] - bb[0]) // 2, ay + ar - (bb[3] - bb[1]) // 2 - 4), initials, fill=WHITE, font=f_i)
        # Text
        f_n = font(int(w * 0.046), bold=True)
        d.text((ax + ar * 2 + int(w * 0.04), cy + int(w * 0.035)), name, fill=BRAND, font=f_n)
        d.text((ax + ar * 2 + int(w * 0.04), cy + int(w * 0.085)), role, fill=ACCENT_DEEP, font=font(int(w * 0.034), bold=True))
        d.text((ax + ar * 2 + int(w * 0.04), cy + int(w * 0.13)), loc, fill=TEXT_DIM, font=font(int(w * 0.032)))
        # Avail pill
        pw = int(w * 0.34)
        ph = int(w * 0.062)
        px_ = w - int(w * 0.08) - pw
        py_ = cy + int(w * 0.035)
        d.rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ph // 2, fill=(225, 246, 250))
        f_a = font(int(w * 0.030), bold=True)
        bb = d.textbbox((0, 0), avail, font=f_a)
        d.text((px_ + (pw - (bb[2] - bb[0])) // 2, py_ + (ph - (bb[3] - bb[1])) // 2 - 3), avail, fill=ACCENT_DEEP, font=f_a)
        cy += int(w * 0.24)


def render_messaging(img):
    w, h = img.size
    d = ImageDraw.Draw(img)
    screen_status_bar(d, w)
    # Top bar
    d.rectangle((0, int(h * 0.07), w, int(h * 0.15)), fill=WHITE)
    f_n = font(int(w * 0.052), bold=True)
    f_s = font(int(w * 0.034))
    d.text((int(w * 0.18), int(h * 0.085)), "Vanguard Electric", fill=BRAND, font=f_n)
    d.text((int(w * 0.18), int(h * 0.115)), "Foreman · Active now", fill=ACCENT_DEEP, font=f_s)
    # avatar
    d.ellipse((int(w * 0.05), int(h * 0.085), int(w * 0.05) + int(w * 0.10), int(h * 0.085) + int(w * 0.10)), fill=ACCENT)

    # Messages
    msgs = [
        ("them", "Saw your profile — are you free Mon AM?"),
        ("me", "Yeah, I can be on site by 7."),
        ("them", "Perfect. Bringing your own PPE?"),
        ("me", "Always. OSHA 30 + harness."),
        ("them", "Great. I'll send the offer through Scaffald."),
    ]
    cy = int(h * 0.18)
    for who, text in msgs:
        f_m = font(int(w * 0.040))
        # word wrap
        lines = []
        words = text.split()
        line = ""
        max_w = int(w * 0.62)
        for word in words:
            test = (line + " " + word).strip()
            if d.textbbox((0, 0), test, font=f_m)[2] - d.textbbox((0, 0), test, font=f_m)[0] > max_w:
                lines.append(line)
                line = word
            else:
                line = test
        if line:
            lines.append(line)
        line_h = int(w * 0.058)
        bubble_h = line_h * len(lines) + int(w * 0.04)
        bubble_w = max(d.textbbox((0, 0), L, font=f_m)[2] for L in lines) + int(w * 0.06)
        if who == "me":
            x1 = w - int(w * 0.05) - bubble_w
            x2 = w - int(w * 0.05)
            fill = ACCENT_DEEP
            text_fill = WHITE
        else:
            x1 = int(w * 0.05)
            x2 = x1 + bubble_w
            fill = (240, 247, 250)
            text_fill = BRAND
        d.rounded_rectangle((x1, cy, x2, cy + bubble_h), radius=int(w * 0.05), fill=fill)
        for i, L in enumerate(lines):
            d.text((x1 + int(w * 0.03), cy + int(w * 0.02) + i * line_h), L, fill=text_fill, font=f_m)
        cy += bubble_h + int(w * 0.03)

    # Input bar
    bar_y = h - int(h * 0.08)
    d.rectangle((0, bar_y, w, h), fill=WHITE)
    d.rounded_rectangle((int(w * 0.06), bar_y + int(w * 0.025), w - int(w * 0.20), bar_y + int(w * 0.10)), radius=int(w * 0.04), fill=(240, 247, 250))
    d.text((int(w * 0.10), bar_y + int(w * 0.045)), "Message Vanguard…", fill=TEXT_DIM, font=font(int(w * 0.038)))
    d.ellipse((w - int(w * 0.16), bar_y + int(w * 0.025), w - int(w * 0.06), bar_y + int(w * 0.10)), fill=ACCENT_DEEP)


def render_assessments(img):
    w, h = img.size
    d = ImageDraw.Draw(img)
    screen_status_bar(d, w)
    f_h = font(int(w * 0.064), bold=True)
    f_s = font(int(w * 0.038))
    d.text((int(w * 0.06), int(h * 0.07)), "Skill Assessments", fill=BRAND, font=f_h)
    d.text((int(w * 0.06), int(h * 0.118)), "Verified by Scaffald", fill=TEXT_DIM, font=f_s)

    items = [
        ("Welding — TIG", 100, "Verified", True),
        ("Welding — MIG", 88, "Verified", True),
        ("Blueprint Reading", 92, "Verified", True),
        ("OSHA 30 Safety", 0, "In progress", False),
        ("Hydraulics", 0, "Start", False),
    ]
    cy = int(h * 0.18)
    for title, score, status, done in items:
        d.rounded_rectangle((int(w * 0.05), cy, w - int(w * 0.05), cy + int(w * 0.18)), radius=22, fill=WHITE, outline=(220, 235, 240), width=2)
        d.text((int(w * 0.08), cy + int(w * 0.03)), title, fill=BRAND, font=font(int(w * 0.046), bold=True))
        # Progress bar
        bar_x1 = int(w * 0.08)
        bar_x2 = w - int(w * 0.32)
        bar_y = cy + int(w * 0.10)
        bar_h = int(w * 0.025)
        d.rounded_rectangle((bar_x1, bar_y, bar_x2, bar_y + bar_h), radius=bar_h // 2, fill=(230, 240, 244))
        if score > 0:
            fill_x = bar_x1 + int((bar_x2 - bar_x1) * (score / 100))
            d.rounded_rectangle((bar_x1, bar_y, fill_x, bar_y + bar_h), radius=bar_h // 2, fill=ACCENT_DEEP)
        # Status pill
        pill_color = (225, 246, 250) if done else (255, 244, 222)
        text_color = ACCENT_DEEP if done else (160, 110, 20)
        f_p = font(int(w * 0.034), bold=True)
        bb = d.textbbox((0, 0), status, font=f_p)
        pw = bb[2] - bb[0] + int(w * 0.05)
        ph = int(w * 0.065)
        px_ = w - int(w * 0.08) - pw
        py_ = cy + int(w * 0.04)
        d.rounded_rectangle((px_, py_, px_ + pw, py_ + ph), radius=ph // 2, fill=pill_color)
        d.text((px_ + int(w * 0.025), py_ + (ph - (bb[3] - bb[1])) // 2 - 3), status, fill=text_color, font=f_p)
        cy += int(w * 0.20)


SCREEN_RENDERERS = {
    "jobs_map": render_jobs_map,
    "quick_apply": render_quick_apply,
    "worker_card": render_worker_card,
    "messaging": render_messaging,
    "assessments": render_assessments,
}


def make_panel(panel, w, h, is_ipad=False):
    bg = gradient(w, h, BG_TOP, BG_BOTTOM)
    d = ImageDraw.Draw(bg)

    # Top safe area for headline (approx 28% of height on phone, 22% on iPad)
    text_top = int(h * (0.06 if not is_ipad else 0.05))
    pad_x = int(w * 0.07)

    f_kicker = font(int(w * (0.030 if not is_ipad else 0.022)), bold=True)
    d.text((pad_x, text_top), panel["kicker"], fill=ACCENT_DEEP, font=f_kicker)

    f_head = font(int(w * (0.072 if not is_ipad else 0.052)), bold=True)
    headline_y = text_top + int(w * 0.05)
    for line in panel["headline"].split("\n"):
        d.text((pad_x, headline_y), line, fill=BRAND, font=f_head)
        headline_y += int(w * (0.082 if not is_ipad else 0.060))

    f_sub = font(int(w * (0.034 if not is_ipad else 0.024)))
    # word-wrap the subtitle to fit within the panel width minus padding
    max_sub_w = w - pad_x * 2
    sub_words = panel["sub"].split()
    sub_lines = []
    line = ""
    for word in sub_words:
        test = (line + " " + word).strip()
        bb = d.textbbox((0, 0), test, font=f_sub)
        if (bb[2] - bb[0]) > max_sub_w and line:
            sub_lines.append(line)
            line = word
        else:
            line = test
    if line:
        sub_lines.append(line)
    sy = headline_y + int(w * 0.02)
    for L in sub_lines:
        d.text((pad_x, sy), L, fill=TEXT_DIM, font=f_sub)
        sy += int(w * (0.045 if not is_ipad else 0.032))

    # Device — sized to fit between headline area and footer
    if is_ipad:
        # iPad has lots of width but shorter aspect; size to height-budget
        max_dev_h = int(h * 0.62)
        dev_h = max_dev_h
        dev_w = int(dev_h / 2.16)
        # cap width too
        if dev_w > int(w * 0.55):
            dev_w = int(w * 0.55)
            dev_h = int(dev_w * 2.16)
        dev_x = (w - dev_w) // 2
        dev_y = int(h * 0.30)
    else:
        # iPhone: budget height between headline (~26% from top) and footer (~7% from bottom)
        max_dev_h = int(h * 0.62)
        dev_h = max_dev_h
        dev_w = int(dev_h / 2.16)
        # also cap width
        if dev_w > int(w * 0.74):
            dev_w = int(w * 0.74)
            dev_h = int(dev_w * 2.16)
        dev_x = (w - dev_w) // 2
        dev_y = int(h * 0.32)

    draw_device_frame(bg, dev_x, dev_y, dev_w, dev_h, SCREEN_RENDERERS[panel["screen"]])

    return bg


def main():
    for label, w, h in DEVICE_SIZES:
        out_dir = f"{OUT}/{label}"
        os.makedirs(out_dir, exist_ok=True)
        is_ipad = label.startswith("ipad")
        for i, panel in enumerate(PANELS, start=1):
            img = make_panel(panel, w, h, is_ipad=is_ipad)
            path = f"{out_dir}/{i:02d}-{panel['screen']}.png"
            img.save(path, "PNG", optimize=True)
            print(f"Wrote {path}  ({w}x{h})")
    print("Done.")


if __name__ == "__main__":
    main()
