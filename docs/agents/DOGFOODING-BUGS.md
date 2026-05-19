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

- [ ] 2026-05-18 — `work_logs_insert_self` RLS policy rejects valid user-JWT inserts — policy is `WITH CHECK (auth.uid() = user_id)` ([packages/supabase/migrations/039_work_log_policies.sql:83-87](../../packages/supabase/migrations/039_work_log_policies.sql#L83-L87)). With a real Supabase session for `clay@unicorn.love`, `auth.uid()` correctly resolves to Clay's id and we insert with `user_id = auth.uid()`, yet the WITH CHECK still rejects. Reproduced via direct PostgREST POST to `/rest/v1/work_logs` and via `INSERT ... RETURNING` in psql under `SET LOCAL role TO authenticated; SET LOCAL "request.jwt.claims" ...`. Service-role insert works. This means NO end-user can create a work log via the public API — the seed data is the only source of rows today. Workaround in `scripts/dogfood-log.ts`: insert via service-role supabase-js client. Removing this workaround is a Phase 2 blocker.

<!-- Append new bug findings below this line -->

## Fixed

- [x] 2026-05-18 — `POST /v1/work-logs` rejects all creates with `cannot insert a non-DEFAULT value into column "total_hours"` — `packages/supabase/functions/api/routes/work-logs.ts:216` was inserting `total_hours: 0`, but `core.work_logs.total_hours` is a `GENERATED ... STORED` column derived from `time_entries`. Removed the explicit insert. Found while running the very first dogfood-log smoke test — exactly the kind of breakage the loop is meant to catch.
- [x] 2026-05-18 — `POST /v1/work-logs` had three schema/SDK drift bugs that made any create impossible — (a) `entryType` SDK enum is `single_day|date_range` but DB CHECK constraint requires `daily|project|task`; (b) `time_entries` items use `start_time`/`end_time` in SDK but DB `core.calculate_time_entries_total_hours()` reads `start`/`end`, silently computing `total_hours=0` and failing the `total_hours > 0` constraint; (c) `visibility='organization'` SDK option fails the DB CHECK `visibility IN ('public','private')`. Patched the API handler at `packages/supabase/functions/api/routes/work-logs.ts` to translate SDK shape → DB shape (single_day→daily, date_range→project, start_time→start, organization→private). Proper fix is a schema rename — see DOGFOODING-IDEAS.md.
