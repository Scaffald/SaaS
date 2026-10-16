-- =========================================================
-- 371_rls_initplan_wrap_auth_calls.sql
--
-- 348 policies call auth.uid() / auth.jwt() / auth.role() bare, so Postgres
-- evaluates the call once per row instead of once per statement — the
-- advisor's auth_rls_initplan WARN (297 on prod) (#1153). Wrapping it as
-- (SELECT auth.uid()) makes it an InitPlan: same value, computed once.
--
-- GENERATED from pg_policies on a fresh replay (all four databases carry the
-- same policies — security-fingerprint diff, 2026-10-16) by a single rewrite:
--
--   (?<!SELECT )auth\.(uid|jwt|role)\(\)  ->  (SELECT auth.\1())
--
-- ALTER POLICY changes only USING / WITH CHECK; name, command, roles and
-- permissive/restrictive are untouched. The PR proves the fingerprint diff
-- before/after is exactly this rewrite and nothing else.
-- =========================================================

BEGIN;


-- ---- community (21) ---------------------------------------------------
ALTER POLICY "bookmarks_delete" ON "community"."bookmarks"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "bookmarks_insert" ON "community"."bookmarks"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "bookmarks_select" ON "community"."bookmarks"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "comments_delete" ON "community"."comments"
  USING ((author_id = (SELECT auth.uid())));
ALTER POLICY "comments_insert" ON "community"."comments"
  WITH CHECK (((author_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM (community.posts p
     JOIN community.memberships m ON ((m.community_id = p.community_id)))
  WHERE ((p.id = comments.post_id) AND (m.user_id = (SELECT auth.uid())) AND (m.is_verified = true))))));
ALTER POLICY "comments_select" ON "community"."comments"
  USING (((deleted_at IS NULL) AND ((EXISTS ( SELECT 1
   FROM (community.posts p
     JOIN community.memberships m ON ((m.community_id = p.community_id)))
  WHERE ((p.id = comments.post_id) AND (m.user_id = (SELECT auth.uid()))))) OR (author_id = (SELECT auth.uid())))));
ALTER POLICY "comments_update" ON "community"."comments"
  USING ((author_id = (SELECT auth.uid())))
  WITH CHECK ((author_id = (SELECT auth.uid())));
ALTER POLICY "karma_gifts_select" ON "community"."karma_gifts"
  USING (((giver_id = (SELECT auth.uid())) OR (receiver_id = (SELECT auth.uid()))));
ALTER POLICY "memberships_delete" ON "community"."memberships"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "memberships_insert" ON "community"."memberships"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "ratings_insert" ON "community"."post_ratings"
  WITH CHECK (((rater_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM (community.posts p
     JOIN community.memberships m ON ((m.community_id = p.community_id)))
  WHERE ((p.id = post_ratings.post_id) AND (m.user_id = (SELECT auth.uid())) AND (m.is_verified = true))))));
ALTER POLICY "ratings_update" ON "community"."post_ratings"
  USING ((rater_id = (SELECT auth.uid())))
  WITH CHECK ((rater_id = (SELECT auth.uid())));
ALTER POLICY "posts_delete" ON "community"."posts"
  USING ((author_id = (SELECT auth.uid())));
ALTER POLICY "posts_insert" ON "community"."posts"
  WITH CHECK (((author_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM community.memberships m
  WHERE ((m.community_id = posts.community_id) AND (m.user_id = (SELECT auth.uid())) AND (m.is_verified = true))))));
ALTER POLICY "posts_select" ON "community"."posts"
  USING (((deleted_at IS NULL) AND ((status = 'published'::community.post_status) OR (EXISTS ( SELECT 1
   FROM community.memberships m
  WHERE ((m.community_id = posts.community_id) AND (m.user_id = (SELECT auth.uid()))))) OR (author_id = (SELECT auth.uid())))));
ALTER POLICY "posts_update" ON "community"."posts"
  USING ((author_id = (SELECT auth.uid())))
  WITH CHECK ((author_id = (SELECT auth.uid())));
ALTER POLICY "reputation_events_select" ON "community"."reputation_events"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "scores_self_init" ON "community"."scaffold_scores"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "upvotes_delete" ON "community"."upvotes"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "upvotes_insert" ON "community"."upvotes"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "upvotes_select" ON "community"."upvotes"
  USING ((user_id = (SELECT auth.uid())));

-- ---- core (273) --------------------------------------------------------
ALTER POLICY "account_deletions_insert" ON "core"."account_deletions"
  WITH CHECK ((((deletion_type = 'worker'::text) AND (deleted_user_id = (SELECT auth.uid()))) OR ((deletion_type = 'organization'::text) AND (deleted_organization_id IN ( SELECT role_assignments.scope_org_id
   FROM core.role_assignments
  WHERE (role_assignments.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "account_deletions_select" ON "core"."account_deletions"
  USING (((deleted_user_id = (SELECT auth.uid())) OR (deleted_organization_id IN ( SELECT role_assignments.scope_org_id
   FROM core.role_assignments
  WHERE (role_assignments.user_id = (SELECT auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "account_deletions_update" ON "core"."account_deletions"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))));
ALTER POLICY "addresses_insert" ON "core"."addresses"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE (ra.user_id = (SELECT auth.uid())))));
ALTER POLICY "addresses_update" ON "core"."addresses"
  USING ((EXISTS ( SELECT 1
   FROM (core.project_addresses pa
     JOIN core.projects p ON ((p.id = pa.project_id)))
  WHERE ((pa.address_id = addresses.id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.project_addresses pa
     JOIN core.projects p ON ((p.id = pa.project_id)))
  WHERE ((pa.address_id = addresses.id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "api_key_usage_select_own_org" ON "core"."api_key_usage"
  USING ((api_key_id IN ( SELECT api_keys.id
   FROM core.api_keys
  WHERE (api_keys.organization_id IN ( SELECT t.organization_id
           FROM (core.team_members tm
             JOIN core.teams t ON ((tm.team_id = t.id)))
          WHERE (tm.user_id = (SELECT auth.uid())))))));
ALTER POLICY "api_keys_delete_org_member" ON "core"."api_keys"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((tm.team_id = t.id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "api_keys_insert_org_member" ON "core"."api_keys"
  WITH CHECK ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((tm.team_id = t.id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "api_keys_select_own_org" ON "core"."api_keys"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((tm.team_id = t.id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "api_keys_update_org_member" ON "core"."api_keys"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((tm.team_id = t.id)))
  WHERE (tm.user_id = (SELECT auth.uid())))))
  WITH CHECK ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((tm.team_id = t.id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "Applicants can view activity for their own applications" ON "core"."application_activity"
  USING ((application_id IN ( SELECT applications.id
   FROM core.applications
  WHERE (applications.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users can insert activity for applications in their org" ON "core"."application_activity"
  WITH CHECK ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((t.id = tm.team_id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "Users can view activity for applications in their org" ON "core"."application_activity"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((t.id = tm.team_id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "app_inquiries_read" ON "core"."application_inquiries"
  USING ((EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_inquiries.application_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND (o.owner_user_id = (SELECT auth.uid()))))))))));
ALTER POLICY "app_inquiries_update" ON "core"."application_inquiries"
  USING ((EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_inquiries.application_id) AND ((a.user_id = (SELECT auth.uid())) OR (application_inquiries.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_inquiries.application_id) AND ((a.user_id = (SELECT auth.uid())) OR (application_inquiries.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "app_inquiries_write" ON "core"."application_inquiries"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_inquiries.application_id) AND ((a.user_id = (SELECT auth.uid())) OR ((EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND (o.owner_user_id = (SELECT auth.uid()))))) OR ((application_inquiries.created_by = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))))))));
ALTER POLICY "app_msgs_insert" ON "core"."application_messages"
  WITH CHECK (((author_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_messages.application_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND (o.owner_user_id = (SELECT auth.uid())))))))))));
ALTER POLICY "app_msgs_read" ON "core"."application_messages"
  USING ((EXISTS ( SELECT 1
   FROM core.applications a
  WHERE ((a.id = application_messages.application_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND (o.owner_user_id = (SELECT auth.uid()))))))))));
ALTER POLICY "apps_insert" ON "core"."applications"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "apps_read" ON "core"."applications"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.jobs j
     JOIN core.organizations o ON ((o.id = j.organization_id)))
  WHERE ((j.id = applications.job_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "apps_update" ON "core"."applications"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.jobs j
     JOIN core.organizations o ON ((o.id = j.organization_id)))
  WHERE ((j.id = applications.job_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.jobs j
     JOIN core.organizations o ON ((o.id = j.organization_id)))
  WHERE ((j.id = applications.job_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "assessment_sessions_delete_own" ON "core"."assessment_sessions"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "assessment_sessions_insert_own" ON "core"."assessment_sessions"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "assessment_sessions_select_own" ON "core"."assessment_sessions"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "assessment_sessions_update_own" ON "core"."assessment_sessions"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "background_check_access_select" ON "core"."background_check_access"
  USING (((EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_access.background_check_id) AND (bc.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = background_check_access.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'background_check_admin'::text, 'super_admin'::text])))))))));
ALTER POLICY "background_check_access_log_select" ON "core"."background_check_access_log"
  USING ((core.user_has_role((SELECT auth.uid()), 'office'::text) OR core.user_has_role((SELECT auth.uid()), 'background_check_admin'::text)));
ALTER POLICY "background_check_consent_insert_worker" ON "core"."background_check_consent"
  WITH CHECK ((worker_user_id = (SELECT auth.uid())));
ALTER POLICY "background_check_consent_select" ON "core"."background_check_consent"
  USING ((EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_consent.background_check_id) AND ((bc.user_id = (SELECT auth.uid())) OR (bc.requested_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = bc.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'background_check_admin'::text, 'super_admin'::text]))))))))))));
ALTER POLICY "background_check_disclosures_select" ON "core"."background_check_disclosures"
  USING ((EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_disclosures.background_check_id) AND ((bc.user_id = (SELECT auth.uid())) OR (bc.requested_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = bc.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'background_check_admin'::text, 'super_admin'::text]))))))))))));
ALTER POLICY "background_check_disputes_insert" ON "core"."background_check_disputes"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "background_check_disputes_insert_worker" ON "core"."background_check_disputes"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "background_check_disputes_select" ON "core"."background_check_disputes"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_disputes.background_check_id) AND ((bc.requested_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = bc.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'background_check_admin'::text, 'super_admin'::text])))))))))))));
ALTER POLICY "background_check_disputes_update_worker" ON "core"."background_check_disputes"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "background_check_documents_insert" ON "core"."background_check_documents"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_documents.background_check_id) AND ((bc.user_id = (SELECT auth.uid())) OR (bc.requested_by_user_id = (SELECT auth.uid())) OR core.user_has_role((SELECT auth.uid()), 'office'::text) OR core.user_has_role((SELECT auth.uid()), 'background_check_admin'::text))))));
ALTER POLICY "background_check_documents_select" ON "core"."background_check_documents"
  USING ((EXISTS ( SELECT 1
   FROM core.background_checks bc
  WHERE ((bc.id = background_check_documents.background_check_id) AND ((bc.user_id = (SELECT auth.uid())) OR (bc.requested_by_user_id = (SELECT auth.uid())) OR core.user_has_role((SELECT auth.uid()), 'office'::text) OR core.user_has_role((SELECT auth.uid()), 'background_check_admin'::text))))));
ALTER POLICY "background_checks_select_worker" ON "core"."background_checks"
  USING ((((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) = requested_by_user_id) OR core.user_has_role((SELECT auth.uid()), 'office'::text) OR core.user_has_role((SELECT auth.uid()), 'background_check_admin'::text)));
ALTER POLICY "calendar_connections_user" ON "core"."calendar_connections"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ccpa_export_downloads_insert" ON "core"."ccpa_export_downloads"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))));
ALTER POLICY "ccpa_export_downloads_select_own" ON "core"."ccpa_export_downloads"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "ccpa_export_downloads_update" ON "core"."ccpa_export_downloads"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "ccpa_oauth_app_registry_delete" ON "core"."ccpa_oauth_app_registry"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = 'super_admin'::text)))));
ALTER POLICY "ccpa_oauth_app_registry_insert" ON "core"."ccpa_oauth_app_registry"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = 'super_admin'::text)))));
ALTER POLICY "ccpa_oauth_app_registry_select" ON "core"."ccpa_oauth_app_registry"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))));
ALTER POLICY "ccpa_oauth_app_registry_update" ON "core"."ccpa_oauth_app_registry"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = 'super_admin'::text)))));
ALTER POLICY "ccpa_opt_outs_delete_own" ON "core"."ccpa_opt_outs"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "ccpa_opt_outs_insert_own" ON "core"."ccpa_opt_outs"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "ccpa_opt_outs_select_own" ON "core"."ccpa_opt_outs"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "ccpa_request_history_insert" ON "core"."ccpa_request_history"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))));
ALTER POLICY "ccpa_request_history_select" ON "core"."ccpa_request_history"
  USING (((EXISTS ( SELECT 1
   FROM core.ccpa_requests cr
  WHERE ((cr.id = ccpa_request_history.request_id) AND (cr.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "ccpa_requests_insert_own" ON "core"."ccpa_requests"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "ccpa_requests_select_own" ON "core"."ccpa_requests"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "ccpa_requests_update" ON "core"."ccpa_requests"
  USING ((((user_id = (SELECT auth.uid())) AND (status = 'pending'::core.ccpa_request_status)) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))))
  WITH CHECK ((((user_id = (SELECT auth.uid())) AND (status = 'cancelled'::core.ccpa_request_status)) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "circumvention_reports_insert" ON "core"."circumvention_reports"
  WITH CHECK ((reported_by_user_id = (SELECT auth.uid())));
ALTER POLICY "circumvention_reports_select" ON "core"."circumvention_reports"
  USING (((reported_by_user_id = (SELECT auth.uid())) OR (organization_id IN ( SELECT role_assignments.scope_org_id
   FROM core.role_assignments
  WHERE (role_assignments.user_id = (SELECT auth.uid())))) OR (worker_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "circumvention_reports_update" ON "core"."circumvention_reports"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text]))))));
ALTER POLICY "cloud_storage_tokens_delete_own" ON "core"."cloud_storage_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "cloud_storage_tokens_insert_own" ON "core"."cloud_storage_tokens"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "cloud_storage_tokens_select_own" ON "core"."cloud_storage_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "cloud_storage_tokens_update_own" ON "core"."cloud_storage_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "connections_delete" ON "core"."connections"
  USING (((requester_user_id = (SELECT auth.uid())) OR (addressee_user_id = (SELECT auth.uid()))));
ALTER POLICY "connections_read" ON "core"."connections"
  USING (((requester_user_id = (SELECT auth.uid())) OR (addressee_user_id = (SELECT auth.uid()))));
ALTER POLICY "connections_update" ON "core"."connections"
  USING (((requester_user_id = (SELECT auth.uid())) OR (addressee_user_id = (SELECT auth.uid()))))
  WITH CHECK (((requester_user_id = (SELECT auth.uid())) OR (addressee_user_id = (SELECT auth.uid()))));
ALTER POLICY "connections_write" ON "core"."connections"
  WITH CHECK ((requester_user_id = (SELECT auth.uid())));
ALTER POLICY "content_reports_insert_own" ON "core"."content_reports"
  WITH CHECK ((reporter_id = (SELECT auth.uid())));
ALTER POLICY "content_reports_select_own" ON "core"."content_reports"
  USING ((reporter_id = (SELECT auth.uid())));
ALTER POLICY "eeo_self_id_insert" ON "core"."eeo_self_identification"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "eeo_self_id_select" ON "core"."eeo_self_identification"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "follows_delete" ON "core"."follows"
  USING ((((follower_type = 'user'::text) AND (follower_id = (SELECT auth.uid()))) OR (follower_type <> 'user'::text)));
ALTER POLICY "follows_write" ON "core"."follows"
  WITH CHECK ((((follower_type = 'user'::text) AND (follower_id = (SELECT auth.uid()))) OR (follower_type <> 'user'::text)));
ALTER POLICY "generic_invitations_insert_own" ON "core"."generic_invitations"
  WITH CHECK ((inviter_id = (SELECT auth.uid())));
ALTER POLICY "generic_invitations_select_own" ON "core"."generic_invitations"
  USING (((inviter_id = (SELECT auth.uid())) OR (invitee_user_id = (SELECT auth.uid())) OR (invitee_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text)));
ALTER POLICY "generic_invitations_update_own" ON "core"."generic_invitations"
  USING (((inviter_id = (SELECT auth.uid())) OR (invitee_user_id = (SELECT auth.uid())) OR (invitee_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text)));
ALTER POLICY "hire_agreements_insert" ON "core"."hire_agreements"
  WITH CHECK ((core.is_org_member(organization_id) AND (agreed_by_user_id = (SELECT auth.uid()))));
ALTER POLICY "hire_agreements_select" ON "core"."hire_agreements"
  USING ((core.is_org_member(organization_id) OR (worker_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "hire_agreements_update" ON "core"."hire_agreements"
  USING ((core.is_org_member(organization_id) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))))
  WITH CHECK ((core.is_org_member(organization_id) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((ra.role_id = r.id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))));
ALTER POLICY "id_verifications_select_access" ON "core"."id_verifications"
  USING (((worker_user_id = (SELECT auth.uid())) OR (initiated_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = id_verifications.initiated_by_org_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))))));
ALTER POLICY "inquiry_audit_insert_only" ON "core"."inquiry_audit_log"
  WITH CHECK ((actor_id = (SELECT auth.uid())));
ALTER POLICY "inquiry_audit_select_authorized" ON "core"."inquiry_audit_log"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries i
     JOIN core.applications a ON ((i.application_id = a.id)))
  WHERE ((i.id = inquiry_audit_log.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.scope_org_id = o.id) AND (ra.user_id = (SELECT auth.uid()))))))))))))));
ALTER POLICY "inquiry_capability_responses_insert" ON "core"."inquiry_capability_responses"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_capability_responses.inquiry_id) AND (a.user_id = (SELECT auth.uid()))))));
ALTER POLICY "inquiry_capability_responses_read" ON "core"."inquiry_capability_responses"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_capability_responses.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "inquiry_capability_responses_update" ON "core"."inquiry_capability_responses"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_capability_responses.inquiry_id) AND (a.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_capability_responses.inquiry_id) AND (a.user_id = (SELECT auth.uid()))))));
ALTER POLICY "inquiry_comments_insert" ON "core"."inquiry_comments"
  WITH CHECK (((sender_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_comments.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))))))));
ALTER POLICY "inquiry_comments_read" ON "core"."inquiry_comments"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_comments.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (inquiry_comments.sender_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "inquiry_comments_update" ON "core"."inquiry_comments"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_comments.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (inquiry_comments.sender_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_comments.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (inquiry_comments.sender_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "inquiry_reminders_select" ON "core"."inquiry_reminders"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries ai
     JOIN core.applications a ON ((a.id = ai.application_id)))
  WHERE ((ai.id = inquiry_reminders.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id IN ( SELECT j.organization_id
                   FROM core.jobs j
                  WHERE (j.id = a.job_id)))))))))));
ALTER POLICY "inquiry_sections_insert" ON "core"."inquiry_sections"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_sections.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (iq.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "inquiry_sections_read" ON "core"."inquiry_sections"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_sections.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.jobs j
             JOIN core.organizations o ON ((o.id = j.organization_id)))
          WHERE ((j.id = a.job_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
                   FROM core.role_assignments ra
                  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))))))));
ALTER POLICY "inquiry_sections_update" ON "core"."inquiry_sections"
  USING ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_sections.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (inquiry_sections.accepted_by = (SELECT auth.uid())))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.application_inquiries iq
     JOIN core.applications a ON ((a.id = iq.application_id)))
  WHERE ((iq.id = inquiry_sections.inquiry_id) AND ((a.user_id = (SELECT auth.uid())) OR (inquiry_sections.accepted_by = (SELECT auth.uid())))))));
ALTER POLICY "inquiry_templates_delete" ON "core"."inquiry_templates"
  USING (((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = inquiry_templates.organization_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))));
ALTER POLICY "inquiry_templates_insert" ON "core"."inquiry_templates"
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = inquiry_templates.organization_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))));
ALTER POLICY "inquiry_templates_select" ON "core"."inquiry_templates"
  USING ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = inquiry_templates.organization_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id)))))))));
ALTER POLICY "inquiry_templates_update" ON "core"."inquiry_templates"
  USING (((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = inquiry_templates.organization_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = inquiry_templates.organization_id) AND ((o.owner_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = o.id))))))))));
ALTER POLICY "interview_availability_user" ON "core"."interview_availability"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "interview_bookings_insert" ON "core"."interview_bookings"
  WITH CHECK (((SELECT auth.uid()) = candidate_id));
ALTER POLICY "interview_bookings_select" ON "core"."interview_bookings"
  USING (((SELECT auth.uid()) = candidate_id));
ALTER POLICY "interview_slots_insert" ON "core"."interview_slots"
  WITH CHECK (((SELECT auth.uid()) = proposed_by));
ALTER POLICY "interview_slots_select" ON "core"."interview_slots"
  USING ((((SELECT auth.uid()) = proposed_by) OR ((SELECT auth.uid()) IN ( SELECT interview_bookings.candidate_id
   FROM core.interview_bookings
  WHERE (interview_bookings.slot_id = interview_bookings.id)))));
ALTER POLICY "invites_insert" ON "core"."invites"
  WITH CHECK ((issuer_user_id = (SELECT auth.uid())));
ALTER POLICY "invites_read" ON "core"."invites"
  USING ((issuer_user_id = (SELECT auth.uid())));
ALTER POLICY "invites_update" ON "core"."invites"
  USING ((issuer_user_id = (SELECT auth.uid())))
  WITH CHECK ((issuer_user_id = (SELECT auth.uid())));
ALTER POLICY "ipip_share_tokens_insert_own" ON "core"."ipip_share_tokens"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "ipip_share_tokens_select_own" ON "core"."ipip_share_tokens"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "ipip_share_tokens_update_own" ON "core"."ipip_share_tokens"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "job_certifications_manage" ON "core"."job_certifications"
  USING ((EXISTS ( SELECT 1
   FROM (core.jobs j
     JOIN core.organizations o ON ((o.id = j.organization_id)))
  WHERE ((j.id = job_certifications.job_id) AND (o.owner_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.jobs j
     JOIN core.organizations o ON ((o.id = j.organization_id)))
  WHERE ((j.id = job_certifications.job_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "job_match_scores_select" ON "core"."job_match_scores"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "job_team_assignments_read" ON "core"."job_team_assignments"
  USING ((core.has_team_permission(team_id, 'team.view'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = job_team_assignments.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "job_team_assignments_write" ON "core"."job_team_assignments"
  USING ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR core.has_team_permission(team_id, 'job.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = job_team_assignments.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR core.has_team_permission(team_id, 'job.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = job_team_assignments.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "jobs_insert" ON "core"."jobs"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = jobs.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "jobs_update" ON "core"."jobs"
  USING ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = jobs.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = jobs.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "message_templates_delete" ON "core"."message_templates"
  USING (((created_by = (SELECT auth.uid())) AND (is_default = false)));
ALTER POLICY "message_templates_insert" ON "core"."message_templates"
  WITH CHECK ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((t.id = tm.team_id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "message_templates_select" ON "core"."message_templates"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((t.id = tm.team_id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "message_templates_update" ON "core"."message_templates"
  USING ((organization_id IN ( SELECT t.organization_id
   FROM (core.team_members tm
     JOIN core.teams t ON ((t.id = tm.team_id)))
  WHERE (tm.user_id = (SELECT auth.uid())))));
ALTER POLICY "news_feeds_office_manage" ON "core"."news_feeds"
  USING (core.user_has_role((SELECT auth.uid()), 'office'::text))
  WITH CHECK (core.user_has_role((SELECT auth.uid()), 'office'::text));
ALTER POLICY "notification_deliveries_select_own" ON "core"."notification_deliveries"
  USING ((notification_id IN ( SELECT notifications.id
   FROM core.notifications
  WHERE (notifications.user_id = (SELECT auth.uid())))));
ALTER POLICY "notification_devices_user_all" ON "core"."notification_devices"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "notification_digest_queue_select_own" ON "core"."notification_digest_queue"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "notification_events_select_own" ON "core"."notification_events"
  USING ((notification_id IN ( SELECT notifications.id
   FROM core.notifications
  WHERE (notifications.user_id = (SELECT auth.uid())))));
ALTER POLICY "notification_preferences_user_all" ON "core"."notification_preferences"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "notifications_insert_own" ON "core"."notifications"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "notifications_select_own" ON "core"."notifications"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "notifications_update_own" ON "core"."notifications"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "oauth_app_audit_log_select_admin" ON "core"."oauth_app_audit_log"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'office'::text])))))));
ALTER POLICY "oauth_apps_delete_admin" ON "core"."oauth_apps"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = 'super_admin'::text)))));
ALTER POLICY "oauth_apps_insert_admin" ON "core"."oauth_apps"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
ALTER POLICY "oauth_apps_select_admin" ON "core"."oauth_apps"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'office'::text]))))));
ALTER POLICY "oauth_apps_update_admin" ON "core"."oauth_apps"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));
ALTER POLICY "oauth_tokens_delete_own" ON "core"."oauth_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "oauth_tokens_select_own" ON "core"."oauth_tokens"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "oauth_user_consents_delete_own" ON "core"."oauth_user_consents"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "oauth_user_consents_select_own" ON "core"."oauth_user_consents"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "organization_document_shares_insert" ON "core"."organization_document_shares"
  WITH CHECK ((core.is_org_member(organization_id) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "organization_document_versions_insert" ON "core"."organization_document_versions"
  WITH CHECK ((core.is_org_member(organization_id) AND (uploaded_by = (SELECT auth.uid()))));
ALTER POLICY "organization_documents_insert" ON "core"."organization_documents"
  WITH CHECK ((core.is_org_member(organization_id) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "organization_folders_insert" ON "core"."organization_folders"
  WITH CHECK ((core.is_org_member(organization_id) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "organization_locations_insert" ON "core"."organization_locations"
  WITH CHECK ((core.is_org_member(organization_id) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "organization_payment_methods_insert" ON "core"."organization_payment_methods"
  WITH CHECK ((core.is_org_member(organization_id) AND (created_by = (SELECT auth.uid()))));
ALTER POLICY "organization_requests_insert_own" ON "core"."organization_requests"
  WITH CHECK ((created_by_user_id = (SELECT auth.uid())));
ALTER POLICY "organization_requests_select_own" ON "core"."organization_requests"
  USING ((created_by_user_id = (SELECT auth.uid())));
ALTER POLICY "orgs_insert" ON "core"."organizations"
  WITH CHECK (((SELECT auth.uid()) = owner_user_id));
ALTER POLICY "orgs_update" ON "core"."organizations"
  USING (((SELECT auth.uid()) = owner_user_id))
  WITH CHECK (((SELECT auth.uid()) = owner_user_id));
ALTER POLICY "payment_transactions_select_access" ON "core"."payment_transactions"
  USING ((((SELECT auth.uid()) = user_id) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = payment_transactions.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))))));
ALTER POLICY "personality_assessments_delete_own" ON "core"."personality_assessments"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "personality_assessments_insert_own" ON "core"."personality_assessments"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "personality_assessments_select_own" ON "core"."personality_assessments"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "personality_assessments_update_own" ON "core"."personality_assessments"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "portfolio_items_delete_own" ON "core"."portfolio_items"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "portfolio_items_insert_own" ON "core"."portfolio_items"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "portfolio_items_select_own" ON "core"."portfolio_items"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "portfolio_items_update_own" ON "core"."portfolio_items"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "preferences_own_all" ON "core"."preferences"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "privacy_requests_insert" ON "core"."privacy_data_requests"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "privacy_requests_select" ON "core"."privacy_data_requests"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "privacy_opt_outs_select" ON "core"."privacy_opt_outs"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "privacy_opt_outs_upsert" ON "core"."privacy_opt_outs"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_own_insert" ON "core"."profile"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_own_select" ON "core"."profile"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_own_update" ON "core"."profile"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_import_data_own_delete" ON "core"."profile_import_data"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_import_data_own_insert" ON "core"."profile_import_data"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "profile_import_data_own_select" ON "core"."profile_import_data"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "project_addresses_delete" ON "core"."project_addresses"
  USING ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_addresses.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_addresses_insert" ON "core"."project_addresses"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_addresses.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_addresses_update" ON "core"."project_addresses"
  USING ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_addresses.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_addresses.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_sites_delete" ON "core"."project_sites"
  USING ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_sites.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_sites_insert" ON "core"."project_sites"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_sites.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_sites_update" ON "core"."project_sites"
  USING ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_sites.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_sites.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "project_workers_insert" ON "core"."project_workers"
  WITH CHECK ((((user_id = (SELECT auth.uid())) AND (claimed_by_worker = true) AND (status = 'pending'::core.project_worker_status)) OR ((assigned_by_manager = true) AND (EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_workers.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'project_manager'::text])) AND ((r.scope = 'platform'::text) OR (ra.scope_org_id = p.organization_id))))))))))))));
ALTER POLICY "project_workers_select" ON "core"."project_workers"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_workers.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text))))))))))));
ALTER POLICY "project_workers_update" ON "core"."project_workers"
  USING ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_workers.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'project_manager'::text])) AND ((r.scope = 'platform'::text) OR (ra.scope_org_id = p.organization_id))))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.projects p
  WHERE ((p.id = project_workers.project_id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text, 'project_manager'::text])) AND ((r.scope = 'platform'::text) OR (ra.scope_org_id = p.organization_id))))))))))));
ALTER POLICY "projects_insert" ON "core"."projects"
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = projects.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text))))))));
ALTER POLICY "projects_select_visibility" ON "core"."projects"
  USING (
CASE
    WHEN (location_visibility = 'public'::core.location_visibility) THEN true
    WHEN (location_visibility = 'authenticated'::core.location_visibility) THEN ((SELECT auth.uid()) IS NOT NULL)
    WHEN (location_visibility = 'organization_only'::core.location_visibility) THEN (EXISTS ( SELECT 1
       FROM (core.role_assignments ra
         JOIN core.roles r ON ((r.id = ra.role_id)))
      WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = projects.organization_id))))
    WHEN (location_visibility = 'private'::core.location_visibility) THEN ((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
       FROM (core.role_assignments ra
         JOIN core.roles r ON ((r.id = ra.role_id)))
      WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = projects.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))
    ELSE false
END);
ALTER POLICY "projects_update" ON "core"."projects"
  USING (((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = projects.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text))))))))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = projects.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text))))))));
ALTER POLICY "punchlists_delete_creator_or_admin" ON "core"."punchlists"
  USING (((created_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = punchlists.organization_id) AND (r.scope = 'organization'::text) AND (r.name = 'admin'::text))))));
ALTER POLICY "punchlists_insert_org_member" ON "core"."punchlists"
  WITH CHECK (((created_by_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = punchlists.organization_id))))));
ALTER POLICY "punchlists_select_org_member" ON "core"."punchlists"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = punchlists.organization_id)))));
ALTER POLICY "punchlists_update_org_member" ON "core"."punchlists"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = punchlists.organization_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = punchlists.organization_id)))));
ALTER POLICY "Users can manage their own resume uploads" ON "core"."resume_uploads"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users can manage their own resume wizard state" ON "core"."resume_wizard_state"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "ra_insert" ON "core"."review_aspects"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_aspects.review_id) AND (r.author_user_id = (SELECT auth.uid()))))));
ALTER POLICY "review_category_ratings_write" ON "core"."review_category_ratings"
  USING ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_category_ratings.review_id) AND (r.author_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_category_ratings.review_id) AND (r.author_user_id = (SELECT auth.uid()))))));
ALTER POLICY "review_links_owner_delete" ON "core"."review_links"
  USING ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_links_owner_insert" ON "core"."review_links"
  WITH CHECK ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_links_owner_select" ON "core"."review_links"
  USING ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_links_owner_update" ON "core"."review_links"
  USING ((subject_user_id = (SELECT auth.uid())))
  WITH CHECK ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_pins_owner_delete" ON "core"."review_pins"
  USING ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_pins_owner_insert" ON "core"."review_pins"
  WITH CHECK ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "review_pins_owner_update" ON "core"."review_pins"
  USING ((subject_user_id = (SELECT auth.uid())))
  WITH CHECK ((subject_user_id = (SELECT auth.uid())));
ALTER POLICY "rsr_delete" ON "core"."review_skill_ratings"
  USING ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_skill_ratings.review_id) AND (r.author_user_id = (SELECT auth.uid()))))));
ALTER POLICY "rsr_insert" ON "core"."review_skill_ratings"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_skill_ratings.review_id) AND (r.author_user_id = (SELECT auth.uid()))))));
ALTER POLICY "review_soft_skill_votes_write" ON "core"."review_soft_skill_votes"
  USING ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_soft_skill_votes.review_id) AND (r.author_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.reviews r
  WHERE ((r.id = review_soft_skill_votes.review_id) AND (r.author_user_id = (SELECT auth.uid()))))));
ALTER POLICY "reviews_delete" ON "core"."reviews"
  USING ((author_user_id = (SELECT auth.uid())));
ALTER POLICY "reviews_insert" ON "core"."reviews"
  WITH CHECK ((author_user_id = (SELECT auth.uid())));
ALTER POLICY "reviews_update" ON "core"."reviews"
  USING ((author_user_id = (SELECT auth.uid())))
  WITH CHECK ((author_user_id = (SELECT auth.uid())));
ALTER POLICY "role_assignments_own_read" ON "core"."role_assignments"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "scheduling_links_insert" ON "core"."scheduling_links"
  WITH CHECK (((SELECT auth.uid()) = created_by));
ALTER POLICY "scheduling_links_select" ON "core"."scheduling_links"
  USING (((SELECT auth.uid()) = created_by));
ALTER POLICY "sites_insert" ON "core"."sites"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE (ra.user_id = (SELECT auth.uid())))));
ALTER POLICY "sites_update" ON "core"."sites"
  USING ((EXISTS ( SELECT 1
   FROM (core.project_sites ps
     JOIN core.projects p ON ((p.id = ps.project_id)))
  WHERE ((ps.site_id = sites.id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.project_sites ps
     JOIN core.projects p ON ((p.id = ps.project_id)))
  WHERE ((ps.site_id = sites.id) AND ((p.created_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
           FROM (core.role_assignments ra
             JOIN core.roles r ON ((r.id = ra.role_id)))
          WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = p.organization_id) OR ((r.name = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND (r.scope = 'platform'::text)))))))))));
ALTER POLICY "skill_evidence_delete" ON "core"."skill_evidence"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "skill_evidence_insert" ON "core"."skill_evidence"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "skill_evidence_select" ON "core"."skill_evidence"
  USING ((((SELECT auth.uid()) = user_id) OR COALESCE(( SELECT ((prefs.profile_visibility ->> 'skills'::text))::boolean AS bool
   FROM core.preferences prefs
  WHERE (prefs.user_id = skill_evidence.user_id)), true)));
ALTER POLICY "skill_evidence_update" ON "core"."skill_evidence"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "skill_snapshots_insert" ON "core"."skill_snapshots"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "skill_snapshots_select" ON "core"."skill_snapshots"
  USING ((((SELECT auth.uid()) = user_id) OR COALESCE(( SELECT ((prefs.profile_visibility ->> 'skills'::text))::boolean AS bool
   FROM core.preferences prefs
  WHERE (prefs.user_id = skill_snapshots.user_id)), true)));
ALTER POLICY "slug_change_history_owner_insert" ON "core"."slug_change_history"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "slug_change_history_owner_select" ON "core"."slug_change_history"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "soft_skills_ratings_insert_own" ON "core"."soft_skills_ratings"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "soft_skills_ratings_select" ON "core"."soft_skills_ratings"
  USING ((((SELECT auth.uid()) = user_id) OR COALESCE(( SELECT ((prefs.profile_visibility ->> 'skills'::text))::boolean AS bool
   FROM core.preferences prefs
  WHERE (prefs.user_id = soft_skills_ratings.user_id)), true)));
ALTER POLICY "success_fees_select_access" ON "core"."success_fees"
  USING ((((SELECT auth.uid()) = worker_user_id) OR (EXISTS ( SELECT 1
   FROM core.organizations org
  WHERE ((org.id = success_fees.organization_id) AND (org.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND ((ra.scope_org_id = success_fees.organization_id) OR ((r.scope = 'platform'::text) AND (r.name = ANY (ARRAY['office'::text, 'super_admin'::text])))))))));
ALTER POLICY "tasks_delete_creator_or_admin" ON "core"."tasks"
  USING (((created_by_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = tasks.organization_id) AND (r.scope = 'organization'::text) AND (r.name = 'admin'::text))))));
ALTER POLICY "tasks_insert_org_member" ON "core"."tasks"
  WITH CHECK (((created_by_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = tasks.organization_id))))));
ALTER POLICY "tasks_select_org_member" ON "core"."tasks"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = tasks.organization_id)))));
ALTER POLICY "tasks_update_org_member" ON "core"."tasks"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = tasks.organization_id)))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = tasks.organization_id)))));
ALTER POLICY "team_activity_events_mutate" ON "core"."team_activity_events"
  USING ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_activity_events.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_activity_events.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_activity_events_select" ON "core"."team_activity_events"
  USING ((core.has_team_permission(team_id, 'team.view'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_activity_events.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_daily_metrics_modify" ON "core"."team_daily_metrics"
  USING ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_daily_metrics.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_daily_metrics.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_daily_metrics_select" ON "core"."team_daily_metrics"
  USING ((core.has_team_permission(team_id, 'analytics.view'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_daily_metrics.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_invitations_delete" ON "core"."team_invitations"
  USING (((inviter_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_invitations.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_invitations_insert" ON "core"."team_invitations"
  WITH CHECK (((inviter_user_id = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_invitations.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_invitations_read" ON "core"."team_invitations"
  USING (((inviter_user_id = (SELECT auth.uid())) OR (invitee_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_invitations.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_invitations_select" ON "core"."team_invitations"
  USING ((core.has_team_permission(team_id, 'team.invite'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (invited_by = (SELECT auth.uid())) OR (invited_user_id = (SELECT auth.uid())) OR (responded_by = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_invitations.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_invitations_update" ON "core"."team_invitations"
  USING (((inviter_user_id = (SELECT auth.uid())) OR (invitee_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_invitations.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((inviter_user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_invitations.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_member_workloads_modify" ON "core"."team_member_workloads"
  USING ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_member_workloads.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_member_workloads.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_member_workloads_select" ON "core"."team_member_workloads"
  USING ((core.has_team_permission(team_id, 'analytics.view'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (team_member_id IN ( SELECT tm.id
   FROM core.team_members tm
  WHERE ((tm.id = team_member_workloads.team_member_id) AND (tm.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_member_workloads.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_members_delete" ON "core"."team_members"
  USING (((user_id = (SELECT auth.uid())) OR core.has_team_permission(team_id, 'team.remove_member'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_members.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_members_insert" ON "core"."team_members"
  WITH CHECK (((user_id = (SELECT auth.uid())) OR core.has_team_permission(team_id, 'team.invite'::core.team_permission) OR core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_members.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_members_read" ON "core"."team_members"
  USING ((core.has_team_permission(team_id, 'team.view'::core.team_permission) OR (user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_members.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_members_update" ON "core"."team_members"
  USING ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_members.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK ((core.has_team_permission(team_id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM (core.teams t
     JOIN core.organizations o ON ((o.id = t.organization_id)))
  WHERE ((t.id = team_members.team_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "team_role_permissions_write" ON "core"."team_role_permissions"
  USING ((EXISTS ( SELECT 1
   FROM (core.team_roles tr
     JOIN core.organizations o ON ((o.id = tr.organization_id)))
  WHERE ((tr.id = team_role_permissions.role_id) AND (o.owner_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.team_roles tr
     JOIN core.organizations o ON ((o.id = tr.organization_id)))
  WHERE ((tr.id = team_role_permissions.role_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "team_roles_delete" ON "core"."team_roles"
  USING ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_roles.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "team_roles_insert" ON "core"."team_roles"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_roles.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "team_roles_update" ON "core"."team_roles"
  USING ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_roles.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = team_roles.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))));
ALTER POLICY "teams_insert" ON "core"."teams"
  WITH CHECK (((created_by = (SELECT auth.uid())) AND (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = teams.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "teams_update" ON "core"."teams"
  USING (((created_by = (SELECT auth.uid())) OR core.has_team_permission(id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = teams.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((created_by = (SELECT auth.uid())) OR core.has_team_permission(id, 'team.manage'::core.team_permission) OR (EXISTS ( SELECT 1
   FROM core.organizations o
  WHERE ((o.id = teams.organization_id) AND (o.owner_user_id = (SELECT auth.uid())))))));
ALTER POLICY "user_archetypes_insert_own" ON "core"."user_archetypes"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_archetypes_select_own" ON "core"."user_archetypes"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_assessment_xp_insert_own" ON "core"."user_assessment_xp"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_assessment_xp_select_own" ON "core"."user_assessment_xp"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_blocks_delete_own" ON "core"."user_blocks"
  USING ((blocker_id = (SELECT auth.uid())));
ALTER POLICY "user_blocks_insert_own" ON "core"."user_blocks"
  WITH CHECK ((blocker_id = (SELECT auth.uid())));
ALTER POLICY "user_blocks_select_own" ON "core"."user_blocks"
  USING ((blocker_id = (SELECT auth.uid())));
ALTER POLICY "user_certifications_own_delete" ON "core"."user_certifications"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_certifications_own_insert" ON "core"."user_certifications"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_certifications_own_select" ON "core"."user_certifications"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_certifications_own_update" ON "core"."user_certifications"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_education_own_delete" ON "core"."user_education"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_education_own_insert" ON "core"."user_education"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_education_own_select" ON "core"."user_education"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_education_own_update" ON "core"."user_education"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_experience_own_delete" ON "core"."user_experience"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_experience_own_insert" ON "core"."user_experience"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_experience_own_select" ON "core"."user_experience"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_experience_own_update" ON "core"."user_experience"
  USING (((SELECT auth.uid()) = user_id))
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_feedback_insert_self" ON "core"."user_feedback"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_feedback_select_self" ON "core"."user_feedback"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_relationships_insert_authenticated" ON "core"."user_relationships"
  WITH CHECK ((source_user_id = (SELECT auth.uid())));
ALTER POLICY "user_relationships_select_own" ON "core"."user_relationships"
  USING (((source_user_id = (SELECT auth.uid())) OR (target_user_id = (SELECT auth.uid()))));
ALTER POLICY "user_relationships_update_own" ON "core"."user_relationships"
  USING (((source_user_id = (SELECT auth.uid())) OR (target_user_id = (SELECT auth.uid()))));
ALTER POLICY "user_skills_delete" ON "core"."user_skills"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_skills_insert" ON "core"."user_skills"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_skills_select_public" ON "core"."user_skills"
  USING ((((SELECT auth.uid()) = user_id) OR COALESCE(( SELECT ((prefs.profile_visibility ->> 'skills'::text))::boolean AS bool
   FROM core.preferences prefs
  WHERE (prefs.user_id = prefs.user_id)), true)));
ALTER POLICY "user_skills_update" ON "core"."user_skills"
  USING (((SELECT auth.uid()) = user_id));
ALTER POLICY "user_storage_usage_select" ON "core"."user_storage_usage"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "user_storage_usage_update" ON "core"."user_storage_usage"
  USING ((user_id = (SELECT auth.uid())))
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "users_own_insert" ON "core"."users"
  WITH CHECK (((SELECT auth.uid()) = id));
ALTER POLICY "users_own_update" ON "core"."users"
  USING (((SELECT auth.uid()) = id))
  WITH CHECK (((SELECT auth.uid()) = id));
ALTER POLICY "work_log_tasks_modify_log_owner" ON "core"."work_log_tasks"
  USING ((EXISTS ( SELECT 1
   FROM core.work_logs wl
  WHERE ((wl.id = work_log_tasks.work_log_id) AND (wl.user_id = (SELECT auth.uid()))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM core.work_logs wl
  WHERE ((wl.id = work_log_tasks.work_log_id) AND (wl.user_id = (SELECT auth.uid()))))));
ALTER POLICY "work_log_tasks_select_authorized" ON "core"."work_log_tasks"
  USING ((EXISTS ( SELECT 1
   FROM (core.tasks t
     JOIN core.role_assignments ra ON (((ra.user_id = (SELECT auth.uid())) AND (ra.scope_org_id = t.organization_id))))
  WHERE (t.id = work_log_tasks.task_id))));
ALTER POLICY "work_logs_insert_self" ON "core"."work_logs"
  WITH CHECK (((SELECT auth.uid()) = user_id));
ALTER POLICY "work_logs_select_self" ON "core"."work_logs"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.work_log_collaborators c
  WHERE ((c.work_log_id = work_logs.id) AND (c.collaborator_user_id = (SELECT auth.uid())))))));
ALTER POLICY "work_logs_update_self" ON "core"."work_logs"
  USING (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.work_log_collaborators c
  WHERE ((c.work_log_id = work_logs.id) AND (c.collaborator_user_id = (SELECT auth.uid())))))))
  WITH CHECK (((user_id = (SELECT auth.uid())) OR (EXISTS ( SELECT 1
   FROM core.work_log_collaborators c
  WHERE ((c.work_log_id = work_logs.id) AND (c.collaborator_user_id = (SELECT auth.uid())))))));

-- ---- engagement (8) --------------------------------------------------
ALTER POLICY "activity_events_insert_authenticated" ON "engagement"."activity_events"
  WITH CHECK ((user_id = (SELECT auth.uid())));
ALTER POLICY "activity_events_select_own" ON "engagement"."activity_events"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "connection_analytics_select_own" ON "engagement"."connection_analytics"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "daily_engagement_rollups_select_own" ON "engagement"."daily_engagement_rollups"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "daily_visibility_rollups_select_own" ON "engagement"."daily_visibility_rollups"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "profile_views_insert_authenticated" ON "engagement"."profile_views"
  WITH CHECK (((viewer_user_id = (SELECT auth.uid())) OR (viewer_user_id IS NULL)));
ALTER POLICY "profile_views_select_own" ON "engagement"."profile_views"
  USING (((viewer_user_id = (SELECT auth.uid())) OR (viewed_user_id = (SELECT auth.uid()))));
ALTER POLICY "search_impressions_select_own" ON "engagement"."search_impressions"
  USING ((user_id = (SELECT auth.uid())));

-- ---- public (11) ------------------------------------------------------
ALTER POLICY "Users can view own audit logs" ON "public"."audit_log"
  USING (((user_id = (SELECT auth.uid())) AND ((category)::text <> ALL ((ARRAY['admin'::character varying, 'system'::character varying, 'security'::character varying])::text[])) AND ((severity)::text <> ALL ((ARRAY['critical'::character varying, 'high'::character varying])::text[]))));
ALTER POLICY "Users can manage own consent records" ON "public"."consent_records"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users can view own consent records" ON "public"."consent_records"
  USING ((user_id = (SELECT auth.uid())));
ALTER POLICY "Users can create privacy requests" ON "public"."privacy_requests"
  WITH CHECK (((user_id = (SELECT auth.uid())) OR ((requester_email)::text = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text)));
ALTER POLICY "Users can view own privacy requests" ON "public"."privacy_requests"
  USING (((user_id = (SELECT auth.uid())) OR ((requester_email)::text = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = (SELECT auth.uid()))))::text)));
ALTER POLICY "webhook_deliveries_select_policy" ON "public"."webhook_deliveries"
  USING ((EXISTS ( SELECT 1
   FROM (webhooks w
     JOIN core.role_assignments ra ON ((ra.scope_org_id = w.organization_id)))
  WHERE ((w.id = webhook_deliveries.webhook_id) AND (ra.user_id = (SELECT auth.uid()))))));
ALTER POLICY "webhook_events_select_policy" ON "public"."webhook_events"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.scope_org_id = webhook_events.organization_id) AND (ra.user_id = (SELECT auth.uid()))))));
ALTER POLICY "webhooks_delete_policy" ON "public"."webhooks"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.scope_org_id = webhooks.organization_id) AND (ra.user_id = (SELECT auth.uid()))))));
ALTER POLICY "webhooks_insert_policy" ON "public"."webhooks"
  WITH CHECK ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.scope_org_id = webhooks.organization_id) AND (ra.user_id = (SELECT auth.uid()))))));
ALTER POLICY "webhooks_select_policy" ON "public"."webhooks"
  USING ((EXISTS ( SELECT 1
   FROM core.role_assignments ra
  WHERE ((ra.scope_org_id = webhooks.organization_id) AND (ra.user_id = (SELECT auth.uid()))))));
ALTER POLICY "webhooks_update_policy" ON "public"."webhooks"
  USING ((EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.scope_org_id = webhooks.organization_id) AND (ra.user_id = (SELECT auth.uid()))))));

-- ---- storage (35) -----------------------------------------------------
ALTER POLICY "Admin delete access for cms-media" ON "storage"."objects"
  USING (((bucket_id = 'cms-media'::text) AND (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND ((r.name = 'office'::text) OR (r.name = 'super_admin'::text)))))));
ALTER POLICY "Admin update access for cms-media" ON "storage"."objects"
  USING (((bucket_id = 'cms-media'::text) AND (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND ((r.name = 'office'::text) OR (r.name = 'super_admin'::text)))))));
ALTER POLICY "Admin upload access for cms-media" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'cms-media'::text) AND (EXISTS ( SELECT 1
   FROM (core.role_assignments ra
     JOIN core.roles r ON ((r.id = ra.role_id)))
  WHERE ((ra.user_id = (SELECT auth.uid())) AND (r.scope = 'platform'::text) AND ((r.name = 'office'::text) OR (r.name = 'super_admin'::text)))))));
ALTER POLICY "Organization members can view attachments for their jobs" ON "storage"."objects"
  USING (((bucket_id = 'application-attachments'::text) AND (EXISTS ( SELECT 1
   FROM (core.applications a
     JOIN core.jobs j ON ((j.id = a.job_id)))
  WHERE (((EXISTS ( SELECT 1
           FROM core.organizations o
          WHERE ((o.id = j.organization_id) AND (o.owner_user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
           FROM core.role_assignments ra
          WHERE ((ra.scope_org_id = j.organization_id) AND (ra.user_id = (SELECT auth.uid()))))) OR (EXISTS ( SELECT 1
           FROM (core.team_members tm
             JOIN core.teams t ON ((t.id = tm.team_id)))
          WHERE ((t.organization_id = j.organization_id) AND (tm.user_id = (SELECT auth.uid())))))) AND ((a.id)::text = (storage.foldername(objects.name))[2]))))));
ALTER POLICY "Users can delete their own application attachments" ON "storage"."objects"
  USING (((bucket_id = 'application-attachments'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "Users can delete their own avatar" ON "storage"."objects"
  USING (((bucket_id = 'avatars'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can delete their own certification files" ON "storage"."objects"
  USING (((bucket_id = 'certifications'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can delete their own portfolio images" ON "storage"."objects"
  USING (((bucket_id = 'portfolio'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can delete their own resume" ON "storage"."objects"
  USING (((bucket_id = 'resumes'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can read their own resume" ON "storage"."objects"
  USING (((bucket_id = 'resumes'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can update their own application attachments" ON "storage"."objects"
  USING (((bucket_id = 'application-attachments'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "Users can update their own avatar" ON "storage"."objects"
  USING (((bucket_id = 'avatars'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can update their own certification files" ON "storage"."objects"
  USING (((bucket_id = 'certifications'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can update their own portfolio images" ON "storage"."objects"
  USING (((bucket_id = 'portfolio'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can update their own resume" ON "storage"."objects"
  USING (((bucket_id = 'resumes'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can upload their own application attachments" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'application-attachments'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "Users can upload their own avatar" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'avatars'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can upload their own certification files" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'certifications'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can upload their own portfolio images" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'portfolio'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can upload their own resume" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'resumes'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "Users can view their own application attachments" ON "storage"."objects"
  USING (((bucket_id = 'application-attachments'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "background_check_documents_delete_self" ON "storage"."objects"
  USING (((bucket_id = 'background-check-documents'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "background_check_documents_read_self" ON "storage"."objects"
  USING (((bucket_id = 'background-check-documents'::text) AND ((((SELECT auth.uid()))::text = (storage.foldername(name))[1]) OR core.user_has_role((SELECT auth.uid()), 'office'::text) OR core.user_has_role((SELECT auth.uid()), 'background_check_admin'::text))));
ALTER POLICY "background_check_documents_update_self" ON "storage"."objects"
  USING (((bucket_id = 'background-check-documents'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])))
  WITH CHECK (((bucket_id = 'background-check-documents'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "background_check_documents_write_self" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'background-check-documents'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "community_media_delete" ON "storage"."objects"
  USING (((bucket_id = 'community-media'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "community_media_insert" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'community-media'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "community_media_update" ON "storage"."objects"
  USING (((bucket_id = 'community-media'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "feedback_screenshots_insert" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'feedback-screenshots'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "feedback_screenshots_select" ON "storage"."objects"
  USING (((bucket_id = 'feedback-screenshots'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.uid()))::text)));
ALTER POLICY "work_log_exports_read_self" ON "storage"."objects"
  USING (((bucket_id = 'work-log-exports'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "work_log_photos_delete_self" ON "storage"."objects"
  USING (((bucket_id = 'work-log-photos'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "work_log_photos_read_self" ON "storage"."objects"
  USING (((bucket_id = 'work-log-photos'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "work_log_photos_update_self" ON "storage"."objects"
  USING (((bucket_id = 'work-log-photos'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])))
  WITH CHECK (((bucket_id = 'work-log-photos'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));
ALTER POLICY "work_log_photos_write_self" ON "storage"."objects"
  WITH CHECK (((bucket_id = 'work-log-photos'::text) AND (((SELECT auth.uid()))::text = (storage.foldername(name))[1])));

COMMIT;
