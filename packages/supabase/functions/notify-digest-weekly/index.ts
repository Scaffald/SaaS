import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

import { corsHeaders, createCorsResponse } from "../_shared/cors.ts";
import { createServiceSupabaseClient } from "../_shared/notifications/utils.ts";
import { processDigestQueue } from "../_shared/notifications/digest.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse("ok");
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabase = createServiceSupabaseClient();

  try {
    const summary = await processDigestQueue("digest_weekly", { supabase });
    return jsonResponse({ ok: true, summary });
  } catch (error) {
    console.error("Failed to process weekly digest", error);
    return jsonResponse({ error: "Failed to process weekly digest" }, 500);
  }
});
