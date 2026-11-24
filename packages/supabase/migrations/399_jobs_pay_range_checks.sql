-- 399: a job's pay range is in order and has a type (#1411, #1412)
--
-- Boris, 23 Nov: a job went live showing "$90,000 – $50,000" — nothing on the
-- client, the api or here checked Min against Max. And a range typed without
-- a pay type showed in My Listings but not to workers, whose formatter needed
-- all three. The api now refuses both (routes/office-jobs.ts, lib/job-pay.ts);
-- these constraints hold the same rules for every other writer.
--
-- Added NOT VALID first so new writes are checked from here on, then the
-- existing rows are fixed, then VALIDATE proves none are left.

BEGIN;

ALTER TABLE core.jobs DROP CONSTRAINT IF EXISTS jobs_pay_range_order_check;
ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_pay_range_order_check
  CHECK (
    pay_range_min_cents IS NULL
    OR pay_range_max_cents IS NULL
    OR pay_range_min_cents <= pay_range_max_cents
  ) NOT VALID;

ALTER TABLE core.jobs DROP CONSTRAINT IF EXISTS jobs_pay_range_type_required_check;
ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_pay_range_type_required_check
  CHECK (
    (pay_range_min_cents IS NULL AND pay_range_max_cents IS NULL)
    OR pay_range_type IS NOT NULL
  ) NOT VALID;

-- Fix the existing rows in one UPDATE: a NOT VALID constraint is still
-- checked on every row an UPDATE writes, so fixing one rule at a time would
-- fail on a row that breaks both.
--
-- Reversed ends: the employer typed them the wrong way round. Office already
-- showed these swapped (cms-format.formatPayRange sorts the ends), so
-- swapping them makes every surface agree with what Office has shown.
--
-- An amount with no type: Office has been reading these as hourly
-- (cms-format defaults a missing type to /hr). Keep that for amounts that
-- read as an hourly rate, and call $1,000 or more a salary, which no hourly
-- trade rate reaches.
UPDATE core.jobs
   SET pay_range_min_cents = CASE WHEN pay_range_min_cents > pay_range_max_cents
                                  THEN pay_range_max_cents ELSE pay_range_min_cents END,
       pay_range_max_cents = CASE WHEN pay_range_min_cents > pay_range_max_cents
                                  THEN pay_range_min_cents ELSE pay_range_max_cents END,
       pay_range_type = coalesce(
         pay_range_type,
         CASE
           WHEN pay_range_min_cents IS NULL AND pay_range_max_cents IS NULL THEN NULL
           WHEN greatest(pay_range_min_cents, pay_range_max_cents) >= 100000 THEN 'salary'
           ELSE 'hourly'
         END
       )
 WHERE pay_range_min_cents > pay_range_max_cents
    OR (
      pay_range_type IS NULL
      AND (pay_range_min_cents IS NOT NULL OR pay_range_max_cents IS NOT NULL)
    );

ALTER TABLE core.jobs VALIDATE CONSTRAINT jobs_pay_range_order_check;
ALTER TABLE core.jobs VALIDATE CONSTRAINT jobs_pay_range_type_required_check;

COMMENT ON CONSTRAINT jobs_pay_range_order_check ON core.jobs IS
  'Min pay is not above Max pay (#1411).';
COMMENT ON CONSTRAINT jobs_pay_range_type_required_check ON core.jobs IS
  'A pay amount comes with a pay type, or workers never see it (#1412).';

COMMIT;
