# Dogfooding Plan — Logs

Source of truth for the multi-phase plan to dogfood our own product by using
Claude Code sessions as logged work units. Sessions in this repo are expected
to follow this — see the root [CLAUDE.md](../../CLAUDE.md) for the per-session
expectation.

Full plan in `/Users/clay/.claude/plans/flickering-dancing-abelson.md`.
This file is the short, durable version that lives with the code.

## Why

The new Logs UI (commit `460c28153`) is polished but exercised only by 8
seeded rows. Treating every Claude session as a billable unit of work and
logging it accomplishes three things at once:

1. Real demo data accumulates over time.
2. The API/SDK/UI surface gets exercised continuously, so bugs surface fast.
3. We use the product itself for project management — which forces us to
   build the missing PM primitives (tasks, punchlists, milestones) and
   eliminates our dependence on Linear/Notion.

## Phases

### Phase 0 — Foundation (done)

- [packages/supabase/seeds/011_seed-real-org-structure.sql](../../packages/supabase/seeds/011_seed-real-org-structure.sql)
  adds: 7 new `@unicorn.love` users (alongside existing clay/marc/zach), 4 new
  teams (Design/Frontend/Backend/Infra) layered on top of the existing
  Engineering/Operations/Hiring teams, and 6 software "projects" repurposing
  `core.construction_projects` rows.
- All passwords are `password123` (matches existing seed convention).
- Idempotent — safe to re-run.

**Project naming gap**: the projects live in `core.construction_projects`,
which is a schema misnomer for software work. Renaming to `core.projects`
with a `kind` discriminator is queued for Phase 3.

### Phase 1 — Instruments (done)

- [scripts/dogfood-log.ts](../../scripts/dogfood-log.ts) — SDK wrapper.
  Resolves a slug → UUID for project, signs in as a user, creates a log,
  optionally submits.
- [Root CLAUDE.md](../../CLAUDE.md) — auto-loaded per session, contains the
  expectation and command.
- [.claude/skills/dogfood-log/](../../.claude/skills/dogfood-log/) — skill
  that triggers on "log this session" and similar phrases.
- [DOGFOODING-BUGS.md](DOGFOODING-BUGS.md) and
  [DOGFOODING-IDEAS.md](DOGFOODING-IDEAS.md) — append-only running lists.

### Phase 2 — Run the loop (initial seed done; ongoing)

Initial Phase 2 data accumulation landed via [scripts/phase2-seed.ts](../../scripts/phase2-seed.ts)
(one-shot, idempotent by `phase2:key=` marker). Results meeting all exit
criteria as of 2026-05-18:

- 31 Phase 2 logs (42 total counting earlier seed + smoke rows)
- Teams: backend 7, design 7, frontend 9, infra 7 (all ≥3 ✓)
- Projects: Infrastructure 3, Logs 12, Mobile 4, Platform 6, UI 4, Tasks 4 (all ≥3 ✓)
- Statuses: draft 7, pending 16, verified 17, disputed 2 (all ≥2 ✓)

Five bugs surfaced and fixed during the loop (see
[DOGFOODING-BUGS.md](DOGFOODING-BUGS.md) Fixed section): `total_hours`
generated-column insert, SDK/DB shape drift, RLS recursive SECURITY DEFINER
in SELECT policy, missing `/submit` endpoint, and silently-ignored
list filters/sort.

Going forward (no new code expected; just sustained use):
Every session uses the logger. Per-session expectations:

- One log per session, scoped to a team + project.
- Tasks listed as separate strings in `tasksCompleted[]`.
- Mix `visibility` over time to exercise filter behavior.
- Submit some, leave some as draft.

Weekly Friday browser smoke (45 min, manual):
- Create one log via the UI from
  `http://localhost:8081/employers/org/unicorn/logs/create`.
- Exercise every filter (status segments, sort, search, date range).
- Click into 3 random logs.
- File findings to [DOGFOODING-BUGS.md](DOGFOODING-BUGS.md) and
  [DOGFOODING-IDEAS.md](DOGFOODING-IDEAS.md).

**Exit criteria for Phase 2:**
- ≥30 real logs in DB
- Each team has ≥3 logs
- Each project has ≥3 logs
- Each status bucket (`draft`, `pending_verification`, `verified`, `disputed`)
  has ≥2 logs
- Bug list has ≥10 entries

### Phase 3.1 — Build the missing PM primitives (done)

Tasks + Punchlists landed on 2026-05-18:

- DB schema: [packages/supabase/migrations/325_tasks_and_punchlists.sql](../../packages/supabase/migrations/325_tasks_and_punchlists.sql) — `core.tasks`, `core.punchlists`, junction `core.work_log_tasks`, RLS, indexes, updated_at + completed_at auto-stamp triggers.
- API:
  [packages/supabase/functions/api/routes/tasks.ts](../../packages/supabase/functions/api/routes/tasks.ts)
  (CRUD + `POST /:id/complete` with optional `workLogId` link),
  [packages/supabase/functions/api/routes/punchlists.ts](../../packages/supabase/functions/api/routes/punchlists.ts) (CRUD).
- Markdown → product migration: [scripts/migrate-dogfood-md-to-tasks.ts](../../scripts/migrate-dogfood-md-to-tasks.ts) reads the open/fixed/shipped entries from DOGFOODING-{BUGS,IDEAS}.md and creates 3 punchlists + 14 tasks. Result is snapshotted in [packages/supabase/seeds/012_seed-dogfood-tasks.sql](../../packages/supabase/seeds/012_seed-dogfood-tasks.sql) so `pnpm supa db reset` reproduces the demo.
- Markdown files are now thin stubs pointing at the in-product Tasks. They can be deleted entirely once Phase 3.2 ships a UI.

### Phase 3.2 — Tasks UI list page (done)

The read-mostly list page is live at
[employers/org/[slug]/tasks](../../apps/scaffald/app/(protected)/employers/org/%5Bslug%5D/tasks/index.tsx).
It groups tasks by punchlist, supports the status segmented filter + a
search box, and allows toggling status `todo ↔ done` inline via the
SDK's `complete` / `update` methods. Detail and create flows are
intentionally deferred to future sessions — the read path is what
unblocks the dogfood loop's "where do my entries live" question.

SDK + hooks shipped in the prior commit; the `packages/sdk` submodule
is on local branch `dogfood/add-tasks-punchlists` (push when ready).

### Phase 3 backlog (3.3 and beyond)

- **Tasks UI: detail page** — click into a task to see full description, edit, link to logs.
- **Tasks UI: create form** — currently only the API path exists.
- **Tasks UI: kanban view** — drag-between-columns by status.
- ~~**Team association on logs**~~ — done (#425, migration 339). `core.work_logs.team_id` is a real FK to `core.teams`, filterable via `GET /v1/work-logs?teamId=…`. The `[team:slug]` description prefix is gone and existing rows were backfilled.
- **Mentions + comments on logs** — partially modeled in `core.work_log_conversations`; ship the UI.
- **Project model rename** — `core.construction_projects` → `core.projects` with a `kind` discriminator.
- **Work Logs → Logs in schema/SDK** — UI already uses "Logs"; back end catches up. Larger blast radius, so it lands after the loop is stable.
- **Remaining work-log SDK methods** — getOverview, getProjectRollup, addCollaborator, addComment, uploadPhoto, etc. SDK exposes them; API doesn't implement.

Each of these is now also a Task in the **Dogfood Ideas** punchlist —
the product is now the source of truth.

### Phase 4 — Production deployment & continued use (week 4+)

When Phase 3 minimums (Tasks + Punchlists) ship and the team has used the
local instance for ≥1 week without major regressions:

- Deploy `apps/scaffald` to production via the existing pipeline.
- Re-point `scripts/dogfood-log.ts` at prod via
  `EXPO_PUBLIC_SCAFFALD_API_URL`.
- Mint a production API key for the dogfood script (and surface that there's
  no admin UI for API keys — yet another Phase 3 candidate).
- Onboard all 10 team members to production through the standard invite
  flow → tests the invite UX in anger.
- Local instance stays as the QA/test rig; prod starts clean.

## How to use this in a session

Read the root [CLAUDE.md](../../CLAUDE.md) — it's the operational guide.
This file is the strategic context.
