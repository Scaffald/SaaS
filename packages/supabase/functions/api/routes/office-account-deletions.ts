/**
 * Office Account Deletions REST API (#1313)
 * Office role required.
 *
 * The requests a person has to look at: ones the processor gave up on or left
 * half-done, ones past the 30-day promise, and organization requests, which
 * the processor does not carry out. Ids and dates only — the processor's
 * compliance log holds no personal data, and neither does this.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  type ApiEnv,
  authMiddleware,
  requireRole,
} from "../middleware/auth.ts";

const app = new Hono<ApiEnv>();
app.use("*", authMiddleware);
app.use("*", requireRole("office", "platform"));

/** What Settings, the FAQ and the privacy policy promise. */
const PROMISE_DAYS = 30;

const FINISHED = ["completed", "cancelled"];

type Row = {
  id: string;
  deletion_type: string;
  deleted_user_id: string | null;
  deleted_organization_id: string | null;
  status: string;
  requested_at: string;
  scheduled_for: string;
  attempts: number;
  last_attempt_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  error_message: string | null;
};

/**
 * GET /v1/office/account-deletions?filter=attention|all
 *
 * `attention` (default): failed, partial, overdue, or an organization request
 * still open. `all`: every request, newest first.
 */
app.get(
  "/",
  zValidator(
    "query",
    z.object({
      filter: z.enum(["attention", "all"]).optional(),
      limit: z.coerce.number().int().min(1).max(200).optional(),
    }),
  ),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return c.json({ error: "Service role required" }, 500);

    const { filter = "attention", limit = 100 } = c.req.valid("query");
    const overdueBefore = new Date(Date.now() - PROMISE_DAYS * 86_400_000)
      .toISOString();

    let query = supabaseAdmin
      .schema("core")
      .from("account_deletions")
      .select(
        "id, deletion_type, deleted_user_id, deleted_organization_id, status, requested_at, scheduled_for, attempts, last_attempt_at, completed_at, cancelled_at, error_message",
      )
      .order("requested_at", { ascending: false })
      .limit(limit);

    if (filter === "attention") {
      query = query.or(
        [
          "status.in.(failed,partial)",
          // Not finished and past the promise.
          `and(status.in.(pending,in_progress),requested_at.lt."${overdueBefore}")`,
          "and(deletion_type.eq.organization,status.eq.pending)",
        ].join(","),
      );
    }

    const { data, error } = await query;
    if (error) {
      return c.json({
        error: `Failed to load deletion requests: ${error.message}`,
      }, 500);
    }

    const requests = ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      deletionType: row.deletion_type,
      deletedUserId: row.deleted_user_id,
      deletedOrganizationId: row.deleted_organization_id,
      status: row.status,
      requestedAt: row.requested_at,
      scheduledFor: row.scheduled_for,
      attempts: row.attempts,
      lastAttemptAt: row.last_attempt_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      errorMessage: row.error_message,
      overdue: !FINISHED.includes(row.status) &&
        Date.parse(row.requested_at) < Date.parse(overdueBefore),
      // The processor does not claim organization requests (migration 390).
      needsManualHandling: row.deletion_type === "organization" &&
        !FINISHED.includes(row.status),
    }));

    return c.json({ requests });
  },
);

export default app;
