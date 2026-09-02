-- Move logs.user_feedback into core, so /v1/feedback can reach it at all.
--
-- Two independent things made every feedback endpoint fail, whatever client
-- called it (#665):
--
--   1. PostgREST does not serve the `logs` schema. config.toml exposes
--      auth, public, core, storage, data, onet, engagement and community.
--   2. The table granted only `postgres` — no service_role, no authenticated —
--      the same class of gap as #481 and #654.
--
-- Moving is the smaller of the two fixes offered in #665: it keeps the exposed
-- schema list stable across all three environments, and core is already the
-- convention for user-scoped data. `logs` held nothing else.
--
-- The table is empty, so this carries no data. ALTER TABLE ... SET SCHEMA
-- brings its indexes, constraints, RLS setting and policies along, and the
-- policies are already correct and role-scoped:
--
--   user_feedback_select_self         SELECT to authenticated  USING (user_id = auth.uid())
--   user_feedback_insert_self         INSERT to authenticated  WITH CHECK (user_id = auth.uid())
--   user_feedback_service_full_access ALL    to service_role
--
-- What was missing was never the policies; it was the grants underneath them.
-- A policy cannot widen access past a missing GRANT, which is why the table
-- was unreachable even for service_role.

alter table if exists logs.user_feedback set schema core;

-- The index names still said `logs`. Rename so they do not misdescribe where
-- the table lives.
alter index if exists core.idx_logs_user_feedback_user_id
  rename to idx_user_feedback_user_id;
alter index if exists core.idx_logs_user_feedback_type
  rename to idx_user_feedback_type;
alter index if exists core.idx_logs_user_feedback_created_at
  rename to idx_user_feedback_created_at;

grant select, insert on core.user_feedback to authenticated;
grant all on core.user_feedback to service_role;

-- `logs` is now empty. It is left in place rather than dropped: nothing else
-- references it, but dropping a schema is not the kind of thing to do as a
-- side effect of moving one table.
