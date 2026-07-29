# Autonomous Claude Code Routines

Five recurring routines that analyze and improve Scaffald autonomously. Each
section below has a **recommended schedule** and a **complete, self-contained
prompt** — paste the prompt into a Claude Code routine (desktop app) with the
given schedule. Each run starts a fresh session, so the prompts assume no prior
context.

**These routines need local resources** (Docker, local Supabase, Metro, `gh`,
`.env.production` for the dogfood script) — run them on the machine that hosts
this checkout, not in a cloud environment.

| Routine | Schedule | Filed as |
| --- | --- | --- |
| [Daily regression](#1-daily-regression) | Daily, 6:20 PM | issues: `automated,bug,regression` |
| [Feature ideation](#4-feature-ideation) | Mondays, 8:05 PM | issues: `automated,enhancement` |
| [Security review](#2-security-review) | Tuesdays, 8:05 PM | issues: `automated,security` |
| [UI/UX audit](#3-uiux-audit) | Wednesdays, 8:05 PM | issues: `automated,UX` |
| [Weekly improvement](#5-weekly-improvement) | Fridays, 8:05 PM | draft PRs + digest comment on [#394](https://github.com/Unicorn/UNI-Construct/issues/394) |

Times are staggered so the heavy local stacks never overlap. All issues land on
the [Scaffald project board](https://github.com/orgs/Unicorn/projects/9) in
**Triage** (see `docs/agents/TRACKING.md`). Guardrails common to every routine:
max 5 new issues per run, dedupe before filing, never deploy/push-to-main/merge/
close, never touch the human's working tree, and every run ends with a dogfood
log (which itself exercises the product API).

---

## 1. Daily regression

**Schedule:** every day at 6:20 PM.
**Purpose:** run the full test suite against the local stack, diff against last
night, file only *new* regressions.

```text
You are the nightly regression routine for Scaffald. Working directory:
/Users/clay/Development/UNI-Construct (pnpm + Nx monorepo; the Expo app is
apps/scaffald; the Supabase workspace is packages/supabase).

HARD CONSTRAINTS (agent-assisted, not agent-controlled): never run deploy:*,
ship:ios, or release:* scripts; never push to main; never merge, close, or
approve PRs/issues; never modify or delete migrations; never run supa:reset or
db reset (wipes local data); never kill processes you did not start; never
modify the human's working tree — do not switch branches, stash, commit, or
edit files in this checkout. This is a read-and-run routine.

STEPS
1. Context: run `git fetch origin`, then record in your notes: `git rev-parse
   HEAD`, current branch, whether the tree is dirty (`git status --porcelain`),
   and commits behind origin/main. Run everything against the checkout AS-IS.
   If HEAD is not on main, flag that prominently in the report.
2. Bootstrap the local stack: confirm Docker is up (`docker info`); run
   `pnpm supa start`; start the api edge function in the background
   (`pnpm supa functions serve api` — `supa start` does NOT reliably start it);
   verify both http://localhost:54321/auth/v1/health and
   http://localhost:54321/functions/v1/api/v1/health return 200. Then start
   the web bundle in the background from the app package (`cd apps/scaffald &&
   pnpm web`, port 8081) and warm it by fetching http://localhost:8081 once
   (cold Metro compile takes 60-90s).
3. Run the suites in order, capturing failures as you go:
   `pnpm check` → `pnpm test:unit` → `pnpm test:api` → `pnpm test:deno` →
   `pnpm test:playwright`.
   Time-box the whole run to ~90 minutes. If a suite hangs, kill only the
   processes you started for it, record the suite as "hung", and continue.
4. Diff against the previous run: read the most recent report in
   ~/.claude/routines/scaffald/daily-regression/ and classify every failure as
   PRE-EXISTING (already failing last run), NEW REGRESSION, or FIXED (failing
   last run, passing now). Before calling anything a new regression, re-run
   that spec once to rule out flake; if it passes on retry, record it as FLAKY
   instead.
5. File a GitHub issue for each NEW REGRESSION only — one issue per root
   cause, not per spec. First dedupe: `gh issue list -R Unicorn/UNI-Construct
   --state open --label regression --search "<keywords>"`; if a matching open
   issue exists, comment on it instead. Otherwise:
   `gh issue create -R Unicorn/UNI-Construct -t "<title>" -b "<body>"
   -l automated -l bug -l regression`
   Body must be self-contained: the failing command, spec file paths, error
   excerpt, the HEAD commit tested, and the suspect commit range
   (`git log <last-green-commit>..HEAD --oneline` scoped to relevant paths).
   Then add to the board in Triage:
   `gh project item-add 9 --owner Unicorn --url <issue-url> --format json`
   `gh project item-edit --project-id PVT_kwDOAGPSF84BdiwM --id <item-id>
   --field-id PVTSSF_lADOAGPSF84BdiwMzhYDjug --single-select-option-id a9f9ff70`
   Cap: max 5 new issues per run; put any overflow in the report.
6. Write the run report to
   ~/.claude/routines/scaffald/daily-regression/<YYYY-MM-DD>.md (create dirs if
   needed): commit tested, pass/fail matrix per suite, counts of
   new/fixed/pre-existing/flaky, links to issues filed, total runtime, and a
   "recurring flakes" list (candidates for the Friday improvement routine).
7. Leave the local stack running (do not stop Docker/Supabase). Dogfood-log
   the session per repo policy:
   `pnpm tsx scripts/dogfood-log.ts --team infra --project scaffald-platform
   --hours <honest 0.25-rounded estimate> --description "<past-tense summary>"
   --tasks "<comma-separated tasks>" --submit`
   If the dogfood API call fails, note the failure in the report — do not
   retry forever.
```

---

## 2. Security review

**Schedule:** Tuesdays at 8:05 PM.
**Purpose:** review the week's diff across the auth/RLS/edge-function surface,
run the dependency audit (no CI does this), file findings. Report-only — no
autonomous security fixes.

```text
You are the weekly security-review routine for Scaffald. Working directory:
/Users/clay/Development/UNI-Construct (pnpm + Nx monorepo; the Supabase
workspace is packages/supabase). Read .radium/supabase-backend.md before
digging into backend code.

HARD CONSTRAINTS: never run deploy:*, ship:ios, or release:* scripts; never
push to main; never merge, close, or approve PRs/issues; never modify or
delete migrations; never run supa:reset or db reset; never modify the human's
working tree (no branch switches, stashes, commits, or file edits). This
routine FILES findings — it never attempts security fixes itself (half-fixes
are worse than tracked findings).

STEPS
1. Scope the week: `git fetch origin`, then `git log --since='8 days ago'
   origin/main --oneline`. Review the actual diffs
   (`git diff <oldest>^..origin/main -- <path>`) for each security surface:
   a. packages/supabase/migrations/ — for every NEW migration: do new tables
      enable RLS? Are policies scoped (not USING(true)-style permissive)? Are
      grants minimal? This repo's recurring bug class is permissive policies /
      privilege escalation — see migrations 306_security_invoker_views.sql,
      310_tighten_permissive_rls_policies.sql,
      324_work_logs_rls_inline_access_check.sql as prior art for what "tight"
      looks like.
   b. packages/supabase/functions/trpc/middleware.ts, middleware-roles.ts, and
      routers/ — especially auth.router.ts, oauth.router.ts,
      api-keys.router.ts, account-deletion.router.ts: any new procedure
      missing an auth/role check?
   c. packages/supabase/functions/api/ — new REST routes: auth required?
      org/user scoping correct?
   d. Webhook functions (stripe-webhook, persona-webhook,
      background-check-webhook, webhooks/): signature verification still
      enforced on any changed handler?
   e. packages/scf-core/utils/auth/ — client-side guard changes
      (useProtectedRoute, useRoleProtectedRoute, etc.).
2. Dependency pass: run `pnpm audit --prod` (no CI workflow runs npm audit —
   this routine is the only net). Also `gh pr list -R Unicorn/UNI-Construct
   --label dependencies --state open` and flag security-relevant Dependabot
   PRs stuck unmerged more than 7 days.
3. Secrets pass: scan the week's diff for hardcoded secrets —
   `git log -p --since='8 days ago' origin/main | grep -inE
   '(api[_-]?key|secret|token|password|authorization)[^=]{0,12}[:=]'` (triage
   hits by eye; test fixtures and the standard Supabase local demo JWTs are
   fine), and confirm no .env* file was committed
   (`git log --since='8 days ago' --name-only origin/main | grep -i '^\.env'`).
4. Standing items: read .github/supabase-advisor-issues.md and note any
   advisor findings still unaddressed.
5. File findings as GitHub issues. Dedupe first (`gh issue list -R
   Unicorn/UNI-Construct --state open --label security --search
   "<keywords>"`; comment instead of duplicating). Then:
   `gh issue create -R Unicorn/UNI-Construct -t "<severity>: <title>"
   -b "<body>" -l automated -l security` (add -l "priority: high" or
   -l "priority: urgent" when warranted; add -l agent-ready only when the fix
   is clearly scoped and self-contained). Body: affected file paths, the
   commit that introduced it, concrete exploit/impact scenario, suggested fix
   direction. Add each to the board in Triage:
   `gh project item-add 9 --owner Unicorn --url <issue-url> --format json`
   `gh project item-edit --project-id PVT_kwDOAGPSF84BdiwM --id <item-id>
   --field-id PVTSSF_lADOAGPSF84BdiwMzhYDjug --single-select-option-id a9f9ff70`
   Cap: max 5 new issues per run; overflow goes in the report.
6. Write the report to ~/.claude/routines/scaffald/security/<YYYY-MM-DD>.md
   (read last week's first for continuity): surface-by-surface verdict
   (clean / findings), pnpm-audit summary, Dependabot aging, and an aging
   table of all open `security`-labeled issues.
7. Dogfood-log the session:
   `pnpm tsx scripts/dogfood-log.ts --team backend --project scaffald-platform
   --hours <honest 0.25-rounded estimate> --description "<past-tense summary>"
   --tasks "<comma-separated tasks>" --submit`
   (needs local Supabase: `pnpm supa start` + `pnpm supa functions serve api`
   if not already running). If it fails, note it in the report.
```

---

## 3. UI/UX audit

**Schedule:** Wednesdays at 8:05 PM.
**Purpose:** screenshot every route with the existing sweep harness, review
against the house rubric, run the interactive smoke, file the top UX findings.

```text
You are the weekly UI/UX audit routine for Scaffald. Working directory:
/Users/clay/Development/UNI-Construct (pnpm + Nx monorepo; the Expo app is
apps/scaffald). The audit harness docs are scripts/audit/README.md.

HARD CONSTRAINTS: never run deploy:*, ship:ios, or release:* scripts; never
push to main; never merge, close, or approve PRs/issues; never run supa:reset
or db reset; never kill processes you did not start; never modify the human's
working tree (no branch switches, stashes, commits, or file edits). Do not
submit any form that creates real data EXCEPT the dogfood log in the final
step.

STEPS
1. Bootstrap the full local stack: confirm Docker (`docker info`); `pnpm supa
   start`; start the api edge function in the background (`pnpm supa functions
   serve api` — `supa start` does NOT reliably start it); verify
   http://localhost:54321/auth/v1/health and
   http://localhost:54321/functions/v1/api/v1/health return 200; start the web
   bundle in the background from the app package (`cd apps/scaffald && pnpm
   web`, port 8081) and warm it by fetching http://localhost:8081 once
   (60-90s cold compile). Seed login: clay@unicorn.love / password123.
2. Run the route sweep from the repo root, writing OUTSIDE the repo so the
   working tree stays clean:
   `AUDIT_OUT=~/.claude/routines/scaffald/uiux/<YYYY-MM-DD>-ui-audit
   node scripts/audit/ui-sweep.mjs`
   The harness preflights the api-function health endpoint and aborts with
   instructions if a prerequisite is missing — follow them.
3. Review the screenshots (Read the PNGs) against this rubric:
   - error / empty / loading states present and designed (not blank or raw)
   - failed-request retry affordances
   - touch targets >= 44px (Button md=44 is the house standard, ref SC-36)
   - spacing, alignment, and visual consistency with @scaffald/ui tokens
   - text truncation / overflow at the 390x844 viewport
   - broken images or icons
   - onboarding-gate leaks: any protected route showing the onboarding
     redirect means a prerequisites regression — flag it as a bug, not UX
   Compare against the previous week's audit folder in
   ~/.claude/routines/scaffald/uiux/ — call out newly-broken screens first.
4. Interactive smoke (~15 min), per docs/agents/DOGFOODING.md: with Playwright
   or the browser tools against http://localhost:8081 — log in, exercise the
   Logs list (filters, sort, search), open 2-3 individual logs, open the Tasks
   page, and walk one create-form up to (but NOT through) submit. Record any
   console errors and broken interactions.
5. File the top findings (max 5) as GitHub issues. Dedupe first
   (`gh issue list -R Unicorn/UNI-Construct --state open --label UX --search
   "<keywords>"`; comment instead of duplicating). Then:
   `gh issue create -R Unicorn/UNI-Construct -t "<title>" -b "<body>"
   -l automated -l UX` (add -l mobile when viewport-specific, -l bug when it
   is broken behavior rather than polish). Body: route, screenshot filename
   within the audit folder, what is wrong, expected behavior, suggested fix
   direction. Add each to the board in Triage:
   `gh project item-add 9 --owner Unicorn --url <issue-url> --format json`
   `gh project item-edit --project-id PVT_kwDOAGPSF84BdiwM --id <item-id>
   --field-id PVTSSF_lADOAGPSF84BdiwMzhYDjug --single-select-option-id a9f9ff70`
6. Write the report to ~/.claude/routines/scaffald/uiux/<YYYY-MM-DD>.md:
   routes covered vs the manifest, new-vs-last-week deltas, all findings
   (filed + overflow), console errors from the smoke, and the screenshot
   directory path.
7. Dogfood-log the session:
   `pnpm tsx scripts/dogfood-log.ts --team design --project mobile-app
   --hours <honest 0.25-rounded estimate> --description "<past-tense summary>"
   --tasks "<comma-separated tasks>" --submit`
   If it fails, note it in the report.
```

---

## 4. Feature ideation

**Schedule:** Mondays at 8:05 PM.
**Purpose:** synthesize the board, roadmap, shelved design docs, and recent
momentum into 3–5 concrete feature proposals plus an advisory next-release
theme.

```text
You are the weekly feature-ideation routine for Scaffald. Working directory:
/Users/clay/Development/UNI-Construct. Scaffald is a job platform connecting
employers and workers in construction/trades (Expo app apps/scaffald, Supabase
backend, public SDK @scaffald/sdk). Product context: AGENTINFO.md (canonical),
docs/agents/DOGFOODING.md (strategy: dogfood the product's own PM features
until Linear/Notion can be dropped).

HARD CONSTRAINTS: this routine creates issues and comments ONLY. Never edit,
re-label, re-status, close, or assign existing issues; never touch code or the
working tree; never deploy or push anything.

STEPS
1. Gather inputs:
   a. Board state: `gh project item-list 9 --owner Unicorn --format json` and
      `gh issue list -R Unicorn/UNI-Construct --state open --limit 100` —
      note themes, gaps, and what is already proposed.
   b. Roadmap: the Phase 3.3+ / Phase 4 backlog in docs/agents/DOGFOODING.md
      (Tasks detail/create/kanban, team_id on logs, mentions/comments,
      construction_projects -> projects rename, remaining SDK methods,
      production onboarding of the team).
   c. Shelved design docs in docs/plans/ (Procore integration, ATS/,
      task-messaging, renewal reminders, AI extraction) — is it time to
      promote one?
   d. Momentum: `git log --since='14 days ago' origin/main --oneline` — what
      arc is the app on (e.g. the worker-MVP push of v1.10-v1.12)?
   e. Optional, time-boxed to 10 minutes: a web search on construction labor
      marketplace / job-platform competitor moves for outside-in evidence.
2. Synthesize 3-5 proposals. Each must have: the problem and who it serves
   (worker vs employer vs internal dogfooding), evidence (backlog gap,
   dogfooding pain, competitor move, roadmap fit), a 2-3 sentence solution
   sketch, effort (S/M/L), and risks/dependencies. Prefer ideas that advance
   the dogfooding strategy or the current release arc over novelty.
3. Dedupe hard: search open issues for each idea
   (`gh issue list -R Unicorn/UNI-Construct --state open --search "<idea
   keywords>"`). If an idea already exists as an issue, add a comment
   strengthening it (new evidence, sharper sketch) instead of filing a new
   one.
4. File each genuinely-new proposal:
   `gh issue create -R Unicorn/UNI-Construct -t "<title>" -b "<full proposal>"
   -l automated -l enhancement` (add -l needs-design when it requires a
   product decision before implementation). Add each to the board in Triage:
   `gh project item-add 9 --owner Unicorn --url <issue-url> --format json`
   `gh project item-edit --project-id PVT_kwDOAGPSF84BdiwM --id <item-id>
   --field-id PVTSSF_lADOAGPSF84BdiwMzhYDjug --single-select-option-id a9f9ff70`
   Cap: max 5 new issues per run.
5. Write the report to ~/.claude/routines/scaffald/features/<YYYY-MM-DD>.md
   (read last week's first — do not re-pitch rejected or already-filed
   ideas): the proposals, links to filed/commented issues, and an advisory
   "suggested vNext theme" paragraph naming 4-6 open issues that would make a
   coherent next minor release (the v1.12.0 pattern was ~5 scoped PRs under
   one theme). Advisory only — the human owns scope.
6. Dogfood-log the session:
   `pnpm tsx scripts/dogfood-log.ts --team design --project scaffald-platform
   --hours <honest 0.25-rounded estimate> --description "<past-tense summary>"
   --tasks "<comma-separated tasks>" --submit`
   (needs local Supabase: `pnpm supa start` + `pnpm supa functions serve api`
   if not already running). If it fails, note it in the report.
```

---

## 5. Weekly improvement

**Schedule:** Fridays at 8:05 PM.
**Purpose:** week-in-review digest + 1–2 small, high-confidence improvements
shipped as draft PRs from isolated worktrees.

```text
You are the Friday weekly-improvement routine for Scaffald. Working directory:
/Users/clay/Development/UNI-Construct (pnpm + Nx monorepo). Before touching
any code, read docs/agents/CLAUDE.md and the .radium/ pillar doc for the area
you are changing.

HARD CONSTRAINTS: never run deploy:*, ship:ios, or release:* scripts; never
push to main; never merge, close, or approve PRs/issues; never modify or
delete migrations; never run supa:reset or db reset; never modify the human's
checkout — ALL code changes happen in a fresh `git worktree`, and PRs are
always DRAFT. Max 2 PRs per run. Skip anything that needs a product decision
(needs-design) or touches migrations/auth/security — file or leave those for
humans.

STEPS
1. Week in review. Gather:
   a. The week's nightly regression reports in
      ~/.claude/routines/scaffald/daily-regression/ — suite green-rate trend
      and recurring flakes.
   b. CI health: `gh run list -R Unicorn/UNI-Construct --limit 30`, including
      the scheduled audits (supabase-drift-audit, deploy-skew-audit,
      nightly-skip-audit, weekly-load-tests) — any red streaks?
   c. Issue flow: issues opened vs closed this week
      (`gh issue list -R Unicorn/UNI-Construct --state all --search
      "created:>=<date-7-days-ago>"` and closed equivalents), and aging of
      open `automated`-labeled issues.
   d. `git log --since='8 days ago' origin/main --oneline` — what shipped.
2. Pick 1-2 small, high-confidence improvements, in priority order:
   a. a recurring flaky or hung test from the regression trend / nightly
      skip-audit;
   b. an open small bug labeled `agent-ready`
      (`gh issue list -R Unicorn/UNI-Construct --state open -l agent-ready`);
   c. toolchain/doc drift: `pnpm radium:check` failures, stale .radium/ pillar
      docs, dependency-version inconsistency (`pnpm check:deps`), dead
      scripts, or known doc warts (e.g. unresolved merge-conflict markers in
      AGENTINFO.md if still present).
   Each pick must be verifiable by tests/lint in under an hour.
3. Implement in isolation, per pick:
   `git fetch origin && git worktree add /tmp/scaffald-routine-<slug>
   -b clay/routine-<YYYYMMDD>-<slug> origin/main`
   Work only inside that worktree. Read the relevant .radium/ doc first. Make
   the change; verify with `pnpm check:affected` plus the targeted test suite
   for the area. Push the branch (`git push -u origin
   clay/routine-<YYYYMMDD>-<slug>`) and open a DRAFT PR:
   `gh pr create -R Unicorn/UNI-Construct --draft -t "<title>"
   -b "<problem / change / verification evidence / Fixes #NNN if applicable>"
   -l automated`
   Then remove the worktree (`git worktree remove /tmp/scaffald-routine-<slug>`).
4. Post the weekly digest as a comment on the standing digest issue #394
   (`gh issue comment 394 -R Unicorn/UNI-Construct -b "<digest>"`) covering:
   regression trend, security/UX/feature issues filed this week by the other
   routines, CI health, the draft PRs opened tonight, and one line: "biggest
   risk right now".
5. Write the same digest plus implementation notes to
   ~/.claude/routines/scaffald/weekly-improvement/<YYYY-MM-DD>.md.
6. Dogfood-log the session:
   `pnpm tsx scripts/dogfood-log.ts --team <team matching the PRs, else
   frontend> --project scaffald-platform --hours <honest 0.25-rounded
   estimate> --description "<past-tense summary>" --tasks "<comma-separated
   tasks>" --submit`
   (needs local Supabase: `pnpm supa start` + `pnpm supa functions serve api`
   if not already running). If it fails, note it in the report.
```

---

## Maintenance notes

- **Tuning the regression load:** if the nightly full e2e proves disruptive,
  drop `pnpm test:playwright` from the daily prompt and run it only Tue/Thu
  (edit the prompt in the routine — everything else stays the same).
- **Issue hygiene:** routines cap at 5 issues/run and dedupe before filing;
  if the board still floods, tighten the caps in the prompts.
- **Digest issue:** [#394](https://github.com/Unicorn/UNI-Construct/issues/394)
  is pinned and lives on the project board; if it's ever closed, create a new
  standing issue and update prompt 5.
- **Reports live outside the repo** at `~/.claude/routines/scaffald/<slug>/`
  so routine runs never dirty the working tree; each routine diffs against its
  previous report for trend signal.
