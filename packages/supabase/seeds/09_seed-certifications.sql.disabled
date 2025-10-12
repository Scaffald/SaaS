-- =========================================================
-- 09_seed-certifications.sql
-- Seeds common construction industry certifications
-- =========================================================

BEGIN;

-- Insert certifications (using ON CONFLICT to make idempotent)
INSERT INTO public.certifications (name, slug, issuing_organization, category, description, typical_duration_days, requires_renewal, renewal_period_months) VALUES
  -- OSHA Certifications
  ('OSHA 10-Hour Construction', 'osha-10-construction', 'OSHA', 'safety', 'Basic safety training for construction workers', 2, false, NULL),
  ('OSHA 30-Hour Construction', 'osha-30-construction', 'OSHA', 'safety', 'Comprehensive safety training for supervisors and workers with safety responsibilities', 4, false, NULL),
  ('OSHA 500 Trainer Course', 'osha-500-trainer', 'OSHA', 'safety', 'Authorizes trainers to teach OSHA 10 and 30-hour courses', 5, true, 48),
  ('OSHA 510 Standards Course', 'osha-510-standards', 'OSHA', 'safety', 'In-depth study of OSHA construction standards', 5, false, NULL),
  
  -- CPR and First Aid
  ('CPR/AED Certification', 'cpr-aed', 'American Red Cross', 'safety', 'Cardiopulmonary resuscitation and automated external defibrillator training', 1, true, 24),
  ('First Aid Certification', 'first-aid', 'American Red Cross', 'safety', 'Basic first aid training', 1, true, 24),
  ('CPR/First Aid/AED', 'cpr-first-aid-aed', 'American Red Cross', 'safety', 'Combined CPR, first aid, and AED certification', 1, true, 24),
  
  -- Forklift and Equipment
  ('Forklift Operator Certification', 'forklift-operator', 'OSHA', 'equipment', 'Powered industrial truck operator training', 1, true, 36),
  ('Aerial Lift Certification', 'aerial-lift', 'OSHA', 'equipment', 'Scissor lift and boom lift operation', 1, true, 36),
  ('Crane Operator Certification', 'crane-operator', 'NCCCO', 'equipment', 'Mobile crane operator certification', 5, true, 60),
  ('Rigging Certification', 'rigging', 'NCCCO', 'equipment', 'Signal person and rigger certification', 2, true, 60),
  
  -- CDL Licenses
  ('CDL Class A', 'cdl-class-a', 'State DMV', 'license', 'Commercial Driver License Class A for combination vehicles', 30, true, 60),
  ('CDL Class B', 'cdl-class-b', 'State DMV', 'license', 'Commercial Driver License Class B for heavy vehicles', 30, true, 60),
  ('CDL with Hazmat Endorsement', 'cdl-hazmat', 'State DMV', 'license', 'CDL with hazardous materials endorsement', 30, true, 24),
  
  -- EPA and Environmental
  ('EPA Lead-Safe Certified', 'epa-lead-safe', 'EPA', 'safety', 'Lead-safe work practices for renovation, repair, and painting', 1, true, 60),
  ('EPA Section 608 Certification', 'epa-608', 'EPA', 'safety', 'Refrigerant handling certification', 1, true, NULL),
  ('EPA Section 609 Certification', 'epa-609', 'EPA', 'safety', 'Motor vehicle air conditioning certification', 1, true, NULL),
  ('Asbestos Abatement Certification', 'asbestos-abatement', 'EPA', 'safety', 'Asbestos removal and handling', 5, true, 12),
  
  -- NCCER Craft Certifications
  ('NCCER Core Curriculum', 'nccer-core', 'NCCER', 'trade', 'Foundation skills for construction careers', 10, false, NULL),
  ('NCCER Carpentry Level 1', 'nccer-carpentry-1', 'NCCER', 'trade', 'Basic carpentry skills certification', 20, false, NULL),
  ('NCCER Electrical Level 1', 'nccer-electrical-1', 'NCCER', 'trade', 'Basic electrical skills certification', 20, false, NULL),
  ('NCCER Plumbing Level 1', 'nccer-plumbing-1', 'NCCER', 'trade', 'Basic plumbing skills certification', 20, false, NULL),
  ('NCCER HVAC Level 1', 'nccer-hvac-1', 'NCCER', 'trade', 'Basic HVAC skills certification', 20, false, NULL),
  ('NCCER Welding Level 1', 'nccer-welding-1', 'NCCER', 'trade', 'Basic welding skills certification', 20, false, NULL),
  
  -- Electrical Certifications
  ('Journeyman Electrician', 'journeyman-electrician', 'State Board', 'license', 'Licensed electrician', 1460, true, 36),
  ('Master Electrician', 'master-electrician', 'State Board', 'license', 'Master electrical contractor license', 1825, true, 36),
  ('Electrical Safety', 'electrical-safety', 'NFPA', 'safety', 'NFPA 70E electrical safety training', 1, true, 36),
  
  -- Plumbing Certifications
  ('Journeyman Plumber', 'journeyman-plumber', 'State Board', 'license', 'Licensed plumber', 1460, true, 36),
  ('Master Plumber', 'master-plumber', 'State Board', 'license', 'Master plumbing contractor license', 1825, true, 36),
  ('Backflow Prevention Certification', 'backflow-prevention', 'ASSE', 'trade', 'Cross-connection control specialist', 3, true, 12),
  
  -- HVAC Certifications
  ('HVAC Excellence Certification', 'hvac-excellence', 'HVAC Excellence', 'trade', 'Professional HVAC certification', 5, true, 24),
  ('NATE Certification', 'nate', 'NATE', 'trade', 'North American Technician Excellence certification', 2, true, 24),
  
  -- Welding Certifications
  ('AWS Certified Welder', 'aws-certified-welder', 'AWS', 'trade', 'American Welding Society certification', 3, true, 36),
  ('CWI - Certified Welding Inspector', 'cwi', 'AWS', 'trade', 'Welding inspection certification', 10, true, 36),
  
  -- Specialized Safety
  ('Confined Space Entry', 'confined-space', 'OSHA', 'safety', 'Permit-required confined space training', 1, true, 12),
  ('Fall Protection Certification', 'fall-protection', 'OSHA', 'safety', 'Fall arrest and protection systems', 1, true, 12),
  ('Scaffold User Safety', 'scaffold-user', 'OSHA', 'safety', 'Scaffold erection and safe use', 1, true, 12),
  ('Scaffold Competent Person', 'scaffold-competent-person', 'OSHA', 'safety', 'Scaffold inspection and supervision', 2, true, 12),
  ('Lockout/Tagout', 'lockout-tagout', 'OSHA', 'safety', 'Hazardous energy control procedures', 1, true, 12),
  ('Hazard Communication (HazCom)', 'hazcom', 'OSHA', 'safety', 'Chemical safety and GHS training', 1, true, 36),
  ('Excavation Safety', 'excavation-safety', 'OSHA', 'safety', 'Trenching and excavation competent person', 2, true, 12),
  
  -- Management and Leadership
  ('PMP - Project Management Professional', 'pmp', 'PMI', 'management', 'Professional project management certification', 90, true, 36),
  ('CCM - Certified Construction Manager', 'ccm', 'CMAA', 'management', 'Construction management certification', 60, true, 36),
  ('LEED AP', 'leed-ap', 'USGBC', 'management', 'Leadership in Energy and Environmental Design', 30, true, 24),
  ('OSHA 10-Hour General Industry', 'osha-10-general', 'OSHA', 'safety', 'General industry safety training', 2, false, NULL),
  ('OSHA 30-Hour General Industry', 'osha-30-general', 'OSHA', 'safety', 'General industry safety for supervisors', 4, false, NULL),
  
  -- Additional Trade Certifications
  ('Sheet Metal Worker Certification', 'sheet-metal', 'SMACNA', 'trade', 'Sheet metal fabrication and installation', 30, false, NULL),
  ('Ironworker Certification', 'ironworker', 'IW', 'trade', 'Structural ironworker certification', 30, false, NULL),
  ('Heavy Equipment Operator', 'heavy-equipment', 'NCCCO', 'equipment', 'Heavy machinery operation certification', 10, true, 60),
  ('Tower Crane Operator', 'tower-crane', 'NCCCO', 'equipment', 'Tower crane operation certification', 5, true, 60),
  ('Signal Person Certification', 'signal-person', 'NCCCO', 'equipment', 'Crane signal person certification', 1, true, 60)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  issuing_organization = EXCLUDED.issuing_organization,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  typical_duration_days = EXCLUDED.typical_duration_days,
  requires_renewal = EXCLUDED.requires_renewal,
  renewal_period_months = EXCLUDED.renewal_period_months,
  updated_at = now();

COMMIT;
