import { TRPCError } from "@trpc/server";

import { protectedProcedure, t } from "../middleware.ts";

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
});


