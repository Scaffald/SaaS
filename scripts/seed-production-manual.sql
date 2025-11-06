-- =========================================================
-- Production Database Seeding
-- Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- =========================================================

-- 1. INDUSTRIES
-- =========================================================
INSERT INTO core.industries (slug, name, description) VALUES
  ('construction', 'Construction', 'Residential and commercial building trades'),
  ('manufacturing', 'Manufacturing', 'Industrial fabrication and assembly'),
  ('transportation', 'Transportation', 'Transportation, warehousing, and supply chain'),
  ('energy', 'Energy', 'Utilities, renewables, and field services')
ON CONFLICT (slug) DO NOTHING;

-- Verify industries
SELECT COUNT(*) as industry_count FROM core.industries;
