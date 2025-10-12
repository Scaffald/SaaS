-- =========================================================
-- Organizations Seed Data
-- Real Michigan construction companies
-- =========================================================

begin;

with industry_lookup as (
  select id, slug from public.industries
),
org_data as (
  select * from (values
    (
      'barton-malow-company',
      'Barton Malow Company',
      'construction',
      '26500 American Drive',
      'Southfield',
      'MI',
      '48034',
      42.48849,
      -83.30057,
      'https://www.bartonmalow.com',
      'One of Michigan''s largest construction firms — provides construction management, design‑build, general contracting, technology & rigging services'
    ),
    (
      'walbridge',
      'Walbridge',
      'construction',
      '777 Woodward Ave Ste 300',
      'Detroit',
      'MI',
      '48226',
      42.33127,
      -83.04575,
      'https://www.walbridge.com',
      'Major general contractor / construction management in Michigan (Detroit HQ)'
    ),
    (
      'jbs-contracting-inc',
      'JBS Contracting, Inc.',
      'construction',
      '1680 Gover Pkwy',
      'Mount Pleasant',
      'MI',
      '48858',
      43.58692,
      -84.74399,
      'https://www.jbscontracting.com/',
      'Design‑build & general contracting in central Michigan, working in industrial, commercial, manufacturing, community markets'
    ),
    (
      'michigan-general-contractors',
      'Michigan General Contractors',
      'construction',
      '755 W Big Beaver Rd',
      'Troy',
      'MI',
      '48084',
      42.57438,
      -83.14717,
      'https://www.migeneralcontractors.com/',
      'Provides MEP & architectural design‑build, project management, construction services in Michigan'
    ),
    (
      'blackstone-corporation',
      'Blackstone Corporation',
      'construction',
      '1878 Star Batt Dr',
      'Rochester Hills',
      'MI',
      '48309',
      42.676,
      -83.1247,
      'https://blackstonecorporation.com/',
      'Commercial general contractor in Michigan, specializing in design‑build, facility upgrades, and major project coordination'
    ),
    (
      'michigan-construction-company',
      'Michigan Construction Company',
      'construction',
      '3390 N State Road, Suite C',
      'Davison',
      'MI',
      '48423',
      43.0261,
      -83.4428,
      'https://www.michiganconstructionco.com/',
      'Focuses on restoration, renovation, and general construction for residential & business clients in Michigan'
    )
  ) as t(slug, name, industry_slug, street, city, state, postal, lat, lon, website, description)
),
org_inserts as (
  insert into public.organizations (owner_user_id, name, slug, industry_id, address, geo, website, description)
  select 
    null, -- No owner for seed data
    od.name,
    od.slug,
    il.id,
    jsonb_build_object(
      'street', od.street,
      'city', od.city,
      'state', od.state,
      'postal', od.postal,
      'country', 'USA'
    ),
    st_setsrid(st_makepoint(od.lon, od.lat), 4326)::geography,
    od.website,
    od.description
  from org_data od
  join industry_lookup il on il.slug = od.industry_slug
  on conflict (slug) do nothing
  returning id, slug, name
)
select count(*) as organizations_created from org_inserts;

commit;
