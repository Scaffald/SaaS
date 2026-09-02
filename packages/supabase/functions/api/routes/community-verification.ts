/**
 * Community Verification REST API
 * License submission and verification status
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { SupabaseClient } from "@supabase/supabase-js";
import { type ApiEnv, authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono<ApiEnv>();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

const verificationDataSchema = z
  .object({
    state: z.string().min(2).max(2),
    license_number: z.string().min(1).max(50),
    license_type: z.string().min(1).max(100),
  })
  .openapi("VerificationData");

const verificationStatusSchema = z
  .object({
    community_id: z.string().uuid(),
    community_name: z.string(),
    is_verified: z.boolean(),
    verification_data: verificationDataSchema.nullable(),
    verified_at: z.string().nullable(),
    joined_at: z.string(),
  })
  .openapi("VerificationStatus");

// ============================================================================
// POST /v1/communities/verification/:communityId/submit — Submit license
// ============================================================================

const submitLicenseRoute = createRoute({
  method: "post",
  path: "/{communityId}/submit",
  tags: ["Community Verification"],
  summary: "Submit license",
  description:
    "Submit license information for community verification (self-attestation)",
  request: {
    params: z.object({ communityId: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: verificationDataSchema } },
    },
  },
  responses: {
    200: {
      description: "License submitted",
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean(), message: z.string() }),
        },
      },
    },
    400: {
      description: "Bad request",
      content: { "application/json": { schema: errorResponseSchema } },
    },
    404: {
      description: "Not a member",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(submitLicenseRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { communityId } = c.req.valid("param");
  const body = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check membership
  const { data: membership } = await supabase
    .schema("community")
    .from("memberships")
    .select("id, is_verified")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return c.json({ error: "You must join the community first" }, 404);
  }

  if (membership.is_verified) {
    return c.json({ error: "Already verified in this community" }, 400);
  }

  // Store verification data (pending admin review)
  const { error } = await supabase
    .schema("community")
    .from("memberships")
    .update({
      verification_data: {
        state: body.state,
        license_number: body.license_number,
        license_type: body.license_type,
        submitted_at: new Date().toISOString(),
        status: "pending",
      },
    })
    .eq("id", membership.id);

  if (error) {
    console.error("Error submitting license:", error);
    return c.json(
      { error: "Failed to submit license", message: error.message },
      500,
    );
  }

  return c.json({
    success: true,
    message:
      "License submitted for review. You will be notified when verified.",
  });
});

// ============================================================================
// GET /v1/communities/verification/:communityId/status — Check status
// ============================================================================

const checkStatusRoute = createRoute({
  method: "get",
  path: "/{communityId}/status",
  tags: ["Community Verification"],
  summary: "Verification status",
  description: "Check your verification status in a community",
  request: {
    params: z.object({ communityId: z.string().uuid() }),
  },
  responses: {
    200: {
      description: "Verification status",
      content: {
        "application/json": {
          schema: z.object({ data: verificationStatusSchema }),
        },
      },
    },
    404: {
      description: "Not a member",
      content: { "application/json": { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(checkStatusRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;
  const { communityId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: membership } = await supabase
    .schema("community")
    .from("memberships")
    .select("community_id, is_verified, verification_data, joined_at")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return c.json({ error: "Not a member of this community" }, 404);
  }

  // Get community name
  const { data: community } = await supabase
    .schema("community")
    .from("communities")
    .select("name")
    .eq("id", communityId)
    .maybeSingle();

  return c.json({
    data: {
      community_id: communityId,
      community_name: community?.name || "Unknown",
      is_verified: membership.is_verified,
      verification_data: membership.verification_data,
      verified_at: membership.verification_data?.verified_at || null,
      joined_at: membership.joined_at,
    },
  });
});

// ============================================================================
// GET /v1/communities/verification/my-statuses — All my verification statuses
// ============================================================================

const myStatusesRoute = createRoute({
  method: "get",
  path: "/my-statuses",
  tags: ["Community Verification"],
  summary: "My verification statuses",
  description: "Get verification status for all communities you belong to",
  responses: {
    200: {
      description: "Verification statuses",
      content: {
        "application/json": {
          schema: z.object({ data: z.array(verificationStatusSchema) }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(myStatusesRoute, async (c) => {
  const supabase = c.get("supabase") as SupabaseClient;
  const user = c.get("user") as Record<string, unknown> | null;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data: memberships } = await supabase
    .schema("community")
    .from("memberships")
    .select("community_id, is_verified, verification_data, joined_at")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return c.json({ data: [] });
  }

  const communityIds = memberships.map((m: Record<string, unknown>) =>
    m.community_id
  );
  const { data: communities } = await supabase
    .schema("community")
    .from("communities")
    .select("id, name")
    .in("id", communityIds);

  const communityMap = new Map(
    (communities || []).map((
      comm: Record<string, unknown>,
    ) => [comm.id, comm.name]),
  );

  const statuses = memberships.map((m: Record<string, unknown>) => ({
    community_id: m.community_id,
    community_name: communityMap.get(m.community_id) || "Unknown",
    is_verified: m.is_verified,
    verification_data: m.verification_data,
    verified_at:
      (m.verification_data as Record<string, unknown> | null)?.verified_at ||
      null,
    joined_at: m.joined_at,
  }));

  return c.json({ data: statuses });
});

export default app;
