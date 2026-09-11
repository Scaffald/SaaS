-- =========================================================
-- 355_construction_projects_service_role_grant.sql
--
-- core.construction_projects grants nothing to service_role in production, so
-- GET /v1/work-logs/public-feed answered:
--
--   permission denied for table construction_projects
--
-- The handler reads with the service client and joins the work log's project.
-- It had returned 401 to anonymous callers until #732, and that 401 was hiding
-- the grant gap — the request never reached the query. Local carries the grant
-- and production does not, so no amount of local testing would have found it.
--
-- Same defect as #481 and migration 352, which granted eight tables but not
-- this one. A sweep of production found 29 core tables service_role cannot
-- read; 352 covers eight and this covers the one that is actively breaking a
-- public page. The remaining twenty are filed rather than swept in here, so
-- each is a decision rather than a side effect of an incident fix.
-- =========================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.construction_projects TO service_role;

COMMIT;
