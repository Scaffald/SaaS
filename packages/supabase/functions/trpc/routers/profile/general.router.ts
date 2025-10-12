import { TRPCError } from "@trpc/server";
import { protectedProcedure, t } from "../../middleware.ts";
import {
  profileGeneralInputSchema,
  type ProfileUpdate,
  type UserPrivateUpdate,
  // @ts-ignore - Deno requires .ts extension
} from "../../../_shared/schemas/consolidated.ts";

/**
 * Profile General router - handles basic profile information
 */
export const profileGeneralRouter = t.router({
  /**
   * Get general profile information
   * Returns user's basic profile data including name, email, phone, about, and address
   */
  getGeneral: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user, userToken } = ctx;

    // Get auth user data for email using the token explicitly
    const { data: authUser, error: authError } = await supabase.auth.getUser(
      userToken,
    );

    if (authError) {
      console.error("Error fetching auth user:", authError.message);
    }

    // Get profile data from users table (includes about)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, avatar_path, about")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch profile: ${profileError.message}`,
      });
    }

    // Get address from private.profile table
    const { data: privateData, error: privateError } = await supabase
      .schema("private")
      .from("profile")
      .select("address")
      .eq("user_id", user.id)
      .single();

    if (privateError && privateError.code !== "PGRST116") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to fetch private data: ${privateError.message}`,
      });
    }

    console.log("Auth user email:", authUser?.user?.email);

    return {
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      avatar_path: profile?.avatar_path || "",
      email: authUser?.user?.email || "",
      phone: authUser?.user?.phone || "",
      about: profile?.about || "",
      address: privateData?.address || null,
    };
  }),

  /**
   * Update general profile information
   * Updates user's basic profile data in users and private.profile tables
   */
  updateGeneral: protectedProcedure
    .input(profileGeneralInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;

      // Note: Email and phone updates are not supported
      // These fields are read-only and come from the auth system

      // Build profile update object with only provided fields
      const profileUpdate: ProfileUpdate & { about?: string } = {
        id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (input.first_name !== undefined) {
        profileUpdate.first_name = input.first_name;
      }
      if (input.last_name !== undefined) {
        profileUpdate.last_name = input.last_name;
      }
      if (input.avatar_path !== undefined) {
        profileUpdate.avatar_path = input.avatar_path;
      }
      if (input.about !== undefined) {
        profileUpdate.about = input.about;
      }

      // Update users table only if there are fields to update
      if (Object.keys(profileUpdate).length > 2) {
        // More than just id and updated_at
        const { error: profileError } = await supabase.from("users").upsert(
          profileUpdate,
        );

        if (profileError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update profile: ${profileError.message}`,
          });
        }
      }

      // Build private.profile update object with only provided fields (just address)
      const privateUpdate: UserPrivateUpdate & {
        address?: Record<string, unknown>;
      } = {
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      if (input.address !== undefined) {
        privateUpdate.address = input.address === null
          ? undefined
          : input.address;
      }

      // Update private.profile table only if there are fields to update
      if (Object.keys(privateUpdate).length > 2) {
        // More than just user_id and updated_at
        const { error: privateError } = await supabase
          .schema("private")
          .from("profile")
          .upsert(privateUpdate);

        if (privateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Failed to update private data: ${privateError.message}`,
          });
        }
      }

      return { success: true };
    }),
});
