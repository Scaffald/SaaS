-- =========================================================
-- 097_success_fee_cron_jobs.sql
-- Queue + cron automation for success fee monitoring
-- =========================================================

BEGIN;

-- =========================================================
-- JOB TABLE
-- =========================================================

CREATE TABLE IF NOT EXISTS core.success_fee_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  success_fee_id UUID NOT NULL REFERENCES core.success_fees(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('final_payment', 'duration_check')),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  last_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS success_fee_jobs_active_job_idx
  ON core.success_fee_jobs (success_fee_id, job_type)
  WHERE processed_at IS NULL;

COMMENT ON TABLE core.success_fee_jobs IS
  'Queue table for background success fee automation (final payment collection + duration checks).';

-- =========================================================
-- ENQUEUE HELPERS
-- =========================================================

CREATE OR REPLACE FUNCTION core.enqueue_due_success_fees()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  WITH due_fees AS (
    SELECT id
    FROM core.success_fees
    WHERE status = 'upfront_paid'
      AND final_amount_cents > 0
      AND final_payment_due_date <= CURRENT_DATE
      AND final_payment_intent_id IS NULL
  ),
  inserted AS (
    INSERT INTO core.success_fee_jobs (success_fee_id, job_type, payload)
    SELECT
      df.id,
      'final_payment',
      jsonb_build_object(
        'final_payment_due_date', sf.final_payment_due_date,
        'final_amount_cents', sf.final_amount_cents
      )
    FROM due_fees df
    JOIN core.success_fees sf ON sf.id = df.id
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.success_fee_jobs j
      WHERE j.success_fee_id = df.id
        AND j.job_type = 'final_payment'
        AND j.processed_at IS NULL
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;

  RETURN COALESCE(v_inserted, 0);
END;
$$;

COMMENT ON FUNCTION core.enqueue_due_success_fees() IS
  'Queues success fees whose final payment is due so that background workers can trigger Stripe charges.';

CREATE OR REPLACE FUNCTION core.enqueue_duration_check_success_fees()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_inserted INTEGER := 0;
BEGIN
  WITH candidates AS (
    SELECT id
    FROM core.success_fees
    WHERE payment_schedule = 'short'
      AND status IN ('pending', 'upfront_paid')
      AND COALESCE(duration_adjusted, FALSE) = FALSE
      AND hire_start_date IS NOT NULL
      AND job_duration_days IS NOT NULL
      AND hire_start_date + (job_duration_days || ' days')::INTERVAL <= (CURRENT_DATE + INTERVAL '2 days')
  ),
  inserted AS (
    INSERT INTO core.success_fee_jobs (success_fee_id, job_type, payload)
    SELECT
      c.id,
      'duration_check',
      jsonb_build_object(
        'hire_start_date', sf.hire_start_date,
        'job_duration_days', sf.job_duration_days
      )
    FROM candidates c
    JOIN core.success_fees sf ON sf.id = c.id
    WHERE NOT EXISTS (
      SELECT 1
      FROM core.success_fee_jobs j
      WHERE j.success_fee_id = c.id
        AND j.job_type = 'duration_check'
        AND j.processed_at IS NULL
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;

  RETURN COALESCE(v_inserted, 0);
END;
$$;

COMMENT ON FUNCTION core.enqueue_duration_check_success_fees() IS
  'Queues short-duration success fees for follow-up to ensure schedules are extended when engagements run long.';

-- =========================================================
-- CRON SCHEDULING
-- =========================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_catalog.pg_proc
    WHERE proname = 'schedule'
      AND pronamespace::regnamespace::text = 'cron'
  ) THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'success-fee-final-payments') THEN
      PERFORM cron.unschedule('success-fee-final-payments');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'success-fee-duration-checks') THEN
      PERFORM cron.unschedule('success-fee-duration-checks');
    END IF;

    PERFORM cron.schedule(
      'success-fee-final-payments',
      '0 2 * * *',
      'SELECT core.enqueue_due_success_fees();'
    );

    PERFORM cron.schedule(
      'success-fee-duration-checks',
      '0 7 * * 1',
      'SELECT core.enqueue_duration_check_success_fees();'
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not available; skipping success fee scheduling.';
  END IF;
END;
$$;

COMMIT;

