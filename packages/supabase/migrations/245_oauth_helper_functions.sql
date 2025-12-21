-- =========================================================
-- 245_oauth_helper_functions.sql
-- REQ-10 Task 4: Create OAuth database helper functions
-- Functions for scope validation, token generation metadata, and app token revocation
-- =========================================================

BEGIN;

-- =========================================================
-- Function: validate_oauth_scope
-- Validates requested OAuth scopes against user's RBAC permissions
-- Returns array of scopes the user is authorized for
-- =========================================================
CREATE OR REPLACE FUNCTION core.validate_oauth_scope(
  p_user_id UUID,
  p_requested_scopes TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
  v_authorized_scopes TEXT[] := ARRAY[]::TEXT[];
  v_scope_record RECORD;
  v_user_permissions TEXT[] := ARRAY[]::TEXT[];
  v_scope_permissions TEXT[];
  v_has_permission BOOLEAN;
BEGIN
  -- Get user's RBAC permissions from role assignments
  SELECT ARRAY_AGG(DISTINCT p.permission)::TEXT[]
  INTO v_user_permissions
  FROM core.role_assignments ra
  JOIN core.roles r ON r.id = ra.role_id
  JOIN core.role_permissions rp ON rp.role_id = r.id
  JOIN core.permissions p ON p.id = rp.permission_id
  WHERE ra.user_id = p_user_id;

  -- If user has no roles, return empty array
  IF v_user_permissions IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Check each requested scope
  FOR v_scope_record IN 
    SELECT scope, rbac_permissions 
    FROM core.oauth_scopes 
    WHERE scope = ANY(p_requested_scopes)
  LOOP
    v_scope_permissions := v_scope_record.rbac_permissions;
    
    -- Check if user has at least one of the required RBAC permissions for this scope
    -- If scope has no RBAC permissions (e.g., openid), user is authorized
    IF array_length(v_scope_permissions, 1) IS NULL THEN
      v_authorized_scopes := v_authorized_scopes || v_scope_record.scope;
    ELSIF v_scope_permissions && v_user_permissions THEN
      -- User has at least one required permission
      v_authorized_scopes := v_authorized_scopes || v_scope_record.scope;
    END IF;
  END LOOP;

  RETURN v_authorized_scopes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION core.validate_oauth_scope IS 'Validates requested OAuth scopes against user RBAC permissions, returns authorized scopes only';

-- =========================================================
-- Function: generate_oauth_token
-- Creates JWT claim structure for OAuth token (to be signed by application layer)
-- Returns JSONB with token metadata including claims structure
-- =========================================================
CREATE OR REPLACE FUNCTION core.generate_oauth_token(
  p_oauth_app_id UUID,
  p_user_id UUID,
  p_scopes TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  v_token_metadata JSONB;
  v_expires_at TIMESTAMPTZ;
  v_issued_at TIMESTAMPTZ := NOW();
  v_expires_in INTEGER := 3600; -- 1 hour in seconds
BEGIN
  v_expires_at := v_issued_at + (v_expires_in || ' seconds')::INTERVAL;

  -- Build JWT claims structure
  -- Note: Actual JWT signing happens in application layer
  -- This function returns the claim structure and metadata for token storage
  v_token_metadata := jsonb_build_object(
    'claims', jsonb_build_object(
      'sub', p_user_id::TEXT,           -- Subject (user ID)
      'iss', 'scaffald',                 -- Issuer
      'aud', p_oauth_app_id::TEXT,      -- Audience (OAuth app ID)
      'scope', array_to_string(p_scopes, ' '), -- Scopes
      'exp', EXTRACT(EPOCH FROM v_expires_at)::INTEGER, -- Expiration timestamp
      'iat', EXTRACT(EPOCH FROM v_issued_at)::INTEGER   -- Issued at timestamp
    ),
    'expires_at', v_expires_at,
    'expires_in', v_expires_in,
    'scopes', p_scopes
  );

  RETURN v_token_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION core.generate_oauth_token IS 'Generates OAuth token metadata with JWT claim structure (to be signed by application layer)';

-- =========================================================
-- Function: revoke_oauth_app_tokens
-- Revokes all tokens for an OAuth application
-- Returns count of revoked tokens
-- =========================================================
CREATE OR REPLACE FUNCTION core.revoke_oauth_app_tokens(
  p_oauth_app_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_revoked_count INTEGER;
BEGIN
  UPDATE core.oauth_tokens
  SET 
    revoked_at = NOW(),
    revoked_reason = 'app_revoked'
  WHERE oauth_app_id = p_oauth_app_id
    AND revoked_at IS NULL;

  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  
  RETURN v_revoked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION core.revoke_oauth_app_tokens IS 'Revokes all active tokens for an OAuth application, returns count of revoked tokens';

-- =========================================================
-- Grants
-- =========================================================
GRANT EXECUTE ON FUNCTION core.validate_oauth_scope(UUID, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core.generate_oauth_token(UUID, UUID, TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION core.revoke_oauth_app_tokens(UUID) TO service_role;

COMMIT;

