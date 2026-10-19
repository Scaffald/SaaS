/**
 * Account Deletion REST API
 * Handles worker and organization account deletion requests.
 * Migrated from tRPC accountDeletionRouter.
 *
 * A request is carried out by the `account-deletion-process` function once
 * its grace period has passed (#1313). The period lives in the database
 * (core.account_deletion_grace_period(), migration 390): the insert trigger
 * sets scheduled_for, and nothing here computes it.
 *
 * While a request waits, the user can still sign in; the app shows the date
 * with a Cancel (GET /status, POST /cancel).
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  requireAuth,
} from "../middleware/auth.ts";
import { userHasOrgAccess } from "../lib/application-access.ts";
import { userHasPlatformRole } from "../../_shared/id-verification-api.ts";

const app = new Hono<ApiEnv>();
app.use("*", requireAuth);
// Every handler here writes core.account_deletions with the service client.
// Without this nothing set it, so POST /worker answered 401 to every signed-in
// user and no request was ever recorded (#1313).
app.use("*", addSupabaseAdminForUser);

/** A worker request still waiting or being retried — one per user (390). */
const OPEN_STATUSES = ["pending", "in_progress", "failed", "partial"];

/**
 * Statuses the user may cancel from. 'failed' means the processor stopped
 * before deleting anything (see _shared/account-deletion/process.ts), so
 * cancelling it is as safe as cancelling a pending one. 'in_progress' and
 * 'partial' are not: something has already been deleted.
 */
const CANCELLABLE_STATUSES = ["pending", "failed"];

/**
 * Organisation roles that may ask for their organisation to be deleted, besides
 * its owner and platform office staff. Deliberately not "any role in the org"
 * (#1321).
 */
const ORG_DELETION_ROLES = ["admin"];

const REQUEST_COLUMNS =
  "id, status, requested_at, scheduled_for, created_at, deletion_type";

type RequestRow = {
  id: string;
  status: string;
  requested_at: string;
  scheduled_for: string;
  created_at: string;
  deletion_type: string;
};

function present(row: RequestRow) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    requestedAt: row.requested_at,
    scheduledFor: row.scheduled_for,
    // Only a worker request has a self-service cancel.
    canCancel: row.deletion_type === "worker" &&
      CANCELLABLE_STATUSES.includes(row.status),
  };
}

app.post(
  "/worker",
  zValidator(
    "json",
    z.object({
      reason: z.string().optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin || !user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { reason } = c.req.valid("json");

    // A second tap, or a retry after a dropped response, answers with the
    // request already open rather than queueing another (the unique index in
    // 390 would refuse it anyway).
    const { data: existing, error: existingError } = await supabaseAdmin
      .schema("core")
      .from("account_deletions")
      .select(REQUEST_COLUMNS)
      .eq("deleted_user_id", user.id)
      .eq("deletion_type", "worker")
      .in("status", OPEN_STATUSES)
      .maybeSingle();

    if (existingError) {
      return c.json({
        error:
          `Failed to check for an existing request: ${existingError.message}`,
      }, 500);
    }
    if (existing) return c.json(present(existing as RequestRow));

    const { data: deletion, error: deletionError } = await supabaseAdmin
      .schema("core")
      .from("account_deletions")
      .insert({
        deleted_user_id: user.id,
        deletion_type: "worker",
        requested_by_user_id: user.id,
        reason: reason ?? null,
        status: "pending",
      })
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (deletionError || !deletion) {
      return c.json(
        {
          error: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : "Failed to create deletion record",
        },
        500,
      );
    }

    return c.json(present(deletion as RequestRow));
  },
);

/**
 * The signed-in user's open deletion request, or `{ request: null }`.
 * Read on sign-in to show "scheduled for deletion on <date>".
 */
app.get("/status", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("account_deletions")
    .select(REQUEST_COLUMNS)
    .eq("deleted_user_id", user.id)
    .eq("deletion_type", "worker")
    .in("status", OPEN_STATUSES)
    .maybeSingle();

  if (error) {
    return c.json({
      error: `Failed to load deletion request: ${error.message}`,
    }, 500);
  }

  return c.json({ request: data ? present(data as RequestRow) : null });
});

/**
 * Cancel the signed-in user's own request.
 *
 * One conditional UPDATE: the processor claims a row by moving it to
 * 'in_progress' in a single statement too, so exactly one of the two wins and
 * a cancel can never land on a deletion that has started.
 */
app.post("/cancel", async (c) => {
  const supabaseAdmin = c.get("supabaseAdmin");
  const user = c.get("user");
  if (!supabaseAdmin || !user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const cancelledAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("account_deletions")
    .update({ status: "cancelled", cancelled_at: cancelledAt })
    .eq("deleted_user_id", user.id)
    .eq("deletion_type", "worker")
    .in("status", CANCELLABLE_STATUSES)
    .select("id, status, cancelled_at");

  if (error) {
    return c.json({
      error: `Failed to cancel deletion request: ${error.message}`,
    }, 500);
  }

  const cancelled = (data ?? [])[0] as
    | { id: string; status: string; cancelled_at: string }
    | undefined;
  if (cancelled) {
    return c.json({
      id: cancelled.id,
      status: cancelled.status,
      cancelledAt: cancelled.cancelled_at,
    });
  }

  // Nothing cancellable. Say whether that is because the deletion is already
  // under way, which the user needs to hear differently from "no request".
  const { data: open } = await supabaseAdmin
    .schema("core")
    .from("account_deletions")
    .select("id, status")
    .eq("deleted_user_id", user.id)
    .eq("deletion_type", "worker")
    .in("status", OPEN_STATUSES)
    .maybeSingle();

  if (open) {
    return c.json({
      error: "Deletion has already started and can no longer be cancelled",
      status: (open as { status: string }).status,
    }, 409);
  }
  return c.json({ error: "No deletion request to cancel" }, 404);
});

app.post(
  "/organization",
  zValidator(
    "json",
    z.object({
      organizationId: z.string().uuid(),
      reason: z.string().optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    const user = c.get("user");
    if (!supabaseAdmin || !user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { organizationId, reason } = c.req.valid("json");

    // Who may ask for an organisation to be deleted: platform office staff, or
    // the organisation's owner or an org admin. This checked "office" with
    // an equality filter on core.role_assignments.role, a column that does
    // not exist: the query always errored, the error was dropped, and the
    // fallback admitted any role scoped to the organisation. So any member
    // could file the request, office staff were refused, and someone holding
    // two roles in the org was refused by `.maybeSingle()` (#1321). A failed
    // lookup is a 500 here, never "no access".
    const { data: org, error: orgError } = await supabaseAdmin
      .schema("core")
      .from("organizations")
      .select("owner_user_id")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError) {
      return c.json({
        error: `Failed to load organization: ${orgError.message}`,
      }, 500);
    }
    if (!org) return c.json({ error: "Organization not found" }, 404);

    let allowed: boolean;
    try {
      allowed = await userHasPlatformRole(supabaseAdmin, user.id) ||
        // The owner-or-org-admin rule the hiring routes use (#1312).
        await userHasOrgAccess(
          supabaseAdmin,
          user.id,
          organizationId,
          (org as { owner_user_id: string | null }).owner_user_id,
          { allowedRoles: ORG_DELETION_ROLES },
        );
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }

    if (!allowed) return c.json({ error: "Forbidden" }, 403);

    // Organization requests are recorded and scheduled like a worker's, but
    // the processor does not carry them out: deleting an organization needs
    // decisions about its members, its Stripe customer and its documents. They
    // appear in GET /v1/office/account-deletions for manual handling (#1313).
    const { data: deletion, error: deletionError } = await supabaseAdmin
      .schema("core")
      .from("account_deletions")
      .insert({
        deleted_organization_id: organizationId,
        deletion_type: "organization",
        requested_by_user_id: user.id,
        reason: reason ?? null,
        status: "pending",
      })
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (deletionError || !deletion) {
      return c.json(
        {
          error: deletionError
            ? `Failed to create deletion record: ${deletionError.message}`
            : "Failed to create deletion record",
        },
        500,
      );
    }

    return c.json(present(deletion as RequestRow));
  },
);

export default app;
