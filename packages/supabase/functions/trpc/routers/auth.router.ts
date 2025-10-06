import { protectedProcedure, t } from "../middleware.ts";

/**
 * Auth router - handles authentication-related operations
 */
export const authRouter = t.router({
  /**
   * Get user roles
   * Returns list of roles assigned to the authenticated user
   */
  getUserRoles: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("role_assignments")
      .select("role:roles(name)")
      .eq("user_id", ctx.user.id);

    const roles = data?.map((r: { role?: { name?: string } | null }) =>
      r.role?.name
    ).filter(Boolean) ?? [];

    return { roles };
  }),
});
