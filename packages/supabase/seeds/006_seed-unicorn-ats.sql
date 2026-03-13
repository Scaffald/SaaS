-- =========================================================
-- 006_seed-unicorn-ats.sql
-- Optional: ATS demo data for Unicorn organization only.
-- Adds applications (and optional messages) for Unicorn jobs
-- so employer/PM flows can be demonstrated.
-- Run after 004. Safe to run manually: pnpm supa db seed --file seeds/006_seed-unicorn-ats.sql
-- =========================================================

BEGIN;

-- Applications for Senior Software Engineer (Unicorn)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'senior-software-engineer-unicorn' LIMIT 1
),
candidates AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'ewongagent@gmail.com',
    'bloxhambuilding@gmail.com',
    'davidcasinghino@gmail.com'
  )
)
INSERT INTO core.applications (
  job_id,
  user_id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
)
SELECT
  j.id,
  c.id,
  CASE c.email
    WHEN 'ewongagent@gmail.com' THEN 'new'
    WHEN 'bloxhambuilding@gmail.com' THEN 'screen'
    WHEN 'davidcasinghino@gmail.com' THEN 'interview'
  END,
  'https://storage.example.com/resumes/demo-resume.pdf',
  CASE WHEN c.email != 'ewongagent@gmail.com' THEN 'https://storage.example.com/cover-letters/demo-cover.pdf' END,
  jsonb_build_object('experience', '5+ years full stack', 'availability', 'Immediate'),
  c.email != 'ewongagent@gmail.com',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '3 days'
FROM job_lookup j
CROSS JOIN candidates c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Full Stack Developer (Unicorn)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'full-stack-developer-unicorn' LIMIT 1
),
candidates AS (
  SELECT id, email FROM auth.users WHERE email IN (
    'jacksoncefalo@gmail.com',
    'colinclong03@gmail.com'
  )
)
INSERT INTO core.applications (
  job_id,
  user_id,
  status,
  resume_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
)
SELECT
  j.id,
  c.id,
  CASE c.email
    WHEN 'jacksoncefalo@gmail.com' THEN 'new'
    WHEN 'colinclong03@gmail.com' THEN 'offer'
  END,
  'https://storage.example.com/resumes/demo-resume.pdf',
  jsonb_build_object('experience', 'React, TypeScript, Node'),
  true,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '5 days'
FROM job_lookup j
CROSS JOIN candidates c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Part-Time Estimator (Unicorn)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'part-time-estimator-unicorn' LIMIT 1
),
candidates AS (
  SELECT id FROM auth.users WHERE email = 'jordanelster10@gmail.com'
)
INSERT INTO core.applications (
  job_id,
  user_id,
  status,
  resume_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
)
SELECT
  j.id,
  c.id,
  'screen',
  'https://storage.example.com/resumes/demo-resume.pdf',
  jsonb_build_object('estimating_experience', '3 years', 'flexible', true),
  true,
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '2 days'
FROM job_lookup j
CROSS JOIN candidates c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

COMMIT;
