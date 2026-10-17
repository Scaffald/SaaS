/**
 * Stripe config for payers — GET /v1/stripe-config (#1258).
 *
 * The publishable key used to be readable only through /v1/stripe-settings,
 * which is office-only, so the card form showed "Stripe publishable key is
 * missing" to every worker and employer — everyone who actually pays. This
 * returns, to any signed-in user, the two values Stripe.js needs and nothing
 * else. Publishable keys are public by design; the secret ids, webhook URL and
 * connection test results stay behind /v1/stripe-settings.
 *
 * Its own path rather than /v1/payments/config: the payments router guards
 * every route with requireRole("office") via use("*"), and escaping that would
 * depend on mount order.
 */

import { Hono } from "hono";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  requireAuth,
} from "../middleware/auth.ts";

const app = new Hono<ApiEnv>();

app.get("/", requireAuth, addSupabaseAdminForUser, async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) return c.json({ error: "Service role required" }, 500);

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("stripe_settings")
    .select("publishable_key, test_mode")
    .eq("settings_name", "stripe")
    .maybeSingle();

  if (error) {
    return c.json({
      error: `Failed to load Stripe config: ${error.message}`,
    }, 500);
  }

  return c.json({
    publishableKey: data?.publishable_key || null,
    testMode: data?.test_mode ?? true,
  });
});

export default app;
