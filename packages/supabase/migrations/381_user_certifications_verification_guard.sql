-- =========================================================
-- 381_user_certifications_verification_guard.sql
--
-- A worker could mark their own certification verified (#1276).
-- POST /v1/profiles/certifications/save copied `verification_status` from
-- the request body into core.user_certifications, and nothing in the
-- database stopped it: a signed-in user owns their rows under RLS, and the
-- column had no guard. Verified certifications are what employers are shown
-- as trust, so this is the one column on the row its owner must not set.
--
-- The api route no longer takes the field. This trigger is the second line:
-- whatever path writes the row, a caller that is not the service role (or a
-- superuser running a migration / seed) cannot
--   * insert a certification with any status but 'unverified',
--   * change the status of an existing one,
-- and if they change what the certification *is* — its catalog entry, name,
-- issuer, credential, dates or proof file — the status drops back to
-- 'unverified', so a verified row cannot be renamed into a different one.
--
-- Verification itself happens server-side, with the service role, which this
-- leaves untouched.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.guard_user_certification_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = core, public
AS $$
BEGIN
  -- The service role (edge functions acting as Scaffald) and superusers
  -- (migrations, seeds, an operator in psql) may set anything.
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.verification_status IS DISTINCT FROM 'unverified' THEN
      RAISE EXCEPTION 'verification_status is set by Scaffald, not by the certification''s owner'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    RAISE EXCEPTION 'verification_status is set by Scaffald, not by the certification''s owner'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.certification_id IS DISTINCT FROM OLD.certification_id
     OR NEW.name IS DISTINCT FROM OLD.name
     OR NEW.issuing_organization IS DISTINCT FROM OLD.issuing_organization
     OR NEW.credential_id IS DISTINCT FROM OLD.credential_id
     OR NEW.issue_date IS DISTINCT FROM OLD.issue_date
     OR NEW.expiration_date IS DISTINCT FROM OLD.expiration_date
     OR NEW.certificate_file_path IS DISTINCT FROM OLD.certificate_file_path THEN
    NEW.verification_status := 'unverified';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION core.guard_user_certification_verification() IS
  'Only the service role may set user_certifications.verification_status; an owner''s edit to what the certification is resets it to unverified (#1276).';

DROP TRIGGER IF EXISTS trg_user_certifications_verification_guard ON core.user_certifications;
CREATE TRIGGER trg_user_certifications_verification_guard
  BEFORE INSERT OR UPDATE ON core.user_certifications
  FOR EACH ROW EXECUTE FUNCTION core.guard_user_certification_verification();

-- Not callable directly by clients; it only runs as a trigger.
REVOKE ALL ON FUNCTION core.guard_user_certification_verification() FROM PUBLIC, anon, authenticated;

COMMIT;
