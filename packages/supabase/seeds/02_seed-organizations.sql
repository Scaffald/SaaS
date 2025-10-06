-- =========================================================
-- Organizations Seed Data
-- Sample organizations across different industries and geographic locations
-- =========================================================

begin;

with industry_lookup as (
  select id, slug from public.industries
),
org_data as (
  select * from (values
    ('midland-construction', 'Midland Construction Co.', 'construction', 'Midland', 43.6156, -84.2472),
    ('bay-city-manufacturing', 'Bay City Manufacturing', 'manufacturing', 'Bay City', 43.5945, -83.8889),
    ('saginaw-transportation', 'Saginaw Transportation Solutions', 'transportation', 'Saginaw', 43.4195, -83.9508),
    ('mount-pleasant-energy', 'Mount Pleasant Energy Services', 'energy', 'Mount Pleasant', 43.5972, -84.7675),
    ('detroit-industrial', 'Detroit Industrial Group', 'manufacturing', 'Detroit', 42.3314, -83.0458),
    ('grand-rapids-construction', 'Grand Rapids Construction', 'construction', 'Grand Rapids', 42.9634, -85.6681),
    ('lansing-logistics', 'Lansing Logistics', 'transportation', 'Lansing', 42.7325, -84.5555),
    ('cleveland-energy', 'Cleveland Energy Solutions', 'energy', 'Cleveland', 41.4993, -81.6944)
  ) as t(slug, name, industry_slug, city, lat, lon)
),
org_inserts as (
  insert into public.organizations (owner_user_id, name, slug, industry_id, address, geo)
  select 
    null, -- No owner for seed data
    od.name,
    od.slug,
    il.id,
    jsonb_build_object(
      'street', (floor(random()*999) + 100)::text || ' Industrial Blvd',
      'city', od.city,
      'state', case when od.city in ('Detroit', 'Grand Rapids', 'Lansing', 'Midland', 'Bay City', 'Saginaw', 'Mount Pleasant') then 'MI' else 'OH' end,
      'postal', lpad((floor(random()*90000)+10000)::int::text, 5, '0'),
      'country', 'USA'
    ),
    st_setsrid(st_makepoint(od.lon, od.lat), 4326)::geography
  from org_data od
  join industry_lookup il on il.slug = od.industry_slug
  on conflict (slug) do nothing
  returning id, slug, name
)
select count(*) as organizations_created from org_inserts;

commit;
