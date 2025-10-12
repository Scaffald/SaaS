-- =========================================================
-- 062_compensation_benefits.sql
-- Adds comprehensive compensation and benefits fields
-- =========================================================

BEGIN;

-- =========================================================
-- Add benefits and bonus information
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS benefits_summary text,
ADD COLUMN IF NOT EXISTS has_bonus_structure boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_details text,
ADD COLUMN IF NOT EXISTS has_equity boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS equity_details text,
ADD COLUMN IF NOT EXISTS sign_on_bonus_cents integer CHECK (sign_on_bonus_cents >= 0),
ADD COLUMN IF NOT EXISTS has_relocation_package boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS relocation_package_details text;

-- =========================================================
-- Add pay structure details
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS overtime_eligible boolean,
ADD COLUMN IF NOT EXISTS pay_frequency text CHECK (
  pay_frequency IN ('hourly', 'weekly', 'biweekly', 'semimonthly', 'monthly')
);

-- =========================================================
-- Create indexes for compensation queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_bonus_structure_idx ON public.jobs(has_bonus_structure) WHERE has_bonus_structure = true;
CREATE INDEX IF NOT EXISTS jobs_equity_idx ON public.jobs(has_equity) WHERE has_equity = true;
CREATE INDEX IF NOT EXISTS jobs_sign_on_bonus_idx ON public.jobs(sign_on_bonus_cents) WHERE sign_on_bonus_cents IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_relocation_package_idx ON public.jobs(has_relocation_package) WHERE has_relocation_package = true;
CREATE INDEX IF NOT EXISTS jobs_overtime_eligible_idx ON public.jobs(overtime_eligible) WHERE overtime_eligible IS NOT NULL;

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.benefits_summary IS 'Overview of benefits package';
COMMENT ON COLUMN public.jobs.sign_on_bonus_cents IS 'Sign-on bonus amount in cents';
COMMENT ON COLUMN public.jobs.pay_frequency IS 'How often employee is paid';
COMMENT ON COLUMN public.jobs.overtime_eligible IS 'Whether position is eligible for overtime pay';

COMMIT;
