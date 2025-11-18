import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { officeProcedure, protectedProcedure, t } from "../middleware.ts";

export const paymentsRouter = t.router({
  /**
   * Expose publishable Stripe configuration to authenticated clients.
   * This allows Stripe.js to initialize without revealing secrets.
   */
  getStripeConfig: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx;

    const { data, error } = await supabase
      .schema("core")
      .from("stripe_settings")
      .select("publishable_key, test_mode")
      .eq("settings_name", "stripe")
      .maybeSingle();

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to load Stripe configuration: ${error.message}`,
      });
    }

    if (!data?.publishable_key) {
      throw new TRPCError({
        code: "FAILED_PRECONDITION",
        message: "Stripe publishable key is not configured.",
      });
    }

    return {
      publishableKey: data.publishable_key,
      mode: data.test_mode ? "test" : "live",
      testMode: data.test_mode ?? true,
    };
  }),

  /**
   * Admin: List service pricing rows
   */
  adminListPricing: officeProcedure
    .input(
      z
        .object({
          serviceType: z
            .enum(["background_check", "id_verification"])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      let query = supabaseAdmin
        .schema("core")
        .from("service_pricing")
        .select("*")
        .order("service_type", { ascending: true })
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (input?.serviceType) {
        query = query.eq("service_type", input.serviceType);
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load service pricing: ${error.message}`,
        });
      }

      return (data ?? []).map((row) => ({
        id: row.id,
        serviceType: row.service_type,
        tier: row.tier,
        name: row.name,
        description: row.description,
        priceCents: row.price_cents,
        isActive: row.is_active,
        displayOrder: row.display_order,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }),

  /**
   * Admin: Create or update service pricing row
   */
  adminUpsertPricing: officeProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        serviceType: z.enum(["background_check", "id_verification"]),
        tier: z.string().nullable().optional(),
        name: z.string().min(1).max(200),
        description: z.string().nullable().optional(),
        priceCents: z.number().int().nonnegative(),
        isActive: z.boolean().default(true),
        displayOrder: z.number().int().default(0),
        metadata: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      const payload = {
        service_type: input.serviceType,
        tier: input.tier ?? null,
        name: input.name,
        description: input.description ?? null,
        price_cents: input.priceCents,
        is_active: input.isActive,
        display_order: input.displayOrder,
        metadata: input.metadata,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (input.id) {
        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("service_pricing")
          .update(payload)
          .eq("id", input.id)
          .select("*")
          .maybeSingle();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update service pricing: ${error.message}`,
          });
        }

        if (!data) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Service pricing row not found",
          });
        }

        result = data;
      } else {
        const { data, error } = await supabaseAdmin
          .schema("core")
          .from("service_pricing")
          .insert({
            ...payload,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .maybeSingle();

        if (error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to create service pricing: ${error.message}`,
          });
        }

        if (!data) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create service pricing row",
          });
        }

        result = data;
      }

      return {
        id: result.id,
        serviceType: result.service_type,
        tier: result.tier,
        name: result.name,
        description: result.description,
        priceCents: result.price_cents,
        isActive: result.is_active,
        displayOrder: result.display_order,
        metadata: result.metadata ?? {},
        createdAt: result.created_at,
        updatedAt: result.updated_at,
      };
    }),

  /**
   * Admin: Delete service pricing row
   */
  adminDeletePricing: officeProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      const { error } = await supabaseAdmin
        .schema("core")
        .from("service_pricing")
        .delete()
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete service pricing: ${error.message}`,
        });
      }

      return { ok: true };
    }),

  /**
   * Admin: Set service pricing active/inactive
   */
  adminSetPricingActive: officeProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        isActive: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      const { error } = await supabaseAdmin
        .schema("core")
        .from("service_pricing")
        .update({
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update service pricing status: ${error.message}`,
        });
      }

      return { ok: true };
    }),

  /**
   * Admin: Get payment analytics and KPIs
   */
  adminGetAnalytics: officeProcedure
    .input(
      z
        .object({
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
          organizationId: z.string().uuid().optional(),
          transactionType: z
            .enum([
              "success_fee_upfront",
              "success_fee_final",
              "background_check",
              "background_check_shared",
              "id_verification",
              "credit_deposit",
              "credit_refund",
            ])
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      const startDate = input?.startDate
        ? new Date(input.startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();

      let query = supabaseAdmin
        .schema("core")
        .from("payment_transactions")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      if (input?.organizationId) {
        query = query.eq("organization_id", input.organizationId);
      }

      if (input?.transactionType) {
        query = query.eq("transaction_type", input.transactionType);
      }

      const { data: transactions, error } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load payment analytics: ${error.message}`,
        });
      }

      const allTransactions = transactions ?? [];

      // Calculate KPIs
      const totalRevenue = allTransactions
        .filter((t) => t.status === "succeeded")
        .reduce((sum, t) => sum + (t.amount_cents ?? 0), 0);

      const totalTransactions = allTransactions.length;
      const succeededTransactions = allTransactions.filter(
        (t) => t.status === "succeeded",
      ).length;
      const failedTransactions = allTransactions.filter(
        (t) => t.status === "failed",
      ).length;
      const pendingTransactions = allTransactions.filter(
        (t) => t.status === "pending",
      ).length;

      const successRate =
        totalTransactions > 0
          ? (succeededTransactions / totalTransactions) * 100
          : 0;

      // Breakdown by transaction type
      const byType = allTransactions.reduce(
        (acc, t) => {
          const type = t.transaction_type ?? "unknown";
          if (!acc[type]) {
            acc[type] = {
              count: 0,
              revenue: 0,
              succeeded: 0,
              failed: 0,
            };
          }
          acc[type].count += 1;
          if (t.status === "succeeded") {
            acc[type].revenue += t.amount_cents ?? 0;
            acc[type].succeeded += 1;
          }
          if (t.status === "failed") {
            acc[type].failed += 1;
          }
          return acc;
        },
        {} as Record<
          string,
          { count: number; revenue: number; succeeded: number; failed: number }
        >,
      );

      // Breakdown by status
      const byStatus = allTransactions.reduce(
        (acc, t) => {
          const status = t.status ?? "unknown";
          acc[status] = (acc[status] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Time series data (daily revenue)
      const dailyRevenue = allTransactions
        .filter((t) => t.status === "succeeded")
        .reduce(
          (acc, t) => {
            const date = new Date(t.created_at).toISOString().split("T")[0]!;
            acc[date] = (acc[date] ?? 0) + (t.amount_cents ?? 0);
            return acc;
          },
          {} as Record<string, number>,
        );

      // Failed transactions queue
      const failedQueue = allTransactions
        .filter((t) => t.status === "failed")
        .map((t) => ({
          id: t.id,
          transactionType: t.transaction_type,
          amountCents: t.amount_cents,
          failureReason: t.failure_reason,
          createdAt: t.created_at,
          failedAt: t.failed_at,
          organizationId: t.organization_id,
          userId: t.user_id,
        }))
        .sort(
          (a, b) =>
            new Date(b.failed_at ?? b.created_at).getTime() -
            new Date(a.failed_at ?? a.created_at).getTime(),
        );

      return {
        kpis: {
          totalRevenue,
          totalTransactions,
          succeededTransactions,
          failedTransactions,
          pendingTransactions,
          successRate: Math.round(successRate * 100) / 100,
        },
        breakdowns: {
          byType,
          byStatus,
        },
        timeSeries: {
          dailyRevenue,
        },
        failedQueue,
      };
    }),

  /**
   * Admin: List payment transactions with filters
   */
  adminListTransactions: officeProcedure
    .input(
      z
        .object({
          limit: z.number().int().positive().max(500).default(100),
          offset: z.number().int().nonnegative().default(0),
          status: z
            .enum(["pending", "succeeded", "failed", "refunded", "cancelled"])
            .optional(),
          transactionType: z
            .enum([
              "success_fee_upfront",
              "success_fee_final",
              "background_check",
              "background_check_shared",
              "id_verification",
              "credit_deposit",
              "credit_refund",
            ])
            .optional(),
          organizationId: z.string().uuid().optional(),
          startDate: z.string().datetime().optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const { supabaseAdmin } = ctx;

      let query = supabaseAdmin
        .schema("core")
        .from("payment_transactions")
        .select(
          `
          *,
          organization:organizations(id, name),
          user:users(id, display_name, email)
        `,
        )
        .order("created_at", { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 100) - 1);

      if (input?.status) {
        query = query.eq("status", input.status);
      }

      if (input?.transactionType) {
        query = query.eq("transaction_type", input.transactionType);
      }

      if (input?.organizationId) {
        query = query.eq("organization_id", input.organizationId);
      }

      if (input?.startDate) {
        query = query.gte("created_at", input.startDate);
      }

      if (input?.endDate) {
        query = query.lte("created_at", input.endDate);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to load transactions: ${error.message}`,
        });
      }

      return {
        items: (data ?? []).map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          organizationName:
            (row.organization as { name?: string } | null)?.name ?? null,
          userId: row.user_id,
          userName:
            (row.user as { display_name?: string; email?: string } | null)
              ?.display_name ??
            (row.user as { display_name?: string; email?: string } | null)
              ?.email ??
            null,
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
        })),
        totalCount: count ?? 0,
      };
    }),
});


