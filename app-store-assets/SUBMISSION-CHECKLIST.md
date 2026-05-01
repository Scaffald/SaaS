# Scaffald — App Store Connect Submission Handoff

**App:** Scaffald (Apple ID `6753185287`, Bundle `com.scaffald.app`)
**Account:** Unicorn LLC — signed in as Clayton McIlrath
**Distribution URL:** https://appstoreconnect.apple.com/apps/6753185287/distribution

---

## What's done already

I wrote all the metadata directly into App Store Connect during this session.

**Saved on the iOS App Version 1.0 page (Distribution):**
- Promotional Text
- Description (2,567 chars)
- Keywords (94 chars)
- Support URL — `https://scaffald.com/support`
- Marketing URL — `https://scaffald.com`
- Copyright — `2026 Unicorn LLC`

**Saved on App Information:**
- Subtitle — `Hiring for Technical Trades`
- Primary Category — Business
- Secondary Category — Productivity

The Save buttons confirmed both pages persisted.

---

## What you still need to do manually

App Store Connect's screenshot uploader runs on Apple's CDN flow that blocks programmatic uploads. The remaining items below need a human at the keyboard.

### 1. Upload screenshots — 15 minutes

Drag-and-drop is fastest. Open each section, drop in all 5 PNGs at once, they'll upload in parallel.

**iPhone screenshots** — Distribution → Previews and Screenshots → iPhone tab
Upload the 6.9" set (which Apple uses for all iPhone display sizes ≥ 6.7"):
```
app-store-assets/screenshots/iphone-6.9/
  01-jobs_map.png        1290×2796
  02-quick_apply.png     1290×2796
  03-worker_card.png     1290×2796
  04-messaging.png       1290×2796
  05-assessments.png     1290×2796
```

The 1242×2688 variants in `iphone-6.5/` are a fallback if Apple's uploader rejects 1290×2796 (rare).

**iPad screenshots** — same section, iPad tab (required because the build supports iPad)
```
app-store-assets/screenshots/ipad-13/
  01-jobs_map.png        2064×2752
  02-quick_apply.png     2064×2752
  03-worker_card.png     2064×2752
  04-messaging.png       2064×2752
  05-assessments.png     2064×2752
```

### 2. Upload the marketing icon — 1 minute

Apple takes the 1024×1024 marketing icon from the build asset catalog when EAS submits, so usually you don't need to touch this. **If** the App Store Connect page asks for it explicitly:
```
app-store-assets/icons/AppStore-1024.png    1024×1024 (no alpha, RGB)
```

The other icon sizes in `icons/ios/` are reference files — Expo/EAS generates these from `apps/scaffald/assets/icon.png` automatically.

### 3. Fill the remaining ASC sections

These are pages I didn't auto-fill because they involve permission-sensitive operations or multi-step questionnaires:

| Page | What to set | Source of truth |
|---|---|---|
| **App Privacy** (Trust & Safety) | The data-types matrix | See `metadata/app-store-metadata.md` § App Privacy |
| **App Review Information** (under the version) | Demo accounts + reviewer notes | See `metadata/app-store-metadata.md` § App Review Information |
| **Age Rating** (App Information) | Click "Set Up Age Ratings" → answer the questionnaire | See `metadata/app-store-metadata.md` § Age Rating — should resolve to **4+** |
| **Pricing & Availability** | Choose Free, all territories | Standard for launch |
| **Content Rights** (App Information) | "Does your app contain, show, or access third-party content?" → No | (Unless you embed licensed content) |
| **License Agreement** | Use Apple's Standard EULA | Default; only change if you have a custom one |

### 4. Confirm the URLs resolve

Before you click "Add for Review", load these in a browser:
- https://scaffald.com → Marketing URL
- https://scaffald.com/support → Support URL
- https://scaffald.com/privacy → Privacy Policy URL (set this on the App Information page if you haven't already)

App Review **will** click them, and a 404 is the most common reason marketing apps get rejected on round one.

### 5. Wait for the build

The version still shows "iOS App Version 1.0" with no build attached. The other Claude Code tab is doing the EAS build. Once it finishes and EAS submits to App Store Connect, the build will appear under the Build section of the version.

Note: package.json says `1.1.6` but App Store Connect is set up as Version 1.0. First-release apps usually launch as 1.0.0. Worth confirming with whoever started the ASC record before submitting.

### 6. Submit for Review

When everything above shows green, click **Add for Review** at the top right of the iOS App Version page, then **Submit to App Review** on the confirmation screen.

I deliberately did NOT click these buttons — that's your call.

---

## File index

```
app-store-assets/
├── SUBMISSION-CHECKLIST.md             (this file)
├── metadata/
│   └── app-store-metadata.md           Full copy bank — descriptions, keywords, review notes, privacy answers
├── icons/
│   ├── AppStore-1024.png               THE marketing icon (1024×1024, RGB, no alpha)
│   ├── ios/icon-{20..180}.png          12 sizes — reference / fallback for Xcode asset catalog
│   └── marketing/                      Press kit variants (rounded preview, transparent, 512)
└── screenshots/
    ├── iphone-6.9/01..05-*.png         5 panels × 1290×2796  ← upload these for iPhone
    ├── iphone-6.5/01..05-*.png         5 panels × 1242×2688  (fallback)
    └── ipad-13/01..05-*.png            5 panels × 2064×2752  ← upload these for iPad
```

The 5 marketing panels, in suggested order:

1. **Find work** — "Skilled trade jobs, right on your map."
2. **One-tap apply** — "Apply in seconds, not afternoons."
3. **Hire fast** — "Build your crew for Monday morning."
4. **Built-in messaging** — "Talk directly. No recruiters."
5. **Prove your skills** — "Assessments employers actually trust."

Apple uses the first 3 on the App Store install sheet, so panel 1–3 carry the most weight.

---

## If you want different screenshots

The screenshot generator is at `outputs/make_screenshots.py` (your session's outputs folder — copy it somewhere persistent if you want to keep iterating). Each panel has a kicker, a 2-line headline, a sub-line, and a screen renderer. Edit the `PANELS` array and re-run; it regenerates all three device sizes.

If you want to swap the illustrative app screens for real device captures:
1. Take screenshots from the iOS Simulator at 1290×2796
2. Replace the `render_*` functions with `img.paste(Image.open(real_capture))`
3. Re-run

---

## Pre-flight before "Submit to Review"

- [ ] iPhone screenshots uploaded (≥ 3 of the 5)
- [ ] iPad screenshots uploaded (≥ 3 of the 5)
- [ ] App Privacy section completed
- [ ] Age Rating questionnaire submitted (4+)
- [ ] Pricing & Availability set (Free, all territories)
- [ ] Privacy Policy URL set
- [ ] App Review demo accounts created and verified
- [ ] Reviewer notes pasted in (see metadata doc § App Review Information)
- [ ] Build attached to the version
- [ ] Marketing / Support / Privacy URLs return 200
- [ ] Encryption Export Compliance answered (Exempt — already in `app.config.ts`)
