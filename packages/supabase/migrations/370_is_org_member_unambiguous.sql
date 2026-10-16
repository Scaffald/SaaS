-- =========================================================
-- 370_is_org_member_unambiguous.sql
--
-- core.is_org_member (117) declared a variable `user_id` and compared
-- `ra.user_id = user_id` / `ra.scope_org_id = org_id` inside a query whose
-- tables also have those columns. PL/pgSQL cannot tell them apart and raises
-- 42702 "column reference \"user_id\" is ambiguous" on every call that gets
-- past the NULL guard (#1231).
--
-- 39 policies on 14 relations call it — organization_folders, _documents,
-- _document_versions, _document_shares, _settings, _locations,
-- _payment_methods, _storage_usage, _limit_overrides, _audit_log,
-- account_credits, credit_ledger, hire_agreements and storage.objects — so
-- any signed-in read of those that evaluates it fails with a 400 instead of
-- filtering. Prod and dev had no folder or document rows yet, which is the only
-- reason it went unnoticed; reproduced locally with one folder row.
--
-- Same signature and parameter names (39 policies depend on them; CREATE OR
-- REPLACE cannot rename parameters), same SECURITY DEFINER and search_path,
-- same logic: the variable becomes v_user_id and the parameters are qualified
-- with the function name. CREATE OR REPLACE keeps the ACL from 369.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.is_org_member(org_id uuid, target_user uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = core, public, extensions
AS $function$
DECLARE
  v_user_id UUID := COALESCE(is_org_member.target_user, auth.uid());
BEGIN
  IF is_org_member.org_id IS NULL OR v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM core.organizations o
    WHERE o.id = is_org_member.org_id
      AND (
        o.owner_user_id = v_user_id
        OR EXISTS (
          SELECT 1
          FROM core.role_assignments ra
          JOIN core.roles r ON r.id = ra.role_id
          WHERE ra.user_id = v_user_id
            AND (
              ra.scope_org_id = is_org_member.org_id
              OR (r.scope = 'platform' AND r.name IN ('admin', 'super_admin'))
            )
        )
      )
  );
END;
$function$;

COMMIT;
