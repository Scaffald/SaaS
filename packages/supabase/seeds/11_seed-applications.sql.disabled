-- =========================================================
-- Applications Seed Data
-- Sample applications across different statuses for testing
-- =========================================================

BEGIN;

-- Seed applications with realistic data
WITH job_lookup AS (
  SELECT id, slug FROM public.jobs
  WHERE slug IN (
    'senior-project-manager-construction',
    'heavy-equipment-operator-manufacturing',
    'cdl-a-truck-driver-regional',
    'electrical-technician-renewable-energy'
  )
),
user_lookup AS (
  SELECT id, slug FROM public.users
  WHERE slug IN (
    'seeduser-1', 'seeduser-2', 'seeduser-3', 'seeduser-4',
    'seeduser-5', 'seeduser-6', 'seeduser-7', 'seeduser-8'
  )
),
application_data AS (
  SELECT * FROM (VALUES
    -- Recent pending applications (just submitted)
    ('seeduser-1', 'senior-project-manager-construction', 'pending', 2, 'I am very interested in this senior PM role. I have 12 years of experience managing large commercial projects with budgets exceeding $15M.', 'resumes/seeduser-1/pm-resume.pdf'),
    ('seeduser-2', 'heavy-equipment-operator-manufacturing', 'pending', 1, NULL, 'resumes/seeduser-2/operator-resume.pdf'),
    ('seeduser-8', 'electrical-technician-renewable-energy', 'pending', 3, 'Journeyman electrician with 6 years experience. Excited about renewable energy opportunities.', 'resumes/seeduser-8/elec-resume.pdf'),
    
    -- Applications under review
    ('seeduser-3', 'senior-project-manager-construction', 'reviewing', 8, 'With extensive experience in LEED-certified commercial construction, I believe I would be an excellent fit for this role.', 'resumes/seeduser-3/pm-resume-2.pdf'),
    ('seeduser-4', 'cdl-a-truck-driver-regional', 'reviewing', 12, NULL, 'resumes/seeduser-4/cdl-resume.pdf'),
    ('seeduser-5', 'heavy-equipment-operator-manufacturing', 'reviewing', 6, 'I have forklift certification and 4 years of warehouse experience at a high-volume facility.', NULL),
    
    -- Interview stage
    ('seeduser-6', 'cdl-a-truck-driver-regional', 'interview', 18, 'CDL-A driver with 3 years OTR experience and clean MVR. Looking for better work-life balance with regional routes.', 'resumes/seeduser-6/driver-resume.pdf'),
    ('seeduser-7', 'electrical-technician-renewable-energy', 'interview', 15, NULL, 'resumes/seeduser-7/electrician-resume.pdf'),
    
    -- Offer extended
    ('seeduser-1', 'heavy-equipment-operator-manufacturing', 'offer', 21, 'Experienced forklift operator seeking second shift position. Available to start immediately.', 'resumes/seeduser-1/warehouse-resume.pdf'),
    
    -- Successfully hired
    ('seeduser-2', 'cdl-a-truck-driver-regional', 'hired', 28, 'Regional CDL-A driver ready to join your team. Home every weekend is exactly what I am looking for.', 'resumes/seeduser-2/cdl-application.pdf'),
    
    -- Rejected applications
    ('seeduser-5', 'senior-project-manager-construction', 'rejected', 25, 'Interested in transitioning into project management from field operations.', 'resumes/seeduser-5/resume.pdf'),
    ('seeduser-3', 'electrical-technician-renewable-energy', 'rejected', 20, NULL, NULL),
    
    -- Withdrawn application
    ('seeduser-8', 'cdl-a-truck-driver-regional', 'withdrawn', 10, 'Experienced driver looking for regional opportunities.', 'resumes/seeduser-8/cdl-docs.pdf')
  ) AS t(user_slug, job_slug, status, days_ago, cover_letter, resume_path)
)
INSERT INTO public.applications (
  job_id,
  user_id,
  status,
  cover_letter,
  resume_path,
  notes,
  applied_at,
  updated_at
)
SELECT
  j.id,
  u.id,
  ad.status,
  ad.cover_letter,
  ad.resume_path,
  jsonb_build_object(
    'source', 'direct_application',
    'referral', CASE WHEN random() > 0.7 THEN true ELSE false END,
    'experience_years', floor(random() * 10 + 1)::int
  ),
  now() - (ad.days_ago || ' days')::interval,
  now() - (CASE 
    WHEN ad.status = 'pending' THEN ad.days_ago 
    ELSE (ad.days_ago - floor(random() * 3))::int 
  END || ' days')::interval
FROM application_data ad
JOIN job_lookup j ON j.slug = ad.job_slug
JOIN user_lookup u ON u.slug = ad.user_slug
ON CONFLICT (job_id, user_id) DO NOTHING;

COMMIT;
