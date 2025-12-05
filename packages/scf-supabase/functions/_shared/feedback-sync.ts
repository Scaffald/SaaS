import { createClient } from "@supabase/supabase-js";

export interface FeedbackRow {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  feedback_type: "bug" | "feature" | "comment";
  feedback_text: string;
  screenshot_path: string | null;
  page_url: string;
  page_title: string | null;
  user_agent: string | null;
  browser_name: string | null;
  browser_version: string | null;
  operating_system: string | null;
  screen_resolution: string | null;
  viewport_size: string | null;
  braingrid_feature_id: string | null;
  braingrid_sync_status: "pending" | "synced" | "failed";
  braingrid_sync_error: string | null;
  braingrid_synced_at: string | null;
  sync_retry_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface BraingridConfig {
  apiUrl: string;
  apiKey: string;
  projectId?: string;
}

export function getBraingridConfig(): BraingridConfig | null {
  const apiUrl = Deno.env.get("BRAINGRID_API_URL") ?? "";
  const apiKey = Deno.env.get("BRAINGRID_API_KEY") ?? "";
  const projectId = Deno.env.get("BRAINGRID_PROJECT_ID") ?? "";

  if (!apiUrl || !apiKey) {
    return null;
  }

  return {
    apiUrl,
    apiKey,
    projectId: projectId || undefined,
  };
}

export function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "[feedback-sync] Missing Supabase environment configuration",
      {
        supabaseUrlPresent: Boolean(supabaseUrl),
        serviceKeyPresent: Boolean(serviceKey),
      },
    );
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}

export function buildBraingridPayload(
  feedback: FeedbackRow,
  projectId?: string,
) {
  const titleSnippet = feedback.feedback_text.replace(/\s+/g, " ").trim().slice(
    0,
    50,
  );

  const title = `[${feedback.feedback_type.toUpperCase()}] ${titleSnippet}`;

  const metadata = {
    source: "user_feedback",
    user_id: feedback.user_id,
    user_email: feedback.user_email,
    user_name: feedback.user_name,
    page_url: feedback.page_url,
    page_title: feedback.page_title,
    browser_info: {
      user_agent: feedback.user_agent,
      name: feedback.browser_name,
      version: feedback.browser_version,
      operating_system: feedback.operating_system,
      screen_resolution: feedback.screen_resolution,
      viewport_size: feedback.viewport_size,
    },
    screenshot_path: feedback.screenshot_path,
    submitted_at: feedback.created_at,
    project_id: projectId,
  };

  return {
    title,
    description: [
      feedback.feedback_text,
      "",
      "---- Context ----",
      `Page: ${feedback.page_title ?? "Unknown"} (${feedback.page_url})`,
      `User: ${feedback.user_name ?? "Unknown"} <${feedback.user_email}>`,
      `Browser: ${feedback.browser_name ?? "Unknown"} ${
        feedback.browser_version ?? ""
      }`.trim(),
      `OS: ${feedback.operating_system ?? "Unknown"}`,
      `Screen: ${feedback.screen_resolution ?? "Unknown"}`,
      `Viewport: ${feedback.viewport_size ?? "Unknown"}`,
      `User Agent: ${feedback.user_agent ?? "Unknown"}`,
      feedback.screenshot_path
        ? `Screenshot: ${feedback.screenshot_path}`
        : null,
    ]
      .filter((line): line is string => Boolean(line))
      .join("\n"),
    type: feedback.feedback_type,
    metadata,
  };
}

export async function updateFeedbackStatus(
  supabase: ReturnType<typeof createServiceClient>,
  feedbackId: string,
  update: Partial<FeedbackRow>,
) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .schema("logs")
    .from("user_feedback")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedbackId);

  if (error) {
    console.error("[feedback-sync] Failed to update feedback status", {
      feedbackId,
      error: error.message,
    });
  }
}
