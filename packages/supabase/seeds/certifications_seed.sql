-- =========================================================
-- Seed common construction industry certifications
-- =========================================================

BEGIN;

-- Clear existing seed data (optional - only for development)
-- DELETE FROM public.certifications WHERE slug LIKE 'osha-%' OR slug LIKE 'forklift-%' OR slug LIKE 'crane-%';

-- Insert safety certifications
-- Use INSERT with WHERE NOT EXISTS to skip duplicates
INSERT INTO public.certifications (name, slug, issuing_organization, category, description, typical_duration_days, requires_renewal, renewal_period_months, metadata)
SELECT name, slug, issuing_organization, category::text, description, typical_duration_days, requires_renewal, renewal_period_months, metadata::jsonb FROM (VALUES
  ('OSHA 10-Hour Construction', 'osha-10-hour-construction', 'Occupational Safety and Health Administration', 'safety', '10-hour safety training covering construction hazards and OSHA standards', 2, false, NULL, '{"level": "entry", "target_audience": "construction workers"}'),
  ('OSHA 30-Hour Construction', 'osha-30-hour-construction', 'Occupational Safety and Health Administration', 'safety', '30-hour comprehensive safety training for supervisors and workers with safety responsibilities', 4, false, NULL, '{"level": "advanced", "target_audience": "supervisors, safety personnel"}'),
  ('First Aid/CPR/AED', 'first-aid-cpr-aed', 'American Red Cross', 'safety', 'Emergency response training including CPR and AED use', 1, true, 24, '{"level": "entry", "format": "in-person"}'),
  ('Confined Space Entry', 'confined-space-entry', 'OSHA Authorized Trainer', 'safety', 'Training for working in permit-required confined spaces', 1, true, 36, '{"level": "intermediate", "hazard_level": "high"}'),
  ('Fall Protection', 'fall-protection', 'OSHA Authorized Trainer', 'safety', 'Training on fall hazards, prevention, and protection equipment', 1, true, 36, '{"level": "intermediate", "hazard_level": "high"}'),
  ('Scaffold Safety', 'scaffold-safety', 'OSHA Authorized Trainer', 'safety', 'Safe scaffold erection, use, and inspection procedures', 1, true, 36, '{"level": "intermediate", "equipment": "scaffolding"}'),
  ('Hazmat/HazWoper', 'hazmat-hazwoper', 'OSHA Authorized Trainer', 'safety', 'Hazardous materials and waste operations training', 5, true, 12, '{"level": "advanced", "hazard_level": "high"}'),

  -- Equipment operation certifications
  ('Forklift Operator', 'forklift-operator', 'OSHA Authorized Trainer', 'equipment', 'Powered industrial truck operation and safety', 1, true, 36, '{"equipment_type": "powered_industrial_truck", "capacity": "various"}'),
  ('Crane Operator - Mobile', 'crane-operator-mobile', 'NCCCO', 'equipment', 'Mobile crane operation certification', NULL, true, 60, '{"equipment_type": "crane", "certification_body": "NCCCO"}'),
  ('Crane Operator - Tower', 'crane-operator-tower', 'NCCCO', 'equipment', 'Tower crane operation certification', NULL, true, 60, '{"equipment_type": "crane", "certification_body": "NCCCO"}'),
  ('Aerial Lift Operation', 'aerial-lift-operation', 'OSHA Authorized Trainer', 'equipment', 'Boom lift and scissor lift operation', 1, true, 36, '{"equipment_type": "aerial_lift"}'),
  ('Heavy Equipment Operator', 'heavy-equipment-operator', 'NCCER', 'equipment', 'Operation of bulldozers, excavators, and loaders', NULL, false, NULL, '{"equipment_type": "heavy_equipment", "level": "operator"}'),

  -- Trade certifications
  ('Journeyman Electrician', 'journeyman-electrician', 'State Licensing Board', 'license', 'Licensed electrician qualification', NULL, true, 36, '{"trade": "electrical", "level": "journeyman"}'),
  ('Master Electrician', 'master-electrician', 'State Licensing Board', 'license', 'Master electrician license', NULL, true, 36, '{"trade": "electrical", "level": "master"}'),
  ('Journeyman Plumber', 'journeyman-plumber', 'State Licensing Board', 'license', 'Licensed plumber qualification', NULL, true, 36, '{"trade": "plumbing", "level": "journeyman"}'),
  ('Master Plumber', 'master-plumber', 'State Licensing Board', 'license', 'Master plumber license', NULL, true, 36, '{"trade": "plumbing", "level": "master"}'),
  ('Welding Certification - SMAW', 'welding-cert-smaw', 'AWS', 'trade', 'Shielded Metal Arc Welding certification', NULL, true, 36, '{"trade": "welding", "process": "SMAW"}'),
  ('Welding Certification - GTAW', 'welding-cert-gtaw', 'AWS', 'trade', 'Gas Tungsten Arc Welding certification', NULL, true, 36, '{"trade": "welding", "process": "GTAW"}'),
  ('HVAC/R Certification', 'hvac-r-certification', 'EPA', 'trade', 'Heating, ventilation, air conditioning, and refrigeration certification', NULL, true, 60, '{"trade": "hvac", "certification_body": "EPA"}'),
  ('Carpentry Certification', 'carpentry-certification', 'NCCER', 'trade', 'Certified carpenter qualification', NULL, false, NULL, '{"trade": "carpentry", "certification_body": "NCCER"}'),
  
  -- Specialized licenses
  ('Asbestos Abatement', 'asbestos-abatement', 'State Environmental Agency', 'license', 'Licensed asbestos removal and abatement', NULL, true, 12, '{"hazard_type": "asbestos", "regulation": "EPA"}'),
  ('Lead-Safe Certified', 'lead-safe-certified', 'EPA', 'license', 'Lead-safe work practices certification', 1, true, 60, '{"hazard_type": "lead", "regulation": "EPA"}'),
  ('Demolition License', 'demolition-license', 'State Licensing Board', 'license', 'Licensed demolition contractor', NULL, true, 36, '{"specialty": "demolition"}'),
  ('Rigging Certification', 'rigging-certification', 'NCCCO', 'equipment', 'Certified rigger for load handling', NULL, true, 60, '{"specialty": "rigging", "certification_body": "NCCCO"}'),
  ('Concrete Finisher', 'concrete-finisher', 'ACI', 'trade', 'American Concrete Institute certification', NULL, true, 60, '{"trade": "concrete", "certification_body": "ACI"}'),

  -- Management certifications
  ('Project Management Professional (PMP)', 'pmp', 'PMI', 'management', 'Project Management Institute professional certification', NULL, true, 36, '{"level": "professional", "certification_body": "PMI"}'),
  ('Construction Manager Certification', 'construction-manager', 'CMAA', 'management', 'Certified Construction Manager', NULL, true, 36, '{"level": "manager", "certification_body": "CMAA"}'),
  ('LEED Green Associate', 'leed-green-associate', 'USGBC', 'management', 'Leadership in Energy and Environmental Design certification', NULL, true, 24, '{"specialty": "green_building", "level": "associate"}'),
  ('LEED AP', 'leed-ap', 'USGBC', 'management', 'LEED Accredited Professional', NULL, true, 24, '{"specialty": "green_building", "level": "professional"}'),
  ('Safety Manager Certification', 'safety-manager', 'BCSP', 'management', 'Certified Safety Professional', NULL, true, 60, '{"specialty": "safety", "certification_body": "BCSP"}')
) AS v(name, slug, issuing_organization, category, description, typical_duration_days, requires_renewal, renewal_period_months, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM public.certifications c 
  WHERE c.name = v.name OR c.slug = v.slug
);

COMMIT;
