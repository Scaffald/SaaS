-- =========================================================
-- 029_resume_parser.sql
-- Resume upload tracking tables and private storage bucket
-- =========================================================

BEGIN;

-- =========================================================
-- SECTION 1: RESUME UPLOADS TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS core.resume_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsed_at TIMESTAMPTZ,
  parsing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    parsing_status IN ('pending', 'processing', 'completed', 'failed')
  ),
  parsing_errors JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.resume_uploads
  IS 'Tracks user resume uploads stored in Supabase storage for AI parsing.';

COMMENT ON COLUMN core.resume_uploads.parsing_errors
  IS 'JSON payload capturing parsing failures by section.';

CREATE INDEX IF NOT EXISTS resume_uploads_user_idx
  ON core.resume_uploads (user_id, uploaded_at DESC);

CREATE INDEX IF NOT EXISTS resume_uploads_status_idx
  ON core.resume_uploads (parsing_status);

CREATE TRIGGER resume_uploads_set_updated_at
  BEFORE UPDATE ON core.resume_uploads
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

ALTER TABLE core.resume_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own resume uploads" ON core.resume_uploads;
CREATE POLICY "Users can manage their own resume uploads"
  ON core.resume_uploads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT ALL ON TABLE core.resume_uploads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.resume_uploads TO authenticated;

-- =========================================================
-- SECTION 2: RESUME WIZARD STATE TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS core.resume_wizard_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID NOT NULL REFERENCES core.resume_uploads(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
  parsed_data JSONB,
  errors JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, resume_id)
);

COMMENT ON TABLE core.resume_wizard_state
  IS 'Persisted progress for resume import wizard including parsed data.';

COMMENT ON COLUMN core.resume_wizard_state.parsed_data
  IS 'Parsed resume sections stored for the review wizard.';

COMMENT ON COLUMN core.resume_wizard_state.errors
  IS 'Parsing error metadata surfaced to the review wizard.';

CREATE INDEX IF NOT EXISTS resume_wizard_state_user_idx
  ON core.resume_wizard_state (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS resume_wizard_state_resume_idx
  ON core.resume_wizard_state (resume_id);

CREATE TRIGGER resume_wizard_state_set_updated_at
  BEFORE UPDATE ON core.resume_wizard_state
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

ALTER TABLE core.resume_wizard_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own resume wizard state" ON core.resume_wizard_state;
CREATE POLICY "Users can manage their own resume wizard state"
  ON core.resume_wizard_state
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT ALL ON TABLE core.resume_wizard_state TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.resume_wizard_state TO authenticated;

-- =========================================================
-- SECTION 3: RESUMES STORAGE BUCKET
-- =========================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'resumes',
  'resumes',
  false,
  1048576, -- 1MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read their own resume" ON storage.objects;
CREATE POLICY "Users can read their own resume"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can upload their own resume" ON storage.objects;
CREATE POLICY "Users can upload their own resume"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own resume" ON storage.objects;
CREATE POLICY "Users can update their own resume"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own resume" ON storage.objects;
CREATE POLICY "Users can delete their own resume"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

COMMIT;


