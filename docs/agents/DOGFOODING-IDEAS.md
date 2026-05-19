# Dogfooding Ideas

Append-only list of feature ideas surfaced while using our own product.
Especially valuable: PM primitives that would let us drop Linear/Notion and
manage all our work inside this product.

Each entry:

```
- [ ] YYYY-MM-DD — <short title> — <why it would matter> — <source: log id / session>
```

Mark `[x]` when shipped (link the PR/commit).

This file is a stopgap. Once in-product Tasks ships in Phase 3, the open
entries migrate into the product and this file gets deleted. See
[DOGFOODING.md](DOGFOODING.md) for the full plan.

---

## Open

- [ ] 2026-05-18 — Add `team_id` to `core.work_logs` — work_logs currently has no team association, so the dogfood script puts `[team:slug]` in the description as a workaround. Filtering/grouping by team in the Logs UI needs first-class support. — source: scripts/dogfood-log.ts
- [ ] 2026-05-18 — Rename `core.construction_projects` → `core.projects` with `kind` discriminator — repurposing the construction projects table for software work is a schema misnomer flagged in Phase 0. — source: packages/supabase/seeds/011_seed-real-org-structure.sql
- [ ] 2026-05-18 — Build first-class Tasks + Punchlists — required to replace Linear for our own PM. Tasks scoped to project/team with assignee, status, due date; bidirectionally linked to logs. — source: Phase 3 plan
- [ ] 2026-05-18 — Admin UI for API keys — production dogfood logging needs a service API key, but there's no admin UI today (only manual provisioning). — source: Phase 4 plan
- [ ] 2026-05-18 — Rename `core.work_logs` → `core.logs` and `client.workLogs` → `client.logs` — UI already says "Logs"; back end is the lag. Larger blast radius, defer until dogfood loop is stable. — source: Phase 3 plan
- [ ] 2026-05-18 — Realign SDK / DB work-log schemas — the SDK exposes a richer model (`entryType: single_day|date_range`, `time_entries: {start_time,end_time}`, `visibility: private|organization|public`) than the DB CHECK constraints allow (`daily|project|task`, `{start,end}`, `public|private`). The API handler currently bridges with a translation shim — proper fix is to migrate the DB schema to match the SDK (or vice versa) and drop the shim. — source: 2026-05-18 dogfood smoke test (see DOGFOODING-BUGS.md)
- [ ] 2026-05-18 — Wire up missing public-API endpoints for work logs — SDK at `packages/sdk/src/resources/work-logs.ts` exposes ~15 methods (getById, getOverview, getProjectOptions, getProjectRollup, addCollaborator, updateCollaborator, addComment, uploadPhoto, updatePhotoMetadata, updatePhotoVisibility, deletePhoto, moveToProject, approveMoveRequest, denyMoveRequest, exportWorkLog) that the API at `packages/supabase/functions/api/routes/work-logs.ts` does not implement. Submit was added on 2026-05-18 to unblock dogfood; the rest still 404. Implementing these one-by-one as we hit them in the dogfood loop is a great unit-of-work for future sessions. — source: 2026-05-18 dogfood smoke test (see DOGFOODING-BUGS.md)

## Shipped

<!-- Move shipped entries here with [x] and a commit/PR link -->
