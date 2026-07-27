# Feature idea proposals — 2026-07-27

Automated weekly feature-ideation routine. Scanned the open GitHub issues
(19 open, no project-9 board access from this session — `gh` CLI isn't
available here, so this used the GitHub MCP `list_issues`/`list_pull_requests`
tools instead) and the Phase 3.3+ / Phase 4 backlog in
[DOGFOODING.md](DOGFOODING.md).

## What the board already covers

Most open issues are either infra debt (broken Deno test suites: #421,
#418, #416; CI billing block: #375; test-fixture collisions: #411) or
mobile UX polish flagged by manual smoke tests (#392, #391, #389, #382).
A handful are stale Linear migrations from the April strategy phase
(#371, #370, #369, #368) that predate the current dogfooding-focused
roadmap. None of the open issues touch the Phase 3.3+ Tasks/Logs backlog
items below, so that's where this round's proposals came from.

## Gaps identified in the Phase 3.3+ / Phase 4 backlog

`DOGFOODING.md`'s "Phase 3 backlog" and Phase 4 sections name several
unstarted items. Four were picked as good-sized, user-centric proposals:

- Tasks UI has no detail view (list-only, per Phase 3.2's own scope note).
- Tasks UI has no create form — the API path is the only way to add a
  task, which works against the "replace Linear with in-product PM"
  dogfooding goal this very repo is built around.
- Phase 4 explicitly flags "no admin UI for API keys" as a gap that will
  block the production key mint step.
- The dogfood script's `[team:slug]`-in-description workaround for team
  association on logs is called out by name in the Phase 3 backlog as
  something that should become a real `team_id` column.

## Issues filed

| Issue | Theme | Label |
|---|---|---|
| [#422](https://github.com/Unicorn/UNI-Construct/issues/422) — Tasks: add a detail view | PM parity with Linear | Feature |
| [#423](https://github.com/Unicorn/UNI-Construct/issues/423) — Tasks: add an in-app create form | PM parity with Linear | Feature |
| [#424](https://github.com/Unicorn/UNI-Construct/issues/424) — Admin UI for API keys | Phase 4 production readiness | Feature |
| [#425](https://github.com/Unicorn/UNI-Construct/issues/425) — Work logs: real `team_id` column | Logs data-model gaps | Improvement (labeled `enhancement`; repo has no `Improvement` label) |

No assignees, status, or issue links were set on any of these per the
routine's instructions — triage is left to a human pass.
