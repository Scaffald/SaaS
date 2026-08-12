/**
 * Payments REST Routes
 *
 * Analytics, transactions, payment methods, credits, receipts.
 */

import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const paymentsRouter = new Hono();

// Pinned deliberately: this integration is written against the 2025-11-17
// response shapes. stripe@20.4.1 types `apiVersion` as `LatestApiVersion`
// (2026-02-25.clover), so pinning any earlier version is a type error even
// though the Stripe API supports it — hence the cast. Moving the runtime
// version is a behavioural change against a live payment provider and belongs
// with the SDK upgrade in #454, not with a build fix.
const STRIPE_API_VERSION = "2025-11-17.clover" as Stripe.LatestApiVersion;
let StripeClass: typeof import("stripe").default | null = null;

async function getStripeClass(): Promise<typeof import("stripe").default> {
  if (!StripeClass) {
    const stripeModule = await import("stripe");
    StripeClass = stripeModule.default;
  }
  return StripeClass;
}

function getServiceClient() {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key);
}

// biome-ignore lint/suspicious/noExplicitAny: Supabase client typed as any
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

// biome-ignore lint/suspicious/noExplicitAny: Supabase client typed as any
async function getOrCreateStripeCustomer(
  supabaseAdmin: any,
  stripe: Stripe,
  organizationId: string,
): Promise<string> {
  const { data: org, error } = await supabaseAdmin
    .schema("core")
    .from("organizations")
    .select("id,name,stripe_customer_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !org) {
    throw new Error(error?.message ?? "Organization not found");
  }
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const customer = await stripe.customers.create({
    name: org.name ?? undefined,
    metadata: { organization_id: organizationId },
  });

  await supabaseAdmin
    .schema("core")
    .from("organizations")
    .update({ stripe_customer_id: customer.id })
    .eq("id", organizationId);

  return customer.id;
}

// ============================================================
// Analytics
// ============================================================

/**
 * GET /v1/payments/analytics
 * Admin payment analytics (KPIs, breakdowns, failed queue).
 */
paymentsRouter.get("/analytics", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabaseAdmin = getServiceClient();
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const { data: transactions, error } = await supabaseAdmin
    .schema("core")
    .from("payment_transactions")
    .select("*")
    .gte("created_at", startDate.toISOString());

  if (error) {
    return c.json({ error: `Failed to load analytics: ${error.message}` }, 500);
  }

  const all = transactions ?? [];
  const totalRevenue = all.filter((t: Record<string, unknown>) =>
    t.status === "succeeded"
  )
    .reduce(
      (s: number, t: Record<string, unknown>) =>
        s + (Number(t.amount_cents) ?? 0),
      0,
    );
  const totalTransactions = all.length;
  const succeededTransactions = all.filter((t: Record<string, unknown>) =>
    t.status === "succeeded"
  ).length;
  const failedTransactions =
    all.filter((t: Record<string, unknown>) => t.status === "failed").length;
  const pendingTransactions =
    all.filter((t: Record<string, unknown>) => t.status === "pending").length;
  const successRate = totalTransactions > 0
    ? (succeededTransactions / totalTransactions) * 100
    : 0;

  const byType = all.reduce(
    (
      acc: Record<
        string,
        { count: number; revenue: number; succeeded: number; failed: number }
      >,
      t: Record<string, unknown>,
    ) => {
      const type = (t.transaction_type as string) ?? "unknown";
      if (!acc[type]) {
        acc[type] = { count: 0, revenue: 0, succeeded: 0, failed: 0 };
      }
      acc[type].count += 1;
      if (t.status === "succeeded") {
        acc[type].revenue += Number(t.amount_cents) ?? 0;
        acc[type].succeeded += 1;
      }
      if (t.status === "failed") {
        acc[type].failed += 1;
      }
      return acc;
    },
    {},
  );

  const byStatus = all.reduce(
    (acc: Record<string, number>, t: Record<string, unknown>) => {
      const status = (t.status as string) ?? "unknown";
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const dailyRevenue = all
    .filter((t: Record<string, unknown>) => t.status === "succeeded")
    .reduce((acc: Record<string, number>, t: Record<string, unknown>) => {
      const date =
        (new Date(t.created_at as string).toISOString().split("T")[0]) ?? "";
      acc[date] = (acc[date] ?? 0) + (Number(t.amount_cents) ?? 0);
      return acc;
    }, {});

  const failedQueue = all
    .filter((t: Record<string, unknown>) => t.status === "failed")
    .map((t: Record<string, unknown>) => ({
      id: t.id,
      transactionType: t.transaction_type,
      amountCents: t.amount_cents,
      failureReason: t.failure_reason,
      createdAt: t.created_at,
      failedAt: t.failed_at,
      organizationId: t.organization_id,
      userId: t.user_id,
    }))
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
      new Date((b.failedAt ?? b.createdAt) as string).getTime() -
      new Date((a.failedAt ?? a.createdAt) as string).getTime()
    );

  return c.json({
    kpis: {
      totalRevenue,
      totalTransactions,
      succeededTransactions,
      failedTransactions,
      pendingTransactions,
      successRate: Math.round(successRate * 100) / 100,
    },
    breakdowns: { byType, byStatus },
    timeSeries: { dailyRevenue },
    failedQueue,
  });
});

// ============================================================
// Transactions
// ============================================================

/**
 * GET /v1/payments/transactions
 * Admin list of transactions with optional filters.
 */
paymentsRouter.get("/transactions", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabaseAdmin = getServiceClient();
  const limit = parseInt(c.req.query("limit") ?? "100", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const status = c.req.query("status");
  const transactionType = c.req.query("transactionType");
  const organizationId = c.req.query("organizationId");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  let query = supabaseAdmin
    .schema("core")
    .from("payment_transactions")
    .select(
      "*,organization:organizations(id,name),user:profiles(id,display_name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (transactionType) query = query.eq("transaction_type", transactionType);
  if (organizationId) query = query.eq("organization_id", organizationId);
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);

  const { data, error, count } = await query;
  if (error) {
    return c.json(
      { error: `Failed to load transactions: ${error.message}` },
      500,
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase query result row
  const items = (data ?? []).map((row: any) => ({
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization?.name ?? null,
    userId: row.user_id,
    userName: row.user?.display_name ?? null,
    amountCents: row.amount_cents,
    currency: row.currency,
    transactionType: row.transaction_type,
    status: row.status,
    failureReason: row.failure_reason,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    succeededAt: row.succeeded_at,
    failedAt: row.failed_at,
    refundedAt: row.refunded_at,
    metadata: row.metadata ?? {},
  }));

  return c.json({ items, totalCount: count ?? 0 });
});

/**
 * GET /v1/payments/transactions/export
 * Export transactions as CSV or JSON.
 */
paymentsRouter.get("/transactions/export", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const supabaseAdmin = getServiceClient();
  const format = c.req.query("format") ?? "csv";
  const organizationId = c.req.query("organizationId");
  const status = c.req.query("status");
  const transactionType = c.req.query("transactionType");
  const startDate = c.req.query("startDate");
  const endDate = c.req.query("endDate");

  let query = supabaseAdmin
    .schema("core")
    .from("payment_transactions")
    .select(
      "*,organization:organizations(id,name),user:profiles(id,display_name)",
    )
    .order("created_at", { ascending: false });

  if (organizationId) query = query.eq("organization_id", organizationId);
  if (status) query = query.eq("status", status);
  if (transactionType) query = query.eq("transaction_type", transactionType);
  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);

  const { data, error } = await query;
  if (error) {
    return c.json(
      { error: `Failed to export transactions: ${error.message}` },
      500,
    );
  }

  // biome-ignore lint/suspicious/noExplicitAny: Supabase query result row
  const transactions = (data ?? []).map((row: any) => ({
    id: row.id,
    organizationName: row.organization?.name ?? "N/A",
    userName: row.user?.display_name ?? "N/A",
    amountCents: row.amount_cents,
    currency: row.currency,
    transactionType: row.transaction_type,
    status: row.status,
    failureReason: row.failure_reason ?? "",
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
    succeededAt: row.succeeded_at ?? "",
    failedAt: row.failed_at ?? "",
    refundedAt: row.refunded_at ?? "",
  }));

  if (format === "json") {
    return c.json({
      format: "json",
      data: JSON.stringify(transactions, null, 2),
      contentType: "application/json",
    });
  }

  if (transactions.length === 0) {
    return c.json({ format: "csv", data: "", contentType: "text/csv" });
  }

  const headers = [
    "ID",
    "Organization",
    "User",
    "Amount (cents)",
    "Currency",
    "Type",
    "Status",
    "Failure Reason",
    "Stripe Payment Intent ID",
    "Created At",
    "Succeeded At",
    "Failed At",
    "Refunded At",
  ];
  const csvRows = transactions.map((t: Record<string, unknown>) =>
    [
      t.id,
      t.organizationName,
      t.userName,
      String(t.amountCents),
      t.currency,
      t.transactionType,
      t.status,
      t.failureReason,
      t.stripePaymentIntentId,
      t.createdAt,
      t.succeededAt,
      t.failedAt,
      t.refundedAt,
    ]
      .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...csvRows].join("\n");
  return c.json({ format: "csv", data: csv, contentType: "text/csv" });
});

// ============================================================
// Payment Methods
// ============================================================

/**
 * GET /v1/payments/payment-methods
 * Get the current payment method for an organization.
 * Query: organizationId
 */
paymentsRouter.get("/payment-methods", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({ error: "organizationId is required" }, 400);
  }

  const supabaseAdmin = getServiceClient();
  const { data: method, error } = await supabaseAdmin
    .schema("core")
    .from("organization_payment_methods")
    .select("*")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return c.json(
      { error: `Failed to load payment method: ${error.message}` },
      500,
    );
  }
  if (!method) return c.json(null);

  return c.json({
    id: method.id,
    brand: method.brand,
    last4: method.last4,
    expMonth: method.exp_month,
    expYear: method.exp_year,
    billingName: method.billing_name,
    billingEmail: method.billing_email,
    isDefault: method.is_default,
    createdAt: method.created_at,
  });
});

/**
 * DELETE /v1/payments/payment-methods/:id
 * Soft-delete a payment method and detach from Stripe.
 */
paymentsRouter.delete("/payment-methods/:id", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const methodId = c.req.param("id");
  const supabaseAdmin = getServiceClient();

  const { data: method, error: fetchError } = await supabaseAdmin
    .schema("core")
    .from("organization_payment_methods")
    .select("organization_id,stripe_payment_method_id")
    .eq("id", methodId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError) {
    return c.json({
      error: `Failed to load payment method: ${fetchError.message}`,
    }, 500);
  }
  if (!method) return c.json({ error: "Payment method not found" }, 404);

  // Detach from Stripe (best effort)
  try {
    const stripe = await loadStripeClient(supabaseAdmin);
    await stripe.paymentMethods.detach(method.stripe_payment_method_id);
  } catch (e) {
    console.warn(`Failed to detach payment method from Stripe: ${e}`);
  }

  const { error: deleteError } = await supabaseAdmin
    .schema("core")
    .from("organization_payment_methods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", methodId);

  if (deleteError) {
    return c.json({
      error: `Failed to delete payment method: ${deleteError.message}`,
    }, 500);
  }

  await supabaseAdmin
    .schema("core")
    .from("organizations")
    .update({ default_payment_method_id: null })
    .eq("default_payment_method_id", methodId);

  return c.json({ ok: true });
});

/**
 * POST /v1/payments/setup-intent
 * Create a Stripe SetupIntent for adding a payment method.
 * Body: { organizationId }
 */
paymentsRouter.post("/setup-intent", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { organizationId } = body;
  if (!organizationId) {
    return c.json({ error: "organizationId is required" }, 400);
  }

  const supabaseAdmin = getServiceClient();

  try {
    const stripe = await loadStripeClient(supabaseAdmin);
    const customerId = await getOrCreateStripeCustomer(
      supabaseAdmin,
      stripe,
      organizationId,
    );

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
    });

    return c.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (e) {
    return c.json({
      error: e instanceof Error ? e.message : "Failed to create setup intent",
    }, 500);
  }
});

/**
 * POST /v1/payments/save-payment-method
 * Save a confirmed Stripe payment method.
 * Body: { organizationId, paymentMethodId }
 */
paymentsRouter.post("/save-payment-method", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { organizationId, paymentMethodId } = body;
  if (!organizationId || !paymentMethodId) {
    return c.json(
      { error: "organizationId and paymentMethodId are required" },
      400,
    );
  }

  const supabaseAdmin = getServiceClient();

  try {
    const stripe = await loadStripeClient(supabaseAdmin);
    const customerId = await getOrCreateStripeCustomer(
      supabaseAdmin,
      stripe,
      organizationId,
    );
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Soft delete existing payment method
    await supabaseAdmin
      .schema("core")
      .from("organization_payment_methods")
      .update({ deleted_at: new Date().toISOString() })
      .eq("organization_id", organizationId)
      .is("deleted_at", null);

    const card = paymentMethod.card;
    const { data: saved, error: insertError } = await supabaseAdmin
      .schema("core")
      .from("organization_payment_methods")
      .insert({
        organization_id: organizationId,
        stripe_customer_id: customerId,
        stripe_payment_method_id: paymentMethod.id,
        brand: card?.brand ?? null,
        last4: card?.last4 ?? null,
        exp_month: card?.exp_month ?? null,
        exp_year: card?.exp_year ?? null,
        billing_name: paymentMethod.billing_details?.name ?? null,
        billing_email: paymentMethod.billing_details?.email ?? null,
        billing_phone: paymentMethod.billing_details?.phone ?? null,
        billing_country: paymentMethod.billing_details?.address?.country ??
          null,
        is_default: true,
        created_by: user.id,
        metadata: paymentMethod.metadata ?? {},
      })
      .select("*")
      .maybeSingle();

    if (insertError || !saved) {
      return c.json({
        error: insertError?.message ?? "Failed to create payment method record",
      }, 500);
    }

    await supabaseAdmin
      .schema("core")
      .from("organizations")
      .update({ default_payment_method_id: saved.id })
      .eq("id", organizationId);

    return c.json({
      id: saved.id,
      brand: saved.brand,
      last4: saved.last4,
      expMonth: saved.exp_month,
      expYear: saved.exp_year,
      isDefault: saved.is_default,
    });
  } catch (e) {
    return c.json({
      error: e instanceof Error ? e.message : "Failed to save payment method",
    }, 500);
  }
});

// ============================================================
// Receipts
// ============================================================

/**
 * GET /v1/payments/receipts/:transactionId
 * Generate a receipt for a transaction.
 */
paymentsRouter.get("/receipts/:transactionId", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const transactionId = c.req.param("transactionId");
  const supabaseAdmin = getServiceClient();

  const { data: transaction, error } = await supabaseAdmin
    .schema("core")
    .from("payment_transactions")
    .select(
      "*,organization:organizations(id,name,address),user:profiles(id,display_name)",
    )
    .eq("id", transactionId)
    .maybeSingle();

  if (error) {
    return c.json(
      { error: `Failed to load transaction: ${error.message}` },
      500,
    );
  }
  if (!transaction) return c.json({ error: "Transaction not found" }, 404);

  const formatCurrency = (cents: number, currency: string): string =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);

  const formatTransactionType = (type: string): string =>
    type.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return c.json({
    transactionId: transaction.id,
    receiptNumber: `RCP-${transaction.id.slice(0, 8).toUpperCase()}`,
    date: transaction.succeeded_at ?? transaction.created_at,
    organizationName: transaction.organization?.name ?? "N/A",
    organizationAddress: transaction.organization?.address ?? null,
    amount: formatCurrency(transaction.amount_cents, transaction.currency),
    amountCents: transaction.amount_cents,
    currency: transaction.currency,
    transactionType: formatTransactionType(transaction.transaction_type),
    status: transaction.status,
    stripePaymentIntentId: transaction.stripe_payment_intent_id,
    metadata: transaction.metadata ?? {},
  });
});

// ============================================================
// Account Credits
// ============================================================

/**
 * GET /v1/payments/credits
 * Get account credits balance for an organization.
 * Query: organizationId
 */
paymentsRouter.get("/credits", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({ error: "organizationId is required" }, 400);
  }

  const supabaseAdmin = getServiceClient();
  const { data: credits, error } = await supabaseAdmin
    .schema("core")
    .from("account_credits")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    return c.json(
      { error: `Failed to load account credits: ${error.message}` },
      500,
    );
  }

  if (!credits) {
    return c.json({
      id: null,
      organizationId,
      balanceCents: 0,
      currency: "usd",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return c.json({
    id: credits.id,
    organizationId: credits.organization_id,
    balanceCents: credits.balance_cents,
    currency: credits.currency,
    createdAt: credits.created_at,
    updatedAt: credits.updated_at,
  });
});

/**
 * POST /v1/payments/credits/deposit
 * Deposit credits to an organization account via Stripe.
 * Body: { organizationId, amountCents, paymentMethodId? }
 */
paymentsRouter.post("/credits/deposit", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const { organizationId, amountCents, paymentMethodId } = body;
  if (!organizationId || !amountCents) {
    return c.json(
      { error: "organizationId and amountCents are required" },
      400,
    );
  }

  const supabaseAdmin = getServiceClient();

  try {
    const stripe = await loadStripeClient(supabaseAdmin);
    const customerId = await getOrCreateStripeCustomer(
      supabaseAdmin,
      stripe,
      organizationId,
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: Boolean(paymentMethodId),
      description: `Account credit deposit - ${amountCents / 100} USD`,
      metadata: {
        organization_id: organizationId,
        transaction_type: "credit_deposit",
      },
    });

    const { data: transaction, error: txError } = await supabaseAdmin
      .schema("core")
      .from("payment_transactions")
      .insert({
        organization_id: organizationId,
        user_id: user.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount_cents: amountCents,
        currency: "usd",
        transaction_type: "credit_deposit",
        status: paymentIntent.status === "succeeded" ? "succeeded" : "pending",
        succeeded_at: paymentIntent.status === "succeeded"
          ? new Date().toISOString()
          : null,
      })
      .select("id,status,stripe_payment_intent_id")
      .single();

    if (txError || !transaction) {
      return c.json({
        error: txError?.message ?? "Failed to record transaction",
      }, 500);
    }

    return c.json({
      transactionId: transaction.id,
      status: transaction.status,
      clientSecret: paymentIntent.client_secret,
      stripePaymentIntentId: paymentIntent.id,
    }, 201);
  } catch (e) {
    return c.json({
      error: e instanceof Error ? e.message : "Failed to deposit credits",
    }, 500);
  }
});

/**
 * GET /v1/payments/credits/ledger
 * Get credit ledger entries for an organization.
 * Query: organizationId, limit?, offset?, transactionType?
 */
paymentsRouter.get("/credits/ledger", async (c) => {
  const user = c.get("user");
  if (!user?.id) return c.json({ error: "Unauthorized" }, 401);

  const organizationId = c.req.query("organizationId");
  if (!organizationId) {
    return c.json({ error: "organizationId is required" }, 400);
  }

  const supabaseAdmin = getServiceClient();
  const limit = parseInt(c.req.query("limit") ?? "50", 10);
  const offset = parseInt(c.req.query("offset") ?? "0", 10);
  const transactionType = c.req.query("transactionType");

  let query = supabaseAdmin
    .schema("core")
    .from("credit_ledger")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (transactionType) query = query.eq("transaction_type", transactionType);

  const { data, error, count } = await query;
  if (error) {
    return c.json(
      { error: `Failed to load credit ledger: ${error.message}` },
      500,
    );
  }

  const items = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    accountCreditId: row.account_credit_id,
    organizationId: row.organization_id,
    amountCents: row.amount_cents,
    currency: row.currency,
    transactionType: row.transaction_type,
    direction: row.direction,
    description: row.description,
    paymentTransactionId: row.payment_transaction_id,
    successFeeId: row.success_fee_id,
    backgroundCheckId: row.background_check_id,
    idVerificationId: row.id_verification_id,
    metadata: row.metadata ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));

  return c.json({ items, totalCount: count ?? 0 });
});

export default paymentsRouter;
