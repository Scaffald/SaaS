/**
 * Employer-side interview scheduling.
 *
 * `/v1/scheduling` is the *candidate's* half: two token-addressed routes that
 * let someone holding a scheduling link view slots and book one. There was no
 * employer half at all — nothing could create a slot or mint a link — so the
 * office scheduling screen had nothing to call and rendered MOCK_ constants
 * (#525, #540).
 *
 * The tables have existed since migration 307 and became reachable when
 * migration 335 added the grants they were created without.
 *
 * NOT covered here: calendar connections. `core.calendar_connections` stores
 * `access_token_encrypted` / `refresh_token_encrypted` / `provider_account_id`
 * for Google and Outlook — that is an OAuth integration, not a CRUD endpoint,
 * and it is tracked separately. The screen keeps its sample-data label until
 * that panel is real too.
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createClient } from "@supabase/supabase-js";
import { authMiddleware, requireAuth } from "../middleware/auth.ts";
import {
  PIPELINE_ROLES,
  resolveApplicationOrgAccess,
} from "../lib/application-access.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

/**
 * Service-role client, used only after a handler has authorised the request.
 *
 * These tables are RLS-protected for org/creator access, and the same
 * team-vs-org mismatch applies as elsewhere in the ATS: pipeline access is an
 * org role, several of these policies key on narrower membership. The handlers
 * below authorise explicitly against the application's organisation first.
 */
function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

const errorResponseSchema = z
  .object({ error: z.string(), message: z.string().optional() })
  .openapi("ErrorResponse");

const slotSchema = z
  .object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    proposed_by: z.string().uuid(),
    slot_start: z.string(),
    slot_end: z.string(),
    timezone: z.string(),
    location_type: z.enum(["video", "phone", "in_person"]),
    location_details: z.string().nullable(),
    meeting_link: z.string().nullable(),
    status: z.enum([
      "proposed",
      "booked",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
    ]),
    notes: z.string().nullable(),
    created_at: z.string(),
  })
  .openapi("InterviewSlot");

const linkSchema = z
  .object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    organization_id: z.string().uuid(),
    token: z.string(),
    expires_at: z.string(),
    max_bookings: z.number().int().nullable(),
    current_bookings: z.number().int().nullable(),
    is_active: z.boolean(),
    created_at: z.string(),
  })
  .openapi("SchedulingLink");

const SLOT_COLUMNS =
  "id, application_id, organization_id, proposed_by, slot_start, slot_end, timezone, location_type, location_details, meeting_link, status, notes, created_at";

const LINK_COLUMNS =
  "id, application_id, organization_id, token, expires_at, max_bookings, current_bookings, is_active, created_at";

/**
 * Authorise the caller for an application, or return the response to send.
 *
 * 404 before 403 on a missing row, so a stranger cannot probe which
 * application ids exist.
 */
// deno-lint-ignore no-explicit-any
async function authorise(c: any, applicationId: string) {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return {
      organizationId: null,
      userId: null,
      response: c.json(
        { error: "Unauthorized", message: "Authentication required" },
        401,
      ),
    };
  }

  const access = await resolveApplicationOrgAccess(
    supabase,
    user.id,
    applicationId,
    { allowedRoles: PIPELINE_ROLES },
  );

  if (!access.found) {
    return {
      organizationId: null,
      userId: null,
      response: c.json(
        { error: "Not Found", message: "Application not found" },
        404,
      ),
    };
  }

  if (!access.hasOrgAccess) {
    return {
      organizationId: null,
      userId: null,
      response: c.json(
        {
          error: "Forbidden",
          message: "You do not have access to this application",
        },
        403,
      ),
    };
  }

  return {
    organizationId: access.organizationId,
    userId: user.id,
    response: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Interview slots
// ─────────────────────────────────────────────────────────────────────────

const listSlotsRoute = createRoute({
  method: "get",
  path: "/slots",
  tags: ["Scheduling"],
  summary: "List proposed interview slots for an application",
  middleware: requireAuth,
  request: {
    query: z.object({ application_id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Slots",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(slotSchema) }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to this application",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listSlotsRoute, async (c) => {
  const { application_id } = c.req.valid("query");
  const auth = await authorise(c, application_id);
  if (auth.response) return auth.response;

  const { data, error } = await adminClient()
    .schema("core")
    .from("interview_slots")
    .select(SLOT_COLUMNS)
    .eq("application_id", application_id)
    .order("slot_start", { ascending: true });

  if (error) {
    console.error("Error listing interview slots:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ data: data ?? [] }, 200);
});

const createSlotRoute = createRoute({
  method: "post",
  path: "/slots",
  tags: ["Scheduling"],
  summary: "Propose an interview slot",
  middleware: requireAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              application_id: z.string().uuid(),
              slot_start: z.string(),
              slot_end: z.string(),
              timezone: z.string().optional(),
              location_type: z
                .enum(["video", "phone", "in_person"])
                .optional(),
              location_details: z.string().optional(),
              meeting_link: z.string().optional(),
              notes: z.string().optional(),
            })
            .refine(
              (body) => Date.parse(body.slot_end) > Date.parse(body.slot_start),
              { message: "slot_end must be after slot_start" },
            )
            .openapi("CreateInterviewSlotRequest"),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Slot proposed",
      content: { "application/json": { schema: slotSchema } },
    },
    400: {
      description: "Invalid slot",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to this application",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(createSlotRoute, async (c) => {
  const input = c.req.valid("json");
  const auth = await authorise(c, input.application_id);
  if (auth.response) return auth.response;

  const { data, error } = await adminClient()
    .schema("core")
    .from("interview_slots")
    .insert({
      application_id: input.application_id,
      organization_id: auth.organizationId,
      proposed_by: auth.userId,
      slot_start: input.slot_start,
      slot_end: input.slot_end,
      timezone: input.timezone ?? "America/New_York",
      location_type: input.location_type ?? "video",
      location_details: input.location_details ?? null,
      meeting_link: input.meeting_link ?? null,
      notes: input.notes ?? null,
    })
    .select(SLOT_COLUMNS)
    .single();

  if (error) {
    console.error("Error proposing interview slot:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json(data, 201);
});

// ─────────────────────────────────────────────────────────────────────────
// Scheduling links
// ─────────────────────────────────────────────────────────────────────────

const listLinksRoute = createRoute({
  method: "get",
  path: "/links",
  tags: ["Scheduling"],
  summary: "List self-scheduling links for an application",
  middleware: requireAuth,
  request: {
    query: z.object({ application_id: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Links",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(linkSchema) }),
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to this application",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listLinksRoute, async (c) => {
  const { application_id } = c.req.valid("query");
  const auth = await authorise(c, application_id);
  if (auth.response) return auth.response;

  const { data, error } = await adminClient()
    .schema("core")
    .from("scheduling_links")
    .select(LINK_COLUMNS)
    .eq("application_id", application_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing scheduling links:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json({ data: data ?? [] }, 200);
});

const createLinkRoute = createRoute({
  method: "post",
  path: "/links",
  tags: ["Scheduling"],
  summary: "Create a self-scheduling link",
  description:
    "Mints a token the candidate can use against GET /v1/scheduling/{token} and POST /v1/scheduling/{token}/book. The token is generated by the database, never by the client.",
  middleware: requireAuth,
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              application_id: z.string().uuid(),
              expires_at: z.string(),
              max_bookings: z.number().int().min(1).max(50).optional(),
            })
            .openapi("CreateSchedulingLinkRequest"),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Link created",
      content: { "application/json": { schema: linkSchema } },
    },
    401: {
      description: "Unauthorized",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    403: {
      description: "No access to this application",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(createLinkRoute, async (c) => {
  const input = c.req.valid("json");
  const auth = await authorise(c, input.application_id);
  if (auth.response) return auth.response;

  // `token` is deliberately omitted: the column defaults to
  // encode(gen_random_bytes(32), 'hex'), so the secret is generated in the
  // database and a client cannot choose or predict it.
  const { data, error } = await adminClient()
    .schema("core")
    .from("scheduling_links")
    .insert({
      application_id: input.application_id,
      organization_id: auth.organizationId,
      created_by: auth.userId,
      expires_at: input.expires_at,
      max_bookings: input.max_bookings ?? 1,
    })
    .select(LINK_COLUMNS)
    .single();

  if (error) {
    console.error("Error creating scheduling link:", error);
    return c.json(
      { error: "Internal Server Error", message: error.message },
      500,
    );
  }

  return c.json(data, 201);
});

export default app;
