-- =========================================================
-- 007_affiliates_seed.sql — sample affiliate programs
-- Seeds OSHA/NCCER-style partners so the UI can surface
-- industry-aware continuing education recommendations.
-- =========================================================

begin;

with industry_lookup as (
  select slug, id
  from public.industries
),
affiliate_rows as (
  select
    (select id from industry_lookup where slug = 'construction') as industry_id,
    'education'::public.affiliate_type as type,
    'OSHA 30-Hour Construction Training' as name,
    'Online certification' as program_type,
    'Complete your OSHA 30 requirement online with an authorized training partner.' as description,
    'Start OSHA 30' as cta_label,
    'https://partners.oshaeducationplatform.test/osha-30-construction?aff_id=scf' as affiliate_url,
    null::text as affiliate_code,
    'Commission: 12% per enrollment' as commission_terms,
    jsonb_build_object('duration_hours', 30, 'format', 'Self-paced', 'provider', 'OSHA-authorized') as metadata,
    true as is_active
  union all
  select
    (select id from industry_lookup where slug = 'construction') as industry_id,
    'education'::public.affiliate_type as type,
    'HAZWOPER 40-Hour Certification Bundle' as name,
    'Blended learning' as program_type,
    'Meet HAZWOPER requirements with a mix of self-paced modules and live instruction.' as description,
    'Book HAZWOPER training' as cta_label,
    'https://hazwoper.academy.test/40-hour?utm_source=scf' as affiliate_url,
    'SCFHAZ10'::text as affiliate_code,
    'Flat $45 referral bonus per learner' as commission_terms,
    jsonb_build_object(
      'duration_hours', 40,
      'format', 'Hybrid',
      'includes', jsonb_build_array('Instructor webinar', 'Field exercise guide')
    ) as metadata,
    true as is_active
  union all
  select
    (select id from industry_lookup where slug = 'manufacturing') as industry_id,
    'education'::public.affiliate_type as type,
    'NIMS CNC Operator Certification Prep' as name,
    'Online cohort' as program_type,
    'Prepare for NIMS credentialing with instructor feedback and practice assessments.' as description,
    'Reserve a seat' as cta_label,
    'https://skillslab.manufacturing.test/cnc-operator?ref=scf' as affiliate_url,
    null::text as affiliate_code,
    'Commission: 8% per enrolled candidate' as commission_terms,
    jsonb_build_object('duration_weeks', 6, 'format', 'Live virtual', 'provider', 'SkillsLab Manufacturing') as metadata,
    true as is_active
  union all
  select
    null::uuid as industry_id,
    'education'::public.affiliate_type as type,
    'Build Your Future Craft Training Explorer' as name,
    'Resource library' as program_type,
    'Browse apprenticeships, bootcamps, and certifications aligned to construction careers.' as description,
    'Explore programs' as cta_label,
    'https://partners.byf.org/craft-training?partner=scf' as affiliate_url,
    null::text as affiliate_code,
    'Lead-share, paid on qualified enrollments' as commission_terms,
    jsonb_build_object('focus', 'Skilled trades', 'coverage', 'National') as metadata,
    true as is_active
)
insert into public.affiliates (
  industry_id,
  type,
  name,
  program_type,
  description,
  cta_label,
  affiliate_url,
  affiliate_code,
  commission_terms,
  metadata,
  is_active
)
select
  industry_id,
  type,
  name,
  program_type,
  description,
  cta_label,
  affiliate_url,
  affiliate_code,
  commission_terms,
  metadata,
  is_active
from affiliate_rows
on conflict (name, affiliate_url) do update
  set
    industry_id = excluded.industry_id,
    type = excluded.type,
    program_type = excluded.program_type,
    description = excluded.description,
    cta_label = excluded.cta_label,
    affiliate_code = excluded.affiliate_code,
    commission_terms = excluded.commission_terms,
    metadata = excluded.metadata,
    is_active = excluded.is_active,
    updated_at = now();

commit;
