-- =========================================================
-- 005_domain_seed.sql — Seed domain tables with realistic data
-- Populates organizations, teams, skills, jobs, connections, etc.
-- =========================================================

begin;

-- =========================================================
-- 1) Skills Taxonomy (expanded from existing skill_bank)
-- =========================================================

-- Insert comprehensive skills taxonomy
with skill_categories as (
  select * from (values
    -- Construction & Building
    ('carpentry', 'construction', null),
    ('framing', 'construction', 'carpentry'),
    ('drywall', 'construction', 'carpentry'),
    ('roofing', 'construction', null),
    ('concrete', 'construction', null),
    ('masonry', 'construction', 'concrete'),
    ('flooring', 'construction', 'carpentry'),
    ('insulation', 'construction', null),
    
    -- Electrical & HVAC
    ('electrical', 'construction', null),
    ('hvac', 'construction', null),
    ('plumbing', 'construction', null),
    ('solar-installation', 'construction', 'electrical'),
    ('electrical-troubleshooting', 'construction', 'electrical'),
    
    -- Manufacturing & Industrial
    ('welding', 'manufacturing', null),
    ('machining', 'manufacturing', null),
    ('cnc-operating', 'manufacturing', 'machining'),
    ('quality-control', 'manufacturing', null),
    ('assembly', 'manufacturing', null),
    ('fabrication', 'manufacturing', 'welding'),
    ('tool-and-die', 'manufacturing', 'machining'),
    
    -- Safety & Certifications
    ('osha-30', 'safety', null),
    ('osha-10', 'safety', null),
    ('first-aid', 'safety', null),
    ('cpr', 'safety', null),
    ('confined-space', 'safety', null),
    ('fall-protection', 'safety', null),
    
    -- Equipment & Vehicles
    ('forklift', 'equipment', null),
    ('crane-operating', 'equipment', null),
    ('excavator', 'equipment', null),
    ('backhoe', 'equipment', null),
    ('truck-driving', 'equipment', null),
    ('cdl', 'equipment', 'truck-driving'),
    
    -- Technical & Design
    ('cad', 'technical', null),
    ('blueprints', 'technical', null),
    ('estimating', 'technical', null),
    ('project-management', 'technical', null),
    ('autocad', 'technical', 'cad'),
    ('solidworks', 'technical', 'cad'),
    ('sketchup', 'technical', 'cad'),
    
    -- Soft Skills
    ('leadership', 'soft-skills', null),
    ('teamwork', 'soft-skills', null),
    ('communication', 'soft-skills', null),
    ('problem-solving', 'soft-skills', null),
    ('time-management', 'soft-skills', null),
    ('customer-service', 'soft-skills', null)
  ) as t(skill_name, category, parent_skill)
),
industry_lookup as (
  select id, slug from public.industries
),
parent_skills as (
  select id, name from public.skills
),
skill_inserts as (
  insert into public.skills (name, industry_id, parent_id)
  select 
    sc.skill_name,
    case 
      when sc.category = 'construction' then (select id from industry_lookup where slug = 'construction')
      when sc.category = 'manufacturing' then (select id from industry_lookup where slug = 'manufacturing')
      when sc.category = 'logistics' then (select id from industry_lookup where slug = 'logistics')
      when sc.category = 'energy' then (select id from industry_lookup where slug = 'energy')
      when sc.category = 'maintenance' then (select id from industry_lookup where slug = 'maintenance')
      else null
    end,
    ps.id
  from skill_categories sc
  left join parent_skills ps on ps.name = sc.parent_skill
  on conflict (name) do nothing
  returning id, name
)
select count(*) as skills_created from skill_inserts;

-- =========================================================
-- 2) Organizations & Teams
-- =========================================================

-- Create realistic organizations in Central Michigan
with org_data as (
  select * from (values
    ('midland-construction', 'Midland Construction Co.', 'construction', 'Midland', 43.6156, -84.2472),
    ('bay-city-manufacturing', 'Bay City Manufacturing', 'manufacturing', 'Bay City', 43.5945, -83.8889),
    ('saginaw-logistics', 'Saginaw Logistics Solutions', 'logistics', 'Saginaw', 43.4195, -83.9508),
    ('mount-pleasant-energy', 'Mount Pleasant Energy Services', 'energy', 'Mount Pleasant', 43.5972, -84.7675),
    ('clare-maintenance', 'Clare Maintenance & Repair', 'maintenance', 'Clare', 43.8195, -84.7689),
    ('big-rapids-trades', 'Big Rapids Trades Union', 'construction', 'Big Rapids', 43.6981, -85.4834),
    ('gladwin-industrial', 'Gladwin Industrial Solutions', 'manufacturing', 'Gladwin', 43.9806, -84.4867),
    ('alma-construction', 'Alma Construction Group', 'construction', 'Alma', 43.3789, -84.6597),
    ('harrison-logistics', 'Harrison Transport', 'logistics', 'Harrison', 44.0192, -84.7992),
    ('reed-city-energy', 'Reed City Energy Co.', 'energy', 'Reed City', 43.8750, -85.5101)
  ) as t(slug, name, industry_slug, city, lat, lon)
),
industry_lookup as (
  select id, slug from public.industries
),
user_sample as (
  select id from public.users order by random() limit 10
),
org_inserts as (
  insert into public.organizations (owner_user_id, name, slug, industry_id, address, geo)
  select 
    us.id,
    od.name,
    od.slug,
    il.id,
    jsonb_build_object(
      'street', (floor(random()*999) + 100)::text || ' Industrial Blvd',
      'city', od.city,
      'state', 'MI',
      'postal', lpad((floor(random()*90000)+10000)::int::text, 5, '0'),
      'country', 'USA'
    ),
    st_setsrid(st_makepoint(od.lon, od.lat), 4326)::geography
  from org_data od
  cross join lateral (select id from user_sample order by random() limit 1) us
  join industry_lookup il on il.slug = od.industry_slug
  on conflict (slug) do nothing
  returning id, slug, name, owner_user_id
),
team_data as (
  select * from (values
    ('construction', 'Construction Team'),
    ('electrical', 'Electrical Division'),
    ('plumbing', 'Plumbing Division'),
    ('management', 'Management Team'),
    ('safety', 'Safety & Compliance'),
    ('production', 'Production Team'),
    ('logistics', 'Logistics Team'),
    ('maintenance', 'Maintenance Crew'),
    ('field-services', 'Field Services'),
    ('quality-control', 'Quality Control')
  ) as t(team_slug, team_name)
),
team_inserts as (
  insert into public.teams (organization_id, name, slug, created_by)
  select 
    oi.id,
    td.team_name,
    td.team_slug || '-' || oi.slug,
    oi.owner_user_id
  from org_inserts oi
  cross join team_data td
  on conflict (slug) do nothing
  returning id, organization_id, name
)
select count(*) as organizations_created from org_inserts;

-- =========================================================
-- 3) User Skills (based on existing skills_summary)
-- =========================================================

-- Extract and insert user skills from existing skills_summary JSONB
with user_skills_data as (
  select 
    u.id as user_id,
    skill_name,
    (2 + floor(random()*4))::smallint as proficiency,
    case when random() < 0.8 then 'self' else 'verified' end as source,
    case when random() < 0.3 then now() - interval '1 year' * random() else null end as last_verified_at
  from public.users u,
  lateral jsonb_array_elements_text(u.skills_summary->'skills') as skill_name
  where u.skills_summary is not null
),
skill_lookup as (
  select id, name from public.skills
),
user_skills_inserts as (
  insert into public.user_skills (user_id, skill_id, proficiency, source, last_verified_at)
  select 
    usd.user_id,
    sl.id,
    usd.proficiency,
    usd.source::text,
    usd.last_verified_at
  from user_skills_data usd
  join skill_lookup sl on sl.name = usd.skill_name
  on conflict (user_id, skill_id) do nothing
  returning user_id, skill_id
)
select count(*) as user_skills_created from user_skills_inserts;

-- =========================================================
-- 4) Jobs (realistic job postings)
-- =========================================================

with job_templates as (
  select * from (values
    ('Electrician', 'We are seeking a skilled electrician to join our team. Must have experience with residential and commercial electrical work.', 'full_time', 'on_site', 'Construction Electrician', 3, 25.00, 35.00),
    ('Welder', 'Experienced welder needed for manufacturing operations. TIG and MIG welding experience required.', 'full_time', 'on_site', 'Production Welder', 4, 22.00, 32.00),
    ('Forklift Operator', 'Warehouse forklift operator position. Must have valid forklift certification.', 'full_time', 'on_site', 'Warehouse Operator', 2, 18.00, 25.00),
    ('HVAC Technician', 'HVAC service technician for residential and commercial installations and repairs.', 'full_time', 'hybrid', 'HVAC Tech', 3, 24.00, 38.00),
    ('Construction Foreman', 'Lead construction projects and manage crews. 5+ years experience required.', 'full_time', 'on_site', 'Project Foreman', 5, 28.00, 45.00),
    ('CNC Machinist', 'Operate CNC machines for precision manufacturing. Programming experience preferred.', 'full_time', 'on_site', 'CNC Operator', 3, 20.00, 30.00),
    ('Truck Driver', 'CDL Class A driver for local and regional deliveries. Clean driving record required.', 'full_time', 'on_site', 'Commercial Driver', 2, 22.00, 28.00),
    ('Maintenance Technician', 'Industrial maintenance technician for equipment repair and preventive maintenance.', 'full_time', 'on_site', 'Maintenance Tech', 3, 21.00, 29.00),
    ('Safety Coordinator', 'Develop and implement safety programs. OSHA certification preferred.', 'full_time', 'hybrid', 'Safety Specialist', 4, 25.00, 35.00),
    ('Project Manager', 'Manage construction and manufacturing projects from start to finish.', 'full_time', 'hybrid', 'Project Manager', 5, 30.00, 50.00)
  ) as t(title, description, employment_type, remote_option, position_level, min_level, min_rate, max_rate)
),
org_sample as (
  select id, name, slug from public.organizations order by random()
),
team_sample as (
  select id, organization_id, name from public.teams order by random()
),
job_inserts as (
  insert into public.jobs (
    organization_id, team_id, title, description, status, employment_type, 
    remote_option, location, address, geo, compensation, visibility, slug,
    posted_at, closes_at, position_level, min_reputation
  )
  select 
    os.id,
    ts.id,
    jt.title,
    jt.description,
    case when random() < 0.8 then 'open' else 'draft' end,
    jt.employment_type::text,
    jt.remote_option::text,
    os.name || ' - ' || (array['Main Facility', 'Branch Office', 'Field Location'])[floor(random()*3)+1],
    jsonb_build_object(
      'street', (floor(random()*999) + 100)::text || ' Industrial Way',
      'city', 'Central Michigan',
      'state', 'MI',
      'postal', lpad((floor(random()*90000)+10000)::int::text, 5, '0'),
      'country', 'USA'
    ),
    st_setsrid(st_makepoint(-84.0 + random()*2, 43.5 + random()*1), 4326)::geography,
    jsonb_build_object(
      'type', 'hourly',
      'min', jt.min_rate,
      'max', jt.max_rate,
      'currency', 'USD'
    ),
    'public',
    jt.title::text || '-' || os.slug || '-' || floor(random()*1000)::text,
    now() - interval '1 day' * floor(random()*30),
    now() + interval '30 days' + interval '1 day' * floor(random()*30),
    jt.position_level,
    jt.min_level::numeric
  from job_templates jt
  cross join lateral (select id, name, slug from org_sample order by random() limit 1) os
  cross join lateral (select id from team_sample where organization_id = os.id order by random() limit 1) ts
  on conflict (slug) do nothing
  returning id, title, organization_id
)
select count(*) as jobs_created from job_inserts;

-- =========================================================
-- 5) Job Skills (link jobs to required skills)
-- =========================================================

with job_skill_mappings as (
  select * from (values
    ('Electrician', 'electrical'),
    ('Electrician', 'osha-30'),
    ('Electrician', 'blueprints'),
    ('Welder', 'welding'),
    ('Welder', 'safety'),
    ('Welder', 'quality-control'),
    ('Forklift Operator', 'forklift'),
    ('Forklift Operator', 'safety'),
    ('HVAC Technician', 'hvac'),
    ('HVAC Technician', 'electrical'),
    ('HVAC Technician', 'plumbing'),
    ('Construction Foreman', 'leadership'),
    ('Construction Foreman', 'project-management'),
    ('Construction Foreman', 'carpentry'),
    ('CNC Machinist', 'machining'),
    ('CNC Machinist', 'cnc-operating'),
    ('CNC Machinist', 'quality-control'),
    ('Truck Driver', 'truck-driving'),
    ('Truck Driver', 'cdl'),
    ('Maintenance Technician', 'electrical'),
    ('Maintenance Technician', 'plumbing'),
    ('Maintenance Technician', 'hvac'),
    ('Safety Coordinator', 'osha-30'),
    ('Safety Coordinator', 'leadership'),
    ('Project Manager', 'project-management'),
    ('Project Manager', 'leadership'),
    ('Project Manager', 'communication')
  ) as t(job_title, skill_name)
),
job_skill_inserts as (
  insert into public.job_skills (job_id, skill_id, required_level)
  select 
    j.id,
    s.id,
    (2 + floor(random()*3))::smallint
  from public.jobs j
  join job_skill_mappings jsm on jsm.job_title = j.title
  join public.skills s on s.name = jsm.skill_name
  on conflict (job_id, skill_id) do nothing
  returning job_id, skill_id
)
select count(*) as job_skills_created from job_skill_inserts;

-- =========================================================
-- 6) Applications (users applying to jobs)
-- =========================================================

with user_job_combinations as (
  select 
    u.id as user_id,
    j.id as job_id,
    j.title,
    j.organization_id
  from public.users u
  cross join public.jobs j
  where j.status = 'open'
    and random() < 0.3  -- 30% chance each user applies to each job
),
application_inserts as (
  insert into public.applications (job_id, user_id, status, resume_url, cover_letter_url, answers)
  select 
    ujc.job_id,
    ujc.user_id,
    (array['new', 'screen', 'interview', 'offer'])[floor(random()*4)+1],
    'https://example.com/resumes/' || ujc.user_id || '.pdf',
    case when random() < 0.7 then 'https://example.com/cover-letters/' || ujc.user_id || '-' || ujc.job_id || '.pdf' else null end,
    jsonb_build_object(
      'availability', (array['immediate', '2-weeks', '1-month'])[floor(random()*3)+1],
      'salary_expectation', (floor(random()*15) + 20)::text || '-30',
      'relocation', random() < 0.2,
      'remote_ok', random() < 0.6
    )
  from user_job_combinations ujc
  on conflict (job_id, user_id) do nothing
  returning job_id, user_id, id
)
select count(*) as applications_created from application_inserts;

-- =========================================================
-- 7) Connections (user-to-user professional connections)
-- =========================================================

with user_pairs as (
  select 
    u1.id as requester_id,
    u2.id as addressee_id,
    (array['peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor'])[floor(random()*7)+1] as requester_type,
    (array['peer', 'boss', 'report', 'mentor', 'mentee', 'client', 'contractor'])[floor(random()*7)+1] as addressee_type
  from public.users u1
  cross join public.users u2
  where u1.id < u2.id  -- avoid duplicates
    and random() < 0.15  -- 15% chance of connection
),
connection_inserts as (
  insert into public.connections (requester_user_id, addressee_user_id, status, requester_type, addressee_type, decided_at)
  select 
    up.requester_id,
    up.addressee_id,
    case when random() < 0.8 then 'accepted' else 'pending' end,
    up.requester_type::text,
    up.addressee_type::text,
    case when random() < 0.8 then now() - interval '1 day' * floor(random()*30) else null end
  from user_pairs up
  on conflict (requester_user_id, addressee_user_id) do nothing
  returning requester_user_id, addressee_user_id
)
select count(*) as connections_created from connection_inserts;

-- =========================================================
-- 8) Follows (users following organizations and jobs)
-- =========================================================

with user_org_follows as (
  select 
    u.id as user_id,
    o.id as org_id,
    'organization' as followee_type
  from public.users u
  cross join public.organizations o
  where random() < 0.2  -- 20% chance of following each org
),
user_job_follows as (
  select 
    u.id as user_id,
    j.id as job_id,
    'job' as followee_type
  from public.users u
  cross join public.jobs j
  where j.status = 'open'
    and random() < 0.1  -- 10% chance of following each job
),
follow_inserts as (
  insert into public.follows (follower_type, follower_id, followee_type, followee_id)
  select 'user', user_id, followee_type, org_id from user_org_follows
  union all
  select 'user', user_id, followee_type, job_id from user_job_follows
  on conflict (follower_type, follower_id, followee_type, followee_id) do nothing
  returning follower_id, followee_id
)
select count(*) as follows_created from follow_inserts;

-- =========================================================
-- 9) Reviews (user reviews for organizations and other users)
-- =========================================================

with review_data as (
  select 
    u.id as author_id,
    o.id as subject_id,
    'organization' as subject_type,
    (3 + floor(random()*3))::smallint as rating,
    (array['Great company to work for!', 'Excellent management team', 'Good benefits and pay', 'Challenging but rewarding work', 'Professional environment'])[floor(random()*5)+1] as headline,
    'I have had a positive experience working with this organization. The team is professional and the work is engaging.' as body
  from public.users u
  cross join public.organizations o
  where random() < 0.3  -- 30% chance of review
),
review_inserts as (
  insert into public.reviews (subject_type, subject_id, author_user_id, rating, headline, body)
  select 
    rd.subject_type,
    rd.subject_id,
    rd.author_id,
    rd.rating,
    rd.headline,
    rd.body
  from review_data rd
  on conflict (kind, subject_type, subject_id, author_user_id) do nothing
  returning id, subject_id, author_user_id
)
select count(*) as reviews_created from review_inserts;

-- =========================================================
-- 10) Team Members (add users to teams)
-- =========================================================

with team_member_data as (
  select 
    u.id as user_id,
    t.id as team_id
  from public.users u
  cross join public.teams t
  where random() < 0.4  -- 40% chance of being on each team
),
team_member_inserts as (
  insert into public.team_members (team_id, user_id)
  select 
    tmd.team_id,
    tmd.user_id
  from team_member_data tmd
  on conflict (team_id, user_id) do nothing
  returning team_id, user_id
)
select count(*) as team_members_created from team_member_inserts;

-- =========================================================
-- 11) Update search vectors for new data
-- =========================================================

-- Update organization search vectors
update public.organizations 
set search_tsv = 
  setweight(to_tsvector('simple', coalesce(name,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(slug::text,'')), 'C')
where search_tsv is null;

-- Update job search vectors
update public.jobs 
set search_tsv = 
  setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(description,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(position_level,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(location,'')), 'C')
where search_tsv is null;

commit;
