-- =========================================================
-- 112_req_221_inquiry_schema_expansion.sql
-- Comprehensive inquiry and negotiation system schema
-- Expands application_inquiries table and adds supporting tables
-- =========================================================

BEGIN;

-- =========================================================
-- Update application status to include 'inquired'
-- =========================================================

-- Drop existing constraint if it exists (handle different constraint names)
DO $$
BEGIN
  -- Try to drop constraint with name from 001_schema.sql
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'core'
      AND table_name = 'applications'
      AND constraint_name = 'applications_status_check'
  ) THEN
    ALTER TABLE core.applications
      DROP CONSTRAINT applications_status_check;
  END IF;
  
  -- Try to drop constraint from migration 052
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'core'
      AND table_name = 'applications'
      AND constraint_name = 'core_applications_status_check'
  ) THEN
    ALTER TABLE core.applications
      DROP CONSTRAINT core_applications_status_check;
  END IF;
END;
$$;

-- Add 'inquired' status between 'screen' and 'interview'
ALTER TABLE core.applications
  ADD CONSTRAINT applications_status_check
  CHECK (
    status IN (
      'new', 
      'screen', 
      'inquired',  -- New status for inquiry/negotiation phase
      'interview', 
      'offer', 
      'hired', 
      'rejected', 
      'withdrawn'
    )
  );

-- =========================================================
-- Expand application_inquiries table with all required fields
-- =========================================================

-- Add created_by field (organization member who created the inquiry)
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update status to match REQ requirements
ALTER TABLE core.application_inquiries
  DROP CONSTRAINT IF EXISTS application_inquiries_status_check;

ALTER TABLE core.application_inquiries
  ADD CONSTRAINT application_inquiries_status_check
  CHECK (
    status IN (
      'draft',
      'sent',
      'candidate_responded',
      'organization_responded',
      'accepted',
      'rejected',
      'withdrawn'
    )
  );

-- Set default status to 'draft'
ALTER TABLE core.application_inquiries
  ALTER COLUMN status SET DEFAULT 'draft';

-- Add sent_at timestamp
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- =========================================================
-- Employment terms fields
-- =========================================================

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS employment_type TEXT 
    CHECK (employment_type IN ('permanent', 'temporary'));
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS employment_type_negotiable BOOLEAN DEFAULT true;

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS work_schedule TEXT 
    CHECK (work_schedule IN ('full_time', 'part_time', 'day_week'));
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS work_schedule_negotiable BOOLEAN DEFAULT true;

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS schedule_shifts BOOLEAN DEFAULT false;

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS working_hours_start TIME;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS working_hours_end TIME;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS working_hours_timezone TEXT;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS working_hours_negotiable BOOLEAN DEFAULT true;

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS workdays TEXT[]; -- ['monday', 'tuesday', ...]
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS workdays_negotiable BOOLEAN DEFAULT true;

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS employment_start_date DATE;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS employment_end_date DATE;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS employment_dates_negotiable BOOLEAN DEFAULT true;

-- =========================================================
-- Compensation terms fields
-- =========================================================

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS rate_type TEXT 
    CHECK (rate_type IN ('hourly', 'salary'));
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS rate_min_cents INTEGER;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS rate_max_cents INTEGER;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS rate_negotiable BOOLEAN DEFAULT true;

-- =========================================================
-- Capabilities fields
-- =========================================================

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS endurance_required BOOLEAN DEFAULT false;

-- =========================================================
-- Other terms fields
-- =========================================================

ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS willing_to_travel BOOLEAN;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS travel_distance_miles INTEGER;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS willing_to_work_overtime BOOLEAN;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS has_drivers_license BOOLEAN;
ALTER TABLE core.application_inquiries
  ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- =========================================================
-- Inquiry sections for acceptance tracking
-- =========================================================

CREATE TABLE IF NOT EXISTS core.inquiry_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES core.application_inquiries(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL 
    CHECK (section_name IN ('employment', 'compensation', 'capabilities', 'other')),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (inquiry_id, section_name)
);

-- =========================================================
-- Inquiry comments (threaded per section)
-- =========================================================

CREATE TABLE IF NOT EXISTS core.inquiry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES core.application_inquiries(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL 
    CHECK (section_name IN ('employment', 'compensation', 'capabilities', 'other')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  read_by UUID[] DEFAULT '{}',  -- Array of user IDs who have read this comment
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- Capability responses
-- =========================================================

CREATE TABLE IF NOT EXISTS core.inquiry_capability_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES core.application_inquiries(id) ON DELETE CASCADE,
  capability_name TEXT NOT NULL,
  response_value BOOLEAN,
  response_text TEXT CHECK (response_text IS NULL OR char_length(response_text) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (inquiry_id, capability_name)
);

-- =========================================================
-- Indexes for performance
-- =========================================================

-- Inquiry indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_application 
  ON core.application_inquiries(application_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status 
  ON core.application_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_by 
  ON core.application_inquiries(created_by) 
  WHERE created_by IS NOT NULL;

-- Inquiry sections indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_sections_inquiry 
  ON core.inquiry_sections(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_sections_name 
  ON core.inquiry_sections(section_name);
CREATE INDEX IF NOT EXISTS idx_inquiry_sections_accepted 
  ON core.inquiry_sections(inquiry_id, accepted_by) 
  WHERE accepted_by IS NOT NULL;

-- Inquiry comments indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_comments_inquiry 
  ON core.inquiry_comments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_comments_section 
  ON core.inquiry_comments(section_name);
CREATE INDEX IF NOT EXISTS idx_inquiry_comments_created 
  ON core.inquiry_comments(inquiry_id, section_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiry_comments_sender 
  ON core.inquiry_comments(sender_id);

-- Capability responses indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_capability_responses_inquiry 
  ON core.inquiry_capability_responses(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_capability_responses_name 
  ON core.inquiry_capability_responses(capability_name);

-- =========================================================
-- Foreign key constraints
-- =========================================================

-- Ensure created_by references auth.users
-- (Already added in ALTER TABLE above, but adding explicit comment)

-- Inquiry sections foreign key to users for accepted_by
-- (Already defined in table creation)

-- Inquiry comments foreign key to users for sender_id
-- (Already defined in table creation)

COMMIT;

