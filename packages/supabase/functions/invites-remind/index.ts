/**
 * Send the one reminder each email invite gets (#1397).
 *
 * Driven once a day by pg_cron (migration 400). POST, service-role bearer
 * only. The work is in `_shared/invites/reminders.ts`, which the gated test
 * drives directly.
 *
 * Body (optional): { limit?: number } — at most 100 reminders per run by
 * default; what's left goes out the next day.
 *
 * Without NEVARMAIL_API_KEY and NEVARMAIL_USE_CASE_REFERRAL_INVITES nothing
 * is sent and nothing is stamped, so reminders go out once email is set up.
 */
import { corsHeaders, createCorsResponse } from "../_shared/cors.ts";
import { requireServiceAuth } from "../_shared/notifications/auth.ts";
import { createServiceSupabaseClient } from "../_shared/notifications/utils.ts";
import { nevarMailFromEnv, nevarMailUseCase } from "../_shared/nevarmail.ts";
import {
  DEFAULT_REMINDER_LIMIT,
  processDueReminders,
} from "../_shared/invites/reminders.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return createCorsResponse("ok");
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // verify_jwt would accept the anon key; this sends email. See
  // _shared/notifications/auth.ts.
  const authError = requireServiceAuth(req);
  if (authError) return authError;

  let limit = DEFAULT_REMINDER_LIMIT;
  try {
    const body = (await req.json()) as { limit?: unknown };
    if (typeof body.limit === "number" && Number.isFinite(body.limit)) {
      limit = Math.min(Math.max(Math.trunc(body.limit), 1), 500);
    }
  } catch {
    // pg_cron posts {source, timestamp}; an empty body is fine too.
  }

  const client = nevarMailFromEnv();
  const useCaseId = nevarMailUseCase("referral_invites");
  try {
    const outcome = await processDueReminders(
      createServiceSupabaseClient(),
      client && useCaseId ? { client, useCaseId } : null,
      { limit },
    );
    console.log(`[invites-remind] ${JSON.stringify(outcome)}`);
    return jsonResponse({
      ok: true,
      emailConfigured: !!(client && useCaseId),
      ...outcome,
    });
  } catch (e) {
    console.error(`[invites-remind] ${(e as Error).message}`);
    return jsonResponse({ ok: false, error: "Reminder run failed" }, 500);
  }
});
