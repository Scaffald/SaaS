-- =========================================================
-- 367_reassert_306_310_324.sql
--
-- Three more migrations that are recorded on prod and dev but never ran
-- there — found by the security fingerprint (#1146) diffing each project's
-- catalog against a local replay, the day after the same defect was found
-- for 303 (#1144, fixed by 365):
--
--   306_security_invoker_views        (#171)  prod: 5 views still SECURITY DEFINER
--   310_tighten_permissive_rls_policies (#174) prod: `true` policies on
--                                       addresses, sites, inquiry_audit_log,
--                                       review_category_ratings,
--                                       review_soft_skill_votes,
--                                       engagement.activity_events,
--                                       engagement.profile_views,
--                                       public.privacy_requests
--   324_work_logs_rls_inline_access_check     prod only: work_logs SELECT/UPDATE
--                                       still delegate to can_access_work_log()
--
-- Dev was missing 306 and 310; preview and a local replay have all three.
-- All three were renumbered on 2026-03-13 (21a8dc12d, 40x -> 30x) and the
-- ledger was later backfilled with the new numbers without probing the
-- objects. Preview already runs exactly this state, so it is the canary for
-- behaviour.
--
-- Plus one dev-only hand grant the same check found: core.v_profile_completion_scores
-- (a SECURITY DEFINER view over every user's completion score) was readable
-- by anon and authenticated on dev only. Revoked here; a no-op elsewhere.
--
-- The bodies below are the original migrations verbatim. Each is idempotent
-- (ALTER VIEW ... SET, DROP POLICY IF EXISTS + CREATE POLICY), so on preview
-- and on a fresh replay this migration changes nothing.
-- =========================================================

BEGIN;

-- ---- 306_security_invoker_views.sql -----------------------------------------

ALTER VIEW core.v_id_verification_latest SET (security_invoker = on);
-- v_active_cron_jobs: leave as definer (reads cron.job)
ALTER VIEW core.v_team_daily_metrics_latest SET (security_invoker = on);
ALTER VIEW core.v_team_member_workloads_latest SET (security_invoker = on);
ALTER VIEW core.v_profile_search SET (security_invoker = on);
ALTER VIEW core.v_news_feed_health SET (security_invoker = on);

-- ---- 310_tighten_permissive_rls_policies.sql ----------------------------------

-- -----------------------------------------------------------------------------
-- core.addresses
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS addresses_insert ON core.addresses;
CREATE POLICY addresses_insert ON core.addresses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      WHERE ra.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS addresses_update ON core.addresses;
CREATE POLICY addresses_update ON core.addresses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.project_addresses pa
      JOIN core.projects p ON p.id = pa.project_id
      WHERE pa.address_id = core.addresses.id
        AND (
          p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id
                OR (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.project_addresses pa
      JOIN core.projects p ON p.id = pa.project_id
      WHERE pa.address_id = core.addresses.id
        AND (
          p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id
                OR (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- core.sites
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS sites_insert ON core.sites;
CREATE POLICY sites_insert ON core.sites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      WHERE ra.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS sites_update ON core.sites;
CREATE POLICY sites_update ON core.sites
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.project_sites ps
      JOIN core.projects p ON p.id = ps.project_id
      WHERE ps.site_id = core.sites.id
        AND (
          p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id
                OR (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.project_sites ps
      JOIN core.projects p ON p.id = ps.project_id
      WHERE ps.site_id = core.sites.id
        AND (
          p.created_by = auth.uid()
          OR EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id
                OR (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- core.inquiry_audit_log — only the actor can insert their own audit row
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS inquiry_audit_insert_only ON core.inquiry_audit_log;
CREATE POLICY inquiry_audit_insert_only ON core.inquiry_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- -----------------------------------------------------------------------------
-- core.review_category_ratings — only review author can write
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS review_category_ratings_write ON core.review_category_ratings;
CREATE POLICY review_category_ratings_write ON core.review_category_ratings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.reviews r
      WHERE r.id = review_id AND r.author_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.reviews r
      WHERE r.id = review_id AND r.author_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- core.review_soft_skill_votes — only review author can write
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS review_soft_skill_votes_write ON core.review_soft_skill_votes;
CREATE POLICY review_soft_skill_votes_write ON core.review_soft_skill_votes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.reviews r
      WHERE r.id = review_id AND r.author_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.reviews r
      WHERE r.id = review_id AND r.author_user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- engagement.activity_events — users can only insert their own events
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS activity_events_insert_authenticated ON engagement.activity_events;
CREATE POLICY activity_events_insert_authenticated
  ON engagement.activity_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- engagement.profile_views — viewer must be self or null (anonymous)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS profile_views_insert_authenticated ON engagement.profile_views;
CREATE POLICY profile_views_insert_authenticated
  ON engagement.profile_views
  FOR INSERT TO authenticated
  WITH CHECK (viewer_user_id = auth.uid() OR viewer_user_id IS NULL);

-- -----------------------------------------------------------------------------
-- public.privacy_requests — user can only create for themselves
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can create privacy requests" ON public.privacy_requests;
CREATE POLICY "Users can create privacy requests"
  ON public.privacy_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR requester_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ---- 324_work_logs_rls_inline_access_check.sql -------------------------------

DROP POLICY IF EXISTS work_logs_select_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_update_self ON core.work_logs;

CREATE POLICY work_logs_select_self
  ON core.work_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  );

CREATE POLICY work_logs_update_self
  ON core.work_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  );

-- ---- dev-only drift ------------------------------------------------------------
REVOKE ALL ON core.v_profile_completion_scores FROM anon, authenticated;

COMMIT;
