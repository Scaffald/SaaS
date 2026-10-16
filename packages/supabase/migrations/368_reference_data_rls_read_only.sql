-- =========================================================
-- 368_reference_data_rls_read_only.sql
--
-- 44 reference tables in `onet` and `data` have RLS disabled on every project
-- (#1151) — 44 of the `rls_disabled_in_public` ERRORs in Supabase's 17 Aug
-- 2026 email. They grant only SELECT to anon/authenticated (measured on prod,
-- dev and preview: zero client INSERT/UPDATE/DELETE grants), so today this is
-- read-only public data, which is intended: onboarding's occupation, trade and
-- certification pickers read it signed-out.
--
-- It still matters. One future GRANT INSERT makes a table writable by anyone,
-- and 44 ERRORs of noise is how the real ones (#1144) went unnoticed.
--
-- Each table gets RLS plus one permissive SELECT policy for anon and
-- authenticated. No write policy: writes stay with the service role, which
-- bypasses RLS. Behaviour is unchanged for every caller — the persona matrix
-- (rls-matrix-rest.test.ts) asserts the pickers still read.
--
-- Not covered: public.spatial_ref_sys (PostGIS-owned, accepted in the
-- security allow-list).
-- =========================================================

BEGIN;

DO $$
DECLARE
  t regclass;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'data.certifications',
    'data.masterformat',
    'data.trades',
    'data.universities',
    'onet.abilities',
    'onet.abilities_to_work_activities',
    'onet.abilities_to_work_context',
    'onet.alternate_titles',
    'onet.basic_interests_to_riasec',
    'onet.content_model_reference',
    'onet.dwa_reference',
    'onet.education_training_experience',
    'onet.emerging_tasks',
    'onet.ete_categories',
    'onet.interests',
    'onet.interests_illus_activities',
    'onet.interests_illus_occupations',
    'onet.iwa_reference',
    'onet.job_zone_reference',
    'onet.job_zones',
    'onet.knowledge',
    'onet.level_scale_anchors',
    'onet.occupation_data',
    'onet.occupation_level_metadata',
    'onet.related_occupations',
    'onet.riasec_keywords',
    'onet.sample_of_reported_titles',
    'onet.scales_reference',
    'onet.skills',
    'onet.skills_to_work_activities',
    'onet.skills_to_work_context',
    'onet.survey_booklet_locations',
    'onet.task_categories',
    'onet.task_ratings',
    'onet.task_statements',
    'onet.tasks_to_dwas',
    'onet.technology_skills',
    'onet.tools_used',
    'onet.unspsc_reference',
    'onet.work_activities',
    'onet.work_context',
    'onet.work_context_categories',
    'onet.work_styles',
    'onet.work_values'
  ]::regclass[]
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS reference_read_all ON %s', t);
    EXECUTE format(
      'CREATE POLICY reference_read_all ON %s FOR SELECT TO anon, authenticated USING (true)', t);
  END LOOP;
END
$$;

COMMIT;
