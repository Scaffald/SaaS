# UI audit — 2026-06-23

iPhone-14 viewport (390×844) sweep via `scripts/audit/ui-sweep.mjs` against
**local** Supabase, logged in as `clay@unicorn.love`. **40 screens captured, 0
failures, protected routes now render real content** (no `/onboarding`
redirect — see F1).

## Root-cause: why the first runs only saw the onboarding gate (RESOLVED)

Not a seed gap — `clay` is fully onboarded and the backend
`prerequisites/check` returns `isComplete: true`. The blocker was a
**split-brain backend in the local web bundle**: the Supabase auth/REST client
pointed at local `127.0.0.1:54321`, but the **Scaffald SDK** (which backs the
prerequisites check + all data) pointed at the **remote dev project**
(`pmtdqrfpumqwkdhpgwcz.supabase.co`) → 401/500 + remote-clay-not-onboarded →
redirect to `/onboarding`. Cause: a **stale Metro cache** from an earlier
`pnpm web:remote` run baked the remote SDK URL; `pnpm web` doesn't clear the
cache. Fix: `expo start -c` (or wipe `metro-cache`) + `pnpm supa functions
serve api`. Two harness/process guards added (api-health preflight; README
prerequisites). **The split-brain itself is a dogfooding bug worth a ticket**
(see F4).

## Findings

### F2 — Cookie banner overlaps welcome CTAs (tracked: task_df3b586c → SC-36)
`/` welcome carousel: the cookie-consent banner sits on top of Continue/Skip.
z-index / safe-area fix. Folds into SC-36.

### F3 — Search is an empty shell (NEW)
`/search` (`protected/search.png`) is a bare search bar ("Search jobs, skills,
and more") over a large empty area — no recent searches, no suggested
trades/filters, no popular content, no empty-state guidance. First-time worker
lands on a blank screen. Candidate scope for the Worker MVP (relates to SC-34's
search/filter work).

### F4 — Local web split-brain SDK base URL (NEW, dev-env)
As above: auth and SDK resolve base URLs independently
(`getSupabaseApiBaseUrl`), and a stale Metro cache can leave them pointing at
different projects. Worth (a) a dev-env ticket to make `pnpm web` cache-safe or
warn on env mismatch, and (b) a note in the app README.

## Worker-MVP screens — baseline (real captures, inform SC-33/34)

- **Home/Dashboard** (`protected/dashboard.png`): profile card + **Profile
  Strength 15%** progress bar + a swipeable completion-nudge carousel ("General
  Info" → "Complete General Info" CTA) + quick actions (Find Jobs, My Resume,
  Assessments). This is already close to SC-33's profile-strength-widget intent
  — good baseline to design against, not a greenfield.
- **Jobs** (`jobs/list.png`): "11 Jobs Available", trade-specific cards (Pipe
  Welder, Scaffold Foreman, HVAC) with location, Full-Time, On-site badge, pay
  range, posted-age, and filter/sort controls in the bottom bar. Solid SC-34
  baseline; apply flow not yet exercised (no job-detail dynamic capture — empty
  jobs detail selector).
- **Communities** (`communities/list.png`): All/My tabs, populated trade
  communities (Construction Pros, Electrical, Carpentry, Plumbing) with member
  + post counts and Join buttons. SC-128 fixes (join-state, titles) visible.
- **Bottom nav**: 3 tabs — Home / Jobs / Community. SC-26 Workers/Employers
  top-tab switcher is not present yet (expected — Track B).

## Implemented this session
- **F2 (cookie banner)** — fixed in `welcome-screen.tsx`: reserve an estimated
  bottom inset while the banner measures itself (was 0 on first paint →
  overlap). Browser-verified: 60px gap, no overlap. typecheck clean.
- **F3 (search shell)** — `SearchScreen.tsx` empty state now shows a "Popular
  trades" row of tappable chips (44px targets) that drive the search via the
  existing `setQuery` → `useUniversalSearch`. Browser-verified chip→search.

## SC-27 UI-kit refactor — de-risk audit (2026-06-23)
- Inventory re-run today: **1122 exports, 956 dead, 32 mobile-direct, 0
  web-direct** (1862 files scanned) — matches 2026-06-10.
- **Zero re-exports of `@scaffald/ui` anywhere** (`grep` for `export * from`
  and named re-export → 0 hits in packages + apps). The wrapper-package
  transitive-use risk the inventory flagged **does not exist** — the dead list
  is safe to hide.
- Remaining caveats for the actual hide: (a) multi-symbol export lines
  (`export { Live, Dead } from …`) must not be fully commented — hide a line
  only when ALL its symbols are dead; (b) `export * from "./tokens"` (line 15)
  surfaces ~200 token symbols that can't be hidden individually; (c)
  packages/ui's own tests/stories may import via the barrel. Safe algorithm:
  comment an export statement only if every symbol it exports is in the dead
  set, then build packages/ui + typecheck all 4 wrapper packages + both apps.

## SC-34 jobs flow — verified complete (2026-06-23)
Triage found **no bug**: job cards are pressable and navigate to `/jobs/[id]`;
the apply flow (QuickApplyModal / ApplicationWizard) is wired. The audit's
dynamic capture failed only because RN-web cards aren't `<a>` tags and lacked a
`testID`. Added `testID="job-card"` to `InternalJobCard` + `ExternalJobCard`
(→ `data-testid` on web). Re-verified: 11 cards on `/jobs`, click →
`/jobs/<uuid>`, **Apply Now** renders (`jobs/detail-first.png`), 0 page errors.
Home dashboard (SC-33) also reviewed — healthy, no gaps.

## Outstanding (filed / scoped)
- **SC-130** CI billing block · **SC-131** split-brain SDK URL (F4) ·
  **SC-132** ui-docs build — all filed to Triage 2026-06-23.
- **SC-36 touch targets** — remaining SC-36 work; needs a design-system call
  (blanket `hitSlop` risks overlapping adjacent buttons; bumping Button `md`
  36/40/44 → 44 is a visual change). Not a quick mechanical fix.
- **SC-26** Workers/Employers switcher — net-new component (Track B).
