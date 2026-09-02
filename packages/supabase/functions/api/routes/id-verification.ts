/**
 * ID Verification REST API
 * Migrated from trpc idVerification router
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type ApiEnv, addSupabaseAdminForUser, requireAuth, requireRole } from "../middleware/auth.ts";
import { mergeMetadata } from "../../_shared/id-verification-utils.ts";
import {
  addSixMonths,
  createPersonaInquiry,
  ensureCanRequestForWorker,
  loadStripeClient,
} from "../../_shared/id-verification-api.ts";

const requestSchema = z.object({
  workerUserId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  pricingId: z.string().uuid().optional(),
});

const confirmSchema = z.object({
  paymentIntentId: z.string().min(5),
});

const statusQuerySchema = z.object({
  idVerificationId: z.string().uuid(),
});

const currentQuerySchema = z.object({
  workerUserId: z.string().uuid().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(120).optional(),
  status: z.enum(["all", "active", "expired", "revoked"]).default("all"),
  organizationId: z.string().uuid().optional(),
});

const revokeSchema = z.object({
  idVerificationId: z.string().uuid(),
  reason: z.string().trim().min(5).max(500),
});

function toJson(
  c: { json: (body: unknown, status?: number) => Response },
  body: unknown,
  status = 200,
) {
  return c.json(body, status);
}

function toError(
  c: { json: (body: unknown, status?: number) => Response },
  message: string,
  status: number,
) {
  return c.json({ error: message }, status);
}

const app = new Hono<ApiEnv>();

// GET /pricing - protected
app.get("/pricing", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  if (!supabase) return toError(c, "Unauthorized", 401);

  const { data, error } = await supabase
    .schema("core")
    .from("service_pricing")
    .select("id, name, description, price_cents, metadata")
    .eq("service_type", "id_verification")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) return toError(c, `Failed to load pricing: ${error.message}`, 500);

  const items = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    priceCents: row.price_cents,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));

  return toJson(c, { data: items });
});

// POST /request - protected, needs supabaseAdmin for Stripe
app.post(
  "/request",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", requestSchema),
  async (c) => {
    const user = c.get("user");
    const supabase = c.get("supabase");
    const supabaseAdmin = c.get("supabaseAdmin");

    if (!user?.id) return toError(c, "Unauthorized", 401);
    if (!supabase || !supabaseAdmin) {
      return toError(
        c,
        "Admin client not available",
        500,
      );
    }

    const input = c.req.valid("json");
    try {
      await ensureCanRequestForWorker(
        supabaseAdmin,
        user.id,
        input.workerUserId,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Forbidden";
      if (msg === "UNAUTHORIZED") return toError(c, msg, 401);
      return toError(c, msg, 403);
    }

    const { data: pricingRows, error: pricingError } = await supabase
      .schema("core")
      .from("service_pricing")
      .select("id, name, description, price_cents")
      .eq("service_type", "id_verification")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (pricingError) {
      return toError(
        c,
        `Failed to load pricing: ${pricingError.message}`,
        500,
      );
    }

    const pricingList = (pricingRows ?? []) as Array<
      { id: string; price_cents: number }
    >;
    const selectedPricing = input.pricingId
      ? pricingList.find((r) => r.id === input.pricingId)
      : pricingList[0];

    if (!selectedPricing) {
      return toError(
        c,
        "ID verification pricing is not configured.",
        400,
      );
    }
    if (selectedPricing.price_cents <= 0) {
      return toError(
        c,
        "Pricing for ID verification must be greater than zero.",
        400,
      );
    }

    try {
      const stripe = await loadStripeClient(supabaseAdmin);
      const intent = await stripe.paymentIntents.create({
        amount: selectedPricing.price_cents,
        currency: "usd",
        metadata: {
          service_type: "id_verification",
          worker_user_id: input.workerUserId,
          initiated_by_user_id: user.id,
          organization_id: input.organizationId ?? "",
          service_pricing_id: selectedPricing.id,
        },
        automatic_payment_methods: { enabled: true },
      });

      if (!intent.client_secret) {
        return toError(
          c,
          "Stripe client secret was not returned.",
          500,
        );
      }

      return toJson(c, {
        data: {
          paymentIntentId: intent.id,
          clientSecret: intent.client_secret,
          amountCents: selectedPricing.price_cents,
          currency: intent.currency,
        },
      }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe error";
      return toError(c, msg, 500);
    }
  },
);

// POST /confirm - protected
app.post(
  "/confirm",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", confirmSchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");

    if (!user?.id) return toError(c, "Unauthorized", 401);
    if (!supabaseAdmin) return toError(c, "Admin client not available", 500);

    const input = c.req.valid("json");

    try {
      const stripe = await loadStripeClient(supabaseAdmin);
      const intent = await stripe.paymentIntents.retrieve(
        input.paymentIntentId,
      );

      if (intent.status !== "succeeded") {
        return toError(
          c,
          `Payment intent is not succeeded (current status: ${intent.status}).`,
          400,
        );
      }

      const metadata = (intent.metadata ?? {}) as Record<string, string>;
      const workerUserId = metadata.worker_user_id ?? user.id;
      if (!workerUserId) {
        return toError(
          c,
          "Unable to determine worker for verification.",
          400,
        );
      }

      await ensureCanRequestForWorker(supabaseAdmin, user.id, workerUserId);

      const initiatedByUserId = metadata.initiated_by_user_id?.length
        ? metadata.initiated_by_user_id
        : user.id;
      const organizationId = metadata.organization_id?.length
        ? metadata.organization_id
        : null;

      const { data: existing } = await supabaseAdmin
        .schema("core")
        .from("id_verifications")
        .select("id, badge_status")
        .eq("payment_intent_id", input.paymentIntentId)
        .maybeSingle();

      if (existing) {
        return toJson(c, {
          data: {
            id: existing.id,
            badgeStatus: existing.badge_status,
            badgeExpiresAt: null,
          },
        });
      }

      const personaInquiry = await createPersonaInquiry(workerUserId);
      const paidAt = new Date(
        (intent.created ?? Math.floor(Date.now() / 1000)) * 1000,
      );
      const verifiedAt = new Date();
      const badgeExpiresAt = addSixMonths(verifiedAt);

      const { data: record, error: insertError } = await supabaseAdmin
        .schema("core")
        .from("id_verifications")
        .insert({
          worker_user_id: workerUserId,
          initiated_by_user_id: initiatedByUserId,
          initiated_by_org_id: organizationId,
          payment_intent_id: intent.id,
          price_cents: intent.amount ?? 0,
          paid_at: paidAt.toISOString(),
          persona_inquiry_id: personaInquiry.inquiryId,
          persona_status: personaInquiry.status,
          verification_level: "government_id",
          verified_at: verifiedAt.toISOString(),
          badge_status: "active",
          badge_expires_at: badgeExpiresAt.toISOString(),
          metadata: mergeMetadata(metadata, {
            service_pricing_id: metadata.service_pricing_id ?? null,
          }),
        })
        .select("*")
        .maybeSingle();

      if (insertError || !record) {
        return toError(
          c,
          insertError
            ? `Failed to create id verification: ${insertError.message}`
            : "Failed to create record",
          500,
        );
      }

      await supabaseAdmin
        .schema("core")
        .from("payment_transactions")
        .insert({
          organization_id: organizationId,
          user_id: workerUserId,
          amount_cents: intent.amount ?? 0,
          currency: "usd",
          transaction_type: "id_verification",
          id_verification_id: record.id,
          stripe_payment_intent_id: intent.id,
          status: "succeeded",
          succeeded_at: new Date().toISOString(),
          metadata: { source: "id_verification_rest" },
        });

      return toJson(c, {
        data: {
          id: record.id,
          badgeStatus: record.badge_status,
          badgeExpiresAt: record.badge_expires_at,
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Confirmation failed";
      if (msg === "UNAUTHORIZED") return toError(c, msg, 401);
      if (msg.includes("not allowed")) return toError(c, msg, 403);
      return toError(c, msg, 500);
    }
  },
);

// GET /status - protected
app.get(
  "/status",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("query", statusQuerySchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");

    if (!user?.id) return toError(c, "Unauthorized", 401);
    if (!supabaseAdmin) return toError(c, "Admin client not available", 500);

    const input = c.req.valid("query");

    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("id_verifications")
      .select("*")
      .eq("id", input.idVerificationId)
      .maybeSingle();

    if (error) {
      return toError(
        c,
        `Failed to load verification: ${error.message}`,
        500,
      );
    }
    if (!data) return toError(c, "Verification not found", 404);

    try {
      await ensureCanRequestForWorker(
        supabaseAdmin,
        user.id,
        data.worker_user_id ?? "",
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Forbidden";
      return toError(c, msg, 403);
    }

    return toJson(c, {
      data: {
        id: data.id,
        badgeStatus: data.badge_status,
        badgeExpiresAt: data.badge_expires_at,
        personaStatus: data.persona_status,
        verificationLevel: data.verification_level,
        verifiedAt: data.verified_at,
        metadata: data.metadata ?? {},
      },
    });
  },
);

// GET /current - protected
app.get(
  "/current",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("query", currentQuerySchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");

    if (!user?.id) return toError(c, "Unauthorized", 401);
    if (!supabaseAdmin) return toError(c, "Admin client not available", 500);

    const input = c.req.valid("query");
    const workerUserId = input.workerUserId ?? user.id;
    if (!workerUserId) return toError(c, "workerUserId is required", 400);

    try {
      await ensureCanRequestForWorker(supabaseAdmin, user.id, workerUserId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Forbidden";
      return toError(c, msg, 403);
    }

    const { data, error } = await supabaseAdmin
      .schema("core")
      .rpc("get_current_verification", { p_worker_user_id: workerUserId });

    if (error) {
      return toError(
        c,
        `Failed to load verification badge: ${error.message}`,
        500,
      );
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      return toJson(c, { data: null });
    }

    const record = data[0] as Record<string, unknown>;
    return toJson(c, {
      data: {
        id: record.id,
        verificationLevel: record.verification_level,
        badgeStatus: record.badge_status,
        badgeExpiresAt: record.badge_expires_at,
        verifiedAt: record.verified_at,
      },
    });
  },
);

// GET /list - office
app.get(
  "/list",
  requireRole("office", "platform"),
  zValidator("query", listQuerySchema),
  async (c) => {
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!supabaseAdmin) return toError(c, "Admin client not available", 500);

    const input = c.req.valid("query");
    const queryLimit = 500;

    let query = supabaseAdmin
      .schema("core")
      .from("id_verifications")
      .select(
        `
      id, worker_user_id, initiated_by_user_id, initiated_by_org_id,
      payment_intent_id, price_cents, paid_at, badge_status, badge_expires_at,
      verification_level, verified_at, persona_status, created_at,
      worker:users!id_verifications_worker_user_id_fkey(id, display_name, email, avatar_path),
      initiator:users!id_verifications_initiated_by_user_id_fkey(id, display_name, email),
      organization:organizations!id_verifications_initiated_by_org_id_fkey(id, name)
    `,
      )
      .order("created_at", { ascending: false })
      .limit(queryLimit);

    if (input.organizationId) {
      query = query.eq("initiated_by_org_id", input.organizationId);
    }

    const { data, error } = await query;

    if (error) {
      return toError(
        c,
        `Failed to load ID verifications: ${error.message}`,
        500,
      );
    }

    type RowRecord = Record<string, unknown> & {
      badge_status?: string;
      badge_expires_at?: string | null;
      worker?: { display_name?: string; email?: string } | null;
    };

    const rows = (data ?? []) as RowRecord[];
    const now = Date.now();
    type DerivedStatus = "active" | "expired" | "revoked";

    const deriveStatus = (row: RowRecord): DerivedStatus => {
      const base = row.badge_status === "revoked"
        ? "revoked"
        : row.badge_status === "expired"
        ? "expired"
        : "active";
      if (
        base === "active" &&
        row.badge_expires_at &&
        !Number.isNaN(Date.parse(row.badge_expires_at)) &&
        Date.parse(row.badge_expires_at) < now
      ) {
        return "expired";
      }
      return base;
    };

    const deriveWorkerName = (row: RowRecord): string => {
      const dn = row.worker?.display_name?.trim();
      if (dn) return dn;
      const em = row.worker?.email?.trim();
      if (em) return em;
      const wid = row.worker_user_id;
      if (wid && typeof wid === "string") return `User ${wid.slice(0, 8)}`;
      return "Unknown worker";
    };

    const normalized = rows.map((row) => {
      const badgeStatus = deriveStatus(row);
      const source: "worker" | "organization" | "platform" =
        row.initiated_by_org_id
          ? "organization"
          : row.initiated_by_user_id && row.worker_user_id &&
              row.initiated_by_user_id !== row.worker_user_id
          ? "platform"
          : "worker";
      const org = row.organization as { id?: string; name?: string } | null;
      return {
        id: row.id,
        workerUserId: row.worker_user_id,
        workerName: deriveWorkerName(row),
        workerEmail: row.worker?.email ?? null,
        workerAvatarUrl:
          (row.worker as { avatar_path?: string })?.avatar_path ?? null,
        organizationId: org?.id ?? row.initiated_by_org_id ?? null,
        organizationName: org?.name ?? null,
        initiatedByUserId: row.initiated_by_user_id,
        initiatedByOrgId: row.initiated_by_org_id,
        paymentIntentId: row.payment_intent_id,
        priceCents: row.price_cents ?? 0,
        paidAt: row.paid_at,
        badgeStatus,
        rawBadgeStatus: row.badge_status,
        badgeExpiresAt: row.badge_expires_at,
        verificationLevel: row.verification_level,
        personaStatus: row.persona_status,
        verifiedAt: row.verified_at,
        createdAt: row.created_at,
        source,
      };
    });

    const summary = normalized.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.badgeStatus] += 1;
        return acc;
      },
      { total: 0, active: 0, expired: 0, revoked: 0 } as Record<string, number>,
    );

    const statusFiltered = input.status === "all"
      ? normalized
      : normalized.filter((i) => i.badgeStatus === input.status);
    const searchTerm = input.search?.trim().toLowerCase();
    const filtered = searchTerm
      ? statusFiltered.filter((item) => {
        const haystack = [
          item.workerName,
          item.workerEmail ?? "",
          item.organizationName ?? "",
          item.badgeStatus,
          item.personaStatus ?? "",
          item.verificationLevel ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchTerm);
      })
      : statusFiltered;

    const total = filtered.length;
    const start = Math.min(input.offset, total);
    const end = Math.min(start + input.limit, total);
    const items = filtered.slice(start, end);

    return toJson(c, {
      data: {
        items,
        total,
        hasMore: end < total,
        summary: {
          total: summary.total,
          active: summary.active,
          expired: summary.expired,
          revoked: summary.revoked,
        },
      },
    });
  },
);

// POST /revoke - office
app.post(
  "/revoke",
  requireRole("office", "platform"),
  zValidator("json", revokeSchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");

    if (!user?.id) return toError(c, "Unauthorized", 401);
    if (!supabaseAdmin) return toError(c, "Admin client not available", 500);

    const input = c.req.valid("json");

    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("id_verifications")
      .update({
        badge_status: "revoked",
        revoked_at: new Date().toISOString(),
        revoked_by_user_id: user.id,
        revocation_reason: input.reason,
      })
      .eq("id", input.idVerificationId)
      .select("id")
      .maybeSingle();

    if (error) {
      return toError(
        c,
        `Failed to revoke verification: ${error.message}`,
        500,
      );
    }
    if (!data) return toError(c, "Verification not found", 404);

    return toJson(c, { data: { revoked: true } });
  },
);

export default app;
