-- 398: a job gets posted_at when it goes live (#1409)
--
-- My Listings labelled live jobs "0d IN DRAFT": listingAgeLabel reads a null
-- posted_at as "in draft", and nothing set posted_at when a job went live.
-- The create insert and the PATCH in the api's office-jobs route never wrote
-- it; the only writer was the scheduled-publish cron (110). On local, 51 of
-- 62 open jobs had none.
--
-- A BEFORE trigger rather than another column in the route, so every writer
-- is covered: the job form, the Kanban board, duplicate, the cron, SQL.
-- posted_at is the first time the job went live; a later re-open keeps it.
--
-- `open` is the live status the CHECK allows. `published` is the spelling the
-- public listing used once and the client still maps; it is listed so the
-- trigger stays right if that status is ever admitted.

BEGIN;

CREATE OR REPLACE FUNCTION core.jobs_set_posted_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  IF NEW.status IN ('open', 'published') AND NEW.posted_at IS NULL THEN
    NEW.posted_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION core.jobs_set_posted_at() IS
  'BEFORE INSERT/UPDATE on core.jobs: stamps posted_at the first time a job is live (#1409).';

DROP TRIGGER IF EXISTS trg_jobs_set_posted_at ON core.jobs;
CREATE TRIGGER trg_jobs_set_posted_at
  BEFORE INSERT OR UPDATE OF status, posted_at ON core.jobs
  FOR EACH ROW
  EXECUTE FUNCTION core.jobs_set_posted_at();

-- Backfill the live rows that have none. created_at is the earliest the job
-- can have gone up, and it is what the list already counted the age from, so
-- no row's "Nd" changes, only the word beside it. The updated_at trigger is
-- held off so the backfill doesn't make every row look just edited.
ALTER TABLE core.jobs DISABLE TRIGGER trg_jobs_updated_at;

UPDATE core.jobs
   SET posted_at = created_at
 WHERE status IN ('open', 'published')
   AND posted_at IS NULL;

ALTER TABLE core.jobs ENABLE TRIGGER trg_jobs_updated_at;

COMMIT;
