/**
 * OAuth Management REST API
 * User-facing and admin endpoints for OAuth app management
 * (Does NOT handle protocol-level OAuth flows - see oauth.ts for those)
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { authMiddleware, requireRole } from "../middleware/auth.ts";

const app = new Hono();
app.use("*", authMiddleware);

// =====================================================
// Public/User Endpoints
// =====================================================

// GET /apps/:client_id - Get app details (used by consent page)
app.get("/apps/:client_id", async (c) => {
  const supabase = c.get("supabase");
  const { client_id } = c.req.param();

  const { data, error } = await supabase
    .schema("core")
    .from("oauth_apps")
    .select(
      "id, display_name, description, logo_url, homepage_url, privacy_policy_url, terms_of_service_url",
    )
    .eq("client_id", client_id)
    .eq("status", "active")
    .single();

  // Also allow trusted apps
  if (error || !data) {
    const { data: trustedData, error: trustedError } = await supabase
      .schema("core")
      .from("oauth_apps")
      .select(
        "id, display_name, description, logo_url, homepage_url, privacy_policy_url, terms_of_service_url",
      )
      .eq("client_id", client_id)
      .eq("status", "trusted")
      .single();

    if (trustedError || !trustedData) {
      return c.json({ error: "App not found" }, 404);
    }

    return c.json({
      id: trustedData.id,
      name: trustedData.display_name,
      logo_url: trustedData.logo_url,
      homepage_url: trustedData.homepage_url,
      description: trustedData.description,
      privacy_policy_url: trustedData.privacy_policy_url,
      terms_of_service_url: trustedData.terms_of_service_url,
    });
  }

  return c.json({
    id: data.id,
    name: data.display_name,
    logo_url: data.logo_url,
    homepage_url: data.homepage_url,
    description: data.description,
    privacy_policy_url: data.privacy_policy_url,
    terms_of_service_url: data.terms_of_service_url,
  });
});

// POST /apps - Register a new OAuth app
const registerAppSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  homepage_url: z.string().url(),
  redirect_uris: z.array(z.string().url()).min(1).max(10),
  logo_url: z.string().url().optional(),
  privacy_policy_url: z.string().url().optional(),
  terms_of_service_url: z.string().url().optional(),
  developer_email: z.string().email(),
});

app.post("/apps", zValidator("json", registerAppSchema), async (c) => {
  const user = c.get("user");
  const supabase = c.get("supabase");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const input = c.req.valid("json");

  // Generate client_id and client_secret
  const generateToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(
      /\//g,
      "_",
    ).replace(/=/g, "");
  };

  const clientId = crypto.randomUUID();
  const clientSecret = `cs_${generateToken()}`;

  // Hash the secret
  const encoder = new TextEncoder();
  const secretBuffer = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(clientSecret),
  );
  const secretHash = Array.from(new Uint8Array(secretBuffer)).map((b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

  const { data, error } = await supabase
    .schema("core")
    .from("oauth_apps")
    .insert({
      client_id: clientId,
      client_secret_hash: secretHash,
      display_name: input.name,
      description: input.description,
      homepage_url: input.homepage_url,
      redirect_uris: input.redirect_uris,
      logo_url: input.logo_url || null,
      privacy_policy_url: input.privacy_policy_url || null,
      terms_of_service_url: input.terms_of_service_url || null,
      owner_email: input.developer_email,
      status: "pending",
      requires_approval: true,
      allowed_scopes: ["openid", "profile", "email"],
    })
    .select("id")
    .single();

  if (error || !data) {
    return c.json(
      { error: "Failed to register app", message: error?.message },
      500,
    );
  }

  return c.json({ client_id: clientId, client_secret: clientSecret }, 201);
});

// POST /consent/grant - Grant OAuth consent
const grantConsentSchema = z.object({
  oauth_app_id: z.string().uuid(),
  scopes: z.array(z.string()),
  remember: z.boolean().default(false),
  state: z.string(),
  redirect_uri: z.string().url(),
  code_challenge: z.string(),
  code_challenge_method: z.string().default("S256"),
});

app.post(
  "/consent/grant",
  zValidator("json", grantConsentSchema),
  async (c) => {
    const user = c.get("user");
    const supabase = c.get("supabase");

    if (!user) return c.json({ error: "Unauthorized" }, 401);

    const input = c.req.valid("json");

    // Store consent if remember is true
    if (input.remember) {
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString();
      await supabase.schema("core").from("oauth_user_consents").upsert({
        user_id: user.id,
        oauth_app_id: input.oauth_app_id,
        granted_scopes: input.scopes,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt,
      }, { onConflict: "user_id,oauth_app_id" });
    }

    // Generate authorization code
    const generateToken = () => {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(
        /\//g,
        "_",
      ).replace(/=/g, "");
    };

    const authCode = generateToken();
    const encoder = new TextEncoder();
    const codeBuffer = await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(authCode),
    );
    const codeHash = Array.from(new Uint8Array(codeBuffer)).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const { error: codeError } = await supabase
      .schema("core")
      .from("oauth_authorization_codes")
      .insert({
        code_hash: codeHash,
        oauth_app_id: input.oauth_app_id,
        user_id: user.id,
        redirect_uri: input.redirect_uri,
        scopes: input.scopes,
        code_challenge: input.code_challenge,
        code_challenge_method: input.code_challenge_method,
        expires_at: expiresAt.toISOString(),
      });

    if (codeError) {
      return c.json({ error: "Failed to complete authorization" }, 500);
    }

    const redirectUrl = new URL(input.redirect_uri);
    redirectUrl.searchParams.set("code", authCode);
    redirectUrl.searchParams.set("state", input.state);

    return c.json({ redirect_url: redirectUrl.toString() });
  },
);

// GET /consent - List user consents
app.get("/consent", async (c) => {
  const user = c.get("user");
  const supabase = c.get("supabase");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .schema("core")
    .from("oauth_user_consents")
    .select(
      "id, granted_scopes, granted_at, expires_at, oauth_app:oauth_apps(id, display_name, description, logo_url, homepage_url)",
    )
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });

  if (error) {
    return c.json(
      { error: "Failed to fetch consents", message: error.message },
      500,
    );
  }

  return c.json({ consents: data || [] });
});

// DELETE /consent/:consent_id - Revoke a consent
app.delete("/consent/:consent_id", async (c) => {
  const user = c.get("user");
  const supabase = c.get("supabase");

  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { consent_id } = c.req.param();

  const { error } = await supabase
    .schema("core")
    .from("oauth_user_consents")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", consent_id)
    .eq("user_id", user.id);

  if (error) {
    return c.json(
      { error: "Failed to revoke consent", message: error.message },
      500,
    );
  }

  return c.json({ success: true });
});

// =====================================================
// Admin Endpoints (office role required)
// =====================================================

// GET /admin/apps - List OAuth apps (admin)
const listAppsQuerySchema = z.object({
  status: z.enum([
    "all",
    "pending",
    "active",
    "trusted",
    "suspended",
    "revoked",
  ]).optional(),
  search: z.string().optional(),
});

app.get(
  "/admin/apps",
  requireRole("office", "platform"),
  zValidator("query", listAppsQuerySchema),
  async (c) => {
    const supabase = c.get("supabaseAdmin");
    const { status, search } = c.req.valid("query");

    let query = supabase
      .schema("core")
      .from("oauth_apps")
      .select(
        "id, client_id, display_name, description, status, created_at, approved_at, owner_email",
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("display_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return c.json(
        { error: "Failed to fetch apps", message: error.message },
        500,
      );
    }

    return c.json({ apps: data || [] });
  },
);

// GET /admin/apps/:app_id - Get app detail (admin)
app.get("/admin/apps/:app_id", requireRole("office", "platform"), async (c) => {
  const supabase = c.get("supabaseAdmin");
  const { app_id } = c.req.param();

  const { data, error } = await supabase
    .schema("core")
    .from("oauth_apps")
    .select("*")
    .eq("id", app_id)
    .single();

  if (error || !data) {
    return c.json({ error: "App not found" }, 404);
  }

  return c.json({ app: data });
});

// GET /admin/scopes - List available OAuth scopes (admin)
app.get("/admin/scopes", requireRole("office", "platform"), async (c) => {
  const supabase = c.get("supabaseAdmin");

  const { data, error } = await supabase
    .schema("core")
    .from("oauth_scopes")
    .select("id, scope, display_name, description")
    .order("scope");

  if (error) {
    return c.json(
      { error: "Failed to fetch scopes", message: error.message },
      500,
    );
  }

  return c.json({ scopes: data || [] });
});

// POST /admin/apps/:app_id/approve - Approve an app (admin)
const approveAppSchema = z.object({
  allowed_scopes: z.array(z.string()),
  trust_level: z.enum(["active", "trusted"]).default("active"),
});

app.post(
  "/admin/apps/:app_id/approve",
  requireRole("office", "platform"),
  zValidator("json", approveAppSchema),
  async (c) => {
    const supabase = c.get("supabaseAdmin");
    const { app_id } = c.req.param();
    const { allowed_scopes, trust_level } = c.req.valid("json");

    const { error } = await supabase
      .schema("core")
      .from("oauth_apps")
      .update({
        status: trust_level,
        allowed_scopes,
        approved_at: new Date().toISOString(),
      })
      .eq("id", app_id);

    if (error) {
      return c.json(
        { error: "Failed to approve app", message: error.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

// POST /admin/apps/:app_id/reject - Reject an app (admin)
const rejectAppSchema = z.object({
  reason: z.string().optional(),
});

app.post(
  "/admin/apps/:app_id/reject",
  requireRole("office", "platform"),
  zValidator("json", rejectAppSchema),
  async (c) => {
    const supabase = c.get("supabaseAdmin");
    const { app_id } = c.req.param();
    const { reason } = c.req.valid("json");

    const { error } = await supabase
      .schema("core")
      .from("oauth_apps")
      .update({
        status: "revoked",
        rejection_reason: reason || null,
      })
      .eq("id", app_id);

    if (error) {
      return c.json(
        { error: "Failed to reject app", message: error.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

// POST /admin/apps/:app_id/suspend - Suspend an app (admin)
app.post(
  "/admin/apps/:app_id/suspend",
  requireRole("office", "platform"),
  async (c) => {
    const supabase = c.get("supabaseAdmin");
    const { app_id } = c.req.param();

    // Revoke all active tokens for this app
    await supabase
      .schema("core")
      .from("oauth_tokens")
      .update({
        revoked_at: new Date().toISOString(),
        revoked_reason: "app_suspended",
      })
      .eq("oauth_app_id", app_id)
      .is("revoked_at", null);

    const { error } = await supabase
      .schema("core")
      .from("oauth_apps")
      .update({ status: "suspended" })
      .eq("id", app_id);

    if (error) {
      return c.json(
        { error: "Failed to suspend app", message: error.message },
        500,
      );
    }

    return c.json({ success: true });
  },
);

export default app;
