-- =========================================================
-- 059_application_screening_team_management.sql
-- Adds application screening, team management, and score fields
-- =========================================================

BEGIN;

-- =========================================================
-- Add application screening requirement fields
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS require_current_location boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_relocation_willingness boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS minimum_years_experience integer CHECK (minimum_years_experience >= 0),
ADD COLUMN IF NOT EXISTS require_work_authorization boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_earliest_start_date boolean DEFAULT false;

-- =========================================================
-- Add auto-rejection configuration
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS enable_auto_reject boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_reject_criteria jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.jobs.auto_reject_criteria IS 'Flexible criteria for automated screening. Example: {"score_minimum": 50, "require_work_authorization": true, "require_all_skills": true}';

-- =========================================================
-- Add team assignment and visibility
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS assigned_team_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_visibility text CHECK (team_visibility IN ('internal_only', 'external_only', 'both')) DEFAULT 'both',
ADD COLUMN IF NOT EXISTS show_team_on_posting boolean DEFAULT false;

COMMENT ON COLUMN public.jobs.assigned_team_id IS 'Internal team responsible for this job posting';
COMMENT ON COLUMN public.jobs.team_visibility IS 'Controls whether job is visible internally, externally, or both';

-- =========================================================
-- Add score integration (generic scoring system)
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS minimum_score integer CHECK (minimum_score >= 0 AND minimum_score <= 100);

COMMENT ON COLUMN public.jobs.minimum_score IS 'Minimum score threshold for applicants (0-100 scale)';

-- =========================================================
-- Create indexes for new fields
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_assigned_team_idx ON public.jobs(assigned_team_id) WHERE assigned_team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_team_visibility_idx ON public.jobs(team_visibility);
CREATE INDEX IF NOT EXISTS jobs_auto_reject_enabled_idx ON public.jobs(enable_auto_reject) WHERE enable_auto_reject = true;
CREATE INDEX IF NOT EXISTS jobs_minimum_score_idx ON public.jobs(minimum_score) WHERE minimum_score IS NOT NULL;

-- =========================================================
-- Add GIN index for auto_reject_criteria jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_auto_reject_criteria_idx ON public.jobs USING gin (auto_reject_criteria);

COMMIT;
