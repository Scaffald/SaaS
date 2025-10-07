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
    console.log("[auth.getUserRoles] Fetching roles for user:", ctx.user.id);
    
    const { data, error } = await ctx.supabase
      .from("role_assignments")
      .select("role:roles(name)")
      .eq("user_id", ctx.user.id);

    console.log("[auth.getUserRoles] Query result:", {
      data,
      error: error?.message,
      dataLength: data?.length,
    });

    const roles = data?.map((r: { role?: { name?: string } | null }) => {
      console.log("[auth.getUserRoles] Processing role item:", r);
      return r.role?.name;
    }).filter(Boolean) ?? [];

    console.log("[auth.getUserRoles] Final roles:", roles);

    return { roles };
  }),
});
