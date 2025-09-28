-- 021_enhance_profile_tables.sql
-- Enhances existing profile tables and creates new ones for comprehensive profile management

BEGIN;

-- Update user_private table with new employment fields
ALTER TABLE public.user_private 
ADD COLUMN IF NOT EXISTS preferred_work_locations text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS residency_countries text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS drivers_license_classes text[] DEFAULT array[]::text[],
ADD COLUMN IF NOT EXISTS military_status text[] DEFAULT array[]::text[];

-- Update profiles table with enhanced general fields
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text;

-- Create user_certifications table
CREATE TABLE IF NOT EXISTS public.user_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date,
  expiration_date date,
  credential_id text,
  credential_url text,
  description text,
  skills_gained text[] DEFAULT array[]::text[],
  is_active boolean DEFAULT true,
  verification_status text DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'pending', 'unverified')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_education table
CREATE TABLE IF NOT EXISTS public.user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution_name text NOT NULL,
  degree_type text,
  field_of_study text,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  gpa numeric(3,2),
  honors text[] DEFAULT array[]::text[],
  activities text,
  description text,
  location text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_experience table
CREATE TABLE IF NOT EXISTS public.user_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  job_title text NOT NULL,
  company_name text NOT NULL,
  employment_type text,
  location text,
  is_remote boolean DEFAULT false,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  description text,
  key_achievements text[] DEFAULT array[]::text[],
  skills_used text[] DEFAULT array[]::text[],
  industry text,
  company_size text,
  salary_range text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_certifications_user_id_idx ON public.user_certifications(user_id);
CREATE INDEX IF NOT EXISTS user_certifications_active_idx ON public.user_certifications(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS user_education_user_id_idx ON public.user_education(user_id);
CREATE INDEX IF NOT EXISTS user_education_current_idx ON public.user_education(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS user_experience_user_id_idx ON public.user_experience(user_id);
CREATE INDEX IF NOT EXISTS user_experience_current_idx ON public.user_experience(user_id, is_current) WHERE is_current = true;

-- Enable RLS on new tables
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experience ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_certifications
CREATE POLICY "Users can view their own certifications"
  ON public.user_certifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
  ON public.user_certifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
  ON public.user_certifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
  ON public.user_certifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for user_education
CREATE POLICY "Users can view their own education"
  ON public.user_education FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education"
  ON public.user_education FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education"
  ON public.user_education FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education"
  ON public.user_education FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for user_experience
CREATE POLICY "Users can view their own experience"
  ON public.user_experience FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience"
  ON public.user_experience FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience"
  ON public.user_experience FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience"
  ON public.user_experience FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_certifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_education TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_experience TO authenticated;

-- Add updated_at triggers
CREATE TRIGGER trg_user_certifications_updated_at
  BEFORE UPDATE ON public.user_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_education_updated_at
  BEFORE UPDATE ON public.user_education
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_user_experience_updated_at
  BEFORE UPDATE ON public.user_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMIT;
