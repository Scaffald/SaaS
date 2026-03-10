# Supabase advisor findings → GitHub issues

This file contains titles and bodies for 7 GitHub issues derived from Supabase Database Linter (security + performance) and Auth advisors. Use the sections below to create issues manually or via automation. Suggested labels are listed per issue.

**Created issues (Unicorn/UNI-Construct):**

| # | Issue | Link |
|---|-------|------|
| 1 | Enable RLS on notification tables and fix RLS-disabled exposed tables | [#170](https://github.com/Unicorn/UNI-Construct/issues/170) |
| 2 | Review and fix security definer views | [#171](https://github.com/Unicorn/UNI-Construct/issues/171) |
| 3 | Set explicit search_path on database functions | [#172](https://github.com/Unicorn/UNI-Construct/issues/172) |
| 4 | Move extensions out of public schema | [#173](https://github.com/Unicorn/UNI-Construct/issues/173) |
| 5 | Tighten permissive RLS policies (USING/WITH CHECK true) | [#174](https://github.com/Unicorn/UNI-Construct/issues/174) |
| 6 | Harden Auth: leaked password protection and MFA | [#175](https://github.com/Unicorn/UNI-Construct/issues/175) |
| 7 | Add indexes for unindexed foreign keys | [#176](https://github.com/Unicorn/UNI-Construct/issues/176) |

Epic: [Supabase advisor remediation](https://github.com/Unicorn/UNI-Construct/issues/177) (checklist of the above).

**Labels to use/create:** `supabase`, `database`, `security`, `performance`. Use `bug` for security issues and `enhancement` for performance where appropriate.

| Issue | Suggested labels |
|-------|------------------|
| 1 | supabase, database, security, bug |
| 2 | supabase, database, security, bug |
| 3 | supabase, database, security |
| 4 | supabase, database, security |
| 5 | supabase, database, security |
| 6 | supabase, auth, security |
| 7 | supabase, database, performance, enhancement |

If a label does not exist in the repo, create it in GitHub (Settings → Labels) or omit it when creating the issue.

---

## Issue 1: Enable RLS on notification tables and fix RLS-disabled exposed tables

**Labels:** `supabase`, `database`, `security`, `bug`

**Title:** Enable RLS on notification tables and fix RLS-disabled exposed tables

**Body:**

```markdown
## Summary

Supabase Database Linter reported that several tables have RLS policies defined but RLS is not enabled on the table (so policies have no effect), and many tables in schemas exposed to PostgREST have no RLS at all. One table exposes a sensitive column (`token`) without RLS. This can lead to unauthorized data access or data exposure.

## Risk

- Policies on notification tables are not enforced; table access is unrestricted.
- Exposed tables without RLS are readable/writable according to role grants.
- `core.notification_devices.token` may expose device push tokens.

## Affected objects

**Policy exists but RLS disabled (enable RLS and keep policies):**
- `core.notification_deliveries` (policies: notification_deliveries_select_own, notification_deliveries_service_all)
- `core.notification_devices` (policies: notification_devices_service_all, notification_devices_user_all)
- `core.notification_digest_queue` (policies: notification_digest_queue_select_own, notification_digest_queue_service_all)
- `core.notification_events` (policies: notification_events_select_own, notification_events_service_all)
- `core.notification_preferences` (policies: notification_preferences_service_all, notification_preferences_user_all)

**RLS disabled in public / exposed (add RLS and appropriate policies):**
- Core: `core.notification_deliveries`, `core.notification_events`, `core.notification_preferences`, `core.notification_devices`, `core.notification_digest_queue`
- ONET: `onet.task_ratings`, `onet.tasks_to_dwas`, `onet.occupation_level_metadata`, `onet.level_scale_anchors`, `onet.survey_booklet_locations`, `onet.iwa_reference`, `onet.dwa_reference`, `onet.work_activities`, `onet.work_styles`, `onet.work_values`, `onet.work_context`, `onet.task_statements`, `onet.alternate_titles`, `onet.sample_of_reported_titles`, `onet.related_occupations`, `onet.emerging_tasks`, `onet.content_model_reference`, `onet.scales_reference`, `onet.occupation_data`, `onet.ete_categories`, `onet.job_zone_reference`, `onet.job_zones`, `onet.abilities`, `onet.skills`, `onet.knowledge`, `onet.interests`, `onet.education_training_experience`, `onet.work_context_categories`, `onet.task_categories`, `onet.unspsc_reference`, `onet.tools_used`, `onet.technology_skills`, `onet.abilities_to_work_activities`, `onet.abilities_to_work_context`, `onet.skills_to_work_activities`, `onet.skills_to_work_context`, `onet.riasec_keywords`, `onet.basic_interests_to_riasec`, `onet.interests_illus_activities`, `onet.interests_illus_occupations`
- Data: `data.trades`, `data.masterformat`, `data.universities`, `data.certifications`
- Public: `public.spatial_ref_sys`

**Sensitive column exposed without RLS:**
- `core.notification_devices` — column `token` (e.g. push token) exposed via API without RLS.

## Remediation

1. For the five `core.notification_*` tables: run `ALTER TABLE core.<table> ENABLE ROW LEVEL SECURITY;` so existing policies take effect. See [Policy Exists RLS Disabled](https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled).
2. For all other exposed tables: enable RLS and add policies that match intended access (e.g. read-only for reference data, user-scoped for user data). See [RLS Disabled in Public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).
3. Ensure `core.notification_devices` is not exposed without RLS and that `token` is only accessible to authorized roles. See [Sensitive Columns Exposed](https://supabase.com/docs/guides/database/database-linter?lint=0023_sensitive_columns_exposed).

## References

- [Supabase Database Linter – RLS](https://supabase.com/docs/guides/database/database-linter?lint=0007_policy_exists_rls_disabled)
- [RLS Disabled in Public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- [Sensitive Columns Exposed](https://supabase.com/docs/guides/database/database-linter?lint=0023_sensitive_columns_exposed)
```

---

## Issue 2: Review and fix security definer views

**Labels:** `supabase`, `database`, `security`, `bug`

**Title:** Review and fix security definer views

**Body:**

```markdown
## Summary

Six views are defined with `SECURITY DEFINER`. They run with the view owner’s privileges and RLS context instead of the invoker’s, which can bypass row-level security and lead to privilege escalation or unintended data exposure.

## Affected objects

- `core.v_id_verification_latest`
- `public.v_active_cron_jobs`
- `core.v_team_daily_metrics_latest`
- `core.v_team_member_workloads_latest`
- `core.v_profile_search`
- `core.v_news_feed_health`

## Remediation

1. For each view, decide whether it must run as definer (e.g. for cross-schema access). If not, recreate the view with `SECURITY INVOKER` (default in newer Postgres).
2. If definer is required, ensure the view definition and underlying objects are locked down and that only intended callers can use it.
3. See [Security Definer View](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view).

## References

- [Supabase Database Linter – Security Definer View](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
```

---

## Issue 3: Set explicit search_path on database functions

**Labels:** `supabase`, `database`, `security`

**Title:** Set explicit search_path on database functions

**Body:**

```markdown
## Summary

The linter reported many functions that do not set an explicit `search_path`. Relying on the session’s search_path can make behavior depend on the caller and open the door to search_path-based attacks. Setting `search_path` on each function (e.g. to the function’s schema) fixes this.

## Affected objects (representative; run advisor for full list)

**core:** sync_primary_job_assignment, calculate_application_score, set_document_version_defaults, organizations_tsv_update, refresh_years_of_experience, anonymize_organization_payment_data, preview_auto_rejection, detect_trade_for_csi_skill, log_inquiry_capability_answered, update_personality_assessment_last_updated, refresh_all_team_metrics, jobs_tsv_update, get_org_id_from_path, enqueue_due_success_fees, set_updated_at, calculate_years_of_experience, ccpa_set_deadline, prevent_audit_log_modification (forsured), verify_audit_log_hash_chain (forsured), log_inquiry_section_accepted, handle_team_activity_event_refresh, is_org_member, log_inquiry_sent, trigger_calculate_application_score, extract_tiptap_plain_text, enqueue_duration_check_success_fees, get_or_create_account_credits, decrypt_background_check_results, refresh_document_latest_version, log_inquiry_comment, ccpa_record_history, refresh_team_daily_metrics, encrypt_background_check_results, log_inquiry_event, jitter_coordinate, anonymize_worker_payment_data, assign_user_skill_trade, handle_new_user, user_experience_refresh_years_trigger, jitter_coordinate_deterministic, get_current_verification, get_default_hire_agreement_text, generate_application_attachment_path, auto_reject_application, search_all_skills

**data:** search_masterformat, clean_certification_categories, verify_certification_hierarchy, get_masterformat_hierarchy, search_universities, normalize_certification_titles, cleanup_deprecated_certifications, merge_duplicate_certifications, identify_duplicate_certifications

**forsured:** update_app_settings_updated_at, get_setting, set_audit_log_hash, calculate_audit_hash

**onet:** search_occupations

**public:** generate_privacy_request_number, set_breach_notification_deadline, update_updated_at_column, log_consent_audit, calculate_next_attempt, set_privacy_request_due_date, log_breach_audit, log_privacy_request_audit, generate_breach_number

(Full list: run Supabase MCP `get_advisors` with `type: "security"` and filter by `function_search_path_mutable`.)

## Remediation

1. For each function, add a fixed `search_path` (e.g. `SET search_path = core` or the function’s schema) in the function definition.
2. Example: `CREATE OR REPLACE FUNCTION core.foo() RETURNS ... SET search_path = core AS $$ ... $$;`
3. See [Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

## References

- [Supabase Database Linter – Function Search Path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
```

---

## Issue 4: Move extensions out of public schema

**Labels:** `supabase`, `database`, `security`

**Title:** Move extensions out of public schema

**Body:**

```markdown
## Summary

Six extensions are installed in the `public` schema. Extensions in `public` are visible and can clutter the public namespace; moving them to a dedicated schema (e.g. `extensions`) is recommended.

## Affected objects

- `citext`
- `postgis`
- `pg_net`
- `uuid-ossp`
- `pgcrypto`
- `pg_trgm`

## Remediation

1. Create a schema for extensions if needed: `CREATE SCHEMA IF NOT EXISTS extensions;`
2. Move each extension: typically requires dropping and re-creating in the new schema, or using `ALTER EXTENSION ... SET SCHEMA extensions;` where supported. Check [Postgres extension docs](https://www.postgresql.org/docs/current/sql-alterextension.html) and Supabase migration practices.
3. See [Extension in Public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).

## References

- [Supabase Database Linter – Extension in Public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
```

---

## Issue 5: Tighten permissive RLS policies (USING/WITH CHECK true)

**Labels:** `supabase`, `database`, `security`

**Title:** Tighten permissive RLS policies (USING/WITH CHECK true)

**Body:**

```markdown
## Summary

Several tables have RLS policies that use `USING (true)` or `WITH CHECK (true)` for INSERT/UPDATE/DELETE/ALL. Such policies allow any authenticated (or unauthenticated) user to perform those operations, effectively bypassing row-level security for those commands.

## Affected objects

- `core.addresses` — policies `addresses_insert`, `addresses_update`
- `core.inquiry_audit_log` — policy `inquiry_audit_insert_only`
- `core.review_category_ratings` — policy `review_category_ratings_write`
- `core.review_soft_skill_votes` — policy `review_soft_skill_votes_write`
- `core.sites` — policies `sites_insert`, `sites_update`
- `engagement.activity_events` — policy `activity_events_insert_authenticated`
- `engagement.profile_views` — policy `profile_views_insert_authenticated`
- `forsured.audit_log` — policy `Allow authenticated users to insert audit logs`
- `public.privacy_requests` — policy `Users can create privacy requests`

## Remediation

1. For each policy, replace `true` with a condition that restricts rows (e.g. `auth.uid() = user_id`, org membership, or role check).
2. Ensure WITH CHECK and USING both reflect the intended access (e.g. users can only insert/update their own rows).
3. See [Permissive RLS Policy](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy).

## References

- [Supabase Database Linter – Permissive RLS Policy](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
```

---

## Issue 6: Harden Auth — leaked password protection and MFA

**Labels:** `supabase`, `auth`, `security`

**Title:** Harden Auth: leaked password protection and MFA

**Body:**

```markdown
## Summary

Supabase Auth advisors reported: (1) Leaked password protection is disabled — Supabase can check passwords against HaveIBeenPwned to block compromised passwords; (2) Too few MFA options are enabled, which weakens account security.

## Remediation

1. **Leaked password protection:** In Supabase Dashboard → Authentication → Settings (or Auth provider config), enable “Leaked password protection” / HaveIBeenPwned check. See [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
2. **MFA:** Enable additional MFA methods (e.g. TOTP, phone) in Dashboard → Authentication → MFA / Providers. See [Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa).

## References

- [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [Auth MFA](https://supabase.com/docs/guides/auth/auth-mfa)
```

---

## Issue 7: Add indexes for unindexed foreign keys

**Labels:** `supabase`, `database`, `performance`, `enhancement`

**Title:** Add indexes for unindexed foreign keys

**Body:**

```markdown
## Summary

The Supabase performance advisor reported foreign key constraints that do not have a covering index. This can cause slow joins and cascades. Adding indexes on the FK columns improves performance.

## Affected objects

Run the performance advisor for the full list: Supabase MCP `get_advisors` with `type: "performance"`, filter by `unindexed_foreign_keys`.

**Example from current run:**
- `core.account_deletions` — foreign key `account_deletions_requested_by_user_id_fkey` without a covering index.

(Many more tables are reported; use the advisor output to generate a complete list per migration.)

## Remediation

1. For each reported table and FK column(s), add an index, e.g. `CREATE INDEX CONCURRENTLY idx_<table>_<fk_column> ON <schema>.<table> (<fk_column>);`
2. Prefer `CONCURRENTLY` in production to avoid long locks.
3. See [Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys).

## References

- [Supabase Database Linter – Unindexed foreign keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
```

---

## Optional: Parent epic issue

**Created:** [#177](https://github.com/Unicorn/UNI-Construct/issues/177) — [Epic] Supabase advisor remediation

**Title:** [Epic] Supabase advisor remediation

**Body:**

Track progress on Supabase Database Linter and Auth advisor findings. Each item links to a dedicated issue.

- [x] #170 — Enable RLS on notification tables and fix RLS-disabled exposed tables
- [x] #171 — Review and fix security definer views
- [x] #172 — Set explicit search_path on database functions
- [x] #173 — Move extensions out of public schema
- [x] #174 — Tighten permissive RLS policies (USING/WITH CHECK true)
- [ ] #175 — Harden Auth: leaked password protection and MFA
- [ ] #176 — Add indexes for unindexed foreign keys

Full issue text: see [.github/supabase-advisor-issues.md](.github/supabase-advisor-issues.md).

**Labels:** `supabase`, `database`, `security`, `performance`

---

## Creating issues via GitHub

- **Manual:** Copy each **Title** and **Body** (the markdown inside the code fence) into a new GitHub issue. Apply the **Labels** listed.
- **MCP:** Use `issue_write` with `method: "create"`, `owner`, `repo`, `title`, `body`, and `labels` for each of the 7 issues (and optionally the epic). Replace `#_` in the epic body with the actual issue numbers after creation.
