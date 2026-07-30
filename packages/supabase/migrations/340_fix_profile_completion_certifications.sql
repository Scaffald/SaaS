-- =========================================================
-- 340_fix_profile_completion_certifications.sql
--
-- core.v_profile_completion_scores could never award its certification points.
--
-- The view scored certifications by joining core.user_certifications to
-- core.certifications. But user_certifications.certification_id has a foreign
-- key to data.certifications, not core.certifications — different table, same
-- name, different schema. core.certifications is empty and unused, so the join
-- matched nothing and the 15-point component scored 0 for every user who has
-- ever existed. Profile completion was silently capped at 85%.
--
-- Measured on a freshly seeded database before this change:
--   join via core.certifications -> 0 rows
--   join via data.certifications -> 4 rows
--
-- Found while seeding realistic worker profiles (#389): a worker with three
-- verified certifications could not be made to score above 85, which is what
-- prompted reading the view rather than adding more fixture data.
--
-- The fix drops the join entirely. core.user_certifications already carries
-- `name` and `issuing_organization` on the row itself, which is what the view
-- was reaching for — and it is what the API writes, so it is populated whether
-- or not the certification came from a reference catalog. Not joining also
-- removes the chance of pointing at the wrong table again.
-- =========================================================

BEGIN;

CREATE OR REPLACE VIEW core.v_profile_completion_scores AS
SELECT
  p.user_id,
  -- Identity: 20
  CASE
    WHEN COALESCE(p.first_name, '') <> ''
     AND COALESCE(p.last_name, '') <> ''
     AND COALESCE(u.headline, '') <> '' THEN 20
    ELSE 0
  END
  -- Skills: 20
  + CASE
      WHEN (SELECT count(*) FROM core.user_skills us WHERE us.user_id = p.user_id) >= 3 THEN 20
      ELSE 0
    END
  -- Experience: 20
  + CASE
      WHEN EXISTS (
        SELECT 1 FROM core.user_experience ue
        WHERE ue.user_id = p.user_id
          AND COALESCE(ue.job_title, '') <> ''
          AND COALESCE(ue.company_name, '') <> ''
      ) THEN 20
      ELSE 0
    END
  -- Certifications: 15. Read from the row itself; see the header for why the
  -- previous join could never match.
  + CASE
      WHEN EXISTS (
        SELECT 1 FROM core.user_certifications uc
        WHERE uc.user_id = p.user_id
          AND COALESCE(uc.name, '') <> ''
          AND COALESCE(uc.issuing_organization, '') <> ''
      ) THEN 15
      ELSE 0
    END
  -- Location: 15
  + CASE
      WHEN (p.address IS NOT NULL AND p.address <> '{}'::jsonb)
        OR COALESCE(array_length(p.preferred_work_locations, 1), 0) > 0 THEN 15
      ELSE 0
    END
  -- Education: 10
  + CASE
      WHEN COALESCE(p.education_level, '') <> ''
        OR EXISTS (SELECT 1 FROM core.user_education ed WHERE ed.user_id = p.user_id) THEN 10
      ELSE 0
    END
  AS completion_score
FROM core.profile p
JOIN core.users u ON u.id = p.user_id;

COMMENT ON VIEW core.v_profile_completion_scores IS
  'Profile completion out of 100: identity 20, skills 20, experience 20, certifications 15, location 15, education 10. The certification component reads core.user_certifications.name/issuing_organization directly — it previously joined core.certifications, which is empty and is NOT the table certification_id references (that is data.certifications), so the component always scored 0.';

COMMIT;
