-- Seed super admin role assignments for core team members
BEGIN;

-- Insert super_admin role assignments for core team members
-- This will only insert if the user exists and doesn't already have the role
INSERT INTO public.role_assignments (role_id, user_id)
SELECT 
  r.id as role_id,
  u.id as user_id
FROM public.roles r
CROSS JOIN auth.users u
WHERE r.name = 'super_admin'
  AND r.scope = 'platform'
  AND u.email IN (
    'clay@unicorn.love',
    'clay@scaffald.com',
    'zach@unicorn.love',
    'marc@unicorn.love',
    'vince@unicorn.love'
  )
ON CONFLICT DO NOTHING; -- Skip if role assignment already exists

COMMIT;
