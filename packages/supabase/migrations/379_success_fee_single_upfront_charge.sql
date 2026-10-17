-- =========================================================
-- 379_success_fee_single_upfront_charge.sql
--
-- Clay, 2026-10-17 (#1257): the whole success fee is charged upfront. The
-- 20/80 (30+ day jobs) and 50/50 splits deferred a remainder to a "final
-- payment" that nothing ever charged: the success-fee-final-payments and
-- success-fee-duration-checks crons (097) queued rows in core.success_fee_jobs
-- and no code consumed them, so every fee stopped at upfront_paid.
--
-- 1. payment_schedule gains 'single' — what the api now writes: 100% upfront,
--    final 0, due date = hire start. The existing amount/percentage checks
--    still hold. 'standard' and 'short' stay valid for any historical row
--    (there are none: every payment table is empty on every project, #948).
-- 2. The two crons, their enqueue functions and the queue table go.
-- =========================================================

BEGIN;

ALTER TABLE core.success_fees DROP CONSTRAINT IF EXISTS success_fees_payment_schedule_check;
ALTER TABLE core.success_fees ADD CONSTRAINT success_fees_payment_schedule_check
  CHECK (payment_schedule IN ('single', 'standard', 'short'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'success-fee-final-payments') THEN
    PERFORM cron.unschedule('success-fee-final-payments');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'success-fee-duration-checks') THEN
    PERFORM cron.unschedule('success-fee-duration-checks');
  END IF;
END
$$;

DROP FUNCTION IF EXISTS core.enqueue_due_success_fees();
DROP FUNCTION IF EXISTS core.enqueue_duration_check_success_fees();
DROP TABLE IF EXISTS core.success_fee_jobs;

COMMIT;
