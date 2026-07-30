# CLAUDE.md

Project-specific guidance for Claude Code sessions in this repo.

**Canonical project context**: [docs/agents/CLAUDE.md](docs/agents/CLAUDE.md) and
[AGENTINFO.md](AGENTINFO.md). Read those first for architecture, pillar docs
(`.radium/*`), and pre-edit checklists.

---

## Dogfood Logging

**At the end of every session that produced meaningful work in this repo, log it
to Unicorn's Logs system.** This is how we generate real demo data, exercise the
API/SDK/UI surface continuously, and surface bugs and feature gaps. See
[docs/agents/DOGFOODING.md](docs/agents/DOGFOODING.md) for the full plan.

Two modes:

1. **API mode (default)** — run the script:
   ```bash
   pnpm tsx scripts/dogfood-log.ts \
     --team <design|frontend|backend|infra> \
     --project <scaffald-platform|scaffald-ui|logs-feature|tasks-feature|infrastructure|mobile-app> \
     --hours 1.0 \
     --description "One-paragraph past-tense summary of what was done" \
     --tasks "Task one,Task two,Task three" \
     --submit
   ```
   Pick the team + project that best fit. Estimate hours honestly, rounded
   to 0.25h. Write the description in past tense. List concrete completed
   tasks in `--tasks` (comma-separated). Add `--submit` to move the log to
   `pending_verification`; omit to leave as draft.

2. **Browser mode (weekly Friday smoke, ~45 min)** — open
   `http://localhost:8081/employers/org/unicorn/logs/create` and fill the
   form manually. While there, exercise filters/sort/search on the list
   page, click into a few logs, and file any UI bugs as Tasks (see below).

**Don't skip logging.** Gaps in the timeline are the failure mode we want
to avoid. If you can't decide on a team/project, ask the user. If the
script fails because the API isn't running, start it with `pnpm supa start`
and `pnpm supa functions serve api` (separate terminal).

**Bugs and ideas:** while working, or when reviewing your output in the
browser, file findings **as Tasks in the product** — the markdown stopgaps
this used to point at are gone (Phase 3 shipped; see
[docs/agents/DOGFOODING.md](docs/agents/DOGFOODING.md)). Filing them in the
product *is* part of the dogfood loop: it exercises the Tasks surface the
same way logging exercises Logs.

Punchlists in the Unicorn org
([employers/org/unicorn/tasks](http://localhost:8081/employers/org/unicorn/tasks)):
- **Dogfood Bugs (Open)** — broken UI, broken behavior, schema misnomers
- **Dogfood Bugs (Fixed)** — move here rather than deleting, so the
  before/after stays visible
- **Dogfood Ideas** — feature ideas, especially PM primitives that would let
  us run this product on itself

**Then add the finding to
[packages/supabase/seeds/012_seed-dogfood-tasks.sql](packages/supabase/seeds/012_seed-dogfood-tasks.sql).**
A Task filed only in local dev is destroyed by the next `pnpm supa db reset` —
that is exactly how the first copy of the 2026-07-30 findings was lost. File it
in the product so the surface gets exercised, then seed it so it survives.

**Bugs in the code, as opposed to in the product experience, go to GitHub
Issues** on `Scaffald/SaaS` with the `agent-ready` label when they are
self-contained — see [docs/agents/TRACKING.md](docs/agents/TRACKING.md).
Rule of thumb: if a teammate would triage it on the board, it is an Issue;
if it is dogfood signal about using Scaffald, it is a Task.
