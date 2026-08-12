-- =========================================================
-- 345_profile_completion_counts_real_skills.sql
--
-- Profile Strength reported numbers that did not describe the profile (#585).
--
-- The Skills component counted every row in core.user_skills with no taxonomy
-- filter. core.user_skills holds three taxonomies — csi, onet and soft_skills —
-- and the soft-skills self-assessment alone writes 25 rows. So rating yourself
-- on the soft-skills questionnaire and adding zero trade skills satisfied the
-- ">= 3 skills" component outright.
--
-- Measured, not assumed: marcus.rivera@example.test has zero csi/onet rows and
-- three soft_skills rows, and GET /v1/profiles/completion/status returned
-- completionPercentage 100.
--
-- Soft skills are a real signal, but they are not what the Skills component
-- claims to measure, and the Skills widget on the profile reads csi/onet only —
-- so a worker could see "Skills: complete" next to a widget saying "No skills
-- added yet". This filters the component to the taxonomies the skills UI
-- actually manages.
--
-- The Identity component's dependency on core.users.headline is left intact and
-- is instead made reachable: this migration ships alongside a headline field in
-- the General Information editor and on PATCH /v1/profiles/general. Before that
-- there was no way for any user to earn those 20 points.
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
  -- Skills: 20. csi/onet only — see the header for why an unfiltered count
  -- meant the soft-skills questionnaire scored this component on its own.
  + CASE
      WHEN (
        SELECT count(*) FROM core.user_skills us
        WHERE us.user_id = p.user_id
          AND us.skill_taxonomy IN ('csi', 'onet')
      ) >= 3 THEN 20
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
  -- Certifications: 15
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
  'Profile completion out of 100: identity 20, skills 20, experience 20, certifications 15, location 15, education 10. The skills component counts csi/onet rows only — an unfiltered count let the 25-row soft-skills self-assessment satisfy it with zero trade skills (#585). The certification component reads core.user_certifications.name/issuing_organization directly — it previously joined core.certifications, which is empty and is NOT the table certification_id references (that is data.certifications), so the component always scored 0.';

COMMIT;
