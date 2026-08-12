/**
 * Success Fees REST API
 * Handles success fee creation, payment confirmation, and status queries.
 * Migrated from tRPC successFeesRouter.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { addSupabaseAdminForUser, requireAuth } from "../middleware/auth.ts";
import type Stripe from "stripe";

// Pinned deliberately: this integration is written against the 2025-11-17
// response shapes. stripe@20.4.1 types `apiVersion` as `LatestApiVersion`
// (2026-02-25.clover), so pinning any earlier version is a type error even
// though the Stripe API supports it — hence the cast. Moving the runtime
// version is a behavioural change against a live payment provider and belongs
// with the SDK upgrade in #454, not with a build fix.
const STRIPE_API_VERSION = "2025-11-17.clover" as Stripe.LatestApiVersion;
const FEE_PERCENTAGE = 10;

let StripeClass: typeof import("stripe").default | null = null;

async function getStripeClass(): Promise<typeof import("stripe").default> {
  if (!StripeClass) {
    const stripeModule = await import("stripe");
    StripeClass = stripeModule.default;
  }
  return StripeClass;
}

type SuccessFeeRecord = {
  id: string;
  organization_id: string;
  worker_user_id: string | null;
  job_id: string | null;
  application_id: string | null;
  total_hire_value_cents: number;
  job_duration_days: number | null;
  payment_schedule: "standard" | "short";
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

// biome-ignore lint/suspicious/noExplicitAny: Supabase client/result typed as any
async function loadStripeClient(supabaseAdmin: any): Promise<Stripe> {
  const { data: settings, error } = await supabaseAdmin
    .schema("core")
    .from("stripe_settings")
    .select("api_key_secret_id")
    .eq("settings_name", "stripe")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load Stripe settings: ${error.message}`);
  }
  if (!settings?.api_key_secret_id) {
    throw new Error("Stripe API key is not configured.");
  }

  const { data: secretValue, error: secretError } = await supabaseAdmin
    .schema("core")
    .rpc("get_secret_value", { p_secret_id: settings.api_key_secret_id });

  if (secretError || !secretValue) {
    throw new Error(
      secretError
        ? `Failed to load Stripe secret: ${secretError.message}`
        : "Stripe API secret unavailable.",
    );
  }

  const Stripe = await getStripeClass();
  return new Stripe(secretValue, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  });
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase client/result typed as any
async function ensureOrganizationAccess(
  supabaseAdmin: any,
  userId: string,
  organizationId: string,
): Promise<void> {
  const { data: roleData } = await supabaseAdmin
    .schema("core")
    .from("role_assignments")
    .select("role:roles(name, scope)")
    .eq("user_id", userId);

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
  if (organization.owner_user_id === userId) return;

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .schema("core")
    .from("role_assignments")
    .select("scope_org_id")
    .eq("user_id", userId)
    .eq("scope_org_id", organizationId)
    .maybeSingle();

  if (assignmentError) {
    throw new Error(
      `Failed to verify organization access: ${assignmentError.message}`,
    );
  }
  if (!assignment) {
    const err = new Error("You do not have access to this organization") as
      & Error
      & { status: number };
    err.status = 403;
    throw err;
  }
}

function determinePaymentSchedule(
  totalFeeCents: number,
  jobDurationDays: number,
  hireStartDate: string,
) {
  const useStandard = jobDurationDays >= 30;
  const paymentSchedule: "standard" | "short" = useStandard
    ? "standard"
    : "short";
  const upfrontPercentage = useStandard ? 20 : 50;
  const finalPercentage = 100 - upfrontPercentage;
  const upfrontAmountCents = Math.round(
    totalFeeCents * (upfrontPercentage / 100),
  );
  const finalAmountCents = Math.max(totalFeeCents - upfrontAmountCents, 0);
  const start = new Date(hireStartDate);
  const offset = paymentSchedule === "standard"
    ? 30
    : Math.max(jobDurationDays, 1);
  const due = new Date(start);
  due.setDate(due.getDate() + offset);
  const finalPaymentDueDate = due.toISOString().split("T")[0] ?? "";
  return {
    paymentSchedule,
    upfrontPercentage,
    finalPercentage,
    upfrontAmountCents,
    finalAmountCents,
    finalPaymentDueDate,
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
  totalHireValueCents: z.number().int().positive(),
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

const app = new Hono();

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
      const err = e as Error & { status?: number };
      return c.json({ error: err.message }, (err.status ?? 403) as 403 | 404);
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
      const err = e as Error & { status?: number };
      return c.json({ error: err.message }, (err.status ?? 403) as 403 | 404);
    }

    const totalFeeCents = Math.round(
      input.totalHireValueCents * (FEE_PERCENTAGE / 100),
    );
    const schedule = determinePaymentSchedule(
      totalFeeCents,
      input.jobDurationDays,
      input.hireStartDate,
    );
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
    let createdNewSuccessFee = false;

    if (!latest) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .schema("core")
        .from("success_fees")
        .insert({
          organization_id: input.organizationId,
          worker_user_id: input.workerUserId,
          job_id: input.jobId ?? null,
          application_id: input.applicationId,
          total_hire_value_cents: input.totalHireValueCents,
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
      createdNewSuccessFee = true;
    } else {
      successFee = latest as SuccessFeeRecord;
      calculatedSchedule = scheduleFromRecord(latest as SuccessFeeRecord);
    }

    if (successFee.status === "upfront_paid") {
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
      let intent: Stripe.PaymentIntent;
      let createdNewIntent = false;

      if (successFee.upfront_payment_intent_id) {
        intent = await stripe.paymentIntents.retrieve(
          successFee.upfront_payment_intent_id,
        );
      } else {
        intent = await stripe.paymentIntents.create({
          amount: calculatedSchedule.upfrontAmountCents,
          currency: "usd",
          metadata: {
            success_fee_id: successFee.id,
            organization_id: successFee.organization_id,
            stage: "upfront",
          },
          automatic_payment_methods: { enabled: true },
        });

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

        createdNewIntent = true;
      }

      if (createdNewSuccessFee || createdNewIntent) {
        await supabaseAdmin
          .schema("core")
          .from("payment_transactions")
          .insert({
            organization_id: successFee.organization_id,
            user_id: user.id ?? null,
            amount_cents: calculatedSchedule.upfrontAmountCents,
            currency: "usd",
            transaction_type: "success_fee_upfront",
            success_fee_id: successFee.id,
            stripe_payment_intent_id: intent.id,
            metadata: { stage: "upfront" },
          });
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
      const err = e as Error & { status?: number };
      return c.json({ error: err.message }, (err.status ?? 403) as 403 | 404);
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

      const { error: updateError } = await supabaseAdmin
        .schema("core")
        .from("success_fees")
        .update({
          upfront_paid_at: new Date(intent.created * 1000).toISOString(),
          status: "upfront_paid",
        })
        .eq("id", successFee.id);

      if (updateError) {
        return c.json({
          error: `Failed to update success fee: ${updateError.message}`,
        }, 500);
      }

      await supabaseAdmin
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
