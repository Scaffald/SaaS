-- =========================================================
-- 383_get_secret_value_reads_decrypted_secrets.sql
--
-- core.get_secret_value (098) returned vault.get_secret(p_secret_id). No
-- Supabase project has that function — Vault exposes vault.create_secret,
-- vault.update_secret and the vault.decrypted_secrets view — so every call
-- raised 42883 on prod, dev, preview and local (measured 2026-10-17).
--
-- Every Stripe call reads its key through this function: payments,
-- success fees, ID verification, the webhook (loadStripeSecrets) and the
-- reconcile sweep. Nothing noticed because Stripe had never been configured;
-- saving a key would have broken all of them at once (#1259, ahead of #1260).
--
-- Same signature, SECURITY DEFINER and search_path (378); CREATE OR REPLACE
-- keeps the service-role-only ACL from 364.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.get_secret_value(p_secret_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = core, vault, public
AS $function$
DECLARE
  v_secret text;
BEGIN
  IF p_secret_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets
   WHERE id = p_secret_id;
  RETURN v_secret;
END;
$function$;

COMMIT;
