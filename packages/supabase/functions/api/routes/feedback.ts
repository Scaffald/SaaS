/**
 * Feedback REST API
 * Migrated from packages/supabase/functions/trpc/routers/feedback.router.ts
 * Requires authentication (JWT).
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.ts";

const FEEDBACK_BUCKET_ID = "feedback-screenshots";
const DEFAULT_HISTORY_LIMIT = 20;
const FEEDBACK_ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
] as const;

const feedbackSubmitSchema = z.object({
  feedbackType: z.enum(["bug", "feature", "comment"]),
  feedbackText: z
    .string()
    .trim()
    .min(100, { message: "Please provide at least 100 characters" })
    .max(5000, { message: "Feedback cannot exceed 5000 characters" }),
  screenshotPath: z.string().trim().min(1).max(512).optional(),
  pageUrl: z.string().trim().min(1, { message: "Page URL is required" }),
  pageTitle: z.string().trim().max(255).optional(),
  userAgent: z.string().trim().min(1, { message: "User agent is required" }),
  browserName: z.string().trim().max(120).optional(),
  browserVersion: z.string().trim().max(60).optional(),
  operatingSystem: z.string().trim().max(120).optional(),
  screenResolution: z.string().trim().regex(/^\d{2,5}x\d{2,5}$/u).optional(),
  viewportSize: z.string().trim().regex(/^\d{2,5}x\d{2,5}$/u).optional(),
});

const uploadUrlSchema = z.object({
  fileName: z.string().trim().min(3).max(255),
  fileType: z.enum(FEEDBACK_ALLOWED_MIME_TYPES),
  fileSize: z.number().int().positive().max(5 * 1024 * 1024),
});

function sanitizeFileName(fileName: string): string {
  const name = fileName.replace(/[^A-Za-z0-9._-]/g, "_");
  return name.length > 255 ? name.slice(-255) : name;
}

async function resolveUserDisplayName(
  supabase: {
    schema: (
      s: string,
    ) => {
      from: (
        t: string,
      ) => {
        select: (
          c: string,
        ) => {
          eq: (
            k: string,
            v: string,
          ) => { maybeSingle: () => Promise<{ data: unknown }> };
        };
      };
    };
  },
  userId: string,
): Promise<string | null> {
  const { data: userRow } = await supabase
    .schema("core")
    .from("users")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();

  const { data: profileRow } = await supabase
    .schema("core")
    .from("profile")
    .select("first_name, last_name")
    .eq("user_id", userId)
    .maybeSingle();

  const user = userRow as {
    display_name?: string | null;
    username?: string | null;
  } | null;
  const profile = profileRow as {
    first_name?: string | null;
    last_name?: string | null;
  } | null;
  const fallbackName = [profile?.first_name ?? "", profile?.last_name ?? ""]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const displayName = user?.display_name?.trim() || fallbackName ||
    user?.username?.trim();
  return displayName && displayName.length > 0 ? displayName : null;
}

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

const app = new Hono();
app.use("*", requireAuth);

// GET /user-feedback - Get current user's feedback history
app.get(
  "/user-feedback",
  zValidator("query", historyQuerySchema),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");

    if (!user?.id) {
      return c.json({
        error: "Unauthorized",
        message: "You must be logged in to view feedback",
      }, 401);
    }

    const input = c.req.valid("query");
    const limit = input.limit ?? DEFAULT_HISTORY_LIMIT;
    const offset = input.offset ?? 0;
    if (input.offset !== undefined && input.limit === undefined) {
      return c.json({
        error: "Bad Request",
        message: "Limit is required when offset is provided",
      }, 400);
    }

    const { data, error, count } = await supabase
      .schema("logs")
      .from("user_feedback")
      .select(
        `
      id,
      feedback_type,
      feedback_text,
      screenshot_path,
      page_url,
      page_title,
      user_agent,
      browser_name,
      browser_version,
      operating_system,
      screen_resolution,
      viewport_size,
      created_at,
      updated_at
    `,
        { count: "exact" },
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[feedback.getUserFeedback] Query failed", {
        userId: user.id,
        message: error.message,
      });
      return c.json({
        error: "Failed to load feedback history",
        message: error.message,
      }, 500);
    }

    const items = data ?? [];
    const totalCount = count ?? items.length;
    const nextOffset = offset + items.length;

    return c.json({
      data: {
        items,
        totalCount,
        hasMore: nextOffset < totalCount,
        nextOffset: nextOffset < totalCount ? nextOffset : null,
      },
    });
  },
);

// POST /submit - Submit feedback
app.post("/submit", zValidator("json", feedbackSubmitSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user?.id) {
    return c.json({
      error: "Unauthorized",
      message: "You must be logged in to submit feedback",
    }, 401);
  }

  const userEmail = (user as { email?: string }).email;
  if (!userEmail) {
    return c.json({
      error: "Internal Server Error",
      message: "Unable to resolve user email",
    }, 500);
  }

  const input = c.req.valid("json");

  if (input.screenshotPath && !input.screenshotPath.startsWith(`${user.id}/`)) {
    return c.json({
      error: "Forbidden",
      message: "Screenshot path must belong to the authenticated user",
    }, 403);
  }

  const userName = await resolveUserDisplayName(supabase, user.id);

  const insertPayload = {
    user_id: user.id,
    user_email: userEmail,
    user_name: userName,
    feedback_type: input.feedbackType,
    feedback_text: input.feedbackText,
    screenshot_path: input.screenshotPath ?? null,
    page_url: input.pageUrl,
    page_title: input.pageTitle ?? null,
    user_agent: input.userAgent,
    browser_name: input.browserName ?? null,
    browser_version: input.browserVersion ?? null,
    operating_system: input.operatingSystem ?? null,
    screen_resolution: input.screenResolution ?? null,
    viewport_size: input.viewportSize ?? null,
  };

  const { data, error } = await supabase
    .schema("logs")
    .from("user_feedback")
    .insert(insertPayload)
    .select("id, created_at")
    .single();

  if (error) {
    console.error("[feedback.submit] Failed to insert", {
      userId: user.id,
      message: error.message,
    });
    return c.json({
      error: "Failed to submit feedback",
      message: error.message,
    }, 500);
  }

  return c.json({
    data: {
      id: (data as { id: string }).id,
      status: "submitted",
      createdAt: (data as { created_at: string }).created_at,
    },
  }, 201);
});

// POST /upload-url - Get signed upload URL for screenshot
app.post("/upload-url", zValidator("json", uploadUrlSchema), async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user?.id) {
    return c.json({
      error: "Unauthorized",
      message: "You must be logged in to upload screenshots",
    }, 401);
  }

  const input = c.req.valid("json");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const sanitizedFileName = sanitizeFileName(input.fileName);
  const filePath = `${user.id}/${timestamp}-${sanitizedFileName}`;

  const { data, error } = await supabase.storage
    .from(FEEDBACK_BUCKET_ID)
    .createSignedUploadUrl(filePath);

  if (error || !data) {
    return c.json({
      error: "Unable to create upload URL",
      message: error?.message,
    }, 500);
  }

  return c.json({
    data: {
      uploadUrl: data.signedUrl,
      token: data.token,
      filePath,
      bucket: FEEDBACK_BUCKET_ID,
      expiresIn: 60 * 5,
    },
  });
});

export default app;
