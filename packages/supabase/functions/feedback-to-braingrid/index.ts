// @ts-expect-error - Deno-specific imports are not recognized by TypeScript in non-Deno environments
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "zod";

import {
  buildBraingridPayload,
  createServiceClient,
  getBraingridConfig,
  updateFeedbackStatus,
} from "../_shared/feedback-sync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const requestSchema = z.object({
  feedbackId: z.string().uuid(),
  trigger: z.enum(["submission", "retry"]).default("submission"),
});

const braingridConfig = getBraingridConfig();

interface BraingridResponse {
  id?: string;
  featureId?: string;
  data?: { id?: string };
  reference?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...corsHeaders, Allow: "POST, OPTIONS" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    console.error("[feedback-to-braingrid] Failed to parse request body", {
      error,
    });
    return new Response(
      JSON.stringify({ error: "Invalid JSON payload" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const parseResult = requestSchema.safeParse(body);

  if (!parseResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request payload",
        details: parseResult.error.flatten(),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const { feedbackId, trigger } = parseResult.data;

  const supabase = createServiceClient();

  if (!supabase) {
    return new Response(
      JSON.stringify({
        error: "Supabase environment variables are not configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const { data: feedback, error: fetchError } = await supabase
    .schema("logs")
    .from("user_feedback")
    .select("*")
    .eq("id", feedbackId)
    .maybeSingle();

  if (fetchError) {
    console.error(
      "[feedback-to-braingrid] Failed to load feedback",
      {
        feedbackId,
        error: fetchError.message,
      },
    );
    return new Response(
      JSON.stringify({ error: "Failed to load feedback submission" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!feedback) {
    return new Response(
      JSON.stringify({ error: "Feedback submission not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const nextAttemptCount = (feedback.sync_retry_count ?? 0) + 1;

  if (!braingridConfig) {
    const missing = [];
    if (!Deno.env.get("BRAINGRID_API_URL")) missing.push("BRAINGRID_API_URL");
    if (!Deno.env.get("BRAINGRID_API_KEY")) missing.push("BRAINGRID_API_KEY");

    await updateFeedbackStatus(supabase, feedbackId, {
      braingrid_sync_status: "failed",
      braingrid_sync_error: `Missing Braingrid configuration: ${missing.join(", ")}`,
      sync_retry_count: nextAttemptCount,
    });

    return new Response(
      JSON.stringify({
        error: "Braingrid configuration missing",
        missing,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const payload = buildBraingridPayload(feedback, braingridConfig.projectId);

  let response: Response;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${braingridConfig.apiKey}`,
    };

    if (braingridConfig.projectId) {
      headers["X-Braingrid-Project"] = braingridConfig.projectId;
    }

    response = await fetch(braingridConfig.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[feedback-to-braingrid] Network error", {
      feedbackId,
      error,
    });

    await updateFeedbackStatus(supabase, feedbackId, {
      braingrid_sync_status: "failed",
      braingrid_sync_error: `Network error: ${
        error instanceof Error ? error.message : String(error)
      }`,
      sync_retry_count: nextAttemptCount,
    });

    return new Response(
      JSON.stringify({ error: "Network error communicating with Braingrid" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[feedback-to-braingrid] Braingrid request failed", {
      feedbackId,
      status: response.status,
      body: errorText,
    });

    await updateFeedbackStatus(supabase, feedbackId, {
      braingrid_sync_status: "failed",
      braingrid_sync_error: `HTTP ${response.status}: ${errorText.slice(0, 500)}`,
      sync_retry_count: nextAttemptCount,
    });

    return new Response(
      JSON.stringify({
        error: "Braingrid API request failed",
        status: response.status,
      }),
      { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let responseBody: BraingridResponse | null = null;
  try {
    responseBody = await response.json() as BraingridResponse;
  } catch (error) {
    console.warn("[feedback-to-braingrid] Unable to parse Braingrid response JSON", {
      feedbackId,
      error,
    });
  }

  const braingridFeatureId =
    responseBody?.id ??
    responseBody?.featureId ??
    responseBody?.data?.id ??
    responseBody?.reference ??
    null;

  await updateFeedbackStatus(supabase, feedbackId, {
    braingrid_feature_id: braingridFeatureId,
    braingrid_sync_status: "synced",
    braingrid_sync_error: null,
    braingrid_synced_at: new Date().toISOString(),
    sync_retry_count: feedback.sync_retry_count ?? 0,
  });

  return new Response(
    JSON.stringify({
      success: true,
      feedbackId,
      braingridFeatureId,
      trigger,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});


