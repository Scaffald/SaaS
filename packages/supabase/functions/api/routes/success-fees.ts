/**
 * Success Fees REST API
 * Handles success fee creation, payment confirmation, and status queries.
 * Migrated from tRPC successFeesRouter.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  addSupabaseAdminForUser,
  type ApiEnv,
  requireAuth,
} from "../middleware/auth.ts";
// The shared loader: same Vault key path, plus STRIPE_MOCK_MODE for the REST
// tests (#937) — this file used to carry its own copy without it.
import { loadStripeClient } from "../../_shared/id-verification-api.ts";
import { PIPELINE_ROLES, userHasOrgAccess } from "../lib/application-access.ts";

const FEE_PERCENTAGE = 10;

type SuccessFeeRecord = {
  id: string;
  organization_id: string;
  worker_user_id: string | null;
  job_id: string | null;
  application_id: string | null;
  total_hire_value_cents: number;
  job_duration_days: number | null;
  // 'single' since #1257; the split schedules remain valid for history.
  payment_schedule: "single" | "standard" | "short";
  upfront_percentage: number;
  final_percentage: number;
  upfront_amount_cents: number;
  final_amount_cents: number;
  hire_start_date: string;
  final_payment_due_date: string;
  upfront_payment_intent_id: string | null;
  final_payment_intent_id: string | null;
  status: "pending" | "upfront_paid" | "completed" | "failed" | "cancelled";
  upfront_paid_at: string | null;
  created_at: string;
};

/**
 * Who may read or pay an organisation's hire fees: platform office or
 * super_admin staff, the organisation's owner, or its org `admin` — the same
 * people who can open the hire screen's application in the pipeline
 * (PIPELINE_ROLES). It admitted any role scoped to the organisation, a wider
 * set than the pipeline, and looked that up with `.maybeSingle()`, which
 * errors for someone holding two roles in one organisation (#1312).
 */
// biome-ignore lint/suspicious/noExplicitAny: Supabase client/result typed as any
async function ensureOrganizationAccess(
  supabaseAdmin: any,
  userId: string,
  organizationId: string,
): Promise<void> {
  const { data: roleData, error: roleError } = await supabaseAdmin
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope)")
    .eq("user_id", userId);

  if (roleError) {
    throw new Error(`Failed to load roles: ${roleError.message}`);
  }

  const hasPlatformRole = Boolean(
    roleData?.some(
      // biome-ignore lint/suspicious/noExplicitAny: Supabase query result row
      (a: any) =>
        a.role?.scope === "platform" &&
        ["office", "super_admin"].includes(a.role?.name ?? ""),
    ),
  );
  if (hasPlatformRole) return;

  const { data: organization, error: orgError } = await supabaseAdmin
    .schema("core")
    .from("organizations")
    .select("id, owner_user_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgError) {
    throw new Error(`Failed to load organization: ${orgError.message}`);
  }
  if (!organization) {
    const err = new Error("Organization not found") as Error & {
      status: number;
    };
    err.status = 404;
    throw err;
  }
  const admitted = await userHasOrgAccess(
    supabaseAdmin,
    userId,
    organizationId,
    organization.owner_user_id ?? null,
    { allowedRoles: PIPELINE_ROLES },
  );
  if (!admitted) {
    const err = new Error("You do not have access to this organization") as
      & Error
      & { status: number };
    err.status = 403;
    throw err;
  }
}

/** A full-time year, the same basis the Hire screen has always shown. */
const HOURS_PER_WEEK = 40;
const WEEKS_PER_YEAR = 52;

/**
 * What a hire is worth, from the job — never from the request (#1256).
 *
 * The fee used to be 10% of a `totalHireValueCents` the client sent, so the
 * caller set the price of their own fee. This is the formula the Hire screen
 * displayed: the top of the pay range (or the bottom if that is all there is),
 * and an hourly rate as a full-time year. Null when the job has no pay range.
 */
function hireValueFromJob(job: {
  pay_range_min_cents: number | null;
  pay_range_max_cents: number | null;
  pay_range_type: string | null;
}): number | null {
  const base = job.pay_range_max_cents ?? job.pay_range_min_cents;
  if (!base || base <= 0) return null;
  return job.pay_range_type === "hourly"
    ? Math.round(base * HOURS_PER_WEEK * WEEKS_PER_YEAR)
    : base;
}

/**
 * The whole fee, charged upfront (#1257, Clay 2026-10-17). There is no
 * deferred final payment: the 20/80 and 50/50 splits queued a remainder that
 * nothing ever charged.
 */
function singleChargeSchedule(totalFeeCents: number, hireStartDate: string) {
  return {
    paymentSchedule: "single" as SuccessFeeRecord["payment_schedule"],
    upfrontPercentage: 100,
    finalPercentage: 0,
    upfrontAmountCents: totalFeeCents,
    finalAmountCents: 0,
    finalPaymentDueDate: hireStartDate,
  };
}

function scheduleFromRecord(record: SuccessFeeRecord) {
  return {
    paymentSchedule: record.payment_schedule,
    upfrontPercentage: record.upfront_percentage,
    finalPercentage: record.final_percentage,
    upfrontAmountCents: record.upfront_amount_cents,
    finalAmountCents: record.final_amount_cents,
    finalPaymentDueDate: record.final_payment_due_date,
  };
}

const statusQuerySchema = z.object({
  organizationId: z.string().uuid(),
  applicationId: z.string().uuid(),
  workerUserId: z.string().uuid(),
});

const createSchema = z.object({
  // Accepted for compatibility with older clients and ignored: the server
  // derives the hire value from the job (#1256).
  totalHireValueCents: z.number().int().positive().optional(),
  jobDurationDays: z.number().int().positive(),
  hireStartDate: z.string(),
  organizationId: z.string().uuid(),
  workerUserId: z.string().uuid(),
  jobId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
});

const confirmBodySchema = z.object({
  paymentIntentId: z.string().min(5),
});

const app = new Hono<ApiEnv>();

/**
 * GET /v1/success-fees/status
 * Get success fee status by application. Returns null if no fee exists.
 */
app.get(
  "/status",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("query", statusQuerySchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!user || !supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const { organizationId, applicationId, workerUserId } = c.req.valid(
      "query",
    );

    try {
      await ensureOrganizationAccess(supabaseAdmin, user.id, organizationId);
    } catch (e) {
      // A lookup that failed is a 500, not a refusal (#1312).
      const err = e as Error & { status?: number };
      return c.json(
        { error: err.message },
        (err.status ?? 500) as 403 | 404 | 500,
      );
    }

    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("success_fees")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("application_id", applicationId)
      .eq("worker_user_id", workerUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return c.json(
        { error: `Failed to load success fee: ${error.message}` },
        500,
      );
    }

    if (!data) return c.json(null);

    const record = data as SuccessFeeRecord;
    return c.json({
      successFeeId: record.id,
      status: record.status,
      schedule: scheduleFromRecord(record),
      upfrontPaidAt: record.upfront_paid_at ?? null,
      upfrontPaymentIntentId: record.upfront_payment_intent_id,
      finalPaymentIntentId: record.final_payment_intent_id,
      createdAt: record.created_at,
    });
  },
);

/**
 * POST /v1/success-fees
 * Create or resume a success fee + upfront Stripe payment intent.
 */
app.post(
  "/",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", createSchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!user || !supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const input = c.req.valid("json");

    if (!input.applicationId) {
      return c.json({
        error: "applicationId is required to create a success fee.",
      }, 400);
    }

    try {
      await ensureOrganizationAccess(
        supabaseAdmin,
        user.id,
        input.organizationId,
      );
    } catch (e) {
      // A lookup that failed is a 500, not a refusal (#1312).
      const err = e as Error & { status?: number };
      return c.json(
        { error: err.message },
        (err.status ?? 500) as 403 | 404 | 500,
      );
    }

    // The application, its job and the organization must belong together,
    // and the job — not the request — says what the hire is worth (#1256).
    const { data: application, error: applicationError } = await supabaseAdmin
      .schema("core")
      .from("applications")
      .select(
        "id, user_id, job_id, job:jobs!inner(id, organization_id, pay_range_min_cents, pay_range_max_cents, pay_range_type)",
      )
      .eq("id", input.applicationId)
      .maybeSingle();
    if (applicationError) {
      return c.json({
        error: `Failed to load application: ${applicationError.message}`,
      }, 500);
    }
    const job = application?.job as
      | {
        id: string;
        organization_id: string;
        pay_range_min_cents: number | null;
        pay_range_max_cents: number | null;
        pay_range_type: string | null;
      }
      | undefined;
    if (
      !application || !job ||
      job.organization_id !== input.organizationId ||
      application.user_id !== input.workerUserId ||
      (input.jobId && input.jobId !== job.id)
    ) {
      return c.json({
        error: "This application is not one of your organization's hires.",
      }, 404);
    }
    const hireValueCents = hireValueFromJob(job);
    if (!hireValueCents) {
      return c.json({
        error:
          "The job has no pay range, so the success fee cannot be calculated.",
      }, 400);
    }

    const totalFeeCents = Math.round(hireValueCents * (FEE_PERCENTAGE / 100));
    const schedule = singleChargeSchedule(totalFeeCents, input.hireStartDate);
    const now = new Date().toISOString();

    const { data: latest } = await supabaseAdmin
      .schema("core")
      .from("success_fees")
      .select("*")
      .eq("organization_id", input.organizationId)
      .eq("application_id", input.applicationId)
      .eq("worker_user_id", input.workerUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let successFee: SuccessFeeRecord;
    let calculatedSchedule = schedule;

    if (!latest) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .schema("core")
        .from("success_fees")
        .insert({
          organization_id: input.organizationId,
          worker_user_id: input.workerUserId,
          job_id: job.id,
          application_id: input.applicationId,
          total_hire_value_cents: hireValueCents,
          fee_percentage: FEE_PERCENTAGE,
          total_fee_cents: totalFeeCents,
          job_duration_days: input.jobDurationDays,
          payment_schedule: schedule.paymentSchedule,
          upfront_percentage: schedule.upfrontPercentage,
          final_percentage: schedule.finalPercentage,
          upfront_amount_cents: schedule.upfrontAmountCents,
          final_amount_cents: schedule.finalAmountCents,
          final_payment_due_date: schedule.finalPaymentDueDate,
          hire_start_date: input.hireStartDate,
          hire_confirmed_at: now,
          status: "pending",
        })
        .select("*")
        .maybeSingle();

      if (insertError || !inserted) {
        return c.json(
          {
            error: insertError
              ? `Failed to create success fee: ${insertError.message}`
              : "Failed to create success fee",
          },
          500,
        );
      }

      successFee = inserted as SuccessFeeRecord;
    } else {
      successFee = latest as SuccessFeeRecord;
      calculatedSchedule = scheduleFromRecord(latest as SuccessFeeRecord);
    }

    if (
      successFee.status === "upfront_paid" || successFee.status === "completed"
    ) {
      return c.json({
        successFeeId: successFee.id,
        clientSecret: null,
        paymentIntentId: successFee.upfront_payment_intent_id,
        schedule: calculatedSchedule,
        status: successFee.status,
        upfrontPaidAt: successFee.upfront_paid_at ?? null,
      });
    }

    try {
      const stripe = await loadStripeClient(supabaseAdmin);
      const linkedIntentId = successFee.upfront_payment_intent_id;
      const intent = linkedIntentId
        ? await stripe.paymentIntents.retrieve(linkedIntentId)
        : await stripe.paymentIntents.create({
          amount: calculatedSchedule.upfrontAmountCents,
          currency: "usd",
          metadata: {
            success_fee_id: successFee.id,
            organization_id: successFee.organization_id,
            stage: "upfront",
          },
          automatic_payment_methods: { enabled: true },
        });

      if (!linkedIntentId) {
        const { error: updateError } = await supabaseAdmin
          .schema("core")
          .from("success_fees")
          .update({ upfront_payment_intent_id: intent.id })
          .eq("id", successFee.id);

        if (updateError) {
          return c.json({
            error: `Failed to link payment intent: ${updateError.message}`,
          }, 500);
        }
      }

      // Every intent gets a row before its client_secret is handed out (#948).
      //
      // This used to be a bare `await` gated on whether this call had just
      // created the fee or the intent, which left two holes. The error was
      // discarded, so a
      // failed insert still returned a client_secret and the customer could pay
      // with nothing recorded. And the retrieve branch — a second call for an
      // intent that already exists — skipped the insert entirely, so if the
      // first call's insert had failed, the retry handed out a secret for an
      // intent that still had no row.
      //
      // Unconditional and idempotent instead: `payment_transactions` has a
      // unique index on `stripe_payment_intent_id`
      // (payment_transactions_stripe_payment_intent_id_key), so an upsert that
      // ignores duplicates is a no-op when the row is already there and repairs
      // the gap when it is not.
      const { error: txError } = await supabaseAdmin
        .schema("core")
        .from("payment_transactions")
        .upsert({
          organization_id: successFee.organization_id,
          user_id: user.id ?? null,
          amount_cents: calculatedSchedule.upfrontAmountCents,
          currency: "usd",
          transaction_type: "success_fee_upfront",
          success_fee_id: successFee.id,
          stripe_payment_intent_id: intent.id,
          metadata: { stage: "upfront" },
        }, { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true });

      // Fail rather than return the secret: with no client_secret the intent is
      // never confirmed, so no money moves. Same invariant as id-verification
      // in #949 — there is a row for every charge, not usually a row.
      if (txError) {
        return c.json({
          error: `Failed to record payment intent: ${txError.message}`,
        }, 500);
      }

      return c.json({
        successFeeId: successFee.id,
        clientSecret: intent.client_secret,
        paymentIntentId: intent.id,
        schedule: calculatedSchedule,
        status: successFee.status,
        upfrontPaidAt: successFee.upfront_paid_at ?? null,
      });
    } catch (e) {
      const err = e as Error;
      return c.json(
        { error: err.message || "Failed to create payment intent" },
        500,
      );
    }
  },
);

/**
 * POST /v1/success-fees/:id/confirm-upfront
 * Confirm upfront payment has succeeded and update the success fee status.
 */
app.post(
  "/:id/confirm-upfront",
  requireAuth,
  addSupabaseAdminForUser,
  zValidator("json", confirmBodySchema),
  async (c) => {
    const user = c.get("user");
    const supabaseAdmin = c.get("supabaseAdmin");
    if (!user || !supabaseAdmin) return c.json({ error: "Unauthorized" }, 401);

    const successFeeId = c.req.param("id");
    const { paymentIntentId } = c.req.valid("json");

    const { data: feeData, error: feeError } = await supabaseAdmin
      .schema("core")
      .from("success_fees")
      .select("*")
      .eq("id", successFeeId)
      .maybeSingle();

    if (feeError) {
      return c.json({
        error: `Failed to load success fee: ${feeError.message}`,
      }, 500);
    }
    if (!feeData) return c.json({ error: "Success fee not found" }, 404);

    const successFee = feeData as SuccessFeeRecord;

    try {
      await ensureOrganizationAccess(
        supabaseAdmin,
        user.id,
        successFee.organization_id,
      );
    } catch (e) {
      // A lookup that failed is a 500, not a refusal (#1312).
      const err = e as Error & { status?: number };
      return c.json(
        { error: err.message },
        (err.status ?? 500) as 403 | 404 | 500,
      );
    }

    if (!successFee.upfront_payment_intent_id) {
      return c.json({
        error: "Success fee does not have an upfront payment intent.",
      }, 400);
    }

    if (successFee.upfront_payment_intent_id !== paymentIntentId) {
      return c.json({
        error: "Provided payment intent does not match the success fee.",
      }, 400);
    }

    try {
      const stripe = await loadStripeClient(supabaseAdmin);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.status !== "succeeded") {
        return c.json({ error: "Payment has not succeeded yet." }, 400);
      }

      // Nothing is deferred any more (#1257): a fee with no final amount is
      // complete once this payment lands. Guarded on a payable status, as
      // settlement is, so a confirm cannot walk a completed or cancelled fee.
      const { error: updateError } = await supabaseAdmin
        .schema("core")
        .from("success_fees")
        .update({
          upfront_paid_at: new Date(intent.created * 1000).toISOString(),
          status: successFee.final_amount_cents === 0
            ? "completed"
            : "upfront_paid",
        })
        .eq("id", successFee.id)
        .in("status", ["pending", "failed"]);

      if (updateError) {
        return c.json({
          error: `Failed to update success fee: ${updateError.message}`,
        }, 500);
      }

      const { error: txUpdateError } = await supabaseAdmin
        .schema("core")
        .from("payment_transactions")
        .update({
          status: "succeeded",
          succeeded_at: new Date(intent.created * 1000).toISOString(),
          metadata: {
            last_stripe_event_id: intent.latest_charge ?? null,
            last_stripe_event_type: "manual_confirmation",
          },
        })
        .eq("stripe_payment_intent_id", paymentIntentId);

      // Not fatal, but no longer silent (#948). The fee is already marked
      // upfront_paid above and the customer has paid, so failing the request
      // here would be worse than a ledger row that lags — the webhook or a
      // reconciliation sweep can still settle it. This was a bare `await`,
      // so a failure returned 200 with the ledger quietly disagreeing with
      // success_fees about whether the money arrived.
      if (txUpdateError) {
        console.error(
          `[success-fees] upfront paid but could not advance payment_transactions for ${paymentIntentId}: ${txUpdateError.message}`,
        );
      }

      // Create hire agreement (non-fatal if it fails)
      try {
        const { data: agreementTextData } = await supabaseAdmin
          .schema("core")
          .rpc("get_default_hire_agreement_text");

        const agreementText = agreementTextData ??
          "PLACEHOLDER: Legal Agreement Text";

        await supabaseAdmin
          .schema("core")
          .from("hire_agreements")
          .insert({
            organization_id: successFee.organization_id,
            worker_user_id: successFee.worker_user_id ?? null,
            application_id: successFee.application_id ?? null,
            success_fee_id: successFee.id,
            agreement_text: agreementText,
            agreement_version: "1.0",
            agreed_by_user_id: user.id ?? null,
            terms_accepted: true,
            anti_circumvention_accepted: true,
          });
      } catch (agreementError) {
        console.error("Failed to create hire agreement:", agreementError);
      }

      return c.json({ ok: true });
    } catch (e) {
      const err = e as Error;
      return c.json({ error: err.message || "Failed to confirm payment" }, 500);
    }
  },
);

export default app;
