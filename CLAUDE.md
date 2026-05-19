# CLAUDE.md

Project-specific guidance for Claude Code sessions in this repo.

**Canonical project context**: [docs/agents/CLAUDE.md](docs/agents/CLAUDE.md) and
[docs/agents/AGENTINFO.md](docs/agents/AGENTINFO.md). Read those first for
architecture, pillar docs (`.radium/*`), and pre-edit checklists.

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
   page, click into a few logs, and file any UI bugs to
   [docs/agents/DOGFOODING-BUGS.md](docs/agents/DOGFOODING-BUGS.md).

**Don't skip logging.** Gaps in the timeline are the failure mode we want
to avoid. If you can't decide on a team/project, ask the user. If the
script fails because the API isn't running, start it with `pnpm supa start`
and `pnpm supa functions serve api` (separate terminal).

**Bugs and ideas:** while working or when reviewing your output in the
browser, append findings to:
- [docs/agents/DOGFOODING-BUGS.md](docs/agents/DOGFOODING-BUGS.md) — bugs
  (broken UI, broken behavior, schema misnomers, etc.)
- [docs/agents/DOGFOODING-IDEAS.md](docs/agents/DOGFOODING-IDEAS.md) —
  feature ideas (especially PM primitives like tasks/punchlists that would
  let us replace Linear with this product)

These markdown files are stopgaps; once in-product Tasks ships in Phase 3
they migrate into the product itself and the files are deleted.
