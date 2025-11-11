-- =========================================================
-- 037_work_logs_schema.sql
-- Core schema for Work Log system
-- =========================================================

BEGIN;

-- Create work logs table
CREATE TABLE core.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.construction_projects (id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'daily' CHECK (entry_type IN ('daily', 'project', 'task')),
  log_date DATE NOT NULL,
  time_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_hours NUMERIC(5, 2) GENERATED ALWAYS AS (
    (
      SELECT COALESCE(SUM(
        EXTRACT(EPOCH FROM ((entry->>'end')::time - (entry->>'start')::time)) / 3600
      ), 0)
      FROM jsonb_array_elements(time_entries) AS entry
    )
  ) STORED,
  work_description TEXT NOT NULL,
  tasks_completed TEXT[] DEFAULT ARRAY[]::text[],
  skills_used UUID[] DEFAULT ARRAY[]::uuid[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_verification', 'verified', 'disputed')),
  submitted_at TIMESTAMPTZ,
  verified_by_user_id UUID REFERENCES core.users (id),
  verified_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  dispute_reason TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  show_on_profile BOOLEAN DEFAULT FALSE,
  show_date_range_on_profile BOOLEAN DEFAULT FALSE,
  gps_location GEOGRAPHY(POINT, 4326),
  gps_accuracy_meters NUMERIC(10, 2),
  gps_captured_at TIMESTAMPTZ,
  device_type TEXT,
  location_permission_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT work_logs_time_entries_not_empty CHECK (jsonb_array_length(time_entries) > 0),
  CONSTRAINT work_logs_hours_check CHECK (total_hours > 0 AND total_hours <= 24)
);

-- Primary audit log table for work log lifecycle
CREATE TABLE core.work_log_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES core.work_logs (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('status_change', 'edit', 'comment', 'move_project', 'collaborator_added', 'photo_added', 'photo_removed')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborators table
CREATE TABLE core.work_log_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES core.work_logs (id) ON DELETE CASCADE,
  collaborator_user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (work_log_id, collaborator_user_id)
);

-- Work log photos table
CREATE TABLE core.work_log_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES core.work_logs (id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  medium_path TEXT,
  caption TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'progress', 'after', 'general')),
  display_order INT DEFAULT 0,
  file_size_bytes BIGINT NOT NULL,
  show_on_profile BOOLEAN DEFAULT FALSE,
  exif_data JSONB,
  taken_at TIMESTAMPTZ,
  gps_location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Work log conversations for disputes and collaboration
CREATE TABLE core.work_log_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES core.work_logs (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users (id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_system_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage usage tracking
CREATE TABLE core.user_storage_usage (
  user_id UUID PRIMARY KEY REFERENCES core.users (id) ON DELETE CASCADE,
  work_log_photos_bytes BIGINT DEFAULT 0,
  portfolio_photos_bytes BIGINT DEFAULT 0,
  certification_files_bytes BIGINT DEFAULT 0,
  total_bytes BIGINT GENERATED ALWAYS AS (
    work_log_photos_bytes + portfolio_photos_bytes + certification_files_bytes
  ) STORED,
  storage_limit_bytes BIGINT DEFAULT 104857600,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX work_logs_user_date_idx ON core.work_logs (user_id, log_date DESC);
CREATE INDEX work_logs_project_idx ON core.work_logs (project_id);
CREATE INDEX work_logs_status_idx ON core.work_logs (status);
CREATE INDEX work_logs_gps_idx ON core.work_logs USING GIST (gps_location) WHERE gps_location IS NOT NULL;

CREATE INDEX work_log_collaborators_user_idx ON core.work_log_collaborators (collaborator_user_id);

CREATE INDEX work_log_photos_log_idx ON core.work_log_photos (work_log_id);
CREATE INDEX work_log_photos_profile_idx ON core.work_log_photos (show_on_profile) WHERE show_on_profile = TRUE;

CREATE INDEX work_log_audit_log_work_log_idx ON core.work_log_audit_log (work_log_id, created_at DESC);
CREATE INDEX work_log_audit_log_user_idx ON core.work_log_audit_log (user_id);

CREATE INDEX work_log_conversations_log_idx ON core.work_log_conversations (work_log_id, created_at ASC);
CREATE INDEX work_log_conversations_user_idx ON core.work_log_conversations (user_id);

CREATE INDEX user_storage_usage_total_idx ON core.user_storage_usage (total_bytes DESC);

-- Organization-level configuration
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS work_log_require_verification BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS work_log_require_approval_to_move BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS work_log_default_entry_type TEXT DEFAULT 'daily' CHECK (work_log_default_entry_type IN ('daily', 'project', 'task'));

-- Project-level configuration
ALTER TABLE public.construction_projects
  ADD COLUMN IF NOT EXISTS work_log_entry_type_override TEXT CHECK (work_log_entry_type_override IN ('daily', 'project', 'task')),
  ADD COLUMN IF NOT EXISTS work_log_require_verification_override BOOLEAN;

-- System configuration defaults
INSERT INTO public.system_config (key, value, description)
VALUES
  ('work_log_default_storage_limit_mb', '100', 'Default storage limit for work log photos per user (MB)'),
  ('work_log_max_photos_per_entry', '10', 'Maximum number of photos per work log entry'),
  ('work_log_max_photo_size_mb', '2', 'Maximum size per photo (MB)'),
  ('work_log_require_verification_approval', 'false', 'Global default: require verification approval for work logs')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    description = EXCLUDED.description;

COMMIT;


