-- 343_privacy_eeo_hiring_grants.sql
--
-- Migration 305 created seven tables with RLS enabled but WITHOUT any
-- table-level GRANTs. A missing GRANT fails before RLS is evaluated, so every
-- access — including service_role — returns "permission denied for table ...".
-- All seven have been unreachable since they were created:
--
--   core.privacy_data_requests      403
--   core.privacy_opt_outs           403
--   core.eeo_self_identification    403
--   core.eeo_reports                403
--   core.hiring_projects            403
--   core.hiring_project_roles       403
--   core.hiring_project_crew        403
--
-- Same class of bug as 332_api_keys_grants and 335_scheduling_grants, and the
-- third time it has shipped. Migration 305 contains zero GRANT statements.
--
-- Verified against the local database: all seven return 403 before this, and
-- the four the API needs return 200 after.

BEGIN;

-- service_role: the edge functions gate access in code.
GRANT ALL ON core.privacy_data_requests TO service_role;
GRANT ALL ON core.privacy_opt_outs TO service_role;
GRANT ALL ON core.eeo_self_identification TO service_role;
GRANT ALL ON core.eeo_reports TO service_role;
GRANT ALL ON core.hiring_projects TO service_role;
GRANT ALL ON core.hiring_project_roles TO service_role;
GRANT ALL ON core.hiring_project_crew TO service_role;

-- authenticated: the privileges 305's RLS policies already assume.
--
-- Note the deliberate asymmetry on EEO data. 305's policy on
-- eeo_self_identification is `auth.uid() = user_id` for both SELECT and
-- INSERT — an applicant may record and read their *own* protected-class data
-- and nobody else's. That is the correct privacy posture and this migration
-- does not widen it: employers must never read individual rows, only
-- aggregates computed server-side under service_role.
--
-- No UPDATE or DELETE for authenticated on eeo_self_identification: a
-- voluntary self-identification is an audit record, not an editable field.
GRANT SELECT, INSERT ON core.eeo_self_identification TO authenticated;

-- eeo_reports holds generated aggregate snapshots, scoped by organization.
-- Reads only; generation happens server-side.
GRANT SELECT ON core.eeo_reports TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.privacy_data_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.privacy_opt_outs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.hiring_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.hiring_project_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.hiring_project_crew TO authenticated;

COMMIT;
