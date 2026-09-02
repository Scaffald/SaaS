import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Context, Next } from "hono";
import {
  hashApiKey,
  validateApiKeyFormat,
} from "../../_shared/utils/api-key.ts";

/**
 * The shape this middleware puts on the Hono context.
 *
 * Without it every route file constructed a bare `new OpenAPIHono()`, whose
 * default env has no Variables. `c.get("supabase")` then infers as `never`, and
 * every property access on it is an error -- 41 in routes/jobs.ts alone, none
 * of them real. That made `pnpm test:deno:types` unable to pass, so it provided
 * no signal at all and a genuine type error would have been indistinguishable
 * from the noise (#477).
 *
 * Route files parameterize their app with this: `new OpenAPIHono<ApiEnv>()`.
 *
 * `user` and `organization` are optional because the two auth paths populate
 * different halves: a JWT sets `user` and leaves `organization` unset, while an
 * API key sets `organization` and explicitly sets `user` to undefined, since
 * server-to-server calls have no user. `supabaseAdmin` is set only on the
 * routes that opt into it.
 */
export type ApiEnv = {
  Variables: {
    supabase: SupabaseClient;
    supabaseAdmin: SupabaseClient;
    authType: "jwt" | "api_key";
    user?: { id: string; email?: string | null };
    userToken?: string;
    organization?: { id: string; [key: string]: unknown };
    apiKey?: {
      id: string;
      organizationId: string;
      name: string;
      scopes: string[];
      rateLimitTier: string;
    };
  };
};

/**
 * Authentication middleware - verifies JWT tokens OR API keys and adds context
 *
 * This middleware supports two authentication methods:
 * 1. JWT tokens (Bearer {jwt}) - for user authentication via Supabase Auth
 * 2. API keys (Bearer sk_live_xxx or Bearer sk_test_xxx) - for third-party SDK access
 *
 * For JWT tokens:
 * - Creates a Supabase client with RLS (Row Level Security) enabled
 * - Verifies the token and adds user to context
 * - Shares the same auth logic as tRPC context.ts
 *
 * For API keys:
 * - Validates key format and checks database
 * - Adds organization context (not user context)
 * - Updates last_used_at timestamp
 * - Enforces rate limits by tier
 */
export async function authMiddleware(c: Context<ApiEnv>, next: Next) {
  // Skip auth for health checks (monitoring/liveness probes)
  const path = new URL(c.req.url).pathname;
  if (path.endsWith("/health")) {
    await next();
    return;
  }
  // Skip auth for symbolicate (Expo/Metro stack trace symbolication; this API does not provide it)
  if (path.includes("/symbolicate")) {
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "")?.trim();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    throw new Error("Missing required Supabase environment variables");
  }

  // Check if this is an API key (starts with sk_)
  const isApiKey = token?.startsWith("sk_");

  if (isApiKey && token) {
    // ============================================================================
    // API Key Authentication
    // ============================================================================

    // Validate format
    if (!validateApiKeyFormat(token)) {
      return c.json(
        {
          error: "Invalid API Key",
          message:
            "API key format is invalid. Expected format: sk_{test|live}_{32_chars}",
        },
        401,
      );
    }

    // Hash the API key to look it up in database
    const keyHash = await hashApiKey(token);

    // Use service role client to bypass RLS for API key lookup
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Look up API key
    const { data: apiKeyData, error: keyError } = await serviceClient
      .schema("core")
      .from("api_keys")
      .select(
        `
        id,
        organization_id,
        name,
        key_prefix,
        scopes,
        rate_limit_tier,
        is_active,
        expires_at,
        organizations:organization_id (
          id,
          name,
          slug
        )
      `,
      )
      .eq("key_hash", keyHash)
      .single();

    if (keyError || !apiKeyData) {
      return c.json(
        {
          error: "Invalid API Key",
          message: "API key not found or has been revoked",
        },
        401,
      );
    }

    // Check if key is active
    if (!apiKeyData.is_active) {
      return c.json(
        {
          error: "API Key Revoked",
          message: "This API key has been revoked",
        },
        401,
      );
    }

    // Check if key is expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return c.json(
        {
          error: "API Key Expired",
          message: "This API key has expired",
        },
        401,
      );
    }

    // Update last_used_at timestamp (fire and forget).
    //
    // This used to be `.then(...).catch(...)`, which could not report anything.
    // PostgREST builders resolve with `{ error }` rather than rejecting, so a
    // failed update never reached the catch; and the builder's then() returns
    // PromiseLike<void>, which has no .catch at all, so the handler was not
    // even well-typed. Read the error off the resolved value instead.
    void (async () => {
      const { error: touchError } = await serviceClient
        .schema("core")
        .from("api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKeyData.id);
      if (touchError) {
        console.error("Failed to update API key last_used_at:", touchError);
      }
    })();

    // API-key requests are server-to-server and already validated above. Use the
    // service-role client so RLS-protected reads work (e.g. core.api_keys grants
    // only authenticated/service_role — an anon client gets permission denied →
    // 404/500). Handlers scope every query by apiKey.organizationId.
    const supabase = serviceClient;

    // Add to Hono context
    c.set("supabase", supabase);
    c.set("authType", "api_key");
    c.set("apiKey", {
      id: apiKeyData.id,
      organizationId: apiKeyData.organization_id,
      name: apiKeyData.name,
      scopes: apiKeyData.scopes || [],
      rateLimitTier: apiKeyData.rate_limit_tier,
    });
    // PostgREST returns an embedded to-one relation as an object, but
    // supabase-js types `organizations:organization_id (...)` as an array,
    // because it cannot infer cardinality from the select string. Normalize so
    // the value matches its declared type either way. Nothing reads this key
    // today; a consumer that did would have got an array where the type
    // promises an object.
    const embeddedOrg = apiKeyData.organizations as
      | ApiEnv["Variables"]["organization"]
      | ApiEnv["Variables"]["organization"][]
      | null;
    c.set(
      "organization",
      Array.isArray(embeddedOrg) ? embeddedOrg[0] : (embeddedOrg ?? undefined),
    );
    c.set("user", undefined); // API keys don't have user context

    await next();
    return;
  }

  // ============================================================================
  // JWT Token Authentication (existing logic)
  // ============================================================================

  // Detect if using anon key vs actual user token
  const isAnonKey = token === supabaseAnonKey;

  // Create Supabase client with RLS enforcement
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token && !isAnonKey ? { Authorization: `Bearer ${token}` } : {},
    },
  });

  // Verify token and get user
  let user = null;
  let userEmail = null;

  if (token && !isAnonKey) {
    const {
      data: { user: verifiedUser },
      error,
    } = await supabase.auth.getUser(token);
    if (!error && verifiedUser) {
      user = verifiedUser;
      userEmail = verifiedUser.email;
    }
  }

  // Add to Hono context (matches tRPC context structure)
  c.set("supabase", supabase);
  c.set("authType", "jwt");
  c.set("user", user ? { id: user.id, email: userEmail } : undefined);
  c.set("userToken", token);

  await next();
}

/**
 * Require authentication - throws 401 if no authenticated user OR API key
 */
export async function requireAuth(c: Context, next: Next) {
  const user = c.get("user");
  const apiKey = c.get("apiKey");

  // Accept either user (JWT) or API key authentication
  if (!user && !apiKey) {
    return c.json(
      {
        error: "Unauthorized",
        message:
          "Authentication required. Please provide a valid Bearer token or API key.",
      },
      401,
    );
  }

  await next();
}

/**
 * Add supabaseAdmin to context for JWT-authenticated users.
 * Used by protected endpoints that need service-role client (e.g. id-verification, Stripe).
 * Does nothing for API key auth (user is undefined).
 */
export async function addSupabaseAdminForUser(c: Context, next: Next) {
  const user = c.get("user");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (user && supabaseUrl && supabaseServiceKey) {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    c.set("supabaseAdmin", supabaseAdmin);
  }

  await next();
}

/**
 * Require a specific role — 403s if the user does not have it. When `scope` is
 * given and the role matches, attaches `supabaseAdmin` for office operations.
 *
 * This is a middleware *factory*: it must return the middleware synchronously.
 * It was declared `async`, so `requireRole("office", "platform")` evaluated to
 * a Promise, and Hono received a Promise where it expects a function — every
 * route mounting it answered `{"error":"handler is not a function"}` for all
 * verbs. That is twelve route files, including most of the office surface.
 */
export function requireRole(roleName: string, scope?: string) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    const supabase = c.get("supabase");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check role assignments
    const { data: assignments, error } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name, scope)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error checking role:", error);
      return c.json({ error: "Failed to verify permissions" }, 500);
    }

    // Verify user has required role
    const hasRole = assignments?.some(
      (assignment: { role?: { name?: string; scope?: string } | null }) => {
        const role = assignment.role;
        return role?.name === roleName && (!scope || role?.scope === scope);
      },
    );

    if (!hasRole) {
      return c.json(
        {
          error: "Forbidden",
          message: `Requires ${roleName} role${
            scope ? ` with ${scope} scope` : ""
          }`,
        },
        403,
      );
    }

    // Add supabaseAdmin for office operations (bypasses RLS)
    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      c.set("supabaseAdmin", supabaseAdmin);
    }

    await next();
  };
}
