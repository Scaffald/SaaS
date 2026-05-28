# UI audit findings — 2026-05-26

> **Resolution — updated 2026-05-28 (v1.6.0): audit closed.** Every finding is
> either fixed-and-merged or verified non-reproducing against healthy data.
>
> - **Fixed & merged (In Github):** B6→[SC-82], B7→[SC-83], B8→[SC-84],
>   P2→[SC-86], P3→[SC-87], P4→[SC-88], P5→[SC-89], profile drawer→[SC-74].
> - **Verified non-reproducing — environment artifacts, no code change (B1–B5, P1):**
>   the "stuck on Loading / persistent skeleton" cluster. Re-checked 2026-05-28 on a
>   seeded, schema-aligned local env while authenticated: `/jobs`, `/employers`,
>   `/communities/reputation`, `/profile/resume`, the new-user `/onboarding` form, and
>   the dashboard Communities section all render correctly with data or graceful empty
>   states. The original audit ran against `.env.dev`, which had the pre-2026-05-22
>   migration/schema drift (see `docs/agents/audits/2026-05-22-supabase-schema-drift.md`)
>   → hung queries + sparse data. The list screens already show empty states (not
>   infinite skeletons) when data is empty, and the protected layout now surfaces a 15s
>   "Retry" instead of an infinite spinner — so this failure mode is structurally handled.
> - **Deferred to v1.6.1 as planned:** P6–P7, nits N1–N4.

> iOS-viewport sweep (390×844) of every route in `apps/scaffald/app/` plus an
> unauthenticated pass. 40 screenshots captured via
> [`scripts/audit/ui-sweep.mjs`](../../../scripts/audit/ui-sweep.mjs). Auth: clay@unicorn.love
> against `.env.dev` Supabase.
>
> Severities:
> - **🔥 blocker** — broken, unusable, blocks core flow
> - **🔺 polish** — works but visibly rough / inconsistent
> - **🔹 nit** — cosmetic, small wins

## Top-level summary

**Most impactful pattern: the app spends a lot of time on `Loading...` / skeleton
states that never resolve in dev.** This is the dominant friction surface
across the entire audit — fixing the underlying data-fetching + empty-state
pattern would clean up half this list at once.

| Bucket | Count |
|---|---|
| 🔥 Blockers | 8 |
| 🔺 Polish | 7 |
| 🔹 Nits | 4 |

## 🔥 Blocker findings

### B1. `/onboarding` stuck on "Loading…" indefinitely
After 25s wait, the screen still shows the global "Loading..." spinner with no content. Onboarding is a critical signup path — must resolve to *something* (welcome card, first question, error fallback).
Screenshot: [protected/onboarding.png](protected/onboarding.png)

### B2. `/communities/reputation` stuck on "Loading…" indefinitely
Same pattern as B1 — screen never resolves past the global spinner.
Screenshot: [communities/reputation.png](communities/reputation.png)

### B3. `/profile/resume` stuck on "Loading…" indefinitely
Profile resume page hangs on the global spinner. Given vanity URL + PDF resume was just shipped in v1.3.0 ([SC-40](https://linear.app/scaffald/issue/SC-40)), this is a regression worth investigating.
Screenshot: [profile/resume.png](profile/resume.png)

### B4. `/jobs` empty / persistent skeletons
The whole Jobs list shows skeleton card placeholders that never resolve. Either:
- Dev seed has no jobs → should show empty state "No jobs yet" instead of infinite skeletons
- Query is silently failing — needs investigation
Screenshot: [jobs/list.png](jobs/list.png)

### B5. `/employers` shows skeleton cards forever
~4 skeleton cards visible, none ever resolve to real employer data. Same empty-state-vs-real-skeleton ambiguity as B4.
Screenshot: [employers/list.png](employers/list.png)

### B6. Cookie banner covers primary CTAs on unauthenticated welcome
On iPhone viewport, the welcome screen for new users shows a brand panel + testimonial, and the cookie banner covers the **entire bottom 30% of the screen**, including what's almost certainly a "Get started" / "Sign in" button. New-user signup is currently blocked at first touch until the user finds and dismisses the cookie banner.
Screenshots: [unauth/welcome-or-redirect.png](unauth/welcome-or-redirect.png), [unauth/login.png](unauth/login.png)

### B7. Cookie banner text contains a typo
"We use cookies to make things work smoothly and help us **learn.to learn more.**" — clearly broken sentence. Appears on every page that shows the banner (welcome, terms, privacy, verify…).
Screenshots: any unauth screen.

### B8. `/profile` overview body is all skeletons
Page header + "Request review" + "Share profile" buttons render fine, but the entire profile body below shows skeleton bars that never resolve. Same blocker as B4/B5.
Screenshot: [profile/overview.png](profile/overview.png)

## 🔺 Polish findings

### P1. Dashboard "Communities" section persistent skeleton
Dashboard renders correctly except the Communities section at the bottom — that one section is skeleton-stuck. Either no community data or a stuck query.
Screenshot: [protected/dashboard.png](protected/dashboard.png)

### P2. "Profile Strength: 0% Complete" for seeded clay account
Clay has a real seeded profile but the dashboard shows 0%. Either the algorithm isn't recomputing on this data, or seeds don't populate enough required fields. Worth a quick check post-SC-39 rollout.
Screenshot: [protected/dashboard.png](protected/dashboard.png)

### P3. Avatar inconsistency on dashboard
Top header shows letter "U" (clay's first initial), but the "Your profile" card shows "YP" (presumably for "Your Profile" itself). Two avatars side by side with different content is jarring — pick one source.
Screenshot: [protected/dashboard.png](protected/dashboard.png)

### P4. "Assessments" button truncates to "As…"
The third action button on the dashboard card row truncates because it's longer than the others. Either shorten the label, make the row scrollable, or wrap to two columns under a width threshold.
Screenshot: [protected/dashboard.png](protected/dashboard.png)

### P5. Bottom tab bar clips list content on `/workers`
The Workers list looks great (Brian Carter, James Okafor, etc.) but the bottom-most card is partially hidden behind the tab bar (text gets cut: "Senior… Years in industry…"). Add bottom-padding to scrollable content equal to tab-bar height + safe area.
Screenshot: [workers/list.png](workers/list.png)

### P6. `/auth/verify` — massive empty space at top
The OTP verify screen starts content ~40% down the screen, with no header / brand mark / context above. Either anchor content to top, or fill the top with logo/brand.
Screenshot: [unauth/verify.png](unauth/verify.png)

### P7. `/search` is completely empty
Search screen is just a search bar with placeholder text. No recent searches, no popular categories, no empty-state copy. Either populate with suggestions or show empty-state messaging.
Screenshot: [protected/search.png](protected/search.png)

## 🔹 Nit findings

### N1. `/profile/skills` title duplicated
Page header reads "Skills" and the first card inside *also* has a "Skills" header with a chevron. Drop one — likely the inner one if it's an accordion that wouldn't make sense pre-expanded.
Screenshot: [profile/skills.png](profile/skills.png)

### N2. `/communities` has a mid-page spinner *and* skeletons below
Page header + intro + tabs render correctly, then there's a centered spinner in the middle, then skeleton cards below it. Pick one loading affordance, not three at once.
Screenshot: [communities/list.png](communities/list.png)

### N3. Bottom tab bar shape inconsistent between screens
Compare [protected/dashboard.png](protected/dashboard.png) (full-width straight tab bar) vs [jobs/list.png](jobs/list.png) (pill-shaped floating tab bar). Two different tab bars rendering across screens — probably a navigation layout regression.

### N4. `/auth/terms` content scrolls behind cookie banner
The Terms page renders correctly, but reading it requires scrolling past content that's hidden behind the persistent cookie banner. Same root cause as B6/B7 — banner needs to dismiss or shrink after a few seconds.
Screenshot: [unauth/terms.png](unauth/terms.png)

## Suspicious profile sub-route redirects

These could be intentional sub-route grouping or accidental redirects. Worth a quick pass through [apps/scaffald/app/(protected)/profile/_layout.tsx](../../../apps/scaffald/app/(protected)/profile/_layout.tsx) to confirm.

| Visited | Landed | Likely intent |
|---|---|---|
| `/profile/general` | `/profile/resume` | unclear |
| `/profile/id-verification` | `/profile/verification` | grouped under verification — probably correct |
| `/profile/import-review` | `/profile/resume` | resume import lives under /resume — probably correct |
| `/profile/employment` | `/profile/resume` | unclear |
| `/profile/education` | `/profile/experience` | grouped under experience — probably correct |
| `/profile/certifications` | `/profile/skills` | grouped under skills — probably correct |
| `/profile/background-check` | `/profile/verification` | grouped under verification — probably correct |

The unclear ones (`general`, `employment`) are worth a 5-min investigation.

## v1.6.0 candidate cut

Recommendation: take **all 🔥 blockers + P1–P5** into v1.6.0. P6–P7 + nits as v1.6.1 patch series.

| ID | Title | Type |
|---|---|---|
| B1 | Fix /onboarding stuck on Loading | bug |
| B2 | Fix /communities/reputation stuck on Loading | bug |
| B3 | Fix /profile/resume stuck on Loading (regression from SC-40) | bug |
| B4 | /jobs: empty state instead of persistent skeletons | bug |
| B5 | /employers: empty state instead of persistent skeletons | bug |
| B6 | Cookie banner blocks welcome CTAs on iPhone viewport | blocker |
| B7 | Cookie banner typo: "learn.to learn more." | typo |
| B8 | /profile overview body skeleton-stuck | bug |
| P1 | Dashboard Communities section skeleton-stuck | bug |
| P2 | Dashboard "0% Profile Strength" regression | bug |
| P3 | Avatar inconsistency on dashboard (U vs YP) | polish |
| P4 | "Assessments" button truncates to "As..." | polish |
| P5 | Bottom tab bar clips last item on /workers | polish |
| SC-74 | (existing) profile drawer nav bugs | bug |

## iOS simulator deep-dive targets

Top 6 to verify natively on the simulator (`pnpm ios:run`, `xcrun simctl io booted screenshot`):

1. **`/auth` (unauth, fresh user)** — cookie banner interaction, safe area, scroll behavior on a real device
2. **`/auth/verify`** — OTP input focus / native keyboard behavior
3. **`/onboarding`** — does it hang on iOS native too, or web-only issue?
4. **`/profile/resume`** — native PDF viewing / safe area
5. **`/workers`** — tab bar clipping (P5) — confirm safe-area-inset-bottom
6. **`/jobs`** then click into a job — couldn't navigate to `/jobs/[id]` in web pass (no jobs in dev); native may surface different state
