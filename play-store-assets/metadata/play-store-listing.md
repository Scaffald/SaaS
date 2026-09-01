# Scaffald — Google Play Store Listing Copy

**Developer:** Unicorn LLC
**Package:** `com.scaffald.app`
**Default language:** English (United States)
**App or game:** App
**Free or paid:** Free

> Adapted from [app-store-metadata.md](../../app-store-assets/metadata/app-store-metadata.md).
> Play is **not** the App Store with different limits — the fields differ in kind,
> not just length. Play has no subtitle, no keyword field, and no promotional
> text. It has an 80-character **short description** that appears under the app
> name in search results and does most of the conversion work. Character counts
> below are verified by `check-lengths.py` in this directory.

---

## App name — 30 char max

**`Scaffald: Trade Jobs & Crews`** *(28)*

Play indexes the app name heavily, and there is no keyword field to make up for
a bare brand name — which is why this is not simply `Scaffald` the way the App
Store entry is. The two highest-value terms are in it.

Alternates:

- `Scaffald — Hire Skilled Trades` (30)
- `Scaffald: Skilled Trade Hiring` (30)
- `Scaffald` (8) — only if brand recall is already strong enough to carry search

---

## Short description — 80 char max

**`Find skilled trade jobs near you or hire vetted crews fast. Built for the field.`** *(80)*

This is the single most important string in the listing. It shows in search
results and at the top of the store page, and most installs are decided here
without the full description ever being opened. Both sides of the marketplace
are named, because the audience is genuinely both.

Alternates:

- `Skilled trade jobs and crew hiring. Apply in a tap. Hire in a day.` (65)
- `Jobs for welders, electricians, HVAC and more — and the crews to fill them.` (74)
- `The hiring app for the technical trades. Find work or build your crew.` (69)

---

## Full description — 4000 char max

Scaffald is the modern hiring platform built for the technical trades — welders, electricians, scaffolders, pipefitters, HVAC techs, carpenters, plumbers, and the contractors who hire them.

Whether you're a tradesperson hunting for your next job or a foreman trying to crew up before Monday, Scaffald replaces the chaos of phone trees, paper applications, and social media groups with a single fast, trustworthy app.

<b>WORKERS — FIND BETTER JOBS, FASTER</b>
• Browse openings near you on a live map
• Filter by trade, certification, pay range, shift, and travel distance
• Apply with one tap using your saved Scaffald profile
• Track every application from submitted to offer
• Get matched to roles based on your trade, experience, and credentials
• Verify your skills with built-in assessments employers actually trust
• Message employers directly — no recruiters in the middle

<b>EMPLOYERS — HIRE THE RIGHT CREW</b>
• Post jobs in minutes with smart templates for every trade
• Search a verified network of qualified workers
• See location, certifications, and assessment scores at a glance
• Build teams and invite collaborators across your organization
• Manage applications with simple stage tracking
• Run analytics on time-to-hire, source quality, and pipeline health
• Send and accept invitations to your organization or crew

<b>BUILT FOR THE FIELD</b>
• Designed for phones used with gloves, on jobsites, in poor signal
• Offline-friendly: drafts and key data work without a connection
• Push notifications for new matches, messages, and offers
• Sign in with Google — no password to forget
• Privacy-first: your contact info is never shared without consent

<b>WHO USES SCAFFALD</b>
• Independent tradespeople looking for steady, well-paid work
• Foremen and superintendents who need crews on short notice
• Specialty contractors hiring for shutdowns, turnarounds, and shop work
• HR leaders at trade firms tired of generic job boards
• Apprentices and journeymen building their reputation and history

<b>WHY SCAFFALD</b>
We started Scaffald because the trades deserve better tools. The same trades that build everything you depend on were the last to get a real hiring app — so we built one. Every feature is shaped by feedback from working tradespeople and the contractors who employ them.

<b>GETTING STARTED IS FREE</b>
Download Scaffald, pick your role, and you're ready in under two minutes. Most premium employer features are free during launch.

Questions or feedback? Tap Settings → Help inside the app, or reach us at support@scaffald.com.

Scaffald is a product of Unicorn LLC.

### Deliberate differences from the App Store description

- **"Sign in with Apple" removed.** Apple's button is not offered on Android, and
  naming a sign-in method the app does not present is the kind of small
  inaccuracy that store review does notice.
- **"Facebook groups" → "social media groups".** Naming a competing platform in
  a Play listing invites trouble for no benefit.
- **`<b>` tags instead of bare capitals.** Play renders a small HTML subset
  (`<b>`, `<i>`, `<u>`, `<br>`); the App Store renders none. Same headings, but
  they read as headings here instead of shouting.

---

## Categorisation

| Field | Value | Note |
|---|---|---|
| App category | **Business** | Matches the App Store primary. `Jobs` is not a Play category; Business is where hiring apps sit. |
| Tags | Job Search, Business Management, Productivity | Play allows up to 5; these three are the honest ones. |
| Contact email | support@scaffald.com | Shown publicly on the listing. |
| Contact website | https://scaffald.com | |
| Contact phone | *(optional — leave blank unless you want it public)* | |
| Privacy policy | https://scaffald.com/privacy | **Required.** Verified live (200). |

---

## Store settings

- **Contains ads:** No
- **In-app purchases:** No *(revisit when employer paid tiers ship — this answer must change before they do)*
- **Target audience:** 18+ — it is a hiring marketplace; employment law makes under-18 targeting a genuine problem, not just a form answer
- **Designed for Families:** No

---

## App access — for the Play review team

The whole app is behind sign-in, so review **will** be blocked without
credentials. In Play Console this goes under App content → App access → "All or
some functionality is restricted".

| Field | Value |
|---|---|
| Instructions name | Worker account |
| Username | reviewer-worker@scaffald.com |
| Password | *(see 1Password — do not commit)* |
| Instructions name | Employer account |
| Username | reviewer-employer@scaffald.com |
| Password | *(see 1Password — do not commit)* |

> The App Store metadata file has these passwords in plaintext in the repo.
> That is worth cleaning up separately; this file does not repeat the mistake.

Reviewer notes:

> Scaffald is a hiring marketplace for the skilled trades. Sign in with the
> worker account to browse jobs on the map and apply; sign in with the employer
> account to see the hiring pipeline, post a job, and review applicants. Both
> roles are reachable from the same account switcher on the profile avatar.

---

## Still required before this listing can go live

Copy is the easy half. These are not:

1. **A production Android build that works.** None has ever been produced. See #686 — the shared profile env means an Android build today ships without the Mapbox token, exactly as `1.17.0 / 11700` did on iOS.
2. **Real screenshots.** The existing ones in `app-store-assets/screenshots/` are
   illustrative mockups by their own generator's admission, and Play requires
   screenshots that show actual in-app experience. See [screenshots/README.md](../screenshots/README.md).
3. **A Play Console app entry**, which needs a Google Play developer account and
   acceptance of the Developer Distribution Agreement — both human actions.
4. **Data Safety** and **content rating** forms — drafted in this directory, but
   they are submitted in the console, not from here.
