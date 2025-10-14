-- =========================================================
-- 010_add_missing_job_fields.sql - Add minimal missing fields for jobs
-- Adds only essential fields needed by current tRPC endpoints
-- =========================================================

BEGIN;

-- Add created_by tracking to jobs (needed for office.listJobs)
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add compensation fields (used by office router but were missing)
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS pay_range_min_cents INTEGER,
  ADD COLUMN IF NOT EXISTS pay_range_max_cents INTEGER,
  ADD COLUMN IF NOT EXISTS pay_range_type TEXT CHECK (pay_range_type IN ('hourly', 'salary', 'contract', 'project'));

-- Create job_certifications junction table if it doesn't exist
-- (office router tries to query this)
CREATE TABLE IF NOT EXISTS public.job_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES data.certifications(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, certification_id)
);

-- Enable RLS on job_certifications
ALTER TABLE public.job_certifications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read job certifications
CREATE POLICY job_certifications_read ON public.job_certifications
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow job owners to manage certifications
CREATE POLICY job_certifications_manage ON public.job_certifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.organizations o ON o.id = j.organization_id
      WHERE j.id = job_id AND o.owner_user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT ON public.job_certifications TO anon, authenticated;
GRANT ALL ON public.job_certifications TO service_role;

COMMIT;
