-- 361: Give core.payment_transactions the updated_at column its trigger needs.
--
-- Migration 095 created the table WITHOUT an `updated_at` column and then
-- attached `core.set_updated_at()` to it as a BEFORE UPDATE trigger:
--
--   CREATE TRIGGER payment_transactions_set_updated_at
--     BEFORE UPDATE ON core.payment_transactions
--     FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();
--
-- That function assigns NEW.updated_at, so with no such column every UPDATE on
-- the payment ledger raises
--
--   record "new" has no field "updated_at"
--
-- and is rolled back. No row could leave its 'pending' default, in any
-- environment, ever: not via `stripe-webhook` (which would then 500 and make
-- Stripe retry the event forever), not via the /confirm handlers in
-- functions/api/routes/{success-fees,id-verification}.ts, not via a refund.
--
-- It was invisible because Stripe has never been configured anywhere (#928) so
-- the tables are empty, and because the two /confirm handlers discarded the
-- error from that update until #949 and #958. Caught by the first test to run a
-- real UPDATE against the table (tests/routers/payments-settlement.test.ts).
--
-- Every sibling table in 095 — success_fees, background_check_access,
-- id_verifications, service_pricing — has the column and the same trigger, and
-- core.payment_transactions is the only table in the database with the trigger
-- and no column. So the column is the omission, not the trigger: this adds it
-- rather than dropping the trigger, because `updated_at` on a financial ledger
-- is worth having.
--
-- Backfilled from the row's own timestamps rather than NOW(), so existing rows
-- get a truthful value. (There are none today; that will not stay true, and
-- this migration also runs when an environment is rebuilt from scratch.)

BEGIN;

ALTER TABLE core.payment_transactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE core.payment_transactions
   SET updated_at = COALESCE(succeeded_at, failed_at, refunded_at, created_at)
 WHERE updated_at IS NULL;

ALTER TABLE core.payment_transactions
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE core.payment_transactions
  ALTER COLUMN updated_at SET NOT NULL;

COMMENT ON COLUMN core.payment_transactions.updated_at
  IS 'Maintained by the payment_transactions_set_updated_at trigger from migration 095, which could not fire until this column existed (#948).';

COMMIT;
