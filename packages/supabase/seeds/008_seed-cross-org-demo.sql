-- =========================================================
-- 008_seed-cross-org-demo.sql
-- Cross-organization demo data: applications, connections,
-- reviews, community, portfolio items, and notifications.
-- Creates realistic interactions between Unicorn and Wizard
-- Construction users to demonstrate the full platform.
-- Depends on: 004 (Unicorn org), 006 (Unicorn ATS), 007 (Wizard org)
-- =========================================================

BEGIN;

-- =========================================================
-- 1. CROSS-ORG APPLICATIONS
-- Workers applying to jobs at the other organization
-- =========================================================

-- Marcus Rivera → Wizard's Commercial Electrician (screen)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'commercial-electrician-wizard' LIMIT 1
),
candidate AS (
  SELECT id FROM auth.users WHERE email = 'marcus.rivera@example.test' LIMIT 1
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, answers, is_shortlisted,
  stage_changed_at, created_at
)
SELECT j.id, c.id, 'screen',
  'https://storage.example.com/resumes/marcus-rivera-resume.pdf',
  jsonb_build_object('experience', '8 years plumbing, 2 years electrical', 'licenses', 'MI Journeyman Electrician'),
  true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days'
FROM job_lookup j CROSS JOIN candidate c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Jake Hendricks → Wizard's Plumbing Foreman (interview)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'plumbing-foreman-wizard' LIMIT 1
),
candidate AS (
  SELECT id FROM auth.users WHERE email = 'jake.hendricks@example.test' LIMIT 1
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, cover_letter_url, answers, is_shortlisted,
  stage_changed_at, created_at
)
SELECT j.id, c.id, 'interview',
  'https://storage.example.com/resumes/jake-hendricks-resume.pdf',
  'https://storage.example.com/cover-letters/jake-hendricks-cover.pdf',
  jsonb_build_object('experience', '6 years commercial plumbing', 'license', 'MI Master Plumber', 'crew_size', '8-12'),
  true, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '5 days'
FROM job_lookup j CROSS JOIN candidate c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Carlos Gutierrez → Wizard's Heavy Equipment Operator (new)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'heavy-equipment-operator-wizard' LIMIT 1
),
candidate AS (
  SELECT id FROM auth.users WHERE email = 'carlos.gutierrez@example.test' LIMIT 1
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, answers, is_shortlisted,
  stage_changed_at, created_at
)
SELECT j.id, c.id, 'new',
  'https://storage.example.com/resumes/carlos-gutierrez-resume.pdf',
  jsonb_build_object('experience', '3 years carpentry, CDL Class B', 'equipment', 'Excavator, skid steer, backhoe'),
  false, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
FROM job_lookup j CROSS JOIN candidate c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Derek Johnson (Wizard) → Unicorn's Construction Project Manager (screen)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'construction-project-manager-unicorn' LIMIT 1
),
candidate AS (
  SELECT id FROM auth.users WHERE email = 'derek.johnson@wizard.construction' LIMIT 1
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, cover_letter_url, answers, is_shortlisted,
  stage_changed_at, created_at
)
SELECT j.id, c.id, 'screen',
  'https://storage.example.com/resumes/derek-johnson-resume.pdf',
  'https://storage.example.com/cover-letters/derek-johnson-cover.pdf',
  jsonb_build_object('experience', '15 years foreman, looking to move into PM', 'availability', '2 weeks notice'),
  true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 days'
FROM job_lookup j CROSS JOIN candidate c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Tyler Brooks (Wizard) → Unicorn's Full Stack Developer (new)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'full-stack-developer-unicorn' LIMIT 1
),
candidate AS (
  SELECT id FROM auth.users WHERE email = 'tyler.brooks@wizard.construction' LIMIT 1
)
INSERT INTO core.applications (
  job_id, user_id, status, resume_url, answers, is_shortlisted,
  stage_changed_at, created_at
)
SELECT j.id, c.id, 'new',
  'https://storage.example.com/resumes/tyler-brooks-resume.pdf',
  jsonb_build_object('experience', 'Self-taught developer, React + Python', 'motivation', 'Transitioning from electrical to software'),
  false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'
FROM job_lookup j CROSS JOIN candidate c
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- =========================================================
-- 2. CONNECTIONS (cross-org networking)
-- =========================================================

-- Brian Carter ↔ Clay (accepted — org owners know each other)
INSERT INTO core.connections (requester_user_id, addressee_user_id, status, requester_type, addressee_type, decided_at)
SELECT brian.id, clay.id, 'accepted', 'peer', 'peer', NOW() - INTERVAL '30 days'
FROM (SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction') brian
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'clay@unicorn.love') clay
ON CONFLICT (requester_user_id, addressee_user_id) DO NOTHING;

-- Sarah Mitchell ↔ Zach (accepted — PMs connected)
INSERT INTO core.connections (requester_user_id, addressee_user_id, status, requester_type, addressee_type, decided_at)
SELECT sarah.id, zach.id, 'accepted', 'peer', 'peer', NOW() - INTERVAL '14 days'
FROM (SELECT id FROM auth.users WHERE email = 'sarah.mitchell@wizard.construction') sarah
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'zach@unicorn.love') zach
ON CONFLICT (requester_user_id, addressee_user_id) DO NOTHING;

-- Derek Johnson ↔ Marcus Rivera (pending)
INSERT INTO core.connections (requester_user_id, addressee_user_id, status, requester_type, addressee_type)
SELECT derek.id, marcus.id, 'pending', 'peer', 'peer'
FROM (SELECT id FROM auth.users WHERE email = 'derek.johnson@wizard.construction') derek
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'marcus.rivera@example.test') marcus
ON CONFLICT (requester_user_id, addressee_user_id) DO NOTHING;

-- Maria Gonzalez ↔ Jake Hendricks (pending)
INSERT INTO core.connections (requester_user_id, addressee_user_id, status, requester_type, addressee_type)
SELECT maria.id, jake.id, 'pending', 'peer', 'peer'
FROM (SELECT id FROM auth.users WHERE email = 'maria.gonzalez@wizard.construction') maria
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'jake.hendricks@example.test') jake
ON CONFLICT (requester_user_id, addressee_user_id) DO NOTHING;

-- =========================================================
-- 3. REVIEWS (cross-org peer reviews)
-- =========================================================

-- Clay reviews Derek Johnson
INSERT INTO core.reviews (kind, subject_type, subject_id, author_user_id, rating, headline, body)
SELECT 'review', 'user', derek.id, clay.id, 4,
  'Great foreman, strong safety record',
  'Derek ran our shared subcontractor crew on the Metro project. Excellent coordination, always on top of safety. Would work with him again.'
FROM (SELECT id FROM auth.users WHERE email = 'derek.johnson@wizard.construction') derek
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'clay@unicorn.love') clay
ON CONFLICT (kind, subject_type, subject_id, author_user_id) WHERE author_user_id IS NOT NULL DO NOTHING;

-- Brian Carter recommends Zach
INSERT INTO core.reviews (kind, subject_type, subject_id, author_user_id, rating, headline, body)
SELECT 'recommendation', 'user', zach.id, brian.id, 5,
  'Outstanding project manager',
  'Zach managed the joint venture phase of our Ann Arbor dormitory project. His communication and scheduling skills are top-notch. Highly recommend for any PM role.'
FROM (SELECT id FROM auth.users WHERE email = 'zach@unicorn.love') zach
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction') brian
ON CONFLICT (kind, subject_type, subject_id, author_user_id) WHERE author_user_id IS NOT NULL DO NOTHING;

-- Sarah Mitchell reviews Marcus Rivera
INSERT INTO core.reviews (kind, subject_type, subject_id, author_user_id, rating, headline, body)
SELECT 'review', 'user', marcus.id, sarah.id, 4,
  'Reliable plumber, quality work',
  'Marcus did plumbing rough-in on our Dearborn retrofit. Clean work, showed up on time every day, and caught a code issue before inspection. Solid tradesman.'
FROM (SELECT id FROM auth.users WHERE email = 'marcus.rivera@example.test') marcus
CROSS JOIN (SELECT id FROM auth.users WHERE email = 'sarah.mitchell@wizard.construction') sarah
ON CONFLICT (kind, subject_type, subject_id, author_user_id) WHERE author_user_id IS NOT NULL DO NOTHING;

-- =========================================================
-- 4. COMMUNITY (Construction Pros community + memberships + posts)
-- =========================================================

-- Create the community
INSERT INTO community.communities (
  id, name, slug, description, industry_id, member_count, post_count, is_active
)
SELECT
  'f0000001-0000-4000-8000-000000000001'::uuid,
  'Construction Pros',
  'construction-pros',
  'A community for construction professionals to share work, ask questions, and connect with fellow tradespeople across Michigan and beyond.',
  i.id,
  8, -- will set to actual count
  4, -- 4 posts
  true
FROM core.industries i WHERE i.slug = 'construction'
ON CONFLICT (slug) DO NOTHING;

-- Add memberships (6 users from both orgs + 2 workers)
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'f0000001-0000-4000-8000-000000000001'::uuid,
  au.id,
  true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '7 days')
FROM auth.users au
WHERE au.email IN (
  'clay@unicorn.love',
  'zach@unicorn.love',
  'brian.carter@wizard.construction',
  'sarah.mitchell@wizard.construction',
  'derek.johnson@wizard.construction',
  'tyler.brooks@wizard.construction',
  'marcus.rivera@example.test',
  'jake.hendricks@example.test'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Post 1: Derek Johnson — showcase
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at, upvote_count
)
SELECT
  'f1000001-0000-4000-8000-000000000001'::uuid,
  'f0000001-0000-4000-8000-000000000001'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Detroit Metro lobby framing — 40ft clear span',
  'Just wrapped up the lobby framing on the Detroit Metro Office Complex. 40-foot clear span with exposed steel connections. The engineering on this one was tight but we got it done ahead of schedule. Proud of the crew!',
  ARRAY['https://storage.example.com/community/derek-lobby-framing.jpg'],
  ARRAY['https://storage.example.com/community/derek-lobby-framing-thumb.jpg'],
  true, NOW() - INTERVAL '5 days', 12
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Post 2: Sarah Mitchell — advice (is_published=false; advice posts can't publish to profile)
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at, upvote_count
)
SELECT
  'f1000002-0000-4000-8000-000000000001'::uuid,
  'f0000001-0000-4000-8000-000000000001'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'Tips for managing multiple subcontractors on a tight schedule',
  E'After 12 years of PM work, here are my top 3 tips for keeping subs on track:\n\n1. Weekly coordination meetings — no exceptions. Even 15 minutes saves hours of rework.\n2. Share the master schedule with every sub, not just their scope. When they see the big picture, they self-coordinate.\n3. Build in 2-day buffers between dependent trades. It sounds like a lot but it pays for itself in avoided conflicts.\n\nWhat are your strategies? Drop them below.',
  ARRAY['https://storage.example.com/community/sarah-schedule-whiteboard.jpg'],
  ARRAY['https://storage.example.com/community/sarah-schedule-whiteboard-thumb.jpg'],
  false, NOW() - INTERVAL '3 days', 8
FROM auth.users au WHERE au.email = 'sarah.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Post 3: Clay — showcase
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at, upvote_count
)
SELECT
  'f1000003-0000-4000-8000-000000000001'::uuid,
  'f0000001-0000-4000-8000-000000000001'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Unicorn HQ Renovation — before and after',
  'The north wing renovation is finally complete. Took 4 months but the team crushed it. New open office layout with exposed brick and polished concrete. The client is thrilled. Shout out to the Unicorn Operations team for keeping this on budget.',
  ARRAY['https://storage.example.com/community/clay-hq-before.jpg', 'https://storage.example.com/community/clay-hq-after.jpg'],
  ARRAY['https://storage.example.com/community/clay-hq-before-thumb.jpg', 'https://storage.example.com/community/clay-hq-after-thumb.jpg'],
  true, NOW() - INTERVAL '2 days', 15
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- Post 4: Tyler Brooks — advice (is_published=false; advice posts can't publish to profile)
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at, upvote_count, comment_count
)
SELECT
  'f1000004-0000-4000-8000-000000000001'::uuid,
  'f0000001-0000-4000-8000-000000000001'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'Apprentice question: best way to learn conduit bending?',
  E'I''m a 2nd-year apprentice at IBEW Local 58 and struggling with offset bends on 3/4" EMT. My journeyman says practice makes perfect but I feel like I''m wasting material.\n\nAnyone have tips or YouTube channels that helped them? Also curious if those conduit bending apps are actually useful or just a gimmick.',
  ARRAY['https://storage.example.com/community/tyler-conduit-practice.jpg'],
  ARRAY['https://storage.example.com/community/tyler-conduit-practice-thumb.jpg'],
  false, NOW() - INTERVAL '1 day', 6, 3
FROM auth.users au WHERE au.email = 'tyler.brooks@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Tyler's apprentice question
INSERT INTO community.comments (id, post_id, author_id, body)
SELECT
  'f2000001-0000-4000-8000-000000000001'::uuid,
  'f1000004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Get yourself a cheap bender and some scrap EMT. Practice at home watching Electrician U on YouTube — that channel got me through my apprenticeship. The apps are handy for math but nothing replaces feel.'
FROM auth.users au WHERE au.email = 'marcus.rivera@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body)
SELECT
  'f2000002-0000-4000-8000-000000000001'::uuid,
  'f1000004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Mark your bender shoe at common angles (10, 22, 30, 45) with a paint pen. Saves time and gives you reference points. Also: always measure twice before you bend — pulling a piece out of the rack is way cheaper than pulling it out of the wall.'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body)
SELECT
  'f2000003-0000-4000-8000-000000000001'::uuid,
  'f1000004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'I''ve been using the Ugly''s Conduit Bending book for years. It has all the multipliers and deduct tables. Once you memorize those, the math becomes second nature. Stick with it — every journeyman struggled at first.'
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 5. PORTFOLIO ITEMS
-- =========================================================

-- Derek Johnson: Detroit Metro Office Complex
INSERT INTO core.portfolio_items (id, user_id, title, description, display_order)
SELECT
  'f3000001-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Detroit Metro Office Complex — Structural Framing',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Led a crew of 12 on the structural framing for a 12-story mixed-use office complex in downtown Detroit. Managed steel erection, concrete forming, and curtain wall prep. Project delivered 2 weeks ahead of schedule.'
      )
    ))
  )),
  1
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Sarah Mitchell: Ann Arbor Dormitory
INSERT INTO core.portfolio_items (id, user_id, title, description, display_order)
SELECT
  'f3000002-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Ann Arbor University Dormitory — Project Management',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Project Manager for a 200-bed student dormitory with dining hall. Coordinated 14 subcontractors across 18 months. $28M budget delivered within 2% variance. Overcame supply chain delays on structural steel through early procurement strategy.'
      )
    ))
  )),
  1
FROM auth.users au WHERE au.email = 'sarah.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Clay: Unicorn HQ Renovation
INSERT INTO core.portfolio_items (id, user_id, title, description, display_order)
SELECT
  'f3000003-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Unicorn HQ Renovation — North Wing',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Complete renovation of the Unicorn headquarters north wing. Converted 8,000 sqft of closed offices into modern open workspace with exposed brick, polished concrete floors, and integrated AV systems. 4-month timeline, completed on budget.'
      )
    ))
  )),
  1
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- James Okafor: Dearborn Industrial Retrofit
INSERT INTO core.portfolio_items (id, user_id, title, description, display_order)
SELECT
  'f3000004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Dearborn Industrial Retrofit — Site Superintendent',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Site Superintendent for converting an 80,000 sqft former manufacturing plant into modern flex office and light industrial space. Managed selective demolition, structural reinforcement, and new MEP systems while maintaining building envelope integrity.'
      )
    ))
  )),
  1
FROM auth.users au WHERE au.email = 'james.okafor@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Maria Gonzalez: Cost Estimation
INSERT INTO core.portfolio_items (id, user_id, title, description, display_order)
SELECT
  'f3000005-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Warehouse Build — Cost Estimation & Pre-Construction',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Prepared detailed cost estimates for a new 45,000 sqft warehouse facility. Performed quantity takeoffs, solicited subcontractor bids, and delivered a GMP proposal within 3% of final construction cost. Identified $180K in value engineering opportunities.'
      )
    ))
  )),
  1
FROM auth.users au WHERE au.email = 'maria.gonzalez@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 6. NOTIFICATIONS
-- =========================================================

-- Application received notifications for Wizard org admins
INSERT INTO core.notifications (user_id, type, title, message, cta_url, created_at)
SELECT au.id, 'info',
  'New application received',
  'Marcus Rivera applied for Commercial Electrician at Wizard Construction.',
  '/office/applications',
  NOW() - INTERVAL '3 days'
FROM auth.users au
WHERE au.email IN ('brian.carter@wizard.construction', 'sarah.mitchell@wizard.construction')
ON CONFLICT DO NOTHING;

INSERT INTO core.notifications (user_id, type, title, message, cta_url, created_at)
SELECT au.id, 'info',
  'New application received',
  'Jake Hendricks applied for Plumbing Foreman at Wizard Construction.',
  '/office/applications',
  NOW() - INTERVAL '5 days'
FROM auth.users au
WHERE au.email IN ('brian.carter@wizard.construction', 'sarah.mitchell@wizard.construction')
ON CONFLICT DO NOTHING;

-- Application received notifications for Unicorn org admins
INSERT INTO core.notifications (user_id, type, title, message, cta_url, created_at)
SELECT au.id, 'info',
  'New application received',
  'Derek Johnson applied for Construction Project Manager at Unicorn.',
  '/office/applications',
  NOW() - INTERVAL '4 days'
FROM auth.users au
WHERE au.email IN ('clay@unicorn.love', 'zach@unicorn.love')
ON CONFLICT DO NOTHING;

-- Connection request notifications
INSERT INTO core.notifications (user_id, type, title, message, cta_url, created_at)
SELECT au.id, 'info',
  'New connection request',
  'Derek Johnson wants to connect with you.',
  '/communities/connections',
  NOW() - INTERVAL '2 days'
FROM auth.users au
WHERE au.email = 'marcus.rivera@example.test'
ON CONFLICT DO NOTHING;

INSERT INTO core.notifications (user_id, type, title, message, cta_url, created_at)
SELECT au.id, 'info',
  'New connection request',
  'Maria Gonzalez wants to connect with you.',
  '/communities/connections',
  NOW() - INTERVAL '1 day'
FROM auth.users au
WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Depends on seeds 004, 005, 006, 007 (all org + user data)
-- 2. Application statuses: new, screen, interview (matching ATS pipeline)
-- 3. Connections: 2 accepted (established), 2 pending (action needed)
-- 4. Reviews: 1 recommendation + 2 peer reviews (cross-org)
-- 5. Community: "Construction Pros" with 8 members, 4 posts, 3 comments
-- 6. Portfolio: 5 items across both orgs
-- 7. Notifications: 6 (application + connection notifications)
-- 8. All inserts are idempotent (ON CONFLICT DO NOTHING)
-- =========================================================
