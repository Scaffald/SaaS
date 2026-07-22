/**
 * OAuth 2.0 Authorization Server (REST)
 * Scaffald OAuth Provider Integration
 *
 * Migrated from tRPC router to REST endpoints
 * Implements OAuth 2.0 with PKCE for third-party integrations
 *
 * Endpoints:
 * - POST /authorize - Authorization endpoint with PKCE (Task 5)
 * - POST /token - Token endpoint with multiple grant types (Task 6)
 * - POST /revoke - Token revocation (Task 7)
 * - POST /introspect - Token introspection (Task 7)
 * - GET /userinfo - UserInfo endpoint (Task 8)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

const app = new Hono();

// OAuth protocol endpoints are server-authoritative: client credentials,
// authorization codes and tokens live in core.oauth_* tables that only
// service_role may read (no anon/authenticated grants). The request-scoped
// RLS client can never see them — every handler here made all OAuth flows
// fail with invalid_client/401 until switched to the service client.
function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

// =============================================================================
// Validation Schemas
// =============================================================================

const authorizeSchema = z.object({
  client_id: z.string().uuid(),
  redirect_uri: z.string().url(),
  response_type: z.literal("code"),
  scope: z.string(), // Space-separated scopes
  state: z.string().min(8), // CSRF protection
  code_challenge: z.string(), // Base64url-encoded SHA-256 hash
  code_challenge_method: z.literal("S256"),
});

const tokenSchema = z.object({
  grant_type: z.enum([
    "authorization_code",
    "refresh_token",
    "client_credentials",
  ]),
  code: z.string().optional(), // For authorization_code
  redirect_uri: z.string().url().optional(), // For authorization_code
  code_verifier: z.string().optional(), // For authorization_code with PKCE
  refresh_token: z.string().optional(), // For refresh_token
  client_id: z.string().uuid(),
  client_secret: z.string(),
  scope: z.string().optional(), // For client_credentials
});

const revokeSchema = z.object({
  token: z.string(),
  token_type_hint: z.enum(["access_token", "refresh_token"]).optional(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
});

const introspectSchema = z.object({
  token: z.string(),
  client_id: z.string().uuid(),
  client_secret: z.string(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Hash a string with SHA-256 and return hex string
 */
async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify PKCE code_verifier against code_challenge
 */
async function verifyPKCE(
  codeVerifier: string,
  codeChallenge: string,
): Promise<boolean> {
  const verifierHashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier),
  );
  const verifierHashArray = Array.from(new Uint8Array(verifierHashBuffer));
  const base64VerifierHash = btoa(String.fromCharCode(...verifierHashArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return base64VerifierHash === codeChallenge;
}

/**
 * Generate a random authorization code or token
 */
function generateSecureToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Log OAuth event to audit log
 */
async function logOAuthEvent(
  // biome-ignore lint/suspicious/noExplicitAny: Supabase client type
  supabase: any,
  eventType: string,
  details: Record<string, unknown>,
  oauthAppId?: string,
  userId?: string,
) {
  try {
    await supabase
      .schema("core")
      .from("oauth_app_audit_log")
      .insert({
        event_type: eventType,
        oauth_app_id: oauthAppId || null,
        user_id: userId || null,
        details: details,
        ip_address: null,
        user_agent: null,
      });
  } catch (error) {
    console.error("[oauth] Failed to log audit event", error);
    // Don't throw - audit logging failure shouldn't break OAuth flow
  }
}

/**
 * OAuth error response helper
 */
function oauthError(error: string, description: string, _statusCode = 400) {
  return {
    error,
    error_description: description,
  };
}

// =============================================================================
// OAuth 2.0 Endpoints
// =============================================================================

/**
 * POST /authorize
 * OAuth 2.0 Authorization Endpoint with PKCE
 *
 * Flow:
 * 1. Validate client app and redirect_uri
 * 2. Check user authentication
 * 3. Validate scopes and permissions
 * 4. Check if consent is needed
 * 5. Generate authorization code
 * 6. Return redirect URL or consent screen
 */
app.post(
  "/authorize",
  authMiddleware,
  zValidator("json", authorizeSchema),
  async (c) => {
    const input = c.req.valid("json");
    const user = c.get("user");
    const supabase = getServiceClient();

    // If user not authenticated, return pending auth info for session storage
    if (!user) {
      return c.json(
        {
          authentication_required: true,
          pending_auth: {
            client_id: input.client_id,
            redirect_uri: input.redirect_uri,
            state: input.state,
            scope: input.scope,
            code_challenge: input.code_challenge,
            code_challenge_method: input.code_challenge_method,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          },
        },
        200,
      );
    }

    // Parse requested scopes
    const requestedScopes = input.scope.split(" ").filter((s) => s.length > 0);

    // Validate client app
    const { data: app, error: appError } = await supabase
      .schema("core")
      .from("oauth_apps")
      .select("*")
      .eq("client_id", input.client_id)
      .single();

    if (appError || !app) {
      return c.json(
        oauthError("unauthorized_client", "Invalid client_id"),
        400,
      );
    }

    // Check app status
    if (app.status !== "active" && app.status !== "trusted") {
      return c.json(
        oauthError("unauthorized_client", "App is suspended or revoked"),
        403,
      );
    }

    // Verify redirect_uri matches registered URIs
    if (!app.redirect_uris.includes(input.redirect_uri)) {
      return c.json(
        oauthError("invalid_request", "redirect_uri mismatch"),
        400,
      );
    }

    // Validate requested scopes against app's allowed_scopes
    const invalidScopes = requestedScopes.filter((scope) =>
      !app.allowed_scopes.includes(scope)
    );
    if (invalidScopes.length > 0) {
      return c.json(
        oauthError(
          "invalid_scope",
          `Scopes not allowed: ${invalidScopes.join(", ")}`,
        ),
        400,
      );
    }

    // Validate user permissions using database function (lives in core).
    const { data: authorizedScopes, error: scopeError } = await supabase
      .schema("core")
      .rpc(
        "validate_oauth_scope",
        {
          p_user_id: user.id,
          p_requested_scopes: requestedScopes,
        },
      );

    if (scopeError || !authorizedScopes || authorizedScopes.length === 0) {
      return c.json(
        oauthError("invalid_scope", "User lacks required permissions"),
        403,
      );
    }

    // Check if consent is needed
    const { data: existingConsent } = await supabase
      .schema("core")
      .from("oauth_user_consents")
      .select("*")
      .eq("user_id", user.id)
      .eq("oauth_app_id", app.id)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    // Trusted (first-party) apps skip the consent screen entirely. Everyone
    // else needs consent unless a valid, unrevoked grant already exists.
    // (Was `||`, which forced consent even for trusted apps with no prior
    // grant — the trusted fast-path could never trigger.)
    const needsConsent = app.status !== "trusted" && !existingConsent;

    if (needsConsent) {
      // Return consent_required flag for UI to show consent screen
      return c.json({
        consent_required: true,
        oauth_app_id: app.id,
        app: {
          id: app.id,
          name: app.display_name,
          logo_url: app.logo_url,
          homepage_url: app.homepage_url,
          description: app.description,
          privacy_policy_url: app.privacy_policy_url,
          terms_of_service_url: app.terms_of_service_url,
        },
        requested_scopes: authorizedScopes,
        state: input.state,
        redirect_uri: input.redirect_uri,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
      });
    }

    // Generate authorization code
    const authCode = generateSecureToken();
    const codeHash = await sha256Hash(authCode);

    // Store authorization code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: codeError } = await supabase
      .schema("core")
      .from("oauth_authorization_codes")
      .insert({
        code_hash: codeHash,
        oauth_app_id: app.id,
        user_id: user.id,
        redirect_uri: input.redirect_uri,
        scopes: authorizedScopes,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) {
      console.error("[oauth] Failed to store authorization code", codeError);
      return c.json(
        oauthError("server_error", "Failed to generate authorization code"),
        500,
      );
    }

    // Log authorization event
    await logOAuthEvent(
      supabase,
      "authorization_granted",
      { scopes: authorizedScopes, redirect_uri: input.redirect_uri },
      app.id,
      user.id,
    );

    // Return redirect URL with authorization code
    const redirectUrl = new URL(input.redirect_uri);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("state", input.state);

    return c.json({
      redirect_url: redirectUrl.toString(),
      consent_required: false,
    });
  },
);

/**
 * POST /token
 * OAuth 2.0 Token Endpoint
 *
 * Supports multiple grant types:
 * - authorization_code: Exchange authorization code for tokens
 * - refresh_token: Refresh an access token
 * - client_credentials: Service-to-service authentication
 */
app.post("/token", zValidator("form", tokenSchema), async (c) => {
  const input = c.req.valid("form");
  const supabase = getServiceClient();

  // Authenticate client
  const { data: app, error: appError } = await supabase
    .schema("core")
    .from("oauth_apps")
    .select("*")
    .eq("client_id", input.client_id)
    .single();

  if (appError || !app) {
    return c.json(
      oauthError("invalid_client", "Invalid client credentials"),
      401,
    );
  }

  // Verify client secret (SHA-256 hex, matching how secrets are stored;
  // bcrypt would be stronger but this must at least actually compare).
  // Previously only checked that a hash EXISTED — any secret was accepted.
  if (
    !app.client_secret_hash ||
    (await sha256Hash(input.client_secret)) !== app.client_secret_hash
  ) {
    return c.json(
      oauthError("invalid_client", "Invalid client credentials"),
      401,
    );
  }

  // Handle authorization_code grant
  if (input.grant_type === "authorization_code") {
    if (!input.code || !input.redirect_uri || !input.code_verifier) {
      return c.json(
        oauthError("invalid_request", "Missing required parameters"),
        400,
      );
    }

    // Hash the authorization code
    const codeHash = await sha256Hash(input.code);

    // Find authorization code
    const { data: authCode, error: codeError } = await supabase
      .schema("core")
      .from("oauth_authorization_codes")
      .select("*")
      .eq("code_hash", codeHash)
      .eq("oauth_app_id", app.id)
      .is("used_at", null)
      .single();

    if (codeError || !authCode) {
      return c.json(
        oauthError("invalid_grant", "Invalid or expired authorization code"),
        400,
      );
    }

    // Check expiration
    if (new Date(authCode.expires_at) < new Date()) {
      return c.json(
        oauthError("invalid_grant", "Authorization code expired"),
        400,
      );
    }

    // Verify redirect_uri
    if (authCode.redirect_uri !== input.redirect_uri) {
      return c.json(oauthError("invalid_grant", "redirect_uri mismatch"), 400);
    }

    // Verify PKCE code_verifier
    const pkceValid = await verifyPKCE(
      input.code_verifier,
      authCode.code_challenge,
    );
    if (!pkceValid) {
      return c.json(
        oauthError("invalid_grant", "PKCE verification failed"),
        400,
      );
    }

    // Mark code as used
    await supabase
      .schema("core")
      .from("oauth_authorization_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", authCode.id);

    // Generate tokens
    const accessToken = generateSecureToken();
    const refreshToken = generateSecureToken();

    const accessTokenHash = await sha256Hash(accessToken);
    const refreshTokenHash = await sha256Hash(refreshToken);

    // Store tokens (access: 1 hour, refresh: 30 days)
    const expiresAt = new Date(Date.now() + 3600 * 1000);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await supabase
      .schema("core")
      .from("oauth_tokens")
      .insert([
        {
          token_hash: accessTokenHash,
          token_type: "access_token",
          oauth_app_id: app.id,
          user_id: authCode.user_id,
          scopes: authCode.scopes,
          expires_at: expiresAt.toISOString(),
        },
        {
          token_hash: refreshTokenHash,
          token_type: "refresh_token",
          oauth_app_id: app.id,
          user_id: authCode.user_id,
          scopes: authCode.scopes,
          expires_at: refreshExpiresAt.toISOString(),
        },
      ]);

    // Log token issuance
    await logOAuthEvent(
      supabase,
      "token_issued",
      { grant_type: "authorization_code", scopes: authCode.scopes },
      app.id,
      authCode.user_id,
    );

    return c.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: authCode.scopes.join(" "),
    });
  }

  // Handle refresh_token grant
  if (input.grant_type === "refresh_token") {
    if (!input.refresh_token) {
      return c.json(
        oauthError("invalid_request", "Missing refresh_token"),
        400,
      );
    }

    // Hash refresh token
    const refreshTokenHash = await sha256Hash(input.refresh_token);

    // Find refresh token
    const { data: refreshToken, error: tokenError } = await supabase
      .schema("core")
      .from("oauth_tokens")
      .select("*")
      .eq("token_hash", refreshTokenHash)
      .eq("token_type", "refresh_token")
      .eq("oauth_app_id", app.id)
      .is("revoked_at", null)
      .single();

    if (tokenError || !refreshToken) {
      return c.json(
        oauthError("invalid_grant", "Invalid or revoked refresh token"),
        400,
      );
    }

    // Check expiration
    if (new Date(refreshToken.expires_at) < new Date()) {
      return c.json(oauthError("invalid_grant", "Refresh token expired"), 400);
    }

    // Revoke old refresh token (rotation)
    await supabase
      .schema("core")
      .from("oauth_tokens")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_reason: "rotated",
      })
      .eq("id", refreshToken.id);

    // Generate new tokens
    const newAccessToken = generateSecureToken();
    const newRefreshToken = generateSecureToken();

    const accessTokenHash = await sha256Hash(newAccessToken);
    const refreshTokenHashNew = await sha256Hash(newRefreshToken);

    const expiresAt = new Date(Date.now() + 3600 * 1000);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);

    await supabase
      .schema("core")
      .from("oauth_tokens")
      .insert([
        {
          token_hash: accessTokenHash,
          token_type: "access_token",
          oauth_app_id: app.id,
          user_id: refreshToken.user_id,
          scopes: refreshToken.scopes,
          expires_at: expiresAt.toISOString(),
        },
        {
          token_hash: refreshTokenHashNew,
          token_type: "refresh_token",
          oauth_app_id: app.id,
          user_id: refreshToken.user_id,
          scopes: refreshToken.scopes,
          expires_at: refreshExpiresAt.toISOString(),
        },
      ]);

    await logOAuthEvent(
      supabase,
      "token_refreshed",
      { scopes: refreshToken.scopes },
      app.id,
      refreshToken.user_id,
    );

    return c.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: refreshToken.scopes.join(" "),
    });
  }

  // Handle client_credentials grant
  if (input.grant_type === "client_credentials") {
    // Client credentials grant - no user context
    const requestedScopes = input.scope
      ? input.scope.split(" ")
      : app.allowed_scopes;

    // Validate scopes
    const invalidScopes = requestedScopes.filter((scope) =>
      !app.allowed_scopes.includes(scope)
    );
    if (invalidScopes.length > 0) {
      return c.json(
        oauthError(
          "invalid_scope",
          `Scopes not allowed: ${invalidScopes.join(", ")}`,
        ),
        400,
      );
    }

    // Generate access token (no refresh token for client_credentials)
    const accessToken = generateSecureToken();
    const accessTokenHash = await sha256Hash(accessToken);
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    await supabase.schema("core").from("oauth_tokens").insert({
      token_hash: accessTokenHash,
      token_type: "access_token",
      oauth_app_id: app.id,
      user_id: null, // No user for client_credentials
      scopes: requestedScopes,
      expires_at: expiresAt.toISOString(),
    });

    await logOAuthEvent(
      supabase,
      "token_issued",
      { grant_type: "client_credentials", scopes: requestedScopes },
      app.id,
    );

    return c.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: requestedScopes.join(" "),
    });
  }

  return c.json(
    oauthError("unsupported_grant_type", "Invalid grant_type"),
    400,
  );
});

/**
 * POST /revoke
 * OAuth 2.0 Token Revocation Endpoint
 */
app.post("/revoke", zValidator("form", revokeSchema), async (c) => {
  const input = c.req.valid("form");
  const supabase = getServiceClient();

  // Authenticate client
  const { data: app, error: appError } = await supabase
    .schema("core")
    .from("oauth_apps")
    .select("*")
    .eq("client_id", input.client_id)
    .single();

  if (
    appError || !app || !app.client_secret_hash ||
    (await sha256Hash(input.client_secret)) !== app.client_secret_hash
  ) {
    return c.json(
      oauthError("invalid_client", "Invalid client credentials"),
      401,
    );
  }

  // Hash token
  const tokenHash = await sha256Hash(input.token);

  // Find and revoke token
  const { data: token } = await supabase
    .schema("core")
    .from("oauth_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("oauth_app_id", app.id)
    .single();

  if (token) {
    await supabase
      .schema("core")
      .from("oauth_tokens")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_reason: "user_revoked",
      })
      .eq("id", token.id);

    await logOAuthEvent(
      supabase,
      "token_revoked",
      { token_type: input.token_type_hint || "unknown" },
      app.id,
      token.user_id,
    );
  }

  // Always return 200 OK (RFC 7009)
  return c.json({ success: true });
});

/**
 * POST /introspect
 * OAuth 2.0 Token Introspection Endpoint
 */
app.post("/introspect", zValidator("form", introspectSchema), async (c) => {
  const input = c.req.valid("form");
  const supabase = getServiceClient();

  // Authenticate client
  const { data: app, error: appError } = await supabase
    .schema("core")
    .from("oauth_apps")
    .select("*")
    .eq("client_id", input.client_id)
    .single();

  if (
    appError || !app || !app.client_secret_hash ||
    (await sha256Hash(input.client_secret)) !== app.client_secret_hash
  ) {
    return c.json({ active: false }, 401);
  }

  // Hash token
  const tokenHash = await sha256Hash(input.token);

  // Find token
  const { data: token } = await supabase
    .schema("core")
    .from("oauth_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("oauth_app_id", app.id)
    .is("revoked_at", null)
    .single();

  if (!token || new Date(token.expires_at) < new Date()) {
    return c.json({ active: false });
  }

  return c.json({
    active: true,
    scope: token.scopes.join(" "),
    client_id: app.client_id,
    token_type: token.token_type,
    exp: Math.floor(new Date(token.expires_at).getTime() / 1000),
    sub: token.user_id || undefined,
  });
});

/**
 * GET /userinfo
 * OAuth 2.0 UserInfo Endpoint
 * Returns user profile information for the authenticated user
 */
app.get("/userinfo", authMiddleware, async (c) => {
  const user = c.get("user");
  const supabase = getServiceClient();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Names live in core.profile (keyed by user_id); avatar/display live in
  // core.users. (Was reading core.user_profiles, which holds career data and
  // no name columns, so every field came back undefined.)
  const [{ data: profile }, { data: account }] = await Promise.all([
    supabase
      .schema("core")
      .from("profile")
      .select("first_name, last_name, updated_at")
      .eq("user_id", user.id)
      .single(),
    supabase
      .schema("core")
      .from("users")
      .select("avatar_url, display_name, updated_at")
      .eq("id", user.id)
      .single(),
  ]);

  if (!profile && !account) {
    return c.json({
      sub: user.id,
      email: user.email,
    });
  }

  const firstName = profile?.first_name ?? undefined;
  const lastName = profile?.last_name ?? undefined;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") ||
    account?.display_name || undefined;
  const updatedRaw = profile?.updated_at ?? account?.updated_at;

  // Omit optional OIDC claims that have no value rather than emitting nulls,
  // so consumers can distinguish "unset" from present.
  const claims: Record<string, unknown> = {
    sub: user.id,
    email: user.email,
  };
  if (fullName) claims.name = fullName;
  if (firstName) claims.given_name = firstName;
  if (lastName) claims.family_name = lastName;
  if (account?.avatar_url) claims.picture = account.avatar_url;
  if (updatedRaw) {
    claims.updated_at = Math.floor(new Date(updatedRaw).getTime() / 1000);
  }

  return c.json(claims);
});

export default app;
