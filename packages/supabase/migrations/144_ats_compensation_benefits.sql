-- ====================================================================================
-- 144_ats_compensation_benefits.sql
-- Adds compensation and benefits fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Benefits Summary
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS benefits_summary TEXT;

COMMENT ON COLUMN core.jobs.benefits_summary IS
  'Summary of benefits offered with this position.';

-- =========================================================
-- Bonus Structure
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS has_bonus_structure BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_details TEXT;

COMMENT ON COLUMN core.jobs.has_bonus_structure IS
  'Whether this position includes a bonus structure.';
COMMENT ON COLUMN core.jobs.bonus_details IS
  'Details about the bonus structure (e.g., performance-based, annual).';

-- =========================================================
-- Equity
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS has_equity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS equity_details TEXT;

COMMENT ON COLUMN core.jobs.has_equity IS
  'Whether this position includes equity compensation.';
COMMENT ON COLUMN core.jobs.equity_details IS
  'Details about equity compensation (e.g., stock options, RSUs).';

-- =========================================================
-- Sign-On Bonus & Relocation
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS sign_on_bonus_cents INTEGER CHECK (sign_on_bonus_cents >= 0),
  ADD COLUMN IF NOT EXISTS has_relocation_package BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS relocation_package_details TEXT;

COMMENT ON COLUMN core.jobs.sign_on_bonus_cents IS
  'Sign-on bonus amount in cents.';
COMMENT ON COLUMN core.jobs.has_relocation_package IS
  'Whether relocation assistance is offered.';
COMMENT ON COLUMN core.jobs.relocation_package_details IS
  'Details about the relocation package (e.g., moving expenses, temporary housing).';

-- =========================================================
-- Pay Frequency & Overtime
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS overtime_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS pay_frequency TEXT CHECK (pay_frequency IN ('hourly', 'weekly', 'biweekly', 'semimonthly', 'monthly'));

COMMENT ON COLUMN core.jobs.overtime_eligible IS
  'Whether this position is eligible for overtime pay.';
COMMENT ON COLUMN core.jobs.pay_frequency IS
  'Pay frequency: hourly, weekly, biweekly, semimonthly, or monthly.';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_has_bonus_structure
  ON core.jobs(has_bonus_structure)
  WHERE has_bonus_structure = true;

CREATE INDEX IF NOT EXISTS idx_jobs_has_equity
  ON core.jobs(has_equity)
  WHERE has_equity = true;

CREATE INDEX IF NOT EXISTS idx_jobs_has_relocation_package
  ON core.jobs(has_relocation_package)
  WHERE has_relocation_package = true;

CREATE INDEX IF NOT EXISTS idx_jobs_sign_on_bonus_cents
  ON core.jobs(sign_on_bonus_cents)
  WHERE sign_on_bonus_cents > 0;

COMMIT;

