-- =========================================================
-- ATS Demo Data Seed
-- Creates comprehensive demo data for testing ATS flow:
-- - 8 demo job postings across multiple organizations
-- - 18 candidate applications in various stages
-- - Application messages for communication tracking
-- =========================================================

BEGIN;

-- =========================================================
-- Step 1: Create Demo Job Postings
-- =========================================================

-- Job 1: Commercial Electrician at Barton Malow
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'barton-malow-company' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Commercial Electrician',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Seeking experienced commercial electrician for large-scale construction projects. Must have valid journeyman license and 5+ years experience. Responsibilities include installing electrical systems, troubleshooting, and ensuring code compliance.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Southfield, MI',
  jsonb_build_object(
    'street', '26500 American Drive',
    'city', 'Southfield',
    'state', 'MI',
    'zip', '48034',
    'country', 'USA',
    'latitude', 42.48849,
    'longitude', -83.30057
  ),
  ST_SetSRID(ST_MakePoint(-83.30057, 42.48849), 4326)::geography,
  6000000, -- $60,000
  8000000, -- $80,000
  'salary',
  NOW() - INTERVAL '10 days',
  NOW() + INTERVAL '30 days',
  'commercial-electrician-barton-malow'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 2: Licensed Plumber at Walbridge
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'walbridge' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Licensed Plumber',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Experienced licensed plumber needed for commercial and industrial projects. Must have master plumber license and experience with large-scale installations. Competitive pay and benefits package.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Detroit, MI',
  jsonb_build_object(
    'street', '777 Woodward Ave Ste 300',
    'city', 'Detroit',
    'state', 'MI',
    'zip', '48226',
    'country', 'USA',
    'latitude', 42.33127,
    'longitude', -83.04575
  ),
  ST_SetSRID(ST_MakePoint(-83.04575, 42.33127), 4326)::geography,
  5500000, -- $55,000
  7500000, -- $75,000
  'salary',
  NOW() - INTERVAL '8 days',
  NOW() + INTERVAL '45 days',
  'licensed-plumber-walbridge'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 3: Carpenter at JBS Contracting
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'jbs-contracting-inc' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Carpenter',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Skilled carpenter needed for framing, finish work, and custom installations. Must have 3+ years experience and own tools. Work on diverse commercial and residential projects.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Entry Level / Junior',
  'Mount Pleasant, MI',
  jsonb_build_object(
    'street', '1680 Gover Pkwy',
    'city', 'Mount Pleasant',
    'state', 'MI',
    'zip', '48858',
    'country', 'USA',
    'latitude', 43.58692,
    'longitude', -84.74399
  ),
  ST_SetSRID(ST_MakePoint(-84.74399, 43.58692), 4326)::geography,
  4500000, -- $45,000
  6500000, -- $65,000
  'salary',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '60 days',
  'carpenter-jbs-contracting'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 4: Construction Project Manager at Michigan General Contractors
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'michigan-general-contractors' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Construction Project Manager',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Lead construction projects from planning to completion. Manage budgets, timelines, and teams while ensuring quality and safety standards. Requires 7+ years experience and PMP certification preferred.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'hybrid',
  'Senior / Lead',
  'Troy, MI',
  jsonb_build_object(
    'street', '755 W Big Beaver Rd',
    'city', 'Troy',
    'state', 'MI',
    'zip', '48084',
    'country', 'USA',
    'latitude', 42.57438,
    'longitude', -83.14717
  ),
  ST_SetSRID(ST_MakePoint(-83.14717, 42.57438), 4326)::geography,
  8000000, -- $80,000
  11000000, -- $110,000
  'salary',
  NOW() - INTERVAL '12 days',
  NOW() + INTERVAL '50 days',
  'construction-project-manager-michigan-general'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 5: Site Supervisor at Blackstone Corporation
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'blackstone-corporation' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Site Supervisor',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Oversee daily operations on construction sites. Coordinate crews, ensure safety compliance, and maintain quality standards. Leadership experience required.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Rochester Hills, MI',
  jsonb_build_object(
    'street', '1878 Star Batt Dr',
    'city', 'Rochester Hills',
    'state', 'MI',
    'zip', '48309',
    'country', 'USA',
    'latitude', 42.676,
    'longitude', -83.1247
  ),
  ST_SetSRID(ST_MakePoint(-83.1247, 42.676), 4326)::geography,
  6500000, -- $65,000
  8500000, -- $85,000
  'salary',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '40 days',
  'site-supervisor-blackstone'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 6: HVAC Technician at Michigan Construction Company
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'michigan-construction-company' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'HVAC Technician',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Install, maintain, and repair HVAC systems in commercial and residential settings. EPA certification required. Competitive pay with overtime opportunities.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Davison, MI',
  jsonb_build_object(
    'street', '3390 N State Road, Suite C',
    'city', 'Davison',
    'state', 'MI',
    'zip', '48423',
    'country', 'USA',
    'latitude', 43.0261,
    'longitude', -83.4428
  ),
  ST_SetSRID(ST_MakePoint(-83.4428, 43.0261), 4326)::geography,
  5000000, -- $50,000
  7000000, -- $70,000
  'salary',
  NOW() - INTERVAL '6 days',
  NOW() + INTERVAL '55 days',
  'hvac-technician-michigan-construction'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 7: Heavy Equipment Operator at Barton Malow
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'barton-malow-company' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Heavy Equipment Operator',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Operate excavators, bulldozers, and other heavy machinery on construction sites. CDL license preferred. Must have 3+ years experience operating heavy equipment.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Entry Level / Junior',
  'Southfield, MI',
  jsonb_build_object(
    'street', '26500 American Drive',
    'city', 'Southfield',
    'state', 'MI',
    'zip', '48034',
    'country', 'USA',
    'latitude', 42.48849,
    'longitude', -83.30057
  ),
  ST_SetSRID(ST_MakePoint(-83.30057, 42.48849), 4326)::geography,
  4500000, -- $45,000
  6500000, -- $65,000
  'salary',
  NOW() - INTERVAL '4 days',
  NOW() + INTERVAL '35 days',
  'heavy-equipment-operator-barton-malow'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Job 8: Safety Coordinator at Walbridge
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'walbridge' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Safety Coordinator',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Develop and implement safety programs, conduct inspections, and ensure OSHA compliance. CSP or similar certification preferred. Make a difference in workplace safety.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Detroit, MI',
  jsonb_build_object(
    'street', '777 Woodward Ave Ste 300',
    'city', 'Detroit',
    'state', 'MI',
    'zip', '48226',
    'country', 'USA',
    'latitude', 42.33127,
    'longitude', -83.04575
  ),
  ST_SetSRID(ST_MakePoint(-83.04575, 42.33127), 4326)::geography,
  5500000, -- $55,000
  7500000, -- $75,000
  'salary',
  NOW() - INTERVAL '9 days',
  NOW() + INTERVAL '42 days',
  'safety-coordinator-walbridge'
FROM org_lookup o
CROSS JOIN user_lookup u
WHERE o.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Step 2: Create Candidate Applications
-- =========================================================

-- Applications for Commercial Electrician (Barton Malow)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'commercial-electrician-barton-malow' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email IN (
    'ewongagent@gmail.com',
    'bloxhambuilding@gmail.com',
    'davidcasinghino@gmail.com',
    'jacksoncefalo@gmail.com'
  ) LIMIT 4
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
  u.id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
FROM job_lookup j
CROSS JOIN (
  SELECT 
    u.id,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'new'
      WHEN 2 THEN 'screen'
      WHEN 3 THEN 'interview'
      WHEN 4 THEN 'offer'
    END as status,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/resumes/resume-1.pdf'
      WHEN 2 THEN 'https://storage.example.com/resumes/resume-2.pdf'
      WHEN 3 THEN 'https://storage.example.com/resumes/resume-3.pdf'
      WHEN 4 THEN 'https://storage.example.com/resumes/resume-4.pdf'
    END as resume_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NULL
      WHEN 2 THEN 'https://storage.example.com/cover-letters/cover-2.pdf'
      WHEN 3 THEN 'https://storage.example.com/cover-letters/cover-3.pdf'
      WHEN 4 THEN 'https://storage.example.com/cover-letters/cover-4.pdf'
    END as cover_letter_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NULL
      WHEN 2 THEN jsonb_build_object('question1', 'I have 6 years of commercial electrical experience.')
      WHEN 3 THEN jsonb_build_object('question1', 'I have 8 years of experience and hold a journeyman license.')
      WHEN 4 THEN jsonb_build_object('question1', 'I have 10 years of experience and am ready to start immediately.')
    END::jsonb as answers,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN false
      WHEN 2 THEN true
      WHEN 3 THEN true
      WHEN 4 THEN true
    END as is_shortlisted,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '2 days'
      WHEN 2 THEN NOW() - INTERVAL '1 day'
      WHEN 3 THEN NOW() - INTERVAL '12 hours'
      WHEN 4 THEN NOW() - INTERVAL '6 hours'
    END as stage_changed_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '2 days'
      WHEN 2 THEN NOW() - INTERVAL '1 day'
      WHEN 3 THEN NOW() - INTERVAL '1 day'
      WHEN 4 THEN NOW() - INTERVAL '1 day'
    END as created_at
  FROM user_lookup u
) u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Licensed Plumber (Walbridge)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'licensed-plumber-walbridge' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email IN (
    'pajapavlovic93@gmail.com',
    'rich@lighthouseconstruction.com',
    'dterry86@gmail.com',
    'stefano.sestito@yahoo.com'
  ) LIMIT 4
)
INSERT INTO core.applications (
  job_id,
  user_id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  rejected_at,
  reject_reasons,
  stage_changed_at,
  created_at
)
SELECT 
  j.id,
  u.id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  rejected_at,
  reject_reasons,
  stage_changed_at,
  created_at
FROM job_lookup j
CROSS JOIN (
  SELECT 
    u.id,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'new'
      WHEN 2 THEN 'screen'
      WHEN 3 THEN 'rejected'
      WHEN 4 THEN 'hired'
    END as status,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/resumes/resume-5.pdf'
      WHEN 2 THEN 'https://storage.example.com/resumes/resume-6.pdf'
      WHEN 3 THEN 'https://storage.example.com/resumes/resume-7.pdf'
      WHEN 4 THEN 'https://storage.example.com/resumes/resume-8.pdf'
    END as resume_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NULL
      WHEN 2 THEN NULL
      WHEN 3 THEN NULL
      WHEN 4 THEN 'https://storage.example.com/cover-letters/cover-8.pdf'
    END as cover_letter_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NULL
      WHEN 2 THEN jsonb_build_object('question1', 'I have 4 years of plumbing experience.')
      WHEN 3 THEN jsonb_build_object('question1', 'I have 2 years of experience.')
      WHEN 4 THEN jsonb_build_object('question1', 'I have 12 years of experience and master plumber license.')
    END::jsonb as answers,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN false
      WHEN 2 THEN true
      WHEN 3 THEN false
      WHEN 4 THEN true
    END as is_shortlisted,
    CASE (ROW_NUMBER() OVER ())
      WHEN 3 THEN NOW() - INTERVAL '8 hours'
      ELSE NULL
    END as rejected_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 3 THEN ARRAY['Insufficient experience', 'Missing required license']
      ELSE NULL
    END as reject_reasons,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '3 days'
      WHEN 2 THEN NOW() - INTERVAL '2 days'
      WHEN 3 THEN NOW() - INTERVAL '1 day'
      WHEN 4 THEN NOW() - INTERVAL '4 hours'
    END as stage_changed_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '3 days'
      WHEN 2 THEN NOW() - INTERVAL '2 days'
      WHEN 3 THEN NOW() - INTERVAL '1 day'
      WHEN 4 THEN NOW() - INTERVAL '2 days'
    END as created_at
  FROM user_lookup u
) u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Carpenter (JBS Contracting)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'carpenter-jbs-contracting' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email IN (
    'russell@andoverlandscape.com',
    'eavan@lighthouseconstruction.com',
    'jjwyz71@icloud.com'
  ) LIMIT 3
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
  u.id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
FROM job_lookup j
CROSS JOIN (
  SELECT 
    u.id,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'new'
      WHEN 2 THEN 'screen'
      WHEN 3 THEN 'interview'
    END as status,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/resumes/resume-9.pdf'
      WHEN 2 THEN 'https://storage.example.com/resumes/resume-10.pdf'
      WHEN 3 THEN 'https://storage.example.com/resumes/resume-11.pdf'
    END as resume_url,
    NULL as cover_letter_url,
    NULL::jsonb as answers,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN false
      WHEN 2 THEN true
      WHEN 3 THEN true
    END as is_shortlisted,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '1 day'
      WHEN 2 THEN NOW() - INTERVAL '18 hours'
      WHEN 3 THEN NOW() - INTERVAL '6 hours'
    END as stage_changed_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '1 day'
      WHEN 2 THEN NOW() - INTERVAL '1 day'
      WHEN 3 THEN NOW() - INTERVAL '1 day'
    END as created_at
  FROM user_lookup u
) u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Construction Project Manager (Michigan General Contractors)
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'construction-project-manager-michigan-general' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email IN (
    'joseph.attia@quantalytixgroup.com',
    'ogbewesy@gmail.com',
    'abdulfawad.azizi@gmail.com',
    'aaronpdasilva0@gmail.com'
  ) LIMIT 4
)
INSERT INTO core.applications (
  job_id,
  user_id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  rejected_at,
  reject_reasons,
  stage_changed_at,
  created_at
)
SELECT 
  j.id,
  u.id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  rejected_at,
  reject_reasons,
  stage_changed_at,
  created_at
FROM job_lookup j
CROSS JOIN (
  SELECT 
    u.id,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'screen'
      WHEN 2 THEN 'interview'
      WHEN 3 THEN 'rejected'
      WHEN 4 THEN 'withdrawn'
    END as status,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/resumes/resume-12.pdf'
      WHEN 2 THEN 'https://storage.example.com/resumes/resume-13.pdf'
      WHEN 3 THEN 'https://storage.example.com/resumes/resume-14.pdf'
      WHEN 4 THEN 'https://storage.example.com/resumes/resume-15.pdf'
    END as resume_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/cover-letters/cover-12.pdf'
      WHEN 2 THEN 'https://storage.example.com/cover-letters/cover-13.pdf'
      WHEN 3 THEN NULL
      WHEN 4 THEN NULL
    END as cover_letter_url,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN jsonb_build_object('question1', 'I have 8 years of project management experience.')
      WHEN 2 THEN jsonb_build_object('question1', 'I have 10 years of experience with PMP certification.')
      WHEN 3 THEN jsonb_build_object('question1', 'I have 5 years of experience.')
      WHEN 4 THEN NULL
    END::jsonb as answers,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN true
      WHEN 2 THEN true
      WHEN 3 THEN false
      WHEN 4 THEN false
    END as is_shortlisted,
    CASE (ROW_NUMBER() OVER ())
      WHEN 3 THEN NOW() - INTERVAL '12 hours'
      ELSE NULL
    END as rejected_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 3 THEN ARRAY['Does not meet minimum experience requirements']
      ELSE NULL
    END as reject_reasons,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '2 days'
      WHEN 2 THEN NOW() - INTERVAL '1 day'
      WHEN 3 THEN NOW() - INTERVAL '12 hours'
      WHEN 4 THEN NOW() - INTERVAL '1 day'
    END as stage_changed_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '2 days'
      WHEN 2 THEN NOW() - INTERVAL '2 days'
      WHEN 3 THEN NOW() - INTERVAL '1 day'
      WHEN 4 THEN NOW() - INTERVAL '1 day'
    END as created_at
  FROM user_lookup u
) u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Applications for Site Supervisor (Blackstone) - 2 applications
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'site-supervisor-blackstone' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email IN (
    'colinclong03@gmail.com',
    'shorgan0011@gmail.com'
  ) LIMIT 2
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
  u.id,
  status,
  resume_url,
  cover_letter_url,
  answers,
  is_shortlisted,
  stage_changed_at,
  created_at
FROM job_lookup j
CROSS JOIN (
  SELECT 
    u.id,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'new'
      WHEN 2 THEN 'screen'
    END as status,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN 'https://storage.example.com/resumes/resume-16.pdf'
      WHEN 2 THEN 'https://storage.example.com/resumes/resume-17.pdf'
    END as resume_url,
    NULL as cover_letter_url,
    NULL::jsonb as answers,
    false as is_shortlisted,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '1 day'
      WHEN 2 THEN NOW() - INTERVAL '18 hours'
    END as stage_changed_at,
    CASE (ROW_NUMBER() OVER ())
      WHEN 1 THEN NOW() - INTERVAL '1 day'
      WHEN 2 THEN NOW() - INTERVAL '1 day'
    END as created_at
  FROM user_lookup u
) u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- Application for HVAC Technician (Michigan Construction Company) - 1 application
WITH job_lookup AS (
  SELECT id FROM core.jobs WHERE slug = 'hvac-technician-michigan-construction' LIMIT 1
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'jordanelster10@gmail.com' LIMIT 1
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
  u.id,
  'stale',
  'https://storage.example.com/resumes/resume-18.pdf',
  NULL,
  NULL,
  false,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
FROM job_lookup j
CROSS JOIN user_lookup u
WHERE j.id IS NOT NULL AND u.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

-- =========================================================
-- Step 3: Create Application Messages
-- =========================================================

-- Messages for applications in interview/offer stages
WITH application_lookup AS (
  SELECT a.id, a.job_id, a.user_id, a.status, a.stage_changed_at
  FROM core.applications a
  JOIN core.jobs j ON j.id = a.job_id
  WHERE a.status IN ('interview', 'offer', 'screen')
  LIMIT 5
),
org_user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.application_messages (
  application_id,
  author_user_id,
  body,
  created_at
)
SELECT 
  a.id,
  o.id,
  CASE a.status
    WHEN 'screen' THEN 'Thank you for your application. We are currently reviewing your qualifications and will be in touch soon.'
    WHEN 'interview' THEN 'We would like to schedule an interview. Please let us know your availability for next week.'
    WHEN 'offer' THEN 'Congratulations! We are pleased to extend an offer. Please review the details and let us know if you have any questions.'
    ELSE 'Thank you for your interest in this position.'
  END,
  a.stage_changed_at + INTERVAL '1 hour'
FROM application_lookup a
CROSS JOIN org_user_lookup o
WHERE o.id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;

