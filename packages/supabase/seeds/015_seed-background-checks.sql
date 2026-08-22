-- =========================================================
-- 015_seed-background-checks.sql
-- Background checks for the admin screening queue.
--
-- The queue at /office/ats/checks had ZERO rows locally, so its SLA layer
-- (#633) shipped verified by tests and never seen rendering — the same gap the
-- ATS board had until applications turned up, which is where the empty-lane
-- density bug had been hiding.
--
-- Ages are deliberately spread across every SLA state the queue can show, so
-- the strip is exercised rather than merely populated:
--
--   over SLA     past the promise for its status — the rows that need chasing
--   due today    exactly at the promise, which is not yet a breach
--   on time      inside the promise
--   terminal     finished or cancelled; never late however old
--
-- `updated_at` is what the SLA reads (days in the CURRENT state, not days
-- since the case opened), so each row sets it explicitly rather than letting
-- the default land everything on today and render a uniformly healthy queue.
--
-- Run after 002 (users) and 004 (unicorn org).
-- =========================================================

BEGIN;

WITH
  org AS (SELECT id FROM core.organizations WHERE slug = 'unicorn' LIMIT 1),
  requester AS (SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1),
  pkg AS (
    SELECT id, slug FROM core.background_check_packages
    WHERE slug IN ('entry-level', 'experience-level', 'professional-level')
  ),
  subjects AS (
    SELECT id, email, row_number() OVER (ORDER BY email) AS n
    FROM auth.users
    WHERE email IN (
      'ewongagent@gmail.com',
      'bloxhambuilding@gmail.com',
      'davidcasinghino@gmail.com',
      'jacksoncefalo@gmail.com',
      'jordanelster10@gmail.com',
      'colinclong03@gmail.com',
      'dterry86@gmail.com',
      'braydend.086@gmail.com'
    )
  ),
  -- (status, days in that status, package slug). See the header for why the
  -- ages are what they are.
  plan(status, days_in_state, pkg_slug) AS (
    VALUES
      -- Over SLA: these are the rows a processor should pick up first.
      ('submitted',            9, 'entry-level'),        -- promise 3d
      ('under_review',         6, 'professional-level'), -- promise 2d
      ('pending',              5, 'entry-level'),        -- promise 2d
      -- Due today: at the promise, not yet past it.
      ('submitted',            3, 'experience-level'),
      -- On time: inside the promise, and `invited` deliberately gets longer
      -- because the ball is with the applicant, not the processor.
      ('invited',              4, 'experience-level'),   -- promise 7d
      ('in_progress',          2, 'professional-level'), -- promise 5d
      -- Terminal: never late, however old.
      ('completed_clear',     40, 'entry-level'),
      ('cancelled',           25, 'entry-level')
  ),
  numbered AS (
    SELECT
      p.status,
      p.days_in_state,
      p.pkg_slug,
      row_number() OVER (ORDER BY p.days_in_state DESC, p.status) AS n
    FROM plan p
  )
INSERT INTO core.background_checks (
  user_id,
  organization_id,
  requested_by_user_id,
  package_id,
  check_type_ids,
  custom_configuration,
  component_statuses,
  status,
  status_history,
  initiated_by,
  invited_at,
  submitted_at,
  completed_at,
  created_at,
  updated_at
)
SELECT
  s.id,
  (SELECT id FROM org),
  (SELECT id FROM requester),
  pk.id,
  '{}',
  '{}'::jsonb,
  '{}'::jsonb,
  n.status::core.background_check_status,
  '[]'::jsonb,
  -- `initiated_by` is constrained to worker|organization|admin; an
  -- employer-requested check is 'organization'.
  'organization',
  now() - make_interval(days => n.days_in_state + 2),
  CASE WHEN n.status IN ('submitted', 'in_progress', 'under_review', 'completed_clear')
       THEN now() - make_interval(days => n.days_in_state + 1) END,
  CASE WHEN n.status = 'completed_clear'
       THEN now() - make_interval(days => n.days_in_state) END,
  -- Opened well before it reached its current state, so a queue reading
  -- days-since-created would report very different numbers from one reading
  -- days-in-state. That difference is the whole point of the SLA layer.
  now() - make_interval(days => n.days_in_state + 6),
  now() - make_interval(days => n.days_in_state)
FROM numbered n
JOIN subjects s ON s.n = n.n
JOIN pkg pk ON pk.slug = n.pkg_slug
WHERE EXISTS (SELECT 1 FROM org)
  AND EXISTS (SELECT 1 FROM requester)
  -- Guard, not ON CONFLICT: core.background_checks has no natural unique key
  -- for (subject, status), so `ON CONFLICT DO NOTHING` matches nothing and a
  -- second run silently doubles the queue. Re-running this file is a no-op.
  AND NOT EXISTS (
    SELECT 1 FROM core.background_checks existing
    WHERE existing.user_id = s.id
      AND existing.status = n.status::core.background_check_status
  );


-- =========================================================
-- Grant background_check_admin to the platform admins.
--
-- The role exists in core.roles and NOBODY held it, so
-- /office/ats/admin — the screening queue with the SLA strip — rendered
-- "Admin access required" for every seeded user including super_admin. The
-- page was not just unpopulated, it was unreachable, which is why its SLA
-- layer went unverified.
--
-- Same audience as the `office` role in 002: staff addresses only.
-- =========================================================

INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, NULL, NULL
FROM core.roles r
CROSS JOIN auth.users u
WHERE r.name = 'background_check_admin'
  AND r.scope = 'platform'
  AND (
    u.email ILIKE '%@unicorn.love'
    OR u.email ILIKE '%@circleave.com'
    OR u.email ILIKE '%@scaffald.com'
  )
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

COMMIT;

-- Expected shape once applied:
--   8 checks, 6 open / 2 terminal
--   3 over SLA, 1 due today, 2 on time
--   median days open across the 6 open cases: 4.5
--     (ages 2,3,4,5,6,9 -> (4+5)/2; verified on screen, not predicted)
