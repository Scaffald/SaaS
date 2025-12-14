-- Migration: 234_forsured_seed_user_set_types.sql
-- REQ-4: Seed initial user set types for Construction and Property Management
--
-- Creates the two default user set types with their lexicon entries:
-- 1. Construction - General Contractor / Subcontractor terminology
-- 2. Property Management - Property Manager / Contractor terminology

-- Insert Construction user set type
INSERT INTO forsured.user_set_types (
  id,
  name,
  slug,
  manager_label_singular,
  manager_label_plural,
  contractor_label_singular,
  contractor_label_plural,
  description,
  is_active,
  lexicon
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Construction',
  'construction',
  'General Contractor',
  'General Contractors',
  'Subcontractor',
  'Subcontractors',
  'Construction industry vertical for general contractors and subcontractors',
  TRUE,
  '{
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.projects": "Projects",
    "nav.contractors": "Subs",
    "nav.documents": "Documents",
    "nav.acknowledgements": "Acknowledgements",
    "nav.integrations": "Integrations",
    "nav.help": "Help",
    "nav.relationships": "Relationships",
    "nav.managers": "GCs",
    "nav.clients": "Clients",
    "nav.insurance": "Insurance",
    "nav.team": "Team",
    "onboarding.welcome_manager": "Welcome, General Contractor",
    "onboarding.welcome_contractor": "Welcome, Subcontractor",
    "onboarding.company_name": "Company Name",
    "onboarding.company_size": "Company Size",
    "onboarding.primary_location": "Primary Location",
    "role.manager_view": "GC View",
    "role.contractor": "Subcontractor",
    "role.broker": "Broker"
  }'::jsonb
);

-- Insert Property Management user set type
INSERT INTO forsured.user_set_types (
  id,
  name,
  slug,
  manager_label_singular,
  manager_label_plural,
  contractor_label_singular,
  contractor_label_plural,
  description,
  is_active,
  lexicon
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'Property Management',
  'property-management',
  'Property Manager',
  'Property Managers',
  'Contractor',
  'Contractors',
  'Property management industry vertical for property managers and service contractors',
  TRUE,
  '{
    "nav.dashboard": "Dashboard",
    "nav.tasks": "Tasks",
    "nav.projects": "Properties",
    "nav.contractors": "Contractors",
    "nav.documents": "Documents",
    "nav.acknowledgements": "Acknowledgements",
    "nav.integrations": "Integrations",
    "nav.help": "Help",
    "nav.relationships": "Relationships",
    "nav.managers": "Property Managers",
    "nav.clients": "Clients",
    "nav.insurance": "Insurance",
    "nav.team": "Team",
    "onboarding.welcome_manager": "Welcome, Property Manager",
    "onboarding.welcome_contractor": "Welcome, Contractor",
    "onboarding.company_name": "Company Name",
    "onboarding.company_size": "Company Size",
    "onboarding.primary_location": "Primary Location",
    "role.manager_view": "Property Manager View",
    "role.contractor": "Contractor",
    "role.broker": "Broker"
  }'::jsonb
);

-- Insert lexicon entries for Construction (granular storage)
INSERT INTO forsured.user_set_type_lexicon (user_set_type_id, key, value, category) VALUES
  -- Navigation
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.dashboard', 'Dashboard', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.tasks', 'Tasks', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.projects', 'Projects', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.contractors', 'Subs', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.documents', 'Documents', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.acknowledgements', 'Acknowledgements', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.integrations', 'Integrations', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.help', 'Help', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.relationships', 'Relationships', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.managers', 'GCs', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.clients', 'Clients', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.insurance', 'Insurance', 'navigation'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'nav.team', 'Team', 'navigation'),
  -- Onboarding
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'onboarding.welcome_manager', 'Welcome, General Contractor', 'onboarding'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'onboarding.welcome_contractor', 'Welcome, Subcontractor', 'onboarding'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'onboarding.company_name', 'Company Name', 'onboarding'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'onboarding.company_size', 'Company Size', 'onboarding'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'onboarding.primary_location', 'Primary Location', 'onboarding'),
  -- Role Display
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'role.manager_view', 'GC View', 'role_display'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'role.contractor', 'Subcontractor', 'role_display'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'role.broker', 'Broker', 'role_display');

-- Insert lexicon entries for Property Management (granular storage)
INSERT INTO forsured.user_set_type_lexicon (user_set_type_id, key, value, category) VALUES
  -- Navigation
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.dashboard', 'Dashboard', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.tasks', 'Tasks', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.projects', 'Properties', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.contractors', 'Contractors', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.documents', 'Documents', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.acknowledgements', 'Acknowledgements', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.integrations', 'Integrations', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.help', 'Help', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.relationships', 'Relationships', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.managers', 'Property Managers', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.clients', 'Clients', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.insurance', 'Insurance', 'navigation'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'nav.team', 'Team', 'navigation'),
  -- Onboarding
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'onboarding.welcome_manager', 'Welcome, Property Manager', 'onboarding'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'onboarding.welcome_contractor', 'Welcome, Contractor', 'onboarding'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'onboarding.company_name', 'Company Name', 'onboarding'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'onboarding.company_size', 'Company Size', 'onboarding'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'onboarding.primary_location', 'Primary Location', 'onboarding'),
  -- Role Display
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'role.manager_view', 'Property Manager View', 'role_display'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'role.contractor', 'Contractor', 'role_display'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'role.broker', 'Broker', 'role_display');

-- Assign existing test users to Construction user set type
-- (Only update users who don't have a user_set_type_id yet)
-- Note: Uses 'manager' as migration 235 converts 'gc' to 'manager'
UPDATE forsured.user_profiles
SET user_set_type_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE user_set_type_id IS NULL
  AND user_type IN ('manager', 'contractor');

COMMENT ON TABLE forsured.user_set_types IS 'Stores user set types (industry verticals). Seeded with Construction and Property Management.';
