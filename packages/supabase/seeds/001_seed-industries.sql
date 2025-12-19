-- =========================================================
-- Industries Seed Data
-- Basic industry taxonomy for the platform
-- =========================================================

begin;

insert into core.industries (slug, name, description) values
  ('construction', 'Construction', 'Residential and commercial building trades'),
  ('manufacturing', 'Manufacturing', 'Industrial fabrication and assembly'),
  ('transportation', 'Transportation', 'Transportation, warehousing, and supply chain'),
  ('energy', 'Energy', 'Utilities, renewables, and field services')
on conflict (slug) do nothing;

commit;
