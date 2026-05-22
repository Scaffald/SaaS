# Linear ticket draft — Schema-drift catch-up

Created this file because the Linear MCP write was blocked at the time of
session end by an intermittent model-classifier outage. Paste this into a
new Scaffald issue when you pick up the workstream.

---

**Title:** Reconcile Supabase schema drift on dev + prod (catch-up + idempotency hardening)

**Team:** Scaffald

**Priority:** High (2)

**Assignee:** Clay

**Labels:** Bug, Improvement

**Project:** (none — could fit "Project Ops / Tooling" or be standalone infra)

---

## Description

### TL;DR

Supabase **dev is missing 35 tables**, **prod is missing 39 tables**, vs preview (the gold-standard, fully-synced env). The team's older deploy path recorded migrations in `supabase_migrations.schema_migrations` as "applied" without ever executing their SQL. Surfaced during the v1.3.0 release cut (SC-38 migration 326). Full investigation in [`docs/agents/audits/2026-05-22-supabase-schema-drift.md`](https://github.com/Unicorn/UNI-Construct/blob/main/docs/agents/audits/2026-05-22-supabase-schema-drift.md) (commit `d928eba4c` on branch `clay/supabase-drift-audit-and-safeguards`).

Already in place:

- ✅ Audit report committed (per-env table counts, missing-table → migration mapping)
- ✅ Nightly CI drift detector (`.github/workflows/supabase-drift-audit.yml`)
- ✅ Runbook in `.radium/supabase-backend.md` (migration deploy paths + idempotency requirements)
- ✅ Migration 326 (SC-38) successfully applied to all three envs

Still to do (this ticket):

- 🟡 Run the catch-up: revert lying history rows + re-apply ~12 missing migrations on dev + prod
- 🟡 Harden those ~12 migration files for idempotency before re-applying

### Critical user-facing impact

🔴 **SC-37 ActivityTimeline will fail on prod**. Migration `304_union_status_and_activity_feed` was recorded as applied but never executed → `core.application_activity` table doesn't exist on prod → opening any application detail screen will throw on the activity-timeline query. Same on dev. Several other features (API keys, OAuth consents, EEO, HRIS, interview scheduling, hiring projects, skill snapshots, audit logs, webhooks) silently broken on prod.

### The catch-up plan (per env)

Run on dev first as canary, then on prod with PITR snapshot. Each env:

```bash
cd packages
pnpx supabase link --project-ref <env-ref>

# 1. Revert the records-only entries so db push will try them again.
pnpx supabase migration repair --status reverted \
  140 200 221 222 223 225 300 301 304 305 307 312 \
  --linked

# 2. Dry-run first — read the migrations the CLI plans to push.
pnpx supabase db push --linked --include-all --dry-run --yes

# 3. Apply. Some migrations will fail on idempotency
#    (CREATE POLICY without IF NOT EXISTS, CREATE TYPE on existing type,
#    ALTER TABLE ADD COLUMN without IF NOT EXISTS). For each failure:
#    - read the error
#    - edit the migration file to guard the offending statement
#    - commit the idempotency hardening as a fix-up PR
#    - retry the push
pnpx supabase db push --linked --include-all --yes
```

Project refs:

| Env | Ref |
|---|---|
| dev | `pmtdqrfpumqwkdhpgwcz` |
| preview | `uhjkipdwayqfihkanabk` (already synced — skip) |
| prod | `qmfmpcyxsihhfttvqpbw` |

### Migrations expected to need idempotency hardening

Each is one focused PR adding guards:

- **140** `req_3_ccpa_compliance` — privacy_data_requests, privacy_opt_outs
- **200** `forsured_create_audit_log_table` — audit_log, audit_log_archive_index
- **221** `generic_invitation_system` — generic_invitations, invitation_rules
- **222** `api_keys_system` — api_keys, api_key_usage
- **223** `oauth_authorization_codes_and_consents` — oauth_authorization_codes, oauth_user_consents
- **225** `webhook_system` — webhooks, webhook_deliveries, webhook_events
- **300** `create_public_auth_sessions` — auth_sessions
- **301** `ats_source_tracking_and_message_templates` — message_templates + ATS columns
- **304** `union_status_and_activity_feed` — application_activity + union_status columns 🔴 highest priority for SC-37
- **305** `privacy_eeo_project_hiring` — eeo_reports, eeo_self_identification, hiring_projects, hiring_project_crew, hiring_project_roles
- **307** `calendar_hris_matching` — calendar_connections, hris_*, interview_*, scheduling_links, job_match_scores, job_occupation_mappings
- **312** `skill_snapshots_and_evidence` — skill_snapshots, skill_evidence

Idempotency patterns documented in `.radium/supabase-backend.md`:

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `ALTER TABLE … ADD COLUMN IF NOT EXISTS`
- `DROP POLICY IF EXISTS X; CREATE POLICY X …` (no `CREATE POLICY IF NOT EXISTS` in older PG)
- `CREATE OR REPLACE FUNCTION`
- For types/enums: `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_type WHERE typname = 'X') THEN CREATE TYPE X AS ENUM …; END IF; END $$;`

### What was NOT audited yet

The audit compares **tables only**. Migrations also add:

- Columns to existing tables (304's `union_status` is one example — column may not exist on prod)
- Functions, triggers, indexes, RLS policies
- Storage buckets / RLS

A column/function-level audit is also needed. Schema dumps were saved in `/tmp/scaffald-audit/` during the original audit session (machine-local — re-dump in the next session via `pnpx supabase db dump --linked --schema core --schema public`).

### Acceptance criteria

- [ ] Dev: every migration in `packages/supabase/migrations/` has its objects actually present in the dev schema (verified via post-catch-up schema dump diff against preview)
- [ ] Prod: same verification
- [ ] All affected migration files (140, 200, 221, 222, 223, 225, 300, 301, 304, 305, 307, 312) are idempotent. Each gets a one-PR hardening.
- [ ] Nightly Supabase drift audit CI workflow runs green on all three envs
- [ ] SC-37 ActivityTimeline confirmed working on prod (smoke test: open an application detail screen, verify activity loads without 500)
- [ ] Column-level + function-level audit completed and any further gaps fixed

### Related

- v1.3.0 release commit: [`7dba0c517`](https://github.com/Unicorn/UNI-Construct/commit/7dba0c517) (`chore(release): scaffald-app v1.3.0`)
- Audit + safeguards branch: `clay/supabase-drift-audit-and-safeguards`, local commit `d928eba4c` (push pending — model classifier blocked)
- [SC-37](https://linear.app/scaffald/issue/SC-37) — impacted by missing application_activity table
- [SC-38](https://linear.app/scaffald/issue/SC-38) — already resolved (326 applied)
