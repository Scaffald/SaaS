-- =========================================================
-- Production Database Complete Seeding
-- Run this in Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- =========================================================

-- 1. SEED INDUSTRIES
-- =========================================================
INSERT INTO public.industries (slug, name, description) VALUES
  ('construction', 'Construction', 'Residential and commercial building trades'),
  ('manufacturing', 'Manufacturing', 'Industrial fabrication and assembly'),
  ('transportation', 'Transportation', 'Transportation, warehousing, and supply chain'),
  ('energy', 'Energy', 'Utilities, renewables, and field services')
ON CONFLICT (slug) DO NOTHING;

-- Verify industries
SELECT 'Industries Count:' as info, COUNT(*) as count FROM public.industries;

-- 2. MAKE clay@unicorn.love A SUPER ADMIN
-- =========================================================
-- This will assign super_admin role if the user exists
INSERT INTO public.role_assignments (role_id, user_id)
SELECT 
  r.id as role_id,
  u.id as user_id
FROM public.roles r
CROSS JOIN auth.users u
WHERE r.name = 'super_admin'
  AND r.scope = 'platform'
  AND u.email = 'clay@unicorn.love'
ON CONFLICT DO NOTHING;

-- Verify admin role assignment
SELECT 
  'Admin Role Assignment:' as info,
  u.email,
  r.name as role,
  r.scope
FROM public.role_assignments ra
JOIN auth.users u ON u.id = ra.user_id
JOIN public.roles r ON r.id = ra.role_id
WHERE u.email = 'clay@unicorn.love'
  AND r.name = 'super_admin';

-- =========================================================
-- SUMMARY
-- =========================================================
SELECT 'Summary:' as info;
SELECT 'Industries:' as table_name, COUNT(*) as count FROM public.industries
UNION ALL
SELECT 'Super Admins:', COUNT(*) FROM public.role_assignments ra
  JOIN public.roles r ON r.id = ra.role_id
  WHERE r.name = 'super_admin' AND r.scope = 'platform';
