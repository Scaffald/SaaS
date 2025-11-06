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
      .schema("core")
      .from("role_assignments")
      .select("role:roles(name)")
      .eq("user_id", ctx.user.id);

    console.log("[auth.getUserRoles] Query result:", {
      data,
      error: error?.message,
      dataLength: data?.length,
    });

    const roles = (data as Array<{ role: { name: string } | null }> | null)
      ?.map((r) => {
        console.log("[auth.getUserRoles] Processing role item:", r);
        return r.role?.name;
      })
      .filter((name): name is string => Boolean(name)) ?? [];

    console.log("[auth.getUserRoles] Final roles:", roles);

    return { roles };
  }),
});
