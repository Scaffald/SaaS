-- Migration: 305_forsured_insurance_email_upload.sql
-- REQ-13: Contractor Invitation Email with Insurance Document Upload
-- TASK-1: Create database schema for email inbound parse and broker invitation flow
--
-- Purpose: Support insurance document uploads via email forwarding and broker invitation links
--
-- Key Changes:
-- 1. Add inbound_email_address column to forsured.user_profiles
-- 2. Create email_rejection_log table for tracking rejected email attempts
-- 3. Create broker_contractor_relationships table for broker-contractor links
-- 4. Create insurance_uploads table for documents uploaded via email or broker invitation

-- =============================================================================
-- STEP 1: EXTEND forsured.user_profiles FOR INBOUND EMAIL
-- =============================================================================

-- Add column for inbound email address (for receiving forwarded insurance docs)
ALTER TABLE forsured.user_profiles
ADD COLUMN IF NOT EXISTS inbound_email_address TEXT UNIQUE;

-- Create index for fast lookups by inbound email address
CREATE INDEX IF NOT EXISTS idx_user_profiles_inbound_email
  ON forsured.user_profiles(inbound_email_address)
  WHERE inbound_email_address IS NOT NULL;

-- Add comment
COMMENT ON COLUMN forsured.user_profiles.inbound_email_address IS
  'Unique email address for receiving forwarded insurance documents (format: insurance-{id}@inbound.forsured.com)';

-- =============================================================================
-- STEP 2: CREATE email_rejection_log TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.email_rejection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The contractor this email was intended for
  contractor_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,

  -- Email details
  sender_email TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,

  -- Rejection metadata
  attachment_count INTEGER DEFAULT 0,
  rejection_reason TEXT NOT NULL DEFAULT 'sender_email_mismatch',

  -- Raw email metadata (for debugging/auditing)
  email_metadata JSONB DEFAULT '{}',

  -- Timestamps
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for email_rejection_log
CREATE INDEX idx_email_rejection_log_contractor
  ON forsured.email_rejection_log(contractor_id);

CREATE INDEX idx_email_rejection_log_sender
  ON forsured.email_rejection_log(sender_email);

CREATE INDEX idx_email_rejection_log_timestamp
  ON forsured.email_rejection_log(rejected_at DESC);

-- RLS for email_rejection_log
ALTER TABLE forsured.email_rejection_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all rejection logs
CREATE POLICY "Admins can view all email rejections"
  ON forsured.email_rejection_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Users can view rejections related to their account
CREATE POLICY "Users can view their email rejections"
  ON forsured.email_rejection_log
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Service role can insert rejection logs
CREATE POLICY "Service role can manage email rejections"
  ON forsured.email_rejection_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE forsured.email_rejection_log IS
  'REQ-13: Logs rejected email attempts to inbound parse addresses for security auditing';

-- =============================================================================
-- STEP 3: CREATE broker_contractor_relationships TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.broker_contractor_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Broker (the broker user profile)
  broker_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,

  -- Contractor (the contractor user profile)
  contractor_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,

  -- How this relationship was created
  created_by TEXT NOT NULL CHECK (created_by IN (
    'broker_invitation',      -- Via broker invitation link
    'contractor_invitation',  -- Contractor invited broker
    'manager_assignment',     -- Manager assigned broker to contractor
    'manual_entry',           -- Manual data entry
    'import'                  -- Bulk import
  )),

  -- Who created this relationship (user profile id)
  created_by_user_id UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one relationship per broker-contractor pair
  CONSTRAINT broker_contractor_relationships_unique UNIQUE(broker_id, contractor_id)
);

-- Indexes for broker_contractor_relationships
CREATE INDEX idx_broker_contractor_relationships_broker
  ON forsured.broker_contractor_relationships(broker_id);

CREATE INDEX idx_broker_contractor_relationships_contractor
  ON forsured.broker_contractor_relationships(contractor_id);

CREATE INDEX idx_broker_contractor_relationships_status
  ON forsured.broker_contractor_relationships(status)
  WHERE status = 'active';

-- RLS for broker_contractor_relationships
ALTER TABLE forsured.broker_contractor_relationships ENABLE ROW LEVEL SECURITY;

-- Users can view relationships they're part of
CREATE POLICY "Users can view their broker-contractor relationships"
  ON forsured.broker_contractor_relationships
  FOR SELECT
  TO authenticated
  USING (
    broker_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Brokers can create relationships when invited
CREATE POLICY "Users can create broker-contractor relationships"
  ON forsured.broker_contractor_relationships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    created_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Users can update relationships they created
CREATE POLICY "Users can update their relationships"
  ON forsured.broker_contractor_relationships
  FOR UPDATE
  TO authenticated
  USING (
    broker_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role can manage broker-contractor relationships"
  ON forsured.broker_contractor_relationships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated at trigger
CREATE TRIGGER broker_contractor_relationships_updated_at
  BEFORE UPDATE ON forsured.broker_contractor_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE forsured.broker_contractor_relationships IS
  'REQ-13: Tracks relationships between brokers and contractors for document management and notifications';

-- =============================================================================
-- STEP 4: CREATE insurance_uploads TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.insurance_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who this document belongs to (contractor)
  contractor_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,

  -- Who uploaded this document
  uploaded_by_user_id UUID REFERENCES forsured.user_profiles(id) ON DELETE SET NULL,

  -- How the document was uploaded
  upload_method TEXT NOT NULL CHECK (upload_method IN (
    'ui_upload',           -- Standard UI upload
    'email_forward',       -- Forwarded via email to inbound parse address
    'broker_invitation'    -- Uploaded via broker invitation link
  )),

  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,           -- Storage path in Supabase storage
  file_size INTEGER,                 -- Size in bytes
  mime_type TEXT,                    -- MIME type (application/pdf, image/png, etc.)

  -- Processing status
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
    'uploaded',       -- File uploaded, not processed
    'processing',     -- Being processed (OCR, parsing, etc.)
    'processed',      -- Processing complete
    'linked',         -- Linked to an insurance_policy record
    'rejected',       -- File was rejected (invalid, corrupt, etc.)
    'archived'        -- Archived by user
  )),

  -- Optional link to parsed policy
  linked_policy_id UUID REFERENCES forsured.insurance_policies(id) ON DELETE SET NULL,

  -- Email metadata (for email_forward uploads)
  email_metadata JSONB DEFAULT '{}',

  -- Processing metadata
  processing_notes TEXT,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for insurance_uploads
CREATE INDEX idx_insurance_uploads_contractor
  ON forsured.insurance_uploads(contractor_id);

CREATE INDEX idx_insurance_uploads_uploaded_by
  ON forsured.insurance_uploads(uploaded_by_user_id)
  WHERE uploaded_by_user_id IS NOT NULL;

CREATE INDEX idx_insurance_uploads_method
  ON forsured.insurance_uploads(upload_method);

CREATE INDEX idx_insurance_uploads_status
  ON forsured.insurance_uploads(status);

CREATE INDEX idx_insurance_uploads_uploaded_at
  ON forsured.insurance_uploads(uploaded_at DESC);

CREATE INDEX idx_insurance_uploads_linked_policy
  ON forsured.insurance_uploads(linked_policy_id)
  WHERE linked_policy_id IS NOT NULL;

-- RLS for insurance_uploads
ALTER TABLE forsured.insurance_uploads ENABLE ROW LEVEL SECURITY;

-- Contractors can view their own uploads
CREATE POLICY "Contractors can view their uploads"
  ON forsured.insurance_uploads
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Brokers can view uploads for their contractors
CREATE POLICY "Brokers can view contractor uploads"
  ON forsured.insurance_uploads
  FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT bcr.contractor_id
      FROM forsured.broker_contractor_relationships bcr
      JOIN forsured.user_profiles up ON up.id = bcr.broker_id
      WHERE up.scaffald_user_id = auth.uid()
      AND bcr.status = 'active'
    )
  );

-- Uploaders can view their uploads
CREATE POLICY "Uploaders can view their uploads"
  ON forsured.insurance_uploads
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by_user_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Admins can view all uploads
CREATE POLICY "Admins can view all uploads"
  ON forsured.insurance_uploads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
      AND user_type = 'admin'
    )
  );

-- Contractors can insert their own uploads
CREATE POLICY "Contractors can insert uploads"
  ON forsured.insurance_uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    ) OR
    -- Allow brokers to upload for their contractors
    contractor_id IN (
      SELECT bcr.contractor_id
      FROM forsured.broker_contractor_relationships bcr
      JOIN forsured.user_profiles up ON up.id = bcr.broker_id
      WHERE up.scaffald_user_id = auth.uid()
      AND bcr.status = 'active'
    )
  );

-- Contractors can update their uploads
CREATE POLICY "Contractors can update their uploads"
  ON forsured.insurance_uploads
  FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM forsured.user_profiles
      WHERE scaffald_user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role can manage insurance uploads"
  ON forsured.insurance_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Updated at trigger
CREATE TRIGGER insurance_uploads_updated_at
  BEFORE UPDATE ON forsured.insurance_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE forsured.insurance_uploads IS
  'REQ-13: Stores insurance documents uploaded via email forwarding or broker invitation, before parsing into policies';

COMMENT ON COLUMN forsured.insurance_uploads.upload_method IS
  'How the document was uploaded: ui_upload (standard), email_forward (via inbound parse), broker_invitation (via broker link)';

COMMENT ON COLUMN forsured.insurance_uploads.file_path IS
  'Path in Supabase storage bucket (insurance-uploads/{contractor_id}/{filename})';

COMMENT ON COLUMN forsured.insurance_uploads.email_metadata IS
  'For email_forward uploads: sender, subject, received_at, etc.';

-- =============================================================================
-- STEP 5: GRANT PERMISSIONS
-- =============================================================================

-- email_rejection_log
GRANT SELECT ON forsured.email_rejection_log TO authenticated;
GRANT ALL ON forsured.email_rejection_log TO service_role;

-- broker_contractor_relationships
GRANT SELECT, INSERT, UPDATE ON forsured.broker_contractor_relationships TO authenticated;
GRANT ALL ON forsured.broker_contractor_relationships TO service_role;

-- insurance_uploads
GRANT SELECT, INSERT, UPDATE ON forsured.insurance_uploads TO authenticated;
GRANT ALL ON forsured.insurance_uploads TO service_role;

-- =============================================================================
-- STEP 6: CREATE FUNCTION TO GENERATE INBOUND EMAIL ADDRESS
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.generate_inbound_email_address()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate for contractors who don't have one
  IF NEW.user_type = 'contractor' AND NEW.inbound_email_address IS NULL THEN
    NEW.inbound_email_address := 'insurance-' || NEW.id || '@inbound.forsured.com';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate inbound email address for contractors
CREATE TRIGGER user_profiles_generate_inbound_email
  BEFORE INSERT OR UPDATE ON forsured.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION forsured.generate_inbound_email_address();

-- Backfill existing contractors with inbound email addresses
UPDATE forsured.user_profiles
SET inbound_email_address = 'insurance-' || id || '@inbound.forsured.com'
WHERE user_type = 'contractor'
AND inbound_email_address IS NULL;

-- =============================================================================
-- STEP 7: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Verify inbound_email_address column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'forsured'
    AND table_name = 'user_profiles'
    AND column_name = 'inbound_email_address'
  ) INTO column_exists;

  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column inbound_email_address was not created successfully';
  END IF;

  -- Verify email_rejection_log table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured'
    AND table_name = 'email_rejection_log'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table email_rejection_log was not created successfully';
  END IF;

  -- Verify broker_contractor_relationships table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured'
    AND table_name = 'broker_contractor_relationships'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table broker_contractor_relationships was not created successfully';
  END IF;

  -- Verify insurance_uploads table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'forsured'
    AND table_name = 'insurance_uploads'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table insurance_uploads was not created successfully';
  END IF;

  RAISE NOTICE '✅ Migration 305_forsured_insurance_email_upload.sql completed successfully';
  RAISE NOTICE '  - forsured.user_profiles extended with inbound_email_address column';
  RAISE NOTICE '  - forsured.email_rejection_log table created';
  RAISE NOTICE '  - forsured.broker_contractor_relationships table created';
  RAISE NOTICE '  - forsured.insurance_uploads table created';
  RAISE NOTICE '  - Indexes and RLS policies created';
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'REQ-13 Insurance Email Upload Migration (305) applied - inbound email support, broker relationships, insurance uploads';
