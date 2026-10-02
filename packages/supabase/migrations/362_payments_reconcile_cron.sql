-- 362: Schedule the payment reconciliation sweep via pg_cron.
--
-- #948 item 5. `payment_transactions` rows are written before a client_secret
-- is handed out (#949) and advanced to 'succeeded' by `stripe-webhook`. When
-- that webhook never arrives — Stripe gives up after days of retries, the
-- function was down for a deploy, the signing secret was mid-rotation — the row
-- stays 'pending' forever, and so does the `core.success_fees` row behind it.
-- Nothing in the system noticed. The `payments-reconcile` function asks Stripe
-- about anything pending past a threshold and applies the answer through the
-- same settlement module the webhook uses.
--
-- Every 10 minutes, against a 15-minute default threshold, so a stalled charge
-- settles within ~25 minutes of the webhook failing to show up. The sweep is a
-- no-op when nothing is pending: one indexed SELECT
-- (payment_transactions_status_idx) that returns no rows and no Stripe call.
--
-- Follows migration 337's pattern exactly: both environment-specific values
-- come from Vault at run time, so this migration is identical everywhere and
-- cron.job text contains no secret. Until both secrets exist the job runs and
-- the http_post goes nowhere / 401s — inert, and visible in net._http_response.
-- Seeding instructions are in 337.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron unavailable; skipping payments reconcile scheduling';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron;

  IF EXISTS (SELECT 1 FROM cron.job WHERE cron.job.jobname = 'payments-reconcile') THEN
    PERFORM cron.unschedule('payments-reconcile');
  END IF;

  PERFORM cron.schedule(
    'payments-reconcile',
    '*/10 * * * *',
    $cmd$
      SELECT net.http_post(
        url := (
          SELECT decrypted_secret FROM vault.decrypted_secrets
          WHERE name = 'edge_functions_url' LIMIT 1
        ) || '/payments-reconcile',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (
            SELECT decrypted_secret FROM vault.decrypted_secrets
            WHERE name = 'service_role_key' LIMIT 1
          ),
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text),
        timeout_milliseconds := 55000
      );
    $cmd$
  );
END $$;

COMMIT;
