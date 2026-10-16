-- =========================================================
-- 372_index_unindexed_fks_drop_duplicate_indexes.sql
--
-- Supabase performance advisor on prod, 2026-10-16 (#1154):
--
--   duplicate_index (3 of 4; the forsured one goes with #1150)
--     core.api_keys          idx_api_keys_hash  = api_keys_key_hash_key (the UNIQUE constraint's index)
--     core.team_roles        team_roles_organization_idx = team_roles_organization_id_idx
--     engagement.profile_views idx_profile_views_viewed_user_30d = idx_profile_views_viewed_user_recent
--   Each dropped index is a plain index, not one backing a constraint; the
--   surviving twin has the same definition, so every plan that used one can
--   use the other.
--
--   unindexed_foreign_keys (35 of 36; forsured excluded)
--     A foreign key without an index on the referencing columns makes every
--     DELETE/UPDATE of the referenced row scan the referencing table. Columns
--     are taken from pg_constraint, not from the advisor's attnums.
--
-- Not CONCURRENTLY: migrations run in a transaction, and every table here is
-- small on all three projects. `unused_index` (653) is deliberately not acted
-- on — at current traffic "unused" is not evidence.
-- =========================================================

BEGIN;

DROP INDEX IF EXISTS core.idx_api_keys_hash;
DROP INDEX IF EXISTS core.team_roles_organization_idx;
DROP INDEX IF EXISTS engagement.idx_profile_views_viewed_user_30d;

CREATE INDEX IF NOT EXISTS idx_organizations_default_payment_method_id ON core.organizations (default_payment_method_id);  -- organizations_default_payment_method_fk
CREATE INDEX IF NOT EXISTS idx_education_training_experience_element_id_scale_id_category ON onet.education_training_experience (element_id,scale_id,category);  -- education_training_experience_element_id_scale_id_category_fkey
CREATE INDEX IF NOT EXISTS idx_task_ratings_scale_id_category ON onet.task_ratings (scale_id,category);  -- task_ratings_scale_id_category_fkey
CREATE INDEX IF NOT EXISTS idx_work_context_element_id_scale_id_category ON onet.work_context (element_id,scale_id,category);  -- work_context_element_id_scale_id_category_fkey
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_parent_token_id ON core.oauth_tokens (parent_token_id);  -- oauth_tokens_parent_token_id_fkey
CREATE INDEX IF NOT EXISTS idx_generic_invitations_inviter_organization_id ON core.generic_invitations (inviter_organization_id);  -- generic_invitations_inviter_organization_id_fkey
CREATE INDEX IF NOT EXISTS idx_generic_invitations_rule_id ON core.generic_invitations (rule_id);  -- generic_invitations_rule_id_fkey
CREATE INDEX IF NOT EXISTS idx_user_relationships_invitation_id ON core.user_relationships (invitation_id);  -- user_relationships_invitation_id_fkey
CREATE INDEX IF NOT EXISTS idx_user_relationships_source_organization_id ON core.user_relationships (source_organization_id);  -- user_relationships_source_organization_id_fkey
CREATE INDEX IF NOT EXISTS idx_user_relationships_target_organization_id ON core.user_relationships (target_organization_id);  -- user_relationships_target_organization_id_fkey
CREATE INDEX IF NOT EXISTS idx_api_keys_created_by ON core.api_keys (created_by);  -- api_keys_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_oauth_authorization_codes_user_id ON core.oauth_authorization_codes (user_id);  -- oauth_authorization_codes_user_id_fkey
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON webhooks (created_by);  -- webhooks_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_webhooks_updated_by ON webhooks (updated_by);  -- webhooks_updated_by_fkey
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON core.message_templates (created_by);  -- message_templates_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_privacy_data_requests_processed_by ON core.privacy_data_requests (processed_by);  -- privacy_data_requests_processed_by_fkey
CREATE INDEX IF NOT EXISTS idx_eeo_reports_generated_by ON core.eeo_reports (generated_by);  -- eeo_reports_generated_by_fkey
CREATE INDEX IF NOT EXISTS idx_hiring_projects_created_by ON core.hiring_projects (created_by);  -- hiring_projects_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_hiring_project_crew_assigned_by ON core.hiring_project_crew (assigned_by);  -- hiring_project_crew_assigned_by_fkey
CREATE INDEX IF NOT EXISTS idx_hiring_project_crew_role_id ON core.hiring_project_crew (role_id);  -- hiring_project_crew_role_id_fkey
CREATE INDEX IF NOT EXISTS idx_interview_slots_proposed_by ON core.interview_slots (proposed_by);  -- interview_slots_proposed_by_fkey
CREATE INDEX IF NOT EXISTS idx_scheduling_links_created_by ON core.scheduling_links (created_by);  -- scheduling_links_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_hris_connections_created_by ON core.hris_connections (created_by);  -- hris_connections_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_background_check_providers_created_by ON core.background_check_providers (created_by);  -- background_check_providers_created_by_fkey
CREATE INDEX IF NOT EXISTS idx_skill_evidence_verified_by ON core.skill_evidence (verified_by);  -- skill_evidence_verified_by_fkey
CREATE INDEX IF NOT EXISTS idx_communities_industry_id ON community.communities (industry_id);  -- communities_industry_id_fkey
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON community.comments (author_id);  -- comments_author_id_fkey
CREATE INDEX IF NOT EXISTS idx_post_ratings_rater_id ON community.post_ratings (rater_id);  -- post_ratings_rater_id_fkey
CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON community.bookmarks (post_id);  -- bookmarks_post_id_fkey
CREATE INDEX IF NOT EXISTS idx_search_impressions_searcher_id ON engagement.search_impressions (searcher_id);  -- search_impressions_searcher_id_fkey
CREATE INDEX IF NOT EXISTS idx_punchlists_created_by_user_id ON core.punchlists (created_by_user_id);  -- punchlists_created_by_user_id_fkey
CREATE INDEX IF NOT EXISTS idx_tasks_created_by_user_id ON core.tasks (created_by_user_id);  -- tasks_created_by_user_id_fkey
CREATE INDEX IF NOT EXISTS idx_review_pins_review_id ON core.review_pins (review_id);  -- review_pins_review_id_fkey
CREATE INDEX IF NOT EXISTS idx_content_reports_reviewed_by ON core.content_reports (reviewed_by);  -- content_reports_reviewed_by_fkey
CREATE INDEX IF NOT EXISTS idx_soft_skills_ratings_skill_id ON core.soft_skills_ratings (skill_id);  -- soft_skills_ratings_skill_id_fkey

COMMIT;
