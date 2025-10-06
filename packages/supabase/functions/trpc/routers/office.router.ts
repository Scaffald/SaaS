import { TRPCError } from "@trpc/server";
import { superAdminProcedure, t } from "../middleware.ts";

/**
 * Office router - super admin only operations
 */
export const officeRouter = t.router({
  /**
   * List all users
   * Returns paginated list of users with basic profile info
   */
  listUsers: superAdminProcedure.query(async ({ ctx }) => {
    const { data, error, count } = await ctx.supabase
      .from("profiles")
      .select(
        "id, first_name, last_name, avatar_path, created_at, updated_at",
        {
          count: "exact",
        },
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    return { users: data ?? [], total: count ?? 0 };
  }),

  /**
   * Get user details
   * TODO: Implement with proper input schema
   */
  getUser: superAdminProcedure.query(async ({ ctx }) => {
    const _res = await ctx.supabase;
    // For now, return mock data - will be implemented with proper input schema
    return { profile: null, privateData: null };
  }),

  /**
   * Update user
   * TODO: Implement with proper input schema
   */
  updateUser: superAdminProcedure.mutation(async ({ ctx }) => {
    const _res = await ctx.supabase;
    // For now, return success - will be implemented with proper input schema
    return { success: true };
  }),
});
