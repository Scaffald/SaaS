-- =========================================================
-- 009_seed-community-posts.sql
-- Example posts across trade communities from seeded users.
-- Adds memberships, posts, comments, upvotes, and ratings
-- to the 10 trade communities created in migration 318.
-- Depends on: 002 (users), 005 (demo users), 007 (wizard users),
--             008 (cross-org demo), migration 318 (communities)
-- =========================================================

BEGIN;

-- =========================================================
-- 1. MEMBERSHIPS — join users to trade communities
-- =========================================================

-- Electrical community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000002'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '14 days')
FROM auth.users au
WHERE au.email IN (
  'jake.hendricks@example.test',       -- Electrician
  'tyler.brooks@wizard.construction',   -- Apprentice electrician
  'derek.johnson@wizard.construction',  -- Foreman (cross-trade)
  'marcus.rivera@example.test',         -- Plumber (cross-trade interest)
  'clay@unicorn.love',                  -- Owner, general interest
  'ron.mitchell@wizard.construction'    -- Wizard crew
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Plumbing community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000003'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '14 days')
FROM auth.users au
WHERE au.email IN (
  'marcus.rivera@example.test',         -- Plumber
  'jake.hendricks@example.test',        -- Electrician (cross-trade)
  'james.okafor@wizard.construction',   -- Superintendent
  'sarah.mitchell@wizard.construction', -- PM
  'zach@unicorn.love'                   -- Unicorn PM
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Carpentry community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000005'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '10 days')
FROM auth.users au
WHERE au.email IN (
  'carlos.gutierrez@example.test',      -- Carpenter
  'derek.johnson@wizard.construction',  -- Foreman
  'clay@unicorn.love',                  -- Owner
  'ron.mitchell@wizard.construction',   -- Wizard crew
  'brian.carter@wizard.construction'    -- Wizard owner
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- HVAC community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000004'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '7 days')
FROM auth.users au
WHERE au.email IN (
  'ron.mitchell@wizard.construction',
  'james.okafor@wizard.construction',
  'maria.gonzalez@wizard.construction',
  'zach@unicorn.love'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Welding community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000006'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '12 days')
FROM auth.users au
WHERE au.email IN (
  'derek.johnson@wizard.construction',
  'carlos.gutierrez@example.test',
  'jake.hendricks@example.test'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Landscaping community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000010'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '5 days')
FROM auth.users au
WHERE au.email IN (
  'carlos.gutierrez@example.test',
  'maria.gonzalez@wizard.construction',
  'brian.carter@wizard.construction',
  'clay@unicorn.love'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Painting community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000008'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '9 days')
FROM auth.users au
WHERE au.email IN (
  'ron.mitchell@wizard.construction',
  'sarah.mitchell@wizard.construction',
  'clay@unicorn.love'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Roofing community members
INSERT INTO community.memberships (community_id, user_id, is_verified, verification_data)
SELECT
  'a0000000-0000-4000-8000-000000000009'::uuid,
  au.id, true,
  jsonb_build_object('state', 'MI', 'verified_at', NOW() - INTERVAL '8 days')
FROM auth.users au
WHERE au.email IN (
  'derek.johnson@wizard.construction',
  'james.okafor@wizard.construction',
  'brian.carter@wizard.construction'
)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- =========================================================
-- 2. POSTS — Electrical community
-- =========================================================

-- Jake Hendricks — showcase: Panel upgrade
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100001-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000002'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  '200A panel upgrade — Federal Pacific swap-out',
  E'Finally got this one done. Homeowner had a Federal Pacific Stab-Lok from 1978 that was showing signs of arcing. Swapped it for a Square D Homeline 200A with whole-home surge protection.\n\nThe old panel had double-tapped breakers everywhere and aluminum branch circuits with no anti-oxidant compound. Spent an extra day re-terminating everything properly.\n\nAlways satisfying to make a home safer. If you still see FPE panels on jobs, flag them immediately — those things are a fire waiting to happen.',
  ARRAY['https://storage.example.com/community/jake-panel-before.jpg', 'https://storage.example.com/community/jake-panel-after.jpg'],
  ARRAY['https://storage.example.com/community/jake-panel-before-thumb.jpg', 'https://storage.example.com/community/jake-panel-after-thumb.jpg'],
  true, NOW() - INTERVAL '6 days', 18, 3,
  NOW() - INTERVAL '6 days'
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (id) DO NOTHING;

-- Tyler Brooks — advice: NEC code changes
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100002-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000002'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'How are you all handling the 2026 NEC GFCI requirements?',
  E'My local just updated to the 2026 NEC and the expanded GFCI requirements are catching everyone off guard. Now required in laundry areas, basements (not just unfinished), and all kitchen circuits — not just countertop.\n\nWe''re burning through GFCI breakers at twice the rate. Any tips on managing cost with customers who don''t want to pay the difference? I''ve been explaining the safety angle but some pushback on the price jump.',
  false, NOW() - INTERVAL '4 days', 11, 2,
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'tyler.brooks@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Ron Mitchell — showcase: Commercial conduit run
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, created_at
)
SELECT
  'f1100003-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000002'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Clean conduit rack — 400ft run, zero splices',
  E'We pulled this 400-foot conduit rack on a warehouse fit-out last week. 2-inch rigid with 90s at every turn. The GC wanted everything exposed and painted so it had to be perfect.\n\nSecret weapon: laser level for the strut channel layout. Made everything dead straight. Inspector walked through and didn''t pull a single cover.',
  ARRAY['https://storage.example.com/community/ron-conduit-rack.jpg'],
  ARRAY['https://storage.example.com/community/ron-conduit-rack-thumb.jpg'],
  true, NOW() - INTERVAL '2 days', 22,
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 3. POSTS — Plumbing community
-- =========================================================

-- Marcus Rivera — showcase: Boiler room re-pipe
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100004-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000003'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Boiler room re-pipe — 6-inch copper to PEX transition',
  E'Just finished a complete boiler room re-pipe on a 1960s apartment building in Grand Rapids. The existing 6-inch copper mains were shot — pinhole leaks everywhere from decades of hard water.\n\nWe transitioned to 2-inch PEX-A for the distribution lines with ProPress fittings at the boiler connections. Cut install time by 40% compared to sweating every joint.\n\nThe hardest part was working around the asbestos-wrapped pipes — had to bring in an abatement crew before we could touch anything. Planning ahead saved us a week of downtime.',
  ARRAY['https://storage.example.com/community/marcus-boiler-room.jpg', 'https://storage.example.com/community/marcus-pex-transition.jpg'],
  ARRAY['https://storage.example.com/community/marcus-boiler-room-thumb.jpg', 'https://storage.example.com/community/marcus-pex-transition-thumb.jpg'],
  true, NOW() - INTERVAL '8 days', 14, 2,
  NOW() - INTERVAL '8 days'
FROM auth.users au WHERE au.email = 'marcus.rivera@example.test'
ON CONFLICT (id) DO NOTHING;

-- James Okafor — advice: Backflow preventer spec
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100005-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000003'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'Backflow preventer specs — RPZ vs DCVA for commercial?',
  E'We''re bidding a new medical office build and the spec calls for RPZ assemblies on every domestic water connection. The mechanical engineer insists on RPZ even for the landscape irrigation tie-in.\n\nIn my experience, a DCVA would be fine for irrigation (low hazard) and would save the owner about $2K per assembly. Anyone have experience pushing back on over-spec''d backflow requirements? Or is the engineer right to go RPZ across the board for a medical facility?',
  false, NOW() - INTERVAL '5 days', 7, 3,
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'james.okafor@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Zach — advice: PEX vs copper debate
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100006-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000003'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'PEX-A vs PEX-B — is the cost difference worth it?',
  E'We''re spec''ing a 120-unit apartment complex and trying to decide between PEX-A (Uponor) and PEX-B (Viega) for the domestic water distribution.\n\nPEX-A is about 30% more expensive on material but the expansion fittings are arguably more reliable. PEX-B with crimp rings is faster for our crew since that''s what they''re used to.\n\nWhat are you all running on large multifamily jobs? Any warranty issues with either?',
  false, NOW() - INTERVAL '3 days', 9, 2,
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'zach@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 4. POSTS — Carpentry community
-- =========================================================

-- Carlos Gutierrez — showcase: Custom staircase
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100007-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000005'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Custom white oak staircase — floating treads with hidden steel',
  E'This one took 3 weeks from template to install. Client wanted a floating staircase with white oak treads and no visible supports. We used a hidden steel stringer welded to the wall plate with each tread bolted through the drywall.\n\nThe finish is Rubio Monocoat Pure — one coat, natural look. Every tread was hand-selected for grain match. The hardest part was getting the spacing perfect — code requires 7-3/4" max rise and we hit 7-11/16" on the nose.\n\nMost satisfying build of the year so far.',
  ARRAY['https://storage.example.com/community/carlos-staircase-side.jpg', 'https://storage.example.com/community/carlos-staircase-detail.jpg'],
  ARRAY['https://storage.example.com/community/carlos-staircase-side-thumb.jpg', 'https://storage.example.com/community/carlos-staircase-detail-thumb.jpg'],
  true, NOW() - INTERVAL '7 days', 31, 4,
  NOW() - INTERVAL '7 days'
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (id) DO NOTHING;

-- Derek Johnson — showcase: Timber frame
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, created_at
)
SELECT
  'f1100008-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000005'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Timber frame pavilion — Douglas fir, traditional joinery',
  E'Built this pavilion for a lakeside property up near Traverse City. All Douglas fir timbers with traditional mortise-and-tenon joinery — no metal connectors visible. The king post truss spans 24 feet.\n\nWe pre-cut everything in the shop and assembled on site in 2 days with a crew of 4 and a small crane. The client wanted it to look like it had been there for 100 years. Mission accomplished.',
  ARRAY['https://storage.example.com/community/derek-timber-frame.jpg'],
  ARRAY['https://storage.example.com/community/derek-timber-frame-thumb.jpg'],
  true, NOW() - INTERVAL '4 days', 27,
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Brian Carter — advice: Framing lumber quality
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100009-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000005'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'Anyone else seeing terrible lumber quality this season?',
  E'We''re getting SPF framing lumber from our regular supplier and the quality has fallen off a cliff. Crowns everywhere, bark edges, and the moisture content is way too high — we''re seeing 25%+ on the meter when it should be 19% or below.\n\nLast week we had to reject an entire unit of 2x10s. That''s a $3,800 load we sent back. Are other GCs experiencing this? Wondering if it''s a regional supply issue or industry-wide.\n\nConsidering switching to engineered lumber for floor systems (TJIs) even though the material cost is higher. At least the quality is consistent.',
  false, NOW() - INTERVAL '1 day', 16, 3,
  NOW() - INTERVAL '1 day'
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 5. POSTS — HVAC community
-- =========================================================

-- Ron Mitchell — showcase: Mini-split install
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100010-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000004'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Multi-zone mini-split — 5 heads, 1 condenser, clean line sets',
  E'Finished this 5-zone Mitsubishi Hyper Heat install in a 1920s bungalow that had no ductwork. Client didn''t want to tear open walls for ducts so mini-splits were the only option.\n\nRan all line sets through the basement and up interior walls to keep the exterior clean. Used line hide covers on the 15-foot outdoor run to the condenser. Each zone has its own thermostat tied into the kumo cloud controller.\n\nThe Hyper Heat units will handle -13°F so the client could ditch the old boiler completely. Estimated savings: $2,400/year on heating alone.',
  ARRAY['https://storage.example.com/community/ron-minisplit-interior.jpg', 'https://storage.example.com/community/ron-minisplit-exterior.jpg'],
  ARRAY['https://storage.example.com/community/ron-minisplit-interior-thumb.jpg', 'https://storage.example.com/community/ron-minisplit-exterior-thumb.jpg'],
  true, NOW() - INTERVAL '3 days', 19, 2,
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Maria Gonzalez — advice: Heat pump sizing
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100011-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000004'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'Manual J vs rule-of-thumb for heat pump sizing?',
  E'I''m estimating a 2,800 sqft new construction and the HVAC sub gave me a quote based on "600 sqft per ton" rule of thumb — so a 5-ton system.\n\nI ran a Manual J calc and got 3.5 tons. That''s a massive difference in equipment cost and the oversized unit will short-cycle.\n\nDo you all require Manual J calcs from your HVAC subs on every job? Or is there a middle ground? Trying to balance accuracy with not adding another $500 to the bid for engineering.',
  false, NOW() - INTERVAL '2 days', 13, 2,
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'maria.gonzalez@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 6. POSTS — Welding community
-- =========================================================

-- Derek Johnson — showcase: Structural steel
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, created_at
)
SELECT
  'f1100012-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000006'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'CJP welds on W14x90 moment connections — ultrasonic tested, zero defects',
  E'Just got the UT results back on our moment frame connections for the Detroit Metro project. 47 complete joint penetration welds, zero rejections. \n\nAll done with FCAW-G (flux-core gas-shielded) on A992 steel. Preheat to 250°F per AWS D1.1 and interpass temp held below 600°F.\n\nThe key is prep — every joint got a 45° bevel with a 1/4" root opening and backing bar. No shortcuts on structural. These connections are what keep the building standing in a seismic event.',
  ARRAY['https://storage.example.com/community/derek-cjp-weld.jpg'],
  ARRAY['https://storage.example.com/community/derek-cjp-weld-thumb.jpg'],
  true, NOW() - INTERVAL '9 days', 24,
  NOW() - INTERVAL '9 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Carlos Gutierrez — critique: Weld bead practice
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100013-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000006'::uuid,
  au.id, 'critique'::community.post_type, 'published'::community.post_status,
  'Critique my TIG beads — practicing stainless for a food-grade job',
  E'I''ve been practicing TIG on 304 stainless for an upcoming food processing facility. Need sanitary welds with full penetration and smooth crowns — no undercut or porosity allowed.\n\nRunning 1/8" ER308L filler, 80-90 amps on 3/32" tungsten. Argon at 20 CFH with a trailing shield.\n\nI feel like my dime spacing is inconsistent. Any tips on maintaining rhythm? Also — do you walk the cup or freehand on pipe?',
  ARRAY['https://storage.example.com/community/carlos-tig-beads.jpg'],
  ARRAY['https://storage.example.com/community/carlos-tig-beads-thumb.jpg'],
  true, NOW() - INTERVAL '3 days', 10, 2,
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 7. POSTS — Landscaping community
-- =========================================================

-- Clay — showcase: Outdoor living space
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100014-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000010'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Complete outdoor living space — paver patio, fire pit, retaining wall',
  E'Wrapped up this backyard transformation last week. Client wanted a full outdoor living space on a sloped lot, so we built a 600 sqft Unilock Beacon Hill paver patio with a 3-foot Versa-Lok retaining wall to level the area.\n\nThe fire pit is natural gas with a 42" Belgard round kit. Added low-voltage landscape lighting throughout — 12 path lights and 6 up-lights on the mature oaks.\n\nTotal project was 3 weeks from demo to final walkthrough. The before/after on this one is dramatic.',
  ARRAY['https://storage.example.com/community/clay-patio-overview.jpg', 'https://storage.example.com/community/clay-firepit-night.jpg'],
  ARRAY['https://storage.example.com/community/clay-patio-overview-thumb.jpg', 'https://storage.example.com/community/clay-firepit-night-thumb.jpg'],
  true, NOW() - INTERVAL '5 days', 25, 3,
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- Maria Gonzalez — advice: Drainage solutions
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  is_published, published_at, upvote_count, comment_count, created_at
)
SELECT
  'f1100015-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000010'::uuid,
  au.id, 'advice'::community.post_type, 'published'::community.post_status,
  'French drain vs channel drain for paver patio runoff?',
  E'We''re designing a 900 sqft paver patio that abuts the foundation. The lot slopes toward the house so we need serious drainage.\n\nDebating between a perimeter French drain (6" perf pipe in gravel with filter fabric) or a surface channel drain (Zurn Z886) along the house side.\n\nThe French drain is cheaper but I''m worried about long-term maintenance — once that filter fabric silts up, you''re tearing everything out. The channel drain is exposed but easy to clean.\n\nWhat''s your go-to for patio drainage against a foundation?',
  false, NOW() - INTERVAL '1 day', 8, 2,
  NOW() - INTERVAL '1 day'
FROM auth.users au WHERE au.email = 'maria.gonzalez@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 8. POSTS — Painting community
-- =========================================================

-- Ron Mitchell — showcase: Cabinet refinish
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, created_at
)
SELECT
  'f1100016-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000008'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Kitchen cabinet refinish — oak to SW Alabaster, HVLP sprayed',
  E'Transformed these 1990s honey oak cabinets without replacing them. Full process:\n\n1. Degloss with liquid sander (Krudd Kutter)\n2. Fill grain with Aqua Coat grain filler (2 coats, sand between)\n3. Prime with Stix bonding primer (2 coats)\n4. Topcoat: Sherwin-Williams Emerald Urethane in Alabaster, sprayed with Graco FinishPro HVLP\n\nThe grain filler is the step most people skip and it makes all the difference. Without it, you''ll see oak grain texture through the paint forever.\n\nTotal cost for a 25-door kitchen: about $1,800 in materials. Client saved $15K vs replacement.',
  ARRAY['https://storage.example.com/community/ron-cabinets-before.jpg', 'https://storage.example.com/community/ron-cabinets-after.jpg'],
  ARRAY['https://storage.example.com/community/ron-cabinets-before-thumb.jpg', 'https://storage.example.com/community/ron-cabinets-after-thumb.jpg'],
  true, NOW() - INTERVAL '6 days', 20,
  NOW() - INTERVAL '6 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 9. POSTS — Roofing community
-- =========================================================

-- James Okafor — showcase: Standing seam
INSERT INTO community.posts (
  id, community_id, author_id, post_type, status, title, body,
  media_urls, media_thumbnails, is_published, published_at,
  upvote_count, comment_count, created_at
)
SELECT
  'f1100017-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-4000-8000-000000000009'::uuid,
  au.id, 'showcase'::community.post_type, 'published'::community.post_status,
  'Standing seam metal roof — 24 gauge Kynar, 6 valleys, zero leaks',
  E'Completed a full tear-off and standing seam install on a 3,200 sqft colonial with a complex roofline — 6 valleys, 3 dormers, and a cupola. 24-gauge steel with Kynar 500 finish in Charcoal Gray.\n\nThe valleys were the challenge. We used W-valley pans with hemmed edges instead of open valleys. Took longer but the water channeling is bulletproof.\n\nInstalled 50-year snow guards on all eave sections. This roof should outlast the house. 4-man crew, 8 working days from tear-off to final trim.',
  ARRAY['https://storage.example.com/community/james-standing-seam.jpg'],
  ARRAY['https://storage.example.com/community/james-standing-seam-thumb.jpg'],
  true, NOW() - INTERVAL '4 days', 17, 2,
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'james.okafor@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 10. COMMENTS
-- =========================================================

-- Comments on Jake's panel upgrade (Electrical)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100001-0000-4000-8000-000000000001'::uuid,
  'f1100001-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Nice work. We pulled 3 FPE panels last month alone. The scary part is how many homeowners have no idea their panel is a fire hazard. Have you tried using the Eaton BR series? Similar price point to the Homeline but the bus bar design is beefier.',
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'tyler.brooks@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100002-0000-4000-8000-000000000001'::uuid,
  'f1100001-0000-4000-8000-000000000001'::uuid,
  au.id,
  'That aluminum re-termination work is critical. I always add Noalox to every aluminum connection and torque to spec with a calibrated wrench. One loose connection on aluminum and you''re looking at a house fire. Good call flagging FPE panels — those should all be replaced.',
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100003-0000-4000-8000-000000000001'::uuid,
  'f1100001-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Clean install. What did you use for the whole-home surge? I''ve been speccing the Eaton CHSPT2ULTRA — about $90 but gives peace of mind on the whole panel.',
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Tyler's NEC question (Electrical)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100004-0000-4000-8000-000000000001'::uuid,
  'f1100002-0000-4000-8000-000000000001'::uuid,
  au.id,
  'We switched to GFCI breakers instead of GFCI receptacles for everything except kitchens. The breaker approach is actually cheaper when you factor in labor — one device at the panel vs running to each outlet location. Customers don''t see the difference and it passes inspection every time.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100005-0000-4000-8000-000000000001'::uuid,
  'f1100002-0000-4000-8000-000000000001'::uuid,
  au.id,
  'I show customers the CPSC data on electrocution deaths before and after GFCI adoption. The numbers speak for themselves. Once they understand it''s a life-safety issue, price objections usually disappear. Also helps to include it in the base quote rather than as an add-on.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Marcus's boiler room (Plumbing)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100006-0000-4000-8000-000000000001'::uuid,
  'f1100004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'ProPress on the boiler connections is the move. We used to sweat everything but on a re-pipe where the system is down and tenants are waiting, speed matters. What brand PEX-A did you use? We''ve been happy with Uponor for multi-family.',
  NOW() - INTERVAL '7 days'
FROM auth.users au WHERE au.email = 'zach@unicorn.love'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100007-0000-4000-8000-000000000001'::uuid,
  'f1100004-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Smart to plan for the asbestos abatement upfront. I''ve seen jobs blow their budget because they hit asbestos pipe wrap and didn''t have abatement in the original scope. On older buildings like that, always include a contingency for environmental.',
  NOW() - INTERVAL '7 days'
FROM auth.users au WHERE au.email = 'james.okafor@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on James's backflow question (Plumbing)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100008-0000-4000-8000-000000000001'::uuid,
  'f1100005-0000-4000-8000-000000000001'::uuid,
  au.id,
  'For a medical facility, the engineer is right — go RPZ across the board. The liability if a DCVA fails and you get backflow contamination in a medical building is not worth the $2K savings. Plus most health departments will require it anyway during plan review.',
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'marcus.rivera@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100009-0000-4000-8000-000000000001'::uuid,
  'f1100005-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Agreed with Marcus. Medical is high hazard by definition — RPZ is the right call even for irrigation. The annual testing cost is minimal and it protects everyone. We spec RPZ on anything healthcare-related, no exceptions.',
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'sarah.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100010-0000-4000-8000-000000000001'::uuid,
  'f1100005-0000-4000-8000-000000000001'::uuid,
  au.id,
  'One thing to consider — RPZ assemblies discharge water when they activate. Make sure you have a proper drain for each one, especially interior installations. I''ve seen RPZs dump 50 gallons on a mechanical room floor because nobody planned for the relief port.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'zach@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- Comments on Zach's PEX question (Plumbing)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100011-0000-4000-8000-000000000001'::uuid,
  'f1100006-0000-4000-8000-000000000001'::uuid,
  au.id,
  'We run PEX-A (Uponor) on everything multifamily now. The expansion fittings have zero flow restriction — full port. On a 120-unit building, that pressure drop adds up with crimp fittings. The material premium pays for itself in fewer complaints about low water pressure on upper floors.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'marcus.rivera@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100012-0000-4000-8000-000000000001'::uuid,
  'f1100006-0000-4000-8000-000000000001'::uuid,
  au.id,
  'We''ve done both. PEX-B crimp is fine for small projects but on 100+ units, go PEX-A. The expansion tool is more forgiving in tight spaces and if a fitting leaks during pressure test, you can re-expand it. With crimp rings, you''re cutting and starting over. Time savings on rework alone justifies the cost.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (id) DO NOTHING;

-- Comments on Carlos's staircase (Carpentry)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100013-0000-4000-8000-000000000001'::uuid,
  'f1100007-0000-4000-8000-000000000001'::uuid,
  au.id,
  'That Rubio finish is gorgeous on white oak. Did you fumigate the wood first for that darker tone, or is that the natural color? We''ve been experimenting with ammonia fuming on white oak and the results are incredible.',
  NOW() - INTERVAL '6 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100014-0000-4000-8000-000000000001'::uuid,
  'f1100007-0000-4000-8000-000000000001'::uuid,
  au.id,
  'How did you handle the steel-to-wood connection at each tread? We did a similar floating stair last year and used threaded rod with epoxy into the steel stringer. Worked great but alignment was critical — any rotation and the tread wasn''t level.',
  NOW() - INTERVAL '6 days'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100015-0000-4000-8000-000000000001'::uuid,
  'f1100007-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Beautiful work Carlos. That grain matching on the treads is what separates craftsmen from carpenters. How did you source the white oak? We''ve been having trouble finding wide, clear boards locally.',
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100016-0000-4000-8000-000000000001'::uuid,
  'f1100007-0000-4000-8000-000000000001'::uuid,
  au.id,
  '7-11/16" rise — cutting it close! We always try to land at 7-1/2" or below to give ourselves a buffer for finish floor thickness changes. Great build though, the hidden steel approach is the way to go for that clean look.',
  NOW() - INTERVAL '5 days'
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Brian's lumber quality (Carpentry)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100017-0000-4000-8000-000000000001'::uuid,
  'f1100009-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Same here in Lansing. We''ve been getting terrible 2x material all winter. Switched to ordering from a different mill (Weyerhaeuser instead of Canfor) and the quality improved. Also started kiln-dried only — costs a bit more but you don''t get the shrinkage callbacks.',
  NOW() - INTERVAL '20 hours'
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100018-0000-4000-8000-000000000001'::uuid,
  'f1100009-0000-4000-8000-000000000001'::uuid,
  au.id,
  'TJIs are 100% worth it for floor systems. The consistency alone saves time — no crowning, no culling, no callbacks for squeaky floors. We switched two years ago and never looked back. The upfront cost is offset by labor savings and zero warranty issues.',
  NOW() - INTERVAL '18 hours'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100019-0000-4000-8000-000000000001'::uuid,
  'f1100009-0000-4000-8000-000000000001'::uuid,
  au.id,
  'It''s industry-wide. The mills ramped up production during the post-COVID boom and quality control suffered. Now demand has cooled but they''re still pushing the same lower-grade stock. My advice: inspect every load before it comes off the truck and reject immediately. Don''t let the delivery driver pressure you into accepting.',
  NOW() - INTERVAL '16 hours'
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- Comments on Ron's mini-split (HVAC)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100020-0000-4000-8000-000000000001'::uuid,
  'f1100010-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Great work hiding those line sets. The line hide covers make such a difference on the exterior — nothing worse than a beautiful house with copper lines running down the siding. What''s the total BTU capacity on the outdoor unit? 5 zones usually needs at least 42K BTU.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'james.okafor@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100021-0000-4000-8000-000000000001'::uuid,
  'f1100010-0000-4000-8000-000000000001'::uuid,
  au.id,
  'The Hyper Heat units are a game changer for cold climates. We installed the same system in a Victorian in Troy and the owner''s heating bill dropped from $380/month to $140. The kumo cloud integration is nice for monitoring but make sure you set up the maintenance reminders — filter cleaning on ceiling cassettes is easy to forget.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'maria.gonzalez@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Maria's heat pump sizing (HVAC)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100022-0000-4000-8000-000000000001'::uuid,
  'f1100011-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Always Manual J. The "rule of thumb" is how you end up with oversized equipment that short-cycles, doesn''t dehumidify, and wears out early. A proper Manual J takes an hour and saves thousands in equipment and callbacks. We require it on every job — no exceptions.',
  NOW() - INTERVAL '1 day'
FROM auth.users au WHERE au.email = 'ron.mitchell@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100023-0000-4000-8000-000000000001'::uuid,
  'f1100011-0000-4000-8000-000000000001'::uuid,
  au.id,
  'If you want a middle ground, use Wrightsoft or CoolCalc — they do a Manual J in about 30 minutes once you have the floor plan. Way faster than hand calculations and most jurisdictions accept the printout as documentation. The $500 for engineering is nothing compared to a $12K equipment swap when the system doesn''t perform.',
  NOW() - INTERVAL '1 day'
FROM auth.users au WHERE au.email = 'zach@unicorn.love'
ON CONFLICT (id) DO NOTHING;

-- Comments on Carlos's TIG beads (Welding)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100024-0000-4000-8000-000000000001'::uuid,
  'f1100013-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Your settings sound right for that thickness. For consistent dime spacing, try using a metronome app — seriously. Set it to 60 BPM and dab on every beat. After a few hours of practice, the rhythm becomes muscle memory. On pipe, I walk the cup for anything 2" and above, freehand for smaller.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100025-0000-4000-8000-000000000001'::uuid,
  'f1100013-0000-4000-8000-000000000001'::uuid,
  au.id,
  'For food-grade stainless, the inside of the weld matters more than the outside. Make sure you''re purging with argon on the backside — any oxidation (sugaring) on the interior surface will fail sanitary inspection. Use a purge dam and keep argon flowing until the weld cools below 300°F.',
  NOW() - INTERVAL '2 days'
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (id) DO NOTHING;

-- Comments on Clay's outdoor living space (Landscaping)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100026-0000-4000-8000-000000000001'::uuid,
  'f1100014-0000-4000-8000-000000000001'::uuid,
  au.id,
  'That Beacon Hill pattern looks great with the fire pit. Did you use polymeric sand or regular joint sand? We switched to Techniseal HP Nextgel and it''s been bulletproof — no washout even after heavy rain.',
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100027-0000-4000-8000-000000000001'::uuid,
  'f1100014-0000-4000-8000-000000000001'::uuid,
  au.id,
  'The retaining wall on the slope is the right call. How deep did you go on the base? We usually do 6" of compacted 21-A gravel for walls under 4 feet. Also — did you use geogrid on the Versa-Lok or was it short enough to skip?',
  NOW() - INTERVAL '4 days'
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100028-0000-4000-8000-000000000001'::uuid,
  'f1100014-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Love the low-voltage lighting choice. We''ve been using the WAC Landscape LED fixtures and the color temperature is perfect — 2700K warm white. How did you run the wire? We usually trench alongside the paver edge restraint to keep it protected.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'maria.gonzalez@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on Maria's drainage question (Landscaping)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100029-0000-4000-8000-000000000001'::uuid,
  'f1100015-0000-4000-8000-000000000001'::uuid,
  au.id,
  'Channel drain every time against a foundation. French drains work great in open areas but next to a building, you want to intercept surface water before it gets to the foundation, not collect it underground next to the footing. The Zurn Z886 is a solid choice — we use it on most of our commercial patio projects.',
  NOW() - INTERVAL '20 hours'
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100030-0000-4000-8000-000000000001'::uuid,
  'f1100015-0000-4000-8000-000000000001'::uuid,
  au.id,
  'We do both — channel drain at the foundation line to catch surface water, then a French drain at the patio perimeter to handle anything that gets through the pavers. Belt and suspenders approach, but on a lot that slopes toward the house, you don''t want to take chances with water management.',
  NOW() - INTERVAL '18 hours'
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- Comments on James's standing seam (Roofing)
INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100031-0000-4000-8000-000000000001'::uuid,
  'f1100017-0000-4000-8000-000000000001'::uuid,
  au.id,
  'W-valley pans are the way to go on standing seam. Open valleys look wrong on metal roofs and they''re leak-prone at the transition. What seamer did you use? We''ve got the Swenson snaplock machine and it does great work but struggling with the double-lock profiles.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (id) DO NOTHING;

INSERT INTO community.comments (id, post_id, author_id, body, created_at)
SELECT
  'f2100032-0000-4000-8000-000000000001'::uuid,
  'f1100017-0000-4000-8000-000000000001'::uuid,
  au.id,
  '8 days for that complexity is impressive. We did a similar roofline last fall and it took us 12 days. The dormers always eat up time — so many flashing details. Kynar 500 is the only finish I''ll spec on standing seam. The 30-year color warranty is worth the premium over SMP paint.',
  NOW() - INTERVAL '3 days'
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 11. POST RATINGS (on showcase/critique posts)
-- =========================================================

-- Ratings on Carlos's staircase
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100007-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5, 5
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100007-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 4, 5
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100007-0000-4000-8000-000000000001'::uuid, au.id, 4, 4, 5, 4
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- Ratings on Derek's timber frame
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100008-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5, 4
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100008-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5, 5
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- Ratings on Derek's CJP welds
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating)
SELECT 'f1100012-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating)
SELECT 'f1100012-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5
FROM auth.users au WHERE au.email = 'jake.hendricks@example.test'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- Ratings on Carlos's TIG beads (critique)
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating)
SELECT 'f1100013-0000-4000-8000-000000000001'::uuid, au.id, 3, 3, 3
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- Ratings on James's standing seam
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating)
SELECT 'f1100017-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 5
FROM auth.users au WHERE au.email = 'derek.johnson@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating)
SELECT 'f1100017-0000-4000-8000-000000000001'::uuid, au.id, 4, 4, 5
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- Ratings on Clay's outdoor living space
INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100014-0000-4000-8000-000000000001'::uuid, au.id, 5, 5, 4, 5
FROM auth.users au WHERE au.email = 'carlos.gutierrez@example.test'
ON CONFLICT (post_id, rater_id) DO NOTHING;

INSERT INTO community.post_ratings (post_id, rater_id, base_rating, quality_rating, technique_rating, creativity_rating)
SELECT 'f1100014-0000-4000-8000-000000000001'::uuid, au.id, 4, 4, 4, 5
FROM auth.users au WHERE au.email = 'brian.carter@wizard.construction'
ON CONFLICT (post_id, rater_id) DO NOTHING;

-- =========================================================
-- 12. UPVOTES (sample upvotes on popular posts)
-- =========================================================

-- Upvotes on Carlos's staircase (most popular)
INSERT INTO community.upvotes (user_id, target_type, target_id)
SELECT au.id, 'post', 'f1100007-0000-4000-8000-000000000001'::uuid
FROM auth.users au
WHERE au.email IN (
  'derek.johnson@wizard.construction',
  'clay@unicorn.love',
  'brian.carter@wizard.construction',
  'ron.mitchell@wizard.construction'
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Upvotes on Derek's timber frame
INSERT INTO community.upvotes (user_id, target_type, target_id)
SELECT au.id, 'post', 'f1100008-0000-4000-8000-000000000001'::uuid
FROM auth.users au
WHERE au.email IN (
  'carlos.gutierrez@example.test',
  'clay@unicorn.love',
  'brian.carter@wizard.construction'
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Upvotes on Clay's outdoor living space
INSERT INTO community.upvotes (user_id, target_type, target_id)
SELECT au.id, 'post', 'f1100014-0000-4000-8000-000000000001'::uuid
FROM auth.users au
WHERE au.email IN (
  'carlos.gutierrez@example.test',
  'brian.carter@wizard.construction',
  'maria.gonzalez@wizard.construction'
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Upvotes on Derek's CJP welds
INSERT INTO community.upvotes (user_id, target_type, target_id)
SELECT au.id, 'post', 'f1100012-0000-4000-8000-000000000001'::uuid
FROM auth.users au
WHERE au.email IN (
  'carlos.gutierrez@example.test',
  'jake.hendricks@example.test'
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- Upvotes on Ron's conduit rack
INSERT INTO community.upvotes (user_id, target_type, target_id)
SELECT au.id, 'post', 'f1100003-0000-4000-8000-000000000001'::uuid
FROM auth.users au
WHERE au.email IN (
  'jake.hendricks@example.test',
  'tyler.brooks@wizard.construction',
  'derek.johnson@wizard.construction'
)
ON CONFLICT (user_id, target_type, target_id) DO NOTHING;

-- =========================================================
-- 13. BOOKMARKS (users saving posts for reference)
-- =========================================================

-- Clay bookmarks several showcase posts
INSERT INTO community.bookmarks (user_id, post_id)
SELECT au.id, 'f1100007-0000-4000-8000-000000000001'::uuid -- Carlos's staircase
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (user_id, post_id) DO NOTHING;

INSERT INTO community.bookmarks (user_id, post_id)
SELECT au.id, 'f1100012-0000-4000-8000-000000000001'::uuid -- Derek's welds
FROM auth.users au WHERE au.email = 'clay@unicorn.love'
ON CONFLICT (user_id, post_id) DO NOTHING;

-- Tyler bookmarks electrical posts for learning
INSERT INTO community.bookmarks (user_id, post_id)
SELECT au.id, 'f1100001-0000-4000-8000-000000000001'::uuid -- Jake's panel upgrade
FROM auth.users au WHERE au.email = 'tyler.brooks@wizard.construction'
ON CONFLICT (user_id, post_id) DO NOTHING;

INSERT INTO community.bookmarks (user_id, post_id)
SELECT au.id, 'f1100003-0000-4000-8000-000000000001'::uuid -- Ron's conduit rack
FROM auth.users au WHERE au.email = 'tyler.brooks@wizard.construction'
ON CONFLICT (user_id, post_id) DO NOTHING;

-- =========================================================
-- 14. UPDATE DENORMALIZED COUNTS on communities
-- =========================================================

UPDATE community.communities SET
  member_count = (SELECT COUNT(*) FROM community.memberships WHERE community_id = communities.id),
  post_count = (SELECT COUNT(*) FROM community.posts WHERE community_id = communities.id AND status = 'published')
WHERE id IN (
  'a0000000-0000-4000-8000-000000000002', -- Electrical
  'a0000000-0000-4000-8000-000000000003', -- Plumbing
  'a0000000-0000-4000-8000-000000000004', -- HVAC
  'a0000000-0000-4000-8000-000000000005', -- Carpentry
  'a0000000-0000-4000-8000-000000000006', -- Welding
  'a0000000-0000-4000-8000-000000000008', -- Painting
  'a0000000-0000-4000-8000-000000000009', -- Roofing
  'a0000000-0000-4000-8000-000000000010'  -- Landscaping
);

-- Also update rating averages on rated posts
UPDATE community.posts SET
  rating_avg = sub.avg_rating,
  rating_count = sub.cnt
FROM (
  SELECT post_id, AVG(base_rating)::numeric(3,2) AS avg_rating, COUNT(*) AS cnt
  FROM community.post_ratings
  WHERE post_id IN (
    'f1100007-0000-4000-8000-000000000001',
    'f1100008-0000-4000-8000-000000000001',
    'f1100012-0000-4000-8000-000000000001',
    'f1100013-0000-4000-8000-000000000001',
    'f1100014-0000-4000-8000-000000000001',
    'f1100017-0000-4000-8000-000000000001'
  )
  GROUP BY post_id
) sub
WHERE posts.id = sub.post_id;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Depends on seeds 002, 005, 007, 008 (users) and migration 318 (communities)
-- 2. Adds memberships across 8 trade communities
-- 3. 17 posts total: 9 showcase, 2 critique, 6 advice
--    - Electrical: 3 posts (2 showcase, 1 advice)
--    - Plumbing: 3 posts (1 showcase, 2 advice)
--    - Carpentry: 3 posts (2 showcase, 1 advice)
--    - HVAC: 2 posts (1 showcase, 1 advice)
--    - Welding: 2 posts (1 showcase, 1 critique)
--    - Landscaping: 2 posts (1 showcase, 1 advice)
--    - Painting: 1 post (showcase)
--    - Roofing: 1 post (showcase)
-- 4. 32 comments with realistic trade discussion
-- 5. Post ratings on 6 showcase/critique posts
-- 6. Upvotes and bookmarks for engagement
-- 7. Denormalized counts updated at the end
-- 8. All inserts are idempotent (ON CONFLICT DO NOTHING)
-- =========================================================
