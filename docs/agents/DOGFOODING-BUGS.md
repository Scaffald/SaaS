# Dogfooding Bugs

Append-only list of bugs found while using our own product. Each entry:

```
- [ ] YYYY-MM-DD — <short title> — <where> — <repro/notes>
```

Mark `[x]` when fixed (and ideally link the PR/commit).

This file is a stopgap. Once in-product Tasks ships in Phase 3, the open
entries here migrate into the product and this file gets deleted. See
[DOGFOODING.md](DOGFOODING.md) for the full plan.

---

## Open

<!-- Append new bug findings below this line -->

## Fixed

- [x] 2026-05-18 — `POST /v1/work-logs` rejects all creates with `cannot insert a non-DEFAULT value into column "total_hours"` — `packages/supabase/functions/api/routes/work-logs.ts:216` was inserting `total_hours: 0`, but `core.work_logs.total_hours` is a `GENERATED ... STORED` column derived from `time_entries`. Removed the explicit insert. Found while running the very first dogfood-log smoke test — exactly the kind of breakage the loop is meant to catch.
- [x] 2026-05-18 — `POST /v1/work-logs` had three schema/SDK drift bugs that made any create impossible — (a) `entryType` SDK enum is `single_day|date_range` but DB CHECK constraint requires `daily|project|task`; (b) `time_entries` items use `start_time`/`end_time` in SDK but DB `core.calculate_time_entries_total_hours()` reads `start`/`end`, silently computing `total_hours=0` and failing the `total_hours > 0` constraint; (c) `visibility='organization'` SDK option fails the DB CHECK `visibility IN ('public','private')`. Patched the API handler at `packages/supabase/functions/api/routes/work-logs.ts` to translate SDK shape → DB shape (single_day→daily, date_range→project, start_time→start, organization→private). Proper fix is a schema rename — see DOGFOODING-IDEAS.md.
- [x] 2026-05-18 — `work_logs_insert_self` RLS rejected valid user-JWT inserts (no end-user could create a log via the API) — root cause was that the `work_logs_select_self` SELECT policy delegated to `core.can_access_work_log(id)`, a SECURITY DEFINER function that recursively `SELECT EXISTS (... FROM core.work_logs ...)`. When called inside RETURNING evaluation, that function failed to see the just-inserted row, returning false and rejecting the row via the SELECT side-check. The error surfaced misleadingly as "row violates row-level security policy" pointing at the INSERT policy. Fix: inlined the access-check expression directly into the SELECT/UPDATE policies in `packages/supabase/migrations/324_work_logs_rls_inline_access_check.sql`. Verified end-to-end: PostgREST direct insert + SDK `client.workLogs.create()` both succeed with a user JWT. Dropped the service-role workaround in `scripts/dogfood-log.ts`.
- [x] 2026-05-18 — `POST /v1/work-logs/:workLogId/submit` returned 404 — SDK exposes `client.workLogs.submit()` but the API never implemented the endpoint. Added it to `packages/supabase/functions/api/routes/work-logs.ts`. Note: the SDK exposes ~15 other work-log methods (addCollaborator, addComment, uploadPhoto, getById, getOverview, getProjectOptions, getProjectRollup, deletePhoto, etc.) that are similarly unimplemented in the public API. Tracking the bigger gap in DOGFOODING-IDEAS.md rather than fixing all here.
- [x] 2026-05-18 — `GET /v1/work-logs` silently ignored `statuses`, `search`, `sortField`, `sortDirection`, `dateFrom`, `dateTo` filters — the LIST handler at `packages/supabase/functions/api/routes/work-logs.ts` accepted only `page/pageSize/projectId/organizationId`. This meant the polished filters on the org Logs list UI (commit `460c28153`) couldn't actually narrow results — every filter click returned the full 42-row list. Wired up all five filter params + sort, and verified status/search/sort all return the correctly-filtered counts. Found by phase2-seed verification.
- [x] 2026-05-18 — `GET /v1/work-logs/projects` (project picker for the create-log form) returned 404 — endpoint was missing. Added it: returns construction_projects scoped to the caller's orgs (or the explicit `organizationId` if the caller is a member), with `search` and `includeArchived` support, matching the SDK's `ProjectOption` shape.
- [x] 2026-05-18 — `GET /v1/work-logs/:workLogId` (the detail page) returned 404 — endpoint was missing. Added it with two visibility paths: RLS-scoped first (own + collaborator), then a service-role fallback that checks the caller is a member of the log's owning org (so admins can see all org members' logs, mirroring the LIST handler).
