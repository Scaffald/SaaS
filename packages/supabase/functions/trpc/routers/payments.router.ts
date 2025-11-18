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
});


