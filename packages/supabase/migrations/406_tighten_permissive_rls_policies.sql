-- =============================================================================
-- 406_tighten_permissive_rls_policies.sql
--
-- Replaces USING (true) / WITH CHECK (true) with proper conditions (Supabase
-- advisor #174). forsured.audit_log is skipped (forsured schema was dropped
-- in migration 400).
-- =============================================================================

BEGIN;

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

COMMIT;
