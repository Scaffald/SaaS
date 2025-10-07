-- =========================================================
-- 057_create_applications_table.sql
-- Creates applications table for job application tracking
-- =========================================================

BEGIN;

-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS public.applications CASCADE;

-- =========================================================
-- Create applications table
-- =========================================================
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Application status workflow
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',      -- Initial application submitted
      'reviewing',    -- Being reviewed by hiring team
      'interview',    -- Scheduled for interview
      'offer',        -- Offer extended
      'hired',        -- Application accepted, candidate hired
      'rejected',     -- Application rejected
      'withdrawn'     -- Candidate withdrew application
    )
  ),
  
  -- Application content
  cover_letter text,
  resume_path text,
  
  -- Additional notes and metadata
  notes jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  applied_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one application per user per job
  CONSTRAINT unique_user_job_application UNIQUE (job_id, user_id)
);

-- Create indexes for common queries
CREATE INDEX applications_job_id_idx ON public.applications(job_id);
CREATE INDEX applications_user_id_idx ON public.applications(user_id);
CREATE INDEX applications_status_idx ON public.applications(status);
CREATE INDEX applications_applied_at_idx ON public.applications(applied_at DESC);

-- Composite index for filtering user's applications by status
CREATE INDEX applications_user_status_idx ON public.applications(user_id, status);

-- Composite index for filtering job applications by status
CREATE INDEX applications_job_status_idx ON public.applications(job_id, status);

-- =========================================================
-- Enable RLS on applications
-- =========================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "applications_user_read_own"
  ON public.applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own applications
CREATE POLICY "applications_user_create_own"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own applications (withdraw only)
CREATE POLICY "applications_user_update_own"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() 
    AND status = 'withdrawn' -- Only allow users to withdraw
  );

-- Job owners can view applications for their jobs
CREATE POLICY "applications_owner_read"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id 
        AND o.owner_user_id = auth.uid()
    )
  );

-- Job owners can update application status
CREATE POLICY "applications_owner_update"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id 
        AND o.owner_user_id = auth.uid()
    )
  );

-- Platform admins can view all applications
CREATE POLICY "applications_admin_read"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Platform admins can update any application
CREATE POLICY "applications_admin_update"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON public.applications TO authenticated;
GRANT INSERT ON public.applications TO authenticated;
GRANT UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

-- =========================================================
-- Create updated_at trigger
-- =========================================================
DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- Create helper view for applications with job details
-- =========================================================
CREATE OR REPLACE VIEW public.v_applications_with_details AS
SELECT
  a.*,
  j.title as job_title,
  j.status as job_status,
  j.employment_type,
  j.remote_option,
  j.location as job_location,
  j.pay_range_min_cents,
  j.pay_range_max_cents,
  j.pay_range_type,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  p.first_name as applicant_first_name,
  p.last_name as applicant_last_name,
  p.avatar_path as applicant_avatar_path
FROM public.applications a
JOIN public.jobs j ON j.id = a.job_id
JOIN public.organizations o ON o.id = j.organization_id
JOIN public.profiles p ON p.id = a.user_id;

GRANT SELECT ON public.v_applications_with_details TO authenticated;

-- =========================================================
-- Create function to check if user has already applied
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_existing_application(
  p_job_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.applications
    WHERE job_id = p_job_id 
      AND user_id = p_user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_existing_application TO authenticated;

COMMIT;
