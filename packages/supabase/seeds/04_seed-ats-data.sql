-- =========================================================
-- ATS Data Seed
-- Applicant Tracking System test data including:
-- - Pipelines (hiring workflows)
-- - Pipeline Stages (steps in hiring process)
-- - Jobs (open positions)
-- - Job-Pipeline assignments
-- - Candidate-Job links
-- - Applications
-- - Application stage history
-- =========================================================

begin;

-- =========================================================
-- 1. Pipelines
-- =========================================================

with org_lookup as (
  select slug, id
  from public.organizations
  where slug in (
    'midland-construction',
    'bay-city-manufacturing',
    'saginaw-transportation'
  )
), pipeline_values as (
  select *
  from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2', 'midland-construction', 'Default Hiring Pipeline', 'General hiring flow covering screening through onboarding.', true),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067', 'midland-construction', 'Skilled Trades Pipeline', 'Hands-on field roles with trade assessments.', false),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d', 'bay-city-manufacturing', 'Manufacturing Pipeline', 'Standard pipeline for plant roles.', true),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa', 'bay-city-manufacturing', 'Technical Maintenance Pipeline', 'Advanced maintenance and reliability roles.', false),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01', 'saginaw-transportation', 'Logistics Pipeline', 'Default flow for drivers and dispatchers.', true),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455', 'saginaw-transportation', 'Operations Support Pipeline', 'Coordinators and dispatch support roles.', false)
  ) as t(pipeline_key, pipeline_id, org_slug, name, description, is_default)
)
insert into public.pipelines (id, organization_id, name, description, is_default)
select
  pipeline_id::uuid,
  o.id,
  name,
  description,
  is_default
from pipeline_values pv
join org_lookup o on o.slug = pv.org_slug
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      is_default = excluded.is_default,
      updated_at = now();

-- =========================================================
-- 2. Pipeline Stages
-- =========================================================

with pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01'::uuid),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455'::uuid)
  ) as t(pipeline_key, pipeline_id)
), stage_values as (
  select *
  from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4', 'midland_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b', 'midland_default', 'Screen', 'Initial recruiter screen', 2, '#0EA5E9', 5),
    ('midland_default_interview', 'ee70bbe2-1a98-40eb-a2bc-c414da3ff843', 'midland_default', 'Interview', 'Hiring manager interviews', 3, '#F97316', 7),
    ('midland_default_offer', 'd2c0ffc6-f703-479c-8b8c-1416cfb09f42', 'midland_default', 'Offer', 'Offer & approvals', 4, '#FACC15', 5),
    ('midland_default_hired', '77c71fe9-2a8c-42ef-9d12-93d49f1bcab0', 'midland_default', 'Hired', 'Offer accepted & onboarding', 5, '#22C55E', 0),
    ('midland_default_rejected', 'c07af6b7-a41e-4125-b546-b205c41cb6d9', 'midland_default', 'Rejected', 'Archived candidates', 6, '#EF4444', 0),

    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf', 'midland_trades', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71', 'midland_trades', 'Screen', 'Trades recruiter screen', 2, '#0EA5E9', 4),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005', 'midland_trades', 'Interview', 'Hands-on assessment', 3, '#F97316', 6),
    ('midland_trades_offer', 'e32ea005-7296-4768-aa8e-1d955d14da40', 'midland_trades', 'Offer', 'Offer & verification', 4, '#FACC15', 4),
    ('midland_trades_hired', '45267e08-0ef3-422a-bd59-e3e21027ed6e', 'midland_trades', 'Hired', 'Start date scheduled', 5, '#22C55E', 0),
    ('midland_trades_rejected', '13fc37c9-3d63-4716-937c-67ba5fde83b8', 'midland_trades', 'Rejected', 'Did not meet requirements', 6, '#EF4444', 0),

    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721', 'baycity_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82', 'baycity_default', 'Screen', 'HR screen', 2, '#0EA5E9', 4),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242', 'baycity_default', 'Interview', 'Plant leadership interviews', 3, '#F97316', 6),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883', 'baycity_default', 'Offer', 'Offer negotiation', 4, '#FACC15', 5),
    ('baycity_default_hired', '2336da71-8e8c-46dd-8263-2d0c6f1df919', 'baycity_default', 'Hired', 'Onboarding scheduled', 5, '#22C55E', 0),
    ('baycity_default_rejected', '0ad53efc-9e2c-4c16-a390-796dcf094bcc', 'baycity_default', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d', 'baycity_trades', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4', 'baycity_trades', 'Screen', 'Technical phone screen', 2, '#0EA5E9', 4),
    ('baycity_trades_interview', '3e40b6ba-debd-4b4f-82c7-b65d37874560', 'baycity_trades', 'Interview', 'Panel interview', 3, '#F97316', 6),
    ('baycity_trades_offer', '4a7db62e-461c-4843-85e6-3a9539eeef97', 'baycity_trades', 'Offer', 'Offer & approvals', 4, '#FACC15', 4),
    ('baycity_trades_hired', '26ef3ace-bbc9-423f-8063-daf0cbfefff7', 'baycity_trades', 'Hired', 'Onboarding scheduled', 5, '#22C55E', 0),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c', 'baycity_trades', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('saginaw_default_applied', '191ec5f9-0beb-4d04-98c5-44a36863f32d', 'saginaw_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('saginaw_default_screen', '44fd80bf-d003-4ce3-9402-85de23f448de', 'saginaw_default', 'Screen', 'Dispatcher screen', 2, '#0EA5E9', 4),
    ('saginaw_default_interview', '270532eb-976f-4200-9372-65c2591ac617', 'saginaw_default', 'Interview', 'Ride-along & manager interview', 3, '#F97316', 7),
    ('saginaw_default_offer', '93b5a3b5-3c09-45ae-8cbb-76de3ef65aa9', 'saginaw_default', 'Offer', 'Offer & compliance', 4, '#FACC15', 5),
    ('saginaw_default_hired', 'd99c4379-00d5-4c61-af11-33e9aa1ed399', 'saginaw_default', 'Hired', 'Orientation scheduled', 5, '#22C55E', 0),
    ('saginaw_default_rejected', '0dad9984-84c6-45d6-a214-44b68aa4df2f', 'saginaw_default', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('saginaw_operations_applied', '92de2904-c594-4f39-9b9c-fc15861f8750', 'saginaw_operations', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('saginaw_operations_screen', 'f6dce416-814f-466f-94a4-ecc9945086a5', 'saginaw_operations', 'Screen', 'Operations screen', 2, '#0EA5E9', 3),
    ('saginaw_operations_interview', '15df9375-f5a7-4784-b5f2-61c8c1d358d1', 'saginaw_operations', 'Interview', 'Panel interview', 3, '#F97316', 5),
    ('saginaw_operations_offer', 'c68887b0-f32a-40bd-ac82-0fc8602b14c5', 'saginaw_operations', 'Offer', 'Offer approvals', 4, '#FACC15', 4),
    ('saginaw_operations_hired', '42e88f3f-fa80-42c8-ab4b-1cb8ef6050bd', 'saginaw_operations', 'Hired', 'Orientation scheduled', 5, '#22C55E', 0),
    ('saginaw_operations_rejected', 'b8ddb71b-22f7-4a6b-96d7-6adaa59cc503', 'saginaw_operations', 'Rejected', 'Archived', 6, '#EF4444', 0)
  ) as t(stage_key, stage_id, pipeline_key, name, description, stage_order, color, sla_days)
)
insert into public.pipeline_stages (id, pipeline_id, name, description, stage_order, color, sla_days)
select
  stage_id::uuid,
  pl.pipeline_id,
  name,
  description,
  stage_order,
  color,
  sla_days
from stage_values sv
join pipeline_lookup pl on pl.pipeline_key = sv.pipeline_key
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      stage_order = excluded.stage_order,
      color = excluded.color,
      sla_days = excluded.sla_days,
      updated_at = now();

-- =========================================================
-- 3. Jobs
-- =========================================================

with org_lookup as (
  select slug, id
  from public.organizations
  where slug in (
    'midland-construction',
    'bay-city-manufacturing',
    'saginaw-transportation'
  )
), job_values as (
  select *
  from (values
    ('midland_field_superintendent', 'midland-construction', 'Field Superintendent', 'Oversee field crews and ensure quality across active job sites.', 'open', 'full_time', 'on_site', 'Midland, MI', 'midland-field-superintendent', 21, 'midland_default'),
    ('midland_journeyman_electrician', 'midland-construction', 'Journeyman Electrician', 'Install and service electrical systems across commercial builds.', 'open', 'full_time', 'on_site', 'Saginaw, MI', 'midland-journeyman-electrician', 10, 'midland_trades'),
    ('baycity_line_operator', 'bay-city-manufacturing', 'Production Line Operator', 'Operate automated packaging lines using lean manufacturing practices.', 'open', 'full_time', 'on_site', 'Bay City, MI', 'baycity-production-line-operator', 18, 'baycity_default'),
    ('baycity_maintenance_tech', 'bay-city-manufacturing', 'Maintenance Technician', 'Perform preventative maintenance on CNC and fabrication equipment.', 'open', 'full_time', 'on_site', 'Bay City, MI', 'baycity-maintenance-technician', 8, 'baycity_trades'),
    ('saginaw_route_driver', 'saginaw-transportation', 'Route Driver', 'Deliver freight across the tri-city region with daily home time.', 'open', 'full_time', 'on_site', 'Saginaw, MI', 'saginaw-route-driver', 25, 'saginaw_default'),
    ('saginaw_dispatch_specialist', 'saginaw-transportation', 'Dispatch Specialist', 'Coordinate drivers, routes, and after-hours escalations.', 'open', 'full_time', 'hybrid', 'Saginaw, MI', 'saginaw-dispatch-specialist', 5, 'saginaw_operations')
  ) as t(job_key, org_slug, title, description, status, employment_type, remote_option, location, slug, posted_days_ago, pipeline_key)
)
insert into public.jobs (organization_id, title, description, status, employment_type, remote_option, location, slug, posted_at, created_at, updated_at)
select
  o.id,
  j.title,
  j.description,
  j.status,
  j.employment_type,
  j.remote_option,
  j.location,
  j.slug,
  now() - (j.posted_days_ago || ' days')::interval,
  now(),
  now()
from job_values j
join org_lookup o on o.slug = j.org_slug
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      employment_type = excluded.employment_type,
      remote_option = excluded.remote_option,
      location = excluded.location,
      posted_at = excluded.posted_at,
      updated_at = now();

-- =========================================================
-- 4. Job-Pipeline Assignments
-- =========================================================

with job_values as (
  select *
  from (values
    ('midland_field_superintendent', 'midland-field-superintendent', 'midland_default'),
    ('midland_journeyman_electrician', 'midland-journeyman-electrician', 'midland_trades'),
    ('baycity_line_operator', 'baycity-production-line-operator', 'baycity_default'),
    ('baycity_maintenance_tech', 'baycity-maintenance-technician', 'baycity_trades'),
    ('saginaw_route_driver', 'saginaw-route-driver', 'saginaw_default'),
    ('saginaw_dispatch_specialist', 'saginaw-dispatch-specialist', 'saginaw_operations')
  ) as t(job_key, slug, pipeline_key)
), jobs as (
  select j.job_key, jb.id, j.pipeline_key
  from job_values j
  join public.jobs jb on jb.slug = j.slug
), pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01'::uuid),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455'::uuid)
  ) as t(pipeline_key, pipeline_id)
)
insert into public.job_pipelines (job_id, pipeline_id, assigned_by)
select
  jobs.id,
  pl.pipeline_id,
  null::uuid
from jobs
join pipeline_lookup pl on pl.pipeline_key = jobs.pipeline_key
on conflict (job_id, pipeline_id) do update
  set assigned_by = excluded.assigned_by;

-- =========================================================
-- 5. Candidate-Job Links
-- =========================================================

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), job_lookup as (
  select slug, id
  from public.jobs
  where slug in (
    'midland-field-superintendent',
    'midland-journeyman-electrician',
    'baycity-production-line-operator',
    'baycity-maintenance-technician',
    'saginaw-route-driver',
    'saginaw-dispatch-specialist'
  )
), candidate_link_values as (
  select *
  from (values
    ('e259e34f-ef5a-4fe8-8f1f-25cce6b0ee97', 'saginaw-route-driver', 'seeduser-5', 'talent_pool', 'Talent Pool Import', 'Prequalified CDL-A driver ready for immediate placement.', 'seeduser-6'),
    ('376f1a9e-a298-4d2d-95da-acc3e39a9c66', 'midland-journeyman-electrician', 'seeduser-7', 'referral', 'Employee Referral', 'Referred by current crew lead.', 'seeduser-2'),
    ('212d4939-ca4d-449b-bde7-294b25edbe1f', 'baycity-production-line-operator', 'seeduser-8', 'sourced', 'Indeed Resume', 'Strong packaging experience with GMP background.', 'seeduser-3')
  ) as t(id, job_slug, user_slug, relationship_type, source, notes, created_by_slug)
)
insert into public.candidate_job_links (id, job_id, user_id, relationship_type, source, notes, created_by)
select
  cv.id::uuid,
  jl.id,
  ul.id,
  cv.relationship_type,
  cv.source,
  cv.notes,
  cbl.id
from candidate_link_values cv
join job_lookup jl on jl.slug = cv.job_slug
join user_lookup ul on ul.slug = cv.user_slug
left join user_lookup cbl on cbl.slug = cv.created_by_slug
on conflict (job_id, user_id, relationship_type) do update
  set source = excluded.source,
      notes = excluded.notes,
      created_by = excluded.created_by,
      updated_at = now();

-- =========================================================
-- 6. Applications
-- =========================================================

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), job_lookup as (
  select slug, id
  from public.jobs
  where slug in (
    'midland-field-superintendent',
    'midland-journeyman-electrician',
    'baycity-production-line-operator',
    'baycity-maintenance-technician'
  )
), pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid)
  ) as t(pipeline_key, pipeline_id)
), stage_lookup as (
  select * from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4'::uuid),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b'::uuid),
    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf'::uuid),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71'::uuid),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005'::uuid),
    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721'::uuid),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82'::uuid),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242'::uuid),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883'::uuid),
    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d'::uuid),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4'::uuid),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c'::uuid)
  ) as t(stage_key, stage_id)
), application_values as (
  select *
  from (values
    ('5b91cafe-467b-44e1-931d-9ff2fb2a04ce', 'midland-field-superintendent', 'seeduser-1', 'screen', 'midland_default', 'midland_default_screen', 21, 14),
    ('14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland-journeyman-electrician', 'seeduser-2', 'interview', 'midland_trades', 'midland_trades_interview', 18, 7),
    ('64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity-production-line-operator', 'seeduser-3', 'offer', 'baycity_default', 'baycity_default_offer', 24, 3),
    ('c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity-maintenance-technician', 'seeduser-4', 'rejected', 'baycity_trades', 'baycity_trades_rejected', 12, 2)
  ) as t(id, job_slug, user_slug, status, pipeline_key, stage_key, applied_days_ago, stage_days_ago)
)
insert into public.applications (id, job_id, user_id, status, pipeline_id, pipeline_stage_id, stage_entered_at, stage_changed_at, created_at)
select
  av.id::uuid,
  jl.id,
  ul.id,
  av.status,
  pl.pipeline_id,
  sl.stage_id,
  now() - (av.stage_days_ago || ' days')::interval,
  now() - (av.stage_days_ago || ' days')::interval,
  now() - (av.applied_days_ago || ' days')::interval
from application_values av
join job_lookup jl on jl.slug = av.job_slug
join user_lookup ul on ul.slug = av.user_slug
join pipeline_lookup pl on pl.pipeline_key = av.pipeline_key
join stage_lookup sl on sl.stage_key = av.stage_key
on conflict (id) do update
  set status = excluded.status,
      pipeline_id = excluded.pipeline_id,
      pipeline_stage_id = excluded.pipeline_stage_id,
      stage_entered_at = excluded.stage_entered_at,
      stage_changed_at = excluded.stage_changed_at;

-- =========================================================
-- 7. Application Stage History
-- =========================================================

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), stage_lookup as (
  select * from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4'::uuid),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b'::uuid),
    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf'::uuid),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71'::uuid),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005'::uuid),
    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721'::uuid),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82'::uuid),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242'::uuid),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883'::uuid),
    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d'::uuid),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4'::uuid),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c'::uuid)
  ) as t(stage_key, stage_id)
), history_values as (
  select *
  from (values
    ('0b68c04d-48d5-4a7e-932e-3b3d60169f55', '5b91cafe-467b-44e1-931d-9ff2fb2a04ce', null, 'midland_default_applied', 'seeduser-1', 21, null, 'Application submitted by candidate.'),
    ('feef831b-682f-4422-a7f8-83341d6183a9', '5b91cafe-467b-44e1-931d-9ff2fb2a04ce', 'midland_default_applied', 'midland_default_screen', 'seeduser-5', 14, 'Initial review complete', 'Moved to recruiter screen.'),

    ('db493079-026f-4f54-a71d-2b8428ec8e26', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', null, 'midland_trades_applied', 'seeduser-2', 18, null, 'Application submitted.'),
    ('421e62ab-15b8-4ca4-be59-1564760db82a', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland_trades_applied', 'midland_trades_screen', 'seeduser-6', 12, 'Trade experience verified', 'Meets licensure requirements.'),
    ('79549bc7-72c7-43d0-8ddf-6c91d0ff3f3d', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland_trades_screen', 'midland_trades_interview', 'seeduser-6', 7, 'Assessment passed', 'Scheduled panel interview.'),

    ('a60b10d8-ef67-428e-84a1-8c6718a1a63e', '64307b56-c4f3-4458-9e82-3856cb83c9a7', null, 'baycity_default_applied', 'seeduser-3', 24, null, 'Candidate applied via job board.'),
    ('1b17056d-9ab9-47da-80e9-9789d464dcb5', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_applied', 'baycity_default_screen', 'seeduser-7', 18, 'Phone screen completed', 'Strong GMP background.'),
    ('1110f9d7-46fa-4d0b-a71a-49e3f1c5918c', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_screen', 'baycity_default_interview', 'seeduser-7', 10, 'Panel interview complete', 'Ready for offer review.'),
    ('c2e04ae3-8701-4a36-b3fb-86f8580615ad', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_interview', 'baycity_default_offer', 'seeduser-7', 3, 'Offer approved', 'Offer letter sent.'),

    ('ece74563-cd77-4f0a-87f5-2099b8eb8ac1', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', null, 'baycity_trades_applied', 'seeduser-4', 12, null, 'Candidate applied via referral.'),
    ('14729c85-60ed-4b9d-85b1-890cec6d2d27', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity_trades_applied', 'baycity_trades_screen', 'seeduser-8', 8, 'Technical screen completed', 'Awaiting assessment results.'),
    ('d6d5e802-85ab-4a81-a6a7-3cc0787b3fed', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity_trades_screen', 'baycity_trades_rejected', 'seeduser-8', 2, 'Failed assessment', 'Candidate did not pass technical evaluation.')
  ) as t(id, application_id, from_stage_key, to_stage_key, changed_by_slug, days_ago, reason, notes)
)
insert into public.application_stage_history (id, application_id, from_stage_id, to_stage_id, changed_by, reason, notes, created_at)
select
  hv.id::uuid,
  hv.application_id::uuid,
  fsl.stage_id,
  tsl.stage_id,
  ul.id,
  hv.reason,
  hv.notes,
  now() - (hv.days_ago || ' days')::interval
from history_values hv
left join stage_lookup fsl on fsl.stage_key = hv.from_stage_key
join stage_lookup tsl on tsl.stage_key = hv.to_stage_key
left join user_lookup ul on ul.slug = hv.changed_by_slug
on conflict (id) do update
  set from_stage_id = excluded.from_stage_id,
      to_stage_id = excluded.to_stage_id,
      changed_by = excluded.changed_by,
      reason = excluded.reason,
      notes = excluded.notes,
      created_at = excluded.created_at;

commit;
