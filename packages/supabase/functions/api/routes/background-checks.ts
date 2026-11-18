/**
 * Background Checks REST API — the worker's side.
 *
 * Packages, requesting and paying for a check, its documents, privacy, and
 * disputes. The office/admin side lives in background-checks-admin.ts, which
 * index.ts mounts first so `/admin/*` is never read as a `/{checkId}`.
 *
 * Shapes follow @scaffald/sdk's BackgroundChecks resource, which returns the
 * body verbatim — so these routes answer bare objects, not `{ data }`, and
 * translate the SDK's field names to the table's (`reason` → `dispute_reason`,
 * `storage_path` → `file_path`, `privacy_level` → `is_public`) at the edge
 * rather than asking the SDK to change.
 *
 * Every write goes through the service-role client: `core.background_checks`
 * has no INSERT or UPDATE policy for `authenticated`, deliberately, so the
 * ownership checks here are the gate. Each one loads the check by id AND
 * `user_id = caller` before touching anything.
 *
 * #1267 part 1. What this does NOT do yet is submit a paid check to the
 * screening provider; that needs the provider's real API (part 2). A paid
 * check therefore stays `pending` with `paid_at` set, which is exactly what
 * the office review queue shows.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  requireAuth,
} from "../middleware/auth.ts";
import { loadStripeClient } from "../../_shared/id-verification-api.ts";
import { canReadOrgInternals } from "../lib/org-access.ts";

const app = new Hono<ApiEnv>();

const BUCKET = "background-check-documents";
// Mirrors the bucket's own limits (migration 034), so a bad file is refused
// here with a readable message instead of by Storage after the upload starts.
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const UPLOAD_URL_TTL_SECONDS = 2 * 60 * 60; // Storage's fixed signed-upload lifetime
const DISPUTABLE_STATUSES = [
  "completed_clear",
  "completed_consider",
  "completed_not_clear",
  "partially_completed",
];

// deno-lint-ignore no-explicit-any
type Admin = any;

function fail(
  c: { json: (body: unknown, status?: number) => Response },
  status: number,
  error: string,
  message?: string,
) {
  return c.json(message ? { error, message } : { error }, status);
}

/**
 * The caller's own check, or null. An error is thrown rather than folded into
 * "not found": a failed lookup is a 500, not a reason to tell someone their
 * check does not exist.
 */
async function loadOwnCheck(
  admin: Admin,
  checkId: string,
  userId: string,
  columns = "*",
  opts: { orRequester?: boolean } = {},
): Promise<Record<string, unknown> | null> {
  const base = admin
    .schema("core")
    .from("background_checks")
    .select(columns)
    .eq("id", checkId);
  const { data, error } =
    await (opts.orRequester
      ? base.or(`user_id.eq.${userId},requested_by_user_id.eq.${userId}`)
      : base.eq("user_id", userId)).maybeSingle();
  if (error) {
    throw new Error(`Failed to load background check: ${error.message}`);
  }
  return data ?? null;
}

function historyWith(
  existing: unknown,
  entry: Record<string, unknown>,
): unknown[] {
  const history = Array.isArray(existing) ? [...existing] : [];
  history.push({ occurred_at: new Date().toISOString(), ...entry });
  return history;
}

/** `{userId}/{checkId}/…` — the first folder is what the bucket's RLS checks. */
function ownsStoragePath(path: string, userId: string, checkId: string) {
  return path.startsWith(`${userId}/${checkId}/`) && !path.includes("..");
}

function toDocument(row: Record<string, unknown>) {
  return {
    id: row.id,
    background_check_id: row.background_check_id,
    storage_path: row.file_path,
    document_type: row.document_type,
    file_name: row.file_name,
    mime_type: row.mime_type,
    file_size: row.file_size,
    uploaded_at: row.uploaded_at,
  };
}

function toDispute(row: Record<string, unknown>) {
  return {
    id: row.id,
    background_check_id: row.background_check_id,
    user_id: row.user_id,
    reason: row.dispute_reason,
    details: row.dispute_details ?? undefined,
    supporting_documents: row.supporting_documents ?? [],
    status: row.status,
    resolution: row.resolution ?? undefined,
    resolved_at: row.resolved_at ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** What the Office request form sends for an employer-paid check. */
const employerMetadataSchema = z.object({
  organization_id: z.string().uuid(),
  worker_user_id: z.string().uuid(),
  job_id: z.string().uuid().optional(),
}).passthrough();

/**
 * Whether the caller may order (and pay for) a check on an organization's
 * behalf: its owner or anyone with a role in it (the same rule as reading its
 * checks, lib/org-access.ts), or platform screening staff.
 */
async function mayRequestForOrganization(
  admin: Admin,
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const { data: roles, error } = await admin
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope)")
    .eq("user_id", userId);
  if (error) throw new Error(`Unable to verify roles: ${error.message}`);
  const staff = (roles ?? []).some((a: { role: unknown }) => {
    const role = (Array.isArray(a.role) ? a.role[0] : a.role) as
      | { name?: string; scope?: string }
      | null;
    return role?.scope === "platform" &&
      ["office", "super_admin", "background_check_admin"].includes(
        role.name ?? "",
      );
  });
  if (staff) return true;
  const access = await canReadOrgInternals(admin, organizationId, userId);
  return access.allowed;
}

// ============================================================================
// Literal routes first — a literal declared after a /:param sibling of the
// same method is unreachable (literal-routes-precede-params.test.ts).
// ============================================================================

/**
 * GET /v1/background-checks/packages
 *
 * Named columns, not `*`: the table also holds `platform_cost_cents` — what a
 * check costs Scaffald — and `provider_package_code`. Neither is the worker's
 * business, and `*` sent both to every signed-in user (#1127).
 */
app.get("/packages", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  if (!supabase) return fail(c, 401, "Unauthorized");

  const { data: packages, error } = await supabase
    .schema("core")
    .from("background_check_packages")
    .select(
      "id, slug, display_name, description, retail_cost_cents, estimated_completion_days, check_type_ids, is_active, created_at, updated_at",
    )
    .eq("is_active", true)
    .order("retail_cost_cents");

  if (error) {
    return fail(c, 500, "Failed to fetch packages", error.message);
  }

  const rows = (packages ?? []) as Array<Record<string, unknown>>;
  const typeIds = [
    ...new Set(rows.flatMap((p) => (p.check_type_ids as string[]) ?? [])),
  ];

  // What each package checks, for the "What's checked" list. Same rule: the
  // type's name and description, never its costs.
  let types: Array<Record<string, unknown>> = [];
  if (typeIds.length > 0) {
    const { data: typeRows, error: typeError } = await supabase
      .schema("core")
      .from("background_check_types")
      .select("id, slug, display_name, description, category")
      .in("id", typeIds);
    if (typeError) {
      return fail(c, 500, "Failed to fetch check types", typeError.message);
    }
    types = (typeRows ?? []) as Array<Record<string, unknown>>;
  }
  const typeById = new Map(types.map((t) => [t.id as string, t]));

  return c.json(rows.map((p) => {
    const components = ((p.check_type_ids as string[]) ?? [])
      .map((id) => typeById.get(id))
      .filter((t): t is Record<string, unknown> => Boolean(t));
    return {
      ...p,
      turnaround_days: p.estimated_completion_days ?? undefined,
      check_types: components.map((t) => t.slug),
      components,
    };
  }));
});

/**
 * GET /v1/background-checks — the caller's own checks.
 */
app.get("/", requireAuth, async (c) => {
  const supabase = c.get("supabase");
  const user = c.get("user");
  if (!supabase || !user?.id) return fail(c, 401, "Unauthorized");

  const { data, error } = await supabase
    .schema("core")
    .from("background_checks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return fail(c, 500, "Failed to fetch checks", error.message);
  return c.json(data ?? []);
});

/**
 * POST /v1/background-checks/request
 *
 * Creates the check, then the Stripe intent for it, then the ledger row —
 * and only then hands out the client secret, so there is a row for every
 * charge (#948). If Stripe or the ledger fails, the just-created check is
 * removed: nothing was charged, and a stranded `pending` check would sit in
 * the office queue looking like real work.
 *
 * The price is the package's, read here. Nothing the client sends sets it.
 */
const requestSchema = z.object({
  package_id: z.string().uuid(),
  tier: z.string().max(100).optional(),
  // The SDK says 'employer'; the table says 'organization'.
  paid_by: z.enum(["worker", "employer"]).default("worker"),
  consent: z.object({
    consent_signature: z.string().trim().min(1).max(200),
    consent_given_at: z.string().datetime({ offset: true }),
    consent_ip_address: z.string().max(64).optional(),
    consent_user_agent: z.string().max(500).optional(),
    disclosure_provided_at: z.string().datetime({ offset: true }),
    summary_of_rights_provided_at: z.string().datetime({ offset: true }),
  }),
  metadata: z.record(z.unknown()).optional(),
});

app.post(
  "/request",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", requestSchema),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");

    const body = c.req.valid("json");

    // Who the check is about, who pays, and on whose behalf. A worker buying
    // their own check is the default; an employer (or office staff for an
    // organization) names the worker and the organization in `metadata`,
    // which is what the Office request form sends.
    let subject: {
      workerId: string;
      organizationId: string | null;
      jobId: string | null;
    } = { workerId: user.id, organizationId: null, jobId: null };

    if (body.paid_by === "employer") {
      const parsed = employerMetadataSchema.safeParse(body.metadata ?? {});
      if (!parsed.success) {
        return fail(
          c,
          400,
          "An employer request needs the organization and the worker.",
        );
      }
      const { organization_id, worker_user_id, job_id } = parsed.data;

      let allowed: boolean;
      try {
        allowed = await mayRequestForOrganization(
          admin,
          user.id,
          organization_id,
        );
      } catch (e) {
        return fail(c, 500, (e as Error).message);
      }
      if (!allowed) {
        return fail(
          c,
          403,
          "You cannot request checks for this organization.",
        );
      }

      const { data: worker, error: workerError } = await admin
        .schema("core")
        .from("users")
        .select("id")
        .eq("id", worker_user_id)
        .maybeSingle();
      if (workerError) {
        return fail(c, 500, "Failed to load worker", workerError.message);
      }
      if (!worker) return fail(c, 404, "Worker not found");

      subject = {
        workerId: worker_user_id,
        organizationId: organization_id,
        jobId: job_id ?? null,
      };
    }
    const employerPaid = subject.organizationId !== null;

    const { data: pkg, error: pkgError } = await admin
      .schema("core")
      .from("background_check_packages")
      .select(
        "id, slug, retail_cost_cents, check_type_ids, estimated_completion_days, is_active",
      )
      .eq("id", body.package_id)
      .maybeSingle();
    if (pkgError) {
      return fail(c, 500, "Failed to load package", pkgError.message);
    }
    if (!pkg || !pkg.is_active) return fail(c, 404, "Package not found");

    const priceCents = pkg.retail_cost_cents as number;
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      return fail(c, 400, "This package has no price set.");
    }

    // `consent_ip_address` is inet; a malformed value would fail the insert,
    // and it is the client's claim anyway. Prefer what the edge saw.
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || null;

    // Consent is the WORKER's to give. On an employer request the requester
    // cannot give it for them, so nothing is recorded here and the check
    // starts as `invited`: the worker's own disclosure and consent come next
    // (the FCRA flow, #845). Recording the employer's placeholder as the
    // worker's signature would be a false consent record.
    const workerConsent = employerPaid ? {} : {
      consent_signature: body.consent.consent_signature,
      consent_given_at: body.consent.consent_given_at,
      consent_ip_address: ip,
      consent_user_agent: body.consent.consent_user_agent ??
        c.req.header("user-agent") ?? null,
      disclosure_provided_at: body.consent.disclosure_provided_at,
      summary_of_rights_provided_at: body.consent.summary_of_rights_provided_at,
    };
    const initialStatus = employerPaid ? "invited" : "pending";

    const { data: check, error: insertError } = await admin
      .schema("core")
      .from("background_checks")
      .insert({
        user_id: subject.workerId,
        organization_id: subject.organizationId,
        job_id: subject.jobId,
        requested_by_user_id: user.id,
        initiated_by: employerPaid ? "organization" : "worker",
        package_id: pkg.id,
        check_type_ids: pkg.check_type_ids ?? [],
        tier: body.tier ?? pkg.slug,
        paid_by: employerPaid ? "organization" : "worker",
        status: initialStatus,
        invited_at: employerPaid ? new Date().toISOString() : null,
        status_history: historyWith([], {
          status: initialStatus,
          actor: employerPaid ? "organization" : "worker",
          requested_by_user_id: user.id,
          notes: "Requested; awaiting payment",
        }),
        cost_cents: priceCents,
        base_price_cents: priceCents,
        total_price_cents: priceCents,
        ...workerConsent,
        custom_configuration: body.metadata ? { request: body.metadata } : {},
      })
      .select("id")
      .single();

    if (insertError || !check) {
      return fail(c, 500, "Failed to create check", insertError?.message);
    }

    const discard = async (reason: string) => {
      const { error } = await admin
        .schema("core")
        .from("background_checks")
        .delete()
        .eq("id", check.id)
        .is("paid_at", null);
      if (error) {
        console.error(
          `[background-checks] could not discard unpaid check ${check.id} after ${reason}: ${error.message}`,
        );
      }
    };

    let intent: { id: string; client_secret: string | null; currency?: string };
    try {
      const stripe = await loadStripeClient(admin);
      intent = await stripe.paymentIntents.create({
        amount: priceCents,
        currency: "usd",
        metadata: {
          service_type: "background_check",
          background_check_id: check.id,
          worker_user_id: subject.workerId,
          payer_user_id: user.id,
          organization_id: subject.organizationId ?? "",
          package_id: pkg.id,
        },
        automatic_payment_methods: { enabled: true },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe error";
      console.error(`[background-checks] intent creation failed: ${msg}`);
      await discard("intent failure");
      // 503: nothing was charged, and it is worth retrying once payments are up.
      return fail(
        c,
        503,
        "Payments are not available right now. No payment was taken; please try again.",
        msg,
      );
    }

    if (!intent.client_secret) {
      await discard("missing client secret");
      return fail(c, 500, "Stripe client secret was not returned.");
    }

    const { error: txError } = await admin
      .schema("core")
      .from("payment_transactions")
      .insert({
        user_id: user.id,
        organization_id: subject.organizationId,
        amount_cents: priceCents,
        currency: intent.currency ?? "usd",
        transaction_type: "background_check",
        background_check_id: check.id,
        stripe_payment_intent_id: intent.id,
        metadata: { source: "background_checks_rest", stage: "intent" },
      });
    if (txError) {
      await discard("ledger failure");
      return fail(c, 500, "Failed to record payment intent", txError.message);
    }

    const { error: linkError } = await admin
      .schema("core")
      .from("background_checks")
      .update({ payment_intent_id: intent.id })
      .eq("id", check.id);
    if (linkError) {
      // Not fatal: the ledger row carries background_check_id, which is what
      // settlement and /confirm-payment match on.
      console.error(
        `[background-checks] could not link intent ${intent.id} to ${check.id}: ${linkError.message}`,
      );
    }

    return c.json({
      backgroundCheckId: check.id,
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amountCents: priceCents,
    }, 201);
  },
);

/**
 * POST /v1/background-checks/confirm-payment
 *
 * Marks a check paid. Three witnesses must agree before it does: the intent
 * itself (succeeded, created by /request for THIS check), the ledger row
 * /request wrote (same check, same amount), and the check (the caller's own).
 * Any succeeded intent used to be enough elsewhere in this codebase, and that
 * bought a free ID badge (#1255).
 */
const confirmSchema = z.object({
  background_check_id: z.string().uuid(),
  payment_intent_id: z.string().min(5),
});

app.post(
  "/confirm-payment",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", confirmSchema),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");

    const body = c.req.valid("json");

    let check: Record<string, unknown> | null;
    try {
      // The payer confirms: the worker for their own check, or whoever
      // requested it on an organization's behalf.
      check = await loadOwnCheck(
        admin,
        body.background_check_id,
        user.id,
        "*",
        {
          orRequester: true,
        },
      );
    } catch (e) {
      return fail(c, 500, (e as Error).message);
    }
    if (!check) return fail(c, 404, "Background check not found");

    // Idempotent: a repeat confirm of an already-paid check is a success.
    if (check.paid_at) {
      if (
        check.payment_intent_id &&
        check.payment_intent_id !== body.payment_intent_id
      ) {
        return fail(c, 409, "This check was paid with a different payment.");
      }
      return c.json(check);
    }

    let intent: {
      id: string;
      status: string;
      amount: number;
      metadata?: Record<string, string>;
      created?: number;
    };
    try {
      const stripe = await loadStripeClient(admin);
      intent = await stripe.paymentIntents.retrieve(body.payment_intent_id);
    } catch (e) {
      return fail(c, 503, "Could not reach payments", (e as Error).message);
    }

    if (intent.status !== "succeeded") {
      return fail(
        c,
        400,
        `Payment has not succeeded (current status: ${intent.status}).`,
      );
    }

    const meta = intent.metadata ?? {};
    if (
      meta.service_type !== "background_check" ||
      meta.background_check_id !== check.id
    ) {
      return fail(c, 400, "This payment is not for this background check.");
    }

    const { data: ledger, error: ledgerError } = await admin
      .schema("core")
      .from("payment_transactions")
      .select("transaction_type, background_check_id, amount_cents")
      .eq("stripe_payment_intent_id", intent.id)
      .maybeSingle();
    if (ledgerError) {
      return fail(
        c,
        500,
        "Failed to load the payment record",
        ledgerError.message,
      );
    }
    if (
      ledger?.transaction_type !== "background_check" ||
      ledger.background_check_id !== check.id ||
      ledger.amount_cents !== intent.amount
    ) {
      return fail(
        c,
        400,
        "This payment does not match the background check request.",
      );
    }

    const paidAt = new Date(
      (intent.created ?? Math.floor(Date.now() / 1000)) * 1000,
    ).toISOString();

    const { data: updated, error: updateError } = await admin
      .schema("core")
      .from("background_checks")
      .update({
        paid_at: paidAt,
        payment_intent_id: intent.id,
        status_history: historyWith(check.status_history, {
          status: check.status,
          actor: "worker",
          notes: "Payment confirmed",
        }),
      })
      .eq("id", check.id)
      .is("paid_at", null)
      .select("*")
      .maybeSingle();
    if (updateError) {
      return fail(c, 500, "Failed to record payment", updateError.message);
    }

    // The settlement webhook may have set paid_at between our read and this
    // write; that is the same outcome, so answer with the current row.
    const result = updated ??
      (await loadOwnCheck(admin, check.id as string, user.id).catch(() =>
        null
      ));

    const { error: advanceError } = await admin
      .schema("core")
      .from("payment_transactions")
      .update({ status: "succeeded", succeeded_at: new Date().toISOString() })
      .eq("stripe_payment_intent_id", intent.id)
      .neq("status", "succeeded");
    if (advanceError) {
      console.error(
        `[background-checks] paid but could not advance payment_transactions for ${intent.id}: ${advanceError.message}`,
      );
    }

    return c.json(result ?? check);
  },
);

/**
 * POST /v1/background-checks/documents/upload-url
 *
 * A signed upload URL under `{userId}/{checkId}/`, the folder the bucket's
 * own policy lets this user write. `bucket` and `token` are what
 * `uploadToSignedUrl` needs; `uploadUrl` is the raw URL for callers that PUT.
 */
const uploadUrlSchema = z.object({
  background_check_id: z.string().uuid(),
  document_type: z.string().trim().min(1).max(100),
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.string(),
  file_size: z.number().int().positive(),
});

app.post(
  "/documents/upload-url",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", uploadUrlSchema),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");

    const body = c.req.valid("json");
    if (!ALLOWED_MIME_TYPES.includes(body.mime_type)) {
      return fail(c, 400, "Upload a PDF, JPEG or PNG.");
    }
    if (body.file_size > MAX_DOCUMENT_BYTES) {
      return fail(c, 400, "Files must be 10 MB or smaller.");
    }

    let check: Record<string, unknown> | null;
    try {
      check = await loadOwnCheck(
        admin,
        body.background_check_id,
        user.id,
        "id",
      );
    } catch (e) {
      return fail(c, 500, (e as Error).message);
    }
    if (!check) return fail(c, 404, "Background check not found");

    const safeName = body.file_name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(
      -120,
    );
    const storagePath =
      `${user.id}/${check.id}/${crypto.randomUUID()}-${safeName}`;

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      return fail(c, 500, "Failed to create upload URL", error?.message);
    }

    return c.json({
      uploadUrl: data.signedUrl,
      storagePath: data.path ?? storagePath,
      token: data.token,
      bucket: BUCKET,
      expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000)
        .toISOString(),
    });
  },
);

/**
 * POST /v1/background-checks/documents — record an uploaded file.
 */
const documentSchema = z.object({
  background_check_id: z.string().uuid(),
  storage_path: z.string().min(1).max(500),
  document_type: z.string().trim().min(1).max(100),
  file_name: z.string().trim().min(1).max(255),
  mime_type: z.string(),
  file_size: z.number().int().positive(),
});

app.post(
  "/documents",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", documentSchema),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");

    const body = c.req.valid("json");

    let check: Record<string, unknown> | null;
    try {
      check = await loadOwnCheck(
        admin,
        body.background_check_id,
        user.id,
        "id",
      );
    } catch (e) {
      return fail(c, 500, (e as Error).message);
    }
    if (!check) return fail(c, 404, "Background check not found");

    // The path is the client's claim. Without this, a worker could attach
    // another user's file to their own check and have office staff open it.
    if (!ownsStoragePath(body.storage_path, user.id, check.id as string)) {
      return fail(c, 400, "That file does not belong to this check.");
    }

    const { data, error } = await admin
      .schema("core")
      .from("background_check_documents")
      .insert({
        background_check_id: check.id,
        document_type: body.document_type,
        file_path: body.storage_path,
        file_name: body.file_name,
        file_size: body.file_size,
        mime_type: body.mime_type,
        uploaded_by_user_id: user.id,
      })
      .select("*")
      .single();
    if (error || !data) {
      return fail(c, 500, "Failed to record document", error?.message);
    }

    return c.json(toDocument(data), 201);
  },
);

/**
 * POST /v1/background-checks/disputes
 *
 * A worker may dispute a result (FCRA). Only a finished check has a result,
 * so earlier statuses are refused rather than recorded as disputes of nothing.
 */
const disputeSchema = z.object({
  background_check_id: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
  details: z.string().trim().max(5000).optional(),
  supporting_documents: z.array(z.string().min(1).max(500)).max(10).optional(),
});

app.post(
  "/disputes",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", disputeSchema),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");

    const body = c.req.valid("json");

    let check: Record<string, unknown> | null;
    try {
      check = await loadOwnCheck(
        admin,
        body.background_check_id,
        user.id,
        "id, status, status_history",
      );
    } catch (e) {
      return fail(c, 500, (e as Error).message);
    }
    if (!check) return fail(c, 404, "Background check not found");

    if (!DISPUTABLE_STATUSES.includes(check.status as string)) {
      return fail(
        c,
        409,
        "Only a completed check can be disputed.",
        `This check is ${check.status}.`,
      );
    }

    const documents = body.supporting_documents ?? [];
    if (
      documents.some((p) => !ownsStoragePath(p, user.id, check!.id as string))
    ) {
      return fail(
        c,
        400,
        "A supporting document does not belong to this check.",
      );
    }

    const { data, error } = await admin
      .schema("core")
      .from("background_check_disputes")
      .insert({
        background_check_id: check.id,
        user_id: user.id,
        dispute_reason: body.reason,
        dispute_details: body.details ?? null,
        supporting_documents: documents,
      })
      .select("*")
      .single();
    if (error || !data) {
      return fail(c, 500, "Failed to submit dispute", error?.message);
    }

    // The check moves to `disputed` so the office queue and its metrics see
    // it; the admin's resolve sets the outcome status.
    const { error: statusError } = await admin
      .schema("core")
      .from("background_checks")
      .update({
        status: "disputed",
        status_history: historyWith(check.status_history, {
          status: "disputed",
          actor: "worker",
          notes: body.reason,
          dispute_id: data.id,
          // What resolving the dispute puts back. History alone cannot be
          // trusted for this: a case can reach a completed status without a
          // history entry (seeded or provider-written rows).
          previous_status: check.status,
        }),
      })
      .eq("id", check.id);
    if (statusError) {
      console.error(
        `[background-checks] dispute ${data.id} recorded but check ${check.id} not marked disputed: ${statusError.message}`,
      );
    }

    return c.json(toDispute(data), 201);
  },
);

// ============================================================================
// /:checkId routes
// ============================================================================

/**
 * GET /v1/background-checks/:checkId
 */
app.get(
  "/:checkId",
  requireAuth,
  zValidator("param", z.object({ checkId: z.string().uuid() })),
  async (c) => {
    const supabase = c.get("supabase");
    const user = c.get("user");
    if (!supabase || !user?.id) return fail(c, 401, "Unauthorized");
    const { checkId } = c.req.valid("param");

    const { data, error } = await supabase
      .schema("core")
      .from("background_checks")
      .select("*")
      .eq("id", checkId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return fail(c, 500, "Failed to load check", error.message);
    if (!data) return fail(c, 404, "Background check not found");
    return c.json(data);
  },
);

/**
 * GET /v1/background-checks/:checkId/disputes
 */
app.get(
  "/:checkId/disputes",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("param", z.object({ checkId: z.string().uuid() })),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");
    const { checkId } = c.req.valid("param");

    let check: Record<string, unknown> | null;
    try {
      check = await loadOwnCheck(admin, checkId, user.id, "id");
    } catch (e) {
      return fail(c, 500, (e as Error).message);
    }
    if (!check) return fail(c, 404, "Background check not found");

    const { data, error } = await admin
      .schema("core")
      .from("background_check_disputes")
      .select("*")
      .eq("background_check_id", checkId)
      .order("created_at", { ascending: false });
    if (error) return fail(c, 500, "Failed to load disputes", error.message);

    return c.json((data ?? []).map(toDispute));
  },
);

/**
 * PATCH /v1/background-checks/:checkId/privacy
 *
 * The SDK speaks `privacy_level`; the table has `is_public` (and the
 * employer share list, which the worker's own toggle leaves alone). There is
 * no connections model behind `connections_only`, so it is "not public".
 * This used to write a `privacy_level` column that does not exist.
 */
app.patch(
  "/:checkId/privacy",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("param", z.object({ checkId: z.string().uuid() })),
  zValidator(
    "json",
    z.object({
      privacy_level: z.enum(["public", "connections_only", "private"]),
    }),
  ),
  async (c) => {
    const user = c.get("user");
    const admin = c.get("supabaseAdmin");
    if (!user?.id) return fail(c, 401, "Unauthorized");
    if (!admin) return fail(c, 500, "Admin client not available");
    const { checkId } = c.req.valid("param");
    const { privacy_level } = c.req.valid("json");

    const { data, error } = await admin
      .schema("core")
      .from("background_checks")
      .update({ is_public: privacy_level === "public" })
      .eq("id", checkId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) return fail(c, 500, "Failed to update privacy", error.message);
    if (!data) return fail(c, 404, "Background check not found");
    return c.json(data);
  },
);

export default app;
