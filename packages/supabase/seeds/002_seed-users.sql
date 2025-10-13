-- =========================================================
-- 001_seed-users.sql - Phase 2: User Seeding with Metadata
-- Seeds auth.users with email, password, and user metadata
-- Trigger automatically creates public.users, private.profile, private.preferences
-- =========================================================

BEGIN;

-- Insert users into auth.users with metadata
-- Password for all users: password123
INSERT INTO auth.users (
  instance_id,
  id,
  email,
  phone,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT 
  '00000000-0000-0000-0000-000000000000'::uuid,
  users.id::uuid,
  users.email,
  NULLIF(users.phone, ''),  -- Convert empty strings to NULL
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'provider', 'email',
    'name', users.name,
    'first_name', users.first_name,
    'last_name', users.last_name,
    'location', users.location
  ),
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM (VALUES
  -- =========================================================
  -- SUPER ADMINS - unicorn.love domain (IDs: 00000000-0000-0000-0000-00000000000X)
  -- =========================================================
  ('00000000-0000-0000-0000-000000000001', 'zach@unicorn.love', 'Zach Servideo', 'Zach', 'Servideo', '+1 (424) 280-2876', 'Ipswich, Massachusetts, United States'),
  ('00000000-0000-0000-0000-000000000002', 'clay@unicorn.love', 'Clay Unicorn', 'Clay', 'Unicorn', '+1 (989) 501-1460', 'Clare, Michigan, United States'),
  ('00000000-0000-0000-0000-000000000003', 'marc@unicorn.love', 'Marc', 'Marc', '', '+1 (978) 569-3642', ''),
  
  -- =========================================================
  -- SUPER ADMINS - circleave.com domain (IDs: 00000000-0000-0000-0000-00000000000X)
  -- =========================================================
  ('00000000-0000-0000-0000-000000000004', 'eric@circleave.com', 'Eric White', 'Eric', 'White', '', ''),
  ('00000000-0000-0000-0000-000000000005', 'jaylen@circleave.com', 'Jaylen Dorsey', 'Jaylen', 'Dorsey', '', ''),
  ('00000000-0000-0000-0000-000000000006', 'christian@circleave.com', 'Christian Reed', 'Christian', 'Reed', '', ''),
  ('00000000-0000-0000-0000-000000000007', 'matthew@circleave.com', 'Matthew Irizarry', 'Matthew', 'Irizarry', '', ''),
  ('00000000-0000-0000-0000-000000000008', 'dillon@circleave.com', 'Dillon Riecke', 'Dillon', 'Riecke', '', ''),
  
  -- =========================================================
  -- Regular Users (IDs: 11111111-1111-1111-1111-11111111111X)
  -- =========================================================
  ('11111111-1111-1111-1111-111111111111', 'lexis.salah@eths.education.com', 'lexi salah', 'lexi', 'salah', '', ''),
  ('11111111-1111-1111-1111-111111111112', 'ewongagent@gmail.com', 'Eric Wong', 'Eric', 'Wong', '+1 (774) 277-8182', 'Boston, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111113', 'eric@prodperfect.com', 'ewongagent@gmail.com', 'ewongagent@gmail.com', '', '', ''),
  ('11111111-1111-1111-1111-111111111114', 'bloxhambuilding@gmail.com', 'Luke Bloxham', 'Luke', 'Bloxham', '', ''),
  ('11111111-1111-1111-1111-111111111115', 'pajapavlovic93@gmail.com', 'Paja', 'Paja', '', '', ''),
  ('11111111-1111-1111-1111-111111111116', 'lexissalah@icloud.com', 'lexi salah', 'lexi', 'salah', '+1 (978) 590-8570', 'Gloucester, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111117', 'rich@lighthouseconstruction.com', 'Richie', 'Richie', '', '', ''),
  ('11111111-1111-1111-1111-111111111119', 'rdoucette@cpsd.us', 'Roy Doucette', 'Roy', 'Doucette', '', ''),
  ('11111111-1111-1111-1111-111111111120', 'cbenroll@ssvotech.org', 'Bill smith', 'Bill', 'smith', '+1 (781) 555-5555', 'Braintree, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111121', 'davidcasinghino@gmail.com', 'David C', 'David', 'C', '+1 (603) 361-4199', 'Manchester, New Hampshire, United States'),
  ('11111111-1111-1111-1111-111111111122', 'shorgan0011@gmail.com', 'Sean Horgan', 'Sean', 'Horgan', '+1 (646) 675-9084', ''),
  ('11111111-1111-1111-1111-111111111123', 'jordanelster10@gmail.com', 'Jordan Elster', 'Jordan', 'Elster', '+1 (774) 482-6169', ''),
  ('11111111-1111-1111-1111-111111111124', 'miqueiasaneves@eths.education', 'Miqueias Neves', 'Miqueias', 'Neves', '', ''),
  ('11111111-1111-1111-1111-111111111125', 'colinclong03@gmail.com', 'Colin Long', 'Colin', 'Long', '+1 (859) 492-0071', 'Kentucky, United States'),
  ('11111111-1111-1111-1111-111111111126', 'jacksoncefalo@gmail.com', 'Jackson Cefalo', 'Jackson', 'Cefalo', '+1 (351) 666-7975', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111127', 'dterry86@gmail.com', 'Dan Terry', 'Dan', 'Terry', '', ''),
  ('11111111-1111-1111-1111-111111111128', 'stefano.sestito@yahoo.com', 'stefano sestito', 'stefano', 'sestito', '+1 (617) 529-1019', 'Boston, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111129', 'russell@andoverlandscape.com', 'Russell Stott', 'Russell', 'Stott', '', ''),
  ('11111111-1111-1111-1111-111111111130', 'eavan@lighthouseconstruction.com', 'Eavan Jakubajtys', 'Eavan', 'Jakubajtys', '', 'Boston, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111131', 'jjwyz71@icloud.com', 'Jaiden Wyzanski', 'Jaiden', 'Wyzanski', '+1 (978) 880-8400', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111132', 'joseph.attia@quantalytixgroup.com', 'Joseph Attia', 'Joseph', 'Attia', '', ''),
  ('11111111-1111-1111-1111-111111111133', 'ogbewesy@gmail.com', 'Sylvester Ogbewe', 'Sylvester', 'Ogbewe', '', ''),
  ('11111111-1111-1111-1111-111111111134', 'abdulfawad.azizi@gmail.com', 'AbdulFawad', 'AbdulFawad', '', '', ''),
  ('11111111-1111-1111-1111-111111111135', 'aaronpdasilva0@gmail.com', 'Aaron DaSilva', 'Aaron', 'DaSilva', '+1 (978) 210-2401', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111136', 'jwgiering@rocketmail.com', 'John Giering', 'John', 'Giering', '+1 (978) 335-7475', 'Beverly, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111137', 'steve@lighthouseconstruction.com', 'Steve Stoddard', 'Steve', 'Stoddard', '', ''),
  ('11111111-1111-1111-1111-111111111138', 'aidananaloro2008@gmail.com', 'Aidan Analoro', 'Aidan', 'Analoro', '+1 (978) 766-6830', 'Wenham, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111139', 'jordanminaya30@gmail.com', 'Jordan Minaya', 'Jordan', 'Minaya', '+1 (979) 335-0985', 'Salem, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111140', 'oliviadodge08@gmail.com', 'Olivia Sweeney-Dodge', 'Olivia', 'Sweeney-Dodge', '+1 (978) 578-7195', 'Beverly, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111141', 'braydend.086@gmail.com', 'Brayden Depaula', 'Brayden', 'Depaula', '+1 (978) 631-7069', 'Beverly, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111142', 'achiarenza329@gmail.com', 'Anthony Chiarenza', 'Anthony', 'Chiarenza', '+1 (781) 870-0638', 'Danvers, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111143', 'kacyyyyy278@gmail.com', 'Kacy H', 'Kacy', 'H', '+1 (978) 871-8086', 'Salem, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111144', 'rileym2206@icloud.com', 'Riley Matul', 'Riley', 'Matul', '+1 (978) 416-1495', 'Boston, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111145', 'lucaspezzulo@yahoo.com', 'Lucas Pezzulo', 'Lucas', 'Pezzulo', '+1 (857) 270-3259', 'Salem, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111146', 'rmae7859@gmail.com', 'Rebecca Rawls', 'Rebecca', 'Rawls', '+1 (978) 335-0187', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111147', 'kayla.perez@eths.education', 'Kayla Perez', 'Kayla', 'Perez', '+1 (978) 437-0401', 'Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111148', 'maxxsimon2008@gmail.com', 'Maxx Simon', 'Maxx', 'Simon', '+1 (978) 376-7735', 'Danvers, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111149', 'miqueiasaneves@icloud.com', 'Miqueias Neves', 'Miqueias', 'Neves', '+1 (978) 836-3007', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111150', 'jack.doucette10@gmail.com', 'Jack Doucette', 'Jack', 'Doucette', '+1 (978) 826-0946', 'Danvers, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111151', 'leylahhernandez08@gmail.com', 'leylah hernandez', 'leylah', 'hernandez', '+1 (978) 210-3328', 'Peabody, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111152', 'lisatoosh90@gmail.com', 'Taleiysa Jones', 'Taleiysa', 'Jones', '+1 (781) 558-8050', 'Salem, Massachusetts, United States'),
  ('11111111-1111-1111-1111-111111111153', 'aaron.cook@eths.education', 'Aaron Cook', 'Aaron', 'Cook', '+1 (978) 654-0602', 'Salem, Massachusetts, United States')
) AS users(id, email, name, first_name, last_name, phone, location)
ON CONFLICT (id) DO NOTHING;

-- Assign 'office' role to core team members
-- (They already have 'worker' role from trigger)
INSERT INTO private.role_assignments (role_id, user_id)
SELECT 
  r.id as role_id,
  u.id as user_id
FROM private.roles r
CROSS JOIN auth.users u
WHERE r.name = 'office'
  AND r.scope = 'platform'
  AND (
    u.email ILIKE '%@unicorn.love'
    OR u.email ILIKE '%@circleave.com'
    OR u.email ILIKE '%@scaffald.com'
  )
ON CONFLICT DO NOTHING; -- Skip if role assignment already exists

-- Update geo coordinates for users based on their location
-- This populates the PostGIS geography field for the v_profile_search view
UPDATE private.profile
SET geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
FROM (VALUES
  -- Massachusetts locations
  ('Ipswich, Massachusetts, United States', -70.8417, 42.6792),
  ('Clare, Michigan, United States', -84.7697, 43.8197),
  ('Boston, Massachusetts, United States', -71.0589, 42.3601),
  ('Gloucester, Massachusetts, United States', -70.6620, 42.6159),
  ('Braintree, Massachusetts, United States', -71.0020, 42.2084),
  ('Manchester, New Hampshire, United States', -71.5381, 42.9956),
  ('Kentucky, United States', -85.7585, 37.8393),
  ('Peabody, Massachusetts, United States', -70.9286, 42.5334),
  ('Salem, Massachusetts, United States', -70.8967, 42.5195),
  ('Beverly, Massachusetts, United States', -70.8800, 42.5584),
  ('Wenham, Massachusetts, United States', -70.8878, 42.6042),
  ('Danvers, Massachusetts, United States', -70.9300, 42.5751),
  ('Massachusetts, United States', -71.3824, 42.4072)
) AS coords(location_text, longitude, latitude)
WHERE private.profile.location = coords.location_text;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. All users have password: password123
-- 2. Phone is stored in auth.users.phone (native Supabase field)
-- 3. The handle_new_user() trigger automatically creates:
--    - public.users record (public profile with display_name)
--    - private.profile record (PII: first_name, last_name, location)
--    - private.preferences record (settings)
-- 4. Usernames are auto-generated from email prefix
-- 5. ON CONFLICT (id) makes this seed idempotent
-- 6. Admin users: IDs starting with 00000000-0000-0000-0000-00000000000X
-- 7. Regular users: IDs starting with 11111111-1111-1111-1111-11111111111X
-- =========================================================
