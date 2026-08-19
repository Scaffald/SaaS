# Bringing `@scaffald/ui` + `scaffald-app` to parity with the SCF prototype

**Date:** 2026-08-19
**Status:** Plan — needs two decisions before Phase 1 starts (§5)
**Prototype:** `~/Development/SCF-Prototype/Scaffald App.dc.html` (Claude Design single-file build, 18 Aug 2026)
**Screenshots:** `docs/plans/redesign/shots/` — 58 PNGs, 29 screens × {desktop 1440×900, mobile 390×844}
**Related:** [`docs/plans/ATS/2026-08-15-ats-redesign-brief.md`](../ATS/2026-08-15-ats-redesign-brief.md) — the prototype is the answer to that brief

---

## 1. What was run, and what came out

The prototype is a static single-file app served over `python3 -m http.server`
(added as the `prototype` entry in `.claude/launch.json`, port 8099). It renders
five role contexts off one state object, with `#mobile` in the hash forcing the
390 px layout at any window size.

Every screen was captured headlessly by driving the component's own state:

| Role | Screens captured |
|---|---|
| Worker | home, profile, assessments, jobsW, opportunities, network, empProfile, apply, notifications |
| Employer | employers (find talent), jobsE, pipeline, recReview, flows, empStats, postjob, cand |
| Recruiter | recPipeline, recPresent, recClients, recStats |
| NationSearch | nsCases, nsClients, nsRules, nsIntake |
| Admin | admHome, admScreening, admPeople, admJobs |

Naming is `{desktop|mobile}--{role}--{screen}.png`.

The prototype also ships its own audit — `UX Audit.dc.html`, 19 findings (4
blocking, 7 inconsistency, 5 polish, 3 open questions) — all 19 of which the
18 Aug build claims to have resolved. **That audit is the most valuable artifact
here**, because most of its findings describe our shipped app just as accurately
as they described the prototype. §4 shows the receipts.

**Current app screenshots:** only `/` and `/auth` are in
`docs/plans/redesign/shots-current/`. Docker Desktop is not running on this
machine, so local Supabase could not start and every protected route redirects
to the auth gate. The gap analysis below is therefore grounded in **code**, not
in side-by-side pixels, for everything behind login. Re-run the capture with
Docker up to complete the pairing.

---

## 2. The two systems, side by side

| | Prototype ("Classical") | `@scaffald/ui` today |
|---|---|---|
| Ground | `#f3f2f2` warm stone, surface `#eae9e9` | `gray[50] #f9f8f6` … `gray[100] #f1efeb` — **already the same family** |
| Ink | `#201f1d` | `gray[900] #16110d` / `gray[800] #1e1914` — same family |
| Accent | **Amber `#b68235`**, full 100–900 OKLCH ramp | **Teal `#1d7282`** (`primary`), full 50–900 ramp |
| Headings | Cormorant Garamond 600 | Roboto 600 |
| Body | Lora 400, 15 px / 1.55 | Roboto 400, 16 px |
| Type scale | 6 steps: 11 / 12.5 / 14 / 17 / 22 / 30 | 13 named steps, `xxs 11` → `h1 34` |
| Radii | `2 / 4 / 7` | `2 / 3 / 4 / 5 / 6 / 8 / 10 / 12 / 16 / 24 / 999` + five iOS-26 specials up to 34 |
| Spacing | 4.6 px base → 4.6 / 9.2 / 13.8 / 18.4 / 27.6 / 36.8 | Figma 27-step scale, 0 → 768 |
| Separation | Hairline rules on the ground; cards are rare and reserved | Cards + shadows as the default container |
| Elevation | 3 ink-tinted shadows, used sparingly | `shadows` + a glass-surface family |

**The important read:** the neutral ground is already right. Our warm-stone gray
ramp and the prototype's are the same decision made twice. What actually differs
is **accent hue, type, radius, and — most of all — the *shape* of a screen**:
the prototype separates with rules and whitespace where we separate with cards
and shadows. That last one is not a token change; it is the redesign.

---

## 3. What the prototype decides that we have not

Beyond styling, the prototype takes positions on seven product questions. These
are the things worth stealing whatever we decide about color and type.

1. **One screen-header component.** Uppercase letterspaced kicker → title with a
   collapse caret → tip paragraph → `1 / n` pager. Identical on all 29 screens.
2. **One list idiom.** Search field + a single "Filters & sort" flyout + folder
   tabs for the primary partition + a result count. Applied to all six list
   screens. Inline chips only for one high-frequency dimension.
3. **Stage lanes as rows, not columns.** The employer pipeline defaults to
   *Lanes* (stacked, full-width rows grouped by stage) with *Board* and *Metrics*
   as alternates. This is the answer to "seven columns don't fit on a laptop" —
   and to open question #1 in the ATS brief.
4. **Days-in-stage is the loudest number on every row.** Not days-since-applied.
   Overdue rows go amber and carry a reason string ("Overdue — screening
   decision", "Denver County backlog — chase runner").
5. **Transparency stats are a banner the employer cannot miss.** Response rate /
   median first response / ghost rate, labelled "CANDIDATES CAN SEE IN" with a
   link to the public version. That is ATS-brief open question #5, answered: loud.
6. **Role switching lives in the account row**, bottom-left, not as five
   permanent sidebar buttons. Nav owns the full column.
7. **Mobile is a role-mirroring bottom bar** (5 tabs max + More), stage boards
   become stacked cards with a stage-tag sheet and a toast + undo, and wide
   tables become key–value stacks. Not a squeezed desktop.

The monetized moments survive intact: contact details locked behind the success
fee (`desktop--employer--cand.png`), the hire-to-checkout step, the metric block
convention (label above, figure below, delta beneath) used everywhere.

---

## 4. Gap analysis — the audit's findings, re-measured against our code

The prototype's audit counted its own sins. Counting ours, in
`packages/scf-core/features`:

| Audit finding | Our number |
|---|---|
| "No type scale — 31 distinct font sizes" | **699 literal `fontSize:` sites across 15 distinct values.** 13 px (193 sites) and 12 px (145) dominate; the token scale has no 13 or 14. |
| "72 hard-coded radii" | **~350 literal `borderRadius:` sites across 12+ values** — 8 (79), 16 (66), 12 (64), 4 (38), 10 (25). |
| "Colors bypass the tokens" | **392 raw hex literals across 57 files.** |
| "Screen headers come in four variants" | **Three header components**: `packages/scf-core/components/PageHeader.tsx`, `features/office/components/OfficePageHeader.tsx`, `packages/ui/src/components/SaaSSectionHeader/`. |
| "Two accent colors with no rule" | Not our problem *yet* — teal is unambiguous today. Adopting amber creates it. See §5. |
| "Two competing filter idioms" | Discover screens use `MapFilterBar` + `SortDropdown`; ATS uses `ApplicationsFilters`. Different idioms, same job. |
| "Metric labels change position" | Same drift across dashboard widgets and ATS metrics. |

And the ATS brief's own §12 debt list already names eleven items the prototype
fixes by construction — days-in-stage on cards (#7), score/source/union/assignee
on cards (#8), a real empty board (#9), header-preserving loading (#10), retry on
error (#11), Interview column not red (#6), Withdrawn not a grey pill in a red
column (#17).

**Conclusion:** the prototype is not a reskin we are considering. It is the
already-written fix for debt we have already documented twice. The styling
question (§5) is genuinely separable from that, and lower stakes.

---

## 5. Two decisions needed before Phase 1

Everything in §3 and §4 proceeds regardless. These two do not.

### Decision A — accent: amber or teal?

The prototype resolves to **amber `#b68235`** and keeps a teal logo mark. Our
brand, our marketing site, our auth screen and our logo are **teal `#1d7282`**,
and the teal ramp is already threaded through the token file and every component.

- **Amber** buys the prototype's exact look, and warm-on-warm is genuinely why
  the prototype's screens feel calm. Cost: retheme the `primary` ramp, re-check
  contrast on every semantic pairing, and reconcile against a teal logo — which
  is precisely the "two accents with no rule" the audit called blocking.
- **Teal** keeps brand coherence and costs nothing to adopt. The prototype's
  restraint mostly comes from the warm ground and hairline separation, both of
  which we get either way. Risk: screens will read slightly cooler than the
  captures.

**Recommendation: keep teal, adopt everything else.** Retune the teal ramp's
600/700 steps for the same *weight* amber carries on the warm ground, and treat
amber as the reserved "attention / overdue / SLA" hue — which is roughly how the
prototype already uses its darker accent steps. That gets the discipline the
audit asked for (one primary, one attention color, a rule for each) without a
brand fight.

### Decision B — display typeface: Cormorant Garamond + Lora, or stay on Roboto?

The serif pairing is the single largest contributor to the prototype's character.
It is also a real cost on a React Native app:

- Web is cheap and well-isolated — `apps/scaffald/global.css` already self-hosts
  WOFF2 and `useAppFonts.web.ts` is a no-op.
- Native is not free: `useAppFonts.ts` would gain 3–4 more TTFs, and
  `getFontFamily()` in `packages/ui/src/components/Typography/Typography.styles.ts`
  hard-codes weight-specific family names per platform.
- Cormorant Garamond is a display face. At 11–13 px on a phone in daylight, on a
  jobsite, it is worse than Roboto. The prototype only uses it for headings, which
  is the right call, but Lora as body text at 13 px is a legibility question we
  should answer with a device test, not a screenshot.

**Recommendation: adopt the serif for headings only, on web first.** Keep Roboto
for body and for all native text until we have looked at Lora on an actual phone
outdoors. The change is three files, so reversing it is cheap.

---

## 6. The plan

Five phases. Phases 0–2 are safe under either decision and can start now.

### Phase 0 — Freeze the reference (½ day)

- Commit `docs/plans/redesign/shots/` (12 MB) so the target is versioned, and
  keep the capture script so it can be re-run when the prototype moves.
- Re-run `shots-current/` with Docker up, logged in as each of the seed roles,
  to produce true before/after pairs for the ~12 screens that exist in both.
- Push the local `Scaffald App.dc.html` to `Scaffald/Prototype@main` — per
  `github.md`, the repo still holds the 13 Aug build (168 KB vs 677 KB local),
  so the reference lives only on this laptop right now. **This is the one item
  here with a real bus factor.**

**Acceptance:** every prototype screen has a versioned PNG; the repo and the
laptop agree on what the prototype is.

### Phase 1 — Tokens (2–3 days, `packages/ui`)

The only phase gated on §5.

1. `tokens/typography.ts` — collapse to the prototype's six steps
   (11 / 12.5 / 14 / 17 / 22 / 30), keeping the existing names as aliases so
   nothing breaks at once. Add a codemod-able map from each of our 15 literal
   sizes to its nearest step.
2. `tokens/borders.ts` — introduce `radius.sm/md/lg = 2/4/7` as the *interface*
   scale. Leave the iOS-26 specials alone; they belong to native sheets and menus,
   not to cards.
3. `tokens/colors.ts` — per Decision A. If teal: retune `primary[600]/[700]` and
   add a named `attention` role mapped to the amber ramp. If amber: swap the
   `primary` ramp wholesale and re-verify contrast.
4. `Typography.styles.ts` + `useAppFonts.ts` + `global.css` — per Decision B.

**Acceptance:** the Storybook/playground renders the prototype's foundations
page at parity; no app screen changes appearance yet beyond type and radius.

### Phase 2 — Three shell primitives (1 week, `packages/ui` + `scf-core`)

This is where the parity actually lands, and it is decision-independent.

1. **`ScreenHeader`** — kicker / title / caret / tip / pager, all optional.
   Replaces `PageHeader`, `OfficePageHeader` and `SaaSSectionHeader`. Migrate
   callers; delete the other three.
2. **`ListToolbar`** — search + "Filters & sort" flyout + folder tabs + result
   count, with one count template (`{n} {noun}`). Replaces the discover
   `MapFilterBar`/`SortDropdown` pair and `ApplicationsFilters`.
3. **`MetricBlock`** and **`MetricRow`** — label above, figure below, delta
   beneath, hairline-divided. One component for the score breakdown, the SLA
   strip, the admin stat row and the ATS metrics header.

Alongside: a **`Lane`/`LaneGroup`** pair for stage-grouped rows (the prototype's
default pipeline view), sitting beside the existing `Kanban` rather than
replacing it.

**Acceptance:** `grep` finds one header component, one list toolbar, one metric
block. Every list screen presents search, filters and counts identically.

### Phase 3 — Screen-by-screen, highest-traffic first (3–4 weeks)

Order by the ATS brief's build status, since MOCK screens are free to redraw and
BUILT screens carry behavior we must not break:

1. **Employer pipeline** (`features/office/applications/`) — Lanes as default
   view, transparency banner, days-in-stage on rows, ATS-brief §12 items 6–9,
   17. This screen alone closes eight documented debts.
2. **Candidate detail** (`CandidateDetailContent.tsx`) — name in the header,
   avatar sized up, tab counts, the three dead buttons wired (§12 items 1–3, 15).
3. **Worker home + applications** — the score breakdown block, the invitation
   rows, "Raise your standing".
4. **Worker jobs + employer profile** — the transparency-stats-before-you-apply
   screen, which is `NEW` in the brief and fully drawn in the prototype.
5. **NationSearch case queue** — SLA layer, bulk actions with undo. Currently
   `NEW` throughout; the prototype is the spec.

Each screen ships with its before/after pair from Phase 0.

### Phase 4 — Mobile (1–2 weeks)

The prototype's mobile pass is a separate design, not a breakpoint. Port in this
order: role-mirroring bottom bar (5 + More) → account/role sheet in the masthead
→ stage boards as stacked cards with the stage-tag sheet + toast/undo → wide
tables as key–value stacks → the removable filter-chip strip.

`features/drawer/MobileBottomNav.tsx` and `ModeSelector.tsx` are the entry
points; `ModeSelector` is currently a two-way worker/employer segmented control
and needs to become the five-role account sheet.

---

## 7. Verification

- Keep the Playwright capture script from Phase 0 as `scripts/audit/`-adjacent
  tooling; run it before and after each Phase 3 screen.
- Add a lint rule (or an `oxlint` config — the prototype ships
  `_adherence.oxlintrc.json` for exactly this) that fails on literal `fontSize`,
  `borderRadius` and hex colors in `packages/scf-core/features`. Introduce it as
  a warning, ratchet to error per-directory as Phase 3 clears each one.
- Light **and** dark for every screen. The prototype is light-only; dark is ours
  to design, and the ATS brief makes it a hard requirement.

## 8. Risks

- **The prototype is HTML/CSS; our app is React Native.** No CSS grid, no
  `:hover` on native, no `color-mix()`. Every hairline-and-whitespace layout has
  to survive flexbox. Expect the Lanes view and the folder-tab strip to be the
  two hard ports.
- **Folder tabs.** The audit's own finding — they wrap and detach from their
  panel at five-plus tabs. The prototype's fix (scroll on one line) needs a real
  horizontal-scroll affordance on native.
- **The 699 fontSize sites.** A mechanical codemod will produce a diff nobody can
  review. Do it per-directory alongside Phase 3, not as one commit.
- **Accessibility does not port.** The prototype fakes it with a runtime DOM shim
  that walks every `cursor:pointer` element and bolts on `role`/`tabindex`. That
  trick does not exist for us; RN needs real `accessibilityRole` on real
  pressables, written by hand.
- Docker being down meant no authenticated before-shots. Everything in §4 is from
  code, which is reliable for counts and unreliable for "how does it feel".

## 9. Not done here

- No code changed. The only repo edits are this document, the screenshots, and a
  `prototype` entry appended to `.claude/launch.json`.
- Per `CLAUDE.md`, the *findings* in §4 belong on the board rather than in a
  markdown file. Once §5 is decided, Phases 2–4 should become a GitHub epic with
  one child per screen, mirroring the shape of ATS epic
  [#539](https://github.com/Scaffald/SaaS/issues/539).
