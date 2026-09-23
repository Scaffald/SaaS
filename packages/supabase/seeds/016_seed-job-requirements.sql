-- =========================================================
-- 016_seed-job-requirements.sql
--
-- Give the seeded postings the requirements they claim to have. Issue #827.
--
-- `core.jobs` has carried minimum_education_level, minimum_years_experience,
-- require_drivers_license, require_background_check, require_drug_test,
-- security_clearance_required and travel_percentage since the table was
-- built, and the job detail screen now answers each of them against the
-- viewer's own profile ("2 of 3 met"). Every seeded posting left all seven
-- NULL, so the block rendered on no job at all and the feature was invisible
-- to anyone reviewing locally.
--
-- Deliberately varied against the three seeded worker profiles from
-- 014_seed-worker-profiles.sql:
--
--   marcus.rivera      bachelor's + a long history -> meets most postings
--   carlos.gutierrez   trade school + two roles    -> meets the trades, not
--                                                     the degree-gated ones
--   jake.hendricks     one current role            -> misses the year counts
--
-- so the ✓ / ✗ / – treatment has all three states on screen rather than one.
--
-- Resolved by slug and written with plain UPDATEs, so it is idempotent and
-- safe to re-run. Nothing here is a schema change.
-- =========================================================

BEGIN;

UPDATE core.jobs AS j
SET minimum_education_level = r.education,
    minimum_years_experience = r.years,
    require_drivers_license = r.drivers_license,
    require_background_check = r.background_check,
    require_drug_test = r.drug_test,
    travel_percentage = r.travel
FROM (
  VALUES
    -- slug,                                 education,     yrs, dl,    bg,    drug,  travel
    ('construction-project-manager-unicorn', 'high_school',   5, true,  true,  true,     25),
    ('site-superintendent-unicorn',          'high_school',   7, true,  true,  true,     10),
    ('senior-software-engineer-unicorn',     'bachelor',      6, false, true,  false,  NULL),
    ('full-stack-developer-unicorn',         'bachelor',      3, false, false, false,  NULL),
    ('part-time-estimator-unicorn',          'associate',     2, false, false, false,  NULL),
    ('commercial-electrician-wizard',        'high_school',   4, true,  false, true,   NULL),
    ('heavy-equipment-operator-wizard',      'high_school',   2, true,  true,  true,     15),
    ('hvac-technician-wizard',               'high_school',   3, true,  false, true,   NULL),
    ('hvac-install-technician-apex',         'high_school',   2, true,  false, true,     20),
    ('plumbing-foreman-wizard',              'high_school',   6, true,  true,  true,   NULL),
    ('safety-coordinator-wizard',            'associate',     3, false, true,  false,    30),
    ('scaffold-foreman-apex',                'high_school',   5, true,  true,  true,     40),
    ('pipe-welder-fabricator-apex',          'high_school',   4, false, false, true,     50)
) AS r(slug, education, years, drivers_license, background_check, drug_test, travel)
WHERE j.slug = r.slug;

COMMIT;

-- Expected shape once applied:
--   13 of 13 postings carry a minimum education level and a year count
--   8 require a driver's licence, 7 a background check, 9 a drug test
--   7 name a travel percentage; none requires a security clearance
