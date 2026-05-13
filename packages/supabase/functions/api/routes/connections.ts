/**
 * Connections REST API
 * Manages user connections (professional network)
 * Endpoints for sending, accepting, declining connection requests
 */

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "../middleware/auth.ts";

const app = new OpenAPIHono();

app.use("*", authMiddleware);

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi("ErrorResponse");

const userProfileSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string(),
  last_name: z.string(),
  avatar_url: z.string().url().nullable(),
});

const connectionSchema = z
  .object({
    id: z.string().uuid(),
    requester_id: z.string().uuid(),
    addressee_id: z.string().uuid(),
    status: z.enum(["pending", "accepted", "declined"]),
    created_at: z.string(),
    updated_at: z.string(),
    requester: userProfileSchema.optional(),
    addressee: userProfileSchema.optional(),
  })
  .openapi("Connection");

const connectionRequestSchema = z
  .object({
    id: z.string().uuid(),
    requester_id: z.string().uuid(),
    addressee_id: z.string().uuid(),
    status: z.literal("pending"),
    created_at: z.string(),
    requester: userProfileSchema,
  })
  .openapi("ConnectionRequest");

// Request schemas
const sendConnectionRequestSchema = z.object({
  targetUserId: z.string().uuid(),
});

// Response schemas
const connectionsListResponseSchema = z
  .object({
    data: z.array(connectionSchema),
    total: z.number().int(),
  })
  .openapi("ConnectionsListResponse");

const pendingRequestsResponseSchema = z
  .object({
    sent: z.array(connectionRequestSchema),
    received: z.array(connectionRequestSchema),
  })
  .openapi("PendingRequestsResponse");

const connectionStatusResponseSchema = z
  .object({
    status: z.enum(["none", "pending_sent", "pending_received", "connected"]),
    connectionId: z.string().uuid().optional(),
  })
  .openapi("ConnectionStatusResponse");

const connectionResponseSchema = z
  .object({
    data: connectionSchema,
  })
  .openapi("ConnectionResponse");

/** Map core.users row (display_name) to API shape (first_name, last_name) */
function mapUserToProfile(
  u:
    | { id: string; display_name?: string | null; avatar_url?: string | null }
    | null,
): {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
} | undefined {
  if (!u) return undefined;
  const displayName = (u.display_name ?? "").trim() || "Unknown";
  const [first_name, ...rest] = displayName.split(/\s+/);
  const last_name = rest.join(" ") || "";
  return { id: u.id, first_name, last_name, avatar_url: u.avatar_url ?? null };
}

/** Map connection row (requester_user_id, addressee_user_id, requester, addressee) to API shape */
function mapConnectionRow<T extends Record<string, unknown>>(
  row: T,
): Record<string, unknown> {
  const r = row.requester as {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  const a = row.addressee as {
    id: string;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  return {
    ...row,
    requester_id: row.requester_user_id,
    addressee_id: row.addressee_user_id,
    updated_at: (row.decided_at ?? row.created_at) as string,
    requester: mapUserToProfile(r),
    addressee: mapUserToProfile(a),
  };
}

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/connections
 * List all accepted connections for the current user
 */
const listConnectionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Connections"],
  summary: "List connections",
  description: "Get all accepted connections for the authenticated user",
  responses: {
    200: {
      description: "List of accepted connections",
      content: {
        "application/json": {
          schema: connectionsListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(listConnectionsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get all accepted connections where user is either requester or addressee
  // core.connections uses requester_user_id/addressee_user_id and FKs to core.users
  const { data: connectionsRaw, error } = await supabase
    .schema("core")
    .from("connections")
    .select(`
      id,
      requester_user_id,
      addressee_user_id,
      status,
      created_at,
      decided_at,
      requester:users!connections_requester_user_id_fkey(id, display_name, avatar_url),
      addressee:users!connections_addressee_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching connections:", error);
    return c.json({
      error: "Failed to fetch connections",
      message: error.message,
    }, 500);
  }

  const { count } = await supabase
    .schema("core")
    .from("connections")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`requester_user_id.eq.${user.id},addressee_user_id.eq.${user.id}`);

  const connections = (connectionsRaw || []).map((row) =>
    mapConnectionRow(row as Record<string, unknown>)
  );

  return c.json({
    data: connections || [],
    total: count || 0,
  });
});

/**
 * GET /v1/connections/pending
 * Get pending connection requests (sent and received)
 */
const getPendingRequestsRoute = createRoute({
  method: "get",
  path: "/pending",
  tags: ["Connections"],
  summary: "Get pending requests",
  description: "Get all pending connection requests (sent and received)",
  responses: {
    200: {
      description: "Pending connection requests",
      content: {
        "application/json": {
          schema: pendingRequestsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getPendingRequestsRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get sent requests (core.connections uses requester_user_id, users FK)
  const { data: sentRaw, error: sentError } = await supabase
    .schema("core")
    .from("connections")
    .select(`
      id,
      requester_user_id,
      addressee_user_id,
      status,
      created_at,
      decided_at,
      requester:users!connections_requester_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq("requester_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Get received requests
  const { data: receivedRaw, error: receivedError } = await supabase
    .schema("core")
    .from("connections")
    .select(`
      id,
      requester_user_id,
      addressee_user_id,
      status,
      created_at,
      decided_at,
      requester:users!connections_requester_user_id_fkey(id, display_name, avatar_url)
    `)
    .eq("addressee_user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (sentError || receivedError) {
    console.error(
      "Error fetching pending requests:",
      sentError || receivedError,
    );
    return c.json(
      {
        error: "Failed to fetch pending requests",
        message: (sentError || receivedError)?.message,
      },
      500,
    );
  }

  const mapPendingRow = (row: Record<string, unknown>) => ({
    id: row.id,
    requester_id: row.requester_user_id,
    addressee_id: row.addressee_user_id,
    status: row.status,
    created_at: row.created_at,
    requester: mapUserToProfile(
      row.requester as {
        id: string;
        display_name?: string | null;
        avatar_url?: string | null;
      } | null,
    ),
  });
  const sent = (sentRaw || []).map((row) =>
    mapPendingRow(row as Record<string, unknown>)
  );
  const received = (receivedRaw || []).map((row) =>
    mapPendingRow(row as Record<string, unknown>)
  );

  return c.json({
    sent: (sent || []) as Record<string, unknown>[],
    received: (received || []) as Record<string, unknown>[],
  });
});

/**
 * GET /v1/connections/status/:userId
 * Get connection status with a specific user
 */
const getConnectionStatusRoute = createRoute({
  method: "get",
  path: "/status/{userId}",
  tags: ["Connections"],
  summary: "Get connection status",
  description: "Get the connection status with a specific user",
  request: {
    params: z.object({
      userId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Connection status",
      content: {
        "application/json": {
          schema: connectionStatusResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(getConnectionStatusRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { userId } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Check if there's an existing connection between users
  const { data: connection } = await supabase
    .schema("core")
    .from("connections")
    .select("id, status, requester_user_id, addressee_user_id")
    .or(
      `and(requester_user_id.eq.${user.id},addressee_user_id.eq.${userId}),and(requester_user_id.eq.${userId},addressee_user_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (!connection) {
    return c.json({ status: "none" });
  }

  if (connection.status === "accepted") {
    return c.json({ status: "connected", connectionId: connection.id });
  }

  if (connection.status === "pending") {
    const isPendingSent = connection.requester_user_id === user.id;
    return c.json({
      status: isPendingSent ? "pending_sent" : "pending_received",
      connectionId: connection.id,
    });
  }

  return c.json({ status: "none" });
});

/**
 * POST /v1/connections/request
 * Send a connection request to another user
 */
const sendConnectionRequestRoute = createRoute({
  method: "post",
  path: "/request",
  tags: ["Connections"],
  summary: "Send connection request",
  description: "Send a connection request to another user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: sendConnectionRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Connection request sent",
      content: {
        "application/json": {
          schema: connectionResponseSchema,
        },
      },
    },
    400: {
      description: "Bad request",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(sendConnectionRequestRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { targetUserId } = c.req.valid("json");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (targetUserId === user.id) {
    return c.json({ error: "Cannot connect with yourself" }, 400);
  }

  // Check if connection already exists
  const { data: existing } = await supabase
    .schema("core")
    .from("connections")
    .select("id, status")
    .or(
      `and(requester_user_id.eq.${user.id},addressee_user_id.eq.${targetUserId}),and(requester_user_id.eq.${targetUserId},addressee_user_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    return c.json({ error: "Connection already exists" }, 400);
  }

  // Create connection request
  const { data: connection, error } = await supabase
    .schema("core")
    .from("connections")
    .insert({
      requester_user_id: user.id,
      addressee_user_id: targetUserId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating connection:", error);
    return c.json({
      error: "Failed to send connection request",
      message: error.message,
    }, 500);
  }

  return c.json({ data: connection }, 201);
});

/**
 * POST /v1/connections/:id/accept
 * Accept a connection request
 */
const acceptConnectionRoute = createRoute({
  method: "post",
  path: "/{id}/accept",
  tags: ["Connections"],
  summary: "Accept connection",
  description: "Accept a pending connection request",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: "Connection accepted",
      content: {
        "application/json": {
          schema: connectionResponseSchema,
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Connection not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(acceptConnectionRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get the connection
  const { data: connection } = await supabase
    .schema("core")
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (!connection) {
    return c.json({ error: "Connection not found" }, 404);
  }

  // Only the addressee can accept
  if (connection.addressee_user_id !== user.id) {
    return c.json({ error: "Only the recipient can accept this request" }, 403);
  }

  if (connection.status !== "pending") {
    return c.json({ error: "Connection is not pending" }, 400);
  }

  // Accept the connection
  const { data: updated, error } = await supabase
    .schema("core")
    .from("connections")
    .update({ status: "accepted", decided_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error accepting connection:", error);
    return c.json({
      error: "Failed to accept connection",
      message: error.message,
    }, 500);
  }

  return c.json({ data: updated });
});

/**
 * POST /v1/connections/:id/decline
 * Decline a connection request
 */
const declineConnectionRoute = createRoute({
  method: "post",
  path: "/{id}/decline",
  tags: ["Connections"],
  summary: "Decline connection",
  description: "Decline a pending connection request",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Connection declined",
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Connection not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(declineConnectionRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get the connection
  const { data: connection } = await supabase
    .schema("core")
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (!connection) {
    return c.json({ error: "Connection not found" }, 404);
  }

  // Only the addressee can decline
  if (connection.addressee_user_id !== user.id) {
    return c.json(
      { error: "Only the recipient can decline this request" },
      403,
    );
  }

  // Delete the connection request
  const { error } = await supabase.schema("core").from("connections").delete()
    .eq("id", id);

  if (error) {
    console.error("Error declining connection:", error);
    return c.json({
      error: "Failed to decline connection",
      message: error.message,
    }, 500);
  }

  return c.body(null, 204);
});

/**
 * DELETE /v1/connections/:id
 * Remove an existing connection
 */
const removeConnectionRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Connections"],
  summary: "Remove connection",
  description: "Remove an existing connection",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Connection removed",
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Connection not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(removeConnectionRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get the connection
  const { data: connection } = await supabase
    .schema("core")
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (!connection) {
    return c.json({ error: "Connection not found" }, 404);
  }

  // Only participants can remove
  if (
    connection.requester_user_id !== user.id &&
    connection.addressee_user_id !== user.id
  ) {
    return c.json({ error: "Only connection participants can remove it" }, 403);
  }

  // Delete the connection
  const { error } = await supabase.schema("core").from("connections").delete()
    .eq("id", id);

  if (error) {
    console.error("Error removing connection:", error);
    return c.json({
      error: "Failed to remove connection",
      message: error.message,
    }, 500);
  }

  return c.body(null, 204);
});

/**
 * DELETE /v1/connections/:id/cancel
 * Cancel a sent connection request
 */
const cancelConnectionRoute = createRoute({
  method: "delete",
  path: "/{id}/cancel",
  tags: ["Connections"],
  summary: "Cancel connection request",
  description: "Cancel a pending connection request that you sent",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    204: {
      description: "Connection request cancelled",
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Connection not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

app.openapi(cancelConnectionRoute, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  const { id } = c.req.valid("param");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get the connection
  const { data: connection } = await supabase
    .schema("core")
    .from("connections")
    .select("*")
    .eq("id", id)
    .single();

  if (!connection) {
    return c.json({ error: "Connection not found" }, 404);
  }

  // Only the requester can cancel
  if (connection.requester_user_id !== user.id) {
    return c.json({ error: "Only the requester can cancel this request" }, 403);
  }

  if (connection.status !== "pending") {
    return c.json({ error: "Can only cancel pending requests" }, 400);
  }

  // Delete the connection request
  const { error } = await supabase.schema("core").from("connections").delete()
    .eq("id", id);

  if (error) {
    console.error("Error cancelling connection:", error);
    return c.json({
      error: "Failed to cancel connection request",
      message: error.message,
    }, 500);
  }

  return c.body(null, 204);
});

export default app;
