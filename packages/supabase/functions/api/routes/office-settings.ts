/**
 * Office Settings REST API
 * Office role required. Reads and writes `core.system_config`.
 *
 * The screen this serves used to query `core.system_config` straight through
 * PostgREST. That table has RLS off and grants nothing to `authenticated`, so
 * every logged-in read answered 42501 — and the screen's error path showed a
 * toast from an effect that listed the toast hook as a dependency, which made
 * the failure retry itself about 35,000 times per visit.
 *
 * The grant was deliberately not widened: `system_config` holds platform
 * limits that only the office role may read or change, and giving every
 * authenticated user SELECT on it would be a far wider door than the screen
 * needs. Service role behind a role-checked endpoint is how every other
 * office screen reads privileged data.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  type ApiEnv,
  authMiddleware,
  requireRole,
} from "../middleware/auth.ts";

const SITE_OVERLAP_KEY = "site_overlap_threshold_percent";

/** Matches the range the screen has always validated against. */
const geographicBodySchema = z.object({
  siteOverlapThresholdPercent: z.number().min(0.1).max(10),
});

const app = new Hono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

/**
 * `value` is jsonb, so a number may come back as a number or as a quoted
 * string depending on how it was written. Read both rather than trusting one.
 */
function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

const DEFAULT_SITE_OVERLAP_THRESHOLD = 2.0;

/** GET /v1/office/settings/geographic */
app.get("/geographic", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) return c.json({ error: "Service role required" }, 500);

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("system_config")
    .select("value, updated_at")
    .eq("key", SITE_OVERLAP_KEY)
    .maybeSingle();

  if (error) {
    return c.json({
      error: "Failed to load geographic settings",
      message: error.message,
    }, 500);
  }

  // No row is not an error: the setting has simply never been changed from
  // its default. Answering 404 here would put the screen into its error
  // state on a perfectly healthy install.
  return c.json({
    siteOverlapThresholdPercent: readNumber(data?.value) ??
      DEFAULT_SITE_OVERLAP_THRESHOLD,
    updatedAt: data?.updated_at ?? null,
  });
});

/** PUT /v1/office/settings/geographic */
app.put("/geographic", zValidator("json", geographicBodySchema), async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  if (!supabaseAdmin) return c.json({ error: "Service role required" }, 500);

  const { siteOverlapThresholdPercent } = c.req.valid("json");

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("system_config")
    .upsert({
      key: SITE_OVERLAP_KEY,
      value: siteOverlapThresholdPercent,
      description: "Minimum overlap percentage to flag concurrent site work",
      updated_at: new Date().toISOString(),
    }, { onConflict: "key" })
    .select("value, updated_at")
    .maybeSingle();

  if (error) {
    return c.json({
      error: "Failed to save geographic settings",
      message: error.message,
    }, 500);
  }

  return c.json({
    siteOverlapThresholdPercent: readNumber(data?.value) ??
      siteOverlapThresholdPercent,
    updatedAt: data?.updated_at ?? null,
  });
});

export default app;
