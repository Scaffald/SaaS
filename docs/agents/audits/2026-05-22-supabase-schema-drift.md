# Supabase schema-drift audit — 2026-05-22

Audit performed during v1.3.0 release cut, when SC-38's migration 326 surfaced
that the team's three Supabase environments had drifted significantly from
each other and from the migration files in this repo.

## TL;DR

- **Preview** is the only environment fully in sync with `packages/supabase/migrations/`.
- **Dev** is missing **35 tables** that exist in preview.
- **Prod** is missing **39 tables** that exist in preview.
- Across both dev + prod, ~12 migrations are recorded as "applied" in
  `supabase_migrations.schema_migrations` but their CREATE TABLE / ALTER SQL
  was never actually run.
- Two migration tracking conventions were in use side by side: numeric
  prefix only (`'001'`) on preview, full filename stem (`'001_schema'`) on
  dev and prod. Both are now realigned to numeric (via the `split_part`
  UPDATE applied manually in the dashboard).
- SC-38 itself shipped fine: migration 326 creates `core.review_links`
  and relaxes the `core.reviews.author_user_id` constraint. All three
  environments now have the table and the partial unique index.
- **The audit was triggered late, so some marked-applied entries on prod
  are records-only lies.** They need to be reverted and the SQL re-run.

## Detailed evidence

### Schema-dump line counts

| Env | `pg_dump --schema core --schema public` | Notes |
| --- | --- | --- |
| Preview | 20,823 lines, 171 tables | Baseline — fully synced via CLI |
| Dev | 17,280 lines, 137 tables | 35 tables missing |
| Prod | 16,181 lines, 132 tables | 39 tables missing |

### Missing tables → source migrations

| Migration | Tables missing on prod | Tables missing on dev | Domain |
| --- | --- | --- | --- |
| 140_req_3_ccpa_compliance | `privacy_data_requests`, `privacy_opt_outs` | same | CCPA |
| 200_forsured_create_audit_log_table | `audit_log`, `audit_log_archive_index` | (only `audit_log_archive_index`) | Audit |
| 221_generic_invitation_system | `generic_invitations`, `invitation_rules` | same | Org invites |
| 222_api_keys_system | `api_keys`, `api_key_usage` | same | API auth |
| 223_oauth_authorization_codes_and_consents | `oauth_authorization_codes`, `oauth_user_consents` | same | OAuth |
| 225_webhook_system | `webhooks`, `webhook_deliveries`, `webhook_events` | same | Webhooks |
| 300_create_public_auth_sessions | `auth_sessions` | same | Public auth |
| 301_ats_source_tracking_and_message_templates | `message_templates` (+ ATS columns?) | same | ATS |
| 304_union_status_and_activity_feed | `application_activity` (+ union_status columns on existing tables?) | same | 🔴 SC-37 dependency |
| 305_privacy_eeo_project_hiring | `eeo_reports`, `eeo_self_identification`, `hiring_projects`, `hiring_project_crew`, `hiring_project_roles` | same | EEO + hiring |
| 307_calendar_hris_matching | `calendar_connections`, `hris_connections`, `hris_employee_mappings`, `hris_sync_logs`, `interview_availability`, `interview_bookings`, `interview_slots`, `scheduling_links`, `job_match_scores`, `job_occupation_mappings` | same | Calendar/HRIS/matching |
| 312_skill_snapshots_and_evidence | `skill_snapshots`, `skill_evidence` | same | Skills |
| 325_tasks_and_punchlists | `tasks`, `punchlists`, `work_log_tasks` | (dev got these from my CLI push) | Tasks |

### What I haven't audited yet

- **Column additions on existing tables.** Many migrations add columns (e.g. 304 likely adds `union_status` columns to existing tables). The current table-only diff misses those.
- **Functions / triggers / RLS policies.** Migrations 308, 310, 322, 324, 209-212 alter existing objects. Some certainly never ran.
- **Indexes and constraints.** Same.

A full audit would compare every `CREATE` / `ALTER` / `DROP` statement across the three pg_dumps. Roughly an evening of careful work.

## Root cause

Two parallel deploy mechanisms in use:

1. **CLI** (`supabase db push`) — what preview was set up with. Records
   `version` as the numeric prefix (e.g. `'001'`). Modern CLI parses local
   filenames the same way.

2. **Something else** for dev + prod — possibly the Supabase dashboard
   SQL editor, an older CLI, or a custom deploy script. Records `version`
   as the full filename stem (e.g. `'001_schema'`). And in some cases
   appears to have recorded the version without actually running the SQL
   (the migration was prepped but never executed).

The user manually ran this realignment SQL in the dashboard on both dev
and prod during the v1.3.0 push:

```sql
UPDATE supabase_migrations.schema_migrations
   SET version = split_part(version, '_', 1)
 WHERE version ~ '^[0-9]+_';
```

After that, the CLI's `db push` works on all three envs.

## What's already fixed

- ✅ Preview: 324, 325, 326 pushed via CLI (full sync through 326).
- ✅ Dev: history realigned to numeric format; 322 skipped (table dependency
  missing — separate gap); 324, 325, 326 pushed via CLI. **Still missing
  the ~12 lying-history migrations** that need reverted + re-applied.
- ✅ Prod: history realigned; 45 versions (202-325) marked applied
  records-only; 11 stale timestamp-format rows reverted; 326 pushed.
  **Still missing the same ~12 lying-history migrations** as dev.

## What's NOT fixed yet (the actual fix to schedule)

For dev + prod, run the following carefully:

```bash
# Per env (dev then prod, after a snapshot/PITR mark):
cd packages
pnpx supabase link --project-ref <ref>

# 1. Revert the lying records so db push will try them again
pnpx supabase migration repair --status reverted \
  140 200 221 222 223 225 300 301 304 305 307 312 \
  --linked

# 2. Dry-run first to see what'll happen
pnpx supabase db push --linked --dry-run --yes

# 3. Apply. Some migrations may fail on idempotency (CREATE POLICY without
#    IF NOT EXISTS, CREATE TYPE on existing type, etc.) — read the error,
#    edit the migration to be idempotent, commit, then retry. Each
#    failure is an opportunity to harden the migration files.
pnpx supabase db push --linked --yes
```

Expected failures + remediation pattern:

- `CREATE POLICY X ON Y` when policy already exists → guard with `DROP POLICY IF EXISTS` before the `CREATE`.
- `CREATE TYPE X AS ENUM (...)` when type exists → guard via DO block with `pg_type` lookup.
- `ALTER TABLE X ADD COLUMN Y` when column exists → use `ADD COLUMN IF NOT EXISTS`.
- `CREATE TABLE X` when it exists → switch to `CREATE TABLE IF NOT EXISTS`.

Cleanest workflow: each migration gets a hardening PR that makes it
re-runnable, then it goes through the normal review cycle.

## Schema dumps captured

Saved to `/tmp/scaffald-audit/` during this audit (machine-local):

- `preview-schema.sql` (20,823 lines)
- `dev-schema.sql` (17,280 lines)
- `prod-schema.sql` (16,181 lines)
- `preview-tables.txt`, `dev-tables.txt`, `prod-tables.txt` (extracted table lists)

These are the pre-fix baseline. Re-dump after running the catch-up to
verify equivalence with preview.
