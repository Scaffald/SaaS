/**
 * Stripe Settings REST API
 * Office/platform role required. Migrated from tRPC stripeSettingsRouter.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type ApiEnv, requireRole } from "../middleware/auth.ts";

const WEBHOOK_PATH = "/functions/v1/stripe-webhook";

function buildWebhookUrl(): string {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return WEBHOOK_PATH;
  const normalized = supabaseUrl.endsWith("/")
    ? supabaseUrl.slice(0, -1)
    : supabaseUrl;
  return `${normalized}${WEBHOOK_PATH}`;
}

const settingsSelect = [
  "settings_name",
  "publishable_key",
  "api_key_secret_id",
  "webhook_secret_id",
  "test_mode",
  "webhook_endpoint_url",
  "last_tested_at",
  "last_tested_status",
  "last_tested_error",
  "updated_at",
  "updated_by",
].join(", ");

const app = new Hono<ApiEnv>();
app.use("*", requireRole("office", "platform"));

app.get("/", async (c) => {
  const supabase = c.get("supabase");
  if (!supabase) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .schema("core")
    .from("stripe_settings")
    .select(settingsSelect)
    .eq("settings_name", "stripe")
    .maybeSingle();

  if (error) {
    return c.json(
      { error: `Failed to load Stripe settings: ${error.message}` },
      500,
    );
  }

  const row = data as Record<string, unknown> | null;
  return c.json({
    publishableKey: row?.publishable_key ?? "",
    hasApiKey: Boolean(row?.api_key_secret_id),
    hasWebhookSecret: Boolean(row?.webhook_secret_id),
    testMode: row?.test_mode ?? true,
    webhookEndpointUrl: row?.webhook_endpoint_url ?? buildWebhookUrl(),
    lastTestedAt: row?.last_tested_at ?? null,
    lastTestedStatus: row?.last_tested_status ?? null,
    lastTestedError: row?.last_tested_error ?? null,
    updatedAt: row?.updated_at ?? null,
    updatedBy: row?.updated_by ?? null,
  });
});

app.put(
  "/publishable-key",
  zValidator(
    "json",
    z.object({
      publishableKey: z.string().trim().min(16).max(255),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    if (!supabase) return c.json({ error: "Unauthorized" }, 401);

    const { publishableKey } = c.req.valid("json");
    const { error } = await supabase
      .schema("core")
      .from("stripe_settings")
      .update({
        publishable_key: publishableKey.trim(),
        updated_by: user?.id ?? null,
      })
      .eq("settings_name", "stripe");

    if (error) {
      return c.json({
        error: `Failed to update publishable key: ${error.message}`,
      }, 500);
    }

    return c.json({ publishableKey: publishableKey.trim() });
  },
);

app.put(
  "/test-mode",
  zValidator(
    "json",
    z.object({
      testMode: z.boolean(),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    if (!supabase) return c.json({ error: "Unauthorized" }, 401);

    const { testMode } = c.req.valid("json");
    const { error } = await supabase
      .schema("core")
      .from("stripe_settings")
      .update({
        test_mode: testMode,
        updated_by: user?.id ?? null,
      })
      .eq("settings_name", "stripe");

    if (error) {
      return c.json(
        { error: `Failed to update test mode: ${error.message}` },
        500,
      );
    }

    return c.json({ testMode });
  },
);

app.put(
  "/api-key",
  zValidator(
    "json",
    z.object({
      secret: z.string().trim().min(20, "Secret key appears too short"),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabase || !supabaseAdmin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { secret } = c.req.valid("json");
    const trimmed = secret.trim();

    const { data: secretId, error: rotateError } = await supabaseAdmin
      .schema("core")
      .rpc("rotate_stripe_secret", {
        p_secret: trimmed,
        p_secret_type: "api_key",
      });

    if (rotateError) {
      return c.json({
        error: `Failed to store API secret: ${rotateError.message}`,
      }, 500);
    }

    const { error: updateError } = await supabase
      .schema("core")
      .from("stripe_settings")
      .update({
        api_key_secret_id: secretId,
        updated_by: user?.id ?? null,
      })
      .eq("settings_name", "stripe");

    if (updateError) {
      return c.json({
        error: `Failed to link API secret: ${updateError.message}`,
      }, 500);
    }

    const { error: configureError } = await supabaseAdmin
      .schema("core")
      .rpc("configure_stripe_server", {
        p_api_key_secret_id: secretId,
      });

    if (configureError) {
      return c.json({
        error: `Stripe server configuration failed: ${configureError.message}`,
      }, 500);
    }

    return c.json({ hasApiKey: true });
  },
);

app.put(
  "/webhook-secret",
  zValidator(
    "json",
    z.object({
      secret: z.string().trim().min(10, "Webhook secret appears too short"),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabase || !supabaseAdmin) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { secret } = c.req.valid("json");
    const trimmed = secret.trim();

    const { data: secretId, error: rotateError } = await supabaseAdmin
      .schema("core")
      .rpc("rotate_stripe_secret", {
        p_secret: trimmed,
        p_secret_type: "webhook",
      });

    if (rotateError) {
      return c.json({
        error: `Failed to store webhook secret: ${rotateError.message}`,
      }, 500);
    }

    const { error: updateError } = await supabase
      .schema("core")
      .from("stripe_settings")
      .update({
        webhook_secret_id: secretId,
        updated_by: user?.id ?? null,
      })
      .eq("settings_name", "stripe");

    if (updateError) {
      return c.json({
        error: `Failed to link webhook secret: ${updateError.message}`,
      }, 500);
    }

    return c.json({ hasWebhookSecret: true });
  },
);

app.post("/test-connection", async (c) => {
  const supabase = c.get("supabase");
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  if (!supabase || !supabaseAdmin) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: settings, error } = await supabaseAdmin
    .schema("core")
    .from("stripe_settings")
    .select("api_key_secret_id, test_mode")
    .eq("settings_name", "stripe")
    .maybeSingle();

  if (error) {
    return c.json({ error: `Failed to load settings: ${error.message}` }, 500);
  }

  const row = settings as Record<string, unknown> | null;
  if (!row?.api_key_secret_id) {
    return c.json(
      { error: "Add an API secret before testing the connection." },
      400,
    );
  }

  const { data: secretValue, error: secretError } = await supabaseAdmin
    .schema("core")
    .rpc("get_secret_value", {
      p_secret_id: row.api_key_secret_id,
    });

  if (secretError || !secretValue) {
    return c.json(
      {
        error: secretError
          ? `Failed to read API secret: ${secretError.message}`
          : "API secret not found.",
      },
      500,
    );
  }

  let testStatus: "succeeded" | "failed" = "succeeded";
  let testError: string | null = null;

  try {
    const response = await fetch("https://api.stripe.com/v1/accounts", {
      method: "GET",
      headers: { Authorization: `Bearer ${secretValue}` },
    });

    if (!response.ok) {
      testStatus = "failed";
      const message = await response.text();
      testError = `Stripe API error: ${message}`;
    }
  } catch (networkError) {
    testStatus = "failed";
    testError = networkError instanceof Error
      ? networkError.message
      : String(networkError);
  }

  await supabase
    .schema("core")
    .from("stripe_settings")
    .update({
      last_tested_at: new Date().toISOString(),
      last_tested_status: testStatus,
      last_tested_error: testError,
      updated_by: user?.id ?? null,
    })
    .eq("settings_name", "stripe");

  if (testStatus === "failed" && testError) {
    return c.json({ error: testError }, 500);
  }

  return c.json({ ok: true });
});

export default app;
