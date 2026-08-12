-- =========================================================
-- 014_seed-worker-profiles.sql
--
-- Fill in the three seeded construction workers. Issue #389.
--
-- They were past the onboarding gate with completely empty profiles — zero
-- experience, education, skills and certifications — so every worker-facing
-- screen was a wall of empty states. That made worker-side review useless and
-- is how several UI bugs stayed hidden: an empty state and a broken query look
-- identical.
--
-- Deliberately varied, because uniformly-full profiles hide the opposite class
-- of bug:
--
--   marcus.rivera     100  full history, degree, 6 skills, 3 certs, location
--   carlos.gutierrez   65  two roles, trade school, 1 cert — but only 2 skills
--                          (under the >=3 threshold) and no location set
--   jake.hendricks     35  one current role, one skill — the sparse path
--
-- Scores are measured against core.v_profile_completion_scores, not estimated.
-- Each component is all-or-nothing, so a mid-range profile has to *miss* whole
-- components; carlos is deliberately short on skills and location so the
-- "finish your profile" prompts have a realistic target.
--
-- One certification expires within 60 days on purpose, so renewal reminders and
-- the expiring-soon UI have something to act on.
--
-- Everything resolves by natural key (email, CSI code_key, certification title)
-- rather than hardcoded UUIDs: masterformat ids are generated per seed run, so
-- literals would break on the next reset. Idempotent — safe to re-run.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Work experience
-- ---------------------------------------------------------

INSERT INTO core.user_experience
  (user_id, job_title, company_name, employment_type, location, is_current, start_date, end_date, source, description)
SELECT u.id, v.job_title, v.company_name, v.employment_type, v.location, v.is_current, v.start_date, v.end_date, 'self_reported',
       jsonb_build_object('summary', v.summary)
FROM (VALUES
  ('marcus.rivera@example.test',    'Journeyman Electrician',      'Apex Mechanical Inc.',      'full_time', 'Denver, CO',      TRUE,  DATE '2022-03-01', NULL,              'Commercial fit-outs and panel upgrades; leads a two-person crew.'),
  ('marcus.rivera@example.test',    'Apprentice Electrician',      'Rocky Mountain Electric',   'full_time', 'Denver, CO',      FALSE, DATE '2018-06-01', DATE '2022-02-28', 'Four-year apprenticeship across residential and light commercial.'),
  ('marcus.rivera@example.test',    'General Laborer',             'Foothills Construction',    'seasonal',  'Boulder, CO',     FALSE, DATE '2017-05-01', DATE '2017-11-30', 'Site prep and concrete support on residential builds.'),
  ('carlos.gutierrez@example.test', 'Pipefitter',                  'Summit Plumbing & Heating', 'full_time', 'Colorado Springs, CO', TRUE, DATE '2021-09-01', NULL,          'Commercial pipefitting, primarily healthcare and education projects.'),
  ('carlos.gutierrez@example.test', 'Plumber''s Helper',           'Summit Plumbing & Heating', 'full_time', 'Colorado Springs, CO', FALSE, DATE '2019-04-01', DATE '2021-08-31', 'Residential service and new construction rough-in.'),
  ('jake.hendricks@example.test',   'Carpenter',                   'Front Range Framing',       'full_time', 'Fort Collins, CO', TRUE, DATE '2024-01-15', NULL,             'Residential framing.')
) AS v(email, job_title, company_name, employment_type, location, is_current, start_date, end_date, summary)
JOIN auth.users u ON u.email = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM core.user_experience e
  WHERE e.user_id = u.id AND e.job_title = v.job_title AND e.company_name = v.company_name
);

-- ---------------------------------------------------------
-- Education
-- ---------------------------------------------------------

INSERT INTO core.user_education
  (user_id, institution_name, degree_type, field_of_study, start_date, end_date, is_current, location)
SELECT u.id, v.institution_name, v.degree_type, v.field_of_study, v.start_date, v.end_date, FALSE, v.location
FROM (VALUES
  ('marcus.rivera@example.test',    'Colorado State University',            'associate',   'Electrical Technology',   DATE '2015-08-01', DATE '2017-05-01', 'Fort Collins, CO'),
  ('marcus.rivera@example.test',    'IEC Rocky Mountain',                   'certificate', 'Electrical Apprenticeship', DATE '2018-06-01', DATE '2022-02-01', 'Denver, CO'),
  ('carlos.gutierrez@example.test', 'Pikes Peak State College',             'certificate', 'Plumbing Technology',     DATE '2018-08-01', DATE '2019-05-01', 'Colorado Springs, CO')
) AS v(email, institution_name, degree_type, field_of_study, start_date, end_date, location)
JOIN auth.users u ON u.email = v.email
WHERE NOT EXISTS (
  SELECT 1 FROM core.user_education e
  WHERE e.user_id = u.id AND e.institution_name = v.institution_name AND e.field_of_study = v.field_of_study
);

-- ---------------------------------------------------------
-- Trade skills (CSI divisions)
--
-- skill_taxonomy is CHECK-constrained to csi | onet | soft_skills, and a csi
-- row must carry csi_skill_id with soft_skill_id NULL — so unlike the
-- certifications below, this join cannot be relaxed to a LEFT JOIN.
-- data.masterformat is filled by the TypeScript reference seed, which runs
-- after these SQL seeds, so on a bare `db reset` these rows are skipped and
-- appear on the next `pnpm supa:seed`. seed-all.ts re-runs this file for that
-- reason; the NOT EXISTS guards make the second pass safe.
-- ---------------------------------------------------------

INSERT INTO core.user_skills
  (user_id, skill_taxonomy, csi_skill_id, proficiency_level, years_experience, self_assessed_at)
SELECT u.id, 'csi', m.id, v.proficiency, v.years, NOW()
FROM (VALUES
  ('marcus.rivera@example.test',    '26-00-00-00', 5::int2, 7.5),
  ('marcus.rivera@example.test',    '05-00-00-00', 3::int2, 4.0),
  ('marcus.rivera@example.test',    '03-00-00-00', 2::int2, 1.5),
  ('carlos.gutierrez@example.test', '22-00-00-00', 4::int2, 5.0),
  ('jake.hendricks@example.test',   '06-00-00-00', 3::int2, 2.5)
) AS v(email, code_key, proficiency, years)
JOIN auth.users u ON u.email = v.email
JOIN data.masterformat m ON m.code_key = v.code_key
WHERE NOT EXISTS (
  SELECT 1 FROM core.user_skills s
  WHERE s.user_id = u.id AND s.csi_skill_id = m.id
);

-- ---------------------------------------------------------
-- Soft skills
-- ---------------------------------------------------------

INSERT INTO core.user_skills
  (user_id, skill_taxonomy, soft_skill_id, proficiency_level, self_assessed_at)
SELECT u.id, 'soft_skills', ss.id, v.proficiency, NOW()
FROM (VALUES
  ('marcus.rivera@example.test',    'Time Management',     4::int2),
  ('marcus.rivera@example.test',    'Deadline Management', 4::int2),
  ('marcus.rivera@example.test',    'Prioritization',      3::int2),
  ('carlos.gutierrez@example.test', 'Time Management',     3::int2)
) AS v(email, skill_name, proficiency)
JOIN auth.users u ON u.email = v.email
JOIN core.soft_skills ss ON ss.name = v.skill_name
WHERE NOT EXISTS (
  SELECT 1 FROM core.user_skills s
  WHERE s.user_id = u.id AND s.soft_skill_id = ss.id
);

-- ---------------------------------------------------------
-- Certifications
--
-- Dates are relative to NOW() so the fixture stays meaningful as it ages —
-- a hardcoded expiry silently becomes "expired years ago" and stops
-- exercising the renewal path it was meant to cover.
-- ---------------------------------------------------------

INSERT INTO core.user_certifications
  (user_id, certification_id, name, issuing_organization, issue_date, expiration_date, is_active, verification_status)
SELECT u.id, c.id, v.display_name, v.issuer,
       (NOW() - (v.issued_months_ago || ' months')::interval)::date,
       (NOW() + (v.expires_in_days || ' days')::interval)::date,
       TRUE, v.status
FROM (VALUES
  ('marcus.rivera@example.test',    'Occupational Safety and Health Administration (OSHA)', 'OSHA 30-Hour Construction', 'OSHA',              30, 700, 'verified'),
  ('marcus.rivera@example.test',    'First Aid, CPR & Emergency Response',                  'First Aid / CPR',           'American Red Cross', 22,  45, 'verified'),
  ('marcus.rivera@example.test',    'Licensed Construction Trades',                         'Journeyman Electrician License', 'Colorado DPO',  14, 500, 'verified'),
  ('carlos.gutierrez@example.test', 'Occupational Safety and Health Administration (OSHA)', 'OSHA 10-Hour Construction', 'OSHA',              18, 400, 'pending')
) AS v(email, cert_title, display_name, issuer, issued_months_ago, expires_in_days, status)
JOIN auth.users u ON u.email = v.email
-- LEFT, not INNER: data.certifications is populated by the TypeScript
-- reference seed, which runs *after* `db reset` runs these SQL seeds. An inner
-- join silently produced zero certifications on a fresh reset. certification_id
-- is nullable and the view reads name/issuing_organization off this row, so the
-- catalog link is a nicety rather than a requirement.
LEFT JOIN data.certifications c ON c.title = v.cert_title
WHERE NOT EXISTS (
  SELECT 1 FROM core.user_certifications uc
  WHERE uc.user_id = u.id AND uc.name = v.display_name
);

-- ---------------------------------------------------------
-- Identity + location
--
-- The completion score awards 20 for first/last/headline and 15 for a location,
-- so without these a fully-documented worker still tops out in the sixties.
-- Given deliberately unevenly: jake keeps no location so the incomplete-profile
-- prompts still have someone to fire on.
-- ---------------------------------------------------------

UPDATE core.users u
SET headline = v.headline
FROM (VALUES
  ('marcus.rivera@example.test',    'Journeyman Electrician · Commercial fit-outs · Denver'),
  ('carlos.gutierrez@example.test', 'Commercial Pipefitter · Healthcare & education projects')
) AS v(email, headline)
WHERE u.id = (SELECT id FROM auth.users a WHERE a.email = v.email)
  AND COALESCE(u.headline, '') = '';

UPDATE core.profile p
SET address = v.address,
    preferred_work_locations = v.locations,
    education_level = v.education_level
FROM (VALUES
  ('marcus.rivera@example.test',
   '{"city":"Denver","state":"CO","postal_code":"80205","country":"US"}'::jsonb,
   ARRAY['Denver, CO','Aurora, CO','Boulder, CO'],
   'associate'),
  ('carlos.gutierrez@example.test', NULL::jsonb, NULL::text[], 'certificate')
) AS v(email, address, locations, education_level)
WHERE p.user_id = (SELECT id FROM auth.users a WHERE a.email = v.email);

-- ---------------------------------------------------------
-- Assert the trade-skill insert actually matched
-- ---------------------------------------------------------
-- The CSI insert above joins data.masterformat by code_key. That table was
-- empty in every local environment until 000_seed-csi-masterformat.sql existed,
-- so the join matched zero rows and the seed reported success while silently
-- planting none of the six skills its own header advertises.
--
-- That is precisely the failure mode this file's header warns about — "an empty
-- state and a broken query look identical" — and it is how #583 stayed hidden:
-- marcus scored 100% completion with a Skills widget reading "No skills added
-- yet". A seed that claims to create data must fail when it does not.
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT count(*) INTO n
  FROM core.user_skills s
  JOIN auth.users u ON u.id = s.user_id
  WHERE s.skill_taxonomy = 'csi'
    AND u.email IN (
      'marcus.rivera@example.test',
      'carlos.gutierrez@example.test',
      'jake.hendricks@example.test'
    );

  IF n < 5 THEN
    RAISE EXCEPTION
      'Seeded % csi skills for the demo workers, expected 5. data.masterformat has % rows — if that is 0, 000_seed-csi-masterformat.sql did not run.',
      n, (SELECT count(*) FROM data.masterformat);
  END IF;
END $$;

COMMIT;
