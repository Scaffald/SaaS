-- =========================================================
-- 054_enhance_jobs_for_ats.sql
-- Enhances jobs table and creates certifications catalog for ATS functionality
-- =========================================================

BEGIN;

-- =========================================================
-- Create certifications catalog table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug citext UNIQUE NOT NULL,
  issuing_organization text,
  category text CHECK (category IN ('safety', 'trade', 'equipment', 'license', 'management', 'other')),
  description text,
  typical_duration_days int,
  requires_renewal boolean DEFAULT false,
  renewal_period_months int,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certifications_category_idx ON public.certifications(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS certifications_name_trgm_idx ON public.certifications USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS certifications_active_idx ON public.certifications(is_active);

-- Enable RLS on certifications
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

-- Public read access for certifications catalog
CREATE POLICY "certifications_public_read"
  ON public.certifications FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Only platform admins can manage certifications
CREATE POLICY "certifications_admin_manage"
  ON public.certifications FOR ALL
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

GRANT SELECT ON public.certifications TO anon, authenticated;
GRANT ALL ON public.certifications TO service_role;

-- =========================================================
-- Enhance jobs table with ATS fields
-- =========================================================

-- Add structured pay range fields
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS pay_range_min_cents int,
ADD COLUMN IF NOT EXISTS pay_range_max_cents int,
ADD COLUMN IF NOT EXISTS pay_range_type text CHECK (pay_range_type IN ('hourly', 'salary', 'contract', 'project'));

-- Add creator tracking
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add constraint to ensure pay range min is less than max
ALTER TABLE public.jobs
ADD CONSTRAINT pay_range_valid CHECK (
  (pay_range_min_cents IS NULL AND pay_range_max_cents IS NULL) OR
  (pay_range_min_cents IS NOT NULL AND pay_range_max_cents IS NOT NULL AND pay_range_min_cents <= pay_range_max_cents)
);

-- =========================================================
-- Create job_certifications junction table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.job_certifications (
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  is_required boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, certification_id)
);

CREATE INDEX IF NOT EXISTS job_certifications_job_idx ON public.job_certifications(job_id);
CREATE INDEX IF NOT EXISTS job_certifications_cert_idx ON public.job_certifications(certification_id);
CREATE INDEX IF NOT EXISTS job_certifications_required_idx ON public.job_certifications(job_id, is_required) WHERE is_required = true;

-- Enable RLS on job_certifications
ALTER TABLE public.job_certifications ENABLE ROW LEVEL SECURITY;

-- Public can view job certifications
CREATE POLICY "job_certifications_public_read"
  ON public.job_certifications FOR SELECT
  TO anon, authenticated
  USING (true);

-- Job owners can manage certifications
CREATE POLICY "job_certifications_owner_manage"
  ON public.job_certifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id 
        AND o.owner_user_id = auth.uid()
    )
  );

-- Platform admins can manage all job certifications
CREATE POLICY "job_certifications_admin_manage"
  ON public.job_certifications FOR ALL
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

GRANT SELECT ON public.job_certifications TO anon, authenticated;
GRANT ALL ON public.job_certifications TO service_role;

-- =========================================================
-- Update jobs table RLS for multi-org admin access
-- =========================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "jobs_insert" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update" ON public.jobs;

-- Recreate insert policy with admin support
CREATE POLICY "jobs_insert"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Organization owner can insert
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = organization_id AND o.owner_user_id = auth.uid()
    )
    -- OR platform admin can insert for any organization
    OR EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Recreate update policy with admin support
CREATE POLICY "jobs_update"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    -- Organization owner can update
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = public.jobs.organization_id AND o.owner_user_id = auth.uid()
    )
    -- OR platform admin can update any job
    OR EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- Same checks for the updated data
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = public.jobs.organization_id AND o.owner_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- Add delete policy for jobs
CREATE POLICY "jobs_delete"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (
    -- Organization owner can delete (soft delete recommended instead)
    EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = public.jobs.organization_id AND o.owner_user_id = auth.uid()
    )
    -- OR platform admin can delete any job
    OR EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- =========================================================
-- Create updated_at trigger for certifications
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_certifications_updated_at ON public.certifications;
CREATE TRIGGER trg_certifications_updated_at
  BEFORE UPDATE ON public.certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =========================================================
-- Create helper view for jobs with certifications
-- =========================================================
CREATE OR REPLACE VIEW public.v_jobs_with_details AS
SELECT
  j.*,
  o.name as organization_name,
  o.slug as organization_slug,
  array_remove(array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL), NULL) as required_certifications,
  array_remove(array_agg(DISTINCT s.name) FILTER (WHERE s.id IS NOT NULL), NULL) as required_skills
FROM public.jobs j
LEFT JOIN public.organizations o ON o.id = j.organization_id
LEFT JOIN public.job_certifications jc ON jc.job_id = j.id AND jc.is_required = true
LEFT JOIN public.certifications c ON c.id = jc.certification_id
LEFT JOIN public.job_skills js ON js.job_id = j.id
LEFT JOIN public.skills s ON s.id = js.skill_id
GROUP BY j.id, o.name, o.slug;

GRANT SELECT ON public.v_jobs_with_details TO anon, authenticated;

COMMIT;
