/**
 * Authentication Routes
 * Handles magic link authentication and user role management
 *
 * Migrated from: packages/supabase/functions/trpc/routers/auth.router.ts
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { type ApiEnv, requireAuth } from "../middleware/auth.ts";

const app = new Hono<ApiEnv>();

// Environment configuration
/**
 * Read at call time, not at import time.
 *
 * This was a module-level `const`, so it captured the environment as it stood
 * the instant this module was first imported. Under the edge runtime that is
 * fine — env is set before anything loads. Under `deno test`, which imports
 * the route module directly, it froze before any test bootstrap could set a
 * value.
 *
 * Reading it per request costs nothing and makes the module configurable by
 * whoever imports it.
 *
 * Returning null is an ordinary outcome, not a failure: none of these four is
 * set on the edge runtime, which receives only Supabase's own built-ins. The
 * caller omits `emailRedirectTo` in that case and GoTrue uses its SITE_URL.
 */
function magicLinkRedirectFallback(): string | null {
  return Deno.env.get("MAGIC_LINK_REDIRECT_URL") ??
    Deno.env.get("EXPO_PUBLIC_URL") ??
    Deno.env.get("SUPABASE_SITE_URL") ??
    Deno.env.get("SITE_URL") ??
    null;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ============================================================================
// Validation Schemas
// ============================================================================

const requestMagicLinkSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .transform((value) => value.trim().toLowerCase())
    .describe("User email address"),
  redirectTo: z
    .string()
    .url("Invalid redirect URL")
    .optional()
    .describe("URL to redirect after authentication"),
});

// ============================================================================
// POST /v1/auth/magic-link - Request magic link for login/signup
// ============================================================================

app.post(
  "/magic-link",
  zValidator("json", requestMagicLinkSchema),
  async (c) => {
    try {
      const input = c.req.valid("json");
      const supabase = c.get("supabase");
      const email = input.email;

      // Where the emailed link should land.
      //
      // Optional, and deliberately so. This used to 500 with "Magic link
      // redirect target is not configured" whenever the caller sent no
      // `redirectTo` and none of the four environment variables was set — and
      // none of them IS set on the edge runtime, which receives only
      // Supabase's own built-ins, so every magic link on a default stack
      // failed (#926).
      //
      // Refusing was never right. `emailRedirectTo` is a hint to GoTrue; when
      // it is omitted GoTrue uses its own configured `SITE_URL`, which is set
      // from `site_url` in config.toml and is the authoritative answer to
      // "where does this app live". The api function was declining to send
      // mail because it could not name a destination the auth service already
      // knew, and the allow-list (`GOTRUE_URI_ALLOW_LIST`) governs where a
      // link may point either way.
      const redirectTarget = input.redirectTo ?? magicLinkRedirectFallback();

      // Create admin client to check if user exists
      const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Check if user exists
      // Note: Supabase admin API doesn't support email filter directly
      const { data: existingUsers, error: lookupError } = await supabaseAdmin
        .auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

      if (lookupError) {
        console.error("[auth.requestMagicLink] Failed to lookup user", {
          email,
          error: lookupError.message,
        });
        return c.json(
          {
            error: "Internal Server Error",
            message: "Unable to request magic link",
            details: lookupError.message,
          },
          500,
        );
      }

      // Check if email exists in user list
      const isExistingUser = Boolean(
        existingUsers?.users?.some(
          (user: { email?: string | null }) =>
            user.email?.toLowerCase() === email.toLowerCase(),
        ),
      );

      // Request magic link OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Omitted rather than passed as null when we have none: supabase-js
          // forwards the key either way, and GoTrue only falls back to its
          // SITE_URL when the parameter is absent.
          ...(redirectTarget ? { emailRedirectTo: redirectTarget } : {}),
          shouldCreateUser: !isExistingUser,
        },
      });

      if (otpError) {
        console.error("[auth.requestMagicLink] OTP request failed", {
          email,
          error: otpError.message,
        });
        return c.json(
          {
            error: "Internal Server Error",
            message: "Failed to send magic link email",
            details: otpError.message,
          },
          500,
        );
      }

      return c.json(
        {
          data: {
            mode: isExistingUser ? "login" : "signup",
            email,
            // null means "GoTrue's own SITE_URL", not "nowhere".
            redirectTo: redirectTarget,
          },
          message: `Magic link sent to ${email}`,
        },
        200,
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: "Validation Error",
            message: "Invalid request data",
            details: error.errors,
          },
          400,
        );
      }

      console.error("[auth.requestMagicLink] Unexpected error", error);
      return c.json(
        {
          error: "Internal Server Error",
          message: "An unexpected error occurred",
        },
        500,
      );
    }
  },
);

// ============================================================================
// GET /v1/auth/roles - Get current user's roles
// ============================================================================

app.get("/roles", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const supabase = c.get("supabase");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
        },
        401,
      );
    }

    // Fetch user roles from database
    const { data, error } = await supabase
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("[auth.getUserRoles] Failed to fetch roles", {
        userId: user.id,
        error: error.message,
      });
      return c.json(
        {
          error: "Internal Server Error",
          message: "Unable to load user roles",
          details: error.message,
        },
        500,
      );
    }

    // Extract role names
    const roles = (data as Array<{ role?: { name?: string } | null }> | null)
      ?.map((r) => r.role?.name)
      .filter((name): name is string => Boolean(name)) ?? [];

    if (Deno.env.get("NODE_ENV") !== "production") {
      console.debug("[auth.getUserRoles] Roles fetched", {
        userId: user.id,
        roleCount: roles.length,
      });
    }

    return c.json({
      data: {
        roles,
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("[auth.getUserRoles] Unexpected error", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      500,
    );
  }
});

// ============================================================================
// GET /v1/auth/session - Get current session info
// ============================================================================

app.get("/session", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const supabase = c.get("supabase");

    if (!user) {
      return c.json(
        {
          error: "Unauthorized",
          message: "No active session",
        },
        401,
      );
    }

    // Get session from Supabase
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return c.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired session",
        },
        401,
      );
    }

    return c.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at != null,
          createdAt: user.created_at,
        },
        session: {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at,
          expiresIn: session.expires_in,
        },
      },
    });
  } catch (error) {
    console.error("[auth.getSession] Unexpected error", error);
    return c.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      500,
    );
  }
});

export default app;
