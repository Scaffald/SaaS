/**
 * Interview self-scheduling REST API (v1.12.0 / SC-137).
 *
 * A candidate opens a scheduling link (token), sees the proposed interview
 * slots for their application, and books one. Authenticated: the booking's
 * candidate_id is the auth user, and we verify the linked application belongs
 * to that user (a leaked token can't book someone else's interview).
 */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();
app.use("*", authMiddleware);

// scheduling_links / interview_slots / interview_bookings are RLS-protected for
// org/creator access; the candidate isn't a member, so we use a service-role
// client and enforce ownership in code (application.user_id === auth user).
function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

const errorResponseSchema = z
  .object({ error: z.string(), message: z.string().optional() })
  .openapi("ErrorResponse");

const slotSchema = z.object({
  id: z.string().uuid(),
  slot_start: z.string(),
  slot_end: z.string(),
  timezone: z.string(),
  location_type: z.enum(["video", "phone", "in_person"]),
  location_details: z.string().nullable(),
  meeting_link: z.string().nullable(),
});

const linkResponseSchema = z
  .object({
    organizationName: z.string(),
    jobTitle: z.string(),
    expiresAt: z.string(),
    alreadyBooked: z.boolean(),
    slots: z.array(slotSchema),
  })
  .openapi("SchedulingLinkResponse");

const bookBodySchema = z.object({ slotId: z.string().uuid() });

const bookingResponseSchema = z
  .object({
    data: z.object({
      id: z.string().uuid(),
      slot_id: z.string().uuid(),
      booked_at: z.string(),
      slot: slotSchema.optional(),
    }),
  })
  .openapi("InterviewBookingResponse");

// Shared: resolve + authorize a token for the current user. Returns the link +
// application, or an error tuple.
async function resolveLink(
  supabase: ReturnType<typeof Object> | any,
  token: string,
  userId: string,
): Promise<
  | {
    ok: true;
    link: Record<string, unknown>;
    application: Record<string, unknown>;
  }
  | { ok: false; status: 403 | 404 | 410; error: string }
> {
  const { data: link } = await supabase
    .schema("core")
    .from("scheduling_links")
    .select(
      "id, application_id, organization_id, token, expires_at, max_bookings, current_bookings, is_active",
    )
    .eq("token", token)
    .maybeSingle();

  if (!link || !link.is_active) {
    return { ok: false, status: 404, error: "Scheduling link not found" };
  }
  if (new Date(link.expires_at as string).getTime() < Date.now()) {
    return { ok: false, status: 410, error: "Scheduling link has expired" };
  }

  const { data: application } = await supabase
    .schema("core")
    .from("applications")
    .select("id, user_id, job_id")
    .eq("id", link.application_id)
    .maybeSingle();

  if (!application) {
    return { ok: false, status: 404, error: "Application not found" };
  }
  if (application.user_id !== userId) {
    return {
      ok: false,
      status: 403,
      error: "This scheduling link is not for your application",
    };
  }
  return { ok: true, link, application };
}

/**
 * GET /v1/scheduling/:token — proposed slots + context for a scheduling link
 */
const getLinkRoute = createRoute({
  method: "get",
  path: "/{token}",
  tags: ["Scheduling"],
  summary: "Get scheduling link",
  request: { params: z.object({ token: z.string().min(16) }) },
  responses: {
    200: {
      description: "Link context + slots",
      content: { "application/json": { schema: linkResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    410: {
      description: "Expired",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getLinkRoute, async (c) => {
  const supabase = adminClient();
  const user = c.get("user");
  const { token } = c.req.valid("param");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const resolved = await resolveLink(supabase, token, user.id);
  if (!resolved.ok) return c.json({ error: resolved.error }, resolved.status);
  const { link, application } = resolved;

  const [{ data: org }, { data: job }, { data: slots }, { data: existing }] =
    await Promise.all([
      supabase.schema("core").from("organizations").select("name").eq(
        "id",
        link.organization_id,
      ).maybeSingle(),
      supabase.schema("core").from("jobs").select("title").eq(
        "id",
        application.job_id,
      ).maybeSingle(),
      supabase
        .schema("core")
        .from("interview_slots")
        .select(
          "id, slot_start, slot_end, timezone, location_type, location_details, meeting_link",
        )
        .eq("application_id", link.application_id)
        .eq("status", "proposed")
        .order("slot_start", { ascending: true }),
      supabase
        .schema("core")
        .from("interview_bookings")
        .select("id")
        .eq("application_id", link.application_id)
        .eq("candidate_id", user.id)
        .is("cancelled_at", null)
        .maybeSingle(),
    ]);

  return c.json({
    organizationName: org?.name ?? "the employer",
    jobTitle: job?.title ?? "this position",
    expiresAt: link.expires_at,
    alreadyBooked: !!existing,
    slots: slots ?? [],
  });
});

/**
 * POST /v1/scheduling/:token/book — book a proposed slot
 */
const bookRoute = createRoute({
  method: "post",
  path: "/{token}/book",
  tags: ["Scheduling"],
  summary: "Book interview slot",
  request: {
    params: z.object({ token: z.string().min(16) }),
    body: { content: { "application/json": { schema: bookBodySchema } } },
  },
  responses: {
    201: {
      description: "Booked",
      content: { "application/json": { schema: bookingResponseSchema } },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "Forbidden",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    410: {
      description: "Expired",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(bookRoute, async (c) => {
  const supabase = adminClient();
  const user = c.get("user");
  const { token } = c.req.valid("param");
  const { slotId } = c.req.valid("json");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const resolved = await resolveLink(supabase, token, user.id);
  if (!resolved.ok) return c.json({ error: resolved.error }, resolved.status);
  const { link, application } = resolved;

  if ((link.current_bookings as number) >= (link.max_bookings as number)) {
    return c.json(
      { error: "This scheduling link has no remaining bookings" },
      400,
    );
  }

  // The slot must belong to this application and still be open.
  const { data: slot } = await supabase
    .schema("core")
    .from("interview_slots")
    .select(
      "id, slot_start, slot_end, timezone, location_type, location_details, meeting_link, status, application_id",
    )
    .eq("id", slotId)
    .maybeSingle();

  if (!slot || slot.application_id !== link.application_id) {
    return c.json({ error: "Slot not found for this link" }, 404);
  }
  if (slot.status !== "proposed") {
    return c.json({ error: "That slot is no longer available" }, 400);
  }

  const { data: booking, error: bookErr } = await supabase
    .schema("core")
    .from("interview_bookings")
    .insert({
      slot_id: slotId,
      application_id: application.id,
      candidate_id: user.id,
    })
    .select("id, slot_id, booked_at")
    .single();

  if (bookErr) {
    console.error("Error booking slot:", bookErr);
    return c.json(
      { error: "Failed to book slot", message: bookErr.message },
      500,
    );
  }

  // Mark the slot booked + increment the link counter (best-effort).
  await supabase.schema("core").from("interview_slots").update({
    status: "booked",
  }).eq("id", slotId);
  await supabase
    .schema("core")
    .from("scheduling_links")
    .update({ current_bookings: (link.current_bookings as number) + 1 })
    .eq("id", link.id);

  return c.json({ data: { ...booking, slot } }, 201);
});

export default app;
