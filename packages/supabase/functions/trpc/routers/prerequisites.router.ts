import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, t } from "../middleware.ts";

/**
 * Prerequisites input schema
 * Matches the client-side schema for form validation
 */
const prerequisitesInputSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  user_types: z.array(z.enum(["worker", "employer", "customer"])).min(1),
  industry_id: z.string().min(1),
});

/**
 * Prerequisites router - handles user onboarding prerequisites
 */
export const prerequisitesRouter = t.router({
  /**
   * Check prerequisites completion status
   * Returns whether all required fields are filled
   */
  check: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;

    // Get profile data (first_name, last_name)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch profile: ${profileError.message}`,
      });
    }

    // Get private data (address)
    const { data: privateData, error: privateError } = await supabase
      .from("user_private")
      .select("address")
      .eq("user_id", user.id)
      .single();

    if (privateError && privateError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch private data: ${privateError.message}`,
      });
    }

    // Get public user data (industry_id)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("industry_id")
      .eq("id", user.id)
      .single();

    if (userError && userError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch user data: ${userError.message}`,
      });
    }

    // Get preferences (user_types, prerequisites_completed_at)
    const { data: preferences, error: prefsError } = await supabase
      .from("user_preferences")
      .select("user_types, prerequisites_completed_at")
      .eq("user_id", user.id)
      .single();

    if (prefsError && prefsError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch preferences: ${prefsError.message}`,
      });
    }

    // Check if all required fields are present
    const hasName = profile?.first_name && profile?.last_name;
    const hasAddress = privateData?.address?.street &&
      privateData?.address?.city &&
      privateData?.address?.state &&
      privateData?.address?.zip;
    const hasUserTypes = preferences?.user_types &&
      preferences.user_types.length > 0;
    const hasIndustry = userData?.industry_id;

    const isComplete = hasName && hasAddress && hasUserTypes && hasIndustry;

    return {
      isComplete: !!isComplete,
      hasName: !!hasName,
      hasAddress: !!hasAddress,
      hasUserTypes: !!hasUserTypes,
      hasIndustry: !!hasIndustry,
      completedAt: preferences?.prerequisites_completed_at || null,
      data: {
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        address: privateData?.address || null,
        user_types: preferences?.user_types || [],
        industry_id: userData?.industry_id || "",
      },
    };
  }),

  /**
   * Complete prerequisites
   * Updates all required fields atomically
   */
  complete: protectedProcedure
    .input(prerequisitesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // 1. Update profiles table (first_name, last_name)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: input.first_name,
        last_name: input.last_name,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update profile: ${profileError.message}`,
        });
      }

      // 2. Update user_private table (address)
      const { error: privateError } = await supabase.from("user_private")
        .upsert({
          user_id: user.id,
          address: input.address,
          updated_at: new Date().toISOString(),
        });

      if (privateError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update private data: ${privateError.message}`,
        });
      }

      // 3. Update users table (industry_id)
      // Note: User row already exists from auth trigger, so we UPDATE not INSERT
      const { error: userError } = await supabase
        .from("users")
        .update({
          industry_id: input.industry_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (userError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update user data: ${userError.message}`,
        });
      }

      // 4. Update user_preferences table (user_types, prerequisites_completed_at)
      const { error: prefsError } = await supabase.from("user_preferences")
        .upsert({
          user_id: user.id,
          user_types: input.user_types,
          prerequisites_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (prefsError) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to update preferences: ${prefsError.message}`,
        });
      }

      return { success: true };
    }),
});
