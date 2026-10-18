/**
 * Carry out account deletion requests past their grace period (#1313).
 *
 * Driven once a day by pg_cron (migration 391). POST, service-role bearer
 * only: it deletes users. The work is in
 * `_shared/account-deletion/process.ts`, which the gated test drives directly.
 *
 * Body (optional): { limit?: number, ids?: string[] } — at most 25 requests
 * per run by default, inside a 45-second budget; whatever is left is picked up
 * by the next run. `ids` narrows the run to named requests (still only those
 * past their scheduled date).
 */

import { corsHeaders, createCorsResponse } from "../_shared/cors.ts";
import { requireServiceAuth } from "../_shared/notifications/auth.ts";
import { createServiceSupabaseClient } from "../_shared/notifications/utils.ts";
import {
  DEFAULT_LIMIT,
  processDueDeletions,
} from "../_shared/account-deletion/process.ts";

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

  // verify_jwt would accept the anon key; this deletes accounts. See
  // _shared/notifications/auth.ts.
  const authError = requireServiceAuth(req);
  if (authError) return authError;

  // pg_cron posts {source, timestamp}; an empty body is normal.
  let limit = DEFAULT_LIMIT;
  let ids: string[] | undefined;
  try {
    const body = (await req.json()) as { limit?: unknown; ids?: unknown };
    if (typeof body.limit === "number" && Number.isFinite(body.limit)) {
      limit = Math.min(Math.max(Math.trunc(body.limit), 1), 100);
    }
    // An operator re-running named requests. Still only due ones.
    if (
      Array.isArray(body.ids) &&
      body.ids.every((id) => typeof id === "string")
    ) {
      ids = body.ids as string[];
    }
  } catch {
    // no body
  }

  try {
    const summary = await processDueDeletions(createServiceSupabaseClient(), {
      limit,
      ids,
    });
    // Ids and statuses only — the response lands in net._http_response.
    console.info("[account-deletion-process] run complete", summary);
    return jsonResponse(summary);
  } catch (error) {
    console.error("[account-deletion-process] run failed", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : String(error) },
      500,
    );
  }
});
