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

-- =========================================================
-- Pipeline depth (#538)
--
-- Everything above lands applications in four stages with no source, no
-- screening answers, no messages and no activity. That is enough for a board
-- to render and not enough for anything to be *tested*: the kanban e2e calls
-- test.skip() when a column is empty, so most of the suite opted out rather
-- than failing, and the metrics dashboard had no stage history to compute
-- time-to-hire from.
--
-- Below fills the remaining stages, attaches source and screening data, and
-- writes the activity trail a real pipeline would have accumulated.
-- Idempotent: re-running changes nothing.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Source + screening answers on the applications seeded above.
--
-- `source` drives source-of-hire reporting; `screening_answers` is where the
-- flat screening fields actually live (they are not columns — see #546).
-- ---------------------------------------------------------
UPDATE core.applications a
SET
  source = CASE (abs(hashtext(a.id::text)) % 4)
    WHEN 0 THEN 'scaffald'
    WHEN 1 THEN 'referral'
    WHEN 2 THEN 'external_board'
    ELSE 'company_website'
  END,
  screening_answers = jsonb_build_object(
    'current_location', 'Detroit, MI',
    'willing_to_relocate', (abs(hashtext(a.id::text)) % 2) = 0,
    'years_experience', 2 + (abs(hashtext(a.id::text)) % 12),
    'is_authorized_to_work', true,
    'earliest_start_date', to_char(NOW() + INTERVAL '3 weeks', 'YYYY-MM-DD')
  ),
  score_total = 40 + (abs(hashtext(a.id::text)) % 60)
FROM core.jobs j, core.organizations o
WHERE a.job_id = j.id
  AND j.organization_id = o.id
  AND o.slug = 'unicorn'
  AND a.source IS NULL;

-- ---------------------------------------------------------
-- The stages nothing reached: inquired, hired, rejected, withdrawn.
--
-- Without these the board has four empty columns, and `withdrawn` in
-- particular is never exercised — the state that used to be silently counted
-- as `rejected` (#533).
-- ---------------------------------------------------------
WITH unicorn_jobs AS (
  SELECT j.id, row_number() OVER (ORDER BY j.created_at) AS rn
  FROM core.jobs j
  JOIN core.organizations o ON o.id = j.organization_id
  WHERE o.slug = 'unicorn'
),
spare_candidates AS (
  SELECT u.id, row_number() OVER (ORDER BY u.created_at) AS rn
  FROM auth.users u
  WHERE u.email NOT ILIKE '%@unicorn.love'
    AND NOT EXISTS (
      SELECT 1 FROM core.applications a
      JOIN unicorn_jobs uj ON uj.id = a.job_id
      WHERE a.user_id = u.id
    )
  LIMIT 4
),
targets AS (
  SELECT
    c.id AS user_id,
    (SELECT id FROM unicorn_jobs WHERE rn = 1 + ((c.rn - 1) % (SELECT count(*) FROM unicorn_jobs))) AS job_id,
    (ARRAY['inquired', 'hired', 'rejected', 'withdrawn'])[c.rn] AS status,
    c.rn
  FROM spare_candidates c
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, answers, source,
  screening_answers, score_total, is_shortlisted, stage_changed_at, created_at
)
SELECT
  t.job_id,
  t.user_id,
  t.status,
  'https://storage.example.com/resumes/demo-resume.pdf',
  jsonb_build_object('experience', 'Seeded for pipeline coverage'),
  (ARRAY['referral', 'scaffald', 'social_media', 'other'])[t.rn],
  jsonb_build_object(
    'current_location', 'Grand Rapids, MI',
    'willing_to_relocate', true,
    'years_experience', 4 + t.rn,
    'is_authorized_to_work', true,
    'earliest_start_date', to_char(NOW() + INTERVAL '2 weeks', 'YYYY-MM-DD')
  ),
  55 + (t.rn * 8),
  t.status IN ('hired', 'inquired'),
  NOW() - (t.rn || ' days')::interval,
  NOW() - ((t.rn + 10) || ' days')::interval
FROM targets t
WHERE t.job_id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- ---------------------------------------------------------
-- Stage history.
--
-- core.application_activity had never been written to by anything, which is
-- why the office UI hardcoded stageHistory to [] and time-to-hire could not
-- compute (#531). Synthesise the transitions each application must have gone
-- through to reach its current status, spaced so durations are realistic.
--
-- No unique constraint on this table, so guard on NOT EXISTS rather than
-- ON CONFLICT.
-- ---------------------------------------------------------
WITH unicorn_apps AS (
  SELECT a.id, a.status, a.created_at, j.organization_id
  FROM core.applications a
  JOIN core.jobs j ON j.id = a.job_id
  JOIN core.organizations o ON o.id = j.organization_id
  WHERE o.slug = 'unicorn'
),
-- The path each status implies, as ordered (from, to) pairs.
paths AS (
  SELECT id, organization_id, created_at, status,
    CASE status
      WHEN 'screen'     THEN ARRAY['new:screen']
      WHEN 'inquired'   THEN ARRAY['new:screen', 'screen:inquired']
      WHEN 'interview'  THEN ARRAY['new:screen', 'screen:interview']
      WHEN 'offer'      THEN ARRAY['new:screen', 'screen:interview', 'interview:offer']
      WHEN 'hired'      THEN ARRAY['new:screen', 'screen:interview', 'interview:offer', 'offer:hired']
      WHEN 'rejected'   THEN ARRAY['new:screen', 'screen:rejected']
      WHEN 'withdrawn'  THEN ARRAY['new:screen', 'screen:withdrawn']
      ELSE ARRAY[]::text[]
    END AS steps
  FROM unicorn_apps
),
expanded AS (
  SELECT
    p.id, p.organization_id, p.created_at,
    step, ord
  FROM paths p, unnest(p.steps) WITH ORDINALITY AS s(step, ord)
)
INSERT INTO core.application_activity (
  application_id, organization_id, actor_user_id, event_type, details, created_at
)
SELECT
  e.id,
  e.organization_id,
  NULL,
  'status_changed',
  jsonb_build_object(
    'from', split_part(e.step, ':', 1),
    'to', split_part(e.step, ':', 2),
    'seeded', true
  ),
  e.created_at + (e.ord * INTERVAL '2 days')
FROM expanded e
WHERE NOT EXISTS (
  SELECT 1 FROM core.application_activity aa
  WHERE aa.application_id = e.id AND aa.details->>'seeded' = 'true'
);

-- ---------------------------------------------------------
-- A message thread on the applications past screening, so the messages tab
-- and the card's comment count have something to show.
-- ---------------------------------------------------------
INSERT INTO core.application_messages (application_id, author_user_id, body, created_at)
SELECT
  a.id,
  o.owner_user_id,
  'Thanks for applying — we have reviewed your profile and would like to talk.',
  a.created_at + INTERVAL '1 day'
FROM core.applications a
JOIN core.jobs j ON j.id = a.job_id
JOIN core.organizations o ON o.id = j.organization_id
WHERE o.slug = 'unicorn'
  AND a.status IN ('inquired', 'interview', 'offer', 'hired')
  AND o.owner_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM core.application_messages m WHERE m.application_id = a.id
  );

COMMIT;
